/* === CONTEXTUAL SOUND · WebAudio only / no network audio assets ===
 * Calls to ac() remain user-gesture guarded by the browser; no timers or sources
 * are created while audio is suspended, muted, or the tab is hidden.
 */
let soundNoiseBuffer=null,fireSfxClock=0,stepSfxDistance=0,cookSfxClock=0,lastStepX=null,lastStepZ=null;
let caveAudio=null,rainAudio=null;
// Audio-context time keeps the threat cue and ambient ducking in sync.
let boarTensionUntil=0,lastBoarTensionAt=-30;
function eventAudioReady(){
  if(!soundOn||!AC||AC.state!=='running'||document.hidden)return null;
  return AC;
}
function eventNoiseBuffer(a){
  if(soundNoiseBuffer&&soundNoiseBuffer.sampleRate===a.sampleRate)return soundNoiseBuffer;
  const len=Math.round(a.sampleRate*2),buf=a.createBuffer(1,len,a.sampleRate),arr=buf.getChannelData(0);
  for(let i=0;i<len;i++)arr[i]=Math.random()*2-1;
  soundNoiseBuffer=buf;return buf;
}
function eventNoise({delay=0,duration=.25,volume=.04,lowpass=1200,highpass=0,pan=0}={}){
  const a=eventAudioReady();if(!a)return;
  const t=a.currentTime+delay,s=a.createBufferSource(),lp=a.createBiquadFilter(),g=a.createGain();
  s.buffer=eventNoiseBuffer(a);s.loop=duration>1.8;
  lp.type='lowpass';lp.frequency.value=lowpass;
  let head=lp;
  if(highpass){const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=highpass;head=hp;lp.connect(hp)}
  const stereo=a.createStereoPanner?a.createStereoPanner():null;
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(volume,t+Math.min(.09,duration*.18));
  g.gain.setValueAtTime(volume*.72,t+duration*.45);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  s.connect(lp);if(stereo){head.connect(stereo);stereo.pan.value=pan;stereo.connect(g)}else head.connect(g);
  g.connect(audioOutput);s.start(t,Math.random()*1.1);s.stop(t+duration+.025);
}
function playFireLight(){eventNoise({duration:.45,volume:.065,lowpass:2200,highpass:350});tone(165,.28,'triangle',.025,.65)}
function playTentZip(enter){
  eventNoise({duration:enter?.64:.52,volume:.10,lowpass:5300,highpass:650});
  tone(enter?580:730,.30,'triangle',.024,enter?1.6:.55,.08);
  eventNoise({delay:.28,duration:.16,volume:.035,lowpass:900});
}
function playCookingStage(stage){
  if(stage===0){eventNoise({duration:.19,volume:.044,lowpass:1100});tone(370,.07,'triangle',.025,.7)}
  if(stage===1){tone(540,.22,'triangle',.04,.63);eventNoise({delay:.06,duration:.16,volume:.035,lowpass:700})}
  if(stage===2){for(let i=0;i<3;i++)eventNoise({delay:i*.16,duration:.10,volume:.026,lowpass:1350})}
  if(stage===3){for(let i=0;i<4;i++)eventNoise({delay:i*.09,duration:.045,volume:.033,lowpass:4600,highpass:950})}
  if(stage===4){eventNoise({duration:1.0,volume:.070,lowpass:3400,highpass:390});tone(250,.22,'triangle',.026,1.24)}
  if(stage===5){for(let i=0;i<3;i++)tone([523,659,784][i],.26,'sine',.035,1,i*.15)}
  if(stage===6){tone(820,.11,'triangle',.033,.62)}
  if(stage===7){eventNoise({duration:.12,volume:.018,lowpass:1250})}
}
function playBoarTension(){
  // Original, accelerating low-register danger ostinato. A classic suspense
  // atmosphere, but not the melody or exact note pattern of any existing score.
  const a=eventAudioReady();if(!a)return;
  if(a.currentTime-lastBoarTensionAt<8)return; // avoid repeats on alert flicker
  lastBoarTensionAt=a.currentTime;
  const pitches=[110,146.83,130.81,164.81,116.54,174.61];
  let elapsed=0;
  for(let i=0;i<15;i++){
    const progress=i/14;
    const gap=.44-progress*.23; // rhythmic tension accelerates
    const pitch=pitches[i%pitches.length];
    const strength=.063+progress*.037;
    tone(pitch,gap*.83,'triangle',strength,1,elapsed);
    tone(pitch*.5,gap*.9,'sine',strength*.43,1,elapsed);
    if(i%3===2)eventNoise({delay:elapsed,duration:gap*.65,volume:.019+progress*.018,lowpass:540,highpass:45});
    elapsed+=gap;
  }
  tone(73.42,Math.max(.8,elapsed*.35),'sine',.041,1,0);
  boarTensionUntil=a.currentTime+elapsed+.65;
  if(AMB)AMB.master.gain.setTargetAtTime(.24,a.currentTime,.12);
  if(rainAudio)rainAudio.gain.gain.setTargetAtTime(rainAudio.gain.gain.value*.42,a.currentTime,.12);
}
function playSnowStep(){
  eventNoise({duration:.19,volume:.068,lowpass:2400,highpass:480,pan:(Math.random()-.5)*.12});
  eventNoise({delay:.045,duration:.12,volume:.044,lowpass:530,highpass:70});
}
function playThunder(delayed=0){
  // Deep rolling noise layered with sub-bass, following the light flash.
  eventNoise({delay:delayed,duration:3.5,volume:.23,lowpass:510,highpass:28});
  eventNoise({delay:delayed+.16,duration:2.7,volume:.12,lowpass:1600,highpass:55});
  for(let i=0;i<3;i++)tone(70+i*16,1.9,'sine',.042,.46,delayed+i*.36);
}
function playSansamCelebration(){
  // Five-note triumphant motif, intentionally original and gentle on mobile.
  const notes=[392,523.25,659.25,783.99,1046.5,1318.5];
  notes.forEach((f,i)=>tone(f,.35,'triangle',.050,1,i*.135));
  tone(523.25,1.05,'sine',.042,1,.84);
  tone(783.99,.92,'sine',.03,1,.92);
}
function saySansamFound(){
  try{
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))return;
    const utter=new SpeechSynthesisUtterance('심봤다!');utter.lang='ko-KR';utter.rate=.84;utter.pitch=1.15;utter.volume=.75;
    window.speechSynthesis.speak(utter);
  }catch(e){/* WebSpeech is optional on Safari. Musical cue is always available. */}
}
const CAVE_CHORDS=[
  [73.42,146.83,174.61,220.00,293.66],
  [58.27,116.54,146.83,174.61,233.08],
  [49.00,98.00,146.83,196.00,293.66],
  [55.00,110.00,164.81,220.00,329.63],
];
const CAVE_MELODY=[293.66,349.23,440,392,293.66,261.63,349.23,220];
function playCaveMusicNote(c,freq){
  const a=c.a,t=a.currentTime+.02,dur=2.55;
  const o=a.createOscillator(),filter=a.createBiquadFilter(),g=a.createGain();
  o.type='triangle';o.frequency.setValueAtTime(freq,t);
  filter.type='lowpass';filter.frequency.value=950;
  g.gain.setValueAtTime(.0001,t);
  g.gain.linearRampToValueAtTime(.037,t+.34);
  g.gain.setValueAtTime(.031,t+dur*.38);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(filter);filter.connect(g);g.connect(c.music);
  o.start(t);o.stop(t+dur+.03);
}
function beginCaveSound(){
  const a=eventAudioReady();if(!a||caveAudio)return;
  if(AMB){AMB.master.gain.setTargetAtTime(.025,a.currentTime,.32);AMB.water.gain.setTargetAtTime(0,a.currentTime,.18)}
  const main=a.createGain(),music=a.createGain(),drone=a.createGain(),caveWind=a.createGain();
  main.gain.value=.0001;main.connect(audioOutput);
  music.gain.value=.95;music.connect(main);
  drone.gain.value=.90;drone.connect(music);
  caveWind.gain.value=.022;caveWind.connect(main); // quieter cave airflow
  const nodes=[],harmonies=[];
  const volumes=[.087,.060,.046,.038,.022];
  for(let i=0;i<volumes.length;i++){
    const o=a.createOscillator(),g=a.createGain();
    o.type=i===2?'triangle':'sine';o.frequency.value=CAVE_CHORDS[0][i];g.gain.value=volumes[i];
    o.connect(g);g.connect(drone);o.start();nodes.push(o);harmonies.push(o);
  }
  const wind=a.createBufferSource(),filter=a.createBiquadFilter();wind.buffer=eventNoiseBuffer(a);wind.loop=true;
  filter.type='lowpass';filter.frequency.value=270;wind.connect(filter);filter.connect(caveWind);wind.start();nodes.push(wind);
  main.gain.setTargetAtTime(1,a.currentTime,.95);
  caveAudio={main,music,drone,nodes,harmonies,a,elapsed:0,chordIndex:0,melodyIndex:0,nextMelody:2.1,nextChord:7.5};
}
function endCaveSound(){
  if(AMB&&AC){AMB.master.gain.setTargetAtTime(.79,AC.currentTime,.60)}
  if(!caveAudio)return;
  const {main,nodes,a}=caveAudio;caveAudio=null;
  main.gain.cancelScheduledValues(a.currentTime);main.gain.setTargetAtTime(.0001,a.currentTime,.22);
  for(const node of nodes)try{node.stop(a.currentTime+1.4)}catch(e){}
}
function tickCaveSound(dt){
  if(!inSecretCave||inTent||!soundOn){endCaveSound();return}
  if(!caveAudio)beginCaveSound();
  if(!caveAudio)return;
  const c=caveAudio;c.elapsed+=dt;
  c.drone.gain.setTargetAtTime(.86+Math.sin(c.elapsed*.15)*.07,c.a.currentTime,.5);
  if(c.elapsed>=c.nextChord){
    c.chordIndex=(c.chordIndex+1)%CAVE_CHORDS.length;
    c.harmonies.forEach((o,i)=>o.frequency.setTargetAtTime(CAVE_CHORDS[c.chordIndex][i],c.a.currentTime,1.35));
    c.nextChord+=7.5;
  }
  if(c.elapsed>=c.nextMelody){
    playCaveMusicNote(c,CAVE_MELODY[c.melodyIndex%CAVE_MELODY.length]);
    c.melodyIndex++;
    c.nextMelody+=3.3;
  }
}
function updateRainSound(){
  const a=eventAudioReady();if(!a)return;
  if(!rainAudio){
    const src=a.createBufferSource(),hp=a.createBiquadFilter(),lp=a.createBiquadFilter(),gain=a.createGain();
    src.buffer=eventNoiseBuffer(a);src.loop=true;hp.type='highpass';hp.frequency.value=400;
    lp.type='lowpass';lp.frequency.value=2400;gain.gain.value=.0001;
    src.connect(hp);hp.connect(lp);lp.connect(gain);gain.connect(audioOutput);src.start();rainAudio={a,gain};
  }
  const boarDuck=boarTensionUntil>a.currentTime?.43:1;
  const volume=mode==='game'&&!inTent&&!inSecretCave&&Date.now()>=faintUntil?.026*weatherRain*boarDuck:0;
  rainAudio.gain.gain.setTargetAtTime(volume,rainAudio.a.currentTime,.45);
}
function updateWorldSounds(dt){
  updateRainSound();
  if(!eventAudioReady()||mode!=='game'||inTent||inSecretCave||Date.now()<faintUntil)return;
  // Positional, sparsely scheduled crackle; volume follows distance to the fire.
  fireSfxClock+=dt;
  if(fireSfxClock>.30){fireSfxClock=0;
    for(const t of tents){if(!t.camp||campState(t).fireUntil<Date.now())continue;
      const d=Math.hypot(P.x-t.camp.x,P.z-t.camp.z);
      if(d<17&&Math.random()<.48*(1-d/18)){eventNoise({duration:.10+Math.random()*.2,volume:.045*(1-d/19),lowpass:2100,highpass:280});break}
    }
  }
  // The playable snowy floor uses these exact altitude and patch thresholds.
  const travelled=lastStepX===null?0:Math.hypot(P.x-lastStepX,P.z-lastStepZ);
  lastStepX=P.x;lastStepZ=P.z;
  const alt=P.y*ALT_K;
  const patch=clamp(.63+vn(P.x*.044+4,P.z*.044-3)*.36,0,1);
  const coverage=clamp((alt-1530)/900,0,1)*clamp((patch-.22)*1.8,0,1);
  if(P.speed>.10&&travelled>.012&&travelled<2.5&&!P.air&&!climbing&&!onRock&&coverage>.36){
    stepSfxDistance+=travelled;
    if(stepSfxDistance>1.35){stepSfxDistance=0;playSnowStep()}
  }else stepSfxDistance=0;
}
