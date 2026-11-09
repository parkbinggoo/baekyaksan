/* ================= 지도 · 나침반 ================= */
const GEO={lat0:37.7312,lon0:128.5946};
function toLatLon(x,z){const lat=GEO.lat0+(-z)/111320;return[lat,GEO.lon0+x/(111320*Math.cos(lat*Math.PI/180))]}
function myGeo(){const [lat,lon]=toLatLon(P.x,P.z);return {lat,lon,alt:Math.min(SUMMIT_ALT,Math.round(P.y*ALT_K))}}
function dms(v,pos,neg,decimals=1){
 const sign=v>=0?pos:neg,unit=Math.pow(10,decimals);
 const ticks=Math.round(Math.abs(v)*3600*unit);
 const deg=Math.floor(ticks/(3600*unit)),rem=ticks-deg*3600*unit;
 const min=Math.floor(rem/(60*unit)),sec=(rem-min*60*unit)/unit;
 const secText=sec.toFixed(decimals).padStart(decimals?3+decimals:2,'0');
 return `${sign} ${deg}°${String(min).padStart(2,'0')}′${secText}″`;
}
const DIRS=['북','북북동','북동','동북동','동','동남동','남동','남남동','남','남남서','남서','서남서','서','서북서','북서','북북서'];
const bearingOf=h=>(Math.atan2(Math.sin(h),-Math.cos(h))*180/Math.PI+360)%360;
const dirName=b=>DIRS[Math.round(b/22.5)%16];
delete save.trail;
let mapOpen=false;const mapZoom=.25;let mapBase=null,mapBaseAt=null;
function renderMapBase(){
  const c=$('mapC'),Wm=c.width,Hm=c.height,st=4,s=mapZoom,cols=Math.ceil(Wm/st),rows=Math.ceil(Hm/st),cx=Wm/2,cy=Hm/2;
  if(!mapBase)mapBase=document.createElement('canvas');mapBase.width=Wm;mapBase.height=Hm;
  const small=document.createElement('canvas');small.width=cols;small.height=rows;const sg=small.getContext('2d'),img=sg.createImageData(cols,rows),px=img.data;
  const alts=new Float32Array(cols*rows),outs=new Uint8Array(cols*rows);
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const wx=P.x+(i*st+st/2-cx)*s,wz=P.z+(j*st+st/2-cy)*s;alts[j*cols+i]=H(wx,wz)*ALT_K;outs[j*cols+i]=Math.abs(wx-pathX(wz))>58?1:0}
  const cLow=new THREE.Color(0xa9c48a),cMid=new THREE.Color(0x7f9e62),cHigh=new THREE.Color(0xa7a493),cSnow=new THREE.Color(0xf2f2ec),cFor=new THREE.Color(0x3f6334),cOut=new THREE.Color(0xcfcabd),cWater=new THREE.Color(0x5f9fc0),cLine=new THREE.Color(0x5a4028),k=new THREE.Color();
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const n=j*cols+i,wx=P.x+(i*st+st/2-cx)*s,wz=P.z+(j*st+st/2-cy)*s,a=alts[n];
    if(outs[n]){k.copy(cOut);if((i+j)%5===0)k.multiplyScalar(.9)}              // 갈 수 없는 가파른 바깥 비탈
    else{
      if(a<700)k.copy(cLow).lerp(cMid,a/700);else if(a<1600)k.copy(cMid).lerp(cHigh,(a-700)/900);else k.copy(cHigh).lerp(cSnow,clamp((a-1600)/800,0,1));
      k.lerp(cFor,canopyAt(wx,wz)*.45);
      const ax=i<cols-1?alts[n+1]:a,az=j<rows-1?alts[n+cols]:a;k.multiplyScalar(clamp(1-((ax-a)+(az-a))*.045/s,.65,1.2));
      if(streamD(wx,wz)<2.2*Math.max(1,s*.8))k.copy(cWater);
      const band=Math.floor(a/50);if((i>0&&!outs[n-1]&&Math.floor(alts[n-1]/50)!==band)||(j>0&&!outs[n-cols]&&Math.floor(alts[n-cols]/50)!==band))k.lerp(cLine,band%5===0?.55:.25);
    }
    px[n*4]=k.r*255;px[n*4+1]=k.g*255;px[n*4+2]=k.b*255;px[n*4+3]=255}
  sg.putImageData(img,0,0);const g=mapBase.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(small,0,0,cols*st,rows*st);
  mapBaseAt={x:P.x,z:P.z,s};
}
function drawMap(){
  const c=$('mapC'),g=c.getContext('2d'),Wm=c.width,Hm=c.height,cx=Wm/2,cy=Hm/2,s=mapZoom;
  if(!mapBaseAt||mapBaseAt.s!==s||Math.hypot(P.x-mapBaseAt.x,P.z-mapBaseAt.z)>Wm*s*.18)renderMapBase();
  const toPx=(x,z)=>[cx+(x-P.x)/s,cy+(z-P.z)/s];
  g.fillStyle='#e8e2d2';g.fillRect(0,0,Wm,Hm);g.drawImage(mapBase,(mapBaseAt.x-P.x)/s,(mapBaseAt.z-P.z)/s);
  if(s<=.5){const r0=Wm*s*.6;for(const ch of chunks.values()){
    for(const t of ch.trees){if(Math.abs(t.x-P.x)>r0||Math.abs(t.z-P.z)>r0)continue;const[x,y]=toPx(t.x,t.z);const rr=(t.kind==='pine'?2.4:3)*t.s/s;g.fillStyle=t.kind==='pine'?'rgba(38,70,44,.42)':'rgba(70,110,52,.4)';g.beginPath();g.arc(x,y,rr,0,7);g.fill();g.fillStyle='rgba(60,40,25,.7)';g.beginPath();g.arc(x,y,Math.max(1,.4*t.s/s),0,7);g.fill()}
    for(const k of ch.rocks||[]){if(Math.abs(k.x-P.x)>r0||Math.abs(k.z-P.z)>r0)continue;const[x,y]=toPx(k.x,k.z);g.fillStyle='rgba(150,146,132,.95)';g.strokeStyle='rgba(80,76,66,.9)';g.lineWidth=1;g.beginPath();g.arc(x,y,k.r/s,0,7);g.fill();g.stroke()}}}
  const {lat:lat0,lon:lon0}=myGeo();
  const mPerLon=111320*Math.cos(lat0*Math.PI/180);
  const step=[1,2,5,10,15,30,60,120,300].find(v=>v/3600*111320/s>=95)||300;
  const latTop=lat0+cy*s/111320,latBot=lat0-cy*s/111320,lonL=lon0-cx*s/mPerLon,lonR=lon0+cx*s/mPerLon;
  const fmt=(v,p,n)=>dms(v,p,n,0);
  g.font='10.5px "Gowun Dodum",sans-serif';g.lineWidth=1;
  for(let v=Math.ceil(latBot*3600/step)*step/3600;v<=latTop;v+=step/3600){const y=cy-(v-lat0)*111320/s;
    g.strokeStyle='rgba(31,43,40,.22)';g.beginPath();g.moveTo(0,y);g.lineTo(Wm,y);g.stroke();
    g.strokeStyle='#1f2b28';g.beginPath();g.moveTo(0,y);g.lineTo(9,y);g.moveTo(Wm-9,y);g.lineTo(Wm,y);g.stroke();
    g.save();g.translate(12,y-3);g.fillStyle='rgba(244,239,227,.85)';const t=fmt(v,'N','S'),tw=g.measureText(t).width;g.fillRect(-2,-10,tw+4,13);g.fillStyle='#1f2b28';g.textAlign='left';g.fillText(t,0,0);g.restore()}
  for(let v=Math.ceil(lonL*3600/step)*step/3600;v<=lonR;v+=step/3600){const x=cx+(v-lon0)*mPerLon/s;
    g.strokeStyle='rgba(31,43,40,.22)';g.beginPath();g.moveTo(x,0);g.lineTo(x,Hm);g.stroke();
    g.strokeStyle='#1f2b28';g.beginPath();g.moveTo(x,0);g.lineTo(x,9);g.moveTo(x,Hm-9);g.lineTo(x,Hm);g.stroke();
    const t=fmt(v,'E','W'),tw=g.measureText(t).width;g.fillStyle='rgba(244,239,227,.85)';g.fillRect(x-tw/2-2,Hm-24,tw+4,13);g.fillStyle='#1f2b28';g.textAlign='center';g.fillText(t,x,Hm-14)}
  g.strokeStyle='#1f2b28';g.lineWidth=2;g.strokeRect(1,1,Wm-2,Hm-2);
  { const [bx,by]=toPx(BASE_CAMP.x,BASE_CAMP.z), rr=BASE_CAMP.r/s;
    g.save();
    g.fillStyle='rgba(233,156,61,.13)'; g.strokeStyle='rgba(181,102,23,.88)'; g.lineWidth=2; g.setLineDash([8,6]);
    g.beginPath(); g.arc(bx,by,rr,0,Math.PI*2); g.fill(); g.stroke(); g.setLineDash([]);
    if(rr>22){
      g.font='12px "Gowun Dodum",sans-serif'; g.textAlign='center';
      const text='베이스 캠프 권역', tw=g.measureText(text).width;
      g.fillStyle='rgba(244,239,227,.9)'; g.fillRect(bx-tw/2-6,by-6,tw+12,18);
      g.fillStyle='#7a4716'; g.fillText(text,bx,by+7);
    }
    g.restore(); }
  const b=bearingOf(P.h)*Math.PI/180;g.save();g.translate(cx,cy);
  g.fillStyle='rgba(216,52,44,.18)';g.beginPath();g.arc(0,0,17,0,7);g.fill();
  g.rotate(b);g.fillStyle='#d8342c';g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.moveTo(0,-12);g.lineTo(8,9);g.lineTo(0,4);g.lineTo(-8,9);g.closePath();g.stroke();g.fill();g.restore();
  const sbm=20,sb=sbm/s;
  g.fillStyle='rgba(244,239,227,.92)';g.fillRect(14,14,Math.max(sb,96)+20,40);g.fillStyle='#1f2b28';g.fillRect(24,42,sb,3);g.fillRect(24,38,2,7);g.fillRect(24+sb-2,38,2,7);
  g.font='11px "Gowun Dodum",sans-serif';g.textAlign='left';g.fillText(`${sbm}m · 해발 ${Math.max(0,Math.round(P.y*ALT_K)).toLocaleString()}m`,24,32);
  drawCompassOn(g,Wm-52,52,40,bearingOf(P.h));
}
function drawCompassOn(g,cx,cy,r,bd){
  g.save();g.fillStyle='rgba(244,239,227,.94)';g.strokeStyle='#1f2b28';g.lineWidth=1.5;g.beginPath();g.arc(cx,cy,r,0,7);g.fill();g.stroke();
  for(let i=0;i<36;i++){const a=i*10*Math.PI/180,l=i%9===0?7:3;g.strokeStyle=i%9===0?'#1f2b28':'rgba(31,43,40,.45)';g.lineWidth=i%9===0?1.6:1;g.beginPath();g.moveTo(cx+Math.sin(a)*(r-1),cy-Math.cos(a)*(r-1));g.lineTo(cx+Math.sin(a)*(r-1-l),cy-Math.cos(a)*(r-1-l));g.stroke()}
  g.font='bold 11px "Nanum Myeongjo",serif';g.textAlign='center';g.textBaseline='middle';
  for(const[t,a,col] of [['북',0,'#d8342c'],['동',90,'#1f2b28'],['남',180,'#1f2b28'],['서',270,'#1f2b28']]){const rr=a*Math.PI/180;g.fillStyle=col;g.fillText(t,cx+Math.sin(rr)*(r-15),cy-Math.cos(rr)*(r-15))}
  g.translate(cx,cy);g.rotate(bd*Math.PI/180);g.fillStyle='#d8342c';g.beginPath();g.moveTo(0,-(r-24));g.lineTo(4,0);g.lineTo(-4,0);g.closePath();g.fill();
  g.fillStyle='#5d6268';g.beginPath();g.moveTo(0,r-24);g.lineTo(4,0);g.lineTo(-4,0);g.closePath();g.fill();g.restore();
  g.fillStyle='#1f2b28';g.beginPath();g.arc(cx,cy,2.5,0,7);g.fill();g.textBaseline='alphabetic';
  g.font='11px "Gowun Dodum",sans-serif';g.fillStyle='rgba(244,239,227,.92)';const t=`${dirName(bd)} ${Math.round(bd)}°`,tw=g.measureText(t).width;g.fillRect(cx-tw/2-4,cy+r+4,tw+8,15);g.fillStyle='#1f2b28';g.fillText(t,cx,cy+r+15);
}
function toggleMap(open){if(inSecretCave&&open!==false){toast('동굴 안에서는 지도를 펼칠 수 없습니다.');return}mapOpen=open===undefined?!mapOpen:open;$('mapView').classList.toggle('hide',!mapOpen);if(mapOpen){mapBaseAt=null;drawMap()}}
$('mapBtn').onclick=()=>toggleMap(true);$('mapClose').onclick=()=>toggleMap(false);
$('mapView').addEventListener('pointerdown',e=>{if(e.target.id==='mapView')toggleMap(false)});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||mode!=='game')return;if(e.code==='KeyM')toggleMap();if(e.code==='Escape')toggleMap(false)});
