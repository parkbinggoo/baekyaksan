/* ===== SETTINGS-ONLY TERRAIN / BACKGROUND REFRESH =====
 * Manual button under Settings. Never invoked by normal jumps or climbs.
 * Saves the current browser profile and resumes once after a page reload.
 * Uses only a short-lived, consumed-once session entry (no raw PIN).
 */
const SETTINGS_RELOAD_KEY='baekyaksan-settings-resume-v1';
const SETTINGS_RELOAD_MAX_AGE_MS=25000;
let settingsReloadPending=false;
function softRepairNearbyTerrain(){
  // Fallback for browsers denying session storage; never log the player out.
  try{
    target=null;pending=null;
    for(const c of [...chunks.values()])disposeChunk(c);
    chunkFailures.clear();chunkQueue=[];chunkKey='';chunkBuildT=0;
    lastClimbRockCheck=0;cachedClimbRock=null;
    updateChunks(P.x,P.z,true,0);
    onResize();
    toast('주변 지형을 다시 불러왔습니다.');
  }catch(e){console.warn('백약산 지형 자체 복구 오류:',e);toast('지형 복구가 완전하지 않습니다. 일반 새로고침을 이용해 주세요.')}
}
function refreshWorldFromSettings(){
  if(settingsReloadPending||mode!=='game')return;
  if(inSecretCave||inTent||caveOffering||climbing){
    toast('동굴·텐트·등반 중에는 바깥 산길에서 새로고침해 주세요.');return;
  }
  if(!activeCredential||!activeProfileKey){
    closeGameSettings();softRepairNearbyTerrain();return;
  }
  save.pos={x:+P.x.toFixed(2),z:+P.z.toFixed(2)};
  persist();
  try{
    const cred=activeCredential;
    if(!readProfileDoc(cred))throw new Error('기기에 저장한 기록을 확인할 수 없습니다.');
    sessionStorage.setItem(SETTINGS_RELOAD_KEY,JSON.stringify({
      at:Date.now(),nick:cred.nick,verifier:cred.verifier
    }));
    settingsReloadPending=true;closeGameSettings();
    toast('지형과 배경을 새로고칩니다. 산행 기록과 현재 위치를 유지합니다.');
    setTimeout(()=>{
      try{window.location.reload()}catch(e){
        settingsReloadPending=false;
        try{sessionStorage.removeItem(SETTINGS_RELOAD_KEY)}catch(_e){}
        softRepairNearbyTerrain();
      }
    },350);
  }catch(e){
    console.warn('설정 새로고침의 자동 복귀 준비 실패',e);
    closeGameSettings();softRepairNearbyTerrain();
  }
}
function resumeAfterSettingsReload(){
  let payload;
  try{
    const value=sessionStorage.getItem(SETTINGS_RELOAD_KEY);
    if(!value)return false;
    sessionStorage.removeItem(SETTINGS_RELOAD_KEY);
    payload=JSON.parse(value);
  }catch(e){console.warn('새로고침 복귀 기록을 읽지 못했습니다.',e);return false}
  if(!payload||!Number.isFinite(payload.at)||Date.now()-payload.at>SETTINGS_RELOAD_MAX_AGE_MS||
     Date.now()<payload.at-2000||typeof payload.nick!=='string'||
     !/^[a-f0-9]{64}$/.test(payload.verifier||''))return false;
  const cred={nick:cleanNick(payload.nick),verifier:payload.verifier,key:PROFILE_STORE_PREFIX+payload.verifier};
  try{
    const doc=readProfileDoc(cred);
    if(!doc)return false;
    applyRecord(cred,doc.progress);
    $('nick').value=cred.nick;
    beginGame();
    try{updateChunks(P.x,P.z,true,0)}catch(e){console.warn('첫 지형 복구 재시도:',e)}
    toast('지형 새로고침 완료 · 기존 산행을 이어갑니다.');
    return true;
  }catch(e){console.warn('백약산 자동 이어하기 실패',e);return false}
}
