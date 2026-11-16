import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLanguageService} from '../src/service.js';
const uri='memory:/main.abstract',setup=source=>createLanguageService(new Map([[uri,source]]));

test('same as lenses require authored equality between different words',()=>{
 assert.deepEqual(setup('a.b::c.d\na.b::e.f').sameAsLenses(uri),[]);
 assert.deepEqual(setup('a.b::c.d\na.b::e.f\n(a:c.d).(a:e.f)::.').sameAsLenses(uri),[]);
 const source='a.b::c.d\nx.y::g.h\n(a:c.d).(x:g.h)::.\n// a x';
 const lenses=setup(source).sameAsLenses(uri);
 assert.deepEqual(lenses.map(l=>l.title),['same as x:g.h','same as a:c.d']);
 assert(lenses.every(l=>l.range.start.line<2));
 assert(lenses.every(l=>l.location.uri===uri));
});

test('transitive equality participates while detached readings stay outside their unrelated groups',()=>{
 const source='a.b::c.d\nx.y::e.f\np.q::g.h\n(a:c.d).(x:e.f)::.\n(x:e.f).(p:g.h)::.';
 const lenses=setup(source).sameAsLenses(uri).filter(l=>l.range.start.line===0);
 assert.deepEqual(lenses.map(l=>l.title).sort(),['same as p:g.h','same as x:e.f']);
 const separate='a.b::c.d\na.b::e.f\nx.y::g.h\n(a:c.d)!.\n(a:c.d).(x:g.h)::.';
 assert(!setup(separate).sameAsLenses(uri).some(l=>l.range.start.line===1));
});

test('included aliases point to foreign declarations without creating foreign lens ranges',()=>{
 const foreign='memory:/parts.abstract',source="@parts.path:'parts.abstract'\na.b::c.d\n(a:c.d).(x:g.h)::.";
 const service=createLanguageService(new Map([[uri,source],[foreign,'x.y::g.h']]));
 const lenses=service.sameAsLenses(uri);assert.equal(lenses.length,1);
 assert.equal(lenses[0].title,'same as x:g.h');assert.equal(lenses[0].location.uri,foreign);
 assert.equal(lenses[0].range.start.line,1);
});


test('inline hints attach after each source word, group aliases and contain navigation rather than edits',()=>{
 const source='a.b::c.d\nx.y::e.f\np.q::g.h\n(a:c.d).(x:e.f)::.\n(x:e.f).(p:g.h)::.';
 const service=setup(source),before=service.graphs.get(uri).documents[0].document.source;
 const hints=service.sameAsHints(uri),hint=hints.find(h=>h.position.line===0);
 assert.equal(hint.position.character,1);assert.equal(hint.label[0].value,'(');
 assert.equal(hint.label.filter(p=>p.location).length,2);assert.equal(hint.label.map(p=>p.value).join(''),'(p, x)');assert(hint.label.find(p=>p.location).tooltip.includes(':'));assert(hint.paddingLeft&&hint.paddingRight);
 assert(!('textEdits' in hint));assert.equal(service.graphs.get(uri).documents[0].document.source,before);
 assert(hints.every(h=>h.position.line<3));
 const limited=service.sameAsHints(uri,{start:{line:1,character:0},end:{line:2,character:0}});
 assert.equal(limited.length,1);assert.equal(limited[0].position.line,1);
 assert.deepEqual(setup('a.b::c.d').sameAsHints(uri),[]);
});

test('hint positions use UTF-16 and navigate to included declarations',()=>{
 const foreign='memory:/parts.abstract',source="@parts.path:'parts.abstract'\n𐐀.b::c.d\n(𐐀:c.d).(x:e.f)::.";
 const service=createLanguageService(new Map([[uri,source],[foreign,'x.y::e.f']]));
 const hints=service.sameAsHints(uri);assert.equal(hints.length,1);assert.equal(hints[0].position.character,2);
 assert.equal(hints[0].label.find(p=>p.location).location.uri,foreign);
});


test('opening an included file keeps reciprocal aliases in its including interpretation, in either open order',()=>{
 const main="@parts.path:'parts.abstract'\na.b::c.d",foreign='memory:/parts.abstract',parts='x.y::e.f\n(a:c.d).(x:e.f)::.';
 for(const entries of [[[uri,main],[foreign,parts]],[[foreign,parts],[uri,main]]]){
  const service=createLanguageService(new Map(entries));
  assert.equal(service.graphFor(foreign).uri,uri);
  assert.equal(service.sameAsHints(uri)[0].label[1].value,'x');
  assert.equal(service.sameAsHints(foreign)[0].label[1].value,'a');
  assert(!service.diagnostics.get(foreign).some(d=>d.code==='unresolved-context-reference'));
  assert(service.highlights(foreign,0).length);
 }
 const alone=createLanguageService(new Map([[foreign,parts]]));
 assert.deepEqual(alone.sameAsHints(foreign),[]);
 assert(alone.diagnostics.get(foreign).some(d=>d.code==='unresolved-context-reference'));
});


test('detached hints select the assertion, stay contextual and coexist with explicit identity',()=>{
 const service=setup('a.b::c.d\na.b::e.f\nx.y::g.h\n(a:c.d)!.\n(a:c.d).(x:g.h)::.');
 const hints=service.sameAsHints(uri),detached=hints.filter(h=>h.label[0].value==='(detached)');
 assert.equal(detached.length,1);assert.equal(detached[0].position.line,0);assert.equal(detached[0].position.character,1);
 assert.equal(detached[0].label[0].location.range.start.line,3);
 assert(hints.some(h=>h.position.line===0&&h.label.map(p=>p.value).join('')==='(x)'));
 assert.deepEqual(service.sameAsHints(uri,{start:{line:1,character:0},end:{line:2,character:0}}),[]);
 const distinct=setup('a.b::c.d\na.b::e.f\n(a:c.d).(a:e.f)!.').sameAsHints(uri);
 assert.equal(distinct.length,2);assert(distinct.every(h=>h.label[0].value==='(detached)'&&h.label[0].location.range.start.line===2));
});
