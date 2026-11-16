import {parseContextDocument,parseContextReference,termText} from './parser.js';

export const contextKey=pair=>JSON.stringify([pair.sourceTerm.name,pair.targetTerm.name].sort());
export const referenceKey=reference=>JSON.stringify([reference.word,contextKey(reference.context)]);
export function resolveSourceUri(path,base){
  if(/^[A-Za-z]:[\\/]/.test(path)){
    const normalized=path.replace(/\\/g,'/');
    return new URL('file:///'+normalized.slice(0,2)+normalized.slice(2).split('/').map(encodeURIComponent).join('/')).href;
  }
  const normalized=/^file:\/\/\/[A-Za-z]:\//i.test(base)?path.replace(/\\/g,'/'):path;
  return new URL(normalized.split('/').map(encodeURIComponent).join('/'),base).href;
}
const orientation=pair=>pair.sourceTerm.name>pair.targetTerm.name?1:0;
const diagonal=pair=>pair.sourceTerm.name===pair.targetTerm.name;
const locationKey=location=>JSON.stringify([location.uri,location.range.start.offset,location.range.end.offset,location.termId??'']);
const uniqueLocations=items=>[...new Map(items.map(item=>[locationKey(item),item])).values()];

/** Interpret syntax without choosing how collisions are resolved. No filesystem IO. */
export function interpret(input,options={}) {
  const {uri='memory:/document.abstract',resolveFile,sourceRegistrations=false}=options;
  const main=typeof input==='string'?parseContextDocument(input,options):input;
  if(main?.kind!=='Document'||!Array.isArray(main.core))throw new TypeError('Expected Abstract source or a parsed Document.');
  const documents=[{uri,document:main}],diagnostics=main.diagnostics.map(d=>({...d,uri})),registrations=[];
  if(sourceRegistrations)for(const node of main.statements.filter(n=>n.kind==='ExternalSource')){
    if(registrations.some(r=>r.alias===node.name)){
      diagnostics.push({uri,code:'duplicate-source-alias',severity:'error',message:'Source alias '+node.name+' is already registered.',range:node.range});continue;
    }
    let target,file;try{target=resolveSourceUri(node.path,uri);file=resolveFile?.(target,{read:true});}catch{}
    registrations.push({alias:node.name,uri:target,range:node.range});
    if(typeof file?.source!=='string'){
      diagnostics.push({uri,code:'missing-source',severity:'warning',message:'Cannot read registered source '+node.path+'. Local declarations remain available.',range:node.range});continue;
    }
    if(documents.some(d=>d.uri===target))continue;
    const document=parseContextDocument(file.source,options);
    documents.push({uri:target,sourceAlias:node.name,document});
    // Foreign registrations are recorded as syntax, but never followed recursively.
    diagnostics.push(...document.diagnostics.map(d=>({...d,uri:target})));
  }
  const relations=new Map(),contexts=new Map(),terms=new Map(),judgments=[],identities=[],distinctions=[],detachments=[],occurrences=[];
  const incoming=new Map(),outgoing=new Map();
  function relation(pair,documentUri){
    const id=contextKey(pair);if(!relations.has(id))relations.set(id,{id,pair,label:termText(pair),definitions:[]});
    const r=relations.get(id);r.definitions.push({pair,uri:documentUri});return id;
  }
  function term(word,contextId){
    const id=JSON.stringify([word,contextId]);
    if(!terms.has(id))terms.set(id,{id,word,contextId,reference:contextId==='GLOBAL'?word:word+':'+relations.get(contextId).label,available:true,occurrences:[],definitions:[],conceptId:id});
    return terms.get(id);
  }
  function declaration(atom,contextId,documentUri,record){
    const entry=term(atom.name,contextId),location={uri:documentUri,range:atom.nameRange||atom.range};
    entry.definitions.push(location);
    if(record&&!atom.synthetic){const occurrence={...location,termId:entry.id,explicit:false};entry.occurrences.push(occurrence);occurrences.push(occurrence);}
    return entry;
  }
  for(const doc of documents)for(const node of doc.document.expanded){
    const concreteId=relation(node.concrete,doc.uri),abstractId=relation(node.abstract,doc.uri);
    const j={...node,uri:doc.uri,sourceAlias:doc.sourceAlias,concreteId,abstractId,matching:orientation(node.concrete)^orientation(node.abstract)};
    judgments.push(j);
    if(!contexts.has(abstractId))contexts.set(abstractId,{...relations.get(abstractId),members:new Set()});
    for(const atom of [node.concrete.sourceTerm,node.concrete.targetTerm])declaration(atom,abstractId,doc.uri,true);
    if(!node.negated){
      if(!incoming.has(abstractId))incoming.set(abstractId,[]);incoming.get(abstractId).push(j);
      if(!outgoing.has(concreteId))outgoing.set(concreteId,[]);outgoing.get(concreteId).push(j);
    }
  }
  for(const scope of contexts.values()){
    const queue=[scope.id];
    while(queue.length){const id=queue.pop();if(scope.members.has(id))continue;scope.members.add(id);for(const j of incoming.get(id)||[])queue.push(j.concreteId);}
    for(const id of scope.members)if(id!==scope.id)for(const origin of relations.get(id).definitions){
      for(const atom of [origin.pair.sourceTerm,origin.pair.targetTerm])declaration(atom,scope.id,origin.uri,false);
    }
  }
  // Root terms share one GLOBAL address regardless of incoming paths.
  const globalMembers=[];
  for(const relation of relations.values())if(!judgments.some(j=>j.concreteId===relation.id)){
    globalMembers.push(relation.id);
    for(const origin of relation.definitions)for(const atom of [origin.pair.sourceTerm,origin.pair.targetTerm])declaration(atom,'GLOBAL',origin.uri,true);
  }
  // An abstraction expression can itself be concrete elsewhere. Its written
  // endpoints then have those higher contextual readings at this occurrence.
  for(const j of judgments)for(const higher of judgments.filter(h=>h.concreteId===j.abstractId))
    for(const atom of [j.abstract.sourceTerm,j.abstract.targetTerm])declaration(atom,higher.abstractId,j.uri,true);
  const defaultId=word=>JSON.stringify(['default',word]);
  const defaultWords=new Set([...terms.values()].map(t=>t.word));
  for(const doc of documents)for(const node of [...doc.document.identities,...(doc.document.distinctions||[])])for(const ref of [node.left,node.right])if(!ref.context){
    defaultWords.add(ref.word);
    const id=defaultId(ref.word);
    if(!terms.has(id))terms.set(id,{id,word:ref.word,contextId:'DEFAULT',reference:ref.word,available:true,definitions:[],occurrences:[],conceptId:id});
    terms.get(id).definitions.push({uri:doc.uri,range:ref.nameRange});
  }
  const sourceMembers=new Map();
  // Contribution filtering preserves source provenance without creating namespaces.
  for(const doc of documents){
    const available=new Set(),own=judgments.filter(j=>j.uri===doc.uri),scopes=new Set(own.map(j=>j.abstractId));
    for(const scope of scopes){
      const seen=new Set(),queue=[scope];
      while(queue.length){const id=queue.pop();if(seen.has(id))continue;seen.add(id);for(const j of own)if(!j.negated&&j.abstractId===id)queue.push(j.concreteId);}
      for(const j of own)for(const [pair,id] of [[j.concrete,j.concreteId],[j.abstract,j.abstractId]])if(seen.has(id)||j.abstractId===scope){
        for(const atom of [pair.sourceTerm,pair.targetTerm])available.add(JSON.stringify([atom.name,scope]));
      }
    }
    for(const t of terms.values())if(t.contextId==='GLOBAL'&&t.definitions.some(d=>d.uri===doc.uri))available.add(t.id);
    sourceMembers.set(doc.uri,available);
  }
  function entryFor(ref){
    const entry=ref.context?terms.get(referenceKey(ref)):(terms.get(defaultId(ref.word))||[...terms.values()].find(t=>t.word===ref.word&&t.contextId==='GLOBAL'));if(!entry)return null;
    if(ref.sourceAlias){const source=registrations.find(r=>r.alias===ref.sourceAlias);if(!source||!sourceMembers.get(source.uri)?.has(entry.id))return null;}
    return entry;
  }
  const parent=new Map([...terms.keys(),...[...defaultWords].map(defaultId)].map(id=>[id,id]));
  function root(id){let result=id;while(parent.get(result)!==result)result=parent.get(result);while(parent.get(id)!==id){const next=parent.get(id);parent.set(id,result);id=next;}return result;}
  function selected(ref,doc){
    const entry=entryFor(ref);
    if(!ref.synthetic){
      if(entry){const occurrence={termId:entry.id,uri:doc.uri,range:ref.nameRange,referenceRange:ref.range,explicit:true,sourceAlias:ref.sourceAlias};entry.occurrences.push(occurrence);occurrences.push(occurrence);}
      else diagnostics.push({uri:doc.uri,range:ref.range,code:'unresolved-context-reference',severity:'warning',message:'No such term is declared in the selected context or source.'});
    }
    return entry;
  }
  const detached=new Set(),explicitPairs=[];
  function record(node,doc,kind){
    const left=selected(node.left,doc),right=selected(node.right,doc);
    const item={kind,left:left?.id??null,right:right?.id??null,leftReference:node.left,rightReference:node.right,uri:doc.uri,range:node.range,synthetic:!!node.synthetic,resolved:!!left&&!!right};
    (kind==='Identity'?identities:distinctions).push(item);return item;
  }
  for(const doc of documents)for(const node of doc.document.detachments||[]){
    const entry=selected(node.reference,doc);
    detachments.push({termId:entry?.id??null,reference:node.reference,uri:doc.uri,range:node.range,resolved:!!entry});
    if(entry&&entry.contextId!=='GLOBAL')detached.add(entry.id);
  }
  for(const doc of documents)for(const node of doc.document.distinctions||[]){
    const item=record(node,doc,'Distinction');
    // Avoid selecting an arbitrary surviving default partition. Both selected
    // contextual endpoints leave the implicit group; explicit equality remains.
    if(item.resolved)for(const id of [item.left,item.right])if(terms.get(id)?.contextId!=='GLOBAL'&&terms.get(id)?.contextId!=='DEFAULT')detached.add(id);
  }
  for(const doc of documents)for(const node of doc.document.identities)explicitPairs.push(record(node,doc,'Identity'));
  const union=(a,b)=>{a=root(a);b=root(b);if(a!==b)parent.set(a>b?a:b,a>b?b:a);};
  for(const item of explicitPairs)if(item.resolved)union(item.left,item.right);
  // Equality can connect a detached occurrence to another selected occurrence.
  // Mere spelling supplies only the remaining defeasible connections.
  for(const entry of terms.values())if(!detached.has(entry.id))union(entry.id,defaultId(entry.word));
  for(const entry of terms.values()){
    entry.detached=detached.has(entry.id);entry.conceptId=root(entry.id);entry.definitions=uniqueLocations(entry.definitions);entry.occurrences=uniqueLocations(entry.occurrences);
  }
  const collisions=[],collisionKeys=new Set();
  function collision(kind,start,end,witness){
    const key=JSON.stringify([kind,start,end,witness.map(j=>[j.uri,j.range.start.offset])]);if(collisionKeys.has(key))return;collisionKeys.add(key);
    collisions.push({kind,concreteId:start,abstractId:end,judgments:witness,range:witness[0]?.range,uri:witness[0]?.uri});
  }
  for(const item of distinctions)if(item.resolved&&root(item.left)===root(item.right)){
    diagnostics.push({code:'identity-collision',severity:'warning',message:'The same identities are explicitly equal and distinct.',range:item.range,uri:item.uri});
    collisions.push({kind:'identity',left:item.left,right:item.right,assertions:[...identities.filter(i=>i.resolved&&root(i.left)===root(item.left)),item],judgments:[],range:item.range,uri:item.uri});
  }
  const semanticClaims=new Map(),semanticPairs=new Map();
  for(const j of judgments){
    const endpoints=[j.concrete.sourceTerm,j.concrete.targetTerm].map(a=>terms.get(JSON.stringify([a.name,j.abstractId])).conceptId);
    const roles=[j.abstract.sourceTerm,j.abstract.targetTerm].map(a=>root(defaultId(a.name)));
    if(orientation(j.abstract))endpoints.reverse();
    const key=JSON.stringify([j.abstractId,...(roles[0]===roles[1]?[...endpoints].sort():endpoints)]);
    const previous=semanticClaims.get(key);
    if(previous&&previous.negated!==j.negated)collision('contradiction',j.concreteId,j.abstractId,[previous,j]);
    else semanticClaims.set(key,j);
    if(!j.negated&&endpoints[0]!==endpoints[1]&&roles[0]!==roles[1]){
      const pairKey=JSON.stringify([j.abstractId,...[...endpoints].sort()]);
      const previous=semanticPairs.get(pairKey);
      if(previous&&previous.endpoints[0]!==endpoints[0])collision('entanglement',j.concreteId,j.abstractId,[previous.judgment,j]);
      else semanticPairs.set(pairKey,{endpoints,judgment:j});
    }
  }
  // Relative endpoint correspondence is preserved along positive paths.
  // Repeated endpoint relations cannot carry a distinguishable swapped matching.
  const closure=new Map();
  for(const relation of relations.values()){
    const states=new Map(),queue=[{id:relation.id,matching:0,path:[]}];
    while(queue.length){
      const state=queue.pop(),key=JSON.stringify([state.id,state.matching]);if(states.has(key))continue;states.set(key,state);
      if(state.path.length&&!diagonal(relation.pair)&&!diagonal(relations.get(state.id).pair)){
        const opposite=states.get(JSON.stringify([state.id,state.matching^1]));
        if(opposite?.path.length)collision('entanglement',relation.id,state.id,[...opposite.path,...state.path]);
      }
      for(const j of outgoing.get(state.id)||[]){
        const next=state.matching^j.matching;
        if(diagonal(relations.get(state.id).pair)||diagonal(j.abstract)||diagonal(relation.pair)){
          // Repeated endpoints do not establish a unique correspondence.
          // Context reachability is retained above; direct claims are checked separately.
          continue;
        }
        queue.push({id:j.abstractId,matching:next,path:[...state.path,j]});
      }
    }
    closure.set(relation.id,states);
  }
  const positives=new Map();
  for(const j of judgments)if(!j.negated){const match=diagonal(j.concrete)||diagonal(j.abstract)?0:j.matching,key=JSON.stringify([j.concreteId,j.abstractId,match]);if(!positives.has(key))positives.set(key,j);}
  for(const j of judgments)if(j.negated){
    const match=diagonal(j.concrete)||diagonal(j.abstract)?0:j.matching;
    const direct=positives.get(JSON.stringify([j.concreteId,j.abstractId,match]));
    const path=closure.get(j.concreteId)?.get(JSON.stringify([j.abstractId,match]))?.path;
    if(direct||path?.length)collision('contradiction',j.concreteId,j.abstractId,[...(direct?[direct]:path),j]);
  }
  function resolveReference(text){if(/^[\p{L}\p{N}_-][\p{L}\p{N}\p{M}_-]*$/u.test(text))return [...terms.values()].find(t=>t.word===text&&!t.detached&&(t.contextId==='GLOBAL'||t.contextId==='DEFAULT'))||[...terms.values()].find(t=>t.word===text&&!t.detached)||null;const parsed=parseContextReference(text,{sourceRegistrations});return parsed.reference?entryFor(parsed.reference):null;}
  return {valid:!diagnostics.some(d=>d.severity==='error'),uri,documents,registrations,judgments,identities,distinctions,detachments,
    contexts:[...contexts.values()].map(c=>({id:c.id,label:c.label,pair:c.pair,members:[...c.members]})).concat(globalMembers.length?[{id:'GLOBAL',label:'GLOBAL',pair:null,members:globalMembers}]:[]),
    terms:[...terms.values()],occurrences:uniqueLocations(occurrences),collisions,diagnostics,resolveReference};
}
