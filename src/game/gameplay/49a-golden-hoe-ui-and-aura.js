/* === GOLDEN HOE UI + MYSTERIOUS 30m PROXIMITY SIGNALS ===
 * Prompts disclose no compass direction, altitude, coordinate or map marker.
 * Enter-triggered once per approach: re-arm after leaving 36m radius.
 * Recover from GitHub Pages mixed HTML/bundle revisions: a missing optional
 * golden-hoe panel must NEVER abort the core entry/login binding code.
 */
function ensureGoldenHoeUiElements(){
  // Remove the large excavation panel even if a previous HTML revision is
  // temporarily cached by GitHub Pages. The actual hoe is tapped in-world.
  const obsolete=document.getElementById('goldenHoePanel');
  if(obsolete?.remove)obsolete.remove();
  // The completion celebration is a separate optional UI, retained intact.
  const old=$('goldenHoeAchievement');
  if(!old||!$('goldenHoeAchievementClose')){
    if(old?.remove)old.remove();
    const el=document.createElement('section');el.id='goldenHoeAchievement';el.className='hide';
  el.innerHTML=`<div class="goldenHoeAchievementSheet">
    <div class="goldenHoeRay">✦</div>
    <div class="goldenHoeEyebrow">백약산의 숨겨진 유산</div>
    <h2>황금 호미를 얻었다!</h2>
    <div class="goldenHoeEmblem" aria-hidden="true">⚒</div>
    <p class="goldenHoeLore">오랜 세월 바위에 잠들어 있던 황금 호미가<br>마침내 산객의 손에서 깨어났다.<br>번개가 산등성을 가르고 천둥이 울린다.</p>
    <div class="goldenHoeGift"><strong>✦ 황금 호미의 은총</strong><span>조심스러운 채집에 실패해도<br>채집물이 사라지지 않고 한 번 더 기회를 얻습니다.</span></div>
    <button id="goldenHoeAchievementClose" type="button">산행 계속하기</button>
  </div>`;
  el.setAttribute('role','dialog');el.setAttribute('aria-modal','false');el.setAttribute('aria-label','황금 호미 획득');
    document.body.appendChild(el);
  }
  // An older page may also omit the celebration stylesheet.
  if(!document.querySelector('link[href*="14-golden-hoe-ui.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';
    link.href='./styles/14-golden-hoe-ui.css?v=1.2.8-hoe30dots1';document.head.appendChild(link);
  }
}
let caveAuraNear=false,hoeAuraNear=false,lastAuraNoticeAt=-10000;
let goldenHoeAchievementTimer=0;
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
function showGoldenHoeAchievement(){
  const el=$('goldenHoeAchievement');
  if(!el){toast('✦ 황금 호미를 얻었다!');return;}
  el.classList.remove('hide');
  clearTimeout(goldenHoeAchievementTimer);
  goldenHoeAchievementTimer=setTimeout(()=>el.classList.add('hide'),7600);
}
ensureGoldenHoeUiElements();
$('goldenHoeAchievementClose')?.addEventListener('click',()=>{
  clearTimeout(goldenHoeAchievementTimer);$('goldenHoeAchievement')?.classList.add('hide');
});
