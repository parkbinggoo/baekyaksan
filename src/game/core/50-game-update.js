/* ================= GAME LOOP ================= */
let clock=0,lastRespawnCheck=-10,summitNotified=false;
function updateGame(dt){
  if(inSecretCave){updateSecretCaveInterior(dt);return}
  syncKST();syncWeather();const currentAlt=H(P.x,P.z)*ALT_K;updateRain(dt,currentAlt);updateAlpineSnow(dt,currentAlt);updateThunderstorm();
  const fainted=updFaint();if(!fainted&&!inTent)updateAnimals(dt);else if(boarAlertActive){$('boarWarning').classList.add('hide');boarAlertActive=false;}
  for(const c of chunks.values())for(const it of c.items)if(it.kind==='fruit'&&it.mesh&&it.fall!==false){
    const age=Math.max(0,(Date.now()-it.born)/1000),u=Math.min(1,age/2.8);
    it.mesh.position.y=it.groundY+1.8*(1-u)*(1-u);
    if(u<1)it.mesh.rotation.z=u*3.3;
  }
  if(Math.floor(clock)%5===0&&clock-lastRespawnCheck>5){lastRespawnCheck=clock;refreshRespawns()}
  const up=(keys.KeyW||keys.ArrowUp)?1:0,dn=(keys.KeyS||keys.ArrowDown)?1:0,lf=(keys.KeyA||keys.ArrowLeft)?1:0,rt=(keys.KeyD||keys.ArrowRight)?1:0;
  const fwd=up-dn-joy.y,str=rt-lf+joy.x;
  const rot=(keys.KeyQ?1:0)-(keys.KeyE?1:0);if(rot){camYaw+=rot*dt*1.8;lastDrag=clock}
  me.hasGoldenHoe=!!save.goldenHoeOwned;
  const busy=fainted||me.mode==='dig'||(me.mode==='joy'||me.mode==='joyspin')||!!cooking||inTent||!!climbing||goldenHoeBusy();
  let moveAmt=0,mvx=0,mvz=0;
  if(!busy&&(Math.abs(fwd)>.08||Math.abs(str)>.08)){target=null;pending=null;
    const fx=Math.sin(camYaw),fz=Math.cos(camYaw),rx=Math.sin(camYaw-Math.PI/2),rz=Math.cos(camYaw-Math.PI/2);
    mvx=fx*fwd+rx*str;mvz=fz*fwd+rz*str;const l=Math.hypot(mvx,mvz)||1;moveAmt=Math.min(1,l);mvx/=l;mvz/=l;
    const wantH=Math.atan2(mvx,mvz);let dh=wantH-P.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));P.h+=dh*Math.min(1,dt*12);if(Math.abs(dh)>1.6)moveAmt*=.35}
  else if(!busy&&target){const dx=target.x-P.x,dz=target.z-P.z,d=Math.hypot(dx,dz);
    if(d<target.stop){target=null;if(pending){const pd=pending;pending=null;if(pd.kind==='tent')openTent(pd.tent);else if(pd.kind==='camp')showCampPanel(pd.tent);else if(pd.kind==='cook')beginCampCook(pd.tent);else swing(pd)}}
    else{const want=Math.atan2(dx,dz);let dh=want-P.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));P.h+=dh*Math.min(1,dt*8);moveAmt=Math.abs(dh)<1.2?1:.15;mvx=Math.sin(P.h);mvz=Math.cos(P.h)}}
  if(inTent){moveAmt=0; mvx=mvz=0;}
  if(moveAmt){
    if(onRock){
      // Walk freely within this boulder's safe upper surface.
      const speed=2.55*offeringSpeedMultiplier(),limit=onRock.r*rockWalkLimit;
      let nx=P.x+mvx*moveAmt*speed*dt,nz=P.z+mvz*moveAmt*speed*dt;
      const dx=nx-onRock.x,dz=nz-onRock.z,d=Math.hypot(dx,dz);
      if(d>limit){nx=onRock.x+dx/d*limit;nz=onRock.z+dz/d*limit}
      P.x=nx;P.z=nz;
      if(target&&Math.hypot(target.x-onRock.x,target.z-onRock.z)>limit+1)target=null;
    }else{
      const slope=H(P.x+mvx*.6,P.z+mvz*.6)-P.y,spd=4.0*offeringSpeedMultiplier()*clamp(1-slope*.35,.6,1.15);
      let nx=P.x+mvx*moveAmt*spd*dt,nz=P.z+mvz*moveAmt*spd*dt;
      const d=nx-pathX(nz);if(Math.abs(d)>58)nx=pathX(nz)+Math.sign(d)*58;if(nz>34)nz=34;if(nz<SUMMIT_Z+2)nz=SUMMIT_Z+2;
      if(H(nx,nz)-P.y<.9||P.air){const q=collide(nx,nz);P.x=q.x;P.z=q.z}
    }
  }
  P.speed=Math.abs(moveAmt);
  if(!summitNotified&&Math.hypot(P.x-SUMMIT_X,P.z-(SUMMIT_Z+12))<9){summitNotified=true;toast('🏔 백약산 정상 · 해발 2,500m에 도착했습니다! 기념사진을 남겨보세요.');tone(392,.50,'sine',.055);tone(587,.7,'sine',.045,1,.18);}
  const gy=climbing?P.y:onRock?rockSurfaceY(onRock,P.x,P.z):H(P.x,P.z);
  if(P.air){P.vy-=14*dt;P.y+=P.vy*dt;if(P.y<=gy){P.y=gy;P.air=false;P.vy=0}}else P.y=lerp(P.y,gy,1-Math.exp(-dt*25));
  if(fainted){me.mode='faint'}
  else if(me.mode==='dig'){if(!hitDone&&me.t>DIG_T*.62){hitDone=true;if(curAct)impact(curAct)}if(me.mode==='dig'&&me.t>=DIG_T){me.mode='idle';me.t=0;if(queued){const q=queued;queued=null;if(nearTo(q.pos,2.6))swing(q)}}}
  else if(me.mode==='joy'||me.mode==='joyspin'){joyT-=dt;if(joyT<=0){me.mode='idle';me.t=0}}
  else if(goldenHoeBusy())me.mode='goldhoe';
  else if(cooking)me.mode='cook';
  else if(climbing)me.mode='climb';
  else me.mode=moveAmt?'walk':'idle';
  me.root.position.set(P.x,P.y+(fainted?.28:0),P.z);
  me.root.rotation.x=lerp(me.root.rotation.x,fainted?-Math.PI/2:climbing?-.20:0,Math.min(1,dt*12));
  {let dh=P.h-me.root.rotation.y;dh=Math.atan2(Math.sin(dh),Math.cos(dh));me.root.rotation.y+=dh*Math.min(1,dt*14)}poseHiker(me,dt,fainted?0:P.speed);
  if(me.mode==='joyspin')me.root.rotation.y+=Math.min(1,me.t/3.4)*Math.PI*4;
  for(const it of shaking){const m=it.mesh;if(!m||!m.parent){shaking.delete(it);continue}const u=m.userData;u.shake-=dt;if(u.shake>0)m.rotation.z=Math.sin(clock*60)*.36*u.shake;else{m.rotation.z=0;shaking.delete(it)}}
  if(target&&clock-lastDrag>2){let dh=P.h-camYaw;dh=Math.atan2(Math.sin(dh),Math.cos(dh));if(Math.abs(dh)<1.4)camYaw+=dh*Math.min(1,dt*1.2)}
  const cy=camYaw,tx=P.x,ty=P.y+1.45,tz=P.z,dist=camDist;
  occT+=dt;if(occT>=PERF.occEvery){occT=0;let pick=null,bestK=0,bestP=camPitch;
    for(const add of [0,.1,.2]){const pp=Math.min(1.2,camPitch+add);const kk=occlusion(tx,ty,tz,tx-Math.sin(cy)*dist*Math.cos(pp),ty+dist*Math.sin(pp),tz-Math.cos(cy)*dist*Math.cos(pp));if(kk>=1){pick=pp;break}if(kk>bestK){bestK=kk;bestP=pp}}
    occPitch=pick!==null?pick:bestP;
    const block=new Set();if(pick===null)occlusion(tx,ty,tz,tx-Math.sin(cy)*dist*Math.cos(occPitch),ty+dist*Math.sin(occPitch),tz-Math.cos(cy)*dist*Math.cos(occPitch),block);
    for(const t of hiddenTrees)if(!block.has(t))setTreeHidden(t,false);for(const t of block)setTreeHidden(t,true)}
  effPitch=lerp(effPitch,occPitch,1-Math.exp(-dt*(occPitch>effPitch?6:1.5)));
  let cxp=tx-Math.sin(cy)*dist*Math.cos(effPitch),czp=tz-Math.cos(cy)*dist*Math.cos(effPitch),cyp=ty+dist*Math.sin(effPitch);
  const gcy=H(cxp,czp)+.7;if(cyp<gcy)cyp=gcy;
  camera.position.lerp(v3.set(cxp,cyp,czp),1-Math.exp(-dt*10));camera.lookAt(tx+Math.sin(cy)*3,ty+1.1,tz+Math.cos(cy)*3);
  updateChunks(P.x,P.z,false,dt);
  for(let i=pulls.length-1;i>=0;i--){const p=pulls[i];p.t+=dt;const k=clamp(p.t/.7,0,1);p.m.position.y=p.y0+ease(k)*p.d;p.m.rotation.z=Math.sin(p.t*9)*.15*(1-k);if(p.t>1.1)p.m.scale.setScalar(Math.max(.001,1-(p.t-1.1)/.4));if(p.t>1.5){p.m.parent&&p.m.parent.remove(p.m);pulls.splice(i,1)}}
  updateSecretCaveExterior(dt);
  updateRareSense(dt);
  updateAnimalLookLabel(); updateTents();updateCampfires(dt);updateRockClimbing(dt);updateMysteriousAuraAlert();
  updParticles(dt);updLabels(dt);updOthers(dt);updateMyRankTag();updSky();updateNightSky(dt);updateFireflies();updAmbience(dt);updateWorldSounds(dt);
  updateHudCompass();
  hudT+=dt;if(hudT>.25){hudT=0;updHud()}
  presT+=dt;if(presT>.25){presT=0;sendPresence(false)}
  if(mapOpen){mapT+=dt;if(mapT>.15){mapT=0;drawMap()}}
  saveT+=dt;if(saveT>3){saveT=0;save.pos={x:+P.x.toFixed(1),z:+P.z.toFixed(1)};persist()}
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on')}
  if(foundTimer>0){foundTimer-=dt;if(foundTimer<=0)$('found').classList.remove('on')}
}
const pulls=[];let mapT=0,saveT=0,hudT=1,occT=1,occPitch=.26,effPitch=.26;
