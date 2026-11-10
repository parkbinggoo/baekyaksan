/* ================= SECRET CAVE WORLD =================
 * Visual guide: forest-overgrown rock opening, rough natural stone, seated
 * rock Buddha shrine. All geometry is original low-poly Three.js primitives.
 * The private, seeded site is selected at runtime. Nothing is drawn on the map.
 * Interior uses camera layer 1, exterior scene uses layer 0: no terrain edits.
 */
const SECRET_CAVE_SEED=0x6bbd7409;
const CAVE_FLOOR=0;
let caveSite=null,caveEntrance=null,caveInterior=null,caveReturnPos=null,inSecretCave=false;
let caveReturnCameraYaw=0,cavePreviousFog=null,cavePreviousBackground=null,caveEntryLock=0;
let caveCandles=[],caveLightPulse=0,caveInteractionElapsed=0;
const caveBuddhaPoint={x:0,z:-36.2};
function caveCurve(z){return Math.sin((5-z)*.11)*1.12+Math.sin((5-z)*.047)*.38}
function caveWidth(z){
  const chamber=Math.exp(-Math.pow((z+34.5)/7.8,2))*1.45;
  const bend=Math.sin((5-z)*.085)*.22;
  return 2.15+chamber+bend;
}
function caveInnerWalkWidth(z){return Math.max(1.32,caveWidth(z)-1.08)}
function caveArchHeight(z){
  const chamber=Math.exp(-Math.pow((z+34.5)/8.5,2))*1.25;
  return 2.95+chamber+Math.cos((z+6)*.065)*.10;
}
function caveStoneMaterial(col){return new THREE.MeshLambertMaterial({color:col,flatShading:true,side:THREE.DoubleSide})}
function caveMesh(group,geo,mat,x,y,z,sx=1,sy=1,sz=1){
  const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);
  o.castShadow=false;o.receiveShadow=true;group.add(o);return o;
}
function chooseSecretCaveSite(){
  // Deterministic seeded search: favour wooded cliff bands with a rock wall
  // and a small shoulder in front so the cave feels embedded in a real escarpment.
  const r=rngOf(SECRET_CAVE_SEED);let best=null;
  for(let i=0;i<360;i++){
    const z=-640-r()*3020,side=r()>.5?1:-1,offset=54+r()*20,x=pathX(z)+side*offset;
    const y=H(x,z),alt=y*ALT_K,water=streamD(x,z);
    if(!Number.isFinite(y)||water<10||alt<900||alt>1700)continue;
    const dx=Math.abs(H(x+1.2,z)-H(x-1.2,z)),dz=Math.abs(H(x,z+1.2)-H(x,z-1.2));
    const slope=Math.hypot(dx,dz);
    const towardPath=Math.abs(H(x-side*4,z)-y)+Math.abs(H(x-side*8,z)-y);
    const cliffRise=Math.abs(H(x+side*5,z)-y)+Math.abs(H(x+side*9,z)-y);
    const shoulder=Math.abs(H(x-side*2.8,z)-y)+Math.abs(H(x-side*5.6,z)-y);
    const forest=fbm(x*.055-12,z*.055+8)+fbm(x*.12+17,z*.12-6)*.45;
    const rockiness=Math.max(0,fbm(x*.075+31,z*.075-19));
    if(slope<1.05||slope>4.9||cliffRise<2.2||towardPath>3.0)continue;
    const score=(Math.min(3.8,slope)-1.05)*1.1 + cliffRise*.42 - shoulder*.75 + forest*.85 + rockiness*.55 + r()*.18;
    if(!best||score>best.score){
      const frontDx=pathX(z)-x;
      const frontDz=8 + Math.max(-10, Math.min(10, -z*.0025));
      const yaw=Math.atan2(frontDx,frontDz);
      best={x,z,y,score,yaw,side};
    }
  }
  if(!best){const z=-1830,side=1,x=pathX(z)+58;best={x,z,y:H(x,z),score:0,yaw:0,side}}
  return best;
}
function makeCaveEntrance(){
  const site=caveSite,g=new THREE.Group();g.position.set(site.x,site.y,site.z);g.rotation.y=site.yaw||0;
  const stone=[0x575b4d,0x525747,0x656557,0x484d42].map(caveStoneMaterial),moss=caveStoneMaterial(0x3b5635);
  const rock=new THREE.IcosahedronGeometry(1,1),bush=new THREE.IcosahedronGeometry(1,0);
  const greenMats=[0x42683c,0x355b31,0x52703b,0x5b7541].map(caveStoneMaterial);
  // Natural cliff frame: no thick flat facade, just side/upper rock masses hugging the slope.
  const leftWall=caveMesh(g,rock,stone[0],-2.0,1.95,-.52,1.55,2.35,1.85);leftWall.rotation.set(.12,-.32,.18);
  const rightWall=caveMesh(g,rock,stone[1],2.05,1.85,-.46,1.62,2.2,1.92);rightWall.rotation.set(-.14,.28,-.12);
  const topLintel=caveMesh(g,rock,stone[2],0,4.12,-.62,2.85,1.12,1.55);topLintel.rotation.set(.08,.06,.04);
  const backRock=caveMesh(g,rock,stone[3],0,2.45,-1.58,2.75,2.25,1.38);backRock.rotation.set(.07,.18,-.05);
  const mouthMat=new THREE.MeshBasicMaterial({color:0x080907,side:THREE.DoubleSide});
  caveMesh(g,new THREE.PlaneGeometry(1.52,2.72),mouthMat,0,1.50,.28);
  for(let i=0;i<16;i++){
    const a=Math.PI*(i/15),rx=Math.cos(a)*1.32,ry=1.05+Math.sin(a)*1.82;
    const rim=caveMesh(g,rock,stone[i%stone.length],rx,ry,.04,.46,.52,.62);rim.rotation.set(i*.17,i*.28,i*.13);
  }
  for(let i=0;i<10;i++){
    const side=i%2?-1:1;
    const ledge=caveMesh(g,rock,stone[(i+1)%4],side*(1.35+(i%3)*.42),.32+(i%4)*.48,-.12+(i%3)*.16,.42,.34,.58);
    ledge.rotation.y=i*.51;
  }
  // Moss and shrubs partially hide the mouth, but the center remains readable only at close range.
  for(let i=0;i<18;i++){
    const side=i%2?-1:1;
    let x=side*(.78+(i%4)*.22),y=.28+(i%6)*.20,z=.44+(i%2)*.10;
    if(i%5===0){x=side*(.42+(i%3)*.12);y=.88+(i%3)*.16;z=.36}
    const leaf=caveMesh(g,bush,greenMats[i%greenMats.length],x,y,z,.26+(i%3)*.07,.20,.28);
    leaf.rotation.set(i*.14,i*.25,Math.sin(i)*.45);
  }
  caveMesh(g,new THREE.BoxGeometry(4.3,.28,1.15),moss,0,.05,.82,1,1,1);
  // Two nearby pines to help hide the entrance until the player stands in front.
  function addPine(x,z,h,rot=0){
    const trunkMat=caveStoneMaterial(0x4b3d2e),leafMat=caveStoneMaterial(0x355f34);
    const trunk=caveMesh(g,new THREE.CylinderGeometry(.09,.12,h*0.58,6),trunkMat,x,h*0.29,z);trunk.rotation.z=rot;
    const c1=caveMesh(g,new THREE.ConeGeometry(h*0.28,h*0.58,6),leafMat,x,h*0.72,z,.95,1,.95);
    const c2=caveMesh(g,new THREE.ConeGeometry(h*0.22,h*0.48,6),leafMat,x,h*0.98,z,.95,1,.95);
    const c3=caveMesh(g,new THREE.ConeGeometry(h*0.16,h*0.36,6),leafMat,x,h*1.18,z,.95,1,.95);
    c1.rotation.y=c2.rotation.y=c3.rotation.y=rot*1.3;
  }
  addPine(-2.65,1.72,2.9,.08);
  addPine(2.48,1.45,3.35,-.06);
  caveEntrance=g;scene.add(g);
}
function makeCaveTunnel(){
  const group=new THREE.Group(),wall=caveStoneMaterial(0x4b4a40),floor=caveStoneMaterial(0x4a473d);
  const ringCount=49,segments=18,positions=[],unders=[];
  const archMin=-0.05,archMax=Math.PI+0.05;
  for(let i=0;i<ringCount;i++){
    const z=8-i,xx=caveCurve(z),w=caveWidth(z),h=caveArchHeight(z),wallLift=.78;
    for(let j=0;j<segments;j++){
      const t=j/(segments-1),a=lerp(archMin,archMax,t),rough=1+Math.sin(i*1.83+j*2.6)*.035;
      const x=xx+Math.cos(a)*w*rough;
      const y=Math.sin(a)*h*rough+wallLift;
      positions.push(x,y,z);
    }
    if(i<ringCount-1){
      const zn=z-1,cx=caveCurve(z),cxNext=caveCurve(zn),ww=caveInnerWalkWidth(z),wwNext=caveInnerWalkWidth(zn);
      unders.push(cx-ww,CAVE_FLOOR-.04,z,cx+ww,CAVE_FLOOR-.04,z,cxNext-wwNext,CAVE_FLOOR-.04,zn,
        cx+ww,CAVE_FLOOR-.04,z,cxNext+wwNext,CAVE_FLOOR-.04,zn,cxNext-wwNext,CAVE_FLOOR-.04,zn);
    }
  }
  const faces=[];
  for(let i=0;i<ringCount-1;i++)for(let j=0;j<segments-1;j++){
    const a=i*segments+j,b=i*segments+j+1,c=(i+1)*segments+j,d=(i+1)*segments+j+1;
    faces.push(a,b,c,b,d,c);
  }
  const wallGeo=new THREE.BufferGeometry();wallGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));wallGeo.setIndex(faces);wallGeo.computeVertexNormals();
  caveMesh(group,wallGeo,wall,0,0,0);
  const floorGeo=new THREE.BufferGeometry();floorGeo.setAttribute('position',new THREE.Float32BufferAttribute(unders,3));floorGeo.computeVertexNormals();
  caveMesh(group,floorGeo,floor,0,0,0);
  // Side rubble and alcove stones: keep the walking path and the shrine view clear.
  const chip=new THREE.IcosahedronGeometry(1,0);
  const colors=[0x535247,0x585649,0x45473d,0x676353].map(caveStoneMaterial);
  const r=rngOf(0xa38bc144);
  for(let i=0;i<110;i++){
    const z=5-r()*42,side=r()>.5?1:-1,w=caveInnerWalkWidth(z),x=caveCurve(z)+side*(w+.55+r()*.42);
    const d=.13+r()*.24,m=caveMesh(group,chip,colors[i%4],x,.05+r()*.18,z,d,d*.58,d*1.55);m.rotation.y=r()*6.28;
  }
  // Widened shrine chamber, with side and rear stones only.
  const shrineRock=caveStoneMaterial(0x514e44),halo=caveStoneMaterial(0x555449);
  for(let i=0;i<10;i++){
    const side=i%2?-1:1,row=Math.floor(i/2),zOff=-2.0-row*1.25;
    const m=caveMesh(group,chip,i%3?shrineRock:halo,
      caveBuddhaPoint.x+side*(2.55+(row%2)*.55),.78+Math.sin(i*1.7)*.32,
      caveBuddhaPoint.z+zOff,.92,1.0,1.18);
    m.rotation.set(i*.14,i*.22,i*.06);
  }
  for(let i=0;i<5;i++){
    const m=caveMesh(group,chip,i%2?shrineRock:halo,
      caveBuddhaPoint.x+Math.sin(i*.8)*.6,1.18+Math.sin(i)*.25,
      caveBuddhaPoint.z-3.1-(i*.42),1.05,1.12,1.05);
    m.rotation.set(i*.17,i*.31,i*.03);
  }
  makeCaveBuddha(group);
  makeCaveCandles(group);
  // Light is allowed on interior layer only; exterior lighting stays unchanged.
  const ambient=new THREE.AmbientLight(0xcab9a2,.15);group.add(ambient);
  group.traverse(obj=>obj.layers.set(1));caveInterior=group;scene.add(group);
}
function makeCaveBuddha(group){
  const g=new THREE.Group(),stone=caveStoneMaterial(0xa29b88),robe=caveStoneMaterial(0x8e897b),shadow=caveStoneMaterial(0x706c60);
  const ico=(c,x,y,z,sx,sy,sz,detail=1)=>caveMesh(g,new THREE.IcosahedronGeometry(1,detail),c,x,y,z,sx,sy,sz);
  caveMesh(g,new THREE.CylinderGeometry(1.15,1.35,.34,10),shadow,0,.02,0);
  caveMesh(g,new THREE.CylinderGeometry(.92,1.08,.28,10),stone,0,.30,0);
  ico(robe,0,.72,0,.92,.34,.68,1);
  ico(stone,0,1.54,.02,.72,1.02,.56,1);
  ico(robe,-.42,1.62,.08,.29,.82,.42,0);
  ico(stone,0,2.60,.02,.42,.58,.40,1);
  ico(stone,0,3.06,.04,.28,.14,.28,0);
  for(const side of [-1,1])ico(stone,side*.39,2.64,.02,.08,.15,.12,0);
  const eyes=caveStoneMaterial(0x67665e);
  for(const s of [-1,1])caveMesh(g,new THREE.BoxGeometry(.12,.016,.013),eyes,s*.15,2.62,.38);
  ico(stone,0,2.44,.40,.09,.15,.09,0);
  const mouth=caveMesh(g,new THREE.BoxGeometry(.18,.014,.018),eyes,0,2.30,.382);mouth.rotation.z=.03;
  // One upright palm, one resting hand.
  const arm=caveMesh(g,new THREE.CylinderGeometry(.16,.20,.84,6),stone,.70,1.78,.05);arm.rotation.z=-.35;
  ico(stone,.80,2.16,.11,.20,.30,.12,0);
  for(let i=0;i<4;i++)caveMesh(g,new THREE.CylinderGeometry(.033,.039,.24,5),stone,.67+i*.08,2.39,.12);
  const left=caveMesh(g,new THREE.CylinderGeometry(.15,.19,.86,6),robe,-.68,1.28,.26);left.rotation.z=-.88;
  ico(stone,-.20,.82,.52,.28,.10,.20,0);
  g.position.set(caveBuddhaPoint.x,0,caveBuddhaPoint.z-.6);
  group.add(g);
  // Keep the foreground clear: small, low offering tray only.
  const stand=caveMesh(group,new THREE.CylinderGeometry(.40,.48,.14,8),stone,caveBuddhaPoint.x,.09,caveBuddhaPoint.z+1.72);
  stand.userData.isOfferingTray=true;
}
function makeCaveCandles(group){
  const ivory=caveStoneMaterial(0xe1d5ad),wick=caveStoneMaterial(0x4a3525);
  const flameMat=new THREE.MeshBasicMaterial({color:0xffac45,transparent:true,opacity:.92});
  const flameGeo=new THREE.ConeGeometry(.065,.20,5),waxGeo=new THREE.CylinderGeometry(.085,.10,.27,7);
  const places=[];
  for(let z=2;z>=-31;z-=5.2){const w=caveInnerWalkWidth(z);places.push([caveCurve(z)-w*.94,z],[caveCurve(z)+w*.94,z])}
  for(const [dx,dz] of [[-1.5,-.1],[1.5,-.1],[-1.35,1.45],[1.35,1.45],[-2.0,-1.35],[2.0,-1.35]])places.push([caveBuddhaPoint.x+dx,caveBuddhaPoint.z+dz]);
  caveCandles=[];
  for(let i=0;i<places.length;i++){
    const [x,z]=places[i],s=new THREE.Group();s.position.set(x,.07,z);group.add(s);
    caveMesh(s,waxGeo,ivory,0,.13,0);
    caveMesh(s,new THREE.CylinderGeometry(.011,.011,.07,4),wick,0,.30,0);
    const f=caveMesh(s,flameGeo,flameMat.clone(),0,.43,0);
    caveCandles.push({flame:f,phase:i*2.33});
  }
  for(const z of [0,-12,-24,-35]){
    const light=new THREE.PointLight(0xff9f4e,z===-35?1.0:.74,8.6,2.0);
    light.position.set(caveCurve(z),1.3,z);group.add(light);
    caveCandles.push({light,phase:z*1.8,base:light.intensity});
  }
}
function ensureSecretCave(){
  if(caveSite)return;
  caveSite=chooseSecretCaveSite();
  caveBuddhaPoint.x=caveCurve(caveBuddhaPoint.z);
  makeCaveEntrance();makeCaveTunnel();
  caveEntrance.visible=false;
}
function glowSecretCaveCandles(){caveLightPulse=Math.max(caveLightPulse,2.8)}
function animateSecretCaveCandles(dt){
  caveInteractionElapsed+=dt;caveLightPulse=Math.max(0,caveLightPulse-dt);
  const bright=caveLightPulse>0?Math.min(1,caveLightPulse)*.75:0;
  for(const c of caveCandles){
    const flicker=1+Math.sin(caveInteractionElapsed*7.3+c.phase)*.085+Math.sin(caveInteractionElapsed*11+c.phase*.5)*.035;
    if(c.light)c.light.intensity=c.base*(flicker+bright);
    if(c.flame){c.flame.scale.y=flicker+.14*bright;c.flame.rotation.z=Math.sin(caveInteractionElapsed*8+c.phase)*.11;
      c.flame.material.opacity=Math.min(1,.88+.11*bright)}
  }
}
function showCaveAction(which){
  const ids=['secretCaveEnterBtn','secretCaveLeaveBtn','secretOfferOpenBtn'];
  $('secretCaveActions').classList.toggle('hide',!which);
  for(const id of ids)$(id).classList.toggle('hide',which!==id);
}
function enterSecretCave(){
  const entry=getSecretCaveEntryLocal();
  if(inSecretCave||!caveSite||mode!=='game'||inTent||caveEntryLock>Date.now()||
    entry.d>2.05||Math.abs(entry.x)>.82||entry.z<.74||entry.z>2.15||me.mode==='dig'||P.air)return;
  caveReturnPos={x:P.x,z:P.z,y:P.y,h:P.h};caveReturnCameraYaw=camYaw;
  clearRareSense();
  inSecretCave=true;updateRainSound();beginCaveSound();P.x=caveCurve(5);P.z=5;P.y=CAVE_FLOOR;P.vy=0;P.air=false;P.h=Math.PI;camYaw=P.h;
  target=null;pending=null;curAct=null;queued=null;
  cavePreviousFog=scene.fog;cavePreviousBackground=scene.background;
  scene.fog=null;scene.background=new THREE.Color(0x090a08);camera.layers.set(1);
  camera.position.set(caveCurve(6),2.05,6.1);camera.lookAt(P.x,1.35,P.z);
  me.root.traverse(o=>o.layers.enable(1));
  $('jumpBtn').classList.add('hide');$('mapView').classList.add('hide');mapOpen=false;
  showCaveAction('');toast('희미한 촛불이 바위 틈 깊숙이 이어진다…');sendPresence(true);
}
function leaveSecretCave(){
  if(!inSecretCave||caveOffering)return;
  inSecretCave=false;endCaveSound();
  scene.fog=cavePreviousFog;scene.background=cavePreviousBackground;camera.layers.set(0);
  me.root.traverse(o=>o.layers.set(0));
  const p=caveReturnPos||{x:pathX(24),z:24,h:Math.PI};
  P.x=p.x;P.z=p.z;P.y=H(P.x,P.z);P.h=p.h;camYaw=caveReturnCameraYaw;
  P.air=false;P.vy=0;caveReturnPos=null;caveEntryLock=Date.now()+3500;
  camera.position.set(P.x-Math.sin(camYaw)*5,P.y+3,P.z-Math.cos(camYaw)*5);
  if(IS_TOUCH)$('jumpBtn').classList.remove('hide');
  showCaveAction('');sendPresence(true);
}

function getSecretCaveEntryLocal(){
  if(!caveSite)return {x:999,z:999,d:999};
  const dx=P.x-caveSite.x,dz=P.z-caveSite.z,yaw=-(caveSite.yaw||0);
  const lx=dx*Math.cos(yaw)-dz*Math.sin(yaw);
  const lz=dx*Math.sin(yaw)+dz*Math.cos(yaw);
  return {x:lx,z:lz,d:Math.hypot(dx,dz)};
}
function updateSecretCaveExterior(dt){
  if(!caveSite||mode!=='game'||inTent){showCaveAction('');return}
  const entry=getSecretCaveEntryLocal();
  caveEntrance.visible=entry.d<185;
  const canEnter=entry.d<2.05&&Math.abs(entry.x)<.82&&entry.z>.74&&entry.z<2.15&&Date.now()>caveEntryLock&&!P.air;
  showCaveAction(canEnter?'secretCaveEnterBtn':'');
}
function updateSecretCaveInterior(dt){
  syncKST();animateSecretCaveCandles(dt);tickCaveSound(dt);
  if(AMB&&AC){AMB.master.gain.setTargetAtTime(.075,AC.currentTime,.40);AMB.water.gain.setTargetAtTime(0,AC.currentTime,.18)}
  const up=(keys.KeyW||keys.ArrowUp)?1:0,dn=(keys.KeyS||keys.ArrowDown)?1:0;
  const lf=(keys.KeyA||keys.ArrowLeft)?1:0,rt=(keys.KeyD||keys.ArrowRight)?1:0;
  const fwd=up-dn-joy.y,str=rt-lf+joy.x;
  const rot=(keys.KeyQ?1:0)-(keys.KeyE?1:0);camYaw+=rot*dt*1.6;
  let move=0;
  if(!caveOffering&&$('secretOfferingPanel').classList.contains('hide')&&
      $('rankPanel').classList.contains('hide')&&Math.hypot(fwd,str)>.08){
    const fx=Math.sin(camYaw),fz=Math.cos(camYaw),rx=Math.sin(camYaw-Math.PI/2),rz=Math.cos(camYaw-Math.PI/2);
    const v=Math.max(1,Math.hypot(fwd,str)),vx=(fx*fwd+rx*str)/v,vz=(fz*fwd+rz*str)/v;
    move=1;P.z=clamp(P.z+vz*dt*2.7,-37.2,5.8);
    const walkHalf=caveInnerWalkWidth(P.z);
    P.x=clamp(P.x+vx*dt*2.7,caveCurve(P.z)-walkHalf,caveCurve(P.z)+walkHalf);
    P.h=Math.atan2(vx,vz);
  }
  P.y=CAVE_FLOOR;P.speed=move;
  me.mode=caveOffering?'bow':move?'walk':'idle';me.root.position.set(P.x,P.y,P.z);
  const diff=Math.atan2(Math.sin(P.h-me.root.rotation.y),Math.cos(P.h-me.root.rotation.y));
  me.root.rotation.y+=diff*Math.min(1,dt*11);
  poseHiker(me,dt,P.speed);
  updateSecretOffering(dt);
  // Camera stays close and centered inside the bent passage and wider chamber.
  const cd=Math.min(camDist,3.0),cz=P.z-Math.cos(camYaw)*cd*.82;
  const walkHalf=caveInnerWalkWidth(cz);
  const cx=clamp(P.x-Math.sin(camYaw)*cd*.82,caveCurve(cz)-walkHalf*.92,caveCurve(cz)+walkHalf*.92);
  camera.position.lerp(v3.set(cx,2.05,clamp(cz,-39.2,6.4)),1-Math.exp(-dt*10));
  camera.lookAt(P.x,P.y+1.30,P.z);
  updOthers(dt);updateMyRankTag();
  if(P.z>3.8)showCaveAction('secretCaveLeaveBtn');
  else if(Math.hypot(P.x-caveBuddhaPoint.x,P.z-caveBuddhaPoint.z)<5.0&&!caveOffering){
    showCaveAction('secretOfferOpenBtn');
  }else showCaveAction('');
  presT+=dt;if(presT>.25){presT=0;sendPresence(false)}
  updateHudCompass();
  hudT+=dt;if(hudT>.35){hudT=0;updHud();}
  saveT+=dt;if(saveT>3){saveT=0;persist()}
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on')}
  if(foundTimer>0){foundTimer-=dt;if(foundTimer<=0)$('found').classList.remove('on')}
}
$('secretCaveEnterBtn').addEventListener('click',enterSecretCave);
$('secretCaveLeaveBtn').addEventListener('click',leaveSecretCave);
