import {statSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

/** Local files only. Open editor snapshots override disk without writing it. */
export function fileResolver(snapshots=new Map()){
  return (uri,{read=false}={})=>{
    if(snapshots.has(uri))return read?{source:snapshots.get(uri)}:{};
    try{
      const path=fileURLToPath(uri);if(!statSync(path).isFile())return undefined;
      return read?{source:readFileSync(path,'utf8')}:{};
    }catch{return undefined;}
  };
}
