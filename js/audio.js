/* ---- audio ---- */
let AC,MG,NB,BM,BS,BA,BV,LY={},duckT=0;function initAudio(){if(AC)return;try{AC=new AudioContext()}catch(e){return}MG=AC.createGain();MG.connect(AC.destination);BM=AC.createGain();BS=AC.createGain();BA=AC.createGain();BV=AC.createGain();[BM,BS,BA,BV].forEach(b=>b.connect(MG));applyVol();NB=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=rnd()*2-1;
 [48,50.2].forEach(f=>{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;g.gain.value=.07;o.connect(g).connect(BA);o.start()});ambientBed()}
function applyVol(){if(!AC)return;const mu=cfg.mute||{};MG.gain.value=mu.master?0:cfg.vol;BM.gain.value=mu.music?0:cfg.music;BS.gain.value=mu.sfx?0:cfg.sfx;BA.gain.value=mu.amb?0:cfg.amb;BV.gain.value=mu.voice?0:cfg.voice}
function out(p,bus){bus=bus||BS;if(!p)return bus;const n=AC.createPanner();n.panningModel='HRTF';n.refDistance=2;n.rolloffFactor=1.4;const py=p.y!=null?p.y:cam.position.y-.3;n.positionX.value=p.x;n.positionY.value=py;n.positionZ.value=p.z;let last=n;if(Math.abs(py-cam.position.y)>2.2){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.connect(n);last=f}n.connect(bus);return last}
function musicInit(){const mk=(type,f,det)=>{const o=AC.createOscillator();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;o.start();return o},L=(name,nodes,filt)=>{const g=AC.createGain();g.gain.value=0;let last=g;if(filt){const b=AC.createBiquadFilter();b.type='lowpass';b.frequency.value=filt;g.connect(b);last=b}nodes.forEach(n=>n.connect(g));last.connect(BM);LY[name]=g};
 L('drone',[mk('sine',55),mk('sine',55.4)]);L('susp',[mk('sine',110),mk('sine',130.8),mk('triangle',82.4,6)],900);L('mon',[mk('sawtooth',41),mk('sawtooth',43.2),mk('square',233,-20)],500);L('chase',[mk('sawtooth',55),mk('sawtooth',82.4,15),mk('square',110)],1400);L('credits',[mk('sine',65.4),mk('sine',98),mk('triangle',130.8,5),mk('sine',196)],700)}
let MSTATE='calm';
function musicState(){if(!inGame)return creditsOn?'escape':'calm';if(chase)return'chase';if(G.exit)return'escape';if(me.down||me.hp<40)return'critical';if(hbL>.55)return'threat';if(hbL>.2||G.stage>=2)return'uneasy';return'calm'}
const MTG={calm:{drone:.1,susp:0,mon:0,chase:0,credits:0},uneasy:{drone:.12,susp:.14,mon:0,chase:0,credits:0},threat:{drone:.12,susp:.18,mon:.2,chase:0,credits:0},chase:{drone:.06,susp:.05,mon:.1,chase:.24,credits:0},critical:{drone:.1,susp:.2,mon:.16,chase:.08,credits:0},escape:{drone:.05,susp:0,mon:0,chase:0,credits:0}};
function musicUpdate(dt){if(!AC||!LY.drone)return;const k=AC.currentTime,s=musicState();if(s!=MSTATE){MSTATE=s;if(s=='chase')S3('sting')}
 const T=Object.assign({},MTG[s]);if(creditsOn)T.credits=.16;for(const n in T)LY[n].gain.setTargetAtTime(T[n],k,n=='chase'?.4:1.6);
 duckT=Math.max(0,duckT-dt);BA.gain.setTargetAtTime((cfg.mute&&cfg.mute.amb?0:cfg.amb)*(duckT>0?0:1),k,.12)}
function T(f,d,ty,v,o,f2){const t=AC.currentTime,os=AC.createOscillator(),g=AC.createGain();os.type=ty||'sine';os.frequency.setValueAtTime(f,t);if(f2)os.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);os.connect(g).connect(o);os.start(t);os.stop(t+d+.05)}
function N(d,f,v,o,ty){const t=AC.currentTime,s=AC.createBufferSource();s.buffer=NB;const b=AC.createBiquadFilter();b.type=ty||'bandpass';b.frequency.value=f;const g=AC.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b).connect(g).connect(o);s.start(t,rnd(),d+.05)}
function S3(n,p,v,sf){if(!AC||AC.state!='running')return;v=v==null?1:v;const VC={breath:1,whisperd:1,wail:1,call:1,screech:1,growl:1},o=out(p,VC[n]?BV:BS);switch(n){
case'step':{const S={concrete:()=>N(.09,180,.8*v,o),wood:()=>{N(.12,320,.7*v,o);T(110,.1,'triangle',.25*v,o)},metal:()=>{N(.1,900,.5*v,o);T(480,.12,'triangle',.18*v,o)},wet:()=>{N(.14,420,.8*v,o,'lowpass');N(.06,2600,.25*v,o)}};(S[sf]||S.concrete)();break}
case'wstep':N(.18,90,1.4,o);T(55,.2,'sine',.8,o);break;case'door':T(80,1.2,'sawtooth',.1,o,150);break;case'clang':[523,811,1330].forEach((f,i)=>T(f,1.8,'sine',.25/(i+1),o));break;
case'phone':for(let i=0;i<4;i++)setTimeout(()=>{if(AC){T(900,.12,'square',.07,o);T(1100,.12,'square',.07,o)}},i*180);break;case'radio':N(1.6,2500,.35,o,'highpass');break;case'alarm':T(520,1.2,'square',.07,o,780);break;
case'growl':T(70,1.6,'sawtooth',.4,o,32);N(1.4,300,.5,o);break;case'beat':T(55,.22,'sine',1.2*v,BM);setTimeout(()=>AC&&T(48,.2,'sine',.9*v,BM),230);break;
case'blip':T(700,.1,'triangle',.2,BS);break;case'ui':T(520,.06,'triangle',.12,BS,780);break;case'ok':T(440,.12,'sine',.2,BS);setTimeout(()=>AC&&T(660,.2,'sine',.2,BS),130);break;case'power':T(40,2,'sawtooth',.4,BS,160);break;
case'sting':[311,330,466,1480].forEach(f=>T(f*(1+rnd()*.02),.9,'sawtooth',.2,BS,f*.5));N(.8,2200,.9,BS);T(40,1.2,'sine',1.4,BS,25);break;
case'screech':T(900,.6,'sawtooth',.3,o,300);T(1350,.5,'square',.1,o,500);N(.5,2800,.6,o);break;
case'glitch':for(let i=0;i<5;i++)setTimeout(()=>AC&&N(.06,400+rnd()*4000,.8,BS,'highpass'),i*45);break;
case'breath':N(.9,500,.35,o);setTimeout(()=>AC&&N(1,380,.3,o),1000);break;case'click':for(let i=0;i<5;i++)setTimeout(()=>AC&&T(2600+rnd()*600,.02,'square',.15,o),i*70+rnd()*30);break;
case'scrape':N(1.4,900,.4,o);T(180,1.4,'sawtooth',.05,o,90);break;case'wail':T(500,2.2,'sawtooth',.12,o,1100);T(530,2.2,'sawtooth',.1,o,1180);break;case'call':T(150,2,'sawtooth',.12,o,95);T(158,2,'sawtooth',.1,o,100);break;
case'pulse':T(55,.4,'sawtooth',.2,BM);setTimeout(()=>AC&&T(233,.15,'square',.05,BM),240);break;case'boom':T(45,1.5,'sine',1.2,o,20);N(.5,100,1,o);break;
case'whisperd':for(let i=0;i<5;i++)setTimeout(()=>AC&&N(.4,900+rnd()*2500,.3,o),i*300);T(150,1.5,'square',.04,o,110);break;
case'drip':T(2400,.05,'sine',.12,o,1800);setTimeout(()=>AC&&T(2200,.04,'sine',.06,o,1600),160);break;case'creak':T(70,1.6,'sawtooth',.06,o,110);N(1.4,600,.05,o);break;case'pipe':T(300,.5,'triangle',.15,o,260);N(.2,1500,.3,o);break;
case'buzz':T(100,.7,'sawtooth',.05,o);T(121,.7,'square',.015,o);N(.8,1400,.04,o,'highpass');break;
case'thunder':N(2.6,80,1.1,o,'lowpass');T(38,2.6,'sine',.8,o,22);break;
case'vent':N(3,600,.06,o);break;
case'machine':T(60,2,'sawtooth',.04,o,58);T(61.5,2,'sawtooth',.03,o,59);break;
case'floorcreak':T(120,.5,'triangle',.07,o,90);N(.3,300,.05,o);break;
case'distantstep':N(.12,160,.2,o,'lowpass');break}}
