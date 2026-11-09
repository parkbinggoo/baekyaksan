/* ================= UTIL ================= */
const $ = id => document.getElementById(id);
$('rankBtn').addEventListener('click',()=>{renderRankGuide();$('rankPanel').classList.remove('hide')});
$('rankClose').addEventListener('click',()=>$('rankPanel').classList.add('hide'));
$('rankPanel').addEventListener('pointerdown',e=>{if(e.target===$('rankPanel'))$('rankPanel').classList.add('hide')});
addEventListener('keydown',e=>{if(e.code==='Escape')$('rankPanel').classList.add('hide')});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function rngOf(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function pickW(table, keys, r, boost){
  let tot=0; const ws=keys.map(k=>{let w=table[k].w; if(table[k].rar>=4) w*=boost; tot+=w; return w});
  let x=r*tot; for(let i=0;i<keys.length;i++){x-=ws[i]; if(x<=0) return keys[i]} return keys[keys.length-1];
}
function mixHex(a,b,t){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);
  const r=Math.round(lerp(pa>>16,pb>>16,t)),g=Math.round(lerp(pa>>8&255,pb>>8&255,t)),bl=Math.round(lerp(pa&255,pb&255,t));
  return '#'+((1<<24)|(r<<16)|(g<<8)|bl).toString(16).slice(1)}
