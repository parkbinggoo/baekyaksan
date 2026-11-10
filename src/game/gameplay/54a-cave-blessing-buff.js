/* === FIVE-STAR BUDDHA BLESSING / REAL-TIME BUFF ===
 * Duration is wall-clock time and is persisted with each profile.
 * A regular offering never downgrades an active golden blessing.
 */
const CAVE_NORMAL_BUFF_MS=40*60*1000,CAVE_GOLD_BUFF_MS=24*60*60*1000;
function offeringBuffState(now=Date.now()){
  const until=+save.offeringBuffUntil||0,kind=save.offeringBuffKind;
  return until>now&&(kind==='normal'||kind==='gold')?{kind,until}:null;
}
function grantOfferingBuff(golden,now=Date.now()){
  const current=offeringBuffState(now);
  if(!golden&&current?.kind==='gold')return current;
  const kind=golden?'gold':'normal';
  const duration=golden?CAVE_GOLD_BUFF_MS:CAVE_NORMAL_BUFF_MS;
  save.offeringBuffKind=kind;save.offeringBuffUntil=now+duration;
  return {kind,until:save.offeringBuffUntil};
}
// A Buddha blessing grants the exact same strength as a cooked meal.
// Overlapping meal and offering timers extend availability, NOT movement power.
function offeringSpeedMultiplier(now=Date.now()){
  return (+save.mealBuffUntil||0)>now||!!offeringBuffState(now)?MEAL_SPEED_MULT:1;
}
function offeringJumpMultiplier(now=Date.now()){
  return (+save.mealBuffUntil||0)>now||!!offeringBuffState(now)?MEAL_JUMP_MULT:1;
}
function goldenBuddhaProtects(now=Date.now()){
  return offeringBuffState(now)?.kind==='gold';
}
// Regular 5-star offerings reveal a poetic, intentionally imprecise clue with 3% odds.
// It refers to a real available ginseng slot, but never reveals a coordinate or map pin.
function rollSansamOfferingHint(random=Math.random){
  if(random()>=.03)return '';
  const sites=TARGETED_FIVE_STAR_SITES.sansam.filter(site=>
    !takenUntil(`${site.chunk}:fiveStar-sansam-${site.index}`));
  if(!sites.length)return '';
  const site=sites[Math.floor(random()*sites.length)],alt=H(site.x,site.z)*ALT_K;
  const height=alt<750?'숨결이 아직 따뜻한 낮은 숲':alt<1350?
    '산허리를 감싸는 짙은 나무 그늘':'서늘한 바람이 맴도는 높은 숲';
  const leaf='솔잎 사이로 떨어진 빛이 오래된 흙을 어루만지는 곳';
  return `석불의 속삭임… 「${height}, ${leaf}. 땅속 깊은 귀한 뿌리가 잠들어 있도다.」`;
}
function updateOfferingBuffHud(){
  const el=$('offeringBuff'),buff=offeringBuffState();
  if(!el)return;
  el.classList.toggle('hide',!buff);
  if(!buff)return;
  const mins=Math.ceil((buff.until-Date.now())/60000);
  const remaining=mins>=60?`${Math.floor(mins/60)}시간 ${mins%60}분`:`${mins}분`;
  el.textContent=(buff.kind==='gold'?'✦ 황금 불상의 보살핌':'✧ 불상의 가호')+
    ` · 음식과 동일한 속도·점프`+(buff.kind==='gold'?' · 기절 보호':'')+` · ${remaining} 남음`;
}
