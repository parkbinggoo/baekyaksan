function poseAnimal(a,dt,speed,charging){
 const j=a.mesh.userData.anim;if(!j)return;
 const gaitTarget=j.bird?(a.kind.hab==='sky'?9.5:6.3):(1.4+Math.min(speed,5)*1.75);
 a.gaitRate=(a.gaitRate??gaitTarget)+(gaitTarget-(a.gaitRate??gaitTarget))*(1-Math.exp(-dt*5));
 a.step=(a.step||0)+dt*a.gaitRate;
 a.gaitAmp=(a.gaitAmp||0)+(Math.min(1,speed/3.5)-(a.gaitAmp||0))*(1-Math.exp(-dt*6));
 const cyc=Math.sin(a.step),amp=a.gaitAmp;
 j.rig.position.y=(j.bird||a.climbing?0:.028)*Math.abs(Math.sin(a.step))*amp;
 j.rig.rotation.z=j.bird?Math.sin(a.step*.5)*.035:0;
 if(j.bird){
   const fly=a.kind.hab==='sky'||a.kind.id==='owl'||a.kind.id==='eagleowl';
   for(const w of j.wings){w.pivot.rotation.z=w.side*(fly?(0.45+Math.sin(a.step)*.95):(.1+Math.sin(a.step*.55)*.08));
     w.pivot.rotation.x=fly?.2*Math.sin(a.step-.6):0}
   for(let i=0;i<j.legs.length;i++)j.legs[i].pivot.rotation.x=fly?-.35:cyc*(i?-.35:.35)*amp;
 }else{
   for(const leg of j.legs){const phase=(leg.side*(leg.front?1:-1)>0)?1:-1;
     leg.pivot.rotation.x=cyc*phase*(a.kind.id==='rabbit'?.62:.45)*amp;
     leg.pivot.rotation.z=charging?-.06*leg.side:0}
 }
 if(j.tail){j.tail.rotation.y=Math.sin(a.step*.55)*.16;j.tail.rotation.x=-.2+Math.sin(a.step*.6)*.09}
}
const BOAR_SUMMIT_FREE_ALT=2290;
function summitForbidsBoar(x,z){
  return z<SUMMIT_Z+215||H(x,z)*ALT_K>=BOAR_SUMMIT_FREE_ALT;
}
function refreshAnimals(){clearExpiredBoarZones();const near=new Set();const cx=Math.floor(P.x/CH),cz=Math.floor(P.z/CH);
 for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const x=cx+dx,z=cz+dz,id=x+','+z;const rr=rngOf((Math.imul(x,24173)^Math.imul(z,11369)^0x61ac)>>>0);
 for(let j=0;j<2;j++){let kind=WILDLIFE[Math.floor(rr()*WILDLIFE.length)],key=id+':animal'+j;
 if(kind.id==='boar'&&h2(x*37+j*13+1041,z*43-j*19-191)>.80)
   kind=WILDLIFE[h2(x*11+j*31+81,z*23-57)>.5?2:3]; // rabbit / water deer
 if(!animals.has(key)){let xx=x*CH+5+rr()*(CH-10),zz=z*CH+5+rr()*(CH-10);
   if(kind.id==='boar'&&(isBoarFreeArea(xx,zz)||summitForbidsBoar(xx,zz)))continue;
   const c=chunks.get(id);
 let homeTree=null;
 if(kind.hab==='tree'&&c&&c.trees.length){homeTree=c.trees[Math.floor(rr()*c.trees.length)];
   if(kind.id==='squirrel'||kind.id==='redsquirrel'){
     const a=rr()*Math.PI*2,radius=Math.max(.4,homeTree.s*.4+.24);
     xx=homeTree.x+Math.cos(a)*radius;zz=homeTree.z+Math.sin(a)*radius;
   }else{xx=homeTree.x;zz=homeTree.z}}
 const mesh=createAnimal(kind);scene.add(mesh);
 const nameEl=document.createElement('div');nameEl.className='nametag';nameEl.textContent=kind.name;nameEl.style.display='none';$('labels').appendChild(nameEl);
 animals.set(key,{key,kind,mesh,nameEl,x:xx,z:zz,originX:xx,originZ:zz,phase:rr()*6.28,range:2+rr()*5,treeY:kind.hab==='tree'?2+rr()*5:0,
   homeTree,climbHeight:0,climbTarget:0,climbing:false})}
 near.add(key)}}
 for(const [id,a] of animals)if(!near.has(id))removeWildAnimal(id,a);
}
const FAINT_MS=3*60*1000;
let faintUntil=0,faintReason='';
try{faintUntil=Math.min(+(localStorage.getItem('baek_faint_until')||0),Date.now()+FAINT_MS)}catch(e){faintUntil=0}
function faintAnimal(spec){if(Date.now()<faintUntil)return;if(cooking){clearCampCookingProps(cooking.tent.camp);cooking=null;}closeCampPanel();climbing=null;onRock=null;$('climbPanel').classList.add('hide');const faintDuration=spec.durationMs||FAINT_MS;faintUntil=Date.now()+faintDuration;faintReason=spec.name;
 try{localStorage.setItem('baek_faint_until',String(faintUntil))}catch(e){}persist();
 target=null;pending=null;joy.x=0;joy.y=0;me.mode='faint';me.t=0;$('faintOverlay').classList.remove('hide');
 faintSoundVolume(faintDuration);
 sendPresence(true);sendAccidentRadio(!!spec.fall,!!spec.bees);
 $('faintOverlay').querySelector('small').textContent=spec.bees?'현실 시간 1분 동안 움직일 수 없습니다.':spec.fall?'현실 시간 2분 동안 움직일 수 없습니다.':'현실 시간 3분 동안 움직일 수 없습니다.';
 $('faintMessage').textContent=spec.bees?'벌집을 건드려 벌에 쏘였습니다. 잠시 쉬어야 합니다.':spec.fall?'바위에서 미끄러져 추락했습니다. 잠시 회복해야 합니다.':`${spec.name}의 공격을 받고 쓰러졌습니다. 잠시 회복해야 합니다.`;
}
function updFaint(){const left=faintUntil-Date.now();const overlay=$('faintOverlay');
 faintSoundVolume(left);
 if(left<=0){overlay.classList.add('hide');if(faintUntil){
    faintUntil=0;
    try{localStorage.removeItem('baek_faint_until')}catch(e){}
    const bees=faintReason==='벌 떼',rockFall=faintReason==='바위 추락';
    if(!bees&&!rockFall)disperseBoars(P.x,P.z,Date.now()+BOAR_WAKE_CLEAR_MS,true);
    persist();me.mode='idle';sendPresence(true);
    toast(bees?'벌에 쏘인 뒤 정신을 차렸다.':rockFall?'바위에서 추락한 뒤 정신을 차렸다.':'정신을 차렸다. 주변의 멧돼지는 숲속으로 달아났다.');
    faintReason='';
  }return false}
 overlay.classList.remove('hide');const secs=Math.ceil(left/1000);$('faintCountdown').textContent=`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;return true}
function nearestHiker(x,z){
 let best={x:P.x,z:P.z,dist:Math.hypot(P.x-x,P.z-z),moving:P.speed>.07&&me.mode==='walk',self:true};
 for(const o of others.values()){
   const d=Math.hypot(o.x-x,o.z-z);
   if(d<best.dist)best={x:o.x,z:o.z,dist:d,moving:o.mode==='walk',self:false};
 }
 return best;
}
function updateBoarWarning(){
  let close=false;
  if(!inTent&&Date.now()>=faintUntil){
    for(const a of animals.values()){
      if(a.kind.id!=='boar'||!a.mesh.visible)continue;
      const vertical=Math.abs(H(a.x,a.z)-P.y);
      if(vertical>3.5)continue;
      if(Math.hypot(a.x-P.x,a.z-P.z)<BOAR_SMELL_RANGE){close=true;break}
    }
  }
  const el=$('boarWarning');el.classList.toggle('hide',!close);
  if(close&&!boarAlertActive){toast('어디선가 고약한 냄새가 난다… 멧돼지를 조심하자!')}
  boarAlertActive=close;
}
// Lv.6~11 can sense five-star collectibles, but never their direction or exact position.
// Scan loaded, genuine collectibles (not scenery/decoys) at a low rate on phones.
// Show a rare-plant hint only once when entering a 20m zone.
// Leave the zone entirely to re-arm the hint; do not keep it on-screen.
let rareSenseTime=0,rareSenseInside=false,rareSensePending=false,rareSenseUntil=0;
function updateRareSense(dt){
  const el=$('rareSense');
  if(mode!=='game'||inTent||playerRank<6||Date.now()<faintUntil){
    el.classList.add('hide');rareSenseTime=0;rareSenseUntil=0;
    // Clear the pending hint outside gameplay without changing the game data.
    rareSenseInside=false;rareSensePending=false;return;
  }
  const now=performance.now();
  // Hide immediately when the short appearance has expired, even between scans.
  if(rareSenseUntil&&now>=rareSenseUntil){rareSenseUntil=0;el.classList.add('hide')}
  rareSenseTime-=dt;
  if(rareSenseTime>0){
    // Dangerous boars always take visual priority over this hint.
    if(!$('boarWarning').classList.contains('hide'))el.classList.add('hide');
    return;
  }
  rareSenseTime=.25;
  let near=false;
  for(const c of chunks.values()){
    if(near)break;
    for(const it of c.items){
      if(!it.mesh||!it.mesh.parent||!it.mesh.visible||itemInfo(it.type)?.rar!==5||takenUntil(it.id))continue;
      const pos=it.mesh.position;
      if(Math.abs(pos.y-P.y)>6)continue;
      if(Math.hypot(pos.x-P.x,pos.z-P.z)<=20){near=true;break}
    }
  }
  if(!near){
    // Moving beyond the 20m boundary is the only way to arm a new notification.
    rareSenseInside=false;rareSensePending=false;rareSenseUntil=0;el.classList.add('hide');return;
  }
  if(!rareSenseInside){rareSenseInside=true;rareSensePending=true}
  const boarNearby=!$('boarWarning').classList.contains('hide');
  // Once interrupted by a danger warning, do not replay this rare hint.
  if(boarNearby&&rareSenseUntil){rareSenseUntil=0;el.classList.add('hide')}
  if(rareSensePending&&!boarNearby){
    rareSensePending=false;rareSenseUntil=now+3000;
  }
  el.classList.toggle('hide',boarNearby||rareSenseUntil<=now);
}
