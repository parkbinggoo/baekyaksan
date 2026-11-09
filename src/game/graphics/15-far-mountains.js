/* ---------- mountains (shared by intro + far scenery) ---------- */
function makeMountain(radius,height,seed,col,snowCol,opts={}){
  const seg=opts.seg||14, hs=opts.hs||8;
  const geo=new THREE.ConeGeometry(radius,height,seg,hs,true);
  geo.translate(0,height/2,0);
  const pos=geo.attributes.position, r=rngOf(seed), cols=new Float32Array(pos.count*3);
  const cA=new THREE.Color(col), cS=new THREE.Color(snowCol||0xf4f4ef), cB=new THREE.Color(col).multiplyScalar(.75);
  for(let i=0;i<pos.count;i++){
    let x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
    const k=y/height; const ang=Math.atan2(z,x);
    if(k<.999){const n=1+.18*Math.sin(ang*3+seed)+.12*Math.sin(ang*7+seed*2)+.08*(r()-.5);const rr=Math.sqrt(x*x+z*z)*n;x=Math.cos(ang)*rr;z=Math.sin(ang)*rr;y+=(r()-.5)*height*.04*(1-k)}
    pos.setXYZ(i,x,y,z);
    const c=cB.clone().lerp(cA,k); if(snowCol&&k>(opts.snowLine||.78)) c.lerp(cS,clamp((k-(opts.snowLine||.78))*6,0,1));
    cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(cols,3));geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:0,specular:0x000000,fog:opts.fog!==false}));
  return m;
}
