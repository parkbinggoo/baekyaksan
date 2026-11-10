/* === CAVE SHRINE VISUAL RESPONSE ===
 * A modest pale aura for ordinary five-star; candle surge, mild shake and
 * golden Buddha illumination for golden five-star. No terrain or cave-site changes.
 */
let caveBlessFx=null,caveBuddhaMaterials=[],caveBlessLight=null,caveBlessHalo=null,caveFaceLight=null,caveGoldAura=null;
function prepareCaveBlessingFx(parent,buddha,materials){
  caveBuddhaMaterials=materials;
  caveBlessLight=new THREE.PointLight(0xffe8b5,0,9,2);
  caveBlessLight.position.set(caveBuddhaPoint.x,2.1,caveBuddhaPoint.z-.20);parent.add(caveBlessLight);
  caveBlessHalo=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),
    new THREE.MeshBasicMaterial({color:0xffca64,transparent:true,opacity:0,depthWrite:false,
      blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  caveBlessHalo.position.set(caveBuddhaPoint.x,2.05,caveBuddhaPoint.z-1.30);
  caveBlessHalo.scale.set(1.35,2.1,.22);caveBlessHalo.visible=false;parent.add(caveBlessHalo);
  caveFaceLight=new THREE.PointLight(0xffc577,.65,7.8,1.85);
  caveFaceLight.position.set(caveBuddhaPoint.x,1.78,caveBuddhaPoint.z+1.25);parent.add(caveFaceLight);
  caveGoldAura=new THREE.Mesh(new THREE.SphereGeometry(1.2,18,12),new THREE.MeshBasicMaterial({color:0xffdb86,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
  caveGoldAura.position.set(caveBuddhaPoint.x,1.95,caveBuddhaPoint.z-.6);caveGoldAura.scale.set(1.9,2.45,1.45);caveGoldAura.visible=false;parent.add(caveGoldAura);
}
function startCaveBlessingFx(golden){
  caveBlessFx={golden:!!golden,time:0,duration:golden?5.8:4.4};
  glowSecretCaveCandles();
  // Low and warm rather than a piercing alarm, to preserve cave ambience.
  tone(golden?294:392,.9,'sine',golden?.052:.029,1);
  if(golden){tone(440,1.7,'sine',.032,1,.16);tone(587,2.0,'sine',.032,1,.44)}
}
function caveBlessingStrength(){
  if(!caveBlessFx)return 0;
  const t=caveBlessFx.time,T=caveBlessFx.duration;
  return Math.min(1,t/.36)*Math.min(1,(T-t)/1.5);
}
function updateCaveBlessingFx(dt){
  if(!caveBlessLight||!caveBlessHalo)return;
  if(caveBlessFx){caveBlessFx.time+=dt;if(caveBlessFx.time>=caveBlessFx.duration)caveBlessFx=null}
  const k=caveBlessingStrength(),gold=!!caveBlessFx?.golden;
  const candlePulse=.62+.18*Math.sin(caveInteractionElapsed*7.4)+Math.max(0,caveLightPulse)*.08;
  if(caveFaceLight){
    caveFaceLight.color.setHex(gold?0xffd17d:0xffb86a);
    caveFaceLight.intensity=candlePulse + k*(gold?1.85:.42);
  }
  caveBlessLight.color.setHex(gold?0xffbb43:0xffebbb);
  caveBlessLight.intensity=k*(gold?3.8:1.35)*(1+.08*Math.sin(caveInteractionElapsed*8));
  caveBlessHalo.visible=k>.005;
  caveBlessHalo.material.opacity=k*(gold?.40:.10)*(1+.06*Math.sin(caveInteractionElapsed*5));
  caveBlessHalo.material.color.setHex(gold?0xffc043:0xffdfaa);
  if(caveGoldAura){
    caveGoldAura.visible=gold&&k>.005;
    caveGoldAura.material.opacity=gold?k*.26*(1+.05*Math.sin(caveInteractionElapsed*4.2)):0;
    caveGoldAura.scale.set(1.9+k*.35,2.45+k*.4,1.45+k*.25);
  }
  for(const m of caveBuddhaMaterials){if(!m?.emissive)continue;
    m.emissive.setHex(gold?0xb8891f:0x4a3820);
    m.emissiveIntensity=(gold?.28:.05)+k*(gold?1.08:.20);
  }
}
function applyCaveBlessingShake(camera){
  const fx=caveBlessFx;if(!fx?.golden)return;
  const k=caveBlessingStrength();
  // Brief mild camera vibration, not an actual change to terrain or pathfinding.
  const shake=k*.055;
  camera.position.x+=Math.sin(fx.time*31)*shake;
  camera.position.y+=Math.sin(fx.time*37)*shake*.46;
}
