/* ---------- five-star resource migration: preserve slot counts and habitats ---------- */
function rareSlotSeed(id,cycle){let h=2166136261;const str=id+'#'+cycle;
 for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);
 return h>>>0;
}
function relocateRareInChunk(c){
 const cx=c.cx,cz=c.cz,trees=c.trees||[],rocks=c.rocks||[];
 for(const it of c.items){
   const info=itemInfo(it.type),m=it.mesh,cycle=rareMoves.get(it.id)?.cycle||0;
   if(!info||info.rar!==5||!cycle||!m)continue;
   const r=rngOf(rareSlotSeed(it.id,cycle)),sp=SPI[it.type],origin=m.position.clone();
   let candidate=null;
   const minMove=(it.rock||sp?.rock||it.type==='seogi')?1.1:
     (sp?.onTree||it.tree||it.type==='sanghwang'||['songi','neungi','kkotsongi'].includes(it.type))?1.4:3.5;
   const accept=(x,y,z,score,hostRock=null)=>{
     if(x<cx*CH+1||x>(cx+1)*CH-1||z<cz*CH+1||z>(cz+1)*CH-1)return;
     if(Math.hypot(x-origin.x,z-origin.z)<minMove||streamD(x,z)<2.3)return;
     if(Math.hypot(x-pathX(24),z-24)<5)return;
     if(c.items.some(other=>other!==it&&other.mesh&&Math.hypot(x-other.mesh.position.x,z-other.mesh.position.z)<1.5))return;
     if(!candidate||score>candidate.score)candidate={x,y,z,score,hostRock};
   };
   if(it.kind==='honey'){
     for(let k=0;k<100;k++){
       const t=trees[Math.floor(r()*trees.length)];if(!t)break;
       if(!honeyTreeHabitat(it.type,t,H(t.x,t.z)*ALT_K))continue;
       const a=r()*Math.PI*2,d=.57*t.s+.92;
       const x=t.x+Math.cos(a)*d,z=t.z+Math.sin(a)*d;
       if(c.rocks.some(rock=>Math.hypot(x-rock.x,z-rock.z)<resourceRockClearance(rock)+.3))continue;
       accept(x,H(x,z)+.04,z,1+r()*.2);
     }
     if(it.type==='nativeHoney')for(let k=0;k<45;k++){
       const rock=rocks[Math.floor(r()*rocks.length)];if(!rock||rock.r<2.6)continue;
       const alt=H(rock.x,rock.z)*ALT_K;if(alt<190||alt>1450)continue;
       const a=r()*Math.PI*2,d=resourceRockClearance(rock)+.75;
       const x=rock.x+Math.cos(a)*d,z=rock.z+Math.sin(a)*d;
       accept(x,H(x,z)+.04,z,1+r()*.2);
     }
   }else if(it.rock||sp?.rock||it.type==='seogi'){
     // Lichens and rock-dwelling herbs must remain attached to a real rock.
     const atop=!!it.rock;
     const options=rocks.filter(k=>k.mesh&&(!atop||k.climbable)&&
       (!sp||(k.groundY*ALT_K>=sp.alt[0]&&k.groundY*ALT_K<=sp.alt[1])));
     for(let k=0;k<85&&options.length;k++){
       const rock=options[Math.floor(r()*options.length)],a=r()*Math.PI*2;
       const rr=atop?rock.r*(.16+r()*.52):rock.r+.5+r()*.8;
       const x=rock.x+Math.cos(a)*rr,z=rock.z+Math.sin(a)*rr;
       const e=envAt(x,z,c);if(it.type==='seogi'&&e.moist<.25)continue;
       if(sp&&sp.W==='moist'&&e.moist<.17)continue;
       if(!atop&&e.inRock)continue;
       accept(x,atop?rock.topY-.04:H(x,z)-.02,z,1+r()*.2+(rock!==it.rock?.3:0),atop?rock:null);
     }
   }else if(sp?.onTree||it.tree||it.type==='sanghwang'||['songi','neungi','kkotsongi'].includes(it.type)){
     const kind=sp?.onTree==='pine'||['songi','kkotsongi'].includes(it.type)?'pine':
       sp?.onTree==='oak'||it.type==='neungi'?'oak':null;
     const options=trees.filter(t=>t.s>.42&&(!kind||t.kind===kind));
     for(let k=0;k<90&&options.length;k++){
       const t=options[Math.floor(r()*options.length)],a=r()*Math.PI*2;
      const trunkR=(t.kind==='pine'?.20:.24)*t.s + .06;
      const rr=sp?.onTree ? trunkR+.02 : (it.type==='sanghwang'||it.type==='norugung') ? trunkR+.05 : .6+r()*1.35;
      const x=t.x+Math.sin(a)*rr,z=t.z+Math.cos(a)*rr;
       const e=envAt(x,z,c);
       if(sp&&(e.alt<sp.alt[0]||e.alt>sp.alt[1]))continue;
       if(it.type==='songi'&&(e.alt<180||e.alt>1500||e.moist>.75))continue;
       if(it.type==='neungi'&&(e.alt<200||e.alt>1500||e.moist<.2))continue;
       if(it.type==='kkotsongi'&&(e.alt<200||e.alt>1500||e.moist<.15))continue;
       const y=sp?.onTree?t.y+Math.min(2.1*t.s,2.5):
         it.type==='sanghwang'?t.y+.65+r()*.65:H(x,z)+.04;
       accept(x,y,z,1+r()*.2+(t!==it.tree?.2:0));
     }
   }else{
     // Select another real, unoccupied spot satisfying the original species'
     // altitude, light, water and rock-edge habitat suitability.
     for(let k=0;k<100;k++){
       const x=cx*CH+2+r()*(CH-4),z=cz*CH+2+r()*(CH-4);
       const e=envAt(x,z,c);if(e.inRock||Math.abs(x-pathX(z))>53)continue;
       const fit=sp?fitOf(sp,e):0;
       if(fit<.025)continue;
       accept(x,H(x,z)-.02,z,fit+r()*.01);
     }
   }
   if(!candidate){
     // An isolated habitat may have only one suitable rock/tree. Pick a
     // different angle nearby instead of inventing a new species or slot.
     const x=origin.x+(r()<.5?-1:1)*(3.5+r()*1.5),z=origin.z+(r()<.5?-1:1)*(3.5+r()*1.5);
     if(!it.rock&&Math.floor(x/CH)===cx&&Math.floor(z/CH)===cz){
       const e=envAt(x,z,c);if(!e.inRock&&(!sp||fitOf(sp,e)>.012))candidate={x,y:H(x,z)-.02,z};
     }
   }
   if(candidate){
     m.position.set(candidate.x,candidate.y,candidate.z);
     if(it.rock&&candidate.hostRock)it.rock=candidate.hostRock;
     if(it.tree)it.tree=null; // moved item no longer linked to its old host
   }
 }
}
