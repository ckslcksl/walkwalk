import * as T from './three.module.js';
export function insideFootprint(x,z,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
export function createParkCollisions(buildings){
 const obstacles=buildings.filter(b=>b.h>1).map(b=>({...b,raised:b.min>.8,min:b.min+(b.ground||0),h:b.h+(b.ground||0),minX:Math.min(...b.p.map(p=>p[0])),maxX:Math.max(...b.p.map(p=>p[0])),minZ:Math.min(...b.p.map(p=>p[1])),maxZ:Math.max(...b.p.map(p=>p[1]))}));
 function clearGround(point,radius=1){for(const b of obstacles){if(b.raised||point.x+radius<b.minX||point.x-radius>b.maxX||point.z+radius<b.minZ||point.z-radius>b.maxZ)continue;if(insideFootprint(point.x,point.z,b.p))return false;for(let i=0;i<b.p.length-1;i++){const a=b.p[i],q=b.p[i+1],dx=q[0]-a[0],dz=q[1]-a[1],t=T.MathUtils.clamp(((point.x-a[0])*dx+(point.z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);if(Math.hypot(point.x-a[0]-dx*t,point.z-a[1]-dz*t)<radius)return false}}return true}
 function constrainCamera(camera,target){const dx=camera.x-target.x,dz=camera.z-target.z,dy=camera.y-target.y;let nearest=1;for(const b of obstacles){if(Math.max(camera.x,target.x)<b.minX-.3||Math.min(camera.x,target.x)>b.maxX+.3||Math.max(camera.z,target.z)<b.minZ-.3||Math.min(camera.z,target.z)>b.maxZ+.3)continue;for(let i=0;i<b.p.length-1;i++){const a=b.p[i],q=b.p[i+1],ex=q[0]-a[0],ez=q[1]-a[1],den=dx*ez-dz*ex;if(Math.abs(den)<1e-8)continue;const ax=a[0]-target.x,az=a[1]-target.z,t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den,y=target.y+dy*t;if(t>.02&&t<nearest&&u>=0&&u<=1&&y>b.min-.1&&y<b.h+.4)nearest=t}}
 if(nearest<1){const distance=Math.hypot(dx,dy,dz),t=Math.max(.08,nearest-.38/Math.max(distance,.01));camera.set(target.x+dx*t,target.y+dy*t,target.z+dz*t)}return camera;
 }
 return{clearGround,constrainCamera};
}
