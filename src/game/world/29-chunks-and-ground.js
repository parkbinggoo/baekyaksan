/* ---------- world chunks ---------- */
const CH=48,RES=IOS_CLOUD_SAFE?24:32;let VIEW=3;
const chunks=new Map();
const terrainMat=new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:0,specular:0x000000});
const barkPine=M(0x8a5236),barkOak=M(0x6e5a48),foliage=new THREE.MeshPhongMaterial({color:0xffffff,flatShading:true,shininess:0,specular:0x000000});
const cGrass=new THREE.Color(0x4a6b34),cGrass2=new THREE.Color(0x5d7f3c),cPath=new THREE.Color(0xa8906a),cLitter=new THREE.Color(0x6e5a38),cRock=new THREE.Color(0x8b8778),cSnow=new THREE.Color(0xf2f3ee),cMoss=new THREE.Color(0x35532c),tmp=new THREE.Color();
// The temporary chunk tiles (pendingGround) cover every visible zone while
// real terrain streams in. Do NOT add a separate permanent trail surface here:
// its coarse interpolation can rise above H(x,z), creating a false walk-through
// layer over the ground where the actual collision and herbs live.
// Rocky, wind-exposed dwarf conifers and groundcover. All meshes are batched.
const ALPINE_CONE=keep(new THREE.ConeGeometry(1,1.8,6,1));
const ALPINE_CUSHION=keep(new THREE.IcosahedronGeometry(1,0));
function addAlpineVegetation(c,r,ox,oz,group,nearStart,inRock){
  const alt=H(ox,oz)*ALT_K;if(alt<1450||alt>2490)return;
  const factor=clamp((alt-1450)/350,0,1)*clamp((2400-alt)/420,0,1);
  const nTree=Math.round(8*factor),nShrub=Math.round(19*clamp((alt-1430)/430,0,1)*clamp((2490-alt)/280,0,1));
  const batches=[{n:nTree,geo:ALPINE_CONE,cols:[0x4b6457,0x516d5f,0x6a7969],height:1.6},{n:nShrub,geo:ALPINE_CUSHION,cols:[0x52684c,0x727d59,0x77856e],height:.35}];
  const o=new THREE.Object3D();
  for(const spec of batches){if(!spec.n)continue;const im=new THREE.InstancedMesh(spec.geo,foliage,spec.n),temp=new THREE.Color();im.frustumCulled=false;let k=0;
    for(let i=0;i<spec.n;i++){
      const x=ox+(r()-.5)*CH,z=oz+(r()-.5)*CH;
      if(nearStart(x,z,5)||inRock(x,z,1.1)||streamD(x,z)<3.5||Math.abs(x-pathX(z))<3)continue;
      const size=.35+r()*.65,above=H(x,z)*ALT_K;
      if(above<1470||above>2470)continue;
      o.position.set(x,H(x,z)+spec.height*.5*size,z);o.rotation.set(0,r()*6.28,0);
      if(spec.geo===ALPINE_CONE)o.scale.set(.45*size,1.1*size,.45*size);
      else o.scale.set(.6*size,.25*size,.8*size);
      o.updateMatrix();im.setMatrixAt(k,o.matrix);
      temp.setHex(spec.cols[Math.floor(r()*spec.cols.length)]).lerp(cSnow,clamp((above-1890)/850,0,.57));im.setColorAt(k,temp);k++;
    }
    if(k){im.count=k;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.receiveShadow=true;group.add(im)}
  }
}
function makeRealGround(cx,cz){
  const ox=cx*CH+CH/2,oz=cz*CH+CH/2;
  const geo=new THREE.PlaneGeometry(CH,CH,RES,RES);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,cols=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++){const x=pos.getX(i)+ox,z=pos.getZ(i)+oz,y=H(x,z);pos.setXYZ(i,x,y,z);
    const sl=Math.abs(H(x+1,z)-H(x-1,z))+Math.abs(H(x,z+1)-H(x,z-1));
    const ad=Math.abs(x-pathX(z));
    tmp.copy(cGrass).lerp(cGrass2,(vn(x*.08,z*.08)+1)/2).lerp(cMoss,clamp((vn(x*.3,z*.3)+.2),0,1)*.35);
    const alt=y*ALT_K; if(alt>900) tmp.lerp(cRock,clamp((alt-900)/900,0,.7));
    if(sl>2.2) tmp.lerp(cRock,clamp((sl-2.2)/2,0,1));
    if(alt>1500&&vn(x*.05,z*.05)>.1-((alt-1500)/2000)) tmp.lerp(cSnow,.85);
    tmp.lerp(cLitter,clamp(vn(x*.06+7,z*.06)*1.4+.1,0,1)*.7);tmp.lerp(cMoss,clamp(vn(x*.09-3,z*.09+11)*1.6-.3,0,1)*.5);
    const deepSnow=clamp((alt-1530)/900,0,1),snowPatch=clamp(.63+vn(x*.044+4,z*.044-3)*.36,0,1);
    tmp.lerp(cSnow,deepSnow*clamp((snowPatch-.22)*1.8,0,1)*.94);
    tmp.multiplyScalar(.92+vn(x*.7,z*.7)*.08);
    cols[i*3]=tmp.r;cols[i*3+1]=tmp.g;cols[i*3+2]=tmp.b}
  geo.setAttribute('color',new THREE.BufferAttribute(cols,3));geo.computeVertexNormals();
  const ground=new THREE.Mesh(geo,terrainMat);ground.receiveShadow=true;ground.frustumCulled=false;ground.userData.terrain=true;
  return ground;
}
/* Resource placement check: the visible ground is a triangulated mesh, not
   the continuous H() height used for walking. Match the exact triangles so
   tiny sprouts do not disappear below the rendered terrain on mobile. */
function resourceGroundY(c,x,z){
  const g=c.ground&&c.ground.geometry,p=g&&g.attributes.position;
  if(!p)return H(x,z);
  const u=clamp((x-c.cx*CH)/CH*RES,0,RES-1e-6),v=clamp((z-c.cz*CH)/CH*RES,0,RES-1e-6);
  const i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;
  const n=j*(RES+1)+i,y00=p.getY(n),y10=p.getY(n+1),y01=p.getY(n+RES+1),y11=p.getY(n+RES+2);
  return a+b<=1?y00*(1-a-b)+y10*a+y01*b:y11*(a+b-1)+y10*(1-b)+y01*(1-a);
}
function resourceRockClearance(k){
  return k.mesh?Math.max(k.r*.95+.7,Math.max(k.mesh.scale.x,k.mesh.scale.z)*1.10+.38):k.r+1;
}
function resourceSiteOK(c,x,z,it,requireHabitat=true){
  if(!Number.isFinite(x)||!Number.isFinite(z)||x<c.cx*CH+1.2||x>(c.cx+1)*CH-1.2||z<c.cz*CH+1.2||z>(c.cz+1)*CH-1.2)return false;
  if(z<SUMMIT_Z+3||z>33||Math.abs(x-pathX(z))>49)return false;
  const sp=SPI[it.type]||null,ds=streamD(x,z);
  // Stream-bank plants can live close to water, but never in the stream mesh.
  if(ds<(sp&&sp.W==='water'?1.95:2.8))return false;
  for(const k of c.rocks)if(Math.hypot(x-k.x,z-k.z)<resourceRockClearance(k))return false;
  for(const t of c.trees)if(Math.hypot(x-t.x,z-t.z)<.43*t.s+.56)return false;
  const sx=Math.abs(H(x+.8,z)-H(x-.8,z)),sz=Math.abs(H(x,z+.8)-H(x,z-.8));
  if(sx>1.65||sz>1.65)return false;
  if(requireHabitat&&sp){
    const e=envAt(x,z,c);
    // Some rock meshes extend beyond their nominal radius. A plant immediately
    // outside the visible rock still belongs to the same rocky habitat.
    if(sp.rock&&!e.rock)e.rock=c.rocks.some(k=>{const d=Math.hypot(x-k.x,z-k.z),edge=resourceRockClearance(k);return d>=edge&&d<edge+2.3});
    if(sp.onTree||fitOf(sp,e)<.008)return false;
  }
  if(it.type==='songi'||it.type==='kkotsongi'||it.type==='neungi'||it.type==='ipsae'){
    const pine=it.type==='songi'||it.type==='kkotsongi';
    if(!c.trees.some(t=>(pine?t.kind==='pine':t.kind==='oak')&&Math.hypot(x-t.x,z-t.z)<5.2))return false;
  }
  return true;
}
function resourceNearbySpot(c,it){
  const pos=it.mesh.position,seed=rareSlotSeed(it.id,37),rng=rngOf(seed);
  let best=null,bestScore=-Infinity;
  const consider=(x,z,strict)=>{
    if(!resourceSiteOK(c,x,z,it,strict))return;
    // Preserve the original Korean species habitat wherever possible.
    const sp=SPI[it.type],e=sp?envAt(x,z,c):null;
    if(sp?.rock&&e&&!e.rock)e.rock=c.rocks.some(k=>{const d=Math.hypot(x-k.x,z-k.z),edge=resourceRockClearance(k);return d>=edge&&d<edge+2.3});
    const fit=sp?fitOf(sp,e):1;
    const d=Math.hypot(x-pos.x,z-pos.z),score=fit*.18-d*.018-rng()*.008;
    if(score>bestScore){best={x,z};bestScore=score;}
  };
  for(let i=0;i<32;i++){
    const a=rng()*Math.PI*2,rr=.9+Math.pow(rng(),.8)*14;
    consider(pos.x+Math.cos(a)*rr,pos.z+Math.sin(a)*rr,true);
  }
  if(best)return best;
  for(let i=0;i<55;i++){
    const z=c.cz*CH+2+rng()*(CH-4);
    const x=pathX(z)+(rng()<.5?-1:1)*(3+rng()*40);
    consider(x,z,true);
  }
  if(best)return best;
  // Last resort: use a walkable area in the SAME chunk rather than leaving a
  // collectible buried in a boulder. Only relax habitat fit, not safety.
  for(let i=0;i<55;i++){
    const z=c.cz*CH+2+rng()*(CH-4);
    const x=pathX(z)+(rng()<.5?-1:1)*(3+rng()*40);
    consider(x,z,false);
  }
  return best;
}
function repairChunkResources(c){
  c.placementFixes=0;
  for(const it of c.items){
    const m=it.mesh;if(!m)continue;
    if(it.kind==='honey'){m.position.y=H(m.position.x,m.position.z)+.04;continue}
    if(it.rock){
      // The top of an irregular rotated rock is not its bounding-box topY.
      // Put rock plants onto the real collision surface, inside the walkable crest.
      const rock=it.rock,radius=rock.r*.31;
      let dx=m.position.x-rock.x,dz=m.position.z-rock.z,dist=Math.hypot(dx,dz);
      if(dist>radius){dx=dx/dist*radius;dz=dz/dist*radius;m.position.x=rock.x+dx;m.position.z=rock.z+dz;c.placementFixes++}
      m.position.y=rockSurfaceY(rock,m.position.x,m.position.z)+.035;
      continue;
    }
    const sp=SPI[it.type];
    const desiredTree=sp?.onTree==='pine'?'pine':sp?.onTree==='oak'?'oak':null;
    const t=it.tree||(sp?.onTree||it.type==='sanghwang'||it.type==='norugung'?
      c.trees.filter(t=>!desiredTree||t.kind===desiredTree).reduce((best,t)=>!best||Math.hypot(t.x-m.position.x,t.z-m.position.z)<Math.hypot(best.x-m.position.x,best.z-m.position.z)?t:best,null):null);
    const onTrunk=t&&(it.tree||sp?.onTree||it.type==='sanghwang'||it.type==='norugung')&&
      Math.hypot(t.x-m.position.x,t.z-m.position.z)<4.5;
    if(onTrunk){
      const dir=Math.atan2(m.position.z-t.z,m.position.x-t.x),a=Number.isFinite(dir)?dir:0;
      const trunkR=(t.kind==='pine'?.20:.24)*t.s + .06;
      const extra=sp?.onTree ? .02 : (it.type==='sanghwang'||it.type==='norugung') ? .05 : .035;
      const d=trunkR+extra;
      const px=t.x+Math.cos(a)*d,pz=t.z+Math.sin(a)*d;
      // Keep trunk resources visually attached to the bark, but never buried.
      const gy=resourceGroundY(c,px,pz);
      const targetY=sp?.onTree ? Math.max(gy+.72, Math.min(t.y+Math.min(1.55*t.s,1.9), gy+1.55))
                               : Math.max(gy+.42, Math.min(m.position.y, gy+1.05));
      m.position.set(px,targetY,pz);
      c.placementFixes++;
      continue;
    }
    const visibleY=resourceGroundY(c,m.position.x,m.position.z);
    const buried=m.position.y<visibleY+.035;
    const hasObstacle=!resourceSiteOK(c,m.position.x,m.position.z,it,true);
    if(hasObstacle){
      const next=resourceNearbySpot(c,it);
      if(next){m.position.x=next.x;m.position.z=next.z;c.placementFixes++;}
    }
    const y=resourceGroundY(c,m.position.x,m.position.z);
    if(it.kind==='fruit'){
      // Preserve the existing fruit fall animation and its ground-relative height.
      const base=y+FRUIT_HEIGHT[it.type];it.groundY=base;
      m.position.y=it.fall===false?base:base+1.8;
      if(it.bush)it.bush.position.set(m.position.x,y,m.position.z);
    }else if(buried||hasObstacle||Math.abs(m.position.y-y)>.2){
      m.position.y=y+.045;
    }
  }
}
function buildChunk(cx,cz){
  const r=rngOf((Math.imul(cx,73856093)^Math.imul(cz,19349663))>>>0);
  const ox=cx*CH+CH/2,oz=cz*CH+CH/2;
  const ground=makeRealGround(cx,cz);
  const grp=new THREE.Group();grp.add(ground);
  const c={key:cx+','+cz,cx,cz,grp,ground,trees:[],items:[],treeMeshes:[]};
  const altHere=H(ox,oz)*ALT_K, dens=clamp(1-(altHere-1200)/1380,.015,1);
  const startX=pathX(24);
  const nearStart=(x,z,r)=>Math.hypot(x-startX,z-24)<r;
  c.rocks=[];
  const nClusters=r()<.5?1+Math.floor(r()*2):0;
  for(let k=0;k<nClusters;k++){const cx0=ox+(r()-.5)*CH*.8,cz0=oz+(r()-.5)*CH*.8,big=r()<.45;
    const nr=big?1+Math.floor(r()*2):2+Math.floor(r()*4);
    for(let q=0;q<nr;q++){const rad=big?2.6+r()*3.2:.9+r()*1.8;const x=cx0+(r()-.5)*(big?6:9),z=cz0+(r()-.5)*(big?6:9);
      if(nearStart(x,z,rad+4))continue;
      const rk={x,z,r:rad,climbable:big&&rad>3.0};c.rocks.push(rk);
      const m=new THREE.Mesh(r()<.5?STONE:ROCK2,M([0x8b8778,0x7d7a6c,0x96917f,0x6f6c60][q%4]));
      m.scale.set(rad*(1+r()*.3),rad*(.55+r()*.45),rad*(.85+r()*.35));m.rotation.set(r()*.6,r()*6.28,r()*.4);
      m.position.set(x,H(x,z)-rad*.25,z);m.castShadow=true;m.receiveShadow=true;grp.add(m);
      rk.mesh=m;rk.topY=m.position.y+m.scale.y*.78;rk.groundY=H(x,z);
      if(r()<.6){const moss=new THREE.Mesh(BALL,M(0x4a6a34));moss.scale.set(rad*.7,rad*.18,rad*.6);moss.position.set(x+(r()-.5)*rad*.4,m.position.y+rad*(.45+r()*.2),z+(r()-.5)*rad*.4);grp.add(moss)}}}
  const inRock=(x,z,pad)=>c.rocks.some(k=>Math.hypot(x-k.x,z-k.z)<k.r+pad);
  const pines=[],oaks=[];const n=Math.round(64*dens);
  for(let i=0;i<n;i++){const x=ox+(r()-.5)*CH,z=oz+(r()-.5)*CH;
    const patch=vn(x*.035+3,z*.035-5);if(r()>clamp(.75+patch*.9,.08,1))continue;   // clearings come and go
    if(nearStart(x,z,3.5)||inRock(x,z,.8)||streamD(x,z)<2.6)continue;
    const pineP=altHere>1600?.96:clamp(.55+altHere/2500,.55,.95),treeRoll=r();
    const cls=r(),sz=(cls<.55?.8+r()*.45:cls<.82?.42+r()*.3:.14+r()*.22)*clamp(1-(altHere-1550)/1100,.15,1);
    const gateDist=Math.hypot(x-pathX(24),z-24);
    const broadType=(gateDist<60&&altHere<420&&r()<.24)?'ginkgo':(altHere<950&&r()<.30)?'chestnut':'oak';
    const broadKind=broadType==='oak'&&altHere<1050&&h2(Math.round(x*2),Math.round(z*2))<.24?'acacia':broadType;
    const t={x,z,y:H(x,z)-.2,s:sz,rot:r()*6.28,lean:(r()-.5)*(sz>.6?.05:.12),kind:treeRoll<pineP?'pine':broadKind,id:`${c.key}:t${i}`,hits:0,searched:false};
    (t.kind==='pine'?pines:oaks).push(t);c.trees.push(t);
    if(t.s>.5&&r()<.24){const mt=pickW(MUSH,COMMON_MUSH_KEYS,r(),1+altHere/600);const a=r()*6.28,trunkR=(t.kind==='pine'?.20:.24)*t.s + .06,rr=trunkR+.045;
      const it={kind:'mush',type:mt,id:`${c.key}:m${i}`,hits:0,need:MUSH[mt].need,tree:t};
      const placeY=t.y+.48+r()*.52;
      if(!takenUntil(it.id)){const m=mush3D(mt);m.position.set(x+Math.cos(a)*rr,placeY,z+Math.sin(a)*rr);m.rotation.y=Math.atan2(Math.cos(a),Math.sin(a));m.scale.setScalar(1.6);it.mesh=m;t.mush=m;m.userData.item=it;grp.add(m);c.items.push(it)}}}
  const snowy=altHere>1550;
  const inst=(geo,mat,list,colFn)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,mat,list.length);im.frustumCulled=false;const o=new THREE.Object3D();
    list.forEach((t,i)=>{o.position.set(t.x,t.y,t.z);o.rotation.set(t.lean,t.rot,0);o.scale.setScalar(t.s);o.updateMatrix();im.setMatrixAt(i,o.matrix);(t.inst||(t.inst=[])).push({im,i,m:o.matrix.clone()});if(colFn)im.setColorAt(i,colFn(t,i))});
    im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.castShadow=true;im.receiveShadow=true;im.userData.trees=list;grp.add(im);c.treeMeshes.push(im)};
  const pc=new THREE.Color(),oc=new THREE.Color();
  inst(pineTrunk,barkPine,pines);pineC.forEach((g,k)=>inst(g,foliage,pines,(t,i)=>{pc.setHSL(.37+h2(i,k)*.04,.34,.2+k*.03+h2(i,7)*.05);if(snowy&&k>1)pc.lerp(cSnow,.5);return pc}));
  inst(oakTrunk,barkOak,oaks);[oakF1,oakF2,oakF3].forEach((g,k)=>inst(g,foliage,oaks,(t,i)=>{
    if(t.kind==='acacia')oc.setHSL(.31+h2(i,k+3)*.025,.38,.34+k*.045);
    else if(t.kind==='ginkgo')oc.setHSL(.16+h2(i,k+3)*.025,.47,.39+k*.045);
    else if(t.kind==='chestnut')oc.setHSL(.29+h2(i,k+3)*.028,.42,.24+k*.035);
    else oc.setHSL(.26+h2(i,k+3)*.06,.36,.28+k*.04+h2(i,9)*.05);
    return oc}));
  // Small winter clusters attach to host trees; same seed on every multiplayer client.
  for(let i=0;i<c.trees.length;i++){
    const t=c.trees[i];if(t.s<.42||r()>.16)continue;
    const a=H(t.x,t.z)*ALT_K;
    const type=t.kind==='pine'&&a>=1200&&a<=2050?'gyeousolip':t.kind==='oak'&&a>=850&&a<=1650?'gyeousari':null;
    if(!type)continue;
    const sp=SPI[type],id=`${c.key}:winter${i}`,ang=r()*6.28,variant=Math.floor(r()*3);
    if(takenUntil(id))continue;
    const mesh=makePlantMesh(sp,variant);
    const off=.27*t.s;mesh.position.set(t.x+Math.sin(ang)*off,t.y+Math.min(2.1*t.s,2.5),t.z+Math.cos(ang)*off);
    mesh.rotation.y=ang;
    const it={kind:'herb',type,id,hits:0,need:sp.need,mesh,tree:t};mesh.userData.item=it;grp.add(mesh);c.items.push(it);
  }
  try{addAlpineVegetation(c,r,ox,oz,grp,nearStart,inRock)}catch(e){console.warn('고산식물 일부 생성 생략',e)}
  try{placeTentTrailRibbons(c,grp)}catch(e){console.warn('텐트 표식 일부 생성 생략',e)}
  try{placeExtraMushrooms(c,r,grp,nearStart)}catch(e){console.warn('버섯 일부 생성 생략',e)}
  {const nb=Math.round(46*dens);const im=new THREE.InstancedMesh(BUSH,foliage,nb);im.frustumCulled=false;const o=new THREE.Object3D(),bc=new THREE.Color();let k=0;
   for(let i=0;i<nb;i++){const x=ox+(r()-.5)*CH,z=oz+(r()-.5)*CH;if(inRock(x,z,.2)||nearStart(x,z,2))continue;const sc=(.22+r()*.38)*clamp(1-(altHere-1550)/1200,.28,1);
     o.position.set(x,H(x,z)+sc*.25,z);o.rotation.set(0,r()*6.28,0);o.scale.set(sc*1.3,sc*.8,sc*1.2);o.updateMatrix();im.setMatrixAt(k,o.matrix);bc.setHSL(.27+r()*.08,altHere>1650?.24:.35,.2+r()*.1);if(altHere>1920)bc.lerp(cSnow,clamp((altHere-1920)/900,0,.36));im.setColorAt(k,bc);k++}
   im.count=k;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.castShadow=true;grp.add(im)}
  try{placeFlora(c,r,ox,oz,grp)}catch(e){console.warn('약초 일부 생성 오류',e)}
  try{ensureTrailFlora(c,rngOf((Math.imul(cx,741103597)^Math.imul(cz,195871091)^0x5f2519)>>>0),ox,oz,grp)}catch(e){console.warn('산길 약초 배치 오류',e)}
  try{placeRockPlants(c,r,grp)}catch(e){console.warn('바위식물 일부 생성 오류',e)}
  try{placeStreams(c,r,ox,oz,grp)}catch(e){console.warn('계곡 일부 생성 오류',e)}
  try{placeDecoyFlora(c,r,ox,oz,grp,nearStart,inRock,dens)}catch(e){console.warn('야생식물 일부 생성 오류',e)}
  try{placeForestHoney(c)}catch(e){console.warn('벌집 일부 생성 오류',e)}
  const putFruit=(type,id,x,z,fall=true)=>{
    if(takenUntil(id))return;
    if(inRock(x,z,.12)||nearStart(x,z,3)||streamD(x,z)<2.6)return;
    const mesh=fruit3D(type);mesh.position.set(x,H(x,z)+FRUIT_HEIGHT[type],z);mesh.scale.setScalar(FRUIT_SCALE[type]);
    const pickArea=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));
    pickArea.scale.setScalar(.19/FRUIT_SCALE[type]);pickArea.userData.pickArea=true;mesh.add(pickArea);
    const ground=H(x,z),groundY=ground+(fall?FRUIT_HEIGHT[type]:.31);
    if(type==='wildberry'){
      const bush=new THREE.Group();bush.position.set(x,ground,z);
      for(let k=0;k<3;k++){
        const a=k*Math.PI*2/3,xx=Math.sin(a)*.11,zz=Math.cos(a)*.11;
        stemM(bush,xx,0,zz,.22+k*.05,.012,M(0x6a7350));
        for(let j=0;j<3;j++)leafM(bush,xx,.12+j*.06,zz,.14,.055,a+j*1.8,.23,M(j%2?0x527b3f:0x6d8e4d));
      }
      grp.add(bush);mesh.userData.bush=bush;
    }
    const item={kind:'fruit',type,id,hits:0,need:1,mesh,born:Date.now(),groundY,fall,bush:mesh.userData.bush||null};
    mesh.position.y=fall?groundY+1.8:groundY;mesh.userData.item=item;
    grp.add(mesh);c.items.push(item);
  };
  for(let i=0;i<c.trees.length;i++){
    const tree=c.trees[i];if(tree.s<.5||r()>.24)continue;
    let type={pine:'pinecone',oak:'acorn',chestnut:'chestnut',ginkgo:'ginkgo'}[tree.kind];
    if(tree.kind==='pine'&&altHere>=1250&&altHere<=2000&&r()<.19)type='jat';
    if(!type)continue;
    const a=r()*Math.PI*2,d=.65+r()*1.65;
    putFruit(type,c.key+':fruit'+i,tree.x+Math.cos(a)*d,tree.z+Math.sin(a)*d);
  }
  for(let i=0;i<8;i++){
    const x=ox+(r()-.5)*(CH-5),z=oz+(r()-.5)*(CH-5),e=microHabitatAt(x,z,c);
    if(e.alt>1250||e.light<.43||e.moist<.16||e.moist>.89||e.nearTree>12||e.nearTree<1.3||e.slope>2.0||r()>.52)continue;
    putFruit('wildberry',c.key+':berry'+i,x,z,false);
  }
  relocateRareInChunk(c);
  applyGoldenVariants(c);
  // Check all genuine collectibles after five-star relocation and before display.
  repairChunkResources(c);
  scene.add(grp);chunks.set(c.key,c);return c;
}
function disposeChunk(c){
  scene.remove(c.grp);
  // A removed tree must not remain in the camera-occlusion set. Its instance
  // buffers may already have been disposed when this area loads again.
  for(const t of c.trees)hiddenTrees.delete(t);
  c.grp.traverse(o=>{if(o.geometry&&!o.geometry.userData.keep)o.geometry.dispose();if(o.isInstancedMesh&&o.dispose)o.dispose();if(o.material&&o.material.map&&o.material.map!==sparkTex&&o.material.map!==weaveTex&&o.isMesh&&!o.isSprite)o.material.map.dispose()});
  chunks.delete(c.key);
}
// Do not render low-resolution placeholder landscape: its mesh differs from
// the actual H(x,z) collision terrain, so it can appear as floating green land.
// Only the authentic terrain mesh is displayed, including in fallback regions.
let chunkQueue=[];
let chunkKey='',chunkBuildT=0;
const chunkFailures=new Map();
function rescueTrailChunk(key,cx,cz){
  // A detailed chunk may fail on a memory-limited phone. Recover with the
  // exact SAME terrain surface (not a visibly higher, non-collidable proxy).
  try{
    const grp=new THREE.Group(),ground=makeRealGround(cx,cz);
    grp.add(ground);
    const c={key,cx,cz,grp,ground,trees:[],items:[],treeMeshes:[],rocks:[]};
    try{ensureTrailFlora(c,rngOf((Math.imul(cx,741103597)^Math.imul(cz,195871091)^0x5f2519)>>>0),
        cx*CH+CH/2,cz*CH+CH/2,grp)}catch(e){console.warn('산길 대체 약초 생성 오류:',key,e)}
    applyGoldenVariants(c);
    repairChunkResources(c);
    scene.add(grp);chunks.set(key,c);chunkFailures.delete(key);
    return true;
  }catch(e){console.warn('실제 지형 복구 실패:',key,e);return false}
}
function buildQueuedChunk(key){
  if(chunks.has(key)){chunkFailures.delete(key);return true}
  const [x,z]=key.split(',').map(Number);
  try{buildChunk(x,z);chunkFailures.delete(key);return true}
  catch(e){
    const f=chunkFailures.get(key)||{attempts:0,until:0};f.attempts++;
    // Log the original failure, not a cascade of redraws on every frame.
    if(f.attempts===1||f.attempts===4)console.warn('등산로 실제 지형 생성 재시도:',key,e);
    f.until=performance.now()+Math.min(4000,400*f.attempts);
    chunkFailures.set(key,f);
    if(f.attempts>=3&&rescueTrailChunk(key,x,z))return true;
    return false;
  }
}
function updateChunks(px,pz,force,dt){
  // Draw only real, height-correct terrain. Never place green preview sheets.
  const ccx=Math.floor(px/CH),ccz=Math.floor(pz/CH);
  if(!force){chunkBuildT+=dt||0;const k=ccx+','+ccz+','+VIEW;
    if(k===chunkKey){
      // Always prioritize the current tile (and then the player's next tile).
      // Off-screen decorations may stream later, but land and collectible
      // vegetation must load where the hiker stands.
      if(chunkQueue.length&&chunkBuildT>=PERF.chunkEvery){
        chunkBuildT=0;
        const now=performance.now();let chosen=-1;
        for(let i=0;i<chunkQueue.length;i++){
          const key=chunkQueue[i],retry=chunkFailures.get(key);
          if(!retry||retry.until<=now){chosen=i;break}
        }
        if(chosen>=0){const key=chunkQueue.splice(chosen,1)[0];if(!buildQueuedChunk(key))chunkQueue.push(key)}
      }
      return;
    }
    chunkKey=k;
  }
  const want=new Set();
  for(let dz=-VIEW;dz<=VIEW;dz++)for(let dx=-VIEW;dx<=VIEW;dx++){
    if(dx*dx+dz*dz<=VIEW*VIEW+1)want.add((ccx+dx)+','+(ccz+dz));
  }
  for(const [key,c] of [...chunks])if(!want.has(key))disposeChunk(c);
  // Prioritize current tile, direction of travel, then the remaining radius.
  // Repeated visits re-use exactly the same random seed and resource IDs.
  chunkQueue=[...want].filter(key=>!chunks.has(key)).sort((a,b)=>{
    const[ax,az]=a.split(',').map(Number),[bx,bz]=b.split(',').map(Number);
    const da=(ax-ccx)**2+(az-ccz)**2,db=(bx-ccx)**2+(bz-ccz)**2;
    return da-db||((az-ccz)-(bz-ccz));
  });
  for(const key of [...chunkFailures.keys()])if(!want.has(key))chunkFailures.delete(key);
  const currentKey=ccx+','+ccz;
  if(!chunks.has(currentKey)){
    const i=chunkQueue.indexOf(currentKey);
    if(i>=0)chunkQueue.splice(i,1);
    if(!buildQueuedChunk(currentKey))chunkQueue.unshift(currentKey);
  }
  if(force){
    // Only the immediate landing area needs to be synchronous. Doing every
    // tile in one frame causes Safari to stall or WebGL to lose context.
    for(let i=0;i<Math.min(3,chunkQueue.length);i++){
      const key=chunkQueue.shift();if(!buildQueuedChunk(key))chunkQueue.push(key)
    }
  }
}
