// Reusable escape-objective chain. A mode picks steps from: fuses -> card -> switches -> exit.
const C=require('./core'),{bc,tx,dist,stat}=C;
const step=g=>g.o.steps[g.o.i]||'done',STAGE={fuses:1,card:2,switches:3,exit:4,done:4};
const init=(r,steps)=>{r.g.o={steps,i:0,fused:0,power:0,termDone:0,sw:[0,0],swT:0}};
function text(g){const o=g.o;return{fuses:`Install 3 fuses in the Generator Room fuse box (${o.fused}/3). Some are hidden below and above.`,card:'Power restored. Find the keycard (upper floor) and swipe it at the Security Office terminal',switches:'Hold both elevator switches at once in the Exit wing (one is enough if you are alone)',exit:'The way out is open. Reach the emergency exit',done:'Escape'}[step(g)]}
function push(r){const g=r.g,o=g.o;bc(r,{t:'g',stage:STAGE[step(g)],fused:o.fused,power:o.power,exit:step(g)=='exit'?1:0,sw:o.sw,obj:(r.md.objText&&r.md.objText(r))||text(g)})}
function pickup(r,p){const g=r.g,it=g.it.filter(i=>C.dist(i,p)<2.6).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(!it)return false;g.it.splice(g.it.indexOf(it),1);stat(p,'items');
 if(it.type=='doc'){p.docs++;g.docs++;tx(p.ws,{t:'doc',js:g.docs==2,text:r.md.docText?r.md.docText(r,g.docs):'A scrap of paper. The ink has run.'});r.md.onDoc&&r.md.onDoc(r,p)}
 else if(it.type=='med'){p.hp=Math.min(100,p.hp+40);tx(p.ws,{t:'sys',m:'You use a medkit (+40 health).'})}else p.inv[it.type]++;
 C.pushItems(r);C.pushInv(p);push(r);return true}
function use(r,p){const g=r.g,o=g.o,M=r.M.OBJ,st=step(g);
 if(st=='fuses'&&dist(p,M.fusebox)<3&&p.inv.fuse>0){p.inv.fuse--;o.fused++;stat(p,'obj');if(o.fused>=3){o.power=1;o.i++;bc(r,{t:'ev',k:'power'});r.md.onStep&&r.md.onStep(r,'power')}push(r);C.pushInv(p);return true}
 if(st=='card'&&dist(p,M.terminal)<3&&p.inv.card>0){if(r.md.canTerminal&&!r.md.canTerminal(r,p)){tx(p.ws,{t:'sys',m:'The terminal rejects the card. It needs more evidence first.'});return true}
  p.inv.card--;o.termDone=1;o.i++;bc(r,{t:'ev',k:'unlock'});stat(p,'obj');r.md.onStep&&r.md.onStep(r,'terminal');push(r);C.pushInv(p);return true}
 if(st=='exit'&&dist(p,M.exit)<3){r.md.onEscape(r,p);return true}return false}
function tick(r,dt){const g=r.g,o=g.o;if(step(g)!='switches')return;const M=r.M.OBJ,al=C.survivors(r).filter(p=>!p.down),hs=M.switches.map(s=>al.some(p=>p.hold&&dist(p,s)<2.6)?1:0);
 if(hs[0]!=o.sw[0]||hs[1]!=o.sw[1]){o.sw=hs;push(r)}if(al.length<2?(hs[0]||hs[1]):(hs[0]&&hs[1])){o.swT+=dt;if(o.swT>=3){o.i++;o.swT=0;bc(r,{t:'ev',k:'elevator'});r.md.onStep&&r.md.onStep(r,'switches');push(r)}}else o.swT=0}
module.exports={init,step,text,push,pickup,use,tick};
