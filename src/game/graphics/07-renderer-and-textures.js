/* ---------- renderer ---------- */
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:!IOS_CLOUD_SAFE,alpha:true,powerPreference:IOS_CLOUD_SAFE?'default':'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,IOS_CLOUD_SAFE?1.5:2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000,0);
const camera=new THREE.PerspectiveCamera(55,1,.1,4000);
let W=innerWidth,Hh=innerHeight;
function onResize(){W=innerWidth;Hh=innerHeight;renderer.setSize(W,Hh,false);camera.aspect=W/Hh;camera.fov=W<Hh?68:55;camera.updateProjectionMatrix();iCam.aspect=W/Hh;iCam.fov=W<Hh?66:42;iCam.updateProjectionMatrix()}
const matCache={};
function M(c,o){const k=c+'|'+(o?JSON.stringify(o):'');if(!matCache[k])matCache[k]=new THREE.MeshPhongMaterial(Object.assign({color:c,flatShading:true,shininess:0,specular:0x000000},o||{}));return matCache[k]}
function keep(g){g.userData.keep=true;return g}
/* ---------- textures ---------- */
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);return t}
const puffTex=canvasTex(128,128,(g)=>{const r=g.createRadialGradient(64,64,4,64,64,62);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.5,'rgba(255,255,255,.75)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128)});
const sparkTex=canvasTex(64,64,(g)=>{const r=g.createRadialGradient(32,32,0,32,32,30);r.addColorStop(0,'rgba(255,255,230,1)');r.addColorStop(.25,'rgba(255,240,170,.6)');r.addColorStop(1,'rgba(255,240,170,0)');g.fillStyle=r;g.fillRect(0,0,64,64);g.strokeStyle='rgba(255,255,240,.9)';g.lineWidth=2;g.beginPath();g.moveTo(32,4);g.lineTo(32,60);g.moveTo(4,32);g.lineTo(60,32);g.stroke()});
const zigTex=canvasTex(256,32,(g)=>{g.fillStyle='#2e3033';g.fillRect(0,0,256,32);g.strokeStyle='#8fc63a';g.lineWidth=3;g.beginPath();for(let x=0;x<=256;x+=16)g.lineTo(x,x%32?8:24);g.stroke()});
const heartTex=canvasTex(64,64,(g)=>{g.fillStyle='#e2665a';g.font='52px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('♥',32,36)});
const weaveTex=canvasTex(64,64,(g)=>{g.fillStyle='#b48a4e';g.fillRect(0,0,64,64);g.strokeStyle='#7d5a2c';g.lineWidth=2;for(let y=0;y<64;y+=8){g.beginPath();g.moveTo(0,y);g.lineTo(64,y+3);g.stroke()}for(let x=0;x<64;x+=10){g.strokeStyle='rgba(90,60,30,.5)';g.beginPath();g.moveTo(x,0);g.lineTo(x,64);g.stroke()}});
function textTex(txt,w=256,h=96,bg='#d9c49a',fg='#3a2a1a',font='bold 44px "Nanum Myeongjo",serif'){return canvasTex(w,h,(g)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.strokeStyle='#6b4a2a';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);g.fillStyle=fg;g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillText(txt,w/2,h/2+2)})}
