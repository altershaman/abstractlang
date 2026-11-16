import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLanguageService} from '../src/service.js';
const uri='memory:/main.abstract';
const setup=source=>createLanguageService(new Map([[uri,source]]));
const slices=(source,ranges)=>ranges.map(r=>source.slice(r.start.offset,r.end.offset));

test('dot selects whole relations by both endpoint identities, including reversal',()=>{
 const source='engine.car::part.whole\nmotor.vehicle::unit.machine\nvehicle.motor::unit.machine\nmotor.boat::unit.machine\nengine.motor::.\ncar.vehicle::.\n// engine.car';
 const service=setup(source);
 assert.deepEqual(slices(source,service.highlights(uri,{line:0,character:6})),['engine.car','motor.vehicle','vehicle.motor']);
 assert.deepEqual(slices(source,service.highlights(uri,{line:1,character:5})),['engine.car','motor.vehicle','vehicle.motor']);
 assert.deepEqual(service.highlights(uri,{line:6,character:9}),[]);
 assert.deepEqual(service.highlights(uri,{line:4,character:6}),[]);
 assert.deepEqual(service.highlights(uri,{line:4,character:14}),[]);
});

test('relation highlighting respects contextual detachment and explicit identity repair',()=>{
 const source='a.b::c.d\na.b::e.f\n(a:c.d)!.';
 assert.deepEqual(slices(source,setup(source).highlights(uri,1)),['a.b']);
 const joined=source+'\n(a:c.d).(a:e.f)::.';
 assert.deepEqual(slices(joined,setup(joined).highlights(uri,1)),['a.b','a.b']);
});

test('abstraction relations match concrete occurrences and explicit reference contexts',()=>{
 const source='a.b::c.d\nc.d::e.f\n(a:c.d)!.';
 const service=setup(source);
 assert.deepEqual(slices(source,service.highlights(uri,{line:0,character:6})),['c.d','c.d','c.d']);
 assert.deepEqual(slices(source,service.highlights(uri,{line:2,character:4})),['c.d','c.d','c.d']);
});

test('qualified endpoints keep their complete authored relation span',()=>{
 const source='a.b::c.d\n(a:c.d).(b:c.d)::e.f';
 assert.deepEqual(slices(source,setup(source).highlights(uri,1)),['a.b','(a:c.d).(b:c.d)']);
});

test('shared-concept dots select their written fragments; repeated abstractions work',()=>{
 const leading='car\n    .engine::whole.part\n    .wheel::whole.part\ncar.engine::whole.part';
 assert.deepEqual(slices(leading,setup(leading).highlights(uri,{line:1,character:4})),['car','.engine','car.engine']);
 const trailing='car.\n    engine::whole.part\n    wheel::whole.part';
 assert.deepEqual(slices(trailing,setup(trailing).highlights(uri,{line:0,character:3})),['car.','engine','wheel']);
 const repeated='bob.rob::.brother\nalice.dave::brother.brother';
 assert.deepEqual(slices(repeated,setup(repeated).highlights(uri,{line:0,character:9})),['.brother','brother.brother']);
});

test('included judgments can establish endpoint identity without highlighting foreign ranges',()=>{
 const foreign='memory:/parts.abstract';
 const source="@parts.path:'parts.abstract'\nengine.car::part.whole\nmotor.vehicle::unit.machine";
 const service=createLanguageService(new Map([[uri,source],[foreign,'engine.motor::.\ncar.vehicle::.']]));
 assert.deepEqual(slices(source,service.highlights(uri,{line:1,character:6})),['engine.car','motor.vehicle']);
});
