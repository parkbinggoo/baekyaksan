/* ---------- 계곡(물길) ---------- */
function sX1(z){return pathX(z)-26+Math.sin(z*.017)*9}
function sX2(z){return pathX(z)+30+Math.sin(z*.013+2)*11}
function streamD(x,z){return Math.min(Math.abs(x-sX1(z)),Math.abs(x-sX2(z)))}
function streamCarve(x,z){let c=0;for(const sx of [sX1(z),sX2(z)]){const d=x-sx;c+=1.7*Math.exp(-d*d/12)+1.6*Math.exp(-d*d/110)}return c}
/* ---------- 서식 환경 ---------- */
function canopyAt(x,z){const alt=H(x,z)*ALT_K;const patch=vn(x*.035+3,z*.035-5);return clamp(.75+patch*.9,.08,1)*clamp(1-(alt-1200)/1450,.035,1)}
function envAt(x,z,c){
  const alt=H(x,z)*ALT_K,ds=streamD(x,z);
  const moist=clamp(Math.exp(-ds*ds/260)*1.05+vn(x*.02+50,z*.02-20)*.35+.22,0,1);
  let rock=false,inRock=false;for(const k of (c&&c.rocks)||[]){const d=Math.hypot(x-k.x,z-k.z)-k.r;if(d<.35)inRock=true;else if(d<1.8)rock=true}
  return{alt,light:1-canopyAt(x,z),moist,ds,rock,inRock,pine:clamp(.55+alt/2500,.55,.95)};
}
function fitOf(sp,e){
  if(sp.onTree)return 0;
  const[a0,a1]=sp.alt;let f=clamp((e.alt-a0+120)/240,0,1)*clamp((a1-e.alt+120)/240,0,1);if(!f)return 0;
  const L=e.light;f*=sp.L==='sun'?Math.pow(L,1.6):sp.L==='shade'?Math.pow(1-L,1.6):clamp(1-Math.abs(L-.45)*1.7,.05,1);
  const m=e.moist;
  if(sp.W==='water')return(e.ds>.9&&e.ds<2.6)?f*1.2:0;
  if(e.ds<1.9)return 0;
  f*=sp.W==='dry'?clamp(1.15-m*1.3,0,1):sp.W==='moist'?m*m*1.3:sp.W==='wet'?clamp(1-(e.ds-1.4)/7,0,1):clamp(1-Math.abs(m-.45)*1.4,.1,1);
  if(sp.rock)f*=e.rock?1.6:0;else if(e.rock)f*=.6;
  if(sp.pine)f*=e.pine*1.2;if(sp.oak)f*=(1-e.pine)*2.2;
  return f;
}
