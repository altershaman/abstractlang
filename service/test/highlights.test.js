import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLanguageService} from '../src/service.js';
const uri='memory:/main.abstract';
const setup=source=>createLanguageService(new Map([[uri,source]]));
const words=(source,ranges)=>ranges.map(r=>source.slice(r.start.offset,r.end.offset));

test('highlighting follows explicit synonym identity and excludes comments and nonrelation punctuation',()=>{
 const source='engine.car::part.whole\nmotor.vehicle::unit.machine\n(engine:part.whole).(motor:unit.machine)::.\n// engine, motor and part are words here';
 const service=setup(source),ranges=service.highlights(uri,{line:0,character:2});
 assert.deepEqual(words(source,ranges).sort(),['engine','engine','motor','motor']);
 assert(ranges.every(r=>r.start.line<3));
 assert.deepEqual(words(source,service.highlights(uri,{line:0,character:6})),['engine.car']);
 assert.deepEqual(service.highlights(uri,{line:2,character:7}),[]);
 assert.deepEqual(service.highlights(uri,{line:3,character:4}),[]);
 const context=service.highlights(uri,{line:2,character:9});
 assert.deepEqual(words(source,context),['part','part']);
 assert.equal(service.at(uri,{line:2,character:9}).graph.terms.find(t=>t.id===service.at(uri,{line:2,character:9}).termIds[0]).word,'part');
});

test('default coincidence, detachment and explicit distinction control the selected group',()=>{
 const source='a.b::c.d\na.b::e.f\na.b::g.h';
 assert.equal(setup(source).highlights(uri,0).length,3);
 const detached=source+'\n(a:c.d)!.';const separated=setup(detached);
 assert.deepEqual(separated.highlights(uri,0).map(r=>r.start.line),[0,3]);
 assert.deepEqual(separated.highlights(uri,{line:1,character:0}).map(r=>r.start.line),[1,2]);
 const distinct=source+'\n(a:c.d).(a:e.f)!.';const service=setup(distinct);
 assert.deepEqual(service.highlights(uri,{line:2,character:0}).map(r=>r.start.line),[2]);
 const joined=distinct+'\n(a:c.d).(a:e.f)::.';const equal=setup(joined);
 assert(words(joined,equal.highlights(uri,0)).every(w=>w==='a'));
 assert(!equal.highlights(uri,0).some(r=>r.start.line===2));
});

test('a term can be selected from either judgment side and root context references',()=>{
 const source='a.b::c.d\nc.d::e.f\n(c:e.f)!.';const service=setup(source);
 const first=service.highlights(uri,{line:0,character:5});
 assert.deepEqual(first.map(r=>r.start.line),[0,1,2]);
 assert.deepEqual(words(source,first),['c','c','c']);
});

test('references span included files, highlights stay in the requested document',()=>{
 const foreign='memory:/parts.abstract';
 const source="@parts.path:'parts.abstract'\nengine.car::part.whole\n(engine:part.whole).(motor:unit.machine)::.";
 const foreignSource='motor.vehicle::unit.machine\n// engine';
 const service=createLanguageService(new Map([[uri,source],[foreign,foreignSource]]));
 const item=service.at(uri,{line:1,character:0});
 assert(service.locations(item).some(l=>l.uri===foreign));
 assert(!service.locations(item,{includeDeclaration:false}).some(l=>l.uri===foreign));
 assert(service.highlights(uri,{line:1,character:0}).every(r=>r.start.line>0));
 assert.deepEqual(words(source,service.highlights(uri,{line:1,character:0})).sort(),['engine','engine','motor']);
 assert.deepEqual(service.highlights('memory:/note.md',0),[]);
});
