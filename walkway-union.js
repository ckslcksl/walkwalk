import * as T from './three.module.js';
import {indexedTerrain}from'./indexed-terrain.js';
import {clipToSurfaceMask}from'./surface-masks.js';
// A single polygon surface replaces independent intersecting paving rectangles.
export function addUnifiedWalkways({data,walkSurfaces,terrain,mesh,mat,masks}){if(!data.walkGroundTiles)return false;
 const positions=[],indices=[],walls=[],curbs=[],project=(e,x,z)=>{const a=data.graph.nodes[e.a],b=data.graph.nodes[e.b],dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);return{t,d:Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)};};
 for(const tile of data.walkGroundTiles){const edges=tile.e.map(i=>data.graph.edges[i]),cache=new Map(),height=(x,z)=>{const key=x.toFixed(5)+","+z.toFixed(5);if(cache.has(key))return cache.get(key);let sum=0,weight=0,best=Infinity,closest=0;for(const e of edges){const q=project(e,x,z),h=walkSurfaces.surfaceAt(e,x,z,q.t)-.008,w=1/Math.pow(.12+q.d,3);sum+=h*w;weight+=w;if(q.d<best){best=q.d;closest=h;}}const h=walkSurfaces.unifiedHeight(x,z,best<.025?closest:sum/weight);cache.set(key,h);return h;};
 const shape=new T.Shape(tile.p[0].map(p=>new T.Vector2(p[0],-p[1])));for(const ring of tile.p.slice(1))shape.holes.push(new T.Path(ring.map(p=>new T.Vector2(p[0],-p[1]))));const g=new T.ShapeGeometry(shape),p=g.attributes.position,ix=g.index.array;
 const triangle=(a,b,c,depth=0)=>{const ab=Math.hypot(a[0]-b[0],a[1]-b[1]),bc=Math.hypot(b[0]-c[0],b[1]-c[1]),ca=Math.hypot(c[0]-a[0],c[1]-a[1]);const mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2],ha=height(...a),hb=height(...b),hc=height(...c),center=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3],curve=Math.max(Math.abs(height(...center)-(ha+hb+hc)/3),Math.abs(height(...mid(a,b))-(ha+hb)/2),Math.abs(height(...mid(b,c))-(hb+hc)/2),Math.abs(height(...mid(c,a))-(hc+ha)/2));if((Math.max(ab,bc,ca)>2||curve>.035&&Math.max(ab,bc,ca)>.15)&&depth<10){const mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];if(ab>=bc&&ab>=ca){const m=mid(a,b);triangle(a,m,c,depth+1);triangle(m,b,c,depth+1);}else if(bc>=ca){const m=mid(b,c);triangle(a,b,m,depth+1);triangle(a,m,c,depth+1);}else{const m=mid(c,a);triangle(a,b,m,depth+1);triangle(m,b,c,depth+1);}return;}const start=positions.length/3;for(const q of[a,b,c])positions.push(q[0],height(...q),q[1]);indices.push(start,start+1,start+2);};
 for(let i=0;i<ix.length;i+=3)triangle(...[ix[i],ix[i+1],ix[i+2]].map(k=>[p.getX(k),-p.getY(k)]));g.dispose();
 // Foundations stay below the unified surface; no interior vertical seams above it.
 for(const ring of tile.p)for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];if([0,1].some(k=>Math.abs(a[k]-b[k])<.0001&&Math.abs(a[k]/8-Math.round(a[k]/8))<.0001))continue;const ay=height(...a)-.035,by=height(...b)-.035,low=q=>Math.min(height(...q)-.18,terrain.supportHeight?.(...q)??height(...q)-.4);walls.push(a[0],ay,a[1],a[0],low(a),a[1],b[0],by,b[1],b[0],by,b[1],a[0],low(a),a[1],b[0],low(b),b[1]);}
 }
 for(const[array,color,role]of[[positions,'#c7bda9','unified-walk-surface'],[walls,'#9c9c88','unified-walk-foundation']]){const g=indexedTerrain(array);const m=mat(color);m.side=T.DoubleSide;if(masks)clipToSurfaceMask(m,masks.road,role,'r');const o=mesh(g,m);o.castShadow=false;o.userData.surfaceRole=role;}
 return true;
}

export async function addUnifiedWalkwaysAsync(options){if(typeof window!=='undefined'&&options.data.walkGroundTiles){try{const cache=await import('./walkway-cache.js');if(await cache.loadWalkwayCache(options))return true;}catch(e){console.warn('Walking surface cache fallback',e.message);}}return addUnifiedWalkways(options);}
