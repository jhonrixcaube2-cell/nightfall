/* ===== Nightfall 2.0 client: game modes, roles, role-specific HUD, story text and results ===== */
const MODEINFO={
 story:{name:'Story',desc:'Cooperative chapters. Investigate the facility, uncover what happened to the night shift, and escape.',players:'1-6',diff:'Medium',rec:'2 to 4 players',min:1},
 monster:{name:'Monster',desc:'One player becomes the Monster and hunts the rest. Survivors restore the power and fight to escape.',players:'2-6',diff:'Hard',rec:'4 to 6 players',min:2},
 survival:{name:'Survival',desc:'Hold out for ten minutes while the building and the Watcher grow more dangerous every phase.',players:'1-6',diff:'Hard',rec:'2 to 6 players',min:1},
 infection:{name:'Infection',desc:'One infected player spreads the curse. The last survivors escape or outlast the clock.',players:'2-6',diff:'Medium',rec:'4 to 6 players',min:2}};
const ROLETXT={survivor:'Survivor',monster:'Monster',infected:'Infected',spectator:'Spectator'},ROLECD={monster:{rush:14,track:28,dark:32},infected:{rush:11,track:30}};
let myRole='survivor',curMode='story',selMode='story',roundSt='lobby',sayQ=[],sayBusy=0,tcrouch=false,tsprint=false,atkAnim=0;const joy={x:0,y:0};
const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
function openModes(){const g=$('mcards');g.innerHTML=Object.keys(MODEINFO).map(id=>{const m=MODEINFO[id];return`<div class="mcard art-${id}"><div class="mc-bg"></div><div class="mc-body"><h3>${m.name}</h3><p>${m.desc}</p><dl><dt>Players</dt><dd>${m.players}</dd><dt>Difficulty</dt><dd>${m.diff}</dd><dt>Recommended</dt><dd>${m.rec}</dd></dl><button data-id="${id}" class="pri">Select</button></div></div>`}).join('');
 g.querySelectorAll('button').forEach(b=>b.onclick=()=>{selMode=b.dataset.id;$('rmode').value=selMode;backTo='modes';view('create')});backTo='menu';view('modes')}
function buildAbil(){const A=$('abil');A.innerHTML='';if(myRole!='monster'&&myRole!='infected'){A.style.display='none';return}A.style.display='flex';
 const L=myRole=='monster'?[['1','Rush','rush'],['2','Track','track'],['3','Lights out','dark']]:[['1','Lunge','rush'],['2','Sense','track']];
 A.innerHTML=L.map(a=>`<div class="ab" data-k="${a[2]}"><i></i><b>${a[0]}</b><span>${a[1]}</span></div>`).join('')+'<div class="ab atk"><b>Click / Space</b><span>'+(myRole=='monster'?'Attack':'Infect')+'</span></div>'}
function showRole(m){myRole=m.role;document.body.classList.toggle('mvis',m.role=='monster'||m.role=='infected');const e=$('role');e.className='on r-'+m.role;$('rl1').textContent=m.text.toUpperCase();$('rl2').textContent=((MODEINFO[curMode]||{}).name||'')+' · '+ROLETXT[m.role];
 clearTimeout(showRole.t);showRole.t=setTimeout(()=>e.className='',m.role=='spectator'?2200:4200);buildAbil();S3(m.role=='monster'||m.role=='infected'?'screech':'chord')}
function hudUpdate(m){const sv=myRole=='survivor',inf=curMode=='infection';
 $('rolebar').innerHTML=`<b>${((MODEINFO[curMode]||{}).name||'').toUpperCase()}</b> · <span class="rr r-${myRole}">${ROLETXT[myRole]}</span>${m.tm>=0?` · <span class="tmr${m.tm<30?' low':''}">${fmt(m.tm)}</span>`:''}`;
 $('cnt').textContent=(curMode=='monster'||inf)?(inf?`Survivors ${m.sv} · Infected ${m.inf}`:`Survivors left ${m.sv}`):'';
 $('stam').style.display=sv?'':'none';$('stam').firstChild.style.width=me.stam+'%';$('stam').classList.toggle('exh',!!me.exh);
 $('slit').classList.toggle('on',!!me.hid);$('hpbox').style.display=sv?'flex':'none';$('fbox').style.display=sv?'block':'none';
 const A=$('abil');if(A.style.display!='none'){const mx=ROLECD[myRole]||{},cd={rush:me.cd[0],track:me.cd[1],dark:me.cd[2]};A.querySelectorAll('.ab[data-k]').forEach(b=>{const k=b.dataset.k,c=cd[k]||0;b.classList.toggle('rdy',c<=0);b.firstChild.style.height=(mx[k]?Math.min(100,c/mx[k]*100):0)+'%'});const at=A.querySelector('.atk');if(at)at.classList.toggle('rdy',me.cd[3]<=0)}
 const st=$('status');st.textContent=me.hid?'Hiding. Press E to leave. You cannot stay long.':me.down?(me.bleed?`You are down. Bleeding out in ${me.bleed}s`:'You are down'):myRole=='spectator'?'Spectating. You are out of the round.':(me.track>0?'Tracking: survivors revealed':'');}
function threatDist(){let d=99;if(mon.vis)d=Math.hypot(mon.x-P.x,mon.z-P.z)+30*Math.abs((mon.f||1)-P.f);if(myRole=='survivor')for(const id in AV){const v=AV[id];if(v.mdl&&v.t.on){const dd=Math.hypot(v.t.x-P.x,v.t.z-P.z)+30*Math.abs((v.t.f==null?1:v.t.f)-P.f);if(dd<d)d=dd}}return d}
function abil(k){if(myRole!='monster'&&myRole!='infected')return;if(k=='attack')atkAnim=.3;send({t:'abil',k})}
function storySay(lines,title){if(title)chapBanner(title);sayQ.push(...lines);if(!sayBusy)nextSay()}
function nextSay(){const l=sayQ.shift(),e=$('story');if(!l){sayBusy=0;e.className='';return}sayBusy=1;e.textContent=l;e.className='on';S3('blip');setTimeout(()=>{e.className='';setTimeout(nextSay,500)},Math.max(3200,l.length*55))}
function chapBanner(t,n){const e=$('chap');e.textContent=n?`CHAPTER ${n} · ${t}`:String(t).toUpperCase();e.classList.remove('show');void e.offsetWidth;e.classList.add('show')}
function showResults(m){const mp=m.players.find(p=>p.id==my)||{},team=mp.team=='spec'?'survivors':mp.team,won=m.winner==team,none=m.winner=='none';
 $('et').textContent=m.title;$('ex').textContent=m.text;$('end').classList.toggle('lose',none||!won);$('end').classList.toggle('win',won&&!none);
 const rows=m.players.map(p=>{const s=p.stat||{};return`<tr class="${p.id==my?'me':''}"><td><i style="background:${COL[p.i]}"></i>${esc(p.name)}</td><td>${ROLETXT[p.role]||p.role}</td><td>${p.alive?'Alive':p.role=='spectator'?'Out':'Down'}</td><td>${fmt(s.time||0)}</td><td>${s.obj||0}</td><td>${s.items||0}</td><td>${s.revives||0}</td><td>${s.hits||0}</td><td>${(s.infections||0)+(s.elims||0)}</td></tr>`}).join('');
 $('rstat').innerHTML=`<div class="rsum"><span>${(MODEINFO[m.mode]||{}).name||''}</span><span>Duration ${fmt(m.dur)}</span><span>Objectives ${m.obj.done}/${m.obj.total}</span></div><div class="rscroll"><table id="rtab"><tr><th>Player</th><th>Role</th><th>Status</th><th>Survived</th><th>Obj.</th><th>Items</th><th>Revives</th><th>Hits</th><th>Catches</th></tr>${rows}</table></div>`;
 const hs=my==hostId;$('bRt').style.display=hs?'':'none';$('bAg').style.display=hs?'':'none';$('hw').style.display=hs?'none':'';
 document.exitPointerLock&&document.exitPointerLock();chaseAudio(false);creditsOn=0;(won&&!none)?S3('ok'):(S3('sting'),S3('screech'));duckT=1.2;fade();
 setTimeout(()=>{inGame=false;$('hud').style.display='none';document.body.classList.remove('mvis');view('end')},450)}
