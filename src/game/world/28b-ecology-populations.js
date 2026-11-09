/* ==== BAEKYAKSAN v1.2.5: ecologically balanced, deterministic populations ====
   Existing habitat generation remains the source of plant models and locations.
   Chosen five-star slots are separated across the mountain and retain their
   stable IDs for multiplayer, golden singletons and 20-minute regeneration.
   None of these data are exposed in the game map or player UI. */
const ECOLOGY_QUOTA_SLOTS=Object.freeze({
  sanghwang:Object.freeze(["-1,-2:m0","-2,-74:m27","0,-18:m24","0,-26:m14","0,-34:m41","0,-54:m30","0,-64:m25","1,-43:m24"]),
  songi:Object.freeze(["-1,-11:xm31","-1,-16:xm11","-1,-20:xm11","-1,-25:xm20","-2,-1:xm29","-2,-39:xm31","-2,-52:xm7","-2,-7:xm56","0,-29:xm36","1,-35:xm3","1,-47:xm16","1,-56:xm27"]),
  neungi:Object.freeze(["-1,-14:xm18","-1,-22:xm31","-1,-36:xm44","-1,-42:xm48","-1,-53:xm6","0,-45:xm35","0,-8:xm17"]),
  kkotsongi:Object.freeze(["-1,-42:xm52","-1,-53:xm21","-2,-14:xm34","0,-31:xm5","0,-37:xm5","0,-48:xm7","0,-9:xm3","1,-20:xm20"]),
  seogi:Object.freeze(["-1,-29:rock1","-1,-60:rock1","-1,-73:rock0","0,-42:rock3","0,-89:rock1","1,0:rock4"]),
  nativeHoney:Object.freeze(["-1,-12:honeyT5","-1,-42:honeyT15","0,-34:honeyR0","0,-37:honeyR0","1,-21:honeyR0"]),
  yeongji:Object.freeze(["-1,-15:m60","-1,-30:m12","-1,-38:m4","-1,-42:m24","-1,-60:m21","-1,-65:m14","-1,-70:m17","-2,-12:m23","-2,-49:m52","-2,-4:m47","-2,-76:m22","0,-19:m24","0,-23:m39","0,-33:m21","0,-45:m60","0,-53:m53","0,-73:m29","0,-81:m15","0,-8:m56","0,0:m7","1,-56:m47","1,-68:m27"]),
});
const ECOLOGY_QUOTA_SETS=Object.fromEntries(Object.entries(ECOLOGY_QUOTA_SLOTS).map(([k,v])=>[k,new Set(v)]));
function ecologyAllowsResource(type,id){const quota=ECOLOGY_QUOTA_SETS[type];return !quota||quota.has(id)}
/* Protected real habitats: these species existed in the journal but the
   original random draw gave them zero initial visible instances. The preselected
   anchors are real natural rock structures or suitable open ground. They are
   widely dispersed between habitat regions, not a new central herb cluster. */
const ECOLOGY_RECOVERY_SITES=Object.freeze({
  aegigirin:Object.freeze([{"chunk":"-1,-49","rockIndex":1},{"chunk":"0,-20","rockIndex":0},{"chunk":"-1,-41","rockIndex":0}]),
  bawichaesong:Object.freeze([{"chunk":"-1,-41","rockIndex":0},{"chunk":"0,-20","rockIndex":0},{"chunk":"1,-57","rockIndex":3}]),
  sanbuchu:Object.freeze([{"chunk":"-1,-39","x":-27.64,"z":-1835.575},{"chunk":"0,-20","rockIndex":0},{"chunk":"-1,-57","x":-15.463,"z":-2719.381},{"chunk":"-1,-49","rockIndex":1},{"chunk":"0,-23","x":34.846,"z":-1098.556}]),
  dolyangji:Object.freeze([{"chunk":"0,-81","rockIndex":0},{"chunk":"1,-57","rockIndex":2},{"chunk":"0,-69","rockIndex":0},{"chunk":"-1,-88","rockIndex":0}]),
  bawitteokpul:Object.freeze([{"chunk":"-1,-72","rockIndex":0},{"chunk":"-1,-53","rockIndex":6},{"chunk":"-1,-84","rockIndex":0},{"chunk":"-1,-63","rockIndex":1}]),
  bawichwi:Object.freeze([{"chunk":"-1,-41","rockIndex":0},{"chunk":"1,-9","rockIndex":0},{"chunk":"-2,-27","rockIndex":0},{"chunk":"1,-19","rockIndex":0}]),
  doldanpung:Object.freeze([{"chunk":"-1,-39","rockIndex":5},{"chunk":"1,-9","rockIndex":0},{"chunk":"-1,-26","rockIndex":0},{"chunk":"-1,-49","rockIndex":0}]),
});
function addMissingJournalSpecies(chunk){
  for(const [type,sites] of Object.entries(ECOLOGY_RECOVERY_SITES)){
    const sp=SPI[type];if(!sp)continue;
    for(let si=0;si<sites.length;si++){
      const site=sites[si];if(site.chunk!==chunk.key)continue;
      const id=`${chunk.key}:habitat-${type}-${si}`;
      if(takenUntil(id))continue;
      let x,z,y,rock=null;
      if(Number.isInteger(site.rockIndex)){
        rock=chunk.rocks[site.rockIndex];
        if(!rock?.mesh||!rock.climbable)continue;
        const e=envAt(rock.x,rock.z,chunk);
        const alt=H(rock.x,rock.z)*ALT_K,light=1-canopyAt(rock.x,rock.z);
        if(alt<sp.alt[0]||alt>sp.alt[1])continue;
        if(sp.L==='sun'&&light<=.33||sp.L==='shade'&&light>=.74)continue;
        if(sp.W==='dry'?e.moist>=.62:e.moist<=.22)continue;
        // Place on a different exposed sector of the existing real rock.
        let best=null;
        for(let j=0;j<8;j++){
          const a=(j*2.39996323+rareSlotSeed(id,j)%113*.012);
          const rad=rock.r*.22;
          const xx=rock.x+Math.cos(a)*rad,zz=rock.z+Math.sin(a)*rad;
          const separation=Math.min(100,...chunk.items.filter(it=>it.mesh&&it.rock===rock)
            .map(it=>Math.hypot(it.mesh.position.x-xx,it.mesh.position.z-zz)));
          if(!best||separation>best.separation)best={x:xx,z:zz,separation};
        }
        if(!best)continue;
        x=best.x;z=best.z;y=rock.topY-.04;
      }else{
        x=site.x;z=site.z;
        // Ground resources must still obey their original sun/shade, altitude,
        // soil moisture, stream, slope, tree and obstacle habitat conditions.
        if(!resourceSiteOK(chunk,x,z,{type},true)||fitOf(sp,envAt(x,z,chunk))<.045)continue;
        y=H(x,z)-.02;
      }
      const variant=rareSlotSeed(id,0)%3;
      const mesh=makePlantMesh(sp,variant);mesh.position.set(x,y,z);
      mesh.rotation.y=(rareSlotSeed(id,7)%6283)/1000;
      const item={kind:'herb',type,id,hits:0,need:sp.need,mesh};
      if(rock)item.rock=rock;
      mesh.userData.item=item;chunk.grp.add(mesh);chunk.items.push(item);
    }
  }
}
function enforceForestPopulationQuota(c){
  // Guard all resource-generating routes, even if a later update adds another.
  c.items=c.items.filter(it=>{
    if(ecologyAllowsResource(it.type,it.id))return true;
    if(it.mesh){c.grp.remove(it.mesh);it.mesh.userData.item=null;}
    return false;
  });
}
