import {createRoadGrades} from './road-grade.js';
import {roadWidth} from './road-surface.js';
import * as T from './three.module.js';
import {clipToSurfaceMask} from './surface-masks.js';
export function createTerrainModel({data,dem,route,outward}){
 const {nx,nz,spacing,minX,minZ}=dem,filtered=[];
 // Reject isolated urban roof/tree spikes in the regional DEM, without vertical exaggeration.
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=[];for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++)a.push(dem.values[T.MathUtils.clamp(j+dz,0,nz-1)*nx+T.MathUtils.clamp(i+dx,0,nx-1)]);a.sort((a,b)=>a-b);filtered.push(a[5])}
 const smooth=filtered.map((v,k)=>{const i=k%nx,j=Math.floor(k/nx);let sum=0,weight=0;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const w=Math.exp(-(dx*dx+dz*dz)/3);sum+=filtered[T.MathUtils.clamp(j+dz,0,nz-1)*nx+T.MathUtils.clamp(i+dx,0,nx-1)]*w;weight+=w}return sum/weight});
 function elevation(x,z){const fx=T.MathUtils.clamp((x-minX)/spacing,0,nx-1.001),fz=T.MathUtils.clamp((z-minZ)/spacing,0,nz-1.001),i=Math.floor(fx),j=Math.floor(fz),tx=fx-i,tz=fz-j;return T.MathUtils.lerp(T.MathUtils.lerp(smooth[j*nx+i],smooth[j*nx+i+1],tx),T.MathUtils.lerp(smooth[(j+1)*nx+i],smooth[(j+1)*nx+i+1],tx),tz)}
 const samples=Array.from({length:1200},(_,i)=>({u:i/1200,p:route(i/1200),out:outward(i/1200)}));
 const shoreLevels=samples.map(s=>elevation(s.p.x,s.p.z)).sort((a,b)=>a-b),datum=shoreLevels[Math.floor(shoreLevels.length*.18)]-.4;
 const bins=new Map(),cell=48;for(const s of samples){const k=`${Math.floor(s.p.x/cell)},${Math.floor(s.p.z/cell)}`;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(s)}
 function lakeFrame(x,z){const cx=Math.floor(x/cell),cz=Math.floor(z/cell);let nearest=null,d=Infinity;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++)for(const s of bins.get(`${cx+i},${cz+j}`)||[]){const q=(s.p.x-x)**2+(s.p.z-z)**2;if(q<d){d=q;nearest=s}}if(!nearest)return null;return{...nearest,d:Math.sqrt(d),offset:(x-nearest.p.x)*nearest.out.x+(z-nearest.p.z)*nearest.out.z}}
 const inside=(x,z,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
 const roadBins=new Map(),roadCell=100;for(const road of data.roads){if(road.bridge)continue;for(let i=1;i<road.p.length;i++){const a=road.p[i-1],b=road.p[i],width=roadWidth(road),seg={a,b,width,road};for(let z=Math.floor((Math.min(a[1],b[1])-30)/roadCell);z<=Math.floor((Math.max(a[1],b[1])+30)/roadCell);z++)for(let x=Math.floor((Math.min(a[0],b[0])-30)/roadCell);x<=Math.floor((Math.max(a[0],b[0])+30)/roadCell);x++){const key=x+','+z;if(!roadBins.has(key))roadBins.set(key,[]);roadBins.get(key).push(seg)}}}
 function nearestRoad(x,z){let best=null;for(const s of roadBins.get(Math.floor(x/roadCell)+','+Math.floor(z/roadCell))||[]){const dx=s.b[0]-s.a[0],dz=s.b[1]-s.a[1],t=T.MathUtils.clamp(((x-s.a[0])*dx+(z-s.a[1])*dz)/(dx*dx+dz*dz||1),0,1),px=s.a[0]+dx*t,pz=s.a[1]+dz*t,d=Math.hypot(x-px,z-pz);if(!best||d<best.d)best={...s,d,x:px,z:pz}}return best}
 function streetHeight(x,z){const f=lakeFrame(x,z),h=elevation(x,z)-datum;return f&&f.d<160?T.MathUtils.lerp(h,Math.max(3.2,h),1-T.MathUtils.smoothstep(f.d,90,160)):h}
 const roadGrades=createRoadGrades(data,{streetHeight});
 function roadHeight(road,x,z){return roadGrades.height(road,x,z)}
 function ground(x,z){const frame=lakeFrame(x,z);if(frame&&frame.d<4.8)return .08;let base=naturalGround(x,z);const road=nearestRoad(x,z);if(road){const blend=1-T.MathUtils.smoothstep(road.d,road.width/2+2,road.width/2+10);base=T.MathUtils.lerp(base,roadHeight(road.road,road.x,road.z),blend)}if(frame&&frame.d<18)base=T.MathUtils.lerp(.08,base,T.MathUtils.smoothstep(frame.d,4.8,18));return base}
 function naturalGround(x,z){const regional=elevation(x,z)-datum,f=lakeFrame(x,z);if(f&&f.d<62&&f.offset>=-5){const road=elevation(f.p.x+f.out.x*42,f.p.z+f.out.z*42)-datum,upper=T.MathUtils.clamp(road,3.2,5.2),t=T.MathUtils.smoothstep(f.offset,5,39);return T.MathUtils.lerp(.08,upper,t)}return regional}
 const riverPoints=(data.rivers||[]).flat().filter(p=>p[0]>-2200&&p[0]<1300&&p[1]>-2650&&p[1]<950),riverElevations=riverPoints.map(p=>elevation(...p)-datum).sort((a,b)=>a-b),riverLevel=(riverElevations[Math.floor(riverElevations.length*.25)]??-2)-.15;
 const riverWater=(x,z)=>(data.rivers||[]).some(p=>inside(x,z,p));
 function water(x,z){return inside(x,z,data.lake)&&!data.islands.some(p=>inside(x,z,p))}
 function terrain(x,z){return water(x,z)?-2.8:riverWater(x,z)?riverLevel-2.5:ground(x,z)-.06}
 return{roadHeight,roadGrades,riverLevel,streetHeight,nearestRoad,ground,terrain,lakeFrame,elevation,datum,water,samples};
}
export function addRegionalTerrain({scene,data,terrain,mesh,M,walkSurfaces,masks}){
 const minX=-2200,minZ=-2650,w=3500,h=3600,nx=280,nz=288,g=new T.PlaneGeometry(w,h,nx,nz);g.rotateX(-Math.PI/2);g.translate(minX+w/2,0,minZ+h/2);const a=g.attributes.position,colors=[];
 const city=new T.Color('#c9c9bb'),grass=new T.Color('#98ac7e'),riverGrass=new T.Color('#91a97a');
 for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),f=terrain.lakeFrame(x,z);let y=terrain.terrain(x,z);if(!terrain.water(x,z)){y=walkSurfaces.cutTerrain(x,z,y);if(f&&f.d<60)y-=.28*(1-T.MathUtils.smoothstep(f.d,42,60));}a.setY(i,y);const blend=f?1-T.MathUtils.smoothstep(f.d,32,53):0,c=city.clone().lerp(grass,blend);if(z<-1050)c.lerp(riverGrass,.5);colors.push(c.r,c.g,c.b)}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
 // Clip the coarse DEM mesh to the exact mapped shoreline, not grid-cell triangles.
 const mask=document.createElement('canvas');mask.width=mask.height=2048;const ctx=mask.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,2048,2048);const paint=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>{const x=(p[0]-minX)/w*2048,y=(p[1]-minZ)/h*2048;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fill()};paint(data.lake,'#000');for(const river of data.rivers||[])paint(river,'#000');for(const island of data.islands)paint(island,'#fff');const alphaMap=new T.CanvasTexture(mask);const m=new T.MeshStandardMaterial({vertexColors:true,roughness:1,alphaMap,alphaTest:.5});clipToSurfaceMask(m,masks.land,'land');m.userData.preserveUV=true;const underlay=g.clone(),u=underlay.attributes.position;for(let i=0;i<u.count;i++)u.setY(i,u.getY(i)-.65);underlay.computeVertexNormals();const baseMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:1,alphaMap,alphaTest:.5});baseMaterial.userData.preserveUV=true;mesh(underlay,baseMaterial).castShadow=false;const o=mesh(g,m);o.castShadow=false;
 // Dense rings preserve the mapped bank edge, with a monotonic slope to the street.
 const offsets=[-2.6,0,2.8,5,8,12,18,26,36,48,60],p=[],ix=[];
 for(let i=0;i<=1200;i++){const s=terrain.samples[i%1200];for(const offset of offsets){const x=s.p.x+s.out.x*offset,z=s.p.z+s.out.z*offset;p.push(x,walkSurfaces.cutTerrain(x,z,terrain.ground(x,z)-.018),z)}if(i<1200)for(let j=0;j<offsets.length-1;j++){const k=i*offsets.length+j;ix.push(k,k+offsets.length,k+1,k+1,k+offsets.length,k+offsets.length+1)}}
 const ring=new T.BufferGeometry();ring.setAttribute('position',new T.Float32BufferAttribute(p,3));ring.setIndex(ix);ring.computeVertexNormals();const material=M.grass.clone();material.side=T.DoubleSide;
 clipToSurfaceMask(material,masks.land,'bank');
 const bank=mesh(ring,material);bank.castShadow=false;
}
