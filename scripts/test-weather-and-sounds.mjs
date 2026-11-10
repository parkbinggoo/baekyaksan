/** New weather/sound feature checks without external CDN or browser audio. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const weather=await read('src/game/world/42-weather.js');
const audio=await read('src/game/audio/44a-world-events-sound.js');
const forest=await read('src/game/audio/44-forest-ambience.js');
const update=await read('src/game/core/50-game-update.js');
const harvest=await read('src/game/gameplay/32-harvest.js');
const network=await read('src/game/network/38-multiplayer.js');
const cave=await read('src/game/world/53-secret-cave-world.js');
const core=weather.slice(0,weather.indexOf('let weatherStart='));
const sandbox={KST_OFFSET:32400000,Date,Math};
const compiled=vm.runInNewContext(core+'\n({T:WEATHER_TYPES,e:weatherEvent,r:weatherRandom})',sandbox);
assert.equal(compiled.T[6].name,'천둥번개');
assert.equal(compiled.T[6].type,2);
assert(compiled.T[6].rain>.8);
let storms=0;
for(let i=0;i<5000;i++){
 const e=compiled.e(i,2);if(e.kind===6)storms++;
 assert.equal(e.duration,compiled.e(i,2).duration,'weather schedule is deterministic');
}
assert(storms>70&&storms<250,'storm is uncommon, but possible');
assert.match(weather,/weatherStart\+cycle\*17000/);
assert.match(weather,/playThunder\(\.5\+weatherRandom\(/);
assert.match(weather,/stormFlashLight\.intensity=pulse\*9/);
assert.match(audio,/function playThunder\(/);
assert.match(audio,/function playSnowStep\(/);
assert.match(audio,/function playCookingStage\(/);
assert.match(audio,/function playFireLight\(/);
assert.match(audio,/function playTentZip\(/);
assert.match(audio,/function playBoarTension\(/);
assert.match(audio,/function tickCaveSound\(/);
assert.match(forest,/inSecretCave\|\|inTent/);
assert.match(update,/updateThunderstorm\(\)/);
assert.match(update,/updateWorldSounds\(dt\)/);
assert.match(harvest,/originalType==='sansam'/);
assert.match(harvest,/netPublish\('sansamFound',\{name\}\)/);
assert.match(network,/d\.type==='sansamFound'/);
assert.match(network,/me\.mode==='joyspin'/);
assert.match(cave,/beginCaveSound\(\)/);
assert.match(cave,/endCaveSound\(\)/);
// Isolate footstep logic and confirm only snowy ground + movement triggers steps.
let calls=0;
const source=audio.slice(audio.indexOf('function updateWorldSounds(dt){'));
const context={
  eventAudioReady:()=>true,mode:'game',inTent:false,inSecretCave:false,faintUntil:0,Date,
  updateRainSound:()=>{},tents:[],P:{x:0,z:0,y:2100,speed:1,air:false},
  ALT_K:1,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),vn:()=>0,
  stepSfxDistance:0,fireSfxClock:0,lastStepX:null,lastStepZ:null,playSnowStep:()=>calls++,Math,
  climbing:null,onRock:null,
};
const doTest=vm.runInNewContext(source+'\nupdateWorldSounds',context);
for(let i=0;i<10;i++){context.P.x+=.92;doTest(.25);}
assert(calls>=1,'footsteps on thick snowy surface');
const afterSnow=calls;
context.P.y=700;
for(let i=0;i<10;i++){context.P.x+=.92;doTest(.25);}
assert.equal(calls,afterSnow,'no snowy sound on bare low mountain ground');
context.P.y=2200;context.P.air=true;
for(let i=0;i<10;i++){context.P.x+=.92;doTest(.25);}
assert.equal(calls,afterSnow,'no snowy sound while jumping');
console.log('날씨·소리 검사 통과: 공통 시드 천둥번개, 번개/천둥 시차, 설원 보행 조건, 상황별 효과음, 산삼 멀티 알림.');
