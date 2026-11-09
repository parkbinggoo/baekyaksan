/* ===== Fixed population quotas for the two exceptionally rare root herbs =====
   Count is map-wide, not per loaded chunk. Original habitat, plant models and
   twenty-minute rare-slot respawn remain unchanged. Coordinates are intentionally
   excluded from the public UI, map and documentation. */
const TARGETED_FIVE_STAR_LIMITS=Object.freeze({sansam:3,cheonma:5});
const TARGETED_FIVE_STAR_SITES=Object.freeze({
  sansam: Object.freeze([
    Object.freeze({chunk:"0,-25",x:6.109,z:-1177.673,index:0}),
    Object.freeze({chunk:"-1,-40",x:-12.98,z:-1916.171,index:1}),
    Object.freeze({chunk:"-1,-46",x:-15.657,z:-2192.871,index:2}),
  ]),
  cheonma: Object.freeze([
    Object.freeze({chunk:"-2,-16",x:-52.108,z:-733.835,index:0}),
    Object.freeze({chunk:"-1,-11",x:-3.713,z:-506.37,index:1}),
    Object.freeze({chunk:"-2,-27",x:-64.541,z:-1266.353,index:2}),
    Object.freeze({chunk:"0,-35",x:8.011,z:-1646.007,index:3}),
    Object.freeze({chunk:"1,-20",x:64.727,z:-948.174,index:4}),
  ]),
});
function isTargetedFiveStar(type){return Object.hasOwn(TARGETED_FIVE_STAR_LIMITS,type)}
function addTargetedFiveStarResources(c){
  // Seeded geometry is identical for all players; species comes from the same
  // native flora database. Never create a new plant model or change difficulty.
  for(const type of Object.keys(TARGETED_FIVE_STAR_LIMITS)){
    const sp=SPI[type],sites=TARGETED_FIVE_STAR_SITES[type];
    for(const site of sites){
      if(site.chunk!==c.key)continue;
      const id=`${c.key}:fiveStar-${type}-${site.index}`;
      if(takenUntil(id))continue;
      const x=site.x,z=site.z;
      if(!resourceSiteOK(c,x,z,{type},true)){
        // Protect habitat constraints, do not silently place in an invalid
        // location if a future terrain edit changes an audited spawning site.
        console.warn('희귀 약초 서식지 재검증 필요',type,id);
        continue;
      }
      const variant=rareSlotSeed(id,0)%3;
      const mesh=makePlantMesh(sp,variant);
      mesh.position.set(x,H(x,z)-.02,z);
      mesh.rotation.y=(rareSlotSeed(id,17)%6283)/1000;
      const item={kind:'herb',type,id,hits:0,need:sp.need,mesh};
      mesh.userData.item=item;c.grp.add(mesh);c.items.push(item);
    }
  }
}
