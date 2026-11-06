import {indexedTerrain} from './indexed-terrain.js';
import * as T from './three.module.js';
// Sample the actual rendered triangle surface, rather than a different analytic
// DEM height. Road/path foundations therefore meet the mesh visible from the side.
export function gridSurfaceHeight(geometry,minX,minZ,width,depth,nx,nz){
 const p=geometry.attributes.position,at=(i,j)=>p.getY(j*(nx+1)+i);
 return(x,z)=>{const fx=T.MathUtils.clamp((x-minX)/width*nx,0,nx-.000001),fz=T.MathUtils.clamp((z-minZ)/depth*nz,0,nz-.000001),i=Math.floor(fx),j=Math.floor(fz),tx=fx-i,tz=fz-j,a=at(i,j),b=at(i,j+1),c=at(i+1,j+1),d=at(i+1,j);return tx+tz<=1?a+(d-a)*tx+(b-a)*tz:c+(b-c)*(1-tx)+(d-c)*(1-tz);};
}
export function addPavingFoundations({data,terrain,walkSurfaces,mesh,mat,masks,clip}){
 if(!terrain.supportHeight||data.walkGroundTiles)return;
 const walls=[];const triangle=(array,a,b,c)=>array.push(...a,...b,...c),surface=(e,x,z,t)=>walkSurfaces.pavingHeight(x,z,walkSurfaces.surfaceAt(e,x,z,t)-.02,-.02);
 for(const e of data.graph.edges){if(e.upper||e.tunnel)continue;const a=data.graph.nodes[e.a],b=data.graph.nodes[e.b],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(length/2));
  for(let i=0;i<n;i++)for(const side of [-1,1]){const points=[];for(const t of [i/n,(i+1)/n]){const cx=a[0]+dx*t,cz=a[1]+dz*t,edge=e.width/2+.12,x=cx+dz/length*edge*side,z=cz-dx/length*edge*side,top=surface(e,x,z,t),bottom=Math.min(top-.12,terrain.supportHeight(x,z)-.08);points.push({top:[x,top,z],bottom:[x,bottom,z]});}const [p,q]=points;triangle(walls,p.top,p.bottom,q.top);triangle(walls,q.top,p.bottom,q.bottom);}
  // Close the ends as well; dead ends are solid fill, never an open sheet.
  for(const t of [0,1]){const p=[];for(const side of [-1,1]){const x=a[0]+dx*t+dz/length*(e.width/2+.12)*side,z=a[1]+dz*t-dx/length*(e.width/2+.12)*side,top=surface(e,x,z,t);p.push({top:[x,top,z],bottom:[x,Math.min(top-.12,terrain.supportHeight(x,z)-.08),z]});}triangle(walls,p[0].top,p[0].bottom,p[1].top);triangle(walls,p[1].top,p[0].bottom,p[1].bottom);}
 }
 for(const [positions,color,key] of [[walls,'#9c9c88','path-foundation']]){const g=indexedTerrain(positions);const m=mat(color);m.side=T.DoubleSide;if(masks)clip(m,masks.paving,key);const o=mesh(g,m);o.castShadow=false;o.userData.surfaceRole=key;}
}
