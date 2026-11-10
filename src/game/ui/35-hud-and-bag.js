/* ---------- HUD ---------- */
const MILES=['솔바람이 등을 민다','능선 너머로 다른 산들이 내려앉는다','구름이 가까워진다','구름 위로 올라섰다. 산들이 섬처럼 떠 있다','공기가 차갑다. 귀한 것들의 기운이 짙다','노을이 산을 물들인다','별이 머리 위로 쏟아진다','아무도 와 본 적 없는 높이'];
let lastMile=-1,toastT=0;
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('on');toastT=3}
let hudKey='';
function updHud(){const alt=Math.max(0,Math.min(SUMMIT_ALT,Math.round(P.y*ALT_K))),ph=phaseOf(gameMin/60),ck=clockText(),k=alt+'|'+ck+'|'+totalCount()+'|'+discoveredCount()+'|'+bagLimit()+'|'+playerRank+'|'+(inSecretCave?'cave':'mountain');if(k!==hudKey){hudKey=k;$('altLabel').textContent=inSecretCave?'장소':'해발';$('altMeters').textContent=inSecretCave?'비밀 동굴':`${alt.toLocaleString()}m`;$('clock').textContent=`${ph} · ${ck}`;$('count').textContent=`가방 ${totalCount()}/${bagLimit()} · 도감 ${discoveredCount()}/${HERB_KEYS.length+MUSH_KEYS.length+Object.keys(FRUITS).length+HONEY_KEYS.length}종`}
  const buff=$('mealBuff'),active=mealBoosted();buff.classList.toggle('hide',!active);
  if(active)buff.textContent=`🍲 산속 한 끼 · 속도, 점프 증가 · 남은 ${Math.ceil((save.mealBuffUntil-Date.now())/60000)}분`;
  const m=Math.floor(alt/300);if(lastMile<0)lastMile=m;if(m>lastMile){lastMile=m;toast(`해발 ${m*300}m — ${MILES[Math.min(MILES.length-1,m-1)]}`);tone(392,.4,'sine',.06);tone(587,.6,'sine',.05,1,.15)}}
$('bagBtn').onclick=()=>{buildBag();$('bag').classList.remove('hide')};
$('bagClose').onclick=()=>$('bag').classList.add('hide');
$('bag').addEventListener('pointerdown',e=>{if(e.target.id==='bag')$('bag').classList.add('hide')});
function buildBag(){
  const host=$('bagBody');host.innerHTML='';
  const meta=document.createElement('div');meta.className='bagMeta';
  meta.textContent=`현재 ${totalCount()}/${bagLimit()}개`;
  host.appendChild(meta);
  const wallet=document.createElement('div');wallet.className='bagWallet';
  wallet.textContent=`정산금 ${won(+save.won||0)}`;host.appendChild(wallet);
  const twigs=document.createElement('div');twigs.className='bagMeta';twigs.textContent=`🪵 나뭇가지 ${save.inv[TWIG_KEY]||0}개 · 빈 나무를 두드려 획득 · 캠프파이어 6개 필요`;
  host.appendChild(twigs);
  const goldHave=GOLD_FIVE_BASES.filter(k=>(save.inv[goldenKey(k)]||0)>0);
  const goldFound=GOLD_FIVE_BASES.filter(k=>save.goldKnown?.[k]);
  const goldHead=document.createElement('h4');goldHead.textContent='✦ 황금 5성 · '+goldFound.length+'/'+GOLD_FIVE_BASES.length+'종 발견 · 판매 불가';host.appendChild(goldHead);
  const goldGrid=document.createElement('div');goldGrid.className='grid';host.appendChild(goldGrid);
  for(const base of GOLD_FIVE_BASES){const key=goldenKey(base),have=save.inv[key]||0,known=!!save.goldKnown?.[base]||have>0;
    const c=document.createElement('div');c.className='card golden-card'+(known?'':' unk');
    // 미발견: 일반 도감과 동일한 원본 식물·버섯 아이콘의 회색 실루엣. 발견 후에만 황금 모델 표시.
    const img=document.createElement('img');img.src=iconURL(itemKindOf(base),known?key:base);img.alt=known?'황금 '+itemInfo(base).name+' 3D 도감 이미지':'';c.appendChild(img);
    const name=document.createElement('div');name.className='n';name.textContent=known?'황금 '+itemInfo(base).name:'???';
    const meta=document.createElement('div');meta.className='c';meta.textContent=known?have+'개 보유 · 공양 전용':'★★★★★ · 미발견';
    c.append(name,meta);if(known){c.classList.add('click');c.onclick=()=>showInfoCard(itemKindOf(key),key,true)}goldGrid.appendChild(c);
  }
  const groups=[['root','뿌리·덩이 약초 (땅속)'],['leaf','산나물'],['herb','약초'],['mush','산속 버섯'],['fruit','숲에서 떨어지는 열매'],['honey','야생 벌꿀']];
  for(const [cat,title] of groups){
    const keys=cat==='fruit'?Object.keys(FRUITS):cat==='mush'?MUSH_KEYS:cat==='honey'?HONEY_KEYS:HERB_KEYS.filter(k=>HERBS[k].cat===cat);
    const got=keys.filter(k=>(save.known||{})[k]).length;
    const h=document.createElement('h4');h.textContent=`${title} · ${got}/${keys.length}`;host.appendChild(h);
    const grid=document.createElement('div');grid.className='grid';host.appendChild(grid);
    for(const key of keys){const info=itemInfo(key),have=save.inv[key]||0,known=!!((save.known||{})[key]);
      const c=document.createElement('div');c.className='card'+(known?'':' unk');
      const img=document.createElement('img');img.src=iconURL(cat==='fruit'?'fruit':cat==='mush'?'mush':cat==='honey'?'honey':'herb',key);img.alt='';c.appendChild(img);
      const n=document.createElement('div');n.className='n';n.textContent=known?info.name:'???';
      const cc=document.createElement('div');cc.className='c';
      cc.textContent=!known?`${'★'.repeat(info.rar)} · 아직 못 찾음`:`${have}개 · ${'★'.repeat(info.rar)}`;
      c.appendChild(n);c.appendChild(cc);
      if(known&&info.hab){const hb=document.createElement('div');hb.className='hb';hb.textContent=info.hab+' · '+info.desc;c.appendChild(hb)}
      if(known){c.classList.add('click');c.onclick=()=>showInfoCard(cat==='fruit'?'fruit':cat==='mush'?'mush':cat==='honey'?'honey':'herb',key,true)}
      grid.appendChild(c)}
  }
}
