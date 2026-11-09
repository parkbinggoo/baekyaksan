/* ================= 조심히 캐야 하는 약초 ================= */
const CARE={sansam:1.2,cheonma:1.0,ma:1.0,deodeok:.85,doraji:.8,jandae:.8,keunjorong:.9,jichi:.9,danggwi:.8,sanmaneul:.75,dokhwal:.7,seokchangpo:.9,gorancho:1.05,doldanpung:.8};
for(const k in CARE)if(HERBS[k])HERBS[k].care=CARE[k];
function careFail(tg){
  const it=tg.item;if(!it||takenUntil(it.id))return;
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
