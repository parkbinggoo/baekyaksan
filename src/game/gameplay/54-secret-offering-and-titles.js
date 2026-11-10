/* ================= BUDDHA OFFERING / SPECIAL TITLES =================
 * A local, single-session offering transaction finishes only after a bow. It
 * guards double clicks, cancel and premature page close. The existing game
 * uses browser-local profiles and anonymous MQTT; a trusted server would be
 * required for tamper-proof cross-device ownership and atomic transactions.
 */
let caveOffering=null,offeringSelectedKey='',achievementTimeout=0;
function validOfferingKey(key){
  return isGoldenKey(key)||([ ...HERB_KEYS,...MUSH_KEYS].includes(key)&&itemInfo(key)?.rar===5);
}
function currentOfferingKeys(){
  return [...HERB_KEYS,...MUSH_KEYS,...GOLD_FIVE_BASES.map(goldenKey)]
    .filter(k=>validOfferingKey(k)&&(save.inv[k]||0)>0);
}
function closeOffering(){
  if(caveOffering)return;
  $('secretOfferingPanel').classList.add('hide');offeringSelectedKey='';
}
function renderOfferingItems(){
  const host=$('secretOfferingItems');host.replaceChildren();
  const keys=currentOfferingKeys();
  if(!keys.length){const p=document.createElement('p');p.textContent='가방에 공양할 5성 채집물이 없습니다.';host.appendChild(p)}
  for(const key of keys){
    const info=itemInfo(key),gold=isGoldenKey(key),b=document.createElement('button');
    b.type='button';b.className='secret-choice'+(gold?' golden':'')+(key===offeringSelectedKey?' on':'');
    b.textContent=(gold?'✦ ':'')+info.name+' · '+(save.inv[key]||0)+'개'+(gold?' · 영구 칭호 + 24시간 보살핌':' · 40분 가호 · 힌트 3%');
    b.onclick=()=>{offeringSelectedKey=key;renderOfferingItems();};host.appendChild(b);
  }
  $('secretOfferingConfirm').disabled=!keys.includes(offeringSelectedKey);
  $('secretOfferingConfirmText').textContent=offeringSelectedKey?
    `${itemInfo(offeringSelectedKey).name} 1개를 소모합니다. ${isGoldenKey(offeringSelectedKey)?'영구 칭호 + 24시간 기절 보호·이동·점프 강화':'40분 이동·점프 강화 + 3% 확률의 산삼 힌트'}가 적용됩니다. 되돌릴 수 없습니다.`:
    '공양할 5성 채집물을 선택해 주세요.';
}
function openSecretOffering(){
  if(!inSecretCave||caveOffering||Math.hypot(P.x-caveBuddhaPoint.x,P.z-caveBuddhaPoint.z)>4.1)return;
  offeringSelectedKey='';renderOfferingItems();$('secretOfferingPanel').classList.remove('hide');
}
function makeCaveOfferModel(key){
  const base=goldBase(key),kind=itemKindOf(key),group=new THREE.Group();
  if(kind==='herb'){
    const plant=new THREE.Mesh(plantGeo(SPI[base],0),plantMat);
    group.add(plant);
  }else if(kind==='mush')group.add(mush3D(base));
  if(isGoldenKey(key))tintGoldenObject(group);
  const bounds=new THREE.Box3().setFromObject(group),sz=bounds.getSize(new THREE.Vector3());
  const size=Math.max(sz.x,sz.y,sz.z,.01);
  group.scale.setScalar(Math.min(1.6,.65/size));
  group.position.set(caveBuddhaPoint.x,.38,caveBuddhaPoint.z+1.1);
  group.traverse(o=>o.layers.set(1));scene.add(group);
  return group;
}
function startSecretOffering(){
  const key=offeringSelectedKey;
  // One guarded action checks distance, stock, valid species and current UI.
  if(caveOffering||!inSecretCave||!validOfferingKey(key)||!(save.inv[key]>0)||
    Math.hypot(P.x-caveBuddhaPoint.x,P.z-caveBuddhaPoint.z)>4.1){
    toast('공양할 재료 또는 위치를 확인해 주세요.');return;
  }
  const item=makeCaveOfferModel(key);
  caveOffering={key,elapsed:0,item};
  $('secretOfferingPanel').classList.add('hide');showCaveAction('');
  me.mode='bow';me.t=0;
  P.h=Math.atan2(caveBuddhaPoint.x-P.x,caveBuddhaPoint.z-P.z);
  sendPresence(true);
  netPublish('caveOffer',{cv:1,x:caveBuddhaPoint.x,z:caveBuddhaPoint.z});
}
function showCaveAchievement(title,key){
  const host=$('secretAchievement');host.replaceChildren();
  const prose=document.createElement('div');
  prose.textContent='산의 깊은 곳에서 발견한 귀한 영약이\n오랜 세월 잠들어 있던 불상 앞에 놓입니다.\n\n고요한 동굴에 황금빛이 번져갑니다.\n\n새로운 칭호를 획득했습니다.\n황금 불상의 보살핌이 24시간 이어집니다.\n칭호는 영원히 남습니다.';
  const name=document.createElement('strong');name.textContent='「'+title+'」';
  host.append(prose,name);host.classList.remove('hide');
  clearTimeout(achievementTimeout);achievementTimeout=setTimeout(()=>host.classList.add('hide'),4900);
}
function completeSecretOffering(){
  const offer=caveOffering;if(!offer)return;
  try{
    // No inventory is deducted until the full animation completes.
    const key=offer.key;if(!validOfferingKey(key)||!(save.inv[key]>0)){
      toast('공양 재료를 찾을 수 없어 취소되었습니다.');return;
    }
    save.inv[key]--;
    if(!save.inv[key])delete save.inv[key];
    const gold=isGoldenKey(key),title=gold?addSpecialTitle(key):'';
    const blessing=grantOfferingBuff(gold);
    persist();setGreens(me,totalCount());hudKey='';
    startCaveBlessingFx(gold);
    netPublish('caveBlessing',{cv:1,gold:gold?1:0,x:caveBuddhaPoint.x,z:caveBuddhaPoint.z});
    if(title){showCaveAchievement(title,key);tone(587,.6,'sine',.055,1,.18)}
    else {
      const hint=rollSansamOfferingHint();
      if(hint){toast(hint);toastT=9.5;tone(523,.8,'sine',.035,1,.12)}
      else toast(blessing.kind==='gold'?'황금 불상의 보살핌이 이어집니다.':'은은한 가호가 내려옵니다. 음식과 같은 힘이 40분간 이어집니다.');
      tone(392,.6,'sine',.035);
    }
    if(!$('bag').classList.contains('hide'))buildBag();
    sendPresence(true);
  }catch(error){
    console.warn('공양을 완료하지 못했습니다:',error);
    toast('공양 처리 중 문제가 발생했습니다. 저장 기록을 확인하세요.');
  }finally{
    if(offer.item?.parent)offer.item.parent.remove(offer.item);
    caveOffering=null;me.mode='idle';me.t=0;sendPresence(true);
  }
}
function updateSecretOffering(dt){
  if(!caveOffering)return;
  caveOffering.elapsed+=dt;
  if(caveOffering.item){
    const s=Math.max(0,Math.min(1,caveOffering.elapsed/.9));
    caveOffering.item.position.y=.38+Math.sin(s*Math.PI)*.2;
  }
  if(caveOffering.elapsed>=3.3)completeSecretOffering();
}
function renderSpecialTitlePanel(){
  const host=$('secretTitleList');host.replaceChildren();
  const titles=save.specialTitles?.unlocked||[],equipped=activeSpecialTitle();
  if(!titles.length){const p=document.createElement('p');p.textContent='아직 획득한 칭호가 없습니다. 황금 5성 채집물을 공양하면 얻을 수 있습니다.';host.appendChild(p)}
  const none=document.createElement('button');none.type='button';none.className='secret-title-choice'+(!equipped?' on':'');none.textContent='장착 해제 · 기존 레벨 칭호만 표시';
  none.onclick=()=>{setSpecialTitle('');renderSpecialTitlePanel()};host.appendChild(none);
  for(const title of titles){
    if(!validSpecialTitle(title))continue;
    const b=document.createElement('button');b.type='button';b.className='secret-title-choice golden'+(equipped===title?' on':'');
    b.textContent='✦ '+title+(equipped===title?' · 장착 중':'');
    b.onclick=()=>{setSpecialTitle(title);renderSpecialTitlePanel()};host.appendChild(b);
  }
}
function openSpecialTitles(){openRankMenu('special')}
$('secretOfferOpenBtn').addEventListener('click',openSecretOffering);
$('secretOfferingConfirm').addEventListener('click',startSecretOffering);
$('secretOfferingCancel').addEventListener('click',closeOffering);
$('secretOfferingPanel').addEventListener('click',e=>{if(e.target===$('secretOfferingPanel'))closeOffering()});
addEventListener('keydown',e=>{if(e.key==='Escape'){
  if(!$('secretOfferingPanel').classList.contains('hide'))closeOffering();
}});
