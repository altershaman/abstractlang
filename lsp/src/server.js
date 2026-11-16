import {watch} from 'node:fs';
import {createHash} from 'node:crypto';
import {createConnection,TextDocuments,TextDocumentSyncKind} from 'vscode-languageserver/node';
import {TextDocument} from 'vscode-languageserver-textdocument';
import {createLanguageService,fileResolver,semanticTokens,semanticTokenLegend,hoverContent,rootInterpretations} from '@abstractlang/service';
const range=r=>({start:{line:r.start.line,character:r.start.character},end:{line:r.end.line,character:r.end.character}});
const location=l=>({uri:l.uri,range:range(l.range)});

export function startContextLanguageServer({input=process.stdin,output=process.stdout,version='1.0.0',createService=createLanguageService,watchPattern=/\.abstract$/i}={}){
  const connection=createConnection(input,output),documents=new TextDocuments(TextDocument),watchers=new Map();
  let workspace=adapt(createService()),published=new Set(),timer,semanticRefresh=false,markdownHover=false,versionedEdits=false,lensRefresh=false,showDocument=false,hintRefresh=false;
  function adapt(service){return {notes:new Map(),attributions:()=>[],...service};}
  function refresh(){
    clearTimeout(timer);
    const snapshots=new Map(documents.all().map(d=>[d.uri,d.getText()]));
    workspace=adapt(createService(snapshots,{languageIds:new Map(documents.all().map(d=>[d.uri,d.languageId])),resolveFile:fileResolver(snapshots)}));
    for(const uri of new Set([...published,...workspace.diagnostics.keys()]))connection.sendDiagnostics({uri,...(documents.get(uri)?{version:documents.get(uri).version}:{}),diagnostics:(workspace.diagnostics.get(uri)||[]).map(d=>({range:range(d.range),severity:d.severity==='error'?1:2,code:d.code,source:'abstract',message:d.message,...(d.relatedInformation?.length?{relatedInformation:d.relatedInformation.map(r=>({...r,location:location(r.location)}))}:{})}))});
    published=new Set(workspace.diagnostics.keys());
    if(hintRefresh)connection.sendRequest('workspace/inlayHint/refresh').catch(()=>{});
    if(lensRefresh)connection.sendRequest('workspace/codeLens/refresh').catch(()=>{});
    if(semanticRefresh)connection.sendRequest('workspace/semanticTokens/refresh').catch(()=>{});
    for(const [directory,watcher] of watchers)if(!workspace.directories.has(directory)){watcher.close();watchers.delete(directory);}
    for(const directory of workspace.directories)if(!watchers.has(directory))try{
      const watcher=watch(directory.startsWith('file:')?new URL(directory):directory,{persistent:false},(_event,name)=>{if(!name||watchPattern.test(String(name))) {clearTimeout(timer);timer=setTimeout(refresh,100);}});
      watcher.on('error',()=>{watcher.close();watchers.delete(directory);});watchers.set(directory,watcher);
    }catch{}
  }
  const itemFor=p=>workspace.at(p.textDocument.uri,p.position);
  connection.onInitialize(params=>{hintRefresh=!!params.capabilities?.workspace?.inlayHint?.refreshSupport;lensRefresh=!!params.capabilities?.workspace?.codeLens?.refreshSupport;showDocument=!!params.capabilities?.window?.showDocument?.support;versionedEdits=!!params.capabilities?.workspace?.workspaceEdit?.documentChanges;markdownHover=params.capabilities?.textDocument?.hover?.contentFormat?.find(format=>['markdown','plaintext'].includes(format))==='markdown';semanticRefresh=!!params.capabilities?.workspace?.semanticTokens?.refreshSupport;return {capabilities:{positionEncoding:'utf-16',textDocumentSync:TextDocumentSyncKind.Incremental,hoverProvider:true,definitionProvider:true,referencesProvider:true,documentHighlightProvider:true,
    inlayHintProvider:{resolveProvider:false},codeLensProvider:{resolveProvider:false},executeCommandProvider:{commands:['abstract.openSameAs','abstract.openHint']},codeActionProvider:{codeActionKinds:['refactor.rewrite']},
    completionProvider:{triggerCharacters:[':', '(', '.']},semanticTokensProvider:{legend:semanticTokenLegend,full:true}},serverInfo:{name:'abstractlang-contextual',version}};});
  documents.onDidChangeContent(refresh);documents.onDidSave(refresh);
  documents.onDidClose(e=>{connection.sendDiagnostics({uri:e.document.uri,diagnostics:[]});refresh();});
  connection.onDidChangeWatchedFiles(refresh);
  connection.onHover(p=>{
    const item=itemFor(p),summary=workspace.hierarchy?.(p.textDocument.uri,p.position);if(!item&&!summary)return null;
    return {range:range(summary?.range||item.range),contents:{kind:markdownHover?'markdown':'plaintext',value:hoverContent(summary?.kind==='relation'?'':item?workspace.hover(item):'',summary,{markdown:markdownHover})}};
  });
  connection.onDefinition(p=>{const item=itemFor(p);return item?workspace.locations(item,{definitions:true}).map(location):[];});
  connection.onReferences(p=>{const item=itemFor(p);return item?workspace.locations(item,{includeDeclaration:p.context?.includeDeclaration!==false}).map(location):[];});
  connection.onDocumentHighlight(p=>(workspace.highlights?.(p.textDocument.uri,p.position)||[]).map(r=>({range:range(r),kind:1})));
  connection.onCompletion(p=>{
    const uri=p.textDocument.uri;
    const proposals=workspace.completions?.(uri,p.position)||[];
    if(proposals.length)return proposals.map(c=>({label:c.label,kind:c.kind==='term'?1:18,sortText:c.sortText,filterText:c.filterText,detail:c.detail,
      textEdit:{range:range(c.range),newText:c.insertText},documentation:c.locations.map(l=>l.uri+':'+(l.range.start.line+1)).join('\n')}));
    // Markdown reference completion stays in the scenario host.
    const graph=workspace.graphs.get(workspace.notes.get(uri)?.abstractUri);if(!graph)return [];
    const prefix=(documents.get(uri)?.getText().split('\n')[p.position.line]||'').slice(0,p.position.character);
    const selected=/[([]([\p{L}\p{N}_-][\p{L}\p{N}\p{M}_-]*):([^()[\]]*)$/u.exec(prefix);if(!selected)return [];
    return graph.terms.filter(t=>t.word===selected[1]&&!['GLOBAL','DEFAULT'].includes(t.contextId)).map(t=>({label:t.reference,kind:18,textEdit:{range:{start:{line:p.position.line,character:prefix.lastIndexOf(':')+1},end:p.position},newText:t.reference.slice(t.reference.indexOf(':')+1)}}));
  });
  connection.languages.inlayHint.on(p=>(workspace.sameAsHints?.(p.textDocument.uri,p.range)||[]).map(h=>({...h,
    position:{line:h.position.line,character:h.position.character},label:h.label.map(part=>({...part,...(part.location?{location:location(part.location),command:{title:'Go to source',command:'abstract.openHint',arguments:[{uri:p.textDocument.uri,position:{line:h.position.line,character:h.position.character},target:location(part.location)}]}}:{})}))})));
  connection.onCodeLens(p=>(workspace.sameAsLenses?.(p.textDocument.uri)||[]).map(l=>({range:range(l.range),command:{title:l.title,command:'abstract.openSameAs',arguments:[{uri:p.textDocument.uri,offset:l.range.start.offset,reference:l.reference}]}})));
  connection.onExecuteCommand(async p=>{
    if(p.command==='abstract.openHint'){
      const arg=p.arguments?.[0];if(!arg||typeof arg.uri!=='string'||!arg.position||!arg.target)return null;
      const part=(workspace.sameAsHints?.(arg.uri)||[]).filter(h=>h.position.line===arg.position.line&&h.position.character===arg.position.character)
        .flatMap(h=>h.label).find(part=>part.location&&JSON.stringify(location(part.location))===JSON.stringify(arg.target));
      if(!part)return null;
      if(showDocument)return connection.sendRequest('window/showDocument',{uri:part.location.uri,takeFocus:true,selection:range(part.location.range)});
      connection.sendNotification('window/showMessage',{type:3,message:'Source: '+part.location.uri+':'+(part.location.range.start.line+1)});return null;
    }
    if(p.command!=='abstract.openSameAs')return null;
    const arg=p.arguments?.[0];if(!arg||typeof arg.uri!=='string')return null;
    const lens=(workspace.sameAsLenses?.(arg.uri)||[]).find(l=>l.range.start.offset===arg.offset&&l.reference===arg.reference);
    if(!lens)return null;
    if(showDocument)return connection.sendRequest('window/showDocument',{uri:lens.location.uri,takeFocus:true,selection:range(lens.location.range)});
    connection.sendNotification('window/showMessage',{type:3,message:lens.title+' · '+lens.location.uri+':'+(lens.location.range.start.line+1)});return null;
  });
  connection.onCodeAction(p=>{
    if(p.context?.only?.length&&!p.context.only.some(kind=>'refactor.rewrite'===kind||'refactor.rewrite'.startsWith(kind+'.')))return [];
    const uri=p.textDocument.uri,open=documents.get(uri);if(!open)return [];
    return (workspace.detachmentActions?.(uri,p.range.start)||[]).map(proposal=>({title:proposal.title,kind:'refactor.rewrite',
      edit:versionedEdits?{documentChanges:[{textDocument:{uri,version:open.version},edits:[{range:range(proposal.edit.range),newText:proposal.edit.newText}]}]}:{changes:{[uri]:[{range:range(proposal.edit.range),newText:proposal.edit.newText}]}}}));
  });
  connection.onRequest('abstract/hierarchy',p=>workspace.hierarchy?.(p.uri,p.position)||null);
  connection.languages.semanticTokens.on(p=>{
    const uri=p.textDocument.uri,note=workspace.notes.get(uri),data=[];let line=0,character=0;
    const sourceGraph=workspace.graphFor?.(uri)||workspace.graphs.get(uri)||[...workspace.graphs.values()].find(g=>g.documents.some(d=>d.uri===uri));
    const sourceDocument=sourceGraph?.documents.find(d=>d.uri===uri);
    const tokens=note?(note.mentions||[]).map(m=>({range:m.range,type:'term',modifiers:m.explicit?['reference']:[]})):(sourceDocument?semanticTokens(sourceDocument.document,{graph:sourceGraph}):[]);
    const unique=[...new Map(tokens.map(t=>[[t.range.start.line,t.range.start.character,t.range.end.character].join(':'),t])).values()].sort((a,b)=>a.range.start.offset-b.range.start.offset);
    for(const token of unique){const start=token.range.start,end=token.range.end;if(start.line!==end.line)continue;
      const modifiers=token.modifiers.reduce((bits,m)=>bits|(1<<semanticTokenLegend.tokenModifiers.indexOf(m)),0);
      data.push(start.line-line,start.line===line?start.character-character:start.character,end.character-start.character,semanticTokenLegend.tokenTypes.indexOf(token.type),modifiers);line=start.line;character=start.character;
    }return {data};
  });
  connection.onRequest('abstract/graph',params=>{const graph=workspace.graphFor?.(params.uri)||workspace.graphs.get(params.uri);if(!graph)return null;const {documents:_,resolveReference:__,...serializable}=graph;return {...serializable,attributions:workspace.attributions(params.uri)};});
  // Read-only view data for preview clients; interpretation stays in this server.
  connection.onRequest('abstract/preview',params=>{
    const uri=params.uri,note=workspace.notes.get(uri),open=documents.get(uri);
    const graph=workspace.graphFor?.(uri)||workspace.graphs.get(uri)||workspace.graphs.get(note?.abstractUri)||[...workspace.graphs.values()].find(g=>g.documents.some(d=>d.uri===uri));
    const sourceDocument=[...workspace.graphs.values()].flatMap(g=>g.documents).find(d=>d.uri===uri);
    const source=note?.source??sourceDocument?.document.source??open?.getText();
    if(source===undefined)return null;
    const allGraphs=rootInterpretations(workspace.graphs);
    const occurrences=allGraphs.flatMap(g=>g.occurrences).filter(o=>o.uri===uri);
    const items=new Map();
    for(const g of allGraphs)for(const d of g.documents)items.set(d.uri,{uri:d.uri,languageId:'abstract'});
    for(const n of workspace.notes.values())items.set(n.uri,{uri:n.uri,languageId:'markdown'});
    items.set(uri,{uri,languageId:note||/\.(md|markdown)$/i.test(uri)?'markdown':'abstract'});
    return {uri,source,languageId:items.get(uri).languageId,abstractUri:note?.abstractUri??graph?.uri,
      attributions:note?.attributions??[],
      mentions:note?.mentions??occurrences.map(o=>({...o,termIds:[o.termId]})),
      diagnostics:[...(workspace.diagnostics.get(uri)||[]).map(d=>({...d,uri})),...(graph?.diagnostics||[]).filter(d=>d.uri!==uri)],documents:[...items.values()],
      version:createHash('sha256').update(JSON.stringify([allGraphs.flatMap(g=>g.documents.map(d=>[d.uri,d.document.source])),[...workspace.notes.values()].map(n=>[n.uri,n.source])])).digest('hex')};
  });
  const cleanup=()=>{clearTimeout(timer);for(const watcher of watchers.values())watcher.close();};
  connection.onShutdown(cleanup);connection.onExit(cleanup);
  documents.listen(connection);connection.listen();return connection;
}
