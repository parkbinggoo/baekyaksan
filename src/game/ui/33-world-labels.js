/* screen-space labels */
const labels=[];
function worldLabel(pos,html,cls,life){const el=document.createElement('div');el.className='wl '+(cls||'');el.textContent=html;$('labels').appendChild(el);labels.push({el,pos:new THREE.Vector3(pos.x,pos.y+1.1,pos.z),t:0,life});}
function pip(pos,h,n){worldLabel(pos,'●'.repeat(h)+'○'.repeat(Math.max(0,n-h)),'pip',.9)}
function floatMsg(pos,txt){worldLabel(pos,txt,'msg',1.4)}
function updLabels(dt){for(let i=labels.length-1;i>=0;i--){const l=labels[i];l.t+=dt;v3.copy(l.pos);v3.y+=l.t*.6;v3.project(camera);
  if(v3.z>1||l.t>l.life){if(l.t>l.life){l.el.remove();labels.splice(i,1);continue}l.el.style.display='none';continue}
  l.el.style.display='';l.el.style.transform=`translate(${(v3.x*.5+.5)*W}px,${(-v3.y*.5+.5)*Hh}px) translate(-50%,-100%)`;l.el.style.opacity=clamp(1-(l.t/l.life-.6)/.4,0,1)}}
