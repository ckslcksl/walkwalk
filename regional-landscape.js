import * as T from './three.module.js?v=grade-20261107';
// Stream-bank reeds and clipped park shrubs, based on Seongbokcheon approach photos.
// Sample the rendered earth and leave the complete walking/road corridor clear.
export function addRegionalLandscape({data,terrain,walkSurfaces,collisions,clearRoad,mesh,mat,rand}){
 const shrub=new T.IcosahedronGeometry(1,0),stem=new T.CylinderGeometry(.035,.055,1,4),leaf=mat('#687f49'),reed=mat('#a49a68'),heads=mat('#80734c');let count=0;
 const place=(x,z,kind)=>{if(!clearRoad(x,z,1.4)||terrain.water(x,z)||walkSurfaces.nearPath(x,z,1.6)||!collisions.clearGround({x,z},1.2)||terrain.sportsGround.contains(x,z))return;const y=terrain.topHeight(x,z),levels=[[.6,0],[-.6,0],[0,.6],[0,-.6]].map(([a,b])=>terrain.topHeight(x+a,z+b));if(levels.some(h=>Math.abs(h-y)>.35)||Math.abs(y-terrain.ground(x,z))>1.1)return;
  if(kind==='reed'){for(let j=0;j<3;j++){const h=.65+rand()*.55,o=mesh(stem,reed);o.position.set(x+(rand()-.5)*.55,y+h/2,z+(rand()-.5)*.55);o.scale.y=h;const tip=mesh(shrub,heads);tip.position.copy(o.position);tip.position.y=y+h;tip.scale.set(.08,.19,.08);}}else{const o=mesh(shrub,leaf);o.position.set(x,y+.34,z);o.scale.set(.8+rand()*.35,.42+rand()*.2,.65+rand()*.25);}count++;
 };
 for(const stream of data.streams)for(let i=1;i<stream.p.length;i++){const a=stream.p[i-1],b=stream.p[i],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);for(let d=0;d<l;d+=7){const t=d/l;for(const side of[-1,1]){const offset=stream.width/2+2.5+rand()*3;place(a[0]+dx*t+dz/l*offset*side,a[1]+dz*t-dx/l*offset*side,'reed');}}}
 for(const park of data.parks)for(let i=0;i<park.p.length;i++){const a=park.p[i],b=park.p[(i+1)%park.p.length],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);for(let d=2;d<l;d+=6){const t=d/l,x=a[0]+dx*t,z=a[1]+dz*t;place(x,z,'shrub');}}
 return count;
}
