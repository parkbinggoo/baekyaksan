/**
 * Shape-parity regression for all seven golden five-stars.
 * Runs the actual mushroom builder, golden tint and shared display factory
 * with WebGL-free primitive stand-ins. It tests source geometry, mesh parts,
 * part transforms, color isolation and the species/slot association.
 * This does not claim a real phone GPU render.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const read=async p=>readFile(new URL('../src/game/'+p,import.meta.url),'utf8');
const goldSrc=await read('data/21b-golden-five-star.js');
const mshSrc=(await read('graphics/19-herb-and-mushroom-mesh.js'));
const mushroomFn=mshSrc.slice(mshSrc.indexOf('function mush3D(type){'));
const iconSrc=await read('graphics/25-collection-icons.js');
const previewFn=iconSrc.slice(iconSrc.indexOf('function makeForageDisplayModel(kind,type){'),iconSrc.indexOf('function renderIcon(kind,type){'));
const offeringSrc=await read('gameplay/54-secret-offering-and-titles.js');
assert.match(offeringSrc,/group\.add\(makeForageDisplayModel\(kind,key\)\)/,'불상 공양도 동일한 3D 팩토리 사용');
assert.match(iconSrc,/const obj=makeForageDisplayModel\(kind,type\)/,'가방·도감·채집 카드도 동일한 3D 팩토리 사용');
const worldSrc=await read('world/28a-five-star-population.js');
assert.match(worldSrc,/makePlantMesh\(sp,variant\)/,'원본 산삼·천마는 동일한 종 빌더 사용');
const chunkSrc=await read('world/29-chunks-and-ground.js');
assert.match(chunkSrc,/applyGoldenVariants\(c\)/,'실제 월드 골드 판정 수행');
class Vec {
  constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
  toJSON(){return [this.x,this.y,this.z];}
}
class Attr{
  constructor(data){this.array=Float32Array.from(data);this.count=this.array.length/3;this.needsUpdate=false}
  getX(i){return this.array[i*3]}getY(i){return this.array[i*3+1]}getZ(i){return this.array[i*3+2]}
  setXYZ(i,x,y,z){this.array[i*3]=x;this.array[i*3+1]=y;this.array[i*3+2]=z}
  clone(){return new Attr(this.array)}
}
class Geo {
  constructor(id,position=[],colour=[]){this.id=id;this.userData={keep:true};this.attrib={position:new Attr(position)};if(colour.length)this.attrib.color=new Attr(colour)}
  getAttribute(k){return this.attrib[k]||null}
  clone(){const g=new Geo(this.id);g.userData={...this.userData};g.attrib=Object.fromEntries(Object.entries(this.attrib).map(([k,a])=>[k,a.clone()]));return g}
}
class Color{
  constructor(value=0xffffff){this.setHex(value)}
  setHex(hex){this.r=((hex>>16)&255)/255;this.g=((hex>>8)&255)/255;this.b=(hex&255)/255;return this}
  setHSL(h,s,l){const c=(1-Math.abs(2*l-1))*s,a=c*(1-Math.abs((h*6)%2-1)),m=l-c/2;const x=h*6;const rgb=x<1?[c,a,0]:x<2?[a,c,0]:x<3?[0,c,a]:x<4?[0,a,c]:x<5?[a,0,c]:[c,0,a];this.r=rgb[0]+m;this.g=rgb[1]+m;this.b=rgb[2]+m;return this}
  clone(){const c=new Color();c.r=this.r;c.g=this.g;c.b=this.b;return c}
  toJSON(){return [this.r,this.g,this.b]}
}
class Mat{
  constructor(hex,opts={}){this.color=new Color(hex);this.emissive=new Color(0);this.emissiveIntensity=0;this.vertexColors=!!opts.vertexColors;this.visible=opts.visible!==false;this.needsUpdate=false}
  clone(){const m=new Mat(0);m.color=this.color.clone();m.emissive=this.emissive.clone();m.emissiveIntensity=this.emissiveIntensity;m.vertexColors=this.vertexColors;m.visible=this.visible;return m}
}
class Obj{
  constructor(){this.position=new Vec();this.rotation=new Vec();this.scale=new Vec(1,1,1);this.children=[];this.userData={};this.visible=true;this.isMesh=false;this.parent=null}
  add(o){this.children.push(o);o.parent=this;return this}
  traverse(fn){fn(this);for(const child of this.children)child.traverse(fn)}
}
class Mesh extends Obj{
  constructor(geometry,material){super();this.geometry=geometry;this.material=material;this.isMesh=true;}
}
const THREE={Group:Obj,Mesh};
function sphere(g,x,y,z,r,mat,sx=1,sy=1,sz=1){const obj=new Mesh(new Geo('rounded-lobe'),mat);obj.position.set(x,y,z);obj.scale.set(r*sx,r*sy,r*sz);g.add(obj);return obj;}
function stem(g,x,y,z,h,r,mat){const obj=new Mesh(new Geo('stem'),mat);obj.position.set(x,y,z);obj.scale.set(r,h,r);g.add(obj);return obj;}
const fixtureCoords={sansam:[0,0,0,0,.12,.03,.04,.2,.05],cheonma:[0,0,0,.01,.18,.03,.01,.34,.01]};
const fixtureColours={sansam:[.2,.7,.15,.9,.16,.06,.4,.26,.1],cheonma:[.38,.57,.19,.73,.48,.19,.51,.30,.12]};
const herbKeys=['sansam','cheonma'];const mushKeys=['sanghwang','songi','neungi','kkotsongi','seogi'];
const allKeys=[...herbKeys,...mushKeys];
const sandbox={
  THREE,Math,console,HERB_KEYS:herbKeys,MUSH_KEYS:mushKeys,
  itemInfo:k=>allKeys.includes(k)?{rar:5,name:k}:null,
  M:(hex,opts)=>new Mat(hex,opts),
  ballM:sphere,stemM:stem,
  SPI:Object.fromEntries(herbKeys.map(k=>[k,{id:k}])),
  plantMat:new Mat(0xffffff,{vertexColors:true}),
  plantGeo:(sp,v)=>new Geo(sp.id,fixtureCoords[sp.id],fixtureColours[sp.id]),
  fruit3D:()=>{throw Error('Unexpected fruit in golden 5-star check')},
  hive3D:()=>{throw Error('Unexpected honey in golden 5-star check')},
  rareMoves:new Map()
};
vm.createContext(sandbox);
vm.runInContext(goldSrc+'\n'+mushroomFn+'\n'+previewFn+'\nthis.inspect={GOLDEN_SINGLETON_SLOTS,GOLD_FIVE_BASES,goldenSpawn,applyGoldenVariants,makeForageDisplayModel};',sandbox,{timeout:5000});
const {GOLDEN_SINGLETON_SLOTS,GOLD_FIVE_BASES,goldenSpawn,applyGoldenVariants,makeForageDisplayModel}=sandbox.inspect;
assert.deepEqual(Array.from(GOLD_FIVE_BASES).sort(),allKeys.slice().sort());
const meshes=root=>{const out=[];root.traverse(o=>{if(o.isMesh&&o.visible&&o.material.visible!==false)out.push(o)});return out};
function geomSignature(root){return meshes(root).map(m=>({
  geometry:m.geometry.id, position:[...m.geometry.getAttribute('position').array],
  transform:{position:m.position.toJSON(),rotation:m.rotation.toJSON(),scale:m.scale.toJSON()}
}));}
const sums=[];
for(const base of allKeys){
  const kind=herbKeys.includes(base)?'herb':'mush';
  const original=makeForageDisplayModel(kind,base),golden=makeForageDisplayModel(kind,'gold:'+base);
  const regularMeshes=meshes(original),gildedMeshes=meshes(golden);
  assert(regularMeshes.length>0,base+': 원본 모델이 비어있음');
  assert.deepEqual(geomSignature(golden),geomSignature(original),base+': 원본과 전체 실루엣·파츠·정점/트랜스폼 일치');
  assert.equal(regularMeshes.length,gildedMeshes.length,base+': 모델 파츠 수');
  assert.equal(gildedMeshes.every(m=>m.userData.goldTinted),true,base+': 모든 파츠 금색');
  assert(gildedMeshes.every(m=>m.material!==regularMeshes[gildedMeshes.indexOf(m)].material),base+': 독립된 황금 재질');
  const before=JSON.stringify(geomSignature(original));
  const cloneGold=makeForageDisplayModel(kind,'gold:'+base);
  assert.equal(JSON.stringify(geomSignature(original)),before,base+': 황금 생성이 일반 개체를 변경하지 않음');
  assert.equal(JSON.stringify(geomSignature(cloneGold)),before,base+': 재생성 뒤에도 동일 형태');
  if(kind==='herb'){
    const o=regularMeshes[0],g=gildedMeshes[0],oc=o.geometry.getAttribute('color'),gc=g.geometry.getAttribute('color');
    assert.notStrictEqual(o.geometry,g.geometry,'뿌리형은 색상 버퍼만 분리');
    assert.equal(o.geometry.userData.keep,true,'기존 캐시 지오메트리 보존');
    assert.equal(g.geometry.userData.keep,false,'금색 복사 지오메트리는 청크 제거 시 해제 가능');
    assert.equal(o.material.vertexColors,true);assert.equal(g.material.vertexColors,true,'부위별 금빛 음영 유지');
    assert.notDeepEqual([...oc.array],[...gc.array],base+': 원본 색과 황금 색 분리');
    assert(gc.array.some((v,i)=>v!==gc.array[0]),base+': 구역별 음영 변화 유지');
  }
  const slot=GOLDEN_SINGLETON_SLOTS[base];
  assert.equal(goldenSpawn(slot,0,base),true,base+': 자기 자리에서 생성');
  for(const other of allKeys.filter(k=>k!==base))assert.equal(goldenSpawn(slot,0,other),false,base+': 다른 품종과 매핑 금지');
  sums.push(`${base}(${regularMeshes.length}개 파츠)`);
}
const chunk={items:allKeys.map(type=>({type,id:GOLDEN_SINGLETON_SLOTS[type],mesh:makeForageDisplayModel(herbKeys.includes(type)?'herb':'mush',type)}))};
chunk.items.push({type:'songi',id:GOLDEN_SINGLETON_SLOTS['neungi'],mesh:makeForageDisplayModel('mush','songi')});
applyGoldenVariants(chunk);
assert(chunk.items.slice(0,7).every(it=>it.golden===true),'7종만 금색으로 판정');
assert(!chunk.items.at(-1).golden,'다른 버섯이 황금 5성 자리에 있어도 이름/형태를 잘못 부여하지 않음');
console.log('황금 5성 형태 동일성 통과: '+sums.join(' / '));
console.log('검증: 원본 버퍼 비변경, 동일 파츠·정점·크기·회전, 종별 고유 슬롯 대조, 가방·도감·채집 카드·공양 공통 모델 팩토리.');
