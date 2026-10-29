/* ---- local player ---- */
const P={x:6,z:22,f:1,yaw:-Math.PI/2,pitch:0,y:1.6,init:0,step:0,bob:0,bl:0},k={};let shake=0,hurtT=0,last=performance.now(),sT=0,hbT=0,pw=0;
const LVN=['Low','Medium','High','Ultra'],postCA=()=>cfg.lv.post=='High'||cfg.lv.post=='Ultra';
function applyQ(){const L=k=>Math.max(0,LVN.indexOf(cfg.lv[k]));R.setPixelRatio({Low:.6,Medium:1,High:1.25,Ultra:Math.min(devicePixelRatio,2)}[cfg.q]||1);
 const sh=L('shadows');R.shadowMap.enabled=sh>0;FLS.castShadow=sh>0;const sz=[256,512,1024,2048][sh];FLS.shadow.mapSize.set(sz,sz);if(FLS.shadow.map){FLS.shadow.map.dispose();FLS.shadow.map=null}
 const far=[30,45,65,90][L('view')];cam.far=far;sc.fog.density=3.6/far*[.85,.95,1,1.1][L('fog')];FOGP.forEach((m,i)=>m.visible=L('fog')>i);
 dust.visible=L('particles')>0;dustG.setDrawRange(0,[0,50,100,150][L('particles')]);$('vig').style.display=L('post')>0?'':'none';cam.updateProjectionMatrix();sc.traverse(o=>{if(o.material)o.material.needsUpdate=true});resize()}
function resize(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}addEventListener('resize',resize);
document.querySelectorAll('.seg').forEach(sg=>{const k=sg.dataset.k;LVN.forEach(v=>{const b=document.createElement('button');b.textContent=v;b.onclick=()=>{if(k=='q'){cfg.q=v;['shadows','particles','post','fog','view'].forEach(x=>cfg.lv[x]=v)}else cfg.lv[k]=v;saveCfg();syncUI();applyQ()};sg.appendChild(b)})});
function syncUI(){document.querySelectorAll('.seg').forEach(sg=>{const k=sg.dataset.k,cur=k=='q'?cfg.q:cfg.lv[k];[...sg.children].forEach(b=>b.classList.toggle('on',b.textContent==cur))});[['sv','vol'],['sMu','music'],['sSf','sfx'],['sAm','amb'],['sVo','voice'],['ss','sens']].forEach(([i,k])=>$(i).value=cfg[k]);[['tSh','shake'],['tBo','bob'],['tNa','names']].forEach(([i,k])=>$(i).checked=cfg[k])}
[['sv','vol'],['sMu','music'],['sSf','sfx'],['sAm','amb'],['sVo','voice'],['ss','sens']].forEach(([i,k])=>{$(i).oninput=e=>{cfg[k]=+e.target.value;applyVol();saveCfg()}});[['tSh','shake'],['tBo','bob'],['tNa','names']].forEach(([i,k])=>{$(i).onchange=e=>{cfg[k]=e.target.checked;saveCfg()}});
document.querySelectorAll('.stabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.stabs button').forEach(x=>x.classList.toggle('on',x==b));document.querySelectorAll('.sp').forEach(p=>p.classList.toggle('on',p.id=='sp-'+b.dataset.t))});
$('bApply').onclick=()=>{saveCfg();applyQ();applyVol();S3('ok')};$('bReset').onclick=()=>{const n=cfg.name;Object.assign(cfg,JSON.parse(JSON.stringify(CFG_DEF)),{name:n});saveCfg();syncUI();applyQ();applyVol()};syncUI();
function enterGame(){sayQ=[];Object.assign(me,{hp:100,down:0,bat:100,rv:0,stam:100,exh:0,rush:0,track:0,hid:0,bleed:0,cd:[0,0,0,0]});initAudio();AC&&AC.resume();inGame=true;paused=false;SM=0;P.init=0;Object.keys(AV).forEach(i=>{sc.remove(AV[i].g);delete AV[i]});view('');$('hud').style.display='block';lock();setTimeout(()=>{if(!document.pointerLockElement)noLock=true},400);cap('Stay together.')}
function lock(){if(inGame&&!noLock)try{$('cv').requestPointerLock()}catch(e){}}
const stairNear=()=>STAIRSD.find(s=>s.f==P.f&&Math.hypot(s.x-P.x,s.z-P.z)<3.2);
function surfAt(x,z,f){if(f==0)return'wet';if(f==2)return'wood';if(x>36&&x<48&&z<17||x>20&&x<32&&z>32||x<16&&z>32)return'metal';if(x>68&&z<17)return'wood';return'concrete'}
function fade(){const e=$('fade');e.style.opacity=1;setTimeout(()=>e.style.opacity=0,380)}
function near(){if(myRole!='survivor')return null;const out=[],O=MAPDATA.OBJ;
 if(me.hid)return[0,'Leave the locker'];
 for(const id in items){const o=items[id],d=Math.hypot(o.position.x-P.x,o.position.z-P.z);if(d<2.6&&o.userData.f==P.f)out.push([d,{bat:'Pick up battery',fuse:'Pick up fuse',card:'Pick up keycard',doc:'Read document',med:'Use medkit'}[o.userData.type]])}
 if(P.f==1){const at=(o,t)=>{if(t&&Math.hypot(o.x-P.x,o.z-P.z)<3)out.push([1,t])};
  at(O.fusebox,G.stage==1||curMode=='survival'?`Install fuse${curMode=='survival'?'':' ('+G.fused+'/3)'}`:null);at(O.terminal,G.stage==2?'Swipe keycard':null);O.switches.forEach(s=>at(s,G.stage==3?'Hold switch':null));at(O.exit,G.exit?'Open emergency exit':null);at(O.camera,'Check security camera')}
 const h=MAPDATA.HIDE.find(h=>h.f==P.f&&Math.hypot(h.ox-P.x,h.oz-P.z)<2.2);if(h)out.push([.8,'Hide in the locker']);
 {const sd=stairNear();if(sd)out.push([.5,sd.lab])}
 for(const id in AV){const v=AV[id];if(!v.mdl&&v.t.down&&v.t.f==P.f&&Math.hypot(v.t.x-P.x,v.t.z-P.z)<2.4)out.push([0,'Hold E: Revive'+(roster[id]?' '+roster[id].name:'')])}
 return out.sort((a,b)=>a[0]-b[0])[0]}
function update(dt,t){
 const down=me.down,hid=me.hid,sv=myRole=='survivor';let f=(k.KeyW?1:0)-(k.KeyS?1:0)-joy.y,s=(k.KeyD?1:0)-(k.KeyA?1:0)+joy.x;f=clamp(f,-1,1);s=clamp(s,-1,1);
 const cr=sv&&(k.ControlLeft||k.KeyC||down||tcrouch),sp=sv&&(k.ShiftLeft||k.ShiftRight||tsprint)&&!cr&&f>0&&me.hp>=40&&me.stam>3&&!me.exh,
 spd=sv?(cr?1.4:sp?5:2.8)*(me.hp<40?.8:1):(myRole=='monster'?(me.rush?6.2:3.7):myRole=='infected'?(me.rush?6:3.6):4);let mv=0;if(atkAnim>0){atkAnim-=dt;fovKick=Math.max(fovKick,5)}
 if(!down&&!typing&&!hid){const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),rx=Math.cos(P.yaw),rz=-Math.sin(P.yaw);let vx=fx*f+rx*s,vz=fz*f+rz*s;const m=Math.hypot(vx,vz);if(m>0){vx/=m;vz/=m;mv=1;const nx=P.x+vx*spd*dt,nz=P.z+vz*spd*dt;if(!blocked(nx,P.z))P.x=nx;if(!blocked(P.x,nz))P.z=nz;P.bob+=spd*dt*2.2;const bi=Math.floor(P.bob/Math.PI);if(bi!=P.bl){P.bl=bi;S3('step',null,cr?.4:sp?1.3:.8,surfAt(P.x,P.z,P.f))}}}
 P.y+=((down?.5:cr?1:sv?1.6:1.85)-P.y)*Math.min(1,dt*8);shake=Math.max(0,shake-dt*.5);cam.position.set(P.x+(rnd()-.5)*(cfg.shake?shake:0)*.1*camK(),FLOORY[P.f]+P.y+(mv&&cfg.bob&&!cfg.calm?Math.sin(P.bob)*.035:0),P.z);cam.rotation.set(P.pitch,P.yaw,0);flashSway(dt,mv);
 const flOn=window.fl!==false&&me.bat>0&&!down&&sv&&!hid;let I=flOn?2.4:0;if(me.bat<20&&I)I*=.5+me.bat/40;if(rnd()<dt*.1)window.fk=.15;window.fk=Math.max(0,(window.fk||0)-dt);if(window.fk>0)I*=rnd()<.5?.15:1;FLS.intensity=I;beam.material.opacity=I>0?.05:0;PGL.intensity=I>0?.35:0;
 sT-=dt;if(sT<=0){sT=.066;send({t:'s',x:+P.x.toFixed(2),z:+P.z.toFixed(2),yaw:+P.yaw.toFixed(2),pitch:+P.pitch.toFixed(2),cr:cr?1:0,sp:sp?1:0,fl:flOn?1:0,mv})}
 const n=near();$('pr').textContent=n?'[E] '+n[1]:'';if(me.rv>0)$('pr').textContent='Reviving… '+Math.round(me.rv*100)+'%';
 if(down)$('pr').textContent='You are down. Teammates can revive you.';
 hurtT=Math.max(0,hurtT-dt*1.5);$('hurt').style.opacity=Math.max((100-me.hp)/160,hurtT*.7)+(down?.3:0);
 const dM=threatDist(),tg_=chase?1:clamp(1-dM/24,0,.9);hbL+=(tg_-hbL)*Math.min(1,dt*(tg_>hbL?1.6:.25));const hb=hbL;hbT-=dt;if(hb>.12&&hbT<=0){hbT=1.15-.75*hb;S3('beat',null,.25+.75*hb)}$('vig').style.opacity=.75+hb*.25;TEN=hb;distort(dM<7&&myRole=='survivor'?clamp((7-dM)/7,0,1):0,t);if(!chamberDone&&P.f==1&&Math.hypot(P.x-62.5,P.z-6)<7){chamberDone=1;LP.forEach(l=>{if(l.x>50&&l.z<20)l.out=3.5});S3('boom',{x:62.5,z:6});shake=.9;cap('[something heavy moves inside the chamber]');setTimeout(()=>{CHS.visible=false;CHM.emissiveIntensity=0;cap('The chamber is empty.')},3600)}
 if(AC&&AC.listener.positionX){const L=AC.listener;L.positionX.value=cam.position.x;L.positionY.value=cam.position.y;L.positionZ.value=P.z;L.forwardX.value=-Math.sin(P.yaw);L.forwardY.value=0;L.forwardZ.value=-Math.cos(P.yaw);L.upX.value=0;L.upY.value=1;L.upZ.value=0}}
function world(dt,t){
 for(const id in AV)animAv(AV[id],dt);
 monUpdate(dt,t,1-Math.exp(-dt*10));
 const base=G.power?1:.5;
 LP.forEach(l=>{l.fl-=dt;if(l.fl<=0&&rnd()<dt*.05)l.fl=.1+rnd()*.5;let v=base;if(!G.power)v*=.55+.25*Math.sin(t*.003+l.x);if(l.fl>0)v*=rnd()<.5?.1:1;if(chase&&rnd()<.3)v*=.15;if(l.out>0){l.out-=dt;v=0}if(mon.vis&&l.f==(mon.f||1)&&Math.hypot(l.x-mon.x,l.z-mon.z)<9&&rnd()<.5)v*=.2;l.v=v;l.s.material.opacity=Math.min(.6,v*.55);l.s.material.color.setHex(chase||!G.power?0xff4030:0xcfe8dd);l.cn.material.opacity=Math.min(.07,v*.07);if(chase)l.m.color.setRGB(v*(.5+.5*Math.sin(t*.01)),.05*v,.05*v);else if(G.power)l.m.color.setRGB(.87*v,.93*v,.9*v);else l.m.color.setRGB(v,.08*v,.06*v)});
 const nl=LP.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)+30*Math.abs(a.f-P.f)-Math.hypot(b.x-P.x,b.z-P.z)-30*Math.abs(b.f-P.f));PL.forEach((p,i)=>{const l=nl[i];p.position.set(l.x,FLOORY[l.f]+H-.4,l.z);p.intensity=l.v*(G.power?1.3:.9);p.color.set(chase||!G.power?0xff2a1a:0xdfeee6)});
 amb.intensity=G.power?.5:.25;SWM.forEach((s,i)=>s.material.emissiveIntensity=G.sw[i]?1.5:.3);if(EXM)EXM.material.emissive.set(G.exit?0x22cc44:0xaa2222);
 for(const id in items)items[id].rotation.y+=dt;fxUpdate(dt);for(let i=pings.length-1;i>=0;i--){pings[i].t-=dt;if(pings[i].t<=0){sc.remove(pings[i].s);pings.splice(i,1)}}
}
/* ---- Watcher behaviour, shadows, jumpscares ---- */
const shadows=[],decals=[],inCorr=()=>P.f==1&&P.z>20&&P.z<28;let glitchT=0,ghostT=0,ghostForce=0,gAway=0,chase=0,chaseIv=0,mPh=0,mStep=0,blink=0,lookAway=0,mMute=0,lastFov=72,caOn=0;
setInterval(()=>mMute=rnd()<.3,15000);
const sil=(()=>{const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d');g.fillStyle='#000';g.beginPath();g.ellipse(32,40,12,22,0,0,7);g.fill();g.fillRect(26,60,12,120);g.fillRect(8,70,6,150);g.fillRect(50,70,6,150);g.fillRect(22,170,8,86);g.fillRect(34,170,8,86);return new THREE.CanvasTexture(c)})();
function shadow(x,z,h,ry,life,grow){const m=new THREE.Mesh(new THREE.PlaneGeometry(h*.25,h),new THREE.MeshBasicMaterial({map:sil,transparent:true,opacity:.7,depthWrite:false}));m.position.set(x,h/2,z);m.rotation.y=ry;sc.add(m);shadows.push({m,t:life,l:life,grow})}
function wallPt(){const dx=-Math.sin(P.yaw),dz=-Math.cos(P.yaw);let d=1;while(d<24){if(tileSolid(Math.floor((P.x+dx*d)/CS),Math.floor((P.z+dz*d)/CS)))break;d+=.4}return{x:P.x+dx*(d-.1),z:P.z+dz*(d-.1)}}
function ghostAt(x,z,dur,force,y,rx){GM.g.position.set(x,(y||0)+FLOORY[P.f],z);GM.g.rotation.set(rx||0,Math.atan2(P.x-x,P.z-z),0);GM.g.scale.setScalar(.85);ghostT=dur;ghostForce=force||0;gAway=0}
function glitchFx(ms){const c=$('cv');let n=0;const iv=setInterval(()=>{c.style.transform=n%2?'none':`translateX(${(rnd()-.5)*20}px) skewX(${(rnd()-.5)*6}deg)`;c.style.filter=n%2?'':'hue-rotate(80deg) contrast(1.8) saturate(2.5)';if(++n>6){clearInterval(iv);c.style.transform='';c.style.filter='';caOn=0}},ms/6)}
function jumpscare(){duckT=1.1;cap('');setTimeout(()=>{if(!inGame)return;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);ghostAt(P.x+fx*2.2,P.z+fz*2.2,.45,1);S3('sting');S3('screech');S3('glitch');glitchFx(300);shake=1.2;fovKick=10},1000);setTimeout(()=>cap('…was that there?'),2300)}
function openCam(){SM=1;document.exitPointerLock&&document.exitPointerLock();$('dt').innerHTML='<canvas id="cf" width="480" height="270" style="border:1px solid #444;max-width:90vw"></canvas>';$('doc').firstElementChild.textContent='CAM 04: CORRIDOR B';view('doc');const c=$('cf').getContext('2d'),t0=performance.now();let done=0;
 camIv=setInterval(()=>{const t=performance.now()-t0;c.fillStyle='#0b120f';c.fillRect(0,0,480,270);c.fillStyle='#1c2a24';c.fillRect(190,60,100,150);c.fillStyle='#0e1511';c.fillRect(215,85,50,100);for(let i=0;i<260;i++){c.fillStyle=`rgba(200,255,220,${rnd()*.12})`;c.fillRect(rnd()*480,rnd()*270,2,1)}
  if(t>4200&&t<4330){c.fillStyle='#bdbab0';c.fillRect(228,50,22,150);c.fillRect(208,70,8,130);c.fillRect(262,70,8,130);c.fillStyle='#000';c.fillRect(231,40,16,26);c.fillStyle='rgba(255,255,255,.4)';c.fillRect(0,rnd()*270,480,12)}
  if(t>4200&&!done){done=1;S3('sting');S3('glitch')}c.fillStyle='#8f8';c.font='14px monospace';c.fillText('CAM 04  '+new Date().toLocaleTimeString(),10,20)},60)}
function distort(k,t){const f=72-k*7+Math.sin(t*.01)*k*1.2+fovKick;cam.fov=f;if(Math.abs(f-lastFov)>.05){cam.updateProjectionMatrix();lastFov=f}cam.rotation.z=Math.sin(t*.013)*k*.03;if(k>0)shake=Math.max(shake,k*.35);const c=$('cv');if(k>.2&&postCA()){caOn=1;c.style.filter=`drop-shadow(${(k*4).toFixed(1)}px 0 0 rgba(255,0,60,.4)) drop-shadow(${(-k*4).toFixed(1)}px 0 0 rgba(0,200,255,.4))`}else if(caOn){caOn=0;c.style.filter=''}}
function chaseAudio(on){if(on&&!chaseIv)chaseIv=setInterval(()=>{S3('pulse');if(rnd()<.6)S3('breath',{x:mon.x,z:mon.z,y:FLOORY[mon.f||1]+1})},520);else if(!on&&chaseIv){clearInterval(chaseIv);chaseIv=0}}
function monUpdate(dt,t,kk){const ox=mon.x,oz=mon.z;mon.x+=(mon.tx-mon.x)*kk;mon.z+=(mon.tz-mon.z)*kk;const sp=Math.hypot(mon.x-ox,mon.z-oz)/dt,d=Math.hypot(mon.x-P.x,mon.z-P.z)+30*Math.abs((mon.f||1)-P.f),st=mon.st,fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),dot=((mon.x-P.x)*fx+(mon.z-P.z)*fz)/Math.max(d,.01);
 lookAway=dot>.6?0:lookAway+dt;blink-=dt;if(rnd()<dt*.12)blink=.12+rnd()*.15;let show=!!mon.vis;if(show&&(st==3||st==1)&&d>5&&(lookAway>.8||blink>0))show=false;
 chase=st==5&&mon.vis?1:0;chaseAudio(chase&&inGame);monFade(show,dt);mg.position.set(mon.x,FLOORY[mon.f||1],mon.z);mg.rotation.y=mon.yaw;
 let rel=Math.atan2(P.x-mon.x,P.z-mon.z)-mon.yaw;rel=Math.atan2(Math.sin(rel),Math.cos(rel));MM.h.rotation.y+=(clamp(rel,-1.9,1.9)-MM.h.rotation.y)*Math.min(1,dt*(st==5?3:.5));MM.h.rotation.z=Math.sin(t*.0007)*.12+(st==3?.22:0);
 const mv=sp>.4;monPose(st,mv,dt,t,d);
 const lit=window.fl!==false&&me.bat>0&&dot>.85&&d<7;MM.fm.opacity=lit&&show?clamp((6-d)/4,0,.7)*(rnd()<.97?1:0):0;MM.eyes.opacity=show?(lit?1:.3+.1*Math.sin(t*.01)):0;if(st==5&&d<2.4){if(!atkSnd){atkSnd=1;S3('screech',{x:mon.x,z:mon.z,y:FLOORY[mon.f||1]+2})}}else if(d>3.5)atkSnd=0;if(mon.vis&&d>14&&d<60&&rnd()<dt*.01)S3('call',{x:mon.x,z:mon.z,y:FLOORY[mon.f||1]+2});
 mStep-=dt;if(mv&&mon.vis&&mStep<=0&&st!=3&&!mMute){mStep=st==5?.28:.8;S3('wstep',{x:mon.x,z:mon.z,y:FLOORY[mon.f||1]+1})}
 if(mon.vis&&d<12&&!mMute&&st!=5&&rnd()<dt*.12)S3(rnd()<.5?'breath':'click',{x:mon.x,z:mon.z,y:FLOORY[mon.f||1]+1})}
function fxUpdate(dt){fx2(dt);for(let i=shadows.length-1;i>=0;i--){const s=shadows[i];s.t-=dt;s.m.scale.setScalar(.6+.9*(1-s.t/s.l)*s.grow);s.m.material.opacity=Math.min(.7,s.t*1.4);if(s.t<=0){sc.remove(s.m);shadows.splice(i,1)}}
 for(let i=decals.length-1;i>=0;i--){const q=decals[i];q.t-=dt;if(q.t<3)q.m.material.opacity=q.t/3*.8;if(q.t<=0){sc.remove(q.m);decals.splice(i,1)}}
 if(glitchT>0){glitchT-=dt;PIPES.forEach(p=>p.position.y=H-.3+(rnd()-.5)*.08);MONS.forEach(m=>{const v=rnd()<.5?.05:1.5;if(m.emissive)m.emissiveIntensity=v;else m.color.setScalar(clamp(v,.1,1))})}else if(glitchT>-1){glitchT=-2;PIPES.forEach(p=>p.position.y=H-.3);MONS.forEach(m=>{if(m.emissive)m.emissiveIntensity=.5;else m.color.setScalar(1)})}
 if(ghostT>0){ghostT-=dt;GM.g.visible=true;const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw),gx=GM.g.position.x-P.x,gz=GM.g.position.z-P.z,dd=Math.hypot(gx,gz);if((gx*fx+gz*fz)/Math.max(dd,.01)<.3&&!ghostForce)gAway+=dt;else gAway=0;if(gAway>.7)ghostT=0;GM.fm.opacity=ghostForce==1?.8:0;if(ghostT<=0){GM.g.visible=false;GM.g.rotation.x=0;GM.g.scale.setScalar(.85);ghostForce=0}}else GM.g.visible=false}
/* ---- v2 atmosphere, monster rig, doors ---- */
const hemi=new THREE.HemisphereLight(0x2a3a58,0x0c0b0a,.35);sc.add(hemi);
const PGL=new THREE.PointLight(0xffe2b0,0,4.5,2);PGL.position.set(0,-.2,.3);cam.add(PGL);
const beam=new THREE.Mesh(new THREE.ConeGeometry(2.6,13,16,1,true),new THREE.MeshBasicMaterial({map:GRAD,color:0xfff0d0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.rotation.x=Math.PI/2;beam.position.set(.15,-.1,-6.5);cam.add(beam);
const FOGT=(()=>{const c=cv(128),g=c.getContext('2d');for(let i=0;i<60;i++){const x=rnd()*128,y=rnd()*128,r=20+rnd()*30,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(180,200,210,.35)');gr.addColorStop(1,'rgba(180,200,210,0)');g.fillStyle=gr;g.fillRect(0,0,128,128)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(10,6);return t})();
const FOGP=[.3,.8].map((y,i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(84,48),new THREE.MeshBasicMaterial({map:FOGT,transparent:true,opacity:.1-i*.03,depthWrite:false,color:0x8aa0a8,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(42,y,24);sc.add(m);return m});
let flashT=0,thT=40,jsT=140,flT=50,TEN=0,fovKick=0,swX=0,swY=0,ly=0,lp=0,ambT=15,wph=0,TENG;
const tw=(o,a,v,k)=>{o[a]+=(v-o[a])*k};
function flashSway(dt,mv){const dy=P.yaw-ly,dp=P.pitch-lp;ly=P.yaw;lp=P.pitch;swX+=(clamp(dy*14,-1.2,1.2)-swX)*Math.min(1,dt*6);swY+=(clamp(-dp*14,-1,1)-swY)*Math.min(1,dt*6);FLS.target.position.set(swX*1.5+(mv?Math.sin(P.bob*.5)*.18:0),swY*1.5+(mv?Math.abs(Math.sin(P.bob))*.1:0),-5)}
function monPose(st,mv,dt,t,d,X){X=X||MM;const run=st==5,att=run&&d<2.4,k=1-Math.exp(-dt*10);wph+=dt*(run?10:mv?3.2:0);const s=Math.sin(Math.floor(wph*3)/3*(run?1:2)),amp=run?.9:mv?.4:0;
 tw(X.lL.rotation,'x',s*amp,k);tw(X.lR.rotation,'x',-s*amp,k);tw(X.kL.rotation,'x',Math.max(0,-s)*amp*1.4+.2,k);tw(X.kR.rotation,'x',Math.max(0,s)*amp*1.4+.2,k);
 tw(X.aL.rotation,'x',att?-1.6+Math.sin(t*.03)*.2:run?.5*s+.6:-s*amp*.6,k);tw(X.aR.rotation,'x',att?-1.6:run?-.5*s+.6:s*amp*.6,k);tw(X.eL.rotation,'x',att?-.4:-.2-.2*Math.sin(t*.001),k);tw(X.eR.rotation,'x',att?-.4:-.2,k);
 tw(X.torso.rotation,'x',.4+(run?.45:0)+(st==6?.9:0)+(att?.2:0)+Math.sin(t*.002)*.03,k);X.hip.position.y=1.45-(st==6?.9:0)-(run?.1:0)+(mv?Math.abs(s)*.03:0)+Math.sin(t*.002)*.01;
 tw(X.jaw.rotation,'x',att?.7:st==3?.12:.03+Math.sin(t*.003)*.02,k);X.fingers.forEach((f,i)=>f.rotation.x=.3+Math.sin(t*.004+i)*.25+(att?.8:0))}
function monFade(show,dt){MM.a=clamp(MM.a+(show?3:-3)*dt,0,1);MM.mats.forEach(m=>{m.transparent=MM.a<1;m.opacity=MM.a});mg.visible=MM.a>0}
function slamDoor(p){let best=null,bd=99;DOORS.forEach(d=>{const x=Math.hypot(d.cx-p.x,d.z-p.z);if(x<bd){bd=x;best=d}});if(best)DOORS.forEach(d=>{if(d.cx==best.cx&&d.z==best.z)d.slam=1.6});S3('boom',p)}
function doorsUpdate(dt){const pts=P.f==1?[[P.x,P.z]]:[];for(const id in AV)if(AV[id].t.on&&(AV[id].t.f||1)==1)pts.push([AV[id].t.x,AV[id].t.z]);if(mon.vis&&(mon.f||1)==1)pts.push([mon.x,mon.z]);
 DOORS.forEach(d=>{let near=pts.some(p=>Math.abs(p[0]-d.cx)<3.6&&Math.abs(p[1]-d.z)<3.4);if(d.slam>0){d.slam-=dt;near=false}const was=d.open>.5;d.open+=((near?1:0)-d.open)*Math.min(1,dt*(d.slam>0?14:2.4));if(d.s<0&&!was&&d.open>.5)S3('door',{x:d.cx,z:d.z});d.piv.rotation.y=-d.s*1.45*d.open+(d.open<.05?Math.sin(d.cx+d.s)*.02:0)})}
const camK=()=>cfg.calm?.35:1;
function fx2(dt){dustUpdate(dt);RAINT.offset.y-=dt*1.6;RAINT.offset.x+=dt*.1;FOGT.offset.x+=dt*.01;FOGT.offset.y+=dt*.006;doorsUpdate(dt);
 flashT=Math.max(0,flashT-dt*3);NIGHT.color.setScalar(1+flashT*6);hemi.intensity=.35+flashT*1.4+((myRole=='monster'||myRole=='infected')?1.4:0);hemi.color.setHex(chase?0x3a1a1a:0x2a3a58);amb.intensity=(G.power?.5:.35)+flashT*.3+((myRole=='monster'||myRole=='infected')?2.6:0);
 thT-=dt;if(thT<=0){thT=45+rnd()*70;flashT=1;setTimeout(()=>{S3('boom',{x:P.x,z:P.z-10});shake=.3;cap('[thunder]')},500+rnd()*1500)}
 fovKick*=Math.max(0,1-dt*5);if(inGame){jsT-=dt;if(jsT<=0){jsT=110+rnd()*150;if(!chase&&!SM&&G.stage>=2&&myRole=='survivor'&&(curMode=='story'||curMode=='survival')&&rnd()<.65)jumpscare()}
 flT-=dt;if(flT<=0){flT=40+rnd()*50;window.fk=.7;S3('click')}ambT-=dt;if(ambT<=0){ambT=9+rnd()*18;const AMB=['clang','door','scrape','click','wail','drip','creak','pipe','drip','creak','buzz','vent','machine','floorcreak','distantstep','thunder'],k=AMB[rnd()*AMB.length|0];if(!(cool[k]>performance.now())){cool[k]=performance.now()+({wail:90000,clang:30000,thunder:40000}[k]||15000);S3(k,{x:6+rnd()*72,z:rnd()<.5?10:38,y:FLOORY[rnd()*3|0]+1.5})}}}
 musicUpdate(dt)}
function ambientBed(){const nz=(f,q,v,type)=>{const s=AC.createBufferSource();s.buffer=NB;s.loop=true;const b=AC.createBiquadFilter();b.type=type||'bandpass';b.frequency.value=f;b.Q.value=q;const g=AC.createGain();g.gain.value=v;s.connect(b).connect(g).connect(BA);s.start();return g};
 const w=nz(380,.6,.05),lfo=AC.createOscillator(),lg=AC.createGain();lfo.frequency.value=.13;lg.gain.value=.035;lfo.connect(lg).connect(w.gain);lfo.start();nz(4200,.4,.018,'highpass');
 const b=AC.createOscillator();b.type='square';b.frequency.value=120;const bg=AC.createGain();bg.gain.value=.004;b.connect(bg).connect(BA);b.start();
 musicInit()}
addEventListener('pointerdown',()=>{initAudio();AC&&AC.state=='suspended'&&!paused&&AC.resume()});
function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000);last=t;
 if(!inGame){FLS.intensity=0;P.x=6;P.z=24;menuUpdate(dt,t);fx2(dt);R.render(MS,MC);return}
 if(!SM&&!paused)update(dt,t);world(dt,t);R.render(sc,cam)}
/* ---- input ---- */
$('cv').addEventListener('mousedown',e=>{if(!inGame||SM)return;if(e.button==1){e.preventDefault();ping();return}if(e.button==0&&document.pointerLockElement)abil('attack');lock()});
function ping(){const dx=-Math.sin(P.yaw)*Math.cos(P.pitch),dy=Math.sin(P.pitch),dz=-Math.cos(P.yaw)*Math.cos(P.pitch);let d=.5;while(d<30){const x=P.x+dx*d,z=P.z+dz*d,y=P.y+dy*d;if(tileSolid(Math.floor(x/CS),Math.floor(z/CS))||y<0||y>H)break;d+=.3}const x=P.x+dx*d,z=P.z+dz*d,y=FLOORY[P.f]+clamp(P.y+dy*d,.3,2.6);
 let kd='Location';if(mon.vis&&Math.hypot(mon.x-x,mon.z-z)<4)kd='Monster here!';else if(Object.values(items).some(o=>Math.hypot(o.position.x-x,o.position.z-z)<2.5))kd='Item';else if([[42,5],[10,5],[69,34],[69,42],[79.4,38]].some(([a,b])=>Math.hypot(a-x,b-z)<4))kd='Objective';send({t:'pg',x,y,z,k:kd})}
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&inGame&&!SM&&!typing&&!noLock){paused=true;view('pause')}});
document.addEventListener('mousemove',e=>{if(!inGame||paused||SM||me.down&&0)return;if(document.pointerLockElement||noLock){P.yaw-=e.movementX*.0022*cfg.sens;P.pitch=clamp(P.pitch-e.movementY*.0022*cfg.sens,-1.45,1.45)}});
addEventListener('keydown',e=>{if(typing){if(e.code=='Enter'){const v=$('ci').value.trim();if(v)send({t:'chat',m:v});typing=false;$('ci').style.display='none';$('ci').value='';lock()}else if(e.code=='Escape'){typing=false;$('ci').style.display='none'}return}
 if(e.code=='Tab')e.preventDefault();k[e.code]=1;if(!inGame||e.repeat)return;if(e.code=='Escape'&&noLock){paused=!paused;view(paused?'pause':'')}if(paused||SM)return;
 if(e.code=='KeyE'){if(myRole!='survivor')return;if(me.hid){send({t:'use'});return}if(!me.down&&stairNear()){send({t:'stairs'});return}if(!me.down&&P.f==1&&Math.hypot(14-P.x,5-P.z)<3){openCam();return}send({t:'use'});send({t:'hold',on:true})}else if(e.code=='KeyF'){if(myRole=='survivor')window.fl=window.fl===false}else if(e.code=='Digit1')abil('rush');else if(e.code=='Digit2')abil('track');else if(e.code=='Digit3')abil('dark');else if(e.code=='Space'){e.preventDefault();abil('attack')}else if(e.code=='KeyR')send({t:'bat'});else if(e.code=='Tab')$('inv').style.display='block',$('inv').innerHTML=$('iv').textContent;
 else if(e.code=='KeyT'){e.preventDefault();typing=true;for(const c in k)k[c]=0;$('ci').style.display='block';document.exitPointerLock&&document.exitPointerLock();setTimeout(()=>$('ci').focus(),0)}});
addEventListener('keyup',e=>{k[e.code]=0;if(e.code=='KeyE')send({t:'hold',on:false});if(e.code=='Tab')$('inv').style.display='none'});addEventListener('blur',()=>{for(const c in k)k[c]=0;send({t:'hold',on:false})});
applyQ();requestAnimationFrame(loop);

(()=>{const mm={mMaster:'master',mMusic:'music',mSfx:'sfx',mAmb:'amb',mVoice:'voice'};cfg.mute=cfg.mute||{};
 for(const id in mm){const el=document.getElementById(id);if(!el)continue;el.checked=!!cfg.mute[mm[id]];el.onchange=e=>{cfg.mute[mm[id]]=e.target.checked;saveCfg();applyVol()}}
 const tc=document.getElementById('tCalm');if(tc){tc.checked=!!cfg.calm;tc.onchange=e=>{cfg.calm=e.target.checked;saveCfg()}}})();
