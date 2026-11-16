import {createVSIX} from '@vscode/vsce';
import {mkdir} from 'node:fs/promises';
import './build.mjs';
await mkdir(new URL('dist/',import.meta.url),{recursive:true});
await createVSIX({cwd:new URL('vscode/',import.meta.url).pathname,packagePath:new URL('dist/abstractlang-1.0.0.vsix',import.meta.url).pathname,dependencies:false,skipLicense:false});
