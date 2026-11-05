import * as T from './three.module.js';
import {roadWidth,roadSections,roadSurfaceGeometry,roadSurfaceHeight} from './road-surface.js';
import {clipToSurfaceMask} from './surface-masks.js';
export function addBridgeStructures({data,terrain,mesh,mat,box,walkSurfaces}){
 const concrete=mat('#b5b3a5'),steel=mat('#66766f'),curb=mat('#c7c4b5');
 function beam(road,a,b,w,h,material,offset){const ya=roadSurfaceHeight(road,terrain,a[0],a[1])+offset,yb=roadSurfaceHeight(road,terrain,b[0],b[1])+offset,direction=new T.Vector3(b[0]-a[0],yb-ya,b[1]-a[1]),length=direction.length();if(length<.01)return;const o=box(w,h,length,material,(a[0]+b[0])/2,(ya+yb)/2,(a[1]+b[1])/2);o.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction.normalize());}
 const supports=[];
 for(const road of data.roads.filter(r=>r.bridge)){
  const g=roadSurfaceGeometry(road,terrain),p=g.attributes.position,count=p.count,positions=[],indices=[];
  for(const offset of [-.04,-.32])for(let i=0;i<count;i++)positions.push(p.getX(i),p.getY(i)+offset,p.getZ(i));
  // One continuous solid deck, with its top strictly below the asphalt.
  const original=g.index.array;for(let i=0;i<original.length;i+=3){indices.push(original[i],original[i+1],original[i+2],original[i]+count,original[i+2]+count,original[i+1]+count);}
  const across=Math.ceil(roadWidth(road)/2.5)+1,rows=count/across,side=(a,b)=>indices.push(a,b,a+count,a+count,b,b+count);
  for(let i=0;i<rows-1;i++){side(i*across,(i+1)*across);side((i+1)*across+across-1,i*across+across-1)}for(let j=0;j<across-1;j++){side(j+1,j);side((rows-1)*across+j,(rows-1)*across+j+1)}
  const slab=new T.BufferGeometry();slab.setAttribute('position',new T.Float32BufferAttribute(positions,3));slab.setIndex(indices);slab.computeVertexNormals();concrete.side=T.DoubleSide;const slabMesh=mesh(slab,concrete);slabMesh.userData={roadRole:'slab',sourceId:road.sourceId};g.dispose();
  const sections=roadSections(road,2),point=(s,offset)=>[s.x+s.nx*offset,s.z+s.nz*offset];let distance=0,nextSupport=15;
  const railPoint=(s,side)=>{let offset=s.width/2-.18;const q=point(s,offset*side),near=walkSurfaces.nearest(...q);if(near.e?.bridge&&near.distance<near.e.width/2+.5){const across=((near.p[0]-s.x)*s.nx+(near.p[1]-s.z)*s.nz)*side;offset=Math.max(offset,across+near.e.width/2+.08);}return point(s,offset*side);};
  for(let i=1;i<sections.length;i++){const a=sections[i-1],b=sections[i],step=Math.hypot(b.x-a.x,b.z-a.z);distance+=step;
   for(const side of [-1,1]){
    beam(road,point(a,a.width*.28*side),point(b,b.width*.28*side),.42,.28,concrete,-.46);
    beam(road,point(a,(a.width/2-.18)*side),point(b,(b.width/2-.18)*side),.32,.18,curb,.06);
    beam(road,railPoint(a,side),railPoint(b,side),.065,.065,steel,.96);
    const q=railPoint(a,side);box(.065,.86,.065,steel,q[0],roadSurfaceHeight(road,terrain,...q)+.51,q[1]);
   }
   if(distance>=nextSupport){nextSupport+=30;for(const side of [-1,1]){const q=point(b,b.width*.28*side);if(walkSurfaces.nearPath(q[0],q[1],1.8))continue;if(supports.some(p=>Math.hypot(q[0]-p[0],q[1]-p[1])<2))continue;
    const top=roadSurfaceHeight(road,terrain,...q)-.6,bottom=terrain.water(...q)?(terrain.waterBed?.(...q)??-2.8):Math.min(terrain.ground(...q)-.2,top-1);if(top-bottom<.8)continue;
    box(1.05,top-bottom,1.05,concrete,q[0],(top+bottom)/2,q[1]);box(1.6,.22,1.5,concrete,q[0],top-.11,q[1]);supports.push(q);
   }}
  }
 }
 return supports;
}
export function addRoadEdges({data,terrain,masks,mesh,mat}){
 const positions=[],triangle=(a,b,c)=>positions.push(...a,...b,...c);
 for(const road of data.roads){if(road.bridge)continue;const s=roadSections(road,2);for(let i=1;i<s.length;i++)for(const side of [-1,1]){const ends=[s[i-1],s[i]].map(p=>{const x=p.x+p.nx*p.width/2*side,z=p.z+p.nz*p.width/2*side,top=roadSurfaceHeight(road,terrain,x,z)-.02;return{top:[x,top,z],bottom:[x,Math.min(top-.14,(terrain.supportHeight?.(x,z)??terrain.ground(x,z)-.15)-.08),z]}});triangle(ends[0].top,ends[0].bottom,ends[1].top);triangle(ends[1].top,ends[0].bottom,ends[1].bottom);}}
 for(const road of data.roads){if(road.bridge)continue;const sections=roadSections(road,2);for(const section of [sections[0],sections.at(-1)]){if(!section)continue;const count=Math.ceil(section.width/2);for(let i=0;i<count;i++){const ends=[i/count,(i+1)/count].map(t=>{const d=(t-.5)*section.width,x=section.x+section.nx*d,z=section.z+section.nz*d,top=roadSurfaceHeight(road,terrain,x,z)-.02;return{top:[x,top,z],bottom:[x,Math.min(top-.14,(terrain.supportHeight?.(x,z)??terrain.ground(x,z)-.15)-.08),z]}});triangle(ends[0].top,ends[0].bottom,ends[1].top);triangle(ends[1].top,ends[0].bottom,ends[1].bottom);}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.computeVertexNormals();const material=clipToSurfaceMask(mat('#999b8e'),masks.road,'road-cut-edges');material.side=T.DoubleSide;mesh(g,material).castShadow=false;
}
