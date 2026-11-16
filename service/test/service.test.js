import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLanguageService} from '../src/service.js';

test('supplied snapshots provide analysis and contextual navigation without discovery',()=>{
 const uri='memory:/main.abstract',source='a.b::c.d\na.b::e.f\n(a:c.d)!.';
 const service=createLanguageService(new Map([[uri,source],['memory:/note.md','a.b::x.y']]));
 assert.equal(service.graphs.size,1);assert.equal(service.diagnostics.get(uri).length,0);
 const item=service.at(uri,{line:0,character:0});assert.match(service.hover(item),/a:c.d/);
 assert.equal(service.locations(item,{definitions:true})[0].uri,uri);
 assert(service.locations(item).length>1);
 assert.equal(service.at('memory:/note.md',0),null);
 const graph=service.graphs.get(uri);assert.notEqual(graph.resolveReference('a:c.d').conceptId,graph.resolveReference('a:e.f').conceptId);
});

test('imports use supplied resolution, unsaved snapshots win, diagnostics retain foreign URIs',()=>{
 const uri='memory:/main.abstract',external='memory:/parts.abstract';let reads=0;
 const source="@parts.path:'parts.abstract'\na.b::c.d";
 const service=createLanguageService(new Map([[uri,source],[external,'x.y::c.d']]),{resolveFile:()=>{reads++;throw Error('Unexpected external access');}});
 assert.equal(reads,0);assert(service.graphs.get(uri).documents.some(d=>d.uri===external));
 assert(service.at(external,0));
 const bad=createLanguageService(new Map([[uri,source]]),{resolveFile:(_uri,{read}={})=>read?{source:'x.y::'}:{}});
 assert(bad.diagnostics.get(external).some(d=>d.severity==='error'));
 const missing=createLanguageService(new Map([[uri,source]]));assert(missing.graphs.get(uri).terms.some(t=>t.word==='a'));assert(missing.diagnostics.get(uri).length);
});

test('services rebuild explicitly and collect findings without rejecting collisions',()=>{
 const uri='untitled:one',options={languageIds:new Map([[uri,'abstract']])};
 const first=createLanguageService(new Map([[uri,'a.b::c.d\na.b!c.d']]),options);
 assert(first.graphs.get(uri).collisions.length);assert(first.graphs.get(uri).valid);
 const next=createLanguageService(new Map([[uri,'a.b::']]),options);assert(next.diagnostics.get(uri).some(d=>d.severity==='error'));
 assert(first.graphs.get(uri).valid);assert.equal(createLanguageService().graphs.size,0);
});


test('collision findings become warnings at every witness, including imported sources',()=>{
 const uri='memory:/main.abstract',foreign='memory:/parts.abstract';
 const direct=createLanguageService(new Map([[uri,'a.b::c.d\na.b!c.d']]));
 assert.deepEqual(direct.diagnostics.get(uri).filter(d=>d.code==='contradiction').map(d=>d.range.start.line),[0,1]);
 assert(direct.diagnostics.get(uri).every(d=>d.severity==='warning'));assert(direct.graphs.get(uri).valid);
 const indirect=createLanguageService(new Map([[uri,'a.b::c.d::e.f\na.b!e.f']]));
 assert(indirect.diagnostics.get(uri).some(d=>d.code==='contradiction'));
 const tangled=createLanguageService(new Map([[uri,'a.b::c.d\na.b::d.c']]));
 assert.equal(tangled.diagnostics.get(uri).filter(d=>d.code==='entanglement').length,2);
 const imported=createLanguageService(new Map([[uri,"@parts.path:'parts.abstract'\na.b::c.d"],[foreign,'a.b!c.d']]));
 for(const target of [uri,foreign]){
  const findings=imported.diagnostics.get(target).filter(d=>d.code==='contradiction');assert.equal(findings.length,1);
  assert(findings[0].relatedInformation.some(r=>r.location.uri!==target));
 }
 const fixed=createLanguageService(new Map([[uri,'a.b::c.d']]));assert.deepEqual(fixed.diagnostics.get(uri),[]);
});


test('host adapters can supply native interpretations without reparsing or filesystem access',async()=>{
 const {createInterpretationService}=await import('../src/service.js');const {interpret}=await import('@abstractlang/core');
 const uri='memory:/host.abstract',graph=interpret('a.b::c.d\na.b!c.d',{uri});
 const service=createInterpretationService(new Map([[uri,graph]]));assert.equal(service.graphFor(uri),graph);
 assert(service.diagnostics.get(uri).some(d=>d.code==='contradiction'));
 assert(service.highlights(uri,0).length);assert(service.hierarchy(uri,1));assert.equal(createInterpretationService().graphs.size,0);
});
