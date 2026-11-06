import {smoothRegionalRoadProfiles} from './road-profile-smoothing.js?v=grade-20261107';
import {fitRegionalRoadClearance} from './regional-road-clearance.js?v=grade-20261107';
// Road elevations follow a shared longitudinal engineering profile, never the
// bank directly underneath each vertex. Mapped junctions share one elevation.
export function createRoadGrades(data,{streetHeight}){
 const profiles=new Map(),junctions=new Map();for(const road of data.roads)for(const p of road.p){const key=p.join(',');if(!junctions.has(key))junctions.set(key,new Set());junctions.get(key).add(road);}
 for(const road of data.roads){const samples=[];for(let i=1;i<road.p.length;i++){const a=road.p[i-1],b=road.p[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=road.bridge?1:Math.max(1,Math.ceil(length/20));for(let j=0;j<n;j++){const t=j/n;samples.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}samples.push(road.p.at(-1));
  const raw=samples.map(p=>streetHeight(...p));const heights=raw.map((h,i)=>i===0||i===raw.length-1||junctions.get(samples[i].join(','))?.size>1?h:(raw[i-1]+h*2+raw[i+1])/4);
  // Short lake bridges are a single plane between the approach endpoints.
  profiles.set(road,{samples,heights});
 }
 const clearanceRepairs=fitRegionalRoadClearance(data,profiles);smoothRegionalRoadProfiles(data,profiles);
 function height(road,x,z){const {samples,heights}=profiles.get(road);let best=Infinity,y=heights[0];for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1))),d=(x-a[0]-dx*t)**2+(z-a[1]-dz*t)**2;if(d<best){best=d;y=heights[i-1]+(heights[i]-heights[i-1])*t;}}if(road.bridge)return y;const bestDistance=Math.sqrt(best),radius=4;let sum=0,weight=0;for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1))),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t),u=Math.max(0,1-(d-bestDistance)/radius);if(!u)continue;const w=u*u*u*u*(5-4*u);sum+=(heights[i-1]+(heights[i]-heights[i-1])*t)*w;weight+=w;}return weight?sum/weight:y;}
 return{height,profiles,clearanceRepairs};
}
