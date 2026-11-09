/* ---------- 로우폴리 식물 빌더 ---------- */
const UPV=new THREE.Vector3(0,1,0),V=(x,y,z)=>new THREE.Vector3(x,y,z);
const TAPER=keep(new THREE.ConeGeometry(1,1,7));TAPER.rotateX(Math.PI);TAPER.translate(0,-.5,0);
const CIRC=keep(new THREE.CircleGeometry(1,10));
const TRI=keep((()=>{const s=new THREE.Shape();s.moveTo(-1,0);s.lineTo(1,0);s.quadraticCurveTo(.2,.5,0,1.1);s.quadraticCurveTo(-.2,.5,-1,0);return new THREE.ShapeGeometry(s)})());
const PALM=keep((()=>{const s=new THREE.Shape();for(let i=0;i<=40;i++){const a=i/40*Math.PI*2,r=.75+.25*Math.cos(a*5);s[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r)}return new THREE.ShapeGeometry(s)})());
const STAR5=keep((()=>{const s=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?.42:1,a=i*Math.PI/5;s[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r)}return new THREE.ShapeGeometry(s)})());
const BELL=keep(new THREE.ConeGeometry(1,1.6,7,1,true));
const CURL=keep(new THREE.TorusGeometry(1,.28,5,10,Math.PI*1.6));
function mk(g,geo,col,p,sc,rot){const m=new THREE.Mesh(geo,M(col));if(p)m.position.copy(p);if(sc)m.scale.copy(sc);if(rot)m.rotation.copy(rot);g.add(m);return m}
function stemTo(g,a,b,r,col){const d=new THREE.Vector3().subVectors(b,a),l=d.length()||1e-4;const m=new THREE.Mesh(CYL,M(col));m.position.copy(a);m.scale.set(r,l,r);m.quaternion.setFromUnitVectors(UPV,d.divideScalar(l));g.add(m);return m}
const dirOf=(yaw,pitch)=>V(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
const darker=c=>{const k=new THREE.Color(c).multiplyScalar(.82);return k.getHex()};
function leafShape(g,p,len,wid,yaw,pitch,col,shape){
  switch(shape){
    case 'compound':{const d=dirOf(yaw,pitch),end=p.clone().addScaledVector(d,len);stemTo(g,p,end,.004+len*.01,col);
      for(let i=1;i<=4;i++){const q=p.clone().addScaledVector(d,len*i/4.2);for(const s of [-1,1])leafM(g,q.x,q.y,q.z,len*.34,len*.11,yaw+s*1.15,pitch*.4,M(i%2?col:darker(col)))}
      leafM(g,end.x,end.y,end.z,len*.36,len*.12,yaw,pitch*.5,M(col));break}
    case 'tri':{const d=dirOf(yaw,pitch),q=p.clone().addScaledVector(d,len*.45);stemTo(g,p,q,.004,col);for(const s of [-.9,0,.9])leafM(g,q.x,q.y,q.z,len*.6,len*.24,yaw+s,pitch*.3,M(col));break}
    case 'palm5':{const d=dirOf(yaw,pitch),q=p.clone().addScaledVector(d,len*.5);stemTo(g,p,q,.004,col);for(let i=0;i<5;i++)leafM(g,q.x,q.y,q.z,len*.55,len*.2,yaw+(i-2)*.6,pitch*.2,M(i%2?col:darker(col)));break}
    case 'heart':leafM(g,p.x,p.y,p.z,len,wid*1.4,yaw,pitch,M(col));break;
    default:leafM(g,p.x,p.y,p.z,len,wid,yaw,pitch,M(col));
  }
}
function flowerAt(g,p,f,r){
  const s=(f.s||.03)*1.3,c=f.col;
  switch(f.t){
    case 'star':{const m=mk(g,STAR5,c,p,V(s,s,s));m.material=M(c,{side:THREE.DoubleSide});m.rotation.x=-Math.PI/2+.3;ballM(g,p.x,p.y+.003,p.z,s*.25,M(0xf4f0d0));break}
    case 'bell':{const m=mk(g,BELL,c,V(p.x,p.y-s*.8,p.z),V(s,s,s));m.material=M(c,{side:THREE.DoubleSide});break}
    case 'umbel':for(let i=0;i<9;i++){const a=i*2.4,rr=s*Math.sqrt(i/9);const q=V(p.x+Math.cos(a)*rr,p.y+s*.1,p.z+Math.sin(a)*rr);stemTo(g,V(p.x,p.y-s*.5,p.z),q,.002,0x6a8a4a);ballM(g,q.x,q.y,q.z,s*.22,M(c))}break;
    case 'globe':for(let i=0;i<14;i++){const u=i/14*2-1,a=i*2.4,k=Math.sqrt(1-u*u);ballM(g,p.x+Math.cos(a)*k*s,p.y+s+u*s,p.z+Math.sin(a)*k*s,s*.32,M(c))}break;
    case 'daisy':for(let i=0;i<10;i++)leafM(g,p.x,p.y,p.z,s,s*.3,i*.63,.1,M(c));ballM(g,p.x,p.y+.002,p.z,s*.32,M(0xe7c23a));break;
    case 'thistle':ballM(g,p.x,p.y,p.z,s*.7,M(0x5a7a3a));mk(g,TAPER,c,V(p.x,p.y+s*1.4,p.z),V(s*.75,s*.9,s*.75));break;
    case 'lily':for(let i=0;i<6;i++)leafM(g,p.x,p.y,p.z,s,s*.32,i*1.05,.7,M(c));ballM(g,p.x,p.y,p.z,s*.15,M(0x6a4a20));break;
    case 'spike':for(let i=0;i<9;i++){const a=i*2.1;ballM(g,p.x+Math.cos(a)*s*.5,p.y+i*s*.9,p.z+Math.sin(a)*s*.5,s*.55,M(c))}break;
    case 'plume':for(let i=0;i<5;i++){const a=i*1.26;const m=mk(g,TAPER,c,V(p.x+Math.cos(a)*s*1.6,p.y+s*4,p.z+Math.sin(a)*s*1.6),V(s*.5,s*4,s*.5));m.rotation.x=Math.PI;m.rotation.z=Math.cos(a)*.3}break;
    case 'berries':for(let i=0;i<8;i++){const a=i*2.4;ballM(g,p.x+Math.cos(a)*s*.8,p.y-i*s*.25,p.z+Math.sin(a)*s*.8,s*.55,M(c,{}))}break;
    case 'reflex':for(let i=0;i<6;i++)leafM(g,p.x,p.y-s*.3,p.z,s*1.2,s*.3,i*1.05,1.1,M(c));stemTo(g,V(p.x,p.y-s*.3,p.z),V(p.x,p.y-s*1.1,p.z),.003,0x6a2a4a);break;
  }
}
function bUp(g,m,r){
  const h=m.h,ns=m.stems||1,sw=(m.sw||.004+h*.006)*1.3;
  for(let s=0;s<ns;s++){
    const base=ns>1?V(Math.cos(s*2.4)*.03,0,Math.sin(s*2.4)*.03):V(0,0,0);
    const hh=h*(s?(.75+r()*.25):1),top=V(base.x+(r()-.5)*h*(ns>1?.25:.06),hh,base.z+(r()-.5)*h*(ns>1?.25:.06));
    const mid=V((base.x+top.x)/2+(r()-.5)*h*.05,hh*.5,(base.z+top.z)/2+(r()-.5)*h*.05);
    stemTo(g,base,mid,sw,m.st);stemTo(g,mid,top,sw*.8,m.st);
    const at=t=>t<.5?base.clone().lerp(mid,t*2):mid.clone().lerp(top,(t-.5)*2);
    if(m.knee)for(let k=1;k<5;k++){const q=at(k/5);ballM(g,q.x,q.y,q.z,sw*1.8,M(darker(m.st)))}
    const lv=m.lv;if(lv)for(let i=0;i<lv.n;i++){let t,yaw;
      if(lv.arr==='whorl'){t=lv.at||.6;yaw=i/lv.n*6.283+r()*.3}
      else if(lv.arr==='opp'){const pr=Math.floor(i/2),np=Math.max(1,Math.ceil(lv.n/2)-1);t=lerp(lv.from||.15,lv.to||.85,pr/np);yaw=(i%2)*Math.PI+pr*1.57}
      else{t=lerp(lv.from||.1,lv.to||.85,i/Math.max(1,lv.n-1));yaw=i*2.4+s}
      const L=lv.len*1.45*(lv.taper?(1.25-t*.6):1)*(.85+r()*.3);leafShape(g,at(t),L,(lv.wid?lv.wid*1.45:L*.35),yaw,lv.pitch??.35,i%3?lv.col:darker(lv.col),lv.shape)}
    if(m.whorl&&s===0)for(let k=0;k<m.whorl.n;k++){const q=at(lerp(.45,.95,k/(m.whorl.n-1)));for(let j=0;j<7;j++){const a=j*.9;ballM(g,q.x+Math.cos(a)*.02,q.y,q.z+Math.sin(a)*.02,.009,M(m.whorl.col))}}
    if(m.fl){const n=m.fl.n||1;for(let k=0;k<n;k++){if(k===0){flowerAt(g,top,m.fl,r);continue}const q=at(lerp(.6,.95,k/n));const a=k*2.3,o=V(q.x+Math.cos(a)*.04,q.y,q.z+Math.sin(a)*.04);stemTo(g,q,o,.002,m.st);flowerAt(g,o,m.fl,r)}}
  }
}
function bRos(g,m,r){
  for(let i=0;i<m.n;i++)leafShape(g,V(0,.005,0),m.len*1.3*(.8+r()*.4),m.wid*1.3,i/m.n*6.283+r()*.3,m.pitch??.12,i%2?m.col:darker(m.col),m.shape);
  if(m.stalk)bUp(g,{h:m.stalk.h,st:0x6a8a4a,fl:m.stalk.fl},r);
}
function bBig(g,m,r){
  for(let i=0;i<m.n;i++){const yaw=i/m.n*6.283+r()*.5,lean=.25+r()*.25,h=m.h*(.75+r()*.4);
    const tip=V(Math.sin(yaw)*h*lean,h,Math.cos(yaw)*h*lean);if(h>.06)stemTo(g,V(0,0,0),tip,.005+m.size*.02,0x5f8640);
    const col=i%2?m.col:darker(m.col),sz=m.size*(.85+r()*.3);
    if(m.shape==='round'||m.shape==='heart'||m.shape==='palm'||m.shape==='bat'){
      const geo=m.shape==='palm'?PALM:m.shape==='bat'?TRI:CIRC;const lf=new THREE.Mesh(geo,M(col,{side:THREE.DoubleSide}));
      lf.rotation.order='YXZ';lf.rotation.y=yaw;lf.rotation.x=-Math.PI/2+.45;lf.scale.set(sz,sz*(m.shape==='heart'?.95:1),sz);
      const off=dirOf(yaw,.2).multiplyScalar(m.shape==='bat'?0:sz*.7);lf.position.copy(tip).add(off);g.add(lf);
    }else if(m.shape==='umbrella'){for(let k=0;k<8;k++)leafM(g,tip.x,tip.y,tip.z,sz,sz*.18,k*.785,-.12,M(k%2?col:m.col))}
    else{leafM(g,0,.01,0,sz*1.2,sz*.38,yaw,.55-r()*.2,M(col));
      if(m.mot)for(let k=0;k<3;k++){const q=dirOf(yaw,.45).multiplyScalar(sz*(.4+k*.3));ballM(g,q.x,q.y+.012,q.z,sz*.1,M(0x6a3a3a),1,.15,1)}}
  }
  if(m.stalk)bUp(g,{h:m.stalk.h,st:0x6a8a4a,fl:m.stalk.fl},r);
}
function bFern(g,m,r){for(let i=0;i<m.n;i++){const yaw=r()*6.28,lean=.12+r()*.3,h=m.h*(.7+r()*.5);const tip=V(Math.sin(yaw)*h*lean,h,Math.cos(yaw)*h*lean);
  stemTo(g,V(0,0,0),tip,.006,m.st);const c=mk(g,CURL,m.col,tip,V(.035,.035,.035));c.rotation.set(0,yaw,Math.PI/2);if(m.wool)ballM(g,tip.x,tip.y,tip.z,.04,M(0xb89a6a))}}
function bGrass(g,m,r){for(let i=0;i<m.n;i++){const yaw=r()*6.28,lean=.15+r()*.5,h=m.h*(.6+r()*.5);
  if(m.strap)leafM(g,0,0,0,h*1.2,m.strap,yaw,1.35-lean*.9,M(i%2?m.col:darker(m.col)));
  else{const mid=V(Math.sin(yaw)*h*lean*.35,h*.6,Math.cos(yaw)*h*lean*.35),tip=V(Math.sin(yaw)*h*lean,h*(1-lean*.35),Math.cos(yaw)*h*lean);stemTo(g,V(0,0,0),mid,m.w||.004,m.col);stemTo(g,mid,tip,(m.w||.004)*.7,m.col)}}
  if(m.stalk)bUp(g,{h:m.stalk.h,st:0x5f8640,fl:m.stalk.fl},r)}
function bVine(g,m,r){for(let s=0;s<m.n;s++){let p=V(0,0,0);const yaw=s/m.n*6.28+r()*.5,segs=6;
  for(let k=0;k<segs;k++){const t=(k+1)/segs,rise=Math.sin(t*Math.PI*.85)*m.h*(.75+r()*.35),rad=m.len*t*.5;
    const np=V(Math.sin(yaw+k*.3)*rad,rise,Math.cos(yaw+k*.3)*rad);stemTo(g,p,np,.006,m.st);
    leafShape(g,np,m.leaf.len*1.4,m.leaf.wid*1.4,yaw+k*1.7+r(),.2,k%2?m.leaf.col:darker(m.leaf.col),m.leaf.shape);
    if(m.fl&&(k===segs-2||k===segs-4)&&s%2===0)flowerAt(g,np,m.fl,r);p=np}}}
function bArch(g,m,r){let p=V(0,0,0);const yaw=r()*6.28;for(let i=0;i<m.n;i++){const t=(i+1)/m.n;const np=V(Math.sin(yaw)*m.h*t*.9,m.h*Math.sin(t*Math.PI*.6),Math.cos(yaw)*m.h*t*.9);
  stemTo(g,p,np,.006,m.st);leafM(g,np.x,np.y,np.z,m.len*1.35,m.len*.55,yaw+(i%2?1.2:-1.2),.1,M(i%2?m.col:darker(m.col)));if(i>1)flowerAt(g,V(np.x,np.y-.02,np.z),m.fl,r);p=np}}
function bStalk(g,m,r){stemTo(g,V(0,0,0),V(0,m.h,0),.012,m.st);for(let i=0;i<4;i++)ballM(g,0,m.h*(.15+i*.18),.012,.012,M(darker(m.st)),1,1.6,.6);
  for(let i=0;i<12;i++){const y=m.h*lerp(.55,1,i/12),a=i*2.4;flowerAt(g,V(Math.cos(a)*.022,y,Math.sin(a)*.022),m.fl,r)}}
function bShrub(g,m,r){for(let s=0;s<m.stems;s++){const base=V((r()-.5)*.2*(m.stems>1),0,(r()-.5)*.2*(m.stems>1));const top=V(base.x+(r()-.5)*.25,m.h*(.75+r()*.3),base.z+(r()-.5)*.25);
  stemTo(g,base,top,m.tw,m.bark);
  if(m.thorn)for(let k=0;k<14;k++){const q=base.clone().lerp(top,k/14),a=k*2.1;const th=mk(g,TAPER,0x8a7a6a,V(q.x+Math.cos(a)*m.tw,q.y,q.z+Math.sin(a)*m.tw),V(.006*m.thorn,.03*m.thorn,.006*m.thorn));th.rotation.set(0,0,Math.PI/2);th.rotation.y=-a}
  if(m.tip==='bud'){const b=mk(g,TAPER,0x8aa040,V(top.x,top.y+.12,top.z),V(.035,.14,.035));b.rotation.x=Math.PI;ballM(g,top.x,top.y+.02,top.z,.03,M(0x9a4a3a));for(let k=0;k<3;k++)leafShape(g,top,.35,.1,k*2.1,.15,m.col,'compound')}
  else if(m.tip==='palm'){for(let k=0;k<5;k++){const yaw=k*1.26;const q=top.clone().addScaledVector(dirOf(yaw,.3),.25);stemTo(g,top,q,.006,0x6a8a4a);const lf=new THREE.Mesh(PALM,M(m.col,{side:THREE.DoubleSide}));lf.rotation.order='YXZ';lf.rotation.y=yaw;lf.rotation.x=-Math.PI/2+.4;lf.scale.setScalar(.14);lf.position.copy(q);g.add(lf)}}
  else{for(let k=0;k<4;k++){const q=base.clone().lerp(top,.6+k*.13);leafShape(g,q,.22,.06,k*1.9+s,.25,m.col,'palm5')}}}}
function bSamji(g,m,r){const h=m.h;stemTo(g,V(0,0,0),V(0,h,0),.005,m.st);for(let i=0;i<3;i++){const yaw=i*2.09;const q=V(Math.sin(yaw)*.09,h+.03,Math.cos(yaw)*.09);stemTo(g,V(0,h,0),q,.004,m.st);
  for(let k=0;k<3;k++){const y2=yaw+(k-1)*.75;const lf=new THREE.Mesh(CIRC,M(k%2?m.col:darker(m.col),{side:THREE.DoubleSide}));lf.rotation.order='YXZ';lf.rotation.y=y2;lf.rotation.x=-Math.PI/2+.25;lf.scale.set(.045,.06,.045);lf.position.copy(q).add(dirOf(y2,.1).multiplyScalar(.05));g.add(lf)}}
  flowerAt(g,V(.03,h*.85,0),m.fl,r);flowerAt(g,V(-.02,h*.8,.02),m.fl,r)}
function bScales(g,m,r){for(let i=0;i<m.n;i++){const yaw=i/m.n*6.283;leafShape(g,V(0,.03,0),m.len,m.len*.3,yaw,.9,i%2?m.col:darker(m.col),'compound')}stemTo(g,V(0,0,0),V(0,.04,0),.02,0x3a2a1a)}
function bRoot(g,R,r){
  const c=R.col,gy=R.deep?-.12:-.02;
  switch(R.k){
    case 'tap':{const m=mk(g,TAPER,c,V(0,gy,0),V(R.w,R.len,R.w));m.rotation.z=(r()-.5)*.25;for(let i=0;i<4;i++){const y=gy-R.len*(.3+i*.15),a=i*2.2;stemTo(g,V(0,y,0),V(Math.cos(a)*R.len*.35,y-R.len*.15,Math.sin(a)*R.len*.35),.002,c)}
      if(R.wrinkle)for(let i=1;i<6;i++){const y=gy-R.len*i/7;mk(g,CYL,darker(c),V(0,y,0),V(R.w*(1-i/7)*1.05,.004,R.w*(1-i/7)*1.05))}break}
    case 'fork':{mk(g,CYL,darker(c),V(0,gy-.02,0),V(R.w*.45,.05,R.w*.45));for(let i=0;i<4;i++)mk(g,CYL,darker(c),V(0,gy-.005*i,0),V(R.w*.5,.004,R.w*.5));
      ballM(g,0,gy-R.len*.28,0,R.w,M(c),1,R.len/R.w*.3,1);
      for(const s of [-1,1]){const lg=mk(g,TAPER,c,V(s*R.w*.4,gy-R.len*.45,0),V(R.w*.55,R.len*.6,R.w*.55));lg.rotation.z=s*.45}
      for(let i=0;i<9;i++){const a=i*.7,y=gy-R.len*(.3+r()*.5);stemTo(g,V(0,y,0),V(Math.cos(a)*R.len*.45,y-R.len*.25,Math.sin(a)*R.len*.45),.0012,c)}break}
    case 'tuber':{const m=ballM(g,0,gy-R.w*1.2,0,1,M(c),R.len*.5,R.w,R.w);m.rotation.z=.3;for(let i=-2;i<=2;i++)mk(g,CYL,darker(c),V(i*R.len*.15,gy-R.w*1.2-R.w,0),V(.003,R.w*2,R.w*.9));break}
    case 'bulb':ballM(g,0,gy-R.w,0,R.w,M(c),1,1.15,1);for(let i=0;i<7;i++){const a=i*.9;stemTo(g,V(0,gy-R.w*2,0),V(Math.cos(a)*.04,gy-R.w*2-.05,Math.sin(a)*.04),.0012,0xd8cbb3)}break;
    case 'rhizome':for(let i=0;i<4;i++){ballM(g,-R.len*.4+i*R.len*.27,gy-.03,(r()-.5)*.02,R.w,M(i%2?c:darker(c)),1.3,.9,1);stemTo(g,V(-R.len*.4+i*R.len*.27,gy-.04,0),V(-R.len*.4+i*R.len*.27+(r()-.5)*.04,gy-.1,(r()-.5)*.04),.0015,c)}break;
    case 'fib':for(let i=0;i<9;i++){const a=i*.7;stemTo(g,V(0,gy,0),V(Math.cos(a)*R.len*.4,gy-R.len*(.6+r()*.4),Math.sin(a)*R.len*.4),R.w*.25+.001,c)}break;
    case 'long':mk(g,TAPER,c,V(0,gy,0),V(R.w,R.len,R.w));break;
    case 'big':{const m=mk(g,TAPER,c,V(0,gy,0),V(R.w,R.len,R.w*.9));m.rotation.z=.6;break}
    case 'tubers':for(let i=0;i<8;i++){const a=i*.8,e=V(Math.cos(a)*R.len*.5,gy-R.len*(.5+r()*.5),Math.sin(a)*R.len*.5);stemTo(g,V(0,gy,0),e,.0015,c);if(i%2)ballM(g,e.x,e.y,e.z,R.w,M(c),1,1.6,1)}break;
  }
}
function buildPlantGroup(sp,seed,withRoot){
  const g=new THREE.Group(),r=rngOf(seed),m=sp.m;
  ({up:bUp,ros:bRos,big:bBig,fern:bFern,grass:bGrass,vine:bVine,arch:bArch,stalk:bStalk,shrub:bShrub,samji:bSamji,scales:bScales})[m.k](g,m,r);
  if(withRoot&&sp.root)bRoot(g,sp.root,r);
  return g;
}
const plantMat=new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:0,specular:0x000000,side:THREE.DoubleSide});
function mergeGroup(g){
  g.updateMatrixWorld(true);const pos=[],col=[],v=new THREE.Vector3();
  g.traverse(o=>{if(!o.isMesh)return;let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry;const p=geo.attributes.position,cc=o.material.color;
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);pos.push(v.x,v.y,v.z);col.push(cc.r,cc.g,cc.b)}if(geo!==o.geometry)geo.dispose()});
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('color',new THREE.Float32BufferAttribute(col,3));out.computeVertexNormals();out.computeBoundingSphere();out.userData.keep=true;return out;
}
const plantGeoCache={};
function plantGeo(sp,v){const k=sp.id+v;if(!plantGeoCache[k])plantGeoCache[k]=mergeGroup(buildPlantGroup(sp,h2(v,sp.id.length*977+sp.id.charCodeAt(0))*4294967295>>>0,true));return plantGeoCache[k]}
const HITGEO=keep(new THREE.SphereGeometry(1,6,4)),HITMAT=new THREE.MeshBasicMaterial({visible:false});
function makePlantMesh(sp,v){
  const g=new THREE.Group();const m=new THREE.Mesh(plantGeo(sp,v),plantMat);m.castShadow=true;g.add(m);
  const h=sp.m.h||.4,hr=clamp(h*.45,.22,.6);const hit=new THREE.Mesh(HITGEO,HITMAT);hit.scale.setScalar(hr);hit.position.y=Math.min(h*.45,.6);g.add(hit);
  return g;
}
