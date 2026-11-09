/* ================= 밤의 반딧불 (작은 무리 · 느린 발광) ================= */
// Visual ambience only: no item IDs, network state or save data are changed.
// Each sprite has a soft transparent halo; two nearby swarms provide gentle
// real point lighting on the existing terrain and foliage, without fake floors.
const fireflyGlowTex=canvasTex(64,64,(g)=>{
  const r=g.createRadialGradient(32,32,0,32,32,31);
  r.addColorStop(0,'rgba(255,255,223,1)');
  r.addColorStop(.12,'rgba(255,246,163,.98)');
  r.addColorStop(.30,'rgba(235,239,113,.57)');
  r.addColorStop(.60,'rgba(206,217,103,.16)');
  r.addColorStop(1,'rgba(206,217,103,0)');
  g.fillStyle=r;g.fillRect(0,0,64,64);
});
const fireflyWorld={flies:[],groups:[],lights:[],anchorX:Infinity,anchorZ:Infinity};
function initFireflies(){
  if(fireflyWorld.flies.length)return;
  const groupCount=IS_TOUCH?5:7, perGroup=IS_TOUCH?5:6;
  for(let j=0;j<groupCount;j++)fireflyWorld.groups.push({x:0,y:0,z:0,lightPulse:0});
  for(let i=0;i<groupCount*perGroup;i++){
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:fireflyGlowTex,color:0xfff0aa,
      transparent:true,opacity:0,depthWrite:false,depthTest:true,
      blending:THREE.AdditiveBlending,fog:true}));
    sp.visible=false;sp.scale.setScalar(.22);scene.add(sp);
    fireflyWorld.flies.push({sprite:sp,group:Math.floor(i/perGroup),x:0,y:0,z:0,phase:0,rate:1,drift:1,dx:0,dz:0});
  }
  // Keep just two real, shadow-free lights even on mobile to avoid GPU load.
  for(let i=0;i<2;i++){
    const light=new THREE.PointLight(0xffe18b,0,8,2);
    light.castShadow=false;scene.add(light);fireflyWorld.lights.push(light);
  }
}
function placeFireflies(){
  fireflyWorld.anchorX=P.x;fireflyWorld.anchorZ=P.z;
  const ix=Math.floor(P.x/32),iz=Math.floor(P.z/32);
  const seed=(Math.imul(ix+1017,73856093)^Math.imul(iz+2049,19349663)^0x58f1eb)>>>0;
  const r=rngOf(seed),groups=fireflyWorld.groups;
  for(let j=0;j<groups.length;j++){
    // A small group beside the path and several others among the trees.
    const a=(j+r()*.48)*Math.PI*2/groups.length;
    const dist=j===0?6+r()*6:12+r()*24;
    let x=P.x+Math.cos(a)*dist,z=P.z+Math.sin(a)*dist;
    const side=x-pathX(z);
    if(Math.abs(side)>48)x=pathX(z)+Math.sign(side)*(24+r()*17);
    groups[j].x=x;groups[j].z=z;groups[j].y=H(x,z)+1.2;
  }
  for(const f of fireflyWorld.flies){
    const g=groups[f.group],a=r()*Math.PI*2,spread=.5+r()*2.4;
    f.x=g.x+Math.cos(a)*spread;f.z=g.z+Math.sin(a)*spread;
    f.y=H(f.x,f.z)+.75+r()*2.15;
    f.phase=r()*Math.PI*2;
    f.rate=2*Math.PI/(5+r()*4.5); // a complete slow blink every 5–9.5 real seconds
    f.drift=.16+r()*.15;f.dx=r()*Math.PI*2;f.dz=r()*Math.PI*2;
  }
}
function updateFireflies(){
  const alt=P.y*ALT_K;
  // Fireflies naturally prefer warmer, lower wooded valleys, not the snowy summit.
  const activity=!inTent&&alt<1800 ? SKYNOW.night*clamp((1800-alt)/540,0,1)*(1-weatherRain*.65) : 0;
  if(activity<.10){
    for(const f of fireflyWorld.flies)f.sprite.visible=false;
    for(const light of fireflyWorld.lights)light.intensity=0;
    return;
  }
  initFireflies();
  if(Math.hypot(P.x-fireflyWorld.anchorX,P.z-fireflyWorld.anchorZ)>47)placeFireflies();
  for(const g of fireflyWorld.groups)g.lightPulse=0;
  const t=clock;
  for(const f of fireflyWorld.flies){
    // Each individual brightens and dims gradually; tiny, wandering movements.
    const wave=.5+.5*Math.cos(t*f.rate+f.phase);
    const pulse=wave*wave*(3-2*wave);
    const sprite=f.sprite;
    sprite.visible=true;
    sprite.material.opacity=activity*(.028+.91*pulse);
    sprite.scale.setScalar(.18+.18*pulse);
    sprite.position.set(f.x+Math.sin(t*f.drift+f.dx)*.44,
      f.y+Math.sin(t*f.drift*.68+f.phase)*.30,
      f.z+Math.cos(t*f.drift*.89+f.dz)*.44);
    fireflyWorld.groups[f.group].lightPulse+=pulse;
  }
  // Only the two closest swarms cast very soft light on grass and ground.
  const ordered=fireflyWorld.groups.slice().sort((a,b)=>
    (a.x-P.x)**2+(a.z-P.z)**2-(b.x-P.x)**2-(b.z-P.z)**2);
  for(let i=0;i<fireflyWorld.lights.length;i++){
    const light=fireflyWorld.lights[i],g=ordered[i];
    light.position.set(g.x,g.y,g.z);
    light.intensity=activity*(.16+.38*g.lightPulse/(fireflyWorld.flies.length/fireflyWorld.groups.length));
  }
}
