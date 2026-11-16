import {sourceContext,contextKey} from '@abstractlang/core';
const word='[\\p{L}\\p{N}_-][\\p{L}\\p{N}\\p{M}_-]*';
const text=pair=>pair.sourceTerm.name+'.'+pair.targetTerm.name;
const wordEnding=new RegExp('('+word+')?$','u');

/** Completion proposals operate on existing vocabulary and never add identity assertions. */
export function completeAt(graph,uri,position){
  const document=graph.documents.find(d=>d.uri===uri)?.document;if(!document)return [];
  const source=document.source,ctx=sourceContext(source),lines=source.split('\n');
  let offset;if(typeof position==='number')offset=position;else if(position.offset!==undefined)offset=position.offset;else offset=lines.slice(0,position.line).reduce((n,l)=>n+l.length+1,0)+position.character;
  const lineStart=source.lastIndexOf('\n',offset-1)+1,prefix=source.slice(lineStart,offset);
  if(/^\s*@/.test(prefix)||prefix.includes('//')||prefix.includes('"')||prefix.includes("'"))return [];
  const origins=new Map(),pairs=new Map();
  function origin(name,location){if(!origins.has(name))origins.set(name,[]);origins.get(name).push(location);}
  for(const term of graph.terms)for(const location of term.definitions)origin(term.word,location);
  for(const j of graph.judgments)for(const [pair,isAbstract] of [[j.concrete,false],[j.abstract,true]]){
    const name=text(pair);if(!pairs.has(name))pairs.set(name,{name,pair,abstract:false,locations:[]});
    const entry=pairs.get(name);entry.abstract||=isAbstract;entry.locations.push({uri:j.uri,range:pair.range});
  }
  const candidates=[];
  function offer(label,insertText,start,kind,rank,detail,locations){
    const typed=source.slice(start,offset);if(!insertText.startsWith(typed))return;
    const unique=[...new Map(locations.map(l=>[JSON.stringify([l.uri,l.range.start.offset]),l])).values()];
    const first=unique[0],where=first?' · '+first.uri+':'+(first.range.start.line+1):'';
    candidates.push({label,insertText,range:ctx.range(start,offset),kind,sortText:String(rank).padStart(3,'0')+':'+label,filterText:insertText,detail:detail+where,locations:unique});
  }
  const reference=new RegExp('\\(('+word+'):([\\p{L}\\p{N}\\p{M}_.-]*)$','u').exec(prefix);
  if(reference){
    const start=lineStart+prefix.lastIndexOf(':')+1;
    for(const term of graph.terms)if(term.word===reference[1]&&!['GLOBAL','DEFAULT'].includes(term.contextId)){
      const context=term.reference.slice(term.reference.indexOf(':')+1);
      offer(term.reference,context,start,'context',0,'Context for '+term.word,term.definitions);
    }
  }else {
    const dot=new RegExp('('+word+')\\.([\\p{L}\\p{N}\\p{M}_-]*)$','u').exec(prefix);
    if(dot){
      const start=lineStart+prefix.lastIndexOf('.')+1,first=dot[1],observed=new Set();
      for(const pair of pairs.values()){
        if(pair.pair.sourceTerm.name===first)observed.add(pair.pair.targetTerm.name);
        if(pair.pair.targetTerm.name===first)observed.add(pair.pair.sourceTerm.name);
      }
      for(const [name,locations] of origins)offer(name,name,start,'term',observed.has(name)?0:2,(observed.has(name)?'Observed with ':'Existing term; new pairing with ')+first,locations);
    }else if(/(?:::|!)\s*[\p{L}\p{N}\p{M}_.-]*$/u.test(prefix)&&!/(?:\:\:|!)\.$/.test(prefix)){
      const operator=/(::|!)\s*([\p{L}\p{N}\p{M}_.-]*)$/u.exec(prefix),start=lineStart+operator.index+operator[0].length-operator[2].length;
      const left=new RegExp('('+word+')\\.('+word+')\\s*$','u').exec(prefix.slice(0,operator.index));
      const knownParents=new Set(left?graph.judgments.filter(j=>j.concreteId===contextKey({sourceTerm:{name:left[1]},targetTerm:{name:left[2]}})).map(j=>text(j.abstract)):[]);
      for(const pair of pairs.values())offer(pair.name,pair.name,start,'relation',knownParents.has(pair.name)?0:pair.abstract?1:2,(knownParents.has(pair.name)?'Recorded abstraction':pair.abstract?'Existing abstraction relation':'Existing relation expression'),pair.locations);
    }else {
      if(/(?:\:\:|!)\.$/.test(prefix)||/[):@]\s*$/.test(prefix))return [];
      const partial=wordEnding.exec(prefix)?.[1]||'',start=offset-partial.length;
      for(const [name,locations] of origins)offer(name,name,start,'term',1,'Existing term',locations);
      // At a relation's start, allow insertion of an existing complete expression.
      if(/^\s*[\p{L}\p{N}\p{M}_-]*$/u.test(prefix))for(const pair of pairs.values())offer(pair.name,pair.name,start,'relation',2,'Existing relation expression',pair.locations);
    }
  }
  return [...new Map(candidates.map(c=>[c.kind+':'+c.insertText,c])).values()].sort((a,b)=>a.sortText.localeCompare(b.sortText));
}
