/* ================= UTIL ================= */
const $ = id => document.getElementById(id);
function openRankMenu(tab='level'){
  $('settingsPanel').classList.add('hide');$('settingsBtn').setAttribute('aria-expanded','false');
  $('rankPanel').classList.remove('hide');showRankTab(tab);
}
function showRankTab(tab='level'){
  const special=tab==='special';
  $('rankLevelContent').classList.toggle('hide',special);
  $('rankSpecialContent').classList.toggle('hide',!special);
  $('rankLevelTab').classList.toggle('active',!special);
  $('rankSpecialTab').classList.toggle('active',special);
  $('rankLevelTab').setAttribute('aria-selected',String(!special));
  $('rankSpecialTab').setAttribute('aria-selected',String(special));
  if(special)renderSpecialTitlePanel();else renderRankGuide();
}
function closeRankMenu(){$('rankPanel').classList.add('hide')}
$('rankBtn').addEventListener('click',()=>openRankMenu('level'));
$('rankLevelTab').addEventListener('click',()=>showRankTab('level'));
$('rankSpecialTab').addEventListener('click',()=>showRankTab('special'));
$('rankClose').addEventListener('click',closeRankMenu);
$('rankPanel').addEventListener('pointerdown',e=>{if(e.target===$('rankPanel'))closeRankMenu()});
addEventListener('keydown',e=>{if(e.key==='Escape')closeRankMenu()});
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
