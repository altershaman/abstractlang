import type {Interpretation,Range,Location} from '@abstractlang/core';
import type {CursorPosition} from './hierarchy.js';
export interface CompletionProposal {label:string;insertText:string;range:Range;kind:'term'|'relation'|'context';sortText:string;filterText:string;detail:string;locations:Location[]}
export function completeAt(graph:Interpretation,uri:string,position:CursorPosition):CompletionProposal[];
