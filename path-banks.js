import {yieldToBrowser} from './loading-progress.js';
import * as T from './three.module.js';
import {conformBankTriangle} from './terrain-triangle-clip.js';
import {MASK_BOUNDS} from './surface-masks.js';

// The outer edge samples the rendered terrain triangle, not the source DEM.
// Cut only the exact replacement footprint, so terrain cannot protrude through
// this transition and the replacement cannot leave a hole at its outer seam.
function* buildaddPathBanks({data,terrain,walkSurfaces,mesh,M,masks}){
 const positions=[],seams=[],ctx=masks.land.image.getContext('2d'),{minX,minZ,w,h}=MASK_BOUNDS,size=masks.land.image.width;
 const draw=points=>{ctx.fillStyle='#000';ctx.beginPath();points.forEach((p,i)=>{const x=(p[0]-minX)/w*size,z=(p[2]-minZ)/h*size;i?ctx.lineTo(x,z):ctx.moveTo(x,z)});ctx.closePath();ctx.fill();};
 const triangle=(a,b,c)=>positions.push(...a,...b,...c);
 for(const e of data.graph.edges){yield;if(e.upper||e.tunnel||e.crossing)continue;const a=data.graph.nodes[e.a],b=data.graph.nodes[e.b],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),steps=Math.max(1,Math.ceil(length/1.5));
  for(const side of [-1,1])for(let i=0;i<steps;i++){
   const row=[];let valid=true;
   for(const t of [i/steps,(i+.5)/steps,(i+1)/steps]){const cx=a[0]+dx*t,cz=a[1]+dz*t,nx=dz/length*side,nz=-dx/length*side,edge=e.width/2+.12,x=cx+nx*edge,z=cz+nz*edge,ox=x+nx*1.6,oz=z+nz*1.6,road=terrain.nearestRoad(ox,oz),near=walkSurfaces.nearest(ox,oz);
    if(terrain.water(ox,oz)||road&&road.d<road.width/2+.25||near.e!==e&&near.distance<near.e.width/2+.35){valid=false;break;}
    const top=walkSurfaces.pavingHeight(x,z,walkSurfaces.surfaceAt(e,x,z,t)-.025,-.025),outer=terrain.topHeight(ox,oz);row.push({inner:[x,top,z],outer:[ox,outer,oz]});
   }
   if(!valid)continue;for(let j=1;j<row.length;j++){const p=row[j-1],q=row[j],at=(v,f)=>{const x=T.MathUtils.lerp(v.inner[0],v.outer[0],f),z=T.MathUtils.lerp(v.inner[2],v.outer[2],f),target=T.MathUtils.lerp(v.inner[1],v.outer[1],f);return[x,target,z,f];};for(const [lo,hi] of [[0,.4],[.4,.75],[.75,1]]){const a=at(p,lo),b=at(q,lo),c=at(p,hi),d=at(q,hi);conformBankTriangle([a,c,b],terrain,triangle);conformBankTriangle([b,c,d],terrain,triangle);}draw([p.inner,at(p,.4),at(q,.4),q.inner]);seams.push({inner:p.inner,outer:p.outer,edge:e});}
  }
 }
 masks.land.needsUpdate=true;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();const material=M.grass.clone();material.color.set('#8fa77a');material.side=T.DoubleSide;const o=mesh(g,material);o.castShadow=false;o.userData.surfaceRole='terrain-path-transition';
 return seams;
}

export function addPathBanks(options){const work=buildaddPathBanks(options);let step;do{step=work.next();}while(!step.done);return step.value;}
export async function addPathBanksAsync(options){const work=buildaddPathBanks(options);let step;do{step=work.next();if(!step.done)await yieldToBrowser();}while(!step.done);return step.value;}
