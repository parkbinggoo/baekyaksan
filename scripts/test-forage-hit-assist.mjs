/** Small collectible tap assistance: math and selection regression, no WebGL needed. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const assistSrc=await readFile(join(root,'src/game/input/34a-forage-hit-assist.js'),'utf8');
const pointerSrc=await readFile(join(root,'src/game/input/34-pointer-and-keyboard.js'),'utf8');
const harvestSrc=await readFile(join(root,'src/game/gameplay/32-harvest.js'),'utf8');

class Vector3 {
 constructor(x=0,y=0,z=0){this.set(x,y,z)}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
 copy(v){return this.set(v.x,v.y,v.z)}
 subVectors(a,b){return this.set(a.x-b.x,a.y-b.y,a.z-b.z)}
 dot(v){return this.x*v.x+this.y*v.y+this.z*v.z}
 project(){this.x/=5;this.y/=5;this.z=0;return this}
 distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2}
 distanceTo(v){return Math.sqrt(this.distanceToSquared(v))}
}
class Sphere {constructor(){this.center=new Vector3();this.radius=0}}
let boxCalls=0;
class Box3 {
 setFromObject(mesh){boxCalls++;this.mesh=mesh;return this}
 isEmpty(){return false}
 getBoundingSphere(sphere){sphere.center.copy(this.mesh.center);sphere.radius=this.mesh.radius;return sphere}
}
function makeItem(id,kind,x=0,y=0.1,z=0,radius=.08){
 const center=new Vector3(x,y,z);
 const mesh={parent:{},visible:true,center,radius,position:center,
   getWorldPosition(out){return out.copy(center)}};
 return {id,kind,mesh};
}
const camera={fov:60,position:new Vector3(0,0,5)};
const ctx={THREE:{Vector3,Box3,Sphere},camera,W:800,Hh:600,
  ray:{ray:{origin:new Vector3(0,0,5),direction:new Vector3(0,0,-1)}},
  chunks:new Map(),takenUntil:()=>false,matchMedia:()=>({matches:false}),Math};
vm.runInNewContext(assistSrc,ctx,{timeout:2000});
const choose=(x,y,hits=[])=>vm.runInNewContext(`findForageTapAssist(${x},${y},rayHits)`,{...ctx,rayHits:hits},{timeout:2000});
const herb=makeItem('herb','herb');
ctx.chunks.set('one',{items:[herb]});
assert.equal(choose(421,294),herb,'기존 모델 바깥쪽 가까운 클릭은 채집물로 인식');
assert.equal(choose(490,300),null,'먼 곳 클릭은 채집물로 인식하지 않음');
assert.equal(choose(421,294,[{distance:1}]),null,'앞에 가까운 장애물이 있으면 원거리 아이템 선택 차단');
assert.equal(choose(421,294,[{distance:4.8}]),herb,'식물 옆의 지면을 클릭한 경우 작은 오차 보정');
assert.equal(choose(421,294,[{distance:3}]),null,'지형 뒤에 숨은 채집물 선택 금지');
assert.equal(choose(440,294),null,'마우스 보정 범위 바깥쪽은 선택하지 않음');
ctx.matchMedia=()=>({matches:true});
assert.equal(choose(428,294),herb,'터치 환경에서 조금 넓은 조준 보정');
ctx.matchMedia=()=>({matches:false});
ctx.chunks.set('one',{items:[herb,makeItem('fake','decoy',0,0.1,0)]});
assert.equal(choose(421,294),herb,'야생 유사 식물에 추가 타격 판정 부여하지 않음');
ctx.chunks.set('one',{items:[herb,makeItem('far','herb',150,0.1,0)]});
boxCalls=0;
assert.equal(choose(421,294),herb);
assert.equal(boxCalls,1,'먼 채집물은 복잡한 3D 경계상자 계산 전에 걸러야 함');
ctx.chunks.set('one',{items:[herb,makeItem('closer','mush',.1,.1,0)]});
assert.equal(choose(410,294).id,'closer','약초가 가까이 붙어 있어도 탭 위치에 더 가까운 채집물 우선');
ctx.chunks.set('one',{items:[{...herb,mesh:{...herb.mesh,parent:null}}]});
assert.equal(choose(421,294),null,'제거된 모델은 선택되지 않음');
assert.match(pointerSrc,/const assisted=findForageTapAssist\(sx,sy,hits\);/);
assert(pointerSrc.indexOf('const assisted=findForageTapAssist')>pointerSrc.indexOf('if(o&&o.userData.item){const it=o.userData.item;act'),
 '정확한 기존 레이캐스트 판정을 오차 보정보다 우선해야 함');
assert.match(harvestSrc,/const reach=tg.kind==='ground'\?1\.9:2\.4;/,
 '기존 실제 채집 접근 거리를 변경하지 않아야 함');
assert.match(harvestSrc,/it.hits>=it.need/,'기존 채집 타격 횟수는 그대로 유지');
console.log('채집 타격 오차 보정 테스트 통과: 근접/미스/터치/장애물/복수 식물/제거 모델/가림 성능/기존 채집 규칙 유지.');
