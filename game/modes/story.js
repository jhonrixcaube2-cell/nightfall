// STORY: cooperative, chapter-driven, 1-6 players, NPC Watcher.
module.exports=({core:C,obj:O,reg})=>({id:'story',name:'Story',min:1,max:6,bleed:0,eventRate:1,
 assign(r){C.players(r,p=>p.on).forEach(p=>C.setRole(p,'survivor'))},
 init(r){const S=reg.stories[r.story];r.S=S;O.init(r,S.steps);C.spawnItems(r,S.items);r.g.wk={on:true,sp:1,rest:1};r.g.m.t=110;r.g.ch=-1},
 objText(r){const g=r.g,ch=r.S.chapters[Math.min(g.ch,r.S.chapters.length-1)];return ch?ch.obj(r,g,C,O):O.text(g)},
 docText:(r,n)=>r.S.docs[(n-1)%r.S.docs.length],
 canTerminal:r=>r.g.ch>=3,
 onStep(r,what){if(what=='power'){r.g.wk.sp=1.1}if(what=='terminal'){r.g.m.t=Math.min(r.g.m.t,4);r.g.wk.rest=.7}},
 onDoc(r,p){C.stat(p,'docs')},
 tick(r,dt){const g=r.g,S=r.S;O.tick(r,dt);
  if(g.ch<0){g.ch=0;C.say(r,S.intro,S.title);O.push(r)}
  const cur=S.chapters[g.ch];if(cur&&cur.done(r,g,C)){g.ch++;const n=S.chapters[g.ch];if(cur.say)C.say(r,cur.say);if(n)bcTitle(r,g.ch,n.title);O.push(r)}
  const sv=C.survivors(r);if(sv.length&&sv.every(p=>p.down))C.finish(r,{winner:'none',title:S.endings.fail.title,text:S.endings.fail.text})},
 onEscape(r,p){const e=r.g.docs>=4?r.S.endings.truth:r.S.endings.escape;C.finish(r,{winner:'survivors',title:e.title,text:e.text,ending:r.g.docs>=4?'truth':'escape'})},
 onTimeout(){}});
function bcTitle(r,i,t){require('../core').bc(r,{t:'chapter',n:i+1,title:t})}
