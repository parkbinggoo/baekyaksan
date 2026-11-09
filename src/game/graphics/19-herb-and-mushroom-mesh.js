/* ---------- 3D herbs ---------- */
function herb3D(type){
  const g=new THREE.Group();const G1=M(0x4f7d36),G2=M(0x6b9a45),ST=M(0x5d7c3a);
  switch(type){
    case 'sansam':stemM(g,0,0,0,.42,.012,M(0x6f7f3a));for(let i=0;i<3;i++){const a=i*2.1;for(let k=0;k<5;k++)leafM(g,0,.4,0,.14+(k===2?.03:0),.045,a+(k-2)*.38,.25,k%2?G2:G1)}
      for(let i=0;i<7;i++)ballM(g,Math.cos(i)*.025,.47+Math.sin(i*2)*.02,Math.sin(i)*.025,.022,M(0xd8382a,{flatShading:false}));break;
    case 'doraji':{stemM(g,0,0,0,.48,.011,ST);for(let i=0;i<3;i++)for(const s of [0,Math.PI])leafM(g,0,.12+i*.11,0,.12,.035,s+i*.8,.3,G1);
      const shp=new THREE.Shape();for(let i=0;i<10;i++){const rr=i%2?.04:.1,a=i*Math.PI/5;shp[i?'lineTo':'moveTo'](Math.cos(a)*rr,Math.sin(a)*rr)}
      const f=new THREE.Mesh(new THREE.ShapeGeometry(shp),M(0x7b5cc7,{side:THREE.DoubleSide}));f.rotation.x=-1.1;f.position.set(0,.49,.02);g.add(f);ballM(g,0,.49,.02,.018,M(0xefe6ff));
      ballM(g,.07,.42,0,.035,M(0x9a82d6));break}
    case 'deodeok':{for(let i=0;i<6;i++)stemM(g,Math.sin(i*1.4)*.03,i*.07,Math.cos(i*1.4)*.03,.08,.008,M(0x6b8a3c),Math.cos(i)*.4,Math.sin(i)*.4);
      for(let w=0;w<3;w++)for(let k=0;k<4;k++)leafM(g,0,.14+w*.12,0,.09,.035,k*1.57+w,.15,k%2?G2:G1);
      const b=new THREE.Mesh(new THREE.ConeGeometry(.05,.09,8,1,true),M(0xcfdcb8,{side:THREE.DoubleSide}));b.position.set(.08,.3,0);g.add(b);ballM(g,.08,.26,0,.03,M(0x7d5a9a),1,.35,1);break}
    case 'gosari':for(const [x,h,a] of [[-.05,.3,0],[.03,.38,2],[.07,.26,4]]){stemM(g,x,0,0,h,.01,M(0x7c6c35));const t=new THREE.Mesh(new THREE.TorusGeometry(.04,.012,5,10,Math.PI*1.6),M(0x6f8b34));t.position.set(x+.04,h,0);t.rotation.y=a;g.add(t)}break;
    case 'gomchwi':for(const [a,h,m] of [[0,.2,G1],[2.1,.26,M(0x3c6630)],[4.2,.16,G2]]){stemM(g,0,0,0,h,.01,M(0x5f8640),Math.cos(a)*.3,Math.sin(a)*.3);
      const lf=new THREE.Mesh(new THREE.CircleGeometry(.13,10),M(m.color.getHex(),{side:THREE.DoubleSide}));lf.position.set(Math.sin(a)*.08,h,Math.cos(a)*.08);lf.rotation.set(-1.0,a,0);g.add(lf)}break;
    case 'chamchwi':stemM(g,0,0,0,.44,.011,ST);for(let i=0;i<4;i++)leafM(g,0,.06+i*.08,0,.14,.05,i*1.9,.25,i%2?G2:G1);
      for(let i=0;i<6;i++){const a=i*1.05;ballM(g,Math.cos(a)*.05,.46+Math.sin(i*3)*.02,Math.sin(a)*.05,.02,M(0xfdfbf3),1,.4,1);ballM(g,Math.cos(a)*.05,.465,Math.sin(a)*.05,.008,M(0xe7c23a))}break;
    case 'naengi':for(let i=0;i<9;i++)leafM(g,0,.01,0,.14,.04,i*.7,.05,i%2?G1:G2);stemM(g,0,0,0,.24,.006,M(0x6c8a46));for(let i=0;i<5;i++)ballM(g,Math.sin(i)*.012,.2+i*.012,Math.cos(i)*.012,.01,M(0xffffff));break;
    case 'ssuk':for(let i=0;i<8;i++)leafM(g,0,0,0,.2+(i%3)*.05,.04,i*.8,1.0+(i%2)*.2,M(i%2?0x7f9c6c:0x93ae84));break;
    case 'dallae':for(let i=0;i<9;i++){const a=i*.7;stemM(g,0,0,0,.34+(i%3)*.06,.005,M(i%2?0x5f8b38:0x79a44a),Math.cos(a)*.35,Math.sin(a)*.35)}break;
    case 'dunggule':{let x=0,y=0;for(let i=0;i<6;i++){const nx=x+.05,ny=y+(i<3?.09:.02);stemM(g,x,y,0,.1,.009,M(0x5d7c3a),0,-(.3+i*.25));leafM(g,nx,ny,0,.1,.035,1.57+(i%2?.6:-.6),.1,i%2?G2:G1);if(i>1)ballM(g,nx,ny-.05,0,.018,M(0xf2f4df),1,1.6,1);x=nx;y=ny}break}
  }
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});
  return g;
}
function mush3D(type){
  const g=new THREE.Group();
  switch(type){
    case 'pyogo':for(const [y,x,s] of [[0,0,1],[.1,.05,.8]]){ballM(g,x,y,.06,.08*s,M(0x6e4127),1,.45,1);ballM(g,x,y-.02,.06,.075*s,M(0xd6c4a0),1,.12,1)}break;
    case 'neutari':for(const [y,c] of [[-.05,0x8f969a],[.03,0xa3aaad],[.1,0xb7bdbf]])ballM(g,0,y,.07,.1,M(c),1,.18,.8);break;
    case 'mogi':for(const [y,x] of [[0,0],[.08,.05],[-.06,-.04]])ballM(g,x,y,.05,.065,M(0x3a2420),1,.6,.35);break;
    case 'yeongji':ballM(g,0,0,.08,.11,M(0x8a2a17),1.2,.22,1);ballM(g,0,-.01,.08,.12,M(0xe2973a),1.25,.12,1.05);ballM(g,0,.02,.07,.05,M(0xffffff,{transparent:true,opacity:.35}),1.2,.1,.6);break;
    case 'sanghwang':ballM(g,0,0,.07,.12,M(0x5a3a1c),1,.4,.9);ballM(g,0,-.03,.075,.12,M(0xe0b23a),1.03,.15,.95);break;
    case 'songi':stemM(g,0,-.08,0,.30,.045,M(0xe7d8bd));ballM(g,0,.20,0,.14,M(0x845e3b),1,.50,1);ballM(g,0,.16,0,.138,M(0xd5b88d),1,.18,1);break;
    case 'neungi':stemM(g,0,-.07,0,.18,.034,M(0x766555));ballM(g,0,.15,0,.21,M(0x413d39),1,.32,1);ballM(g,0,.16,0,.13,M(0x726c62),1,.24,1);break;
    case 'norugung':for(let i=0;i<5;i++){const a=i*2.399,rr=.08+i*.015;ballM(g,Math.sin(a)*rr,.08+(i%2)*.055,Math.cos(a)*rr,.11,M(i%2?0xd6cdb2:0xf0e8d5),1,.95,.9)}break;
    case 'kkotsongi':for(let i=0;i<10;i++){const a=i*2.399,rad=.06+.015*(i%3),y=.07+(i%4)*.05;const l=ballM(g,Math.sin(a)*rad,y,Math.cos(a)*rad,.074,M(i%2?0xe8d8b0:0xb5a079),1.3,.26,.7);l.rotation.z=Math.sin(a)*.28}break;
    case 'seogi':for(let i=0;i<6;i++){const a=i*Math.PI/3;const l=ballM(g,Math.cos(a)*.095,.0,Math.sin(a)*.095,.09,M(i%2?0x3f3c35:0x59554a),1.0,.16,.8);l.rotation.z=.2*Math.sin(a)}break;
    case 'ipsae':for(let i=0;i<8;i++){const a=i*2.399,y=.04+(i%4)*.055,radius=.045+(i%3)*.035;ballM(g,Math.cos(a)*radius,y,Math.sin(a)*radius,.12,M(i%2?0x917a59:0x71654b),1.1,.18,.7)}break;
  }
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g;
}
