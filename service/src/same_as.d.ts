import type {Interpretation,Range,Location,Position} from '@abstractlang/core';
export interface SameAsLens {range:Range;title:string;reference:string;location:Location}
export function sameAsLenses(graph:Interpretation,uri:string):SameAsLens[];

export interface HintViewport {start:{line:number;character:number};end:{line:number;character:number}}
export interface SameAsHint {position:Position;label:{value:string;location?:Location;tooltip?:string}[];paddingLeft:boolean;paddingRight:boolean;tooltip:string}
export function sameAsHints(graph:Interpretation,uri:string,viewport?:HintViewport):SameAsHint[];
