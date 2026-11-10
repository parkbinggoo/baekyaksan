/** Pure-domain regression tests; no WebGL or network required. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=async(path)=>readFile(join(root,'src/game',path),'utf8');
const gold=await read('data/21b-golden-five-star.js');
const rank={sansam:5,songi:5,sanghwang:5,neungi:5,kkotsongi:5,seogi:5,yeongji:4,deodeok:3};
const desc=Object.fromEntries(Object.keys(rank).map(k=>[k,{name:k,rar:rank[k]}]));
const save={inv:{'gold:songi':1,songi:2},known:{},goldKnown:{},specialTitles:{unlocked:[],equipped:''}};
let persistCount=0,networkCount=0;
const ctx={
  HERB_KEYS:['sansam','deodeok'],MUSH_KEYS:['songi','sanghwang','neungi','kkotsongi','seogi','yeongji'],
  itemInfo:k=>desc[k]||null,THREE:{},document:{},rankLabel:level=>`LV${level}`,
  save,persist:()=>persistCount++,sendPresence:()=>networkCount++,console,
  $$:()=>{},
};
function run(code){return vm.runInNewContext(code,ctx,{timeout:3000})}
run(gold);
assert.equal(run('isGoldenKey("gold:songi")'),true);
assert.equal(run('isGoldenKey("gold:deodeok")'),false);
assert.equal(run('isGoldenKey("gold:yeongji")'),false);
assert.equal(run('goldTitle("gold:songi")'),'금송선인');
assert.equal(run('validSpecialTitle("임의 칭호")'),'');
assert.equal(run('goldenSpawn("rare-slot-42",2)'),run('goldenSpawn("rare-slot-42",2)'));
assert.equal(run('Object.keys(GOLDEN_SINGLETON_SLOTS).length'),7,'도감의 황금 5성 품목마다 1개 지정');
assert.equal(run('new Set(Object.values(GOLDEN_SINGLETON_SLOTS)).size'),7,'황금 위치 중복 금지');
assert.equal(run('goldenSpawn(GOLDEN_SINGLETON_SLOTS.sansam,0)'),true);
assert.equal(run('goldenSpawn(GOLDEN_SINGLETON_SLOTS.sansam,5)'),true,'재생성 후에도 황금은 해당 자리 하나만 유지');
assert.equal(run('goldenSpawn("ground:12,34",0)'),false,'땅파기에서 황금이 추가 생성되면 안 됨');
assert.equal(run('goldenSpawn("slot-random",0)'),false,'무작위 황금 추가 방지');
assert.equal(run('addSpecialTitle("gold:songi")'),'금송선인');
run('addSpecialTitle("gold:songi")');
assert.deepEqual(save.specialTitles.unlocked,['금송선인'],'중복 칭호는 누적되지 않아야 함');
assert.equal(run('setSpecialTitle("천년약사")'),false,'미획득 칭호 장착 차단');
assert.equal(run('setSpecialTitle("금송선인")'),true);
assert.equal(run('activeSpecialTitle()'),'금송선인');
// Model-honest sale: tampered selectedSellKey should be denied in transaction.
const market=await read('gameplay/13-market.js');
Object.assign(ctx,{
  FRUITS:{},HONEY:{},HONEY_KEYS:[],selectedSellKey:'gold:songi',
  toast:(s)=>ctx.lastToast=s,itemPrice:()=>10,
  $:()=>({value:1}),
});
run(market+'\nsellSelected();');
assert.equal(save.inv['gold:songi'],1,'황금 5성 재고는 판매로 소모되지 않아야 함');
assert.equal(save.won||0,0,'황금 5성 판매로 돈이 증가하지 않아야 함');
assert.match(ctx.lastToast,/판매할 수 없습니다/);
const saveSrc=await read('save/51-profile-and-files.js');
const normalizer=saveSrc.slice(saveSrc.indexOf('function normalizeRecord(raw){'),saveSrc.indexOf('function setSwatchSelection'));
Object.assign(ctx,{FRUITS:{},HONEY_KEYS:[],TWIG_KEY:'fallenTwig',JACKETS:[1,2,3],BAG_LEVELS:[10,20],RANKS:Array.from({length:11},()=>({})),
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),PROFILE_FORMAT:2,H:()=>10,HERBS:{sansam:desc.sansam,deodeok:desc.deodeok},MUSH:Object.fromEntries(Object.entries(desc).filter(([k])=>k!=='sansam'&&k!=='deodeok')),
});
// One field for old saves; new gold stock and titles must survive JSON save/load.
run(normalizer+`\nthis.normalized = normalizeRecord({inv:{'gold:songi':2,songi:3},known:{songi:1},goldKnown:{songi:1},specialTitles:{unlocked:['금송선인','금송선인','invalid'],equipped:'금송선인'}});`);
assert.equal(ctx.normalized.inv['gold:songi'],2);
assert.equal(ctx.normalized.inv.songi,3);
assert.equal(ctx.normalized.goldKnown.songi,1);
assert.deepEqual([...ctx.normalized.specialTitles.unlocked],['금송선인']);
assert.equal(ctx.normalized.specialTitles.equipped,'금송선인');
run(`this.oldProfile=normalizeRecord({inv:{songi:1},known:{songi:1}});`);
assert.equal(ctx.oldProfile.inv.songi,1);
assert.equal(ctx.oldProfile.specialTitles.equipped,'');
// Deterministic cave selector: no coordinates are displayed by the test.
const cave=await read('world/53-secret-cave-world.js');
const chooser=cave.slice(cave.indexOf('function chooseSecretCaveSite(){'),cave.indexOf('function makeCaveEntrance(){'));
const ctxC={SECRET_CAVE_SEED:0x6bbd7409,ALT_K:2.5,rngOf:seed=>{let a=seed>>>0;return()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296}},
  pathX:z=>Math.sin(z*.011)*34,H:(x,z)=>Math.max(0,-z*.22+Math.sin(x*.02)*9),streamD:()=>25,fbm:(x,z)=>Math.sin(x*2+z*.4)*.2,Math,Number};
vm.runInNewContext(chooser+'\nthis.siteA=chooseSecretCaveSite();this.siteB=chooseSecretCaveSite();',ctxC);
assert.equal(ctxC.siteA.x,ctxC.siteB.x);assert.equal(ctxC.siteA.z,ctxC.siteB.z);
assert(Number.isFinite(ctxC.siteA.x)&&Number.isFinite(ctxC.siteA.z));
// Complete offering once; a second completion call may not consume twice.
const offerSrc=await read('gameplay/54-secret-offering-and-titles.js');
const offerComplete=offerSrc.slice(offerSrc.indexOf('function completeSecretOffering(){'),offerSrc.indexOf('function updateSecretOffering(dt){'));
ctx.save.inv={'gold:songi':1};ctx.save.specialTitles={unlocked:[],equipped:''};
Object.assign(ctx,{caveOffering:{key:'gold:songi',item:{parent:{remove(){}}}},
  me:{mode:'bow',t:0},hudKey:'',currentOfferingKeys:()=>[],
  setGreens:()=>{},totalCount:()=>1,glowSecretCaveCandles:()=>{},showCaveAchievement:()=>{},tone:()=>{},
  grantOfferingBuff:()=>({kind:'gold'}),startCaveBlessingFx:()=>{},netPublish:()=>{},caveBuddhaPoint:{x:0,z:-36.2},
  $:()=>({classList:{contains:()=>true}}),buildBag:()=>{},validOfferingKey:()=>true});
run(offerComplete+'\ncompleteSecretOffering();completeSecretOffering();');
assert.equal(ctx.save.inv['gold:songi'],undefined);
assert.deepEqual(ctx.save.specialTitles.unlocked,['금송선인']);
assert.equal(ctx.save.specialTitles.equipped,'금송선인');
console.log('기능 회귀 테스트 통과: 희귀 판정, 칭호 중복/장착, 판매 차단, 저장/구형 기록, 동굴 위치 일치, 공양 중복 소모 방지.');
