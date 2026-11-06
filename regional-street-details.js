import * as T from'./three.module.js';
// Reference vocabulary: Sujigucheong stone shopfronts, framed glazing and stacked sign bands.
// Footprints/heights still come from OSM; unverified individual shop identities are omitted.
export function addRegionalStreetDetails({data,terrain,mesh,box,mat}){const stone=mat('#bbb7a9'),glass=mat('#46727b'),frame=mat('#656e6c'),dark=mat('#455656'),signs=['#e9e6d9','#d5b96b','#587873','#7a879e','#b0836c'].map(mat),stats={shopfronts:0,civicFronts:0};
 for(const b of data.buildings){if(b.min>.05||b.h<6||b.h>42||/apartments|industrial|parking|roof/.test(b.type))continue;const commercial=/commercial|retail/.test(b.type)||/프라자|빌딩|타워|의원|병원|센터/.test(b.name||''),civic=/구청|우체국|도서관|학습관|학교/.test(b.name||'');if(!commercial&&!civic)continue;
  const p=b.p,area=p.reduce((v,q,i)=>{const n=p[(i+1)%p.length];return v+q[0]*n[1]-n[0]*q[1];},0),seed=Number(b.id)%97;
  for(let i=0;i<p.length;i++){const a=p[i],q=p[(i+1)%p.length],dx=q[0]-a[0],dz=q[1]-a[1],l=Math.hypot(dx,dz);if(l<5)continue;const nx=area>0?dz/l:-dz/l,nz=area>0?-dx/l:dx/l,mx=(a[0]+q[0])/2,mz=(a[1]+q[1])/2,r=terrain.nearestRoad(mx,mz);if(!r||r.d>45||(r.x-mx)*nx+(r.z-mz)*nz<.2)continue;
   const yaw=-Math.atan2(dz,dx),place=(w,h,d,m,u,y,out=.08)=>{const o=box(w,h,d,m,mx+dx/l*u+nx*out,b.ground+y,mz+dz/l*u+nz*out);o.rotation.y=yaw;o.castShadow=false;return o;},bayCount=Math.max(1,Math.floor(l/3.6)),bay=l/bayCount;
   for(let k=0;k<bayCount;k++){const u=-l/2+(k+.5)*bay;place(bay-.18,2.45,.07,glass,u,1.55);place(.12,2.9,.18,stone,u-bay/2,1.48);place(bay-.12,.1,.14,frame,u,2.8);place(.07,2.2,.1,frame,u,1.5,.13);if(!civic){place(bay-.2,.65,.22,signs[(seed+k)%signs.length],u,3.25,.14);if(b.h>10){place(bay-.22,.7,.16,signs[(seed+k+2)%signs.length],u,6.4,.12);place(bay-.12,.12,.3,stone,u,6.9,.13);}}}
   place(l,.16,.48,dark,0,3.75,.21);if(civic){place(Math.min(9,l*.6),.8,.22,signs[0],0,3.45,.16);stats.civicFronts++;}else stats.shopfronts++;
  }
 }return stats;
}
