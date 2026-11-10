/** v1.2.8 — executable tests of five-star offerings, real-time buffs, persistence and ritual FX. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../src/game/'+path,import.meta.url),'utf8');
const buff=await read('gameplay/54a-cave-blessing-buff.js');
const fx=await read('world/53a-cave-blessing-visuals.js');
const saveSrc=await read('save/51-profile-and-files.js');
const offerSrc=await read('gameplay/54-secret-offering-and-titles.js');
const gameLoop=await read('core/50-game-update.js');
const jump=await read('core/52-start-and-event-bindings.js');
const cave=await read('world/53-secret-cave-world.js');
const normalise=saveSrc.slice(saveSrc.indexOf('function normalizeRecord(raw){'),saveSrc.indexOf('function setSwatchSelection'));
const now=Date.now();
const ctx={save:{offeringBuffKind:'',offeringBuffUntil:0,mealBuffUntil:0},MEAL_SPEED_MULT:1.32,MEAL_JUMP_MULT:1.175,
  mealBoosted:()=>ctx.save.mealBuffUntil>Date.now(),Date,Math,console,$:()=>({classList:{toggle(){}},textContent:''})};
vm.createContext(ctx);
vm.runInContext(buff,ctx);
const run=s=>vm.runInContext(s,ctx);
assert.equal(run(`grantOfferingBuff(false,${now}).until`),now+40*60*1000);
assert.equal(run(`offeringBuffState(${now+39*60*1000}).kind`),'normal');
assert.equal(run(`offeringBuffState(${now+40*60*1000})`),null);
assert.equal(run(`offeringSpeedMultiplier(${now})`),1.32);
assert.equal(run(`offeringJumpMultiplier(${now})`),1.175);
assert.equal(run(`grantOfferingBuff(true,${now}).until`),now+24*60*60*1000);
assert.equal(run(`offeringSpeedMultiplier(${now})`),1.32);
assert.equal(run(`offeringJumpMultiplier(${now})`),1.175);
assert.equal(run(`offeringBuffState(${now+23*60*60*1000}).kind`),'gold');
assert.equal(run(`offeringBuffState(${now+24*60*60*1000})`),null);
run(`grantOfferingBuff(false,${now+60000})`);
assert.equal(ctx.save.offeringBuffKind,'gold','normal offering must not overwrite a 24h golden blessing');
assert.equal(ctx.save.offeringBuffUntil,now+86400000);
run(`grantOfferingBuff(true,${now+60000})`);
assert.equal(ctx.save.offeringBuffUntil,now+60000+86400000,'new golden blessing resets 24h duration');
ctx.save.mealBuffUntil=Date.now()+600000;
assert.equal(run(`offeringSpeedMultiplier(${now+60000})`),1.32,'meal + blessing must never stack');
assert.equal(run(`offeringJumpMultiplier(${now+60000})`),1.175,'meal + blessing must never stack');
assert.equal(run(`goldenBuddhaProtects(${now+60000})`),true);
assert.equal(run(`goldenBuddhaProtects(${now+60000+86400000})`),false);
assert.match(gameLoop,/2\.55\*offeringSpeedMultiplier\(\)/);
assert.match(gameLoop,/4\.0\*offeringSpeedMultiplier\(\)/);
assert.match(jump,/P\.vy=5\.2\*offeringJumpMultiplier\(\)/);
ctx.save.mealBuffUntil=0;
assert.equal(run(`offeringSpeedMultiplier(${now+60000+86400000})`),1);
assert.equal(run(`offeringJumpMultiplier(${now+60000+86400000})`),1);
// The whispered clue is 3% per completed normal five-star offering.
Object.assign(ctx,{
  TARGETED_FIVE_STAR_SITES:{sansam:[{chunk:'0,-25',index:0,x:10,z:-1180}]},
  takenUntil:()=>0,H:()=>440,ALT_K:2.5
});
let randomCalls=0;
ctx.randomMiss=()=>{randomCalls++;return .03001};
ctx.randomWin=()=>{randomCalls++;return .0299};
assert.equal(run('rollSansamOfferingHint(randomMiss)'), '');
assert.equal(randomCalls,1,'failed hint roll needs exactly one random draw');
const poeticHint=run('rollSansamOfferingHint(randomWin)');
assert.match(poeticHint,/산허리|그늘/);
assert(!poeticHint.includes('-1180')&&!poeticHint.includes('10,'),'never expose location coordinates');
ctx.takenUntil=()=>Date.now()+600000;
assert.equal(run('rollSansamOfferingHint(randomWin)'), '', 'do not hint to a harvested slot');
ctx.takenUntil=()=>0;
// Normalization of old + new profiles. Absolute wall-clock time, not game time.
Object.assign(ctx,{HERBS:{sansam:{rar:5}},MUSH:{songi:{rar:5}},FRUITS:{},HONEY_KEYS:[],TWIG_KEY:'fallenTwig',
  GOLD_FIVE_BASES:['sansam','songi'],isGoldenKey:k=>k.startsWith('gold:'),goldBase:k=>k.slice(5),goldenKey:k=>'gold:'+k,
  validSpecialTitle:()=>'',JACKETS:[0x112233],BAG_LEVELS:[10,20],RANKS:[{}],
  clamp:(n,low,high)=>Math.min(high,Math.max(low,n)),pathX:()=>0,SUMMIT_Z:-4560});
vm.runInContext(normalise,ctx);
ctx.inp={inv:{sansam:1},offeringBuffKind:'gold',offeringBuffUntil:now+86400000,specialTitles:{unlocked:[]}};
run('this.record=normalizeRecord(inp)');
assert.equal(ctx.record.offeringBuffKind,'gold');
assert.equal(ctx.record.offeringBuffUntil,now+86400000);
run("this.old=normalizeRecord({inv:{sansam:1}})");
assert.equal(ctx.old.offeringBuffKind,'');
assert.equal(ctx.old.offeringBuffUntil,0);
ctx.inp={offeringBuffKind:'normal',offeringBuffUntil:now+86400000};
run('this.clamped=normalizeRecord(inp)');
assert(ctx.clamped.offeringBuffUntil<=Date.now()+40*60000);
// Offering completion through original transaction branch, including inventory deduction and title.
let saves=0,effects=[],published=[],achievements=[];
Object.assign(ctx,{save:{inv:{sansam:1,'gold:sansam':1},offeringBuffKind:'',offeringBuffUntil:0,specialTitles:{unlocked:[],equipped:''}},
  caveOffering:{key:'sansam',item:{parent:{remove(){}}}},validOfferingKey:()=>true,isGoldenKey:k=>k.startsWith('gold:'),
  addSpecialTitle:()=>{ctx.save.specialTitles.unlocked.push('천년약사');ctx.save.specialTitles.equipped='천년약사';return '천년약사'},
  persist:()=>saves++,setGreens(){},totalCount:()=>1,hudKey:'',glowSecretCaveCandles(){},
  startCaveBlessingFx:b=>effects.push(b),netPublish:(t,p)=>published.push([t,p]),
  showCaveAchievement:t=>achievements.push(t),tone(){},toast(){},toastT:0,sendPresence(){},buildBag(){},
  rollSansamOfferingHint:()=>'',
  caveBuddhaPoint:{x:0,z:-36.2},me:{mode:'bow',t:0},$:()=>({classList:{contains:()=>true}})});
const completion=offerSrc.slice(offerSrc.indexOf('function completeSecretOffering(){'),offerSrc.indexOf('function updateSecretOffering(dt){'));
vm.runInContext(completion,ctx);
run('completeSecretOffering();completeSecretOffering()');
assert.equal(ctx.save.inv.sansam,undefined);
assert.equal(ctx.save.offeringBuffKind,'normal');
assert.equal(effects.length,1);
assert.equal(saves,1);
assert.deepEqual(effects,[false]);
ctx.caveOffering={key:'gold:sansam',item:{parent:{remove(){}}}};
run('completeSecretOffering()');
assert.equal(ctx.save.inv['gold:sansam'],undefined);
assert.equal(ctx.save.offeringBuffKind,'gold');
assert.equal(achievements[0],'천년약사');
assert.deepEqual(effects,[false,true]);
assert(published.some(([t,p])=>t==='caveBlessing'&&p.gold===1));
// Central faint protection test: all three named hazards respect the golden blessing,
// while ordinary blessings and unrelated faint reasons continue working unchanged.
const faintSrc=await read('world/47-wildlife-states.js');
const faintFragment=faintSrc.slice(faintSrc.indexOf('let lastBuddhaProtectionToast=0;'),faintSrc.indexOf('function updFaint(){'));
const overlays=[];let protectedToasts=[];let faintSaves=0;let accidentCalls=0;
const faintOverlay={classList:{remove:()=>overlays.push('show')},querySelector:()=>({textContent:''})};
const faintCtx={Date,Math,console,FAINT_MS:3*60000,me:{mode:'walk',t:0},joy:{x:0,y:0},
  faintUntil:0,faintReason:'',cooking:null,climbing:null,onRock:null,closeCampPanel(){},
  goldenBuddhaProtects:()=>faintCtx.isGold, isGold:true,
  $:name=>name==='faintOverlay'?faintOverlay:{classList:{add(){} }},
  toast:s=>protectedToasts.push(s),tone(){},localStorage:{setItem(){}},persist:()=>faintSaves++,
  faintSoundVolume(){},sendPresence(){},sendAccidentRadio:()=>accidentCalls++,
  target:null,pending:null,P:{speed:1},
};
vm.createContext(faintCtx);vm.runInContext(faintFragment,faintCtx);
for(const kind of [{id:'boar',name:'멧돼지'},{name:'바위 추락',fall:true,durationMs:120000},{name:'벌 떼',bees:true,durationMs:60000}]){
  faintCtx.faintUntil=0;
  vm.runInContext(`faintAnimal(${JSON.stringify(kind)})`,faintCtx);
  assert.equal(faintCtx.faintUntil,0,'protected against '+kind.name);
  assert.equal(faintSaves,0,'protection must not persist faint');
  assert.equal(accidentCalls,0,'protection must not broadcast faint radio');
}
faintCtx.isGold=false;vm.runInContext(`faintAnimal({name:'바위 추락',fall:true,durationMs:120000})`,faintCtx);
assert(faintCtx.faintUntil>Date.now(),'without protection rock fall causes real faint');
assert.equal(faintSaves,1);
assert.equal(accidentCalls,1);
// The special ceremony includes all-candle surge, Buddha emissive illumination, aura and shake.
assert.match(cave,/prepareCaveBlessingFx\(group,g,\[stone,robe,shadow\]\)/);
assert.match(cave,/updateCaveBlessingFx\(dt\)/);
assert.match(cave,/applyCaveBlessingShake\(camera\)/);
assert.match(fx,/for\(const m of caveBuddhaMaterials\)/);
assert.match(fx,/caveBlessHalo\.material\.opacity=/);
assert.match(fx,/camera\.position\.x\+=/);
assert.match(fx,/if\(!fx\?\.golden\)return/,'no cave shaking on normal offerings');
// Run the visual response with lightweight scene/light stubs (not a WebGL render).
const visual={caveBuddhaPoint:{x:0,z:-36.2},caveInteractionElapsed:0,caveLightPulse:0,Math,THREE:{
  AdditiveBlending:2,DoubleSide:2,
  PointLight:class {constructor(){this.position={set(x,y,z){this.x=x;this.y=y;this.z=z}};this.color={setHex(n){this.value=n}};this.intensity=0}},
  SphereGeometry:class {},MeshBasicMaterial:class {constructor(o){Object.assign(this,o);this.color={setHex(n){this.value=n}}}},
  Mesh:class {constructor(geo,mat){this.material=mat;this.position={set(x,y,z){this.x=x;this.y=y;this.z=z}};this.scale={set(x,y,z){this.x=x;this.y=y;this.z=z}};this.visible=false}}
},glowSecretCaveCandles(){},tone(){}};
vm.createContext(visual);
vm.runInContext(fx,visual);
visual.par={parts:[],add(obj){this.parts.push(obj)}};
visual.mat={emissive:{setHex(n){this.value=n}},emissiveIntensity:0};
const vrun=s=>vm.runInContext(s,visual);
vrun('prepareCaveBlessingFx(par,null,[mat]);startCaveBlessingFx(false);updateCaveBlessingFx(.8)');
assert.equal(visual.par.parts.length,4,'face candle light and gold aura supplement the original shrine effects');
assert(vrun('caveBlessLight.intensity')>0);
assert(vrun('caveBlessLight.intensity')<2);
assert(vrun('caveBlessHalo.material.opacity')<.12,'ordinary offering halo stays subtle');
visual.camera={position:{x:0,y:0}};
vrun('applyCaveBlessingShake(camera)');
assert.equal(visual.camera.position.x,0,'regular offering must not shake cave');
vrun('startCaveBlessingFx(true);updateCaveBlessingFx(.8);applyCaveBlessingShake(camera)');
assert(vrun('caveBlessLight.intensity')>2);
assert(vrun('caveBlessHalo.material.opacity')>.1);
assert(Math.abs(visual.camera.position.x)>0,'golden ceremony causes visible camera shake');
vrun('updateCaveBlessingFx(6.2)');
assert.equal(vrun('caveBlessLight.intensity'),0,'temporary effect fully fades');
console.log('v1.2.8 공양 수정 검사 통과: 음식과 동일 배율·중복 방지, 3% 산삼 은유 힌트, 24시간 황금 가호의 멧돼지·바위·벌 기절 면역, 영구 칭호/시간제 효과 분리, 저장 복원, 소모/연출.');
