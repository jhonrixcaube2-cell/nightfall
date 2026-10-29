// SURVIVAL: cooperative, 1-6 players. Survive 10 minutes while the Watcher grows more dangerous and scarce-resource tasks appear.
module.exports=({core:C,obj:O})=>({id:'survival',name:'Survival',min:1,max:6,bleed:40,eventRate:1.2,
 assign(r){C.players(r,p=>p.on).forEach(p=>C.setRole(p,'survivor'))},
 init(r){const g=r.g;g.limit=600;g.wk={on:false,sp:1,rest:1.3};g.m.t=3;g.sv={phase:0,task:null,next:90,bat:60,tasks:0};O.init(r,[]);C.spawnItems(r,[['bat',1],['bat',0],['bat',2],['med',1],['med',0],['med',2]])},
 phaseName:t=>t<120?'Calm':t<300?'The threat grows':t<480?'High danger':'Final stand',
 objText(r){const g=r.g,s=g.sv;return s.task?`TASK: return the fuse to the fuse box (${Math.max(0,Math.ceil(s.task.dl-g.t))}s). Phase: ${this.phaseName(g.t)}`:`Survive until dawn. Phase: ${this.phaseName(g.t)}`},
 use(r,p){const g=r.g,s=g.sv;if(s.task&&p.inv.fuse>0&&C.dist(p,r.M.OBJ.fusebox)<3){p.inv.fuse--;s.task=null;s.next=g.t+80;s.tasks++;C.stat(p,'obj');C.survivors(r).forEach(q=>{q.hp=Math.min(100,q.hp+25);q.bat=Math.min(100,q.bat+25)});C.bc(r,{t:'ev',k:'unlock'});C.say(r,['The fuse holds. The lights steady. Everyone catches their breath.']);C.pushInv(p);O.push(r);return true}return false},
 tick(r,dt){const g=r.g,s=g.sv,t=g.t,wk=g.wk;
  if(t>=120&&!wk.on){wk.on=true;g.m.t=2;C.say(r,['Something is awake in the building.'])}
  const ph=t<120?0:t<300?1:t<480?2:3;if(ph!=s.phase){s.phase=ph;wk.sp=[1,1,1.15,1.3][ph];wk.rest=[1.3,1,.7,.45][ph];g.ev=Math.min(g.ev,4);C.say(r,[['','The threat grows.','High danger. The building is turning on you.','Final stand. Hold out until dawn.'][ph]]);O.push(r)}
  if(!s.task&&t>=s.next&&t<g.limit-40){s.task={dl:t+70};C.addItem(r,'fuse',null);C.say(r,['A surge is tearing through the wiring. Carry a fuse to the fuse box before the lights die!']);O.push(r)}
  if(s.task&&t>s.task.dl){s.task=null;s.next=t+90;C.bc(r,{t:'ev',k:'blackout',x:42,z:24,f:1,d:14});C.say(r,['The surge hit. The lights are gone.']);wk.sp+=.05;O.push(r)}
  if(t>=s.bat){s.bat=t+(t<300?60:110);C.addItem(r,'bat',null);if(t<300&&C.R()<.5)C.addItem(r,'med',null)}
  if(Math.floor(t)%5==0&&Math.floor(t)!=s.last){s.last=Math.floor(t);O.push(r)}
  const sv=C.survivors(r);if(!sv.length||sv.every(p=>p.down))C.finish(r,{winner:'none',title:'GAME OVER',text:'The night was longer than you were.'})},
 onTimeout(r){C.finish(r,{winner:'survivors',title:'YOU SURVIVED THE NIGHT',text:'Dawn breaks over the facility. You made it.'})},onEscape(){}});
