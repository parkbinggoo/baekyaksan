/* ---------- low-poly 2-person tent room (same primitive / matte material language as herbs) ---------- */
const tentScene=new THREE.Scene();tentScene.background=new THREE.Color(0x211b17);
const tentCam=new THREE.PerspectiveCamera(43,1,.1,80);
const tentFurniture=new THREE.Group();tentScene.add(tentFurniture);
tentScene.add(new THREE.HemisphereLight(0xffe8be,0x403126,1.12));
const tentSun=new THREE.DirectionalLight(0xffdfb2,.75);tentSun.position.set(1.5,3.6,4.5);tentScene.add(tentSun);
const tentLight=new THREE.PointLight(0xffd28a,1.35,9,2);tentLight.position.set(-1.5,1.35,-1.18);tentScene.add(tentLight);
const tentMat={canvas:M(0xca8d48),back:M(0xb4763a),seam:M(0x664b31),mat:M(0x514b40),edge:M(0x32312c),green:M(0x60735f),blue:M(0x506b93),pillow:M(0xcfc5ae),wood:M(0x986c49),chest:M(0x87513b),metal:M(0x5d635e),gold:M(0xd9af61)};
const tentAdd=(geo,mat,x,y,z,parent=tentFurniture)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m};
function tentTriangle(a,b,c,d,e,f,mat){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c,...c,...b,...d],3));geo.computeVertexNormals();const o=tentAdd(geo,mat,0,0,0);o.material.side=THREE.DoubleSide;return o}
function setupTentInterior(){
 // Camera must face the actual interior, not stand several metres beyond the vestibule.
 tentCam.position.set(0,1.77,3.52);
 tentCam.lookAt(0,1.27,-.72);
 const near=2.05,far=-2.26,radius=2.06,height=2.62,seg=12;
 // Independent, visible low-poly floor and full arched canopy. No sleeping mats.
 tentAdd(new THREE.BoxGeometry(4.12,.10,4.36),tentMat.mat,0,.055,-.10);
 tentMat.canvas.side=THREE.DoubleSide;tentMat.canvas.needsUpdate=true;
 tentMat.back.side=THREE.DoubleSide;tentMat.back.needsUpdate=true;
 const canopy=[],rear=[];
 for(let i=0;i<seg;i++){
   const a=i*Math.PI/seg,b=(i+1)*Math.PI/seg;
   const x1=radius*Math.cos(a),x2=radius*Math.cos(b);
   const y1=.11+height*Math.sin(a),y2=.11+height*Math.sin(b);
   canopy.push(x1,y1,far,x2,y2,far,x1,y1,near,
               x1,y1,near,x2,y2,far,x2,y2,near);
   rear.push(0,.11,far,x1,y1,far,x2,y2,far);
 }
 // Build separate double-sided cloth meshes with real surface normals.
 for(const [points,material] of [[canopy,tentMat.canvas],[rear,tentMat.back]]){
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
   geometry.computeVertexNormals();
   const cloth=tentAdd(geometry,material);
   cloth.frustumCulled=false;
 }
 // Clearly visible dark curved seam along each arch: front and rear.
 for(const z of [near-.035,far+.025]){
   const arch=[];
   for(let i=0;i<=seg;i++){
     const a=i*Math.PI/seg;
     arch.push(new THREE.Vector3(radius*Math.cos(a),.11+height*Math.sin(a),z));
   }
   tentAdd(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch),seg*2,.033,5,false),tentMat.seam);
 }
 // Ceiling seam and tent edge reinforce the enclosed shape on portrait screens.
 const ridge=tentAdd(new THREE.CylinderGeometry(.025,.025,near-far,5),tentMat.seam,0,.11+height,(near+far)/2);
 ridge.rotation.x=Math.PI/2;
 for(const x of [-1.90,1.90])tentAdd(new THREE.CylinderGeometry(.035,.045,.42,5),tentMat.seam,x,.31,1.83);
 // Warm lantern: visible glowing glass and a small metal body.
 tentAdd(new THREE.CylinderGeometry(.09,.12,.30,6),tentMat.metal,-1.50,.34,-1.16);
 const glowMat=new THREE.MeshBasicMaterial({color:0xffc278});
 tentAdd(new THREE.CylinderGeometry(.09,.09,.17,6),glowMat,-1.50,.56,-1.16);
 tentAdd(new THREE.ConeGeometry(.13,.09,6),tentMat.metal,-1.50,.70,-1.16);
 // Existing sale chest is preserved in front of the two seated hikers.
 const chestGroup=new THREE.Group();chestGroup.position.set(0,.18,1.03);tentFurniture.add(chestGroup);
 tentAdd(new THREE.BoxGeometry(.85,.45,.55),tentMat.chest,0,.27,0,chestGroup);
 tentAdd(new THREE.BoxGeometry(.93,.12,.61),tentMat.wood,0,.54,0,chestGroup);
 tentAdd(new THREE.BoxGeometry(.07,.42,.05),tentMat.gold,0,.26,.28,chestGroup);
 tentFurniture.userData.chestPoint=new THREE.Vector3(0,.74,1.03);
}
setupTentInterior();
const tentHikers=new Map();
function tentAvatar(player){
 let entry=tentHikers.get(player.id);
 const col=JACKETS[((player.color|0)%JACKETS.length+JACKETS.length)%JACKETS.length];
 if(entry&&entry.color!==col){tentScene.remove(entry.hiker.root);entry.nameEl.remove();tentHikers.delete(player.id);entry=null}
 if(!entry){
   const hiker=makeHiker(col);hiker.mode='sit';poseHiker(hiker,1,.0);tentScene.add(hiker.root);
   const nameEl=document.createElement('div');nameEl.className='tentNameTag';$('tentView').appendChild(nameEl);
   entry={hiker,nameEl,color:col};tentHikers.set(player.id,entry);
 }
 entry.nameEl.textContent=rankLabel(player.rank||1)+' · '+player.name;
 return entry;
}
function updateTentSeats(dt){
 if(!inTent||!activeTent){for(const e of tentHikers.values())e.nameEl.style.display='none';return}
 const ppl=tentPeople(activeTent).slice(0,TENT_CAPACITY),present=new Set();
 for(let i=0;i<ppl.length;i++){
   const p=ppl[i],e=tentAvatar(p);present.add(p.id);
   e.hiker.root.position.set(i===0?-.86:.86,0,-.75);
   e.hiker.root.rotation.set(0,0,0);
   e.hiker.mode='sit';poseHiker(e.hiker,Math.min(dt,.05),0);
   const head=new THREE.Vector3(i===0?-.86:.86,1.55,-.75).project(tentCam);
   e.nameEl.style.display=head.z>1?'none':'';
   e.nameEl.style.left=((head.x+1)*W/2)+'px';e.nameEl.style.top=((1-head.y)*Hh/2)+'px';
 }
 for(const [id,e] of tentHikers){if(present.has(id))continue;tentScene.remove(e.hiker.root);e.nameEl.remove();tentHikers.delete(id)}
 $('tentStatus').textContent=`⛺ 백약산 쉼터 · 해발 ${activeTent.alt.toLocaleString()}m · ${ppl.length}/2명`;
}
function syncTentChestButton(){
 if(!inTent)return;
 tentCam.aspect=Math.max(1,W)/Math.max(1,Hh);
 tentCam.fov=tentCam.aspect<1 ? clamp(2*Math.atan(Math.tan(54*Math.PI/360)/tentCam.aspect)*180/Math.PI,64,80) : 54;
 tentCam.updateProjectionMatrix();
 const p=tentFurniture.userData.chestPoint.clone().project(tentCam);
 $('tentChest').style.left=((p.x+1)*W/2)+'px';
 $('tentChest').style.top=((1-p.y)*Hh/2)+'px';
}
