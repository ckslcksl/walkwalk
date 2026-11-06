import * as T from './three.module.js?v=grade-20261107';
let restLocations=Array.from({length:24},(_,i)=>i/24);
export function setRestLocations(locations){restLocations=locations.length?locations:restLocations}
export function parkHeight(u,offset,length){
 if(offset<2.7)return 0;
 const t=T.MathUtils.clamp((offset-2.7)/19,0,1),berm=1.55*Math.sin(Math.PI*t);
 const seatDistance=Math.min(...restLocations.map(v=>{const d=Math.abs(u-v);return Math.min(d,1-d)*length}));
 const restFlat=1-T.MathUtils.smoothstep(seatDistance,4.5,8);
 const seatBand=1-T.MathUtils.smoothstep(offset,8.8,12.5);
 return berm*(1-restFlat*seatBand);
}
export function addLakesideTerrain({scene,data,route,outward,length,M,mesh,walkSurfaces,terrain}){
 const stoneCanvas=document.createElement('canvas');stoneCanvas.width=stoneCanvas.height=512;const ctx=stoneCanvas.getContext('2d');ctx.fillStyle='#827e70';ctx.fillRect(0,0,512,512);let seed=91;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let row=-1;row<9;row++)for(let col=-1;col<6;col++){const x=col*94+(row%2)*43,y=row*60,v=Math.floor(random()*25);ctx.fillStyle=`rgb(${151+v},${148+v},${130+v})`;ctx.beginPath();ctx.roundRect(x+2,y+2,88,54,4+random()*7);ctx.fill();ctx.fillStyle='rgba(225,219,191,.2)';ctx.fillRect(x+7,y+5,72,3)}for(let i=0;i<30000;i++){ctx.fillStyle=random()<.5?'#a09b87':'#b7b09b';ctx.globalAlpha=.2;ctx.fillRect(random()*512,random()*512,1,1)}ctx.globalAlpha=1;
 const texture=new T.CanvasTexture(stoneCanvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(.5,.5);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;const stone=new T.MeshStandardMaterial({map:texture,bumpMap:texture,bumpScale:.08,roughness:1,side:T.DoubleSide});
 const create=(positions,indices,material)=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const o=mesh(geo,material);o.castShadow=false;return o};
 // Outer planted berm rises away from the lower promenade. Seat bays remain level.
 // Regional terrain provides the bank; no overlapping decorative berm.
 // Match the bank to the actual mapped shore, rather than extending grass over the lake.
 const samples=Array.from({length:1500},(_,i)=>({u:i/1500,p:route(i/1500)})),shore=data.lake.slice(0,-1),bank=[],bankIndices=[];for(let i=0;i<shore.length;i++){const p=shore[i];let closest=samples[0],distance=Infinity;for(const s of samples){const d=(s.p.x-p[0])**2+(s.p.z-p[1])**2;if(d<distance){distance=d;closest=s}}const edge=closest.p.clone().addScaledVector(outward(closest.u),-2.85);bank.push(p[0],-1.43,p[1],edge.x,.08,edge.z)}for(let i=0;i<shore.length;i++){const k=i*2,n=(i+1)%shore.length*2;bankIndices.push(k,n,k+1,k+1,n,n+1)}create(bank,bankIndices,stone);
 // Island retaining walls meet the lowered water surface.
 for(const island of data.islands){const p=[],ix=[];for(let i=0;i<island.length;i++){const q=island[i];p.push(q[0],-1.43,q[1],q[0],.08,q[1]);if(i<island.length-1){const k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3)}}create(p,ix,stone)}
 // Stone caps run along the bank-side edge of the lower walking track.
 const caps=[],capIndices=[];for(let i=0;i<=1200;i++){const u=i/1200,p=route(u),out=outward(u);for(const d of [-2.95,-2.72]){const q=p.clone().addScaledVector(out,d);caps.push(q.x,.11,q.z)}if(i<1200){const k=i*2;capIndices.push(k,k+2,k+1,k+1,k+2,k+3)}}create(caps,capIndices,M.edge);
}
