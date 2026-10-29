// The NPC Watcher (used by Story and Survival). Extracted unchanged in behaviour from Nightfall 1.x, now parameterised by r.g.wk.
const C=require('./core'),{tx,bc,q2,R,clamp,d3,dist}=C;
const ST=['IDLE','PATROL','INVESTIGATE','STALK','HUNT','CHASE','SEARCH','RETREAT','DETECT'];
const DIFF={NORMAL:{sp:1,dmg:25,rest:1},HARD:{sp:1.15,dmg:34,rest:1.5},NIGHTMARE:{sp:1.3,dmg:50,rest:2.2}};
const newState=()=>({x:-9,z:-9,f:1,yaw:0,st:'IDLE',vis:0,t:110,dash:0,seen:0,path:[],cd:0,tgt:0,last:0,pt:0,lost:0,rush:0,lk:null,found:{}});
function walk(m,dt,s,CS){if(!m.path.length)return 0;const[f,c,r]=m.path[0],tx_=(c+.5)*CS,tz=(r+.5)*CS;if(f!=m.f){m.f=f;m.x=tx_;m.z=tz;m.path.shift();return 1}
 const dx=tx_-m.x,dz=tz-m.z,d=Math.hypot(dx,dz);if(d<=s*dt){m.x=tx_;m.z=tz;m.path.shift()}else{m.x+=dx/d*s*dt;m.z+=dz/d*s*dt}m.yaw=Math.atan2(dx,dz);return 1}
function tick(r,dt){const g=r.g,m=g.m,wk=g.wk,L=r.L,M=r.M,CS=M.CS,D=DIFF[r.diff]||DIFF.NORMAL,sp=D.sp*wk.sp,all=C.survivors(r).filter(p=>!p.down);if(!all.length)return;m.cd-=dt;m.t-=dt;
 const go=(f,c,rr)=>{m.path=L.bfs3(L.cellOf(m),[f,c,rr]);m.path.shift()},ps=all.filter(p=>!p.hid);
 all.filter(p=>p.hid).forEach(p=>{if(m.vis&&dist(p,m)<2.2){m.found[p.id]=(m.found[p.id]||0)+dt;if(m.found[p.id]>2.5){m.found[p.id]=0;C.unhide(r,p);C.hurt(r,p,Math.round(D.dmg),'npc')}}else m.found[p.id]=0});
 if(!ps.length)return;
 const info=ps.map(p=>{const d=d3(p,m),l=m.vis&&m.f==p.f&&d<22&&L.los(m.f,m.x,m.z,p.x,p.z),iso=Math.min(30,...ps.filter(q=>q!=p).map(q=>d3(q,p)))/30;return{p,d,l,s:p.noise*14/Math.max(d,2)+(l?10/Math.max(d,3):0)+iso*.6+(p.fl&&l?.4:0)-(m.last==p.id?.3:0)}}).sort((a,b)=>b.s-a.s);
 const b=info[0],T=info.find(i=>i.p.id==m.tgt)||b,set=(s,t)=>{m.st=s;m.t=t||0;m.path=[];m.lost=0},stalkEv=()=>{bc(r,{t:'ev',k:'lights',x:q2(m.x),z:q2(m.z)});if(!m.seen){m.seen=1;bc(r,{t:'ev',k:'first'})}},cell=C=>L.cellOf(C);
 if(T.l)m.lk=cell(T.p);
 switch(m.st){
 case'IDLE':if(m.t<=0){let best=null,bs=-1;const tp=ps[R()*ps.length|0];for(let f=0;f<3;f++)M.WP[f].forEach(([c,rr])=>{const o={f,x:(c+.5)*CS,z:(rr+.5)*CS},d=d3(o,tp),vis=!ps.some(p=>p.f==f&&L.los(f,o.x,o.z,p.x,p.z)),s=(vis?0:-40)+(d>16&&d<36?30:0)-Math.abs(d-26)+R()*10;if(s>bs){bs=s;best=o}});m.f=best.f;m.x=best.x;m.z=best.z;m.vis=1;set('PATROL')}break;
 case'PATROL':if(m.dash>0)m.dash-=dt;else if(m.vis&&R()<dt/40){m.dash=.7;bc(r,{t:'ev',k:'dash'})}
  if(!walk(m,dt,(m.dash>0?7:1.5)*sp,CS)){const wf=R()<.7?ps[R()*ps.length|0].f:R()*3|0,t=M.WP[wf][R()*M.WP[wf].length|0];go(wf,t[0],t[1])}
  if(b.s>1.1){m.tgt=b.p.id;set('INVESTIGATE');go(...cell(b.p))}else if(b.l&&b.d<14&&R()<dt*.25){m.tgt=b.p.id;set('DETECT',1.2);bc(r,{t:'ev',k:'detect'})}break;
 case'INVESTIGATE':if(T.l&&T.d<14){set('DETECT',1.2);bc(r,{t:'ev',k:'detect'})}else if(!walk(m,dt,2.3*sp,CS))set('SEARCH',8);break;
 case'DETECT':m.yaw=Math.atan2(T.p.x-m.x,T.p.z-m.z);if(m.t<=0){set('STALK',6+R()*5);stalkEv()}break;
 case'STALK':m.yaw=Math.atan2(T.p.x-m.x,T.p.z-m.z);if(T.d>11){m.pt-=dt;if(m.pt<=0){m.pt=.5;go(...cell(T.p))}walk(m,dt,1.2,CS)}
  if(T.p.noise>.8&&T.d<16||T.d<6.5){set('CHASE',14);m.rush=1.5;bc(r,{t:'ev',k:'rush'})}else if(m.t<=0)R()<.5?set('HUNT',10):set('RETREAT');break;
 case'HUNT':m.pt-=dt;if(m.pt<=0){m.pt=.5;if(R()<.4){const w=M.WP[T.p.f][R()*M.WP[T.p.f].length|0];go(T.p.f,w[0],w[1])}else go(...cell(T.p))}walk(m,dt,2.6*sp,CS);
  if(T.l&&T.d<7||T.p.noise>.8&&T.d<12){set('CHASE',14);m.rush=1.5;bc(r,{t:'ev',k:'rush'})}else if(m.t<=0)set('SEARCH',8);break;
 case'CHASE':{m.pt-=dt;m.rush-=dt;m.lost=T.l?0:m.lost+dt;const v=(m.rush>0?5.6:4.0)*sp;
  if(T.l&&T.d<5){const dx=T.p.x-m.x,dz=T.p.z-m.z,s=v*dt;m.x+=dx/T.d*s;m.z+=dz/T.d*s;m.yaw=Math.atan2(dx,dz)}else{if(m.pt<=0){m.pt=.4;go(...cell(T.p))}walk(m,dt,v,CS)}
  if(T.d<1.3&&m.cd<=0){m.cd=3;C.hurt(r,T.p,D.dmg,'npc');m.last=T.p.id;if(R()<.6){set('RETREAT');break}}
  if(m.lost>5||m.t<=0){set('SEARCH',9);if(m.lk)go(...m.lk)}break}
 case'SEARCH':if(!walk(m,dt,1.4,CS)){const c=cell(m),nc=c[1]+(R()*7|0)-3,nr=c[2]+(R()*7|0)-3;if(nc>0&&nr>0&&nc<20&&nr<11&&M.MAPS[m.f][nr][nc]!='#')go(m.f,nc,nr)}if(b.l&&b.d<6){m.tgt=b.p.id;set('CHASE',12)}else if(m.t<=0)R()<.6?set('RETREAT'):set('PATROL');break;
 case'RETREAT':m.vis=0;m.x=m.z=-9;set('IDLE',(14+R()*25)*D.rest*wk.rest);break}}
function tickW(r,dt){const m=r.g.m,before=m.st;tick(r,dt);const ps=m.ps||before;
 if(m.st!=ps){if(m.st=='SEARCH')bc(r,{t:'ev',k:'search',x:q2(m.x),z:q2(m.z),f:m.f});if(m.st=='SEARCH'&&ps=='CHASE')bc(r,{t:'ev',k:'lost',x:q2(m.x),z:q2(m.z),f:m.f})}
 m.ps=m.st}
module.exports={ST,newState,tick:tickW};
