/* ================= WILDLIFE ================= */
const WILDLIFE=[
 {id:'squirrel',name:'다람쥐',hab:'tree',color:0xa76c3b,scale:.19,fear:10},
 {id:'redsquirrel',name:'청설모',hab:'tree',color:0x686056,scale:.24,fear:11},
 {id:'rabbit',name:'산토끼',hab:'ground',color:0xb2a28b,scale:.37,fear:14},
 {id:'deer',name:'고라니',hab:'ground',color:0x98724e,scale:.76,fear:22},
 {id:'boar',name:'멧돼지',hab:'ground',color:0x4e4238,scale:.75,fear:13,danger:true},
 {id:'magpie',name:'까치',hab:'sky',color:0x283137,scale:.29,fear:17},
 {id:'woodpecker',name:'딱따구리',hab:'tree',color:0x514337,scale:.23,fear:12},
 {id:'pheasant',name:'꿩',hab:'ground',color:0x68613e,scale:.38,fear:15},
 {id:'turtledove',name:'멧비둘기',hab:'sky',color:0x988b7b,scale:.30,fear:14,active:'day'},
 {id:'owl',name:'올빼미',hab:'tree',color:0x827666,scale:.36,fear:17,active:'night'},
 {id:'eagleowl',name:'수리부엉이',hab:'tree',color:0x786249,scale:.49,fear:19,active:'night'}
];
const animals=new Map();let animalBuildT=0,lastAnimalAttack=0;
const BOAR_SMELL_RANGE=10,BOAR_CHARGE_RANGE=6.0,BOAR_CHASE_LIMIT=8.5,BOAR_CONTACT_RANGE=1.4;
const BOAR_WAKE_RADIUS=32,BOAR_WAKE_CLEAR_MS=2*60*1000;
const boarSafeZones=[];
function clearExpiredBoarZones(now=Date.now()){
  for(let i=boarSafeZones.length-1;i>=0;i--)if(boarSafeZones[i].until<=now)boarSafeZones.splice(i,1);
}
function isBoarFreeArea(x,z,now=Date.now()){
  return boarSafeZones.some(zone=>zone.until>now&&Math.hypot(x-zone.x,z-zone.z)<BOAR_WAKE_RADIUS);
}
function removeWildAnimal(key,animal){
  if(!animal)return;
  animal.nameEl?.remove();scene.remove(animal.mesh);animals.delete(key);
}
function disperseBoars(x,z,until=Date.now()+BOAR_WAKE_CLEAR_MS,broadcast=false){
  const now=Date.now();
  if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>20000||Math.abs(z)>20000||
     !Number.isFinite(until)||until<=now||until>now+BOAR_WAKE_CLEAR_MS+10000)return;
  clearExpiredBoarZones(now);
  const existing=boarSafeZones.find(zone=>Math.hypot(zone.x-x,zone.z-z)<8);
  if(existing){existing.until=Math.max(existing.until,until)}
  else {boarSafeZones.push({x,z,until});if(boarSafeZones.length>8)boarSafeZones.shift()}
  for(const [key,a] of animals){
    if(a.kind.id==='boar'&&(
      Math.hypot(a.x-x,a.z-z)<BOAR_WAKE_RADIUS||
      Math.hypot(a.originX-x,a.originZ-z)<BOAR_WAKE_RADIUS
    ))removeWildAnimal(key,a);
  }
  const alert=document.getElementById('boarWarning');
  if(alert)alert.classList.add('hide');boarAlertActive=false;
  if(broadcast)netPublish('boarDisperse',{x:+x.toFixed(2),z:+z.toFixed(2),until});
}
let boarAlertActive=false;
let lastWildSoundAt=0;
const ANIMAL_SOUND={squirrel:'squirrel',redsquirrel:'redsquirrel',rabbit:'rabbit',deer:'deer',boar:'boar',magpie:'magpie',woodpecker:'woodpecker',pheasant:'pheasant',turtledove:'turtledove',owl:'owlNearby',eagleowl:'eagleowl'};
function animalAwake(spec){const h=gameMin/60;return spec.active==='day'?(h>=6&&h<17):spec.active==='night'?(h>=17||h<6):true}
function nearbyWildSound(now){
  if(!AMB||AMB.a.state!=='running'||!soundOn||now-lastWildSoundAt<2500)return;
  const nearby=[];
  for(const animal of animals.values()){
    if(!animal.mesh.visible||!animalAwake(animal.kind))continue;
    const pos=animal.mesh.position,dist=Math.hypot(pos.x-P.x,pos.y-(P.y+1.4),pos.z-P.z);
    const radius=animal.kind.id==='boar'?20:animal.kind.hab==='sky'?29:23;
    if(dist>radius)continue;
    if(now<(animal.nextSound||0))continue;
    nearby.push({animal,dist,radius});
  }
  if(!nearby.length)return;
  const pick=nearby[Math.floor(Math.random()*nearby.length)],a=pick.animal;
  const fn=SND[ANIMAL_SOUND[a.kind.id]];if(!fn)return;
  const vol=clamp((1-pick.dist/pick.radius)*.065,.005,.065),panVal=clamp((a.mesh.position.x-P.x)/18,-.8,.8);
  fn(AMB.a.currentTime+.04,vol,panVal);
  a.nextSound=now+(a.kind.id==='boar'?11000:6500)+Math.random()*13000;
  lastWildSoundAt=now;
}
function createAnimal(spec){
 const g=new THREE.Group(),rig=new THREE.Group();g.add(rig);
 const mat=M(spec.color),light=M(0xd8c5a7),dark=M(0x352e2a),eye=M(0x181712);
 const make=(parent,geo,m,x,y,z,sx=1,sy=1,sz=1)=>{
   const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);
   o.castShadow=true;parent.add(o);return o;
 };
 const egg=(parent,m,x,y,z,rx,ry,rz)=>make(parent,new THREE.IcosahedronGeometry(1,0),m,x,y,z,rx,ry,rz);
 const softEgg=(parent,m,x,y,z,rx,ry,rz)=>make(parent,new THREE.IcosahedronGeometry(1,1),m,x,y,z,rx,ry,rz);
 const cone=(parent,m,x,y,z,r,h)=>make(parent,new THREE.ConeGeometry(r,h,6),m,x,y,z);
 const stick=(parent,m,x,y,z,rt,rb,h)=>make(parent,new THREE.CylinderGeometry(rt,rb,h,6),m,x,y,z);
 const id=spec.id,bird=['magpie','woodpecker','pheasant','turtledove','owl','eagleowl'].includes(id);
 const joints={legs:[],wings:[],rig,tail:null,bird};
 if(bird){
   const owlish=id==='owl'||id==='eagleowl',pheasant=id==='pheasant';
   const bodyY=owlish?.75:.61;
   softEgg(rig,mat,0,bodyY,-.04,owlish?.43:.37,owlish?.53:.38,owlish?.40:.52);
   softEgg(rig,mat,0,owlish?1.10:.95,.30,owlish?.35:.23,owlish?.34:.24,owlish?.27:.25);
   for(const side of [-1,1]){
     const wingPivot=new THREE.Group();wingPivot.position.set(side*.27,owlish?.91:.79,-.04);rig.add(wingPivot);
     const wingMat=id==='magpie'?M(0x363d45):id==='woodpecker'?M(0x4a403c):mat;
     const wing=egg(wingPivot,wingMat,side*.12,-.10,-.14,.17,.12,.37);
     for(let f=0;f<3;f++){
       const feather=egg(wingPivot,f%2?mat:wingMat,side*(.13+f*.06),-.15-f*.015,-.30-f*.085,.075,.043,.17);
       feather.rotation.z=side*.16;
     }
     joints.wings.push({pivot:wingPivot,side});
     if(owlish){
       softEgg(rig,light,side*.17,1.095,.50,.155,.175,.065);
       egg(rig,M(0xd8a349),side*.17,1.105,.563,.071,.073,.025);
       egg(rig,eye,side*.17,1.105,.588,.040,.049,.025);
     }else{egg(rig,eye,side*.17,.99,.517,.034,.040,.028)}
     if(id==='eagleowl'){
       const tuft=cone(rig,mat,side*.255,1.375,.26,.09,.29);tuft.rotation.z=-side*.26;
     }
     const foot=new THREE.Group();foot.position.set(side*.17,.36,.1);rig.add(foot);
     stick(foot,dark,0,-.15,0,.035,.045,.30);
     for(let toe=-1;toe<=1;toe++)egg(foot,dark,toe*.045,-.30,.08,.035,.034,.12);
     joints.legs.push({pivot:foot,side,front:true});
   }
   const bill=cone(rig,M(owlish?0xbba45c:0x9c8b69),0,owlish?1.01:.91,.595,.075,.17);bill.rotation.x=Math.PI/2;
   const tail=egg(rig,id==='magpie'?dark:mat,0,.52,-.74,.13,.09,pheasant?.85:id==='magpie'?.76:.42);
   tail.rotation.x=-.18;joints.tail=tail;
   if(id==='woodpecker'){
     egg(rig,M(0xb54433),0,1.15,.30,.14,.075,.13);
     egg(rig,M(0xe2ddca),0,.61,.36,.27,.21,.15);
     for(const side of [-1,1])egg(rig,M(0xd7d0bb),side*.3,.65,-.09,.05,.1,.18);
   }
   if(id==='magpie'){
     egg(rig,light,0,.66,.36,.26,.22,.21);
     for(const side of [-1,1])egg(rig,M(0xd2d8d6),side*.32,.72,-.19,.075,.10,.17);
   }
   if(id==='turtledove'){
     egg(rig,M(0xb8a59d),0,.62,.36,.27,.28,.18);
     for(const side of [-1,1]){
       for(let k=0;k<2;k++)egg(rig,M(0x736759),side*(.21+k*.015),.91-k*.055,.34,.025,.018,.048);
     }
   }
   if(pheasant){
     egg(rig,M(0x487064),0,.98,.32,.25,.19,.23);
     egg(rig,M(0x9b5140),0,.65,.32,.20,.22,.16);
     egg(rig,M(0xbca07a),0,.92,.49,.20,.035,.04);
   }
 }else{
   const boar=id==='boar',deer=id==='deer',rabbit=id==='rabbit';
   const squirrel=id==='squirrel'||id==='redsquirrel';
   const bodyY=deer?1.05:boar?.71:rabbit?.52:.48;
   softEgg(rig,mat,0,bodyY,-.08,boar?.75:deer?.34:squirrel?.34:.43,
      boar?.47:deer?.37:.32,boar?.87:deer?.64:.52);
   const headY=deer?1.62:boar?.83:rabbit?.77:.77;
   softEgg(rig,mat,0,headY,.61,deer?.29:boar?.40:.30,
       deer?.37:boar?.38:.29,deer?.37:boar?.53:.33);
   if(squirrel){
     if(id==='squirrel'){
       for(const side of [-1,1]){
         const stripe=egg(rig,M(0xe2c69c),side*.20,bodyY+.25,-.10,.045,.044,.41);
         stripe.rotation.y=side*.14;
         const stripeDark=egg(rig,M(0x54402f),side*.18,bodyY+.29,-.10,.025,.025,.37);
         stripeDark.rotation.y=side*.12;
       }
     }else egg(rig,light,0,.43,.36,.19,.20,.14);
     egg(rig,M(0xc2ac89),0,headY-.07,.87,.14,.11,.10);
   }
   if(boar){
     egg(rig,M(0x665247),0,.71,1.05,.32,.24,.29);
     for(const side of [-1,1]){
       const tusk=cone(rig,light,side*.30,.69,1.01,.062,.20);tusk.rotation.z=side*.48;
     }
     for(let i=0;i<8;i++){
       const bristle=cone(rig,M(i%2?0x3b342d:0x5b4a3d),0,1.11+i*.01,-.60+i*.17,.07,.17);
       bristle.rotation.x=-.25;
     }
   }
   for(const side of [-1,1]){
     const ear=cone(rig,mat,side*(deer?.26:.22),headY+.31,.53,
       rabbit?.113:deer?.147:.118,rabbit?.46:deer?.31:.23);
     ear.rotation.z=side*(rabbit?.15:.27);
     if(rabbit||deer){
       const inner=cone(rig,M(0xb99488),side*(deer?.26:.22),headY+.33,.56,
           rabbit?.063:.075,rabbit?.31:.19);inner.rotation.z=side*(rabbit?.15:.27);
     }
     egg(rig,eye,side*(boar?.29:.22),headY+.035,boar?.96:.91,.035,.04,.032);
     const legY=deer?.52:boar?.26:squirrel?.20:.21;
     for(const z of [-.40,.40]){
       const pivot=new THREE.Group();pivot.position.set(side*(boar?.37:.25),legY*2,z);rig.add(pivot);
       stick(pivot,mat,0,-legY,0,deer?.075:boar?.13:.062,deer?.06:boar?.12:.06,legY*2);
       egg(pivot,dark,0,-legY*1.9,.055,deer?.09:boar?.14:.076,.042,.13);
       joints.legs.push({pivot,side,front:z>0});
     }
   }
   if(squirrel){
     const tail=softEgg(rig,id==='redsquirrel'?M(0x585048):mat,0,.77,-.73,.22,.36,.64);
     tail.rotation.x=-.65;joints.tail=tail;
     egg(rig,id==='redsquirrel'?M(0x4e4943):M(0xca9e6c),0,1.03,-1.04,.19,.27,.30);
   }
   if(rabbit){
     egg(rig,light,0,.51,-.63,.17,.17,.16);
     egg(rig,light,0,.39,.34,.25,.12,.19);
   }
   if(deer){
     egg(rig,light,0,1.27,.70,.19,.25,.17);
     egg(rig,M(0x3b312a),0,1.56,.94,.12,.08,.085);
   }
 }
 g.scale.setScalar(spec.scale);g.userData.anim=joints;
 return g;
}
