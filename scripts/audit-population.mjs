/** Full-map deterministic collectible audit with lightweight WebGL substitutes.
 * The habitat & item-generation functions below come directly from src/game.
 * Counts are an initial, unharvested map snapshot; no runtime web rendering.
 * Never include coordinates or slot IDs in reports or logs. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const files=["data/01-item-catalog.js","world/06-terrain-height.js","world/22-streams-and-habitats.js","data/21-native-flora-database.js","world/26-decoy-flora.js","world/24-flora-population.js","world/27-wild-honey.js","world/28-rare-placement.js","world/28a-five-star-population.js","data/21b-golden-five-star.js","world/28b-ecology-populations.js","world/29-chunks-and-ground.js"];
const prelude="\nconst IOS_CLOUD_SAFE=false, ALT_K=2.5, SUMMIT_ALT=2500, SUMMIT_Z=-4560, PERF={chunkEvery:0.1}, P={x:0,z:24};\nconst lerp=(a,b,t)=>a+(b-a)*t, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));\nfunction rngOf(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}\nfunction pickW(table,keys,r,boost){let tot=0;const ws=keys.map(k=>{let w=table[k].w;if(table[k].rar>=4)w*=boost;tot+=w;return w});let x=r*tot;for(let i=0;i<keys.length;i++){x-=ws[i];if(x<=0)return keys[i]}return keys.at(-1)}\nclass V{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}copy(o){return this.set(o.x,o.y,o.z)}clone(){return new V(this.x,this.y,this.z)}length(){return Math.hypot(this.x,this.y,this.z)}setScalar(x){return this.set(x,x,x)} }\nclass E{constructor(){this.x=0;this.y=0;this.z=0}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}}\nclass Obj{constructor(){this.position=new V();this.rotation=new E();this.scale=new V(1,1,1);this.userData={};this.children=[];this.parent=null;this.matrix={clone:()=>({})};this.quaternion={setFromUnitVectors(){}};}add(v){if(v){this.children.push(v);v.parent=this}return this}remove(v){const i=this.children.indexOf(v);if(i>=0)this.children.splice(i,1);v.parent=null}updateMatrix(){}traverse(cb){cb(this);for(const v of this.children)v.traverse(cb)}}\nclass Mesh extends Obj{constructor(g,m){super();this.geometry=g;this.material=m;this.isMesh=true;}}\nclass Inst extends Mesh{constructor(g,m,n){super(g,m);this.count=n;this.instanceMatrix={needsUpdate:false};this.instanceColor={needsUpdate:false};this.isInstancedMesh=true;}setMatrixAt(){}setColorAt(){}}\nclass Geo{constructor(){this.userData={};this.attributes={position:{count:0,getX(){return 0},getY(){return 0},getZ(){return 0},setXYZ(){}}}}translate(){return this}rotateX(){return this}computeVertexNormals(){return this}setAttribute(){return this}}\nclass Color{constructor(hex){this.r=.3;this.g=.3;this.b=.3}setHSL(){return this}setHex(){return this}lerp(){return this}multiplyScalar(){return this}getHex(){return 0x123456}}\nclass Mat{constructor(opts){this.color=new Color();this.userData={}}clone(){return new Mat()}}\nconst THREE={Group:Obj,Object3D:Obj,Vector3:V,Color,Mesh,InstancedMesh:Inst,MeshPhongMaterial:Mat,MeshBasicMaterial:Mat,BufferGeometry:Geo,Float32BufferAttribute:class {},SphereGeometry:Geo,ConeGeometry:Geo,IcosahedronGeometry:Geo,CylinderGeometry:Geo,DodecahedronGeometry:Geo,PlaneGeometry:Geo,DoubleSide:2};\nconst scene=new THREE.Group(), rareMoves=new Map(), rareDirtyChunks=new Set();\nfunction keep(g){g.userData.keep=true;return g}function M(){return new Mat()}\nconst BALL=keep(new Geo()),CYL=keep(new Geo()),STONE=keep(new Geo()),ROCK2=keep(new Geo()),BUSH=keep(new Geo());\nconst pineTrunk=keep(new Geo()),pineC=[1,2,3,4,5].map(()=>keep(new Geo())),oakTrunk=keep(new Geo()),oakF1=keep(new Geo()),oakF2=keep(new Geo()),oakF3=keep(new Geo());\nfunction stemM(parent){const v=new Mesh(CYL,M());parent.add(v);return v}function leafM(parent){const v=new Mesh(BALL,M());parent.add(v);return v}\nfunction makePlantMesh(){return new Obj()}function mush3D(){return new Obj()}function fruit3D(){return new Obj()}function hive3D(){return new Obj()}\nconst FRUIT_HEIGHT={acorn:.045,chestnut:.047,pinecone:.065,wildberry:.043,ginkgo:.043,jat:.042};\nconst FRUIT_SCALE={acorn:.15,chestnut:.20,pinecone:.34,wildberry:.14,ginkgo:.16,jat:.13};\nfunction takenUntil(){return 0}function rockSurfaceY(rock,x,z){return rock.topY+.08};\nfunction itemInfo(k){return HERBS[k]||MUSH[k]||HONEY[k]||null};\n\n\nfunction placeTentTrailRibbons(){}\n";
const sources=await Promise.all(files.map(async file=>{
 let src=await readFile(join(root,'src/game',file),'utf8');
 if(file==='world/29-chunks-and-ground.js'){
  // Terrain triangles and render textures are replaced only; all item draws
  // and rare species/habitat/seed rules still execute.
  src=src.replace(/function makeRealGround\(cx,cz\)\{[\s\S]*?\n\}\n(?=\/\* Resource placement check:)/,
    'function makeRealGround(cx,cz){return new THREE.Mesh(new Geo(),M())}\n');
  src=src.replace(/function resourceGroundY\(c,x,z\)\{[\s\S]*?\n\}\n(?=function resourceRockClearance)/,
    'function resourceGroundY(c,x,z){return H(x,z)}\n');
 }
 return src;
}));
const audit=String.raw`
const counts={};const reachable={};const golden={};let chunksAudited=0;
const registered=[...HERB_KEYS,...MUSH_KEYS,...Object.keys(FRUITS),...HONEY_KEYS];
for(const k of registered){counts[k]=0;reachable[k]=0;golden[k]=0}
for(let cz=Math.floor((SUMMIT_Z-72)/CH);cz<=Math.ceil(72/CH);cz++){
 const z=(cz+.5)*CH;if(z<SUMMIT_Z-72||z>72)continue;
 const x=pathX(z),minX=Math.floor((x-110)/CH),maxX=Math.floor((x+110)/CH);
 for(let cx=minX;cx<=maxX;cx++){
   const c=buildChunk(cx,cz);chunksAudited++;
   for(const it of c.items){
     if(!Object.hasOwn(counts,it.type))continue;
     counts[it.type]++;
     if(it.golden)golden[it.type]++;
     const p=it.mesh.position;
     if(p.z>=SUMMIT_Z+3&&p.z<=33&&Math.abs(p.x-pathX(p.z))<=49)reachable[it.type]++;
   }
   scene.remove(c.grp);chunks.delete(c.key);
 }
}
const records=registered.map(k=>({key:k,name:itemInfo(k)?.name||FRUITS[k]?.name||SPI[k]?.n||k,rar:itemInfo(k)?.rar??FRUITS[k]?.rar??0,quantity:counts[k],reachable:reachable[k],golden:golden[k]}));
const errors=[];for(const r of records){if(r.quantity<1||r.reachable<1)errors.push(r.key+': missing or unreachable')};
const expected={sansam:3,cheonma:5,sanghwang:8,songi:12,neungi:7,kkotsongi:8,seogi:6,nativeHoney:5,yeongji:22};
for(const [k,v] of Object.entries(expected)){if(counts[k]!==v)errors.push(k+': quota '+counts[k]+' vs '+v)}
for(const type of GOLD_FIVE_BASES){if(golden[type]!==1)errors.push(type+': golden '+golden[type]+' vs 1')}
this.__report={version:'1.2.5',mode:'initial_seeded_chunk_simulation',scannedChunks:chunksAudited,registeredSpecies:registered.length,zeroSpecies:records.filter(x=>x.quantity===0).length,errors,records};
`;
const runtime=prelude+'\nconst FRUITS='+JSON.stringify({acorn:{name:'도토리',rar:1},chestnut:{name:'밤',rar:2},pinecone:{name:'솔방울',rar:1},wildberry:{name:'산딸기',rar:2},ginkgo:{name:'은행 열매',rar:2},jat:{name:'잣',rar:3}})+';\n'+sources.join('\n')+'\n'+audit;
const warnings=[];const sandbox={console:{log(){},warn(...msg){warnings.push(msg.map(String).join(' ').slice(0,120))},error(...msg){warnings.push(msg.map(String).join(' ').slice(0,120))}}};
vm.runInNewContext(runtime,sandbox,{timeout:180000,filename:'population-audit.vm.js'});
const report=JSON.parse(JSON.stringify(sandbox.__report));
if(warnings.length)report.warningCount=warnings.length;
const dir=join(root,'reports');await mkdir(dir,{recursive:true});
await writeFile(join(dir,'population-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log('백약산 도감 전수 검사:',report.registeredSpecies+'종, 초기 배치 0개 '+report.zeroSpecies+'종, 오류 '+report.errors.length+'건');
console.log('5성:',report.records.filter(r=>r.rar===5).map(r=>r.name+' '+r.quantity+(r.golden?'(황금 '+r.golden+')':'')).join(' / '));
if(report.errors.length){console.error(report.errors.join('\n'));process.exitCode=1;}
