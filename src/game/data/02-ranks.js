// Herb-hunter ranks. All conditions are cumulative, never tied to mountain altitude.
const RANKS=[
 {name:'풋내기',discover:0,harvest:0},
 {name:'풀내음꾼',discover:5,harvest:10},
 {name:'산나물꾼',discover:12,harvest:30},
 {name:'약초지기',discover:20,harvest:70},
 {name:'심산객',discover:30,harvest:120,rar3:5},
 {name:'본초꾼',discover:40,harvest:180,care:20},
 {name:'심마니',discover:50,harvest:250,sansam:1},
 {name:'백초장인',discover:65,harvest:350,rar4:10},
 {name:'산신지기',discover:75,harvest:500,rar5:5},
 {name:'백약산주',discover:88,harvest:700,sansam:3},
 {name:'백약선인',allHeld:true,rareFiveHeld:true}
];
function rankStats(){return save.stats||{totalCollected:0,careSuccess:0,sansamCollected:0,harvestedTypes:{}}}
function uniqueRareAtLeast(stars){
 const entries=(rankStats().harvestedTypes||{});
 return Object.keys(entries).filter(k=>entries[k]&&itemInfo(k)&&itemInfo(k).rar>=stars).length;
}
// The final rank is based on actual simultaneous inventory, not discoveries or past sales.
// Fruits are excluded: the requirement is all herbs, mountain greens, wild plants and mushrooms.
function masterInventoryProgress(){
 const keys=[...HERB_KEYS,...MUSH_KEYS];
 // Honey is an additional category: only its five-star native honey is part
 // of the 'hold three of every five-star resource' mastery requirement.
 const rare5=[...keys,...HONEY_KEYS].filter(k=>itemInfo(k).rar===5);
 const held=keys.filter(k=>(save.inv[k]||0)>=1);
 const heldRare=rare5.filter(k=>(save.inv[k]||0)>=3);
 return {keys,rare5,held,heldRare,
   missing:keys.filter(k=>(save.inv[k]||0)<1),
   missingRare:rare5.filter(k=>(save.inv[k]||0)<3),
   minimumSlots:keys.length+rare5.reduce((n,k)=>n+(keys.includes(k)?2:3),0)};
}
function rankGoals(level){
 const r=RANKS[level-1],st=rankStats(),goals=[];
 if(r.discover)goals.push({label:'도감 발견',now:discoveredCount(),required:r.discover,unit:'종'});
 if(r.harvest)goals.push({label:'누적 채집',now:st.totalCollected||0,required:r.harvest,unit:'개'});
 if(r.rar3)goals.push({label:'3성 이상 서로 다른 품목 채집',now:uniqueRareAtLeast(3),required:r.rar3,unit:'종'});
 if(r.rar4)goals.push({label:'4성 이상 서로 다른 품목 채집',now:uniqueRareAtLeast(4),required:r.rar4,unit:'종'});
 if(r.rar5)goals.push({label:'5성 희귀 품목 채집',now:uniqueRareAtLeast(5),required:r.rar5,unit:'종'});
 if(r.care)goals.push({label:'조심스러운 채집 성공',now:st.careSuccess||0,required:r.care,unit:'회'});
 if(r.sansam)goals.push({label:'산삼 채집',now:st.sansamCollected||0,required:r.sansam,unit:'회'});
 if(r.allHeld||r.rareFiveHeld){
  const inv=masterInventoryProgress();
  if(r.allHeld)goals.push({label:'약초·나물·식물·버섯 종류별 1개 이상 보유',now:inv.held.length,required:inv.keys.length,unit:'종'});
  if(r.rareFiveHeld)goals.push({label:'5성 재료 종류별 3개 이상 보유',now:inv.heldRare.length,required:inv.rare5.length,unit:'종'});
 }
 return goals;
}
function earnedRank(){let rank=1;for(let l=2;l<=RANKS.length;l++){
 if(!rankGoals(l).every(g=>g.now>=g.required))break;rank=l;
}return rank}
let playerRank=1;
function rankLabel(l=playerRank){return 'Lv.'+l+' · '+RANKS[Math.max(0,Math.min(RANKS.length-1,l-1))].name}
function recordHerbHarvest(type,info,wasCarefulDig){
 if(!save.stats)save.stats={totalCollected:0,careSuccess:0,sansamCollected:0,harvestedTypes:{}};
 const st=save.stats;st.totalCollected=(st.totalCollected||0)+1;
 if(!st.harvestedTypes)st.harvestedTypes={};st.harvestedTypes[type]=1;
 if(wasCarefulDig&&info&&info.care)st.careSuccess=(st.careSuccess||0)+1;
 if(type==='sansam')st.sansamCollected=(st.sansamCollected||0)+1;
 const next=earnedRank();if(next>playerRank){playerRank=next;save.highestRank=playerRank;toast('🌿 승급! '+rankLabel());tone(659,.3,'sine',.065);sendPresence(true)}
}
function renderRankGuide(){
 const progress=$('rankProgress'),guide=$('rankGuide');progress.replaceChildren();guide.replaceChildren();
 const current=document.createElement('strong');current.textContent=rankLabel();progress.appendChild(current);
 const desc=document.createElement('div');desc.textContent='도감 '+discoveredCount()+'종 · 누적 채집 '+(rankStats().totalCollected||0)+'개';progress.appendChild(desc);
 if(playerRank>=RANKS.length){const done=document.createElement('div');done.textContent='백약산 최고 등급에 도달했습니다!';progress.appendChild(done)}
 else{const next=document.createElement('div');next.style.marginTop='5px';next.textContent='다음 목표: Lv.'+(playerRank+1)+' '+RANKS[playerRank].name;progress.appendChild(next);
  for(const g of rankGoals(playerRank+1)){const line=document.createElement('div');line.className='rankGoal '+(g.now>=g.required?'done':'pending');line.textContent=(g.now>=g.required?'✓ ':'○ ')+g.label+' '+g.now+'/'+g.required+g.unit;progress.appendChild(line)}
  if(playerRank+1===11){
    const inv=masterInventoryProgress();
    const details=document.createElement('div');details.className='rankGoal pending';
    const needs=inv.missing.slice(0,6).map(k=>itemInfo(k).name);
    const rareNeeds=inv.missingRare.map(k=>`${itemInfo(k).name} ${3-(save.inv[k]||0)}개`);
    details.textContent=`최소 필요 가방 공간 ${inv.minimumSlots}칸 · 남은 미보유 품목 ${inv.missing.length}종`+
     (needs.length?' · '+needs.join(', ')+(inv.missing.length>6?' 외':''):'')+
     (rareNeeds.length?' · 5성 부족: '+rareNeeds.join(', '):'');
    progress.appendChild(details);
  }}
 for(let l=1;l<=RANKS.length;l++){
  const section=document.createElement('div');section.className='rankTier'+(l===playerRank?' current':'');
  const label=document.createElement('strong');label.textContent='Lv.'+l+' · '+RANKS[l-1].name;section.appendChild(label);
  const goals=document.createElement('div');goals.textContent=l===1?'첫 입장 시 자동 부여':rankGoals(l).map(g=>g.label+' '+g.required+g.unit).join(' · ');section.appendChild(goals);guide.appendChild(section);
 }
}
function itemInfo(key){if(isGoldenKey(key)){const base=goldBase(key),ref=HERBS[base]||MUSH[base];return {...ref,name:'황금 '+ref.name,desc:ref.desc+' 황금빛 희귀 개체 · 판매 불가 · 공양 가능'}}return HERBS[key]||MUSH[key]||FRUITS[key]||HONEY[key]||null}
function itemKindOf(key){key=goldBase(key);return HONEY[key]?'honey':FRUITS[key]?'fruit':MUSH[key]?'mush':HERBS[key]?'herb':null}
function itemPrice(key){
  if(isGoldenKey(key))return 0; // Defence in depth: never attach a market price.
  if(MARKET_PRICE[key])return MARKET_PRICE[key];
  const info=itemInfo(key);if(!info)return 0;
  const base=info.cat==='root'?950:info.cat==='leaf'?600:info.cat==='herb'?750:850;
  return Math.round(base*([1,.9,1.5,2.3,5,12][Math.max(1,Math.min(5,info.rar||1))])/50)*50;
}
