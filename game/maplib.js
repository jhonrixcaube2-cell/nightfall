// Per-map helpers: collision, line of sight and cross-floor pathfinding.
module.exports=M=>{const CS=M.CS,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const solid=(f,x,z)=>{const c=Math.floor(x/CS),r=Math.floor(z/CS);return c<0||r<0||c>20||r>11||M.MAPS[f][r][c]=='#'};
 function los(f,ax,az,bx,bz){const n=Math.ceil(Math.hypot(bx-ax,bz-az)/.5);for(let i=1;i<n;i++){const t=i/n;if(solid(f,ax+(bx-ax)*t,az+(bz-az)*t))return false}return true}
 function bfs3(a,b){const k=n=>n[0]+','+n[1]+','+n[2],q=[a],prev={[k(a)]:null};
  while(q.length){const n=q.shift();if(k(n)==k(b))break;const[f,c,r]=n,nb=[];for(const[dc,dr]of[[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=r+dr;if(nc>=0&&nr>=0&&nc<21&&nr<12&&M.MAPS[f][nr][nc]!='#')nb.push([f,nc,nr])}
   M.LINKS.forEach(l=>{if(l[0]==f&&l[1]==c&&l[2]==r)nb.push([l[3],l[4],l[5]]);if(l[3]==f&&l[4]==c&&l[5]==r)nb.push([l[0],l[1],l[2]])});for(const m of nb)if(!(k(m)in prev)){prev[k(m)]=n;q.push(m)}}
  if(!(k(b)in prev))return[];const p=[];for(let cur=b;cur;cur=prev[k(cur)])p.unshift(cur);return p}
 const cellOf=o=>[o.f,clamp(Math.floor(o.x/CS),0,20),clamp(Math.floor(o.z/CS),0,11)];
 return{solid,los,bfs3,cellOf}};
