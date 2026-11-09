/* ================= INTRO SCENE ================= */
const iScene=new THREE.Scene();iScene.fog=new THREE.Fog(0xe3ebe8,700,3400);
const iCam=new THREE.PerspectiveCamera(42,1,1,5000);
iScene.add(new THREE.HemisphereLight(0xeef4f2,0x3a4f4a,.7));
const iSun=new THREE.DirectionalLight(0xfff1dc,.55);iSun.position.set(300,500,400);iScene.add(iSun);
{
  const r=rngOf(3);
  const rows=[{z:-900,n:9,h:[260,420],c:0x9fb3b0},{z:-600,n:8,h:[200,320],c:0x7f9993},{z:-320,n:7,h:[140,240],c:0x5f7b72},{z:-90,n:6,h:[90,160],c:0x46625a}];
  rows.forEach((row,ri)=>{for(let i=0;i<row.n;i++){const x=(i/(row.n-1)-.5)*1900+(r()-.5)*120;if(Math.abs(x)<150&&ri<3)continue;const h=lerp(row.h[0],row.h[1],r());const m=makeMountain(h*1.15,h,ri*40+i,row.c,ri<2?0xeef0ea:null,{snowLine:.85});m.position.set(x,-20,row.z+(r()-.5)*80);iScene.add(m)}});
  const peak=makeMountain(380,880,777,0x2f4a45,0xf6f6f0,{seg:18,hs:12,snowLine:.74});peak.position.set(0,-20,-520);iScene.add(peak);
}
const iClouds=[];
{const r=rngOf(21);for(let i=0;i<70;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false,opacity:.95,fog:false}));
  const x=(r()-.5)*900,y=(r()-.1)*520,z=380+r()*220;sp.position.set(x,y,z);const s=180+r()*260;sp.scale.set(s*1.6,s,1);sp.userData={x0:x,side:x<0?-1:1,sp:.6+r()*.8};iScene.add(sp);sp.visible=!IOS_CLOUD_SAFE;iClouds.push(sp)}}
let introT=0, zoomT=-1, mode='intro';
function drawIntro(dt){
  introT+=dt;const t=introT;
  const part=ease(clamp((t-.8)/3.6,0,1));
  for(const c of iClouds){c.position.x=c.userData.x0+c.userData.side*part*(700+300*c.userData.sp)+Math.sin(t*.3+c.userData.sp*9)*8;c.material.opacity=.95*(1-part*.5)}
  if(IOS_CLOUD_SAFE){const fog=$('iosClouds');fog.children[0].style.transform=`translateX(${-part*125}%)`;fog.children[1].style.transform=`scaleX(-1) translateX(${-part*125}%)`;fog.style.opacity=String(1-part*.75);}
  const z=zoomT>=0?ease(clamp(zoomT/1.8,0,1)):0;
  iCam.position.set(0,lerp(170,60,z)+Math.sin(t*.25)*3,lerp(1150,60,z)-Math.min(t,8)*6*(1-z));
  iCam.lookAt(0,lerp(260,120,z),-520);
  renderer.render(iScene,iCam);
  if(t>2.7)$('title').classList.add('on');
  if(t>3.2)$('subtitle').classList.add('on');
  if(t>4)$('startPanel').classList.add('on');
  if(zoomT>=0){zoomT+=dt;if(zoomT>1.2)$('fade').classList.add('on');if(zoomT>2.2){try{beginGame()}catch(err){showStartError(err)}}}
}
