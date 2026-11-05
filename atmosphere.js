import * as T from './three.module.js';
export function createAtmosphere(scene){
 const uniforms={sunDir:{value:new T.Vector3(0,1,0)},day:{value:1},night:{value:0},time:{value:0}};
 const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms,vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
 varying vec3 direction;uniform vec3 sunDir;uniform float day,night,time;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){return .52*noise(p)+.27*noise(p*2.03)+.14*noise(p*4.11)+.07*noise(p*8.23);}
 void main(){vec3 d=normalize(direction);float h=max(0.,d.y);float dusk=(1.-day)*(1.-night);
 vec3 zenith=mix(vec3(.003,.008,.025),vec3(.025,.16,.43),day);
 vec3 horizon=mix(vec3(.018,.03,.06),vec3(.46,.67,.83),day);horizon=mix(horizon,vec3(.91,.45,.28),dusk*.8);
 vec3 col=mix(horizon,zenith,pow(h,.32));float sun=max(0.,dot(d,sunDir));col+=vec3(1.,.65,.27)*pow(sun,26.)*(.16+.35*dusk)*(1.-night);
 vec2 uv=d.xz/max(.16,d.y)*1.65+vec2(time*.0018,time*.0006);float c=fbm(uv);float cloud=smoothstep(.49,.69,c)*smoothstep(.035,.2,d.y);
 vec3 cloudColor=mix(vec3(.04,.06,.10),vec3(.95,.96,.94),day);cloudColor=mix(cloudColor,vec3(1.,.65,.49),dusk*.65);cloudColor*=.82+.18*noise(uv*3.);col=mix(col,cloudColor,cloud*.88);
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const dome=new T.Mesh(new T.SphereGeometry(4200,32,20),material);dome.renderOrder=-100;dome.frustumCulled=false;scene.add(dome);
 return{update(position,solar,night,time){dome.position.copy(position);uniforms.sunDir.value.copy(solar.direction);uniforms.day.value=T.MathUtils.smoothstep(solar.elevation,-5,12);uniforms.night.value=night;uniforms.time.value=time}};
}
