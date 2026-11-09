/* ---------- shared geometries ---------- */
const LEAF=keep(new THREE.SphereGeometry(1,6,4));LEAF.translate(0,0,1);
const BALL=keep(new THREE.SphereGeometry(1,8,6));
const CYL=keep(new THREE.CylinderGeometry(1,1,1,6));CYL.translate(0,.5,0);
const pineTrunk=keep(new THREE.CylinderGeometry(.16,.42,12,7));pineTrunk.translate(0,6,0);
const pineC=[[2.7,3.4,9.0],[2.3,3.0,11.0],[1.8,2.6,12.9],[1.25,2.2,14.6],[.65,1.6,16.1]].map(([r,h,y])=>{const g=keep(new THREE.ConeGeometry(r,h,8));g.translate(0,y,0);return g});
const oakTrunk=keep(new THREE.CylinderGeometry(.2,.46,9.5,7));oakTrunk.translate(0,4.75,0);
const oakF1=keep(new THREE.IcosahedronGeometry(3.3,0));oakF1.translate(0,10.4,0);
const oakF2=keep(new THREE.IcosahedronGeometry(2.4,0));oakF2.translate(1.7,12.2,.7);
const oakF3=keep(new THREE.IcosahedronGeometry(2.1,0));oakF3.translate(-1.6,11.5,-.9);
const STONE=keep(new THREE.DodecahedronGeometry(1,0));const ROCK2=keep(new THREE.IcosahedronGeometry(1,1));{const p=ROCK2.attributes.position;for(let i=0;i<p.count;i++){const f=1+(h2(Math.round(p.getX(i)*50),Math.round(p.getZ(i)*50+p.getY(i)*30))-.5)*.35;p.setXYZ(i,p.getX(i)*f,p.getY(i)*f,p.getZ(i)*f)}ROCK2.computeVertexNormals()}
const BUSH=keep(new THREE.IcosahedronGeometry(1,0));
function leafM(parent,x,y,z,len,wid,yaw,pitch,mat){const m=new THREE.Mesh(LEAF,mat);m.position.set(x,y,z);m.rotation.order='YXZ';m.rotation.y=yaw;m.rotation.x=-pitch;m.scale.set(wid,.012,len/2);parent.add(m);return m}
function stemM(parent,x,y,z,h,r,mat,rx=0,rz=0){const m=new THREE.Mesh(CYL,mat);m.position.set(x,y,z);m.scale.set(r,h,r);m.rotation.set(rx,0,rz);parent.add(m);return m}
function ballM(parent,x,y,z,r,mat,sx=1,sy=1,sz=1){const m=new THREE.Mesh(BALL,mat);m.position.set(x,y,z);m.scale.set(r*sx,r*sy,r*sz);parent.add(m);return m}
