import * as T from './three.module.js';
// Camera movement is independent of the walking graph and never advances the avatar.
export function createExploreCamera({camera,canvas,terrain,onChange}){
 const keys=new Set(),position=new T.Vector3();let active=false,yaw=0,pitch=-.28,fast=false;
 const panel=document.createElement('section');panel.className='explore-panel';panel.hidden=true;
 panel.innerHTML='<strong>동네 둘러보기</strong><span>드래그로 시선 · W A S D 이동 · Q / E 높이 · Shift 빠르게</span><label>이동 속도 <select aria-label="자유 카메라 이동 속도"><option value="20">천천히</option><option value="65" selected>빠르게</option><option value="150">아주 빠르게</option></select></label><button>산책 시점으로 돌아가기 <small>Esc</small></button>';
 document.body.append(panel);const select=panel.querySelector('select');
 function stop(){active=false;keys.clear();panel.hidden=true;onChange(false)}
 panel.querySelector('button').onclick=stop;
 function start(){position.copy(camera.position);const direction=camera.getWorldDirection(new T.Vector3());yaw=Math.atan2(direction.x,direction.z);pitch=Math.asin(direction.y);active=true;panel.hidden=false;onChange(true)}
 addEventListener('keydown',e=>{if(!active||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Escape'){stop();return}if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space'].includes(e.code)){keys.add(e.code);e.preventDefault();e.stopImmediatePropagation()}},true);
 addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
 return{get active(){return active},toggle(){active?stop():start()},stop,
 rotate(dx,dy){yaw-=dx*.004;pitch=T.MathUtils.clamp(pitch-dy*.004,-1.45,1.45)},
 wheel(delta){position.y=T.MathUtils.clamp(position.y+delta*.08,terrain.ground(position.x,position.z)+1.7,1100)},
 update(dt){if(!active)return;fast=keys.has('ShiftLeft')||keys.has('ShiftRight');const speed=Number(select.value)*(fast?3:1)*dt;
 const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),right=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),up=Number(keys.has('KeyE'))-Number(keys.has('KeyQ'));
 const v=new T.Vector3(Math.sin(yaw)*forward-Math.cos(yaw)*right,up,Math.cos(yaw)*forward+Math.sin(yaw)*right);if(v.length()>1)v.normalize();position.addScaledVector(v,speed);position.x=T.MathUtils.clamp(position.x,-2200,1300);position.z=T.MathUtils.clamp(position.z,-2650,950);position.y=T.MathUtils.clamp(position.y,terrain.ground(position.x,position.z)+1.7,1100);camera.position.copy(position);camera.lookAt(position.x+Math.sin(yaw)*Math.cos(pitch),position.y+Math.sin(pitch),position.z+Math.cos(yaw)*Math.cos(pitch));}
 };
}
