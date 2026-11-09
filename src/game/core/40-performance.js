/* ================= 성능 · 절전 ================= */
const IS_TOUCH=matchMedia('(pointer:coarse)').matches;
const PERF={eco:false,fps:60,view:3,fogK:1,occEvery:.08,chunkEvery:.06};
// Keep the player's chosen setting; on a first visit choose lighter rendering for iPhones.
try{const pref=localStorage.getItem('baekyaksan-eco');PERF.eco=IOS_CLOUD_SAFE||pref==='1'}catch(e){PERF.eco=IOS_CLOUD_SAFE}
function applyPerf(){
  const dpr=devicePixelRatio||1;
  PERF.fps=PERF.eco?30:60;PERF.view=PERF.eco?2:3;PERF.fogK=PERF.eco?.72:1;PERF.occEvery=PERF.eco?.16:.08;PERF.chunkEvery=PERF.eco?.13:.06;
  renderer.setPixelRatio(PERF.eco?Math.min(dpr,1)*.75:Math.min(dpr,IS_TOUCH?1.5:1.75));
  sun.castShadow=!PERF.eco;
  if(sun.shadow.map&&sun.shadow.mapSize.x!==(IS_TOUCH?1024:2048)){sun.shadow.map.dispose();sun.shadow.map=null}
  sun.shadow.mapSize.set(IS_TOUCH?1024:2048,IS_TOUCH?1024:2048);
  VIEW=PERF.view;onResize();
  const b=$('ecoBtn');if(b){b.classList.toggle('on',PERF.eco);b.textContent=PERF.eco?'절전 켬':'절전'}
  try{localStorage.setItem('baekyaksan-eco',PERF.eco?'1':'0')}catch(e){}
}
