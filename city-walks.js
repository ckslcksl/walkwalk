import * as T from './three.module.js?v=grade-20261107';
import {clipToSurfaceMask} from './surface-masks.js?v=grade-20261107';
export function addCityWalks({scene,data,mesh,box,mat,M,lampMaterial,lampGlowMaterial,lamps,terrain,walkSurfaces,masks,collisions,clearRoad}){
 const polygon=(points,material,y)=>{const shape=new T.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);const o=mesh(g,material);o.position.y=y;o.castShadow=false;return o};
 for(const river of data.rivers||[])polygon(river,new T.MeshStandardMaterial({color:'#528f9d',roughness:.5,metalness:.1}),terrain.riverLevel);
 
 const pavement=mat('#c7c5b6'),red=mat('#ac8078'),curb=mat('#e5dfcf'),white=mat('#e9e4d5');
 const positions=[],indices=[],redPositions=[],redIndices=[];
 function strip(a,b,width,target,idx,y=.08){const dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz)||1,n=target.length/3;for(const p of [a,b])for(const side of [-1,1])target.push(p[0]+dz/d*width/2*side,y,p[1]-dx/d*width/2*side);idx.push(n,n+2,n+1,n+1,n+2,n+3)}
 const urbanEdges=data.graph.edges.filter(e=>!e.lake);
 const treeMat=mat('#73936f'),trunkMat=mat('#7f7762'),crownGeo=new T.IcosahedronGeometry(2.2,1),poleMat=M.metal;
 let counter=0;for(const e of urbanEdges){if(e.length<12)continue;const a=data.graph.nodes[e.a],b=data.graph.nodes[e.b],dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz);for(let along=8;along<d;along+=32){const t=along/d,p=new T.Vector3(a[0]+dx*t+dz/d*2.5,0,a[1]+dz*t-dx/d*2.5);if(p.z>-400&&p.x>-500)continue;p.y=terrain.ground(p.x,p.z);if(!clearRoad(p.x,p.z,.35)||walkSurfaces.nearPath(p.x,p.z,2.1))continue;if(lamps.some(q=>Math.hypot(p.x-q.x,p.z-q.z)<16))continue;box(.1,4.2,.1,poleMat,p.x,p.y+2.1,p.z);const globe=mesh(new T.SphereGeometry(.23,8,6),lampMaterial);globe.position.set(p.x,p.y+4.4,p.z);lamps.push(globe.position.clone());const glow=mesh(new T.PlaneGeometry(13,13),lampGlowMaterial);glow.position.set(a[0]+dx*t,terrain.ground(a[0]+dx*t,a[1]+dz*t)+.09,a[1]+dz*t);glow.rotation.x=-Math.PI/2;glow.castShadow=false;if(counter++%2===0){const tx=p.x+dz/d*1.2,tz=p.z-dx/d*1.2;if(!clearRoad(tx,tz,2.6)||!collisions.clearGround({x:tx,z:tz},2.6))continue;box(.25,3.6,.25,trunkMat,tx,p.y+1.8,tz);const crown=mesh(crownGeo,treeMat);crown.position.set(tx,p.y+4.4,tz);crown.scale.set(1,1.2,1)}}}
 
}
