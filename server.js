// THE LAST SHIFT: NIGHTFALL — authoritative game server (Node + ws). `npm i && npm start`
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const CS=4,R=Math.random,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),q2=n=>Math.round(n*100)/100;
const num=(v,a,b,d)=>{v=+v;return Number.isFinite(v)?clamp(v,a,b):(d||0)};
const clean=(s,n)=>String(s==null?'':s).replace(/[\u0000-\u001f<>&"'`]/g,'').trim().slice(0,n);
// Floors: 0 = basement tunnels, 1 = ground facility, 2 = upper offices
const MAPS=[
["#####################","#...................#","#.#####.#####.#####.#","#.#...#.#...#.#...#.#","#.#...#.#...#.#...#.#","#.##.##.##.##.##.##.#","#...................#","#.##.##.##.##.##.##.#","#.#...#.#...#.#...#.#","#.#...#.#...#.#...#.#","#.#####.#####.#####.#","#####################"],
["#####################","#...#...#...#...#...#","#...#...#...#...#...#","#...#...#...#...#...#","##D###D###D###D###D##","#...................#","#...................#","##D###D###D###D###D##","#...#...#...#...#...#","#...#...#...#...#...#","#...#...#...#...#...#","#####################"],
["#####################","#.......#.....#.....#","#.......#.....#.....#","#.......#.....#.....#","###.###.###.###.#####","#...................#","#...................#","###.###.###.###.#####","#.......#.....#.....#","#.......#.....#.....#","#.......#.....#.....#","#####################"]];
const LINKS=[[1,19,5,0,19,5],[1,1,6,2,1,6]];
const STAIRS=[{f:1,x:79.4,z:22,to:[0,77.5,22]},{f:0,x:79.4,z:22,to:[1,77.5,22]},{f:1,x:4.6,z:26,to:[2,6.5,26]},{f:2,x:4.6,z:26,to:[1,6.5,26]}];
const WP=[[[4,3],[10,3],[16,3],[4,8],[10,8],[16,8],[1,1],[10,1],[19,1],[1,6],[10,6],[19,6],[7,6],[13,6]],
 [[2,2],[6,2],[10,2],[14,2],[18,2],[2,9],[6,9],[10,9],[14,9],[18,9],[3,5],[9,5],[15,5],[19,5],[1,6]],
 [[3,2],[10,2],[16,2],[3,9],[10,9],[16,9],[3,5],[10,5],[17,5],[1,6]]];
const SPOTS=[[[18,16],[42,16],[66,16],[18,36],[42,36],[66,36]],[[10,14],[26,14],[42,14],[58,14],[74,14],[10,34],[26,34],[42,34],[58,34],[74,34]],[[18,10],[46,10],[70,10],[18,38],[46,38],[70,38]]];
const DIFF={NORMAL:{sp:1,dmg:25,rest:1},HARD:{sp:1.15,dmg:34,rest:1.5},NIGHTMARE:{sp:1.3,dmg:50,rest:2.2}};
const FB={f:1,x:42,z:5},TERM={f:1,x:10,z:5},SW=[{f:1,x:69,z:34},{f:1,x:69,z:42}],EXIT={f:1,x:79.4,z:38};
const ST=['IDLE','PATROL','INVESTIGATE','STALK','HUNT','CHASE','SEARCH','RETREAT','DETECT'];
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'},rooms=new Map();let nid=1;
const server=http.createServer((q,s)=>{try{let u=decodeURIComponent((q.url||'/').split('?')[0]);if(u=='/health')return s.end('ok');if(u=='/')u='/index.html';
 if(!/^\/(index\.html|css\/[\w.-]+\.css|js\/[\w.-]+\.js)$/.test(u)){s.statusCode=404;return s.end('not found')}
 const f=path.join(__dirname,u);s.setHeader('Content-Type',(MIME[path.extname(f)]||'text/plain')+'; charset=utf-8');s.setHeader('Cache-Control','no-cache');s.end(fs.readFileSync(f))}catch(e){s.statusCode=404;s.end('not found')}});
const wss=new WebSocketServer({server,maxPayload:4096});
const tx=(ws,o)=>{try{ws&&ws.readyState==1&&ws.send(JSON.stringify(o))}catch(e){}},bc=(r,o)=>r.players.forEach(p=>tx(p.ws,o)),cnt=r=>r.players.size;
const mkcode=()=>{let c;do c=Array.from({length:5},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[R()*32|0]).join('');while(rooms.has(c));return c};
const lob=r=>({t:'lobby',code:r.code,name:r.name,diff:r.diff,host:r.host,max:r.max,priv:r.priv,players:[...r.players.values()].map(p=>({id:p.id,name:p.name,i:p.i,on:p.on,ready:p.ready}))});
const solid=(f,x,z)=>{const c=Math.floor(x/CS),r=Math.floor(z/CS);return c<0||r<0||c>20||r>11||MAPS[f][r][c]=='#'};
function los(f,ax,az,bx,bz){const n=Math.ceil(Math.hypot(bx-ax,bz-az)/.5);for(let i=1;i<n;i++){const t=i/n;if(solid(f,ax+(bx-ax)*t,az+(bz-az)*t))return false}return true}
function bfs3(a,b){const k=n=>n[0]+','+n[1]+','+n[2],q=[a],prev={[k(a)]:null};
 while(q.length){const n=q.shift();if(k(n)==k(b))break;const[f,c,r]=n,nb=[];for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=r+dr;if(nc>=0&&nr>=0&&nc<21&&nr<12&&MAPS[f][nr][nc]!='#')nb.push([f,nc,nr])}
  LINKS.forEach(l=>{if(l[0]==f&&l[1]==c&&l[2]==r)nb.push([l[3],l[4],l[5]]);if(l[3]==f&&l[4]==c&&l[5]==r)nb.push([l[0],l[1],l[2]])});for(const m of nb)if(!(k(m)in prev)){prev[k(m)]=n;q.push(m)}}
 if(!(k(b)in prev))return[];const p=[];for(let cur=b;cur;cur=prev[k(cur)])p.unshift(cur);return p}
const cellOf=o=>[o.f,clamp(Math.floor(o.x/CS),0,20),clamp(Math.floor(o.z/CS),0,11)];
const dist=(a,b)=>a.f==b.f?Math.hypot(a.x-b.x,a.z-b.z):999,d3=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z)+30*Math.abs(a.f-b.f);
function mkRoom(m){const code=mkcode(),r={code,name:clean(m.room,24)||'Night Shift',max:clamp(Math.floor(num(m.max,1,4,4)),1,4),priv:!!m.priv,diff:DIFF[m.diff]?m.diff:'NORMAL',players:new Map(),host:0,st:'lobby'};rooms.set(code,r);return r}
function addP(r,ws,name){const used=new Set([...r.players.values()].map(p=>p.i));let i=0;while(used.has(i))i++;const p={id:nid++,ws,i,name:clean(name,16)||'Player'+(i+1),token:R().toString(36).slice(2)+R().toString(36).slice(2),on:1,ready:false,x:6,z:22,f:1,yaw:0,pitch:0,fl:1,cr:0,sp:0,mv:0,noise:0,hp:100,down:0,rv:0,bat:100,inv:{fuse:0,card:0,bat:1},docs:0,hold:0,lt:Date.now(),lastChat:0};r.players.set(p.id,p);if(!r.host)r.host=p.id;return p}
function newHost(r){const n=[...r.players.values()].find(p=>p.on);if(n){r.host=n.id;bc(r,{t:'sys',m:n.name+' is now host'});bc(r,lob(r))}}
function drop(r,p){clearTimeout(p.to);r.players.delete(p.id);if(r.host==p.id)newHost(r);if(!r.players.size){clearInterval(r.iv);rooms.delete(r.code)}else if(r.st=='lobby')bc(r,lob(r))}
const shuf=a=>a.slice().sort(()=>R()-.5);
function startGame(r){r.st='play';const pools=SPOTS.map(s=>shuf(s).map(([x,z])=>({x:x+(R()*4-2),z:z+(R()*3-1.5)})));let id=1;const it=[];
 [['fuse',0],['fuse',1],['fuse',R()<.5?0:1],['card',2],['doc',2],['doc',0],['bat',1],['bat',1],['bat',0],['bat',2]].forEach(([t,f])=>{const s=pools[f].pop()||{x:6,z:22};it.push({id:id++,type:t,f,x:s.x,z:s.z})});
 r.g={stage:1,fused:0,power:0,exit:0,sw:[0,0],swT:0,evT:40,docs:0,it,m:{x:-9,z:-9,f:1,yaw:0,st:'IDLE',vis:0,t:110,dash:0,seen:0,path:[],cd:0,tgt:0,last:0,pt:0,lost:0,rush:0,lk:null}};
 let k=0;r.players.forEach(p=>{Object.assign(p,{x:6+(k%2)*2,z:22+(k>>1)*2,f:1,hp:100,down:0,rv:0,bat:100,inv:{fuse:0,card:0,bat:1},docs:0,fl:1,hold:0});p.lt=Date.now();k++});
 bc(r,{t:'start'});pushG(r);pushItems(r);r.players.forEach(pushInv);clearInterval(r.iv);r.iv=setInterval(()=>{try{tick(r,.1)}catch(e){console.error('tick',e)}},100)}
const OBJ=g=>g.stage==1?`Install 3 fuses in the Generator Room fuse box (${g.fused}/3). Some are hidden below and above.`:g.stage==2?'Power restored. Find the keycard (upper floor) and swipe it at the Security Office terminal':g.stage==3?'Two players: hold both elevator switches at once (Exit wing)':'The elevator is open. Reach the emergency exit';
const pushG=r=>bc(r,{t:'g',stage:r.g.stage,fused:r.g.fused,power:r.g.power,exit:r.g.exit,sw:r.g.sw,obj:OBJ(r.g)});
const pushItems=(r,to)=>{const o={t:'items',it:r.g.it.map(i=>[i.id,i.type,q2(i.x),q2(i.z),i.f])};to?tx(to,o):bc(r,o)};
const pushInv=p=>tx(p.ws,{t:'inv',...p.inv,docs:p.docs}),end=(r,k)=>{if(r.st=='end')return;r.st='end';clearInterval(r.iv);bc(r,{t:'end',k})};
function handle(r,p,m){const g=r.g;switch(m.t){
 case'ready':if(r.st=='lobby'){p.ready=!p.ready;bc(r,lob(r))}break;
 case'diff':if(r.host==p.id&&r.st=='lobby'&&DIFF[m.d]){r.diff=m.d;bc(r,lob(r))}break;
 case'kick':{const q=r.players.get(+m.id);if(r.host==p.id&&q&&q!=p){tx(q.ws,{t:'kicked'});try{q.ws&&q.ws.close()}catch(e){}drop(r,q)}break}
 case'start':if(r.host==p.id&&r.st=='lobby'){if([...r.players.values()].every(q=>q.id==r.host||q.ready||!q.on))startGame(r);else tx(p.ws,{t:'err',m:'Not everyone is ready'})}break;
 case'retry':if(r.host==p.id&&r.st=='end')startGame(r);break;
 case'again':if(r.host==p.id&&r.st=='end'){r.st='lobby';r.players.forEach(q=>q.ready=false);bc(r,lob(r))}break;
 case'chat':{const n=Date.now();if(n-p.lastChat<700)break;p.lastChat=n;const s=clean(m.m,120);if(s)bc(r,{t:'chat',n:p.name,i:p.i,m:s});break}
 case'pg':bc(r,{t:'pg',i:p.i,n:p.name,x:num(m.x,-5,100),y:num(m.y,-6,10),z:num(m.z,-5,60),k:clean(m.k,20)||'Here'});break;
 case'bat':if(g&&p.inv.bat>0&&p.bat<60){p.inv.bat--;p.bat=100;pushInv(p)}break;
 case'hold':p.hold=!!m.on;break;
 case's':{if(!g||r.st!='play'||p.down)break;const now=Date.now(),dt=Math.max(.02,(now-p.lt)/1000);p.lt=now;const x=+m.x,z=+m.z;
  if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-p.x,z-p.z)>6.2*dt+.8||solid(p.f,x,z)){tx(p.ws,{t:'tp',x:p.x,z:p.z,f:p.f});break}
  p.x=x;p.z=z;p.yaw=num(m.yaw,-10,10);p.pitch=num(m.pitch,-2,2);p.cr=m.cr?1:0;p.sp=m.sp?1:0;p.fl=m.fl?1:0;p.mv=m.mv?1:0;p.noise=!p.mv?0:p.sp?.9:p.cr?.1:.35;break}
 case'stairs':{if(!g||r.st!='play'||p.down)break;const s=STAIRS.find(s=>s.f==p.f&&Math.hypot(s.x-p.x,s.z-p.z)<3.2);if(!s)break;p.f=s.to[0];p.x=s.to[1];p.z=s.to[2];p.lt=Date.now();tx(p.ws,{t:'tp',x:p.x,z:p.z,f:p.f,st:1});break}
 case'use':{if(!g||r.st!='play'||p.down)break;
  const it=g.it.filter(i=>dist(i,p)<2.6).sort((a,b)=>dist(a,p)-dist(b,p))[0];
  if(it){g.it.splice(g.it.indexOf(it),1);if(it.type=='doc'){p.docs++;g.docs++;tx(p.ws,{t:'doc',js:g.docs==2,text:g.docs==1?'Memo: "W watches whoever looks away. Never split the shift."':'Photo: nine staff, one tall shape behind them. Nobody drew it there.'})}else p.inv[it.type]++;pushItems(r);pushInv(p);break}
  if(dist(p,FB)<3&&g.stage==1&&p.inv.fuse>0){p.inv.fuse--;g.fused++;if(g.fused>=3){g.power=1;g.stage=2;bc(r,{t:'ev',k:'power'})}pushG(r);pushInv(p)}
  else if(dist(p,TERM)<3&&g.stage==2&&p.inv.card>0){p.inv.card--;g.stage=3;bc(r,{t:'ev',k:'unlock'});pushG(r);pushInv(p)}
  else if(dist(p,EXIT)<3&&g.stage==4)end(r,g.docs>=2?'SURVIVORS':'ESCAPE');break}}}
function walk(m,dt,s){if(!m.path.length)return 0;const[f,c,r]=m.path[0],tx_=(c+.5)*CS,tz=(r+.5)*CS;if(f!=m.f){m.f=f;m.x=tx_;m.z=tz;m.path.shift();return 1}
 const dx=tx_-m.x,dz=tz-m.z,d=Math.hypot(dx,dz);if(d<=s*dt){m.x=tx_;m.z=tz;m.path.shift()}else{m.x+=dx/d*s*dt;m.z+=dz/d*s*dt}m.yaw=Math.atan2(dx,dz);return 1}
const go=(m,f,c,r)=>{m.path=bfs3(cellOf(m),[f,c,r]);m.path.shift()};
function spawnFar(m,ps){const tp=ps[R()*ps.length|0];let best=null,bs=-1;for(let f=0;f<3;f++)WP[f].forEach(([c,r])=>{const o={f,x:(c+.5)*CS,z:(r+.5)*CS},d=d3(o,tp),vis=!ps.some(p=>p.f==f&&los(f,o.x,o.z,p.x,p.z)),s=(vis?0:-40)+(d>16&&d<36?30:0)-Math.abs(d-26)+R()*10;if(s>bs){bs=s;best=o}});
 m.f=best.f;m.x=best.x;m.z=best.z;m.vis=1;m.path=[]}
function hurt(r,p,D){p.hp-=D.dmg;tx(p.ws,{t:'hit'});if(p.hp<=0){p.hp=0;p.down=1;p.rv=0;bc(r,{t:'sys',m:p.name+' is down!'});if([...r.players.values()].every(q=>q.down||!q.on))end(r,'FAILURE')}}
function stalkEv(r,m){bc(r,{t:'ev',k:'lights',x:q2(m.x),z:q2(m.z)});if(!m.seen){m.seen=1;bc(r,{t:'ev',k:'first'})}}
function monster(r,dt){const g=r.g,m=g.m,D=DIFF[r.diff],ps=[...r.players.values()].filter(p=>p.on&&!p.down);if(!ps.length)return;m.cd-=dt;m.t-=dt;
 const info=ps.map(p=>{const d=d3(p,m),l=m.vis&&m.f==p.f&&d<22&&los(m.f,m.x,m.z,p.x,p.z),iso=Math.min(30,...ps.filter(q=>q!=p).map(q=>d3(q,p)))/30;return{p,d,l,s:p.noise*14/Math.max(d,2)+(l?10/Math.max(d,3):0)+iso*.6+(p.fl&&l?.4:0)-(m.last==p.id?.3:0)}}).sort((a,b)=>b.s-a.s);
 const b=info[0],T=info.find(i=>i.p.id==m.tgt)||b,set=(s,t)=>{m.st=s;m.t=t||0;m.path=[];m.lost=0};
 if(T.l)m.lk=cellOf(T.p);
 switch(m.st){
 case'IDLE':if(m.t<=0){spawnFar(m,ps);set('PATROL')}break;
 case'PATROL':if(m.dash>0)m.dash-=dt;else if(m.vis&&R()<dt/40){m.dash=.7;bc(r,{t:'ev',k:'dash'})}
  if(!walk(m,dt,(m.dash>0?7:1.5)*D.sp)){const wf=R()<.7?ps[R()*ps.length|0].f:R()*3|0,t=WP[wf][R()*WP[wf].length|0];go(m,wf,t[0],t[1])}
  if(b.s>1.1){m.tgt=b.p.id;set('INVESTIGATE');go(m,...cellOf(b.p))}else if(b.l&&b.d<14&&R()<dt*.25){m.tgt=b.p.id;set('DETECT',1.2);bc(r,{t:'ev',k:'detect'})}break;
 case'INVESTIGATE':if(T.l&&T.d<14)set('DETECT',1.2);else if(!walk(m,dt,2.3*D.sp))set('SEARCH',8);break;
 case'DETECT':m.yaw=Math.atan2(T.p.x-m.x,T.p.z-m.z);if(m.t<=0){set('STALK',6+R()*5);stalkEv(r,m)}break;
 case'STALK':m.yaw=Math.atan2(T.p.x-m.x,T.p.z-m.z);if(T.d>11){m.pt-=dt;if(m.pt<=0){m.pt=.5;go(m,...cellOf(T.p))}walk(m,dt,1.2)}
  if(T.p.noise>.8&&T.d<16||T.d<6.5){set('CHASE',14);m.rush=1.5;bc(r,{t:'ev',k:'rush'})}else if(m.t<=0)R()<.5?set('HUNT',10):set('RETREAT');break;
 case'HUNT':m.pt-=dt;if(m.pt<=0){m.pt=.5;if(R()<.4){const w=WP[T.p.f][R()*WP[T.p.f].length|0];go(m,T.p.f,w[0],w[1])}else go(m,...cellOf(T.p))}walk(m,dt,2.6*D.sp);
  if(T.l&&T.d<7||T.p.noise>.8&&T.d<12){set('CHASE',14);m.rush=1.5;bc(r,{t:'ev',k:'rush'})}else if(m.t<=0)set('SEARCH',8);break;
 case'CHASE':{m.pt-=dt;m.rush-=dt;m.lost=T.l?0:m.lost+dt;const sp=(m.rush>0?5.6:4.0)*D.sp;
  if(T.l&&T.d<5){const dx=T.p.x-m.x,dz=T.p.z-m.z,s=sp*dt;m.x+=dx/T.d*s;m.z+=dz/T.d*s;m.yaw=Math.atan2(dx,dz)}else{if(m.pt<=0){m.pt=.4;go(m,...cellOf(T.p))}walk(m,dt,sp)}
  if(T.d<1.3&&m.cd<=0){m.cd=3;hurt(r,T.p,D);m.last=T.p.id;if(R()<.6){set('RETREAT');break}}
  if(m.lost>5||m.t<=0){set('SEARCH',9);if(m.lk)go(m,...m.lk)}break}
 case'SEARCH':if(!walk(m,dt,1.4)){const c=cellOf(m),nc=c[1]+(R()*7|0)-3,nr=c[2]+(R()*7|0)-3;if(nc>0&&nr>0&&nc<20&&nr<11&&MAPS[m.f][nr][nc]!='#')go(m,m.f,nc,nr)}if(b.l&&b.d<6){m.tgt=b.p.id;set('CHASE',12)}else if(m.t<=0)R()<.6?set('RETREAT'):set('PATROL');break;
 case'RETREAT':m.vis=0;m.x=m.z=-9;set('IDLE',(14+R()*25)*D.rest);break}}
function tick(r,dt){const g=r.g;if(!g||r.st!='play')return;monster(r,dt);
 r.players.forEach(p=>{if(p.fl&&p.bat>0&&!p.down)p.bat=Math.max(0,p.bat-dt*.12);
  if(p.hold&&!p.down&&p.on){const q=[...r.players.values()].find(o=>o.down&&o!=p&&dist(o,p)<2.4);if(q){q.rv+=dt/4;if(g.m.vis&&dist(g.m,p)<3)q.rv=0;if(q.rv>=1){q.down=0;q.hp=40;q.rv=0;bc(r,{t:'sys',m:q.name+' was revived'})}}}});
 const hs=SW.map(s=>[...r.players.values()].some(p=>p.hold&&p.on&&!p.down&&dist(p,s)<2.6)?1:0);
 if(g.stage==3){if(hs[0]!=g.sw[0]||hs[1]!=g.sw[1]){g.sw=hs;pushG(r)}if(hs[0]&&hs[1]){g.swT+=dt;if(g.swT>=3){g.exit=1;g.stage=4;pushG(r);bc(r,{t:'ev',k:'elevator'})}}else g.swT=0}
 g.evT-=dt;if(g.evT<=0){g.evT=28+R()*35;const L=['phone','clang','radio','door','shadow','prints','scratch','glitch','slam','whisperd','drip','creak'];if(g.stage>=2)L.push('glimpse','glimpse');if(g.stage>=2&&R()<.15)L.push('ceiling','ceiling','ceiling');
  const k=L[R()*L.length|0],ev={t:'ev',k,x:q2(6+R()*72),z:R()<.5?24:R()<.5?10:38,f:R()*3|0};if(['shadow','prints','scratch','glimpse','ceiling'].includes(k)){const on=[...r.players.values()].filter(p=>p.on&&!p.down);if(on.length)tx(on[R()*on.length|0].ws,ev)}else bc(r,ev)}
 if(g.m.st=='PATROL'&&R()<dt/35){const p=[...r.players.values()][R()*r.players.size|0];if(p)bc(r,{t:'ev',k:'mimic',s:['step','door','radio'][R()*3|0],x:q2(clamp(p.x+(R()*30-15),5,78)),z:24,f:p.f})}
 bc(r,{t:'snap',p:[...r.players.values()].map(p=>[p.id,q2(p.x),q2(p.z),q2(p.yaw),q2(p.pitch),p.fl,p.cr,p.sp,p.mv,p.hp,p.down,Math.round(p.bat),q2(p.rv),p.on,p.f]),m:[q2(g.m.x),q2(g.m.z),q2(g.m.yaw),ST.indexOf(g.m.st),g.m.vis,g.m.f]})}
wss.on('connection',ws=>{let p=null,r=null,n=0;const iv=setInterval(()=>n=0,1000);
 ws.on('message',raw=>{try{if(++n>90)return;let m;try{m=JSON.parse(raw)}catch(e){return}if(!m||typeof m!='object'||typeof m.t!='string')return;
  if(m.t=='list')return tx(ws,{t:'list',rooms:[...rooms.values()].filter(x=>!x.priv&&x.st=='lobby'&&cnt(x)<x.max).map(x=>({code:x.code,name:x.name,n:cnt(x),max:x.max,diff:x.diff}))});
  if(m.t=='ping')return tx(ws,{t:'pong',c:num(m.c,0,1e12)});
  if(!p){if(m.t=='create'){r=mkRoom(m);p=addP(r,ws,m.name)}
   else if(m.t=='join'){r=rooms.get(clean(m.code,8).toUpperCase());if(!r)return tx(ws,{t:'err',m:'Room not found'});
    const old=m.token&&[...r.players.values()].find(q=>q.token===String(m.token));
    if(old){p=old;p.ws=ws;p.on=1;clearTimeout(p.to);bc(r,{t:'sys',m:p.name+' reconnected'})}
    else if(r.st!='lobby'){r=null;return tx(ws,{t:'err',m:'Game already in progress'})}
    else if(cnt(r)>=r.max){r=null;return tx(ws,{t:'err',m:'Room is full'})}else p=addP(r,ws,m.name)}else return;
   tx(ws,{t:'joined',id:p.id,token:p.token,code:r.code});
   if(r.st=='lobby')bc(r,lob(r));else if(r.g){tx(ws,{t:'start'});pushG(r);pushItems(r,ws);pushInv(p)}return}
  handle(r,p,m)}catch(e){console.error('msg',e)}});
 ws.on('error',()=>{});
 ws.on('close',()=>{clearInterval(iv);if(!p||p.ws!==ws)return;p.on=0;p.ws=null;p.hold=false;bc(r,{t:'sys',m:p.name+' disconnected'});if(r.host==p.id)newHost(r);if(r.st=='lobby')drop(r,p);else p.to=setTimeout(()=>drop(r,p),60000)})});
process.on('uncaughtException',e=>console.error('uncaught',e));
server.listen(process.env.PORT||3000,()=>console.log('Nightfall server on :'+(process.env.PORT||3000)));
