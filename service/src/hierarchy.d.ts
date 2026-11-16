import type {Interpretation,Range,Location} from '@abstractlang/core';
export type CursorPosition=number|{line:number;character:number;offset?:number};
export interface HierarchyItem {id:string;label:string;labels:string[];locations:Location[]}
export interface HierarchySummary {kind:'term'|'relation';range:Range;selected:HierarchyItem[];parents:HierarchyItem[];children:HierarchyItem[];ancestors:(HierarchyItem&{distance:number})[];siblings:{parent:HierarchyItem;items:HierarchyItem[]}[];negated:{direction:'parent'|'child';item:HierarchyItem;location:Location}[]}
export function hierarchyAt(graph:Interpretation,uri:string,position:CursorPosition):HierarchySummary|null;
export function formatHierarchy(summary:HierarchySummary|null,options?:{markdown?:boolean;limit?:number}):string;
export function hoverContent(base:string,summary:HierarchySummary|null,options?:{markdown?:boolean}):string;
export function sourceLink(location:Location):string|null;
export function contains(range:Range,position:CursorPosition):boolean;
