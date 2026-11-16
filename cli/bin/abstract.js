#!/usr/bin/env node
import {runCLI} from '../src/cli.js';
try{process.exitCode=await runCLI(process.argv.slice(2));}catch(error){process.stderr.write(error.message+'\n');process.exitCode=2;}
