/* ================= RADIO ================= */
const RADIO_PHRASES=[
 ['위치 공유',()=>{const {lat,lon,alt}=myGeo();return `여기는 ${cleanNick(save.nick)||'산객'}! 현재 ${dms(lat,'N','S')} · ${dms(lon,'E','W')}, 해발 ${alt}m입니다. 위치 확인 부탁합니다.`}],
 ['희귀 발견',()=>`여기는 ${cleanNick(save.nick)||'산객'}! ${lastFound&&Date.now()-lastFound.t<90000?'방금 귀한 약초를 발견했습니다!':'이 근처에 희귀한 약초가 있을지도 모르겠습니다.'} 주변을 살펴봐 주세요!`],
 ['산짐승 조심',()=>`산객 여러분, 주변에 야생동물이 보입니다. 소리 지르거나 가까이 가지 말고 조심해서 이동하세요!`],
 ['인사',()=>`산객 여러분, 안녕하세요! 오늘도 안전한 산행 되시길 바랍니다. 좋은 약초 만나세요!`]
];
const radioLogLines=[];let radioToastTimer=0;
function showRadioLine(name,msg){const l={name,msg,at:Date.now()};radioLogLines.unshift(l);if(radioLogLines.length>12)radioLogLines.pop();
 const log=$('radioLog');log.replaceChildren();for(const a of radioLogLines){const div=document.createElement('div');div.className='radioLine';div.textContent=`${a.name}: ${a.msg}`;log.appendChild(div)}
 const pop=$('radioToast');pop.textContent=`📻 ${name}: ${msg}`;pop.classList.remove('hide');pop.style.opacity='1';
 clearTimeout(radioToastTimer);radioToastTimer=setTimeout(()=>{pop.style.opacity='0';setTimeout(()=>pop.classList.add('hide'),420)},6000);
}
$('radioBtn').onclick=()=>{$('radioPanel').classList.toggle('hide')};$('radioClose').onclick=()=>$('radioPanel').classList.add('hide');
function sendAccidentRadio(isRock,isBees=false){
 const name=cleanNick(save.nick)||'산객';
 const msg=isBees?'치지직… 벌집을 잘못 건드려 벌에 쏘였다! 난 괜찮다. 잠시 쉬고 가겠다… 치지직':isRock?'치지직… 바위에서 떨어졌다! 난 괜찮다. 잠시 쉬고 가겠다… 치지직':'치지직… 멧돼지에게 당했다! 난 괜찮다. 잠시 회복하겠다… 치지직';
 showRadioLine(name,msg);
 if(netJoined)netPublish('radio',{name,msg});
}
for(const [title,getMessage] of RADIO_PHRASES){const b=document.createElement('button');b.textContent=title;b.onclick=()=>{
 const msg=getMessage();showRadioLine(cleanNick(save.nick)||'나',msg);if(netJoined)netPublish('radio',{name:cleanNick(save.nick),msg});
 $('radioPanel').classList.add('hide');};$('radioChoices').appendChild(b)}
