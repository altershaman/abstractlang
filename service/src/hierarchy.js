import {termOccurrences,relationOccurrences} from './navigation.js';

const caches=new WeakMap();
const locationKey=l=>JSON.stringify([l.uri,l.range.start.offset,l.range.end.offset]);
const uniqueLocations=items=>[...new Map(items.map(l=>[locationKey(l),l])).values()];
export const contains=(range,position)=>typeof position==='number'?range.start.offset<=position&&position<range.end.offset:position.offset!==undefined?range.start.offset<=position.offset&&position.offset<range.end.offset:(range.start.line<position.line||(range.start.line===position.line&&range.start.character<=position.character))&&(range.end.line>position.line||(range.end.line===position.line&&range.end.character>position.character));
const label=pair=>pair.sourceTerm.name+'.'+pair.targetTerm.name;

function indexes(graph){
  if(caches.has(graph))return caches.get(graph);
  const relations=new Map(),terms=new Map(),relationEdges=[],termEdges=[],byRange=new Map(),byId=new Map(graph.terms.map(t=>[t.id,t]));
  function addNode(map,id,name,location){
    if(!map.has(id))map.set(id,{id,label:name,labels:[],locations:[]});
    const node=map.get(id);if(!node.labels.includes(name))node.labels.push(name);if(location)node.locations.push(location);
  }
  for(const occurrence of termOccurrences(graph)){
    const term=byId.get(occurrence.termId);if(!term)continue;
    const key=locationKey(occurrence);if(!byRange.has(key))byRange.set(key,new Set());byRange.get(key).add(term.conceptId);
    addNode(terms,term.conceptId,term.reference,{uri:occurrence.uri,range:occurrence.range});
  }
  for(const j of graph.judgments){
    const location={uri:j.uri,range:j.range};
    const concreteTerms=[j.concrete.sourceTerm,j.concrete.targetTerm].map(atom=>graph.terms.find(t=>t.word===atom.name&&t.contextId===j.abstractId));
    const abstractIds=[j.abstract.sourceTerm,j.abstract.targetTerm].map(atom=>byRange.get(locationKey({uri:j.uri,range:atom.nameRange||atom.range}))||new Set());
    const concreteKeys=concreteTerms.every(Boolean)?[JSON.stringify(concreteTerms.map(t=>t.conceptId).sort())]:[];
    const abstractKeys=[];for(const a of abstractIds[0])for(const b of abstractIds[1])abstractKeys.push(JSON.stringify([a,b].sort()));
    for(const id of concreteKeys)addNode(relations,id,label(j.concrete),{uri:j.uri,range:j.concrete.range});
    for(const id of abstractKeys)addNode(relations,id,label(j.abstract),{uri:j.uri,range:j.abstract.range});
    for(const from of concreteKeys)for(const to of new Set(abstractKeys))relationEdges.push({from,to,negated:j.negated,location});
    for(const [concrete,abstract] of [[j.concrete.sourceTerm,j.abstract.sourceTerm],[j.concrete.targetTerm,j.abstract.targetTerm]]){
      const contextual=graph.terms.find(t=>t.word===concrete.name&&t.contextId===j.abstractId);
      if(!contextual)continue;
      // The concrete endpoint can be written through a qualified reference.
      addNode(terms,contextual.conceptId,contextual.reference,{uri:j.uri,range:concrete.nameRange||concrete.range});
      for(const target of byRange.get(locationKey({uri:j.uri,range:abstract.nameRange||abstract.range}))||[])
        termEdges.push({from:contextual.conceptId,to:target,negated:j.negated,location});
    }
  }
  for(const map of [relations,terms])for(const node of map.values()){node.locations=uniqueLocations(node.locations);node.labels.sort();}
  const result={relations,terms,relationEdges,termEdges};caches.set(graph,result);return result;
}

function summarize(nodes,edges,seedIds,kind,range){
  const seeds=new Set(seedIds),positive=edges.filter(e=>!e.negated);
  const items=ids=>[...new Set(ids)].filter(id=>!seeds.has(id)&&nodes.has(id)).map(id=>nodes.get(id)).sort((a,b)=>a.label.localeCompare(b.label));
  const parents=items(positive.filter(e=>seeds.has(e.from)).map(e=>e.to));
  const children=items(positive.filter(e=>seeds.has(e.to)).map(e=>e.from));
  const distances=new Map(),queue=[...seeds].map(id=>[id,0]),visited=new Set(seeds);
  for(let i=0;i<queue.length;i++){
    const [id,depth]=queue[i];
    for(const edge of positive)if(edge.from===id&&!visited.has(edge.to)){
      visited.add(edge.to);distances.set(edge.to,depth+1);queue.push([edge.to,depth+1]);
    }
  }
  const ancestors=items([...distances.keys()]).map(item=>({...item,distance:distances.get(item.id)})).sort((a,b)=>a.distance-b.distance||a.label.localeCompare(b.label));
  const siblings=parents.map(parent=>({parent,items:items(positive.filter(e=>e.to===parent.id).map(e=>e.from))})).filter(group=>group.items.length);
  const negated=edges.filter(e=>e.negated&&(seeds.has(e.from)||seeds.has(e.to))).map(e=>({direction:seeds.has(e.from)?'parent':'child',item:nodes.get(seeds.has(e.from)?e.to:e.from),location:e.location}));
  const selected=[...seeds].filter(id=>nodes.has(id)).map(id=>nodes.get(id));
  return {kind,range,selected,children,parents,ancestors,siblings,negated};
}

/** Direct graph neighborhoods and finite positive ancestry, without inferring identities. */
export function hierarchyAt(graph,uri,position){
  const index=indexes(graph),relations=relationOccurrences(graph),selected=relations.filter(o=>o.uri===uri&&contains(o.dotRange,position));
  if(selected.length){
    const ids=selected.flatMap(o=>o.keys);
    return summarize(index.relations,index.relationEdges,ids,'relation',selected[0].dotRange);
  }
  const occurrences=termOccurrences(graph).filter(o=>o.uri===uri&&contains(o.range,position));if(!occurrences.length)return null;
  const ids=new Set(occurrences.map(o=>o.termId)),seeds=graph.terms.filter(t=>ids.has(t.id)).map(t=>t.conceptId);
  return summarize(index.terms,index.termEdges,seeds,'term',occurrences[0].range);
}

const escapeMarkdown=text=>String(text).replace(/[\\`*_{}\[\]()<>!#|]/g,'\\$&');
export function sourceLink(location){
  try{const url=new URL(location.uri);if(!['file:','untitled:'].includes(url.protocol))return null;
    url.hash='L'+(location.range.start.line+1)+','+(location.range.start.character+1);
    return url.href.replaceAll('(','%28').replaceAll(')','%29');
  }catch{return null;}
}

/** Compact display; the query result retains every item and source location. */
export function formatHierarchy(summary,{markdown=false,limit=6}={}){
  if(!summary)return '';
  const display=item=>{
    const location=item.locations[0],url=location&&sourceLink(location);
    const text=markdown?escapeMarkdown(item.label):item.label;
    return markdown&&url?'['+text+']('+url+')':text+(location?' ('+location.uri+':'+(location.range.start.line+1)+')':'');
  };
  const list=items=>items.slice(0,limit).map(display).join(', ')+(items.length>limit?' … '+(items.length-limit)+' more':'');
  const lines=[];
  if(summary.parents.length)lines.push('Parents (direct): '+list(summary.parents));
  if(summary.children.length)lines.push('Children (direct): '+list(summary.children));
  const indirect=summary.ancestors.filter(item=>item.distance>1);if(indirect.length)lines.push('Ancestors (indirect): '+list(indirect));
  for(const group of summary.siblings.slice(0,limit))lines.push('Siblings under '+display(group.parent)+': '+list(group.items));
  if(summary.siblings.length>limit)lines.push('… '+(summary.siblings.length-limit)+' more sibling groups');
  if(summary.negated.length)lines.push('Negated claims (not traversed): '+summary.negated.slice(0,limit).map(n=>n.direction+' '+display(n.item)).join(', '));
  return lines.join(markdown?'\n\n':'\n');
}

export function hoverContent(base,summary,{markdown=false}={}){
  const heading=base||(summary?summary.selected.map(n=>n.labels.join(' = ')).join('\n'):'');
  const navigation=formatHierarchy(summary,{markdown});
  return [markdown?escapeMarkdown(heading):heading,navigation].filter(Boolean).join('\n\n');
}
