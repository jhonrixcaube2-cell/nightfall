// Roles are data. Add a role here and modes can assign it with core.setRole(player,'id').
module.exports={
 survivor:{label:'Survivor',team:'survivors',idx:0,model:0,text:'Survive.',abil:[]},
 monster:{label:'Monster',team:'monsters',idx:1,model:1,text:'You are the Monster.',abil:['rush','track','dark'],melee:{dmg:34,range:1.9,cd:1.1},
  spd:{base:3.7,rushV:6.2,rushDur:2,rushCd:14,trackDur:6,trackCd:28,darkCd:32,darkDur:7}},
 infected:{label:'Infected',team:'monsters',idx:2,model:1,text:'You are infected. Catch the survivors.',abil:['rush','track'],melee:{dmg:0,range:1.8,cd:.9,convert:1},
  spd:{base:3.6,rushV:6,rushDur:1.6,rushCd:11,trackDur:4,trackCd:30}},
 spectator:{label:'Spectator',team:'spec',idx:3,model:0,text:'You are watching.',abil:[]}};
