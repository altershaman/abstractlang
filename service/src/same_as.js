import {termOccurrences} from './navigation.js';

/** Labels for differently spelled terms joined by authored equality, including transitive equality. */
export function sameAsLenses(graph,uri){
  const byId=new Map(graph.terms.map(t=>[t.id,t])),groups=new Map();
  for(const identity of graph.identities){
    if(identity.synthetic||!identity.resolved)continue;
    const left=byId.get(identity.left),right=byId.get(identity.right);if(!left||!right||left.word===right.word)continue;
    if(!groups.has(left.conceptId))groups.set(left.conceptId,new Set());
    groups.get(left.conceptId).add(left.word);groups.get(left.conceptId).add(right.word);
  }
  const document=graph.documents.find(d=>d.uri===uri)?.document;if(!document)return [];
  const declarations=[];
  function visit(node){if(['Identity','Distinction','Detachment'].includes(node.kind))declarations.push(node.range);for(const child of node.children||[])visit(child);}
  for(const node of document.statements)visit(node);
  const preferred=term=>['GLOBAL','DEFAULT'].includes(term.contextId)?1:0;
  const result=[];
  for(const occurrence of termOccurrences(graph).filter(o=>o.uri===uri)){
    if(declarations.some(r=>r.start.offset<=occurrence.range.start.offset&&occurrence.range.end.offset<=r.end.offset))continue;
    const source=byId.get(occurrence.termId),words=groups.get(source?.conceptId);if(!words)continue;
    const targets=graph.terms.filter(t=>t.conceptId===source.conceptId&&t.word!==source.word&&words.has(t.word)&&t.available)
      .sort((a,b)=>preferred(a)-preferred(b)||a.reference.localeCompare(b.reference));
    const aliases=[...new Map(targets.map(t=>[t.word,targets.find(candidate=>candidate.word===t.word)])).values()].slice(0,4);
    for(const target of aliases){
      const compatible=graph.terms.filter(t=>t.conceptId===target.conceptId&&t.word===target.word);
      const actual=termOccurrences(graph).find(o=>!o.explicit&&compatible.some(t=>t.id===o.termId));
      const location=target.definitions[0]||actual;
      if(!location)continue;
      result.push({range:occurrence.range,title:'same as '+target.reference,reference:target.reference,
        location:{uri:location.uri,range:location.range}});
    }
  }
  return [...new Map(result.map(l=>[JSON.stringify([l.range.start.offset,l.range.end.offset,l.reference]),l])).values()];
}


/** Inline synonyms and detachment markers; hints never contain source text edits. */
export function sameAsHints(graph,uri,viewport){
  const groups=new Map();
  for(const lens of sameAsLenses(graph,uri)){
    const position=lens.range.end;
    const compare=(a,b)=>a.line-b.line||a.character-b.character;
    if(viewport&&(compare(position,viewport.start)<0||compare(position,viewport.end)>=0))continue;
    const key=lens.range.start.offset+':'+lens.range.end.offset;
    if(!groups.has(key))groups.set(key,{position,label:[{value:'('}],paddingLeft:true,paddingRight:true,tooltip:'Explicit identity; these hints do not modify the source.'});
    const hint=groups.get(key);if(hint.label.length>1)hint.label.push({value:', '});
    hint.label.push({value:lens.reference.split(':')[0],location:lens.location,tooltip:'same as '+lens.reference+' — click to go to source'});
  }
  const hints=[...groups.values()].map(hint=>({...hint,label:[...hint.label,{value:')'}]}));
  const byId=new Map(graph.terms.map(term=>[term.id,term]));
  const document=graph.documents.find(d=>d.uri===uri)?.document,declarations=[];
  function visit(node){if(['Identity','Distinction','Detachment'].includes(node.kind))declarations.push(node.range);for(const child of node.children||[])visit(child);}
  for(const node of document?.statements||[])visit(node);
  for(const occurrence of termOccurrences(graph).filter(o=>o.uri===uri)){
    const term=byId.get(occurrence.termId);if(!term?.detached)continue;
    if(declarations.some(r=>r.start.offset<=occurrence.range.start.offset&&occurrence.range.end.offset<=r.end.offset))continue;
    const position=occurrence.range.end,compare=(a,b)=>a.line-b.line||a.character-b.character;
    if(viewport&&(compare(position,viewport.start)<0||compare(position,viewport.end)>=0))continue;
    const assertion=graph.detachments.find(d=>d.resolved&&d.termId===term.id)||graph.distinctions.find(d=>d.resolved&&(d.left===term.id||d.right===term.id));
    if(!assertion)continue;
    hints.push({position,label:[{value:'(detached)',location:{uri:assertion.uri,range:assertion.range},tooltip:term.reference+' — click to go to detachment assertion'}],
      paddingLeft:true,paddingRight:true,tooltip:'Detached from default word coincidence; explicit identity still applies.'});
  }
  return [...new Map(hints.map(h=>[JSON.stringify([h.position,h.label]),h])).values()]
    .sort((a,b)=>a.position.line-b.position.line||a.position.character-b.position.character);
}
