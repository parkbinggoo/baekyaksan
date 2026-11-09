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
const caveBuddhaPoint={x:0,z:-32.8};
function caveCurve(z){return Math.sin((5-z)*.13)*1.25+Math.sin((5-z)*.063)*.45}
function caveWidth(z){return 1.37+Math.sin((5-z)*.09)*.14}
function caveStoneMaterial(col){return new THREE.MeshLambertMaterial({color:col,flatShading:true,side:THREE.DoubleSide})}
function caveMesh(group,geo,mat,x,y,z,sx=1,sy=1,sz=1){
  const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);
  o.castShadow=false;o.receiveShadow=true;group.add(o);return o;
}
function chooseSecretCaveSite(){
  // The same seed, noise and terrain make the chosen candidate deterministic
  // across devices and sessions. No location, coordinate or gameplay hint is shown.
  const r=rngOf(SECRET_CAVE_SEED);let best=null;
  for(let i=0;i<210;i++){
    const z=-500-r()*3540,side=r()>.5?1:-1,x=pathX(z)+side*(28+r()*19);
    const y=H(x,z),dx=Math.abs(H(x+1.2,z)-H(x-1.2,z)),dz=Math.abs(H(x,z+1.2)-H(x,z-1.2));
    const incline=Math.hypot(dx,dz),water=streamD(x,z),alt=y*ALT_K;
    if(!Number.isFinite(y)||water<8||alt<230||alt>2050||incline>3.8)continue;
    const shade=fbm(x*.11+9,z*.11-7),score=.6+Math.abs(incline-.85)*-.3+shade*.5+r()*.8;
    if(!best||score>best.score)best={x,z,y,score};
  }
  if(!best){const z=-1830,x=pathX(z)+35;best={x,z,y:H(x,z),score:0}}
  return best;
}
function makeCaveEntrance(){
  const site=caveSite,g=new THREE.Group();g.position.set(site.x,site.y,site.z);
  const stone=[0x575b4d,0x525747,0x656557,0x484d42].map(caveStoneMaterial),moss=caveStoneMaterial(0x3b5635);
  const rock=new THREE.IcosahedronGeometry(1,1),bush=new THREE.IcosahedronGeometry(1,0);
  const greenMats=[0x42683c,0x355b31,0x52703b].map(caveStoneMaterial);
  // Slightly recessed dark opening (one hiker wide), with stone shoulders.
  caveMesh(g,new THREE.PlaneGeometry(1.28,2.22),new THREE.MeshBasicMaterial({color:0x090c09,side:THREE.DoubleSide}),0,1.19,-.6);
  for(let i=0;i<18;i++){
    const a=Math.PI*(i/17),sx=Math.cos(a)*1.18,sy=1.22+Math.sin(a)*1.3;
    const o=caveMesh(g,rock,stone[i%stone.length],sx,sy,-.18,.55,.53,.65);
    o.rotation.set(i*.21,i*.31,i*.19);
  }
  for(let i=0;i<10;i++){
    const dir=i%2?-1:1,o=caveMesh(g,rock,stone[(i+1)%4],dir*(.88+(i%4)*.28),.25+(i%3)*.50,-.3+(i%4)*.43,.5,.39,.72);
    o.rotation.y=i*.75;
  }
  // Thick vegetation and moss obscure roughly half of the narrow opening.
  for(let i=0;i<26;i++){
    const side=i%3===0?-1:1,a=i*2.399,wide=.6+(i%6)*.18;
    const x=side*(.44+wide*.55),y=.25+(i%7)*.29,z=.13+(i%3)*.18;
    const leaf=caveMesh(g,bush,i%4===0?moss:greenMats[i%3],x+Math.sin(a)*.22,y,z,.29+(i%4)*.07,.21,.33);
    leaf.rotation.set(i*.21,i*.3,Math.sin(a)*.6);
  }
  const trunk=caveStoneMaterial(0x4b3d2e);
  for(let i=0;i<4;i++){
    const stem=caveMesh(g,new THREE.CylinderGeometry(.045,.075,1.8,5),trunk,(i%2?-1:1)*(.75+i*.13),1,.35,.8,1,.8);
    stem.rotation.z=(i%2?-1:1)*.40;
  }
  caveEntrance=g;scene.add(g);
}
function makeCaveTunnel(){
  const group=new THREE.Group(),wall=caveStoneMaterial(0x4b4a40),floor=caveStoneMaterial(0x434337);
  const ringCount=44,segments=14,positions=[],unders=[];
  for(let i=0;i<ringCount;i++){
    const z=7-i,xx=caveCurve(z),w=caveWidth(z),h=1.45;
    for(let j=0;j<segments;j++){
      const a=2*Math.PI*j/segments,rough=1+Math.sin(i*2.13+j*3.1)*.06;
      const x=xx+Math.cos(a)*w*rough,y=h+Math.sin(a)*1.54*rough;
      positions.push(x,y,z);
    }
    if(i<ringCount-1){
      const zn=z-1,cx=caveCurve(z),cxNext=caveCurve(zn),ww=caveWidth(z);
      unders.push(cx-ww,-.16,z,cx+ww,-.16,z,cxNext-ww,-.16,zn,
        cx+ww,-.16,z,cxNext+ww,-.16,zn,cxNext-ww,-.16,zn);
    }
  }
  const faces=[];
  for(let i=0;i<ringCount-1;i++)for(let j=0;j<segments;j++){
    const a=i*segments+j,b=i*segments+(j+1)%segments,c=(i+1)*segments+j,d=(i+1)*segments+(j+1)%segments;
    faces.push(a,b,c,b,d,c);
  }
  const wallGeo=new THREE.BufferGeometry();wallGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));wallGeo.setIndex(faces);wallGeo.computeVertexNormals();
  caveMesh(group,wallGeo,wall,0,0,0);
  const floorGeo=new THREE.BufferGeometry();floorGeo.setAttribute('position',new THREE.Float32BufferAttribute(unders,3));floorGeo.computeVertexNormals();
  caveMesh(group,floorGeo,floor,0,0,0);
  // Stone chips on either side, kept clear of the 1-person walking corridor.
  const chip=new THREE.IcosahedronGeometry(1,0);
  const colors=[0x535247,0x585649,0x45473d,0x676353].map(caveStoneMaterial);
  const r=rngOf(0xa38bc144);
  for(let i=0;i<140;i++){
    const z=5-r()*40,side=r()>.5?1:-1,w=caveWidth(z),x=caveCurve(z)+side*(w*.87+r()*.18);
    const d=.11+r()*.19,m=caveMesh(group,chip,colors[i%4],x,-.08+r()*.26,z,d,d*.65,d*1.7);m.rotation.y=r()*6.28;
  }
  // The shrine chamber is deliberately wider than the winding passage.
  const shrineRock=caveStoneMaterial(0x514e44),halo=caveStoneMaterial(0x555449);
  for(let i=0;i<13;i++){
    const a=i/13*Math.PI*2;
    const m=caveMesh(group,chip,i%3?shrineRock:halo,
      caveBuddhaPoint.x+Math.cos(a)*2.0,.72+Math.sin(i*2.4)*.65,
      caveBuddhaPoint.z-.7+Math.sin(a)*1.5,.84,.9,1.0);
    m.rotation.set(i*.21,i*.33,i*.10);
  }
  makeCaveBuddha(group);
  makeCaveCandles(group);
  // Light is allowed on interior layer only; exterior lighting stays unchanged.
  const ambient=new THREE.AmbientLight(0xc5b7a0,.12);group.add(ambient);
  group.traverse(obj=>obj.layers.set(1));caveInterior=group;scene.add(group);
}
function makeCaveBuddha(group){
  const g=new THREE.Group(),stone=caveStoneMaterial(0xa29b88),robe=caveStoneMaterial(0x8e897b),shadow=caveStoneMaterial(0x706c60);
  const ico=(c,x,y,z,sx,sy,sz,detail=1)=>caveMesh(g,new THREE.IcosahedronGeometry(1,detail),c,x,y,z,sx,sy,sz);
  caveMesh(g,new THREE.CylinderGeometry(.88,.99,.32,9),shadow,0,.02,0);
  caveMesh(g,new THREE.CylinderGeometry(.70,.84,.26,9),stone,0,.28,0);
  ico(robe,0,.65,0,.76,.30,.58,1); // cross-legged draped lap
  ico(stone,0,1.34,0,.59,.83,.43,1); // broad carved torso
  ico(robe,-.35,1.40,.07,.25,.66,.37,0); // robe from left shoulder
  ico(stone,0,2.25,.02,.36,.45,.34,1); // head
  ico(stone,0,2.66,.04,.24,.12,.25,0); // hair knot
  for(const side of [-1,1])ico(stone,side*.34,2.28,.02,.07,.13,.10,0);
  const eyes=caveStoneMaterial(0x67665e);
  for(const s of [-1,1]){
    caveMesh(g,new THREE.BoxGeometry(.11,.016,.013),eyes,s*.125,2.28,.323);
  }
  ico(stone,0,2.14,.36,.08,.13,.08,0); // nose
  const mouth=caveMesh(g,new THREE.BoxGeometry(.15,.013,.018),eyes,0,2.05,.324);mouth.rotation.z=.03;
  // One upright palm (traditional reassuring gesture), other hand rests on lap.
  const arm=caveMesh(g,new THREE.CylinderGeometry(.15,.18,.68,6),stone,.55,1.56,.05);arm.rotation.z=-.38;
  ico(stone,.64,1.90,.10,.17,.25,.11,0);
  for(let i=0;i<4;i++)caveMesh(g,new THREE.CylinderGeometry(.031,.037,.20,5),stone,.53+i*.07,2.10,.11);
  const left=caveMesh(g,new THREE.CylinderGeometry(.13,.17,.70,6),robe,-.55,1.18,.23);left.rotation.z=-.88;
  ico(stone,-.17,.76,.49,.24,.09,.17,0);
  g.position.set(caveBuddhaPoint.x,0,caveBuddhaPoint.z-.8);
  group.add(g);
  // Shallow stone offering tray in front of the Buddha.
  const stand=caveMesh(group,new THREE.CylinderGeometry(.52,.65,.24,8),stone,caveBuddhaPoint.x,.16,caveBuddhaPoint.z+1.1);
  stand.userData.isOfferingTray=true;
}
function makeCaveCandles(group){
  const ivory=caveStoneMaterial(0xe1d5ad),wick=caveStoneMaterial(0x4a3525);
  const flameMat=new THREE.MeshBasicMaterial({color:0xffac45,transparent:true,opacity:.92});
  const flameGeo=new THREE.ConeGeometry(.065,.20,5),waxGeo=new THREE.CylinderGeometry(.085,.10,.27,7);
  const places=[];
  for(let z=2;z>=-29;z-=5.2){const w=caveWidth(z);places.push([caveCurve(z)-w*.76,z],[caveCurve(z)+w*.76,z])}
  for(const [dx,dz] of [[-1.1,0],[1.1,0],[-1.1,1.25],[1.1,1.25]])places.push([caveBuddhaPoint.x+dx,caveBuddhaPoint.z+dz]);
  caveCandles=[];
  for(let i=0;i<places.length;i++){
    const [x,z]=places[i],s=new THREE.Group();s.position.set(x,.07,z);group.add(s);
    caveMesh(s,waxGeo,ivory,0,.13,0);
    caveMesh(s,new THREE.CylinderGeometry(.011,.011,.07,4),wick,0,.30,0);
    const f=caveMesh(s,flameGeo,flameMat.clone(),0,.43,0);
    caveCandles.push({flame:f,phase:i*2.33});
  }
  for(const z of [0,-12,-24,-32]){
    const light=new THREE.PointLight(0xff9f4e,z===-32?1.0:.71,7.3,2.0);
    light.position.set(caveCurve(z),1.15,z);group.add(light);
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
  if(inSecretCave||!caveSite||mode!=='game'||inTent||caveEntryLock>Date.now()||
    Math.hypot(P.x-caveSite.x,P.z-caveSite.z)>3.3||me.mode==='dig'||P.air)return;
  caveReturnPos={x:P.x,z:P.z,y:P.y,h:P.h};caveReturnCameraYaw=camYaw;
  clearRareSense();
  inSecretCave=true;P.x=caveCurve(5);P.z=5;P.y=CAVE_FLOOR;P.vy=0;P.air=false;P.h=Math.PI;camYaw=P.h;
  target=null;pending=null;curAct=null;queued=null;
  cavePreviousFog=scene.fog;cavePreviousBackground=scene.background;
  scene.fog=null;scene.background=new THREE.Color(0x090a08);camera.layers.set(1);
  camera.position.set(caveCurve(6),1.86,6.0);camera.lookAt(P.x,1.25,P.z);
  me.root.traverse(o=>o.layers.enable(1));
  $('jumpBtn').classList.add('hide');$('mapView').classList.add('hide');mapOpen=false;
  showCaveAction('');toast('희미한 촛불이 바위 틈 깊숙이 이어진다…');sendPresence(true);
}
function leaveSecretCave(){
  if(!inSecretCave||caveOffering)return;
  inSecretCave=false;
  scene.fog=cavePreviousFog;scene.background=cavePreviousBackground;camera.layers.set(0);
  me.root.traverse(o=>o.layers.set(0));
  const p=caveReturnPos||{x:pathX(24),z:24,h:Math.PI};
  P.x=p.x;P.z=p.z;P.y=H(P.x,P.z);P.h=p.h;camYaw=caveReturnCameraYaw;
  P.air=false;P.vy=0;caveReturnPos=null;caveEntryLock=Date.now()+3500;
  camera.position.set(P.x-Math.sin(camYaw)*5,P.y+3,P.z-Math.cos(camYaw)*5);
  if(IS_TOUCH)$('jumpBtn').classList.remove('hide');
  showCaveAction('');sendPresence(true);
}
function updateSecretCaveExterior(dt){
  if(!caveSite||mode!=='game'||inTent){showCaveAction('');return}
  const d=Math.hypot(P.x-caveSite.x,P.z-caveSite.z);
  caveEntrance.visible=d<175;
  showCaveAction(d<3.3&&Date.now()>caveEntryLock&&!P.air?'secretCaveEnterBtn':'');
}
function updateSecretCaveInterior(dt){
  syncKST();animateSecretCaveCandles(dt);
  const up=(keys.KeyW||keys.ArrowUp)?1:0,dn=(keys.KeyS||keys.ArrowDown)?1:0;
  const lf=(keys.KeyA||keys.ArrowLeft)?1:0,rt=(keys.KeyD||keys.ArrowRight)?1:0;
  const fwd=up-dn-joy.y,str=rt-lf+joy.x;
  const rot=(keys.KeyQ?1:0)-(keys.KeyE?1:0);camYaw+=rot*dt*1.6;
  let move=0;
  if(!caveOffering&&$('secretOfferingPanel').classList.contains('hide')&&
      $('secretTitlePanel').classList.contains('hide')&&Math.hypot(fwd,str)>.08){
    const fx=Math.sin(camYaw),fz=Math.cos(camYaw),rx=Math.sin(camYaw-Math.PI/2),rz=Math.cos(camYaw-Math.PI/2);
    const v=Math.max(1,Math.hypot(fwd,str)),vx=(fx*fwd+rx*str)/v,vz=(fz*fwd+rz*str)/v;
    move=1;P.z=clamp(P.z+vz*dt*2.7,-33,5.6);
    P.x=clamp(P.x+vx*dt*2.7,caveCurve(P.z)-.62,caveCurve(P.z)+.62);
    P.h=Math.atan2(vx,vz);
  }
  P.y=CAVE_FLOOR;P.speed=move;
  me.mode=caveOffering?'bow':move?'walk':'idle';me.root.position.set(P.x,P.y,P.z);
  const diff=Math.atan2(Math.sin(P.h-me.root.rotation.y),Math.cos(P.h-me.root.rotation.y));
  me.root.rotation.y+=diff*Math.min(1,dt*11);
  poseHiker(me,dt,P.speed);
  updateSecretOffering(dt);
  // Camera cannot pass through the narrow tunnel walls; it stays close and
  // centred on the bent passage instead of using the exterior occlusion engine.
  const cd=Math.min(camDist,2.55),cz=P.z-Math.cos(camYaw)*cd*.8;
  const cx=clamp(P.x-Math.sin(camYaw)*cd*.8,caveCurve(cz)-.60,caveCurve(cz)+.60);
  camera.position.lerp(v3.set(cx,1.88,clamp(cz,-35.8,6.2)),1-Math.exp(-dt*10));
  camera.lookAt(P.x,P.y+1.30,P.z);
  updOthers(dt);updateMyRankTag();
  if(P.z>3.6)showCaveAction('secretCaveLeaveBtn');
  else if(Math.hypot(P.x-caveBuddhaPoint.x,P.z-caveBuddhaPoint.z)<4.1&&!caveOffering){
    showCaveAction('secretOfferOpenBtn');
  }else showCaveAction('');
  presT+=dt;if(presT>.25){presT=0;sendPresence(false)}
  hudT+=dt;if(hudT>.35){hudT=0;updHud();$('alt').innerHTML='<small>장소</small>비밀 동굴';}
  saveT+=dt;if(saveT>3){saveT=0;persist()}
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on')}
  if(foundTimer>0){foundTimer-=dt;if(foundTimer<=0)$('found').classList.remove('on')}
}
$('secretCaveEnterBtn').addEventListener('click',enterSecretCave);
$('secretCaveLeaveBtn').addEventListener('click',leaveSecretCave);
