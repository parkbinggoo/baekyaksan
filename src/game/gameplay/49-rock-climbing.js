/* ======= BIG BOULDER CLIMBING =======
   Rocks are deterministic chunk geometry. One beat is 1.65 real seconds;
   five correctly timed presses raise the hiker gradually; a miss triggers
   the existing 3-minute faint system. Touch and keyboard use the same action.
*/
let climbing=null,onRock=null;
// Walk on the actual top of the rock, not the terrain beneath it.
const rockFootRay=new THREE.Raycaster(),rockWalkLimit=.40;
const rockFootOrigin=new THREE.Vector3(),rockFootDown=new THREE.Vector3(0,-1,0);
function rockSurfaceY(rock,x,z){
  if(!rock||!rock.mesh||!rock.mesh.parent)return rock?rock.topY+.1:H(x,z);
  rock.mesh.updateWorldMatrix(true,false);
  rockFootOrigin.set(x,rock.mesh.position.y+rock.mesh.scale.y*3+3,z);
  rockFootRay.set(rockFootOrigin,rockFootDown);rockFootRay.near=0;rockFootRay.far=rock.r*7+6;
  const hit=rockFootRay.intersectObject(rock.mesh,false);
  return hit.length?hit[0].point.y+.08:rock.topY+.10;
}
let lastClimbRockCheck=0,cachedClimbRock=null;
const CLIMB_STEPS=5,CLIMB_BEAT_MS=1650;
function nearestClimbableRock(){
 const now=performance.now();
 if(now-lastClimbRockCheck<200){return cachedClimbRock}
 lastClimbRockCheck=now;
 let best=null,dist=1e9;
 for(const c of chunks.values())for(const rock of c.rocks||[]){
   if(!rock.climbable)continue;
   const dx=P.x-rock.x,dz=P.z-rock.z,d=Math.hypot(dx,dz);
   if(d>rock.r+2.2||d<rock.r*.35||Math.abs(rock.groundY-P.y)>3.5)continue;
   if(d<dist){best=rock;dist=d}
 }
 cachedClimbRock=best;return best;
}
function beginClimb(rock){
 if(!rock||climbing||onRock||inTent||Date.now()<faintUntil)return;
 const dx=P.x-rock.x,dz=P.z-rock.z,len=Math.hypot(dx,dz)||1;
 climbing={rock,steps:0,start:performance.now(),dirX:dx/len,dirZ:dz/len};
 target=null;pending=null;joy.x=joy.y=0;P.speed=0;
 $('climbPanel').classList.remove('hide');$('climbTitle').textContent='큰 바위 오르기';
 $('climbInfo').textContent='초록색 구간에 맞춰 오르기를 누르세요 · 0/'+CLIMB_STEPS;
 $('jumpBtn').textContent='오르기';
}
function climbPhase(){return ((performance.now()-climbing.start)%CLIMB_BEAT_MS)/CLIMB_BEAT_MS}
function climbFail(){
 if(!climbing)return;
 const c=climbing,rock=c.rock;climbing=null;onRock=null;
 P.x=rock.x+c.dirX*(rock.r+1.8);P.z=rock.z+c.dirZ*(rock.r+1.8);
 P.y=H(P.x,P.z);P.air=false;P.vy=0;P.speed=0;
 $('climbPanel').classList.add('hide');
 faintAnimal({name:'바위 추락',fall:true,durationMs:2*60*1000});
}
function climbAct(){if(inSecretCave)return;
 if(Date.now()<faintUntil||inTent||cooking)return;
 if(onRock){
   const rock=onRock,dx=P.x-rock.x,dz=P.z-rock.z,len=Math.hypot(dx,dz)||1;
   P.x=rock.x+dx/len*(rock.r+1.8);P.z=rock.z+dz/len*(rock.r+1.8);P.y=H(P.x,P.z);
   onRock=null;me.root.rotation.x=0;me.mode='idle';P.speed=0;
   $('climbPanel').classList.add('hide');$('jumpBtn').textContent='점프';return;
 }
 if(!climbing){const rock=nearestClimbableRock();if(rock)beginClimb(rock);else jump();return;}
 const phase=climbPhase();
 if(phase<.33||phase>.67){climbFail();return}
 climbing.steps++;
 const rock=climbing.rock,k=climbing.steps/CLIMB_STEPS;
 P.x=rock.x+climbing.dirX*lerp(rock.r*.86,rock.r*.20,k);
 P.z=rock.z+climbing.dirZ*lerp(rock.r*.86,rock.r*.20,k);
  P.y=lerp(rock.groundY,rockSurfaceY(rock,P.x,P.z),k);
 P.air=false;P.speed=0;
 tone(365+k*160,.12,'sine',.075,1.18);
 if(climbing.steps>=CLIMB_STEPS){
   onRock=rock;climbing=null;P.y=rockSurfaceY(rock,P.x,P.z);
   $('climbPanel').classList.add('hide');$('jumpBtn').textContent='내려가기';
   toast('큰 바위에 올라섰다. 바위 위 채집물을 살펴보자.');
 }else{
   climbing.start=performance.now();
   $('climbInfo').textContent=`초록색 구간에 맞춰 오르기 · ${climbing.steps}/${CLIMB_STEPS}`;
 }
}
function updateRockClimbing(dt){
 const btn=$('jumpBtn');
 if(mode!=='game'||inTent){btn.classList.add('hide');return}
 if(climbing){btn.classList.remove('hide');
   $('climbPanel').classList.remove('hide');
   $('climbNeedle').style.left=(climbPhase()*99)+'%';
   btn.textContent='오르기';btn.classList.add('climbAvailable');
   return;
 }
 if(onRock){btn.classList.remove('hide');btn.textContent='내려가기';btn.classList.add('climbAvailable');return}
 const rock=nearestClimbableRock();
 btn.classList.toggle('hide',!IS_TOUCH&&!rock);
 btn.textContent=rock?'오르기':'점프';btn.classList.toggle('climbAvailable',!!rock);
 $('climbPanel').classList.add('hide');
}
