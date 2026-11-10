/* ================= 조심히 캐야 하는 약초 ================= */
const CARE={sansam:1.2,cheonma:1.0,ma:1.0,deodeok:.85,doraji:.8,jandae:.8,keunjorong:.9,jichi:.9,danggwi:.8,sanmaneul:.75,dokhwal:.7,seokchangpo:.9,gorancho:1.05,doldanpung:.8};
for(const k in CARE)if(HERBS[k])HERBS[k].care=CARE[k];
function careGapOfItem(kind,it){
  if(!it)return 0;
  if(kind==='honey')return HONEY[it.type]?.care||0;
  const info=itemInfo(it.golden?goldenKey(it.type):it.type)||itemInfo(it.type);
  if(info?.care)return info.care;
  if((kind==='herb'||kind==='mush')&&it.golden&&info?.rar===5)return it.goldenCare||1.08;
  return 0;
}
function careGapOfTarget(tg){return tg&&tg.item?careGapOfItem(tg.kind,tg.item):0}
function careFailureMercy(tg){
  const it=tg?.item;if(!it||!save.goldenHoeOwned||it.goldenHoeMercyUsed||tg.kind==='honey')return false;
  if(!careGapOfTarget(tg))return false;
  queued=null;pending=null;curAct=null;it.hits=0;it.goldenHoeMercyUsed=true;
  floatMsg(tg.pos,'황금 호미가 버텨줬다! 한 번 더 기회');
  toast('황금 호미의 힘으로 채집물이 사라지지 않았다. 한 번 더 도전할 수 있다!');
  tone(523,.24,'sine',.05);tone(659,.22,'sine',.035,1,.08);
  return true;
}
function careFail(tg){
  const it=tg.item;if(!it||takenUntil(it.id))return;
  if(careFailureMercy(tg))return;
  if(tg.kind==='honey'){
    queued=null;pending=null;curAct=null;it.hits=0;
    markTaken(it.id,Date.now()+RESPAWN_MS,true,it.type);
    burst(tg.pos.clone().add(new THREE.Vector3(0,.48,0)),12,true);
    tone(180,.48,'sawtooth',.08,1.6);tone(280,.48,'sawtooth',.055,.8,.04);
    toast('벌집을 너무 빠르게 건드렸다! 벌 떼에게 쏘였다…');
    faintAnimal({name:'벌 떼',bees:true,durationMs:60000});return;
  }
  queued=null;pending=null;curAct=null;it.hits=0;
  markTaken(it.id,Date.now()+RESPAWN_MS,true,it.type);
  floatMsg(tg.pos,'캐기 실패… 약초가 사라졌다 ㅠㅠ');toast('뿌리가 끊어져 채집에 실패했다…');
  tone(180,.35,'triangle',.06,.6);
}
const shaking=new Set();
