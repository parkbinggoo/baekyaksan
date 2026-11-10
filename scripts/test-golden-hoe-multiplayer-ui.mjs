/** v1.2.8 Golden Hoe ownership, claim UI and mysterious aura regression checks.
 * These are executable unit simulations, not a browser/WebGL multiplayer session.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const [net,hiker,rock,terrain,ui,html,css,loop,manifest,save]=await Promise.all([
  read('src/game/network/38-multiplayer.js'),read('src/game/graphics/20-hiker-avatar.js'),
  read('src/game/gameplay/49-rock-climbing.js'),read('src/game/world/29-chunks-and-ground.js'),
  read('src/game/gameplay/49a-golden-hoe-ui-and-aura.js'),read('index.html'),
  read('styles/14-golden-hoe-ui.css'),read('src/game/core/50-game-update.js'),
  read('src/game/manifest.json'),read('src/game/save/51-profile-and-files.js')]);
assert.match(net,/gh:save\.goldenHoeOwned\?1:0/,'presence packets include owner state');
assert.match(net,/o\.av\.hasGoldenHoe=s\.gh===1/,'remote avatars equip received hoe');
assert.match(hiker,/handle\.material=handle\.material\.clone\(\)/);
assert.match(hiker,/ferrule\.material=ferrule\.material\.clone\(\)/);
assert.match(hiker,/blade\.material=blade\.material\.clone\(\)/);
assert.match(hiker,/h\.hoe\.scale\.setScalar\(hasGoldenHoe\?1\.5:1\)/);
assert.match(hiker,/h\.hoeGlow\.intensity=hasGoldenHoe/);
assert.match(terrain,/goldenHoeHost:true/,'single immutable boulder has a special host flag');
assert.match(rock,/rock\.goldenHoeHost/,'host selection must use fixed marker, not load order');
assert.match(rock,/GOLDEN_HOE_REQUIRED_HITS=30,GOLDEN_HOE_GAP=1\.05,GOLDEN_HOE_COOLDOWN_MS=24\*60\*60\*1000/);
assert.match(rock,/sendPresence\(true\);showGoldenHoeAchievement\(\)/);
assert.match(loop,/updateMysteriousAuraAlert\(\)/);
assert.match(ui,/caveDistance<=30/);
assert.match(ui,/hoeDistance<=30/);
assert.match(ui,/caveDistance>36/);
assert.match(ui,/hoeDistance>36/);
for(const id of ['goldenHoePanel','goldenHoeDigBtn','goldenHoeAchievement','goldenHoeAchievementClose','goldenHoeProgressBar'])
  assert.match(html,new RegExp(`id="${id}"`));
assert.match(css,/#goldenHoePanel\{/);
assert.match(css,/#goldenHoeAchievement\{/);
assert(JSON.parse(manifest).files.some(f=>f.file==='gameplay/49a-golden-hoe-ui-and-aura.js'));
assert.match(save,/goldenHoeOwned,goldenHoeCooldownUntil:/,'hoe persists between reloads');
// Check exactly 30 careful strikes, then permanent ownership and an immediate
// presence broadcast. A too-fast second strike triggers the 24h retry timer.
class V3{constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z})}clone(){return new V3(this.x,this.y,this.z)}add(p){this.x+=p.x;this.y+=p.y;this.z+=p.z;return this}}
const events=[];
const scene={};const host={goldenHoeHost:true,x:0,z:0,r:4,mesh:{parent:{parent:scene}}};
const ctx={THREE:{Raycaster:class{},Vector3:V3},Math,Date,performance,console,
  chunks:new Map([['host',{rocks:[host]}]]),scene,P:{x:0,z:0,y:1,speed:0},
  save:{goldenHoeOwned:false,goldenHoeCooldownUntil:0},
  clock:0,me:{mode:'idle',hasGoldenHoe:false,t:0},target:null,pending:null,curAct:null,queued:null,
  onRock:null,pip(){},tone(){},floatMsg(){},toast(){},persist(){},setTimeout(){},sendPresence:()=>events.push('presence'),
  showGoldenHoeAchievement:()=>events.push('achievement')};
vm.createContext(ctx);vm.runInContext(rock,ctx);
vm.runInContext('goldenHoeRock=chooseGoldenHoeRock();onRock=goldenHoeRock;goldenHoeMesh={visible:true,position:new THREE.Vector3(),rotation:{z:0}}',ctx);
for(let i=0;i<30;i++){
  ctx.clock=i*1.2+2;
  vm.runInContext('interactGoldenHoe()',ctx);
}
assert.equal(ctx.save.goldenHoeOwned,true,'exactly 30 successful taps claim the hoe');
assert.equal(ctx.save.goldenHoeCooldownUntil,0);
assert.deepEqual(events,['presence','achievement']);
vm.runInContext('goldenHoeClaimFx=null;goldenHoeAttempt=null;save.goldenHoeOwned=false;goldenHoeMesh.visible=true;',ctx);
ctx.clock=100;
vm.runInContext('interactGoldenHoe()',ctx);
ctx.clock=100.4;
vm.runInContext('interactGoldenHoe()',ctx);
assert.equal(ctx.save.goldenHoeOwned,false);
assert(ctx.save.goldenHoeCooldownUntil>Date.now()+23.9*3600000,'early strike triggers one-day retry wait');
// Same neutral aura notice both locations; no coordinates or extra labels.
const els=new Map();
const $=id=>{if(!els.has(id)){
  const classes=new Set(['hide']);
  els.set(id,{textContent:'',style:{width:''},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),has:c=>classes.has(c)},
    addEventListener(){},disabled:false});
}return els.get(id)};
const notices=[];const alertCtx={Math,clock:16,mode:'game',inSecretCave:false,inTent:false,
  save:{goldenHoeOwned:false,goldenHoeCooldownUntil:0},P:{x:29,z:0},caveSite:{x:0,z:0},
  goldenHoeRock:null,ensureGoldenHoeRock:()=>alertCtx.goldenHoeRock,
  toast:s=>notices.push(s),$,
  goldenHoeAttempt:null,GOLDEN_HOE_REQUIRED_HITS:30,onRock:null,
  goldenHoeMesh:null,goldenHoeCooldownLeft:()=>0,
  goldenHoeBusy:()=>false,interactGoldenHoe(){},formatGoldenHoeCooldown:()=>'',
  clearTimeout(){},setTimeout(){return 1}};
vm.createContext(alertCtx);vm.runInContext(ui,alertCtx);
vm.runInContext('updateMysteriousAuraAlert()',alertCtx);
assert.deepEqual(notices,['심상치 않은 기운이 느껴진다...']);
vm.runInContext('updateMysteriousAuraAlert()',alertCtx);
assert.equal(notices.length,1,'the same approach must not spam alerts');
alertCtx.P.x=40;alertCtx.clock=20;vm.runInContext('updateMysteriousAuraAlert()',alertCtx);
alertCtx.P.x=29;alertCtx.clock=30;vm.runInContext('updateMysteriousAuraAlert()',alertCtx);
assert.equal(notices.length,2,'leaving and reentering re-arms');
alertCtx.caveSite=null;alertCtx.P.x=28;alertCtx.goldenHoeRock={x:0,z:0};alertCtx.clock=48;
vm.runInContext('updateMysteriousAuraAlert()',alertCtx);
assert.equal(notices.length,3,'special rock also generates the same generic 30m notice');
assert.equal(new Set(notices).size,1);
alertCtx.onRock=alertCtx.goldenHoeRock;alertCtx.goldenHoeMesh={visible:true};
alertCtx.goldenHoeAttempt={hits:17,lastHit:0};alertCtx.clock=51;
vm.runInContext('goldenHoeRock=onRock;updateGoldenHoePanel()',alertCtx);
assert.equal($('goldenHoeProgress').textContent,'17 / 30');
assert.equal($('goldenHoeProgressBar').style.width,100*17/30+'%');
assert.equal($('goldenHoeDigBtn').disabled,false);
console.log('황금 호미 전용 UI 및 멀티 상태 검사 통과: 30회 성공, 빠른 채집 시 24시간 잠금, 획득 알림, 고정 바위, 30m 신비 알림, 재료 공유 방지, UI 진행률.');
