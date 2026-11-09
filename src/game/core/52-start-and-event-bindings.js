/* ================= START ================= */
try{$('nick').value=localStorage.getItem('baekyaksan-last-nick')||save.nick||''}catch(e){$('nick').value=save.nick||''}
const sw=$('swatches');JACKETS.forEach((c,i)=>{const b=document.createElement('button');b.className='sw'+(i===(save.color|0)?' on':'');b.style.background='#'+c.toString(16).padStart(6,'0');b.title='옷 색';b.onclick=e=>{e.stopPropagation();save.color=i;setSwatchSelection()};sw.appendChild(b)});
$('profilePin').addEventListener('input',numericPin);
$('profilePin').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();enterProfile()}});
$('continueBtn').addEventListener('click',e=>{e.stopPropagation();enterProfile()});
let saveConfirmTrigger=null;
async function openSaveConfirm(trigger){
  if(!$('saveConfirm').classList.contains('hide'))return;
  saveConfirmTrigger=trigger;
  try{pendingSaveDoc=await prepareProfileForExport()}catch(e){pendingSaveDoc=null;saveMessage('저장 기록 준비에 실패했습니다.',true);console.error(e)}
  if(!pendingSaveDoc)return;
  const inKakao=/KAKAOTALK|KakaoTalk/i.test(navigator.userAgent);
  $('saveLocationTip').textContent=inKakao?
    '카카오톡 내부 브라우저는 파일 저장이 차단될 수 있습니다. Safari 또는 Chrome에서 게임 주소를 직접 열어 저장하세요.':
    'PC: 저장 폴더 선택 · 아이폰: 공유 메뉴에서 「파일에 저장」 · 갤럭시: 내 파일/다운로드에서 확인';
  $('saveConfirm').classList.remove('hide');
  $('saveConfirmYes').focus();
}
function closeSaveConfirm(){
  $('saveConfirm').classList.add('hide');
  pendingSaveDoc=null;
  const trigger=saveConfirmTrigger;saveConfirmTrigger=null;
  if(trigger&&trigger.isConnected)trigger.focus();
}
$('saveConfirmYes').addEventListener('click',()=>{
  // Start the OS picker/share sheet within this real user click; never await before it.
  const task=exportProfile(false);
  closeSaveConfirm();
  void task;
});
$('saveConfirmDownload').addEventListener('click',()=>{
  const task=exportProfile(true);
  closeSaveConfirm();
  void task;
});
$('saveConfirmNo').addEventListener('click',closeSaveConfirm);
$('saveConfirm').addEventListener('click',e=>{if(e.target===$('saveConfirm'))closeSaveConfirm()});
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('saveConfirm').classList.contains('hide')){
    e.preventDefault();e.stopImmediatePropagation();closeSaveConfirm();
  }
},true);
$('saveFileBtn').addEventListener('click',e=>{e.stopPropagation();openSaveConfirm(e.currentTarget)});
$('loadFileBtn').addEventListener('click',e=>{e.stopPropagation();if(!cleanNick($('nick').value)||!/^[0-9]{4}$/.test(numericPin())){profileNotice('닉네임과 4자리 코드를 먼저 입력해 주세요.',true);return}$('loadSaveInput').click()});
$('loadSaveInput').addEventListener('change',e=>importProfileFile(e.target.files[0]));
$('hudSaveBtn').addEventListener('click',e=>{e.stopPropagation();openSaveConfirm(e.currentTarget)});
function takeMemorialPhoto(){
  if(mode!=='game')return;
  try{
    // WebGL has no DOM HUD; render directly and composite the CSS sky background.
    const cameraNow=inTent?tentCam:camera,sceneNow=inTent?tentScene:scene;
    renderer.render(sceneNow,cameraNow);
    const source=renderer.domElement,photo=document.createElement('canvas');
    photo.width=source.width;photo.height=source.height;
    const ctx=photo.getContext('2d');if(!ctx)throw new Error('캔버스 만들기 실패');
    const sky=skyAtHour(gameMin/60),gradient=ctx.createLinearGradient(0,0,0,photo.height);
    gradient.addColorStop(0,inTent?sky.top:_skyFogTop.getStyle());gradient.addColorStop(1,inTent?sky.bot:_skyFogBottom.getStyle());
    ctx.fillStyle=inTent?'#050505':gradient;ctx.fillRect(0,0,photo.width,photo.height);
    ctx.drawImage(source,0,0,photo.width,photo.height);
    const image=photo.toDataURL('image/png'),a=document.createElement('a');
    const now=new Date(),day=now.toISOString().slice(0,10);
    a.download=`백약산_기념사진_${day}_${Math.min(SUMMIT_ALT,Math.round(P.y*ALT_K))}m.png`;
    a.href=image;document.body.appendChild(a);a.click();a.remove();
    toast('📷 게임 화면만 촬영했습니다. 사진 저장을 확인해 주세요.');
  }catch(e){console.warn('기념사진 저장 실패',e);toast('이 브라우저에서는 사진을 저장하지 못했습니다.');}
}
$('photoBtn').addEventListener('click',e=>{e.stopPropagation();takeMemorialPhoto()});
$('tentExitBtn').addEventListener('click',closeTent);
$('tentChest').addEventListener('click',openSellPanel);
$('sellCloseBtn').addEventListener('click',closeSellPanel);
$('sellMinus').addEventListener('click',()=>{if(!selectedSellKey)return; $('sellQty').value=Math.max(1,currentSellQty()-1); updateSellSummary()});
$('sellPlus').addEventListener('click',()=>{if(!selectedSellKey)return; const have=save.inv[selectedSellKey]||1; $('sellQty').value=Math.min(have,currentSellQty()+1); updateSellSummary()});
$('sellQty').addEventListener('input',updateSellSummary);
$('sellSort').addEventListener('change',buildSellGrid);
$('sellDoBtn').addEventListener('click',sellSelected);
$('tentView').addEventListener('click',e=>{if(e.target===$('tentView')){if(!$('sellPanel').classList.contains('hide'))closeSellPanel();else closeTent()}});
addEventListener('keydown',e=>{if(e.code==='Escape'&&inTent){if(!$('sellPanel').classList.contains('hide'))closeSellPanel();else closeTent()}});
addEventListener('pagehide',()=>{if(mode==='game')persist()});
function beginGame(){
  if(mode==='game')return;
  // Immediate screen transition matches the previously working build.
  // Do not block this button on audio, terrain, networking or summit generation.
  const jacket=JACKETS[((save.color|0)%JACKETS.length+JACKETS.length)%JACKETS.length];
  scene.remove(me.root);
  const nm=makeHiker(jacket);Object.assign(me,nm);scene.add(me.root);
  me.root.position.set(P.x,P.y,P.z);setGreens(me,totalCount());
  camera.position.set(P.x-Math.sin(camYaw)*7.7,P.y+3.2,P.z-Math.cos(camYaw)*7.7);
  mode='game';
  $('intro').classList.add('hide');$('iosClouds').style.display='none';
  $('hud').classList.remove('hide');$('fade').classList.remove('on');
  if(IS_TOUCH){$('joy').classList.remove('hide');$('jumpBtn').classList.remove('hide')}
  if(save.pos)toast(`지난번 오르던 해발 ${Math.round(P.y*ALT_K)}m에서 다시 걷는다`);
  myRankTag.style.display='';
  // The update loop streams the nearby terrain incrementally. Heavy scenery
  // stays outside of the login tap; an optional failure cannot undo entry.
  setTimeout(()=>{
    if(mode!=='game')return;
    try{ensureTents()}catch(e){console.warn('텐트 생성 오류',e)}
    try{ensureSummit()}catch(e){console.warn('정상 조형물 생성 오류',e)}
    try{updateTents()}catch(e){console.warn('텐트 표시 오류',e)}
  },450);
  setTimeout(()=>{if(mode==='game')try{ambInit()}catch(e){console.warn('산속 효과음 건너뜀',e)}},100);
  setTimeout(()=>{if(mode==='game')try{connectRoom()}catch(e){console.warn('멀티플레이 연결 오류',e)}},250);
}
let last=performance.now();
let lastDraw=0;
function frame(now){requestAnimationFrame(frame);
  const covered=mapOpen||!$('bag').classList.contains('hide'),cap=covered?8:PERF.fps;
  if(now-lastDraw<1000/cap-2)return;lastDraw=now;
  const raw=(now-last)/1000,dt=Math.min(.05,raw);last=now;clock+=dt;
  if(mode==='intro')drawIntro(Math.min(.25,raw));else{
    try{updateGame(dt)}catch(e){
      if(now-(frame.lastGameError||0)>10000){frame.lastGameError=now;console.warn('게임 갱신 일부 오류:',e)}
      // Scenery must keep streaming even if a separate game system fails.
      try{updateChunks(P.x,P.z,false,dt)}catch(terrainError){console.warn('산길 표시 재시도:',terrainError)}
    }
    if(inTent){try{syncTentChestButton();updateTentSeats(dt)}catch(e){console.warn('텐트 표시 오류:',e)}}
    renderer.render(inTent?tentScene:scene,inTent?tentCam:camera)
  }}
addEventListener('resize',onResize);addEventListener('resize',()=>{if(inTent)syncTentChestButton()});applyPerf();requestAnimationFrame(frame);
$('ecoBtn').onclick=()=>{PERF.eco=!PERF.eco;applyPerf();chunkKey='';toast(PERF.eco?'절전 모드: 화질과 시야를 줄여 가볍게 돌립니다':'절전 모드 해제')};
function jump(){if(mode==='game'&&!climbing&&!onRock&&!inTent&&Date.now()>=faintUntil&&!P.air&&me.mode!=='dig'&&!cooking){P.vy=5.2*(mealBoosted()?MEAL_JUMP_MULT:1);P.air=true}}
$('jumpBtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();climbAct()});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('visibilitychange',()=>{if(!AMB)return;if(document.hidden)AMB.a.suspend();else AMB.a.resume()});
})();
