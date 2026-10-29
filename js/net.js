/* ---- net ---- */
function send(o){if(ws&&ws.readyState==1)ws.send(JSON.stringify(o))}
function connect(cb){if(ws&&ws.readyState==1)return cb&&cb();left=false;const q=new URLSearchParams(location.search).get('server');ws=new WebSocket(q||((location.protocol=='https:'?'wss://':'ws://')+location.host));
 ws.onopen=()=>{$('conn').textContent='●';cb&&cb()};ws.onmessage=e=>on(JSON.parse(e.data));ws.onerror=()=>{$('merr').textContent='Cannot reach server'};
 ws.onclose=()=>{$('conn').textContent='○ reconnecting…';if(code&&!left)setTimeout(()=>connect(()=>send({t:'join',code,name:cfg.name,token:tok})),1500)}}
setInterval(()=>send({t:'ping',c:performance.now()}),2000);
const AV={},items={},pings=[];let mon={x:-9,z:-9,yaw:0,st:0,vis:0,tx:-9,tz:-9,f:1};
function on(m){switch(m.t){
 case'pong':$('conn').textContent='● '+Math.round(performance.now()-m.c)+' ms';break;
 case'err':$('merr').textContent=m.m;alert(m.m);break;
 case'list':if(window.quick){window.quick=0;if(m.rooms.length)send({t:'join',name:cfg.name,code:m.rooms[0].code});else send({t:'create',name:cfg.name,room:'Quick Match',max:6,priv:false,diff:'NORMAL',mode:'story'})}
  else $('pub').innerHTML=m.rooms.map(r=>`<button onclick="document.getElementById('jc').value='${r.code}';document.getElementById('bGo').click()">${esc(r.name)} · ${r.n}/${r.max} · ${r.diff}</button>`).join('')||'<p class="sub">No public rooms.</p>';break;
 case'joined':my=m.id;tok=m.token;code=m.code;break;
 case'lobby':renderLobby(m);break;
 case'kicked':leave();alert('You were removed from the room.');break;
 case'start':curMode=m.mode||curMode;if(!inGame)enterGame();break;
 case'modes':MODES=m.modes;break;
 case'role':showRole(m);break;
 case'round':roundSt=m.st;if(m.st=='ending')duckT=.8;break;
 case'story':storySay(m.lines||[],m.title);break;
 case'chapter':chapBanner(m.title,m.n);S3('chord');break;
 case'results':showResults(m);break;
 case'g':G=m;$('obj').innerHTML='<small>Objective</small>'+esc(m.obj);break;
 case'inv':INV=m;$('iv').textContent=`Fuses ${m.fuse} · Card ${m.card?'✓':'–'} · Spare batteries ${m.bat} · Documents ${m.docs}`;break;
 case'items':{const ids=new Set(m.it.map(i=>i[0]));for(const k in items)if(!ids.has(+k)){dyn.remove(items[k]);delete items[k]}m.it.forEach(([id,type,x,z,f])=>{if(items[id])return;const c={fuse:0xe0b030,card:0x4a90e0,bat:0x50d070,doc:0xeeeadc}[type],g=type=='card'?new THREE.BoxGeometry(.25,.03,.16):type=='doc'?new THREE.BoxGeometry(.3,.02,.4):new THREE.CylinderGeometry(.06,.06,.25,8),o=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.4}));o.position.set(x,FLOORY[f==null?1:f]+.5,z);if(type=='fuse'||type=='bat')o.rotation.z=1.5;o.userData={id,type,f:f==null?1:f};dyn.add(o);items[id]=o});break}
 case'chat':lobbyLog(`<b style="color:${COL[m.i]}">${esc(m.n)}</b>: ${esc(m.m)}`);log(`<b style="color:${COL[m.i]}">${esc(m.n)}</b>: ${esc(m.m)}`);S3('blip');break;
 case'sys':lobbyLog('<i>'+esc(m.m)+'</i>');log('<i>'+esc(m.m)+'</i>');cap(m.m);break;
 case'pg':addPing(m);break;
 case'hit':hurtT=1;shake=.6;S3('growl');S3('sting');glitchFx(140);break;
 case'tp':P.x=m.x;P.z=m.z;if(m.f!=null&&m.f!=P.f){P.f=m.f;curF=m.f}if(m.st){S3('step',null,1,'concrete');S3('door');fade();if(blocked(P.x,P.z)){const s=freeSpot(P.x,P.z);if(s){P.x=s[0];P.z=s[1];send({t:'warp',x:s[0],z:s[1]})}}}break;
 case'doc':docJS=!!m.js;$('dt').textContent=m.text;view('doc');SM=1;if(docJS)setTimeout(()=>{if(SM)S3('breath',{x:P.x+Math.sin(P.yaw)*2,z:P.z+Math.cos(P.yaw)*2})},3500);document.exitPointerLock&&document.exitPointerLock();break;
 case'ev':evt(m);break;
 case'end':{const E={ESCAPE:['ESCAPED','You made it out. The doors lock behind you, and none of you talks about what was inside.',0],SURVIVORS:['SURVIVORS','You escaped carrying the staff memo and photograph. Someone will believe you eventually.',0],FAILURE:['GAME OVER','Every light went out. The shift never ended.',1]}[m.k]||['THE END','',0];
 $('et').textContent=E[0];$('ex').textContent=E[1];$('end').classList.toggle('lose',!!E[2]);const hs=my==hostId;$('bRt').style.display=hs?'':'none';$('bAg').style.display=hs?'':'none';$('hw').style.display=hs?'none':'';
 document.exitPointerLock&&document.exitPointerLock();chaseAudio(false);creditsOn=0;E[2]?(S3('sting'),S3('screech')):S3('ok');duckT=1.2;fade();setTimeout(()=>{inGame=false;$('hud').style.display='none';view('end')},450);break}
 case'snap':snap(m);break}}
function snap(m){const seen=new Set(),team=[],myTeam=myRole=='survivor'?0:myRole=='spectator'?2:1;
 for(const a of m.p){const[id,x,z,yaw,pitch,fl,cr,sp,mv,hp,down,bat,rv,onl,flr,mdl,rl,mk]=a;seen.add(id);const r=roster[id]||{name:'P'+id,i:0},tm=(rl==1||rl==2)?1:rl==3?2:0;
  if(id==my||myTeam==2||tm==myTeam)team.push(`<div class="tm ${!onl?'off':down?'dn':hp<60?'hurt':''}"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="currentColor"/></svg><span style="color:${COL[r.i%COL.length]}">${esc(r.name)}</span></div>`);
  if(id==my){me.hp=hp;me.down=down;me.bat=bat;me.rv=rv;if(!P.init){P.x=x;P.z=z;P.init=1}if(flr!=null&&flr!=P.f){P.f=flr;curF=flr}continue}
  let v=AV[id];if(v&&(v.mdl|0)!=(mdl|0)){sc.remove(v.g);delete AV[id];v=null}
  if(!v)v=AV[id]=mdl?mkMonAv(r.i%COL.length,r.name):mkAvatar(r.i%COL.length,r.name);
  Object.assign(v.t,{x,z,yaw,pitch,fl,cr,sp,mv,down,hp,on:onl,f:flr});v.mark=mk}
 for(const k in AV)if(!seen.has(+k)){sc.remove(AV[k].g);delete AV[k]}
 if(m.y){me.stam=m.y[0];me.cd=[m.y[1],m.y[2],m.y[3],m.y[4]];me.rush=m.y[5];me.track=m.y[6];me.hid=m.y[7];me.exh=m.y[8];me.bleed=m.y[9]}
 $('team').innerHTML=team.join('');$('hpn').textContent=Math.round(me.hp);$('hp').firstChild.style.width=me.hp+'%';$('bb').firstChild.style.width=me.bat+'%';$('bt').textContent=Math.round(me.bat)+'%';
 mon.tx=m.m[0];mon.tz=m.m[1];mon.yaw=m.m[2];mon.st=m.m[3];mon.vis=m.m[4];mon.f=m.m[5];hudUpdate(m)}
const log=h=>{const d=document.createElement('div');d.innerHTML=h;$('chat').appendChild(d);while($('chat').children.length>6)$('chat').firstChild.remove();setTimeout(()=>d.remove(),12000)};
let capT;const cap=t=>{$('cap').textContent=t;clearTimeout(capT);capT=setTimeout(()=>$('cap').textContent='',3200)};
