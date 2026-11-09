function refreshBagUpgrade(){
 const cap=bagLimit(),next=cap>=BAG_MAX?null:cap+10,cost=next?BAG_UPGRADE_COST[next]:0;
 const label=next?`가방 확장 ${Math.round((next-10)/10)}/${BAG_STAGE_COUNT}단계 · 현재 ${cap}칸 → ${next}칸\n구매 비용 ${won(cost)} · 보유 금액 ${won(+save.won||0)}`:`가방 확장 ${BAG_STAGE_COUNT}/${BAG_STAGE_COUNT}단계 완료 · 현재 ${cap}칸 · 최대 용량입니다!`;
 $('bagUpgradeInfo').textContent=label;$('bagUpgradeInfo').style.whiteSpace='pre-line';
 $('bagUpgradeBuy').classList.toggle('hide',!next);$('bagUpgradeBuy').disabled=!!next&&(+save.won||0)<cost;
 $('bagUpgradeBuy').textContent=next?`${next}개 확장 · ${won(cost)}`:'확장 완료';
 $('bagUpgradeBtn').textContent='🎒 가방 '+cap+'칸';
}
function openBagUpgrade(){if(!inTent)return;closeSellPanel();$('lanternUpgradePanel').classList.add('hide');refreshBagUpgrade();$('bagUpgradePanel').classList.remove('hide')}
function buyBagUpgrade(){
 if(!inTent)return;const cap=bagLimit(),next=cap+10;
 if(next>BAG_MAX){toast(`가방은 이미 최대 ${BAG_MAX}칸입니다`);return}
 const price=BAG_UPGRADE_COST[next];if((+save.won||0)<price){toast('정산금이 부족합니다 · '+won(price)+' 필요');refreshBagUpgrade();return}
 save.won-=price;save.bagCap=next;persist();hudKey='';updateTentMoney();refreshBagUpgrade();refreshLanternUpgrade();
 toast(`🎒 가방 ${next}칸으로 확장! ${won(price)} 사용`);
}
$('bagUpgradeBtn').addEventListener('click',openBagUpgrade);
$('bagUpgradeClose').addEventListener('click',()=>$('bagUpgradePanel').classList.add('hide'));
$('bagUpgradeBuy').addEventListener('click',buyBagUpgrade);
function refreshLanternUpgrade(){
 const lv=lanternLevel(),next=lv<3?lv+1:null,cost=next?LANTERN_PRICES[next]:0;
 const effects=lv===1?'기본 랜턴 · 전방 조명':lv===2?'전방이 더 넓고 멀리 밝아짐':'전방 최대 조명 + 가방 뒤 작은 랜턴';
 const nextEffect=next===2?'2단계: 전방 빛의 폭과 거리가 늘어납니다.':'3단계: 전방 조명이 더 강해지고, 가방 뒤쪽에도 작은 랜턴이 켜집니다.';
 $('lanternUpgradeInfo').textContent=next?`현재 ${lv}/3단계 · ${effects}\n\n${nextEffect}\n구매 비용 ${won(cost)} · 보유 금액 ${won(+save.won||0)}\n※ 순서대로 구매할 수 있습니다.`:`3/3단계 완료 · ${effects}\n최대 단계입니다!`;
 $('lanternUpgradeBuy').classList.toggle('hide',!next);
 $('lanternUpgradeBuy').disabled=!!next&&(+save.won||0)<cost;
 $('lanternUpgradeBuy').textContent=next?`${next}단계 구매 · ${won(cost)}`:'업그레이드 완료';
 $('lanternUpgradeBtn').textContent=`🔦 랜턴 ${lv}단계`;
}
function openLanternUpgrade(){if(!inTent)return;closeSellPanel();$('bagUpgradePanel').classList.add('hide');refreshLanternUpgrade();$('lanternUpgradePanel').classList.remove('hide')}
function buyLanternUpgrade(){
 if(!inTent)return;const lv=lanternLevel(),next=lv+1;
 if(next>3){toast('랜턴은 이미 최고 단계입니다');return}
 const cost=LANTERN_PRICES[next];if((+save.won||0)<cost){toast('정산금이 부족합니다 · '+won(cost)+' 필요');refreshLanternUpgrade();return}
 save.won-=cost;save.lanternLevel=next;persist();updateTentMoney();refreshLanternUpgrade();
 toast(`🔦 랜턴 ${next}단계 장착! ${won(cost)} 사용`);sendPresence(true);
}
$('lanternUpgradeBtn').addEventListener('click',openLanternUpgrade);
$('lanternUpgradeClose').addEventListener('click',()=>$('lanternUpgradePanel').classList.add('hide'));
$('lanternUpgradeBuy').addEventListener('click',buyLanternUpgrade);
