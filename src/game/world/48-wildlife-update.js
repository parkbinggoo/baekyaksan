function updateAnimals(dt){
 animalBuildT+=dt;if(animalBuildT>5){animalBuildT=0;refreshAnimals()}
 const t=Date.now()/1000,step=Math.min(dt,.08);
 const WILD_SPEED={
   squirrel:{idle:.65,flee:2.6},redsquirrel:{idle:.8,flee:3.3},
   rabbit:{idle:.75,flee:4.4},deer:{idle:1.2,flee:5.4},
   boar:{idle:1.2,flee:5.0},magpie:{idle:1.5,flee:5.6},
   woodpecker:{idle:.8,flee:4.6},pheasant:{idle:.9,flee:4.3},
   turtledove:{idle:1.4,flee:5.2},owl:{idle:.9,flee:4.5},eagleowl:{idle:1.0,flee:4.7}
 };
 for(const [animalKey,a] of animals){
   if(a.kind.id==='boar'&&(isBoarFreeArea(a.x,a.z)||summitForbidsBoar(a.x,a.z))){removeWildAnimal(animalKey,a);continue}
   const sp=a.kind,person=nearestHiker(a.x,a.z),awake=animalAwake(sp);
   const ang=t*.24+a.phase,baseX=a.originX+Math.sin(ang)*a.range*.65,baseZ=a.originZ+Math.cos(ang)*a.range*.65;
   const squirrel=(sp.id==='squirrel'||sp.id==='redsquirrel');
   const trunk=a.homeTree;
   const fleeNear=person.dist<sp.fear&&awake;
   if(squirrel&&trunk){
     const cycle=(t+a.phase*19)%46;
     const wantClimb=fleeNear||cycle>=18&&cycle<37;
     const radius=Math.max(.40,trunk.s*.40+.23);
     const around=a.phase+Math.sin(t*.18+a.phase)*.55;
     a.climbX=trunk.x+Math.cos(around)*radius;
     a.climbZ=trunk.z+Math.sin(around)*radius;
     a.climbTarget=wantClimb?Math.min(5.6,1.5+trunk.s*3.2):0;
     if(wantClimb&&Math.hypot(a.x-a.climbX,a.z-a.climbZ)>.85)a.climbTarget=0;
   }
   const speciesSpeed=WILD_SPEED[sp.id]||{idle:1,flee:3};
   let destX=baseX,destZ=baseZ,spd=speciesSpeed.idle;
   if(squirrel&&trunk){
     if(a.climbTarget>0){destX=a.climbX;destZ=a.climbZ;spd=.8}
     else if(fleeNear){destX=a.climbX;destZ=a.climbZ;spd=speciesSpeed.flee}
     else if((t+a.phase*19)%46>=18&&Math.hypot(a.x-trunk.x,a.z-trunk.z)>1){
       destX=a.climbX;destZ=a.climbZ;spd=speciesSpeed.idle}
   }
   const danger=sp.id==='boar';
   if(danger){
     const nearbyTerrain=Math.abs(H(a.x,a.z)-H(person.x,person.z))<2.6;
     if(person.dist<BOAR_CHARGE_RANGE&&nearbyTerrain&&person.moving&&awake&&Date.now()>=(a.chargeCooldown||0)&&Date.now()>=(a.chargeUntil||0)){
       a.chargeUntil=Date.now()+2500;
       a.chargeTarget={x:person.x,z:person.z};
     }
     if(person.dist>BOAR_CHASE_LIMIT||!nearbyTerrain||!awake){a.chargeUntil=0;a.chargeTarget=null;}
     const charging=Date.now()<(a.chargeUntil||0);
     if(charging){
       destX=person.x;destZ=person.z;
       spd=7.0;
     }else if(person.dist<4.5){
       const dx=a.x-person.x,dz=a.z-person.z,len=Math.hypot(dx,dz)||1;
       destX=a.x+(dx/len)*5+Math.sin(ang)*2;destZ=a.z+(dz/len)*5+Math.cos(ang)*2;spd=1.5;
     }
   }else if(person.dist<sp.fear&&awake){
     if(squirrel&&trunk){
       destX=a.climbX;destZ=a.climbZ;
     }else{
       const dx=a.x-person.x,dz=a.z-person.z,len=Math.hypot(dx,dz)||1;
       destX=a.x+dx/len*13;destZ=a.z+dz/len*13;
     }
     spd=speciesSpeed.flee;
   }
   const dx=destX-a.x,dz=destZ-a.z,len=Math.hypot(dx,dz);
   const slow=Math.min(1,len/1.4),desiredVx=len>.001?dx/len*spd*slow:0,desiredVz=len>.001?dz/len*spd*slow:0;
   const responsive=danger&&Date.now()<(a.chargeUntil||0)?8:person.dist<sp.fear?5:2.7;
   const blend=1-Math.exp(-responsive*step);
   a.vx=(a.vx||0)+(desiredVx-(a.vx||0))*blend;
   a.vz=(a.vz||0)+(desiredVz-(a.vz||0))*blend;
   const fromX=a.x,fromZ=a.z;
   a.x+=a.vx*step;a.z+=a.vz*step;
   if(!danger&&person.dist>=sp.fear&&Math.hypot(a.x-a.originX,a.z-a.originZ)>a.range*2.6){
     a.vx+=(a.originX-a.x)*Math.min(.7*step,.09);
     a.vz+=(a.originZ-a.z)*Math.min(.7*step,.09);
   }
   const actualSpeed=Math.hypot(a.x-fromX,a.z-fromZ)/Math.max(step,.001);
   if(actualSpeed>.035){
     const face=Math.atan2(a.vx,a.vz),delta=Math.atan2(Math.sin(face-a.mesh.rotation.y),Math.cos(face-a.mesh.rotation.y));
     a.mesh.rotation.y+=delta*(1-Math.exp(-step*5));
   }
   let height=0;
   if(sp.hab==='sky')height=4.6+Math.sin(t*1.2+a.phase)*.65;
   else if(squirrel&&trunk){
     const byTrunk=Math.hypot(a.x-trunk.x,a.z-trunk.z)<Math.max(1.2,trunk.s*.6+.7);
     const goal=byTrunk?a.climbTarget:0;
     const verticalSpeed=sp.id==='redsquirrel'?1.9:1.5;
     a.climbHeight+=(Math.sign(goal-a.climbHeight))*Math.min(Math.abs(goal-a.climbHeight),verticalSpeed*step);
     height=a.climbHeight;
     a.climbing=height>.12;
     a.mesh.userData.anim.rig.rotation.x+=( (a.climbing?-.30:0)-a.mesh.userData.anim.rig.rotation.x)*(1-Math.exp(-step*6));
   }else if(sp.hab==='tree')height=Math.max(.4,a.treeY+Math.sin(t*.7+a.phase)*.45);
   const yy=H(a.x,a.z)+height;
   a.renderY=a.renderY===undefined?yy:a.renderY+(yy-a.renderY)*(1-Math.exp(-step*12));
   a.mesh.position.set(a.x,a.renderY,a.z);
   a.mesh.visible=awake&&Math.hypot(a.x-P.x,a.z-P.z)<95;
   poseAnimal(a,step,actualSpeed,danger&&Date.now()<(a.chargeUntil||0));
   if(danger&&Date.now()<(a.chargeUntil||0)&&Date.now()-lastAnimalAttack>10000){
     const meDist=Math.hypot(a.x-P.x,a.z-P.z);
     if(P.speed>.07&&me.mode==='walk'&&meDist<BOAR_CONTACT_RANGE&&Math.abs(yy-P.y)<1.4){
       lastAnimalAttack=Date.now();a.chargeUntil=0;a.chargeCooldown=Date.now()+16000;faintAnimal(sp)
     }
   }
 }
 updateBoarWarning();
 nearbyWildSound(Date.now());
}
/* Wildlife nameplates: the exact same look and 5m proximity rule as other hikers. */
const animalLabelWorld=new THREE.Vector3();
function updateAnimalLookLabel(){
 for(const a of animals.values()){
   const el=a.nameEl;if(!el)continue;
   if(mode!=='game'||!a.mesh.visible||Math.hypot(a.mesh.position.x-P.x,a.mesh.position.z-P.z)>5){el.style.display='none';continue}
   const s=a.kind.scale;
   animalLabelWorld.set(a.mesh.position.x,a.mesh.position.y+Math.max(.24,s*2.1),a.mesh.position.z).project(camera);
   if(animalLabelWorld.z<=-1||animalLabelWorld.z>=1||Math.abs(animalLabelWorld.x)>1.02||Math.abs(animalLabelWorld.y)>1.02){el.style.display='none';continue}
   el.style.display='';
   el.style.transform=`translate(${(animalLabelWorld.x*.5+.5)*W}px,${(-animalLabelWorld.y*.5+.5)*Hh}px) translate(-50%,-100%)`;
 }
}
