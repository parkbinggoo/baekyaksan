/* === Lv.10 SHOULDER SQUIRREL: QUIET 20m FIELD-GUIDE WHISPER ===
 * Scan only real, visible, currently harvestable journal collectibles.
 * Detect each item's approach once and re-arm after leaving 24m. A short
 * global cooldown avoids constant chirping in dense forests. No coordinates,
 * type, rarity or map markers are disclosed. No network broadcast.
 */
const SQUIRREL_WHISPER_RADIUS=20,SQUIRREL_WHISPER_RESET_RADIUS=24;
const SQUIRREL_WHISPER_SCAN_SECONDS=.55,SQUIRREL_WHISPER_DISPLAY_MS=2750;
const SQUIRREL_WHISPER_REST_MS=11500;
let squirrelWhisperScan=0,squirrelWhisperUntil=0,squirrelWhisperNextAt=0;
let squirrelWhisperNearby=new Set(),squirrelWhisperBubble=null;
const squirrelWhisperWorld=new THREE.Vector3(),squirrelWhisperScreen=new THREE.Vector3();
function hasWhisperingSquirrel(){
  return playerRank>=10&&
    (save.shoulderPet?.kind==='squirrel'||save.shoulderPet?.kind==='redsquirrel')&&
    me.shoulderPetKind===save.shoulderPet.kind&&!!me.shoulderPetMesh;
}
function ensureSquirrelWhisperBubble(){
  if(squirrelWhisperBubble?.parentNode)return squirrelWhisperBubble;
  const el=document.createElement('div');
  el.id='squirrelWhisper';el.className='hide';
  el.setAttribute('role','status');el.setAttribute('aria-live','polite');
  const squeak=document.createElement('strong');squeak.textContent='찍찍…!';
  const words=document.createElement('span');words.textContent='근처에 채집물이 있어!';
  el.append(squeak,words);$('labels').appendChild(el);
  // Cached older HTML may omit the new stylesheet; do not break entry.
  if(!document.querySelector('link[href*="17-squirrel-whisper.css"]')){
    const link=document.createElement('link');link.rel='stylesheet';
    link.href='./styles/17-squirrel-whisper.css?v=1.2.8-squirrelwhisper1';
    document.head.appendChild(link);
  }
  squirrelWhisperBubble=el;
  return el;
}
function hideSquirrelWhisper(reset=false){
  squirrelWhisperUntil=0;
  if(squirrelWhisperBubble)squirrelWhisperBubble.classList.add('hide');
  if(reset){squirrelWhisperNearby.clear();squirrelWhisperScan=0;}
}
function playSquirrelWhisperChirp(){
  // Soft, short paired squeaks; respect the existing mute and WebAudio gate.
  if(!soundOn||document.hidden||typeof eventAudioReady!=='function'||!eventAudioReady())return;
  tone(1220,.085,'triangle',.015,.75);
  tone(1090,.095,'sine',.014,.73,.125);
}
function checkSquirrelWhisperNearby(now=performance.now()){
  const nearby=new Set(),entered=[];
  for(const chunk of chunks.values())for(const it of chunk.items){
    if(!it?.id||!it.mesh?.parent||!it.mesh.visible||
       !['herb','mush','fruit','honey'].includes(it.kind)||!itemInfo(it.type)||takenUntil(it.id))continue;
    const p=it.mesh.position,dy=p.y-P.y;
    if(Math.abs(dy)>6)continue;
    const dx=p.x-P.x,dz=p.z-P.z,d2=dx*dx+dz*dz;
    if(d2>SQUIRREL_WHISPER_RESET_RADIUS*SQUIRREL_WHISPER_RESET_RADIUS)continue;
    nearby.add(it.id);
    if(d2<=SQUIRREL_WHISPER_RADIUS*SQUIRREL_WHISPER_RADIUS&&!squirrelWhisperNearby.has(it.id)){
      entered.push({id:it.id,d2});
    }
  }
  squirrelWhisperNearby=nearby;
  if(!entered.length||now<squirrelWhisperNextAt)return false;
  // One message per approach, even if several plants are clustered together.
  entered.sort((a,b)=>a.d2-b.d2);
  squirrelWhisperNextAt=now+SQUIRREL_WHISPER_REST_MS;
  squirrelWhisperUntil=now+SQUIRREL_WHISPER_DISPLAY_MS;
  ensureSquirrelWhisperBubble().classList.remove('hide');
  playSquirrelWhisperChirp();
  return true;
}
function updateShoulderSquirrelWhisper(dt){
  if(mode!=='game'||inTent||inSecretCave||Date.now()<faintUntil||!hasWhisperingSquirrel()){
    hideSquirrelWhisper(true);return;
  }
  squirrelWhisperScan-=dt;
  if(squirrelWhisperScan<=0){
    squirrelWhisperScan=SQUIRREL_WHISPER_SCAN_SECONDS;
    checkSquirrelWhisperNearby();
  }
  const el=squirrelWhisperBubble;
  if(!el||el.classList.contains('hide'))return;
  const now=performance.now();
  if(now>=squirrelWhisperUntil){hideSquirrelWhisper();return;}
  // Attach to the actual shoulder pet, not to a fixed HUD position.
  me.petAnchor.getWorldPosition(squirrelWhisperWorld);
  squirrelWhisperWorld.y+=.44;
  squirrelWhisperScreen.copy(squirrelWhisperWorld).project(camera);
  const p=squirrelWhisperScreen;
  if(p.z<=-1||p.z>=1||Math.abs(p.x)>1.05||Math.abs(p.y)>1.05){el.style.display='none';return;}
  el.style.display='';
  el.style.transform=`translate(${(p.x*.5+.5)*W}px,${(-p.y*.5+.5)*Hh}px) translate(-50%,-100%)`;
  el.style.opacity=String(Math.min(1,(squirrelWhisperUntil-now)/420));
}
