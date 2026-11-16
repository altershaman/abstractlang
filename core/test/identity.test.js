import {test} from 'node:test';
import assert from 'node:assert/strict';
import {interpret,expand,parse} from '../src/index.js';
const claims='a.b::c.d\na.b::e.f\na.b::g.h\n';
const id=(g,r)=>g.resolveReference(r)?.conceptId;
test('same words coincide, detach independently and explicitly rejoin without losing addresses',()=>{
 const initial=interpret(claims);assert.equal(id(initial,'a:c.d'),id(initial,'a:e.f'));
 const split=interpret(claims+'(a:c.d)!.\n(a:e.f)!.');assert.equal(split.detachments.length,2);
 assert.equal(new Set(['a:c.d','a:e.f','a:g.h'].map(r=>id(split,r))).size,3);
 const joined=interpret(claims+'(a:c.d)!.\n(a:e.f)!.\n(a:c.d).(a:e.f)::.');assert.equal(id(joined,'a:c.d'),id(joined,'a:e.f'));assert.notEqual(id(joined,'a:c.d'),id(joined,'a:g.h'));assert.equal(joined.collisions.length,0);
 const reordered=interpret('(a:c.d).(a:e.f)::.\n(a:e.f)!.\n'+claims+'(a:c.d)!.');assert.equal(id(reordered,'a:c.d'),id(reordered,'a:e.f'));assert.notEqual(id(reordered,'a:c.d'),id(reordered,'a:g.h'));
});
test('bare equality declares default synonyms; distinctness is explicit and nontransitive',()=>{
 const synonyms=interpret('a.b::.');assert(synonyms.valid);assert.equal(id(synonyms,'a'),id(synonyms,'b'));
 const g=interpret('a.b::.\nb.c!.\na.c!.');assert(g.valid);assert.equal(g.collisions.length,0);
 const conflict=interpret('a.b::.\na.b!.');assert(conflict.valid);assert(conflict.collisions.some(c=>c.kind==='identity'));
 const contextual=interpret(claims+'(a:c.d).(a:e.f)!.');assert.notEqual(id(contextual,'a:c.d'),id(contextual,'a:e.f'));
 assert(interpret(claims+'(a:c.d).(a:d.c)!.').collisions.some(c=>c.kind==='identity'));
});
test('GLOBAL words have one address across diamond roots and remain separate from path counting',()=>{
 const g=interpret('a.b::c.d\ne.f::c.d\nc.d::j.k\na.b::g.h\ng.h::i.m\ng.h::n.o\ni.m::p.q\nn.o::p.q');
 assert(g.valid);assert.equal(g.terms.filter(t=>t.word==='p'&&t.contextId==='GLOBAL').length,1);assert.equal(g.terms.filter(t=>t.word==='q'&&t.contextId==='GLOBAL').length,1);
 assert.equal(g.terms.filter(t=>t.word==='j'&&t.contextId==='GLOBAL').length,1);
 assert(g.resolveReference('a:p.q'));assert.equal(g.resolveReference('p').contextId,'GLOBAL');
 assert(!g.resolveReference('p:p.q'));
});
test('unresolved detachment warns, new markers expand faithfully and aliases remain unsupported',()=>{
 const g=interpret('(a:missing.context)!.');assert(g.valid);assert(g.diagnostics.some(d=>d.code==='unresolved-context-reference'));assert.equal(g.terms.length,0);
 const source=claims+'(a:c.d)!.\na.b::.\n(a:c.d).(a:e.f)!.';
 const expanded=expand(source);assert(expanded.complete);assert.equal(expanded.text,source.trim());assert.equal(interpret(expanded.text).distinctions.length,1);
 for(const s of ['(a:c.d)! .','a!.','(a:c.d)!.alias','a.b:: .'])assert(parse(s).diagnostics.length,s);
 assert.equal(interpret('a.b::.antonyms').judgments.length,1);
});
