import {roadCutouts} from './road-surface.js';
import * as T from './three.module.js';
export const MASK_BOUNDS={minX:-2200,minZ:-2650,w:3500,h:3600};
export function createSurfaceMasks(data){
 const {minX,minZ,w,h}=MASK_BOUNDS,size=4096,xy=p=>[(p[0]-minX)/w*size,(p[1]-minZ)/h*size];
 function canvas(){const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,size,size);return{c,ctx}}
 function polygon(ctx,p,color){ctx.fillStyle=color;ctx.beginPath();p.forEach((p,i)=>{const q=xy(p);i?ctx.lineTo(...q):ctx.moveTo(...q)});ctx.closePath();ctx.fill()}
 const land=canvas(),road=canvas(),paving=canvas();for(const m of [land,road,paving]){polygon(m.ctx,data.lake,'#000');for(const p of data.rivers||[])polygon(m.ctx,p,'#000');for(const p of data.islands)polygon(m.ctx,p,'#fff');}
 land.ctx.strokeStyle='#000';land.ctx.lineCap='round';land.ctx.lineJoin='round';for(const e of data.graph.edges){if(e.bridge||e.roadCrossing)continue;const a=xy(data.graph.nodes[e.a]),b=xy(data.graph.nodes[e.b]);land.ctx.lineWidth=(e.width+.12)/w*size;land.ctx.beginPath();land.ctx.moveTo(...a);land.ctx.lineTo(...b);land.ctx.stroke();}
 // Remove both the regional mesh and detailed bank wherever asphalt is visible.
 // The same section frames and widths build the road mesh, eliminating slope intrusion.
 for(const r of data.roads){if(r.bridge)continue;for(const triangle of roadCutouts(r)){polygon(land.ctx,triangle,'#000');polygon(paving.ctx,triangle,'#000');}}
 return{land:new T.CanvasTexture(land.c),road:new T.CanvasTexture(road.c),paving:new T.CanvasTexture(paving.c)};
}
export function clipToSurfaceMask(material,texture,key='surface'){
 material.onBeforeCompile=shader=>{shader.uniforms.uSurfaceMask={value:texture};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vSurfaceXZ;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSurfaceXZ=(modelMatrix*vec4(transformed,1.)).xz;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vSurfaceXZ;uniform sampler2D uSurfaceMask;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nvec2 surfaceUV=vec2((vSurfaceXZ.x+2200.)/3500.,1.-(vSurfaceXZ.y+2650.)/3600.);if(texture2D(uSurfaceMask,surfaceUV).g<.5)discard;');};material.customProgramCacheKey=()=>`surface-mask-${key}-v2`;return material;
}
