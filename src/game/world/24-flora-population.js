/* ---------- 청크에 식물 심기: 서식지 적합도 × 개체수 ---------- */
function placeFlora(c,r,ox,oz,grp){
  const cand=26;
  for(let i=0;i<cand;i++){const x=ox+(r()-.5)*CH,z=oz+(r()-.5)*CH,u=r(),u2=r(),v=Math.floor(r()*3);
    if(Math.abs(x-pathX(z))>54)continue;const e=envAt(x,z,c);if(e.inRock)continue;
    let S=0;const fits=new Array(SPECIES.length);for(let k=0;k<SPECIES.length;k++){const f=SPECIES[k].ab*fitOf(SPECIES[k],e);fits[k]=f;S+=f}
    if(S<=0||u>clamp(S/(S+30),0,1)*.9)continue;
    let pick=u2*S,idx=0;for(;idx<fits.length-1;idx++){pick-=fits[idx];if(pick<=0)break}
    const sp=SPECIES[idx],id=`${c.key}:f${i}`,rotation=r()*6.28;
    // An unavailable slot still counts: harvesting must not change the
    // seeded number/species of future plants in this or neighboring chunks.
    if(Math.abs(x-pathX(z))<19)c.trailSeedCount=(c.trailSeedCount||0)+1;
    if(isTargetedFiveStar(sp.id)||takenUntil(id))continue;
    const m=makePlantMesh(sp,v);m.position.set(x,H(x,z)-.02,z);m.rotation.y=rotation;
    const it={kind:'herb',type:sp.id,id,hits:0,need:sp.need,mesh:m};m.userData.item=it;grp.add(m);c.items.push(it);
  }
}
// Prevent empty stretches where stochastic placement generated no herbs.
// Supplemental plants use existing Korean species, habitat rules, prices,
// meshes, journal and harvesting. They are NOT non-collectible previews.
function ensureTrailFlora(c,r,ox,oz,grp){
  if(oz<SUMMIT_Z-CH||oz>48||Math.abs(ox-pathX(oz))>CH*1.2)return;
  let found=c.trailSeedCount||0;
  for(const it of c.items){if(it.kind==='herb'&&it.mesh&& !it.id.includes(':f')&&
    Math.abs(it.mesh.position.x-pathX(it.mesh.position.z))<19)found++}
  if(found>=2)return;
  const target=2-found;
  for(let n=0,added=0;n<20&&added<target;n++){
    const z=oz+(r()-.5)*CH*.85,x=pathX(z)+(r()<.5?-1:1)*(4+r()*13);
    if(Math.abs(x-ox)>=CH*.48||Math.abs(z-oz)>=CH*.48)continue;
    const e=envAt(x,z,c);if(e.inRock||e.ds<2.2)continue;
    let total=0;const options=[];
    for(const sp of SPECIES){const w=sp.ab*fitOf(sp,e);
      if(w>.025){options.push([sp,w]);total+=w}}
    if(total<=0)continue;
    let roll=r()*total,sp=options[options.length-1][0];
    for(const entry of options){roll-=entry[1];if(roll<=0){sp=entry[0];break}}
    const id=`${c.key}:trail${n}`,variant=Math.floor(r()*3),rotation=r()*Math.PI*2;
    added++; // reserve this slot even while its harvested item is absent
    if(isTargetedFiveStar(sp.id)||takenUntil(id))continue;
    const m=makePlantMesh(sp,variant);m.position.set(x,H(x,z)-.02,z);m.rotation.y=rotation;
    const item={kind:'herb',type:sp.id,id,hits:0,need:sp.need,mesh:m};
    m.userData.item=item;grp.add(m);c.items.push(item);
  }
}
/* 물길: 물 띠와 물가 돌 */
const waterMat=new THREE.MeshPhongMaterial({color:0x6aa6b8,transparent:true,opacity:.78,shininess:60,specular:0x9fd0e0,flatShading:true,side:THREE.DoubleSide});
function placeStreams(c,r,ox,oz,grp){
  for(const fn of [sX1,sX2]){const pts=[];for(let z=oz-CH/2-2;z<=oz+CH/2+2;z+=2){const x=fn(z);if(x<ox-CH/2-3||x>ox+CH/2+3)continue;pts.push([x,z])}
    if(pts.length<2)continue;const pos=[];
    const w=1.7,row=(x,z)=>{const yc=H(x,z)+.5;return[[x-w,Math.min(yc,H(x-w,z)+.1),z],[x,yc,z],[x+w,Math.min(yc,H(x+w,z)+.1),z]]};
    for(let i=0;i<pts.length-1;i++){const A=row(...pts[i]),B=row(...pts[i+1]);
      for(let j=0;j<2;j++){pos.push(...A[j],...A[j+1],...B[j], ...A[j+1],...B[j+1],...B[j])}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.computeVertexNormals();
    const wm=new THREE.Mesh(geo,waterMat);wm.receiveShadow=true;grp.add(wm);
    for(let k=0;k<5;k++){const z=oz+(r()-.5)*CH,x=fn(z)+(r()<.5?-1:1)*(1+r()*1.2);if(Math.abs(x-ox)>CH/2)continue;const s=.15+r()*.35;const st=new THREE.Mesh(STONE,M(0x8f8b7c));st.scale.set(s,s*.55,s);st.position.set(x,H(x,z)+s*.2,z);st.rotation.y=r()*6;grp.add(st)}}
}
