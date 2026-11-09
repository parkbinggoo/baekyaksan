/* ================= 숲 소리 (전부 WebAudio로 합성) ================= */
let AMB=null;
function ambInit(){
  const a=ac();if(!a||AMB)return;
  const master=a.createGain();master.gain.value=.79;master.connect(audioOutput);
  const n=a.sampleRate*2,buf=a.createBuffer(1,n,a.sampleRate),d=buf.getChannelData(0);let b0=0,b1=0;
  for(let i=0;i<n;i++){const w=Math.random()*2-1;b0=.99*b0+w*.05;b1=.9*b1+w*.2;d[i]=(b0+b1+w*.15)*.6}
  const water=a.createGain();water.gain.value=0;water.connect(master);
  for(const [f,q,lf,dep,level] of [[470,.55,.17,60,.70],[1250,.65,.29,135,.26]]){
    const s=a.createBufferSource();s.buffer=buf;s.loop=true;
    const bp=a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=q;
    const layer=a.createGain();layer.gain.value=level;
    const o=a.createOscillator(),og=a.createGain();o.frequency.value=lf;og.gain.value=dep;
    o.connect(og);og.connect(bp.frequency);o.start();s.connect(bp);bp.connect(layer);layer.connect(water);s.start();
  }
  AMB={a,master,water,buf,next:{},bubbleT:0};
}
function pan(a,p){const s=a.createStereoPanner?a.createStereoPanner():null;if(s)s.pan.value=p;return s}
function voice(t,dur,build,gain,p){const a=AMB.a,g=a.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+Math.min(.065,dur*.32));g.gain.setValueAtTime(gain,t+dur*.62);g.gain.exponentialRampToValueAtTime(.0005,t+dur);
  const sp=pan(a,p||0);if(sp){g.connect(sp);sp.connect(AMB.master)}else g.connect(AMB.master);build(g,t,dur);}
function osc(dst,type,t,dur,f0,f1,shape){const o=AMB.a.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency[shape==='lin'?'linearRampToValueAtTime':'exponentialRampToValueAtTime'](f1,t+dur);o.connect(dst);o.start(t);o.stop(t+dur+.02);return o}
function noise(dst,t,dur,f,q){const s=AMB.a.createBufferSource();s.buffer=AMB.buf;const bp=AMB.a.createBiquadFilter();bp.type='bandpass';bp.frequency.value=Math.min(f,2600);bp.Q.value=Math.min(q,2.4);const lp=AMB.a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2900;lp.Q.value=.55;s.connect(bp);bp.connect(lp);lp.connect(dst);s.start(t,Math.random());s.stop(t+dur+.02)}
const R=(a,b)=>a+Math.random()*(b-a);
const SND={
  bird(t){const p=R(-.8,.8),n=2+Math.floor(R(0,4)),f=R(1500,2450);for(let i=0;i<n;i++){const tt=t+i*R(.09,.16);voice(tt,R(.11,.19),(g,t0,dd)=>osc(g,'sine',t0,dd,f*R(.9,1.15),f*R(.76,1.12)),.017,p)}},
  cuckoo(t){const p=R(-.6,.6),reps=2+Math.floor(R(0,3));for(let i=0;i<reps;i++){const tt=t+i*.95;voice(tt,.22,(g,t0,d)=>osc(g,'sine',t0,d,690,650),.034,p);voice(tt+.3,.38,(g,t0,d)=>osc(g,'sine',t0,d,540,510),.034,p)}},
  dove(t){const p=R(-.7,.7);[[0,.34],[.48,.2],[.75,.36]].forEach(([o,dd])=>voice(t+o,dd,(g,t0,d)=>osc(g,'triangle',t0,d,430,370),.03,p))},
  woodpecker(t,v=.07,p=R(-.8,.8)){const n=12+Math.floor(R(0,8));for(let i=0;i<n;i++)voice(t+i/19,.025,(g,t0,d)=>noise(g,t0,d,1050,1.6),v*.65*(1-i/n*.5),p)},
  cicada(t){const p=R(-.7,.7),dur=R(2.5,4.2);voice(t,dur,(g,t0,d)=>{const am=AMB.a.createGain();am.gain.value=.5;const lf=AMB.a.createOscillator();lf.frequency.setValueAtTime(5,t0);lf.frequency.linearRampToValueAtTime(9,t0+d);const lg=AMB.a.createGain();lg.gain.value=.5;lf.connect(lg);lg.connect(am.gain);lf.start(t0);lf.stop(t0+d);am.connect(g);noise(am,t0,d,2350,1.7);osc(am,'sine',t0,d,2600,2250,'lin')},.009,p)},
  higurashi(t){const p=R(-.7,.7);for(let i=0;i<6;i++)voice(t+i*.32,.3,(g,t0,d)=>osc(g,'sine',t0,d,2650,2200),.009,p)},
  crow(t){const p=R(-.8,.8),reps=2+Math.floor(R(0,2));for(let i=0;i<reps;i++)voice(t+i*.5,.32,(g,t0,d)=>{const lp=AMB.a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1250;lp.connect(g);osc(lp,'sawtooth',t0,d,560,380);noise(lp,t0,d,760,1.1)},.027,p)},
  cricket(t){const p=R(-.9,.9),f=R(2300,3000);for(let k=0;k<3;k++)voice(t+k*.055,.06,(g,t0,d)=>osc(g,'sine',t0,d,f,f*.96),.009,p)},
  scops(t){const p=R(-.6,.6),reps=3+Math.floor(R(0,4));for(let i=0;i<reps;i++){const tt=t+i*1.9;voice(tt,.13,(g,t0,d)=>osc(g,'sine',t0,d,920,880),.025,p);voice(tt+.2,.2,(g,t0,d)=>osc(g,'sine',t0,d,810,760),.025,p)}},
  owl(t){const p=R(-.6,.6);voice(t,.4,(g,t0,d)=>osc(g,'sine',t0,d,350,330),.05,p);voice(t+.55,.6,(g,t0,d)=>osc(g,'sine',t0,d,320,290),.05,p)},
  squirrel(t,v=.03,p=0){for(let k=0;k<3;k++)voice(t+k*.11,.08,(g,tt,d)=>osc(g,'sine',tt,d,1000+k*100,1490+k*70),v*.8,p)},
  redsquirrel(t,v=.03,p=0){for(let k=0;k<4;k++)voice(t+k*.09,.065,(g,tt,d)=>osc(g,'sine',tt,d,880+k*100,1380+k*65),v*.8,p)},
  rabbit(t,v=.018,p=0){voice(t,.18,(g,tt,d)=>noise(g,tt,d,650,1.2),v,p);voice(t+.23,.13,(g,tt,d)=>noise(g,tt,d,920,1.5),v*.6,p)},
  deer(t,v=.04,p=0){for(let k=0;k<2;k++)voice(t+k*.4,.23,(g,tt,d)=>osc(g,'sawtooth',tt,d,380,260),v,p)},
  boar(t,v=.055,p=0){for(let k=0;k<2;k++)voice(t+k*.45,.34,(g,tt,d)=>{const lp=AMB.a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=450;lp.connect(g);osc(lp,'sawtooth',tt,d,115,86);noise(lp,tt,d,270,.7)},v,p)},
  magpie(t,v=.04,p=0){for(let k=0;k<4;k++)voice(t+k*.19,.13,(g,tt,d)=>osc(g,'triangle',tt,d,1050+k*85,760+k*55),v*.75,p)},
  pheasant(t,v=.04,p=0){for(let k=0;k<3;k++)voice(t+k*.2,.18,(g,tt,d)=>osc(g,'triangle',tt,d,850,580),v*.82,p)},
  turtledove(t,v=.045,p=0){for(const [o,f,dd] of [[0,390,.32],[.38,325,.25],[.73,355,.40]])voice(t+o,dd,(g,tt,d)=>osc(g,'sine',tt,d,f,f*.87),v,p)},
  owlNearby(t,v=.045,p=0){for(const [o,f,dd] of [[0,365,.38],[.52,305,.52]])voice(t+o,dd,(g,tt,d)=>osc(g,'sine',tt,d,f,f*.9),v,p)},
  eagleowl(t,v=.05,p=0){for(let k=0;k<3;k++)voice(t+k*.66,.42,(g,tt,d)=>osc(g,'triangle',tt,d,245,207),v,p)},
  frog(t){const p=R(-.8,.8);for(let i=0;i<2+Math.floor(R(0,3));i++)voice(t+i*.22,.14,(g,t0,d)=>{const lp=AMB.a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;lp.connect(g);osc(lp,'square',t0,d,R(160,210),130)},.03,p)},
  bubble(t){const p=R(-.4,.4);voice(t,.055,(g,t0,d)=>osc(g,'sine',t0,d,R(330,560),R(550,850)),.0025,p)},
};
const CHORUS={'새벽':{bird:.06,scops:.018,owl:.022,cricket:.6},'아침':{bird:.31,woodpecker:.024,dove:.10,cuckoo:.025},'낮':{cicada:.09,bird:.16,dove:.055,cuckoo:.025,woodpecker:.015},'저녁':{higurashi:.07,crow:.035,bird:.045,owl:.018,scops:.012,cricket:.7},'밤':{cricket:1.3,scops:.025,owl:.028}};
let ambT=0;
function updAmbience(dt){
  if(!AMB)return;const a=AMB.a;if(a.state==='suspended')return;
  const ds=streamD(P.x,P.z),wf=clamp(1-(ds-1)/15,0,1);
  AMB.water.gain.setTargetAtTime(wf*wf*.085,a.currentTime,.9);
  ambT+=dt;if(ambT<.25)return;const step=ambT;ambT=0;
  const ph=phaseOf(gameMin/60),tbl=CHORUS[ph],alt=P.y*ALT_K,thin=clamp(1-(alt-1400)/1600,.35,1),t0=a.currentTime+.05;
  for(const k in tbl)if(Math.random()<tbl[k]*step*thin)SND[k](t0+Math.random()*.2);
  if(ph==='밤'&&wf>.2&&Math.random()<.6*wf*step)SND.frog(t0);
  if(wf>.55&&Math.random()<.38*wf*step)SND.bubble(t0+Math.random()*.2);
}
