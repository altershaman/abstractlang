export interface Position {line:number;character:number;offset:number}
export interface Range {start:Position;end:Position}
export interface Diagnostic {code:string;message:string;severity:'error'|'warning';range:Range;uri?:string}
export interface Word {kind:'Reference';name:string;nameRange:Range;range:Range;synthetic?:boolean}
export interface ContextReference {kind:'ContextReference';word:string;nameRange:Range;context:Pair;range:Range;sourceAlias?:string;sourceRange?:Range;synthetic?:boolean}
export interface Qualified {kind:'Qualified';reference:ContextReference;range:Range}
export interface Pair {kind:'Pair';sourceTerm:Word;targetTerm:Word;source:string;target:string;range:Range}
export interface DefaultReference {kind:'DefaultReference';word:string;nameRange:Range;range:Range;context?:never;synthetic?:boolean}
export type IdentityOperand=ContextReference|DefaultReference;
export interface Identity {kind:'Identity';left:IdentityOperand;right:IdentityOperand;range:Range;synthetic?:boolean}
export interface Distinction {kind:'Distinction';left:IdentityOperand;right:IdentityOperand;range:Range}
export interface Detachment {kind:'Detachment';reference:ContextReference;range:Range}
export type CoreStatement=Judgment|Identity|Distinction|Detachment;
export interface Judgment {kind:'Judgment';concrete:Pair;abstract:Pair;negated:boolean;range:Range}
export interface Statement {kind:string;range:Range;indent:number;blankBefore:boolean;children:Statement[]}
export interface Document {kind:'Document';source:string;syntax:'core'|'sugar';statements:Statement[];core:CoreStatement[];expanded:Judgment[];identities:Identity[];distinctions:Distinction[];detachments:Detachment[];diagnostics:Diagnostic[]}
export interface ParseOptions {syntax?:'core'|'sugar';sourceRegistrations?:boolean}
export interface InterpretationOptions extends ParseOptions {uri?:string;resolveFile?:(uri:string,options:{read:boolean})=>{source?:string}|undefined|null}
export interface Location {uri:string;range:Range}
export interface Occurrence extends Location {termId:string;explicit:boolean;referenceRange?:Range;sourceAlias?:string}
export interface ContextTerm {id:string;word:string;contextId:string;reference:string;conceptId:string;available:boolean;detached:boolean;definitions:Location[];occurrences:Occurrence[]}
export interface InterpretedJudgment extends Judgment {uri:string;sourceAlias?:string;concreteId:string;abstractId:string;matching:number}
export interface InterpretedIdentity {left:string|null;right:string|null;leftReference:IdentityOperand;rightReference:IdentityOperand;uri:string;range:Range;synthetic:boolean;resolved:boolean}
export interface InterpretedDetachment {termId:string|null;reference:ContextReference;uri:string;range:Range;resolved:boolean}
export interface Collision {kind:'contradiction'|'entanglement'|'identity';concreteId?:string;abstractId?:string;left?:string;right?:string;assertions?:InterpretedIdentity[];judgments:InterpretedJudgment[];range?:Range;uri?:string}
export interface Interpretation {valid:boolean;uri:string;documents:{uri:string;sourceAlias?:string;document:Document}[];registrations:{alias:string;uri?:string;range:Range}[];judgments:InterpretedJudgment[];identities:InterpretedIdentity[];distinctions:InterpretedIdentity[];detachments:InterpretedDetachment[];contexts:{id:string;label:string;pair:Pair|null;members:string[]}[];terms:ContextTerm[];occurrences:Occurrence[];collisions:Collision[];diagnostics:Diagnostic[];resolveReference(text:string):ContextTerm|null}
export interface Expansion {document:Document;statements:CoreStatement[];judgments:Judgment[];identities:Identity[];distinctions:Distinction[];detachments:Detachment[];diagnostics:Diagnostic[];complete:boolean;text:string|null}
export function parse(source:string,options?:ParseOptions):Document;
export {parse as parseContextDocument};
export function parseReference(source:string,options?:ParseOptions):{reference:ContextReference|null;diagnostics:Diagnostic[]};
export {parseReference as parseContextReference};
export function interpret(input:string|Document,options?:InterpretationOptions):Interpretation;
export function expand(input:string|Document,options?:ParseOptions):Expansion;
export function print(document:Document):string;
export function termText(term:Word|Qualified|Pair):string;
export function referenceText(reference:IdentityOperand):string;
export function contextKey(pair:Pair):string;
export function referenceKey(reference:ContextReference):string;
export function resolveSourceUri(path:string,base:string):string;
export function sourceContext(source:string):{source:string;range(start:number,end?:number):Range;report(code:string,message:string,range:Range,severity?:'error'|'warning'):void;diagnostics:Diagnostic[]};
export const VERSION:'1.0.0';
