/* ---------- 도감 아이콘: 3D 모델을 그대로 렌더 (땅속 뿌리까지) ---------- */
let iconR=null,iconScene=null,iconCam=null;const iconCache={};
function iconInit(){if(iconR)return;const cv=document.createElement('canvas');cv.width=240;cv.height=320;
  iconR=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true,preserveDrawingBuffer:true});iconR.setPixelRatio(1);iconR.setSize(240,320,false);iconR.setClearColor(0,0);
  iconScene=new THREE.Scene();iconScene.add(new THREE.HemisphereLight(0xffffff,0x6a5a40,.75));const d=new THREE.DirectionalLight(0xfff4e0,.6);d.position.set(2,4,3);iconScene.add(d);
  // Add vertical room without zooming out: retain the previous 240x200 frame's horizontal field of view.
  const tallFov=2*Math.atan(Math.tan(30*Math.PI/360)*(320/200))*180/Math.PI;
  iconCam=new THREE.PerspectiveCamera(tallFov,240/320,.01,100)}
const FRUITS={
 acorn:{name:'도토리',rar:1,desc:'참나무 아래에서 줍는 가을의 열매.',hab:'참나무 숲 바닥',color:0x8c5a2d},
 chestnut:{name:'밤',rar:2,desc:'밤나무 아래 떨어진 단단한 갈색 밤.',hab:'밤나무 아래 산기슭',color:0x793e26},
 pinecone:{name:'솔방울',rar:1,desc:'소나무에서 바람을 타고 떨어진 솔방울.',hab:'소나무 주변',color:0x967144},
 wildberry:{name:'산딸기',rar:2,desc:'햇살 드는 숲 가장자리의 붉은 열매.',hab:'숲 가장자리',color:0xb73d48},
 ginkgo:{name:'은행 열매',rar:2,desc:'가을에 볼 수 있는 노란 은행 열매.',hab:'입구 부근 은행나무 아래',color:0xd4bd43},
 jat:{name:'잣',rar:3,desc:'가을에 여문 잣이 겨울에도 땅에 남아 있는 경우가 있다.',hab:'해발 1,250~2,000m 침엽수 주변',color:0xc9aa7b}
};
const FRUIT_SCALE={acorn:.15,chestnut:.20,pinecone:.34,wildberry:.14,ginkgo:.16,jat:.13};
const FRUIT_HEIGHT={acorn:.045,chestnut:.047,pinecone:.065,wildberry:.043,ginkgo:.043,jat:.042};
function fruit3D(type){
 const g=new THREE.Group(),d=FRUITS[type];
 const stemMat=M(0x705438),leafMat=M(0x587342),leafLite=M(0x7c9252);
 const add=(geo,mat,x=0,y=0,z=0,sx=1,sy=1,sz=1,parent=g)=>{
   const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);
   o.castShadow=true;parent.add(o);return o;
 };
 const ball=(mat,x,y,z,rx,ry,rz,detail=0)=>add(new THREE.IcosahedronGeometry(1,detail),mat,x,y,z,rx,ry,rz);
 const leaf=(x,y,z,rot,size=.12)=>{
   const v=add(new THREE.IcosahedronGeometry(1,0),leafMat,x,y,z,size,.025,size*1.65);
   v.rotation.y=rot;v.rotation.z=.12;return v;
 };
 if(type==='acorn'){
   const nut=ball(M(0x976031),0,-.018,0,.175,.225,.17,1);
   nut.rotation.z=.06;
   const cup=add(new THREE.CylinderGeometry(.17,.145,.085,9,1,true),M(0x796044),0,.142,0);
   add(new THREE.CylinderGeometry(.012,.017,.13,5),stemMat,0,.236,0);
   for(let i=0;i<7;i++){
     const a=i*Math.PI*2/7;ball(M(i%2?0x856947:0x655037),Math.sin(a)*.13,.158,Math.cos(a)*.13,.043,.025,.040);
   }
 }else if(type==='chestnut'){
   const nut=ball(M(0x824628),0,-.012,0,.185,.185,.165,1);
   add(new THREE.ConeGeometry(.105,.125,7),M(0x9b5a30),0,.180,0);
   ball(M(0xc4a57b),0,-.17,.005,.11,.018,.12,0);
 }else if(type==='pinecone'){
   add(new THREE.CylinderGeometry(.045,.067,.46,6),stemMat,0,0,0);
   for(let row=0;row<5;row++){
     const radius=.16-row*.018;
     for(let i=0;i<7;i++){
       const a=i*2*Math.PI/7+row*.46;
       const scale=radius*(1-row*.06);
       const scalePiece=add(new THREE.ConeGeometry(.07,.21-row*.01,5),M((row+i)%3===0?0x80603d:0x9a7650),
         Math.sin(a)*scale,-.14+row*.08,Math.cos(a)*scale);
       scalePiece.rotation.z=Math.sin(a)*.45;scalePiece.rotation.x=-Math.cos(a)*.45;
     }
   }
 }else if(type==='wildberry'){
   for(let i=0;i<9;i++){
     const a=i*2.3999632,r=i<3?.075:.116;
     ball(M(i%3===0?0xa93441:i%3===1?0xc74650:0xd15c59),Math.sin(a)*r,.02+(i%3-1)*.065,Math.cos(a)*r,.088,.082,.084);
   }
   add(new THREE.CylinderGeometry(.012,.015,.13,5),stemMat,0,.19,0);
   for(let i=0;i<4;i++)leaf(Math.sin(i*Math.PI/2)*.09,.15,Math.cos(i*Math.PI/2)*.09,i*Math.PI/2,.064);
 }else if(type==='jat'){
   for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const nut=ball(M(i===0?0xcdb48b:0xb99c72),Math.sin(a)*.12,-.02,Math.cos(a)*.12,.09,.19,.09,0);nut.rotation.z=Math.sin(a)*.15;}
   add(new THREE.CylinderGeometry(.016,.02,.15,5),stemMat,0,.18,0);
 }else if(type==='ginkgo'){
   ball(M(0xbdb04e),0,0,0,.17,.16,.15,1);
   ball(M(0xd7c95e),-.045,.035,.05,.115,.10,.10,0);
   add(new THREE.CylinderGeometry(.01,.013,.15,5),stemMat,0,.18,0);
   leaf(.045,.25,0,.2,.09);
 }
 return g;
}
// Honeycomb used both in the world and in the field guide; no external texture.
function hive3D(type){
 const g=new THREE.Group(),rare=type==='nativeHoney';
 const bark=M(rare?0x5b4936:0x826849),wax=M(type==='chestnutHoney'?0x9a6836:0xd0a154),
       waxLight=M(rare?0xe6bc62:0xe7c078),dark=M(0x5a432c),beeDark=M(0x2b2924),beeGold=M(0xc5a148);
 const add=(geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;g.add(m);return m};
 // Short hollow-log cover and rounded, six-sided comb: recognisable from walking height.
 add(new THREE.CylinderGeometry(.33,.40,.28,7),bark,0,.19,0);
 add(new THREE.IcosahedronGeometry(.31,1),wax,0,.40,.12,.99,.88,.85);
 for(let i=0;i<9;i++){const a=i*2.3999632297,rr=.09+(i%3)*.065;
   add(new THREE.CylinderGeometry(.052,.052,.017,6),i%3?waxLight:dark,Math.cos(a)*rr,.40+Math.sin(a)*.15,.37,1,1,1).rotation.x=Math.PI/2;
 }
 for(let i=0;i<4;i++){const a=i*2.4;const bx=Math.sin(a)*(.29+i*.035),by=.59+(i%2)*.11,bz=Math.cos(a)*.23;
   add(new THREE.IcosahedronGeometry(.045,0),beeGold,bx,by,bz,.8,.65,1.25);
   add(new THREE.IcosahedronGeometry(.021,0),beeDark,bx+.02,by,bz+.018,1,1,1);
 }
 return g;
}
function renderIcon(kind,type){
  iconInit();while(iconScene.children.length>2)iconScene.remove(iconScene.children[2]);
  let obj;if(kind==='herb'){obj=new THREE.Mesh(plantGeo(SPI[type],0),plantMat)}else if(kind==='fruit'){obj=fruit3D(type)}else if(kind==='honey'){obj=hive3D(type)}else{obj=mush3D(type);obj.rotation.y=-Math.PI/2}
  const grp=new THREE.Group();grp.add(obj);
  const box=new THREE.Box3().setFromObject(grp),sz=box.getSize(new THREE.Vector3()),ctr=box.getCenter(new THREE.Vector3());
  if(kind==='herb'&&SPI[type].root){const soil=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(sz.x,sz.z)*1.6+.1,Math.max(-box.min.y,.02)+.04),new THREE.MeshBasicMaterial({color:0x6b4f32,transparent:true,opacity:.28}));soil.position.set(ctr.x,(box.min.y-.02)/2,ctr.z-Math.max(sz.z,.05)*.6);grp.add(soil);
    const line=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(sz.x,sz.z)*1.6+.1,.006),new THREE.MeshBasicMaterial({color:0x4a3a26}));line.position.set(ctr.x,0,ctr.z-Math.max(sz.z,.05)*.6+.001);grp.add(line)}
  iconScene.add(grp);
  // Original model scale and camera distance, now rendered inside a taller frame.
  const R=Math.max(sz.x,sz.y*1.1,sz.z)*.6+.01;
  iconCam.position.set(ctr.x+R*.9,ctr.y+R*.55,ctr.z+R*2.5);iconCam.lookAt(ctr);
  grp.children.forEach(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry')o.quaternion.copy(iconCam.quaternion)});
  iconR.render(iconScene,iconCam);return iconR.domElement;
}
function iconURL(kind,type){const k=kind+':'+type;if(!iconCache[k])iconCache[k]=renderIcon(kind,type).toDataURL();return iconCache[k]}
/* 땅을 파서 나오는 것: 그 자리 환경에 맞는 땅속 약초 */
function digFind(x,z){
  const c=chunks.get(Math.floor(x/CH)+','+Math.floor(z/CH));const e=envAt(x,z,c);let S=0;const list=[];
  for(const sp of SPECIES){if(sp.cat!=='root')continue;const f=sp.ab*fitOf(sp,e);if(f>0){list.push([sp.id,f]);S+=f}}
  if(!S||Math.random()>clamp(S/(S+10),0,1)*.6)return null;let p=Math.random()*S;for(const[id,f] of list){p-=f;if(p<=0)return id}return list[list.length-1][0];
}
