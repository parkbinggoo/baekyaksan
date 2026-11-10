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
function goldenSpawn(slotId,cycle=0,type=''){
  // Each unique golden slot belongs to exactly ONE species. The optional type
  // check prevents a changed/randomized species from receiving another name's
  // golden appearance, even if it occupies a reserved slot.
  return type?GOLDEN_SINGLETON_SLOTS[type]===slotId:GOLDEN_SINGLETON_IDS.has(slotId);
}
// Identical original topology, size, orientation, and part arrangement.
// Golden variants reuse the real species model, with material-only treatment.
// Native herbs store their leaf / berry / root colours in *vertex colours*;
// replacing those with one flat colour erased the details that distinguished
// sansam and cheonma. Convert only the colour buffer, never position/normal data.
function tintGoldenObject(root){
  root.traverse(obj=>{
    if(!obj.isMesh||obj.userData.goldTinted)return;
    const original=Array.isArray(obj.material)?obj.material:[obj.material];
    if(original.every(mat=>mat?.visible===false))return; // invisible touch target
    let goldenGeometry=null;
    const goldenMats=original.map(src=>{
      if(src?.visible===false)return src;
      const mat=src.clone();
      const originalColor=src.color;
      const luminance=originalColor?.r!==undefined?
        originalColor.r*.2126+originalColor.g*.7152+originalColor.b*.0722:.5;
      const vertexColours=!!src.vertexColors&&!!obj.geometry?.getAttribute?.('color');
      if(vertexColours){
        // Do NOT modify plantGeoCache's geometry: ordinary specimens must stay green.
        if(!goldenGeometry){
          goldenGeometry=obj.geometry.clone();
          goldenGeometry.userData={...goldenGeometry.userData,keep:false};
          const colours=goldenGeometry.getAttribute('color');
          for(let i=0;i<colours.count;i++){
            const r=colours.getX(i),g=colours.getY(i),b=colours.getZ(i);
            const shade=Math.max(.48,Math.min(1,.56+(.2126*r+.7152*g+.0722*b)*.54+(r>g*1.3&&r>b*1.3?.07:0)));
            colours.setXYZ(i,Math.min(1,shade),shade*.78,shade*.30);
          }
          colours.needsUpdate=true;
        }
        mat.color.setHex(0xffffff); // per-part gold shades come from the colour buffer
        mat.vertexColors=true;
      }else{
        // Mushroom cap, gills and stems keep their original relative contrast.
        const shade=Math.max(.34,Math.min(.73,.36+luminance*.31));
        mat.color.setHSL(.119,.72,shade);
      }
      // Restrained emissive gold, without adding / replacing any geometry.
      if(mat.emissive){mat.emissive.setHex(0x845511);mat.emissiveIntensity=.24;}
      mat.needsUpdate=true;
      return mat;
    });
    if(goldenGeometry)obj.geometry=goldenGeometry;
    obj.material=Array.isArray(obj.material)?goldenMats:goldenMats[0];
    obj.userData.goldTinted=true;
  });
  return root;
}
function applyGoldenVariants(chunk){
  for(const it of chunk.items){
    if(!it.mesh||!GOLD_FIVE_BASES.includes(it.type)||itemInfo(it.type)?.rar!==5)continue;
    const cycle=rareMoves.get(it.id)?.cycle||0;
    if(!goldenSpawn(it.id,cycle,it.type))continue; // type+slot must match
    it.golden=true;it.goldenCare=1.08;tintGoldenObject(it.mesh);
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
