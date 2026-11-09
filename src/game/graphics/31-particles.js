/* ---------- particles ---------- */
const MAXP=500,pPos=new Float32Array(MAXP*3),pCol=new Float32Array(MAXP*3),parts=[];
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const pts=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.09,vertexColors:true}));pts.frustumCulled=false;scene.add(pts);
const sparks=[];
function dirt(p,n=14,cols=[0x6b4f32,0x8a6a44,0x4e3a26]){for(let i=0;i<n;i++){if(parts.length>=MAXP)parts.shift();const c=new THREE.Color(cols[i%cols.length]);parts.push({x:p.x,y:p.y+.1,z:p.z,vx:(Math.random()-.5)*2.4,vy:1.5+Math.random()*2.2,vz:(Math.random()-.5)*2.4,t:0,life:.9,c})}}
function burst(p,n,gold){for(let i=0;i<n;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:sparkTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:gold?0xffd36a:0xfff6c8}));sp.position.copy(p);const a=Math.random()*6.28,u=Math.random();sp.userData={v:new THREE.Vector3(Math.cos(a)*(1+u*2),1.5+Math.random()*2.5,Math.sin(a)*(1+u*2)),t:0,life:1+Math.random()*.6,s:.25+Math.random()*.25};scene.add(sp);sparks.push(sp)}}
function hearts(p){for(let i=0;i<5;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:heartTex,transparent:true,depthWrite:false}));sp.position.set(p.x+(Math.random()-.5)*.6,p.y,p.z+(Math.random()-.5)*.6);sp.userData={v:new THREE.Vector3((Math.random()-.5)*.4,1+Math.random()*.6,(Math.random()-.5)*.4),t:0,life:1.6,s:.32,heart:true};scene.add(sp);sparks.push(sp)}}
function updParticles(dt){
  let n=0;for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.t+=dt;p.vy-=9*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.t>p.life){parts.splice(i,1);continue}}
  for(const p of parts){pPos[n*3]=p.x;pPos[n*3+1]=p.y;pPos[n*3+2]=p.z;pCol[n*3]=p.c.r;pCol[n*3+1]=p.c.g;pCol[n*3+2]=p.c.b;n++}
  pGeo.setDrawRange(0,n);pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i],u=s.userData;u.t+=dt;if(!u.heart)u.v.y-=2.5*dt;s.position.addScaledVector(u.v,dt);const k=u.t/u.life;s.material.opacity=1-k;s.scale.setScalar(u.s*(u.heart?1:1-k*.5));if(u.t>u.life){scene.remove(s);s.material.dispose();sparks.splice(i,1)}}
}
