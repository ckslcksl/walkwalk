// Split a transition triangle at the regular terrain grid and its diagonals.
// Heights are then linear within each piece, so the bank cannot cut through
// the original terrain between two sampled vertices.
export function conformBankTriangle(points,terrain,emit){
 const x0=-2200,z0=-2650,sx=3500/220,sz=3600/226;
 const clip=(poly,a,b)=>{const out=[],side=p=>(b[0]-a[0])*(p[2]-a[1])-(b[1]-a[1])*(p[0]-a[0]);for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=side(p),dq=side(q);if(dp>=-1e-8)out.push(p);if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);out.push(p.map((v,k)=>v+(q[k]-v)*t));}}return out;};
 const minI=Math.max(0,Math.floor((Math.min(...points.map(p=>p[0]))-x0)/sx)),maxI=Math.min(219,Math.floor((Math.max(...points.map(p=>p[0]))-x0)/sx)),minJ=Math.max(0,Math.floor((Math.min(...points.map(p=>p[2]))-z0)/sz)),maxJ=Math.min(225,Math.floor((Math.max(...points.map(p=>p[2]))-z0)/sz));
 for(let j=minJ;j<=maxJ;j++)for(let i=minI;i<=maxI;i++){const x=x0+i*sx,z=z0+j*sz,a=[x,z],b=[x+sx,z],c=[x+sx,z+sz],d=[x,z+sz];for(const tri of [[a,b,d],[b,c,d]]){let poly=points;for(let k=0;k<3&&poly.length;k++)poly=clip(poly,tri[k],tri[(k+1)%3]);for(const p of poly)if(p[3]>=.4-1e-7)p[1]=Math.max(p[1],terrain.topHeight(p[0],p[2])+.01*(1-p[3]));for(let k=1;k+1<poly.length;k++)emit(poly[0].slice(0,3),poly[k].slice(0,3),poly[k+1].slice(0,3));}}
}
