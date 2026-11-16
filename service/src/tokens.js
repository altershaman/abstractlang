import {sourceContext,contextKey} from '@abstractlang/core';

export const semanticTokenLegend=Object.freeze({
  tokenTypes:Object.freeze(['term','dot','doubleColon','bang','colon','comment']),
  tokenModifiers:Object.freeze(['concretization','abstraction','reference','rootAbstraction'])
});

/** Classify written tokens only; roles come from expanded judgments, not inferred identities. */
export function semanticTokens(document,{graph}={}){
  const source=document.source,ctx=sourceContext(source),roles=new Map();
  const positive=(graph?.judgments||document.expanded).filter(j=>!j.negated);
  const outgoing=new Set(positive.map(j=>j.concreteId||contextKey(j.concrete)));
  const roots=new Set(positive.map(j=>j.abstractId||contextKey(j.abstract)).filter(id=>!outgoing.has(id)));
  function rootTerms(pair){if(roots.has(contextKey(pair)))term(pair,'rootAbstraction');}
  const mark=(range,role)=>{
    if(!range)return;const key=range.start.offset+':'+range.end.offset;
    if(!roles.has(key))roles.set(key,new Set());roles.get(key).add(role);
  };
  function term(node,role){
    if(!node)return;
    if(node.kind==='Pair'){term(node.sourceTerm,role);term(node.targetTerm,role);}
    else if(node.kind==='Qualified'){
      mark(node.reference.nameRange,role);reference(node.reference);
    }else mark(node.nameRange,role);
  }
  function reference(ref){
    mark(ref.nameRange,'reference');
    if(ref.context){term(ref.context,'reference');term(ref.context,'abstraction');rootTerms(ref.context);}
  }
  for(const judgment of document.expanded){term(judgment.concrete,'concretization');term(judgment.abstract,'abstraction');rootTerms(judgment.abstract);}
  function visit(node){
    if(node.kind==='Qualified'){reference(node.reference);return;}
    if(['ContextReference','DefaultReference'].includes(node.kind)){if(node.context)reference(node);return;}
    if(node.kind==='Pair'){visit(node.sourceTerm);visit(node.targetTerm);return;}
    for(const key of ['concept','reference','left','right'])if(node[key])visit(node[key]);
    for(const child of [...(node.terms||[]),...(node.children||[])])visit(child);
  }
  for(const statement of document.statements)visit(statement);
  const result=[];let offset=0;
  for(const line of source.split('\n')){
    // Source registrations and their quoted paths belong to the document integration.
    if(/^\s*@/u.test(line)){offset+=line.length+1;continue;}
    let i=0;
    while(i<line.length){
      if(line.startsWith('//',i)){
        const end=line.endsWith('\r')?line.length-1:line.length;
        result.push({range:ctx.range(offset+i,offset+end),type:'comment',modifiers:[]});break;
      }
      if(line[i]==='"'||line[i]==="'"){
        const quote=line[i++];while(i<line.length){if(line[i++]==='\\'){i++;continue;}if(line[i-1]===quote)break;}continue;
      }
      const start=i,name=/^[\p{L}\p{N}_-][\p{L}\p{N}\p{M}_-]*/u.exec(line.slice(i));let type;
      if(name){i+=name[0].length;if(line.slice(0,start).trimEnd().endsWith('@'))continue;type='term';}
      else if(line.startsWith('::',i)){i+=2;type='doubleColon';}
      else if('.!:'.includes(line[i])){type={'.':'dot','!':'bang',':':'colon'}[line[i++]];}
      else {i++;continue;}
      const range=ctx.range(offset+start,offset+i),set=roles.get((offset+start)+':'+(offset+i));
      result.push({range,type,modifiers:type==='term'?semanticTokenLegend.tokenModifiers.filter(m=>set?.has(m)):[]});
    }
    offset+=line.length+1;
  }
  return result;
}
