#!/usr/bin/env node
import {startLanguageServer,VERSION} from '../src/index.js';
const args=process.argv.slice(2).filter(arg=>!/^--clientProcessId=\d+$/.test(arg));
if(args.length===1&&args[0]==='--version')process.stdout.write(VERSION+'\n');
else if(args.length===1&&args[0]==='--help')process.stdout.write('Usage: abstract-lsp [--stdio]\nStandard Abstract language server.\n');
else if(!args.length||(args.length===1&&args[0]==='--stdio'))startLanguageServer({version:VERSION});
else {process.stderr.write('Usage: abstract-lsp [--stdio]\n');process.exitCode=2;}
