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
  const g=new THREE.Group(),
    stone=caveStoneMaterial(0xa79e8f),
    robe=caveStoneMaterial(0x8f897d),
    shadow=caveStoneMaterial(0x6e685d),
    detail=caveStoneMaterial(0x7e786b),
    dark=caveStoneMaterial(0x5e5a50),
    warm=new THREE.MeshLambertMaterial({color:0xc8bdaa,flatShading:true});
  const ico=(c,x,y,z,sx,sy,sz,detailLevel=1)=>caveMesh(g,new THREE.IcosahedronGeometry(1,detailLevel),c,x,y,z,sx,sy,sz);
  const sph=(c,x,y,z,sx,sy,sz,seg=8)=>caveMesh(g,new THREE.SphereGeometry(1,seg,seg),c,x,y,z,sx,sy,sz);

  // Lotus pedestal / plinth.
  caveMesh(g,new THREE.CylinderGeometry(1.34,1.52,.20,10),shadow,0,.00,0);
  caveMesh(g,new THREE.CylinderGeometry(1.18,1.34,.18,10),stone,0,.18,0);
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2;
    const petal=caveMesh(g,new THREE.ConeGeometry(.15,.34,5),detail,Math.cos(a)*.94,.22,Math.sin(a)*.14,.74,.66,.86);
    petal.rotation.x=Math.PI*.53;petal.rotation.z=Math.cos(a)*.25;petal.rotation.y=a;
  }
  caveMesh(g,new THREE.CylinderGeometry(1.00,1.12,.12,10),stone,0,.31,0);

  // Folded legs and lap with clearer knee separation.
  const lap=caveMesh(g,new THREE.CylinderGeometry(.86,1.02,.34,8),robe,0,.60,.14);lap.rotation.x=.06;
  const leftKnee=ico(robe,-.54,.57,.26,.46,.23,.36,0);
  const rightKnee=ico(robe,.54,.57,.26,.46,.23,.36,0);
  const centerFold=ico(detail,0,.50,.44,.44,.10,.20,0);
  centerFold.rotation.x=.16;
  for(const side of [-1,1]){
    const shin=caveMesh(g,new THREE.CylinderGeometry(.10,.12,.72,6),robe,side*.47,.44,.28,.95,1,.95);
    shin.rotation.z=side*.95;shin.rotation.x=.16;
  }

  // Waist, torso and shoulders. Keep articulation between lower body, abdomen and chest.
  const waist=caveMesh(g,new THREE.CylinderGeometry(.54,.64,.30,8),robe,0,.88,.10);waist.rotation.x=.03;
  const abdomen=ico(robe,0,1.16,.08,.70,.36,.56,1);
  const chest=ico(stone,0,1.58,.08,.82,.54,.58,1);
  const shoulderBar=caveMesh(g,new THREE.CylinderGeometry(.11,.13,1.28,7),stone,0,1.84,.07);
  shoulderBar.rotation.z=Math.PI/2; shoulderBar.rotation.x=.08;
  sph(stone,-.56,1.78,.10,.17,.17,.17,6);
  sph(stone,.56,1.80,.08,.17,.17,.17,6);

  // Robe drape and layered cloth.
  const leftDrape=caveMesh(g,new THREE.CylinderGeometry(.17,.22,1.12,6),robe,-.62,1.34,.20);leftDrape.rotation.z=.88;
  const rightDrape=caveMesh(g,new THREE.CylinderGeometry(.16,.20,1.04,6),robe,.67,1.52,.12);rightDrape.rotation.z=-.34;
  const sash=caveMesh(g,new THREE.BoxGeometry(.86,.07,.10),detail,.04,1.10,.42);sash.rotation.x=.08;
  for(let i=0;i<5;i++){
    const fold=caveMesh(g,new THREE.BoxGeometry(.90-.08*i,.045,.09),detail,-.02,1.20+i*.16,.44-i*.015);
    fold.rotation.z=.10-i*.03;fold.rotation.x=.10;
  }
  for(let i=0;i<4;i++){
    const fold=caveMesh(g,new THREE.BoxGeometry(.60-.06*i,.04,.08),detail,-.30,1.16+i*.18,.52-i*.015);
    fold.rotation.z=.34;fold.rotation.x=.12;
  }
  const robeCascade=caveMesh(g,new THREE.CylinderGeometry(.07,.11,.76,5),detail,-.15,1.42,.46);
  robeCascade.rotation.z=.20;

  // Neck and head with clearer distinction.
  caveMesh(g,new THREE.CylinderGeometry(.15,.18,.22,7),shadow,0,2.10,.05);
  const jaw=ico(stone,0,2.40,.06,.43,.24,.37,1);
  const face=ico(stone,0,2.70,.06,.50,.44,.43,1);
  const cranium=ico(stone,0,3.00,.03,.42,.30,.36,1);
  const ushnisha=ico(detail,0,3.27,.03,.30,.24,.28,0);

  // Hair curls and cap.
  for(let row=0;row<5;row++){
    const count=6-row;
    for(let i=0;i<count;i++){
      const off=(i-(count-1)/2)*.115;
      const curl=sph(detail,off,3.03+row*.09,.23-row*.045,.050,.050,.050,5);
      curl.position.x+=Math.sin((i+row)*1.4)*.008;
      curl.position.z+=Math.cos((i-row)*1.1)*.01;
    }
  }
  for(let i=0;i<10;i++){
    const a=i/10*Math.PI*2;
    sph(detail,Math.cos(a)*.25,2.98,Math.sin(a)*.18,.048,.048,.048,5);
  }
  for(let i=0;i<6;i++){
    const a=(i/5-.5)*.9;
    sph(detail,Math.sin(a)*.12,3.24+Math.cos(a)*.02,.12+Math.cos(a)*.04,.042,.042,.042,5);
  }

  // Ears.
  for(const side of [-1,1]){
    const ear=caveMesh(g,new THREE.CylinderGeometry(.07,.09,.34,6),stone,side*.42,2.63,.04);
    ear.rotation.z=side*.10;
  }

  // Face details for a gentler expression.
  const browBar=caveMesh(g,new THREE.BoxGeometry(.30,.024,.028),detail,0,2.82,.36);browBar.rotation.z=.01;
  for(const side of [-1,1]){
    const browWing=caveMesh(g,new THREE.BoxGeometry(.10,.018,.02),dark,side*.16,2.81,.372);
    browWing.rotation.z=side<0?.22:-.22;
    const eye=caveMesh(g,new THREE.CylinderGeometry(.010,.010,.11,6),dark,side*.145,2.69,.392);
    eye.rotation.z=Math.PI/2 + side*.08; eye.rotation.x=.20;
    const lidUpper=caveMesh(g,new THREE.BoxGeometry(.08,.010,.010),detail,side*.145,2.71,.396);
    lidUpper.rotation.z=side<0?.16:-.16;
    const lidLower=caveMesh(g,new THREE.BoxGeometry(.06,.008,.008),stone,side*.145,2.665,.392);
    lidLower.rotation.z=side<0?-.06:.06;
  }
  const noseBridge=caveMesh(g,new THREE.BoxGeometry(.034,.12,.026),detail,0,2.56,.396);
  const nose=ico(detail,0,2.46,.405,.062,.14,.08,0);
  const nostrilL=caveMesh(g,new THREE.SphereGeometry(.010,5,5),dark,-.022,2.42,.430);
  const nostrilR=caveMesh(g,new THREE.SphereGeometry(.010,5,5),dark,.022,2.42,.430);
  const philtrum=caveMesh(g,new THREE.BoxGeometry(.016,.05,.008),detail,0,2.38,.405);
  const smileMid=caveMesh(g,new THREE.BoxGeometry(.10,.012,.014),dark,0,2.31,.398);
  const smileL=caveMesh(g,new THREE.BoxGeometry(.055,.012,.014),dark,-.078,2.325,.400);smileL.rotation.z=.30;
  const smileR=caveMesh(g,new THREE.BoxGeometry(.055,.012,.014),dark,.078,2.325,.400);smileR.rotation.z=-.30;
  const lowerLip=caveMesh(g,new THREE.BoxGeometry(.08,.010,.010),stone,0,2.285,.392);
  const urnaBase=caveMesh(g,new THREE.CylinderGeometry(.020,.020,.016,6),detail,0,2.58,.409);urnaBase.rotation.x=Math.PI/2;
  const urna=caveMesh(g,new THREE.SphereGeometry(.035,7,7),warm,0,2.58,.420);

  // Hands and arms with clearer palms / fingers.
  const rightUpper=caveMesh(g,new THREE.CylinderGeometry(.12,.15,.46,6),stone,.58,1.85,.09);rightUpper.rotation.z=-.68;
  const rightFore=caveMesh(g,new THREE.CylinderGeometry(.11,.13,.48,6),stone,.78,2.08,.12);rightFore.rotation.z=-.08;
  const rightPalm=sph(stone,.82,2.30,.14,.18,.27,.10,6);
  for(let i=0;i<4;i++){
    const finger=caveMesh(g,new THREE.CylinderGeometry(.024,.028,.23,5),stone,.71+i*.07,2.50,.15);
    finger.rotation.z=-.02+i*.02;
  }
  const thumb=caveMesh(g,new THREE.CylinderGeometry(.024,.028,.16,5),stone,.63,2.38,.16);thumb.rotation.z=.72;

  const leftUpper=caveMesh(g,new THREE.CylinderGeometry(.12,.15,.48,6),robe,-.52,1.38,.20);leftUpper.rotation.z=.86;
  const leftFore=caveMesh(g,new THREE.CylinderGeometry(.11,.13,.42,6),stone,-.32,1.02,.40);leftFore.rotation.z=1.16;leftFore.rotation.x=.22;
  const leftPalm=sph(stone,-.12,.83,.52,.28,.10,.18,6);
  for(let i=0;i<4;i++){
    const finger=caveMesh(g,new THREE.CylinderGeometry(.02,.024,.15,5),stone,-.24+i*.062,.87,.55);
    finger.rotation.x=.98;finger.rotation.z=.10-i*.05;
  }
  const leftThumb=caveMesh(g,new THREE.CylinderGeometry(.018,.022,.11,5),stone,-.25,.79,.50);leftThumb.rotation.z=.90;leftThumb.rotation.x=.72;

  // Chest / robe accents.
  caveMesh(g,new THREE.CylinderGeometry(.05,.05,.03,6),detail,-.18,1.58,.39);
  caveMesh(g,new THREE.CylinderGeometry(.05,.05,.03,6),detail,-.06,1.48,.42);
  caveMesh(g,new THREE.CylinderGeometry(.05,.05,.03,6),detail,.02,1.36,.44);

  g.position.set(caveBuddhaPoint.x,0,caveBuddhaPoint.z-.6);
  group.add(g);
  prepareCaveBlessingFx(group,g,[stone,robe,shadow,detail,warm]);
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
  updateCaveBlessingFx(dt);
  const bright=(caveLightPulse>0?Math.min(1,caveLightPulse)*.75:0)+caveBlessingStrength()*.7;
  for(const c of caveCandles){
    const flicker=1+Math.sin(caveInteractionElapsed*7.3+c.phase)*.085+Math.sin(caveInteractionElapsed*11+c.phase*.5)*.035;
    if(c.light)c.light.intensity=c.base*(flicker+bright);
    if(c.flame){
      const synchronizedSway=caveBlessingStrength()*Math.sin(caveInteractionElapsed*14)*.26;
      c.flame.scale.y=flicker+.14*bright+caveBlessingStrength()*.25;
      c.flame.rotation.z=Math.sin(caveInteractionElapsed*8+c.phase)*.11+synchronizedSway;
      c.flame.material.opacity=Math.min(1,.88+.11*bright)
    }
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
  applyCaveBlessingShake(camera);
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
