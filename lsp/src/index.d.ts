/// <reference types="node" />
import type {Readable,Writable} from 'node:stream';
import type {LanguageService,ServiceOptions} from '@abstractlang/service';
import type {Connection} from 'vscode-languageserver/node';
export function startLanguageServer(options?:{input?:Readable;output?:Writable;version?:string;createService?:(snapshots?:Map<string,string>,options?:ServiceOptions)=>Omit<LanguageService,'graphFor'>;watchPattern?:RegExp}):Connection;
export const VERSION:'1.0.0';
