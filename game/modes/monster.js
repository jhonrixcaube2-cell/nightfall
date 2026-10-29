// MONSTER: asymmetric. One random player is the Monster (first person, abilities); the rest are Survivors who must escape.
module.exports=({core:C,obj:O})=>({id:'monster',name:'Monster',min:2,max:6,bleed:45,eventRate:.6,
 assign(r){const ps=C.players(r,p=>p.on),m=ps[C.R()*ps.length|0];ps.forEach(p=>C.setRole(p,p===m?'monster':'survivor'))},
 init(r){O.init(r,['fuses','card','exit']);r.g.limit=720;r.g.wk=null;C.spawnItems(r,[['fuse',0],['fuse',1],['fuse',null],['card',2],['bat',1],['bat',0],['bat',2],['med',1],['med',0]]);C.monsters(r).forEach(m=>C.placeFar(r,m))},
 objText:r=>r.g.o.steps[r.g.o.i]=='exit'?'Reach the emergency exit before the Monster finds you':null,
 tick(r,dt){const sv=C.survivors(r);if(!sv.length||sv.every(p=>p.down))C.finish(r,{winner:'monsters',title:'THE MONSTER WINS',text:'No one left to run.'})},
 onEscape(r,p){C.finish(r,{winner:'survivors',title:'SURVIVORS ESCAPE',text:p.name+' opened the way out. The Monster is left alone in the dark.'})},
 onTimeout(r){C.finish(r,{winner:'monsters',title:'THE MONSTER WINS',text:'Time ran out before the survivors could escape.'})}});
