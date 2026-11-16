/** v1.2.8: execute the real shoulder companion 20m detection and speech-bubble module. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const get=async p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const src=await get('src/game/world/47e-squirrel-whisper.js');
const loop=await get('src/game/core/50-game-update.js');
const start=await get('src/game/core/52-start-and-event-bindings.js');
const manifest=await get('src/game/manifest.json');
const html=await get('index.html');
const css=await get('styles/17-squirrel-whisper.css');
assert.match(loop,/updateShoulderSquirrelWhisper\(dt\)/);
assert.match(loop,/hideSquirrelWhisper\(true\);updateSecretCaveInterior/);
assert.match(start,/setShoulderPet\(me,playerRank>=10\?save\.shoulderPet\?\.kind:''\)/);
assert(manifest.indexOf('world/47e-squirrel-whisper.js')>manifest.indexOf('world/47d-squirrel-companion.js'));
assert.match(html,/17-squirrel-whisper.css/);
assert.match(css,/#squirrelWhisper::after/);
function node(){
  const classes=new Set(['hide']);
  return {style:{},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)},
    parentNode:null,children:[],attributes:{},append(...children){this.children.push(...children);for(const c of children)c.parentNode=this},
    appendChild(child){this.append(child)},setAttribute(k,v){this.attributes[k]=v}};
}
class Vector3{
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
  copy(p){this.x=p.x;this.y=p.y;this.z=p.z;return this}
  project(){this.x*=.3;this.y*=.2;this.z=.25;return this}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this}
}
const labels=node(),head=node(),tones=[];
let now=1000;
const ctx={THREE:{Vector3},Date,Math,Set,performance:{now:()=>now},
  $:id=>id==='labels'?labels:null,document:{hidden:false,head,createElement:()=>node(),querySelector:()=>null},
  playerRank:10,save:{shoulderPet:{kind:'squirrel'}},me:{shoulderPetKind:'squirrel',shoulderPetMesh:{},petAnchor:{getWorldPosition:v=>v.set(.1,1.6,0)}},
  mode:'game',inTent:false,inSecretCave:false,faintUntil:0,soundOn:true,eventAudioReady:()=>true,
  tone:(...args)=>tones.push(args),camera:{},P:{x:0,y:0,z:0},W:400,Hh:700,
  chunks:new Map(),itemInfo:type=>({chestnut:{name:'밤'},sansam:{name:'산삼'},songi:{name:'송이'}}[type]||null),
  takenUntil:()=>0};
vm.createContext(ctx);vm.runInContext(src,ctx);
const exec=(s)=>vm.runInContext(s,ctx);
const first={id:'chunk:1',kind:'fruit',type:'chestnut',mesh:{parent:{},visible:true,position:{x:19,y:0,z:0}}};
ctx.chunks.set('chunk',{items:[first]});
exec('updateShoulderSquirrelWhisper(.6)');
assert.equal(tones.length,2,'two quiet squirrel squeaks play');
assert.equal(labels.children.length,1,'only one small bubble appears');
assert.equal(labels.children[0].classList.contains('hide'),false);
assert.match(labels.children[0].style.transform,/translate\(/,'bubble tracks the shoulder in screen coordinates');
assert.equal(labels.children[0].children[0].textContent,'찍찍…!');
assert.equal(labels.children[0].children[1].textContent,'근처에 채집물이 있어!');
now=1800;assert.equal(exec('checkSquirrelWhisperNearby()'),false,'no repeated message while standing near same item');
now=4000;exec('updateShoulderSquirrelWhisper(.6)');
assert.equal(labels.children[0].classList.contains('hide'),true,'bubble disappears on its own');
ctx.P.x=21;now=5000;
assert.equal(exec('checkSquirrelWhisperNearby()'),false,'one-shot while still within reset distance');
ctx.P.x=50;now=6000;exec('checkSquirrelWhisperNearby()');
ctx.P.x=0;now=13000;
assert.equal(exec('checkSquirrelWhisperNearby()'),true,'same target re-arms after leaving 24m');
assert.equal(tones.length,4);
// All normal field-guide categories are eligible; out-of-guide decoys, removed and invisible are not.
ctx.chunks.set('chunk',{items:[{id:'d',kind:'decoy',type:'unknown',mesh:{parent:{},visible:true,position:{x:2,y:0,z:0}}},
  {id:'invisible',kind:'herb',type:'sansam',mesh:{parent:{},visible:false,position:{x:3,y:0,z:0}}}]});
ctx.P.x=0;now=28000;exec('checkSquirrelWhisperNearby()');
assert.equal(tones.length,4,'non-collectibles and invisible resources do not alert');
const second={id:'chunk:2',kind:'mush',type:'songi',mesh:{parent:{},visible:true,position:{x:14,y:0,z:0}}};
ctx.chunks.get('chunk').items.push(second);
ctx.soundOn=false;now=30000;
assert.equal(exec('checkSquirrelWhisperNearby()'),true,'visual bubble still works when sounds muted');
assert.equal(tones.length,4,'squeaks respect sound mute');
// A recorded shoulder companion must be the pet actually displayed on the rebuilt avatar.
ctx.save.shoulderPet={kind:'redsquirrel'};ctx.me.shoulderPetKind='squirrel';
exec('updateShoulderSquirrelWhisper(.6)');
assert.equal(labels.children[0].classList.contains('hide'),true,'no alert if shoulder mesh is not restored');
ctx.me.shoulderPetKind='redsquirrel';ctx.playerRank=9;ctx.soundOn=true;
exec('updateShoulderSquirrelWhisper(.6)');
assert.equal(labels.children[0].classList.contains('hide'),true,'locked until Lv.10');
ctx.playerRank=10;ctx.inTent=true;
exec('updateShoulderSquirrelWhisper(.6)');
assert.equal(labels.children[0].classList.contains('hide'),true,'no bubble inside tent');
console.log('어깨 동물 20m 탐지 검사 통과: 도감 자원 필터, 1회 말풍선/찍찍, 24m 재진입, 표시 수명, 어깨 위치, 음소거, Lv.10/텐트, 재접속 아바타 복원');
