import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const root=new URL('../src/game/',import.meta.url);
const read=async file=>readFile(new URL(file,root),'utf8');
const riding=await read('world/47c-animal-riding.js');
const wildlife=await read('world/48-wildlife-update.js');
const states=await read('world/47-wildlife-states.js');
const network=await read('network/38-multiplayer.js');
const loop=await read('core/50-game-update.js');
const input=await read('input/34-pointer-and-keyboard.js');
const avatar=await read('graphics/20-hiker-avatar.js');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/id="animalDismountBtn".*>내리기</);
assert.match(input,/tryMountAnimalFromRay\(h.object\)/);
assert.match(loop,/\*ridingMultiplier\(\)/);
assert.match(loop,/syncMountedAnimal\(dt\)/);
assert.match(avatar,/h.mode==='ride'/);
assert.match(network,/ride:ridingKind\(\)==='deer'/);
assert.match(network,/o.ride=.*'deer'/);
assert.match(network,/createAnimal\(kind\)/);
assert.match(states,/playerRank>=10\)return false/);

const classes={add(){},remove(){},contains(){return false}};
const dismountEl={classList:classes,addEventListener(type,callback){if(type==='click')this.click=callback}};
const scene={};
const player={x:0,z:0,y:0,air:false,vy:0,speed:0,h:0};
const mount={key:'test-deer',kind:{id:'deer'},mesh:{visible:true,parent:{},position:{set(x,y,z){this.x=x;this.y=y;this.z=z}},rotation:{y:0}},x:1,z:1,originX:1,originZ:1};
const animals=new Map([[mount.key,mount]]);
let rank=8,alerts=[],netCalls=0;
const ctx=vm.createContext({Math,Date,Number,playerRank:rank,mode:'game',inSecretCave:false,inTent:false,
  climbing:null,onRock:null,cooking:null,faintUntil:0,P:player,animals,me:{mode:'idle',t:0},
  goldenHoeBusy:()=>false,H:()=>0,sendPresence:()=>netCalls++,toast:s=>alerts.push(s),
  target:null,pending:null,curAct:null,queued:null,poseAnimal(){},$:(id)=>id==='animalDismountBtn'?dismountEl:null});
vm.runInContext(riding,ctx);
const run=src=>vm.runInContext(src,ctx);
assert.equal(run('ridingMultiplier()'),1);
assert.equal(run("rideAllowed('deer')"),false);
assert.equal(run("rideAllowed('boar')"),false);
assert.equal(run('mountAnimal(animals.get("test-deer"))'),false);
assert.equal(run('isRiding()'),false);
ctx.playerRank=9;
assert.equal(run("rideAllowed('deer')"),true);
assert.equal(run("rideAllowed('boar')"),false);
assert.equal(run('mountAnimal(animals.get("test-deer"))'),true);
assert.equal(run('isRiding()'),true);
assert.equal(run('ridingMultiplier()'),1.30);
run('P.x=13;P.z=18;syncMountedAnimal(.016)');
assert.equal(mount.x,13);assert.equal(mount.z,18);
assert.equal(mount.mesh.position.x,13);assert.equal(mount.mesh.position.z,18);
assert.equal(dismountEl.click!==undefined,true);
run('dismountAnimal()');
assert.equal(run('isRiding()'),false);
assert.equal(run('ridingMultiplier()'),1);
assert.equal(netCalls,2);
ctx.playerRank=10;
assert.equal(run("rideAllowed('boar')"),true);
assert.equal(run('RIDE_SPEC.boar.multiplier'),1.5);
assert.equal(run('RIDE_SPEC.deer.level'),9);

// Exercise the existing animal locomotion code with real branches and lightweight scene mocks.
let nearest={x:1,z:0,dist:1,moving:true,rank:9};
let rnk=9;
const kind={id:'deer',hab:'ground',fear:22,scale:.76};
const animal={key:'d',kind,x:0,z:0,originX:0,originZ:0,phase:0,range:0,mesh:{parent:{},visible:true,rotation:{y:0},position:{set(x,y,z){this.x=x;this.y=y;this.z=z}}}};
const animalMap=new Map([['d',animal]]);
const tracker=vm.createContext({Math,Number,Date,playerRank:9,animalBuildT:0,animals:animalMap,refreshAnimals(){},mountedAnimal:null,
 nearestHiker:()=>nearest,animalAwake:()=>true,gameMin:120,H:()=>0,BOAR_CHARGE_RANGE:6,
 BOAR_CHASE_LIMIT:8.5,BOAR_CONTACT_RANGE:1.4,BOAR_SUMMIT_FREE_ALT:2290,lastAnimalAttack:0,
 isBoarFreeArea:()=>false,summitForbidsBoar:()=>false,removeWildAnimal(){},
 P:{x:1,z:0,y:0,speed:0},me:{mode:'idle'},poseAnimal(){},syncMountedAnimal(){},updateBoarWarning(){},nearbyWildSound(){}});
const updater=wildlife.slice(0,wildlife.indexOf('/* Wildlife nameplates'));
vm.runInContext(updater,tracker);
vm.runInContext('updateAnimals(.16)',tracker);
assert.equal(animal.vx||0,0,'Lv9 player should not cause deer to flee');
assert.equal(animal.vz||0,0,'Lv9 player should not cause deer to flee');
nearest.rank=8;animal.vx=0;animal.vz=0;
vm.runInContext('updateAnimals(.16)',tracker);
assert(Math.abs(animal.vx)>0.02||Math.abs(animal.vz)>0.02,'Lv8 and below retain animal fleeing');
// A Lv10 player is never a boar charge target. Lv9 still has the original risk.
animal.kind={id:'boar',hab:'ground',fear:13,scale:.75};animal.x=0;animal.z=0;animal.vx=0;animal.vz=0;animal.chargeUntil=0;animal.chargeTarget=null;
nearest.rank=10;nearest.moving=true;vm.runInContext('updateAnimals(.16)',tracker);
assert.equal(animal.chargeUntil||0,0,'Lv10 must not trigger boar charge');
nearest.rank=9;vm.runInContext('updateAnimals(.16)',tracker);
assert(animal.chargeUntil>Date.now(),'Lv9 boar behavior unchanged (still dangerous)');
console.log('동물 탑승 검사 통과: Lv9 고라니 30%, Lv10 멧돼지 50%, Lv9 비회피, Lv10 비공격, 터치/내리기/멀티플레이 연결.');
