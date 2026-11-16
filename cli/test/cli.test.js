import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const binary=new URL('../bin/abstract.js',import.meta.url);
const run=(args,input)=>spawnSync(process.execPath,[binary.pathname,...args],{input,encoding:'utf8'});
test('CLI uses current identities and expands referenced endpoints for agents',()=>{
  const result=run(['expand','--json','-'],'a.b::c.d\nx.y::g.h\n(a:c.d).(x:g.h)::part.whole');assert.equal(result.status,0,result.stderr);
  const file=JSON.parse(result.stdout).files[0];assert.match(file.text,/\(a:c.d\).\(a:part.whole\)::\./);assert.match(file.text,/a.x::part.whole/);
});
test('CLI reports collisions without treating them as syntax errors',()=>{
  const result=run(['validate','--json','-'],'a.b::c.d\na.b!c.d');assert.equal(result.status,0);assert(JSON.parse(result.stdout).files[0].collisions.some(c=>c.kind==='contradiction'));
  assert.equal(run(['validate','--json','-'],'old.title:"legacy"').status,1);
});
test('CLI exposes strict core syntax, stdin, version and usage errors',()=>{
  assert.equal(run(['--version']).stdout.trim(),'1.0.0');assert.equal(run(['validate','--core','-'],'a.b::c.d::e.f').status,1);
  assert.equal(run(['validate','--core','-'],'  a.b::c.d // comment').status,0);
  assert.equal(run(['validate']).status,2);assert.equal(run(['validate','missing-file.abstract']).status,2);
});

test('CLI inspection exposes authored detachment and distinction records',()=>{
 const result=run(['inspect','--json','-'],'a.b::c.d\na.b::e.f\n(a:c.d)!.\n(a:c.d).(a:e.f)!.');
 assert.equal(result.status,0,result.stderr);const file=JSON.parse(result.stdout).files[0];assert.equal(file.detachments.length,1);assert.equal(file.distinctions.length,1);
});
