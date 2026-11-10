/* ---------------- Every tent has an independent, interactive campfire ---------------- */
const CAMP_FIRE_MS=3*60*1000,CAMP_FUEL_N=6,CAMP_SAVE_KEY='baekyaksan-campfires-v1';
// A deliberately unhurried cooking sequence; allow a few extra seconds of fire.
const COOK_TIMES={take:3.4,place:5.8,ingredients:13.6,salt:17.6,wok:24.2,finish:26.2,fork:28.0,end:34.0};
const COOK_FIRE_MIN_MS=39000;
function cookStageAt(elapsed){return elapsed<COOK_TIMES.take?0:elapsed<COOK_TIMES.place?1:elapsed<COOK_TIMES.ingredients?2:elapsed<COOK_TIMES.salt?3:elapsed<COOK_TIMES.wok?4:elapsed<COOK_TIMES.finish?5:elapsed<COOK_TIMES.fork?6:7}

const campStates=new Map();
try{const rows=JSON.parse(localStorage.getItem(CAMP_SAVE_KEY)||'[]');if(Array.isArray(rows))for(const row of rows){
  if(!Array.isArray(row)||!/^tent-\d{1,2}$/.test(row[0]||''))continue;
  const savedFuel=Number.isInteger(row[1])?clamp(row[1],0,9):0;
  const savedFire=Number.isFinite(row[2])&&row[2]>Date.now()&&row[2]<Date.now()+CAMP_FIRE_MS+5000?row[2]:0;
  // Older saves may already contain 6–9 twigs: honor the new six-twig rule.
  const until=savedFire||(savedFuel>=CAMP_FUEL_N?Date.now()+CAMP_FIRE_MS:0);
  const fuel=until?0:clamp(savedFuel,0,CAMP_FUEL_N-1);
  const stamp=Number.isFinite(row[3])?row[3]:0;
  campStates.set(row[0],{fuel:until?0:fuel,fireUntil:until,updatedAt:stamp});
}}catch(e){}
function storeCampStates(){try{localStorage.setItem(CAMP_SAVE_KEY,JSON.stringify([...campStates].map(([id,s])=>[id,s.fuel,s.fireUntil,s.updatedAt])))}catch(e){}}
function campState(t){if(!campStates.has(t.id))campStates.set(t.id,{fuel:0,fireUntil:0,updatedAt:0});return campStates.get(t.id)}
function updateCampState(tid,fuel,until,stamp,share){
 if(!/^tent-\d{1,2}$/.test(tid)||!Number.isInteger(fuel)||fuel<0||fuel>=CAMP_FUEL_N||!Number.isFinite(until)||!Number.isFinite(stamp))return;
 if(until>Date.now()+CAMP_FIRE_MS+5000||stamp>Date.now()+120000)return;
 const old=campStates.get(tid);if(old&&old.updatedAt>stamp)return;
 campStates.set(tid,{fuel:until>Date.now()?0:fuel,fireUntil:until>Date.now()?until:0,updatedAt:stamp});storeCampStates();
 if(share)netPublish('fireState',{camp:tid,fuel,fireUntil:until,updatedAt:stamp});
}
function makeTentCampfire(t){
 const g=new THREE.Group(),rock=M(0x777168),wood=M(0x60452c),char=M(0x342c25),iron=M(0x454747),orange=M(0xf09a42,{emissive:0x6e2700,emissiveIntensity:.5}),yellow=M(0xffd16a,{emissive:0x8c4c0c,emissiveIntensity:.55});
 const add=(geo,mat,x,y,z)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);g.add(o);return o};
 const angle=t.mesh.rotation.y,dx=Math.cos(angle)*4.25+Math.sin(angle)*.9,dz=-Math.sin(angle)*4.25+Math.cos(angle)*.9;
 const x=t.x+dx,z=t.z+dz;g.position.set(x,H(x,z)+.07,z);
 for(let i=0;i<9;i++){const a=i*Math.PI*2/9,m=add(new THREE.DodecahedronGeometry(.25,0),rock,Math.cos(a)*.76,.11,Math.sin(a)*.76);m.scale.set(1.1,.66,.7);m.rotation.y=a}
 for(let i=0;i<3;i++){const o=add(new THREE.CylinderGeometry(.105,.14,1.2,6),i===2?char:wood,0,.17,0);o.rotation.z=Math.PI/2;o.rotation.y=i*Math.PI/3}
 const flames=new THREE.Group();g.add(flames);
 for(let i=0;i<6;i++){const a=i*Math.PI*2/6,h=.5+(i%3)*.13;const f=new THREE.Mesh(new THREE.ConeGeometry(.16,h,4),i%2?orange:yellow);f.position.set(Math.cos(a)*.2,.32+h*.3,Math.sin(a)*.2);flames.add(f)}
 const glow=new THREE.PointLight(0xff9d4c,0,10,2);glow.position.set(0,.80,0);glow.castShadow=false;g.add(glow);
 // The hit area is larger than the stone ring for reliable mobile tapping.
 const hit=add(new THREE.CylinderGeometry(1.1,1.1,1.22,12),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}),0,.55,0);
 // Real hollow, round-bottomed cast-iron frying pan, not a solid disk.
 // The old circular slab beneath the pan is intentionally removed.
 const pan=new THREE.Group();g.add(pan);pan.position.y=.90;pan.scale.setScalar(.38);pan.visible=false; // ~40 cm pan against a ~1.8 m hiker
 const panIron=M(0x343b3d,{side:THREE.DoubleSide}),rimIron=M(0x60686a),woodGrip=M(0x805337),steel=M(0xb7b6aa);
 const profile=[[0,0],[.30,0],[.38,.035],[.49,.155],[.52,.182],[.49,.204],[.455,.166],[.36,.096],[.27,.079],[0,.079]];
 const bowl=new THREE.Mesh(new THREE.LatheGeometry(profile.map(v=>new THREE.Vector2(v[0],v[1])),18),panIron);pan.add(bowl);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(.505,.018,5,22),rimIron);rim.rotation.x=Math.PI/2;rim.position.y=.185;pan.add(rim);
 // Handle points along local +Z toward the cook; two little rivets hold it to the bowl.
 const handle=new THREE.Mesh(new THREE.CylinderGeometry(.049,.055,.80,8),iron);handle.position.set(0,.155,.82);handle.rotation.x=Math.PI/2;pan.add(handle);
 const grip=new THREE.Mesh(new THREE.CylinderGeometry(.066,.062,.43,8),woodGrip);grip.position.set(0,.155,1.065);grip.rotation.x=Math.PI/2;pan.add(grip);
 for(const sx of [-1,1]){const rivet=new THREE.Mesh(new THREE.SphereGeometry(.024,6,5),steel);rivet.position.set(sx*.095,.19,.49);pan.add(rivet)}
 const food=new THREE.Group();food.position.y=.087;pan.add(food);
 // Separate handheld props: a tiny salt shaker and a four-pronged eating fork.
 const salt=new THREE.Group();g.add(salt);salt.scale.setScalar(.56);salt.visible=false;
 const saltBody=new THREE.Mesh(new THREE.CylinderGeometry(.087,.092,.22,8),M(0xdcc8aa));saltBody.position.y=.13;salt.add(saltBody);
 const saltLid=new THREE.Mesh(new THREE.CylinderGeometry(.093,.093,.065,8),steel);saltLid.position.y=.275;salt.add(saltLid);
 for(let i=0;i<5;i++){const a=i*2*Math.PI/5;const hole=new THREE.Mesh(new THREE.SphereGeometry(.008,4,3),M(0x45484a));hole.position.set(Math.cos(a)*.044,.311,Math.sin(a)*.044);salt.add(hole)}
 const saltDust=new THREE.Group();g.add(saltDust);saltDust.visible=false;
 for(let i=0;i<7;i++){const grain=new THREE.Mesh(new THREE.IcosahedronGeometry(.010+i%2*.004,0),M(0xf1efdc));saltDust.add(grain)}
 const fork=new THREE.Group();g.add(fork);fork.scale.setScalar(.54);fork.visible=false;
 const forkShaft=new THREE.Mesh(new THREE.CylinderGeometry(.014,.019,.39,6),steel);forkShaft.position.y=.195;fork.add(forkShaft);
 const forkNeck=new THREE.Mesh(new THREE.BoxGeometry(.10,.055,.025),steel);forkNeck.position.y=.405;fork.add(forkNeck);
 for(let i=0;i<4;i++){const tine=new THREE.Mesh(new THREE.CylinderGeometry(.006,.008,.12,5),steel);tine.position.set((i-1.5)*.026,.49,0);fork.add(tine)}
 scene.add(g);g.visible=false;
 const camp={tent:t,group:g,hit,flames,glow,pan,food,handle,salt,saltDust,fork,x,z,y:g.position.y};g.userData.campfire=t;hit.userData.campfire=t;
 return camp;
}
let selectedCamp=null,cooking=null;
// Exactly four different 1–4★ ingredients per meal. Never consume 5★ treasures,
// branches, or an inedible pinecone as food; they remain in the backpack.
const COOK_INGREDIENT_COUNT=4;
function cookIngredientKeys(){return [...HERB_KEYS,...MUSH_KEYS,...Object.keys(FRUITS),...HONEY_KEYS].filter(k=>{
 const stars=itemInfo(k)?.rar||0;
 return (save.inv[k]||0)>0 && stars>=1 && stars<=4 && k!=='pinecone';
})}
// A set of prepared recipe titles: pick one from the best-matching family.
// Every title reflects at least one actually consumed ingredient.
function cookRecipeName(keys){
 const group=pred=>keys.filter(pred);
 const mushrooms=group(k=>!!MUSH[k]),leaves=group(k=>HERBS[k]?.cat==='leaf'),
       roots=group(k=>!!HERBS[k]?.root||HERBS[k]?.cat==='root'),
       honeys=group(k=>!!HONEY[k]),fruits=group(k=>!!FRUITS[k]),
       herbs=group(k=>!!HERBS[k]&&!leaves.includes(k)&&!roots.includes(k));
 const name=k=>itemInfo(k)?.name||'산나물';
 const one=arr=>arr.length?name(arr[0]):name(keys[0]);
 let titles;
 if(honeys.length&&fruits.length)titles=[
   `${one(fruits)}과 ${one(honeys)}의 숲속 팬구이`,
   `${one(honeys)} 곁들인 ${one(fruits)} 산열매볶음`,
   `${one(fruits)} 꿀향 산속 한 접시`];
 else if(mushrooms.length>=2)titles=[
   `${one(mushrooms)} 모둠버섯 볶음`,
   `${one(mushrooms)} 숲향 팬구이`,
   `${one(mushrooms)} 향긋한 산버섯 웍볶음`];
 else if(mushrooms.length&&leaves.length)titles=[
   `${one(leaves)}·${one(mushrooms)} 산채볶음`,
   `${one(mushrooms)}과 ${one(leaves)} 숲속 팬볶음`,
   `${one(leaves)} 버섯향 한 접시`];
 else if(mushrooms.length&&roots.length)titles=[
   `${one(roots)}·${one(mushrooms)} 뿌리채소 볶음`,
   `${one(mushrooms)} 넣은 ${one(roots)} 산속 팬구이`,
   `${one(roots)} 버섯향 웍볶음`];
 else if(honeys.length)titles=[
   `${one(honeys)} 향긋한 산채볶음`,
   `${one(honeys)}로 맛낸 숲속 한 접시`,
   `${one(honeys)} 꿀향 산나물 팬구이`];
 else if(leaves.length>=2)titles=[
   `${one(leaves)} 모둠 산나물 볶음`,
   `${one(leaves)} 산채 한 접시`,
   `${one(leaves)} 봄숲 팬볶음`];
 else if(roots.length>=2)titles=[
   `${one(roots)} 향긋한 뿌리약초 볶음`,
   `${one(roots)} 산뿌리 팬구이`,
   `${one(roots)} 숲속 모둠볶음`];
 else if(fruits.length>=2)titles=[
   `${one(fruits)} 가을숲 팬구이`,
   `${one(fruits)} 모둠 열매볶음`,
   `${one(fruits)} 산열매 한 접시`];
 else if(leaves.length&&roots.length)titles=[
   `${one(leaves)}·${one(roots)} 산나물볶음`,
   `${one(roots)} 넣은 ${one(leaves)} 팬구이`,
   `${one(leaves)} 향긋한 숲속 볶음`];
 else if(herbs.length)titles=[
   `${one(herbs)} 향긋한 산채볶음`,
   `${one(herbs)} 백약산 모둠볶음`,
   `${one(herbs)} 숲내음 팬구이`];
 else titles=[
   `${one(keys)} 백약산 모둠볶음`,
   `${one(keys)} 향긋한 숲속 팬구이`,
   `${one(keys)} 산속 한 접시`];
 return titles[Math.floor(Math.random()*titles.length)];
}
function closeCampPanel(){$('campPanel').classList.add('hide');selectedCamp=null}
function showCampPanel(t){if(!t||!t.camp||Date.now()<faintUntil||cooking||inTent)return;
 if(!nearTo(t.camp,5)){target={x:t.camp.x,z:t.camp.z,stop:3.0};pending={kind:'camp',tent:t};toast('캠프파이어 가까이로 이동합니다');return}
 selectedCamp=t;$('campPanel').classList.remove('hide');refreshCampPanel();}
function campTimeLeft(end){const seconds=Math.ceil(Math.max(0,end-Date.now())/1000);return `${Math.floor(seconds/60)}분 ${String(seconds%60).padStart(2,'0')}초`}
function refreshCampPanel(){if(!selectedCamp)return;const c=campState(selectedCamp),lit=c.fireUntil>Date.now(),avail=save.inv[TWIG_KEY]||0,materials=cookIngredientKeys();
 $('campDetail').textContent=lit?`🔥 모닥불 타는 중 · 남은 ${campTimeLeft(c.fireUntil)}\n🍳 1~4성 채집물 ${materials.length}종 보유 · 서로 다른 4종을 1개씩 사용\n🌟 5성은 귀한 거니 지금 먹을 순 없지…`:
 `🪵 불 피울 준비 ${c.fuel}/${CAMP_FUEL_N}개 · 가방의 나뭇가지 ${avail}개\n빈 나무를 두드려 나뭇가지를 모아 보세요.`;
 $('campFuelBtn').classList.toggle('hide',lit);$('campFuelBtn').disabled=lit||!avail;
 $('campFuelBtn').textContent=`나뭇가지 넣기 (${c.fuel}/${CAMP_FUEL_N})`;
 $('campCookBtn').classList.toggle('hide',!lit);$('campCookBtn').disabled=!lit||materials.length<COOK_INGREDIENT_COUNT||c.fireUntil-Date.now()<COOK_FIRE_MIN_MS||!!cooking;
 if(lit&&materials.length<COOK_INGREDIENT_COUNT)$('campDetail').textContent+='\n※ 1~4성 채집물이 서로 다른 종류로 4종 필요해';
}
function addCampFuel(){if(!selectedCamp||cooking)return;const t=selectedCamp,c=campState(t),now=Date.now();if(c.fireUntil>now)return;
 const have=save.inv[TWIG_KEY]||0;if(!have){toast('나뭇가지가 부족합니다 · 빈 나무를 두드려 보세요');return}
 const use=Math.min(have,CAMP_FUEL_N-c.fuel);if(use<=0)return;
 save.inv[TWIG_KEY]=have-use;if(!save.inv[TWIG_KEY])delete save.inv[TWIG_KEY];
 const fuel=c.fuel+use,fireUntil=fuel>=CAMP_FUEL_N?now+CAMP_FIRE_MS:0;
 updateCampState(t.id,fireUntil?0:fuel,fireUntil,now,true);
 persist();hudKey='';setGreens(me,totalCount());
 if(fireUntil){closeCampPanel();toast('🔥 모닥불이 켜졌다! 불을 다시 누르면 요리할 수 있습니다');chime(3);playFireLight()}
 else{refreshCampPanel();toast(`🪵 나뭇가지 ${use}개를 넣었다 · ${fuel}/${CAMP_FUEL_N}`)};
}
function cookPosition(c){const dx=c.x-c.tent.x,dz=c.z-c.tent.z,d=Math.hypot(dx,dz)||1;return {x:c.x+dx/d*1.18,z:c.z+dz/d*1.18}}
function requestCampCook(){if(!selectedCamp||cooking)return;const t=selectedCamp,c=campState(t);
 if(c.fireUntil-Date.now()<COOK_FIRE_MIN_MS){toast('요리를 완성하기 전에 불이 꺼집니다. 다시 불을 피워주세요');refreshCampPanel();return}
 if(cookIngredientKeys().length<COOK_INGREDIENT_COUNT){toast('🌟 5성은 귀한 거니 지금 먹을 순 없지… 1~4성 재료 4종을 모아 보자');return}
 closeCampPanel();const spot=cookPosition(t.camp);
 if(Math.hypot(P.x-spot.x,P.z-spot.z)<.24)beginCampCook(t);
 else{target={...spot,stop:.22};pending={kind:'cook',tent:t};toast('🍳 모닥불 앞으로 이동해 요리를 시작합니다')}
}
function beginCampCook(t){if(cooking||inTent||Date.now()<faintUntil)return;
 const state=campState(t);if(state.fireUntil-Date.now()<COOK_FIRE_MIN_MS){toast('요리할 시간이 부족합니다. 다시 불을 피워주세요');return}
 const available=cookIngredientKeys();if(available.length<COOK_INGREDIENT_COUNT){toast('1~4성 채집물이 서로 다른 종류로 4종 필요해');return}
 // Fisher–Yates shuffle; use exactly one of each of four different resources.
 // A 5★ item is never even included in the selection pool.
 for(let i=available.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[available[i],available[j]]=[available[j],available[i]]}
 const chosen=available.slice(0,COOK_INGREDIENT_COUNT),recipeName=cookRecipeName(chosen);
 for(const key of chosen){save.inv[key]--;if(save.inv[key]===0)delete save.inv[key]}
 cooking={tent:t,started:clock,ingredients:chosen,recipeName,visibleFood:0,lastStage:-1};
 target=null;pending=null;joy.x=joy.y=0;me.mode='cook';me.t=0;me.cookTime=0;
 P.h=Math.atan2(t.camp.x-P.x,t.camp.z-P.z);
 persist();hudKey='';setGreens(me,totalCount());
 toast(`🍳 ${recipeName} 요리 시작 · 재료 4종 준비!`);
 sendPresence(true);
}
function clearCampCookingProps(c){
 c.pan.visible=false;c.pan.rotation.set(0,0,0);c.food.clear();c.food.scale.setScalar(1);
 c.salt.visible=false;c.saltDust.visible=false;c.fork.visible=false;
}
function finishCampCook(){if(!cooking)return;
 const camp=cooking.tent.camp,recipeName=cooking.recipeName;clearCampCookingProps(camp);
 cooking=null;me.mode='idle';me.t=0;me.cookTime=0;me.cookStage=0;
 save.mealBuffUntil=Date.now()+GAME_DAY_MS;persist();hudKey='';
 hearts(new THREE.Vector3(P.x,P.y+1.85,P.z));chime(4);
 toast(`🍲 ${recipeName} 완성! 맛있게 먹었다 · 속도, 점프 증가`);
 sendPresence(true);
}
function tickCampCooking(dt){if(!cooking)return;
 const c=cooking.tent.camp,elapsed=clock-cooking.started,stage=cookStageAt(elapsed);
 if(stage===4){cookSfxClock+=dt;if(cookSfxClock>.56){cookSfxClock=0;eventNoise({duration:.25,volume:.040,lowpass:2600,highpass:350})}}else cookSfxClock=0;
 me.cookTime=elapsed;me.cookStage=stage;me.mode='cook';
 P.h=Math.atan2(c.x-P.x,c.z-P.z);
 const dx=P.x-c.x,dz=P.z-c.z,dist=Math.hypot(dx,dz)||1;
 const ux=dx/dist,uz=dz/dist,rx=uz,rz=-ux,py=P.y-c.group.position.y;
 const smooth=u=>{u=clamp(u,0,1);return u*u*(3-2*u)};
 if(cooking.lastStage!==stage){
   cooking.lastStage=stage;playCookingStage(stage);
   const text=['후라이팬을 꺼낸다…','🔥 후라이팬을 불 위에 얹는다.','🥬 산에서 캔 재료를 하나씩 넣는다.','🧂 소금을 톡톡 뿌린다.','🍳 후라이팬을 흔들며 볶는다!',`🍲 ${cooking.recipeName} 완성!`,'🍴 포크를 꺼낸다.','😋 맛있게 한 입씩 먹는다.'];
   if(stage>0)toast(text[stage]);
 }
 // Use the avatar's actual animated glove positions. Handle and utensils now follow
 // the hands rather than floating at approximate offsets from the campfire.
 me.root.updateMatrixWorld(true);c.group.updateMatrixWorld(true);
 const leftHand=c.group.worldToLocal(me.armL.localToWorld(new THREE.Vector3(0,-.60,.015)));
 const rightHand=c.group.worldToLocal(me.armR.localToWorld(new THREE.Vector3(0,-.60,.015)));
 c.pan.visible=elapsed>=.55;
 const panYaw=Math.atan2(ux,uz),wokWave=Math.sin((elapsed-COOK_TIMES.salt)*5.4);
 c.pan.rotation.set(stage===4?wokWave*.13:0,panYaw,stage===4?Math.sin((elapsed-COOK_TIMES.salt)*5.4)*.10:0);
 // Grip on the wooden handle touches the left palm when lifted. The pan
 // rests over the flames while ingredients and salt are being added.
 const endOfGrip=new THREE.Vector3(0,.155,1.065).multiplyScalar(c.pan.scale.x).applyEuler(c.pan.rotation);
 const heldPan=leftHand.clone().sub(endOfGrip);
 const onFire=new THREE.Vector3(0,.90,0);
 const restBlend=stage===0?0:
    stage===1?smooth((elapsed-COOK_TIMES.take)/(COOK_TIMES.place-COOK_TIMES.take)):
    stage===4?1-smooth((elapsed-COOK_TIMES.salt)/.65):
    stage===5?smooth((elapsed-COOK_TIMES.wok)/.65):1;
 c.pan.position.copy(heldPan).lerp(onFire,restBlend);
 const toss=stage===4?Math.abs(wokWave):0;
 const wanted=elapsed<COOK_TIMES.place?0:
    Math.min(cooking.ingredients.length,Math.max(0,Math.floor((elapsed-COOK_TIMES.place)/((COOK_TIMES.ingredients-COOK_TIMES.place-.85)/cooking.ingredients.length))+1));
 while(cooking.visibleFood<wanted){
  const i=cooking.visibleFood++,cols=[0x679146,0xb0793d,0xd19d54,0x864b3a],a=i*2.4;
  const chunk=new THREE.Mesh(new THREE.IcosahedronGeometry(.105+i%2*.024,0),M(cols[i%cols.length]));
  chunk.position.set(Math.sin(a)*.21,.015+(i%2)*.027,Math.cos(a)*.21);c.food.add(chunk);
  const leaf=new THREE.Mesh(new THREE.ConeGeometry(.063,.14,4),M(i%2?0x648943:0x88a450));
  leaf.rotation.x=Math.PI*.46;leaf.position.set(Math.sin(a)*.21+.028,.055,Math.cos(a)*.21-.03);c.food.add(leaf);
 }
 c.food.position.y=.087+(stage===4?toss*.10:0);
 // Salt shaker is held by the right glove, with grains falling toward the pan.
 c.salt.visible=stage===3;
 c.saltDust.visible=stage===3;
 if(stage===3){
   const shake=elapsed-COOK_TIMES.ingredients;
   c.salt.position.copy(rightHand).add(new THREE.Vector3(0,-.08,0));
   c.salt.rotation.set(-.60+.13*Math.sin(shake*16),panYaw,-.18);
   c.salt.updateMatrixWorld(true);
   const lid=c.group.worldToLocal(c.salt.localToWorld(new THREE.Vector3(0,.30,0)));
   c.saltDust.children.forEach((grain,i)=>{
     const phase=(shake*2.5+i*.43)%1;
     grain.position.set(lerp(lid.x,0,phase)+rx*(i-3)*.014,
       lerp(lid.y,.97,phase)+Math.sin(phase*Math.PI)*.075,
       lerp(lid.z,0,phase)+rz*(i-3)*.014);
   });
 }
 // Small fork: handle stays in the glove; the prongs turn toward the mouth
 // during each bite, instead of following an unrelated world-space arc.
 c.fork.visible=stage>=6;
 if(stage>=6){
   c.fork.position.copy(rightHand).add(new THREE.Vector3(0,-.045,0));
   if(stage===7){
     const mouth=c.group.worldToLocal(me.head.localToWorld(new THREE.Vector3(0,-.055,.15)));
     const toMouth=mouth.sub(c.fork.position).normalize();
     c.fork.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),toMouth);
     c.food.scale.setScalar(Math.max(.55,1-(elapsed-COOK_TIMES.fork)*.055));
   }else c.fork.rotation.set(.22,panYaw,-.12);
 }
 if(elapsed>=COOK_TIMES.end)finishCampCook();
}
function updateCampfires(dt){const now=Date.now();for(const t of tents){if(!t.camp)continue;const c=t.camp,s=campState(t),d=Math.hypot(P.x-c.x,P.z-c.z);
  c.group.visible=mode==='game'&&!inTent&&d<155;
  const burning=now<s.fireUntil;c.flames.visible=burning;
  // Sunlight fades gradually from late afternoon into dusk: the fire's
  // illumination grows smoothly with the darkening sky, then fades at dawn.
  // Keep its existing daytime warmth and only expand the light at night.
  const dusk=clamp((.72-SKYNOW.sun)/.72,0,1);
  const darkness=dusk*dusk*(3-2*dusk);
  c.glow.distance=10+9*darkness;
  c.glow.decay=2-.5*darkness;
  c.glow.intensity=burning&&d<38?( .45+2.10*darkness)+(.14+.28*darkness)*Math.sin(clock*11)**2:0;
  if(burning){c.flames.scale.setScalar(.9+.12*Math.sin(clock*8));c.flames.rotation.y+=dt*.35}
  if(!cooking||cooking.tent!==t){c.pan.visible=false;c.salt.visible=false;c.saltDust.visible=false;c.fork.visible=false}
 }
 if(selectedCamp){const t=selectedCamp;
  if(inTent||Math.hypot(P.x-t.camp.x,P.z-t.camp.z)>6||Date.now()<faintUntil)closeCampPanel();
  else if(Math.floor(clock*2)%2===0&&clock-(updateCampfires.lastUI||0)>.4){updateCampfires.lastUI=clock;refreshCampPanel()}
 }
 tickCampCooking(dt);
}
$('campFuelBtn').addEventListener('click',addCampFuel);
$('campCookBtn').addEventListener('click',requestCampCook);
$('campCloseBtn').addEventListener('click',closeCampPanel);
addEventListener('keydown',e=>{if(e.code==='Escape')closeCampPanel()});

const tents=[];const tentHintWorld=new THREE.Vector3();
