import JSON5 from 'json5';
import {sourceContext} from './source.js';
import {expandStatements} from './expansion.js';

export function termText(term){
  if(term.kind==='Qualified')return '('+referenceText(term.reference)+')';
  if(term.kind==='Pair')return termText(term.sourceTerm)+'.'+termText(term.targetTerm);
  return term.name;
}
export function referenceText(ref){return ref.context?ref.word+':'+termText(ref.context)+(ref.sourceAlias?'@'+ref.sourceAlias:''):ref.word;}
const namePattern=/^[\p{L}\p{N}_-][\p{L}\p{N}\p{M}_-]*/u;
function reader(text,start,ctx,{syntax='sugar',sourceRegistrations=false}={}){
  const tokens=[];let i=0;
  while(i<text.length){
    if(/[ \t]/u.test(text[i])){i++;continue;}
    if(text.startsWith('//',i))break;
    const from=i,name=namePattern.exec(text.slice(i));
    if(name){i+=name[0].length;tokens.push({kind:'name',value:name[0],range:ctx.range(start+from,start+i)});continue;}
    if(text.startsWith('::',i)){tokens.push({value:'::',range:ctx.range(start+i,start+i+2)});i+=2;continue;}
    if('.!:()@'.includes(text[i])){tokens.push({value:text[i],range:ctx.range(start+i,start+i+1)});i++;continue;}
    ctx.report('unexpected-character','Unexpected character '+JSON.stringify(text[i])+'.',ctx.range(start+i,start+i+1));return null;
  }
  let at=0,depth=0;
  const fail=message=>{const error=new Error(message);error.range=tokens[at]?.range||ctx.range(start+text.length);throw error;};
  const take=value=>{if(tokens[at]?.value!==value)fail('Expected '+value+'.');return tokens[at++];};
  function atom(){
    if(++depth>128)fail('Reference nesting exceeds 128 levels.');
    let term;const token=tokens[at];
    if(token?.kind==='name'){at++;term={kind:'Reference',name:token.value,nameRange:token.range,range:token.range};}
    else if(token?.value==='('){const open=take('('),ref=reference(),close=take(')');term={kind:'Qualified',reference:ref,range:{start:open.range.start,end:close.range.end}};}
    else fail('Expected a word or parenthesized contextual reference.');
    depth--;return term;
  }
  function relation(){
    if(tokens[at]?.value==='.'){if(syntax==='core')fail('Shared abstraction shorthand is not core syntax.');take('.');const word=atom();if(word.kind!=='Reference')fail('Shared abstraction shorthand requires one word.');return makePair(word,word);}
    const first=atom();
    if(tokens[at]?.value==='.'&&tokens[at+1]&&['name','('].includes(tokens[at+1].kind||tokens[at+1].value)){take('.');return makePair(first,atom());}
    return first;
  }
  function reference(){
    const word=tokens[at];if(word?.kind!=='name')fail('A contextual reference begins with a word.');at++;take(':');
    const context=relation();if(context.kind==='Pair'&&[context.sourceTerm,context.targetTerm].some(t=>t.kind!=='Reference'))fail('A reference context must contain two words.');if(context.kind!=='Pair')fail('A contextual reference requires a complete abstraction context.');
    let sourceAlias,sourceRange;if(tokens[at]?.value==='@'){if(!sourceRegistrations)fail('Source qualification requires the document extension.');take('@');const source=tokens[at];if(source?.kind!=='name')fail('Expected a source alias.');at++;sourceAlias=source.value;sourceRange=source.range;}
    return {kind:'ContextReference',word:word.value,nameRange:word.range,context,sourceAlias,sourceRange,range:{start:word.range.start,end:(sourceRange||context.range).end}};
  }
  return {tokens,atom,relation,reference,take,fail,get at(){return at;},get current(){return tokens[at];},get next(){return tokens[at+1];},get done(){return at===tokens.length;}};
}
function makePair(sourceTerm,targetTerm){return {kind:'Pair',sourceTerm,targetTerm,source:termText(sourceTerm),target:termText(targetTerm),range:{start:sourceTerm.range.start,end:targetTerm.range.end}};}
export function parseContextReference(source,options={}){
  if(typeof source!=='string')throw new TypeError('Reference source must be text.');
  if(source.includes('\n')||source.includes('\r')){const ctx=sourceContext(source);ctx.report('reference-syntax','A reference occupies one physical line.',ctx.range(0,source.length));return {reference:null,diagnostics:ctx.diagnostics};}
  if(options.syntax&&!['core','sugar'].includes(options.syntax))throw new TypeError('syntax must be core or sugar.');
  const ctx=sourceContext(source);let reference=null;
  try{const r=reader(source,0,ctx,options);if(r){reference=r.reference();if(!r.done)r.fail('Unexpected text after contextual reference.');}}catch(error){ctx.report('reference-syntax',error.message,error.range||ctx.range(0,source.length));}
  return {reference:ctx.diagnostics.length?null:reference,diagnostics:ctx.diagnostics};
}

export function parseContextDocument(source,options={}){
  if(typeof source!=='string')throw new TypeError('Abstract source must be text.');
  const {syntax='sugar',sourceRegistrations=false}=options;
  if(!['core','sugar'].includes(syntax))throw new TypeError('syntax must be core or sugar.');
  const ctx=sourceContext(source),flat=[];let offset=0,blankBefore=false,indentStyle=null;
  for(const raw of source.split('\n')){
    const body=raw.endsWith('\r')&&source[offset+raw.length]==='\n'?raw.slice(0,-1):raw,bom=offset===0&&body.startsWith('\uFEFF')?1:0,line=body.slice(bom),space=/^[ \t]*/.exec(line)[0],text=line.slice(space.length).replace(/[ \t]+$/,''),start=offset+bom+space.length;
    if(!text||text.startsWith('//')){if(!text)blankBefore=true;offset+=raw.length+1;continue;}
    if(space&&syntax!=='core'){const style=space.includes('\t')?'tabs':'spaces';if((style==='tabs'&&space.includes(' '))||(indentStyle&&style!==indentStyle))ctx.report('mixed-indentation','Use spaces or tabs consistently for indentation.',ctx.range(offset+bom,start));else indentStyle=style;}
    let node;
    if(text.startsWith('@')&&sourceRegistrations){
      const match=/^@([\p{L}\p{N}_-][\p{L}\p{N}\p{M}_-]*)\.path\s*:\s*(.+)$/u.exec(text);
      try{if(!match)throw new Error();const path=JSON5.parse(match[2]);if(typeof path!=='string'||!path.trim())throw new Error();node={kind:'ExternalSource',name:match[1],path,nameRange:ctx.range(start+1,start+1+match[1].length)};}catch{ctx.report('source-registration','Expected @source.path: followed by a quoted nonempty path.',ctx.range(start,start+text.length));}
    }else try{
      const r=reader(text,start,ctx,options);if(r&&r.tokens.length){
        let leading=false,leadingDot=false;if(r.current.value==='::'){r.take('::');leading=true;}else if(r.current.value==='.'){r.take('.');leadingDot=true;}
        const first=r.relation(),terms=[first],operators=[];let trailing=false;
        if(!leading&&!leadingDot&&first.kind==='Reference'&&r.current?.value==='.'&&!r.next){r.take('.');node={kind:'Prefix',concept:first,name:first.name,nameRange:first.range,dotPosition:'trailing'};}
        else {
          while(!r.done){
            const op=r.current;if(!['::','!'].includes(op.value))r.fail('Expected :: or ! between relation expressions.');r.take(op.value);
            if(r.current?.value==='.'&&!r.next){
              const dot=r.take('.');if(op.range.end.offset!==dot.range.start.offset)r.fail('The identity marker '+op.value+'. cannot contain whitespace.');
              if(leading||leadingDot||terms.length!==1)r.fail('Identity statements cannot be chained or continued.');
              const operand=t=>t.kind==='Qualified'?t.reference:t.kind==='Reference'?{kind:'DefaultReference',word:t.name,nameRange:t.nameRange,range:t.range}:null;
              if(first.kind==='Pair'){
                const left=operand(first.sourceTerm),right=operand(first.targetTerm);if(!left||!right)r.fail('Identity operands must be words or contextual references.');
                node={kind:op.value==='::'?'Identity':'Distinction',left,right};
              }else if(op.value==='!'&&first.kind==='Qualified')node={kind:'Detachment',reference:first.reference};
              else r.fail('Unary detachment requires a contextual reference.');
              break;
            }
            if(r.done){if(op.value==='!')r.fail('Negation does not open an indentation block.');trailing=true;break;}
            operators.push({value:op.value,range:op.range});terms.push(r.relation());
          }
          if(!node){if(operators.some(o=>o.value==='!')&&(leading||trailing||terms.length!==2||operators.length!==1))r.fail('A negative judgment has exactly two relation expressions.');node={kind:'Expression',terms,operators,leading,leadingDot,trailing};}
        }
      }
    }catch(error){ctx.report('judgment-syntax',error.message,error.range||ctx.range(start,start+text.length));}
    flat.push({...node,kind:node?.kind||'Invalid',range:ctx.range(start,offset+body.length),indent:space.length,blankBefore,children:[]});blankBefore=false;offset+=raw.length+1;
  }
  const baseIndent=syntax==='core'?0:flat.reduce((min,n)=>Math.min(min,n.indent),flat[0]?.indent??0);
  for(const node of flat)node.indent=syntax==='core'?0:node.indent-baseIndent;
  const statements=[],stack=[{indent:-1,children:statements}];
  for(const node of flat){
    const complete=n=>['Identity','Distinction','Detachment'].includes(n.kind)||(n.kind==='Expression'&&n.operators.length&&!n.leading&&!n.trailing);
    // Whitespace around complete core statements does not create sugar blocks.
    if(complete(node)&&stack.slice(1).every(complete))node.indent=0;
    while(stack.length>1&&node.indent<=stack.at(-1).indent)stack.pop();
    if(stack.length>128){ctx.report('nesting-limit','Indentation exceeds 128 levels.',node.range);continue;}
    const parent=stack.at(-1);if(parent.indent===-1&&node.indent)ctx.report('unexpected-indentation','Top-level statements begin at column zero.',node.range);
    if(parent.children.length&&parent.children[0].indent!==node.indent)ctx.report('inconsistent-indentation','Sibling expressions must align.',node.range);
    parent.children.push(node);stack.push(node);
  }
  for(const node of flat)if(node.kind==='Expression'&&!node.leading&&!node.leadingDot&&!node.trailing&&node.terms.length===1&&node.terms[0].kind==='Reference'&&node.children.length&&node.children.every(c=>c.kind==='Expression'&&c.leadingDot)){
    node.kind='Prefix';node.concept=node.terms[0];node.name=node.concept.name;node.dotPosition='leading';
  }
  const expansionDocument={...ctx,kind:'Document',statements};
  const symbolic=expandStatements(expansionDocument,ctx.report);
  const core=[];
  for(const node of flat)if(['Identity','Distinction','Detachment'].includes(node.kind)&&node.indent===0&&!node.children.length)core.push(node);
  for(const j of symbolic){
    if(j.concrete.kind!=='Pair'||j.abstract.kind!=='Pair'){
      ctx.report('expected-relation','A judgment requires two complete relation expressions.',j.range);continue;
    }
    if([j.abstract.sourceTerm,j.abstract.targetTerm].some(t=>t.kind!=='Reference')){
      ctx.report('reference-placement','Referenced endpoints are only defined on the concrete side of positive judgments.',j.abstract.range);continue;
    }
    const endpoints=[j.concrete.sourceTerm,j.concrete.targetTerm];
    if(endpoints.some(t=>t.kind==='Qualified')&&(j.negated||syntax==='core')){
      ctx.report('reference-placement','Referenced endpoints in judgments require positive-judgment shorthand.',j.concrete.range);continue;
    }
    const plain=endpoints.map(t=>t.kind==='Qualified'?{kind:'Reference',name:t.reference.word,nameRange:t.reference.nameRange,range:t.reference.nameRange,synthetic:true}:t);
    const concrete=makePair(...plain);
    for(const endpoint of endpoints)if(endpoint.kind==='Qualified'){
      const target={kind:'ContextReference',word:endpoint.reference.word,nameRange:endpoint.reference.nameRange,context:j.abstract,range:endpoint.reference.range,synthetic:true};
      core.push({kind:'Identity',left:endpoint.reference,right:target,range:j.range,synthetic:true});
    }
    core.push({...j,kind:'Judgment',concrete});
  }
  if(syntax==='core')for(const node of flat)if(node.kind==='Prefix'||(node.kind==='Expression'&&(node.leading||node.leadingDot||node.trailing||node.operators.length!==1||node.terms.length!==2))){
    ctx.report('non-core-syntax','Chains, blocks and shorthand require sugar syntax.',node.range);
  }
  core.sort((a,b)=>a.range.start.offset-b.range.start.offset);
  return {kind:'Document',source,syntax,statements,core,expanded:core.filter(n=>n.kind==='Judgment'),identities:core.filter(n=>n.kind==='Identity'),distinctions:core.filter(n=>n.kind==='Distinction'),detachments:core.filter(n=>n.kind==='Detachment'),diagnostics:ctx.diagnostics};
}
