import * as T from './three.module.js';
const TAU=Math.PI*2,lerp=T.MathUtils.lerp,damp=(a,b,dt,rate=16)=>lerp(a,b,1-Math.exp(-rate*dt));
export function createWalker({scene,mesh,box,mat}){
 const person=new T.Group(),body=new T.Group(),spine=new T.Group(),headRig=new T.Group();scene.add(person);person.add(body);body.add(spine);spine.position.y=.94;
 const shirt=mat('#e8ddd0'),pants=mat('#5d7777'),skin=mat('#e8bb9b'),shoe=mat('#faf6e8');
 const torso=mesh(new T.CapsuleGeometry(.27,.39,4,10),shirt,spine);torso.position.y=.19;
 spine.add(headRig);headRig.position.y=.82;mesh(new T.SphereGeometry(.235,16,12),skin,headRig);
 const hair=mesh(new T.SphereGeometry(.241,16,8,0,TAU,0,Math.PI*.56),mat('#504338'),headRig);hair.position.y=.025;hair.visible=false;
 const cap=mesh(new T.SphereGeometry(.246,16,8,0,TAU,0,Math.PI*.55),mat('#547c71'),headRig);cap.position.y=.03;const brim=box(.41,.035,.27,cap.material,0,.06,-.2,headRig);
 const eyeMaterial=mat('#393d37');for(const side of [-1,1]){const eye=mesh(new T.SphereGeometry(.017,8,6),eyeMaterial,headRig);eye.position.set(side*.078,.015,-.222)}
 const legs=[],knees=[],ankles=[],arms=[],elbows=[];
 for(const side of [-1,1]){
  const hip=new T.Group();hip.position.set(side*.15,.86,0);body.add(hip);const thigh=mesh(new T.CapsuleGeometry(.105,.22,3,8),pants,hip);thigh.position.y=-.19;
  const knee=new T.Group();knee.position.y=-.38;hip.add(knee);const calf=mesh(new T.CapsuleGeometry(.09,.24,3,8),pants,knee);calf.position.y=-.2;
  const ankle=new T.Group();ankle.position.y=-.4;knee.add(ankle);box(.22,.13,.36,shoe,0,0,-.07,ankle);legs.push(hip);knees.push(knee);ankles.push(ankle);
  const shoulder=new T.Group();shoulder.position.set(side*.34,.44,0);spine.add(shoulder);const upper=mesh(new T.CapsuleGeometry(.085,.13,3,8),shirt,shoulder);upper.position.y=-.13;
  const elbow=new T.Group();elbow.position.y=-.25;shoulder.add(elbow);const forearm=mesh(new T.CapsuleGeometry(.073,.13,3,8),shirt,elbow);forearm.position.y=-.12;const hand=mesh(new T.SphereGeometry(.078,8,8),skin,elbow);hand.position.y=-.27;arms.push(shoulder);elbows.push(elbow);
 }
 let phase=0,runBlend=0,rootY=0,wasSitting=false;const desiredRotation=new T.Quaternion(),axis=new T.Vector3(0,1,0);
 function update({dt,speed,run,sitting,heading,time}){
  if(sitting&&!wasSitting){rootY=0;body.rotation.set(0,0,0);body.position.set(0,0,0);spine.position.y=1.03;legs.forEach(l=>l.rotation.x=Math.PI/2);knees.forEach(k=>k.rotation.x=-Math.PI/2);ankles.forEach(a=>a.rotation.x=0);person.quaternion.setFromAxisAngle(axis,heading)}wasSitting=sitting;spine.position.y=damp(spine.position.y,sitting?1.03:.94,dt,18);
  runBlend=damp(runBlend,run?1:0,dt,5);const nominal=lerp(1.35,3.3,runBlend),activity=T.MathUtils.smoothstep(speed,.025,nominal*.65),frequency=lerp(1.05,1.7,runBlend)*Math.min(1,speed/Math.max(nominal,.1));const oldPhase=phase,nextPhase=phase+dt*frequency,footfall=!sitting&&speed>.2&&Math.floor(nextPhase*2)>Math.floor(oldPhase*2);phase=nextPhase%1;
  const duty=lerp(.64,.4,runBlend),stride=frequency>.001?Math.min(.88,speed*duty/frequency):0;
  const walkBob=.021*Math.cos(phase*TAU*2),runBob=.065*Math.cos((phase-.45)*TAU*2);
  const targetY=sitting?0:activity*(-.105+lerp(walkBob,runBob,runBlend))+(1-activity)*Math.sin(time*1.7)*.003;
  rootY=damp(rootY,targetY,dt,20);body.position.y=rootY;
  body.position.x=damp(body.position.x,sitting?0:Math.sin(phase*TAU)*.018*activity*(1-runBlend*.65),dt);
  body.rotation.z=damp(body.rotation.z,sitting?0:Math.sin(phase*TAU)*.025*activity,dt);
  body.rotation.y=damp(body.rotation.y,sitting?0:Math.sin(phase*TAU)*.035*activity,dt);
  spine.rotation.x=damp(spine.rotation.x,sitting?-.04:lerp(-.015,-.13,runBlend)*activity,dt);
  spine.rotation.y=damp(spine.rotation.y,sitting?0:-Math.sin(phase*TAU)*lerp(.055,.11,runBlend)*activity,dt);
  headRig.rotation.x=damp(headRig.rotation.x,-spine.rotation.x*.7,dt,10);headRig.rotation.y=damp(headRig.rotation.y,-spine.rotation.y*.65,dt,10);
  desiredRotation.setFromAxisAngle(axis,heading);person.quaternion.slerp(desiredRotation,1-Math.exp(-dt*10));
  for(let i=0;i<2;i++){
   const c=(phase+i*.5)%1,stance=c<duty,swing=(c-duty)/(1-duty);let z,y,footPitch=0;
   if(stance){const t=c/duty;z=lerp(-stride/2,stride/2,t);y=.085;footPitch=activity*(t<.15?lerp(-.16,0,t/.15):t>.78?lerp(0,.3,(t-.78)/.22):0)}
   else{const t=swing,smooth=t*t*(3-2*t);z=lerp(stride/2,-stride/2,smooth);y=.085+activity*lerp(.115,.33,runBlend)*Math.pow(Math.sin(Math.PI*t),1.3);footPitch=activity*lerp(.3,-.16,t)}
   if(!sitting){
    const vertical=.86+rootY-y,dist=T.MathUtils.clamp(Math.hypot(vertical,z),.06,.779),upper=.38,lower=.4;
    const kneeAngle=-Math.acos(T.MathUtils.clamp((dist*dist-upper*upper-lower*lower)/(2*upper*lower),-1,1));
    const hipAngle=Math.atan2(-z,vertical)+Math.acos(T.MathUtils.clamp((upper*upper+dist*dist-lower*lower)/(2*upper*dist),-1,1));
    legs[i].rotation.x=damp(legs[i].rotation.x,hipAngle,dt,24);knees[i].rotation.x=damp(knees[i].rotation.x,kneeAngle,dt,24);ankles[i].rotation.x=damp(ankles[i].rotation.x,-hipAngle-kneeAngle+footPitch,dt,24);
   }else{legs[i].rotation.x=damp(legs[i].rotation.x,Math.PI/2,dt,12);knees[i].rotation.x=damp(knees[i].rotation.x,-Math.PI/2,dt,12);ankles[i].rotation.x=damp(ankles[i].rotation.x,0,dt,12)}
   const swingArm=-Math.cos(c*TAU)*lerp(.3,.58,runBlend)*activity;
   arms[i].rotation.x=damp(arms[i].rotation.x,sitting?.24:swingArm,dt,18);arms[i].rotation.z=damp(arms[i].rotation.z,(i?1:-1)*(sitting?.07:.065),dt);
   elbows[i].rotation.x=damp(elbows[i].rotation.x,sitting?.9:lerp(.16,1.25,runBlend)*activity+.10+(1-runBlend)*Math.max(0,swingArm)*.3,dt,16);
  }
  return{footfall,run:runBlend>.5};
 }
 function setAppearance(config){for(const [key,material]of [['shirt',shirt],['pants',pants],['skin',skin],['shoes',shoe],['cap',cap.material]])if(/^#[0-9a-f]{6}$/i.test(config[key]||''))material.color.set(config[key]);const hat=config.hat!==false;cap.visible=brim.visible=hat;hair.visible=!hat;}
 return{person,update,setAppearance};
}
