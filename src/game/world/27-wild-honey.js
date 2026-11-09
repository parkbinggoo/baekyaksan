/* ---------- Low-poly beehives: each is an accessible, carefully gathered resource ---------- */
function honeyTreeHabitat(type,t,alt){
 if(!t||t.s<.52||alt>1550||alt<35)return false;
 if(type==='acaciaHoney')return t.kind==='acacia'&&alt<1050;
 if(type==='chestnutHoney')return t.kind==='chestnut'&&alt<1250;
 if(type==='nativeHoney')return t.kind==='oak'&&alt>=200&&alt<1450&&t.s>.8;
 return alt<1150&&(t.kind==='oak'||t.kind==='acacia'||t.kind==='chestnut');
}
function placeForestHoney(c){
 // Independent, fixed seed: adding hives never reshuffles existing herbs, trees or fruits.
 const r=rngOf((Math.imul(c.cx,194719)^Math.imul(c.cz,771277)^0xbee55e)>>>0),grp=c.grp;
 const create=(type,id,x,z,host=null,rock=null)=>{
   if(takenUntil(id)||z<SUMMIT_Z+5||z>33||Math.abs(x-pathX(z))>48||streamD(x,z)<2.9)return;
   const b=H(x,z);if(!Number.isFinite(b))return;
   if(c.items.some(it=>it.mesh&&Math.hypot(it.mesh.position.x-x,it.mesh.position.z-z)<.72))return;
   // Do not put nests inside opaque boulders or tree trunks.
   if(c.rocks.some(k=>k!==rock&&Math.hypot(x-k.x,z-k.z)<resourceRockClearance(k)+.35))return;
   const nest=hive3D(type);nest.position.set(x,b+.04,z);nest.rotation.y=r()*Math.PI*2;
   const it={kind:'honey',type,id,hits:0,need:HONEY[type].need,mesh:nest,hostTree:host,hiveRock:rock};
   nest.userData.item=it;grp.add(nest);c.items.push(it);
 };
 for(let i=0;i<c.trees.length;i++){
   const t=c.trees[i],alt=H(t.x,t.z)*ALT_K;
   const native=honeyTreeHabitat('nativeHoney',t,alt)&&r()<.028;
   const acacia=honeyTreeHabitat('acaciaHoney',t,alt)&&r()<.14;
   const chestnut=honeyTreeHabitat('chestnutHoney',t,alt)&&r()<.11;
   const mixed=honeyTreeHabitat('mixedHoney',t,alt)&&r()<.045;
   const type=native?'nativeHoney':acacia?'acaciaHoney':chestnut?'chestnutHoney':mixed?'mixedHoney':null;
   if(!type)continue;
   const a=r()*Math.PI*2,dist=.57*t.s+.92,x=t.x+Math.cos(a)*dist,z=t.z+Math.sin(a)*dist;
   create(type,c.key+':honeyT'+i,x,z,t);
 }
 for(let i=0;i<c.rocks.length;i++){
   const rock=c.rocks[i];if(rock.r<2.6)continue;
   const alt=H(rock.x,rock.z)*ALT_K;if(alt<190||alt>1450)continue;
   const type=r()<.04?'nativeHoney':r()<.09?'mixedHoney':null;
   if(!type)continue;
   const a=r()*Math.PI*2,dist=resourceRockClearance(rock)+.75;
   create(type,c.key+':honeyR'+i,rock.x+Math.cos(a)*dist,rock.z+Math.sin(a)*dist,null,rock);
 }
}
