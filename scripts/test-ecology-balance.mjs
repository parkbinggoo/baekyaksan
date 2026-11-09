import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(f)=>readFile(join(root,'src/game',f),'utf8');
const rules=await read('world/28b-ecology-populations.js');
const gold=await read('data/21b-golden-five-star.js');
const world=await read('world/29-chunks-and-ground.js');
const decoy=await read('world/26-decoy-flora.js');
const ctx={Object,Set};
vm.runInNewContext(rules+'\nthis.limits=ECOLOGY_QUOTA_SLOTS;this.recovery=ECOLOGY_RECOVERY_SITES;this.allowed=ecologyAllowsResource;',ctx);
const targets={sanghwang:8,songi:12,neungi:7,kkotsongi:8,seogi:6,nativeHoney:5,yeongji:22};
for(const [key,target] of Object.entries(targets)){
 assert.equal(ctx.limits[key].length,target,key+' quota');
 assert.equal(new Set(ctx.limits[key]).size,target,key+' unique slots');
 assert.equal(new Set(ctx.limits[key].map(v=>v.split(':')[0])).size,target,key+' spread over chunks');
 for(const id of ctx.limits[key])assert(ctx.allowed(key,id),key+' allowed slot');
 assert(!ctx.allowed(key,'invalid:never'),key+' unauthorized slots blocked');
}
for(const type of ['sanbuchu','doldanpung','bawichwi','bawichaesong','aegigirin','dolyangji','bawitteokpul']){
 assert(ctx.recovery[type].length>=3,type+' rescued');
 assert.equal(new Set(ctx.recovery[type].map(x=>x.chunk)).size,ctx.recovery[type].length,type+' split among chunks');
}
const goldCtx={HERB_KEYS:['sansam','cheonma'],MUSH_KEYS:['sanghwang','songi','neungi','kkotsongi','seogi'],itemInfo:()=>({rar:5,name:'test'}),Math,Set,console};
vm.runInNewContext(gold+'\nthis.gold=GOLDEN_SINGLETON_SLOTS;',goldCtx);
for(const [type,id] of Object.entries(goldCtx.gold)){
 if(ctx.limits[type])assert(ctx.allowed(type,id),'golden slot preserved '+type);
}
assert.match(world,/addMissingJournalSpecies\(c\);\s*enforceForestPopulationQuota\(c\);/);
assert.match(world,/if\(!takenUntil\(it\.id\)&&ecologyAllowsResource\(mt,it\.id\)\)/);
assert.match(decoy,/!ecologyAllowsResource\(type,id\)/);
console.log('생태 분산 개체수 검사 통과: 희귀종 7종, 복구 7종, 황금 슬롯·생성 경로 확인');
