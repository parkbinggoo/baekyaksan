// Five-star perception is a local HUD skill; it never reveals coordinates or
// changes resource generation, harvest results, networking, or save records.
const RARE_SENSE_SCAN_SECONDS=.25,RARE_SENSE_TEMP_MS=3000;
let rareSenseScanTime=0;
const rareSenseBands={
  20:{inside:false,mode:'off',pending:false,until:0},
  10:{inside:false,mode:'off',pending:false,until:0}
};
// Lv.10+ inherit the fully persistent Lv.9 abilities.
function rareSenseMode(level,metres){
  if(level<6)return 'off';
  if(metres===20)return level===6?'timed':'persistent';
  if(metres===10)return level<8?'off':level===8?'timed':'persistent';
  return 'off';
}
function clearRareSense(){
  rareSenseScanTime=0;
  for(const range of [20,10]){
    const band=rareSenseBands[range];
    band.inside=false;band.mode='off';band.pending=false;band.until=0;
    $('rareSense'+range).classList.add('hide');
  }
  $('rareSense').classList.add('hide');
}
function updateRareSenseBand(range,near,rank,now,boarNearby){
  const band=rareSenseBands[range],mode=rareSenseMode(rank,range);
  if(mode==='off'||!near){
    band.inside=false;band.mode=mode;band.pending=false;band.until=0;
    return;
  }
  // A level change also arms a newly earned 10m sense while already in range.
  if(!band.inside||band.mode!==mode){
    band.inside=true;band.mode=mode;band.pending=mode==='timed';band.until=0;
  }
  if(mode==='timed'&&boarNearby&&band.until>0){
    // A danger warning interrupts the one-shot hint without replaying it.
    band.until=0;
  }
  if(mode==='timed'&&band.pending&&!boarNearby){
    band.pending=false;band.until=now+RARE_SENSE_TEMP_MS;
  }
}
function updateRareSense(dt){
  if(mode!=='game'||inTent||inSecretCave||playerRank<6||Date.now()<faintUntil){
    clearRareSense();return;
  }
  const now=performance.now();
  const boarNearby=!$('boarWarning').classList.contains('hide');
  rareSenseScanTime-=dt;
  if(rareSenseScanTime<=0){
    rareSenseScanTime=RARE_SENSE_SCAN_SECONDS;
    let closestSquared=Infinity;
    // Only loaded, real and currently harvestable 5-star resources count.
    // Keep the old vertical tolerance and scan frequency for mobile.
    for(const c of chunks.values()){
      if(closestSquared<=100)break;
      for(const it of c.items){
        if(!it.mesh||!it.mesh.parent||!it.mesh.visible||itemInfo(it.type)?.rar!==5||takenUntil(it.id))continue;
        const pos=it.mesh.position,dy=pos.y-P.y;
        if(Math.abs(dy)>6)continue;
        const dx=pos.x-P.x,dz=pos.z-P.z,d2=dx*dx+dz*dz;
        if(d2<closestSquared)closestSquared=d2;
        if(closestSquared<=100)break;
      }
    }
    updateRareSenseBand(20,closestSquared<=400,playerRank,now,boarNearby);
    updateRareSenseBand(10,closestSquared<=100,playerRank,now,boarNearby);
  }
  let anyVisible=false;
  for(const range of [20,10]){
    const band=rareSenseBands[range];
    const visible=!boarNearby&&band.inside&&(
      band.mode==='persistent'||(band.mode==='timed'&&band.until>now)
    );
    $('rareSense'+range).classList.toggle('hide',!visible);
    anyVisible=anyVisible||visible;
  }
  $('rareSense').classList.toggle('hide',!anyVisible);
}
