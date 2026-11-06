const pace=m=>m==='walk'||m==='run';
export function createCompanionSession({send,emit,local,peer,now=()=>performance.now()}){
 let session=null,pending=null,incoming=null,serial=0,lastInvite=-Infinity,lastTrailSeq=-1,frames=[],lastTrail=0,latestMoving=false;
 const message=(id,m)=>{try{Promise.resolve(send(id,m)).catch(()=>{})}catch{}};
 function changed(){emit({session,pending,incoming});}
 function end(reason='함께 걷기를 마쳤어요.',tell=true){if(session&&tell)message(session.peer,{type:'leave',token:session.token});if(pending&&tell)message(pending.peer,{type:'cancel',token:pending.token});if(incoming&&tell)message(incoming.peer,{type:'decline',token:incoming.token});const active=!!session;session=null;pending=null;incoming=null;frames=[];lastTrailSeq=-1;changed();if(active)emit({ended:true,reason});}
 function invite(id,mode){const p=peer(id),l=local();if(!p||!pace(mode)||!pace(l?.mode)||!pace(p.mode)||session||pending||incoming)return false;if(Math.hypot(p.x-l.x,p.z-l.z)>40)return false;if(now()-lastInvite<1500)return false;lastInvite=now();pending={peer:id,mode,token:crypto.randomUUID(),at:now()};message(id,{type:'invite',mode,token:pending.token});changed();return true;}
 function accept(){if(!incoming)return;const q=incoming;if(!peer(q.peer)||!pace(local()?.mode)||!pace(peer(q.peer).mode)){decline();return}session={peer:q.peer,token:q.token,role:'follower',mode:q.mode};incoming=null;pending=null;frames=[];lastTrail=now();message(session.peer,{type:'accept',token:session.token});changed();emit({started:true,role:'follower',mode:session.mode});}
 function decline(){if(incoming)message(incoming.peer,{type:'decline',token:incoming.token});incoming=null;changed();}
 function receive(id,m){if(!m||typeof m!=='object'||typeof m.token!=='string'||m.token.length>80)return;const l=local(),p=peer(id);if(!p)return;
 if(m.type==='invite'){if(session||pending||incoming||!pace(m.mode)||!pace(l?.mode)||!pace(p.mode)||Math.hypot(p.x-l.x,p.z-l.z)>40){message(id,{type:'decline',token:m.token});return}incoming={peer:id,token:m.token,mode:m.mode,at:now()};changed();return}
 if(m.type==='accept'&&pending?.peer===id&&pending.token===m.token){if(now()-pending.at>20000||!pace(l?.mode)||!pace(p.mode)){message(id,{type:'leave',token:m.token});pending=null;changed();return}session={peer:id,token:m.token,role:'leader',mode:pending.mode};pending=null;frames=[];changed();emit({started:true,role:'leader',mode:session.mode});return}
 if(m.type==='decline'&&pending?.peer===id&&pending.token===m.token){pending=null;changed();emit({notice:'이번에는 함께 걷지 않기로 했어요.'});return}
 if(m.type==='cancel'&&incoming?.peer===id&&incoming.token===m.token){incoming=null;changed();return}
 if(!session||session.peer!==id||session.token!==m.token)return;
 if(m.type==='leave'){end('상대가 함께 걷기를 마쳤어요.',false);return}
 if(m.type==='pace'&&session.role==='leader'&&pace(m.mode)){session.mode=m.mode;emit({pace:m.mode});changed();return}
 if(m.type==='motion'&&session.role==='leader'&&typeof m.moving==='boolean'){emit({motion:m.moving});return}
 if(m.type==='trail'&&session.role==='follower'&&pace(m.mode)&&Number.isSafeInteger(m.seq)&&m.seq>lastTrailSeq&&Array.isArray(m.points)&&m.points.length<=8){const at=now();if(m.points.some(q=>!q||!Number.isInteger(q.id)||q.id<0||!Number.isFinite(q.t)||q.t<0||q.t>1||typeof q.forward!=='boolean'||!Number.isFinite(q.age)||q.age<0||q.age>1000))return;lastTrailSeq=m.seq;lastTrail=at;latestMoving=m.moving===true;session.mode=m.mode;for(const q of m.points)frames.push({...q,time:at-q.age,mode:m.mode,moving:m.moving===true});frames.sort((a,b)=>a.time-b.time);if(frames.length>30)frames.splice(0,frames.length-30);changed();}
 }
 function tick(){if(pending&&now()-pending.at>20000){pending=null;changed();emit({notice:'초대 시간이 지났어요.'})}if(incoming&&now()-incoming.at>20000){incoming=null;changed()}if(session&&(!peer(session.peer)||!pace(local()?.mode)||!pace(peer(session.peer).mode)))end('함께 걷기를 마쳤어요.');if(session?.role==='follower'&&now()-lastTrail>6000)end('상대의 연결이 잠시 끊겼어요.');}
 function controlMode(mode){if(!pace(mode)){end('탈것은 혼자 이용해요.');return false}if(session?.role==='follower'){message(session.peer,{type:'pace',token:session.token,mode});return true}return false;}
 function controlMotion(moving){if(session?.role!=='follower')return false;message(session.peer,{type:'motion',token:session.token,moving});return true;}
 function sendTrail(points,mode,moving){if(session?.role==='leader'&&pace(mode)){if(session.mode!==mode){session.mode=mode;changed()}message(session.peer,{type:'trail',token:session.token,seq:serial++,points,mode,moving});}}
 function sample(){if(session?.role!=='follower')return null;const target=now()-250;while(frames.length>2&&frames[1].time<=target)frames.shift();const a=frames[0],b=frames[1]||a;if(!a)return{mode:session.mode,moving:false};return{a,b,t:a===b?1:Math.max(0,Math.min(1,(target-a.time)/(b.time-a.time||1))),mode:session.mode,moving:now()-lastTrail<1200&&latestMoving};}
 return{invite,accept,decline,receive,tick,end,controlMode,controlMotion,sendTrail,sample,get state(){return{session,pending,incoming}}};
}
