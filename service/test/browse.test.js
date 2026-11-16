import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLanguageService} from '../src/service.js';
import {formatHierarchy,hoverContent,sourceLink} from '../src/hierarchy.js';
const uri='file:///tmp/browse.abstract';
const setup=source=>createLanguageService(new Map([[uri,source]]));
const labels=items=>items.map(i=>i.label).sort();
const branch='a.b::c.d\nx.y::c.d\nc.d::e.f\nc.d::g.h\ng.h::e.f\nu.v::a.b\nz.w!c.d';

test('relation neighborhoods keep direct children, multiple parents, finite ancestors and grouped siblings',()=>{
 const service=setup(branch),summary=service.hierarchy(uri,{line:0,character:1});
 assert.equal(summary.kind,'relation');assert.deepEqual(labels(summary.parents),['c.d']);
 assert.deepEqual(labels(summary.children),['u.v']);assert.deepEqual(labels(summary.ancestors),['c.d','e.f','g.h']);
 assert.equal(summary.ancestors.find(i=>i.label==='e.f').distance,2);
 assert.deepEqual(summary.siblings.map(g=>[g.parent.label,labels(g.items)]),[['c.d',['x.y']]]);
 const parent=service.hierarchy(uri,{line:0,character:6});assert.deepEqual(labels(parent.parents),['e.f','g.h']);
 assert.deepEqual(labels(parent.children),['a.b','x.y']);
 assert.equal(parent.negated.length,1);assert.equal(parent.negated[0].item.label,'z.w');assert.equal(parent.negated[0].direction,'child');
 assert(service.graphs.get(uri).valid);
});

test('term hierarchy follows endpoint correspondence rather than the other endpoint',()=>{
 const summary=setup(branch).hierarchy(uri,{line:0,character:0});
 assert.equal(summary.kind,'term');assert(summary.parents.every(i=>i.label.startsWith('c:')));
 assert(summary.children.some(i=>i.label.startsWith('u:')));assert(!summary.children.some(i=>i.label.startsWith('v:')));
 assert(summary.siblings[0].items.some(i=>i.label==='x:c.d'));assert(!summary.siblings[0].items.some(i=>i.label==='y:c.d'));
 const identity=setup(branch+'\n(a:c.d).(x:c.d)::.').hierarchy(uri,0);
 assert(identity.selected[0].labels.includes('x:c.d'));assert(!identity.siblings.some(g=>g.items.some(i=>i.label==='x:c.d')));
 const opposite=setup('a.b::c.d\nx.y::d.c').hierarchy(uri,0);
 assert(opposite.siblings.some(g=>g.items.some(i=>i.label==='y:c.d')));
 assert(!opposite.siblings.some(g=>g.items.some(i=>i.label==='x:c.d')));
});

test('cycles terminate, comments have no hierarchy and negated claims are not traversed',()=>{
 const source='a.b::c.d\nc.d::a.b\na.b!e.f\n// a.b';const service=setup(source);
 const summary=service.hierarchy(uri,1);assert.deepEqual(labels(summary.ancestors),['c.d']);
 assert(!summary.ancestors.some(i=>i.label==='a.b'||i.label==='e.f'));
 assert.equal(service.hierarchy(uri,{line:3,character:4}),null);
 assert.equal(service.hierarchy(uri,{line:0,character:3}),null);
});

test('included sources supply hierarchy and links without recursive discovery',()=>{
 const foreign='file:///tmp/parts.abstract',source="@parts.path:'parts.abstract'\na.b::c.d";
 const service=createLanguageService(new Map([[uri,source],[foreign,'c.d::e.f\nx.y::c.d']]));
 const summary=service.hierarchy(uri,{line:1,character:1});
 assert(summary.ancestors.some(i=>i.label==='e.f'));assert(summary.siblings[0].items.some(i=>i.label==='x.y'));
 const rendered=formatHierarchy(summary,{markdown:true});assert.match(rendered,/file:\/\/\/tmp\/parts.abstract#L/);
 assert.match(rendered,/Ancestors \(indirect\)/);
});

test('hover source links preserve locations, escape supplied text and bound display without losing query results',()=>{
 const location={uri:'file:///tmp/a%20(b).abstract',range:{start:{line:3,character:4},end:{line:3,character:5}}};
 assert.equal(sourceLink(location),'file:///tmp/a%20%28b%29.abstract#L4,5');
 assert.equal(sourceLink({...location,uri:'command:unsafe'}),null);
 const summary=setup(branch).hierarchy(uri,1);
 const rendered=hoverContent('[unsafe](command:bad)',summary,{markdown:true});
 assert.match(rendered,/\\\[unsafe\\\]/);assert(!rendered.startsWith('[unsafe]'));
 assert(formatHierarchy(summary,{limit:0}).includes('more'));assert.equal(summary.parents.length,1);
 const plain=formatHierarchy(summary);assert(!plain.includes(']('));assert(plain.includes(uri));
});


test('relation queries keep detached contextual readings separate and merge explicit endpoint aliases',()=>{
 const source='a.b::c.d\na.b::e.f\n(a:c.d)!.';
 const service=setup(source);
 assert.deepEqual(labels(service.hierarchy(uri,1).parents),['c.d']);
 assert.deepEqual(labels(service.hierarchy(uri,{line:1,character:1}).parents),['e.f']);
 const same=setup('a.b::c.d\nx.y::e.f\na.x::.\nb.y::.').hierarchy(uri,1);
 assert.deepEqual(labels(same.parents),['c.d','e.f']);assert(same.selected[0].labels.includes('x.y'));
});
