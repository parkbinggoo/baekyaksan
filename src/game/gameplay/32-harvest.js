/* ================= PLAYER ================= */
const me=makeHiker(JACKETS[save.color%JACKETS.length]);scene.add(me.root);
const P={x:pathX(24),z:24,y:0,h:Math.PI,vy:0,air:false,speed:0};
const BASE_CAMP={x:pathX(24),z:24,r:34};
if(save.pos&&isFinite(save.pos.z)){P.x=save.pos.x;P.z=save.pos.z}
P.y=H(P.x,P.z);
let camYaw=P.h,camPitch=.26,camDist=8,yawOff=0,lastDrag=-9;
const keys={};
let target=null,pending=null,curAct=null,queued=null,hitDone=false;
let joyT=0;
const v3=new THREE.Vector3();
function nearTo(p,r){return Math.hypot(p.x-P.x,p.z-P.z)<r}
function act(tg){
  if(inSecretCave)return;
  if(Date.now()<faintUntil||cooking||climbing||(me.mode==='joy'||me.mode==='joyspin')||(tg.item&&takenUntil(tg.item.id)))return;
  if(tg.item&&tg.item.rock&&onRock!==tg.item.rock){
    const rock=tg.item.rock;
    toast('바위 위에 붙어 있다. 근처에서 오르기 버튼을 이용하자.');
    if(nearestClimbableRock()===rock)beginClimb(rock);
    return;
  }
  const careGap=careGapOfTarget(tg);
  if(careGap&&nearTo(tg.pos,2.4)){const gap=careGap,it=tg.item;if((me.mode==='dig'&&curAct&&curAct.item===it)||(queued&&queued.item===it)||(it.hits>0&&clock-(it.lastHit||-9)<gap)){queued=null;careFail(tg);return}}
  const reach=tg.kind==='ground'?1.9:2.4;
  if(nearTo(tg.pos,reach)){target=null;pending=null;swing(tg)}
  else{target={x:tg.pos.x,z:tg.pos.z,stop:reach*.8};pending=tg}
}
function swing(tg){
  if(me.mode==='dig'){queued=tg;return}
  me.mode='dig';me.t=0;hitDone=false;curAct=tg;
  P.h=Math.atan2(tg.pos.x-P.x,tg.pos.z-P.z);
}
const spots={};
function impact(tg){
  // Digging into snowy ground gets the same gentle, low-frequency snow texture.
  const snowyDig=(tg.kind==='ground'||tg.kind==='herb'||tg.kind==='decoy')&&snowGroundCoverage(P.x,P.z,P.y)>.36;
  if(snowyDig)playSnowDig();else thud();
  if(tg.kind==='herb'||tg.kind==='ground'||tg.kind==='fruit'||tg.kind==='decoy')dirt(tg.pos,16);else dirt(tg.pos,10,[0x7a4a30,0x5a3a24,0x5e8f3e]);
  if(tg.kind==='decoy'){
    const it=tg.item;if(!it||takenUntil(it.id))return;
    it.hits++; if(it.hits<(it.need||3)){pip(tg.pos,it.hits,it.need||3);if(it.mesh){it.mesh.userData.shake=.25;shaking.add(it)}return;}
    markTaken(it.id,Date.now()+RESPAWN_MS,true);
    floatMsg(tg.pos,'도감에 없는 발견… ㅠㅠ');
    toast(it.spec.note);
    tone(277,.22,'sine',.038,.83);
  }else if(tg.kind==='herb'||tg.kind==='mush'||tg.kind==='fruit'||tg.kind==='honey'){
    const it=tg.item;if(takenUntil(it.id))return;it.hits++;it.lastHit=clock;
    if(it.mesh){it.mesh.userData.shake=.3;shaking.add(it)}
    if(it.hits>=it.need){collect(it.kind,it.type,tg.pos,it)}else{pip(tg.pos,it.hits,it.need);if(it.hits===1&&careGapOfItem(it.kind,it)>0)setTimeout(()=>floatMsg(tg.pos,it.kind==='honey'?'벌들이 예민하다… 천천히':it.kind==='mush'?'조각나지 않게 천천히 캐자':'뿌리가 여리다… 천천히'),350)}
  }else if(tg.kind==='tree'){
    const t=tg.tree;
    // Trees without any attached, available collectible are 'empty trees'.
    const hostChunk=chunks.get(t.id.split(':')[0]);
    const attached=!!hostChunk?.items.some(it=>it.mesh&&it.mesh.parent&&(it.tree===t||
      ((it.type==='sanghwang'||it.type==='norugung'||SPI[it.type]?.onTree)&&Math.hypot(it.mesh.position.x-t.x,it.mesh.position.z-t.z)<.8)));
    if(!attached){
      // Preserve the original four-tap hidden-mushroom search as well as new twigs.
      if(!t.searched){
        t.hits=(t.hits||0)+1;
        if(t.hits>=4){t.searched=true;
          if(Math.random()<.4){const mt=pickW(MUSH,COMMON_MUSH_KEYS,Math.random(),1+P.y*ALT_K/600);collect('mush',mt,tg.pos,null);return}
        }
      }
      if(totalCount()>=bagLimit()){toast('나뭇가지를 담을 가방 공간이 부족합니다');return}
      const now=Date.now();if(!t.twigReady||now>=t.twigReady){t.twigHits=(t.twigHits||0)+1;
        if(t.twigHits>=2){t.twigHits=0;t.twigReady=now+30000;save.inv[TWIG_KEY]=(save.inv[TWIG_KEY]||0)+1;persist();hudKey='';setGreens(me,totalCount());
          floatMsg(tg.pos,'🪵 나뭇가지 +1');tone(390,.16,'triangle',.08);return}
        pip(tg.pos,t.twigHits,2);return}
      floatMsg(tg.pos,'떨어질 마른 가지가 없다…');return;
    }
    if(t.searched){floatMsg(tg.pos,'이미 살펴본 나무');return}
    t.hits++;for(let i=0;i<6;i++){if(parts.length>=MAXP)parts.shift();parts.push({x:t.x+(Math.random()-.5)*3,y:t.y+4*t.s,z:t.z+(Math.random()-.5)*3,vx:(Math.random()-.5),vy:-.2,vz:(Math.random()-.5),t:0,life:2,c:new THREE.Color(0x5e8f3e)})}
    if(t.hits>=4){t.searched=true;if(Math.random()<.4){const mt=pickW(MUSH,COMMON_MUSH_KEYS,Math.random(),1+P.y*ALT_K/600);collect('mush',mt,tg.pos,null)}else{floatMsg(tg.pos,'버섯은 없었다…');tone(220,.25,'triangle',.06,.8)}}
    else pip(tg.pos,t.hits,4);
  }else{
    const k=Math.round(tg.pos.x/1.6)+','+Math.round(tg.pos.z/1.6);const sp=spots[k]||(spots[k]={hits:0,done:false});
    if(sp.done){floatMsg(tg.pos,'이미 파 본 자리');return}
    sp.hits++;
    if(sp.hits>=4){sp.done=true;const pk=digFind(tg.pos.x,tg.pos.z);if(pk){collect('herb',pk,tg.pos,null)}
      else{floatMsg(tg.pos,'흙만 나왔다…');tone(200,.25,'triangle',.06,.8)}}
    else pip(tg.pos,sp.hits,4);
  }
}
let foundTimer=0,lastFound=null;
function showInfoCard(kind,type,fromBag){
  const info=itemInfo(type);
  const fc=$('fCanvas'),g=fc.getContext('2d');g.clearRect(0,0,fc.width,fc.height);
  g.drawImage(renderIcon(kind,type),0,0,fc.width,fc.height);
  $('fTag').textContent=fromBag?'도감':kind==='honey'?'야생 벌꿀 채집':info.rar>=5?'심봤다!!':info.rar>=4?'귀한 것을 찾았다':'채집 성공';
  $('fName').textContent=info.name;$('fRar').textContent='★'.repeat(info.rar)+'☆'.repeat(5-info.rar);
  $('fDesc').textContent=info.desc;$('fMeta').textContent=(info.part?`채취: ${info.part} · `:'')+(info.hab||'나무 줄기')+(info.care?(kind==='honey'?' · 벌집을 천천히 채집해야 함':' · 뿌리가 여려 천천히 캐야 함'):'')+` · 등산가방 속 ${save.inv[type]||0}개`;
  $('fClose').classList.toggle('hide',!fromBag);
  $('found').classList.toggle('legend',info.rar>=4);$('found').classList.add('on');
  foundTimer=fromBag?0:(info.rar>=4?3.8:2.6);
}
function collect(kind,type,pos,it){
  const originalType=type;
  const golden=!!(it?.golden)||(GOLD_FIVE_BASES.includes(type)&&!it&&goldenSpawn('ground:'+Math.floor(pos.x*3)+','+Math.floor(pos.z*3),0));
  if(golden)type=goldenKey(type);
  const info=itemInfo(type);
  if(it&&takenUntil(it.id))return;
  if(totalCount()>=bagLimit()){ floatMsg(pos,'가방이 가득 찼다'); toast(`등산가방은 현재 ${bagLimit()}개까지 담을 수 있습니다. 텐트에서 판매하거나 가방을 확장하세요.`); tone(220,.24,'triangle',.055,.85); return; }
  if(it){markTaken(it.id,Date.now()+RESPAWN_MS,true,originalType);if(it.mesh&&it.mesh.parent){if(kind==='herb'){const sp=SPI[originalType];pulls.push({m:it.mesh,t:0,y0:it.mesh.position.y,d:(sp?.root?sp.root.len+(sp.root.deep?.15:.05):0)+.25})}else it.mesh.parent.remove(it.mesh)}for(const c of chunks.values()){const i=c.items.indexOf(it);if(i>=0)c.items.splice(i,1)}}
  save.inv[type]=(save.inv[type]||0)+1; save.known=save.known||{}; save.known[originalType]=1;
  if(golden){save.goldKnown=save.goldKnown||{};save.goldKnown[originalType]=1}
  recordHerbHarvest(originalType,itemInfo(originalType),!!it&&
    (!!itemInfo(originalType)?.care||!!(it.golden&&itemInfo(originalType)?.rar===5)));persist();
  const isSansam=originalType==='sansam';
  me.mode=isSansam?'joyspin':'joy';me.t=0;joyT=isSansam?3.65:2.3;curAct=null;queued=null;
  burst(new THREE.Vector3(pos.x,pos.y+.4,pos.z),info.rar>=4?40:20,info.rar>=4);hearts(new THREE.Vector3(P.x,P.y+2.1,P.z));
  chime(info.rar);setGreens(me,totalCount());
  if(isSansam){
    playSansamCelebration();saySansamFound();
    const name=cleanNick(save.nick)||'산객',message='심봤다~~~! 귀한 산삼을 발견했습니다! 🎉';
    showRadioLine(name,message);
    if(netJoined)netPublish('sansamFound',{name});
  }
  lastFound={k:type,t:Date.now()};
  showInfoCard(kind,type,false);
  sendPresence(true);
}
$('found').addEventListener('pointerdown',e=>{e.stopPropagation();$('found').classList.remove('on');foundTimer=0});
