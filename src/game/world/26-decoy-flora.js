/* ---------- 도감에 없는 야생초·야생화·버섯·열매 (약초스타일그래픽) ---------- */
const WILD_DECOYS = [
  {id:'fleabane',name:'개망초',kind:'weed',green:0x64834c,accent:0xe1d9bb,note:'개망초였다… ㅠㅠ 도감에 없는 들풀이네.'},
  {id:'plantain',name:'질경이',kind:'weed',green:0x4a7442,accent:0xa8a16e,note:'질경이였구나… 약초인 줄 알았네 ㅠㅠ'},
  {id:'sorrel',name:'괭이밥',kind:'weed',green:0x7d9254,accent:0xc7b34f,note:'괭이밥이네! 이번 채집은 헛수고였어 ㅠㅠ'},
  {id:'foxtail',name:'강아지풀',kind:'weed',green:0x799157,accent:0xbca76b,note:'강아지풀이었다… ㅠㅠ 흔한 풀이었네.'},
  {id:'dayflower',name:'닭의장풀',kind:'flower',green:0x4c7b53,accent:0x5378b2,note:'닭의장풀이었다! 예쁘지만 이번 도감에는 없네 ㅠㅠ'},
  {id:'pinks',name:'패랭이꽃',kind:'flower',green:0x608452,accent:0xba7189,note:'패랭이꽃이었네… 약초가 아니라 야생화야 ㅠㅠ'},
  {id:'buttercup',name:'야생 노란꽃',kind:'flower',green:0x5c7a43,accent:0xd2b857,note:'작은 야생화다! 찾던 약초는 아니었어 ㅠㅠ'},
  {id:'wildviolet',name:'산속 보랏빛꽃',kind:'flower',green:0x587246,accent:0x8d78ad,note:'보랏빛 야생화였다… 이번에는 꽝 ㅠㅠ'},
  {id:'redcap',name:'광대버섯 닮은 독버섯',kind:'fungus',green:0x9f574b,accent:0xe3d5b9,note:'앗, 붉은 갓버섯이다! 정체가 불확실해 가져가지 않았다.'},
  {id:'palegill',name:'독우산광대버섯 닮은 버섯',kind:'fungus',green:0xbdb29a,accent:0xeee8cd,note:'흰 갓버섯이었다. 독성이 있을 수 있으니 놓고 가자.'},
  {id:'ambercap',name:'노란 갓 독버섯',kind:'fungus',green:0x95734a,accent:0xd5c69f,note:'황갈색 갓버섯이다… 먹을 수 있는지 몰라서 포기 ㅠㅠ'},
  {id:'darkcap',name:'검은 나무 독버섯',kind:'fungus',green:0x50463c,accent:0x9d917a,note:'검은 나무버섯이었네. 함부로 채집하면 안 되지.'},
  {id:'pokeberry',name:'자리공 닮은 열매',kind:'inedible',green:0x56704e,accent:0x543a62,note:'먹으면 위험할 수 있는 열매다! 가방에 넣지 않았다.'},
  {id:'jackberry',name:'천남성 닮은 열매',kind:'inedible',green:0x527649,accent:0xb95040,note:'천남성을 닮은 붉은 열매다. 식용이 아니니 두고 가자.'},
  {id:'blueberry',name:'푸른 야생 열매',kind:'inedible',green:0x5e744b,accent:0x64718e,note:'낯선 푸른 열매였다… 먹을 수 있는지 몰라 놓아두었다 ㅠㅠ'},
  {id:'coralberry',name:'산속 붉은 열매',kind:'inedible',green:0x587844,accent:0xaa584a,note:'산속 붉은 열매다. 식용 여부를 모르니 가져가지 말자.'},
  {id:'yeoro',name:'여로처럼 생긴 풀',kind:'weed',green:0x436c4c,accent:0x82735e,need:5,morph:'lance',note:'여로를 닮은 낯선 풀… ㅠㅠ 도감에 없는 야생초다.'},
  {id:'baksae',name:'박새처럼 생긴 풀',kind:'weed',green:0x5f8b52,accent:0xb7b999,need:4,morph:'lance',note:'박새를 닮은 풀이다. 조심해야 할 식물이라 내려놓았다.'},
  {id:'tugukkot',name:'투구꽃',kind:'flower',green:0x4c714e,accent:0x6c69b0,need:5,morph:'bell',note:'투구꽃이었다! 독성이 있을 수 있어 수집하지 않았다.'},
  {id:'pinamul',name:'피나물',kind:'flower',green:0x4e7a47,accent:0xe1b751,need:4,morph:'star',note:'피나물이었다… ㅠㅠ 도감에 없는 들꽃이네.'},
  {id:'satgat',name:'삿갓나물',kind:'weed',green:0x446b45,accent:0x75583c,need:5,morph:'palm',note:'삿갓나물이다. 다른 약초로 착각했네 ㅠㅠ'},
  {id:'eunbangul',name:'은방울꽃',kind:'flower',green:0x557849,accent:0xe9e7d6,need:4,morph:'bell',note:'은방울꽃이었구나. 독성이 있는 식물이므로 두고 가자.'},
  {id:'aegidong',name:'애기똥풀',kind:'flower',green:0x57864a,accent:0xdfc74d,need:3,morph:'star',note:'노란 꽃은 애기똥풀이었어. 도감에는 없다 ㅠㅠ'},
  {id:'kkachisum',name:'큰까치수염',kind:'flower',green:0x5c824d,accent:0xe2dfc8,need:4,morph:'spike',note:'큰까치수염이네. 꽃 모양은 비슷했지만 이번에는 실패 ㅠㅠ'},
  {id:'jjuio',name:'쥐오줌풀',kind:'flower',green:0x608658,accent:0xd7b9b6,need:4,morph:'umbel',note:'쥐오줌풀이었네! 알고 보니 도감 대상이 아니야 ㅠㅠ'},
];
const DECOY_HABITAT={
  fleabane:  {L:'sun', W:'mid', alt:[0,1100],place:'open',trail:true,ab:1.35},    // 개망초: 밝은 빈터·산길 가장자리
  plantain: {L:'sun', W:'mid', alt:[0,950], place:'path',ab:1.10},               // 질경이: 밟히는 길 가장자리
  sorrel:   {L:'half',W:'mid', alt:[0,1100],place:'edge',ab:1.15},               // 괭이밥: 밝은 숲 가장자리
  foxtail:  {L:'sun', W:'dry', alt:[0,850], place:'open',ab:1.20},               // 강아지풀: 양지바른 풀밭
  dayflower:{L:'half',W:'moist',alt:[0,1200],place:'stream',ab:1.25},           // 닭의장풀: 축축한 숲가·물가
  pinks:    {L:'sun', W:'dry', alt:[180,1600],place:'ridge',ab:1.35},            // 패랭이꽃: 볕 드는 건조한 풀밭
  buttercup:{L:'sun', W:'moist',alt:[0,1350],place:'streamEdge',ab:.90},        // 일반적인 노란 야생화 이미지
  wildviolet:{L:'shade',W:'moist',alt:[150,1600],place:'forest',ab:1.05},       // 그늘진 숲 바닥
  redcap:   {L:'shade',W:'moist',alt:[200,1500],place:'forest',tree:'any',ab:.65},
  palegill: {L:'shade',W:'moist',alt:[200,1500],place:'forest',tree:'broad',ab:.33},
  ambercap: {L:'half',W:'mid', alt:[150,1500],place:'forest',tree:'pine',ab:.70},
  darkcap:  {L:'shade',W:'moist',alt:[0,1400],place:'forest',tree:'broad',ab:.60},
  pokeberry:{L:'sun',W:'moist',alt:[0,950],place:'edge',ab:.75},                 // 자리공 모양: 교란된 숲가
  jackberry:{L:'shade',W:'moist',alt:[200,1300],place:'forest',tree:'broad',ab:.45},
  blueberry:{L:'half',W:'mid',alt:[250,1650],place:'forest',tree:'pine',ab:.55}, // 미확인 푸른 열매: 솔숲 덤불류 연출
  coralberry:{L:'half',W:'mid',alt:[100,1400],place:'edge',ab:.70},
  yeoro:{L:'half',W:'moist',alt:[350,1750],place:'forest',ab:.75},
  baksae:{L:'half',W:'moist',alt:[500,1800],place:'forest',ab:.85},
  tugukkot:{L:'half',W:'moist',alt:[500,1750],place:'forest',ab:.6},
  pinamul:{L:'shade',W:'moist',alt:[80,1250],place:'forest',ab:.8},
  satgat:{L:'shade',W:'mid',alt:[150,1500],place:'forest',ab:.75},
  eunbangul:{L:'half',W:'mid',alt:[250,1500],place:'forest',ab:.65},
  aegidong:{L:'sun',W:'mid',alt:[0,800],place:'edge',ab:1.15},
  kkachisum:{L:'half',W:'moist',alt:[120,1200],place:'streamEdge',ab:.95},
  jjuio:{L:'half',W:'moist',alt:[200,1300],place:'edge',ab:.8},
};
const habitatBell=(v,target,width)=>Math.exp(-.5*Math.pow((v-target)/width,2));
function microHabitatAt(x,z,c){
  const e=envAt(x,z,c),trees=c&&c.trees||[];
  let nearTree=999,nearBroad=999,nearPine=999,nearOak=999,nearChestnut=999,nearGinkgo=999;
  for(const t of trees){
    const d=Math.hypot(x-t.x,z-t.z);
    if(d<nearTree)nearTree=d;
    if(t.kind==='pine'){if(d<nearPine)nearPine=d}
    else {if(d<nearBroad)nearBroad=d;if(t.kind==='oak'&&d<nearOak)nearOak=d;
      if(t.kind==='chestnut'&&d<nearChestnut)nearChestnut=d;
      if(t.kind==='ginkgo'&&d<nearGinkgo)nearGinkgo=d}
  }
  const slope=Math.hypot(H(x+1,z)-H(x-1,z),H(x,z+1)-H(x,z-1))*.5;
  return {...e,nearTree,nearBroad,nearPine,nearOak,nearChestnut,nearGinkgo,
    trail:Math.abs(x-pathX(z)),slope};
}
function decoyHabitatWeight(sp,e){
  const h=DECOY_HABITAT[sp.id];if(!h||e.inRock||e.ds<2.5||e.slope>2.3)return 0;
  if(e.alt<h.alt[0]-100||e.alt>h.alt[1]+100)return 0;
  const edgeAlt=Math.min(1,(e.alt-h.alt[0]+100)/190,(h.alt[1]-e.alt+100)/190);
  let f=h.ab*Math.max(.04,edgeAlt);
  f*=habitatBell(e.light,({sun:.85,half:.50,shade:.17})[h.L],.33);
  f*=habitatBell(e.moist,({dry:.18,mid:.44,moist:.79})[h.W],.37);
  if(h.tree){const d=h.tree==='pine'?e.nearPine:h.tree==='broad'?e.nearBroad:e.nearTree;
    if(d>8.5)return 0;f*=clamp((9-d)/6,.08,1.0)}
  switch(h.place){
    case 'path': if(e.trail>12||e.light<.44)return 0;f*=clamp((13-e.trail)/9,.2,1);break;
    case 'open': if(e.light<.48||e.nearTree<1.3)return 0;break;
    case 'edge': if(e.nearTree>17||e.light<.25||e.light>.92)return 0;f*=habitatBell(e.nearTree,7,7);break;
    case 'forest': if(e.nearTree>8.5||e.light>.72)return 0;break;
    case 'stream': if(e.ds>13||e.moist<.44)return 0;break;
    case 'streamEdge':if(e.ds>16||e.moist<.35||e.light<.40)return 0;break;
    case 'ridge':if(e.ds<10||e.light<.52||e.moist>.55)return 0;
      f*=e.rock?1.5:clamp(.75+e.slope*.45,.65,1.3);break;
  }
  if(h.trail&&e.trail<15)f*=1.35;
  return f;
}
const DECOY_GROUPS={weed:WILD_DECOYS.filter(s=>s.kind==='weed'),flower:WILD_DECOYS.filter(s=>s.kind==='flower'),fungus:WILD_DECOYS.filter(s=>s.kind==='fungus'),inedible:WILD_DECOYS.filter(s=>s.kind==='inedible')};
const DECOY_CAP=keep(new THREE.ConeGeometry(1,1,7,1)),DECOY_PETAL=BALL;
function decoy3D(spec,r){
  const g=new THREE.Group(),stem=M(0x657448),leafA=M(spec.green),leafB=M(0x829762),petal=M(spec.accent);
  const seed=r(),h=.29+r()*.28;
  const add=(geo,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;g.add(m);return m};
  if(spec.kind==='fungus'){
    const count=1+Math.floor(r()*3);
    for(let j=0;j<count;j++){
      const x=(r()-.5)*.21,z=(r()-.5)*.18,y=.10+r()*.12,rr=.055+r()*.06;
      add(CYL,M(0xc5b89b),x,0,z,.025,y,.025);
      const cap=add(DECOY_CAP,petal,x,y,z,rr,rr*.9,rr);
      cap.rotation.z=(r()-.5)*.24;
      add(BALL,M(spec.accent),x,y+.01,z,rr*.82,.024,rr*.82);
      if(spec.id==='redcap'||spec.id==='palegill')for(let k=0;k<3;k++){
        const a=k*Math.PI*2/3;add(BALL,M(0xe9dbc3),x+Math.cos(a)*rr*.42,y+.025,z+Math.sin(a)*rr*.42,.012,.009,.012)}
    }
  }else{
    const nStems=spec.kind==='weed'?2+Math.floor(r()*3):spec.kind==='inedible'?2:1+Math.floor(r()*2);
    for(let j=0;j<nStems;j++){
      const a=j*2.3999+seed*6.28,x=Math.cos(a)*.055,z=Math.sin(a)*.055,ht=h*(.75+r()*.4);
      stemM(g,x,0,z,ht,.011,stem,0,(r()-.5)*.22);
      for(let k=0;k<(spec.kind==='inedible'?3:4);k++){
        const y=ht*(.19+k*.16),ang=a+k*2.4,spread=.12+r()*.085;
        leafM(g,x,y,z,spec.morph==='lance'?spread*1.3:spread,spec.morph==='lance'?.022:spec.morph==='palm'?.075:.045+r()*.022,ang,.3,k%2?leafA:leafB);
      }
      if(spec.kind==='flower'){
        if(spec.morph==='bell'||spec.morph==='spike'||spec.morph==='umbel'){
          const n=spec.morph==='spike'?7:5;
          for(let k=0;k<n;k++){
            const ang=k*2.399,yy=ht+(k%3)*.037;
            add(spec.morph==='bell'?DECOY_CAP:BALL,petal,x+Math.cos(ang)*.035,yy,z+Math.sin(ang)*.035,.029,.034,.029);
          }
        }else{
          for(let k=0;k<5;k++){
            const ang=k*Math.PI*2/5;
            const p=add(DECOY_PETAL,petal,x+Math.cos(ang)*.044,ht,z+Math.sin(ang)*.044,.035,.016,.035);
            p.rotation.y=ang;
          }
          add(BALL,M(0xcbb968),x,ht+.012,z,.023,.023,.023);
        }
      }else if(spec.kind==='inedible'){
        const cols=spec.id==='jackberry'?2:spec.id==='pokeberry'?5:4;
        for(let k=0;k<cols;k++){
          const ang=k*2.4;const yy=ht-.04+(k%3)*.026;
          add(BALL,petal,x+Math.cos(ang)*.055,yy,z+Math.sin(ang)*.055,.022,.024,.022);
        }
      }else if(spec.id==='foxtail'){
        add(BALL,petal,x,ht,z,.032,.11,.032);
      }else if(spec.id==='fleabane'){
        for(let k=0;k<6;k++){
          const a=k*Math.PI/3;add(DECOY_PETAL,petal,x+Math.cos(a)*.031,ht,z+Math.sin(a)*.031,.025,.013,.025);
        }
        add(BALL,M(0xc4b063),x,ht+.012,z,.018,.018,.018);
      }else if(spec.id==='sorrel'){
        add(BALL,M(0xd0bf68),x,ht,z,.025,.025,.025);
      }
    }
  }
  return g;
}
function placeDecoyFlora(c,r,ox,oz,grp,nearStart,inRock,dens){
  const tries=Math.round((32+r()*7)*Math.max(.55,dens));
  let accepted=0;const limit=Math.round(8+dens*7);
  for(let i=0;i<tries&&accepted<limit;i++){
    const x=ox+(r()-.5)*(CH-3),z=oz+(r()-.5)*(CH-3);
    if(Math.abs(x-pathX(z))>53||nearStart(x,z,3.5)||inRock(x,z,.32))continue;
    const e=microHabitatAt(x,z,c),weights=WILD_DECOYS.map(sp=>decoyHabitatWeight(sp,e));
    const total=weights.reduce((a,b)=>a+b,0);
    if(total<.08||r()>clamp(total/(total+2.25),.10,.72))continue;
    let pick=r()*total,index=weights.length-1;
    for(let k=0;k<weights.length;k++){pick-=weights[k];if(pick<=0){index=k;break}}
    const spec=WILD_DECOYS[index];
    accepted++;
    const id=`${c.key}:decoy${i}`;if(takenUntil(id))continue;
    const mesh=decoy3D(spec,r);mesh.position.set(x,H(x,z)-.025,z);mesh.rotation.y=r()*Math.PI*2;
    mesh.scale.setScalar(.82+r()*.38);
    const it={kind:'decoy',type:spec.id,spec,id,hits:0,need:spec.need||3,mesh};mesh.userData.item=it;
    grp.add(mesh);c.items.push(it);
  }
}
const ROCK_PLANT_TYPES=['doldanpung','bawichwi','gorancho','bawichaesong','aegigirin','buchoson','dolyangji','bawitteokpul','gobawiikke'];
function placeRockPlants(c,r,grp){
 for(let i=0;i<c.rocks.length;i++){
   const rock=c.rocks[i];if(!rock.climbable||!rock.mesh)continue;
   const x=rock.x,z=rock.z,light=1-canopyAt(x,z),moist=envAt(x,z,c).moist,alt=rock.groundY*ALT_K;
   let list=ROCK_PLANT_TYPES.filter(k=>{
     const sp=SPI[k];return sp&&alt>=sp.alt[0]&&alt<=sp.alt[1]&&
       (sp.L==='sun'?light>.33:sp.L==='shade'?light<.74:true)&&
       (sp.W==='dry'?moist<.62:moist>.22);
   });
   if(!list.length&&r()>.25)continue;
   const spec=(r()<.18&&moist>.30)?null:list[Math.floor(r()*list.length)];
   const type=spec?spec.id:'seogi';if(type==='seogi'&&moist<.26)continue;
   const ang=r()*Math.PI*2,rr=rock.r*(.13+r()*.25);
   const px=x+Math.cos(ang)*rr,pz=z+Math.sin(ang)*rr,py=rock.topY-.04;
   const id=`${c.key}:rock${i}`,variant=Math.floor(r()*3),rotation=r()*Math.PI*2;
   if(takenUntil(id)||!ecologyAllowsResource(type,id))continue;
   const isMush=type==='seogi';
   const mesh=isMush?mush3D(type):makePlantMesh(spec,variant);
   mesh.position.set(px,py,pz);mesh.rotation.y=rotation;
   if(isMush)mesh.scale.setScalar(1.4);
   const it={kind:isMush?'mush':'herb',type,id,hits:0,need:isMush?MUSH[type].need:spec.need,mesh,rock};
   mesh.userData.item=it;grp.add(mesh);c.items.push(it);
 }
}
function placeExtraMushrooms(c,r,grp,nearStart){
 const mk=(type,id,x,y,z,sc=1)=>{
   const rotation=r()*6.28;
   if(takenUntil(id)||nearStart(x,z,4)||!ecologyAllowsResource(type,id))return;
   const m=mush3D(type);m.position.set(x,y,z);m.rotation.y=rotation;m.scale.setScalar(sc);
   const it={kind:'mush',type,id,hits:0,need:MUSH[type].need,mesh:m};m.userData.item=it;grp.add(m);c.items.push(it);
 };
 for(let i=0;i<c.trees.length;i++){
   const t=c.trees[i],alt=t.y*ALT_K;
   if(t.s<.62||r()>.17)continue;
   const pine=t.kind==='pine',broad=!pine,oak=t.kind==='oak';
   const e=envAt(t.x+1,t.z,c),ds=e.ds;
   const a=r()*Math.PI*2,rr=.6+r()*1.3,x=t.x+Math.sin(a)*rr,z=t.z+Math.cos(a)*rr;
   if(streamD(x,z)<2.8)continue;
   if(pine&&alt>180&&alt<1500&&e.moist<.64&&r()<.22)mk('songi',`${c.key}:xm${i}`,x,H(x,z)+.03,z,1.45);
   else if(oak&&alt>200&&alt<1500&&e.moist>.28&&r()<.23)mk('neungi',`${c.key}:xm${i}`,x,H(x,z)+.04,z,1.35);
   else if(broad&&alt>180&&alt<1250&&e.moist>.38&&r()<.25)mk('norugung',`${c.key}:xm${i}`,t.x,t.y+1.15*t.s,t.z,1.25);
   else if(pine&&alt>200&&alt<1500&&e.moist>.25&&r()<.2)mk('kkotsongi',`${c.key}:xm${i}`,x,H(x,z)+.03,z,1.35);
   else if(oak&&alt>140&&alt<1300&&e.moist>.25&&r()<.24)mk('ipsae',`${c.key}:xm${i}`,x,H(x,z)+.03,z,1.45);
 }
}
