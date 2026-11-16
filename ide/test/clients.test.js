import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
test('VS Code registers only Abstract and preserves its standard language settings',()=>{
 const {createClientOptions}=require('../vscode/src/options.cjs'),watcher={};
 const options=createClientOptions(watcher);
 assert.deepEqual(options.documentSelector,[{scheme:'file',language:'abstract'},{scheme:'untitled',language:'abstract'}]);assert.equal(options.synchronize.fileEvents,watcher);
 const p=JSON.parse(readFileSync(new URL('../vscode/package.json',import.meta.url)));
 assert.deepEqual(p.activationEvents,['onLanguage:abstract']);assert(!p.contributes.configuration.properties['abstract.markdown.enabled']);
 assert.equal(p.contributes.configurationDefaults['[abstract]']['editor.inlayHints.enabled'],'on');
 assert.equal(p.contributes.configurationDefaults['editor.semanticTokenColorCustomizations'].rules['bang:abstract'].bold,false);
});
test('reference clients bundle standard LSP and retain configurable server launch',()=>{
 const build=readFileSync(new URL('../build.mjs',import.meta.url),'utf8');assert(build.includes("entryPoints:['lsp/bin/abstract-lsp.js']"));
 const zed=readFileSync(new URL('../zed/extension.toml',import.meta.url),'utf8');assert(zed.includes('languages = ["Abstract"]'));assert(!zed.includes('Markdown'));
 assert(readFileSync(new URL('../zed/src/lib.rs',import.meta.url),'utf8').includes('settings.binary'));
 assert(readFileSync(new URL('../vscode/src/extension.cjs',import.meta.url),'utf8').includes("settings.get('server.path')"));
});
