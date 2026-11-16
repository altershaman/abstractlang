import {contextKey,sourceContext} from '@abstractlang/core';

/** Contextual terms that denote any of the selected concept identities. */
export function identityTerms(item){
  const selected=new Set(item.termIds),concepts=new Set(item.graph.terms.filter(t=>selected.has(t.id)).map(t=>t.conceptId));
  return item.graph.terms.filter(t=>concepts.has(t.conceptId));
}

const cache=new WeakMap();
/** Authored word occurrences, including context words inside explicit references. */
export function termOccurrences(graph){
  if(cache.has(graph))return cache.get(graph);
  const occurrences=[...graph.occurrences],at=new Map(),relationWords=new Map();
  const key=(uri,range)=>JSON.stringify([uri,range.start.offset,range.end.offset]);
  for(const o of graph.occurrences){const k=key(o.uri,o.range);if(!at.has(k))at.set(k,[]);at.get(k).push(o.termId);}
  for(const j of graph.judgments)for(const pair of [j.concrete,j.abstract]){
    for(const atom of [pair.sourceTerm,pair.targetTerm]){
      const k=JSON.stringify([contextKey(pair),atom.name]);if(!relationWords.has(k))relationWords.set(k,new Set());
      for(const id of at.get(key(j.uri,atom.nameRange||atom.range))||[])relationWords.get(k).add(id);
    }
  }
  function visit(node,uri){
    if(node.kind==='Qualified'){visit(node.reference,uri);return;}
    if(node.kind==='ContextReference'){
      const sourceUri=node.sourceAlias?graph.registrations.find(r=>r.alias===node.sourceAlias)?.uri:null;
      for(const atom of [node.context.sourceTerm,node.context.targetTerm]){
        const ids=relationWords.get(JSON.stringify([contextKey(node.context),atom.name]))||[];
        for(const termId of ids){
          const term=graph.terms.find(t=>t.id===termId);
          if(sourceUri&&!term.definitions.some(d=>d.uri===sourceUri))continue;
          occurrences.push({termId,uri,range:atom.nameRange||atom.range,explicit:true});
        }
      }
      return;
    }
    if(node.kind==='Pair'){visit(node.sourceTerm,uri);visit(node.targetTerm,uri);return;}
    for(const name of ['concept','reference','left','right'])if(node[name])visit(node[name],uri);
    for(const child of [...(node.terms||[]),...(node.children||[])])visit(child,uri);
  }
  for(const doc of graph.documents)for(const statement of doc.document.statements)visit(statement,doc.uri);
  const result=[...new Map(occurrences.map(o=>[JSON.stringify([o.termId,o.uri,o.range.start.offset,o.range.end.offset]),o])).values()];
  cache.set(graph,result);return result;
}

const relationCache=new WeakMap();
/** Written relation fragments and their unordered endpoint-identity keys. */
export function relationOccurrences(graph){
  if(relationCache.has(graph))return relationCache.get(graph);
  const words=termOccurrences(graph),concepts=new Map(graph.terms.map(t=>[t.id,t.conceptId])),result=[];
  const byRange=new Map();
  const rangeKey=(uri,r)=>JSON.stringify([uri,r.start.offset,r.end.offset]);
  for(const o of words){const key=rangeKey(o.uri,o.range);if(!byRange.has(key))byRange.set(key,new Set());byRange.get(key).add(concepts.get(o.termId));}
  for(const doc of graph.documents){
    const source=doc.document.source,ctx=sourceContext(source);
    function add(pair){
      const a=pair.sourceTerm,b=pair.targetTerm;
      if(!a||!b)return;
      const nameRange=t=>t.kind==='Qualified'?t.reference.nameRange:t.nameRange||t.range;
      const left=byRange.get(rangeKey(doc.uri,nameRange(a))),right=byRange.get(rangeKey(doc.uri,nameRange(b)));
      if(!left?.size||!right?.size)return;
      let dot,ranges;
      const gap=source.slice(a.range.end.offset,b.range.start.offset);
      if(a.range.end.offset<=b.range.start.offset&&/^[ \t]*\.[ \t]*$/.test(gap)){
        dot=a.range.end.offset+gap.indexOf('.');ranges=[{start:a.range.start,end:b.range.end}];
      }else if(a.range.start.offset===b.range.start.offset&&a.range.end.offset===b.range.end.offset){
        // .word shorthand has two endpoints but only one written word.
        const lineStart=source.lastIndexOf('\n',a.range.start.offset-1)+1;
        const prefix=source.slice(lineStart,a.range.start.offset),match=/\.[ \t]*$/.exec(prefix);
        if(!match)return;dot=lineStart+match.index;ranges=[ctx.range(dot,a.range.end.offset)];
      }else if(a.range.end.line<b.range.start.line){
        // Shared-concept blocks: highlight only their written fragments.
        const lineStart=source.lastIndexOf('\n',b.range.start.offset-1)+1;
        const prefix=source.slice(lineStart,b.range.start.offset),leading=/^[ \t]*\.[ \t]*$/.exec(prefix);
        if(leading){dot=lineStart+prefix.indexOf('.');ranges=[a.range,ctx.range(dot,b.range.end.offset)];}
        else {
          const lineEnd=source.indexOf('\n',a.range.end.offset),suffix=source.slice(a.range.end.offset,lineEnd<0?source.length:lineEnd),trailing=/^[ \t]*\./.exec(suffix);
          if(!trailing)return;dot=a.range.end.offset+trailing[0].indexOf('.');ranges=[ctx.range(a.range.start.offset,dot+1),b.range];
        }
      }else return;
      const keys=[];for(const x of left)for(const y of right)if(x&&y)keys.push(JSON.stringify([x,y].sort()));
      if(keys.length)result.push({uri:doc.uri,dotRange:ctx.range(dot,dot+1),ranges,keys:[...new Set(keys)]});
    }
    function visit(node){
      if(node.kind==='Pair'){add(node);visit(node.sourceTerm);visit(node.targetTerm);return;}
      if(node.kind==='Qualified'){visit(node.reference);return;}
      if(node.kind==='ContextReference'){visit(node.context);return;}
      for(const key of ['concept','reference','left','right'])if(node[key])visit(node[key]);
      for(const child of [...(node.terms||[]),...(node.children||[])])visit(child);
    }
    for(const statement of doc.document.statements)visit(statement);
    // Expanded pairs supply the endpoints shared through indentation.
    for(const judgment of doc.document.expanded){add(judgment.concrete);add(judgment.abstract);}
  }
  const unique=[...new Map(result.map(o=>[JSON.stringify([o.uri,o.dotRange.start.offset,o.ranges.map(r=>[r.start.offset,r.end.offset]),o.keys]),o])).values()];
  relationCache.set(graph,unique);return unique;
}


/** Open included files retain their including root's interpretation, rather than shadowing it. */
export function rootInterpretations(graphs){
  const all=[...graphs.values()].sort((a,b)=>a.uri.localeCompare(b.uri));
  const roots=all.filter(g=>!all.some(other=>other!==g&&other.documents.some(d=>d.uri===g.uri)));
  // Cover independently opened files even when registrations form a cycle.
  for(const graph of all)if(!roots.some(root=>root.documents.some(d=>d.uri===graph.uri)))roots.push(graph);
  return roots.sort((a,b)=>a.uri.localeCompare(b.uri));
}
export function interpretationFor(graphs,uri){
  const candidates=rootInterpretations(graphs).filter(g=>g.documents.some(d=>d.uri===uri));
  return candidates.find(g=>g.uri===uri)||candidates[0]||graphs.get(uri);
}
