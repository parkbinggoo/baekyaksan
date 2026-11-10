/* === GOLDEN HOE UI + MYSTERIOUS 30m PROXIMITY SIGNALS ===
 * Prompts disclose no compass direction, altitude, coordinate or map marker.
 * Enter-triggered once per approach: re-arm after leaving 36m radius.
 */
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
  if(mode!=='game'||inTent||inSecretCave||save.goldenHoeOwned||goldenHoeBusy()||
     !onRock||onRock!==goldenHoeRock||!goldenHoeMesh?.visible){
    panel.classList.add('hide');return;
  }
  panel.classList.remove('hide');
  // Update at most ten times per second, except first show via dig button.
  if(clock-goldenHoePanelLastUpdate<.10)return;
  goldenHoePanelLastUpdate=clock;
  const n=goldenHoeAttempt?.hits||0,cool=goldenHoeCooldownLeft();
  $('goldenHoeProgress').textContent=n+' / '+GOLDEN_HOE_REQUIRED_HITS;
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
  el.classList.remove('hide');
  clearTimeout(goldenHoeAchievementTimer);
  goldenHoeAchievementTimer=setTimeout(()=>el.classList.add('hide'),7600);
}
$('goldenHoeDigBtn').addEventListener('click',()=>{interactGoldenHoe();goldenHoePanelLastUpdate=-1;updateGoldenHoePanel()});
$('goldenHoeAchievementClose').addEventListener('click',()=>{
  clearTimeout(goldenHoeAchievementTimer);$('goldenHoeAchievement').classList.add('hide');
});
