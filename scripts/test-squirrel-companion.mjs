import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const load=async p=>readFile(new URL('../src/game/'+p,import.meta.url),'utf8');
const source=await load('world/47d-squirrel-companion.js');
const avatar=await load('graphics/20-hiker-avatar.js');
const net=await load('network/38-multiplayer.js');
const profile=await load('save/51-profile-and-files.js');
const core=await load('core/05-session-state.js');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const loop=await load('core/50-game-update.js');
const wildlife=await load('world/47-wildlife-states.js');
assert.match(avatar,/const legL=new THREE.Group\(\),legR=new THREE.Group\(\),kneeL=new THREE.Group\(\),kneeR=new THREE.Group\(\)/);
assert.match(avatar,/const mounted=h.mode==='ride',sideSpread/);
assert.match(avatar,/h\.legL\.rotation\.z=lerp/);
assert.match(avatar,/h\.kneeL\.rotation\.x=lerp/);
assert.match(avatar,/setShoulderPet\(h,kind\)/);
assert.match(loop,/me\.rideType=ridingKind\(\)/);
assert.match(net,/setShoulderPet\(o\.av/);
assert.match(net,/pet:playerRank>=10/);
assert.match(wildlife,/save\.shoulderPet\?\.id===key/);
assert.match(core,/squirrelFeeds:save\.squirrelFeeds\|\|\{\}/);
assert.match(profile,/squirrelFeeds:v\.squirrelFeeds\|\|\{\}/);
assert.match(profile,/setShoulderPet\(me,playerRank>=10/);
for(const id of ['squirrelFeedPanel','squirrelFeedFoods','squirrelFeedClose'])assert(html.includes(`id="${id}"`));
const src=source.slice(0,source.lastIndexOf('ensureSquirrelFeedPanel();'));
const kindA={id:'squirrel',name:'다람쥐'},kindB={id:'redsquirrel',name:'청설모'};
const makeAnimal=(id,kind)=>({key:id,kind,x:0,z:0,mesh:{visible:true,position:{y:0},parent:{}}});
const one=makeAnimal('0,-10:animal0',kindA),two=makeAnimal('0,-10:animal1',kindB);
const animals=new Map([[one.key,one],[two.key,two]]);
const save={inv:{chestnut:5,jat:5,acorn:7,wildberry:7},squirrelFeeds:{},shoulderPet:null};
let persists=0,notices=[],petCalls=[],peer=0;
const panel={classList:{add(){},remove(){}},addEventListener(){}};
const ctx=vm.createContext({Math,Date,Number,save,animals,playerRank:9,mode:'game',inTent:false,inSecretCave:false,
  P:{x:0,y:0,z:0},climbing:null,cooking:null,faintUntil:0,me:{},
  isRiding:()=>false,toast:t=>notices.push(t),tone(){},sendPresence:()=>peer++,
  persist:()=>persists++,setGreens(){},totalCount(){return Object.values(save.inv).reduce((a,b)=>a+b,0)},
  setShoulderPet:(h,k)=>petCalls.push(k),removeWildAnimal:(id)=>animals.delete(id),
  hudKey:'',buildBag(){},$:id=>({classList:{contains:()=>true,add(){},remove(){}},replaceChildren(){},textContent:'',appendChild(){}}),document:{createElement(){return {classList:{add(){},remove(){}},addEventListener(){},setAttribute(){},append(){},appendChild(){},style:{}}},body:{appendChild(){}},querySelector(){return {}}}});
vm.runInContext(src,ctx);
const evals=s=>vm.runInContext(s,ctx);
evals('renderSquirrelFeedPanel=()=>{};closeSquirrelFeedPanel=()=>{feedingSquirrelKey=""}');
assert.equal(evals('openSquirrelFeedPanel(animals.get("0,-10:animal0"))'),true);
assert.match(notices.at(-1),/Lv\.10/,'Lv9 feeding locked');
ctx.playerRank=10;
evals('feedingSquirrelKey="0,-10:animal0"');
for(let i=0;i<4;i++)assert.equal(evals('feedSquirrel("chestnut")'),true);
assert.equal(save.squirrelFeeds[one.key],4);
evals('feedingSquirrelKey="0,-10:animal1"');
for(let i=0;i<5;i++)assert.equal(evals('feedSquirrel("wildberry")'),true);
assert.equal(save.squirrelFeeds[two.key],5);
assert.equal(save.squirrelFeeds[one.key],4,'different animals cannot combine progress');
evals('feedingSquirrelKey="0,-10:animal0"');
assert.equal(evals('feedSquirrel("chestnut")'),true);
for(let i=0;i<5;i++)assert.equal(evals('feedSquirrel("jat")'),true);
assert.equal(save.squirrelFeeds[one.key],undefined,'tamed per-animal progress cleared');
assert.equal(save.shoulderPet.id,one.key);
assert.equal(save.shoulderPet.kind,'squirrel');
assert.equal(save.inv.chestnut,undefined,'five chestnuts consumed');
assert.equal(save.inv.jat,undefined,'five pine nuts consumed');
assert.deepEqual(petCalls,['squirrel']);
assert(!animals.has(one.key),'tamed source removed only locally');
assert(animals.has(two.key),'the other wild animal remains');
assert.equal(peer,1,'new companion broadcast once');
assert.equal(persists,15,'every feed persisted');
assert.equal(evals('squirrelFeedCount("0,-10:animal1")'),5);
assert.equal(evals('isSquirrelKind("boar")'),false);
// Validate portable profile normalization, not only in-session feed logic.
const normalizeFragment=profile.slice(profile.indexOf('function normalizeRecord(raw){'),profile.indexOf('function setSwatchSelection'));
const normalCtx=vm.createContext({Math,Number,Date,HERBS:{sansam:{rar:5}},MUSH:{songi:{rar:5}},
  FRUITS:{chestnut:{},jat:{},acorn:{},wildberry:{}},HONEY_KEYS:[],TWIG_KEY:'fallenTwig',
  GOLD_FIVE_BASES:['sansam','songi'],isGoldenKey:k=>k.startsWith('gold:'),
  goldBase:k=>k.slice(5),goldenKey:k=>'gold:'+k,validSpecialTitle:()=>'',
  JACKETS:[0],BAG_LEVELS:[10,20,30,40],RANKS:[{name:'1'}],
  clamp:(n,l,h)=>Math.min(h,Math.max(l,n)),pathX:()=>0,SUMMIT_Z:-4560});
vm.runInContext(normalizeFragment,normalCtx);
normalCtx.oldSave={inv:{acorn:2},squirrelFeeds:{'0,-10:animal1':5,bad:7},shoulderPet:{id:one.key,kind:'squirrel'}};
const loaded=vm.runInContext('normalizeRecord(oldSave)',normalCtx);
assert.equal(loaded.squirrelFeeds['0,-10:animal1'],5);
assert.equal(loaded.squirrelFeeds.bad,undefined);
assert.equal(loaded.shoulderPet.kind,'squirrel');
assert.equal(loaded.shoulderPet.id,one.key);
assert.equal(loaded.inv.acorn,2);
console.log('다람쥐 동행 검사 통과: Lv10 제한·개체별 먹이 10개·4종 아이템 차감·저장·어깨 표시·멀티 상태·탑승 무릎/다리 관절.');
