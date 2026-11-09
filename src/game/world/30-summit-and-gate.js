/* ---------- 백약산 해발 2,500m 정상 ---------- */
const SUMMIT_X=pathX(SUMMIT_Z);
function taegeukgiTexture(){
  return canvasTex(480,320,(g,w,h)=>{
    g.fillStyle='#fff';g.fillRect(0,0,w,h);
    const cx=w/2,cy=h/2,R=74;
    g.fillStyle='#cd2e3a';g.beginPath();g.arc(cx,cy,R,Math.PI,2*Math.PI);g.lineTo(cx+R,cy);g.closePath();g.fill();
    g.fillStyle='#0047a0';g.beginPath();g.arc(cx,cy,R,0,Math.PI);g.lineTo(cx-R,cy);g.closePath();g.fill();
    g.fillStyle='#cd2e3a';g.beginPath();g.arc(cx-R/2,cy,R/2,0,2*Math.PI);g.fill();
    g.fillStyle='#0047a0';g.beginPath();g.arc(cx+R/2,cy,R/2,0,2*Math.PI);g.fill();
    const trigram=(x,y,angle,solid)=>{
      g.save();g.translate(x,y);g.rotate(angle);g.fillStyle='#121316';
      for(let i=0;i<3;i++){
        const yy=(i-1)*18;
        if(solid[i])g.fillRect(-46,yy-5,92,10);
        else{g.fillRect(-46,yy-5,40,10);g.fillRect(6,yy-5,40,10)}
      }g.restore();
    };
    trigram(100,76,-.60,[1,1,1]); // 건
    trigram(382,248,-.60,[0,0,0]); // 곤
    trigram(383,76,.60,[0,1,0]); // 감
    trigram(100,247,.60,[1,0,1]); // 리
  });
}
const summitGroup=new THREE.Group();
function createSummit(){
  const grey=M(0x99998e),dark=M(0x74766f),post=M(0x60655a);
  const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(1,0),grey);rock.scale.set(1.05,1.62,.57);rock.position.set(-1.75,1.65,-.5);rock.rotation.y=.08;rock.castShadow=true;summitGroup.add(rock);
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.7,.25,1.25),dark);base.position.set(-1.75,.13,-.5);base.receiveShadow=true;summitGroup.add(base);
  const txt=canvasTex(512,220,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#313a33';g.font='bold 135px "Nanum Myeongjo",serif';g.textAlign='center';g.textBaseline='middle';g.fillText('백약산',w/2,h/2+2);});
  const namePlate=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.8),new THREE.MeshBasicMaterial({map:txt,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  namePlate.position.set(-1.75,1.8,.035);summitGroup.add(namePlate);
  const heightPlate=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.29),new THREE.MeshBasicMaterial({map:canvasTex(256,65,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#323c35';g.font='bold 42px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('2,500m',w/2,h/2+3)}),transparent:true,side:THREE.DoubleSide}));
  heightPlate.position.set(-1.75,1.12,.057);summitGroup.add(heightPlate);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,4.55,8),post);pole.position.set(1.65,2.27,-.55);pole.castShadow=true;summitGroup.add(pole);
  const finial=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,0),M(0xbd9d5e));finial.position.set(1.65,4.58,-.55);summitGroup.add(finial);
  const cloth=new THREE.Mesh(new THREE.PlaneGeometry(1.48,1.04,6,3),new THREE.MeshPhongMaterial({map:taegeukgiTexture(),side:THREE.DoubleSide,flatShading:true,shininess:0}));
  cloth.position.set(2.44,3.7,-.55);summitGroup.add(cloth);
  const verts=cloth.geometry.attributes.position;
  for(let i=0;i<verts.count;i++){
    const px=verts.getX(i),py=verts.getY(i);
    verts.setZ(i,Math.sin(px*5+py*3)*.075*(px+.74)/1.48);
  }cloth.geometry.computeVertexNormals();
  const p=new THREE.Vector3(SUMMIT_X,H(SUMMIT_X,SUMMIT_Z+12),SUMMIT_Z+12);
  summitGroup.position.copy(p);scene.add(summitGroup);
}
// Summit scenery is created after entering; never prevent the login UI from initialising.
let summitCreated=false;
function ensureSummit(){if(summitCreated)return;createSummit();summitCreated=true;}

/* start gate (일주문) */
function buildGate(){
  const g=new THREE.Group(),z=18,x0=pathX(z),y0=H(x0,z);g.position.set(x0,y0,z);
  const red=M(0x8a2f22),green=M(0x2f4a40),stone=M(0x8b8778);
  for(const sx of [-2.4,2.4]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.22,.24,4.2,10),red);p.position.set(sx,2.1,0);p.castShadow=true;g.add(p);const b=new THREE.Mesh(new THREE.CylinderGeometry(.38,.42,.4,8),stone);b.position.set(sx,.2,0);g.add(b)}
  const beam=new THREE.Mesh(new THREE.BoxGeometry(5.6,.35,.4),M(0x4f7a6a));beam.position.y=4.1;g.add(beam);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(6.8,.25,2.2),green);roof.position.y=4.75;roof.castShadow=true;g.add(roof);
  const ridge=new THREE.Mesh(new THREE.BoxGeometry(6.2,.35,.35),M(0x24352f));ridge.position.y=5.25;g.add(ridge);
  for(const s of [-1,1]){const r1=new THREE.Mesh(new THREE.BoxGeometry(6.6,.12,1.3),green);r1.position.set(0,4.95,s*.55);r1.rotation.x=s*.45;g.add(r1);const tip=new THREE.Mesh(new THREE.BoxGeometry(.6,.15,.25),green);tip.position.set(s*3.5,4.95,0);tip.rotation.z=s*.35;g.add(tip)}
  const plq=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.6),new THREE.MeshLambertMaterial({map:textTex('百藥山',256,96,'#2b3a33','#e9cf8a','bold 56px "Nanum Myeongjo",serif')}));plq.position.set(0,4.1,.22);g.add(plq);
  const plq2=plq.clone();plq2.position.z=-.22;plq2.rotation.y=Math.PI;g.add(plq2);
  scene.add(g);
}
