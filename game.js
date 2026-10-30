(() => {
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const atlas=new Image();atlas.src='sprites.png';
const W=960,H=540,T=40,COLS=24,ROWS=13;
const $=id=>document.getElementById(id);
const state={started:false,zone:'camp',x:5.5,y:6.5,dir:'down',hp:3,coins:0,stake:false,heard:false,tool:false,dialog:false,dialogQueue:[],step:0,inv:0,muted:false,keys:{},touch:{},lastMove:0,toastTimer:0,attack:0,attackCooldown:0,shake:0,particles:[],enemies:{},lastFrame:0,walkTime:0};
const zoneInfo={
 camp:{name:'Survey Camp',ground:'#b6a06a',seed:3,desc:'Canvas tents, supply crates, and the first survey marker.', exits:{right:{zone:'town',x:2.2,y:6.4,label:'TOWN',side:'right'},up:{zone:'ridge',x:12,y:10.5,label:'RIDGE',side:'up'}}},
 town:{name:'Laramie Tent Town',ground:'#9a875d',seed:7,desc:'A rough frontier settlement rises beside the old trail.',exits:{left:{zone:'camp',x:21.2,y:6.4,label:'CAMP',side:'left'},right:{zone:'railhead',x:2.2,y:6.5,label:'RAILHEAD',side:'right'},up:{zone:'ridge',x:13,y:10.5,label:'RIDGE',side:'up'}}},
 railhead:{name:'Railhead',ground:'#8e805c',seed:11,desc:'Iron rails cut across the prairie. The air hums faintly.',exits:{left:{zone:'town',x:21.2,y:6.4,label:'TOWN',side:'left'},up:{zone:'canyon',x:12,y:10.5,label:'CANYON',side:'up'}}},
 ridge:{name:'Medicine Bow Ridge',ground:'#777b62',seed:17,desc:'Wind scours the high ridge. A strange blue glimmer hangs over the rocks.',exits:{down:{zone:'camp',x:12,y:2.2,label:'CAMP',side:'down'},right:{zone:'canyon',x:2.2,y:6.4,label:'CANYON',side:'right'}}},
 canyon:{name:'Starfall Canyon',ground:'#88705b',seed:23,desc:'Black stone and old petroglyphs lead toward a buried mystery.',exits:{left:{zone:'ridge',x:21.2,y:6.4,label:'RIDGE',side:'left'},down:{zone:'railhead',x:12,y:2.2,label:'RAILHEAD',side:'down'},up:{zone:'well',x:12,y:10.5,label:'STAR-WELL',side:'up'}}},
 well:{name:'The Star-Well',ground:'#394a5a',seed:31,desc:'Beneath the prairie, something ancient answers the stars.',exits:{down:{zone:'canyon',x:12,y:2.2,label:'CANYON',side:'down'}}}
};
const objects={
 camp:[{x:4,y:3,type:'tent',name:'Survey Tent'},{x:8,y:4,type:'crate',name:'Supply Crate'},{x:7,y:8,type:'stake',name:'Survey Stake'},{x:14,y:4,type:'campfire',name:'Cold Campfire'},{x:17,y:8,type:'sign',name:'Trail Sign'}],
 town:[{x:5,y:4,type:'building',name:'Trading Post'},{x:11,y:7,type:'well',name:'Town Well'},{x:17,y:4,type:'building2',name:'Telegraph Office'},{x:7,y:9,type:'person',name:'Martha the Storekeeper'},{x:17,y:8,type:'sign',name:'Town Notice'}],
 railhead:[{x:5,y:4,type:'train',name:'Steam Engine'},{x:13,y:8,type:'crate',name:'Freight Crate'},{x:18,y:4,type:'sign',name:'Rail Notice'},{x:8,y:8,type:'person',name:'Rail Foreman'}],
 ridge:[{x:6,y:4,type:'rock',name:'Split Boulder'},{x:16,y:7,type:'shrine',name:'Star Marking'},{x:11,y:3,type:'sign',name:'Ridge Marker'}],
 canyon:[{x:5,y:4,type:'rock',name:'Black Stone'},{x:17,y:5,type:'shrine',name:'Ancient Marking'},{x:12,y:8,type:'well',name:'Sealed Star-Well'},{x:7,y:9,type:'sign',name:'Carved Warning'}],
 well:[{x:12,y:6,type:'portal',name:'The Voice'},{x:7,y:4,type:'shrine',name:'Star Glyph'},{x:17,y:8,type:'chest',name:'Old Survey Cache'}]
};
function save(){try{localStorage.setItem('laramie-kickbutt-save',JSON.stringify({zone:state.zone,x:state.x,y:state.y,hp:state.hp,coins:state.coins,stake:state.stake,heard:state.heard,tool:state.tool}));}catch(e){}}
function load(){try{const s=JSON.parse(localStorage.getItem('laramie-kickbutt-save')||'null');if(s)Object.assign(state,s);}catch(e){}}
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2200)}
function beep(freq=440,dur=.09,type='sine',vol=.035){if(state.muted)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const a=beep.ac||(beep.ac=new AC());if(a.state==='suspended')a.resume();const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+dur);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+dur);}catch(e){}}
function startMusic(){if(state.muted||startMusic.running)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const a=beep.ac||(beep.ac=new AC());if(a.state==='suspended')a.resume();startMusic.running=true;const master=a.createGain();master.gain.value=.012;master.connect(a.destination);const notes=[146.83,174.61,220,196,146.83,130.81,164.81,196];let ix=0;const playBar=()=>{if(state.muted||!startMusic.running)return;const root=notes[ix%notes.length];[root,root*1.25,root*1.5].forEach((f,j)=>{const o=a.createOscillator(),g=a.createGain();o.type=j===0?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,a.currentTime);g.gain.linearRampToValueAtTime(j===0?.24:.12,a.currentTime+.7);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+3.4);o.connect(g);g.connect(master);o.start();o.stop(a.currentTime+3.5)});ix++;};playBar();startMusic.timer=setInterval(playBar,3600);startMusic.master=master;}catch(e){}} 
function stopMusic(){startMusic.running=false;if(startMusic.timer)clearInterval(startMusic.timer);startMusic.timer=null;if(startMusic.master){try{startMusic.master.gain.setTargetAtTime(.0001,beep.ac.currentTime,.15)}catch(e){}}}
function sfx(name){if(name==='step')beep(120,.025,'triangle',.008);if(name==='talk'){beep(520,.07);setTimeout(()=>beep(660,.09),80)}if(name==='item'){beep(620,.1);setTimeout(()=>beep(880,.15),90)}if(name==='hurt')beep(100,.2,'sawtooth',.04);if(name==='portal'){[220,330,440,660].forEach((f,i)=>setTimeout(()=>beep(f,.25,'sine',.025),i*100))}}
function openDialog(title,txt,after){state.dialog=true;state.dialogAfter=after||null;$('dialog-title').textContent=title;$('dialog-text').textContent=txt;$('dialog').classList.remove('hidden');}
function closeDialog(){if(!state.dialog)return;state.dialog=false;$('dialog').classList.add('hidden');if(state.dialogAfter){const f=state.dialogAfter;state.dialogAfter=null;f();}}
function nearby(){return (objects[state.zone]||[]).map(o=>({...o,d:Math.hypot(o.x+.5-state.x,o.y+.5-state.y)})).filter(o=>o.d<1.25).sort((a,b)=>a.d-b.d)[0]}
function solid(tx,ty){if(tx<0||ty<0||tx>=COLS||ty>=ROWS)return true;const z=state.zone; // clear trail corridors at screen edges
 if(tx===0||tx===COLS-1||ty===0||ty===ROWS-1){
  const exits=zoneInfo[z].exits;
  if(tx===0&&exits.left&&Math.abs(ty-6)<=1)return false;
  if(tx===COLS-1&&exits.right&&Math.abs(ty-6)<=1)return false;
  if(ty===0&&exits.up&&Math.abs(tx-12)<=1)return false;
  if(ty===ROWS-1&&exits.down&&Math.abs(tx-12)<=1)return false;
  return true;
 }
 // obstacles: gentle scattered rocks/brush; leave central trails clear
 const seed=zoneInfo[z].seed;
 if(((tx*7+ty*11+seed*3)%31===0)&&!(Math.abs(tx-12)<3||Math.abs(ty-6)<2))return true;
 const obs=(objects[z]||[]).filter(o=>['tent','crate','building','building2','train','rock','shrine','well','portal','chest'].includes(o.type));
 return obs.some(o=>Math.abs(o.x-tx)<1&&Math.abs(o.y-ty)<1);
}
function move(dx,dy,dt=16){if(!state.started||state.dialog||!$('map-card').classList.contains('hidden'))return;const speed=3.25*(dt/1000);let nx=state.x+dx*speed,ny=state.y+dy*speed;if(dx)state.dir=dx<0?'left':'right';if(dy)state.dir=dy<0?'up':'down';if(!solid(Math.floor(nx),Math.floor(ny))){state.x=nx;state.y=ny;state.step++;state.walkTime+=dt;if(state.walkTime>210){sfx('step');state.walkTime=0;}}checkExit();}
function checkExit(){const z=zoneInfo[state.zone].exits;let e=null;if(state.x<.62)e=z.left;if(state.x>COLS-.62)e=z.right;if(state.y<.62)e=z.up;if(state.y>ROWS-.62)e=z.down;if(e){state.zone=e.zone;state.x=e.x;state.y=e.y;state.inv=12;sfx('portal');toast('TRAIL OPEN: '+zoneInfo[state.zone].name);$('location').textContent=zoneInfo[state.zone].name;save();}}
function interact(){if(state.dialog){closeDialog();return}if(!state.started)return;const o=nearby();if(!o){toast('Nothing nearby. Follow the gold trail markers to travel.');return}sfx('talk');
 if(o.type==='sign'){openDialog(o.name,signText());return}
 if(o.type==='stake'){if(!state.stake){state.stake=true;state.coins+=3;sfx('item');openDialog('SURVEY STAKE','You set the brass survey stake into the prairie soil. The compass needle swings north — then points toward the mountains.\\n\\nObjective complete: Find the survey stake.\\nReward: 3 brass tokens.',()=>{save();updateHud()});}else openDialog('SURVEY STAKE','Your stake is secure. The needle still trembles when turned toward the Star-Well.');return}
 if(o.type==='person'){let msg=state.zone==='town'?'Martha: “Rail crews have been hearing a singing sound from the canyon. Not wind. Not a train. A voice.”':'Foreman: “The rails hum after sundown. Keep your eyes on the ridgeline, surveyor.”';openDialog(o.name,msg);return}
 if(o.type==='shrine'){if(!state.heard){state.heard=true;state.coins+=2;sfx('item');openDialog('ANCIENT STAR MARKING','The carving is older than any map. When you touch it, a clear tone rings from deep underground. You feel the survey compass pull toward the canyon.\\n\\nYou found 2 brass tokens.',()=>{save();updateHud()});}else openDialog(o.name,'Three stars, one circle, a line descending beneath the earth. The mark seems to answer your compass.');return}
 if(o.type==='chest'){if(!state.tool){state.tool=true;state.coins+=5;sfx('item');openDialog('SURVEY CACHE','Inside: a sturdy survey hammer and five brass tokens. It might help you break fragile mineral seams.\\n\\nTool acquired: Survey Hammer.',()=>{save();updateHud()});}else openDialog('SURVEY CACHE','Only dust and a few scraps of old paper remain.');return}
 if(o.type==='portal'||o.type==='well'){if(state.zone==='canyon'&&!state.stake){openDialog('THE SEALED STAR-WELL','The stone lid is locked by three iron pins. Your survey stake may help you align the old mechanism. Explore camp first.');}else{state.heard=true;sfx('portal');openDialog('THE VOICE BELOW','A sound blooms inside your bones — a chord too large for any instrument. The darkness opens onto a field of stars.\\n\\n“Surveyor,” it says, “you have measured the land. Now measure the sky.”\\n\\nThe mystery is only beginning.');}return}
 if(o.type==='campfire'){openDialog('COLD CAMPFIRE','Ashes, a blackened kettle, and a ring of stones. Someone left in a hurry.');return}
 openDialog(o.name,'Weathered by wind and time, this object holds a little of the frontier’s story.');
}
function signText(){const z=state.zone;if(z==='camp')return 'TRAIL BOARD\\n→ EAST: Laramie Tent Town\\n↑ NORTH: Medicine Bow Ridge\\n\\nLook for the gold-edged gaps in the map border. Walk through them to travel.';if(z==='town')return 'LARAMIE TENT TOWN\\n← WEST: Survey Camp\\n→ EAST: Railhead\\n↑ NORTH: Medicine Bow Ridge\\n\\nAsk the storekeeper about the singing canyon.';if(z==='railhead')return 'UNION PACIFIC RAILHEAD\\n← WEST: Tent Town\\n↑ NORTH: Starfall Canyon\\n\\nThe rails sing when the wind comes from the mountains.';if(z==='ridge')return 'MEDICINE BOW RIDGE\\n↓ SOUTH: Survey Camp\\n→ EAST: Starfall Canyon\\n\\nThree stars mark the old path.';if(z==='canyon')return 'STARFALL CANYON\\n← WEST: Ridge Trail\\n↓ SOUTH: Railhead\\n↑ NORTH: The Star-Well\\n\\nThe well is sealed. Find the survey stake at camp.';return 'THE STAR-WELL\\n↓ SOUTH: Starfall Canyon\\n\\nThe stars are not above you anymore.'}
function useTool(){
 if(!state.started||state.dialog||state.attackCooldown>0)return;
 state.attack=.24;state.attackCooldown=.34;state.shake=.12;
 sfx('slash');
 const dir={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[state.dir]||[0,1];
 const foes=enemyList();let hit=false;
 foes.forEach(e=>{const vx=e.x-state.x,vy=e.y-state.y,along=vx*dir[0]+vy*dir[1],side=Math.abs(vx*dir[1]-vy*dir[0]);if(along>.05&&along<1.35&&side<.72){e.hp--;e.flash=.18;e.x+=dir[0]*.24;e.y+=dir[1]*.24;hit=true;burst(e.x*T+T/2,e.y*T+T/2,'#f7d779',9);if(e.hp<=0){e.dead=true;state.coins++;toast('Enemy defeated · +1 brass');sfx('item');save();updateHud()}else sfx('hurt')}});
 if(!hit){burst(state.x*T+T/2+dir[0]*24,state.y*T+T/2+dir[1]*24,'#dcecff',5);if(state.tool){const o=nearby();if(o&&o.type==='rock'){state.coins++;toast('You chip a brass token from the mineral seam!');save();updateHud()}else toast('Your survey hammer rings across the prairie.')} }
}
function enemyList(){if(!state.enemies[state.zone]){const spots={ridge:[[9,7],[18,5]],canyon:[[8,5],[15,9],[19,3]],well:[[5,7],[18,5]]};state.enemies[state.zone]=(spots[state.zone]||[]).map((p,i)=>({x:p[0],y:p[1],homeX:p[0],homeY:p[1],hp:2,phase:i*2,flash:0,dead:false,hitWait:0}));}return state.enemies[state.zone].filter(e=>!e.dead)}
function burst(x,y,color,n=7){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=35+Math.random()*115;state.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.28+Math.random()*.28,max:.56,color});}}
function updateCombat(dt){const sec=dt/1000;state.attack=Math.max(0,state.attack-sec);state.attackCooldown=Math.max(0,state.attackCooldown-sec);state.shake=Math.max(0,state.shake-sec);state.particles=state.particles.filter(p=>p.life>0);state.particles.forEach(p=>{p.life-=sec;p.x+=p.vx*sec;p.y+=p.vy*sec;p.vy+=70*sec});if(!state.started||state.dialog)return;enemyList().forEach(e=>{e.phase+=sec*2;e.flash=Math.max(0,e.flash-sec);e.hitWait=Math.max(0,e.hitWait-sec);const d=Math.hypot(state.x-e.x,state.y-e.y);if(d<4.3&&d>1.0){const dx=(state.x-e.x)/d,dy=(state.y-e.y)/d,nx=e.x+dx*sec*.52,ny=e.y+dy*sec*.52;if(!solid(Math.floor(nx),Math.floor(ny))){e.x=nx;e.y=ny}}if(d<.78&&e.hitWait<=0&&state.inv<=0){state.hp=Math.max(0,state.hp-1);state.inv=.9;e.hitWait=1.1;state.shake=.22;burst(state.x*T+20,state.y*T+20,'#ff8a72',10);sfx('hurt');updateHud();if(state.hp===0){state.hp=3;state.zone='camp';state.x=5.5;state.y=6.5;toast('You were rescued and returned to Survey Camp.');save();updateHud()}}});state.inv=Math.max(0,state.inv-sec)}
function sfx(name){if(name==='slash'){beep(240,.07,'sawtooth',.025);setTimeout(()=>beep(520,.06,'triangle',.018),35)}if(name==='step')beep(120,.025,'triangle',.008);if(name==='talk'){beep(520,.07);setTimeout(()=>beep(660,.09),80)}if(name==='item'){beep(620,.1);setTimeout(()=>beep(880,.15),90)}if(name==='hurt')beep(100,.2,'sawtooth',.04);if(name==='portal'){[220,330,440,660].forEach((f,i)=>setTimeout(()=>beep(f,.25,'sine',.025),i*100))}}
function updateHud(){$('health').textContent='♥ '.repeat(state.hp).trim()+' '+ '♡ '.repeat(3-state.hp).trim();$('coins').textContent='◇ '+state.coins;$('location').textContent=zoneInfo[state.zone].name;$('objective').textContent=!state.stake?'Find the survey stake near camp':!state.heard?'Follow the compass to the Starfall Canyon':!state.tool?'Explore the Star-Well for the survey cache':'Reach the Star-Well and uncover the voice';}
function mapOpen(){if(!state.started)return;const list=$('map-list');list.innerHTML='';Object.entries(zoneInfo).forEach(([k,v])=>{const d=document.createElement('div');d.className='map-item'+(k===state.zone?' current':'');d.innerHTML='<b>'+v.name+'</b><small>'+(k===state.zone?'YOU ARE HERE':v.desc)+'</small>';list.appendChild(d)});$('map-card').classList.remove('hidden')}
function drawGround(){
 const z=zoneInfo[state.zone];
 const zoneTile=state.zone==='well'?6:state.zone==='canyon'?4:state.zone==='ridge'?3:state.zone==='railhead'?7:state.zone==='town'?1:0;
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   let tile=zoneTile;
   // Organic terrain variation, with a central dusty path to guide the player
   const n=(x*37+y*71+z.seed*19)%23;
   if(state.zone==='well'&&(n===0||n===7))tile=5;
   else if(state.zone==='ridge'&&(n===0||n===6||n===13))tile=7;
   else if(state.zone==='canyon'&&(n===0||n===10))tile=3;
   else if((state.zone==='camp'||state.zone==='town'||state.zone==='railhead')&&(n===0||n===9))tile=2;
   if(Math.abs(y-6)<=1 && x>1 && x<COLS-2)tile=8+((x+y)%4);
   if(Math.abs(x-12)<=1 && y>1 && y<ROWS-2 && (state.zone==='camp'||state.zone==='town'||state.zone==='railhead'||state.zone==='ridge'||state.zone==='canyon'))tile=8+((x+y+1)%4);
   if(atlas.complete&&atlas.naturalWidth){ctx.drawImage(atlas,(tile%8)*32,Math.floor(tile/8)*32,32,32,x*T,y*T,T,T);}
   else {ctx.fillStyle=z.ground;ctx.fillRect(x*T,y*T,T,T);}
 }
 // Add small grass tufts / pebbles on top for a layered, less repetitive world
 for(let i=0;i<60;i++){
   const x=((i*97+z.seed*13)%W),y=((i*61+z.seed*17)%H);
   if(state.zone!=='well'&&((i+z.seed)%3===0)){
     ctx.fillStyle=state.zone==='ridge'?'#d2c18b99':'#e6d09299';
     ctx.fillRect(x,y,2,3);ctx.fillRect(x+2,y-2,2,3);
   }else if(state.zone==='well'&&i%2===0){ctx.fillStyle='#67e6ff88';ctx.fillRect(x,y,2,2);}
 }
}
function drawTrail(){const z=zoneInfo[state.zone];ctx.save();ctx.strokeStyle=state.zone==='well'?'#5bd7ec':'#d9b35d';ctx.lineWidth=4;ctx.setLineDash([8,9]);ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(12*T+T/2,H/2);ctx.lineTo(W/2,H/2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 Object.values(z.exits).forEach(e=>{let x,y;if(e.side==='left'){x=0;y=6*T}else if(e.side==='right'){x=W;y=6*T}else if(e.side==='up'){x=12*T;y=0}else{x=12*T;y=H}ctx.fillStyle='#24372f';if(e.side==='left'||e.side==='right')ctx.fillRect(x===0?0:W-4,y-T/2,4,T*2);else ctx.fillRect(x-T/2,y===0?0:H-4,T,4);ctx.strokeStyle='#f6d577';ctx.lineWidth=4;ctx.beginPath();if(e.side==='left'){ctx.moveTo(0,y-T/2);ctx.lineTo(0,y+T/2)}if(e.side==='right'){ctx.moveTo(W,y-T/2);ctx.lineTo(W,y+T/2)}if(e.side==='up'){ctx.moveTo(x-T/2,0);ctx.lineTo(x+T/2,0)}if(e.side==='down'){ctx.moveTo(x-T/2,H);ctx.lineTo(x+T/2,H)}ctx.stroke();ctx.fillStyle='#152027dd';ctx.fillRect(e.side==='left'?8:e.side==='right'?W-105:e.side==='up'?x-45:x-45,e.side==='up'?8:e.side==='down'?H-29:y-12,e.side==='left'||e.side==='right'?94:90,22);ctx.fillStyle='#ffe29a';ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.fillText('↗ '+e.label,e.side==='left'?55:e.side==='right'?W-58:x,e.side==='up'?24:e.side==='down'?H-13:y+4);});ctx.restore();}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function drawObject(o){
 const x=o.x*T+T/2,y=o.y*T+T/2;
 const spriteMap={tent:[0,3],building:[1,3],building2:[1,3],train:[2,3],well:[3,3],chest:[4,3],campfire:[5,3],sign:[6,3],portal:[7,3],stake:[6,3],crate:[4,3],rock:[5,2],shrine:[7,3],person:[Math.floor((state.step/10)%8),4]};
 if(o.type==='stake'){
   ctx.fillStyle='#4a3323';ctx.fillRect(x-2,y-17,4,30);ctx.fillStyle='#e8d18a';ctx.fillRect(x-7,y-15,14,5);ctx.fillStyle='#84603b';ctx.fillRect(x-12,y+10,24,4);
 }else if(o.type==='rock'){
   const sp=spriteMap.rock;ctx.drawImage(atlas,sp[0]*32,sp[1]*32,32,32,x-20,y-20,40,40);
 }else if(o.type==='person'){
   const sp=spriteMap.person;if(atlas.complete&&atlas.naturalWidth)ctx.drawImage(atlas,sp[0]*32,sp[1]*32,32,32,x-20,y-20,40,40);
 }else{
   const sp=spriteMap[o.type]||[4,3];
   if(atlas.complete&&atlas.naturalWidth)ctx.drawImage(atlas,sp[0]*32,sp[1]*32,32,32,x-20,y-20,40,40);
 }
 if(o.type==='portal'||o.type==='well'){
   ctx.save();ctx.globalAlpha=.25+Math.sin(state.step*.08)*.12;ctx.fillStyle='#6beaff';ctx.beginPath();ctx.ellipse(x,y+2,25,28,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 if(Math.hypot(o.x+.5-state.x,o.y+.5-state.y)<1.5){ctx.fillStyle='#fff0b6';ctx.font='12px monospace';ctx.textAlign='center';ctx.fillText(o.name.toUpperCase(),x,y-27)}
}
function drawEnemies(){enemyList().forEach(e=>{const x=e.x*T+T/2,y=e.y*T+T/2;ctx.save();ctx.translate(x,y+Math.sin(e.phase*3)*2);ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,14,13,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=e.flash>0?'#fff3c4':'#4d3440';ctx.fillRect(-10,-9,20,19);ctx.fillStyle='#b86b5b';ctx.fillRect(-8,-15,16,8);ctx.fillStyle='#ffe9b0';ctx.fillRect(-6,-7,3,3);ctx.fillRect(4,-7,3,3);ctx.fillStyle='#211d27';ctx.fillRect(-5,2,10,3);ctx.fillStyle='#e6b65c';ctx.fillRect(-9,-19,18,3);ctx.fillStyle='#b8e0d0';ctx.fillRect(-9,-19,18*(e.hp/2),3);ctx.restore()})}
function drawParticles(){state.particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3)});ctx.globalAlpha=1}
function drawPlayer(){
 const x=state.x*T+T/2,y=state.y*T+T/2;
 const moving=!!(state.keys.ArrowLeft||state.keys.ArrowRight||state.keys.ArrowUp||state.keys.ArrowDown||state.keys.w||state.keys.a||state.keys.s||state.keys.d||state.touch.left||state.touch.right||state.touch.up||state.touch.down);
 let frame=moving?Math.floor(state.step/2)%8:0;
 const row=5;
 ctx.save();
 if(atlas.complete&&atlas.naturalWidth){
   // Flip the sprite for left-facing movement; walking frames alternate leg positions.
   if(state.dir==='left'){ctx.translate(x+20,y-20);ctx.scale(-1,1);ctx.drawImage(atlas,frame*32,row*32,32,32,0,0,40,40);}
   else ctx.drawImage(atlas,frame*32,row*32,32,32,x-20,y-20,40,40);
 }else{
   rect(x-10,y+11,8,10,'#423128');rect(x+3,y+11,8,10,'#423128');rect(x-11,y-2,22,17,'#426b68');rect(x-10,y-9,20,11,'#c9a36d');rect(x-13,y-14,26,7,'#7d5636');
 }
 if(state.inv>0&&Math.floor(state.inv*18)%2===0)ctx.globalAlpha=.45;if(state.attack>0){ctx.save();ctx.translate(x,y);const a={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[state.dir]||Math.PI/2;ctx.rotate(a);ctx.strokeStyle='#fff0bd';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,0,34,-.85,.85);ctx.stroke();ctx.strokeStyle='#9edbe5';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,40,-.7,.7);ctx.stroke();ctx.restore()}
 ctx.restore();
}
function draw(){ctx.save();if(state.shake>0)ctx.translate((Math.random()-.5)*state.shake*34,(Math.random()-.5)*state.shake*26);drawGround();
 // Trees and scrub are placed consistently at the map edges, keeping the exits readable.
 if(state.zone!=='well'){
   const treeSpots=state.zone==='ridge'?[[2,2],[5,9],[19,3],[21,9],[8,2]]:state.zone==='canyon'?[[2,3],[3,9],[20,3],[21,9]]:[[2,2],[2,10],[21,2],[21,10],[9,2],[18,10]];
   treeSpots.forEach((p,i)=>{if(atlas.complete&&atlas.naturalWidth){const col=i%3;ctx.drawImage(atlas,col*32,2*32,32,32,p[0]*T-2,p[1]*T-5,44,44)}});
 }
 drawTrail();(objects[state.zone]||[]).forEach(drawObject);drawEnemies();drawParticles(); // ambient dust and glow
 for(let i=0;i<18;i++){let x=((i*113+state.step*.35)%W),y=(i*79+Math.sin(state.step*.02+i)*12)%H;rect(x,y,2,2,state.zone==='well'?'#7ce8ff66':'#fff0bd55')}
 if(state.zone==='well'){const g=ctx.createRadialGradient(W/2,H/2,30,W/2,H/2,430);g.addColorStop(0,'#45cbe51a');g.addColorStop(1,'#02070caa');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
 drawPlayer();ctx.fillStyle='#0c1717aa';ctx.fillRect(0,0,W,28);ctx.fillStyle='#f5e5b8';ctx.font='14px monospace';ctx.textAlign='left';ctx.fillText(zoneInfo[state.zone].name.toUpperCase(),14,19);ctx.textAlign='right';ctx.fillStyle='#e5c16d';ctx.fillText('SURVEY LOG  /  '+(state.stake?'STAKE SECURED':'FIELDWORK'),W-14,19);ctx.restore();}
let last=0;function frame(t){const dt=Math.min(40,t-last||16);let dx=0,dy=0;if(state.keys.ArrowLeft||state.keys.a||state.touch.left)dx=-1;if(state.keys.ArrowRight||state.keys.d||state.touch.right)dx=1;if(state.keys.ArrowUp||state.keys.w||state.touch.up)dy=-1;if(state.keys.ArrowDown||state.keys.s||state.touch.down)dy=1;if(dx&&dy){dx*=.707;dy*=.707}if(dx||dy)move(dx,dy,dt);updateCombat(dt);draw();last=t;requestAnimationFrame(frame)}
function start(){state.started=true;$('title-screen').classList.add('hidden');beep(440,.12);startMusic();updateHud();save();openDialog('PROLOGUE · THE NIGHT THE RAILS SANG',`October, 1889. A storm gathers over the Medicine Bow.

Three nights running, the Union Pacific rails have sung after midnight. Last night, a surveyor followed the sound into the dark — and did not return.

You have been sent to find him. But the compass in your pocket is pointing somewhere no map has ever marked.`,()=>{toast('Find the survey stake. The gold trail marks exits.');});}
document.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'){closeDialog();$('map-card').classList.add('hidden');return}if(e.key===' '||e.key==='Enter'){interact();return}if(e.key.toLowerCase()==='x'){useTool();return}state.keys[e.key]=true;state.keys[e.key.toLowerCase()]=true});
document.addEventListener('keyup',e=>{state.keys[e.key]=false;state.keys[e.key.toLowerCase()]=false});
document.querySelectorAll('[data-dir]').forEach(b=>{const d=b.dataset.dir;b.addEventListener('pointerdown',e=>{e.preventDefault();state.touch[d]=true;b.setPointerCapture(e.pointerId)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>state.touch[d]=false))});
$('interactBtn').addEventListener('pointerdown',e=>{e.preventDefault();interact()});$('attackBtn').addEventListener('pointerdown',e=>{e.preventDefault();useTool()});$('startBtn').addEventListener('click',start);$('dialog-close').addEventListener('click',closeDialog);$('dialog-next').addEventListener('click',closeDialog);$('mapBtn').addEventListener('click',mapOpen);$('map-close').addEventListener('click',()=>$('map-card').classList.add('hidden'));$('journalBtn').addEventListener('click',()=>openDialog('FIELD JOURNAL','Survey stake: '+(state.stake?'secured':'not yet found')+'\\nStar marking: '+(state.heard?'heard the tone':'not yet discovered')+'\\nSurvey hammer: '+(state.tool?'in your pack':'not found')+'\\n\\nTip: signs explain nearby routes. Walk into the gold-edged openings at the border to change areas.'));$('soundBtn').addEventListener('click',()=>{state.muted=!state.muted;$('soundBtn').textContent=state.muted?'♫ MUTED':'♫ SOUND';if(state.muted){stopMusic()}else{beep(660,.12);if(state.started)startMusic();}});
canvas.addEventListener('pointerdown',e=>{if(!state.started)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;if(y>H*.73)interact();else if(x<W*.25)state.touch.left=true;else if(x>W*.75)state.touch.right=true;});canvas.addEventListener('pointerup',()=>{state.touch.left=state.touch.right=false});
load();updateHud();requestAnimationFrame(frame);
})();