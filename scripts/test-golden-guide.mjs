/** 황금 5성 도감 렌더링과 황금 뿌리 채집 회귀 검사 (네트워크/브라우저 불필요) */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=async(f)=>readFile(join(root,f),'utf8');
const css=await read('styles/10-secret-cave-and-titles.css');
const regularCss=await read('styles/01-intro-hud-inventory.css');
assert.match(regularCss,/\.card\.unk img\s*\{[^}]*filter\s*:\s*brightness\(0\) opacity\(\.22\)/,'일반 도감의 미발견 실루엣 스타일이 유지되어야 함');
assert.match(css,/\.golden-card\s*\{[^}]*border-color:/,'황금 도감 카드의 금색 테두리는 유지');
assert.doesNotMatch(css,/\.golden-card(?:\.unk)?\s+img\s*,|\.golden-card\.unk\s+img\s*\{[^}]*(?:filter|opacity|visibility)\s*:/,'황금 미발견 이미지는 일반 도감 실루엣을 덮어쓰지 않음');
const iconSrc=await read('src/game/graphics/25-collection-icons.js');
assert.match(iconSrc,/const gilded=isGoldenKey\(type\);type=goldBase\(type\)/);
assert.match(iconSrc,/if\(gilded\)tintGoldenObject\(obj\)/);
const harvest=await read('src/game/gameplay/32-harvest.js');
assert.match(harvest,/const sp=SPI\[originalType\]/,'뿌리 연출은 gold: 키 대신 원본 식물의 데이터를 참조');
// 가짜 DOM에서 황금 5성 도감 카드가 생성되고 3D 이미지 URL이 연결되는지 검사.
class Node {
 constructor(tag='div'){this.tag=tag;this.children=[];this.className='';this.src='';this.alt='';this.textContent='';this._innerHTML='';this.classes=[];this.classList={add:v=>this.classes.push(v)}}
 appendChild(el){this.children.push(el);return el}
 append(...items){this.children.push(...items)}
 set innerHTML(v){this._innerHTML=v;this.children=[]}
 get innerHTML(){return this._innerHTML}
}
const bag=new Node('div'),goldBases=['sansam','songi'];const seen=[];
const inv={'gold:sansam':1};
const save={goldKnown:{},inv,won:0};
const ctx={document:{createElement:tag=>new Node(tag)},$:id=>id==='bagBody'?bag:new Node(),save,
  GOLD_FIVE_BASES:goldBases,goldenKey:k=>'gold:'+k,itemKindOf:k=>k.includes('sansam')?'herb':'mush',
  itemInfo:k=>({name:k==='sansam'?'산삼':'송이',rar:5}),iconURL:(kind,key)=>{seen.push([kind,key]);return `data:image/mock,${kind}-${key}`},
  HERB_KEYS:[],MUSH_KEYS:[],FRUITS:{},HONEY_KEYS:[],HERBS:{},TWIG_KEY:'fallenTwig',
  won:v=>`${v}원`,totalCount:()=>1,bagLimit:()=>10,discoveredCount:()=>1,
};
const ui=await read('src/game/ui/35-hud-and-bag.js');
const buildBag=ui.slice(ui.indexOf('function buildBag(){'));
vm.runInNewContext(buildBag+'\nbuildBag();',ctx,{timeout:3000});
const goldGrid=bag.children.find(n=>n.className==='grid');
assert(goldGrid,'황금 5성 도감 그리드');
assert.equal(goldGrid.children.length,2);
for(const card of goldGrid.children){
 const img=card.children.find(n=>n.tag==='img');
 assert(img&&img.src.startsWith('data:image/mock,'));
}
assert.equal(goldGrid.children[0].className,'card golden-card','가방에 있으면 기존 발견 마커가 없더라도 발견 상태로 보임');
assert.equal(goldGrid.children[1].className,'card golden-card unk','미발견 상태는 ??? 처리하되 이미지 존재');
assert.deepEqual(seen.slice(0,2),[['herb','gold:sansam'],['mush','songi']],
  '발견한 황금 5성만 황금 모델, 미발견은 원본 일반 도감 모델을 사용');
assert.equal(goldGrid.children[0].children[0].alt,'황금 산삼 3D 도감 이미지');
assert.equal(goldGrid.children[1].children[0].alt,'','미발견 카드 alt에 이름을 노출하지 않음');
assert.equal(goldGrid.children[1].children[1].textContent,'???');
// 이전 구현에서 황금 산삼을 수집하면 SPI['gold:sansam']이 undefined가 되어
// 채집물이 사라지고 가방에는 기록되지 않는 오류가 있었음. 실제 collect() 구간 테스트.
const collectFn=harvest.slice(harvest.indexOf('function collect(kind,type,pos,it){'),harvest.indexOf("$('found').addEventListener"));
const rareItem={golden:true,id:'golden-test-slot',mesh:{position:{y:1},parent:{remove(){}}}};
const pulled=[];const eventRecord=[];
const harvestCtx={save:{inv:{},known:{},goldKnown:{}},isGoldenKey:k=>k.startsWith('gold:'),
  GOLD_FIVE_BASES:['sansam'],goldenKey:k=>'gold:'+k,goldenSpawn:()=>false,
  itemInfo:k=>({name:'산삼',rar:5}),takenUntil:()=>false,markTaken:()=>{},
  bagLimit:()=>10,totalCount:()=>0,THREE:{Vector3:class {constructor(x,y,z){this.x=x;this.y=y;this.z=z}}},
  SPI:{sansam:{root:{len:.2,deep:true}}},RESPAWN_MS:10000,pulls:pulled,
  chunks:new Map([['test',{items:[rareItem]}]]),
  recordHerbHarvest:()=>{},persist:()=>eventRecord.push('persist'),
  P:{x:0,y:0,z:0},me:{mode:'idle',t:0},joyT:0,curAct:null,queued:null,
  burst:()=>{},hearts:()=>{},chime:()=>{},setGreens:()=>{},
  showInfoCard:(kind,key)=>eventRecord.push(key),sendPresence:()=>{},
  Date,Math,
};
vm.runInNewContext(collectFn+`\ncollect('herb','sansam',{x:0,y:0,z:0},testItem);`,{...harvestCtx,testItem:rareItem},{timeout:3000});
assert.equal(harvestCtx.save.inv['gold:sansam'],1,'황금 산삼 채집 후 가방에 반드시 보관');
assert.equal(pulled.length,1,'원본 산삼 뿌리 채집 연출 사용');
assert(eventRecord.includes('gold:sansam'),'황금 산삼 발견 카드 출력');
console.log('황금 도감 검사 통과: 미발견 일반 모델 실루엣, 황금 테두리 유지, 발견 후 금색 모델, 이름 비공개, 금색 뿌리 채집 참조.');
