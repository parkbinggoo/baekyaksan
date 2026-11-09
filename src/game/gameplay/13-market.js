const SELL_CATEGORIES=[['all','전체'],['herb','약초'],['leaf','나물'],['mush','버섯'],['fruit','열매'],['honey','벌꿀']];
let sellCategory='all';
function sellableKeys(){return [...HERB_KEYS,...MUSH_KEYS,...Object.keys(FRUITS),...HONEY_KEYS].filter(k=>(save.inv[k]||0)>0)}
function sellCategoryOf(k){if(HONEY[k])return 'honey';if(FRUITS[k])return 'fruit';if(MUSH[k])return 'mush';return HERBS[k]?.cat==='leaf'?'leaf':'herb'}
function buildSellTabs(){
 const host=$('sellTabs');host.replaceChildren();
 for(const [id,label] of SELL_CATEGORIES){const b=document.createElement('button');b.type='button';b.className=id===sellCategory?'on':'';b.textContent=label;b.onclick=()=>{sellCategory=id;selectedSellKey='';buildSellTabs();buildSellGrid()};host.appendChild(b)}
}
function filteredSellKeys(){const sort=$('sellSort').value;return sellableKeys().filter(k=>sellCategory==='all'||sellCategoryOf(k)===sellCategory).sort((a,b)=>
 sort==='price_desc'?itemPrice(b)-itemPrice(a):sort==='price_asc'?itemPrice(a)-itemPrice(b):sort==='qty_desc'?(save.inv[b]||0)-(save.inv[a]||0):itemInfo(a).name.localeCompare(itemInfo(b).name,'ko'));}
function openSellPanel(){
 if(!sellableKeys().length){toast('가방에 판매할 채집물이 없습니다');return}
 sellCategory='all';selectedSellKey='';$('sellSort').value='price_desc';
 $('bagUpgradePanel').classList.add('hide');$('lanternUpgradePanel').classList.add('hide');$('sellPanel').classList.remove('hide');buildSellTabs();buildSellGrid();
}
function closeSellPanel(){$('sellPanel').classList.add('hide');selectedSellKey=''}
function buildSellGrid(){
 const host=$('sellGrid');host.replaceChildren();const keys=filteredSellKeys();
 if(!keys.length){const empty=document.createElement('p');empty.style.cssText='font-size:13px;opacity:.72;padding:12px';empty.textContent=sellableKeys().length?'이 종류의 판매할 채집물이 없습니다.':'가방이 비었습니다.';host.appendChild(empty);selectedSellKey='';$('sellInfo').textContent='판매할 품목을 선택해 주세요.';$('sellSummary').textContent='채집물 한 개는 게임 속 채집 단위입니다.';return;}
 for(const key of keys){const info=itemInfo(key),have=save.inv[key]||0,price=itemPrice(key);
   const b=document.createElement('button');b.type='button';b.dataset.key=key;
   b.className='sellItem'+(selectedSellKey===key?' on':'');
   const nm=document.createElement('div');nm.className='name';nm.textContent=info.name;
   const meta=document.createElement('div');meta.className='meta';meta.textContent=`${have}개 보유 · 개당 ${won(price)}`;
   b.append(nm,meta);b.onclick=()=>selectSellItem(key);host.appendChild(b);
 }
 if(!selectedSellKey||!(save.inv[selectedSellKey]>0)||!keys.includes(selectedSellKey))selectSellItem(keys[0]);
 else updateSellSummary();
}
function selectSellItem(key){
 selectedSellKey=key;
 for(const b of $('sellGrid').children)b.classList.toggle('on',b.dataset.key===key);
 const info=itemInfo(key),have=save.inv[key]||0,price=itemPrice(key);
 $('sellQty').value=1;$('sellQty').max=have;
 $('sellInfo').textContent=`${info.name} · ${have}개 보유 · 게임 기준 ${won(price)}/개`;
 updateSellSummary();
}
function currentSellQty(){if(!selectedSellKey)return 0;const have=save.inv[selectedSellKey]||0;const v=Math.max(1,Math.min(have||1,parseInt($('sellQty').value)||1));$('sellQty').value=v;return v}
function updateSellSummary(){
 if(!selectedSellKey||!(save.inv[selectedSellKey]>0)){ $('sellSummary').textContent='판매할 품목을 선택해 주세요.';return }
 const q=currentSellQty();$('sellSummary').textContent=`${q}개 판매 시 ${won(q*itemPrice(selectedSellKey))} · 판매하면 가방에서 차감됩니다.`;
}
function sellSelected(){
 const key=selectedSellKey,have=save.inv[key]||0;if(!key||!have)return;
 const q=currentSellQty(),sum=q*itemPrice(key),name=itemInfo(key).name;
 const balance=Math.max(0,have-q);
 if(balance)save.inv[key]=balance;else delete save.inv[key];
 save.won=(+save.won||0)+sum;
 save.known=save.known||{};save.known[key]=1;
 persist();hudKey='';updateTentMoney();setGreens(me,totalCount());
 selectedSellKey='';buildSellGrid();if(!$('bag').classList.contains('hide'))buildBag();
 toast(`${name} ${q}개 판매 · ${won(sum)} 획득`);refreshBagUpgrade();refreshLanternUpgrade();
}
