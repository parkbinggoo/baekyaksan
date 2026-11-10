import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const get=(p)=>readFile(join(root,p),'utf8');
const [html,css,hud,map,game,cave]=await Promise.all([
 get('index.html'),get('styles/12-hud-navigation.css'),get('src/game/ui/35-hud-and-bag.js'),
 get('src/game/ui/36-map.js'),get('src/game/core/50-game-update.js'),get('src/game/world/53-secret-cave-world.js')
]);
assert.match(html,/id="hudCompassNeedle"/);
assert(!html.includes('mapSummitHint')&&!html.includes('서북쪽'));
assert(!map.includes('VIRTUAL_MAP_ROT')&&!map.includes('virtualToWorld'),'must preserve previous map alignment');
assert.match(map,/function toLatLon\(x,z\)\{const lat=GEO.lat0\+\(-z\)\/111320/);
assert.match(map,/function updateHudCompass\(\)/);
assert.match(game,/updateHudCompass\(\)/);
assert.match(cave,/updateHudCompass\(\)/);
assert.match(hud,/\$\('altMeters'\)\.textContent/);
assert(!hud.includes('산속 시간')&&!hud.includes('가방 최대')&&!hud.includes('110칸')&&!hud.includes('도감 제외'));
assert.match(hud,/className='bagWallet'/);
assert.match(css,/#hudCompassNeedle|\.hudCompassNeedle/);
assert(!css.includes('#mapSummitHint'));
// Check all cardinal bearings and the dynamic needle direction against original world axes.
const dir=h=>(Math.atan2(Math.sin(h),-Math.cos(h))*180/Math.PI+360)%360;
assert.equal(dir(Math.PI),0);assert.equal(dir(Math.PI/2),90);
assert.equal(dir(0),180);assert.equal(dir(-Math.PI/2),270);
const ctx={Math,Number,console};
vm.createContext(ctx);vm.runInContext(`const bearingOf=h=>(Math.atan2(Math.sin(h),-Math.cos(h))*180/Math.PI+360)%360;${map.match(/let hudCompassDeg=null;[\s\S]*?(?=const dirName)/)[0]}`,ctx);
// The compass needle points upwards when the camera looks north and left when it looks east.
const wrap={classList:{toggle:()=>{}}},needle={style:{}};
ctx.$=id=>id==='hudCompass'?wrap:needle;ctx.inSecretCave=false;
ctx.camYaw=Math.PI;vm.runInContext('updateHudCompass()',ctx);assert.match(needle.style.transform,/rotate\(0\.0deg\)/);
ctx.camYaw=Math.PI/2;vm.runInContext('updateHudCompass()',ctx);assert.match(needle.style.transform,/rotate\(-90\.0deg\)/);
console.log('나침반·UI 검증 통과: 기존 지도/정상 방향 유지, 북쪽 방위, 가방 문구, 시계·코드 연결.');
