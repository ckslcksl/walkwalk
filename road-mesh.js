import {createRoadSurfaceSampler} from './road-surface-sampler.js';
import {roadSurfaceGeometry,roadSurfaceHeight} from './road-surface.js';
import {addRoadMarkings} from './road-markings.js';
import {addBridgeStructures,addRoadEdges} from './road-structures.js';
import * as T from './three.module.js';
import {clipToSurfaceMask} from './surface-masks.js';
export function addRoadMesh({data,terrain,masks,mesh,mat,box,walkSurfaces}){
 const asphalt=clipToSurfaceMask(mat('#646b6a'),masks.road,'roads'),deck=mat('#646b6a');asphalt.roughness=deck.roughness=.97;
 if(data.roadGroundPolygons){const positions=[],indices=[];for(const poly of data.roadGroundPolygons){const shape=new T.Shape(poly[0].map(p=>new T.Vector2(p[0],-p[1])));for(const ring of poly.slice(1))shape.holes.push(new T.Path(ring.map(p=>new T.Vector2(p[0],-p[1]))));const g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);const p=g.attributes.position,start=positions.length/3;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=terrain.nearestRoad(x,z);positions.push(x,r?roadSurfaceHeight(r.road,terrain,x,z):terrain.ground(x,z)+.065,z);}for(const index of g.index.array)indices.push(start+index);g.dispose();}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));const coords=g.attributes.position,clean=[];for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2],area=(coords.getX(b)-coords.getX(a))*(coords.getZ(c)-coords.getZ(a))-(coords.getZ(b)-coords.getZ(a))*(coords.getX(c)-coords.getX(a));if(area<-.000001)clean.push(a,b,c);}g.setIndex(clean);g.computeVertexNormals();asphalt.side=T.DoubleSide;const unified=mesh(g,asphalt);unified.castShadow=false;unified.userData.roadRole='unified-ground';terrain.pavedRoadHeight=createRoadSurfaceSampler(g);}
 for(const road of data.roads){if(data.roadGroundPolygons&&!road.bridge)continue;const m=road.bridge?deck:asphalt;m.side=T.DoubleSide;mesh(roadSurfaceGeometry(road,terrain),m).castShadow=false;}
 addRoadMarkings({data,terrain,masks,mesh,mat});
 addBridgeStructures({data,terrain,mesh,mat,box,walkSurfaces});
 addRoadEdges({data,terrain,masks,mesh,mat});
}
