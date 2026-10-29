// INFECTION: one infected hunts; every catch joins the infected. Survivors win by escaping or lasting the timer.
module.exports=({core:C,obj:O})=>({id:'infection',name:'Infection',min:2,max:6,bleed:0,eventRate:.4,
 assign(r){const ps=C.players(r,p=>p.on),m=ps[C.R()*ps.length|0];ps.forEach(p=>C.setRole(p,p===m?'infected':'survivor'))},
 init(r){O.init(r,['fuses','exit']);r.g.limit=300;r.g.wk=null;C.spawnItems(r,[['fuse',1],['fuse',1],['fuse',0],['bat',1],['bat',0],['med',1]]);C.monsters(r).forEach(m=>C.placeFar(r,m))},
 objText:r=>r.g.o.steps[r.g.o.i]=='exit'?'The exit is open. Run for it!':null,
 onInfect(r,q,att){C.infect(r,q,att)},
 tick(r,dt){if(!C.survivors(r).length)C.finish(r,{winner:'monsters',title:'EVERYONE IS INFECTED',text:'The infection has spread to the last survivor.'})},
 onEscape(r,p){C.finish(r,{winner:'survivors',title:'SURVIVORS ESCAPE',text:p.name+' reached the exit while the infection spread behind them.'})},
 onTimeout(r){C.survivors(r).length?C.finish(r,{winner:'survivors',title:'SURVIVORS HOLD OUT',text:'Dawn came before the infection could finish its work.'}):C.finish(r,{winner:'monsters',title:'EVERYONE IS INFECTED',text:'No one survived the night.'})}});
