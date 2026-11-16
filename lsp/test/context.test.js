import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {TextDocument} from 'vscode-languageserver-textdocument';
const binary=fileURLToPath(new URL('../bin/abstract-lsp.js',import.meta.url));

async function client(t,{documentChanges=true,standard=true,markdown=false,showDocument=false}={}){
  const child=spawn(process.execPath,[binary,'--stdio'],{stdio:['pipe','pipe','pipe']});
  let buffer=Buffer.alloc(0),nextId=0,stderr='',exited=false;
  const pending=new Map(),notifications=[],waiters=[],serverRequests=[];
  child.stderr.on('data',chunk=>stderr+=chunk.toString());
  const exit=new Promise(resolve=>child.once('exit',(code,signal)=>{exited=true;resolve({code,signal});
    for(const request of pending.values())request.reject(new Error('Server exited: '+stderr));
  }));
  child.on('error',error=>{for(const request of pending.values())request.reject(error);});
  child.stdout.on('data',chunk=>{
    buffer=Buffer.concat([buffer,chunk]);
    while(true){
      const headerEnd=buffer.indexOf('\r\n\r\n');if(headerEnd<0)return;
      const match=/Content-Length:\s*(\d+)/i.exec(buffer.subarray(0,headerEnd).toString());
      assert(match,'stdout must contain only LSP frames');
      const length=Number(match[1]);if(buffer.length<headerEnd+4+length)return;
      const value=JSON.parse(buffer.subarray(headerEnd+4,headerEnd+4+length).toString('utf8'));buffer=buffer.subarray(headerEnd+4+length);
      if(value.id!==undefined&&value.method){serverRequests.push(value);send({jsonrpc:'2.0',id:value.id,result:{success:true}});}
      else if(value.id!==undefined){
        const request=pending.get(value.id);if(request){pending.delete(value.id);clearTimeout(request.timer);value.error?request.reject(Object.assign(new Error(value.error.message),{response:value.error})):request.resolve(value.result);}
      }else{
        notifications.push(value);
        for(const waiter of [...waiters])if(waiter.matches(value)){clearTimeout(waiter.timer);waiters.splice(waiters.indexOf(waiter),1);waiter.resolve(value);}
      }
    }
  });
  function send(value){const payload=JSON.stringify(value);child.stdin.write('Content-Length: '+Buffer.byteLength(payload)+'\r\n\r\n'+payload);}
  const notify=(method,params)=>send({jsonrpc:'2.0',method,params});
  function request(method,params){
    const id=++nextId;return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Timeout: '+method+' '+stderr));},5000);
      pending.set(id,{resolve,reject,timer});send({jsonrpc:'2.0',id,method,params});
    });
  }
  function diagnostics(uri,version){
    const matches=value=>value.method==='textDocument/publishDiagnostics'&&value.params.uri===uri&&(version===null?value.params.version===undefined:value.params.version===version);
    const existing=notifications.find(matches);if(existing)return Promise.resolve(existing.params.diagnostics);
    return new Promise((resolve,reject)=>{const waiter={matches,resolve:value=>resolve(value.params.diagnostics)};
      waiter.timer=setTimeout(()=>{waiters.splice(waiters.indexOf(waiter),1);reject(new Error('Diagnostics timeout '+stderr));},5000);waiters.push(waiter);
    });
  }
  t.after(async()=>{
    let clean=false;
    if(!exited){try{await request('shutdown',null);clean=true;notify('exit');child.stdin.end();}catch{child.kill();}}
    const timer=setTimeout(()=>child.kill(),1000);const result=await exit;clearTimeout(timer);
    if(clean)assert.equal(result.code,0,stderr);
    for(const waiter of waiters)clearTimeout(waiter.timer);
    for(const value of pending.values())clearTimeout(value.timer);
  });
  const initialized=await request('initialize',{processId:null,capabilities:{workspace:{workspaceEdit:{documentChanges}},...(markdown?{textDocument:{hover:{contentFormat:['markdown','plaintext']}}}:{}),...(showDocument?{window:{showDocument:{support:true}}}:{})},rootUri:null});
  notify('initialized',{});
  const open=(uri,text,version=1)=>notify('textDocument/didOpen',{textDocument:{uri,languageId:uri.endsWith('.md')?'markdown':'abstract',version,text}});
  const change=(uri,contentChanges,version)=>notify('textDocument/didChange',{textDocument:{uri,version},contentChanges});
  return {request,notify,diagnostics,open,change,initialized,notifications,serverRequests};
}
function at(uri,line,character){return {textDocument:{uri},position:{line,character}};}
function apply(source,edits){return TextDocument.applyEdits(TextDocument.create('file:///edit.abstract','abstract',1,source),edits);}


test('LSP supports untitled Abstract documents and current identity-sugar hover',async t=>{
  const c=await client(t),uri='untitled:Untitled-1';assert.equal(c.initialized.serverInfo.version,'1.0.0');
  c.open(uri,'a.b::c.d\nx.y::g.h\n(a:c.d).(x:g.h)::part.whole');
  assert.deepEqual(await c.diagnostics(uri,1),[]);
  const hover=await c.request('textDocument/hover',at(uri,2,1));assert.match(hover.contents.value,/a:c.d/);
  const graph=await c.request('abstract/graph',{uri});assert.equal(graph.identities.length,2);
  const a=graph.terms.find(t=>t.reference==='a:c.d'),local=graph.terms.find(t=>t.reference==='a:part.whole');assert.equal(a.conceptId,local.conceptId);
  const tokens=await c.request('textDocument/semanticTokens/full',{textDocument:{uri}});assert(tokens.data.length>0);
  c.change(uri,[{text:'a.b::'}],2);assert((await c.diagnostics(uri,2)).some(d=>d.severity===1));
});

test('standard LSP analyzes Abstract without discovering Markdown and supports unsaved imports',async t=>{
  const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs');
  const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {pathToFileURL}=await import('node:url');
  const directory=mkdtempSync(join(tmpdir(),'abstract-standard-lsp-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));
  const uri=pathToFileURL(join(directory,'main.abstract')).href,note=pathToFileURL(join(directory,'note.md')).href;
  const source='a.b::c.d';writeFileSync(join(directory,'main.abstract'),source);
  writeFileSync(join(directory,'note.md'),'---\nabstract: ./main.abstract\n---\n[Markdown title](a:>title)');
  const c=await client(t,{standard:true});c.open(uri,source);
  assert.deepEqual(await c.diagnostics(uri,1),[]);
  assert.match((await c.request('textDocument/hover',at(uri,0,0))).contents.value,/a:c.d/);
  const refs=await c.request('textDocument/references',{...at(uri,0,0),context:{includeDeclaration:true}});assert(refs.length);assert(refs.every(r=>r.uri===uri));
  const defs=await c.request('textDocument/definition',at(uri,0,0));assert.equal(defs[0].uri,uri);
  const graph=await c.request('abstract/graph',{uri});assert.deepEqual(graph.attributions,[]);
  c.open(note,'---\nabstract: ./main.abstract\n---\n[Markdown title](a:>title)');
  assert.equal(await c.request('textDocument/hover',at(note,3,3)),null);
  assert.deepEqual((await c.request('textDocument/semanticTokens/full',{textDocument:{uri:note}})).data,[]);
  assert(!(await c.request('abstract/preview',{uri})).documents.some(d=>d.uri===note));
  c.change(uri,[{text:'a.b::'}],2);assert((await c.diagnostics(uri,2)).some(d=>d.severity===1));
  c.change(uri,[{text:source}],3);assert.deepEqual(await c.diagnostics(uri,3),[]);
  const imported=pathToFileURL(join(directory,'parts.abstract')).href;
  c.open(imported,'x.y::c.d');
  c.change(uri,[{text:"@parts.path:'parts.abstract'\na.b::c.d"}],4);
  assert.deepEqual(await c.diagnostics(uri,4),[]);
  assert((await c.request('abstract/graph',{uri})).terms.some(t=>t.word==='x'));

});


test('standard LSP publish contradiction warnings and clear them after correction',async t=>{
 for(const standard of [true]){
  const c=await client(t,{standard}),uri='untitled:collision-test';
  c.open(uri,'a.b::c.d\na.b!c.d');
  const warnings=(await c.diagnostics(uri,1)).filter(d=>d.code==='contradiction');
  assert.equal(warnings.length,2);assert(warnings.every(d=>d.severity===2));
  assert.equal(warnings[0].relatedInformation[0].location.range.start.line,1);
  c.change(uri,[{text:'a.b::c.d'}],2);assert.deepEqual(await c.diagnostics(uri,2),[]);
  c.change(uri,[{text:'a.b::c.d\na.b::d.c'}],3);
  assert.equal((await c.diagnostics(uri,3)).filter(d=>d.code==='entanglement').length,2);
 }
});


test('standard semantic-token legend and encoded ranges distinguish written roles and operators',async t=>{
 const c=await client(t,{standard:true}),uri='untitled:semantic-tokens';
 const legend=c.initialized.capabilities.semanticTokensProvider.legend;
 assert.deepEqual(legend.tokenTypes,['term','dot','doubleColon','bang','colon','comment']);
 assert.deepEqual(legend.tokenModifiers,['concretization','abstraction','reference','rootAbstraction']);
 const source='a.b::c.d::e.f\n(a:c.d)!. // a.b::c.d';c.open(uri,source);
 const response=await c.request('textDocument/semanticTokens/full',{textDocument:{uri}});
 let line=0,character=0;const decoded=[];
 for(let i=0;i<response.data.length;i+=5){
  const [dl,dc,length,type,bits]=response.data.slice(i,i+5);line+=dl;character=dl?dc:character+dc;
  decoded.push({text:source.split('\n')[line].slice(character,character+length),line,type:legend.tokenTypes[type],modifiers:legend.tokenModifiers.filter((_,i)=>bits&(1<<i))});
 }
 assert.deepEqual(decoded.find(t=>t.text==='c').modifiers,['concretization','abstraction']);
 assert(decoded.find(t=>t.text==='e').modifiers.includes('rootAbstraction'));
 assert(decoded.some(t=>t.type==='colon'));assert(decoded.some(t=>t.type==='bang'));
 assert(decoded.filter(t=>t.line===1).every(t=>t.text!=='::'));
 c.change(uri,[{text:'a.b!c.d'}],2);
 const changed=await c.request('textDocument/semanticTokens/full',{textDocument:{uri}});
 assert.equal(changed.data.length/5,7);assert.equal(legend.tokenTypes[changed.data[3*5+3]],'bang');
});


test('document highlights respect identity, ignore comments and refresh after edits in both hosts',async t=>{
 for(const standard of [true]){
  const c=await client(t,{standard}),uri='untitled:identity-highlights';
  assert.equal(c.initialized.capabilities.documentHighlightProvider,true);
  const source='engine.car::part.whole\nmotor.vehicle::unit.machine\n(engine:part.whole).(motor:unit.machine)::.\n// engine motor part';
  c.open(uri,source);
  const highlights=await c.request('textDocument/documentHighlight',at(uri,0,1));
  assert.equal(highlights.length,4);assert(highlights.every(h=>h.kind===1&&h.range.start.line<3));
  assert(highlights.some(h=>h.range.start.line===1));
  assert.deepEqual(await c.request('textDocument/documentHighlight',at(uri,3,4)),[]);
  assert.deepEqual((await c.request('textDocument/documentHighlight',at(uri,0,6))).map(h=>h.range),[{start:{line:0,character:0},end:{line:0,character:10}}]);
  const contexts=await c.request('textDocument/documentHighlight',at(uri,2,9));assert.equal(contexts.length,2);
  c.change(uri,[{text:'engine.car::part.whole\nmotor.vehicle::unit.machine'}],2);
  const separated=await c.request('textDocument/documentHighlight',at(uri,0,1));assert.equal(separated.length,1);
 }
});


test('dot highlights complete relation matches through LSP, including identity synonyms',async t=>{
 for(const standard of [true]){
  const c=await client(t,{standard}),uri='untitled:relation-highlights';
  c.open(uri,'a.b::c.d\nx.y::e.f\na.x::.\nb.y::.\n// a.b');
  const result=await c.request('textDocument/documentHighlight',at(uri,0,1));
  assert.deepEqual(result.map(h=>h.range),[
   {start:{line:0,character:0},end:{line:0,character:3}},
   {start:{line:1,character:0},end:{line:1,character:3}}]);
  assert.deepEqual(await c.request('textDocument/documentHighlight',at(uri,4,4)),[]);
  assert.deepEqual(await c.request('textDocument/documentHighlight',at(uri,2,5)),[]);
  c.change(uri,[{text:'a.b::c.d\nx.y::e.f'}],2);
  assert.equal((await c.request('textDocument/documentHighlight',at(uri,0,1))).length,1);
 }
});


test('standard host expose structured neighborhoods and linked Markdown hovers',async t=>{
 for(const standard of [true]){
  const c=await client(t,{standard,markdown:true}),uri='file:///tmp/abstract-neighborhood-test.abstract';
  c.open(uri,'a.b::c.d\nx.y::c.d\nc.d::e.f\nu.v::a.b\nz.w!c.d');
  const result=await c.request('abstract/hierarchy',{uri,position:{line:0,character:1}});
  assert.equal(result.kind,'relation');assert.deepEqual(result.parents.map(i=>i.label),['c.d']);
  assert.deepEqual(result.children.map(i=>i.label),['u.v']);assert.deepEqual(result.siblings[0].items.map(i=>i.label),['x.y']);
  const hover=await c.request('textDocument/hover',at(uri,0,1));assert.equal(hover.contents.kind,'markdown');
  assert.match(hover.contents.value,/Children \(direct\)/);assert.match(hover.contents.value,/Siblings under/);
  assert.match(hover.contents.value,/\[u.v\]\(file:\/\/\/tmp\/abstract-neighborhood-test.abstract#L4,1\)/);
  const word=await c.request('textDocument/hover',at(uri,0,0));assert.match(word.contents.value,/a:c.d/);
  assert.equal(await c.request('textDocument/hover',at(uri,0,3)),null);
  c.change(uri,[{text:'a.b::c.d'}],2);
  assert.equal((await c.request('abstract/hierarchy',{uri,position:{line:0,character:1}})).siblings.length,0);
 }
});

test('LSP completion replaces the intended fragment and supplies source information',async t=>{
 const c=await client(t,{standard:true}),uri='untitled:completion-test';
 const base='engine.car::part.whole\nengine.car::unit.machine\n';
 for(const [suffix,expected,replacement] of [['engine.ca','car','car'],['engine.car::pa','part.whole','part.whole'],['(engine:pa','engine:part.whole','part.whole']]){
  c.open(uri,base+suffix);
  const items=await c.request('textDocument/completion',at(uri,2,suffix.length));
  const item=items.find(i=>i.label===expected);assert(item,JSON.stringify(items));
  assert.equal(item.textEdit.newText,replacement);assert.match(item.detail,/untitled:completion-test/);
  assert.equal(item.textEdit.range.end.character,suffix.length);
  c.notify('textDocument/didClose',{textDocument:{uri}});
 }
});


test('contextual detachment actions support both edit formats, stay versioned and replace the removed lens prototype',async t=>{
 for(const standard of [true])for(const documentChanges of [true,false]){
  const c=await client(t,{standard,documentChanges}),uri='untitled:detachment-action',source='a.b::c.d\na.b::e.f';
  assert.equal(c.initialized.capabilities.codeLensProvider.resolveProvider,false);
  assert(!c.initialized.capabilities.executeCommandProvider.commands.includes('abstract.showPairLevel'));
  c.open(uri,source,7);
  const params={textDocument:{uri},range:{start:{line:0,character:0},end:{line:0,character:1}},context:{diagnostics:[]}};
  const actions=await c.request('textDocument/codeAction',params);assert.equal(actions.length,1);
  const action=actions[0];assert.equal(action.title,'Detach contextual term: a:c.d');assert.equal(action.kind,'refactor.rewrite');
  const edits=documentChanges?action.edit.documentChanges[0].edits:action.edit.changes[uri];
  if(documentChanges){assert.equal(action.edit.documentChanges[0].textDocument.version,7);assert.equal(action.edit.documentChanges[0].textDocument.uri,uri);}
  assert.equal((await c.request('abstract/graph',{uri})).detachments.length,0);
  const updated=apply(source,edits);assert(updated.endsWith('(a:c.d)!.\n'));
  c.change(uri,[{text:updated}],8);assert.deepEqual(await c.diagnostics(uri,8),[]);
  const graph=await c.request('abstract/graph',{uri});assert.equal(graph.detachments.length,1);
  assert.notEqual(graph.terms.find(t=>t.reference==='a:c.d').conceptId,graph.terms.find(t=>t.reference==='a:e.f').conceptId);
  assert.deepEqual(await c.request('textDocument/codeAction',params),[]);
  c.change(uri,[{text:source}],9);assert.equal((await c.request('textDocument/codeAction',params)).length,1);
  assert.deepEqual(await c.request('textDocument/codeAction',{...params,context:{diagnostics:[],only:['quickfix']}}),[]);
 }
});


test('same as lenses navigate through standard showDocument and disappear when equality is removed',async t=>{
 for(const standard of [true]){
  const c=await client(t,{standard,showDocument:true}),uri='file:///tmp/same-as-lsp.abstract';
  c.open(uri,'a.b::c.d\nx.y::g.h\n(a:c.d).(x:g.h)::.');
  const lenses=await c.request('textDocument/codeLens',{textDocument:{uri}});
  assert.deepEqual(lenses.map(l=>l.command.title),['same as x:g.h','same as a:c.d']);
  await c.request('workspace/executeCommand',lenses[0].command);
  assert.equal(c.serverRequests[0].method,'window/showDocument');
  assert.equal(c.serverRequests[0].params.uri,uri);assert.equal(c.serverRequests[0].params.selection.start.line,1);
  c.change(uri,[{text:'a.b::c.d\nx.y::g.h'}],2);
  assert.deepEqual(await c.request('textDocument/codeLens',{textDocument:{uri}}),[]);
 }
});


test('same as inlay hints expose inline anchors and source links without editable source text',async t=>{
 for(const standard of [true]){
  const c=await client(t,{standard}),uri='untitled:inlay-test';
  assert.equal(c.initialized.capabilities.inlayHintProvider.resolveProvider,false);
  c.open(uri,'a.b::c.d\nx.y::g.h\n(a:c.d).(x:g.h)::.');
  const hints=await c.request('textDocument/inlayHint',{textDocument:{uri},range:{start:{line:0,character:0},end:{line:3,character:0}}});
  assert.equal(hints.length,2);assert.deepEqual(hints[0].position,{line:0,character:1});
  assert.equal(hints[0].label.map(p=>p.value).join(''),'(x)');
  assert.equal(hints[0].label[1].location.uri,uri);assert.equal(hints[0].label[1].location.range.start.line,1);
  assert(!('offset' in hints[0].position));assert(hints.every(h=>!h.textEdits&&!h.kind));
  const limited=await c.request('textDocument/inlayHint',{textDocument:{uri},range:{start:{line:1,character:0},end:{line:2,character:0}}});
  assert.equal(limited.length,1);assert.equal(limited[0].position.line,1);
  c.change(uri,[{text:'a.b::c.d\nx.y::g.h'}],2);
  assert.deepEqual(await c.request('textDocument/inlayHint',{textDocument:{uri},range:{start:{line:0,character:0},end:{line:3,character:0}}}),[]);
 }
});


test('included-file hints and graph snapshots stay reciprocal after its buffer opens',async t=>{
 for(const standard of [true]){
  const c=await client(t,{standard}),main='file:///tmp/reciprocal-main.abstract',parts='file:///tmp/reciprocal-parts.abstract';
  c.open(parts,'x.y::e.f\n(a:c.d).(x:e.f)::.');
  c.open(main,"@parts.path:'reciprocal-parts.abstract'\na.b::c.d");
  const hints=await c.request('textDocument/inlayHint',{textDocument:{uri:parts},range:{start:{line:0,character:0},end:{line:2,character:0}}});
  assert.equal(hints.length,1);assert.equal(hints[0].label[1].value,'a');
  const graph=await c.request('abstract/graph',{uri:parts});assert.equal(graph.uri,main);
  assert(graph.identities.some(i=>i.resolved));
  const snapshot=await c.request('abstract/preview',{uri:parts});
  assert(!snapshot.diagnostics.some(d=>d.code==='unresolved-context-reference'));
 }
});


test('inlay hint commands navigate to aliases and detachment assertions without source edits',async t=>{
 for(const standard of [true]){
  const c=await client(t,{standard,showDocument:true}),uri='file:///tmp/hint-navigation.abstract';
  c.open(uri,'a.b::c.d\nx.y::g.h\n(a:c.d)!.\n(a:c.d).(x:g.h)::.');
  const hints=await c.request('textDocument/inlayHint',{textDocument:{uri},range:{start:{line:0,character:0},end:{line:4,character:0}}});
  const alias=hints.find(h=>h.position.line===0&&h.label.some(p=>p.value==='x')).label.find(p=>p.value==='x');
  assert.equal(alias.command.command,'abstract.openHint');await c.request('workspace/executeCommand',alias.command);
  assert.equal(c.serverRequests.at(-1).method,'window/showDocument');assert.equal(c.serverRequests.at(-1).params.selection.start.line,1);
  const detached=hints.find(h=>h.label[0].value==='(detached)').label[0];await c.request('workspace/executeCommand',detached.command);
  assert.equal(c.serverRequests.at(-1).params.selection.start.line,2);
  const count=c.serverRequests.length;c.change(uri,[{text:'a.b::c.d\nx.y::g.h'}],2);
  await c.request('workspace/executeCommand',detached.command);assert.equal(c.serverRequests.length,count);
 }
});
