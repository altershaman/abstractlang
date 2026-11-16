import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {interpret,expand,VERSION} from '@abstractlang/core';
import {fileResolver} from '@abstractlang/service/files';
const schema='abstract.cli.v1';
export const help=`Usage: abstract <validate|expand|inspect> [--json] [--core] [--] FILE...\nUse - for stdin. Commands never modify input files.\nExit codes: 0 valid syntax, 1 syntax errors, 2 command/file errors.\nCollisions and unresolved references are findings, not syntax rejection.\n`;
export async function runCLI(args,{version=VERSION}={}){
  const json=args.includes('--json');
  if(args.includes('--help')||args.includes('-h')){process.stdout.write(help);return 0;}
  if(args.length===1&&args[0]==='--version'){process.stdout.write(version+'\n');return 0;}
  const command=args[0],response={schema,command:command??null,ok:true,files:[],errors:[]};
  let files=[],syntax='sugar',literal=false;
  try{
    if(!['validate','expand','inspect'].includes(command))throw new Error('Expected validate, expand or inspect.');
    for(const arg of args.slice(1)){
      if(literal)files.push(arg);else if(arg==='--')literal=true;else if(arg==='--json')continue;else if(arg==='--core')syntax='core';
      else if(arg==='-'||!arg.startsWith('-'))files.push(arg);else throw new Error('Unknown option: '+arg);
    }
    if(!files.length||files.filter(f=>f==='-').length>1)throw new Error('Supply files, with stdin (-) at most once.');
  }catch(error){response.ok=false;response.errors.push({code:'usage',message:error.message});if(json)process.stdout.write(JSON.stringify(response)+'\n');else process.stderr.write(error.message+'\n'+help);return 2;}
  let code=0;
  for(const filename of files){
    const path=filename==='-'?'-':resolve(filename);let source;
    try{if(path==='-'){source='';process.stdin.setEncoding('utf8');for await(const chunk of process.stdin)source+=chunk;}else source=await readFile(path,'utf8');}
    catch(error){response.errors.push({code:'read-error',path,message:error.message});code=2;continue;}
    const options={uri:pathToFileURL(path==='-'?resolve('stdin.abstract'):path).href,sourceRegistrations:syntax!=='core',resolveFile:fileResolver(),syntax};
    const graph=interpret(source,options),expanded=command==='expand'?expand(graph.documents[0].document):null;
    const file={path,valid:graph.valid,diagnostics:graph.diagnostics,collisions:graph.collisions,...(expanded?{complete:expanded.complete,text:expanded.text}:{}),...(command==='inspect'?{contexts:graph.contexts,terms:graph.terms,judgments:graph.judgments,identities:graph.identities,distinctions:graph.distinctions,detachments:graph.detachments}:{} )};
    response.files.push(file);if(!graph.valid&&code!==2)code=1;
    if(!json){
      for(const d of graph.diagnostics)process.stderr.write(`${path}:${d.range.start.line+1}:${d.range.start.character+1}: ${d.severity} ${d.code}: ${d.message}\n`);
      for(const c of graph.collisions)process.stderr.write(`${path}: ${c.kind}\n`);
      if(expanded?.text!==null&&expanded?.text!==undefined)process.stdout.write(expanded.text+'\n');
      else if(command==='inspect')process.stdout.write(JSON.stringify(file,null,2)+'\n');
      else if(graph.valid)process.stdout.write(path+': valid\n');
    }
  }
  response.ok=code===0;if(json)process.stdout.write(JSON.stringify(response)+'\n');return code;
}
