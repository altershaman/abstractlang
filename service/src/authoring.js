import {sourceContext} from '@abstractlang/core';
import {termOccurrences} from './navigation.js';
import {contains} from './hierarchy.js';

/** Propose explicit contextual detachment; the client applies the chosen buffer edit. */
export function detachmentAssertions(graph,uri,position){
  const document=graph.documents.find(d=>d.uri===uri)?.document;if(!document)return [];
  const ids=new Set(termOccurrences(graph).filter(o=>o.uri===uri&&contains(o.range,position)).map(o=>o.termId));
  const selected=graph.terms.filter(t=>ids.has(t.id)&&t.available&&!t.detached&&!['GLOBAL','DEFAULT'].includes(t.contextId));
  const eol=/\r?\n/.exec(document.source)?.[0]||'\n',end=sourceContext(document.source).range(document.source.length);
  const prefix=document.source.endsWith(eol+eol)?'':document.source.endsWith(eol)?eol:eol+eol;
  return selected.map(term=>{
    const statement='('+term.reference+')!.';
    return {title:'Detach contextual term: '+term.reference,statement,reference:term.reference,edit:{range:end,newText:prefix+statement+eol}};
  });
}
