import{matchBankTint}from'./bank-tint.js?v=grade-20261107';
import {indexedTerrain} from './indexed-terrain.js?v=grade-20261107';
import {yieldToBrowser} from './loading-progress.js?v=grade-20261107';
import * as T from './three.module.js?v=grade-20261107';
import {conformBankTriangle} from './terrain-triangle-clip.js?v=grade-20261107';
import {MASK_BOUNDS} from './surface-masks.js?v=grade-20261107';

// The outer edge samples the rendered terrain triangle, not the source DEM.
// Cut only the exact replacement footprint, so terrain cannot protrude through
// this transition and the replacement cannot leave a hole at its outer seam.
function* buildaddPathBanks({data,terrain,walkSurfaces,mesh,M,masks,captureCuts}){
 const positions=[],fill=[],seams=[],ctx=masks.land.image.getContext('2d'),{minX,minZ,w,h}=MASK_BOUNDS,size=masks.land.image.width;
 const draw=points=>{captureCuts?.(points.map(p=>[(p[0]-minX)/w*size,(p[2]-minZ)/h*size]).flat());ctx.fillStyle='#000';ctx.beginPath();points.forEach((p,i)=>{const x=(p[0]-minX)/w*size,z=(p[2]-minZ)/h*size;i?ctx.lineTo(x,z):ctx.moveTo(x,z)});ctx.closePath();ctx.fill();};
 const triangle=(a,b,c)=>positions.push(...a,...b,...c);const closeSide=(a,b)=>{const bottom=p=>[p[0],Math.min(p[1]-.08,terrain.supportHeight?.(p[0],p[2])??p[1]-2),p[2]],c=bottom(a),d=bottom(b);fill.push(...a,...c,...b,...b,...c,...d);};
 for(const e of data.graph.edges){yield;if(e.upper||e.tunnel||e.crossing)continue;const a=data.graph.nodes[e.a],b=data.graph.nodes[e.b],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),steps=Math.max(1,Math.ceil(length/1.5));
  for(const side of [-1,1])for(let i=0;i<steps;i++){
   const row=[];let valid=true;
   for(const t of [i/steps,(i+.5)/steps,(i+1)/steps]){const cx=a[0]+dx*t,cz=a[1]+dz*t,nx=dz/length*side,nz=-dx/length*side,edge=e.width/2+.12,x=cx+nx*edge,z=cz+nz*edge,ox=x+nx*1.6,oz=z+nz*1.6,road=terrain.nearestRoad(ox,oz),near=walkSurfaces.nearest(ox,oz);
    if(terrain.water(ox,oz)||road&&road.d<road.width/2+.25||near.e!==e&&near.distance<near.e.width/2+.35){valid=false;break;}
    const reference=walkSurfaces.surfaceAt(e,x,z,t),paved=terrain.pavedWalkHeight?.(x,z,reference),top=Number.isFinite(paved)&&Math.abs(paved-reference)<1.5?paved-.017:walkSurfaces.pavingHeight(x,z,reference-.025,-.025),outer=terrain.topHeight(ox,oz);row.push({inner:[x,top,z],outer:[ox,outer,oz]});
   }
   if(!valid)continue;if(i===0)closeSide(row[0].inner,row[0].outer);if(i===steps-1)closeSide(row.at(-1).outer,row.at(-1).inner);for(let j=1;j<row.length;j++){const p=row[j-1],q=row[j],at=(v,f)=>{const x=T.MathUtils.lerp(v.inner[0],v.outer[0],f),z=T.MathUtils.lerp(v.inner[2],v.outer[2],f),target=T.MathUtils.lerp(v.inner[1],v.outer[1],f);return[x,target,z,f];};for(const [lo,hi] of [[0,.4],[.4,.75],[.75,1]]){const a=at(p,lo),b=at(q,lo),c=at(p,hi),d=at(q,hi);conformBankTriangle([a,c,b],terrain,triangle);conformBankTriangle([b,c,d],terrain,triangle);}closeSide(p.inner,q.inner);draw([p.inner,at(p,.4),at(q,.4),q.inner]);seams.push({inner:p.inner,outer:p.outer,edge:e});}
  }
 }
 masks.land.needsUpdate=true;
 const g=indexedTerrain(positions);const material=M.grass.clone();material.color.set('#8fa77a');material.userData.slopeUV=true;material.side=T.DoubleSide;matchBankTint(g,material,terrain);const o=mesh(g,material);o.castShadow=false;o.userData.surfaceRole='terrain-path-transition';
 const fg=indexedTerrain(fill),fm=M.stone.clone();fm.map=null;fm.color.set('#989b83');fm.side=T.DoubleSide;const solid=mesh(fg,fm);solid.castShadow=false;solid.userData.surfaceRole='terrain-bank-fill';return seams;
}

export function addPathBanks(options){const work=buildaddPathBanks(options);let step;do{step=work.next();}while(!step.done);return step.value;}
export async function addPathBanksAsync(options){if(typeof window!=='undefined'&&options.data.region==='suji'){try{const cached=await import('./surface-cache.js?v=grade-20261107');if(await cached.loadBankCache(options))return [];}catch(error){console.warn('Bank cache fallback',error.message);}}const work=buildaddPathBanks(options);let step;do{step=work.next();if(!step.done)await yieldToBrowser();}while(!step.done);return step.value;}
