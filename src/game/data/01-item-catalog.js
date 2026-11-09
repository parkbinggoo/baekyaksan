/* ================= DATA ================= */
const HERBS = {
  sansam:  {name:'산삼',  w:1.6, need:6, rar:5, root:true,  desc:'깊은 그늘에서 수십 년을 버틴 뿌리. 붉은 열매가 신호다. 심봤다!'},
  deodeok: {name:'더덕',  w:8,   need:4, rar:3, root:true,  desc:'덩굴을 살짝 당기면 쌉싸름한 향이 먼저 올라온다.'},
  doraji:  {name:'도라지',w:9,   need:4, rar:3, root:true,  desc:'보랏빛 별꽃 아래 하얀 뿌리. 목이 칼칼할 때 달여 먹던 약초.'},
  dunggule:{name:'둥굴레',w:7,   need:4, rar:3, root:true,  desc:'휘어진 줄기 아래 종처럼 매달린 꽃. 뿌리는 구수한 차가 된다.'},
  gomchwi: {name:'곰취',  w:9,   need:3, rar:2, root:false, desc:'곰이 즐겨 먹는다는 넓은 잎. 쌈 한 장에 산 냄새가 가득하다.'},
  chamchwi:{name:'참취',  w:10,  need:3, rar:2, root:false, desc:'나물 중의 으뜸. 데쳐서 들기름에 무치면 봄이 입안에 핀다.'},
  gosari:  {name:'고사리',w:12,  need:3, rar:1, root:false, desc:'주먹 쥔 새순. 봄 산이 가장 먼저 내미는 인사.'},
  dallae:  {name:'달래',  w:11,  need:3, rar:1, root:true,  desc:'알싸한 작은 알뿌리. 간장에 송송 썰어 넣으면 달래장.'},
  naengi:  {name:'냉이',  w:13,  need:3, rar:1, root:true,  desc:'언 땅을 뚫고 나온 첫 향기. 된장국에 한 줌.'},
  ssuk:    {name:'쑥',    w:14,  need:3, rar:1, root:false, desc:'단군 신화의 그 풀. 떡에도, 국에도, 뜸에도.'},
};
const MUSH = {
  pyogo:    {name:'표고버섯',  w:10, need:3, rar:2, desc:'참나무 둥치에서 자란 갈색 갓. 갈라진 흰 무늬가 상품의 증거.'},
  neutari:  {name:'느타리버섯',w:10, need:3, rar:1, desc:'겹겹이 포개진 회색 부채. 결대로 찢어 볶으면 쫄깃하다.'},
  mogi:     {name:'목이버섯',  w:9,  need:3, rar:1, desc:'나무의 귀를 닮은 검은 버섯. 꼬들꼬들한 식감.'},
  yeongji:  {name:'영지버섯',  w:4,  need:5, rar:4, desc:'옻칠한 듯 윤이 나는 붉은 갓. 예부터 불로초라 불렸다.'},
  sanghwang:{name:'상황버섯',  w:1.6,need:6, rar:5, desc:'뽕나무에 말발굽처럼 붙은 노란 버섯. 산에서도 만나기 어렵다.'},
};
const HERB_KEYS = Object.keys(HERBS), MUSH_KEYS = Object.keys(MUSH);
const COMMON_MUSH_KEYS=MUSH_KEYS.slice();
Object.assign(MUSH,{
 songi:{name:'송이',w:.16,need:6,rar:5,hab:'마른 소나무 숲의 낙엽층',desc:'소나무 뿌리 주변의 낙엽층에서 드물게 만나는 향버섯.'},
 neungi:{name:'능이',w:.23,need:5,rar:5,hab:'참나무 숲의 낙엽과 흙',desc:'넓은잎나무 숲 바닥에서 자라는 어두운 깔때기 형태의 버섯.'},
 norugung:{name:'노루궁뎅이버섯',w:.38,need:4,rar:4,hab:'습한 활엽수 고목',desc:'죽은 활엽수에 둥글게 매달린 흰 버섯.'},
 kkotsongi:{name:'꽃송이버섯',w:.28,need:5,rar:5,hab:'소나무·침엽수의 밑동',desc:'소나무 밑동 근처에 꽃송이처럼 갈라진 덩어리가 돋는다.'},
 seogi:{name:'석이버섯',w:.35,need:5,rar:5,hab:'습한 큰 바위·절벽 표면',desc:'큰 바위의 표면에 얇고 검은 조각처럼 붙어 있는 지의류.'},
 ipsae:{name:'잎새버섯',w:.35,need:5,rar:4,hab:'참나무 고목의 뿌리 주변',desc:'나무 밑에서 여러 겹의 갈색 부채가 피어난다.'}
});
MUSH_KEYS.push('songi','neungi','norugung','kkotsongi','seogi','ipsae');
// Four playable forest-honey resources.  The floral source (acacia/chestnut/mixed)
// and the bee species (native honey) describe different aspects of honey.
const HONEY={
 mixedHoney:{name:'잡화꿀',rar:2,need:4,care:1.15,part:'벌집의 꿀',hab:'여러 야생화가 피는 낮은 숲 가장자리',desc:'여러 야생화에서 모은 꿀. 꽃이 많은 숲 가장자리의 작은 벌집에서 얻는다.'},
 acaciaHoney:{name:'아카시아꿀',rar:3,need:5,care:1.25,part:'벌집의 꿀',hab:'아까시나무가 자라는 낮은 산기슭',desc:'흔히 아카시아꿀이라 부르지만, 실제 밀원은 아까시나무 꽃이다.'},
 chestnutHoney:{name:'밤꿀',rar:4,need:6,care:1.35,part:'벌집의 꿀',hab:'밤나무 주변의 숲 가장자리',desc:'밤나무 꽃에서 모은 진한 풍미의 꿀. 벌집을 매우 조심스럽게 다뤄야 한다.'},
 nativeHoney:{name:'토종벌꿀',rar:5,need:7,care:1.5,part:'벌집의 꿀',hab:'오래된 나무 밑과 낮은 산의 큰 바위 틈',desc:'토종벌의 자연 벌집에서 얻는 매우 귀한 꿀. 다른 벌꿀과 달리 벌의 종류를 기준으로 부르는 이름이다.'}
};
const HONEY_KEYS=Object.keys(HONEY);
const BAG_LEVELS=[10,20,30,40,50,60,70,80,90,100,110];
// Ten sequential upgrades, beginning at 50,000 won; each tier costs about 1.7x the previous one.
const BAG_UPGRADE_COST={20:50000,30:85000,40:145000,50:246000,60:418000,70:711000,80:1209000,90:2055000,100:3494000,110:5940000};
const BAG_MAX=BAG_LEVELS[BAG_LEVELS.length-1],BAG_STAGE_COUNT=BAG_LEVELS.length-1;
const LANTERN_PRICES={2:200000,3:500000};
const LANTERN_SPECS={
  1:{range:26,angle:.62,intensity:1.3,decay:1.4,aim:8},
  2:{range:37,angle:.78,intensity:1.75,decay:1.25,aim:11.5},
  3:{range:49,angle:.88,intensity:2.15,decay:1.12,aim:15}
};
function lanternLevel(){return Number.isInteger(save.lanternLevel)&&save.lanternLevel>=1&&save.lanternLevel<=3?save.lanternLevel:1}
function bagLimit(){return BAG_LEVELS.includes(save.bagCap)?save.bagCap:10}
const MARKET_PRICE={
  sansam:95000,deodeok:2200,doraji:1400,dunggule:1200,gomchwi:1100,chamchwi:850,gosari:850,dallae:650,naengi:550,ssuk:400,
  pyogo:950,neutari:650,mogi:800,yeongji:11500,sanghwang:15500,
  acorn:250,chestnut:500,pinecone:150,wildberry:650,ginkgo:350
};
Object.assign(MARKET_PRICE,{
 kkulpul:1200,oipul:1800,eonggeong:1400,miyeokchwi:2400,baechohyang:2200,sanbakha:1300,kkothyangyu:1900,soetteugi:1200,
 seokchangpo:4800,doldanpung:5400,bawichwi:4600,gorancho:7800,bawichaesong:5100,aegigirin:5300,
 gyeousari:4800,gyeousolip:800,gobawiikke:1300,jat:1200,
 gureumgukhwa:3800,dolyangji:2400,bawitteokpul:2600,siromi:4300,
 songi:36000,neungi:24000,norugung:16000,kkotsongi:23000,seogi:28000,ipsae:14000,
 mixedHoney:2800,acaciaHoney:5500,chestnutHoney:13500,nativeHoney:42000
});
const won=v=>Math.round(v).toLocaleString('ko-KR')+'원';
const discoveredCount=()=>Object.keys(save.known||{}).length;
