/* ---------- noise / terrain ---------- */
function h2(ix,iz){let h=(Math.imul(ix,374761393)+Math.imul(iz,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967295}
function vn(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
  return lerp(lerp(h2(ix,iz),h2(ix+1,iz),ux),lerp(h2(ix,iz+1),h2(ix+1,iz+1),ux),uz)*2-1}
function fbm(x,z){let s=0,a=.5,f=1;for(let i=0;i<4;i++){s+=vn(x*f,z*f)*a;f*=2.03;a*=.5}return s}
function pathX(z){return Math.sin(z*.011)*34+Math.sin(z*.027+1.3)*13+Math.sin(z*.063)*3.5}
function H(x,z){
  // The mountain ends at a reachable 2500m summit rather than rising forever.
  const zz=Math.max(z,SUMMIT_Z),f=-zz;
  const base=f>0? f*.22+Math.sin(f*.009)*6*Math.min(1,f/80) : f*.05;
  const d=x-pathX(zz), ad=Math.abs(d);
  const cross=.26*Math.sin(zz*.0065+.7)+.12;
  const side=d*cross+Math.pow(Math.max(0,ad-48),2)*.07;
  const n=fbm(x*.025,zz*.025)*9+fbm(x*.11,zz*.11)*1.3+fbm(x*.4,zz*.4)*.18+Math.max(0,fbm(x*.05+40,zz*.05)-.25)*7;
  const natural=base+side+n-streamCarve(x,zz);
  const plateau=clamp((SUMMIT_Z+58-z)/43,0,1)*clamp((22-Math.abs(x-pathX(SUMMIT_Z)))/13,0,1);
  return Math.min(SUMMIT_ALT/ALT_K,lerp(natural,SUMMIT_ALT/ALT_K,plateau));
}

