import {test} from 'node:test';
import assert from 'node:assert/strict';
import {interpret} from '../src/interpretation.js';
import {parseContextDocument,parseContextReference} from '../src/parser.js';

test('contextual terms coincide by default and retain distinct addresses',()=>{
  const g=interpret('engine.car::part.whole\nengine.car::unit.machine');assert(g.valid);
  const a=g.resolveReference('engine:part.whole'),b=g.resolveReference('engine:unit.machine');assert(a&&b);assert.equal(a.conceptId,b.conceptId);
  assert.equal(g.resolveReference('engine:whole.part').id,a.id);
  const merged=interpret('engine.car::part.whole\nengine.car::unit.machine\n(engine:part.whole).(engine:unit.machine)::.');assert(merged.valid);assert.equal(merged.resolveReference('engine:part.whole').conceptId,merged.resolveReference('engine:unit.machine').conceptId);
});
test('diamond descendants share selected context without conflating intermediate scopes',()=>{
  const g=interpret('a.b::c.d::e.f\na.b::g.h::e.f');assert(g.valid);
  assert(g.resolveReference('a:e.f'));assert.equal(g.resolveReference('a:c.d').conceptId,g.resolveReference('a:g.h').conceptId);
  assert.equal(g.judgments.length,4);assert.equal(g.terms.filter(t=>t.reference==='a:e.f').length,1);
});
test('collisions are findings and cycles are permitted',()=>{
  const contradiction=interpret('a.b::c.d\nb.a!d.c');assert(contradiction.valid);assert(contradiction.collisions.some(c=>c.kind==='contradiction'));
  const entangled=interpret('a.b::c.d\na.b::d.c');assert(entangled.valid);assert(entangled.collisions.some(c=>c.kind==='entanglement'));
  assert(interpret('a.b::c.d\nc.d::a.b').valid);
  assert.equal(interpret('alice.bob::.person').collisions.length,0);
});
test('indentation and shorthand expand with source ranges',()=>{
  for(const source of ['car\n\t.engine::whole.part\n\t.wheel::whole.part','car.\n  engine::whole.part\n  wheel::whole.part','car.engine\ncar.wheel\n  ::whole.part']){const g=interpret(source);assert(g.valid,JSON.stringify(g.diagnostics));assert.equal(g.judgments.length,2);}
  const shorthand=interpret('bob.rob::.brother');assert(shorthand.valid);assert(shorthand.resolveReference('bob:brother.brother'));
  const unicode=interpret('发动机.车::部件.整体\r\n');assert.equal(unicode.occurrences[0].range.end.character,3);
});
test('malformed references and statements produce diagnostics rather than throw',()=>{
  for(const source of ['x:part.whole','a.b::','a.b::.','(a:c.d).b::.','a.b::c.d\n  (a:c.d).(b:c.d)::.','a.b::c.d\n@invalid','car\n .engine','a.b::c.d\n  ?'])assert.doesNotThrow(()=>parseContextDocument(source));
  assert(parseContextDocument('a:c.d').diagnostics.length);assert(parseContextReference('a:c.d').reference);assert(parseContextReference('a:c.d trailing').diagnostics.length);
});
test('sources are nonrecursive and missing sources retain local judgments',()=>{
  const source="@parts.path:'parts.abstract'\nlocal.main::part.whole";
  const g=interpret(source,{sourceRegistrations:true,uri:'file:///test/main.abstract',resolveFile:uri=>uri.endsWith('/parts.abstract')?{source:"@nested.path:'never.abstract'\nengine.car::part.whole"}:undefined});
  assert(g.valid);assert.equal(g.documents.length,2);assert.equal(g.judgments.length,2);assert(g.resolveReference('engine:part.whole@parts'));assert(!g.resolveReference('engine:part.whole@absent'));
  const missing=interpret(source,{sourceRegistrations:true});assert(missing.valid);assert.equal(missing.judgments.length,1);assert.equal(missing.diagnostics[0].code,'missing-source');
});
test('identity marker is atomic, comments follow tokens and source aliases are unambiguous',()=>{
  assert(!interpret('(a:c.d).(b:c.d):: .').valid);assert(interpret('a.b::c.d// comment').valid);
  const duplicates=interpret("@parts.path:'one.abstract'\n@parts.path:'two.abstract'\na.b::c.d",{sourceRegistrations:true});assert(duplicates.diagnostics.some(d=>d.code==='duplicate-source-alias'));
  const calls=[];interpret("@parts.path:'parts#?%.abstract'",{sourceRegistrations:true,uri:'file:///tmp/main.abstract',resolveFile:uri=>{calls.push(uri);return {source:'a.b::c.d'};}});assert.equal(calls[0],'file:///tmp/parts%23%3F%25.abstract');
  const transitive=interpret('a.b::c.d::e.f\na.b!e.f');assert(transitive.collisions.some(c=>c.kind==='contradiction'));
});
