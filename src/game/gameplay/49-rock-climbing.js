/* ======= BIG BOULDER CLIMBING =======
   Rocks are deterministic chunk geometry. One beat is 1.65 real seconds;
   five correctly timed presses raise the hiker gradually; a miss triggers
   the existing 3-minute faint system.
   Summit-side special rock: a golden hoe can be carefully excavated.
*/
let climbing=null,onRock=null;
// Walk on the actual top of the rock, not the terrain beneath it.
const rockFootRay=new THREE.Raycaster(),rockWalkLimit=.40;
const rockFootOrigin=new THREE.Vector3(),rockFootDown=new THREE.Vector3(0,-1,0);
function rockSurfaceY(rock,x,z){
  if(!rock||!rock.mesh||!rock.mesh.parent)return rock?rock.topY+.1:H(x,z);
  rock.mesh.updateWorldMatrix(true,false);
  rockFootOrigin.set(x,rock.mesh.position.y+rock.mesh.scale.y*3+3,z);
  rockFootRay.set(rockFootOrigin,rockFootDown);rockFootRay.near=0;rockFootRay.far=rock.r*7+6;
  const hit=rockFootRay.intersectObject(rock.mesh,false);
  return hit.length?hit[0].point.y+.08:rock.topY+.10;
}
let lastClimbRockCheck=0,cachedClimbRock=null;
const CLIMB_STEPS=5,CLIMB_BEAT_MS=1650;
const GOLDEN_HOE_REQUIRED_HITS=30,GOLDEN_HOE_GAP=1.05,GOLDEN_HOE_COOLDOWN_MS=24*60*60*1000;
// Exactly 30 regular-foraging-style circles. Split into two rows of 15 so
// the floating progress remains legible on narrow mobile screens.
function goldenHoePipRows(hits){
  const filled=Math.max(0,Math.min(GOLDEN_HOE_REQUIRED_HITS,Math.floor(hits)||0));
  const row=(start,count)=>'●'.repeat(Math.max(0,Math.min(count,filled-start)))+
    '○'.repeat(count-Math.max(0,Math.min(count,filled-start)));
  return row(0,15)+'\n'+row(15,15);
}

let goldenHoeRock=null,goldenHoeMesh=null,goldenHoeGlow=null,goldenHoeClaimFx=null,goldenHoeAttempt=null,goldenHoeHintedRock=null,goldenHoeFlashLight=null;
function goldenHoeBusy(){return !!goldenHoeClaimFx}
function goldenHoeCooldownLeft(now=Date.now()){return Math.max(0,(+save.goldenHoeCooldownUntil||0)-now)}
function formatGoldenHoeCooldown(ms){
  const mins=Math.ceil(ms/60000),hours=Math.floor(mins/60),rem=mins%60;
  return hours>0?`${hours}시간 ${rem}분`:`${mins}분`;
}
function chooseGoldenHoeRock(){
  for(const c of chunks.values())for(const rock of c.rocks||[]){
    if(rock.goldenHoeHost&&rock.mesh&&rock.mesh.parent&&rock.mesh.parent.parent===scene)return rock;
  }
  return null;
}
function ensureGoldenHoeRock(){
  if(goldenHoeRock?.mesh?.parent?.parent===scene)return goldenHoeRock;
  goldenHoeRock=chooseGoldenHoeRock();
  return goldenHoeRock;
}
function makeGoldenHoeRockMesh(){
  const g=new THREE.Group();g.userData.goldenHoe=1;
  const gold=(col,extra)=>new THREE.MeshToonMaterial(Object.assign({color:col,emissive:0x7a580e,emissiveIntensity:.55},extra||{}));
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.038,.044,.78,9),gold(0xd6ac3d));shaft.rotation.x=Math.PI/2;shaft.position.set(0,.44,-.02);g.add(shaft);
  const ferrule=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.18,6),gold(0xc89a2d));ferrule.rotation.x=.58;ferrule.position.set(0,.39,.29);g.add(ferrule);
  const blade=new THREE.Mesh(new THREE.ConeGeometry(.14,.26,3),gold(0xffdf76));blade.rotation.x=Math.PI;blade.scale.z=.34;blade.position.set(0,.29,.37);g.add(blade);
  const guard=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.05,8),gold(0xe7bf52));guard.position.set(0,.50,.11);g.add(guard);
  const stoneGrip=new THREE.Mesh(new THREE.CylinderGeometry(.06,.072,.26,8),new THREE.MeshToonMaterial({color:0x84745f}));stoneGrip.rotation.x=.09;stoneGrip.position.set(0,.16,-.10);g.add(stoneGrip);
  // Transparent collider keeps the 3D hoe tappable on small phone screens.
  // Unlike the removed UI, this never blocks scenery or the character.
  const touchTarget=new THREE.Mesh(new THREE.SphereGeometry(.44,9,7),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  touchTarget.position.set(0,.41,.12);touchTarget.castShadow=false;touchTarget.receiveShadow=false;
  g.add(touchTarget);
  goldenHoeGlow=new THREE.PointLight(0xffda73,0,10,1.65);goldenHoeGlow.position.set(0,.62,.12);g.add(goldenHoeGlow);
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  scene.add(g);return g;
}
function updateGoldenHoeMesh(dt){
  const rock=ensureGoldenHoeRock();
  if(!rock){if(goldenHoeMesh)goldenHoeMesh.visible=false;return;}
  if(!goldenHoeMesh)goldenHoeMesh=makeGoldenHoeRockMesh();
  const visible=!save.goldenHoeOwned && rock.mesh&&rock.mesh.parent;
  goldenHoeMesh.visible=visible;
  if(!visible)return;
  const sway=Math.sin(clock*2.1)*.03;
  goldenHoeMesh.position.set(rock.x,rockSurfaceY(rock,rock.x,rock.z)-.22,rock.z);
  goldenHoeMesh.rotation.set(.08+sway,.48+Math.sin(clock*1.4)*.02,.02);
  if(goldenHoeGlow)goldenHoeGlow.intensity=.72+Math.max(0,skyAtHour(gameMin/60).night)*.95;
}
function beginGoldenHoeTry(){
  if(save.goldenHoeOwned){toast('이미 황금 호미를 손에 넣었다.');return false}
  const cool=goldenHoeCooldownLeft();
  if(cool>0){toast('황금 호미는 아직 꿈쩍하지 않는다. 다시 도전하려면 '+formatGoldenHoeCooldown(cool)+' 남았다.');return false}
  if(!onRock||onRock!==goldenHoeRock){toast('황금 호미가 박힌 큰 바위 위에 올라가야 한다.');return false}
  goldenHoeAttempt=goldenHoeAttempt||{hits:0,lastHit:-999};
  if(!goldenHoeAttempt.hits)toast('황금 호미가 큰 바위에 깊게 박혀 있다… 너무 빠르게 치면 실패한다. 조심스럽게 30번 캐보자!');
  return true;
}
function failGoldenHoeTry(){
  if(!goldenHoeAttempt)return;
  goldenHoeAttempt=null;save.goldenHoeCooldownUntil=Date.now()+GOLDEN_HOE_COOLDOWN_MS;persist();
  if(goldenHoeMesh)goldenHoeMesh.rotation.z=-.18;
  toast('황금 호미를 캐내지 못했다… 바위가 다시 굳어 24시간 뒤에야 재도전할 수 있다.');
  floatMsg(goldenHoeMesh?goldenHoeMesh.position:new THREE.Vector3(P.x,P.y+1,P.z),'실패… 24시간 후 재도전');
  tone(196,.34,'triangle',.06,.75);tone(147,.44,'sine',.045,.7,.06);
}
function completeGoldenHoeTry(){
  goldenHoeAttempt=null;save.goldenHoeOwned=true;save.goldenHoeCooldownUntil=0;persist();
  me.hasGoldenHoe=true;goldenHoeClaimFx={time:0,duration:3.2,thunder:false};
  sendPresence(true);showGoldenHoeAchievement();
  if(goldenHoeMesh)goldenHoeMesh.visible=false;
  toast('✦ 황금 호미를 얻었다! 조심스러운 채집에 실패해도 채집물이 사라지지 않고 한 번 더 기회를 준다.');
}
function interactGoldenHoe(){
  const rock=ensureGoldenHoeRock();
  if(!rock||!goldenHoeMesh||!goldenHoeMesh.visible)return;
  if(!onRock||onRock!==rock||Math.hypot(P.x-rock.x,P.z-rock.z)>rock.r*.55+1.1){toast('큰 바위 위에서 가까이 다가가 황금 호미를 눌러 보자.');return}
  if(!beginGoldenHoeTry())return;
  const now=clock;
  if(goldenHoeAttempt.hits>0&&now-goldenHoeAttempt.lastHit<GOLDEN_HOE_GAP){failGoldenHoeTry();return}
  goldenHoeAttempt.lastHit=now;goldenHoeAttempt.hits++;
  me.mode='dig';me.t=0;curAct=null;queued=null;target=null;pending=null;
  if(goldenHoeMesh){goldenHoeMesh.rotation.z=.08+Math.sin(now*40)*.08}
  // The original round pip treatment, extended to 30 circles in two rows.
  // No numeric counter or persistent excavation panel is displayed.
  worldLabel(goldenHoeMesh.position.clone().add(new THREE.Vector3(0,.65,0)),
    goldenHoePipRows(goldenHoeAttempt.hits),'pip golden-hoe-pips',.95);
  tone(355+goldenHoeAttempt.hits*4,.08,'sine',.055,1.05);
  if(goldenHoeAttempt.hits===1)setTimeout(()=>floatMsg(goldenHoeMesh.position.clone().add(new THREE.Vector3(0,.55,0)),'돌결을 따라 천천히…'),280);
  if(goldenHoeAttempt.hits>=GOLDEN_HOE_REQUIRED_HITS)completeGoldenHoeTry();
}
function updateGoldenHoeClaim(dt){
  me.hasGoldenHoe=!!save.goldenHoeOwned;
  if(!goldenHoeFlashLight){goldenHoeFlashLight=new THREE.PointLight(0xfff4c0,0,34,1.6);scene.add(goldenHoeFlashLight)}
  if(!goldenHoeClaimFx){goldenHoeFlashLight.intensity=0;return;}
  goldenHoeClaimFx.time+=dt;target=null;pending=null;P.speed=0;me.mode='goldhoe';me.t+=0;
  const k=Math.min(1,goldenHoeClaimFx.time/.36)*Math.min(1,(goldenHoeClaimFx.duration-goldenHoeClaimFx.time)/1.1);
  goldenHoeFlashLight.position.set(P.x,P.y+2.2,P.z+.2);
  goldenHoeFlashLight.intensity=k*(goldenHoeClaimFx.time<.55?9.5:4.2)*(1+.25*Math.sin(goldenHoeClaimFx.time*28));
  if(!goldenHoeClaimFx.thunder&&goldenHoeClaimFx.time>.38){goldenHoeClaimFx.thunder=true;playThunder(.06);tone(659,.30,'sine',.05,1,.05)}
  if(!goldenHoeGlow){const dummy=0}else goldenHoeGlow.intensity=1.25+k*3.2;
  if(goldenHoeClaimFx.time>=goldenHoeClaimFx.duration){goldenHoeClaimFx=null;goldenHoeFlashLight.intensity=0;me.mode='idle';me.t=0}
}
function maybeHintGoldenHoe(){
  if(!onRock||onRock!==goldenHoeRock||save.goldenHoeOwned||goldenHoeHintedRock===onRock)return;
  goldenHoeHintedRock=onRock;
  const cool=goldenHoeCooldownLeft();
  if(cool>0)toast('큰 바위 틈에 황금 호미가 박혀 있다… 하지만 바위가 굳어 있다. '+formatGoldenHoeCooldown(cool)+' 뒤 다시 도전할 수 있다.');
  else toast('큰 바위 틈에 황금 호미가 박혀 있다! 가까이서 눌러 조심스럽게 30번 캐보자.');
}
function nearestClimbableRock(){
 const now=performance.now();
 if(now-lastClimbRockCheck<200){return cachedClimbRock}
 lastClimbRockCheck=now;
 let best=null,dist=1e9;
 for(const c of chunks.values())for(const rock of c.rocks||[]){
   if(!rock.climbable)continue;
   const dx=P.x-rock.x,dz=P.z-rock.z,d=Math.hypot(dx,dz);
   if(d>rock.r+2.2||d<rock.r*.35||Math.abs(rock.groundY-P.y)>3.5)continue;
   if(d<dist){best=rock;dist=d}
 }
 cachedClimbRock=best;return best;
}
function beginClimb(rock){
 if(!rock||climbing||onRock||inTent||Date.now()<faintUntil)return;
 const dx=P.x-rock.x,dz=P.z-rock.z,len=Math.hypot(dx,dz)||1;
 climbing={rock,steps:0,start:performance.now(),dirX:dx/len,dirZ:dz/len};
 target=null;pending=null;joy.x=joy.y=0;P.speed=0;
 $('climbPanel').classList.remove('hide');$('climbTitle').textContent='큰 바위 오르기';
 $('climbInfo').textContent='초록색 구간에 맞춰 오르기를 누르세요 · 0/'+CLIMB_STEPS;
 $('jumpBtn').textContent='오르기';
}
function climbPhase(){return ((performance.now()-climbing.start)%CLIMB_BEAT_MS)/CLIMB_BEAT_MS}
function climbFail(){
 if(!climbing)return;
 const c=climbing,rock=c.rock;climbing=null;onRock=null;
 P.x=rock.x+c.dirX*(rock.r+1.8);P.z=rock.z+c.dirZ*(rock.r+1.8);
 P.y=H(P.x,P.z);P.air=false;P.vy=0;P.speed=0;
 $('climbPanel').classList.add('hide');
 faintAnimal({name:'바위 추락',fall:true,durationMs:2*60*1000});
}
function climbAct(){if(inSecretCave)return;
 if(Date.now()<faintUntil||inTent||cooking||goldenHoeBusy())return;
 if(onRock){
   const rock=onRock,dx=P.x-rock.x,dz=P.z-rock.z,len=Math.hypot(dx,dz)||1;
   P.x=rock.x+dx/len*(rock.r+1.8);P.z=rock.z+dz/len*(rock.r+1.8);P.y=H(P.x,P.z);
   onRock=null;me.root.rotation.x=0;me.mode='idle';P.speed=0;
   $('climbPanel').classList.add('hide');$('jumpBtn').textContent='점프';goldenHoeHintedRock=null;return;
 }
 if(!climbing){const rock=nearestClimbableRock();if(rock)beginClimb(rock);else jump();return;}
 const phase=climbPhase();
 if(phase<.33||phase>.67){climbFail();return}
 climbing.steps++;
 const rock=climbing.rock,k=climbing.steps/CLIMB_STEPS;
 P.x=rock.x+climbing.dirX*lerp(rock.r*.86,rock.r*.20,k);
 P.z=rock.z+climbing.dirZ*lerp(rock.r*.86,rock.r*.20,k);
  P.y=lerp(rock.groundY,rockSurfaceY(rock,P.x,P.z),k);
 P.air=false;P.speed=0;
 tone(365+k*160,.12,'sine',.075,1.18);
 if(climbing.steps>=CLIMB_STEPS){
   onRock=rock;climbing=null;P.y=rockSurfaceY(rock,P.x,P.z);
   $('climbPanel').classList.add('hide');$('jumpBtn').textContent='내려가기';
   toast('큰 바위에 올라섰다. 바위 위 채집물을 살펴보자.');maybeHintGoldenHoe();
 }else{
   climbing.start=performance.now();
   $('climbInfo').textContent=`초록색 구간에 맞춰 오르기 · ${climbing.steps}/${CLIMB_STEPS}`;
 }
}
function updateRockClimbing(dt){
 updateGoldenHoeMesh(dt);updateGoldenHoeClaim(dt);
 const btn=$('jumpBtn');
 if(mode!=='game'||inTent){btn.classList.add('hide');return}
 if(climbing){btn.classList.remove('hide');
   $('climbPanel').classList.remove('hide');
   $('climbNeedle').style.left=(climbPhase()*99)+'%';
   btn.textContent='오르기';btn.classList.add('climbAvailable');
   return;
 }
 if(onRock){maybeHintGoldenHoe();btn.classList.remove('hide');btn.textContent='내려가기';btn.classList.add('climbAvailable');return}
 const rock=nearestClimbableRock();
 btn.classList.toggle('hide',!IS_TOUCH&&!rock);
 btn.textContent=rock?'오르기':'점프';btn.classList.toggle('climbAvailable',!!rock);
 $('climbPanel').classList.add('hide');
}
