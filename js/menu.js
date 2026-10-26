/* ===== Cinematic night exterior: backdrop for menu, lobby, loading and game-over screens ===== */
const MS=new THREE.Scene(),MC=new THREE.PerspectiveCamera(58,1,.1,420);
let mLamp,mPorch,mWin,mBeacon,mRain,mHemi,m2,mCyc=0;
(function buildNight(){
 MS.background=new THREE.Color(0x060810);MS.fog=new THREE.FogExp2(0x0a1019,.012);
 const moon=new THREE.Mesh(new THREE.SphereGeometry(7,24,16),new THREE.MeshBasicMaterial({color:0xe6edf8,fog:false}));moon.position.set(70,85,-200);MS.add(moon);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0x6f8fd0,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));halo.scale.set(110,110,1);halo.position.copy(moon.position);MS.add(halo);
 mHemi=new THREE.HemisphereLight(0x3b5380,0x0a0c0f,.7);MS.add(mHemi);const dl=new THREE.DirectionalLight(0x86a3d6,.8);dl.position.set(50,80,-80);MS.add(dl);
 const gc=cv(128),gg=gc.getContext('2d');gg.fillStyle='#1b2119';gg.fillRect(0,0,128,128);R2(gg,900,128,'rgba(60,70,50,A)',.5,3,3);R2(gg,300,128,'rgba(8,8,6,A)',.6,7,7);
 const gT=new THREE.CanvasTexture(gc);gT.wrapS=gT.wrapT=THREE.RepeatWrapping;gT.repeat.set(70,70);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshStandardMaterial({map:gT,roughness:.4,metalness:.15}));ground.rotation.x=-Math.PI/2;MS.add(ground);
 const path=new THREE.Mesh(new THREE.PlaneGeometry(5,60),new THREE.MeshStandardMaterial({color:0x4a4034,roughness:.35}));path.rotation.x=-Math.PI/2;path.position.set(0,.03,-8);MS.add(path);
 const wall=new THREE.MeshStandardMaterial({map:WALLM.map,color:0x8a8e88,roughness:.95}),roofM=new THREE.MeshStandardMaterial({color:0x15171a,roughness:.9});
 [[34,9,14,0,-32],[14,6,12,-28,-28],[12,7,10,26,-27]].forEach(([w,h,d,x,z])=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wall);b.position.set(x,h/2,z);MS.add(b);const r=new THREE.Mesh(new THREE.BoxGeometry(w+1,.7,d+1),roofM);r.position.set(x,h+.35,z);MS.add(r)});
 const Wd=[];for(let i=0;i<10;i++)for(let r=0;r<2;r++)Wd.push([-14.4+i*3.2,2.8+r*3.6,-24.95]);for(let i=0;i<4;i++)Wd.push([-33+i*3.4,2.6,-21.95]);for(let i=0;i<3;i++)Wd.push([21+i*3.4,3,-21.95]);
 mWin=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.5,2),new THREE.MeshBasicMaterial({color:0xffffff}),Wd.length);const m4=new THREE.Matrix4();
 Wd.forEach((w,i)=>{m4.setPosition(w[0],w[1],w[2]);mWin.setMatrixAt(i,m4);mWin.setColorAt(i,new THREE.Color(rnd()<.6?0x0c0d10:rnd()<.5?0xffc060:0xff8a30))});MS.add(mWin);
 const door=new THREE.Mesh(new THREE.BoxGeometry(2.4,2.6,.2),new THREE.MeshBasicMaterial({color:0x6a4a22}));door.position.set(0,1.3,-24.9);MS.add(door);
 mPorch=new THREE.PointLight(0xffb060,1.4,30,2);mPorch.position.set(0,3.4,-22.5);MS.add(mPorch);
 // water tower with blinking beacon
 const tw=new THREE.Group(),mt=new THREE.MeshStandardMaterial({color:0x2a2c2d,roughness:.7,metalness:.4});
 [[-3,-3],[3,-3],[-3,3],[3,3]].forEach(([x,z])=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,16,6),mt);l.position.set(x,8,z);tw.add(l)});
 const tk=new THREE.Mesh(new THREE.CylinderGeometry(5,5,6,14),mt);tk.position.y=19;tw.add(tk);const tr=new THREE.Mesh(new THREE.ConeGeometry(5.4,3,14),mt);tr.position.y=23.5;tw.add(tr);tw.position.set(-58,0,-52);MS.add(tw);
 mBeacon=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xff2a2a,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));mBeacon.scale.set(9,9,1);mBeacon.position.set(-58,26,-52);MS.add(mBeacon);
 // lamp post
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,6,6),mt);pole.position.set(11,3,-12);MS.add(pole);
 mLamp=new THREE.PointLight(0xffd9a0,1.6,26,2);mLamp.position.set(11,6.2,-12);MS.add(mLamp);
 const lg=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffd9a0,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));lg.scale.set(7,7,1);lg.position.copy(mLamp.position);MS.add(lg);
 // fence
 const fence=new THREE.InstancedMesh(new THREE.BoxGeometry(.15,2.2,.15),mt,40),dm=new THREE.Object3D();for(let i=0;i<40;i++){dm.position.set(-40+i*2,1.1,-8);dm.updateMatrix();fence.setMatrixAt(i,dm.matrix)}MS.add(fence);
 const rail=new THREE.Mesh(new THREE.BoxGeometry(80,.08,.08),mt);rail.position.set(0,1.9,-8);MS.add(rail);const rail2=rail.clone();rail2.position.y=.9;MS.add(rail2);
 // forest
 const N=320,trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.35,.5,7,6),new THREE.MeshStandardMaterial({color:0x1a120c,roughness:1}),N),fol=new THREE.InstancedMesh(new THREE.ConeGeometry(3.4,10,7),new THREE.MeshStandardMaterial({color:0x0d1a12,roughness:1}),N*2);let k=0;
 for(let i=0;i<N;i++){let x,z;do{x=(rnd()-.5)*320;z=-210+rnd()*235}while((Math.abs(x)<52&&z>-50&&z<-6)||(Math.abs(x)<7&&z>-12)||(z>8&&Math.abs(x)<9));const s=.7+rnd()*.9;
  dm.position.set(x,3.5*s,z);dm.scale.set(s,s,s);dm.rotation.set(0,0,0);dm.updateMatrix();trunk.setMatrixAt(i,dm.matrix);
  dm.position.set(x,7*s+2*s,z);dm.updateMatrix();fol.setMatrixAt(k,dm.matrix);fol.setColorAt(k++,new THREE.Color().setScalar(.6+rnd()*.6));
  dm.position.set(x,7*s+5.5*s,z);dm.scale.set(s*.75,s*.75,s*.75);dm.updateMatrix();fol.setMatrixAt(k,dm.matrix);fol.setColorAt(k++,new THREE.Color().setScalar(.6+rnd()*.6))}
 MS.add(trunk);MS.add(fol);
 // drifting fog banks
 for(let i=0;i<7;i++){const f=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0x7f93a8,transparent:true,opacity:.1,depthWrite:false}));f.scale.set(70,16,1);f.position.set(-60+i*22,4+rnd()*3,-12-rnd()*30);f.userData.v=.4+rnd()*.6;MS.add(f)}
 // rain
 const rp=new Float32Array(900*6);for(let i=0;i<900;i++){const x=(rnd()-.5)*70,y=rnd()*30,z=-35+rnd()*65;rp.set([x,y,z,x-.1,y+.8,z],i*6)}
 const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rp,3));mRain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0x9ab4d8,transparent:true,opacity:.28}));mRain.frustumCulled=false;MS.add(mRain);
 // the Watcher, glimpsed between the trees
 m2=mkMon();MS.add(m2.g);m2.g.position.set(15,0,-9);m2.g.rotation.y=.2;m2.g.scale.setScalar(1);m2.eyes.opacity=1;m2.a=0;
})();
function menuUpdate(dt,t){const a=t*.00007;MC.position.set(Math.sin(a)*5,2.4+Math.sin(t*.0002)*.12,19+Math.cos(a*.8)*2);MC.lookAt(Math.sin(a*1.3)*3,5.5,-30);
 if(Math.abs(MC.aspect-cam.aspect)>.001){MC.aspect=cam.aspect;MC.updateProjectionMatrix()}
 const fl=.85+.15*Math.sin(t*.011)+(rnd()<.03?-.6:0);mLamp.intensity=1.6*Math.max(.1,fl);mPorch.intensity=1.4*(.9+.1*Math.sin(t*.003));mWin.material.color.setScalar(.85+.15*Math.sin(t*.002));
 mBeacon.material.opacity=.15+.85*Math.max(0,Math.sin(t*.004));mHemi.intensity=.7+flashT*1.2;
 const p=mRain.geometry.attributes.position.array;for(let i=0;i<p.length;i+=6){let y=p[i+1]-28*dt;if(y<0)y+=30;p[i+1]=y;p[i+4]=y+.8}mRain.geometry.attributes.position.needsUpdate=true;
 MS.children.forEach(o=>{if(o.isSprite&&o.userData.v){o.position.x+=o.userData.v*dt;if(o.position.x>70)o.position.x=-70}});
 mCyc+=dt;const ph=mCyc%24,show=ph>11&&ph<19;m2.a=clamp(m2.a+(show?.45:-1)*dt,0,1);m2.mats.forEach(x=>{x.transparent=true;x.opacity=m2.a});m2.g.visible=m2.a>0;m2.torso.rotation.x=.4+Math.sin(t*.002)*.02;m2.h.rotation.z=Math.sin(t*.0007)*.12+.2}
