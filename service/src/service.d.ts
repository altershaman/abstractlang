import type {SameAsLens,SameAsHint,HintViewport} from './same_as.js';
import type {DetachmentProposal} from './authoring.js';
import type {HierarchySummary,CursorPosition} from './hierarchy.js';
import type {CompletionProposal} from './completion.js';
import type {Interpretation,Diagnostic,Range,Location,InterpretationOptions} from '@abstractlang/core';
export interface Selection {graph:Interpretation;termIds:string[];range:Range;uri:string;explicit?:boolean;sourceAlias?:string}
export interface ServiceOptions {languageIds?:Map<string,string>;resolveFile?:InterpretationOptions['resolveFile']}
export interface LanguageService {graphs:Map<string,Interpretation>;diagnostics:Map<string,Diagnostic[]>;directories:Set<string>;graphFor(uri:string):Interpretation|undefined;at(uri:string,position:number|{line:number;character:number;offset?:number}):Selection|null;locations(item:Selection,options?:{definitions?:boolean;includeDeclaration?:boolean}):Location[];highlights(uri:string,position:number|{line:number;character:number;offset?:number}):Range[];hierarchy(uri:string,position:CursorPosition):HierarchySummary|null;completions(uri:string,position:CursorPosition):CompletionProposal[];detachmentActions(uri:string,position:CursorPosition):DetachmentProposal[];sameAsLenses(uri:string):SameAsLens[];sameAsHints(uri:string,viewport?:HintViewport):SameAsHint[];hover(item:Selection):string}
export function createLanguageService(snapshots?:Map<string,string>,options?:ServiceOptions):LanguageService;

export function createInterpretationService(graphs?:Map<string,Interpretation>):LanguageService;
