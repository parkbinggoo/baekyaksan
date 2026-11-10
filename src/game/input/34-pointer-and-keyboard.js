/* ---------- input ---------- */
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.code==='Space'&&mode==='game'){e.preventDefault();climbAct();}
  if(e.code==='Escape'){$('bag').classList.add('hide')}
  if(mode==='intro'&&introT>.3&&introT<4)introT=4.05;
  if(mode==='game')hideHint()});
addEventListener('keyup',e=>{keys[e.code]=false});
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
let ptr=null;
canvas.addEventListener('pointerdown',e=>{if(mode==='intro'){if(introT<4)introT=4.05;return}ac();ptr={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),drag:false};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!ptr||ptr.id!==e.pointerId)return;const dx=e.clientX-ptr.x,dy=e.clientY-ptr.y;
  if(!ptr.drag&&Math.hypot(e.clientX-ptr.sx,e.clientY-ptr.sy)>7)ptr.drag=true;
  if(ptr.drag){camYaw-=dx*.006;camPitch=clamp(camPitch+dy*.004,.05,1.1);lastDrag=clock}ptr.x=e.clientX;ptr.y=e.clientY});
canvas.addEventListener('pointerup',e=>{if(!ptr||ptr.id!==e.pointerId)return;const wasDrag=ptr.drag;ptr=null;if(wasDrag||mode!=='game')return;clickAt(e.clientX,e.clientY)});
canvas.addEventListener('wheel',e=>{camDist=clamp(camDist+e.deltaY*.005,4,15);e.preventDefault()},{passive:false});
function clickAt(sx,sy){if(inSecretCave||Date.now()<faintUntil||inTent||cooking)return;
  ndc.set(sx/W*2-1,-(sy/Hh)*2+1);ray.setFromCamera(ndc,camera);
  const objs=[];for(const c of chunks.values()){for(const it of c.items)if(it.mesh)objs.push(it.mesh);objs.push(...c.treeMeshes,c.ground)}
  for(const t of tents){if(t.mesh.visible)objs.push(t.mesh);if(t.camp?.group.visible)objs.push(t.camp.group)}
  if(typeof goldenHoeMesh!=='undefined'&&goldenHoeMesh&&goldenHoeMesh.visible)objs.push(goldenHoeMesh);
  const hits=ray.intersectObjects(objs,true);
  for(const h of hits){let o=h.object;while(o&&!o.userData.item&&!o.userData.tent&&!o.userData.campfire&&!o.userData.goldenHoe)o=o.parent;if(o?.userData.goldenHoe){interactGoldenHoe();hideHint();return;}if(o?.userData.campfire){showCampPanel(o.userData.campfire);hideHint();return;}if(o&&o.userData.tent){const t=o.userData.tent, pos=t.mesh.position.clone(); if(nearTo(pos,3.1)) openTent(t); else{target={x:pos.x,z:pos.z,stop:2.4}; pending={kind:'tent',tent:t,pos};} hideHint(); return;} if(o&&o.userData.item){const it=o.userData.item;act({kind:it.kind,item:it,pos:it.mesh.position.clone()});hideHint();return}}
  // If the tap narrowly misses a small collectible, check its projected
  // silhouette before treating the tap as terrain or an ordinary tree.
  // Real ray hits on items, tents and campfires always take priority.
  const assisted=findForageTapAssist(sx,sy,hits);
  if(assisted){act({kind:assisted.kind,item:assisted,pos:assisted.mesh.position.clone()});hideHint();return}
  for(const h of hits){let o=h.object;while(o&&!o.userData.item&&!o.userData.tent&&!o.userData.trees&&!o.userData.terrain)o=o.parent;if(!o)continue;
    if(o.userData.tent){const t=o.userData.tent,pos=t.mesh.position.clone(); if(nearTo(pos,3.1)) openTent(t); else{target={x:pos.x,z:pos.z,stop:2.4}; pending={kind:'tent',tent:t,pos};} hideHint(); return}
    if(o.userData.item){const it=o.userData.item;act({kind:it.kind,item:it,pos:it.mesh.position.clone()});hideHint();return}
    if(o.userData.trees){const t=o.userData.trees[h.instanceId];if(!t)continue;
      for(const c of chunks.values())for(const it of c.items)if(it.tree===t&&it.mesh){act({kind:'mush',item:it,pos:it.mesh.position.clone()});return}
      act({kind:'tree',tree:t,pos:new THREE.Vector3(t.x,t.y+1.2,t.z)});hideHint();return}
    if(o.userData.terrain){const p=h.point;if(nearTo(p,1.9))act({kind:'ground',pos:p.clone()});else{target={x:p.x,z:Math.max(SUMMIT_Z+2,p.z),stop:.35};pending=null}hideHint();return}
  }
}
const joy={x:0,y:0,id:null};
{const pad=$('joy'),knob=$('knob');
  const set=(e)=>{const r=pad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=(e.clientX-cx)/(r.width/2),dy=(e.clientY-cy)/(r.height/2);const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}joy.x=dx;joy.y=dy;knob.style.transform=`translate(${dx*34}px,${dy*34}px)`};
  pad.addEventListener('pointerdown',e=>{joy.id=e.pointerId;pad.setPointerCapture(e.pointerId);set(e);hideHint();ac()});
  pad.addEventListener('pointermove',e=>{if(joy.id===e.pointerId)set(e)});
  const end=e=>{if(joy.id!==e.pointerId)return;joy.id=null;joy.x=joy.y=0;knob.style.transform=''};pad.addEventListener('pointerup',end);pad.addEventListener('pointercancel',end)}
function hideHint(){}
/* ---------- sky by altitude ---------- */
