/** Specific sound-quality regression: slow snow cadence, softer filtering and digging. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const read=async p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const audio=await read('src/game/audio/44a-world-events-sound.js');
const dig=await read('src/game/gameplay/32-harvest.js');
const camp=await read('src/game/gameplay/09-campfire-cooking.js');
const noises=[],tones=[];
const snippet=audio.slice(audio.indexOf('function playFireLight(){'),audio.indexOf('function playThunder('));
const play=vm.runInNewContext(snippet+'\n({playFireLight,playSnowStep,playSnowDig})',{
  eventNoise:(data)=>noises.push(data),tone:(...args)=>tones.push(args),Math
});
play.playSnowStep(0);
assert.equal(noises.length,2,'snow compression has two low, gentle layers');
assert(noises.every(s=>s.lowpass<=750&&s.volume<=.019),'snow must avoid bright/high gain noise');
assert(noises.some(s=>s.duration>=.35),'a single snow sound needs a little soft sustain');
noises.length=0;
play.playSnowStep(1);
assert.equal(noises.length,2,'snow brushing also uses two gentle layers');
assert(noises.every(s=>s.lowpass<=750&&s.volume<=.019));
noises.length=0;
play.playSnowDig();
assert(noises.length===2&&noises.every(s=>s.lowpass<=600&&s.volume<.021),'snow digging should be softer and deeper');
noises.length=0;
play.playFireLight();
assert(noises.length===2&&noises.every(s=>s.lowpass<=850&&s.volume<=.025),'ignition has lower pitch and level');
assert(tones.every(t=>t[3]<=.012),'ignition thump is quiet');
assert.match(dig,/snowyDig[\s\S]*?playSnowDig\(\);else thud\(\)/,'snow digging must use its own sound');
assert.match(camp,/playFireLight\(\)/,'campfire ignition is still wired');
assert.doesNotMatch(camp,/chime\(3\);playFireLight\(\)/,'bright achievement chime should not accompany campfire ignition');
// Exercise the actual world-sound scheduling with real movement and a dummy noise sink.
const tail=audio.slice(audio.indexOf('function updateWorldSounds(dt){'));
let steps=0;
const ctx={
  eventAudioReady:()=>true,mode:'game',inTent:false,inSecretCave:false,faintUntil:0,Date,
  updateRainSound:()=>{},tents:[],P:{x:0,z:0,y:2100,speed:1,air:false},
  ALT_K:1,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),vn:()=>0,
  snowGroundCoverage:(x,z,y)=>y>1530?1:0,
  snowSfxElapsed:0,snowSfxNext:.90,snowStepIndex:0,fireSfxClock:0,lastStepX:null,lastStepZ:null,
  playSnowStep:()=>steps++,Math,climbing:false,onRock:false
};
const tick=vm.runInNewContext(tail+'\nupdateWorldSounds',ctx);
for(let i=0;i<12;i++){ctx.P.x+=.65;tick(.25);}
assert(steps>=1&&steps<=3,'snow cannot be rapid-fire: max about one effect per second');
const before=steps;
for(let i=0;i<12;i++){ctx.P.speed=0;tick(.25);}
assert.equal(steps,before,'standing still is silent');
ctx.P.speed=1;ctx.P.air=true;
for(let i=0;i<12;i++){ctx.P.x+=.65;tick(.25);}
assert.equal(steps,before,'jumping is silent');
ctx.P.air=false;ctx.P.y=850;
for(let i=0;i<12;i++){ctx.P.x+=.65;tick(.25);}
assert.equal(steps,before,'bare soil is silent');
console.log('눈·모닥불 음향 검사 통과: 느린 비동기 간격, 저역/저음량, 눈 채집, 정지·점프·맨땅 무음, 조용한 점화.');
