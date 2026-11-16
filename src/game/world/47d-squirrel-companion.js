/* === Lv.10 SQUIRREL / EURASIAN RED SQUIRREL COMPANION ===
 * A player feeds ONE stable world animal ID over time (10 fruit/nuts total).
 * Food is taken from the inventory. The earned shoulder companion is stored
 * in the player's portable profile; peers see the same low-poly species.
 */
const SQUIRREL_FOOD=Object.freeze([
  {key:'chestnut',label:'밤'},
  {key:'jat',label:'잣'},
  {key:'acorn',label:'도토리'},
  {key:'wildberry',label:'산딸기'}
]);
const SQUIRREL_FEED_GOAL=10;
let feedingSquirrelKey='';
function isSquirrelKind(kind){return kind==='squirrel'||kind==='redsquirrel'}
function squirrelFeedCount(key){return Math.max(0,Math.min(SQUIRREL_FEED_GOAL,(save.squirrelFeeds?.[key]|0)||0))}
function ensureSquirrelFeedPanel(){
  let panel=$('squirrelFeedPanel');
  if(panel)return panel;
  panel=document.createElement('section');panel.id='squirrelFeedPanel';panel.className='hide';
  panel.setAttribute('aria-label','다람쥐 먹이 주기');
  const heading=document.createElement('div');heading.className='friendHeading';heading.id='squirrelFeedHeading';
  const count=document.createElement('div');count.className='friendCount';count.id='squirrelFeedCount';
  const foods=document.createElement('div');foods.className='friendFoods';foods.id='squirrelFeedFoods';
  const close=document.createElement('button');close.id='squirrelFeedClose';close.type='button';close.textContent='×';close.setAttribute('aria-label','먹이 주기 닫기');
  close.addEventListener('click',()=>closeSquirrelFeedPanel());
  panel.append(close,heading,count,foods);document.body.appendChild(panel);
  if(!document.querySelector('link[href*="16-squirrel-friend.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='./styles/16-squirrel-friend.css?v=1.2.8-shoulder1';document.head.appendChild(link);
  }
  return panel;
}
function closeSquirrelFeedPanel(){feedingSquirrelKey='';$('squirrelFeedPanel')?.classList.add('hide')}
function canReachSquirrel(a){
  if(!a||!a.mesh?.visible)return false;
  return Math.hypot(P.x-a.x,P.z-a.z)<=3.0&&Math.abs(a.mesh.position.y-P.y)<=2.25;
}
function openSquirrelFeedPanel(a){
  if(!a||!isSquirrelKind(a.kind.id))return false;
  if(playerRank<10){toast('다람쥐와 청설모에게 먹이를 주는 능력은 Lv.10부터 열립니다.');return true}
  if(mode!=='game'||inSecretCave||inTent||isRiding()||climbing||cooking||Date.now()<faintUntil)return true;
  if(!canReachSquirrel(a)){toast('다람쥐가 너무 멀리 있거나 나무 위에 있습니다. 조금 더 가까이 다가가세요.');return true}
  feedingSquirrelKey=a.key;
  renderSquirrelFeedPanel();
  ensureSquirrelFeedPanel().classList.remove('hide');
  return true;
}
function renderSquirrelFeedPanel(){
  const a=animals.get(feedingSquirrelKey),panel=ensureSquirrelFeedPanel();
  if(!a||!isSquirrelKind(a.kind.id)||playerRank<10){closeSquirrelFeedPanel();return}
  $('squirrelFeedHeading').textContent=a.kind.name+'에게 먹이 주기';
  $('squirrelFeedCount').textContent='같은 개체에게 '+squirrelFeedCount(a.key)+' / '+SQUIRREL_FEED_GOAL+'개';
  const foodHost=$('squirrelFeedFoods');foodHost.replaceChildren();
  for(const f of SQUIRREL_FOOD){
    const n=save.inv[f.key]||0;
    const button=document.createElement('button');button.type='button';button.disabled=n<1;
    button.textContent=f.label+' '+n+'개';
    button.addEventListener('click',()=>feedSquirrel(f.key));
    foodHost.appendChild(button);
  }
  panel.classList.remove('hide');
}
function feedSquirrel(foodKey){
  const a=animals.get(feedingSquirrelKey);
  if(playerRank<10||!a||!isSquirrelKind(a.kind.id)||!SQUIRREL_FOOD.some(f=>f.key===foodKey)||
    !canReachSquirrel(a)||isRiding()||inTent||inSecretCave||cooking||Date.now()<faintUntil){
    if(a)toast('동물이 멀어졌습니다. 다시 가까이 다가가세요.');
    closeSquirrelFeedPanel();return false;
  }
  if(!(save.inv[foodKey]>0)){renderSquirrelFeedPanel();return false}
  // Durable per-animal count; do not combine different squirrels' progress.
  save.inv[foodKey]--;if(!save.inv[foodKey])delete save.inv[foodKey];
  save.squirrelFeeds=save.squirrelFeeds||{};
  const count=Math.min(SQUIRREL_FEED_GOAL,squirrelFeedCount(a.key)+1);
  if(count<SQUIRREL_FEED_GOAL){save.squirrelFeeds[a.key]=count;
    toast(a.kind.name+'가 먹이를 받아먹었다. '+count+'/'+SQUIRREL_FEED_GOAL);
  }else{
    delete save.squirrelFeeds[a.key];
    save.shoulderPet={id:a.key,kind:a.kind.id};
    setShoulderPet(me,a.kind.id);
    toast('🐿 '+a.kind.name+'가 마음을 열고 어깨에 올라탔다!');
    tone(523,.2,'sine',.045);tone(659,.34,'sine',.035,1,.12);
    removeWildAnimal(a.key,a);
    closeSquirrelFeedPanel();
    sendPresence(true);
  }
  hudKey='';persist();setGreens(me,totalCount());
  if(count<SQUIRREL_FEED_GOAL)renderSquirrelFeedPanel();
  if(!$('bag').classList.contains('hide'))buildBag();
  return true;
}
// Enlarged screen-space touch assist for tiny squirrel silhouettes on mobile.
function tryFeedSquirrelTapAssist(sx,sy){
  if(playerRank<10||isRiding())return false;
  let best=null,bestD2=Infinity;
  const radius=IS_TOUCH?37:23;
  for(const a of animals.values()){
    if(!isSquirrelKind(a.kind.id)||!canReachSquirrel(a))continue;
    const projected=a.mesh.position.clone();projected.y+=.13;projected.project(camera);
    if(projected.z<=-1||projected.z>=1)continue;
    const x=(projected.x*.5+.5)*W,y=(-projected.y*.5+.5)*Hh;
    const d2=(sx-x)*(sx-x)+(sy-y)*(sy-y);
    if(d2<radius*radius&&d2<bestD2){best=a;bestD2=d2}
  }
  return best?openSquirrelFeedPanel(best):false;
}
function tryFeedSquirrelFromRay(object){
  let node=object;
  while(node){
    if(node.userData?.animalKey){
      const a=animals.get(node.userData.animalKey);
      return a&&isSquirrelKind(a.kind.id)?openSquirrelFeedPanel(a):false;
    }
    node=node.parent;
  }
  return false;
}
ensureSquirrelFeedPanel();
$('squirrelFeedClose')?.addEventListener('click',closeSquirrelFeedPanel);
