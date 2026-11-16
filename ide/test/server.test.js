import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
const binary=fileURLToPath(new URL('../vscode/dist/server.cjs',import.meta.url));

async function client(t,{documentChanges=true,standard=true,markdown=false,showDocument=false}={}){
  const child=spawn(process.execPath,[binary,'--stdio'],{stdio:['pipe','pipe','pipe']});
  let buffer=Buffer.alloc(0),nextId=0,stderr='',exited=false;
  const pending=new Map(),notifications=[],waiters=[],serverRequests=[];
  child.stderr.on('data',chunk=>stderr+=chunk.toString());
  const exit=new Promise(resolve=>child.once('exit',(code,signal)=>{exited=true;resolve({code,signal});
    for(const request of pending.values())request.reject(new Error('Server exited: '+stderr));
  }));
  child.on('error',error=>{for(const request of pending.values())request.reject(error);});
  child.stdout.on('data',chunk=>{
    buffer=Buffer.concat([buffer,chunk]);
    while(true){
      const headerEnd=buffer.indexOf('\r\n\r\n');if(headerEnd<0)return;
      const match=/Content-Length:\s*(\d+)/i.exec(buffer.subarray(0,headerEnd).toString());
      assert(match,'stdout must contain only LSP frames');
      const length=Number(match[1]);if(buffer.length<headerEnd+4+length)return;
      const value=JSON.parse(buffer.subarray(headerEnd+4,headerEnd+4+length).toString('utf8'));buffer=buffer.subarray(headerEnd+4+length);
      if(value.id!==undefined&&value.method){serverRequests.push(value);send({jsonrpc:'2.0',id:value.id,result:{success:true}});}
      else if(value.id!==undefined){
        const request=pending.get(value.id);if(request){pending.delete(value.id);clearTimeout(request.timer);value.error?request.reject(Object.assign(new Error(value.error.message),{response:value.error})):request.resolve(value.result);}
      }else{
        notifications.push(value);
        for(const waiter of [...waiters])if(waiter.matches(value)){clearTimeout(waiter.timer);waiters.splice(waiters.indexOf(waiter),1);waiter.resolve(value);}
      }
    }
  });
  function send(value){const payload=JSON.stringify(value);child.stdin.write('Content-Length: '+Buffer.byteLength(payload)+'\r\n\r\n'+payload);}
  const notify=(method,params)=>send({jsonrpc:'2.0',method,params});
  function request(method,params){
    const id=++nextId;return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Timeout: '+method+' '+stderr));},5000);
      pending.set(id,{resolve,reject,timer});send({jsonrpc:'2.0',id,method,params});
    });
  }
  function diagnostics(uri,version){
    const matches=value=>value.method==='textDocument/publishDiagnostics'&&value.params.uri===uri&&(version===null?value.params.version===undefined:value.params.version===version);
    const existing=notifications.find(matches);if(existing)return Promise.resolve(existing.params.diagnostics);
    return new Promise((resolve,reject)=>{const waiter={matches,resolve:value=>resolve(value.params.diagnostics)};
      waiter.timer=setTimeout(()=>{waiters.splice(waiters.indexOf(waiter),1);reject(new Error('Diagnostics timeout '+stderr));},5000);waiters.push(waiter);
    });
  }
  t.after(async()=>{
    let clean=false;
    if(!exited){try{await request('shutdown',null);clean=true;notify('exit');child.stdin.end();}catch{child.kill();}}
    const timer=setTimeout(()=>child.kill(),1000);const result=await exit;clearTimeout(timer);
    if(clean)assert.equal(result.code,0,stderr);
    for(const waiter of waiters)clearTimeout(waiter.timer);
    for(const value of pending.values())clearTimeout(value.timer);
  });
  const initialized=await request('initialize',{processId:null,capabilities:{workspace:{workspaceEdit:{documentChanges}},...(markdown?{textDocument:{hover:{contentFormat:['markdown','plaintext']}}}:{}),...(showDocument?{window:{showDocument:{support:true}}}:{})},rootUri:null});
  notify('initialized',{});
  const open=(uri,text,version=1)=>notify('textDocument/didOpen',{textDocument:{uri,languageId:uri.endsWith('.md')?'markdown':'abstract',version,text}});
  const change=(uri,contentChanges,version)=>notify('textDocument/didChange',{textDocument:{uri,version},contentChanges});
  return {request,notify,diagnostics,open,change,initialized,notifications,serverRequests};
}
function at(uri,line,character){return {textDocument:{uri},position:{line,character}};}
test('bundled server runs standard diagnostics, hover and identity hints without Markdown integration',{skip:!existsSync(binary)},async t=>{
 const c=await client(t),uri='untitled:standard-bundle';
 c.open(uri,'a.b::c.d\nx.y::g.h\n(a:c.d)!.\n(a:c.d).(x:g.h)::.');
 assert.deepEqual(await c.diagnostics(uri,1),[]);
 assert.match((await c.request('textDocument/hover',at(uri,0,0))).contents.value,/a:c.d/);
 const hints=await c.request('textDocument/inlayHint',{textDocument:{uri},range:{start:{line:0,character:0},end:{line:4,character:0}}});
 assert(hints.some(h=>h.label.some(p=>p.value==='(detached)')));
 const graph=await c.request('abstract/graph',{uri});assert.deepEqual(graph.attributions,[]);
 c.change(uri,[{text:'a.b::c.d\na.b!c.d'}],2);
 assert((await c.diagnostics(uri,2)).some(d=>d.code==='contradiction'));
});
