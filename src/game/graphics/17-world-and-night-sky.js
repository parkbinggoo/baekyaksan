/* ================= GAME SCENE ================= */
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0xdfe8e4,45,175);
const hemi=new THREE.HemisphereLight(0xeef2ea,0x3d4a34,.55);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,.72);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:260});sun.shadow.bias=-.0006;scene.add(sun);scene.add(sun.target);
/* far scenery: ring of mountains that never gets closer (they sink below you as you climb), and the summit that is always ahead */
const farGroup=new THREE.Group();scene.add(farGroup);
const farMts=[];
{const r=rngOf(55);for(let i=0;i<26;i++){const a=i/26*Math.PI*2+(r()-.5)*.15,dist=900+r()*500,h=160+r()*300;
  const m=makeMountain(h*1.3,h,100+i,[0x8fa6a2,0x7d958f,0x9db2ae][i%3],0xeef0ea,{fog:false,snowLine:.8});m.userData={a,dist,y0:-60-r()*40};farGroup.add(m);farMts.push(m)}}
const summit=makeMountain(900,1700,999,0x3a544e,0xf8f8f4,{seg:20,hs:14,fog:false,snowLine:.7});scene.add(summit);
// Atmospheric fog/sprites already provide the cloud layer. The old 3000m
// horizontal cloudSea planes looked like solid ground at elevation 600m and
// players could walk straight through them. No flat cloud surfaces are used.
const skyPuffs=[];{const r=rngOf(88);for(let i=0;i<22;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false,opacity:.8,fog:false}));const s=60+r()*90;sp.scale.set(s*2,s,1);sp.userData={a:r()*Math.PI*2,d:260+r()*400,y:40+r()*120,v:.004+r()*.01};scene.add(sp);sp.visible=!IOS_CLOUD_SAFE;skyPuffs.push(sp)}}
/* ---------- night sky: image-textured stars and brief shooting-star trails ---------- */
// Tiny images are drawn into textures once, then rendered in a handful of
// point-cloud batches. No additional ground, fog planes or external files.
const nightStarTex=canvasTex(64,64,(g)=>{
  g.clearRect(0,0,64,64);
  const glow=g.createRadialGradient(32,32,0,32,32,30);
  glow.addColorStop(0,'rgba(255,255,255,1)');
  glow.addColorStop(.12,'rgba(255,255,250,.96)');
  glow.addColorStop(.30,'rgba(241,246,255,.52)');
  glow.addColorStop(.68,'rgba(225,235,255,.08)');
  glow.addColorStop(1,'rgba(225,235,255,0)');
  g.fillStyle=glow;g.fillRect(0,0,64,64);
  g.strokeStyle='rgba(255,255,255,.38)';g.lineWidth=1;
  g.beginPath();g.moveTo(32,10);g.lineTo(32,54);g.moveTo(10,32);g.lineTo(54,32);g.stroke();
});
const meteorTex=canvasTex(256,48,(g)=>{
  g.clearRect(0,0,256,48);
  // A long transparent tail with the white-hot head near its right tip.
  const halo=g.createLinearGradient(0,0,256,0);
  halo.addColorStop(0,'rgba(135,183,255,0)');
  halo.addColorStop(.34,'rgba(158,201,255,.16)');
  halo.addColorStop(.78,'rgba(215,235,255,.50)');
  halo.addColorStop(.94,'rgba(255,255,248,.95)');
  halo.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=halo;g.beginPath();g.moveTo(0,24);g.lineTo(241,9);g.lineTo(252,24);g.lineTo(241,39);g.closePath();g.fill();
  const core=g.createLinearGradient(0,0,256,0);
  core.addColorStop(0,'rgba(255,255,255,0)');
  core.addColorStop(.44,'rgba(210,231,255,.13)');
  core.addColorStop(.85,'rgba(244,251,255,.86)');
  core.addColorStop(.96,'rgba(255,255,255,1)');
  core.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=core;g.fillRect(4,22,247,4);
  const head=g.createRadialGradient(242,24,0,242,24,13);
  head.addColorStop(0,'rgba(255,255,255,1)');
  head.addColorStop(.35,'rgba(241,248,255,.7)');
  head.addColorStop(1,'rgba(210,231,255,0)');
  g.fillStyle=head;g.fillRect(228,10,28,28);
});
const stars=new THREE.Group(),starLayers=[],starRng=rngOf(40429);
{
  // Count remains reasonable on low-end phones: 12 GPU point-cloud draws.
  const n=IOS_CLOUD_SAFE?1500:1950,batches=12,positions=Array.from({length:batches},()=>[]);
  for(let i=0;i<n;i++){
    const a=starRng()*Math.PI*2,u=.075+starRng()*.92,s=Math.sqrt(1-u*u),radius=1200;
    positions[i%batches].push(Math.cos(a)*s*radius,u*radius,Math.sin(a)*s*radius);
  }
  for(let i=0;i<batches;i++){
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions[i],3));
    const mat=new THREE.PointsMaterial({
      map:nightStarTex,color:[0xfff7e5,0xdde9ff,0xfffaf0][i%3],
      size:i%7===0?5:i%3===0?3.6:2.6,sizeAttenuation:false,
      transparent:true,opacity:0,depthWrite:false,fog:false,
      blending:THREE.AdditiveBlending
    });
    const points=new THREE.Points(geo,mat);points.frustumCulled=false;stars.add(points);
    starLayers.push({material:mat,phase:starRng()*Math.PI*2,speed:.42+starRng()*.65,base:.63+starRng()*.27});
  }
  scene.add(stars);
}
const shootingStars=[];
for(let i=0;i<3;i++){
  const material=new THREE.SpriteMaterial({map:meteorTex,transparent:true,opacity:0,
    depthWrite:false,fog:false,blending:THREE.AdditiveBlending});
  const sprite=new THREE.Sprite(material);sprite.visible=false;scene.add(sprite);
  shootingStars.push({sprite,material,age:0,life:1.1,start:new THREE.Vector3(),delta:new THREE.Vector3()});
}
const _meteorForward=new THREE.Vector3(),_meteorRight=new THREE.Vector3();
const meteorRng=rngOf(20636);
let skyBlinkTime=0,meteorWait=2.5;
function launchShootingStar(){
  const o=shootingStars.find(v=>!v.sprite.visible);if(!o)return;
  camera.getWorldDirection(_meteorForward);_meteorForward.y=0;
  if(_meteorForward.lengthSq()<.001)_meteorForward.set(0,0,-1);
  _meteorForward.normalize();_meteorRight.set(-_meteorForward.z,0,_meteorForward.x);
  const sign=meteorRng()<.50?1:-1;
  const dist=670,across=(meteorRng()-.5)*350;
  o.start.set(P.x+_meteorForward.x*dist+_meteorRight.x*across,
    P.y+150+meteorRng()*180,
    P.z+_meteorForward.z*dist+_meteorRight.z*across);
  o.delta.set(_meteorRight.x*(180+meteorRng()*130)*sign,-(26+meteorRng()*55),
    _meteorRight.z*(180+meteorRng()*130)*sign);
  o.life=.78+meteorRng()*.58;o.age=0;
  o.sprite.position.copy(o.start);
  o.sprite.scale.set(120+meteorRng()*65,5.5+meteorRng()*3,1);
  o.material.rotation=sign>0?-.27:Math.PI+.27;
  o.material.opacity=0;o.sprite.visible=true;
}
function updateNightSky(dt){
  const night=SKYNOW.night;
  const inCloud=clamp(1-Math.abs(P.y-CLOUD_Y)/28,0,1);
  const clear=clamp(1-inCloud*.95-weatherCloud*.65-weatherRain*.30,0,1);
  const peak=clamp((P.y*ALT_K-1400)/1100,0,1);
  const strength=!inTent?night*clear:0;
  stars.visible=strength>.015;
  stars.position.set(P.x,P.y,P.z);
  skyBlinkTime+=dt;
  for(const p of starLayers){
    // Different stars brighten and fade out of step: slow, natural twinkling.
    const flicker=.62+.38*Math.sin(skyBlinkTime*p.speed+p.phase)**2;
    p.material.opacity=strength*p.base*flicker*(.82+peak*.18);
  }
  for(const o of shootingStars){
    if(!o.sprite.visible)continue;
    o.age+=dt;const t=clamp(o.age/o.life,0,1);
    o.sprite.position.copy(o.start).addScaledVector(o.delta,t);
    o.material.opacity=strength*Math.min(1,t*7,(1-t)*5)*(.75+peak*.25);
    if(t>=1||strength<.02){o.sprite.visible=false;o.material.opacity=0}
  }
  if(strength<.30){meteorWait=Math.min(meteorWait,3.0);return}
  meteorWait-=dt;
  if(meteorWait<=0){
    launchShootingStar();
    // Sometimes two meteors pass in quick succession, particularly at the summit.
    meteorWait=meteorRng()<(.14+peak*.28)?(.4+meteorRng()*.8):
      (11-peak*6)*( .72+meteorRng()*.65 );
  }
}
