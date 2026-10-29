/* collision helpers (needed while the world is built) */
function tileSolid(c,r){return c<0||r<0||c>20||r>11||MAPS[curF][r][c]=='#'}
function blocked(x,z,q=.35){for(const[a,b]of[[q,q],[-q,q],[q,-q],[-q,-q]])if(tileSolid(Math.floor((x+a)/CS),Math.floor((z+b)/CS)))return 1;for(const p of PROPS[curF])if(x+q>p[0]&&x-q<p[2]&&z+q>p[1]&&z-q<p[3])return 1;return 0}
function freeSpot(x,z){if(!blocked(x,z))return[x,z];for(let r=.3;r<=4.5;r+=.3)for(let a=0;a<24;a++){const t=a/24*6.2832,nx=x+Math.cos(t)*r,nz=z+Math.sin(t)*r;if(!blocked(nx,nz))return[nx,nz]}return null}
/* ---- scene ---- */
const R=new THREE.WebGLRenderer({canvas:$('cv'),antialias:false}),sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(72,1,.05,60);cam.rotation.order='YXZ';sc.add(cam);
sc.background=new THREE.Color(0x030405);sc.fog=new THREE.FogExp2(0x030405,.06);const amb=new THREE.AmbientLight(0x1a2226,.3);sc.add(amb);
function tex(base,n,rx,ry){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,128,128);for(let i=0;i<n;i++){g.fillStyle=`rgba(${rnd()*50|0},${rnd()*50|0},${rnd()*50|0},.14)`;g.fillRect(rnd()*128,rnd()*128,1+rnd()*3,1+rnd()*14)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);return t}
const MT=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8,metalness:.3}),propM=MT(0x3b4140),metalM=MT(0x6a7472),pipeM=MT(0x555c58),darkM=MT(0x15191a);
/* ===== v2: procedural PBR-ish surfaces, merged static geometry, detailed dressing ===== */
function cv(w){const c=document.createElement('canvas');c.width=c.height=w;return c}
function R2(g,n,w,col,a,sx,sy){for(let i=0;i<n;i++){g.fillStyle=col.replace('A',(rnd()*a).toFixed(2));g.fillRect(rnd()*w,rnd()*w,1+rnd()*sx,1+rnd()*sy)}}
function crack(g,w,col){g.strokeStyle=col;g.lineWidth=1.3;let x=rnd()*w,y=rnd()*w*.3;g.beginPath();g.moveTo(x,y);for(let i=0;i<14;i++){x+=(rnd()-.5)*26;y+=8+rnd()*14;g.lineTo(x,y)}g.stroke()}
function surf(kind,rx,ry){const W=kind=='wall'?512:256,c=cv(W),g=c.getContext('2d'),rc=cv(64),rg=rc.getContext('2d');let rough=.9,metal=0;
 g.fillStyle={wall:'#74786f',floor:'#4a4d4a',ceil:'#4b4e4c',wood:'#5b4330',metal:'#6d7473',rust:'#6b3d22',plastic:'#262a2a',fabric:'#2f4745',paper:'#cfc8b0',skin:'#8b8f86'}[kind];g.fillRect(0,0,W,W);
 if(kind=='wall'){g.fillStyle='#43524e';g.fillRect(0,W*.55,W,W*.45);g.fillStyle='#232d2a';g.fillRect(0,W*.54,W,4);R2(g,500,W,'rgba(190,200,185,A)',.5,6,3);for(let i=0;i<14;i++){const gr=g.createLinearGradient(0,0,0,W);gr.addColorStop(0,'rgba(20,18,12,0)');gr.addColorStop(1,'rgba(20,18,12,.4)');g.fillStyle=gr;g.fillRect(rnd()*W,0,3+rnd()*8,W)}crack(g,W,'rgba(15,15,12,.7)');crack(g,W,'rgba(15,15,12,.5)')}
 else if(kind=='floor'){for(let i=0;i<8;i++)for(let j=0;j<8;j++){const v=rnd()*22-10;g.fillStyle=`rgb(${74+v|0},${77+v|0},${74+v|0})`;g.fillRect(i*32+1,j*32+1,30,30)}crack(g,W,'rgba(10,10,10,.6)')}
 else if(kind=='ceil'){g.strokeStyle='#202222';g.lineWidth=3;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*64,0);g.lineTo(i*64,W);g.moveTo(0,i*64);g.lineTo(W,i*64);g.stroke()}}
 else if(kind=='wood'){g.strokeStyle='rgba(25,15,8,.5)';for(let i=0;i<8;i++){g.strokeRect(0,i*32,W,32);for(let j=0;j<5;j++){const y=i*32+rnd()*30;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(80,y+4,160,y-4,W,y+2);g.stroke()}}}
 else if(kind=='metal'){for(let i=0;i<120;i++){g.fillStyle=`rgba(${rnd()<.5?255:0},${rnd()<.5?255:0},${rnd()<.5?255:0},${rnd()*.06})`;g.fillRect(0,rnd()*W,W,1)}rough=.45;metal=.7}
 else if(kind=='rust'){R2(g,260,W,'rgba(150,70,25,A)',.6,30,22);R2(g,200,W,'rgba(30,18,10,A)',.6,20,20);rough=.8;metal=.5}
 else if(kind=='plastic'){rough=.4;metal=.1}
 else if(kind=='skin'){R2(g,400,W,'rgba(60,70,60,A)',.4,30,20);for(let i=0;i<30;i++){g.strokeStyle='rgba(40,30,40,.35)';g.beginPath();let x=rnd()*W,y=rnd()*W;g.moveTo(x,y);for(let k=0;k<6;k++){x+=rnd()*30-15;y+=rnd()*30-15;g.lineTo(x,y)}g.stroke()}rough=.8}
 R2(g,kind=='wall'?900:600,W,'rgba(12,12,10,A)',.18,3,12);R2(g,60,W,'rgba(60,50,30,A)',.2,40,40);
 rg.fillStyle='#e0e0e0';rg.fillRect(0,0,64,64);if(kind=='floor')for(let i=0;i<5;i++){rg.fillStyle='rgba(30,30,30,.9)';rg.beginPath();rg.arc(rnd()*64,rnd()*64,6+rnd()*10,0,7);rg.fill()}
 const mk=cc=>{const t=new THREE.CanvasTexture(cc);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx||1,ry||1);t.anisotropy=4;return t},m=mk(c),mat=new THREE.MeshStandardMaterial({map:m,roughness:rough,metalness:metal});
 if(kind!='plastic'&&kind!='paper'){mat.bumpMap=m;mat.bumpScale=.9}if(kind=='floor')mat.roughnessMap=mk(rc);return mat}
const lin=(a,b)=>{const c=cv(64),g=c.getContext('2d'),r=g.createLinearGradient(0,0,0,64);r.addColorStop(0,a);r.addColorStop(1,b);g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)};
const GLOW=(()=>{const c=cv(64),g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const GRAD=lin('#fff','#000');
const RAINT=(()=>{const c=cv(128),g=c.getContext('2d');g.strokeStyle='rgba(200,220,255,.7)';for(let i=0;i<70;i++){const x=rnd()*128,y=rnd()*128;g.beginPath();g.moveTo(x,y);g.lineTo(x-2,y+10+rnd()*12);g.stroke()}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);return t})();
const NIGHT=new THREE.MeshBasicMaterial({map:(()=>{const c=cv(128),g=c.getContext('2d'),r=g.createLinearGradient(0,0,0,128);r.addColorStop(0,'#16233a');r.addColorStop(1,'#0a1018');g.fillStyle=r;g.fillRect(0,0,128,128);g.fillStyle='#cfd9e8';g.beginPath();g.arc(92,30,8,0,7);g.fill();g.fillStyle='#05080c';for(let i=0;i<9;i++){g.beginPath();g.moveTo(i*16,128);g.lineTo(i*16+8,60+rnd()*30);g.lineTo(i*16+16,128);g.fill()}return new THREE.CanvasTexture(c)})()});
const RAINM=new THREE.MeshBasicMaterial({map:RAINT,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false});
const MOONT=(()=>{const c=cv(64),g=c.getContext('2d');g.fillStyle='#fff';for(let i=0;i<2;i++)for(let j=0;j<2;j++)g.fillRect(2+i*31,2+j*31,28,28);return new THREE.CanvasTexture(c)})();
const SCR=(()=>{const c=cv(128),g=c.getContext('2d');g.fillStyle='#031';g.fillRect(0,0,128,128);g.fillStyle='#4f8';g.font='9px monospace';for(let i=0;i<12;i++)g.fillText(['> LOG 03:07','SUBJECT W','NO SIGNAL','ERR 0x7F','> WATCHING','CAM 4/7'][i%6]+(i*37%99),4,10+i*10);return new THREE.CanvasTexture(c)})();
const HAZ=(()=>{const c=cv(64),g=c.getContext('2d');g.fillStyle='#b8961f';g.fillRect(0,0,64,64);g.fillStyle='#161512';for(let i=-4;i<8;i++){g.beginPath();g.moveTo(i*16,0);g.lineTo(i*16+8,0);g.lineTo(i*16+72,64);g.lineTo(i*16+64,64);g.fill()}R2(g,200,64,'rgba(10,10,10,A)',.3,3,3);return new THREE.CanvasTexture(c)})();
const glassTex=(()=>{const c=cv(128),g=c.getContext('2d');g.fillStyle='rgba(120,150,165,.3)';g.fillRect(0,0,128,128);R2(g,300,128,'rgba(90,90,80,A)',.25,12,2);for(let i=0;i<3;i++)crack(g,128,'rgba(230,240,255,.6)');return new THREE.CanvasTexture(c)})();
const M={wood:surf('wood'),metal:surf('metal'),rust:surf('rust'),plastic:surf('plastic'),fabric:surf('fabric'),paper:surf('paper'),dark:new THREE.MeshStandardMaterial({color:0x0e1010,roughness:.8}),ext:new THREE.MeshStandardMaterial({color:0x9a1c18,roughness:.5,metalness:.3}),
 glass:new THREE.MeshStandardMaterial({map:glassTex,color:0xaebfc4,transparent:true,roughness:.1,metalness:.2,depthWrite:false}),screen:new THREE.MeshBasicMaterial({map:SCR,color:0xaaffcc}),
 ledG:new THREE.MeshBasicMaterial({color:0x40ff70}),ledB:new THREE.MeshBasicMaterial({color:0x60b0ff}),ledR:new THREE.MeshBasicMaterial({color:0xff3a2a}),hazard:new THREE.MeshStandardMaterial({map:HAZ,roughness:.8}),
 moon:new THREE.MeshBasicMaterial({map:MOONT,color:0x8fb0e0,transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false})};
const WALLM=surf('wall'),FLOORM=surf('floor',21,12),CEILM=surf('ceil',21,12),DOORS=[];
const BX=new THREE.BoxGeometry(1,1,1),CY=new THREE.CylinderGeometry(1,1,1,10),SP=new THREE.SphereGeometry(1,8,6),PLN=new THREE.PlaneGeometry(1,1),MG_=new Map();
function mAdd(geo,mat,x,y,z,rx,ry,rz,sx,sy,sz){const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y+YO,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(sx||1,sy||1,sz||1));const g=geo.clone();g.applyMatrix4(m);let e=MG_.get(mat);if(!e)MG_.set(mat,e=[]);e.push(g)}
function mBuild(){MG_.forEach((gs,mat)=>{let nv=0,ni=0;gs.forEach(g=>{nv+=g.attributes.position.count;ni+=g.index?g.index.count:g.attributes.position.count});const Pp=new Float32Array(nv*3),Nn=new Float32Array(nv*3),Uu=new Float32Array(nv*2),I=new Uint32Array(ni);let vo=0,io=0;
 gs.forEach(g=>{const n=g.attributes.position.count;Pp.set(g.attributes.position.array,vo*3);Nn.set(g.attributes.normal.array,vo*3);Uu.set(g.attributes.uv.array,vo*2);if(g.index){for(let i=0;i<g.index.count;i++)I[io+i]=g.index.array[i]+vo;io+=g.index.count}else{for(let i=0;i<n;i++)I[io+i]=vo+i;io+=n}vo+=n;g.dispose()});
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(Pp,3));G.setAttribute('normal',new THREE.BufferAttribute(Nn,3));G.setAttribute('uv',new THREE.BufferAttribute(Uu,2));G.setIndex(new THREE.BufferAttribute(I,1));const me_=new THREE.Mesh(G,mat);me_.castShadow=!mat.transparent&&mat.blending!==THREE.AdditiveBlending;me_.receiveShadow=true;sc.add(me_)});MG_.clear()}
const bB=(m,w,h,d,x,y,z,ry,rx,rz)=>mAdd(BX,m,x,y,z,rx,ry,rz,w,h,d),bC=(m,r,h,x,y,z,rx,ry,rz)=>mAdd(CY,m,x,y,z,rx,ry,rz,r,h,r),bS=(m,a,b,c,x,y,z)=>mAdd(SP,m,x,y,z,0,0,0,a,b,c);
let sd=777;const rs=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296;
function L(ox,oz,ry){const co=Math.cos(ry),si=Math.sin(ry),W=(x,z)=>[ox+x*co+z*si,oz-x*si+z*co];return{b(m,w,h,d,x,y,z,r,rx,rz){const p=W(x,z);bB(m,w,h,d,p[0],y,p[1],ry+(r||0),rx,rz)},c(m,r,h,x,y,z){const p=W(x,z);bC(m,r,h,p[0],y,p[1])},s(m,a,b,c,x,y,z){const p=W(x,z);bS(m,a,b,c,p[0],y,p[1])}}}
const sol=(x,z,w,d,ry)=>{const r=ry||0,cw=Math.abs(Math.cos(r))*w+Math.abs(Math.sin(r))*d,cd=Math.abs(Math.sin(r))*w+Math.abs(Math.cos(r))*d;PROPS[BF].push([x-cw/2,z-cd/2,x+cw/2,z+cd/2])};
function desk(x,z,ry,mon){const l=L(x,z,ry);l.b(M.wood,2,.06,.9,0,.74,0);[-.95,.95].forEach(o=>l.b(M.wood,.05,.72,.85,o,.37,0));l.b(M.wood,1.9,.55,.03,0,.45,.4);l.b(M.metal,.5,.5,.8,.65,.5,0);l.b(M.dark,.44,.04,.02,.65,.62,-.41);l.b(M.dark,.44,.04,.02,.65,.4,-.41);l.b(M.wood,.44,.18,.4,.65,.42,-.6);
 if(mon){l.b(M.plastic,.55,.38,.05,-.4,1.05,.15);l.b(M.screen,.48,.3,.01,-.4,1.06,.12);l.b(M.plastic,.1,.14,.1,-.4,.83,.15);l.b(M.plastic,.5,.02,.16,-.4,.77,-.15)}
 l.b(M.paper,.3,.012,.4,.5,.775,.1,.4);l.b(M.paper,.28,.012,.36,.25,.78,-.1,-.3);l.c(M.rust,.04,.1,.75,.82,.2);sol(x,z,2.1,1,ry)}
function chair(x,z,ry){const l=L(x,z,ry);l.b(M.plastic,.46,.06,.46,0,.46,0);l.b(M.plastic,.44,.5,.05,0,.74,.22,0,-.15);l.c(M.metal,.03,.4,0,.24,0);l.b(M.metal,.55,.03,.06,0,.04,0);l.b(M.metal,.06,.03,.55,0,.04,0,.2);l.b(M.metal,.04,.04,.4,.25,.55,0);l.b(M.metal,.04,.04,.4,-.25,.55,0)}
function shelf(x,z,ry,w,full){const l=L(x,z,ry);[-1,1].forEach(a=>[-1,1].forEach(c=>l.c(M.metal,.025,2,a*(w/2-.03),1,c*.27)));for(let i=0;i<5;i++){const y=.12+i*.5;l.b(M.metal,w,.03,.6,0,y,0);if(rs()<(full||.75))for(let k=0;k<3;k++){const m=[M.paper,M.wood,M.rust,M.plastic][rs()*4|0];l.b(m,.2+rs()*.3,.2+rs()*.2,.35,(rs()-.5)*(w-.5),y+.13,(rs()-.5)*.2,rs()*.4-.2)}if(rs()<.3)l.c(M.glass,.05,.2,(rs()-.5)*w*.6,y+.13,0)}sol(x,z,w,.6,ry)}
const crate=(x,z,s,ry,y0)=>{const y=(y0||0)+s/2;bB(M.wood,s,s,s,x,y,z,ry);bB(M.dark,s*1.02,.05,s*1.02,x,y+s*.3,z,ry);bB(M.dark,s*1.02,.05,s*1.02,x,y-s*.3,z,ry);if(!y0)sol(x,z,s,s,ry)};
const barrel=(x,z,m)=>{bC(m||M.rust,.3,.9,x,.45,z);bC(M.dark,.31,.05,x,.2,z);bC(M.dark,.31,.05,x,.7,z);bC(M.dark,.26,.02,x,.91,z);sol(x,z,.6,.6)};
const bag=(x,z)=>{bS(M.dark,.35,.3,.32,x,.28,z);bS(M.dark,.2,.16,.2,x+.1,.5,z)};
function lockers(x,z,ry,n){const l=L(x,z,ry);for(let i=0;i<n;i++){const o=i*.52-n*.26+.26;l.b(M.metal,.5,1.9,.5,o,.95,0);l.b(M.dark,.3,.04,.02,o,1.65,-.26);l.b(M.dark,.3,.04,.02,o,1.58,-.26);l.b(M.rust,.04,.12,.03,o+.15,1.1,-.27)}if(rs()<.8)l.b(M.metal,.46,1.8,.03,n*.26-.1,.95,-.5,.9);sol(x,z,n*.52,.5,ry)}
function bed(x,z,ry,sheet){const l=L(x,z,ry);l.b(M.metal,.9,.06,2,0,.5,0);[[-.4,-.95],[.4,-.95],[-.4,.95],[.4,.95]].forEach(p=>l.c(M.metal,.025,.5,p[0],.25,p[1]));l.b(M.fabric,.85,.12,1.9,0,.59,0);l.b(M.paper,.4,.1,.3,0,.7,.7);if(sheet)l.b(M.paper,.86,.05,1.2,0,.67,-.3,.1);l.b(M.metal,.9,.5,.04,0,.8,.98);sol(x,z,.9,2,ry)}
function rack(x,z,ry){const l=L(x,z,ry);l.b(M.dark,.8,2.1,.8,0,1.05,0);for(let i=0;i<9;i++){l.b(M.metal,.74,.02,.02,0,.2+i*.2,-.41);for(let k=0;k<4;k++)l.b([M.ledG,M.ledB,M.ledR][rs()*3|0],.03,.02,.01,-.25+k*.12,.28+i*.2,-.41)}sol(x,z,.8,.8,ry)}
function bench(x,z,ry){const l=L(x,z,ry);l.b(M.metal,2.2,.05,.8,0,.9,0);[-1,1].forEach(a=>[-1,1].forEach(c=>l.b(M.metal,.05,.9,.05,a*1.05,.45,c*.35)));l.b(M.dark,2.1,.3,.7,0,.15,0);for(let i=0;i<5;i++){const h=.15+rs()*.25;l.c(M.glass,.05,h,-.8+i*.4,.92+h/2,(rs()-.5)*.4)}l.b(M.plastic,.3,.25,.25,.6,1.05,0);l.c(M.metal,.03,.4,.6,1.2,0);sol(x,z,2.2,.8,ry)}
function vend(x,z,ry){const l=L(x,z,ry);l.b(M.plastic,1,1.9,.8,0,.95,0);l.b(M.ledB,.8,1.2,.02,0,1.15,-.41);l.b(M.dark,.8,.15,.02,0,.25,-.41);sol(x,z,1,.8,ry)}
function couch(x,z,ry){const l=L(x,z,ry);l.b(M.fabric,2,.4,.9,0,.3,0);l.b(M.fabric,2,.6,.25,0,.7,.33);[-1,1].forEach(a=>l.b(M.fabric,.2,.6,.9,a*.9,.5,0));sol(x,z,2,.9,ry)}
function table(x,z,ry){const l=L(x,z,ry);l.b(M.wood,1.6,.06,.9,0,.74,0);[[-.7,-.35],[.7,-.35],[-.7,.35],[.7,.35]].forEach(p=>l.b(M.wood,.06,.72,.06,p[0],.37,p[1]));sol(x,z,1.6,.9,ry)}
function genr(x,z,ry){const l=L(x,z,ry);l.b(M.metal,2.4,1.4,1.2,0,.9,0);l.b(M.rust,2.6,.2,1.3,0,.1,0);l.c(M.rust,.35,1.2,-.7,.95,.8);l.c(M.metal,.1,1.3,.9,2,.2);l.b(M.hazard,2.4,.12,.02,0,.55,-.61);l.b(M.ledR,.1,.1,.02,-.8,1.2,-.62);for(let i=0;i<4;i++)l.c(M.metal,.06,3,-.9+i*.3,1.8,.5);sol(x,z,2.6,1.3,ry)}
function bars(x0,x1,z){for(let x=x0;x<=x1;x+=.14)bC(M.metal,.018,2.8,x,1.4,z);bB(M.metal,x1-x0,.06,.06,(x0+x1)/2,2.7,z);bB(M.metal,x1-x0,.06,.06,(x0+x1)/2,.15,z);sol((x0+x1)/2,z,x1-x0,.2)}
function posterTex(k){const c=cv(128),g=c.getContext('2d');g.fillStyle='#b9b196';g.fillRect(0,0,128,128);R2(g,200,128,'rgba(60,40,20,A)',.3,10,10);g.fillStyle='#2a2217';g.font='bold 14px sans-serif';g.textAlign='center';
 if(k==0){g.fillStyle='#a02';g.fillRect(0,0,128,28);g.fillStyle='#eee';g.fillText('WARNING',64,20);g.fillStyle='#222';g.fillText('RESTRICTED AREA',64,60);g.fillText('AUTHORIZED ONLY',64,80)}
 else if(k==1){g.fillText('MISSING',64,24);g.fillRect(36,34,56,50);g.fillStyle='#b9b196';g.fillRect(40,38,48,42);g.fillStyle='#2a2217';g.fillText('DO NOT LOOK',64,104);g.fillText('AWAY',64,120)}
 else{g.strokeStyle='#300';g.lineWidth=3;for(let r=10;r<56;r+=11){g.beginPath();g.arc(64,64,r,0,7);g.stroke()}g.fillStyle='#300';g.beginPath();g.ellipse(64,64,22,9,0,0,7);g.fill();g.fillStyle='#b9b196';g.beginPath();g.arc(64,64,4,0,7);g.fill()}return new THREE.CanvasTexture(c)}
function poster(k,x,y,z,ry){const m=new THREE.Mesh(PLN,new THREE.MeshStandardMaterial({map:posterTex(k),roughness:.9}));m.scale.set(.7,.7,1);m.position.set(x,y,z);m.rotation.y=ry;sc.add(m)}
const STX=[0,1,2].map(k=>{const c=cv(128),g=c.getContext('2d');for(let i=0;i<(k==2?3:14);i++){const x=k==2?20+i*40:30+rnd()*70,y=64+(rnd()-.5)*(k==2?10:60),r=k==2?25+rnd()*10:8+rnd()*22,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(40,6,6,.85)');gr.addColorStop(.7,'rgba(30,8,6,.55)');gr.addColorStop(1,'rgba(30,8,6,0)');g.fillStyle=gr;g.fillRect(0,0,128,128)}return new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,roughness:.25,polygonOffset:true,polygonOffsetFactor:-2})});
const stain=(x,z,s,k)=>mAdd(PLN,STX[k],x,.012,z,-Math.PI/2,0,rs()*6,s,s,s);
function cable(p){const cu=new THREE.CatmullRomCurve3(p.map(a=>new THREE.Vector3(a[0],a[1],a[2])));mAdd(new THREE.TubeGeometry(cu,10,.022,5,false),M.dark,0,0,0)}
function win(x){const y=1.75,mk=(mat,z,w)=>{const m=new THREE.Mesh(PLN,mat);m.scale.set(1.5,1.1,1);m.position.set(x,y+YO,z);sc.add(m)};mk(NIGHT,4.02);mk(RAINM,4.04);mk(M.glass,4.06);
 bB(M.metal,1.7,.08,.12,x,y+.6,4.1);bB(M.metal,1.7,.08,.12,x,y-.6,4.1);bB(M.metal,.08,1.2,.12,x-.82,y,4.1);bB(M.metal,.08,1.2,.12,x+.82,y,4.1);bB(M.metal,.05,1.1,.1,x,y,4.1);bB(M.metal,1.5,.05,.1,x,y,4.1);
 if(rs()<.4){bB(M.wood,1.7,.16,.05,x,y+.1,4.14,.08);bB(M.wood,1.7,.16,.05,x,y-.25,4.14,-.06)}
 const sh=new THREE.Mesh(PLN,new THREE.MeshBasicMaterial({map:GRAD,color:0x6f8fc0,transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));sh.scale.set(1.4,4.5,1);sh.position.set(x,1.2+YO,6.2);sh.rotation.x=-.75;sc.add(sh);mAdd(PLN,M.moon,x,.02,8,-Math.PI/2,0,0,1.5,2.4,1)}
function dress(){const TX=[10,26,42,58,74];
 [18,30].forEach(z=>TX.forEach(cx=>{bB(WALLM,3.9,.55,.45,cx,2.92,z);[-1.95,1.95].forEach(o=>bB(M.metal,.2,3.2,.5,cx+o,1.6,z));bB(M.ledG,.5,.14,.04,cx,2.5,z+.26);bB(M.ledG,.5,.14,.04,cx,2.5,z-.26)}));
 TX.forEach(cx=>[cx-3.2,cx+3.2].forEach(x=>{if([10,14,42,62.5].some(f=>Math.abs(f-x)<2))return;win(x)}));
 [18,34,50,66].forEach(x=>lockers(x,27.72,0,3));[34,66].forEach(x=>lockers(x,20.28,Math.PI,2));
 [14,30,46,62].forEach(x=>{bB(M.metal,.5,.7,.15,x,1.5,20.08);bB(M.ledR,.04,.04,.02,x+.15,1.7,20.17);cable([[x,1.2,20.2],[x+.2,.6,20.4],[x+.1,.03,20.9]])});
 [22,38,54,70].forEach(x=>{bC(M.ext,.08,.4,x,1.15,20.15);bC(M.dark,.04,.1,x,1.4,20.15)});
 for(let x=6;x<76;x+=8)cable([[x,2.75,20.3],[x+4,2.55,20.3],[x+8,2.75,20.3]]);for(let i=0;i<8;i++){const x=8+i*9+rs()*3;cable([[x,3.2,22+rs()*4],[x+.2,2.4,22.1+rs()*4],[x+.1,1.8,22.2+rs()*4]])}
 poster(0,22,1.7,20.05,0);poster(1,55,1.7,20.05,0);poster(2,40,1.7,27.95,Math.PI);poster(0,70,1.7,27.95,Math.PI);poster(2,4.05,1.7,24,Math.PI/2);
 crate(5.4,26.6,.9,.2);crate(5.5,26.5,.7,.5,.9);bag(5.5,21);bag(6.2,21.4);barrel(70.4,21.6);barrel(69.6,22.4);bC(M.rust,.3,.9,78,.3,26.5,Math.PI/2,.7,0);
 // Security
 desk(6.4,5.4,Math.PI,true);chair(6.4,7.2,.4);bB(M.metal,.55,1.3,.6,15.5,.65,8.5);bB(M.dark,.4,.03,.02,15.2,.9,8.5);bB(M.metal,.55,1.3,.6,15.5,.65,9.2);poster(1,15.9,1.6,6.5,-Math.PI/2);
 // Storage
 shelf(20.6,6,-Math.PI/2,2.4);shelf(20.6,9.5,-Math.PI/2,2.4);crate(31,5.5,.9,.2);crate(31,5.5,.7,.5,.9);crate(30.8,7.4,.8,.1);barrel(30.5,9.8);barrel(29.6,10.4);bag(24,6);bag(24.6,6.6);
 // Generator
 genr(46.5,6.2,Math.PI);bB(M.hazard,3,.02,.35,42,.012,8);barrel(37.5,5.8);barrel(38.6,6.4);bC(M.rust,.3,.9,38,.3,8.2,Math.PI/2,.5,0);bC(M.metal,.07,3.2,39.6,1.6,4.5);bC(M.metal,.07,3.2,40,1.6,4.5);stain(41,8.5,2.2,0);
 // Laboratory
 bench(54.8,8.2,0);bench(58.4,10.9,0);shelf(52.6,6.5,-Math.PI/2,2.2,.9);chair(55.5,10.2,.8);chair(57.4,8.9,2.2);poster(0,58,1.7,4.05,0);stain(56,8,1.5,2);
 // Break room
 table(72.5,7,0);chair(71.4,8.1,.3);chair(73.6,8.2,2.8);chair(72.6,5.8,3.3);vend(79.3,9,Math.PI/2);couch(70,5.2,Math.PI);bag(78,12.5);bag(77.4,13);poster(2,74,1.7,4.05,0);
 // Maintenance
 bench(7,42.8,0);shelf(11.5,43.5,0,2.4);barrel(14.5,42);barrel(15.2,40.9);bC(M.rust,.08,3,15.5,1.5,36);bC(M.rust,.12,.03,15.5,1.2,36.1,Math.PI/2,0,0);bC(M.rust,.07,3,13.5,1.5,36.2);poster(0,6,1.7,43.95,Math.PI);
 // Server room
 [21.5,23.6,25.7,27.8,29.9].forEach(x=>rack(x,43.3,0));bB(M.metal,10,.1,.5,26,2.7,42.6);chair(30,40,.5);cable([[22,2.7,42.4],[24,2.1,40],[27,.03,39]]);poster(2,20.05,1.7,40,Math.PI/2);
 // Medical
 bed(37.5,42,0,true);bed(41,42,0);bed(44.5,42,0,true);[39.3,42.8].forEach(x=>{bC(M.metal,.02,1.8,x,.9,40.5);bS(M.glass,.1,.15,.1,x,1.7,40.5)});bB(M.metal,.8,1.8,.5,46.8,.9,36.2);mAdd(PLN,M.fabric,39.2,1.2,38.6,0,0,0,2.4,2,1);stain(37.5,42,1.8,2);stain(44.6,41,1.2,0);
 // Containment
 bars(52.6,57.2,36.8);bars(58.6,63.4,36.8);bB(M.metal,.8,.08,1.8,55,.4,40.5);chair(61,41,2.4);bB(M.dark,.05,.05,.35,60.7,.6,41);stain(55,40.5,2,0);stain(60,41,1,1);poster(2,52.05,1.7,41,Math.PI/2);
 // Exit wing
 crate(70,42.6,1,.3);crate(71.3,43,.8,.1);crate(70.3,42.6,.7,.5,1);lockers(79.6,41.6,Math.PI/2,2);bB(M.hazard,.5,.02,6,78.6,.012,38);stain(76,38,1.6,1);
 for(let i=0;i<10;i++)stain(6+rs()*72,rs()<.5?21+rs()*6:(rs()<.5?8:40)+rs()*6,.8+rs()*1.6,rs()*3|0);
 for(let i=0;i<5;i++)mAdd(BX,M.plastic,8+rs()*68,2.95,22+rs()*4,.5,rs()*3,.3,.6,.03,.6);
 let n=0;for(let i=0;i<900&&n<260;i++){const x=4+rs()*76,z=4+rs()*40,c=Math.floor(x/CS),r=Math.floor(z/CS);if(MAP[r]&&MAP[r][c]=='#'||blocked(x,z,.2))continue;n++;const k=rs();if(k<.55)mAdd(BX,M.paper,x,.012,z,0,rs()*6,0,.22,.01,.3);else if(k<.8)mAdd(BX,M.dark,x,.04,z,rs(),rs()*6,rs(),.1,.08,.12);else if(k<.9)mAdd(CY,M.rust,x,.05,z,Math.PI/2,rs()*6,0,.04,.2,.04);else mAdd(SP,M.dark,x,.1,z,0,0,0,.25,.1,.2)}
 MONS.push(M.screen)}
function stairDoor(x,z,txt){bB(M.rust,.1,2.4,1.5,x,1.2,z);[-.85,.85].forEach(o=>bB(M.metal,.2,2.6,.15,x,1.3,z+o));bB(M.metal,.2,.15,1.9,x,2.6,z);bB(M.ledG,.06,.12,.4,x+(x>40?-.1:.1),2.45,z);label(txt,1.5,.35,x+(x>40?-.12:.12),2.95+YO,z,x>40?-Math.PI/2:Math.PI/2,'#4c4')}
function buildFloors(){[0,2].forEach(f=>{const mp=MAPS[f],yo=FLOORY[f];YO=yo;BF=f;const ws=[];mp.forEach((row,r)=>[...row].forEach((ch,c)=>{if(ch=='#')ws.push([c,r])}));
 const im=new THREE.InstancedMesh(new THREE.BoxGeometry(CS,H,CS),WALLM,ws.length),m4=new THREE.Matrix4();ws.forEach(([c,r],i)=>{m4.setPosition((c+.5)*CS,yo+H/2,(r+.5)*CS);im.setMatrixAt(i,m4);im.setColorAt(i,new THREE.Color().setScalar((f==0?.45:.7)+rnd()*.3))});im.castShadow=im.receiveShadow=true;sc.add(im);
 const fp=new THREE.Mesh(PLN,FLOORM);fp.scale.set(84,48,1);fp.rotation.x=-Math.PI/2;fp.position.set(42,yo+.01,24);fp.receiveShadow=true;sc.add(fp);const cp=new THREE.Mesh(PLN,CEILM);cp.scale.set(84,48,1);cp.rotation.x=Math.PI/2;cp.position.set(42,yo+H,24);sc.add(cp);
 (f==0?[[10,6],[30,6],[50,6],[70,6],[10,26],[26,26],[42,26],[58,26],[74,26],[18,16],[42,16],[66,16],[18,36],[42,36],[66,36]]:[[18,10],[46,10],[70,10],[18,38],[46,38],[70,38],[10,24],[30,24],[50,24],[70,24]]).forEach(([x,z])=>addLamp(x,z,f));
 const rc=f==0?[[18,16],[42,16],[66,16],[18,36],[42,36],[66,36]]:[[18,10],[46,10],[70,10],[18,38],[46,38],[70,38]];
 if(f==0){rc.forEach(([x,z],i)=>{const t=i<3;shelf(x,z+(t?-3:3),t?Math.PI:0,2.4,.7);barrel(x-3,z+(t?1.5:-1.5));barrel(x-2.2,z+(t?2.1:-2.1));crate(x+3,z+(t?1.2:-1.2),.9,rs());stain(x,z,2+rs()*1.5,rs()*3|0)});
  [5.5,25.3].forEach(z=>bC(M.rust,.1,80,42,H-.35,z,0,0,Math.PI/2));bC(M.metal,.12,H,8,H/2,24.4);bC(M.metal,.12,H,76,H/2,5);bC(M.rust,.3,.9,60,.3,26.2,Math.PI/2,.4,0);
  for(let x=7;x<76;x+=9)cable([[x,H-.1,26.5],[x+4.5,H-.7,26.5],[x+9,H-.1,26.5]]);for(let i=0;i<14;i++)stain(5+rs()*72,rs()<.5?6:26,.8+rs()*1.4,rs()*3|0);stairDoor(79.85,22,'STAIRS ▲ GROUND')}
 else{rc.forEach(([x,z],i)=>{const t=i<3;desk(x-4,t?5.4:42.6,t?Math.PI:0,true);chair(x-4,t?7.2:40.8,rs()*6);desk(x+4,t?5.4:42.6,t?Math.PI:0,true);chair(x+4.4,t?7.4:40.6,rs()*6);table(x,z+(t?2:-2),0);chair(x-1.2,z+(t?3.2:-3.2),rs()*6);chair(x+1,z+(t?.9:-.9),rs()*6);shelf(x,t?15.4:32.6,t?Math.PI:0,2.4,.8);stain(x+rs()*3,z,1+rs()*1.5,rs()*3|0)});
  [12,24,46,70].forEach(x=>win(x));couch(40,25,0);bag(70,22);poster(1,30,1.7,20.05,0);poster(0,60,1.7,27.95,Math.PI);stairDoor(4.15,26,'STAIRS ▼ GROUND');for(let i=0;i<70;i++)mAdd(BX,M.paper,6+rs()*70,.012,6+rs()*36,0,rs()*6,0,.22,.01,.3)}
 mBuild()});YO=0;BF=1;stairDoor(79.85,22,'STAIRS ▼ BASEMENT');stairDoor(4.15,26,'STAIRS ▲ OFFICES');mBuild()}
function mkDoors(){[18,30].forEach(z=>[10,26,42,58,74].forEach(cx=>[-1,1].forEach(s=>{const piv=new THREE.Group();piv.position.set(cx+s*1.95,0,z);const lf=new THREE.Mesh(BX,M.rust);lf.scale.set(1.9,2.7,.07);lf.position.set(-s*.95,1.35,0);lf.castShadow=true;piv.add(lf);const w=new THREE.Mesh(BX,M.dark);w.scale.set(.5,.35,.09);w.position.set(-s*.95,1.9,0);piv.add(w);const pl=new THREE.Mesh(BX,M.metal);pl.scale.set(1.9,.3,.09);pl.position.set(-s*.95,.2,0);piv.add(pl);sc.add(piv);DOORS.push({piv,s,cx,z,open:0,slam:0})})))}
const walls=[];MAP.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch=='#')walls.push([i,j])}));const wm=new THREE.InstancedMesh(new THREE.BoxGeometry(CS,H,CS),WALLM,walls.length),m4=new THREE.Matrix4();walls.forEach(([c,r],i)=>{m4.setPosition((c+.5)*CS,H/2,(r+.5)*CS);wm.setMatrixAt(i,m4)});walls.forEach((w,i)=>wm.setColorAt(i,new THREE.Color().setScalar(.7+rnd()*.4)));wm.castShadow=wm.receiveShadow=true;sc.add(wm);
const fl=new THREE.Mesh(new THREE.PlaneGeometry(84,48),FLOORM);fl.rotation.x=-Math.PI/2;fl.position.set(42,0,24);fl.receiveShadow=true;sc.add(fl);
const ce=new THREE.Mesh(new THREE.PlaneGeometry(84,48),CEILM);ce.rotation.x=Math.PI/2;ce.position.set(42,H,24);sc.add(ce);
const dyn=new THREE.Group(),props=PROPS[1],LP=[];sc.add(dyn);
function addLamp(x,z,f){f=f==null?1:f;const yo=FLOORY[f],m=new THREE.MeshBasicMaterial({color:0xdfeee6}),o=new THREE.Mesh(BX,m);o.scale.set(1.2,.05,.25);o.position.set(x,yo+H-.09,z);sc.add(o);mAdd(BX,M.metal,x,H-.04,z,0,0,0,1.5,.08,.4);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xcfe8dd,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));s.scale.set(3,3,1);s.position.set(x,yo+H-.4,z);sc.add(s);
 const cn=new THREE.Mesh(new THREE.ConeGeometry(1.4,3,14,1,true),new THREE.MeshBasicMaterial({map:GRAD,color:0xcfe8dd,transparent:true,opacity:.05,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));cn.position.set(x,yo+H-1.5,z);sc.add(cn);
 LP.push({x,z,f,m,s,cn,out:0,fl:0,v:0})}
[10,18,26,34,42,50,58,66,74].forEach(x=>addLamp(x,24));[10,26,42,58,74].forEach(x=>{addLamp(x,10);addLamp(x,38)});
const PL=[0,1,2,3].map(()=>{const l=new THREE.PointLight(0xdfeee6,0,16,2);sc.add(l);return l});
const FLS=new THREE.SpotLight(0xfff0d0,0,26,.5,.55,1.4);FLS.position.set(.15,-.1,0);cam.add(FLS);cam.add(FLS.target);FLS.target.position.set(0,0,-5);
function bx(w,h,d,x,y,z,m,solid){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m||propM);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;sc.add(o);if(solid)props.push([x-w/2,z-d/2,x+w/2,z+d/2]);return o}
function label(t,w,h,x,y,z,ry,col){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,256,64);g.fillStyle=col||'#d9d3c1';g.font='bold 30px sans-serif';g.textAlign='center';g.fillText(t,128,42);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));m.position.set(x,y,z);m.rotation.y=ry||0;sc.add(m);return m}
const NAMES=['101 Security','102 Storage','103 Generator','104 Laboratory','105 Break Room','201 Maintenance','202 Server Room','203 Medical','204 Containment','205 Exit Wing'];
function deco(){[10,26,42,58,74].forEach((x,i)=>{label(NAMES[i],1.8,.45,x,2.6,20.05,0);label(NAMES[5+i],1.8,.45,x,2.6,27.95,Math.PI);label('→ EXIT',1,.25,x+8,2.9,20.05,0,'#4c4')});
 [21,27].forEach(z=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,80,8),pipeM);p.rotation.z=Math.PI/2;p.position.set(42,H-.3,z);sc.add(p);PIPES.push(p)});
 const fb=bx(1.6,1.6,.4,42,1.5,4.3,MT(0x5a5f4c));fb.userData.n='fb';bx(1,1.2,.6,10,1.1,4.4,MT(0x223330)).material.emissive=new THREE.Color(0x44ffcc);label('FUSES',.8,.2,42,2.5,4.5);label('SECURITY',.9,.2,10,2.1,4.6);
 [34,42].forEach((z,i)=>{const s=bx(.4,1,.4,69,.9,z,MT(0x884422));s.material.emissive=new THREE.Color(0x884422);s.material.emissiveIntensity=.3;SWM.push(s)});label('HOLD BOTH',1.4,.3,69,2.4,38);
 EXM=bx(.3,2.2,1.6,79.7,1.1,38,MT(0x552222));EXM.material.emissive=new THREE.Color(0xaa2222);label('EMERGENCY EXIT',2,.4,79.5,2.8,38,-Math.PI/2);CHM=new THREE.MeshStandardMaterial({color:0x335544,emissive:0x44ff99,emissiveIntensity:.4,transparent:true,opacity:.5});const ch=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,2.3,14),CHM);ch.position.set(62.5,1.15,6);sc.add(ch);props.push([61.8,5.3,63.2,6.7]);CHS=bx(.35,1.9,.25,62.5,1.05,6,MT(0x040606));label('SUBJECT: ACTIVE',1.6,.4,62.5,2.9,4.1,0,'#6f6');const cm=bx(1,.7,.3,14,1.3,4.35,darkM);cm.material=new THREE.MeshStandardMaterial({color:0x111,emissive:0x44aa88,emissiveIntensity:.5});MONS.push(cm.material)}
const SWM=[],PIPES=[],MONS=[];let EXM,CHM,CHS,chamberDone=0,docJS=0,camIv=0;deco();dress();mBuild();mkDoors();buildFloors();

/* ---- floating dust (follows the camera, wraps around it) ---- */
const dpA=new Float32Array(450);for(let i=0;i<450;i++)dpA[i]=(Math.random()-.5)*14;const dustG=new THREE.BufferGeometry();dustG.setAttribute('position',new THREE.BufferAttribute(dpA,3));
const dust=new THREE.Points(dustG,new THREE.PointsMaterial({size:.05,color:0xcfd8d0,transparent:true,opacity:.35,depthWrite:false}));dust.frustumCulled=false;sc.add(dust);
function dustUpdate(dt){if(!dust.visible)return;const cx=cam.position.x,cy=cam.position.y,cz=cam.position.z;for(let i=0;i<450;i+=3){dpA[i+1]-=dt*.03;const c=[cx,cy,cz];for(let a=0;a<3;a++){if(dpA[i+a]-c[a]>7)dpA[i+a]-=14;else if(dpA[i+a]-c[a]<-7)dpA[i+a]+=14}}dustG.attributes.position.needsUpdate=true}
