import type {Interpretation,Range} from '@abstractlang/core';
import type {CursorPosition} from './hierarchy.js';
export interface DetachmentProposal {title:string;statement:string;reference:string;edit:{range:Range;newText:string}}
export function detachmentAssertions(graph:Interpretation,uri:string,position:CursorPosition):DetachmentProposal[];
