/* ---------- hiker avatar ---------- */
function makeHiker(jacket){
  const T=(c,o)=>{const k='toon'+c+(o?JSON.stringify(o):'');if(!matCache[k])matCache[k]=new THREE.MeshToonMaterial(Object.assign({color:c},o||{}));return matCache[k]};
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const jk=T(jacket),navy=T(0x1f2a5c),pants=T(0x3a3d42),pantsD=T(0x2a2c30),boot=T(0x6e6253),sole=T(0x2b2622),lace=T(0xe07a2a),
        skin=T(0xd59a72),hair=T(0x1c1a19),hat=T(0x3b3d40),pink=T(0xe0447f),glove=T(0xf1efe8),red=T(0xd8342c),
        pack=T(0x9ccf2a),packD=T(0x86b521),grey=T(0x8b9096),greyD=T(0x5d6268),black=T(0x232528),wood=T(0xa47a4a);
  const mk=(geo,mat,parent,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m};
  const box=(w,h,d,mat,parent,x,y,z)=>mk(new THREE.BoxGeometry(w,h,d),mat,parent,x,y,z);
  const legL=new THREE.Group(),legR=new THREE.Group();legL.position.set(-.1,.9,0);legR.position.set(.1,.9,0);
  for(const [lg,s] of [[legL,-1],[legR,1]]){
    mk(new THREE.CylinderGeometry(.085,.07,.8,8),pants,lg,0,-.4,0);
    box(.13,.2,.03,pantsD,lg,0,-.5,.07);                                  // knee panel
    box(.04,.16,.12,pantsD,lg,s*.085,-.22,.0);                             // cargo pocket
    box(.13,.1,.27,boot,lg,0,-.82,.04);box(.14,.035,.29,sole,lg,0,-.885,.045);
    for(let i=0;i<3;i++)box(.07,.008,.01,lace,lg,0,-.8+i*.025,.175-i*.015);
    body.add(lg)}
  const torso=new THREE.Group();torso.position.y=.9;body.add(torso);
  mk(new THREE.CylinderGeometry(.215,.235,.62,12),jk,torso,0,.33,0);
  mk(new THREE.CylinderGeometry(.226,.226,.15,12),navy,torso,0,.57,0);          // navy yoke
  mk(new THREE.CylinderGeometry(.24,.24,.06,12),navy,torso,0,.04,0);            // hem band
  for(const s of [-1,1])box(.05,.4,.2,navy,torso,s*.2,.28,0);                    // side panels
  box(.012,.5,.01,black,torso,.02,.32,.232);                                     // main zipper
  box(.09,.012,.01,black,torso,.1,.46,.225);box(.012,.04,.012,lace,torso,.06,.44,.23); // chest pocket + orange pull
  for(const s of [-1,1]){const zp=box(.01,.16,.01,greyD,torso,s*.12,.17,.215);zp.rotation.z=s*.25}  // hand-warmer zips
  mk(new THREE.CylinderGeometry(.085,.1,.1,10),navy,torso,0,.66,0);              // collar stand
  const sc=mk(new THREE.TorusGeometry(.1,.04,8,16),pink,torso,0,.66,.01);sc.rotation.x=Math.PI/2;
  for(const [x,len,rz] of [[-.035,.3,.06],[.05,.24,-.1]]){const e=box(.07,len,.025,pink,torso,x,.62-len/2,.235);e.rotation.z=rz;for(let f=0;f<4;f++)box(.008,.05,.008,pink,torso,x-.025+f*.017+rz*.1,.6-len-.02,.24)}
  const head=new THREE.Group();head.position.y=.86;torso.add(head);
  mk(new THREE.CylinderGeometry(.055,.06,.1,8),skin,torso,0,.72,0);             // neck
  mk(new THREE.SphereGeometry(.125,16,14),skin,head,0,0,0).scale.set(1,1.12,1.02);
  const hr=mk(new THREE.SphereGeometry(.128,16,12,0,Math.PI*2,0,Math.PI*.5),hair,head,0,.02,-.008);hr.scale.set(1,1.05,1.03);
  mk(new THREE.SphereGeometry(.126,14,10,Math.PI,Math.PI,Math.PI*.3,Math.PI*.42),hair,head,0,-.005,-.006);   // back of head hair
  for(const s of [-1,1]){mk(new THREE.SphereGeometry(.03,8,6),skin,head,s*.125,-.01,0).scale.set(.5,1,.8);   // ears
    mk(new THREE.SphereGeometry(.014,6,5),black,head,s*.045,.01,.118);box(.045,.01,.01,hair,head,s*.047,.04,.118)} // eyes, brows
  mk(new THREE.ConeGeometry(.018,.04,5),skin,head,0,-.02,.13).rotation.x=Math.PI/2;
  const mouth=mk(new THREE.TorusGeometry(.025,.006,4,8,Math.PI),T(0x7a3a2a),head,0,-.065,.115);mouth.rotation.z=Math.PI;
  const hatG=new THREE.Group();hatG.position.y=.09;head.add(hatG);
  mk(new THREE.CylinderGeometry(.12,.138,.11,16),hat,hatG,0,.04,0);
  mk(new THREE.CylinderGeometry(.122,.122,.012,16),hat,hatG,0,.1,0);
  const band=mk(new THREE.CylinderGeometry(.14,.14,.035,16,1,true),new THREE.MeshToonMaterial({map:zigTex,side:THREE.DoubleSide}),hatG,0,0,0);
  mk(new THREE.CylinderGeometry(.14,.255,.06,20,1,true),T(0x34363a,{side:THREE.DoubleSide}),hatG,0,-.035,0);       // drooping brim
  const strap=mk(new THREE.TorusGeometry(.118,.005,4,16,Math.PI),black,head,0,-.01,.035);strap.rotation.set(-.35,0,Math.PI);strap.scale.set(1.02,1.2,1);
  const bp=new THREE.Group();bp.position.set(0,.36,-.34);bp.rotation.x=.06;torso.add(bp);
  box(.36,.56,.22,pack,bp,0,0,0);
  for(const s of [-1,1]){box(.04,.56,.2,grey,bp,s*.175,0,0);box(.05,.12,.035,greyD,bp,s*.1,-.05,-.12)}
  box(.26,.3,.04,packD,bp,0,-.04,-.125);box(.28,.02,.045,grey,bp,0,.115,-.128);box(.02,.3,.045,grey,bp,-.13,-.04,-.128);box(.02,.3,.045,grey,bp,.13,-.04,-.128);
  box(.015,.26,.05,black,bp,0,-.04,-.135);                                        // front zip
  const logo=mk(new THREE.ConeGeometry(.03,.035,3),T(0xf2f2ee),bp,0,.17,-.115);logo.rotation.x=-Math.PI/2;logo.scale.set(1,.2,1); // simple mountain mark
  box(.34,.09,.24,pack,bp,0,.31,-.01);box(.35,.02,.25,grey,bp,0,.27,-.01);       // top lid
  box(.34,.05,.2,black,bp,0,-.29,0);                                              // bottom
  for(const s of [-1,1]){const mesh=box(.05,.2,.16,T(0x4a4f55,{transparent:true,opacity:.85}),bp,s*.205,-.15,.0);
    for(const y of [.12,-.02])box(.05,.016,.23,greyD,bp,s*.18,y,0)}               // side mesh pockets, compression straps
  box(.2,.06,.03,grey,bp,0,.36,.08);                                              // haul loop
  // Optional stage-3 auxiliary lantern: a tiny framed glass lamp fixed to the pack's rear.
  const backLantern=new THREE.Group();backLantern.position.set(0,-.08,-.235);bp.add(backLantern);
  mk(new THREE.CylinderGeometry(.065,.078,.14,10),greyD,backLantern,0,0,-.012);
  mk(new THREE.CylinderGeometry(.049,.049,.085,10),T(0xf1cb80,{emissive:0xe7a84d,emissiveIntensity:.8}),backLantern,0,0,-.065);
  mk(new THREE.CylinderGeometry(.068,.068,.025,10),black,backLantern,0,.082,-.018);
  mk(new THREE.TorusGeometry(.046,.009,5,10,Math.PI),grey,backLantern,0,.101,-.014).rotation.z=Math.PI/2;
  const rearLight=new THREE.PointLight(0xffdd94,0,8.5,1.5);rearLight.position.set(0,-.015,-.18);rearLight.castShadow=false;backLantern.add(rearLight);
  backLantern.visible=false;
  for(const s of [-1,1]){const st=box(.06,.5,.03,grey,torso,s*.12,.45,.2);st.rotation.x=-.12;const st2=box(.06,.16,.08,grey,torso,s*.12,.65,.08)}  // shoulder straps
  box(.44,.05,.05,greyD,torso,0,.1,-.24);                                         // hip belt
  const greens=new THREE.Group();greens.position.set(.2,-.06,0);bp.add(greens);   // herbs poke out of the side pocket
  const mkArm=(sx)=>{const a=new THREE.Group();a.position.set(sx*.29,.58,0);
    mk(new THREE.SphereGeometry(.07,10,8),navy,a,0,0,0);mk(new THREE.CylinderGeometry(.064,.056,.3,8),jk,a,0,-.15,0);mk(new THREE.CylinderGeometry(.056,.05,.27,8),navy,a,0,-.4,0);mk(new THREE.CylinderGeometry(.052,.052,.04,8),black,a,0,-.53,0);
    mk(new THREE.SphereGeometry(.055,10,8),glove,a,0,-.6,0).scale.set(1,1.15,1);
    const palm=mk(new THREE.SphereGeometry(.056,10,8,0,Math.PI*2,0,Math.PI*.5),red,a,0,-.6,.01);palm.rotation.x=Math.PI/2+.3;palm.scale.set(1,1.1,.9);
    torso.add(a);return a};
  const armL=mkArm(-1),armR=mkArm(1);
  const stick=new THREE.Group();stick.position.set(0,-.6,.05);armL.add(stick);
  mk(new THREE.CylinderGeometry(.018,.014,1.15,6),wood,stick,0,-.35,0);
  mk(new THREE.CylinderGeometry(.022,.022,.05,6),black,stick,0,-.94,0);
  const crook=mk(new THREE.TorusGeometry(.05,.016,6,10,Math.PI),T(0x6a6560),stick,.05,.22,0);
  const hoe=new THREE.Group();hoe.position.set(0,-.6,.02);armR.add(hoe);
  const handle=mk(new THREE.CylinderGeometry(.022,.026,.3,8),wood,hoe,0,0,.1);handle.rotation.x=Math.PI/2;
  mk(new THREE.CylinderGeometry(.01,.01,.09,5),T(0x5a5a5a),hoe,0,-.02,.27).rotation.x=.5;
  const blade=mk(new THREE.ConeGeometry(.075,.15,3),T(0x9aa0a6),hoe,0,-.08,.3);blade.rotation.x=Math.PI;blade.scale.z=.3;
  return {root,body,legL,legR,torso,head,armL,armR,stick,hoe,greens,mouth,backLantern,rearLight,phase:0,mode:'idle',t:0,nGreens:-1};
}
function setGreens(h,n){n=Math.min(6,n);if(h.nGreens===n)return;h.nGreens=n;while(h.greens.children.length)h.greens.remove(h.greens.children[0]);
  for(let i=0;i<n;i++){leafM(h.greens,0,0,(i-2.5)*.025,.2,.05,i*.5,1.3,M(i%2?0x5a8a3a:0x6fa046))}}
const DIG_T=.55;
function poseHiker(h,dt,speed){
  h.t+=dt;let lL=0,lR=0,aL=.08,aR=.08,aLz=.12,aRz=-.12,by=0,lean=0,hd=0;
  // The walking stick and hoe do not overlap the temporary cooking utensils.
  if(h.stick)h.stick.visible=h.mode!=='cook'&&h.mode!=='bow';if(h.hoe)h.hoe.visible=h.mode!=='cook'&&h.mode!=='bow';
  if(h.mode==='walk'){h.phase+=dt*(2.6+speed*1.6);const s=Math.sin(h.phase);lL=s*.6;lR=-s*.6;aL=-s*.45;aR=s*.45;by=Math.abs(Math.cos(h.phase))*.035;lean=.1;h.torso.rotation.z=Math.sin(h.phase)*.03}
  else if(h.mode==='dig'){const k=h.t/DIG_T;aR=k<.5?lerp(.1,-2.7,ease(k/.5)):k<.7?lerp(-2.7,-.55,(k-.5)/.2):-.55;aL=k<.5?lerp(0,-1.2,k*2):-.4;lean=k>.5?.45:.1;lL=.3;lR=-.2;hd=.2}
  else if(h.mode==='joy'||h.mode==='joyspin'){const k=h.t;by=Math.abs(Math.sin(k*7))*.42*Math.max(0,1-k/2.2);aL=-2.85+Math.sin(k*16)*.15;aR=-2.85-Math.sin(k*16)*.15;aLz=-.45;aRz=.45;lL=-.5*Math.abs(Math.sin(k*7));lR=lL;lean=-.12;hd=-.25}
  else if(h.mode==='climb'){const st=(climbing?.steps||0),w=Math.sin(clock*5+st*1.6);lL=-.55+w*.4;lR=-.55-w*.4;aL=-2.35-w*.4;aR=-2.35+w*.4;lean=.38;by=.06;}
  else if(h.mode==='cook'){
    const k=h.cookTime||h.t||0,stage=h.cookStage??cookStageAt(k);
    lL=.08;lR=-.08;lean=.13;
    if(stage===0){ // reach into the pack and take out the pan
      aL=-.68-Math.sin(k*1.2)*.45;aR=-1.1-Math.sin(k*1.4)*.25;aLz=.38;hd=-.12;
    }else if(stage===1){ // reach forward and gently set the small pan onto the flame
      aL=-1.15;aR=-1.55;aLz=.1;aRz=-.1;lean=.32;hd=.20;
    }else if(stage===2){ // left palm holds handle; right palm drops each ingredient
      aL=-.76;aR=-1.35-Math.abs(Math.sin(k*2.5))*.65;aRz=-.23;lean=.26;hd=.16;
    }else if(stage===3){ // right hand tilts the shaker above the pan
      aL=-.76;aR=-1.9+Math.sin(k*16)*.20;aRz=-.32;lean=.25;hd=.12;
    }else if(stage===4){ // pan follows left hand when tossing over the flames
      aL=-.83+Math.sin(k*5.4)*.18;aR=-1.30+Math.sin(k*5.4+.5)*.28;
      aLz=.15;aRz=-.2;lean=.23+Math.sin(k*5.4)*.09;hd=.15;
    }else if(stage===5){aL=-1.1;aR=-1.0;lean=.10;hd=.15}
    else if(stage===6){aL=-.32;aR=-.8-Math.sin(k*2)*.35;aRz=-.26;hd=-.10}
    else{ // lift fork to mouth for repeated bites
      const bite=.5-.5*Math.cos((k-COOK_TIMES.fork)*Math.PI*1.75);
      aL=-.30;aR=-1.48-bite*1.08;aRz=-.38;hd=-.10-bite*.08;lean=.05;
    }
  }
  else if(h.mode==='bow'){
    const t=Math.min(1,h.t/2.5),down=clamp((t-.18)/.25,0,1),up=clamp((t-.72)/.23,0,1),bend=down*(1-up);
    aL=-.65-.9*bend;aR=-.65-.9*bend;lL=.15+bend*.65;lR=-.15+bend*.65;
    lean=.16+bend*.95;by=-bend*.28;hd=.15+bend*.42;
  }
  else if(h.mode==='sit'){lL=-1.28;lR=-1.28;aL=-.36;aR=-.36;aLz=.10;aRz=-.10;by=-.36;lean=.08;hd=-.06}
  else if(h.mode==='faint'){lL=.13;lR=-.18;aL=-.25;aR=-.35;aLz=.9;aRz=-.9;lean=0;hd=-.12;by=0}
  const f=1-Math.exp(-dt*(h.mode==='dig'?40:14));
  h.legL.rotation.x=lerp(h.legL.rotation.x,lL,f);h.legR.rotation.x=lerp(h.legR.rotation.x,lR,f);
  h.armL.rotation.x=lerp(h.armL.rotation.x,aL,f);h.armR.rotation.x=lerp(h.armR.rotation.x,aR,f);
  h.armL.rotation.z=lerp(h.armL.rotation.z,aLz,f);h.armR.rotation.z=lerp(h.armR.rotation.z,aRz,f);
  h.legL.rotation.y=lerp(h.legL.rotation.y,h.mode==='sit'?.16:0,f);h.legR.rotation.y=lerp(h.legR.rotation.y,h.mode==='sit'?-.16:0,f);
  h.body.position.y=lerp(h.body.position.y,by,(h.mode==='joy'||h.mode==='joyspin')?1:f);h.torso.rotation.x=lerp(h.torso.rotation.x,lean,f);h.head.rotation.x=lerp(h.head.rotation.x,hd,f);
  if(h.mode!=='walk')h.torso.rotation.z*=.85;h.mouth.scale.setScalar((h.mode==='joy'||h.mode==='joyspin')?1.7:1);if(h.mode==='idle'){h.head.rotation.y=Math.sin(h.t*.5)*.35;h.head.rotation.z=0;h.body.scale.y=1+Math.sin(h.t*2)*.006}else{h.head.rotation.y*=.9;h.body.scale.y=1}
}
