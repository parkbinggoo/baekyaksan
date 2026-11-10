/* ================= MULTIPLAYER (GitHub Pages + public MQTT) ================= */
const MQTT_BROKER='wss://broker.emqx.io:8084/mqtt';
const GAME_ROOM='baekyaksan-herbs-public-v2';
const MQTT_TOPIC=GAME_ROOM+'/presence/';
const myId=(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,16):Math.random().toString(36).slice(2,18));
const others=new Map(),peerSeen=new Map(),sansamNoticeTime=new Map();
const myRankTag=document.createElement('div');myRankTag.className='nametag rankNameTag';myRankTag.style.display='none';$('labels').appendChild(myRankTag);
const myRankTagPos=new THREE.Vector3();
let mqttClient=null,mqttOnline=false,netJoined=false,netChecking=false,netJoinTime=Date.now(),netRetryNotice=false;
let lastNetSend=0,lastNetKey='',lastPeerCleanup=0,peopleCount=0;
function cleanNick(s){return String(s||'').replace(/[\u0000-\u001f\u007f-\u009f]/g,'').trim().slice(0,12)}
function netPublish(type,extra){if(!mqttOnline||!mqttClient)return;
  const packet=Object.assign({id:myId,type,joined:netJoinTime,t:Date.now()},extra||{});
  try{mqttClient.publish(MQTT_TOPIC+type+'/'+myId,JSON.stringify(packet),{qos:0,retain:false})}catch(e){}
}
function netState(){const act=Date.now()<faintUntil?'f':me.mode==='walk'?'w':me.mode==='dig'?'d':me.mode==='joy'?'j':me.mode==='joyspin'?'s':me.mode==='cook'?'c':me.mode==='bow'?'b':'i';
  return {x:+P.x.toFixed(2),y:+P.y.toFixed(2),z:+P.z.toFixed(2),h:+P.h.toFixed(2),a:act,c:save.color|0,n:cleanNick(save.nick),alt:Math.min(SUMMIT_ALT,Math.round(P.y*ALT_K)),g:Math.min(6,totalCount()),lv:playerRank,lt:lanternLevel(),tent:inTent&&activeTent?activeTent.id:'',cv:inSecretCave?1:0,tt:activeSpecialTitle(),gh:save.goldenHoeOwned?1:0};}
function updatePeople(){
  const count=netJoined?1+[...peerSeen.values()].filter(v=>Date.now()-v.seen<11000).length:0;
  peopleCount=count;
  const el=$('people');el.classList.toggle('hide',count<=1||!mqttOnline);
  if(count>1&&mqttOnline)el.textContent='함께 오르는 산객 '+Math.min(count,4)+'/4명';
}
function netDrop(id){const o=others.get(id);if(o){
    if(o.headLamp){scene.remove(o.headLamp);scene.remove(o.headLamp.target);o.headLamp.dispose&&o.headLamp.dispose()}
    if(o.lampLens){o.av.root.remove(o.lampLens);o.lampLens.geometry.dispose();o.lampLens.material.dispose()}
    scene.remove(o.av.root);o.el.remove();others.delete(id)
  }peerSeen.delete(id);updatePeople();if(inTent)updateTentSeats(.12)}
function netCleanup(){const now=Date.now();if(now-lastPeerCleanup<1500)return;lastPeerCleanup=now;
  for(const [id,peer] of peerSeen)if(now-peer.seen>11000)netDrop(id);
  if(netJoined){const all=[{id:myId,joined:netJoinTime},...[...peerSeen].map(([id,p])=>({id,joined:p.joined}))].sort((a,b)=>a.joined-b.joined||a.id.localeCompare(b.id));
    if(all.findIndex(v=>v.id===myId)>=4){netJoined=false;netPublish('bye');toast('4명이 모두 접속해 있습니다 · 혼자 모드로 전환합니다');}}
  updatePeople();
}
function shareHarvestSnapshot(){const items=[...sharedTaken].filter(([k,v])=>v>Date.now());
 for(let i=0;i<items.length;i+=12)netPublish('harvestSync',{items:items.slice(i,i+12).map(([id,until])=>[id,until,rareMoves.get(id)?.cycle||0])});
 const fireRows=[...campStates].map(([id,s])=>[id,s.fuel,s.fireUntil,s.updatedAt]);
 for(let i=0;i<fireRows.length;i+=10)netPublish('fireSync',{items:fireRows.slice(i,i+10)});
 const moved=[...rareMoves].slice(-1200);
 for(let i=0;i<moved.length;i+=12)netPublish('rareSync',{items:moved.slice(i,i+12).map(([id,s])=>[id,s.cycle,s.until])});
}
function netHello(){netPublish('hello',{name:cleanNick(save.nick)})}
function tryNetJoin(){if(!mqttOnline||netJoined||netChecking)return;netChecking=true;netJoinTime=Date.now();netHello();
  setTimeout(()=>{netChecking=false;if(!mqttOnline)return;
    netCleanup();const active=[...peerSeen.values()].filter(p=>Date.now()-p.seen<11000);
    if(active.length>=4){netJoined=false;toast('현재 4명이 접속 중입니다 · 빈자리가 나면 자동 참여합니다');updatePeople();return}
    netJoined=true;sendPresence(true);updatePeople();
  },1900);
}
function connectRoom(){
  if(mqttClient)return;
  if(!window.mqtt||typeof window.mqtt.connect!=='function'){toast('멀티플레이 모듈을 불러오지 못했습니다');return}
  try{mqttClient=window.mqtt.connect(MQTT_BROKER,{clientId:'baek_'+myId,clean:true,keepalive:25,reconnectPeriod:3000,connectTimeout:12000,
    will:{topic:MQTT_TOPIC+'bye/'+myId,payload:JSON.stringify({id:myId,type:'bye'}),qos:0,retain:false}});
    mqttClient.on('connect',()=>{mqttOnline=true;netJoined=false;netChecking=false;
      mqttClient.subscribe(MQTT_TOPIC+'#',{qos:0},e=>{if(!e)tryNetJoin()});});
    mqttClient.on('close',()=>{mqttOnline=false;netJoined=false;netChecking=false;updatePeople()});
    mqttClient.on('offline',()=>{mqttOnline=false;netJoined=false;updatePeople()});
    mqttClient.on('error',()=>{if(!netRetryNotice){netRetryNotice=true;toast('다른 산객 연결을 재시도하고 있습니다')}});
    mqttClient.on('message',(topic,data)=>{
      if(!topic.startsWith(MQTT_TOPIC)||data.length>1800)return;
      let d;try{d=JSON.parse(data.toString())}catch(e){return}
      if(!d||typeof d.id!=='string'||d.id===myId||!/^[a-zA-Z0-9]{8,18}$/.test(d.id))return;
      if(d.type==='bye'){netDrop(d.id);return}
      if(d.type==='harvest'){if(typeof d.resource==='string')markTaken(d.resource,+d.until,false,null,d.rareCycle);return}
      if(d.type==='harvestSync'){
        if(Array.isArray(d.items))for(const e of d.items)if(Array.isArray(e)&&e.length>=2)
          markTaken(e[0],+e[1],false,null,+e[2]||null);
        return;
      }
      if(d.type==='rareSync'){
        if(Array.isArray(d.items))for(const e of d.items){
          if(!Array.isArray(e)||e.length!==3||typeof e[0]!=='string')continue;
          const until=+e[2];if(!Number.isFinite(until)||until<0||until>Date.now()+RESPAWN_MS+15000)continue;
          updateRareMove(e[0],+e[1],until);
          if(until>Date.now())markTaken(e[0],until,false,null,+e[1]);
        }
        return;
      }
      if(d.type==='fireState'){
       updateCampState(d.camp,+d.fuel,+d.fireUntil,+d.updatedAt,false);return;
      }
      if(d.type==='fireSync'){
       if(Array.isArray(d.items))for(const e of d.items)if(Array.isArray(e)&&e.length===4)
        updateCampState(e[0],+e[1],+e[2],+e[3],false);
       return;
      }
      if(d.type==='radio'){if(typeof d.msg==='string'&&d.msg.length<=180)showRadioLine(cleanNick(d.name)||'산객',d.msg);return}
      if(d.type==='sansamFound'){
        if(typeof d.name==='string'&&Number.isFinite(d.t)&&Math.abs(Date.now()-d.t)<12000&&Date.now()-(sansamNoticeTime.get(d.id)||0)>9000){
          sansamNoticeTime.set(d.id,Date.now());showRadioLine(cleanNick(d.name)||'산객','심봤다~~~! 귀한 산삼을 발견했습니다! 🎉');
          playSansamCelebration();
        }return;
      }
      if(d.type==='caveOffer'){if(d.cv===1&&inSecretCave&&Number.isFinite(d.x)&&Number.isFinite(d.z)&&Math.hypot(d.x-caveBuddhaPoint.x,d.z-caveBuddhaPoint.z)<9)glowSecretCaveCandles();return}
      if(d.type==='caveBlessing'){if(d.cv===1&&inSecretCave&&(d.gold===0||d.gold===1)&&Number.isFinite(d.x)&&Number.isFinite(d.z)&&Math.hypot(d.x-caveBuddhaPoint.x,d.z-caveBuddhaPoint.z)<9)startCaveBlessingFx(d.gold===1);return}
      if(d.type==='boarDisperse'){
        const peer=others.get(d.id);
        if(peer&&Number.isFinite(d.x)&&Number.isFinite(d.z)&&
           Math.hypot(peer.x-d.x,peer.z-d.z)<45)
          disperseBoars(d.x,d.z,+d.until,false);
        return;
      }
      if(!['hello','state'].includes(d.type))return;
      if(!Number.isFinite(d.joined)||Math.abs(Date.now()-d.joined)>86400000)return;
      const prev=peerSeen.get(d.id);
      peerSeen.set(d.id,{seen:Date.now(),joined:d.joined,tent:d.type==='state'&&typeof d.tent==='string'&&/^tent-\d{1,2}$/.test(d.tent)?d.tent:(prev?.tent||''),name:cleanNick(d.n||prev?.name),rank:Number.isInteger(d.lv)?clamp(d.lv,1,RANKS.length):(prev?.rank||1),color:Number.isInteger(d.c)?d.c:(prev?.color||0)});
      if(d.type==='hello'){if(netJoined){sendPresence(true);shareHarvestSnapshot()}return}
      if(!Number.isFinite(d.x)||!Number.isFinite(d.z)||!Number.isFinite(d.y)||Math.abs(d.x)>20000||Math.abs(d.z)>20000)return;
      if(!prev&&peerSeen.size>12)netCleanup();
      upOther({peer:d.id,kind:'viewer',presence:d});updatePeople();
      if(inTent){reconcileTentOccupants();updateTentSeats(.08)}
    });
  }catch(e){mqttClient=null;toast('멀티플레이 연결을 시작할 수 없습니다')}
}
function upOther(p){
  if(p.sameTab||p.kind!=='viewer')return;const s=p.presence||{};if(!isFinite(s.x)||!isFinite(s.z))return;
  let o=others.get(p.peer);
  if(!o){const col=JACKETS[((s.c|0)%JACKETS.length+JACKETS.length)%JACKETS.length];const av=makeHiker(col);scene.add(av.root);const el=document.createElement('div');el.className='nametag rankNameTag';$('labels').appendChild(el);
    const headLamp=new THREE.SpotLight(0xffefd0,0,26,.62,.6,1.4);
    headLamp.castShadow=false;scene.add(headLamp);scene.add(headLamp.target);
    const lampLens=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),
      new THREE.MeshBasicMaterial({color:0xfff2bd,transparent:true,opacity:0}));
    lampLens.position.set(0,1.77,.13);av.root.add(lampLens);
    o={av,el,headLamp,lampLens,x:s.x,y:s.y||H(s.x,s.z),z:s.z,h:s.h||0,tx:s.x,ty:s.y,tz:s.z,th:s.h||0,mode:'idle',nick:''};others.set(p.peer,o)}
  o.tx=+s.x;o.tz=+s.z;o.ty=Number.isFinite(+s.y)?+s.y:H(o.tx,o.tz);o.th=+s.h||0;
  o.rank=Number.isInteger(s.lv)?clamp(s.lv,1,RANKS.length):1;o.nick=cleanNick(s.n);o.alt=Math.round(+s.alt||0);o.tent=typeof s.tent==='string'&&/^tent-\d{1,2}$/.test(s.tent)?s.tent:'';o.color=Number.isInteger(s.c)?s.c:0;o.lanternLevel=Number.isInteger(s.lt)?clamp(s.lt,1,3):1;o.inCave=s.cv===1;o.specialTitle=validSpecialTitle(s.tt);o.av.hasGoldenHoe=s.gh===1;
  o.av.root.traverse(part=>part.layers.set(o.inCave?1:0));o.headLamp.layers.set(o.inCave?1:0);o.headLamp.target.layers.set(o.inCave?1:0);
  setGreens(o.av,+s.g|0);
  const md=s.a==='b'?'bow':s.a==='f'?'faint':s.a==='w'?'walk':s.a==='d'?'dig':s.a==='j'?'joy':s.a==='s'?'joyspin':s.a==='c'?'cook':'idle';if(md!==o.mode){o.mode=md;o.av.mode=md;o.av.t=0}
  setTitleTag(o.el,o.specialTitle,o.rank,(o.mode==='faint'?'💤 ':'')+(o.nick||'산객'));
}
let presT=0;
function sendPresence(force){
  if(!netJoined||!mqttOnline)return;
  const now=Date.now(),state=netState(),key=JSON.stringify(state);
  if(!force&&now-lastNetSend<350)return;
  if(!force&&key===lastNetKey&&now-lastNetSend<2300)return;
  lastNetKey=key;lastNetSend=now;netPublish('state',state);
}
function updateMyRankTag(){
 if(mode!=='game'||inTent){myRankTag.style.display='none';return}
 setTitleTag(myRankTag,activeSpecialTitle(),playerRank,cleanNick(save.nick)||'산객');
 const p=myRankTagPos.set(P.x,P.y+2.28,P.z).project(camera);
 if(p.z<=-1||p.z>=1||Math.abs(p.x)>1.05||Math.abs(p.y)>1.05){myRankTag.style.display='none';return}
 myRankTag.style.display='';myRankTag.style.transform=`translate(${(p.x*.5+.5)*W}px,${(-p.y*.5+.5)*Hh}px) translate(-50%,-100%)`;
}
function updOthers(dt){
  const f=1-Math.exp(-dt*8);
  for(const o of others.values()){o.x=lerp(o.x,o.tx,f);o.z=lerp(o.z,o.tz,f);o.y=lerp(o.y,o.ty,f);let dh=o.th-o.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));o.h+=dh*f;
    const down=o.mode==='faint';
    o.av.root.position.set(o.x,o.y+(down?.28:0),o.z);o.av.root.rotation.y=o.h;
    o.av.root.rotation.x=lerp(o.av.root.rotation.x,down?-Math.PI/2:0,Math.min(1,dt*12));
    poseHiker(o.av,dt,down?0:1);
    if(o.mode==='joyspin')o.av.root.rotation.y+=Math.min(1,o.av.t/3.4)*Math.PI*4;
    const far=Math.hypot(o.x-P.x,o.z-P.z);o.av.root.visible=far<220&&!o.tent&&!!o.inCave===!!inSecretCave;
    const night=skyAtHour(gameMin/60).night;
    const nearEnough=far<55;
    const tier=LANTERN_SPECS[o.lanternLevel||1];
    o.headLamp.intensity=nearEnough&&!down&&!o.tent&&!inSecretCave?night*tier.intensity:0;
    o.headLamp.distance=tier.range;o.headLamp.angle=tier.angle;o.headLamp.decay=tier.decay;
    o.headLamp.position.set(o.x+Math.sin(o.h)*.12,o.y+1.75,o.z+Math.cos(o.h)*.12);
    o.headLamp.target.position.set(o.x+Math.sin(o.h)*tier.aim,o.y-.6,o.z+Math.cos(o.h)*tier.aim);
    o.av.backLantern.visible=o.lanternLevel===3;
    o.av.rearLight.intensity=nearEnough&&!down&&!o.tent&&!inSecretCave&&o.lanternLevel===3?night*.72:0;
    o.headLamp.target.updateMatrixWorld();
    o.lampLens.material.opacity=night*.95;
    o.lampLens.visible=o.av.root.visible&&!down&&!o.tent&&!inSecretCave&&night>.05;
    v3.set(o.x,o.y+2.15,o.z).project(camera);if(v3.z>1||far>8||inTent||!!o.inCave!==!!inSecretCave){o.el.style.display='none'}else{o.el.style.display='';o.el.style.transform=`translate(${(v3.x*.5+.5)*W}px,${(-v3.y*.5+.5)*Hh}px) translate(-50%,-100%)`}}
}
setInterval(()=>{if(mode!=='game')return;netCleanup();if(mqttOnline&&!netJoined&&!netChecking)tryNetJoin();if(netJoined)sendPresence(false)},2000);
addEventListener('pagehide',()=>{if(netJoined)netPublish('bye')});
