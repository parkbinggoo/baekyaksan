/* ================= AUDIO ================= */
let AC=null, soundOn=true, audioOutput=null;
let faintMix=1, placeMix=1;
function refreshAudioMaster(){if(!AC||!audioOutput)return;const t=AC.currentTime;audioOutput.gain.cancelScheduledValues(t);audioOutput.gain.setTargetAtTime(faintMix*placeMix,t,.15)}
function ac(){
  if(!AC){try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    audioOutput=AC.createGain(); audioOutput.gain.value=1; audioOutput.connect(AC.destination);refreshAudioMaster();
  }catch(e){}}
  return AC;
}
function faintSoundVolume(remainingMs){
  if(!AC||!audioOutput)return;
  const progress=remainingMs<=0?1:Math.max(0,Math.min(1,(30000-remainingMs)/30000));
  faintMix=progress*progress*(3-2*progress);
  refreshAudioMaster();
}
function setPlaceAudio(inTent){placeMix=inTent ? .72 : 1;refreshAudioMaster();}
function tone(f,dur,type='sine',vol=.12,slide=0,delay=0){
  if(!soundOn) return; const a=ac(); if(!a) return;
  const t=a.currentTime+delay, o=a.createOscillator(), g=a.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.045,dur*.22));g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  o.connect(g);g.connect(audioOutput);o.start(t);o.stop(t+dur+.05);
}
function thud(){ if(!soundOn) return; const a=ac(); if(!a) return;
  const t=a.currentTime, n=a.sampleRate*.12, b=a.createBuffer(1,n,a.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);
  const s=a.createBufferSource(), f=a.createBiquadFilter(), g=a.createGain(); f.type='lowpass';f.frequency.value=480; g.gain.value=.25;
  s.buffer=b;s.connect(f);f.connect(g);g.connect(audioOutput);s.start(t); tone(110,.12,'triangle',.12,.6);
}
function chime(rar){const base=[392,494,587,784,988]; const n=rar>=4?5:3; for(let i=0;i<n;i++) tone(base[i],.62,'sine',.057,1,i*.11); if(rar>=4) tone(1175,1,'sine',.026,1,.55)}
