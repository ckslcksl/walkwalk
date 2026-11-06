import {roadSections} from './road-surface.js?v=grade-20261107';
export function createRoadOccupancy(data){
 const bins=new Map(),cell=64;for(const road of data.roads){const s=roadSections(road,12);for(let i=1;i<s.length;i++){const a=s[i-1],b=s[i],radius=Math.max(a.width,b.width)/2+8;for(let x=Math.floor((Math.min(a.x,b.x)-radius)/cell);x<=Math.floor((Math.max(a.x,b.x)+radius)/cell);x++)for(let z=Math.floor((Math.min(a.z,b.z)-radius)/cell);z<=Math.floor((Math.max(a.z,b.z)+radius)/cell);z++){const key=x+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push({a,b});}}}
 return function clearRoad(x,z,radius=0){for(const {a,b} of bins.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[]){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-a.x-dx*t,z-a.z-dz*t)<(a.width+(b.width-a.width)*t)/2+radius)return false;}return true;};
}
