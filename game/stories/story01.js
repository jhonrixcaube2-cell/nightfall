// STORY 01: "The Last Shift". To add a story, copy this file: change the chapters, documents, spawn list and endings, then register it in game/registry.js.
const S={id:'story01',title:'The Last Shift',map:'facility',steps:['fuses','card','switches','exit'],
 items:[['fuse',0],['fuse',1],['fuse',null],['card',2],['doc',2],['doc',0],['doc',1],['doc',null],['bat',1],['bat',1],['bat',0],['bat',2],['med',1],['med',0]],
 docs:['Memo: "W watches whoever looks away. Never split the shift."','Photo: nine staff, one tall shape behind them. Nobody drew it there.','Log: "Containment held for 11 years. The lights draw it. Never let the generator run past 3 a.m."','Note: "If you are reading this, you are the control group. Do not look back."'],
 intro:['11:02 p.m. The facility should be empty.','The power is out. Find the fuse box in the Generator Room.'],
 chapters:[
  {title:'Enter the abandoned location',obj:r=>'Chapter 1 of 5: Enter the facility. Look around and stay together.',done:(r,g)=>g.t>=15},
  {title:'Restore the power',obj:(r,g)=>`Chapter 2 of 5: Restore the power. Install 3 fuses (${g.o.fused}/3).`,done:(r,g)=>g.o.power,say:['Somewhere below you, something wakes up.']},
  {title:'Search for clues',obj:(r,g)=>`Chapter 3 of 5: Search for clues. Find the keycard on the upper floor and 2 staff documents (${Math.min(2,g.docs)}/2).`,done:(r,g,C)=>(g.o.termDone||C.survivors(r).some(p=>p.inv.card>0))&&g.docs>=2},
  {title:'Discover what happened',obj:r=>'Chapter 4 of 5: Discover what happened. Swipe the keycard at the Security Office terminal.',done:(r,g)=>g.o.termDone,say:['SECURITY LOG 03:07: "Subject W observed all night shifts. It moves only when unobserved."','SECURITY LOG 03:09: "Seal the exit. Let the elevator be the only way out."']},
  {title:'Find a way out',obj:(r,g,C,O)=>'Chapter 5 of 5: Find a way out. '+O.text(g),done:()=>false}],
 endings:{truth:{title:'THE TRUTH',text:'You carry every page out into the dawn. The Watcher was never trapped. It was waiting for someone to finally look.'},escape:{title:'ESCAPED',text:'You made it out. The doors lock behind you, and none of you talks about what was inside.'},fail:{title:'GAME OVER',text:'Every light went out. The shift never ended.'}}};
module.exports=S;
