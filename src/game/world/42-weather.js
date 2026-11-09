/* ================= 공동 날씨 : 장기 시드와 가변 지속시간 ================= */
const WEATHER_ANCHOR=Date.UTC(2026,0,1)-KST_OFFSET;
const WEATHER_SEED=0x6a35b42d;
const WEATHER_TYPES=[
  {name:'맑음',type:0,cloud:0,rain:0},
  {name:'구름 조금',type:1,cloud:.22,rain:0},
  {name:'흐림',type:1,cloud:.65,rain:0},
  {name:'소나기',type:2,cloud:.78,rain:.72},
  {name:'비',type:2,cloud:.85,rain:.62},
  {name:'장마',type:2,cloud:1,rain:1}
];
function weatherRandom(index,salt){
  let x=(WEATHER_SEED^Math.imul(index+1,0x9e3779b1)^Math.imul(salt+1,0x85ebca6b))>>>0;
  x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);
  return ((x^(x>>>16))>>>0)/4294967296;
}
function weatherEvent(index,prevKind){
  const pick=weatherRandom(index,0);
  let kind=pick<.36?0:pick<.54?1:pick<.75?2:pick<.86?3:pick<.96?4:5;
  if((prevKind===3||prevKind===4||prevKind===5)&&kind===0)kind=2;
  const r=weatherRandom(index,1),minute=60000;
  const ranges=[[35,95],[18,48],[24,66],[3,8],[12,28],[55,130]];
  const [lo,hi]=ranges[kind];
  return {kind,duration:(lo+(hi-lo)*r)*minute};
}
let weatherStart=WEATHER_ANCHOR,weatherEnd=WEATHER_ANCHOR,weatherIndex=0,weatherPrevious=-1;
let weatherKind=0,weatherPriorKind=0,weatherType=0,weatherName='',weatherRain=0,weatherCloud=0;
function advanceWeather(){
  weatherPriorKind=weatherKind;
  const event=weatherEvent(weatherIndex,weatherPrevious);
  weatherStart=weatherEnd;weatherEnd=weatherStart+event.duration;
  weatherKind=event.kind;weatherPrevious=event.kind;weatherIndex++;
}
function syncWeather(){
  const now=Date.now();
  if(now<WEATHER_ANCHOR){weatherStart=now;weatherEnd=WEATHER_ANCHOR;weatherKind=0;}
  else {
    if(now<weatherStart){weatherStart=WEATHER_ANCHOR;weatherEnd=WEATHER_ANCHOR;weatherIndex=0;weatherPrevious=-1;}
    while(now>=weatherEnd)advanceWeather();
  }
  const event=WEATHER_TYPES[weatherKind];
  const fade=Math.min(event.kind===3?24000:90000,(weatherEnd-weatherStart)*.20);
  const inT=clamp((now-weatherStart)/Math.max(1,fade),0,1);
  const prev=WEATHER_TYPES[weatherPriorKind]||event;
  const smooth=inT*inT*(3-2*inT);
  weatherCloud=lerp(prev.cloud,event.cloud,smooth);
  weatherRain=lerp(prev.rain,event.rain,smooth);
  const outgoing=Math.min(event.kind===3?24000:90000,(weatherEnd-weatherStart)*.20);
  const nextT=clamp((now-(weatherEnd-outgoing))/Math.max(1,outgoing),0,1);
  if(event.rain>0&&nextT>0){weatherRain*=1-.28*nextT*nextT;}
  weatherType=event.type;
  if(weatherName!==event.name){weatherName=event.name;$('weather').textContent='날씨 · '+weatherName;}
}
syncWeather();
const rainCount=310,rainXYZ=new Float32Array(rainCount*3),rainRand=rngOf(2026);
for(let i=0;i<rainCount;i++){rainXYZ[3*i]=(rainRand()-.5)*26;rainXYZ[3*i+1]=rainRand()*16;rainXYZ[3*i+2]=(rainRand()-.5)*26}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainXYZ,3));
const rainPoints=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0xbdd8eb,size:.09,transparent:true,opacity:.55,depthWrite:false}));
scene.add(rainPoints);rainPoints.visible=false;
function updateRain(dt,elevation){
  // Precipitation progressively changes from rain to snow with altitude.
  const rainIntensity=weatherRain*(1-clamp((elevation-1550)/650,0,1));
  rainPoints.visible=rainIntensity>.015;if(!rainPoints.visible)return;
  rainPoints.material.opacity=.12+.53*rainIntensity;
  rainGeo.setDrawRange(0,Math.round(rainCount*rainIntensity));
  for(let i=0;i<rainCount;i++){const j=i*3;rainXYZ[j+1]-=dt*(10+7*weatherRain);if(rainXYZ[j+1]<0){rainXYZ[j+1]+=16;rainXYZ[j]=(rainRand()-.5)*26;rainXYZ[j+2]=(rainRand()-.5)*26;}}
  rainGeo.attributes.position.needsUpdate=true;rainPoints.position.set(P.x,P.y+1,P.z);
}
// Local alpine snow: the higher the hiker climbs, the denser the snow becomes.
// This is deterministic altitude-based scenery, not a new per-player random weather.
const snowCount=IOS_CLOUD_SAFE?115:220,snowRnd=rngOf(2500),snowXYZ=new Float32Array(snowCount*3);
for(let i=0;i<snowCount;i++){snowXYZ[3*i]=(snowRnd()-.5)*34;snowXYZ[3*i+1]=snowRnd()*18;snowXYZ[3*i+2]=(snowRnd()-.5)*34;}
const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowXYZ,3));
const snowFall=new THREE.Points(snowGeo,new THREE.PointsMaterial({color:0xfcffff,size:IOS_CLOUD_SAFE?.12:.14,transparent:true,opacity:.8,depthWrite:false}));scene.add(snowFall);snowFall.visible=false;
function updateAlpineSnow(dt,elevation){
  const base=clamp((elevation-1590)/860,0,1);
  const amount=base*clamp(.48+weatherRain*.7,0,1);
  snowFall.visible=amount>.01&&!inTent;if(!snowFall.visible)return;
  snowGeo.setDrawRange(0,Math.round(snowCount*amount));snowFall.material.opacity=.27+.6*amount;
  for(let i=0;i<snowCount;i++){
    const k=i*3;snowXYZ[k+1]-=(1.25+amount*2.6)*dt;
    snowXYZ[k]+=dt*(.12+.12*Math.sin(clock*.35+i));
    if(snowXYZ[k+1]<-2){snowXYZ[k+1]+=19;snowXYZ[k]=(snowRnd()-.5)*34;snowXYZ[k+2]=(snowRnd()-.5)*34;}
    if(snowXYZ[k]>17)snowXYZ[k]-=34;
  }
  snowGeo.attributes.position.needsUpdate=true;snowFall.position.set(P.x,P.y+2,P.z);
}
const lamp=new THREE.SpotLight(0xfff0d0,0,26,.62,.6,1.4);scene.add(lamp);scene.add(lamp.target);
// Neutral, opaque-looking volumetric-distance mist (never a walk-through plane).
// Fog and the transparent canvas's CSS sky must use the same grey-white hue;
// otherwise the greenish low-horizon background shows through as false terrain.
const _mistBase=new THREE.Color(),_mistDense=new THREE.Color(),_mistNight=new THREE.Color(),
      _fogTmp=new THREE.Color(),_skyFogTop=new THREE.Color(),_skyFogBottom=new THREE.Color();
let skyKey2='';
function updSky(){
  const hr=gameMin/60,S=skyAtHour(hr),night=S.night;
  const inCloud=clamp(1-Math.abs(P.y-CLOUD_Y)/28,0,1);
  // Mist itself has a neutral grey-white tint, including on clear days.
  _mistBase.setHex(0xe8ebed).lerp(_mistNight.setHex(0x7b8498),night*.74);
  _mistDense.setHex(0xf3f4f4).lerp(_mistNight.setHex(0x9ca5b2),night*.77);
  scene.fog.color.copy(_mistBase).lerp(_mistDense,clamp(inCloud*1.2,0,1));
  // Full concealment at a distance while still seeing nearby ground and herbs.
  scene.fog.near=lerp(34*PERF.fogK,9,inCloud);
  scene.fog.far=lerp(Math.min(132*PERF.fogK,(VIEW-.35)*CH),52,inCloud);
  if(weatherCloud>.01){
    scene.fog.color.lerp(_fogTmp.setHex(weatherRain>.02?0x99a5b1:0xc4cbd0),weatherCloud*(weatherRain>.02?.31:.15));
    scene.fog.far*=1-weatherCloud*.18-weatherRain*.22;
  }
  // The WebGL canvas has alpha, so empty sky pixels would otherwise expose
  // the old pale-green gradient even after foreground geometry has faded.
  // On clear nights leave the upper sky deep navy so the stars are visible;
  // clouds and rain still bring the neutral grey-white mist back naturally.
  const mistAmount=clamp(lerp(.55,.12,night)+inCloud*.86+weatherCloud*.22+weatherRain*.15,0,1);
  _skyFogTop.set(S.top).lerp(scene.fog.color,mistAmount);
  _skyFogBottom.set(S.bot).lerp(scene.fog.color,mistAmount);
  const key=S.top+S.bot+Math.round(mistAmount*100)+'-'+Math.round(weatherCloud*20)+'-'+Math.round(weatherRain*20);
  if(key!==skyKey2){
    skyKey2=key;
    document.body.style.background=`linear-gradient(${_skyFogTop.getStyle()},${_skyFogBottom.getStyle()})`;
  }
  // The decorative distant mountains explicitly bypass Three.js fog. Hide
  // those non-collidable silhouettes *inside* mist so they cannot show as a
  // solid dark-green wall floating through an otherwise white cloud layer.
  // Decorative distant mountains have no collision. In the hiking world
  // they can look like a floating green surface, so only actual terrain is shown.
  // The real 2,500 m summit stone/flag is a separate object and stays visible.
  farGroup.visible=false;
  summit.visible=false;
  hemi.intensity=S.hemi*(1-weatherCloud*.16-weatherRain*.18);
  const t=(hr-6)/12*Math.PI,el=Math.sin(t),az=Math.cos(t);
  if(el>-.05){sun.position.set(P.x+az*95,P.y+25+Math.max(el,0)*110,P.z+45);sun.intensity=S.sun*(1-weatherCloud*.27-weatherRain*.30);sun.color.setHex(el<.3?0xffc890:0xfff0d8)}
  else{sun.position.set(P.x-az*80,P.y+25-el*100,P.z+30);sun.intensity=.16*night;sun.color.setHex(0x9fb0ff)}
  sun.target.position.set(P.x,P.y,P.z);
  stars.position.set(P.x,P.y,P.z);
  const lantern=LANTERN_SPECS[lanternLevel()];
  lamp.intensity=night*lantern.intensity;lamp.distance=lantern.range;lamp.angle=lantern.angle;lamp.decay=lantern.decay;
  lamp.position.set(P.x,P.y+1.75,P.z);lamp.target.position.set(P.x+Math.sin(P.h)*lantern.aim,P.y-.6,P.z+Math.cos(P.h)*lantern.aim);
  me.backLantern.visible=lanternLevel()===3;
  me.rearLight.intensity=lanternLevel()===3&&!inTent?night*.72:0;
  for(const m of farMts){const u=m.userData;m.position.set(P.x+Math.cos(u.a)*u.dist,u.y0,P.z+Math.sin(u.a)*u.dist)}
  summit.position.set(P.x,P.y-1250,P.z-1500);
  const shade=lerp(1,.22,night);
  for(const s of skyPuffs){const u=s.userData;u.a+=u.v*.016;s.position.set(P.x+Math.cos(u.a)*u.d,Math.max(u.y,P.y+u.y*.5),P.z+Math.sin(u.a)*u.d);s.material.opacity=.75*(1-night*.7);s.material.color.setScalar(shade)}
}
