import * as T from './three.module.js';
export function buildingFooting(building,terrain){
 const samples=[];for(let i=0;i<building.p.length;i++){const a=building.p[i],b=building.p[(i+1)%building.p.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));for(let j=0;j<n;j++){const t=j/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;samples.push([x,terrain.ground(x,z),z])}}
 return{base:Math.max(...samples.map(p=>p[1])),samples};
}
export function addBuildingFoundations(buildings,{mesh,mat}){
 const positions=[];for(const b of buildings){if(b.min>.05||b.h<1)continue;const samples=b.footing.samples,top=b.ground+.02;for(let i=0;i<samples.length;i++){const a=samples[i],q=samples[(i+1)%samples.length],bottomA=a[1]-.35,bottomQ=q[1]-.35;positions.push(a[0],bottomA,a[2],q[0],bottomQ,q[2],a[0],top,a[2],a[0],top,a[2],q[0],bottomQ,q[2],q[0],top,q[2]);}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();const material=mat('#999b8c');material.side=T.DoubleSide;mesh(geometry,material);
}
