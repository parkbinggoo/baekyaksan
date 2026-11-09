/* ================= 3D MAIN ================= */
const SAVE3='baekyaksan3d-v1'; // Old single-browser record; kept for one-time migration.
const TWIG_KEY='fallenTwig',MEAL_SPEED_MULT=1.32,MEAL_JUMP_MULT=1.175;
const PROFILE_STORE_PREFIX='baekyaksan-profile-v2:', PROFILE_APP='baekyaksan3d', PROFILE_FORMAT=2;
let save={inv:{},known:{},won:0,taken:{},nick:'',color:0,pos:null,bagCap:10,lanternLevel:1,stats:{}};
try{const s=JSON.parse(localStorage.getItem(SAVE3)||'null');if(s&&s.inv)save=Object.assign(save,s)}catch(e){}
const legacySave=JSON.parse(JSON.stringify(save));
let activeProfileKey='',activeCredential=null;
function profileProgress(){
  const pos=(typeof P!=='undefined'&&mode==='game')?{x:+P.x.toFixed(2),z:+P.z.toFixed(2)}:save.pos;
  return {inv:save.inv,known:save.known||{},won:+save.won||0,color:save.color|0,pos,faintUntil:Math.max(0,faintUntil||0),bagCap:bagLimit(),lanternLevel:lanternLevel(),stats:save.stats||{},highestRank:playerRank,mealBuffUntil:+save.mealBuffUntil||0};
}
function profileDocument(cred,progress){return {app:PROFILE_APP,format:PROFILE_FORMAT,profile:{name:cred.nick,verifier:cred.verifier},progress,updatedAt:Date.now()}}
function persist(){
  if(!activeCredential||!activeProfileKey)return;
  try{localStorage.setItem(activeProfileKey,JSON.stringify(profileDocument(activeCredential,profileProgress())))}catch(e){console.warn('백약산 기록을 기기에 저장하지 못했습니다.',e)}
}
const totalCount=()=>Object.values(save.inv).reduce((a,b)=>a+(Number.isFinite(b)?b:0),0);
function mealBoosted(){return (+save.mealBuffUntil||0)>Date.now()}
const RESPAWN_MS=20*60*1000,sharedTaken=new Map();
// Five-star resources retain the SAME unique slot ID and species, but each
// successful pickup (or failed delicate dig) advances its deterministic location.
// Store the counter separately from profile saves so older JSON files still load.
const RARE_WORLD_KEY='baekyaksan-rare-locations-v1',rareMoves=new Map(),rareDirtyChunks=new Set();
try{
 const data=JSON.parse(localStorage.getItem(RARE_WORLD_KEY)||'[]');
 if(Array.isArray(data))for(const row of data.slice(-4000)){
   if(!Array.isArray(row)||typeof row[0]!=='string'||row[0].length>90||
      !Number.isInteger(row[1])||row[1]<1||row[1]>100000||
      !Number.isFinite(row[2]))continue;
   rareMoves.set(row[0],{cycle:row[1],until:row[2]});
   if(row[2]>Date.now()&&row[2]<Date.now()+RESPAWN_MS+15000)sharedTaken.set(row[0],row[2]);
 }
}catch(e){}
function saveRareMoves(){try{localStorage.setItem(RARE_WORLD_KEY,JSON.stringify([...rareMoves].slice(-4000).map(([id,s])=>[id,s.cycle,s.until])))}catch(e){}}
function updateRareMove(id,cycle,until){
 if(!Number.isInteger(cycle)||cycle<1||cycle>100000||typeof id!=='string'||id.length>90)return false;
 const old=rareMoves.get(id);
 if(old&&(old.cycle>cycle||(old.cycle===cycle&&old.until>=until)))return false;
 rareMoves.set(id,{cycle,until});rareDirtyChunks.add(id.split(':')[0]);saveRareMoves();return true;
}
save.taken={};
function takenUntil(id){const end=sharedTaken.get(id)||0;if(end<=Date.now()){if(end)sharedTaken.delete(id);return 0}return end}
function markTaken(id,until,broadcast=false,rareType=null,remoteCycle=null){
 if(typeof id!=='string'||id.length>90||!Number.isFinite(until)||until<Date.now()||until>Date.now()+RESPAWN_MS+15000)return;
 const prev=sharedTaken.get(id)||0;
 // An incoming packet carries the authoritative cycle for this peer event.
 // Without an incoming cycle only locally harvested five-star items advance.
 let cycle=remoteCycle;
 if(rareType&&itemInfo(rareType)?.rar===5&&prev<until){
   cycle=(rareMoves.get(id)?.cycle||0)+1;
 }
 if(Number.isInteger(cycle)&&cycle>0)updateRareMove(id,cycle,until);
 if(prev>=until)return;
 sharedTaken.set(id,until);
 for(const c of chunks.values())for(let i=c.items.length-1;i>=0;i--){const it=c.items[i];if(it.id!==id)continue;
   if(it.mesh&&it.mesh.parent)it.mesh.parent.remove(it.mesh);c.items.splice(i,1)}
 if(broadcast)netPublish('harvest',{resource:id,until,...(cycle?{rareCycle:cycle}:{})});
}
function refreshRespawns(){const now=Date.now(),expired=new Set(rareDirtyChunks);
 rareDirtyChunks.clear();
 for(const [id,end] of sharedTaken)if(end<=now){sharedTaken.delete(id);expired.add(id.split(':')[0])}
 if(!expired.size)return;
 // Rebuild only affected loaded chunks, keeping normal 1-4 star slots intact.
 let touched=false;
 for(const key of expired){const c=chunks.get(key);if(!c)continue;disposeChunk(c);touched=true}
 if(touched){chunkKey='';chunkQueue=[];updateChunks(P.x,P.z,false,0)}
}
const JACKETS=[0x2f56b0,0xc0392b,0x2e7d4f,0xe08a1e,0x6a4a9a,0x4a4e55];
const ALT_K=2.5;                      // world unit → displayed metres
const SUMMIT_ALT=2500, SUMMIT_Z=-4560; // summit on the northbound trail
const CLOUD_Y=240;                    // sea of clouds height (world units)
