/* ================= PORTABLE PLAYER RECORDS ================= */
function profileNotice(message,error=false){const el=$('profileStatus');el.textContent=message;el.style.color=error?'#a1261d':'#1f2b28'}
function numericPin(){const el=$('profilePin');el.value=el.value.replace(/\D/g,'').slice(0,4);return el.value}
// Same SHA-256 based verifier as before; WebCrypto first, ES5-compatible fallback.
function sha256Backup(str){
  const bytes=typeof TextEncoder!=='undefined'?Array.from(new TextEncoder().encode(str)):
    Array.from(unescape(encodeURIComponent(str)),c=>c.charCodeAt(0));
  const n=bytes.length,lo=(n*8)>>>0,hi=Math.floor(n/0x20000000)>>>0;
  bytes.push(128);while(bytes.length%64!==56)bytes.push(0);
  for(const x of [hi,lo])for(let i=3;i>=0;i--)bytes.push((x>>>(i*8))&255);
  const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const K=[
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  const rot=(x,n)=>(x>>>n)|(x<<(32-n));const w=new Int32Array(64);
  for(let o=0;o<bytes.length;o+=64){
    for(let i=0;i<16;i++)w[i]=(bytes[o+i*4]<<24)|(bytes[o+i*4+1]<<16)|(bytes[o+i*4+2]<<8)|bytes[o+i*4+3];
    for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(rot(x,7)^rot(x,18)^(x>>>3))+w[i-7]+(rot(y,17)^rot(y,19)^(y>>>10)))|0;}
    let[a,b,c,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){
      const t1=(h+(rot(e,6)^rot(e,11)^rot(e,25))+((e&f)^(~e&g))+K[i]+w[i])|0;
      const t2=((rot(a,2)^rot(a,13)^rot(a,22))+((a&b)^(a&c)^(b&c)))|0;
      h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
    }
    const next=[a,b,c,d,e,f,g,h];for(let i=0;i<8;i++)H[i]=(H[i]+next[i])|0;
  }
  return H.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('');
}
// This entry credential flow is restored from the confirmed working mobile build.
// Its original WebCrypto result and profile storage key remain unchanged.
async function getCredential(){
  const nick=cleanNick($('nick').value),pin=numericPin();
  if(!nick){profileNotice('별호(닉네임)를 먼저 입력해 주세요.',true);$('nick').focus();return null}
  if(!/^\d{4}$/.test(pin)){profileNotice('숫자로 된 4자리 코드를 입력해 주세요.',true);$('profilePin').focus();return null}
  // A secure GitHub Pages HTTPS origin supports native WebCrypto on iOS.
  // Only use the same SHA-256 algorithm locally when WebCrypto is unavailable.
  const canNative=!!(window.crypto&&window.crypto.subtle&&typeof TextEncoder!=='undefined');
  const normalized=nick.toLocaleLowerCase('ko-KR');
  const payload='baekyaksan-v2|'+normalized+'|'+pin;
  let verifier;
  if(canNative){
    try{const digest=await window.crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
      verifier=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
    }catch(e){verifier=sha256Backup(payload)}
  }else verifier=sha256Backup(payload);
  return {nick,verifier,key:PROFILE_STORE_PREFIX+verifier};
}
function validProfileDoc(doc,cred){return !!doc&&doc.app===PROFILE_APP&&doc.format===PROFILE_FORMAT&&
  doc.profile&&typeof doc.profile.name==='string'&&
  cleanNick(doc.profile.name).toLocaleLowerCase('ko-KR')===cred.nick.toLocaleLowerCase('ko-KR')&&
  doc.profile.verifier===cred.verifier&&doc.progress&&typeof doc.progress==='object'}
function readProfileDoc(cred){try{const doc=JSON.parse(localStorage.getItem(cred.key)||'null');return validProfileDoc(doc,cred)?doc:null}catch(e){return null}}
function normalizeRecord(raw){
  const inv={};const allow=new Set([...Object.keys(HERBS),...Object.keys(MUSH),...Object.keys(FRUITS),...HONEY_KEYS,TWIG_KEY,...GOLD_FIVE_BASES.map(goldenKey)]);
  if(raw&&raw.inv&&typeof raw.inv==='object'&&!Array.isArray(raw.inv))for(const [k,v] of Object.entries(raw.inv)){
    if(allow.has(k)&&Number.isFinite(v)&&v>=0)inv[k]=Math.min(100000,Math.floor(v));
  }
  const goldKnown={};
  if(raw?.goldKnown&&typeof raw.goldKnown==='object')for(const key of GOLD_FIVE_BASES){if(raw.goldKnown[key])goldKnown[key]=1}
  for(const key of Object.keys(inv))if(isGoldenKey(key))goldKnown[goldBase(key)]=1;
  const unlocked=Array.isArray(raw?.specialTitles?.unlocked)?[...new Set(raw.specialTitles.unlocked.filter(validSpecialTitle))]:[];
  const requested=validSpecialTitle(raw?.specialTitles?.equipped);
  const specialTitles={unlocked,equipped:unlocked.includes(requested)?requested:''};
  const known={};
  if(raw&&raw.known&&typeof raw.known==='object'&&!Array.isArray(raw.known))for(const [k,v] of Object.entries(raw.known)){ if(allow.has(k)&&v)known[k]=1; }
  for(const k of Object.keys(inv))if(k!==TWIG_KEY&&!isGoldenKey(k)) known[k]=1;
  const wonValue=Number.isFinite(raw?.won)?Math.max(0,Math.floor(raw.won)):0;
  const color=Number.isInteger(raw?.color)?clamp(raw.color,0,JACKETS.length-1):0;
  let pos=null;const p=raw?.pos;
  if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<20000&&p.z<=34&&p.z>-20000){
    const z=Math.max(SUMMIT_Z+2,p.z);pos={x:p.z<SUMMIT_Z+2?pathX(z):clamp(p.x,pathX(z)-55,pathX(z)+55),z};
  }
  const until=Number.isFinite(raw?.faintUntil)?clamp(raw.faintUntil,0,Date.now()+3*60*1000):0;
  const safeCap=BAG_LEVELS.includes(raw?.bagCap)?raw.bagCap:10;
  const safeLantern=Number.isInteger(raw?.lanternLevel)&&raw.lanternLevel>=1&&raw.lanternLevel<=3?raw.lanternLevel:1;
  const old=raw&&raw.stats&&typeof raw.stats==='object'&&!Array.isArray(raw.stats)?raw.stats:null;
  const harvestedTypes={};
  if(old&&old.harvestedTypes&&typeof old.harvestedTypes==='object')for(const k of Object.keys(old.harvestedTypes))if(allow.has(k)&&old.harvestedTypes[k])harvestedTypes[k]=1;
  // Old saves recorded discoveries but not lifetime harvests: discovered species
  // prove at least one earlier successful harvest; previous sold quantities cannot be recovered.
  for(const k of Object.keys(known))if(k!==TWIG_KEY&&!isGoldenKey(k))harvestedTypes[k]=1;
  const held=Object.entries(inv).reduce((sum,[k,n])=>sum+(k===TWIG_KEY?0:n),0);
  const statNumber=(v,minimum)=>Number.isFinite(v)?Math.max(minimum,Math.min(10000000,Math.floor(v))):minimum;
  const stats={
    totalCollected:statNumber(old?.totalCollected,held),
    careSuccess:statNumber(old?.careSuccess,0),
    sansamCollected:statNumber(old?.sansamCollected,inv.sansam||0),
    harvestedTypes
  };
  const highestRank=Number.isInteger(raw?.highestRank)?clamp(raw.highestRank,1,RANKS.length):1;
  const mealBuffUntil=Number.isFinite(raw?.mealBuffUntil)?clamp(raw.mealBuffUntil,0,Date.now()+20*60*1000):0;
  const buffKind=raw?.offeringBuffKind==='gold'?'gold':raw?.offeringBuffKind==='normal'?'normal':'';
  const buffCap=buffKind==='gold'?24*60*60*1000:40*60*1000;
  const buffUntil=buffKind&&Number.isFinite(raw?.offeringBuffUntil)?clamp(raw.offeringBuffUntil,0,Date.now()+buffCap):0;
  const goldenHoeOwned=!!raw?.goldenHoeOwned;
  const goldenHoeCooldownUntil=Number.isFinite(raw?.goldenHoeCooldownUntil)?Math.max(0,Math.min(Date.now()+24*60*60*1000,Math.floor(raw.goldenHoeCooldownUntil))):0;
  return {inv,known,goldKnown,specialTitles,won:wonValue,color,pos,faintUntil:until>Date.now()?until:0,bagCap:safeCap,lanternLevel:safeLantern,stats,highestRank,mealBuffUntil,offeringBuffKind:buffUntil>Date.now()?buffKind:'',offeringBuffUntil:buffUntil>Date.now()?buffUntil:0,goldenHoeOwned,goldenHoeCooldownUntil:goldenHoeCooldownUntil>Date.now()?goldenHoeCooldownUntil:0};
}
function setSwatchSelection(){[...$('swatches').children].forEach((b,i)=>b.classList.toggle('on',i===(save.color|0)))}
function applyRecord(cred,progress){
  const v=normalizeRecord(progress);
  save={inv:v.inv,known:v.known||{},goldKnown:v.goldKnown||{},specialTitles:v.specialTitles,won:+v.won||0,taken:{},nick:cred.nick,color:v.color,pos:v.pos,bagCap:v.bagCap,lanternLevel:v.lanternLevel,stats:v.stats,mealBuffUntil:v.mealBuffUntil,offeringBuffKind:v.offeringBuffKind,offeringBuffUntil:v.offeringBuffUntil,goldenHoeOwned:!!v.goldenHoeOwned,goldenHoeCooldownUntil:+v.goldenHoeCooldownUntil||0};
  playerRank=Math.max(earnedRank(),v.highestRank);save.highestRank=playerRank;
  P.x=v.pos?v.pos.x:pathX(24);P.z=v.pos?v.pos.z:24;P.y=H(P.x,P.z);
  P.h=Math.PI;P.speed=0;P.vy=0;P.air=false;camYaw=P.h;
  faintUntil=v.faintUntil;
  try{if(faintUntil>Date.now())localStorage.setItem('baek_faint_until',String(faintUntil));else localStorage.removeItem('baek_faint_until')}catch(e){}
  setSwatchSelection();hudKey='';
  activeProfileKey=cred.key;activeCredential=cred;
  try{localStorage.setItem('baekyaksan-last-nick',cred.nick)}catch(e){}
  persist();
}
function resolveProfile(cred){
  const existing=readProfileDoc(cred);if(existing)return {progress:existing.progress,origin:'기기 저장 기록'};
  let adopted=null;try{adopted=localStorage.getItem('baekyaksan-legacy-migrated')}catch(e){}
  if(!adopted&&legacySave.nick&&legacySave.nick.toLocaleLowerCase('ko-KR')===cred.nick.toLocaleLowerCase('ko-KR')){
    let until=0;try{until=+(localStorage.getItem('baek_faint_until')||0)}catch(e){}
    return {progress:{...legacySave,faintUntil:until},origin:'이전 버전 기록'};
  }
  return {progress:{inv:{},known:{},won:0,color:save.color,pos:null,faintUntil:0},origin:'새 산객'};
}
function showStartError(e){
  console.error('백약산 시작 오류',e);
  const fade=$('fade');fade.classList.remove('on');
  $('intro').classList.remove('hide');$('intro').style.opacity=1;
  zoomT=-1;mode='intro';
  $('continueBtn').disabled=false;
  profileNotice('게임 시작 중 오류가 발생했습니다. 다시 시도할 수 있습니다. 자세한 내용: '+String(e&&e.message||e).slice(0,100),true);
}
async function enterProfile(){
  if(zoomT>=0)return;
  const btn=$('continueBtn');btn.disabled=true;
  try{
    const cred=await getCredential();if(!cred)return;
    const resolved=resolveProfile(cred);
    applyRecord(cred,resolved.progress);
    if(resolved.origin==='이전 버전 기록')try{localStorage.setItem('baekyaksan-legacy-migrated',cred.verifier)}catch(e){}
    profileNotice(resolved.origin==='새 산객'?'새 산행을 시작합니다.':'저장 기록을 이어서 시작합니다.');
    try{ac();faintSoundVolume(faintUntil-Date.now());tone(392,.6,'sine',.07);tone(523,.9,'sine',.06,1,.2)}catch(e){console.warn('입장 효과음 건너뜀',e)}
    // A successful profile load enters the same game, regardless of intro WebGL FPS.
    zoomT=0;$('intro').style.transition='opacity .55s';$('intro').style.opacity=0;
    setTimeout(()=>{if(mode==='intro'&&zoomT>=0){
      try{beginGame()}catch(e){showStartError(e)}
    }},650);
  }catch(e){profileNotice('기록 확인 오류: '+String(e&&e.message||e).slice(0,100),true);console.error(e)}
  finally{btn.disabled=false}
}
// Export uses the existing v2 profile document, so old save files and inventory are unaffected.
function profileFileParts(doc){
  const filename='백약산_'+doc.profile.name.replace(/[^가-힣\w-]/g,'_').slice(0,12)+'_'+
    new Date().toISOString().slice(0,10)+'.json';
  return {filename,blob:new Blob([JSON.stringify(doc,null,2)],{type:'application/json'})};
}
function downloadProfile(doc){
  const {filename,blob}=profileFileParts(doc);
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function saveMessage(message,error=false){
  if(mode==='game')toast(message);
  else profileNotice(message,error);
}
// Must be invoked directly from the user's tap (no credential hashing awaits beforehand).
async function saveProfileToFiles(doc){
  const {filename,blob}=profileFileParts(doc);
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  const inApp=/KAKAOTALK|KakaoTalk|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent);
  // Desktop Chromium: genuine OS "Save as" dialog with an arbitrary destination.
  if(!ios&&!inApp&&typeof window.showSaveFilePicker==='function'){
    try{
      const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'백약산 게임 기록',accept:{'application/json':['.json']}}]});
      const out=await handle.createWritable();await out.write(blob);await out.close();
      saveMessage('선택한 위치에 기록 파일을 저장했습니다.');return;
    }catch(e){
      if(e&&e.name==='AbortError')return; // User cancelled the system picker.
      console.warn('저장 위치 선택 미지원, 다른 저장 방법 시도',e);
    }
  }
  // iOS Safari/Android Chrome: open the OS share sheet, where iOS offers "Save to Files".
  if(!inApp&&typeof navigator.share==='function'&&typeof File==='function'){
    const file=new File([blob],filename,{type:'application/json'});
    let supported=false;
    try{supported=!navigator.canShare||navigator.canShare({files:[file]})}catch(e){}
    if(supported){
      try{
        await navigator.share({files:[file],title:'백약산 산행 기록'});
        saveMessage('파일 메뉴를 닫았습니다. 파일 앱에 저장했는지 확인해 주세요.');return;
      }catch(e){
        if(e&&(e.name==='AbortError'||e.name==='NotAllowedError')){
          if(e.name==='AbortError')return;
          // Some embedded browsers deny the gesture; fall back to downloading.
        }
        console.warn('공유 메뉴로 기록 저장 실패, 다운로드 방식으로 전환',e);
      }
    }
  }
  downloadProfile(doc);
  saveMessage(inApp?'다운로드를 요청했습니다. 카카오톡 안에서 파일이 안 보이면 Safari/Chrome으로 게임을 열어 다시 저장해 주세요.':'기록 파일 다운로드를 시작했습니다. 기기 파일 앱의 다운로드 폴더를 확인해 주세요.');
}
let pendingSaveDoc=null;
// Prepare the profile before presenting the confirmation: native pickers need a fresh tap.
async function prepareProfileForExport(){
  if(mode==='game'){
    if(!activeCredential){saveMessage('먼저 산행 기록에 입장해 주세요.',true);return null}
    persist();return profileDocument(activeCredential,profileProgress());
  }
  const cred=await getCredential();if(!cred)return null;
  let doc=readProfileDoc(cred);
  if(!doc){
    const res=resolveProfile(cred);
    if(res.origin==='새 산객'){profileNotice('저장된 기록이 없습니다. 이어서 하기로 산행을 시작해 주세요.',true);return null}
    doc=profileDocument(cred,normalizeRecord(res.progress));
  }
  return doc;
}
function getReadySaveDoc(){
  if(mode==='game'&&activeCredential){persist();return profileDocument(activeCredential,profileProgress())}
  return pendingSaveDoc;
}
async function exportProfile(asDownload=false){
  const doc=getReadySaveDoc();if(!doc){saveMessage('저장할 산행 기록을 찾지 못했습니다.',true);return}
  try{
    if(asDownload){downloadProfile(doc);saveMessage('기록 파일을 다운로드했습니다. 파일 앱의 다운로드 폴더를 확인해 주세요.');}
    else await saveProfileToFiles(doc);
  }catch(e){saveMessage('파일 저장 중 오류가 발생했습니다. 다운로드 방식을 이용해 주세요.',true);console.error(e)}
}
async function importProfileFile(file){
  if(!file)return;
  try{
    const cred=await getCredential();if(!cred)return;
    if(file.size>1024*1024)throw new Error('파일이 너무 큽니다 (1MB 초과)');
    const raw=JSON.parse(await file.text());
    if(!validProfileDoc(raw,cred)){profileNotice('저장 파일의 닉네임 또는 4자리 코드가 일치하지 않습니다.',true);return}
    const progress=normalizeRecord(raw.progress);
    if(readProfileDoc(cred)&&!confirm('이 기기에 저장된 동일한 산객의 기록을 파일 내용으로 교체할까요?'))return;
    const record=profileDocument(cred,progress);
    localStorage.setItem(cred.key,JSON.stringify(record));
    profileNotice('기록을 불러왔습니다! 「이어서 하기」를 누르면 해당 위치에서 시작합니다.');
  }catch(e){profileNotice('올바른 백약산 저장 파일인지 확인해 주세요: '+(e.message||''),true)}
  finally{$('loadSaveInput').value=''}
}
