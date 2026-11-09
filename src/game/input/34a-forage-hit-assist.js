/* ---------- Small forage selection tolerance (screen space only) ---------- */
// The mesh size, 3D silhouette, interaction distance, collection hit count,
// rarity, failure chances, and movement remain untouched. This is exclusively
// a fallback when the original ray misses a small collectible by a few pixels.
const FORAGE_TAP_PAD_MOUSE=16;
const FORAGE_TAP_PAD_TOUCH=22;
const FORAGE_TAP_MAX_RADIUS=48;
const FORAGE_TAP_MAX_WORLD_DISTANCE=35;
const FORAGE_TAP_OCCLUSION_SLACK=1.35;
const forageTapBounds=new THREE.Box3();
const forageTapSphere=new THREE.Sphere();
const forageTapRoot=new THREE.Vector3();
const forageTapProjected=new THREE.Vector3();
const forageTapOffset=new THREE.Vector3();

function forageTapPixelRadius(meshRadius,depth,focalPixels,touch){
  // Cap the added target area even for unusually large meshes or a close camera.
  const silhouette=Math.min(32,Math.max(0,meshRadius)*focalPixels/Math.max(.1,depth));
  return Math.min(FORAGE_TAP_MAX_RADIUS,silhouette+(touch?FORAGE_TAP_PAD_TOUCH:FORAGE_TAP_PAD_MOUSE));
}

function findForageTapAssist(sx,sy,rayHits){
  const coarse=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches;
  const firstObstacle=rayHits.length?rayHits[0].distance:Infinity;
  const focalPixels=Hh*.5/Math.tan(camera.fov*Math.PI/360);
  const maxDistanceSq=FORAGE_TAP_MAX_WORLD_DISTANCE**2;
  let chosen=null,bestScore=Infinity;
  for(const chunk of chunks.values())for(const item of chunk.items){
    // Decoy plants and scenery are deliberately not given a larger hit area.
    if(!item.mesh||!item.mesh.parent||!item.mesh.visible||takenUntil(item.id)||
      !['herb','mush','honey','fruit'].includes(item.kind))continue;
    item.mesh.getWorldPosition(forageTapRoot);
    if(camera.position.distanceToSquared(forageTapRoot)>maxDistanceSq)continue;
    forageTapProjected.copy(forageTapRoot).project(camera);
    if(forageTapProjected.z<=-1||forageTapProjected.z>=1)continue;
    const rootX=(forageTapProjected.x+1)*W*.5;
    const rootY=(1-forageTapProjected.y)*Hh*.5;
    // Avoid an expensive bounding-box traversal for off-target resources.
    if(Math.abs(sx-rootX)>120||Math.abs(sy-rootY)>145)continue;
    forageTapBounds.setFromObject(item.mesh);
    if(forageTapBounds.isEmpty())continue;
    forageTapBounds.getBoundingSphere(forageTapSphere);
    const center=forageTapSphere.center;
    const rayDepth=forageTapOffset.subVectors(center,ray.ray.origin).dot(ray.ray.direction);
    // Do not harvest through hills, rocks, trees or other nearer geometry.
    if(rayDepth<=0||rayDepth>firstObstacle+FORAGE_TAP_OCCLUSION_SLACK)continue;
    forageTapProjected.copy(center).project(camera);
    if(forageTapProjected.z<=-1||forageTapProjected.z>=1)continue;
    const px=(forageTapProjected.x+1)*W*.5;
    const py=(1-forageTapProjected.y)*Hh*.5;
    const radius=forageTapPixelRadius(forageTapSphere.radius,
      camera.position.distanceTo(center),focalPixels,coarse);
    const distance=Math.hypot(sx-px,sy-py);
    if(distance>radius)continue;
    // When two plants are close together, prioritize the one tapped nearest.
    const score=distance/radius+rayDepth*.0001;
    if(score<bestScore){bestScore=score;chosen=item}
  }
  return chosen;
}
