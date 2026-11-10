/** Versioned UI navigation tests: no network or WebGL needed. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const get=(p)=>readFile(join(root,p),'utf8');
const [html,css,utility,offering,start,refresh,jumpInput]=await Promise.all([
  get('index.html'),get('styles/12-hud-navigation.css'),get('src/game/core/03-utils.js'),
  get('src/game/gameplay/54-secret-offering-and-titles.js'),get('src/game/core/52-start-and-event-bindings.js'),
  get('src/game/core/51a-settings-terrain-refresh.js'),get('src/game/input/34-pointer-and-keyboard.js')
]);
const nav=html.match(/<nav class="btns"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
assert(nav,'main HUD must have a navigation panel');
const navIds=[...nav.matchAll(/id="([^\"]+)"/g)].map(m=>m[1]);
assert.deepEqual(navIds,['rankBtn','settingsBtn','photoBtn','radioBtn','mapBtn','bagBtn'],'must follow supplied 2x3 reference order');
assert(!navIds.includes('ecoBtn')&&!navIds.includes('hudSaveBtn'),'secondary actions must be in settings only');
assert.equal([...html.matchAll(/id="ecoBtn"/g)].length,1);
assert.equal([...html.matchAll(/id="hudSaveBtn"/g)].length,1);
assert.match(html,/<div id="settingsPanel" class="hide"[^>]*role="dialog"/);
assert.match(html,/<button[^>]*id="terrainRefreshBtn"[^>]*>지형 새로고침<\/button>/);
assert.match(html,/<div id="rankSpecialContent" class="hide"/);
assert.match(html,/<div id="secretTitleList" class="secret-title-list"/);
assert(!html.includes('id="specialTitlesBtn"'),'special titles are not a top-level button');
assert(!html.includes('id="secretTitlePanel"'),'special titles use a tab, not a second modal');
assert.match(css,/#hud \.btns\s*\{\s*display:grid/);
assert.match(offering,/function openSpecialTitles\(\)\{openRankMenu\('special'\)\}/);
assert(!offering.includes("$('secretTitlePanel')"));
assert.match(start,/\$\('terrainRefreshBtn'\)\.addEventListener\('click',refreshWorldFromSettings\)/);
assert(!start.includes('registerTerrainRecoveryJump'),'this version has no three-jump trigger');
assert.match(start,/function jump\(\)/,'normal jump remains functional');
assert.match(jumpInput,/climbAct\(/,'existing jump and climb bindings remain in place');

function makeElement(id){
  const classes=new Set(['hide']);
  const listeners={};
  return {
    id,classes,attrs:{},listeners,
    classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,value)=>{
      if(value===undefined)value=!classes.has(x);if(value)classes.add(x);else classes.delete(x);
    },contains:x=>classes.has(x)},
    addEventListener:(type,cb)=>{(listeners[type]||=[]).push(cb)},
    setAttribute:(k,v)=>{elements[id].attrs[k]=v},
    trigger:(type)=>{for(const cb of listeners[type]||[])cb({target:elements[id]})}
  };
}
const elements={};
const getEl=id=>elements[id]??(elements[id]=makeElement(id));
const listeners={};
let rankRender=0,titleRender=0;
const uiCtx={
  document:{getElementById:getEl},renderRankGuide:()=>rankRender++,renderSpecialTitlePanel:()=>titleRender++,
  addEventListener:(name,cb)=>(listeners[name]||=[]).push(cb),console,
};
vm.runInNewContext(utility,uiCtx,{timeout:1500});
getEl('rankBtn').trigger('click');
assert(!getEl('rankPanel').classList.contains('hide'));
assert(!getEl('rankLevelContent').classList.contains('hide'));
assert(getEl('rankSpecialContent').classList.contains('hide'));
getEl('rankSpecialTab').trigger('click');
assert(getEl('rankLevelContent').classList.contains('hide'));
assert(!getEl('rankSpecialContent').classList.contains('hide'));
assert.equal(getEl('rankSpecialTab').attrs['aria-selected'],'true');
assert(titleRender>0&&rankRender>0);
getEl('rankClose').trigger('click');
assert(getEl('rankPanel').classList.contains('hide'));

const keys=new Map(),scheduler=[];
const cred={nick:'산객',verifier:'a'.repeat(64),key:'baekyaksan-profile-v2:'+'a'.repeat(64)};
const player={x:10.28,z:-331.9};
let saved=0,reloaded=0,restored=0,began=0,softCalled=0,closed=0;
const ctx={
  mode:'game',inSecretCave:false,inTent:false,caveOffering:null,climbing:null,
  activeCredential:cred,activeProfileKey:cred.key,
  save:{pos:null},P:player,console,
  persist:()=>saved++,readProfileDoc:()=>({progress:{pos:{x:10.28,z:-331.9}}}),
  sessionStorage:{setItem:(k,v)=>keys.set(k,v),getItem:k=>keys.get(k)||null,removeItem:k=>keys.delete(k)},
  Date,Number,String,JSON,Math,
  closeGameSettings:()=>closed++,toast:()=>{},setTimeout:cb=>{scheduler.push(cb)},
  window:{location:{reload:()=>reloaded++}},
  PROFILE_STORE_PREFIX:'baekyaksan-profile-v2:',
  cleanNick:x=>x,applyRecord:()=>restored++,beginGame:()=>began++,updateChunks:()=>{},
  $:id=>({value:'',classList:{add:()=>{},remove:()=>{}}}),
  chunks:new Map(),chunkFailures:new Map(),chunkQueue:[],chunkKey:'',chunkBuildT:0,
  lastClimbRockCheck:0,cachedClimbRock:null,disposeChunk:()=>{},onResize:()=>{},
};
vm.runInNewContext(refresh,ctx,{timeout:2000});
vm.runInNewContext('refreshWorldFromSettings()',ctx,{timeout:1000});
assert.equal(saved,1,'must persist before reload');
assert.equal(ctx.save.pos.x,10.28);
assert.equal(ctx.save.pos.z,-331.9);
assert.equal(reloaded,0,'reload must not be immediate');
assert.equal(closed,1);
assert.equal(keys.size,1);
assert(![...keys.values()][0].includes('1234'),'raw PIN is never stored');
scheduler.splice(0).forEach(fn=>fn());assert.equal(reloaded,1);
assert.equal(vm.runInNewContext('resumeAfterSettingsReload()',ctx,{timeout:1500}),true);
assert.equal(restored,1);assert.equal(began,1);assert.equal(keys.size,0,'one-time session token consumed');
assert.equal(vm.runInNewContext('resumeAfterSettingsReload()',ctx,{timeout:1500}),false);
// Block accidentally leaving/reloading from interior experiences.
vm.runInNewContext('settingsReloadPending=false',ctx,{timeout:1000});ctx.inSecretCave=true;
vm.runInNewContext('refreshWorldFromSettings()',ctx,{timeout:1000});
assert.equal(saved,1);assert.equal(reloaded,1);
console.log('HUD 및 설정 테스트 통과: 버튼 순서, 등급 2개 탭, 특별 칭호 동작, 설정 새로고침, 저장·자동복귀, 점프 독립.');
