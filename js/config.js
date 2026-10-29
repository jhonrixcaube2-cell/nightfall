/* ===== Nightfall configuration: edit credits here ===== */
const CREDITS=[
 {h:'Development',l:[['Game Design','Yota'],['Programming','Yota'],['Development','Yota']]},
 {h:'Production',l:[['3D art, environment & animation','Generated in code'],['Music & sound design','Synthesized with the Web Audio API']]},
 {h:'AI Assistance',l:[['Code assistance','Claude (Anthropic)']]},
 {h:'Technology',l:[['Three.js','MIT license'],['WebGL','Khronos'],['Node.js','OpenJS Foundation'],['ws WebSocket library','MIT license'],['Web Audio API','W3C']]},
 {h:'Fonts',l:[['Special Elite','Apache License 2.0'],['Creepster','SIL OFL 1.1'],['Barlow & Barlow Condensed','SIL OFL 1.1']]},
 {h:'Assets',l:['No third-party models, textures or audio files are used.']},
 {h:'Special Thanks',l:['To everyone who supported this project']}];
const CREDITS_END='Thank you for playing.';

const $=i=>document.getElementById(i),CS=4,H=3.2,rnd=Math.random,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),COL=['#e0b030','#4aa0e0','#e06050','#70d070','#c070e0','#40d0c0'];
const MAP=["#####################","#...#...#...#...#...#","#...#...#...#...#...#","#...#...#...#...#...#","##D###D###D###D###D##","#...................#","#...................#","##D###D###D###D###D##","#...#...#...#...#...#","#...#...#...#...#...#","#...#...#...#...#...#","#####################"];
const MAPB=["#####################","#...................#","#.#####.#####.#####.#","#.#...#.#...#.#...#.#","#.#...#.#...#.#...#.#","#.##.##.##.##.##.##.#","#...................#","#.##.##.##.##.##.##.#","#.#...#.#...#.#...#.#","#.#...#.#...#.#...#.#","#.#####.#####.#####.#","#####################"],MAPU=["#####################","#.......#.....#.....#","#.......#.....#.....#","#.......#.....#.....#","###.###.###.###.#####","#...................#","#...................#","###.###.###.###.#####","#.......#.....#.....#","#.......#.....#.....#","#.......#.....#.....#","#####################"];
const MAPS=[MAPB,MAP,MAPU],FLOORY=[-4,0,4],PROPS=[[],[],[]];let curF=1,YO=0,BF=1,hbL=0,creditsOn=0,atkSnd=0;const cool={};
const STAIRSD=[{f:1,x:79.4,z:22,lab:'Stairs down to the basement'},{f:0,x:79.4,z:22,lab:'Stairs up to the ground floor'},{f:1,x:4.6,z:26,lab:'Stairs up to the offices'},{f:2,x:4.6,z:26,lab:'Stairs down to the ground floor'}];
const CFG_DEF={q:'Medium',vol:.8,music:.7,sfx:.9,amb:.7,voice:.9,lv:{shadows:'Low',particles:'Medium',post:'High',fog:'Medium',view:'Medium'},shake:true,bob:true,names:true,calm:false,mute:{master:false,music:false,sfx:false,amb:false,voice:false},sens:1,name:''};const cfg=Object.assign(JSON.parse(JSON.stringify(CFG_DEF)),(()=>{try{return JSON.parse(localStorage.ls2)}catch(e){return{}}})());const saveCfg=()=>{try{localStorage.ls2=JSON.stringify(cfg)}catch(e){}};
let ws,my=0,code='',tok='',hostId=0,roster={},inGame=false,left=false,paused=false,typing=false,noLock=false,SM=0,G={stage:1,power:0,fused:0,exit:0,sw:[0,0],obj:''},INV={fuse:0,card:0,bat:0,docs:0},me={hp:100,down:0,bat:100,rv:0,stam:100,exh:0,rush:0,track:0,hid:0,bleed:0,cd:[0,0,0,0]};
