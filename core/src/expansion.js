const pair=(sourceTerm,targetTerm)=>({kind:'Pair',sourceTerm,targetTerm,source:sourceTerm.name,target:targetTerm.name,range:{start:sourceTerm.range.start,end:targetTerm.range.end}});
/** Expand layout into symbolic judgments, retaining ranges for name resolution. */
export function expandStatements(document,report) {
  const judgments=[];
  const add=(concrete,abstract,negated,range)=>judgments.push({concrete,abstract,negated,range});
  const finish=pending=>{
    for(const item of pending)if(item.required)report('incomplete-expression','This relation expression needs a judgment continuation.',item.term.range);
    pending.length=0;
  };
  function termIn(term,prefix,leadingDot){
    if(leadingDot&&prefix?.dotPosition!=='leading'){
      report('orphan-dot','A leading dot requires a bare shared-concept header.',term.range);return null;
    }
    if(prefix?.dotPosition==='leading'&&!leadingDot){
      report('expected-dot','Each child of a bare shared-concept header must begin with a dot.',term.range);return null;
    }
    if(!prefix)return term;
    if(!['Reference','Qualified'].includes(term.kind)){
      report('shared-concept-target','A shared-concept block supplies the first concept; begin each child with its second concept.',term.range);return null;
    }
    return {...pair(prefix.concept,term),range:term.range};
  }
  function tail(node,terminal){
    if(node.trailing){
      if(!node.children.length)report('missing-block','A trailing :: requires an indented abstraction block.',node.range);
      else block(node.children,null,terminal);
    } else if(node.children.length){
      if(node.children.every(child=>child.kind==='Expression'&&child.leading))continuations(node.children,[terminal]);
      else report('unexpected-block','Use a trailing :: or dot, a leading :: continuation, or leading-dot children to open a block.',node.children[0].range);
    }
  }
  function continuations(nodes,inputs){
    for(const node of nodes){
      if(node.blankBefore){report('orphan-continuation','A blank line ends the preceding relation group.',node.range);continue;}
      if(node.kind!=='Expression'||!node.leading){report('expected-continuation','Expected an indented ::relation continuation.',node.range);continue;}
      const first=node.terms[0];
      for(const input of inputs)add(input,first,false,node.range);
      for(let i=0;i<node.operators.length;i++)add(node.terms[i],node.terms[i+1],false,node.range);
      tail(node,node.terms.at(-1));
    }
  }
  function block(nodes,prefix=null,incoming=null){
    const pending=[];
    for(const node of nodes){
      if(node.blankBefore)finish(pending);
      if(['ExternalSource','Identity','Distinction','Detachment','Invalid'].includes(node.kind)){
        finish(pending);
        if(node.indent!==0&&node.kind!=='Invalid')report('nested-directive','Identity assertions and source registrations must be top-level statements.',node.range);
        if(node.children.length)report('unexpected-block','This statement cannot contain judgment children.',node.children[0].range);
        continue;
      }
      if(node.kind==='Prefix'){
        finish(pending);
        if(prefix||incoming){report('nested-shared-concept','A shared-concept header cannot replace an inherited relation or concept.',node.range);continue;}
        if(!node.children.length)report('missing-block','A shared-concept header requires an indented block.',node.range);
        else block(node.children,{concept:node.concept,dotPosition:node.dotPosition});
        continue;
      }
      if(node.leading){finish(pending);report('orphan-continuation','A leading :: must be indented beneath a preceding relation group.',node.range);continue;}
      const first=termIn(node.terms[0],prefix,node.leadingDot);if(!first){finish(pending);continue;}
      const terms=[first,...node.terms.slice(1)],hasChain=node.operators.length>0;
      if(hasChain||node.trailing)finish(pending);
      if(incoming)add(incoming,first,false,node.range);
      for(let i=0;i<node.operators.length;i++)add(terms[i],terms[i+1],node.operators[i].value==='!',node.range);
      const terminal=terms.at(-1);
      if(node.trailing)tail(node,terminal);
      else if(node.children.length){
        if(node.operators.some(o=>o.value==='!'))report('negated-block','Negative judgments cannot have continuation blocks.',node.range);
        else if(node.children.every(child=>child.kind==='Expression'&&child.leading)){
          const inputs=[...pending.map(item=>item.term),terminal];pending.length=0;
          continuations(node.children,inputs);
        } else report('unexpected-block','Use a trailing :: or dot, a leading :: continuation, or leading-dot children to open a block.',node.children[0].range);
      } else if(!hasChain)pending.push({term:terminal,required:!incoming});
    }
    finish(pending);
  }
  block(document.statements);
  return judgments;
}
