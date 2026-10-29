// The one place to register content. New mode: add a file in game/modes and list it here. New story/map: same.
const C=require('./core'),O=require('./objectives'),maps={facility:require('./maps/facility')},stories={story01:require('./stories/story01')},libs={};
const reg={maps,stories,lib:id=>libs[id]||(libs[id]=require('./maplib')(maps[id])),modes:{}};
['story','monster','survival','infection'].forEach(id=>reg.modes[id]=require('./modes/'+id)({core:C,obj:O,reg}));
reg.meta={story:{desc:'Cooperative chapters. Investigate the facility, uncover what happened, and escape.',diff:'Medium',rec:'2 to 4 players',players:'1-6',art:'story'},
 monster:{desc:'One player becomes the Monster and hunts the rest. Survivors restore power and escape.',diff:'Hard',rec:'4 to 6 players',players:'2-6',art:'monster'},
 survival:{desc:'Survive ten minutes while the building and the Watcher grow more dangerous.',diff:'Hard',rec:'2 to 6 players',players:'1-6',art:'survival'},
 infection:{desc:'One infected player spreads the curse. Last survivors escape or outlast the clock.',diff:'Medium',rec:'4 to 6 players',players:'2-6',art:'infection'}};
reg.list=()=>Object.keys(reg.modes).map(id=>({id,name:reg.modes[id].name,min:reg.modes[id].min,max:reg.modes[id].max,...reg.meta[id]}));
reg.storyList=()=>Object.values(stories).map(s=>({id:s.id,title:s.title,map:s.map}));
module.exports=reg;
