// A regional DEM has one elevation per XY and cannot encode stacked streets.
// Keep the upper road grade; reconstruct a continuous lower-road underpass.
export function fitRegionalRoadClearance(data,profiles){
 if(data.region!=='suji')return[];
 const height=(r,x,z)=>{const p=profiles.get(r);let best=Infinity,y=p.heights[0];for(let i=1;i<p.samples.length;i++){const a=p.samples[i-1],b=p.samples[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1))),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);if(d<best){best=d;y=p.heights[i-1]+(p.heights[i]-p.heights[i-1])*t;}}return y;},repairs=[];
 for(const upper of data.roads.filter(r=>r.bridge))for(const lower of data.roads){if(lower===upper||(lower.layer||0)>=(upper.layer||1))continue;const shared=new Set(upper.p.map(p=>p.join(',')));if(lower.p.some(p=>shared.has(p.join(','))))continue;
  for(let i=1;i<upper.p.length;i++)for(let j=1;j<lower.p.length;j++){const a=upper.p[i-1],b=upper.p[i],c=lower.p[j-1],d=lower.p[j],ux=b[0]-a[0],uz=b[1]-a[1],vx=d[0]-c[0],vz=d[1]-c[1],den=ux*vz-uz*vx;if(Math.abs(den)<1e-6)continue;const px=c[0]-a[0],pz=c[1]-a[1],t=(px*vz-pz*vx)/den,u=(px*uz-pz*ux)/den;if(t<=.001||t>=.999||u<=.001||u>=.999)continue;const x=a[0]+ux*t,z=a[1]+uz*t,ceiling=height(upper,x,z)-.535,target=ceiling-4.5;
   if(height(lower,x,z)<=target+.01)continue;const sine=Math.abs(den)/(Math.hypot(ux,uz)*Math.hypot(vx,vz)),core=(upper.width/2+lower.width/2)/Math.max(.25,sine);repairs.push({upper,lower,x,z,target,ceiling,core});
  }
 }

 for(const road of new Set(repairs.map(r=>r.lower))){const initial=profiles.get(road),samples=[];for(let i=1;i<initial.samples.length;i++){const a=initial.samples[i-1],b=initial.samples[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));for(let k=0;k<n;k++)samples.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}samples.push(initial.samples.at(-1));const heights=samples.map(p=>height(road,...p));for(const repair of repairs.filter(r=>r.lower===road))for(let i=0;i<samples.length;i++){const p=samples[i],distance=Math.hypot(p[0]-repair.x,p[1]-repair.z);heights[i]=Math.min(heights[i],repair.target+Math.max(0,distance-repair.core)*.1);}profiles.set(road,{samples,heights});}
 // Share adjusted lower-level junction elevations with adjoining lower streets.
 const protectedKeys=new Set(data.roads.filter(r=>r.bridge).flatMap(r=>r.p.map(p=>p.join(','))));for(let pass=0;pass<3;pass++){const nodes=new Map();for(const [r,p] of profiles){for(let i=0;i<p.samples.length;i++){const key=p.samples[i].join(',');if(protectedKeys.has(key))continue;nodes.set(key,Math.min(nodes.get(key)??Infinity,p.heights[i]));}}for(const [r,p] of profiles)for(let i=0;i<p.samples.length;i++){const key=p.samples[i].join(',');if(!protectedKeys.has(key)&&nodes.has(key))p.heights[i]=nodes.get(key);}}
 return repairs.map(r=>({upperId:r.upper.sourceId,lowerId:r.lower.sourceId,x:r.x,z:r.z,requiredClearance:4.5}));
}
