function zForAltitude(targetAlt){
  let z=-targetAlt/(ALT_K*.22), alt=H(pathX(z),z)*ALT_K;
  if(alt<targetAlt){for(let i=0;i<150&&alt<targetAlt;i++){z-=6;alt=H(pathX(z),z)*ALT_K}}
  else{for(let i=0;i<150&&alt>targetAlt;i++){z+=6;alt=H(pathX(z),z)*ALT_K}z-=6}
  return z;
}
function ensureTents(){
  if(tents.length)return;
  const r=rngOf(7041); let targetAlt=520+r()*80; let idx=0;
  while(targetAlt<Math.min(7200,SUMMIT_ALT-115) && idx<16){
    const z=zForAltitude(targetAlt); if(z==null) break;
    const side=r()<.5?-1:1;
    let site={x:pathX(z)+side*6.5,z,y:H(pathX(z)+side*6.5,z),score:Infinity};
    for(let trial=0;trial<18;trial++){
      const tz=z+(r()-.5)*10,tx=pathX(tz)+side*(5+r()*5.5),ty=H(tx,tz);
      let score=0;
      for(const dx of [-1.4,0,1.4])for(const dz of [-1.8,0,1.8])score=Math.max(score,Math.abs(H(tx+dx,tz+dz)-ty));
      if(score<site.score)site={x:tx,z:tz,y:ty,score};
    }
    const px=site.x,pz=site.z,py=site.y;
    const styleIdx=Math.floor(r()*5)+idx;
    const made=tent3D(styleIdx);const group=made.group;group.position.set(px,py,pz);group.rotation.y=(side<0?Math.PI*.35:-Math.PI*.35)+(r()-.5)*.18;
    group.visible=false; group.userData.tent={id:'tent-'+idx}; made.hit.userData.tent={id:'tent-'+idx};
    scene.add(group);
    const label=document.createElement('div');label.className='nametag';label.textContent='⛺ 쉼터 · 클릭하여 들어가기';label.style.display='none';$('labels').appendChild(label);
    const tent={id:'tent-'+idx,x:px,y:py,z:pz,alt:Math.round(py*ALT_K),mesh:group,hit:made.hit,label,style:styleIdx,palette:made.palette};
    group.userData.tent=tent; made.hit.userData.tent=tent; tent.camp=makeTentCampfire(tent); tents.push(tent);
    idx++; targetAlt += 500+r()*200;
  }
}
/* Pink ribbons tied onto real tree branches near each tent.
   Purely seeded by tree coordinates, so everyone sees the same markers. */
const TENT_RIBBON_RADIUS=80, TENT_RIBBON_REVEAL=96;
const RIBBON_BRANCH_GEO=keep(new THREE.CylinderGeometry(.045,.065,1,5));
const RIBBON_KNOT_GEO=keep(new THREE.OctahedronGeometry(1,0));
const RIBBON_TAIL_GEO=keep(new THREE.BoxGeometry(1,1,1));
const RIBBON_PINK=M(0xd77c9f),RIBBON_PINK_LIGHT=M(0xeeaac5),RIBBON_BRANCH=M(0x73543b);
function closestTentToTree(t){
  let best=null,dist=TENT_RIBBON_RADIUS;
  for(const tent of tents){const d=Math.hypot(tent.x-t.x,tent.z-t.z);if(d<dist){best=tent;dist=d}}
  return best;
}
function makeBranchRibbon(tree){
  const g=new THREE.Group();
  const sc=.6+tree.s*.37; const yaw=tree.rot+Math.PI*.26;
  g.position.set(tree.x,tree.y+3.6*tree.s,tree.z);g.rotation.y=yaw;
  const piece=(geo,mat,x,y,z,sx,sy,sz,rz=0)=>{
    const o=new THREE.Mesh(geo,mat);o.position.set(x*sc,y*sc,z*sc);o.scale.set(sx*sc,sy*sc,sz*sc);o.rotation.z=rz;g.add(o);return o;
  };
  piece(RIBBON_BRANCH_GEO,RIBBON_BRANCH,.47,.07,0,1.08,1,1,-Math.PI/2+.13);
  piece(RIBBON_KNOT_GEO,RIBBON_PINK_LIGHT,.89,.13,0,.12,.11,.07);
  piece(RIBBON_KNOT_GEO,RIBBON_PINK,.76,.18,.025,.18,.09,.055,.38);
  piece(RIBBON_KNOT_GEO,RIBBON_PINK,1.02,.18,-.025,.18,.09,.055,-.38);
  piece(RIBBON_TAIL_GEO,RIBBON_PINK,.81,-.15,.022,.082,.39,.025,.18);
  piece(RIBBON_TAIL_GEO,RIBBON_PINK_LIGHT,.98,-.19,-.02,.075,.45,.024,-.20);
  return g;
}
function placeTentTrailRibbons(c,grp){
  c.ribbons=[];let n=0;
  for(const tree of c.trees){
    if(tree.s<.38||n>=5)continue;
    const closest=closestTentToTree(tree);if(!closest)continue;
    const seed=h2(Math.round(tree.x*11)+318,Math.round(tree.z*11)+741);
    if(seed>.14)continue;
    const marker=makeBranchRibbon(tree);marker.visible=false;marker.userData.zoneVisible=false;
    tree.ribbon=marker;grp.add(marker);c.ribbons.push({mesh:marker,tent:closest,tree});n++;
  }
}
let lastRibbonRefresh=0;
function updateRibbonVisibility(force=false){
  const now=Date.now();if(!force&&now-lastRibbonRefresh<350)return;lastRibbonRefresh=now;
  for(const c of chunks.values())for(const marker of c.ribbons||[]){
    const visible=!inTent&&Math.hypot(P.x-marker.tent.x,P.z-marker.tent.z)<TENT_RIBBON_REVEAL;
    marker.mesh.userData.zoneVisible=visible;
    marker.mesh.visible=visible&&!marker.tree.hidden;
  }
}
function updateTents(){
 updateRibbonVisibility();
 const hour=(gameMin/60)%24; const night=(hour>=18.3||hour<=5.4);
 for(const t of tents){
   const d=Math.hypot(t.x-P.x,t.z-P.z);t.mesh.visible=d<180;
   if(t.mesh.userData.setGlow)t.mesh.userData.setGlow(night,d<23);
   if(mode!=='game'||inTent||d>16){t.label.style.display='none';continue}
   tentHintWorld.set(t.x,t.y+2.6,t.z).project(camera);
   if(tentHintWorld.z<=-1||tentHintWorld.z>=1||Math.abs(tentHintWorld.x)>1.1||Math.abs(tentHintWorld.y)>1.1){t.label.style.display='none';continue}
   t.label.style.display='';t.label.style.transform=`translate(${(tentHintWorld.x*.5+.5)*W}px,${(-tentHintWorld.y*.5+.5)*Hh}px) translate(-50%,-100%)`;
 }
}
let inTent=false,activeTent=null,selectedSellKey='';
