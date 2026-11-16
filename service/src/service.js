import {sameAsLenses as synonymLenses,sameAsHints as synonymHints} from './same_as.js';
import {detachmentAssertions} from './authoring.js';
import {hierarchyAt} from './hierarchy.js';
import {completeAt} from './completion.js';
import {interpret} from '@abstractlang/core';
import {identityTerms,termOccurrences,relationOccurrences,rootInterpretations,interpretationFor} from './navigation.js';

/** Analyze supplied Abstract snapshots. All external access is provided by the caller. */
export function createLanguageService(snapshots=new Map(),{languageIds=new Map(),resolveFile}={}){
  const graphs=new Map();
  const resolver=(uri,options={})=>snapshots.has(uri)?(options.read?{source:snapshots.get(uri)}:{}):resolveFile?.(uri,options);
  for(const [uri,source] of snapshots){
    if(languageIds.has(uri)?languageIds.get(uri)!=='abstract':! /\.abstract(?:[?#].*)?$/i.test(uri))continue;
    const graph=interpret(source,{uri,resolveFile:resolver,sourceRegistrations:true});graphs.set(uri,graph);
  }
  return createInterpretationService(graphs);
}

/** Host adapters can supply native core interpretations while owning their own metadata. */
export function createInterpretationService(graphs=new Map()){
  const diagnostics=new Map(),directories=new Set();
  for(const graph of rootInterpretations(graphs)){
    for(const document of graph.documents)if(!diagnostics.has(document.uri))diagnostics.set(document.uri,[]);
    const findings=[...graph.diagnostics];
    for(const collision of graph.collisions){
      if(!['contradiction','entanglement'].includes(collision.kind))continue;
      const message=collision.kind==='contradiction'
        ?'Contradiction: this judgment participates in both an assertion and its negation, directly or through abstraction paths.'
        :'Entanglement: abstraction paths give incompatible endpoint correspondences.';
      const witnesses=collision.judgments.filter((j,i,a)=>a.findIndex(x=>x.uri===j.uri&&x.range.start.offset===j.range.start.offset&&x.range.end.offset===j.range.end.offset)===i);
      for(const judgment of witnesses)findings.push({code:collision.kind,severity:'warning',message,uri:judgment.uri,range:judgment.range,
        relatedInformation:witnesses.filter(j=>j!==judgment).map(j=>({location:{uri:j.uri,range:j.range},message:'Related judgment in this '+collision.kind+'.'}))});
    }
    for(const d of findings){const list=diagnostics.get(d.uri)||[];if(!list.some(x=>x.code===d.code&&x.message===d.message&&x.range.start.offset===d.range.start.offset&&x.range.end.offset===d.range.end.offset))list.push(d);diagnostics.set(d.uri,list);}
    for(const document of graph.documents){try{const url=new URL('.',document.uri);if(url.protocol==='file:')directories.add(url.href);}catch{}}
  }
  function graphFor(uri){return interpretationFor(graphs,uri);}
  function selectionAt(uri,position,exact=false){
    const graph=graphFor(uri);if(!graph)return null;
    const offset=position.offset??position;
    const contains=r=>r&&(typeof offset==='number'?r.start.offset<=offset&&offset<r.end.offset:(r.start.line<position.line||(r.start.line===position.line&&r.start.character<=position.character))&&(r.end.line>position.line||(r.end.line===position.line&&r.end.character>position.character)));
    const occurrences=termOccurrences(graph),precise=occurrences.filter(o=>o.uri===uri&&contains(o.range));
    const matches=precise.length||exact?precise:occurrences.filter(o=>o.uri===uri&&o.explicit&&contains(o.referenceRange));
    if(!matches.length)return null;const first=matches[0];
    return {...first,range:contains(first.range)?first.range:first.referenceRange,termIds:[...new Set(matches.map(o=>o.termId))],graph};
  }
  function locations(item,{definitions=false,includeDeclaration=true}={}){
    const results=[];
    for(const term of identityTerms(item)){
      const sourceUri=item.sourceAlias?item.graph.registrations.find(r=>r.alias===item.sourceAlias)?.uri:null;
      const declarations=term.definitions.filter(o=>!sourceUri||o.uri===sourceUri);
      if(definitions){if(declarations.length)results.push(declarations[0]);}
      else for(const o of termOccurrences(item.graph).filter(o=>o.termId===term.id))if((includeDeclaration||o.explicit||!declarations.some(d=>d.uri===o.uri&&d.range.start.offset===o.range.start.offset)))results.push(o);
    }
    return results.filter((r,i,a)=>a.findIndex(x=>x.uri===r.uri&&x.range.start.offset===r.range.start.offset&&x.range.end.offset===r.range.end.offset)===i).map(({uri,range})=>({uri,range}));
  }
  const at=(uri,position)=>selectionAt(uri,position);
  function highlights(uri,position){
    const graph=graphFor(uri);if(!graph)return [];
    const inside=r=>typeof position==='number'?r.start.offset<=position&&position<r.end.offset:position.offset!==undefined?r.start.offset<=position.offset&&position.offset<r.end.offset:r.start.line===position.line&&r.start.character<=position.character&&position.character<r.end.character;
    const relations=relationOccurrences(graph),selected=relations.filter(r=>r.uri===uri&&inside(r.dotRange));
    if(selected.length){
      const keys=new Set(selected.flatMap(r=>r.keys));
      const ranges=relations.filter(r=>r.uri===uri&&r.keys.some(k=>keys.has(k))).flatMap(r=>r.ranges);
      return [...new Map(ranges.map(r=>[[r.start.offset,r.end.offset].join(':'),r])).values()].sort((a,b)=>a.start.offset-b.start.offset||a.end.offset-b.end.offset);
    }
    const item=selectionAt(uri,position,true);if(!item)return [];
    return locations(item).filter(l=>l.uri===uri).map(l=>l.range).sort((a,b)=>a.start.offset-b.start.offset);
  }
  function hierarchy(uri,position){const graph=graphFor(uri);return graph?hierarchyAt(graph,uri,position):null;}
  function completions(uri,position){const graph=graphFor(uri);return graph?completeAt(graph,uri,position):[];}
  function detachmentActions(uri,position){const graph=graphFor(uri);return graph?detachmentAssertions(graph,uri,position):[];}
  function sameAsLenses(uri){const graph=graphFor(uri);return graph?synonymLenses(graph,uri):[];}
  function sameAsHints(uri,viewport){const graph=graphFor(uri);return graph?synonymHints(graph,uri,viewport):[];}
  function hover(item){
    const terms=item.termIds.map(id=>item.graph.terms.find(t=>t.id===id)).filter(Boolean);
    return [...new Set(terms.map(t=>t.reference))].join('\n');
  }
  return {graphs,diagnostics,directories,graphFor,at,locations,highlights,hierarchy,completions,detachmentActions,sameAsLenses,sameAsHints,hover};
}
