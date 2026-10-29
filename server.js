// NIGHTFALL 2.0 server: transport, rooms and lobby. Game rules live in ./game (modes, roles, rounds, maps, stories).
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const C=require('./game/core'),reg=require('./game/registry'),round=require('./game/round'),O=require('./game/objectives'),{tx,bc}=C;
const R=Math.random,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=(v,a,b,d)=>{v=+v;return Number.isFinite(v)?clamp(v,a,b):(d||0)};
const clean=(s,n)=>String(s==null?'':s).replace(/[\u0000-\u001f<>&"'`]/g,'').trim().slice(0,n),DIFFS=['NORMAL','HARD','NIGHTMARE'],MAXP=6;
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'},rooms=new Map();let nid=1;
const server=http.createServer((q,s)=>{try{let u=decodeURIComponent((q.url||'/').split('?')[0]);if(u=='/health')return s.end('ok');if(u=='/')u='/index.html';
 if(!/^\/(index\.html|css\/[\w.-]+\.css|js\/(?:[\w-]+\/)?[\w.-]+\.js)$/.test(u)){s.statusCode=404;return s.end('not found')}
 const f=path.join(__dirname,u);s.setHeader('Content-Type',(MIME[path.extname(f)]||'text/plain')+'; charset=utf-8');s.setHeader('Cache-Control','no-cache');s.end(fs.readFileSync(f))}catch(e){s.statusCode=404;s.end('not found')}});
const wss=new WebSocketServer({server,maxPayload:4096}),cnt=r=>r.players.size;
const mkcode=()=>{let c;do c=Array.from({length:5},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[R()*32|0]).join('');while(rooms.has(c));return c};
const lob=r=>({t:'lobby',code:r.code,name:r.name,diff:r.diff,host:r.host,max:r.max,priv:r.priv,mode:r.mode,story:r.story,min:reg.modes[r.mode].min,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,i:p.i,on:p.on,ready:p.ready}))});
function mkRoom(m){const code=mkcode(),mode=reg.modes[m.mode]?m.mode:'story',r={code,name:clean(m.room,24)||'Night Shift',max:clamp(Math.floor(num(m.max,1,MAXP,4)),1,MAXP),priv:!!m.priv,diff:DIFFS.includes(m.diff)?m.diff:'NORMAL',mode,story:'story01',map:'facility',players:new Map(),host:0,st:'lobby'};rooms.set(code,r);return r}
function addP(r,ws,name){const used=new Set([...r.players.values()].map(p=>p.i));let i=0;while(used.has(i))i++;
 const p={id:nid++,ws,i,name:clean(name,16)||'Player'+(i+1),token:R().toString(36).slice(2)+R().toString(36).slice(2),on:1,ready:false,x:6,z:22,f:1,yaw:0,pitch:0,fl:1,cr:0,sp:0,mv:0,noise:0,hp:100,down:0,rv:0,bleed:0,bat:100,stam:100,exh:0,inv:{fuse:0,card:0,bat:1},docs:0,hold:0,hid:0,hidT:0,role:'survivor',team:'survivors',cd:{rush:0,track:0,dark:0,atk:0},buff:{rush:0,track:0},stat:{},lt:Date.now(),lastChat:0};r.players.set(p.id,p);if(!r.host)r.host=p.id;return p}
function newHost(r){const n=[...r.players.values()].find(p=>p.on);if(n){r.host=n.id;bc(r,{t:'sys',m:n.name+' is now host'});bc(r,lob(r))}}
function drop(r,p){clearTimeout(p.to);r.players.delete(p.id);if(r.host==p.id)newHost(r);if(!r.players.size){clearInterval(r.iv);rooms.delete(r.code)}else if(r.st=='lobby')bc(r,lob(r))}
function resume(r,p){tx(p.ws,{t:'start',mode:r.mode,story:r.story});C.setRole(p,p.role);C.pushItems(r,p.ws);C.pushInv(p);O.push(r);if(r.st=='results'&&r.last)tx(p.ws,r.last)}
function handle(r,p,m){const g=r.g,M=r.M;switch(m.t){
 case'ready':if(r.st=='lobby'){p.ready=!p.ready;bc(r,lob(r))}break;
 case'diff':if(r.host==p.id&&r.st=='lobby'&&DIFFS.includes(m.d)){r.diff=m.d;bc(r,lob(r))}break;
 case'mode':if(r.host==p.id&&r.st=='lobby'&&reg.modes[m.mode]){r.mode=m.mode;if(reg.stories[m.story])r.story=m.story;r.players.forEach(q=>q.ready=false);bc(r,lob(r))}break;
 case'kick':{const q=r.players.get(+m.id);if(r.host==p.id&&q&&q!=p){tx(q.ws,{t:'kicked'});try{q.ws&&q.ws.close()}catch(e){}drop(r,q)}break}
 case'start':if(r.host==p.id&&r.st=='lobby'){const md=reg.modes[r.mode],on=[...r.players.values()].filter(q=>q.on);
  if(on.length<md.min)tx(p.ws,{t:'err',m:md.name+' needs at least '+md.min+' players'});else if(on.length>md.max)tx(p.ws,{t:'err',m:md.name+' supports up to '+md.max+' players'});
  else if(!on.every(q=>q.id==r.host||q.ready))tx(p.ws,{t:'err',m:'Not everyone is ready'});else round.begin(r)}break;
 case'retry':if(r.host==p.id&&r.st=='results')round.begin(r);break;
 case'again':if(r.host==p.id&&r.st=='results'){r.st='lobby';r.players.forEach(q=>q.ready=false);bc(r,lob(r))}break;
 case'chat':{const n=Date.now();if(n-p.lastChat<700)break;p.lastChat=n;const s=clean(m.m,120);if(s)bc(r,{t:'chat',n:p.name,i:p.i,m:s});break}
 case'pg':bc(r,{t:'pg',i:p.i,n:p.name,x:num(m.x,-5,100),y:num(m.y,-6,10),z:num(m.z,-5,60),k:clean(m.k,20)||'Here'});break;
 case'bat':if(g&&r.st=='play'&&p.role=='survivor'&&p.inv.bat>0&&p.bat<60){p.inv.bat--;p.bat=100;C.pushInv(p)}break;
 case'hold':p.hold=!!m.on;break;
 case'abil':if(r.st=='play')C.ability(r,p,clean(m.k,10));break;
 case'warp':{if(!g||r.st!='play'||p.down||!p.arrT||Date.now()-p.arrT>5000)break;const x=+m.x,z=+m.z;if(Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-p.x,z-p.z)<=4.5&&!r.L.solid(p.f,x,z)){p.x=x;p.z=z;p.lt=Date.now();p.arrT=0}break}
 case's':{if(!g||r.st!='play'||p.down||p.hid)break;const now=Date.now(),dt=Math.max(.02,(now-p.lt)/1000);p.lt=now;const x=+m.x,z=+m.z,lim=C.maxSpeed(p)*dt*1.2+.9;
  if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-p.x,z-p.z)>lim||r.L.solid(p.f,x,z)){tx(p.ws,{t:'tp',x:p.x,z:p.z,f:p.f});break}
  p.x=x;p.z=z;p.yaw=num(m.yaw,-10,10);p.pitch=num(m.pitch,-2,2);p.cr=m.cr?1:0;p.sp=m.sp?1:0;p.fl=(m.fl&&p.role=='survivor')?1:0;p.mv=m.mv?1:0;p.noise=!p.mv?0:p.sp?.9:p.cr?.1:.35;break}
 case'stairs':{if(!g||r.st!='play'||p.down||p.hid)break;const s=M.STAIRS.find(s=>s.f==p.f&&Math.hypot(s.x-p.x,s.z-p.z)<3.2);if(!s)break;p.f=s.to[0];p.x=s.to[1];p.z=s.to[2];p.lt=Date.now();p.arrT=Date.now();tx(p.ws,{t:'tp',x:p.x,z:p.z,f:p.f,st:1});break}
 case'use':{if(!g||r.st!='play'||p.down||p.role!='survivor')break;
  if(p.hid){C.unhide(r,p);break}
  const h=M.HIDE.find(h=>h.f==p.f&&Math.hypot(h.ox-p.x,h.oz-p.z)<2.2);
  if(O.pickup(r,p))break;if(r.md.use&&r.md.use(r,p))break;if(g.o&&O.use(r,p))break;
  if(h){p.hid=1;p.hidT=0;p.ox=p.x;p.oz=p.z;p.x=h.x;p.z=h.z;C.stat(p,'hides');tx(p.ws,{t:'tp',x:p.x,z:p.z,f:p.f})}break}}}
wss.on('connection',ws=>{let p=null,r=null,n=0;const iv=setInterval(()=>n=0,1000);
 ws.on('message',raw=>{try{if(++n>90)return;let m;try{m=JSON.parse(raw)}catch(e){return}if(!m||typeof m!='object'||typeof m.t!='string')return;
  if(m.t=='list')return tx(ws,{t:'list',rooms:[...rooms.values()].filter(x=>!x.priv&&x.st=='lobby'&&cnt(x)<x.max).map(x=>({code:x.code,name:x.name,n:cnt(x),max:x.max,diff:x.diff,mode:x.mode}))});
  if(m.t=='modes')return tx(ws,{t:'modes',modes:reg.list(),stories:reg.storyList()});
  if(m.t=='ping')return tx(ws,{t:'pong',c:num(m.c,0,1e12)});
  if(!p){if(m.t=='create'){r=mkRoom(m);p=addP(r,ws,m.name)}
   else if(m.t=='join'){r=rooms.get(clean(m.code,8).toUpperCase());if(!r)return tx(ws,{t:'err',m:'Room not found'});
    const old=m.token&&[...r.players.values()].find(q=>q.token===String(m.token));
    if(old){p=old;p.ws=ws;p.on=1;clearTimeout(p.to);bc(r,{t:'sys',m:p.name+' reconnected'})}
    else if(r.st!='lobby'){r=null;return tx(ws,{t:'err',m:'Game already in progress'})}
    else if(cnt(r)>=r.max){r=null;return tx(ws,{t:'err',m:'Room is full'})}else p=addP(r,ws,m.name)}else return;
   tx(ws,{t:'joined',id:p.id,token:p.token,code:r.code});tx(ws,{t:'modes',modes:reg.list(),stories:reg.storyList()});
   if(r.st=='lobby')bc(r,lob(r));else if(r.g)resume(r,p);return}
  handle(r,p,m)}catch(e){console.error('msg',e)}});
 ws.on('error',()=>{});
 ws.on('close',()=>{clearInterval(iv);if(!p||p.ws!==ws)return;p.on=0;p.ws=null;p.hold=false;bc(r,{t:'sys',m:p.name+' disconnected'});if(r.host==p.id)newHost(r);if(r.st=='lobby')drop(r,p);else p.to=setTimeout(()=>drop(r,p),60000)})});
process.on('uncaughtException',e=>console.error('uncaught',e));
server.listen(process.env.PORT||3000,()=>console.log('Nightfall 2.0 server on :'+(process.env.PORT||3000)));
