/* === LV.9/10 WILDLIFE TRUST & MOUNTS ===
 * Local mounts are temporary. Never rewrite profile records, wild-spawn slots,
 * cave coordinates, or the old herb-gathering animation/logic.
 * Network presence only announces the animal type so peers can render a mount.
 */
const RIDE_SPEC=Object.freeze({deer:{level:9,multiplier:1.30,height:.76},boar:{level:10,multiplier:1.50,height:.70}});
let mountedAnimal=null;
function rideAllowed(kind,level=playerRank){return !!RIDE_SPEC[kind]&&level>=RIDE_SPEC[kind].level}
function ridingMultiplier(){return mountedAnimal?RIDE_SPEC[mountedAnimal.kind.id]?.multiplier||1:1}
function ridingKind(){return mountedAnimal?.kind.id||''}
function ridingHeight(kind){return RIDE_SPEC[kind]?.height||0}
function isRiding(){return !!mountedAnimal}
function mountAnimal(animal){
  if(!animal||!animal.mesh?.visible||!animals.has(animal.key))return false;
  if(mountedAnimal)return true;
  const species=animal.kind.id;
  if(!RIDE_SPEC[species])return false;
  if(!rideAllowed(species)){
    toast(species==='boar'?'멧돼지 탑승은 Lv.10부터 가능합니다.':'고라니 탑승은 Lv.9부터 가능합니다.');return false;
  }
  if(mode!=='game'||inSecretCave||inTent||climbing||onRock||cooking||P.air||Date.now()<faintUntil||goldenHoeBusy())return false;
  if(Math.hypot(P.x-animal.x,P.z-animal.z)>2.9||Math.abs(H(animal.x,animal.z)-P.y)>2.2){
    toast('동물에게 조금 더 가까이 다가가세요.');return false;
  }
  mountedAnimal=animal;
  animal.chargeUntil=0;animal.chargeTarget=null;animal.vx=0;animal.vz=0;
  target=null;pending=null;curAct=null;queued=null;
  P.air=false;P.vy=0;P.speed=0;
  me.mode='ride';me.t=0;
  if($('animalDismountBtn'))$('animalDismountBtn').classList.remove('hide');
  toast((species==='deer'?'고라니':'멧돼지')+'에 올라탔다! 이동 속도 '+(Math.round((RIDE_SPEC[species].multiplier-1)*100))+'% 증가');
  sendPresence(true);
  return true;
}
function dismountAnimal(quiet=false){
  if(!mountedAnimal)return false;
  const animal=mountedAnimal;
  mountedAnimal=null;
  animal.x=P.x;animal.z=P.z;animal.originX=P.x;animal.originZ=P.z;
  animal.vx=0;animal.vz=0;animal.chargeUntil=0;animal.chargeTarget=null;
  animal.mesh.rotation.y=P.h;
  me.mode='idle';me.t=0;
  $('animalDismountBtn')?.classList.add('hide');
  if(!quiet)toast('동물에게서 내려왔다.');
  sendPresence(true);
  return true;
}
function syncMountedAnimal(dt){
  const a=mountedAnimal;
  if(!a)return;
  if(!animals.has(a.key)||!a.mesh.parent||inTent||inSecretCave||playerRank<RIDE_SPEC[a.kind.id].level){dismountAnimal(true);return}
  a.x=P.x;a.z=P.z;a.renderY=P.y;a.vx=0;a.vz=0;a.chargeUntil=0;
  a.mesh.position.set(P.x,P.y,P.z);
  a.mesh.rotation.y=P.h;
  a.mesh.visible=true;
  poseAnimal(a,dt,P.speed*4*ridingMultiplier(),false);
}
function tryMountAnimalFromRay(object){
  let o=object;
  while(o){
    if(o.userData?.animalKey){
      const animal=animals.get(o.userData.animalKey);
      if(animal&&RIDE_SPEC[animal.kind.id]){mountAnimal(animal);return true}
      return false;
    }
    o=o.parent;
  }
  return false;
}
// An older cached HTML revision may lack the new button. Repair locally so
// mixed index/bundle revisions never lock a rider on an animal.
function ensureAnimalDismountButton(){
  let button=$('animalDismountBtn');
  if(button)return button;
  button=document.createElement('button');
  button.id='animalDismountBtn';button.type='button';button.className='hide';button.textContent='내리기';
  button.setAttribute('aria-label','동물에서 내리기');
  Object.assign(button.style,{position:'fixed',right:'22px',bottom:'36px',width:'78px',height:'78px',
    borderRadius:'50%',background:'rgba(182,144,76,.91)',color:'#30291f',fontSize:'16px',
    fontWeight:'700',zIndex:'7',touchAction:'manipulation'});
  document.body.appendChild(button);
  return button;
}
ensureAnimalDismountButton()?.addEventListener('click',e=>{e.stopPropagation();dismountAnimal()});
