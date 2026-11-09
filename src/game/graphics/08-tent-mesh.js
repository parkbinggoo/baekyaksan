function tent3D(styleIdx=0){
  const g=new THREE.Group();
  const palettes=[
    {cloth:0xd6a33b,door:0xe9c991,trim:0x2c2b28,pole:0x4c4742,rope:0x74624c,glow:0xffb15e},
    {cloth:0xbe743b,door:0xe6c9aa,trim:0x292b29,pole:0x504944,rope:0x76614c,glow:0xffb66a},
    {cloth:0x8f9b64,door:0xcfd0b0,trim:0x2d302c,pole:0x4b4d45,rope:0x7e7655,glow:0xffb77b},
    {cloth:0x688787,door:0xb7cbcb,trim:0x292d31,pole:0x49535b,rope:0x646b61,glow:0xffb36c},
    {cloth:0x8b718a,door:0xd1bdcf,trim:0x29282c,pole:0x53505b,rope:0x777079,glow:0xffb37c}
  ];
  const pal=palettes[((styleIdx%palettes.length)+palettes.length)%palettes.length];
  const mat=(c,em=false)=>new THREE.MeshPhongMaterial({color:c,flatShading:true,shininess:0,specular:0x000000,side:THREE.DoubleSide,emissive:em?pal.glow:0x000000,emissiveIntensity:0});
  const shellMat=mat(pal.cloth,true),frontMat=mat(pal.cloth),rearMat=mat(pal.cloth),doorMat=mat(pal.door,true),trimMat=mat(pal.trim),poleMat=mat(pal.pole),ropeMat=mat(pal.rope);
  const add=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
  const xAt=t=>1.72*Math.cos(t), yAt=t=>.14+2.06*Math.sin(t);
  const strips=10,z0=-2.13,z1=2.13;
  const roofPoints=[];
  for(let i=0;i<strips;i++){
    const a=i*Math.PI/strips,b=(i+1)*Math.PI/strips;
    const A=[xAt(a),yAt(a),z0],B=[xAt(b),yAt(b),z0],C=[xAt(a),yAt(a),z1],D=[xAt(b),yAt(b),z1];
    roofPoints.push(...A,...B,...C,...C,...B,...D);
  }
  const roofGeo=new THREE.BufferGeometry();roofGeo.setAttribute('position',new THREE.Float32BufferAttribute(roofPoints,3));roofGeo.computeVertexNormals();add(roofGeo,shellMat);
  function face(z,m){const pts=[];for(let i=0;i<strips;i++){const a=i*Math.PI/strips,b=(i+1)*Math.PI/strips;
    pts.push(0,.14,z,xAt(a),yAt(a),z,xAt(b),yAt(b),z);
  }const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));geo.computeVertexNormals();add(geo,m)}
  face(z0,rearMat);face(z1,frontMat);
  add(new THREE.BoxGeometry(3.52,.19,4.32),trimMat,0,.095,0);
  const doorShape=new THREE.Shape();doorShape.moveTo(-1.1,.18);doorShape.lineTo(-1.1,.89);
  doorShape.bezierCurveTo(-1.10,1.55,-.78,1.83,0,1.83);
  doorShape.bezierCurveTo(.78,1.83,1.10,1.55,1.1,.89);
  doorShape.lineTo(1.1,.18);doorShape.closePath();
  add(new THREE.ShapeGeometry(doorShape,10),doorMat,0,0,z1+.028);
  const rimPoints=[];for(let i=0;i<=12;i++){const a=i/12*Math.PI;rimPoints.push(new THREE.Vector3(-1.1*Math.cos(a),.89+.94*Math.sin(a),z1+.042))}
  const rim=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.1,.18,z1+.045),...rimPoints,new THREE.Vector3(1.1,.18,z1+.045)]);
  add(new THREE.TubeGeometry(rim,18,.031,4,false),poleMat);
  const poleCurve=z=>new THREE.CatmullRomCurve3(Array.from({length:13},(_,i)=>{const a=i/12*Math.PI;return new THREE.Vector3(xAt(a),yAt(a)+.042,z)}));
  for(const z of [z0+.08,z1-.08])add(new THREE.TubeGeometry(poleCurve(z),22,.025,4,false),poleMat);
  const poleDiagonalA=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.62,.4,-1.97),new THREE.Vector3(-.8,1.84,-.95),new THREE.Vector3(0,2.25,0),new THREE.Vector3(.8,1.84,.95),new THREE.Vector3(1.62,.4,1.97)]);
  add(new THREE.TubeGeometry(poleDiagonalA,24,.018,4,false),poleMat);
  for(const side of [-1,1])for(const z of [-1.86,1.86]){
    const a=new THREE.Vector3(side*1.46,.58,z),b=new THREE.Vector3(side*2.44,.08,z+(z>0?.55:-.55));
    const d=b.clone().sub(a),m=add(new THREE.CylinderGeometry(.009,.009,d.length(),4),ropeMat,...a.clone().add(b).multiplyScalar(.5).toArray());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
    add(new THREE.CylinderGeometry(.03,.03,.17,4),trimMat,b.x,.09,b.z);
  }
  add(new THREE.IcosahedronGeometry(.10,0),trimMat,1.5,.91,.65).scale.set(1,.8,.3);
  const light=new THREE.PointLight(pal.glow,0,7,2);light.position.set(0,1.18,.9);g.add(light);
  const hit=new THREE.Mesh(new THREE.BoxGeometry(3.7,2.35,4.55),new THREE.MeshBasicMaterial({visible:false}));
  hit.position.y=1.12;hit.userData.tent=true;g.add(hit);
  g.userData.setGlow=(night,near)=>{
    shellMat.emissiveIntensity=night ? .08 : 0;doorMat.emissiveIntensity=night ? .56 : 0;
    light.intensity=(night&&near) ? .37 : 0;
  };
  return {group:g,hit,palette:pal};
}

