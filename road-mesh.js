import {roadSurfaceGeometry} from './road-surface.js';
import {addRoadMarkings} from './road-markings.js';
import {addBridgeStructures,addRoadEdges} from './road-structures.js';
import * as T from './three.module.js';
import {clipToSurfaceMask} from './surface-masks.js';
export function addRoadMesh({data,terrain,masks,mesh,mat,box,walkSurfaces}){
 const asphalt=clipToSurfaceMask(mat('#646b6a'),masks.road,'roads'),deck=mat('#646b6a');asphalt.roughness=deck.roughness=.97;
 for(const road of data.roads){const m=road.bridge?deck:asphalt;m.side=T.DoubleSide;mesh(roadSurfaceGeometry(road,terrain),m).castShadow=false;}
 addRoadMarkings({data,terrain,masks,mesh,mat});
 addBridgeStructures({data,terrain,mesh,mat,box,walkSurfaces});
 addRoadEdges({data,terrain,masks,mesh,mat});
}
