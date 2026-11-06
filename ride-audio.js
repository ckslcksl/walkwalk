export function createRideAudio(ctx,output){
 const rate=ctx.sampleRate;
 function loop(fill){const buffer=ctx.createBuffer(1,rate*2,rate),data=buffer.getChannelData(0);let low=0,previous=0;for(let i=0;i<data.length;i++){const n=Math.random()*2-1;low+=(n-low)*.035;data[i]=fill(i/rate,n,low,n-previous);previous=n;}const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain).connect(output);source.start();return{source,gain};}
 // Quiet tire roll shared by both vehicles, with a separate freewheel texture.
 const tires=loop((t,n,low)=>low*.65),freewheel=loop((t,n,low,high)=>(high*.055+Math.sin(t*Math.PI*3600)*.019)*Math.exp(-((t*22)%1)*24));
 const kickBuffer=ctx.createBuffer(1,Math.ceil(rate*.22),rate),kickData=kickBuffer.getChannelData(0);for(let i=0;i<kickData.length;i++){const t=i/rate;kickData[i]=((Math.random()*2-1)*.045+Math.sin(t*Math.PI*180)*.018)*Math.sin(Math.PI*i/kickData.length)**2;}
 let previousPhase=null,previousMode=null,lastKick=-Infinity;
 function update({speed=0,vehicleMode='walk',riding=false,ridePhase=0,enabled=true}){const moving=enabled&&speed>.08,vehicle=vehicleMode==='bike'||vehicleMode==='scooter',volume=moving&&vehicle?Math.min(1,speed/2.5):0,now=ctx.currentTime;
 tires.gain.gain.setTargetAtTime(volume,now,.08);tires.source.playbackRate.setTargetAtTime(Math.max(.55,Math.min(2,speed/3)),now,.12);
 freewheel.gain.gain.setTargetAtTime(moving&&vehicleMode==='bike'&&riding?volume*.55:0,now,.08);freewheel.source.playbackRate.setTargetAtTime(Math.max(.6,Math.min(1.8,speed/4)),now,.12);
 // The left foot starts its grounded push at the beginning of each visual cycle.
 const phase=ridePhase%1,continuous=previousMode===vehicleMode&&previousPhase!==null,crossed=continuous&&(phase<previousPhase||(previousPhase===0&&phase>0));
 if(moving&&vehicleMode==='scooter'&&riding&&crossed&&now-lastKick>.3){const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=kickBuffer;gain.gain.value=Math.min(1,speed/1.5);source.connect(gain).connect(output);source.onended=()=>{source.disconnect();gain.disconnect()};source.start();lastKick=now;}
 previousPhase=moving&&riding?phase:null;previousMode=vehicleMode;
 }
 return{update};
}
