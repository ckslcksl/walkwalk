import * as T from'./three.module.js';import{clipToSurfaceMask}from'./surface-masks.js';
let pending;
export function preloadWalkwayCache(){if(!pending&&typeof DecompressionStream!=='undefined')pending=fetch('./suji-walks-v1.bin.gz?v=1').then(async r=>{if(!r.ok)throw Error('No walking cache');return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}).catch(()=>null);return pending;}
export async function loadWalkwayCache({mesh,mat,masks}){const buffer=await preloadWalkwayCache();if(!buffer)return false;const h=new Uint32Array(buffer,0,6);if(h[0]!==0x57554e49||h[1]!==1)return false;let offset=24;
 for(let i=0;i<2;i++){const count=h[2+i*2],n=h[3+i*2],encoded=new Int32Array(buffer,offset,count),p=new Float32Array(count),axes=[0,0,0];offset+=count*4;for(let j=0;j<count;j++)p[j]=(axes[j%3]+=encoded[j])/1000;const delta=new Int32Array(buffer,offset,n),ix=new Uint32Array(n);offset+=n*4;let prev=0;for(let j=0;j<n;j++)ix[j]=prev+=delta[j];const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setIndex(new T.BufferAttribute(ix,1));g.computeVertexNormals();const role=i?'unified-walk-foundation':'unified-walk-surface',m=mat(i?'#9c9c88':'#c7bda9');m.side=T.DoubleSide;if(masks)clipToSurfaceMask(m,masks.road,role,'r');const o=mesh(g,m);o.castShadow=false;o.userData.surfaceRole=role;}
 return true;
}
