/** Fixed population quotas and per-species golden singleton tests, no WebGL required. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFile(join(root,'src/game',p),'utf8');
const plants=await read('world/28a-five-star-population.js');
const gold=await read('data/21b-golden-five-star.js');
const catalog=await read('data/21-native-flora-database.js');
const placements=await read('world/29-chunks-and-ground.js');
const pops=await read('world/24-flora-population.js');
const index=new Map();
const taken=new Set();
const ctx={console,Math,Object,Set,Date,Array,Number,
  SPI:{sansam:{need:9},cheonma:{need:7}},
  resourceSiteOK:()=>true,
  takenUntil:id=>taken.has(id)?Date.now()+1200000:0,
  rareSlotSeed:(id,cycle)=>id.length*31+cycle,
  H:()=>250,
  makePlantMesh:()=>({position:{set(){}},rotation:{},userData:{}}),
};
vm.runInNewContext(plants+`\nthis.siteData=TARGETED_FIVE_STAR_SITES;`,ctx);
for(const type of ['sansam','cheonma']){
  const sites=ctx.siteData[type];
  assert.equal(sites.length,type==='sansam'?3:5);
  assert.equal(new Set([...sites].map(x=>x.chunk)).size,sites.length,`${type}: 서로 다른 청크에 분리`);
  for(let i=0;i<sites.length;i++)for(let j=i+1;j<sites.length;j++){
    const a=sites[i],b=sites[j];
    assert(Math.hypot(a.x-b.x,a.z-b.z)>=220,`${type}: 다른 적합 구역으로 220m 이상 분산`);
  }
  for(const site of sites)index.set(site.chunk,true);
}
const actual=[];
for(const key of index.keys()){
  const c={key,grp:{add(){}},items:[]};
  vm.runInNewContext('addTargetedFiveStarResources(__chunk);',{...ctx,__chunk:c});
  actual.push(...c.items);
}
assert.equal(actual.filter(x=>x.type==='sansam').length,3);
assert.equal(actual.filter(x=>x.type==='cheonma').length,5);
assert.equal(new Set(actual.map(x=>x.id)).size,8);
assert(actual.every(x=>x.need===(x.type==='sansam'?9:7)));
const pre=actual[0];taken.add(pre.id);
const c={key:pre.id.split(':')[0],grp:{add(){}},items:[]};
vm.runInNewContext('addTargetedFiveStarResources(__chunk);',{...ctx,__chunk:c});
assert(!c.items.some(x=>x.id===pre.id),'채집 후 재생성 대기 중엔 재생성하지 않아야 함');
taken.delete(pre.id);
const c2={key:pre.id.split(':')[0],grp:{add(){}},items:[]};
vm.runInNewContext('addTargetedFiveStarResources(__chunk);',{...ctx,__chunk:c2});
assert(c2.items.some(x=>x.id===pre.id),'재생성 시간 후 같은 희귀 자리로 복귀');
const match=Object.fromEntries([...catalog.matchAll(/\{id:'([^']+)'[^\n]*?ab:(\.\d+),need:/g)].map(m=>[m[1],+m[2]]));
const types=['sansam','cheonma','sanghwang','songi','neungi','kkotsongi','seogi'];
const goldCtx={HERB_KEYS:['sansam','cheonma'],MUSH_KEYS:types.slice(2),itemInfo:()=>({rar:5,name:'test'}),Math,Set,console};
vm.runInNewContext(gold+'\nthis.singleton=GOLDEN_SINGLETON_SLOTS;this.isGold=goldenSpawn;',goldCtx);
assert.deepEqual(Object.keys(goldCtx.singleton).sort(),types.sort());
assert.equal(new Set(Object.values(goldCtx.singleton)).size,7);
// Each golden type is placed in a different resource slot/region; no two
// golden variants should be concentrated at the same spot.
const habitatSlotKeys=Object.values(goldCtx.singleton).map(v=>v.split(':')[0]);
assert.equal(new Set(habitatSlotKeys).size,7,'황금 5성마다 서로 다른 청크 지정');
for(const type of types){
  const id=goldCtx.singleton[type];
  assert(goldCtx.isGold(id,0));assert(goldCtx.isGold(id,1));assert(goldCtx.isGold(id,99));
}
assert.equal(goldCtx.isGold('ground:2024,3',0),false);
const goldSan=actual.filter(x=>x.type==='sansam'&&goldCtx.isGold(x.id));
const goldCh=actual.filter(x=>x.type==='cheonma'&&goldCtx.isGold(x.id));
assert.equal(goldSan.length,1);assert.equal(goldCh.length,1);
assert.match(pops,/isTargetedFiveStar\(sp\.id\)\|\|takenUntil\(id\)/);
assert.match(placements,/addTargetedFiveStarResources\(c\);\s*addMissingJournalSpecies\(c\);\s*enforceForestPopulationQuota\(c\);\s*relocateRareInChunk\(c\);/);
console.log('희귀 개체수 검증 통과: 산삼 3(황금 1 포함), 천마 5(황금 1 포함), 금색 7종 각각 1개, 채집 후 보류·복원 및 기존 서식지 판정 호출 확인.');
