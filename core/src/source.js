export function sourceContext(source) {
  const starts=[0];
  for(let i=0;i<source.length;i++) if(source[i]==='\n') starts.push(i+1);
  function position(offset) {
    offset=Math.max(0,Math.min(source.length,offset));
    let low=0,high=starts.length;
    while(low+1<high){const middle=(low+high)>>1;if(starts[middle]<=offset)low=middle;else high=middle;}
    return {line:low,character:offset-starts[low],offset};
  }
  const range=(start,end=start)=>({start:position(start),end:position(end)});
  const diagnostics=[];
  function report(code,message,location,severity='error',related=[]) {
    diagnostics.push({code,message,severity,range:location,...(related.length?{related}: {})});
  }
  return {source,range,report,diagnostics};
}
