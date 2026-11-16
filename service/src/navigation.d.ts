import type {Interpretation,ContextTerm,Occurrence,Range} from '@abstractlang/core';
import type {Selection} from './service.js';
export function identityTerms(item:Pick<Selection,'graph'|'termIds'>):ContextTerm[];
export function termOccurrences(graph:Interpretation):Occurrence[];

export interface RelationOccurrence {uri:string;dotRange:Range;ranges:Range[];keys:string[]}
export function relationOccurrences(graph:Interpretation):RelationOccurrence[];

export function rootInterpretations(graphs:Map<string,Interpretation>):Interpretation[];
export function interpretationFor(graphs:Map<string,Interpretation>,uri:string):Interpretation|undefined;
