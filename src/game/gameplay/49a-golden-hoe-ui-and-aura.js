/* === GOLDEN HOE UI + MYSTERIOUS 30m PROXIMITY SIGNALS ===
 * Prompts disclose no compass direction, altitude, coordinate or map marker.
 * Enter-triggered once per approach: re-arm after leaving 36m radius.
 * Recover from GitHub Pages mixed HTML/bundle revisions: a missing optional
 * golden-hoe panel must NEVER abort the core entry/login binding code.
 */
function ensureGoldenHoeUiElements(){
  // The previous index.html does not contain the two new sections. GitHub
  // Pages may temporarily serve cached HTML with a freshly uploaded bundle.
  // Create optional UI nodes before binding events instead of throwing here.
  const panels=[
    {id:'goldenHoePanel',ids:['goldenHoeProgress','goldenHoeProgressBar','goldenHoeInstruction','goldenHoeDigBtn'],markup:`
      <div class="goldenHoeEyebrow">숨겨진 산의 유물</div>
      <div class="goldenHoePanelHead"><strong>✦ 황금 호미</strong><span id="goldenHoeProgress">0회<br>/ 30회</span></div>
      <div class="goldenHoeTrack" aria-hidden="true"><div id="goldenHoeProgressBar"></div></div>
      <p id="goldenHoeInstruction">바위 틈의 황금 호미 · 조심스럽게 30번 캐내세요.</p>
      <button id="goldenHoeDigBtn" type="button">조심히 캐기</button>`},
    {id:'goldenHoeAchievement',ids:['goldenHoeAchievementClose'],markup:`
      <div class="goldenHoeAchievementSheet">
        <div class="goldenHoeRay">✦</div>
        <div class="goldenHoeEyebrow">백약산의 숨겨진 유산</div>
        <h2>황금 호미를 얻었다!</h2>
        <div class="goldenHoeEmblem" aria-hidden="true">⚒</div>
        <p class="goldenHoeLore">오랜 세월 바위에 잠들어 있던 황금 호미가<br>마침내 산객의 손에서 깨어났다.<br>번개가 산등성을 가르고 천둥이 울린다.</p>
        <div class="goldenHoeGift"><strong>✦ 황금 호미의 은총</strong><span>조심스러운 채집에 실패해도<br>채집물이 사라지지 않고 한 번 더 기회를 얻습니다.</span></div>
        <button id="goldenHoeAchievementClose" type="button">산행 계속하기</button>
      </div>`}
  ];
  let missing=false;
  for(const panel of panels){
    const old=$(panel.id);
    if(old&&panel.ids.every(id=>!!$(id)))continue;
    if(old)old.remove();
    const el=document.createElement('section');el.id=panel.id;el.className='hide';
    el.innerHTML=panel.markup;
    if(panel.id==='goldenHoePanel')el.setAttribute('aria-label','황금 호미 채집');
    else{el.setAttribute('role','dialog');el.setAttribute('aria-modal','false');el.setAttribute('aria-label','황금 호미 획득')}
    document.body.appendChild(el);missing=true;
  }
  // Recover the associated stylesheet if an older HTML document omitted it.
  if(missing&&!document.querySelector('link[href*="14-golden-hoe-ui.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';
    link.href='./styles/14-golden-hoe-ui.css?v=1.2.8-buddha-hoe2';document.head.appendChild(link);
  }
}
let caveAuraNear=false,hoeAuraNear=false,lastAuraNoticeAt=-10000;
let goldenHoePanelLastUpdate=0,goldenHoeAchievementTimer=0;
function updateMysteriousAuraAlert(){
  if(mode!=='game'||inSecretCave||inTent)return;
  const caveDistance=caveSite?Math.hypot(P.x-caveSite.x,P.z-caveSite.z):Infinity;
  const hoeRock=save.goldenHoeOwned?null:ensureGoldenHoeRock();
  const hoeDistance=hoeRock?Math.hypot(P.x-hoeRock.x,P.z-hoeRock.z):Infinity;
  if(caveDistance>36)caveAuraNear=false;
  if(hoeDistance>36)hoeAuraNear=false;
  const caveArrived=caveDistance<=30&&!caveAuraNear;
  const hoeArrived=hoeDistance<=30&&!hoeAuraNear;
  if(caveDistance<=30)caveAuraNear=true;
  if(hoeDistance<=30)hoeAuraNear=true;
  if((caveArrived||hoeArrived)&&clock-lastAuraNoticeAt>12){
    lastAuraNoticeAt=clock;toast('심상치 않은 기운이 느껴진다...');
  }
}
function updateGoldenHoePanel(){
  const panel=$('goldenHoePanel');
  if(!panel)return;
  const nearHoe=!!goldenHoeMesh&&Math.hypot(P.x-goldenHoeMesh.position.x,P.z-goldenHoeMesh.position.z)<=1.25;
  if(mode!=='game'||inTent||inSecretCave||save.goldenHoeOwned||goldenHoeBusy()||
     !onRock||onRock!==goldenHoeRock||!goldenHoeMesh?.visible||!nearHoe){
    panel.classList.add('hide');return;
  }
  panel.classList.remove('hide');
  // Update at most ten times per second, except first show via dig button.
  if(clock-goldenHoePanelLastUpdate<.10)return;
  goldenHoePanelLastUpdate=clock;
  const n=goldenHoeAttempt?.hits||0,cool=goldenHoeCooldownLeft();
  $('goldenHoeProgress').innerHTML=n+'회<br>/ '+GOLDEN_HOE_REQUIRED_HITS+'회';
  $('goldenHoeProgressBar').style.width=(100*n/GOLDEN_HOE_REQUIRED_HITS)+'%';
  const button=$('goldenHoeDigBtn');button.disabled=cool>0;
  button.textContent=cool>0?'재도전 대기 중':'조심히 캐기';
  $('goldenHoeInstruction').textContent=cool>0?
    '바위가 다시 굳어 있다 · '+formatGoldenHoeCooldown(cool)+' 남음':
    n>0?'서두르면 실패합니다. 천천히, 정확하게 두드리세요.':
    '바위 틈의 황금 호미 · 조심스럽게 30번 캐내세요.';
}
function showGoldenHoeAchievement(){
  const el=$('goldenHoeAchievement');
  if(!el){toast('✦ 황금 호미를 얻었다!');return;}
  el.classList.remove('hide');
  clearTimeout(goldenHoeAchievementTimer);
  goldenHoeAchievementTimer=setTimeout(()=>el.classList.add('hide'),7600);
}
ensureGoldenHoeUiElements();
$('goldenHoeDigBtn')?.addEventListener('click',()=>{interactGoldenHoe();goldenHoePanelLastUpdate=-1;updateGoldenHoePanel()});
$('goldenHoeAchievementClose')?.addEventListener('click',()=>{
  clearTimeout(goldenHoeAchievementTimer);$('goldenHoeAchievement')?.classList.add('hide');
});
