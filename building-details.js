import * as T from './three.module.js?v=grade-20261107';
const buildingNight={value:0};
export function setBuildingNight(value){buildingNight.value=T.MathUtils.clamp(value,0,1)}
// Metric facade patterns stay sharp up close without thousands of separate window meshes.
export function facadeMaterial(mode=0){
 const palettes=['#d3d1c4','#afc2c6','#d0c9bc','#b8c6ce','#c6bbaa','#dad7cc','#baab80','#e5dfcd','#9caeb2'];
 const material=new T.MeshStandardMaterial({color:palettes[mode],roughness:(mode===1||mode===6)?.38:.72,metalness:mode===6?.4:mode===1?.25:.08});
 material.onBeforeCompile=shader=>{
  shader.uniforms.uBuildingNight=buildingNight;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vBuildingPosition; varying vec3 vBuildingNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvBuildingPosition=(modelMatrix*vec4(transformed,1.0)).xyz;vBuildingNormal=normalize(mat3(modelMatrix)*objectNormal);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vBuildingPosition; varying vec3 vBuildingNormal;uniform float uBuildingNight;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float facadeGlow=0.0;
   vec3 facadeNormal=normalize(vBuildingNormal);
   if(abs(facadeNormal.y)<0.45){
    float across=abs(facadeNormal.x)>abs(facadeNormal.z)?vBuildingPosition.z:vBuildingPosition.x;
    vec2 metric=vec2(across,vBuildingPosition.y);
    vec2 cell=metric/vec2(${mode===6?'1.45':mode===7?'2.7':mode===1?'1.65':'2.9'},${mode===6?'3.7':mode===7?'3.6':mode===1?'4.2':'3.25'});
    vec2 tile=fract(cell),aa=max(fwidth(cell)*0.9,vec2(0.003));
    float noise=fract(sin(dot(floor(cell),vec2(127.1,311.7)))*43758.5453);
    float left=${mode===6?'0.025':mode===7?'0.24':mode===1?'0.035':mode===2?'0.10':'0.20'},right=${mode===6?'0.975':mode===7?'0.76':mode===1?'0.965':mode===2?'0.90':'0.80'};
    float bottom=${mode===6?'0.08':mode===1?'0.035':mode===2?'0.25':'0.21'},top=${mode===6?'0.90':mode===1?'0.965':mode===2?'0.74':'0.80'};
    float pane=smoothstep(left-aa.x,left+aa.x,tile.x)*(1.0-smoothstep(right-aa.x,right+aa.x,tile.x))*smoothstep(bottom-aa.y,bottom+aa.y,tile.y)*(1.0-smoothstep(top-aa.y,top+aa.y,tile.y));
    float glassLight=0.5+0.15*sin(vBuildingPosition.y*0.045+across*0.012)+noise*0.15;
    vec3 glazing=mix(vec3(0.12,0.22,0.25),vec3(0.48,0.63,0.67),glassLight);
    ${mode===6?'glazing=mix(vec3(0.27,0.26,0.18),vec3(0.72,0.65,0.43),glassLight);':''}
    if(noise>0.83)glazing=mix(glazing,vec3(0.66,0.64,0.52),0.40);
    float mullion=1.0-smoothstep(0.012,0.012+aa.x,abs(tile.x-0.5));
    glazing=mix(glazing,vec3(0.48,0.54,0.52),mullion*0.7);
    diffuseColor.rgb=mix(diffuseColor.rgb,glazing,pane*${mode===1?'0.94':'0.87'});
    facadeGlow=pane*step(0.78,noise)*(0.18+noise*0.25);
    float floorLine=(1.0-smoothstep(0.018,0.018+aa.y,tile.y));
    diffuseColor.rgb*=1.0-floorLine*0.21;
    ${mode===8?'float pier=1.0-smoothstep(0.04,0.07,min(tile.x,1.0-tile.x));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.83,0.86,0.82),pier);':''}
    ${mode===0?'float balcony=smoothstep(0.82,0.84,tile.y)*(1.0-smoothstep(0.90,0.92,tile.y));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.60,0.62,0.57),balcony*0.35);':''}
    ${mode===2?'float groundStorefront=(1.0-smoothstep(3.1,3.6,vBuildingPosition.y))*smoothstep(0.3,0.6,vBuildingPosition.y);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.19,0.30,0.31),groundStorefront*0.75);':''}
   }else{diffuseColor.rgb*=0.82;}
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.0,0.68,0.34)*facadeGlow*uBuildingNight*0.32;');
 };
 material.customProgramCacheKey=()=>`park-facade-${mode}-v3`;return material;
}
export function addRoofDetails(buildings,{mesh,box,mat}){
 const parapet=mat('#b8b9ac'),equipment=mat('#a0aaa5'),roofTop=mat('#899995'),sign=mat('#d6d3c3');
 for(let i=0;i<buildings.length;i++){
  const original=buildings[i],b={...original,h:original.h+(original.ground||0)};if(b.h<8||b.min>0||b.p.length>110)continue;
  const p=b.p.slice(0,-1);if(p.length<3)continue;const area=Math.abs(p.reduce((a,v,j)=>{const q=p[(j+1)%p.length];return a+v[0]*q[1]-q[0]*v[1]},0)/2);if(area<65)continue;
  const center=p.reduce((a,v)=>[a[0]+v[0]/p.length,a[1]+v[1]/p.length],[0,0]);
  if(/gabled|hipped|pyramidal/.test(b.roofShape||'')&&p.length<18){const minX=Math.min(...p.map(v=>v[0])),maxX=Math.max(...p.map(v=>v[0])),minZ=Math.min(...p.map(v=>v[1])),maxZ=Math.max(...p.map(v=>v[1])),height=b.roofHeight||2.2;const roof=mesh(new T.ConeGeometry(1,height,4),roofTop);roof.position.set((minX+maxX)/2,b.h-height/2,(minZ+maxZ)/2);roof.rotation.y=Math.PI/4;roof.scale.set((maxX-minX)/Math.SQRT2,1,(maxZ-minZ)/Math.SQRT2);roof.castShadow=false;continue;}
  for(let j=0;j<p.length;j++){const a=p[j],q=p[(j+1)%p.length],dx=q[0]-a[0],dz=q[1]-a[1],length=Math.hypot(dx,dz);if(length<1.2)continue;const edge=box(length,.65,.3,parapet,(a[0]+q[0])/2,b.h+.3,(a[1]+q[1])/2);edge.rotation.y=-Math.atan2(dz,dx);edge.castShadow=false;}
  if(area>180&&p.length<22){const width=Math.min(9,Math.sqrt(area)*.22),depth=Math.min(7,width*.8),height=b.h>45?3.4:1.8;const room=box(width,height,depth,equipment,center[0],b.h+height/2,center[1]);room.castShadow=false;box(width+.4,.2,depth+.4,roofTop,center[0],b.h+height+.1,center[1]).castShadow=false;if(area>700)for(let k=0;k<3;k++){box(1.6,.8,1.3,equipment,center[0]+width*.8+k*2,b.h+.4,center[1]).castShadow=false;for(let l=0;l<3;l++)box(1.3,.04,.12,roofTop,center[0]+width*.8+k*2,b.h+.83,center[1]-.4+l*.35).castShadow=false;}}
  if(b.type==='retail'&&area>1000){const a=p[0],q=p[1],x=(a[0]+q[0])/2,z=(a[1]+q[1])/2;const plate=box(Math.min(18,Math.hypot(q[0]-a[0],q[1]-a[1])*.5),1.5,.18,sign,x,b.h*.65,z);plate.rotation.y=-Math.atan2(q[1]-a[1],q[0]-a[0]);plate.castShadow=false;}
 }
}
