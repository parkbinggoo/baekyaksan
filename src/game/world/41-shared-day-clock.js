/* ================= 공동 게임 시간 : KST 20분 = 산속 하루 ================= */
const KST_OFFSET=9*60*60*1000;
const GAME_DAY_MS=20*60*1000;
let gameMin=0,dayNo=1;
function syncKST(){
  const kstMs=Date.now()+KST_OFFSET;
  gameMin=((kstMs%GAME_DAY_MS)+GAME_DAY_MS)%GAME_DAY_MS/GAME_DAY_MS*1440;
  dayNo=Math.floor(kstMs/GAME_DAY_MS)+1;
}
syncKST();
function phaseOf(h){if(h>=20||h<4)return'밤';if(h<6)return'새벽';if(h<10)return'아침';if(h<17)return'낮';return'저녁'}
const SKYK=[[0,'#0b1126','#18213d',0,.17,1],[4,'#0f1730','#212a47',0,.18,1],[5.2,'#38406a','#d39a8c',.1,.28,.6],[6.3,'#8fb2d4','#f2d6b0',.45,.45,.1],[8,'#a5c6dc','#eef0e6',.7,.55,0],
  [12,'#94bfe2','#eef2ea',.8,.6,0],[16.5,'#9cc0dc','#f0e8d4',.7,.55,0],[18.3,'#6a78b0','#f0a676',.4,.42,.1],[19.6,'#2e3666','#94687a',.12,.26,.5],[21,'#0e1430','#1c2442',0,.18,1],[24,'#0b1126','#18213d',0,.17,1]];
const SKYNOW={top:'',bot:'',sun:0,hemi:0,night:0};
function skyAtHour(h){let i=0;while(i<SKYK.length-2&&h>=SKYK[i+1][0])i++;const a=SKYK[i],b=SKYK[i+1],k=(h-a[0])/(b[0]-a[0]);
  SKYNOW.top=mixHex(a[1],b[1],k);SKYNOW.bot=mixHex(a[2],b[2],k);SKYNOW.sun=lerp(a[3],b[3],k);SKYNOW.hemi=lerp(a[4],b[4],k);SKYNOW.night=lerp(a[5],b[5],k);return SKYNOW}
function clockText(){const h=Math.floor(gameMin/60)%24,m=Math.floor(gameMin%60);return `${h<12?'오전':'오후'} ${h%12===0?12:h%12}:${String(m).padStart(2,'0')}`}
