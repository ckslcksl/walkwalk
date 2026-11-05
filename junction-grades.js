export function fitJunctionGrades(data,heights){
 if(data.region!=='suji')return new Map();
 const incident=data.graph.nodes.map(()=>[]);for(const e of data.graph.edges){incident[e.a].push(e);incident[e.b].push(e);}
 const junctions=new Map(),sample=(e,t)=>{const f=t*(e.surface.length-1),i=Math.min(e.surface.length-2,Math.floor(f));return e.surface[i][1]+(e.surface[i+1][1]-e.surface[i][1])*(f-i);};
 for(const [node,edges] of incident.entries()){
  if(edges.length<3&&!(edges.some(e=>e.upper)&&edges.some(e=>!e.upper)))continue;
  const origin=data.graph.nodes[node],arms=edges.map(e=>{const p=data.graph.nodes[e.a===node?e.b:e.a],dx=p[0]-origin[0],dz=p[1]-origin[1],l=Math.hypot(dx,dz),reach=Math.min(8,l),y=sample(e,e.a===node?reach/l:1-reach/l);return{e,dx:dx/l,dz:dz/l,slope:(y-heights[node])/reach};}),upper=arms.filter(a=>a.e.upper).sort((a,b)=>b.e.length-a.e.length)[0];
  let gx=0,gz=0,xx=.001,xz=0,zz=.001,bx=0,bz=0,core=2.8;
  if(upper){gx=upper.dx*upper.slope;gz=upper.dz*upper.slope;}
  else{for(const a of arms){xx+=a.dx*a.dx;xz+=a.dx*a.dz;zz+=a.dz*a.dz;bx+=a.dx*a.slope;bz+=a.dz*a.slope;}const den=xx*zz-xz*xz;gx=(bx*zz-bz*xz)/den;gz=(bz*xx-bx*xz)/den;const slope=Math.hypot(gx,gz);if(slope>.35){gx*=.35/slope;gz*=.35/slope;}}
  for(let i=0;i<arms.length;i++)for(let j=i+1;j<arms.length;j++){const dot=Math.max(-1,Math.min(1,arms[i].dx*arms[j].dx+arms[i].dz*arms[j].dz)),half=Math.sqrt((1-dot)/2);core=Math.max(core,Math.min(12,1.9/Math.max(.12,half)));}
  junctions.set(node,{x:origin[0],z:origin[1],y:heights[node],gx,gz,core,reach:core+4,upper:!!upper});
 }
 const weight=(j,d)=>{const t=Math.max(0,Math.min(1,(d-j.core)/(j.reach-j.core)));return 1-t*t*(3-2*t);};
 for(const e of data.graph.edges){if(e.upper)continue;for(let i=0;i<e.surface.length;i++){const p=e.surface[i],t=i/(e.surface.length-1),terms=[];for(const [node,d] of [[e.a,t*e.length],[e.b,(1-t)*e.length]]){const j=junctions.get(node);if(!j||d>=j.reach)continue;terms.push({w:weight(j,d),h:j.y+j.gx*(p[0]-j.x)+j.gz*(p[2]-j.z)});}if(terms.length){const sum=terms.reduce((n,a)=>n+a.w,0),strength=Math.min(1,sum);p[1]=p[1]*(1-strength)+terms.reduce((n,a)=>n+a.w*a.h,0)/sum*strength;}if(i===0)p[1]=heights[e.a];if(i===e.surface.length-1)p[1]=heights[e.b];}}
 return junctions;
}
