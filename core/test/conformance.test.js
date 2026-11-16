import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse,parseReference,interpret,expand,print,resolveSourceUri} from '@abstractlang/core';

const base='a.b::c.d\nx.y::g.h\n';
test('published core API rejects legacy statements and preserves source exactly',()=>{
  const source='\uFEFF  引擎.车 :: 部件.整体 // text\r\n\t(a:部件.整体).(b:整体.部件)::.\r\n';
  const document=parse(source,{syntax:'core'});assert.equal(print(document),source);assert.equal(document.diagnostics.length,0);
  for(const text of ['a.title:"Title"','a..alias','*ontology','`metadata = true','@concept a {}','a:b.c','a.b','a.b :: .'])assert(parse(text,{syntax:'core'}).diagnostics.some(d=>d.severity==='error'),text);
  for(const text of ['a.b::c.d::e.f','a.b::.c','a.\n  b::c.d','(a:c.d).b::e.f'])assert(parse(text,{syntax:'core'}).diagnostics.length,text);
});
test('core tokens permit Unicode but never normalize spelling or split atomic operators',()=>{
  assert(interpret('é.x::c.d\ne\u0301.x::c.d').valid);
  const g=interpret('é.x::c.d\ne\u0301.x::c.d');assert.notEqual(g.resolveReference('é:c.d').conceptId,g.resolveReference('e\u0301:c.d').conceptId);
  for(const bad of ['\u0301a.b::c.d','a.b: :c.d','(a:c.d).(b:c.d):: .'])assert(!interpret(bad).valid);
  assert(interpret('a.b::c.d// comment').valid);assert(interpret('// comment without newline').valid);
});
test('referenced endpoints expand to identities and create reusable contextual addresses',()=>{
  const source=base+'(a:c.d).(x:g.h)::part.whole';
  const expansion=expand(source);assert(expansion.complete);
  assert.deepEqual(expansion.text.split('\n').slice(2),['(a:c.d).(a:part.whole)::.','(x:g.h).(x:part.whole)::.','a.x::part.whole']);
  const compact=interpret(source),explicit=interpret(expansion.text,{syntax:'core'});
  for(const g of [compact,explicit]){assert(g.valid);assert.equal(g.resolveReference('a:c.d').conceptId,g.resolveReference('a:part.whole').conceptId);assert.equal(g.resolveReference('x:g.h').conceptId,g.resolveReference('x:part.whole').conceptId);}
  assert.deepEqual(compact.terms.map(t=>[t.id,t.conceptId]),explicit.terms.map(t=>[t.id,t.conceptId]));
  assert.equal(expand(base+'(a:c.d).x::part.whole').identities.length,1);
});
test('unsupported reference placements do not silently invent additional sugar',()=>{
  for(const source of [base+'(a:c.d).(x:g.h)!part.whole',base+'a.b::(a:c.d).(x:g.h)',base+'(a:(b:c.d).x).(a:c.d)::.'])assert(!interpret(source).valid,source);
});
test('identity is symmetric, transitive and independent of spelling and context orientation',()=>{
  const g=interpret('a.b::c.d\nx.y::g.h\nm.n::p.q\n(a:c.d).(x:g.h)::.\n(m:p.q).(x:h.g)::.');
  assert(g.valid);assert.equal(g.resolveReference('a:c.d').conceptId,g.resolveReference('m:q.p').conceptId);
  const refs=['a:c.d','x:g.h','m:p.q'];for(const ref of refs)assert(g.resolveReference(ref));
  assert(!g.resolveReference('missing:c.d'));assert(!g.resolveReference('a:g.h'));
});
test('unresolved identities remain explicit and do not manufacture declarations',()=>{
  const g=interpret('(a:c.d).(x:g.h)::.');assert(g.valid);assert.equal(g.terms.length,0);assert.equal(g.identities[0].resolved,false);assert.equal(g.diagnostics.length,2);
});
test('identity-aware collision detection compares concepts without rejecting syntax',()=>{
  const source='a.b::c.d\nx.y!c.d\n(a:c.d).(x:c.d)::.\n(b:c.d).(y:c.d)::.';
  const g=interpret(source);assert(g.valid);assert(g.collisions.some(c=>c.kind==='contradiction'));
  const swapped=interpret('a.b::c.d\nx.y::d.c\n(a:c.d).(x:c.d)::.\n(b:c.d).(y:c.d)::.');assert(swapped.collisions.some(c=>c.kind==='entanglement'));
  assert.equal(interpret('alice.bob::person.person\nbob.alice::person.person').collisions.length,0);
});
test('cycles and all authored mirrored occurrences remain available',()=>{
  const g=interpret('a.b::c.d\nb.a::d.c\nc.d::a.b');assert(g.valid);assert.equal(g.judgments.length,3);
  const diamond=interpret('a.b::c.d::e.f\na.b::g.h::e.f');assert.equal(diamond.terms.filter(t=>t.reference==='a:e.f').length,1);
});
test('all document and reference examples in the finalized core and sugar parse',()=>{
  for(const file of ['core.md','sugar.md']){
    const source=readFileSync(new URL('../docs/'+file,import.meta.url),'utf8');
    for(const match of source.matchAll(/```abstract\n([\s\S]*?)```/g)){
      const sample=match[1].trim();if(!/::|!/.test(sample)&&sample.includes(':'))assert.equal(parseReference(sample).diagnostics.length,0,sample);
      else assert.equal(parse(sample).diagnostics.length,0,sample);
    }
  }
});
test('malformed editor input recovers with stable UTF-16 ranges',()=>{
  let seed=417;const alphabet='ab.c:!@`={}[]/ \n\t"\'#012';
  for(let sample=0;sample<250;sample++){let text='';for(let i=0;i<90;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;text+=alphabet[seed%alphabet.length];}const document=parse(text);assert.equal(print(document),text);assert.doesNotThrow(()=>interpret(document));}
});

test('core whitespace remains valid when optional sugar is enabled',()=>{
  const source='a.b::c.d\n    x.y::g.h\n  (a:c.d).(x:g.h)::.';
  assert.equal(parse(source).diagnostics.length,0);assert.equal(parse(source,{syntax:'core'}).diagnostics.length,0);
  assert(parseReference('a:\nc.d').diagnostics.length);assert(!interpret('a.b::c.d\r').valid);
});

test('referenced endpoints compose with shared-word and repeated-abstraction sugar',()=>{
  const prefix='engine.car::part.whole\n';
  for(const source of ['car.\n  (engine:part.whole)::whole.part','car\n  .(engine:part.whole)::whole.part']){
    const result=expand(prefix+source);assert(result.complete,JSON.stringify(result.diagnostics));assert.match(result.text,/car.engine::whole.part/);
    const g=interpret(result.document);assert.equal(g.resolveReference('engine:part.whole').conceptId,g.resolveReference('engine:whole.part').conceptId);
  }
  const result=expand('bob.rob::.brother\n(bob:.brother).rob::.sibling');assert(result.complete);assert.match(result.text,/\(bob:brother.brother\).\(bob:sibling.sibling\)::\./);
});

test('source locators preserve filename punctuation and Windows drive paths',()=>{
  assert.equal(resolveSourceUri('parts#?%.abstract','file:///project/main.abstract'),'file:///project/parts%23%3F%25.abstract');
  assert.equal(resolveSourceUri('C:\\parts\\api.abstract','file:///C:/project/main.abstract'),'file:///C:/parts/api.abstract');
  assert.equal(resolveSourceUri('parts\\api.abstract','file:///C:/project/main.abstract'),'file:///C:/project/parts/api.abstract');
});
