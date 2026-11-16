import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLanguageService} from '../src/service.js';
const uri='memory:/main.abstract';
const base='engine.car::part.whole\nwheel.car::part.whole\nengine.car::unit.machine\n';
function complete(tail){const source=base+tail,service=createLanguageService(new Map([[uri,source]]));return {source,service,items:service.completions(uri,source.length)};}
function apply(source,item){return source.slice(0,item.range.start.offset)+item.insertText+source.slice(item.range.end.offset);}

test('second-endpoint completion ranks observed pairings and replaces only the partial word',()=>{
 const {source,items}=complete('engine.ca');assert.equal(items[0].label,'car');
 assert.equal(apply(source,items[0]),base+'engine.car');
 assert.equal(complete('engine.').items[0].label,'car');
 assert(complete('new_word.').items.some(i=>i.label==='car'));
});

test('abstraction completion inserts complete relations and preserves the concrete side',()=>{
 const {source,items}=complete('engine.car::pa');const item=items.find(i=>i.label==='part.whole');
 assert(item);assert.equal(item.kind,'relation');assert.equal(apply(source,item),base+'engine.car::part.whole');
 assert(complete('engine.car::').items.slice(0,2).every(i=>['part.whole','unit.machine'].includes(i.label)));
 assert(complete('engine.car!').items.some(i=>i.label==='part.whole'));
});

test('context completion selects only available contexts and does not insert an identity assertion',()=>{
 const {source,items,service}=complete('(engine:pa');assert.equal(items.length,1);assert.equal(items[0].label,'engine:part.whole');
 assert.equal(apply(source,items[0]),base+'(engine:part.whole');
 assert.equal(service.graphs.get(uri).identities.length,0);
 assert.equal(complete('(missing:').items.length,0);
});

test('word and relation proposals include provenance; comments, source paths and identity markers stay untouched',()=>{
 const {source,items}=complete('eng');assert(items.some(i=>i.label==='engine'));assert(items.some(i=>i.label==='engine.car'));
 assert(items.every(i=>i.locations.length&&i.detail.includes('memory:/main.abstract')));
 assert(items.every(i=>apply(source,i).startsWith(base)));
 for(const tail of ['// engine.','@external.path:\'parts.abstract\'','engine.motor::.','(engine:part.whole)!.'])assert.deepEqual(complete(tail).items,[]);
});

test('included vocabulary participates and Unicode edits use UTF-16 ranges',()=>{
 const foreign='memory:/parts.abstract',source="@parts.path:'parts.abstract'\n𐐀.";
 const service=createLanguageService(new Map([[uri,source],[foreign,'𐐀.β::c.d']]));
 const items=service.completions(uri,source.length);assert.equal(items[0].label,'β');assert.equal(items[0].range.start.character,3);
 assert(items[0].locations.some(l=>l.uri===foreign));
});
