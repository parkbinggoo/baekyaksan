const TENT_CAPACITY=2;
function tentPeople(t){
 if(!t)return [];
 const now=Date.now(),players=[];
 if(inTent&&activeTent?.id===t.id)players.push({id:myId,joined:netJoinTime,name:cleanNick(save.nick)||'나',rank:playerRank,color:save.color|0,self:true});
 for(const [id,p] of peerSeen)if(p.tent===t.id&&now-p.seen<11000){
   players.push({id,joined:p.joined,name:p.name||others.get(id)?.nick||'산객',rank:p.rank||1,color:p.color|0,self:false});
 }
 return players.sort((a,b)=>a.joined-b.joined||a.id.localeCompare(b.id));
}
function tentVacancies(t){return Math.max(0,TENT_CAPACITY-tentPeople(t).length)}
function reconcileTentOccupants(){
 if(!inTent||!activeTent||tentSwitching)return;
 const entrants=tentPeople(activeTent);
 if(entrants.slice(0,TENT_CAPACITY).some(p=>p.id===myId))return;
 toast('이 텐트는 먼저 들어온 두 산객이 사용 중입니다');
 changeTent(false,null);
}
function tentSetVisible(enter,t){
 if(enter)closeCampPanel();
 inTent=enter; activeTent=enter?t:null; target=null; pending=null;joy.x=joy.y=0;
 $('tentView').classList.toggle('hide',!enter);
 $('sellPanel').classList.add('hide');$('bagUpgradePanel').classList.add('hide');$('lanternUpgradePanel').classList.add('hide');selectedSellKey='';
 if(enter){tentMat.canvas.color.setHex(t.palette.cloth);tentMat.back.color.setHex(t.palette.door);$('tentStatus').textContent=`⛺ 백약산 쉼터 · 해발 ${t.alt.toLocaleString()}m`;updateTentMoney();refreshLanternUpgrade();buildSellGrid();syncTentChestButton();}
 $('hud').classList.toggle('hide',enter);
 if(IS_TOUCH){$('joy').classList.toggle('hide',enter);$('jumpBtn').classList.toggle('hide',enter)}
 $('labels').style.visibility=enter?'hidden':'visible';
 $('radioPanel').classList.add('hide');
 if(enter){$('bag').classList.add('hide');$('mapView').classList.add('hide')}
 setPlaceAudio(enter);
 sendPresence(true);updateTentSeats(.25);
}
let tentSwitching=false;
function changeTent(enter,t){
 if(tentSwitching||enter===inTent)return;
 if(enter&&(!t||Date.now()<faintUntil))return;
 if(enter&&netJoined&&tentVacancies(t)<=0){toast('이 텐트는 현재 2명으로 가득 찼습니다');return}
 tentSwitching=true;playTentZip(enter);
 const overlay=$('tentTransition');overlay.classList.add('on');
 setTimeout(()=>{
   if(enter&&netJoined&&tentVacancies(t)<=0){tentSwitching=false;overlay.classList.remove('on');toast('이 텐트는 현재 2명으로 가득 찼습니다');return}
   tentSetVisible(enter,t);
   setTimeout(()=>{overlay.classList.remove('on');setTimeout(()=>{tentSwitching=false;reconcileTentOccupants()},360)},90);
 },350);
}
function openTent(t){changeTent(true,t)}
function closeTent(){changeTent(false,null)}
function updateTentMoney(){$('tentCash').textContent='정산금 '+won(+save.won||0)}
