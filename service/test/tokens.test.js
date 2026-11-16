import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parse,interpret} from '@abstractlang/core';
import {semanticTokens} from '../src/tokens.js';
const tokens=source=>semanticTokens(parse(source,{sourceRegistrations:true})).map(t=>({...t,text:source.slice(t.range.start.offset,t.range.end.offset)}));

test('terms, dots and judgment operators are separate, nonoverlapping tokens',()=>{
 const ts=tokens('engine.car::part.whole\nengine.car!part.whole // engine.car::part.whole');
 assert.deepEqual(ts.slice(0,7).map(t=>[t.text,t.type,t.modifiers]),[
  ['engine','term',['concretization']],['.','dot',[]],['car','term',['concretization']],['::','doubleColon',[]],
  ['part','term',['abstraction','rootAbstraction']],['.','dot',[]],['whole','term',['abstraction','rootAbstraction']]]);
 assert.equal(ts.length,15);assert.equal(ts.at(-1).type,'comment');assert.equal(ts[10].type,'bang');
 for(let i=1;i<ts.length;i++)assert(ts[i].range.start.offset>=ts[i-1].range.end.offset);
});

test('chains merge both roles at the same written term; indentation preserves roles',()=>{
 const chain=tokens('a.b::c.d::e.f');assert.deepEqual(chain.find(t=>t.text==='c').modifiers,['concretization','abstraction']);
 for(const source of ['a.b::\n    c.d','a.b\n    ::c.d','a\n    .b::c.d']){
  const ts=tokens(source);assert(ts.find(t=>t.text==='a').modifiers.includes('concretization'));
  assert(ts.find(t=>t.text==='c').modifiers.includes('abstraction'));
 }
});

test('explicit contexts, equality, distinction and detachment retain their written punctuation',()=>{
 const source='(a:c.d).(b:e.f)::g.h\n(a:c.d).(b:e.f)::.\n(a:c.d)!.\n(a:c.d).(b:e.f)!.';
 const ts=tokens(source);assert.deepEqual(ts[0].modifiers,['concretization','reference']);
 assert.deepEqual(ts.find(t=>t.text==='c').modifiers,['abstraction','reference']);
 assert.equal(ts.filter(t=>t.type==='colon').length,7);
 assert.equal(ts.filter(t=>t.type==='bang').length,2);
 assert.equal(ts.filter(t=>t.type==='doubleColon').length,2);
});

test('Unicode, UTF-16 and CRLF positions survive; comments are whole tokens; paths and quoted data stay unclassified',()=>{
 const source="// fake.a::b.c\r\n𐐀.á::часть.целое\r\n@ext.path:'a.b::c.d'\r\nx.y:: // editing";
 const all=tokens(source);assert.equal(all.filter(t=>t.type==='comment').length,2);const ts=all.filter(t=>t.type!=='comment');assert.equal(ts[0].text,'𐐀');assert.equal(ts[0].range.start.line,1);assert.equal(ts[0].range.end.character,2);
 assert.equal(ts[1].range.start.character,2);assert.equal(ts[2].text,'á');
 assert(ts.every(t=>[1,3].includes(t.range.start.line)));assert.equal(ts.at(-1).type,'doubleColon');
 assert.deepEqual(semanticTokens(parse('')),[]);
});


test('comments include their text once without classifying embedded Abstract syntax',()=>{
 const ts=tokens('a.b::c.d // a.b!c.d\n// (x:c.d)!.\n@ext.path:\'https://example.com/a.abstract\'');
 const comments=ts.filter(t=>t.type==='comment');assert.equal(comments.length,2);
 assert.equal(comments[0].text,'// a.b!c.d');assert.deepEqual(comments[0].modifiers,[]);
 assert.equal(ts.filter(t=>t.type==='term').length,4);
 assert(comments.every(t=>t.range.start.line===t.range.end.line));
});


test('reference context words have abstraction roles in detachment and identity expressions',()=>{
 for(const source of ['(a:c.d)!.','(a:c.d).(b:e.f)::.']){
  const ts=tokens(source);
  for(const word of ['c','d'])assert.deepEqual(ts.find(t=>t.text===word).modifiers,['abstraction','reference']);
  assert.deepEqual(ts.find(t=>t.text==='a').modifiers,['reference']);
 }
});


test('root abstractions are terminal positive relations, not words globally',()=>{
 const ts=tokens('a.b::c.d::e.f\nx.y::c.z\na.b!g.h\n(a:e.f)!.');
 assert(ts.filter(t=>['e','f'].includes(t.text)).every(t=>t.modifiers.includes('rootAbstraction')));
 assert(!ts.find(t=>t.text==='c').modifiers.includes('rootAbstraction'));
 assert(!ts.find(t=>t.text==='g').modifiers.includes('rootAbstraction'));
 assert(ts.find(t=>t.text==='z').modifiers.includes('rootAbstraction'));
 const reversed=tokens('a.b::c.d\nd.c::e.f');assert(!reversed.find(t=>t.text==='c').modifiers.includes('rootAbstraction'));
 const cyclic=tokens('a.b::c.d\nc.d::a.b');assert(!cyclic.some(t=>t.modifiers.includes('rootAbstraction')));
});

test('included sources can extend a locally terminal abstraction',()=>{
 const uri='memory:/main.abstract',foreign='memory:/parts.abstract',source="@parts.path:'parts.abstract'\na.b::c.d";
 const graph=interpret(source,{uri,sourceRegistrations:true,resolveFile:(_uri,{read}={})=>read?{source:'c.d::e.f'}:{}});
 const local=semanticTokens(graph.documents[0].document,{graph});assert(!local.some(t=>t.modifiers.includes('rootAbstraction')));
 const imported=semanticTokens(graph.documents.find(d=>d.uri===foreign).document,{graph});
 assert.equal(imported.filter(t=>t.modifiers.includes('rootAbstraction')).length,2);
});
