/** Five-star 20m/10m perception regression tests; runs without a browser. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,join} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const code=await readFile(join(root,'src/game/gameplay/47b-five-star-sense.js'),'utf8');
function classes(initial=[]){
  const set=new Set(initial);
  return {add:x=>set.add(x),remove:x=>set.delete(x),contains:x=>set.has(x),
    toggle:(x,force)=>{const add=force===undefined?!set.has(x):force;if(add)set.add(x);else set.delete(x);return add}};
}
const elements=Object.fromEntries(['rareSense','rareSense20','rareSense10','boarWarning'].map(id=>[
  id,{classList:classes(id==='boarWarning'?['hide']:['hide'])}
]));
const item={id:'5star-1',type:'songi',mesh:{visible:true,parent:{},position:{x:30,y:1,z:0}}};
const context=vm.createContext({
  Math,Number,Date,performance:{now:()=>now},mode:'game',inTent:false,inSecretCave:false,
  playerRank:5,faintUntil:0,P:{x:0,y:1,z:0},chunks:new Map([['sector',{items:[item]}]]),
  itemInfo:key=>({rar:key==='songi'?5:2}),takenUntil:()=>0,$:id=>elements[id]
});
let now=0;
vm.runInContext(code,context);
const evalCode=s=>vm.runInContext(s,context);
const update=(ms,dt=.3)=>{now=ms;evalCode(`updateRareSense(${dt})`)};
const shown=id=>!elements[id].classList.contains('hide');
function none(){assert.equal(shown('rareSense'),false);assert.equal(shown('rareSense20'),false);assert.equal(shown('rareSense10'),false)}
function sight(a,b){assert.equal(shown('rareSense20'),a,'20m 상태 불일치');assert.equal(shown('rareSense10'),b,'10m 상태 불일치');assert.equal(shown('rareSense'),a||b,'상위 알림창 노출 불일치')}
assert.equal(evalCode('rareSenseMode(5,20)'),'off');
assert.equal(evalCode('rareSenseMode(6,20)'),'timed');
assert.equal(evalCode('rareSenseMode(6,10)'),'off');
assert.equal(evalCode('rareSenseMode(7,20)'),'persistent');
assert.equal(evalCode('rareSenseMode(7,10)'),'off');
assert.equal(evalCode('rareSenseMode(8,20)'),'persistent');
assert.equal(evalCode('rareSenseMode(8,10)'),'timed');
assert.equal(evalCode('rareSenseMode(9,20)'),'persistent');
assert.equal(evalCode('rareSenseMode(9,10)'),'persistent');
assert.equal(evalCode('rareSenseMode(11,10)'),'persistent');

// Lv5: even a close genuine resource cannot trigger this earned skill.
item.mesh.position.x=8;update(0);none();
// Lv6: entry triggers only 20m, and it expires exactly once until leaving.
context.playerRank=6;update(100);sight(true,false);
update(3200);sight(false,false);
update(5500);none();
item.mesh.position.x=21;update(5800);none();
item.mesh.position.x=18;update(5900);sight(true,false);
// Lv7: upgrade while already inside immediately makes the 20m hint persistent.
context.playerRank=7;update(9000);sight(true,false);
update(40000);sight(true,false);
item.mesh.position.x=8;update(40400);sight(true,false);
// Lv8: upgrade inside the 10m ring triggers the new 10m one-shot hint.
context.playerRank=8;update(40600);sight(true,true);
update(43700);sight(true,false);
update(46000);sight(true,false);
// Leave only the inner radius, then re-enter to re-arm only its timed hint.
item.mesh.position.x=15;update(46300);sight(true,false);
item.mesh.position.x=9;update(46700);sight(true,true);
// Lv9: inner radius remains persistent after its original 3-second timeout.
context.playerRank=9;update(47000);sight(true,true);
update(51000);sight(true,true);
item.mesh.position.x=12;update(51400);sight(true,false);
item.mesh.position.x=22;update(51800);none();
// New entry gives both persistent messages, including at Lv10 and Lv11.
context.playerRank=11;item.mesh.position.x=6;update(52200);sight(true,true);
// Danger warning takes precedence, but persistent alerts return afterwards.
elements.boarWarning.classList.remove('hide');update(52600);none();
elements.boarWarning.classList.add('hide');update(52900);sight(true,true);
// A harvested, detached, or vertically distant item must not trigger.
item.mesh.parent=null;update(53300);none();
item.mesh.parent={};item.mesh.position.y=8;update(53700);none();
item.mesh.position.y=1;item.mesh.visible=false;update(54100);none();
item.mesh.visible=true;update(54500);sight(true,true);
// Cave and tent must immediately clear the UI, regardless of scan timer.
context.inSecretCave=true;update(54510,.01);none();
context.inSecretCave=false;update(54900);sight(true,true);
context.inTent=true;update(54910,.01);none();
context.inTent=false;update(55300);sight(true,true);
context.mode='intro';update(55310,.01);none();
context.mode='game';update(55700);sight(true,true);
context.faintUntil=Date.now()+60000;update(55710,.01);none();
context.faintUntil=0;
// Timed alerts queued behind a boar warning should trigger when it clears.
context.playerRank=8;elements.boarWarning.classList.remove('hide');update(56100);none();
elements.boarWarning.classList.add('hide');update(56500);sight(true,true);
update(60000);sight(true,false);
// Rank guide must exactly describe the four requested levels.
const rankSource=await readFile(join(root,'src/game/data/02-ranks.js'),'utf8');
const rankCtx=vm.createContext({Math,Number});
vm.runInContext(rankSource,rankCtx);
const requested={
  6:'5성 채집물 20m 탐지 · 일시적 알림',
  7:'5성 채집물 20m 탐지 · 알림 유지',
  8:'5성 채집물 20m 탐지 유지 · 10m 일시적 알림',
  9:'5성 채집물 20m 탐지 유지 · 10m 알림 유지'
};
for(const [level,expected] of Object.entries(requested))assert.equal(vm.runInContext(`fiveStarSenseRankText(${level})`,rankCtx),expected);
assert.equal(vm.runInContext('fiveStarSenseRankText(10)',rankCtx),requested[9]);
console.log('5성 탐지 회귀 테스트 통과: Lv.5~11 권한, 20m/10m 각각의 진입·퇴장·일시 만료·유지, 승급 중 재적용, 멧돼지 우선, 채집 종료, 동굴/텐트/기절, 등급창 문구.');
