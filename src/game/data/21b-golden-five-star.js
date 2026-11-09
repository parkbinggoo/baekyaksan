/* ================= GOLDEN FIVE-STAR VARIANTS ================= */
// A single deterministic, reachable slot per currently supported five-star
// species. Never add an extra resource: gild the chosen ordinary slot only.
// Harvested golden slots follow the existing five-star respawn/relocation cycle.
const GOLD_PREFIX='gold:';
const GOLDEN_SINGLETON_SLOTS=Object.freeze({
  sanghwang:"0,-34:m41",
  songi:"-2,-39:xm31",
  neungi:"0,-8:xm17",
  kkotsongi:"-1,-53:xm21",
  seogi:"-1,-29:rock1",
  sansam:"0,-25:fiveStar-sansam-0",
  cheonma:"-2,-16:fiveStar-cheonma-0"
});
const GOLDEN_SINGLETON_IDS=new Set(Object.values(GOLDEN_SINGLETON_SLOTS));
const GOLD_TITLES={sansam:'천년약사',songi:'금송선인',sanghwang:'금광도인',
  neungi:'영산도인',kkotsongi:'화령선인',seogi:'석벽도인'};
const GOLD_FIVE_BASES=[...HERB_KEYS,...MUSH_KEYS].filter(k=>itemInfo(k)?.rar===5);
function isGoldenKey(key){return typeof key==='string'&&key.startsWith(GOLD_PREFIX)&&GOLD_FIVE_BASES.includes(key.slice(GOLD_PREFIX.length))}
function goldBase(key){return isGoldenKey(key)?key.slice(GOLD_PREFIX.length):key}
function goldenKey(key){return GOLD_PREFIX+key}
function goldTitle(key){const base=goldBase(key);return GOLD_TITLES[base]||('황금 '+itemInfo(base).name+'의 수호자')}
const VALID_SPECIAL_TITLES=new Set(GOLD_FIVE_BASES.map(goldTitle));
function validSpecialTitle(name){return typeof name==='string'&&VALID_SPECIAL_TITLES.has(name)?name:''}
function goldenSpawn(slotId,cycle=0){
  // One reserved slot for each species; do not roll new gold on every cycle
  // or from random ground digging, which could exceed the one-per-species cap.
  return GOLDEN_SINGLETON_IDS.has(slotId);
}
// Recolour the original meshes without replacing their geometry or changing
// the silhouette. Source materials are cloned to avoid tinting ordinary plants.
function tintGoldenObject(root){
  root.traverse(obj=>{if(!obj.isMesh||obj.userData.goldTinted)return;
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    obj.material=mats.map(src=>{
      const mat=src.clone();mat.flatShading=true;
      const light=src.color?(src.color.r*.32+src.color.g*.52+src.color.b*.16):.5;
      mat.color.setHSL(.119,.68,Math.min(.69,Math.max(.40,.43+light*.16)));
      if(mat.vertexColors){ // Existing native-herb vertex hues would otherwise remain green.
        mat.vertexColors=false;
      }
      if(mat.emissive)mat.emissive.setHex(0x221304);
      if('shininess' in mat)mat.shininess=4;
      mat.needsUpdate=true;return mat;
    });
    if(!Array.isArray(obj.userData?.goldSources))obj.userData.goldSources=mats;
    if(!Array.isArray(obj.material))obj.material=obj.material[0];
    obj.userData.goldTinted=true;
  });
  return root;
}
function applyGoldenVariants(chunk){
  for(const it of chunk.items){
    if(!it.mesh||!GOLD_FIVE_BASES.includes(it.type)||itemInfo(it.type)?.rar!==5)continue;
    const cycle=rareMoves.get(it.id)?.cycle||0;
    if(!goldenSpawn(it.id,cycle))continue;
    it.golden=true;tintGoldenObject(it.mesh);
  }
}
function setSpecialTitle(saveTitle){
  save.specialTitles=save.specialTitles||{unlocked:[],equipped:''};
  const v=validSpecialTitle(saveTitle);
  if(v&&!save.specialTitles.unlocked.includes(v))return false;
  save.specialTitles.equipped=v;persist();sendPresence(true);return true;
}
function addSpecialTitle(key){
  if(!isGoldenKey(key))return '';
  const name=goldTitle(key);
  save.specialTitles=save.specialTitles||{unlocked:[],equipped:''};
  if(!save.specialTitles.unlocked.includes(name))save.specialTitles.unlocked.push(name);
  save.specialTitles.equipped=name;
  return name;
}
function activeSpecialTitle(){return validSpecialTitle(save.specialTitles?.equipped)&&
  save.specialTitles?.unlocked?.includes(save.specialTitles.equipped)?save.specialTitles.equipped:''}
function setTitleTag(el,title,level,nick){
  el.replaceChildren();
  if(title){const gold=document.createElement('span');gold.className='special-title';gold.textContent='✦ '+title+' ✦';el.appendChild(gold)}
  const base=document.createElement('span');base.className='rank-and-name';base.textContent=rankLabel(level)+'\n'+nick;el.appendChild(base);
}
