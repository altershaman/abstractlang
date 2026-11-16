'use strict';
const vscode=require('vscode');
const {LanguageClient,TransportKind}=require('vscode-languageclient/node');
const {createClientOptions}=require('./options.cjs');
let client,watcher,queue=Promise.resolve();
async function launch(context){
  if(client){await client.stop();client=undefined;}
  const settings=vscode.workspace.getConfiguration('abstract');
  const module=settings.get('server.path')||context.asAbsolutePath('dist/server.cjs');
  const serverOptions={run:{module,transport:TransportKind.stdio},debug:{module,transport:TransportKind.stdio}};
  if(watcher)watcher.dispose();
  watcher=vscode.workspace.createFileSystemWatcher('**/*.abstract');context.subscriptions.push(watcher);
  client=new LanguageClient('abstract','Abstract Language Server',serverOptions,createClientOptions(watcher));
  await client.start();
}
exports.activate=async function(context){
  const restart=()=>{queue=queue.then(()=>launch(context),()=>launch(context));return queue;};
  context.subscriptions.push(vscode.commands.registerCommand('abstract.restartLanguageServer',restart));
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event=>{if(event.affectsConfiguration('abstract'))restart().catch(error=>vscode.window.showErrorMessage(error.message));}));
  await restart();
};
exports.deactivate=async function(){await queue.catch(()=>{});if(client)await client.stop();if(watcher)watcher.dispose();};
