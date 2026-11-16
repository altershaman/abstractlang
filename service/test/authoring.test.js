import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLanguageService} from '../src/service.js';
import {interpret} from '@abstractlang/core';
const uri='memory:/main.abstract',setup=source=>createLanguageService(new Map([[uri,source]]));
const apply=(source,p)=>source.slice(0,p.edit.range.start.offset)+p.edit.newText+source.slice(p.edit.range.end.offset);

test('a term action appends unary detachment and separates default-coinciding contextual identities',()=>{
 const source='a.b::c.d\na.b::e.f',service=setup(source),actions=service.detachmentActions(uri,0);
 assert.equal(actions.length,1);assert.equal(actions[0].title,'Detach contextual term: a:c.d');
 assert.equal(actions[0].statement,'(a:c.d)!.');assert.equal(service.graphs.get(uri).detachments.length,0);
 const result=apply(source,actions[0]),graph=interpret(result);assert(graph.valid);
 assert.equal(graph.detachments.length,1);assert(graph.detachments[0].resolved);
 assert.notEqual(graph.resolveReference('a:c.d').conceptId,graph.resolveReference('a:e.f').conceptId);
 assert(result.endsWith('\n\n(a:c.d)!.\n'));
});

test('already detached terms, GLOBAL words, comments and punctuation have no detachment action',()=>{
 const source='a.b::c.d\na.b::e.f\n(a:c.d)!.\n// a';const service=setup(source);
 assert.deepEqual(service.detachmentActions(uri,0),[]);
 assert.deepEqual(service.detachmentActions(uri,{line:0,character:5}),[]);
 assert.deepEqual(service.detachmentActions(uri,{line:3,character:3}),[]);
 assert.deepEqual(service.detachmentActions(uri,1),[]);
 const distinct=setup('a.b::c.d\na.b::e.f\n(a:c.d).(a:e.f)!.');assert.deepEqual(distinct.detachmentActions(uri,0),[]);
});

test('shared headers offer explicitly named choices for their contextual readings',()=>{
 const service=setup('a\n    .b::c.d\n    .b::e.f');
 assert.deepEqual(service.detachmentActions(uri,0).map(p=>p.statement).sort(),['(a:c.d)!.','(a:e.f)!.']);
});

test('detachment remains distinct from undoing explicit equality',()=>{
 const source='a.b::c.d\na.b::e.f\n(a:c.d).(a:e.f)::.';const action=setup(source).detachmentActions(uri,0)[0];
 const graph=interpret(apply(source,action));assert(graph.valid);assert(graph.resolveReference('a:c.d').detached);
 assert.equal(graph.resolveReference('a:c.d').conceptId,graph.resolveReference('a:e.f').conceptId);
});

test('CRLF and foreign declarations are preserved; only the active buffer receives the proposed edit',()=>{
 const foreign='memory:/parts.abstract',foreignSource='a.b::c.d';
 const source="@parts.path:'parts.abstract'\r\n(a:c.d).(a:c.d)::.\r\n";
 const service=createLanguageService(new Map([[uri,source],[foreign,foreignSource]]));
 const action=service.detachmentActions(uri,{line:1,character:1})[0];assert(action);
 assert.equal(action.statement,'(a:c.d)!.');assert(action.edit.newText.endsWith('!.\r\n'));
 assert.equal(action.edit.range.start.line,2);assert(!action.edit.newText.replaceAll('\r\n','').includes('\n'));
 assert.equal(service.graphs.get(uri).documents.find(d=>d.uri===foreign).document.source,foreignSource);
});
