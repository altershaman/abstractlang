export {parseContextDocument as parse,parseContextDocument,parseContextReference as parseReference,parseContextReference,termText,referenceText} from './parser.js';
export {interpret,contextKey,referenceKey,resolveSourceUri} from './interpretation.js';
import {parseContextDocument,termText,referenceText} from './parser.js';

/** Canonical core statements; input and source positions are never rewritten. */
export function expand(input,options={}) {
  const document=typeof input==='string'?parseContextDocument(input,options):input;
  if(document?.kind!=='Document'||!Array.isArray(document.core))throw new TypeError('Expected Abstract source or a parsed Document.');
  const operand=ref=>ref.context?'('+referenceText(ref)+')':ref.word;
  const statements=document.core.map(statement=>statement.kind==='Detachment'?operand(statement.reference)+'!.'
    :['Identity','Distinction'].includes(statement.kind)?operand(statement.left)+'.'+operand(statement.right)+(statement.kind==='Identity'?'::.':'!.')
    :termText(statement.concrete)+(statement.negated?'!':'::')+termText(statement.abstract));
  const registrations=document.statements.filter(n=>n.kind==='ExternalSource').map(n=>'@'+n.name+'.path:'+JSON.stringify(n.path));
  const complete=!document.diagnostics.some(d=>d.severity==='error');
  return {document,statements:document.core,judgments:document.expanded,identities:document.identities,distinctions:document.distinctions,detachments:document.detachments,diagnostics:document.diagnostics,complete,text:complete?[...registrations,...statements].join('\n'):null};
}
export function print(document) {
  if(document?.kind!=='Document')throw new TypeError('Expected a parsed Document.');return document.source;
}
export const VERSION='1.0.0';
export {sourceContext} from './source.js';
