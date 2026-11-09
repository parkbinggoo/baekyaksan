/* bump into boulders and trunks, slide along them */
function collide(x,z){
  const ccx=Math.floor(x/CH),ccz=Math.floor(z/CH);
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const c=chunks.get((ccx+dx)+','+(ccz+dz));if(!c)continue;
    for(const k of c.rocks||[]){const ddx=x-k.x,ddz=z-k.z,d=Math.hypot(ddx,ddz),min=k.r*.9+.3;if(d<min&&d>1e-4){x=k.x+ddx/d*min;z=k.z+ddz/d*min}}
    for(const t of c.trees){const ddx=x-t.x,ddz=z-t.z;if(Math.abs(ddx)>1.4||Math.abs(ddz)>1.4)continue;const d=Math.hypot(ddx,ddz),min=.42*t.s+.26;if(d<min&&d>1e-4){x=t.x+ddx/d*min;z=t.z+ddz/d*min}}}
  return {x,z};
}
/* keep foliage from swallowing the camera: walk the target→camera segment and stop before the first crown */
const hiddenTrees=new Set(),ZERO=new THREE.Matrix4().makeScale(0,0,0);
function setTreeHidden(t,h){if(!!t.hidden===h)return;t.hidden=h;if(h)hiddenTrees.add(t);else hiddenTrees.delete(t);for(const e of t.inst||[]){e.im.setMatrixAt(e.i,h?ZERO:e.m);e.im.instanceMatrix.needsUpdate=true}if(t.mush)t.mush.visible=true;/* Keep collectible mushrooms visible even when their host tree is hidden for camera visibility. */if(t.ribbon)t.ribbon.visible=!h&&!!t.ribbon.userData.zoneVisible}
function occlusion(tx,ty,tz,cx,cy,cz,collect){
  const ccx=Math.floor(tx/CH),ccz=Math.floor(tz/CH);let best=1;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const c=chunks.get((ccx+dx)+','+(ccz+dz));if(!c)continue;
    for(const t of c.trees){if(Math.abs(t.x-tx)>16||Math.abs(t.z-tz)>16)continue;const pine=t.kind==='pine',r=(pine?2.7:3.4)*t.s;
      {const sx=cx-tx,sz=cz-tz,L2=sx*sx+sz*sz||1,u=clamp(((t.x-tx)*sx+(t.z-tz)*sz)/L2,0,1),qx=tx+sx*u-t.x,qz=tz+sz*u-t.z;if(qx*qx+qz*qz>(r+.6)*(r+.6))continue}
      const c0=t.y+(pine?7.3:7.2)*t.s,c1=t.y+(pine?16.9:13.8)*t.s;
      for(let i=3;i<=20;i++){const k=i/20;if(!collect&&k>=best)break;const x=tx+(cx-tx)*k,y=ty+(cy-ty)*k,z=tz+(cz-tz)*k;
        const dd=Math.hypot(x-t.x,z-t.z);if((y>c0&&y<c1&&dd<r*(pine?1-(y-c0)/(c1-c0)*.75:1))||(y<c0&&dd<.46*t.s+.1)){if(collect)collect.add(t);best=Math.min(best,k);break}}}}
  return best;
}
