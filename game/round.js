// Server-side round state machine: lobby -> loading -> play -> ending -> results -> lobby. Clients never decide any of it.
const C=require('./core'),reg=require('./registry'),W=require('./watcher'),O=require('./objectives'),{tx,bc}=C;
function begin(r){const md=reg.modes[r.mode];r.md=md;r.M=reg.maps[r.map];r.L=reg.lib(r.map);r.st='loading';r.res=null;
 r.g={t:0,limit:0,nid:1,it:[],docs:0,m:W.newState(),wk:null,o:null,ev:35};
 const sp=C.shuf(r.M.SPAWN.players);let k=0;
 r.players.forEach(p=>{Object.assign(p,{role:'survivor',team:'survivors',hp:100,down:0,rv:0,bleed:0,bat:100,stam:100,exh:0,inv:{fuse:0,card:0,bat:1},docs:0,fl:1,hold:0,hid:0,hidT:0,cd:{rush:0,track:0,dark:0,atk:0},buff:{rush:0,track:0},stat:{},f:1,lt:Date.now(),noise:0});
  const s=sp[k++%sp.length];p.x=s[0];p.z=s[1]});
 md.assign(r);md.init(r);
 bc(r,{t:'start',mode:r.mode,story:r.story});r.players.forEach(p=>C.setRole(p,p.role));r.players.forEach(p=>{C.pushInv(p)});C.pushItems(r);O.push(r);bc(r,{t:'round',st:'loading'});
 clearInterval(r.iv);r.iv=setInterval(()=>{try{tick(r,.1)}catch(e){console.error('tick',e)}},100);
 setTimeout(()=>{if(r.st=='loading'){r.st='play';bc(r,{t:'round',st:'play'})}},4500)}
function tick(r,dt){if(r.st=='play'){C.tickCommon(r,dt);if(r.md.tick)r.md.tick(r,dt);if(r.g.wk&&r.g.wk.on)W.tick(r,dt);if(r.g.o)O.tick(r,dt);if(r.g.limit>0&&r.g.t>=r.g.limit&&!r.res)r.md.onTimeout(r);if(r.res)end(r)}C.snapshot(r)}
function end(r){const res=r.res;r.st='ending';if(res.winner=='monsters')bc(r,{t:'ev',k:'victory',f:1});bc(r,{t:'round',st:'ending',title:res.title,winner:res.winner});
 setTimeout(()=>{if(r.st!='ending')return;clearInterval(r.iv);r.st='results';const g=r.g,o=g.o;r.last={t:'results',winner:res.winner,title:res.title,text:res.text,ending:res.ending||'',mode:r.mode,dur:Math.round(g.t),obj:{done:o?o.i:(g.sv?g.sv.tasks:0),total:o?o.steps.length:0},
  players:[...r.players.values()].map(p=>({id:p.id,name:p.name,i:p.i,role:p.role,team:p.team,alive:p.role!='spectator'&&!p.down,stat:p.stat}))};bc(r,r.last)},3200)}
module.exports={begin,tick,end};
