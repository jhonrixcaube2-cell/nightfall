// Shared round systems: messaging, roles, damage, abilities, visibility, snapshots, items. No mode-specific rules live here.
const ROLE=require('./roles'),R=Math.random,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),q2=n=>Math.round(n*100)/100;
const tx=(ws,o)=>{try{ws&&ws.readyState==1&&ws.send(JSON.stringify(o))}catch(e){}},bc=(r,o)=>r.players.forEach(p=>tx(p.ws,o));
const dist=(a,b)=>a.f==b.f?Math.hypot(a.x-b.x,a.z-b.z):999,d3=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z)+30*Math.abs(a.f-b.f);
const players=(r,f)=>[...r.players.values()].filter(f||(()=>true)),survivors=r=>players(r,p=>p.on&&p.role=='survivor'),monsters=r=>players(r,p=>p.on&&p.team=='monsters');
const stat=(p,k,n)=>{p.stat[k]=(p.stat[k]||0)+(n==null?1:n)},shuf=a=>a.slice().sort(()=>R()-.5),DMG={NORMAL:1,HARD:1.2,NIGHTMARE:1.5};
function setRole(p,role){p.role=role;p.team=ROLE[role].team;tx(p.ws,{t:'role',role,label:ROLE[role].label,text:ROLE[role].text,abil:ROLE[role].abil})}
const say=(r,lines,title)=>bc(r,{t:'story',lines,title}),finish=(r,res)=>{if(!r.res)r.res=res};
const pushInv=p=>tx(p.ws,{t:'inv',...p.inv,docs:p.docs}),pushItems=(r,to)=>{const o={t:'items',it:r.g.it.map(i=>[i.id,i.type,q2(i.x),q2(i.z),i.f])};to?tx(to,o):bc(r,o)};
function spawnItems(r,spec){const g=r.g,pools=r.M.SPOTS.map(s=>shuf(s).map(([x,z])=>({x:x+(R()*4-2),z:z+(R()*3-1.5)})));
 spec.forEach(([t,f])=>{const ff=f==null?R()*3|0:f,s=pools[ff].pop()||pools[1].pop();if(s)g.it.push({id:g.nid++,type:t,f:ff,x:s.x,z:s.z})})}
function addItem(r,type,f){const ff=f==null?R()*3|0:f,S=r.M.SPOTS[ff],s=S[R()*S.length|0];r.g.it.push({id:r.g.nid++,type,f:ff,x:s[0]+(R()*4-2),z:s[1]+(R()*3-1.5)});pushItems(r)}
function placeFar(r,p){const ps=survivors(r);let best=null,bs=-1;r.M.SPAWN.monster.forEach(s=>{const d=ps.length?Math.min(...ps.map(q=>d3(s,q))):50,sc=d+R()*8;if(sc>bs){bs=sc;best=s}});p.x=best.x;p.z=best.z;p.f=best.f;tx(p.ws,{t:'tp',x:p.x,z:p.z,f:p.f})}
function unhide(r,p,forced){if(!p.hid)return;p.hid=0;p.x=p.ox;p.z=p.oz;p.lt=Date.now();tx(p.ws,{t:'tp',x:p.x,z:p.z,f:p.f});if(forced)tx(p.ws,{t:'sys',m:'You cannot stay hidden any longer.'})}
function hurt(r,p,dmg,src){if(p.down||p.role!='survivor')return;p.hp-=dmg;tx(p.ws,{t:'hit'});stat(p,'hits');unhide(r,p);
 if(p.hp<=0){p.hp=0;p.down=1;p.rv=0;p.bleed=r.md.bleed||0;stat(p,'downs');bc(r,{t:'sys',m:p.name+' is down!'});r.md.onDown&&r.md.onDown(r,p,src)}}
function eliminate(r,p,msg){p.down=0;p.hid=0;p.hold=0;setRole(p,'spectator');bc(r,{t:'sys',m:p.name+(msg||' was eliminated')});r.md.onEliminate&&r.md.onEliminate(r,p)}
function infect(r,q,att){q.inv={fuse:0,card:0,bat:0};q.docs=0;q.hid=0;q.hold=0;q.hp=100;q.down=0;setRole(q,'infected');pushInv(q);stat(att,'infections');bc(r,{t:'sys',m:q.name+' was infected!'});bc(r,{t:'ev',k:'infect',id:q.id})}
function facing(a,b){const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1;return(-Math.sin(a.yaw)*dx-Math.cos(a.yaw)*dz)/d>.15}
function ability(r,p,k){if(!r.g||r.st!='play'||p.hid||p.down||!p.on)return;const ro=ROLE[p.role],s=ro.spd||{};
 if(k=='attack'&&ro.melee){if(p.cd.atk>0)return;p.cd.atk=ro.melee.cd;bc(r,{t:'ev',k:'atk',id:p.id});
  const q=players(r,q=>q.on&&q.role=='survivor'&&!q.hid&&dist(q,p)<ro.melee.range&&facing(p,q)).sort((a,b)=>dist(a,p)-dist(b,p))[0];
  if(q){if(ro.melee.convert){r.md.onInfect(r,q,p)}else if(q.down){stat(p,'elims');eliminate(r,q,' was caught')}else{hurt(r,q,Math.round(ro.melee.dmg*(DMG[r.diff]||1)),p);stat(p,'hits')}}}
 else if(ro.abil.includes(k)){if(p.cd[k]>0)return;if(k=='rush'){p.cd.rush=s.rushCd;p.buff.rush=s.rushDur}else if(k=='track'){p.cd.track=s.trackCd;p.buff.track=s.trackDur}
  else if(k=='dark'){p.cd.dark=s.darkCd;bc(r,{t:'ev',k:'blackout',x:q2(p.x),z:q2(p.z),f:p.f,d:s.darkDur})}tx(p.ws,{t:'ev',k:'abil',a:k})}}
function canSee(r,a,b){if(a===b)return true;if(b.hid)return false;if(a.role=='spectator')return true;if(b.role=='spectator')return false;if(a.team==b.team)return true;
 if(a.buff.track>0&&b.team=='survivors')return true;if(a.f!=b.f)return false;const d=Math.hypot(a.x-b.x,a.z-b.z);return d<5||(d<30&&r.L.los(a.f,a.x,a.z,b.x,b.z))}
function maxSpeed(p){const ro=ROLE[p.role];if(p.role=='survivor')return p.exh?3.4:5.6;if(ro.spd)return(p.buff.rush>0?ro.spd.rushV:ro.spd.base)+.5;return 5.6}
function tickCommon(r,dt){const g=r.g;g.t+=dt;const W=require('./watcher');
 r.players.forEach(p=>{if(p.role=='survivor'){if(p.fl&&p.bat>0&&!p.down)p.bat=Math.max(0,p.bat-dt*.12);
   if(p.sp&&p.mv&&p.stam>0&&!p.exh&&!p.down)p.stam=Math.max(0,p.stam-dt*22);else p.stam=Math.min(100,p.stam+dt*12);if(p.stam<=0)p.exh=1;if(p.exh&&p.stam>=25)p.exh=0;stat(p,'time',dt)}
  for(const k in p.cd)p.cd[k]=Math.max(0,p.cd[k]-dt);for(const k in p.buff)p.buff[k]=Math.max(0,p.buff[k]-dt);
  if(p.hid){p.hidT+=dt;if(p.hidT>25)unhide(r,p,true)}
  if(p.down&&p.bleed>0){p.bleed-=dt;if(p.bleed<=0)eliminate(r,p,' bled out')}
  if(p.hold&&!p.down&&p.on&&p.role=='survivor'){const q=survivors(r).find(o=>o.down&&o!=p&&dist(o,p)<2.4);if(q){q.rv+=dt/4;const npc=g.wk&&g.wk.on&&g.m.vis&&dist(g.m,p)<3,mp=monsters(r).some(m=>dist(m,p)<3);if(npc||mp)q.rv=0;if(q.rv>=1){q.down=0;q.hp=40;q.rv=0;q.bleed=0;stat(p,'revives');bc(r,{t:'sys',m:q.name+' was revived'})}}}});
 g.ev-=dt;if(g.ev<=0){g.ev=(24+R()*34)/(r.md.eventRate||1);const L=r.M.EVENTS.slice();if(g.t>120)L.push('glimpse','glimpse');if(g.t>240&&R()<.2)L.push('ceiling');
  const k=L[R()*L.length|0],ev={t:'ev',k,x:q2(6+R()*72),z:R()<.5?24:R()<.5?10:38,f:R()*3|0},sv=survivors(r);if(['shadow','prints','scratch','glimpse','ceiling'].includes(k)){if(sv.length)tx(sv[R()*sv.length|0].ws,ev)}else bc(r,ev)}}
function snapshot(r){const g=r.g,m=g.m,W=require('./watcher'),all=[...r.players.values()],sv=survivors(r).length,inf=monsters(r).length,left=g.limit>0?Math.max(0,Math.ceil(g.limit-g.t)):-1;
 const npc=m?[q2(m.x),q2(m.z),q2(m.yaw),W.ST.indexOf(m.st),(g.wk&&g.wk.on&&m.vis)?1:0,m.f]:[0,0,0,0,0,1];
 all.forEach(a=>{if(!a.ws)return;const L=all.filter(b=>canSee(r,a,b)).map(b=>[b.id,q2(b.x),q2(b.z),q2(b.yaw),q2(b.pitch),b.fl,b.cr,b.sp,b.mv,b.hp,b.down,Math.round(b.bat),q2(b.rv),b.on,b.f,ROLE[b.role].model,ROLE[b.role].idx,a.buff.track>0&&b.team=='survivors'?1:0]);
  tx(a.ws,{t:'snap',p:L,m:npc,tm:left,sv,inf,y:[Math.round(a.stam),q2(a.cd.rush),q2(a.cd.track),q2(a.cd.dark),q2(a.cd.atk),a.buff.rush>0?1:0,q2(a.buff.track),a.hid?1:0,a.exh?1:0,a.down?Math.max(0,Math.round(a.bleed)):0]})})}
module.exports={ROLE,R,clamp,q2,tx,bc,dist,d3,players,survivors,monsters,stat,shuf,setRole,say,finish,pushInv,pushItems,spawnItems,addItem,placeFar,unhide,hurt,eliminate,infect,ability,maxSpeed,tickCommon,snapshot,canSee,DMG};
