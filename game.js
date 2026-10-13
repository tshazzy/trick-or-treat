(function(){
'use strict';
const V3=THREE.Vector3,TAU=Math.PI*2;
let seed=1997;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
const rr=(a,b)=>a+rnd()*(b-a),pick=a=>a[(rnd()*a.length)|0];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const sm=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const lerpAngle=(a,b,t)=>{const d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI;return a+d*t;};
const isTouch=window.matchMedia('(pointer:coarse)').matches||('ontouchstart' in window);
let store={};try{store=JSON.parse(localStorage.getItem('tot97')||'{}')||{};}catch(e){store={};}
const save=()=>{try{localStorage.setItem('tot97',JSON.stringify(store));}catch(e){}};

/* ---------- renderer ---------- */
const canvas=document.getElementById('view');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);
const scene=new THREE.Scene();
const FOG=0x30255e;
scene.background=new THREE.Color(FOG);
scene.fog=new THREE.Fog(FOG,15,74);
const camera=new THREE.PerspectiveCamera(60,1,0.1,700);
const lam=o=>new THREE.MeshLambertMaterial(o);
const bas=o=>new THREE.MeshBasicMaterial(o);

/* ---------- textures ---------- */
function T(w,h,fn,repeat){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');fn(g,w,h);
  const t=new THREE.CanvasTexture(c);const pot=(w&(w-1))===0&&(h&(h-1))===0;
  if(pot){t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;}else{t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;}
  t.magFilter=THREE.LinearFilter;t.anisotropy=4;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;}return t;}
const T2=(w,h,fn)=>T(w*2,h*2,(g)=>{g.scale(2,2);fn(g,w,h);});
const R=Math.random;
function noise(g,w,h,[r,gg,b],v){const d=g.createImageData(w,h);for(let i=0;i<w*h;i++){const n=(R()-.5)*v;d.data[i*4]=r+n;d.data[i*4+1]=gg+n;d.data[i*4+2]=b+n;d.data[i*4+3]=255;}g.putImageData(d,0,0);}
const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
const ell=(g,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);};
const tri=(g,a,b,c,d,e,f)=>{g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.lineTo(e,f);g.closePath();};
const P4=a=>a[(R()*a.length)|0];

const TX={};
TX.grass=T(128,128,(g)=>{noise(g,128,128,[74,58,40],26);for(let i=0;i<1100;i++)rect(g,R()*128|0,R()*128|0,1,2+(R()*4|0),P4(['#8a6a3a','#47361f','#9b7b45','#5e4a2c','#6a6a36']));for(let i=0;i<80;i++)rect(g,R()*128|0,R()*128|0,3,2,P4(['#a8361f','#c4561c','#7a2414','#b8742a']));},true);
TX.road=T(128,128,(g)=>{noise(g,128,128,[56,52,62],18);for(let i=0;i<3;i++)rect(g,R()*100,R()*100,20+R()*20,14+R()*16,'rgba(86,82,94,.55)');
  g.strokeStyle='rgba(18,16,24,.85)';g.lineWidth=1;for(let i=0;i<8;i++){g.beginPath();let x=R()*128,y=R()*128;g.moveTo(x,y);for(let k=0;k<7;k++){x+=R()*16-8;y+=R()*16-8;g.lineTo(x,y);}g.stroke();}
  for(let i=0;i<14;i++)rect(g,R()*128|0,R()*128|0,3,2,P4(['#8a3a1a','#a8561c','#6a2a14']));},true);
TX.siding=T(128,128,(g)=>{for(let r=0;r<8;r++){rect(g,0,r*16,128,13,'#f0eadf');rect(g,0,r*16+10,128,3,'#dfd8cb');rect(g,0,r*16+13,128,1,'#c4bdb1');rect(g,0,r*16+14,128,2,'#9d968c');}for(let i=0;i<240;i++)rect(g,R()*128|0,R()*128|0,2,1,'rgba(120,110,100,.18)');},true);
TX.brick=T(128,128,(g)=>{rect(g,0,0,128,128,'#b4a690');for(let r=0;r<16;r++)for(let c=-1;c<5;c++){const x=c*32+(r%2?16:0);const v=P4(['#9a4a34','#8a3e2c','#a85a3c','#7e3626','#9e5240']);rect(g,x+1,r*8+1,30,6,v);rect(g,x+1,r*8+6,30,1,'rgba(0,0,0,.18)');}},true);
TX.board=T(128,128,(g)=>{noise(g,128,128,[232,224,206],14);for(let x=0;x<128;x+=16){rect(g,x,0,3,128,'#c9bea6');rect(g,x+3,0,1,128,'#9d927c');}for(let i=0;i<40;i++)rect(g,R()*128|0,R()*128|0,1,10,'rgba(120,100,80,.2)');},true);
TX.stoneWall=T(128,128,(g)=>{rect(g,0,0,128,128,'#6a6470');for(let r=0;r<8;r++){let x=-(R()*10);while(x<128){const w=14+R()*16;const c=P4(['#c8c0b6','#b4ab9e','#d4ccc0','#a89f96','#bdb5ae']);g.fillStyle=c;g.beginPath();g.ellipse(x+w/2,r*16+8,w/2-1,7,0,0,TAU);g.fill();g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(x+w/2,r*16+11,w/2-2,3,0,0,TAU);g.fill();x+=w;}}},true);
TX.roof=T(128,128,(g)=>{rect(g,0,0,128,128,'#2a2c3a');for(let r=0;r<8;r++)for(let c=0;c<9;c++){const x=c*16-(r%2?8:0);const v=150+(R()*50|0);rect(g,x+1,r*16,15,14,`rgb(${v},${v},${v+8})`);rect(g,x+1,r*16+12,15,2,`rgba(0,0,0,.25)`);}},true);
TX.stone=T(64,64,(g)=>{noise(g,64,64,[100,96,104],22);for(let r=0;r<4;r++){rect(g,0,r*16,64,1,'#4a4652');for(let c=0;c<4;c++)rect(g,c*16+(r%2?8:0),r*16,1,16,'#4a4652');}},true);
TX.wood=T(64,64,(g)=>{noise(g,64,64,[150,128,104],16);for(let i=0;i<8;i++)rect(g,0,i*8,64,1,'#5e4a38');},true);
TX.bark=T(64,64,(g)=>{noise(g,64,64,[64,48,36],24);for(let i=0;i<22;i++)rect(g,R()*64|0,0,1+(R()*2|0),64,'rgba(20,12,8,.45)');},true);
TX.straw=T(64,64,(g)=>{noise(g,64,64,[196,160,80],30);for(let i=0;i<200;i++)rect(g,R()*64|0,R()*64|0,1,4,P4(['#e8c870','#9a7a30']));},true);
TX.water=T(64,64,(g)=>{noise(g,64,64,[60,80,140],22);g.strokeStyle='rgba(190,200,255,.35)';g.lineWidth=1;for(let i=0;i<10;i++){const y=R()*64;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(20,y-3,40,y+3,64,y);g.stroke();}},true);
TX.sparkle=T(64,64,(g)=>{for(let i=0;i<9;i++){const x=R()*64,y=R()*64;rect(g,x,y,2,1,'rgba(255,255,255,.9)');rect(g,x+0.5,y-0.5,1,2,'rgba(255,255,255,.6)');}},true);
TX.bandage=T(64,64,(g)=>{rect(g,0,0,64,64,'#e8e1ca');g.lineWidth=1.3;for(let y=-20;y<84;y+=6){g.strokeStyle=y%12?'#b5ab92':'#cbc2aa';g.beginPath();g.moveTo(0,y);g.lineTo(64,y+12);g.stroke();}for(let i=0;i<6;i++)rect(g,R()*64,R()*64,10,3,'rgba(255,255,255,.4)');},true);
TX.stripes=T(32,32,(g)=>{for(let y=0;y<32;y+=8){rect(g,0,y,32,4,'#c0202c');rect(g,0,y+4,32,4,'#18121c');}},true);
TX.crate=T(64,64,(g)=>{noise(g,64,64,[150,98,48],22);for(let i=0;i<4;i++)rect(g,0,i*16,64,2,'#5e3b1a');rect(g,0,0,64,6,'#4a2c12');rect(g,0,58,64,6,'#4a2c12');rect(g,0,0,6,64,'#4a2c12');rect(g,58,0,6,64,'#4a2c12');
  g.fillStyle='#e07a1c';ell(g,32,34,14,12);g.fill();rect(g,30,18,4,6,'#3a5a1a');g.fillStyle='#2a1406';tri(g,22,30,28,30,25,24);g.fill();tri(g,36,30,42,30,39,24);g.fill();g.beginPath();g.moveTo(22,38);g.quadraticCurveTo(32,46,42,38);g.quadraticCurveTo(32,41,22,38);g.fill();});
TX.taffy=T(64,32,(g)=>{rect(g,0,0,64,32,'#1f7fe0');rect(g,0,0,64,3,'#5fb6ff');rect(g,0,29,64,3,'#0f4f9a');
  g.strokeStyle='#ffffff';g.lineWidth=4;g.beginPath();g.moveTo(6,22);g.bezierCurveTo(20,4,30,30,42,12);g.bezierCurveTo(48,4,54,16,60,10);g.stroke();
  for(let i=0;i<5;i++){rect(g,0,i*7,4,4,'#9fd6ff');rect(g,60,i*7+3,4,4,'#9fd6ff');}
  g.fillStyle='#e8344a';ell(g,20,24,2,2);g.fill();ell(g,24,22,2,2);g.fill();ell(g,23,26,2,2);g.fill();});
TX.glow=T(32,32,(g)=>{const gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,32,32);});
TX.mist=T(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.8)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});
TX.shadow=T(32,32,(g)=>{const gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(0,0,0,.7)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,32,32);});
TX.pool=T(32,32,(g)=>{const gr=g.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'rgba(255,160,70,.55)');gr.addColorStop(.6,'rgba(200,110,50,.18)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,32,32);});
function jackTex(glow){return T(128,64,(g)=>{
  if(glow)rect(g,0,0,128,64,'#000');else{noise(g,128,64,[214,104,22],18);for(let x=0;x<128;x+=13)rect(g,x,0,2,64,'rgba(120,50,10,.5)');}
  g.fillStyle=glow?'#ffd24a':'#3a1404';
  tri(g,18,28,28,28,23,17);g.fill();tri(g,36,28,46,28,41,17);g.fill();tri(g,29,34,35,34,32,28);g.fill();
  g.beginPath();g.moveTo(14,38);g.quadraticCurveTo(32,56,50,38);g.lineTo(44,40);g.lineTo(41,44);g.lineTo(37,41);g.lineTo(32,46);g.lineTo(27,41);g.lineTo(23,44);g.lineTo(20,40);g.closePath();g.fill();});}
TX.jack=jackTex(false);TX.jackGlow=jackTex(true);
function windowTex(kind){return T2(64,64,(g)=>{
  const gr=g.createLinearGradient(0,0,0,64);gr.addColorStop(0,'#ffe0a8');gr.addColorStop(1,'#ffb070');g.fillStyle=gr;g.fillRect(0,0,64,64);
  g.fillStyle='rgba(255,236,232,.9)';g.fillRect(3,3,9,58);g.fillRect(52,3,9,58);
  g.fillStyle='#1a1018';
  if(kind==='cat'){ell(g,38,52,7,8);g.fill();ell(g,38,40,5,5);g.fill();tri(g,33,38,35,31,37,37);g.fill();tri(g,39,37,41,31,43,38);g.fill();g.lineWidth=3;g.strokeStyle='#1a1018';g.beginPath();g.moveTo(45,57);g.quadraticCurveTo(52,52,48,44);g.stroke();}
  if(kind==='witch'){g.lineWidth=2;g.strokeStyle='#1a1018';g.beginPath();g.moveTo(14,26);g.lineTo(42,16);g.stroke();tri(g,24,22,32,22,29,10);g.fill();tri(g,25,12,33,12,31,4);g.fill();tri(g,40,14,48,12,46,20);g.fill();
    ell(g,22,54,5,6);g.fill();ell(g,22,45,4,4);g.fill();tri(g,18,43,19,38,21,42);g.fill();tri(g,23,42,25,38,26,43);g.fill();}
  if(kind==='bats'){[[20,18],[38,26],[28,12],[44,40]].forEach(([x,y])=>{tri(g,x-6,y,x,y+3,x,y-1);g.fill();tri(g,x+6,y,x,y+3,x,y-1);g.fill();});}
  rect(g,0,0,64,3,'#f4efe6');rect(g,0,61,64,3,'#f4efe6');rect(g,0,0,3,64,'#f4efe6');rect(g,61,0,3,64,'#f4efe6');rect(g,31,0,2,64,'#f4efe6');rect(g,0,31,64,2,'#f4efe6');});}
TX.win={cat:windowTex('cat'),witch:windowTex('witch'),bats:windowTex('bats'),none:windowTex('none')};
function textTex(w,h,lines,{bg=null,fg='#2a1e14',font='bold 15px Georgia, serif',stroke=null}={}){return T2(w,h,(g)=>{if(bg)rect(g,0,0,w,h,bg);g.font=font;g.textAlign='center';g.textBaseline='middle';
  lines.forEach((l,i)=>{const y=h*(i+1)/(lines.length+1);if(stroke){g.lineWidth=3;g.strokeStyle=stroke;g.strokeText(l,w/2,y);}g.fillStyle=fg;g.fillText(l,w/2,y);});});}
TX.door=T2(32,64,(g)=>{rect(g,0,0,32,64,'#d9d2c6');[[5,5],[18,5],[5,20],[18,20]].forEach(([x,y])=>{rect(g,x,y,9,12,'#bfb7ab');rect(g,x+1,y+1,7,10,'#e4ddd2');});
  rect(g,4,35,24,26,'#3a3540');for(let y=36;y<60;y+=2)rect(g,4,y,24,1,'#4a4552');rect(g,24,31,3,3,'#c9a24a');});
TX.garage=T2(64,48,(g)=>{rect(g,0,0,64,48,'#e2dccf');for(let y=0;y<48;y+=12){rect(g,0,y,64,1,'#a59e92');rect(g,0,y+11,64,1,'#bdb6aa');}for(let x=0;x<64;x+=16)for(let y=2;y<48;y+=12)rect(g,x+2,y+1,12,8,'#d4cdc0');});
TX.pumpkinMan=T2(48,56,(g)=>{g.lineWidth=2;g.strokeStyle='#120a06';
  g.fillStyle='#e0601a';ell(g,24,32,19,15);g.fill();g.stroke();g.strokeStyle='#a63f10';g.lineWidth=1;for(const x of [16,24,32]){g.beginPath();g.moveTo(x,18);g.quadraticCurveTo(x+(x-24)*.4,32,x,46);g.stroke();}
  g.fillStyle='#120a06';tri(g,13,30,20,30,16.5,24);g.fill();tri(g,28,30,35,30,31.5,24);g.fill();g.beginPath();g.moveTo(12,36);g.quadraticCurveTo(24,48,36,36);g.quadraticCurveTo(24,41,12,36);g.fill();
  g.strokeStyle='#120a06';g.lineWidth=2;g.fillStyle='#d9b45a';ell(g,24,16,21,4);g.fill();g.stroke();g.fillRect(14,4,20,11);g.strokeRect(14,4,20,11);rect(g,14,10,20,3,'#7a2a1a');
  g.fillStyle='#b11a1a';tri(g,24,49,15,45,15,54);g.fill();tri(g,24,49,33,45,33,54);g.fill();});
TX.wallGhost=T2(40,48,(g)=>{g.lineWidth=2;g.strokeStyle='#120a06';g.fillStyle='#f2f0e6';g.beginPath();g.moveTo(8,44);g.lineTo(8,18);g.arc(20,18,12,Math.PI,0);g.lineTo(32,44);
  g.lineTo(28,40);g.lineTo(24,45);g.lineTo(20,40);g.lineTo(16,45);g.lineTo(12,40);g.closePath();g.fill();g.stroke();
  g.fillStyle='#120a06';ell(g,15,18,2,4);g.fill();ell(g,25,18,2,4);g.fill();ell(g,20,28,3,5);g.fill();});
TX.skeleton=T2(40,72,(g)=>{const bone='#efe8d4';g.lineWidth=1.5;g.strokeStyle='#120a06';g.fillStyle=bone;ell(g,20,12,9,10);g.fill();g.stroke();
  g.fillStyle='#120a06';ell(g,16,11,3,3.5);g.fill();ell(g,24,11,3,3.5);g.fill();rect(g,15,11,2,2,'#e02a2a');rect(g,23,11,2,2,'#e02a2a');g.fillStyle='#120a06';tri(g,19,17,21,17,20,14);g.fill();
  rect(g,14,18,12,3,bone);for(let x=15;x<26;x+=2)rect(g,x,18,1,3,'#120a06');rect(g,19,22,2,16,bone);
  g.strokeStyle=bone;g.lineWidth=2;for(const y of [25,28,31,34]){g.beginPath();g.moveTo(12,y+2);g.quadraticCurveTo(20,y-2,28,y+2);g.stroke();}
  g.beginPath();g.moveTo(11,25);g.lineTo(8,40);g.moveTo(29,25);g.lineTo(32,40);g.stroke();
  rect(g,14,54,3,16,bone);rect(g,23,54,3,16,bone);
  g.fillStyle='#c8341c';g.fillRect(5,38,30,17);g.strokeStyle='#120a06';g.lineWidth=1.5;g.strokeRect(5,38,30,17);
  g.font='bold 8px Arial, sans-serif';g.textAlign='center';g.fillStyle='#120a06';g.fillText('GO',20,45);g.fillText('AWAY',20,53);});
TX.cat=T2(48,40,(g)=>{const k='#0d0a10';g.strokeStyle=k;g.lineWidth=8;g.lineCap='round';g.beginPath();g.moveTo(10,37);g.quadraticCurveTo(22,2,34,37);g.stroke();
  g.lineWidth=3;g.beginPath();g.moveTo(10,30);g.quadraticCurveTo(0,20,6,6);g.stroke();
  g.fillStyle=k;ell(g,38,24,6,6);g.fill();tri(g,33,21,34,13,38,19);g.fill();tri(g,38,19,42,13,43,21);g.fill();
  rect(g,35,23,2,2,'#ffd23a');rect(g,40,23,2,2,'#ffd23a');});
TX.owl=T2(32,40,(g)=>{g.lineWidth=1.5;g.strokeStyle='#120a06';g.fillStyle='#5a3a22';ell(g,16,24,11,14);g.fill();g.stroke();tri(g,6,12,9,3,12,11);g.fill();tri(g,20,11,23,3,26,12);g.fill();
  g.fillStyle='#f08a1c';ell(g,11,17,5,5);g.fill();g.stroke();ell(g,21,17,5,5);g.fill();g.stroke();g.fillStyle='#120a06';ell(g,11,17,2,2);g.fill();ell(g,21,17,2,2);g.fill();
  g.fillStyle='#e8c03a';tri(g,14,21,18,21,16,25);g.fill();g.strokeStyle='#8a6a42';for(const y of [28,32,36])for(const x of [11,16,21]){g.beginPath();g.moveTo(x-2,y);g.lineTo(x,y+2);g.lineTo(x+2,y);g.stroke();}});
TX.witchSign=T2(48,64,(g)=>{rect(g,0,0,48,64,'#120a06');rect(g,3,3,42,58,'#b5221c');g.font='bold 9px Arial, sans-serif';g.textAlign='center';g.fillStyle='#120a06';g.fillText('1 HOUR',24,14);
  g.lineWidth=2;g.strokeStyle='#120a06';g.beginPath();g.moveTo(10,38);g.lineTo(38,30);g.stroke();tri(g,18,36,26,34,22,24);g.fill();tri(g,19,26,27,26,25,17);g.fill();
  g.font='bold 7px Arial, sans-serif';g.fillText('BROOM',24,48);g.fillText('PARKING',24,57);});
TX.banner=T2(128,32,(g)=>{rect(g,0,0,128,32,'#2a1430');
  g.font='bold 22px Impact, "Arial Black", sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=4;g.strokeStyle='#120a06';g.strokeText('HALLOWEEN',64,17);g.fillStyle='#ff6a1a';g.fillText('HALLOWEEN',64,17);
  g.fillStyle='#f2f0e6';ell(g,8,10,3,4);g.fill();ell(g,120,22,3,4);g.fill();g.fillStyle='#e0601a';ell(g,118,8,4,3);g.fill();ell(g,9,24,4,3);g.fill();});
function tombTex(kind){return T(128,128,(g)=>{noise(g,128,128,[150,146,156],26);g.textAlign='center';g.textBaseline='middle';
  const eng=(t,y,s)=>{g.font=`bold ${s}px Georgia, serif`;g.fillStyle='#d8d4de';g.fillText(t,65,y+1.5);g.fillStyle='#3e3a46';g.fillText(t,64,y);};
  if(kind==='rip'){g.fillStyle='#1a1418';tri(g,40,38,64,48,64,34);g.fill();tri(g,88,38,64,48,64,34);g.fill();eng('RIP',84,40);}
  else{g.fillStyle='#e8e4ec';ell(g,64,28,12,12);g.fill();g.fillStyle='#1a1418';ell(g,59,26,3,3);g.fill();ell(g,69,26,3,3);g.fill();eng('Trick',62,24);eng('or',84,20);eng('Treat',104,24);}});}
TX.tombRip=tombTex('rip');TX.tombTot=tombTex('tot');
for(const t of [TX.tombRip,TX.tombTot]){t.repeat.set(1/0.7,1/0.95);t.offset.set(0.5,0);}
TX.fence=T(64,64,(g)=>{g.strokeStyle='rgba(175,175,190,1)';g.lineWidth=1.4;for(let i=-64;i<128;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i+64,64);g.stroke();g.beginPath();g.moveTo(i+64,0);g.lineTo(i,64);g.stroke();}},true);
function faceTex(kind){return T(128,64,(g)=>{
  const skin={vampire:'#ebe0ea',witch:'#f2cba8',frank:'#8db36a',mummy:'#e8e1ca'}[kind];rect(g,0,0,128,64,skin);
  if(kind==='mummy'){g.lineWidth=1.3;for(let y=-10;y<70;y+=5){g.strokeStyle=y%10?'#b5ab92':'#cfc6ae';g.beginPath();g.moveTo(0,y);g.lineTo(128,y+6);g.stroke();}
    rect(g,14,26,36,9,'#2a2218');g.fillStyle='#ffd84a';ell(g,25,30.5,3,2.4);g.fill();ell(g,39,30.5,3,2.4);g.fill();return;}
  if(kind==='frank'){g.strokeStyle='#2a3a1a';g.lineWidth=1.2;g.beginPath();g.moveTo(18,16);g.lineTo(46,18);g.stroke();for(let x=20;x<46;x+=4){g.beginPath();g.moveTo(x,14);g.lineTo(x+1,20);g.stroke();}}
  g.fillStyle='rgba(225,110,120,.35)';ell(g,19,39,4,2.5);g.fill();ell(g,45,39,4,2.5);g.fill();
  const iris={vampire:'#8a1020',witch:'#2f8a3a',frank:'#3a2a1a'}[kind];
  for(const x of [25,39]){g.fillStyle='#fff';ell(g,x,31,3.8,4.6);g.fill();g.fillStyle=iris;ell(g,x+0.4,32,2.5,3.1);g.fill();g.fillStyle='#000';ell(g,x+0.4,32,1.2,1.6);g.fill();rect(g,x-1,29.5,1.5,1.5,'#fff');}
  g.strokeStyle=kind==='witch'?'#c4521c':'#1a1218';g.lineWidth=kind==='frank'?3:1.6;
  g.beginPath();if(kind==='vampire'){g.moveTo(20,24);g.lineTo(29,26.5);g.moveTo(44,24);g.lineTo(35,26.5);}else{g.moveTo(21,25);g.lineTo(29,25);g.moveTo(35,25);g.lineTo(43,25);}g.stroke();
  g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1;g.beginPath();g.arc(32,37,2,0.2,Math.PI-0.2);g.stroke();
  if(kind==='vampire'){g.strokeStyle='#8a1424';g.lineWidth=1.6;g.beginPath();g.arc(32,40,5,0.25,Math.PI-0.25);g.stroke();g.fillStyle='#fff';tri(g,28.5,43.5,30.5,43.5,29.5,47);g.fill();tri(g,33.5,43.5,35.5,43.5,34.5,47);g.fill();}
  if(kind==='witch'){g.strokeStyle='#8a2a2a';g.lineWidth=1.6;g.beginPath();g.arc(32,40,5,0.2,Math.PI-0.2);g.stroke();g.fillStyle='#b8682a';for(const [x,y] of [[20,36],[22,38],[18,38],[42,36],[44,38],[46,36]]){ell(g,x,y,0.7,0.7);g.fill();}}
  if(kind==='frank'){rect(g,26,43,12,1.6,'#1a2210');}});}

/* ---------- terrain ---------- */
const zr=x=>7*Math.sin(x*0.045),zrd=x=>0.315*Math.cos(x*0.045);
const edgeRise=x=>0.012*Math.max(0,Math.abs(x)-72)**2;
const rh=x=>1.0*Math.sin(x*0.031+0.8)+0.5*Math.sin(x*0.083)+edgeRise(x);
const base=(x,z)=>0.0035*z*z+edgeRise(x)+1.6*Math.sin(x*0.05+0.5)*Math.cos(z*0.06+0.3)+0.7*Math.sin(x*0.11+z*0.09)+0.35*Math.sin(x*0.23-z*0.19);
const roadDist=(x,z)=>Math.abs(z-zr(x))/Math.sqrt(1+zrd(x)**2);
const CREEKS=[z=>-35+5*Math.sin((z+7)*0.09)+1.5*Math.sin((z+7)*0.23),z=>35+5*Math.sin((z-7)*0.085)+1.5*Math.sin((z-7)*0.21)]
  .map(f=>({f,d:z=>(f(z+0.05)-f(z-0.05))/0.1}));
const creekDist=(c,x,z)=>Math.abs(x-c.f(z))/Math.sqrt(1+c.d(z)**2);

/* ---------- house configs (needed for terrain pads) ---------- */
const HOUSES=[
  {x:-62,s:1,num:'337',w:11,d:7,vols:[{x0:-5.5,x1:5.5,st:1,roof:'gable',pitch:2.2}],wall:'siding',color:0xe8d8bc,roofTint:0x8890b0,porch:'deck',doorX:0,garage:'right',win:['witch','cat'],deco:'pumpkinMan',dy:1.2,
    line:"“Full-size bars this year. Don't tell your friends.”"},
  {x:-62,s:-1,num:'340',w:8.5,d:9,vols:[{x0:-4.25,x1:4.25,st:0,roof:'aframe',pitch:6.6}],wall:'board',color:0x9a7656,roofTint:0x7a6a5a,porch:'deck',doorX:0,garage:'none',win:['bats','cat'],deco:'wallGhost',chimney:'back',dy:-0.4,
    line:"“Look at you! Take two, they're small.”"},
  {x:-13.5,s:1,num:'341',w:10,d:7,vols:[{x0:-5,x1:5,st:2,roof:'gable',pitch:2.4}],wall:'siding',color:0xe6d79a,roofTint:0x7a7a7a,porch:'portico',doorX:0,garage:'right',shutters:0x2f4a34,win:['cat','none','witch','bats'],deco:'pumpkinMan',chimney:'side',dy:2.0,
    line:"“Only one each. I'm counting.”"},
  {x:13.5,s:1,num:'345',w:12,d:7,vols:[{x0:-6,x1:0.5,st:1,roof:'gable',pitch:1.8},{x0:0.5,x1:6,st:2,roof:'front',pitch:2.6}],wall:'board',color:0xa9b494,roofTint:0x7a6452,porch:'stoop',doorX:-2.6,garage:'none',win:['bats','cat','none'],deco:'wallGhost',dy:1.0,
    line:"“Happy Halloween! Mind the creek, it's muddy tonight.”"},
  {x:-13.5,s:-1,num:'344',w:9,d:7,vols:[{x0:-4.5,x1:4.5,st:1,roof:'gable',pitch:4.2}],wall:'stoneWall',color:0xffffff,roofTint:0x6a5a7a,porch:'portico',doorX:0.4,garage:'none',win:['cat','witch'],deco:'pumpkinMan',chimney:'front',dy:-0.3,
    line:'“Nice costume! Did your mom make that?”'},
  {x:13.5,s:-1,num:'348',w:13,d:7,vols:[{x0:-6.5,x1:6.5,st:1,roof:'gable',pitch:1.7}],wall:'brick',color:0xffffff,roofTint:0x6a625a,porch:'wrap',doorX:-1,garage:'carport',win:['none','cat','bats'],deco:'wallGhost',dy:0.4,
    line:'“We ran out of the good stuff, sorry hon.”'},
  {x:62,s:1,num:'353',w:8,d:8,vols:[{x0:-4,x1:4,st:2,roof:'front',pitch:4.4}],wall:'siding',color:0xc9c2d8,roofTint:0x4e4860,porch:'wrap',doorX:-1.2,garage:'none',win:['none','none','cat'],deco:'pumpkinMan',chimney:'side',dy:2.6,
    line:'Nobody answers. A bowl on the step says TAKE ONE.'},
];
const PADS=[];
HOUSES.forEach(h=>{h.z=zr(h.x)-h.s*18;h.pad=rh(h.x)+h.dy;
  const gx=h.garage==='none'?3:7.5;const lx0=-(h.w/2+3),lx1=h.w/2+gx,lz0=-(h.d/2+3),lz1=h.d/2+6;
  const ax=h.x+h.s*lx0,bx=h.x+h.s*lx1,az=h.z+h.s*lz0,bz=h.z+h.s*lz1;
  PADS.push({cx:(ax+bx)/2,cz:(az+bz)/2,hw:Math.abs(bx-ax)/2,hd:Math.abs(bz-az)/2,y:h.pad});});
PADS.push({cx:52,cz:26,hw:9,hd:9,y:rh(52)+0.6});

function computeH(x,z){
  let h=base(x,z);const dr=roadDist(x,z);
  h=lerp(h,rh(x),1-sm(5,14,dr));
  for(const p of PADS){const dx=Math.max(Math.abs(x-p.cx)-p.hw,0),dz=Math.max(Math.abs(z-p.cz)-p.hd,0),d=Math.hypot(dx,dz);if(d<9)h=lerp(h,p.y,1-sm(0,9,d));}
  h=lerp(h,rh(x),1-sm(4.6,6,dr));
  for(const c of CREEKS){const dc=creekDist(c,x,z);if(dc<5)h-=1.5*(1-sm(1.1,4.6,dc));}
  return h;}
const GX0=-112,GZ0=-66,GNX=225,GNZ=133;
const HM=new Float32Array(GNX*GNZ);
for(let j=0;j<GNZ;j++)for(let i=0;i<GNX;i++)HM[j*GNX+i]=computeH(GX0+i,GZ0+j);
function gh(x,z){const fx=clamp(x-GX0,0,GNX-1.001),fz=clamp(z-GZ0,0,GNZ-1.001);const i=fx|0,j=fz|0,u=fx-i,v=fz-j;
  const a=HM[j*GNX+i],b=HM[j*GNX+i+1],c=HM[(j+1)*GNX+i],d=HM[(j+1)*GNX+i+1];return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;}
const waterY=(c,z)=>gh(c.f(z),z)+0.42;
const bridgeAt=x=>CREEKS.some(c=>Math.abs(x-c.f(zr(x)))<5.4);

/* ---------- static batching ---------- */
const STAT=new Map();
function stat(obj){obj.updateMatrixWorld(true);obj.traverse(m=>{if(!m.isMesh)return;
  const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrixWorld);
  if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  if(!STAT.has(m.material))STAT.set(m.material,[]);STAT.get(m.material).push(g);});}
function flushStatics(){for(const [mat,list] of STAT){let n=0;list.forEach(g=>n+=g.attributes.position.count);
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
  list.forEach(g=>{pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  geo.computeBoundingSphere();scene.add(new THREE.Mesh(geo,mat));}STAT.clear();}

/* ---------- world helpers ---------- */
const solids=[];const solid=b=>{solids.push(b);return b;};
function HT(o){const s=o.s,py=o.pad||0;const wx=x=>o.x+s*x,wz=z=>o.z+s*z;
  return{s,py,ry:s>0?0:Math.PI,wx,wz,p:(x,y,z)=>new V3(wx(x),py+y,wz(z)),gy:(x,z)=>gh(wx(x),wz(z))-py,
    box:(x0,x1,y0,y1,z0,z1)=>{const a=wx(x0),b=wx(x1),c=wz(z0),d=wz(z1);return{minX:Math.min(a,b),maxX:Math.max(a,b),minY:py+y0,maxY:py+y1,minZ:Math.min(c,d),maxZ:Math.max(c,d)};}};}
const WT=HT({x:0,z:0,s:1,pad:0});
function tileBox(geo,w,h,d,tile){const n=geo.attributes.normal,uv=geo.attributes.uv;for(let i=0;i<uv.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));let su,sv;
  if(ax>.5){su=d;sv=h;}else if(ay>.5){su=w;sv=d;}else{su=w;sv=h;}uv.setXY(i,uv.getX(i)*su/tile,uv.getY(i)*sv/tile);}}
const place=(m,t,x,y,z,ry=0)=>{m.position.copy(t.p(x,y,z));m.rotation.order='YXZ';m.rotation.y=t.ry+ry;return m;};
function sbox(t,mat,x0,x1,y0,y1,z0,z1,tile=0,seg=0){const w=x1-x0,h=y1-y0,d=z1-z0;
  const geo=seg?new THREE.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w/seg)),Math.max(1,Math.ceil(h/seg)),Math.max(1,Math.ceil(d/seg))):new THREE.BoxGeometry(w,h,d);
  if(tile)tileBox(geo,w,h,d,tile);const m=new THREE.Mesh(geo,mat);place(m,t,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2);stat(m);return m;}
function dbox(t,mat,x0,x1,y0,y1,z0,z1){const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),mat);place(m,t,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2);scene.add(m);return m;}
function splane(t,mat,x,y,z,w,h,ry=0){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);place(m,t,x,y,z,ry);stat(m);return m;}
function scyl(t,mat,x,y0,y1,z,r,seg=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,y1-y0,seg),mat);place(m,t,x,(y0+y1)/2,z);stat(m);return m;}
class Batch{constructor(geo,mat){this.geo=geo;this.mat=mat;this.items=[];}
  add(p,ry=0,s=1,c=null,rx=0){this.items.push({p:p.clone(),ry,rx,s:typeof s==='number'?new V3(s,s,s):s,c});}
  build(){if(!this.items.length)return null;const im=new THREE.InstancedMesh(this.geo,this.mat,this.items.length);const o=new THREE.Object3D();
    this.items.forEach((it,i)=>{o.position.copy(it.p);o.rotation.set(it.rx,it.ry,0,'YXZ');o.scale.copy(it.s);o.updateMatrix();im.setMatrixAt(i,o.matrix);if(it.c!==null)im.setColorAt(i,new THREE.Color(it.c));});
    if(im.instanceColor)im.instanceColor.needsUpdate=true;im.frustumCulled=false;scene.add(im);return im;}}
class Glow{constructor(color,size,opacity=1){this.c=color;this.s=size;this.o=opacity;this.pts=[];}add(p){this.pts.push(p.x,p.y,p.z);}
  build(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.pts,3));
    const p=new THREE.Points(g,new THREE.PointsMaterial({color:this.c,size:this.s,map:TX.glow,transparent:true,opacity:this.o,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(p);return p;}}
function ribbon(pts,width,mat,yoff,tileU,tileV,yfn){const P=[],U=[],I=[];let acc=0;
  for(let k=0;k<pts.length;k++){const [x,z]=pts[k];const [x0,z0]=pts[Math.max(0,k-1)],[x1,z1]=pts[Math.min(pts.length-1,k+1)];let dx=x1-x0,dz=z1-z0;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;const nx=-dz,nz=dx;
    if(k>0)acc+=Math.hypot(x-pts[k-1][0],z-pts[k-1][1]);
    for(const side of [-1,1]){const qx=x+nx*side*width/2,qz=z+nz*side*width/2;const y=(yfn?yfn(qx,qz,x,z):gh(qx,qz))+yoff;P.push(qx,y,qz);U.push((side+1)/2*width/tileU,acc/tileV);}
    if(k>0){const a=(k-1)*2;I.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();
  return new THREE.Mesh(g,mat);}

/* ---------- materials ---------- */
const M={
  road:lam({map:TX.road}),stone:lam({map:TX.stone}),wood:lam({map:TX.wood}),trim:lam({color:0xf0ebe0}),concrete:lam({map:TX.stone,color:0xd0ccc8}),
  door:lam({map:TX.door}),garage:lam({map:TX.garage}),bark:lam({map:TX.bark}),crate:lam({map:TX.crate}),dark:lam({color:0x1c1820}),metal:lam({color:0x3a3640}),iron:lam({color:0x16141a}),
  jack:lam({map:TX.jack,emissive:0xffa030,emissiveMap:TX.jackGlow}),
  bulb:bas({color:0xff9a3a}),lampOn:bas({color:0xffe2a0}),lampOff:lam({color:0x4a4438}),
  glass:lam({color:0x141824,emissive:0x0a0c18}),chrome:lam({color:0x9a9aa4}),tire:lam({color:0x111014}),tail:bas({color:0xff3030}),head:bas({color:0xfff0c0}),
  pool:new THREE.MeshBasicMaterial({map:TX.pool,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),
  fence:lam({map:TX.fence,transparent:true,alphaTest:.4,side:THREE.DoubleSide}),
  ghostSheet:lam({color:0xf4f2ff,emissive:0x2c2c48}),eye:bas({color:0x0a0810}),
  straw:lam({map:TX.straw}),mossStone:lam({color:0x8a8a8e}),
  water:lam({map:TX.water,color:0x6a7ab8,emissive:0x141a40,transparent:true,opacity:0.84,depthWrite:false}),
  sparkle:new THREE.MeshBasicMaterial({map:TX.sparkle,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.7}),
  wire:new THREE.LineBasicMaterial({color:0x14101a}),
};
const cut=tex=>lam({map:tex,alphaTest:.5,side:THREE.DoubleSide});
const CUT={pumpkinMan:cut(TX.pumpkinMan),wallGhost:cut(TX.wallGhost),skeleton:cut(TX.skeleton),cat:cut(TX.cat),owl:cut(TX.owl),witchSign:cut(TX.witchSign),banner:cut(TX.banner)};
const WIN={};for(const k in TX.win)WIN[k]=bas({map:TX.win[k]});

/* geometries */
const pumpGeo=(()=>{const g=new THREE.SphereGeometry(1,20,14);const p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const a=Math.atan2(z,x);
  const r=1+0.07*Math.cos(a*10)*(1-Math.abs(y)*0.6);x*=r;z*=r;y*=0.8;if(y>0.6)y-=0.15*(1-Math.min(1,Math.hypot(x,z)));p.setXYZ(i,x,y,z);}g.computeVertexNormals();return g;})();
const canopyGeo=(()=>{const g=new THREE.SphereGeometry(1,10,7);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=1+0.2*Math.sin(x*5.1+y*3.7)*Math.cos(z*4.3-y*2.1);p.setXYZ(i,x*n,y*n*0.82,z*n);}g.computeVertexNormals();return g;})();
const ghostGeo=new THREE.LatheGeometry([[0.001,1.32],[0.18,1.3],[0.32,1.2],[0.42,1.02],[0.46,0.75],[0.5,0.42],[0.58,0.15],[0.64,0]].map(p=>new THREE.Vector2(p[0],p[1])),16);

const B={
  canopy:new Batch(canopyGeo,lam({color:0xffffff})),
  trunk:new Batch(new THREE.CylinderGeometry(0.55,1,1,9).translate(0,0.5,0),M.bark),
  pine:new Batch(new THREE.ConeGeometry(1,1,12).translate(0,0.5,0),lam({color:0xffffff})),
  pumpkin:new Batch(pumpGeo,lam({color:0xd8641a})),
  bulb:new Batch(new THREE.SphereGeometry(0.11,8,6),M.bulb),
  postLight:new Batch(new THREE.CylinderGeometry(0.04,0.05,0.42,8).translate(0,0.21,0),M.metal),
  postCap:new Batch(new THREE.ConeGeometry(0.18,0.12,10).translate(0,0.52,0),M.metal),
  postBulb:new Batch(new THREE.CylinderGeometry(0.08,0.08,0.1,10).translate(0,0.42,0),M.lampOn),
  pool:new Batch(new THREE.PlaneGeometry(1,1),M.pool),
  baluster:new Batch(new THREE.CylinderGeometry(0.035,0.035,0.8,6),M.trim),
  leaf:new Batch(new THREE.PlaneGeometry(0.16,0.12),lam({color:0xffffff,side:THREE.DoubleSide})),
  bush:new Batch(canopyGeo,lam({color:0xffffff})),
  rock:new Batch(new THREE.DodecahedronGeometry(1,0),lam({color:0x8a8690})),
};
const G={bulb:new Glow(0xff8a2a,0.9),path:new Glow(0xffcf80,1.1),big:new Glow(0xffb060,3.4),window:new Glow(0xffb070,4.2,0.8)};
const hangGhosts=[],crates=[],baseTokens=[];
const leafCols=[0xa8361f,0xc4561c,0x7a2414,0x8a5a22,0xb8742a];
const folCols=[0x8a3a14,0x6b3d12,0x9a5a18,0x5a3a14,0x4a3518,0x7a2a10,0x55401a,0xa86a20];
const pineCols=[0x1e2e2a,0x24342c,0x1a2a2e];

/* ---------- object builders ---------- */
function pumpkin(t,x,z,r){B.pumpkin.add(t.p(x,t.gy(x,z)+r*0.75,z),rnd()*TAU,new V3(r,r,r));}
function jack(t,x,y,z,r){const m=new THREE.Mesh(pumpGeo,M.jack);m.scale.setScalar(r);place(m,t,x,y,z);stat(m);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(0.03*r*3,0.04*r*3,0.14,6),lam({color:0x3e4a1c}));place(st,t,x,y+r*0.72,z);stat(st);G.path.add(t.p(x,y,z+r*0.9));}
function oak(t,x,z,s=1,blobs=9){const y=t.gy(x,z);B.trunk.add(t.p(x,y,z),rnd()*TAU,new V3(0.36*s,5*s,0.36*s));
  for(let i=0;i<3;i++){const a=rnd()*TAU;B.trunk.add(t.p(x,y+2.8*s+i*0.5,z),a,new V3(0.13*s,2.6*s,0.13*s),null,0.9);}
  const cols=[pick(folCols),pick(folCols)];
  for(let i=0;i<blobs;i++){const a=rnd()*TAU,d=rr(0.3,2.5)*s;B.canopy.add(t.p(x+Math.cos(a)*d,y+rr(4.6,7.2)*s,z+Math.sin(a)*d),rnd()*TAU,rr(1.4,2.2)*s,pick(cols));}
  solid(t.box(x-0.36*s,x+0.36*s,y-1,y+6,z-0.36*s,z+0.36*s));}
function pine(t,x,z,s=1){const y=t.gy(x,z);B.trunk.add(t.p(x,y,z),0,new V3(0.25*s,2*s,0.25*s));const c=pick(pineCols);
  [[1.0,2.6,2.2],[1.5,2.0,1.7],[2.6,1.6,1.2]].forEach(([y0,h,r])=>B.pine.add(t.p(x,y+y0*s*1.4,z),rnd()*TAU,new V3(r*s,h*s*1.6,r*s),c));
  solid(t.box(x-0.3*s,x+0.3*s,y-1,y+6,z-0.3*s,z+0.3*s));}
function bush(t,x,z,s=1){B.bush.add(t.p(x,t.gy(x,z)+0.45*s,z),rnd()*TAU,new V3(rr(.8,1.1)*s,rr(.6,.8)*s,rr(.7,.9)*s),pick([0x2c2a18,0x3a2c16,0x46301a,0x2e3418]));}
function ghostMesh(scale){const g=new THREE.Group();const m=new THREE.Mesh(ghostGeo,M.ghostSheet);g.add(m);
  for(const ex of [-0.13,0.13]){const e=new THREE.Mesh(new THREE.SphereGeometry(0.06,8,6),M.eye);e.scale.set(0.8,1.3,0.4);e.position.set(ex,1.02,0.4);g.add(e);}
  const mo=new THREE.Mesh(new THREE.SphereGeometry(0.06,8,6),M.eye);mo.scale.set(0.9,1.1,0.4);mo.position.set(0,0.82,0.45);g.add(mo);g.scale.setScalar(scale);scene.add(g);return g;}
function hangGhost(p){const g=ghostMesh(0.6);g.position.copy(p).add(new V3(0,-0.85,0));hangGhosts.push({g,base:g.position.clone(),ph:rnd()*TAU});}
function crate(t,x,y,z){const m=dbox(t,M.crate,x-0.45,x+0.45,y,y+0.9,z-0.45,z+0.45);const s=solid(t.box(x-0.45,x+0.45,y,y+0.9,z-0.45,z+0.45));const c={m,s,p:m.position.clone(),alive:true,tokens:2};s.crate=c;crates.push(c);return c;}
function crateStack(t,x,z,n){const y=t.gy(x,z);for(let i=0;i<n;i++)crate(t,x,y+i*0.9,z);}
function token(t,x,y,z){baseTokens.push(t.p(x,y,z));}
function tokenG(t,x,h,z){baseTokens.push(t.p(x,t.gy(x,z)+h,z));}
function tomb(t,x,z,tex){const sh=new THREE.Shape();sh.moveTo(-0.35,0);sh.lineTo(0.35,0);sh.lineTo(0.35,0.6);sh.absarc(0,0.6,0.35,0,Math.PI,false);sh.lineTo(-0.35,0);
  const geo=new THREE.ExtrudeGeometry(sh,{depth:0.16,bevelEnabled:true,bevelThickness:0.03,bevelSize:0.03,bevelSegments:2,curveSegments:10});geo.translate(0,0,-0.08);
  const y=t.gy(x,z);const m=new THREE.Mesh(geo,lam({map:tex}));place(m,t,x,y-0.05,z,rr(-.12,.12));m.rotation.z=rr(-.05,.05);stat(m);solid(t.box(x-0.36,x+0.36,y-0.5,y+0.92,z-0.13,z+0.13));}
function standCut(t,mat,x,z,w,h,yo=0){splane(t,mat,x,t.gy(x,z)+yo+h/2,z,w,h,rr(-.2,.2));}
function pathLight(t,x,z){const y=t.gy(x,z);const p=t.p(x,y,z);B.postLight.add(p);B.postCap.add(p);B.postBulb.add(p);G.path.add(t.p(x,y+0.43,z));B.pool.add(t.p(x,y+0.05,z),0,new V3(1.8,1.8,1),null,-Math.PI/2);}
const BM={pk:lam({map:TX.jack,emissive:0xff7a1a,emissiveMap:TX.jackGlow}),pkBody:lam({color:0xff8a2a,emissive:0xb04a08}),hat:lam({color:0x2a1a40,emissive:0x2a1050}),
  ghost:lam({color:0xffffff,emissive:0x9a98b8}),c1:lam({color:0xffd23a,emissive:0xa07a10}),c2:lam({color:0xff7a1a,emissive:0xa03a08}),c3:lam({color:0xfff6e8,emissive:0x8a8478})};
function blowPumpkin(t,x,z){const y=t.gy(x,z);const m=new THREE.Mesh(pumpGeo,BM.pk);m.scale.setScalar(0.45);place(m,t,x,y+0.36,z);stat(m);
  const top=new THREE.Mesh(new THREE.SphereGeometry(0.3,14,10),BM.pkBody);top.scale.y=0.85;place(top,t,x,y+0.9,z);stat(top);
  const hat=new THREE.Mesh(new THREE.ConeGeometry(0.3,0.6,14),BM.hat);place(hat,t,x,y+1.36,z);stat(hat);const br=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.03,18),BM.hat);place(br,t,x,y+1.08,z);stat(br);
  G.window.add(t.p(x,y+0.6,z+0.3));solid(t.box(x-0.4,x+0.4,y-0.3,y+1.1,z-0.4,z+0.4));}
function blowGhost(t,x,z){const y=t.gy(x,z);const g=new THREE.Mesh(ghostGeo,BM.ghost);g.scale.setScalar(0.85);place(g,t,x,y,z);stat(g);
  for(const ex of [-0.11,0.11]){const e=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,6),M.eye);e.scale.set(0.8,1.3,0.4);place(e,t,x+ex,y+0.87,z+0.36);stat(e);}
  G.window.add(t.p(x,y+0.7,z+0.2));solid(t.box(x-0.42,x+0.42,y-0.3,y+1.1,z-0.42,z+0.42));}
function blowCorn(t,x,z){const y=t.gy(x,z);[[BM.c1,0,0.32,0.45],[BM.c2,0.45,0.25,0.36],[BM.c3,0.81,0.14,0.26]].forEach(([mt,y0,r,h])=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(r-0.09,r,h,16),mt);place(c,t,x,y+y0+h/2,z);stat(c);});
  G.path.add(t.p(x,y+0.5,z+0.3));solid(t.box(x-0.32,x+0.32,y-0.3,y+1.05,z-0.32,z+0.32));}
function carAt(t,x,z,col=0x9e1a1e){const y=t.gy(x,z);const carMat=lam({color:col});const g=new THREE.Group();
  const prof=new THREE.Shape();prof.moveTo(-2.2,0.32);prof.lineTo(2.2,0.32);prof.quadraticCurveTo(2.34,0.36,2.3,0.72);prof.lineTo(2.22,0.9);prof.lineTo(0.95,1.0);prof.lineTo(-1.45,1.0);prof.lineTo(-2.18,0.95);prof.quadraticCurveTo(-2.32,0.9,-2.28,0.5);prof.closePath();
  const bg=new THREE.ExtrudeGeometry(prof,{depth:1.68,bevelEnabled:true,bevelThickness:0.08,bevelSize:0.06,bevelSegments:2,curveSegments:6});bg.translate(0,0,-0.84);g.add(new THREE.Mesh(bg,carMat));
  const cab=new THREE.Shape();cab.moveTo(0.9,1.0);cab.lineTo(0.28,1.45);cab.lineTo(-0.95,1.45);cab.lineTo(-1.42,1.0);cab.closePath();
  const cg=new THREE.ExtrudeGeometry(cab,{depth:1.5,bevelEnabled:true,bevelThickness:0.04,bevelSize:0.03,bevelSegments:1});cg.translate(0,0,-0.75);g.add(new THREE.Mesh(cg,M.glass));
  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.22,0.05,1.56),carMat);roof.position.set(-0.34,1.47,0);g.add(roof);
  for(const wx of [-1.4,1.4])for(const wz of [-0.82,0.82]){const w=new THREE.Mesh(new THREE.CylinderGeometry(0.33,0.33,0.24,16),M.tire);w.rotation.x=Math.PI/2;w.position.set(wx,0.33,wz);g.add(w);
    const hc=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.19,0.26,12),M.chrome);hc.rotation.x=Math.PI/2;hc.position.set(wx,0.33,wz);g.add(hc);}
  for(const bx of [-2.36,2.36]){const b=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.14,1.8),M.chrome);b.position.set(bx,0.42,0);g.add(b);}
  for(const lz of [-0.62,0.62]){const h=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.14,0.36),M.head);h.position.set(2.31,0.74,lz);g.add(h);const tl=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.14,0.36),M.tail);tl.position.set(-2.3,0.76,lz);g.add(tl);}
  g.position.copy(t.p(x,y,z));g.rotation.y=t.ry-Math.PI/2;stat(g);
  solid(t.box(x-0.95,x+0.95,y-0.3,y+1.0,z-2.35,z+2.35));solid(t.box(x-0.8,x+0.8,y+1.0,y+1.5,z-1.45,z+0.95));}
function mailbox(t,x,z,num){const y=t.gy(x,z);sbox(t,M.wood,x-0.06,x+0.06,y-0.3,y+1.0,z-0.06,z+0.06);
  const g=new THREE.Group();const mb=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.17,0.5,14,1,false,0,Math.PI),M.iron);mb.rotation.x=Math.PI/2;mb.rotation.z=-Math.PI/2;g.add(mb);
  g.position.copy(t.p(x,y+1.08,z));g.rotation.y=t.ry;stat(g);sbox(t,M.iron,x-0.17,x+0.17,y+0.98,y+1.08,z-0.25,z+0.25);sbox(t,lam({color:0xc8201c}),x+0.18,x+0.2,y+1.05,y+1.35,z-0.05,z+0.02);
  splane(t,cut(textTex(32,12,[num],{fg:'#f4f0e0',font:'bold 9px Arial, sans-serif'})),x+0.18,y+1.2,z,0.4,0.15,Math.PI/2);solid(t.box(x-0.2,x+0.2,y-0.3,y+1.2,z-0.26,z+0.26));}

/* roof geometry: ridge along local x, slopes front/back, pentagon gables at x=±bw */
function roofGeo(W,D,Hh,bw,bd){const P=[],U=[];const sl=Math.hypot(D/2,Hh)/2;
  const q=(a,b,c,d,ua,ub,uc,ud)=>{P.push(...a,...b,...c,...a,...c,...d);U.push(...ua,...ub,...uc,...ua,...uc,...ud);};
  q([-W/2,0,D/2],[W/2,0,D/2],[W/2,Hh,0],[-W/2,Hh,0],[0,0],[W/2,0],[W/2,sl],[0,sl]);
  q([W/2,0,-D/2],[-W/2,0,-D/2],[-W/2,Hh,0],[W/2,Hh,0],[0,0],[W/2,0],[W/2,sl],[0,sl]);
  const n=P.length/3;const hE=Hh*Math.max(0,1-bd/(D/2));
  const fan=pts=>{for(let i=1;i<pts.length-1;i++)[pts[0],pts[i],pts[i+1]].forEach(p=>{P.push(...p);U.push(p[2]*0.5,p[1]*0.5);});};
  fan([[bw,0,bd],[bw,0,-bd],[bw,hE,-bd],[bw,Hh,0],[bw,hE,bd]]);fan([[-bw,0,-bd],[-bw,0,bd],[-bw,hE,bd],[-bw,Hh,0],[-bw,hE,-bd]]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  g.addGroup(0,n,0);g.addGroup(n,P.length/3-n,1);g.computeVertexNormals();return g;}
function roofMesh(t,geo,mats,x,y,z,front){const m=new THREE.Mesh(geo,mats);place(m,t,x,y,z,front?Math.PI/2:0);scene.add(m);return m;}
function stringLights(t,path){const wire=[];
  for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1];const L=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const ns=Math.max(1,Math.round(L/2.6));
    for(let sg=0;sg<ns;sg++)for(let k=0;k<=12;k++){if(k===0&&(sg>0||i>0))continue;const f=(sg+k/12)/ns,sag=0.22*Math.sin(k/12*Math.PI);
      const x=lerp(a[0],b[0],f),y=lerp(a[1],b[1],f)-sag,z=lerp(a[2],b[2],f);wire.push(t.p(x,y,z));if(k%3===1){const bp=t.p(x,y-0.12,z);B.bulb.add(bp);G.bulb.add(bp);}}}
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wire),M.wire));}

/* ---------- terrain mesh ---------- */
{const P=[],C=[],U=[],I=[];const c=new THREE.Color();
  for(let j=0;j<GNZ;j++)for(let i=0;i<GNX;i++){const x=GX0+i,z=GZ0+j;P.push(x,HM[j*GNX+i],z);U.push(x/4,z/4);
    let cd=99;for(const k of CREEKS)cd=Math.min(cd,creekDist(k,x,z));const wet=1-sm(1.5,6,cd);
    const n=0.88+Math.random()*0.14;c.setRGB(lerp(0.98,0.6,wet)*n,lerp(0.9,0.68,wet)*n,lerp(0.82,0.58,wet)*n);C.push(c.r,c.g,c.b);}
  for(let j=0;j<GNZ-1;j++)for(let i=0;i<GNX-1;i++){const a=j*GNX+i,b=a+1,d=a+GNX,e=d+1;I.push(a,d,b,b,d,e);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();
  scene.add(new THREE.Mesh(g,lam({map:TX.grass,vertexColors:true})));
  const og=new THREE.PlaneGeometry(700,600,70,60);og.rotateX(-Math.PI/2);const op=og.attributes.position;
  for(let i=0;i<op.count;i++){const x=op.getX(i),z=op.getZ(i);const inside=x>GX0+1&&x<GX0+GNX-2&&z>GZ0+1&&z<GZ0+GNZ-2;op.setY(i,inside?gh(x,z)-2:base(x,z)-0.4);}
  og.computeVertexNormals();const ouv=og.attributes.uv;for(let i=0;i<ouv.count;i++)ouv.setXY(i,ouv.getX(i)*175,ouv.getY(i)*150);
  scene.add(new THREE.Mesh(og,lam({map:TX.grass,color:0xb0a090})));}

/* road */
{const pts=[];for(let x=-112;x<=112;x+=1)pts.push([x,zr(x)]);
  scene.add(ribbon(pts,7.4,M.road,0.05,4,4,(qx,qz,cx)=>bridgeAt(cx)?rh(cx):gh(qx,qz)));
  for(let x=-110;x<=110;x+=rr(1.5,3))for(const side of [-1,1]){if(bridgeAt(x))continue;const z=zr(x)+side*rr(3.9,4.6);B.rock.add(new V3(x,gh(x,z)+0.02,z),rnd()*TAU,new V3(rr(.12,.3),rr(.08,.18),rr(.12,.3)));}}

/* creeks, bridges, mist */
const mistPts=[];
CREEKS.forEach((c,ci)=>{const pts=[];for(let z=-66;z<=66;z+=1)pts.push([c.f(z),z]);
  const wy=(qx,qz,cx,cz)=>gh(cx,cz)+0.42;
  const w=ribbon(pts,3.1,M.water,0,3,6,wy);w.renderOrder=1;scene.add(w);const sp=ribbon(pts,3.1,M.sparkle,0.01,2,5,wy);sp.renderOrder=2;scene.add(sp);
  for(let z=-62;z<=62;z+=rr(1.2,2.6))for(const side of [-1,1]){const x=c.f(z)+side*rr(1.4,2.2);B.rock.add(new V3(x,gh(x,z)+0.1,z),rnd()*TAU,new V3(rr(.25,.55),rr(.2,.4),rr(.25,.55)));}
  for(let z=-60;z<=60;z+=rr(3,5))mistPts.push(c.f(z)+rr(-1.5,1.5),waterY(c,z)+rr(0.4,1.2),z);
  const bx=ci?35:-35,bz=zr(bx),ry=rh(bx);
  solid(WT.box(bx-5.4,bx+5.4,ry-0.7,ry+0.04,bz-3.9,bz+3.9));
  sbox(WT,M.stone,bx-5.4,bx+5.4,ry-0.75,ry-0.02,bz-4.05,bz+4.05,1.5);
  for(const s of [-1,1]){sbox(WT,M.stone,bx-5.8,bx+5.8,ry-1.9,ry+0.85,bz+s*4.0-0.22,bz+s*4.0+0.22,1.5);sbox(WT,M.concrete,bx-5.9,bx+5.9,ry+0.85,ry+0.97,bz+s*4.0-0.28,bz+s*4.0+0.28,1.5);
    solid(WT.box(bx-5.8,bx+5.8,ry-1.9,ry+0.97,bz+s*4.0-0.28,bz+s*4.0+0.28));
    for(const ex of [-5.8,5.8]){sbox(WT,M.stone,bx+ex-0.35,bx+ex+0.35,ry-1.9,ry+1.35,bz+s*4.0-0.35,bz+s*4.0+0.35,1);G.big.add(new V3(bx+ex,ry+1.55,bz+s*4.0));
      const lt=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,0.36,10),M.lampOn);lt.position.set(bx+ex,ry+1.55,bz+s*4.0);stat(lt);}
    baseTokens.push(new V3(bx,ry+1.6,bz+s*4.0));}
});
{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(mistPts,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xb8b0e0,size:7,map:TX.mist,transparent:true,opacity:0.12,depthWrite:false})));}
{const c=CREEKS[0],z=-30,cx=c.f(z),wl=waterY(c,z);
  [-2.1,-0.7,0.7,2.1].forEach((o,i)=>{const x=cx+o,top=wl+0.2+(i%2)*0.08;const m=new THREE.Mesh(new THREE.SphereGeometry(0.55,14,8),M.mossStone);m.scale.set(1,0.45,0.9);m.position.set(x,top-0.25,z);stat(m);
    solid(WT.box(x-0.45,x+0.45,top-2,top,z-0.42,z+0.42));baseTokens.push(new V3(x,top+0.9,z));});}

/* ---------- houses ---------- */
const FL=0.5,STORY=2.8;
function buildHouse(h,hi){
  const t=HT(h);const d=h.d,zf=d/2;
  const wallMat=lam({map:TX[h.wall],color:h.color});const wallMatD=lam({map:TX[h.wall],color:h.color,side:THREE.DoubleSide});
  const roofMat=lam({map:TX.roof,color:h.roofTint,side:THREE.DoubleSide});const shMat=h.shutters?lam({color:h.shutters}):null;const trimD=lam({color:0xf0ebe0,side:THREE.DoubleSide});
  let wi=0;const nextWin=()=>h.win[(wi++)%h.win.length];
  const win=(x,y,w,hh)=>{sbox(t,M.trim,x-w/2-0.1,x+w/2+0.1,y-hh/2-0.1,y+hh/2+0.1,zf,zf+0.07);splane(t,WIN[nextWin()],x,y,zf+0.075,w,hh);
    sbox(t,M.trim,x-w/2-0.18,x+w/2+0.18,y-hh/2-0.2,y-hh/2-0.1,zf,zf+0.16);
    if(shMat){sbox(t,shMat,x-w/2-0.55,x-w/2-0.14,y-hh/2,y+hh/2,zf,zf+0.06);sbox(t,shMat,x+w/2+0.14,x+w/2+0.55,y-hh/2,y+hh/2,zf,zf+0.06);}
    G.window.add(t.p(x,y,zf+0.45));};
  const main=h.vols[0];const gw=[];const chX=h.chimney==='front'?main.x0+1.3:null;
  h.vols.forEach(v=>{
    const w=v.x1-v.x0,cx=(v.x0+v.x1)/2,wh=v.st===0?1.3:v.st*STORY,top=FL+wh;
    sbox(t,M.stone,v.x0-0.1,v.x1+0.1,-1.5,FL,-zf-0.1,zf+0.1,1.5,2);
    sbox(t,wallMat,v.x0,v.x1,FL,top,-zf,zf,2,1.4);
    solid(t.box(v.x0-0.1,v.x1+0.1,-1.5,top,-zf-0.1,zf+0.1));
    for(const x of [v.x0,v.x1])for(const z of [-zf,zf])sbox(t,M.trim,x-0.09,x+0.09,FL,top,z-0.09,z+0.09);
    let lp;
    if(v.roof==='gable'){roofMesh(t,roofGeo(w+1.2,d+1.2,v.pitch,w/2,zf),[roofMat,wallMatD],cx,top,0,false);
      sbox(t,M.trim,v.x0-0.6,v.x1+0.6,top-0.18,top+0.02,zf+0.55,zf+0.66);solid(t.box(v.x0,v.x1,top,top+v.pitch*0.55,-zf,zf));
      lp=[[v.x0-0.5,top-0.05,zf+0.66],[v.x1+0.5,top-0.05,zf+0.66]];}
    else{const ov=v.roof==='aframe'?1.4:0.6;roofMesh(t,roofGeo(d+1.2,w+ov*2,v.pitch,zf,w/2),[roofMat,wallMatD],cx,top,0,true);
      solid(t.box(v.x0,v.x1,top,top+v.pitch*0.5,-zf,zf));if(v.roof==='aframe')solid(t.box(v.x0-ov,v.x1+ov,-1,top+0.9,-zf,zf));
      lp=[[v.x0-ov+0.2,top+0.05,zf+0.66],[cx,top+v.pitch-0.15,zf+0.66],[v.x1+ov-0.2,top+0.05,zf+0.66]];
      if(v.st>0)win(cx,top+v.pitch*0.38,0.8,0.8);
      if(v.roof==='aframe'){win(cx,top+1.5,1.7,1.3);win(cx,top+3.4,0.8,0.8);}}
    stringLights(t,lp);
    if(v.roof!=='aframe')for(let s=0;s<v.st;s++){const y=FL+s*STORY+1.55,cnt=Math.max(1,Math.round(w/3.3));
      for(let i=0;i<cnt;i++){const x=v.x0+(i+0.5)*w/cnt;if(s===0&&(Math.abs(x-h.doorX)<1.6||(chX!==null&&Math.abs(x-chX)<1.3)))continue;win(x,y,1.3,1.35);if(s===0)gw.push([x,0.85]);}}
    else{win(v.x0+1.4,FL+0.75,1.0,0.9);win(v.x1-1.4,FL+0.75,1.0,0.9);gw.push([v.x0+1.4,0.65],[v.x1-1.4,0.65]);}
  });
  if(h.chimney){const top=FL+(main.st===0?1.3:main.st*STORY);const ht=h.chimney==='back'?top+main.pitch*0.85:top+main.pitch+0.8;let x,z;
    if(h.chimney==='front'){x=main.x0+1.3;z=zf+0.3;}else if(h.chimney==='back'){x=1.4;z=-zf+1.6;}else{x=main.x1-1.0;z=-0.8;}
    sbox(t,lam({map:TX.stoneWall,color:0xb0a498}),x-0.55,x+0.55,-1,ht,z-0.45,z+0.45,1.2,1.5);sbox(t,M.dark,x-0.65,x+0.65,ht,ht+0.15,z-0.55,z+0.55);solid(t.box(x-0.55,x+0.55,-1,ht,z-0.45,z+0.45));}
  const dx=h.doorX;sbox(t,M.trim,dx-0.66,dx+0.66,FL,FL+2.28,zf,zf+0.06);splane(t,M.door,dx,FL+1.06,zf+0.065,1.0,2.1);
  splane(t,cut(textTex(48,20,[h.num],{fg:'#2a1e14',font:'bold 15px Georgia, serif',stroke:'#e8dcc4'})),dx,FL+2.48,zf+0.07,0.8,0.33);
  h.lamp=dbox(t,M.lampOn,dx-0.92,dx-0.76,FL+1.95,FL+2.2,zf,zf+0.18);G.big.add(t.p(dx-0.84,FL+2.08,zf+0.35));
  {const xmin=Math.min(...h.vols.map(v=>v.x0))+0.3,xmax=Math.max(...h.vols.map(v=>v.x1))-0.3;
    let r=xmax,l=xmin;gw.forEach(([x,hw])=>{if(x>dx)r=Math.min(r,x-hw);else l=Math.max(l,x+hw);});if(chX!==null&&chX<dx)l=Math.max(l,chX+0.6);
    const gr=r-(dx+0.75),gl=(dx-0.75)-l;const g=Math.max(gr,gl);
    if(g>=1.0){const cx=gr>=gl?(dx+0.75+r)/2:(l+dx-0.75)/2,w=Math.min(0.95,g-0.1);splane(t,CUT[h.deco],cx,FL+1.35,zf+0.08,w,w*1.16);}
    else standCut(t,CUT[h.deco],dx-4.4,zf+5.2,0.95,1.1);}
  let front=zf;
  const step=(x,z,hw)=>{sbox(t,M.concrete,x-hw,x+hw,-1,FL/2,z,z+0.55,1);solid(t.box(x-hw,x+hw,-1,FL/2,z,z+0.55));};
  const rail=(x0,x1,z0,z1)=>{sbox(t,M.trim,x0,x1,FL+0.82,FL+0.92,z0,z1);solid(t.box(x0,x1,FL,FL+0.92,z0,z1));const lx=x1-x0,lz=z1-z0,n=Math.max(2,Math.round(Math.max(lx,lz)/0.28));
    for(let i=0;i<=n;i++){const f=i/n;B.baluster.add(t.p(lx>lz?x0+lx*f:(x0+x1)/2,FL+0.42,lz>=lx?z0+lz*f:(z0+z1)/2));}};
  if(h.porch==='deck'){sbox(t,M.wood,dx-1.9,dx+1.9,-1,FL,zf,zf+1.9,1);solid(t.box(dx-1.9,dx+1.9,-1,FL,zf,zf+1.9));step(dx,zf+1.9,1.1);
    rail(dx-1.95,dx-1.78,zf,zf+1.9);rail(dx+1.78,dx+1.95,zf,zf+1.9);rail(dx-1.95,dx-1.1,zf+1.75,zf+1.9);rail(dx+1.1,dx+1.95,zf+1.75,zf+1.9);front=zf+2.45;
    token(t,dx-1.86,FL+1.5,zf+0.9);token(t,dx+1.86,FL+1.5,zf+0.9);}
  else if(h.porch==='stoop'||h.porch==='portico'){const hw=h.porch==='portico'?1.5:1.2,dp=h.porch==='portico'?1.9:1.4;
    sbox(t,M.concrete,dx-hw,dx+hw,-1,FL,zf,zf+dp,1);solid(t.box(dx-hw,dx+hw,-1,FL,zf,zf+dp));step(dx,zf+dp,hw-0.3);front=zf+dp+0.55;
    if(h.porch==='portico'){for(const s of [-1,1])scyl(t,M.trim,dx+s*(hw-0.25),FL,FL+2.6,zf+dp-0.25,0.12,14);
      roofMesh(t,roofGeo(dp+0.6,hw*2+0.5,1.0,(dp+0.6)/2,hw),[roofMat,trimD],dx,FL+2.6,zf+(dp+0.6)/2-0.05,true);
      sbox(t,M.trim,dx-hw-0.25,dx+hw+0.25,FL+2.45,FL+2.62,zf,zf+dp+0.3);solid(t.box(dx-hw-0.25,dx+hw+0.25,FL+2.45,FL+2.9,zf,zf+dp+0.3));
      token(t,dx,FL+1.4,zf+dp*0.6);}
    else{roofMesh(t,roofGeo(1.4,2.4,0.7,0.7,1.1),[roofMat,trimD],dx,FL+2.4,zf+0.6,true);
      for(const s of [-1,1])sbox(t,M.iron,dx+s*hw-0.03,dx+s*hw+0.03,FL,FL+0.9,zf+0.1,zf+dp);token(t,dx-1.6,FL+1.4,zf+1.2);}}
  else if(h.porch==='wrap'){const x0=main.x0-0.3,x1=main.x1+0.3,dp=2.3;sbox(t,M.wood,x0,x1,-1,FL,zf,zf+dp,1);solid(t.box(x0,x1,-1,FL,zf,zf+dp));step(dx,zf+dp,0.9);
    const posts=Math.max(2,Math.round((x1-x0)/2.6));for(let i=0;i<=posts;i++){const x=x0+0.12+(x1-x0-0.24)*i/posts;sbox(t,M.trim,x-0.09,x+0.09,FL,FL+2.6,zf+dp-0.2,zf+dp-0.02);}
    const sr=new THREE.Mesh(new THREE.BoxGeometry(x1-x0+0.4,0.08,dp+0.5),roofMat);place(sr,t,(x0+x1)/2,FL+2.85,zf+dp/2+0.05);sr.rotation.x=0.16;stat(sr);
    rail(x0,dx-0.95,zf+dp-0.2,zf+dp-0.05);rail(dx+0.95,x1,zf+dp-0.2,zf+dp-0.05);front=zf+dp+0.55;token(t,x0+0.6,FL+1.5,zf+dp-0.12);token(t,x1-0.6,FL+1.5,zf+dp-0.12);}
  h.door=t.p(dx,FL,zf+0.9);
  jack(t,dx+1.3,FL+0.25,zf+0.55,0.28);
  const gx0=main.x1+0.05,gx1=gx0+5,gcx=(gx0+gx1)/2;
  if(h.garage==='right'){sbox(t,wallMat,gx0,gx1,-1,3.0,-zf+0.5,zf-0.2,2,1.4);solid(t.box(gx0,gx1,-1,3.0,-zf+0.5,zf-0.2));sbox(t,roofMat,gx0-0.2,gx1+0.3,3.0,3.22,-zf+0.3,zf+0.2);
    splane(t,M.garage,gcx,1.25,zf-0.18,3.6,2.5);splane(t,CUT.banner,gcx,2.9,zf-0.16,3.8,0.9);
    splane(t,CUT.witchSign,gx0+0.35,1.6,zf-0.17,0.5,0.68);}
  if(h.garage==='carport'){const y0=t.gy(gcx,0);for(const z of [-zf+0.8,zf+0.8]){const x=gx1-0.15;sbox(t,M.trim,x-0.1,x+0.1,y0-0.5,FL+2.4,z-0.1,z+0.1);solid(t.box(x-0.1,x+0.1,y0-0.5,FL+2.4,z-0.1,z+0.1));}
    sbox(t,roofMat,gx0-0.1,gx1+0.2,FL+2.4,FL+2.55,-zf+0.5,zf+1.1);}
  const zEnd=x=>h.s*(zr(t.wx(x))-h.s*3.7-h.z);
  const walk=[];for(let z=front;z<=zEnd(dx);z+=1)walk.push([t.wx(dx),t.wz(z)]);if(walk.length>1)scene.add(ribbon(walk,1.5,M.concrete,0.04,1.5,1.5));
  for(let z=front+0.6;z<zEnd(dx)-1;z+=1.5){pathLight(t,dx-1.1,z);pathLight(t,dx+1.1,z);}
  if(h.garage!=='none'){const dw=[];for(let z=h.garage==='right'?zf-0.2:zf+1.1;z<=zEnd(gcx);z+=1)dw.push([t.wx(gcx),t.wz(z)]);if(dw.length>1)scene.add(ribbon(dw,4,M.concrete,0.035,2,2));
    const cz=h.garage==='right'?zf+3.4:0.6;carAt(t,gcx,cz,h.garage==='right'?0x9e1a1e:0x2a4a7a);token(t,gcx,t.gy(gcx,cz)+2.3,cz-0.2);}
  mailbox(t,dx+1.8,zEnd(dx)-0.3,h.num);
  const yz=front;
  for(let i=0;i<8;i++){const bx=i<4?rr(dx+1.4,main.x1-0.3):rr(main.x0+0.3,dx-1.4);if(Math.abs(bx-dx)>1.3&&!(h.chimney==='front'&&Math.abs(bx-main.x0-1.3)<1))bush(t,bx,zf+0.6,rr(0.8,1.1));}
  const L=o=>dx+o;
  jack(t,L(-1.7),t.gy(L(-1.7),yz+0.4)+0.38,yz+0.4,0.42);jack(t,L(-2.5),t.gy(L(-2.5),yz+0.8)+0.32,yz+0.8,0.36);
  tomb(t,L(2.8),yz+2.6,TX.tombRip);tomb(t,L(3.8),yz+2.4,TX.tombTot);tokenG(t,L(3.3),1.7,yz+2.5);
  standCut(t,CUT.skeleton,L(4.9),yz+1.2,0.85,1.55);
  oak(t,L(-5.8),yz+4.2,rr(0.9,1.1));{const ty=t.gy(L(-5.8),yz+4.2);hangGhost(t.p(L(-4.6),ty+3.6,yz+4.4));hangGhost(t.p(L(-6.8),ty+3.3,yz+3.6));tokenG(t,L(-4.9),2.6,yz+4.9);}
  standCut(t,CUT.cat,L(-3.3),yz+5.6,0.9,0.75);
  crateStack(t,L(3.6),yz+5.4,2);
  const bms=[blowPumpkin,blowGhost,blowCorn];bms[hi%3](t,L(-3.2),yz+1.6);bms[(hi+1)%3](t,L(2.2),yz+5.8);
  for(let i=0;i<7;i++){const px=L(rr(-4.5,5)),pz=yz+rr(0.8,6);if(Math.abs(px-dx)>1.2)pumpkin(t,px,pz,rr(.16,.28));}
  tokenG(t,dx,0.95,yz+1.6);tokenG(t,dx,0.95,yz+4.2);
  const PL=new THREE.PointLight(0xff9a40,1.4,11,1.6);PL.position.copy(t.p(dx,FL+2.2,zf+1.6));scene.add(PL);h.light=PL;
  B.pool.add(t.p(dx,t.gy(dx,zf+2.5)+0.06,zf+2.5),0,new V3(6,6,1),null,-Math.PI/2);
}
HOUSES.forEach(buildHouse);

/* ---------- creekside park + footbridge ---------- */
{const t=WT,c=CREEKS[1],bz=26,bcx=c.f(bz);
  const by=Math.max(gh(bcx-5,bz),gh(bcx+5,bz));const hs=[0.25,0.55,0.8,0.55,0.25];
  hs.forEach((hh,i)=>{const x0=bcx-5+i*2,x1=x0+2,y=by+hh;sbox(t,M.wood,x0,x1,y-0.2,y,bz-0.9,bz+0.9,1);solid(t.box(x0,x1,y-2.5,y,bz-0.9,bz+0.9));
    for(const s of [-1,1]){sbox(t,M.wood,x0,x1,y+0.85,y+0.95,bz+s*0.85-0.05,bz+s*0.85+0.05);solid(t.box(x0,x1,y,y+0.95,bz+s*0.85-0.06,bz+s*0.85+0.06));sbox(t,M.wood,x0-0.05,x0+0.05,y-0.2,y+0.95,bz+s*0.85-0.05,bz+s*0.85+0.05);}});
  baseTokens.push(new V3(bcx,by+1.7,bz),new V3(bcx-2,by+1.45,bz),new V3(bcx+2,by+1.45,bz));
  [[44,62,35,35],[62,62,17,35]].forEach(([x0,x1,z0,z1])=>{const len=Math.max(x1-x0,z1-z0),along=x1>x0;
    for(let s=0;s<len;s+=3){const sx=along?x0+s+1.5:x0,sz=along?z0:z0+s+1.5;const y=gh(sx,sz);const m=new THREE.Mesh(new THREE.PlaneGeometry(3,1.6),M.fence);const uv=m.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*3/1.6,uv.getY(i));
      m.position.set(sx,y+0.8,sz);m.rotation.y=along?0:Math.PI/2;stat(m);solid(along?WT.box(sx-1.5,sx+1.5,y-0.5,y+1.6,sz-0.06,sz+0.06):WT.box(sx-0.06,sx+0.06,y-0.5,y+1.6,sz-1.5,sz+1.5));
      const px_=along?sx-1.5:sx,pz=along?sz:sz-1.5;scyl(t,M.metal,px_,gh(px_,pz)-0.2,gh(px_,pz)+1.7,pz,0.05,6);}});
  oak(t,52,27,1.35);{const y=gh(52,27);hangGhost(new V3(53.6,y+4.6,27.6));hangGhost(new V3(50.4,y+4.0,26));tokenG(t,50.6,2.7,25.4);}
  const bY=gh(48,19);sbox(t,M.wood,47.1,48.9,bY+0.45,bY+0.55,18.75,19.25,1);sbox(t,M.wood,47.1,48.9,bY+0.55,bY+1.0,19.2,19.3,1);solid(WT.box(47.1,48.9,bY-0.3,bY+0.55,18.75,19.25));solid(WT.box(47.1,48.9,bY-0.3,bY+1.0,19.15,19.3));
  for(const x of [47.2,48.8])sbox(t,M.metal,x-0.05,x+0.05,bY-0.2,bY+0.45,18.8,19.2);jack(t,48.4,bY+0.82,19,0.28);tokenG(t,47.6,1.35,19);
  sbox(t,M.wood,56.92,57.08,gh(57,18)-0.3,gh(57,18)+0.9,17.92,18.08);splane(t,CUT.owl,57,gh(57,18)+1.3,18,0.7,0.85,Math.PI);tokenG(t,57,2.3,18.2);
  const sx=58,sz=29;crateStack(t,sx-1.8,sz,1);crateStack(t,sx-0.9,sz,2);crateStack(t,sx,sz,3);tokenG(t,sx,2.9,sz);
  crateStack(t,48,31,1);crateStack(t,55,22,1);
  splane(t,CUT.cat,50,gh(50,22)+0.4,22,1.0,0.8,Math.PI);splane(t,CUT.skeleton,59.5,gh(59.5,21)+0.78,21,0.85,1.55,Math.PI);
  const SW=HT({x:0,z:0,s:1,pad:0});blowGhost(SW,46,22);blowCorn(SW,60,24);
  for(let i=0;i<12;i++)pumpkin(t,rr(45,61),rr(18,34),rr(.15,.3));
  for(const x of [47,51,55,59])tokenG(t,x,0.95,24);}

/* ---------- entrance monument, street sign, lamps ---------- */
{const x=-84,z=zr(-84)+7.2,y=gh(x,z);const swm=lam({map:TX.stoneWall,color:0xc0b4a8});
  sbox(WT,swm,x-2.6,x+2.6,y-0.6,y+1.3,z-0.35,z+0.35,1.2,1);solid(WT.box(x-2.6,x+2.6,y-0.6,y+1.3,z-0.35,z+0.35));
  const signM=lam({map:textTex(128,40,['SLEEPY HOLLOW','EST. 1972'],{bg:'#4a3020',fg:'#f2dca8',font:'bold 15px Georgia, serif'})});
  splane(WT,signM,x,y+0.85,z+0.37,3.6,1.0,0);splane(WT,signM,x,y+0.85,z-0.37,3.6,1.0,Math.PI);
  for(const ex of [-2.6,2.6]){sbox(WT,swm,x+ex-0.4,x+ex+0.4,y-0.6,y+1.7,z-0.4,z+0.4,1.2);const l=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.2,0.4,10),M.lampOn);l.position.set(x+ex,y+1.92,z);stat(l);G.big.add(new V3(x+ex,y+1.95,z));}
  for(const [hx,hz] of [[-1.6,0.9],[1.4,1.0],[0.1,1.1]]){const yy=gh(x+hx,z+hz);sbox(WT,M.straw,x+hx-0.5,x+hx+0.5,yy-0.1,yy+0.5,z+hz-0.3,z+hz+0.3,0.6);}
  jack(WT,x-1.5,y+0.85,z+0.9,0.3);jack(WT,x+1.2,y+0.82,z+1.0,0.26);
  const sx_=-70,sz_=zr(-70)-5.2,sy=gh(sx_,sz_);sbox(WT,M.metal,sx_-0.06,sx_+0.06,sy-0.3,sy+3.0,sz_-0.06,sz_+0.06);solid(WT.box(sx_-0.08,sx_+0.08,sy-0.3,sy+3.0,sz_-0.08,sz_+0.08));
  splane(WT,lam({map:textTex(96,16,['SLEEPY HOLLOW LN'],{bg:'#2f7a3a',fg:'#f4f4ee',font:'bold 10px Arial, sans-serif'}),side:THREE.DoubleSide}),sx_,sy+2.9,sz_,2.0,0.34,0);
  splane(WT,lam({map:textTex(96,16,['CREEKSIDE CT'],{bg:'#2f7a3a',fg:'#f4f4ee',font:'bold 10px Arial, sans-serif'}),side:THREE.DoubleSide}),sx_,sy+2.55,sz_,1.7,0.32,Math.PI/2);
  [[0,-1],[-48,1],[48,-1]].forEach(([lx,s])=>{const lz=zr(lx)+s*5.4,ly=gh(lx,lz);sbox(WT,M.wood,lx-0.12,lx+0.12,ly-0.3,ly+5,lz-0.12,lz+0.12);solid(WT.box(lx-0.12,lx+0.12,ly-0.3,ly+5,lz-0.12,lz+0.12));
    sbox(WT,M.metal,lx-0.05,lx+0.05,ly+4.8,ly+4.9,Math.min(lz,lz-s*1.4),Math.max(lz,lz-s*1.4));const hd=new THREE.Mesh(new THREE.SphereGeometry(0.3,12,8,0,TAU,0,Math.PI/2),M.metal);hd.position.set(lx,ly+4.62,lz-s*1.4);hd.scale.set(1,0.5,1.4);stat(hd);
    const bulb=new THREE.Mesh(new THREE.CircleGeometry(0.22,12),M.lampOn);bulb.rotation.x=Math.PI/2;bulb.position.set(lx,ly+4.6,lz-s*1.4);stat(bulb);G.big.add(new V3(lx,ly+4.4,lz-s*1.4));G.window.add(new V3(lx,ly+4.3,lz-s*1.4));
    B.pool.add(new V3(lx,gh(lx,lz-s*2)+0.06,lz-s*2),0,new V3(9,9,1),null,-Math.PI/2);const L2=new THREE.PointLight(0xffb35c,1.0,16,1.5);L2.position.set(lx,ly+4.2,lz-s*1.4);scene.add(L2);});}

/* ---------- scatter trees, bushes, leaves, road tokens ---------- */
const nearPad=(x,z,m)=>PADS.some(p=>Math.abs(x-p.cx)<p.hw+m&&Math.abs(z-p.cz)<p.hd+m);
for(let i=0;i<240;i++){const x=rr(-110,110),z=rr(-64,64);if(roadDist(x,z)<7||nearPad(x,z,1.5)||CREEKS.some(c=>creekDist(c,x,z)<2.8))continue;if(Math.hypot(x+84,z-zr(-84)-7.2)<5||Math.hypot(x+70,z-zr(-70)+5.2)<2)continue;
  if(rnd()<0.62)oak(WT,x,z,rr(0.9,1.5),6);else pine(WT,x,z,rr(0.9,1.5));}
for(let i=0;i<220;i++){const x=rr(-90,90),z=rr(-50,50);if(roadDist(x,z)<5||CREEKS.some(c=>creekDist(c,x,z)<2.2))continue;if(rnd()<0.5&&!nearPad(x,z,0))bush(WT,x,z,rr(0.7,1.3));}
for(let i=0;i<900;i++){const x=rr(-95,95),z=rr(-55,55);if(CREEKS.some(c=>creekDist(c,x,z)<1.6))continue;B.leaf.add(new V3(x,gh(x,z)+0.06,z),rnd()*TAU,1,pick(leafCols),-Math.PI/2);}
for(let x=-80;x<=80;x+=10){if(bridgeAt(x))continue;baseTokens.push(new V3(x,gh(x,zr(x))+0.95,zr(x)+(x%20?1.2:-1.2)));}

for(const k in B)B[k].build();for(const k in G)G[k].build();
flushStatics();

/* ---------- sky & light ---------- */
let sky;{const sg=new THREE.SphereGeometry(400,20,14),pos=sg.attributes.position,cols=[];
  const cTop=new THREE.Color(0x06041a),cMid=new THREE.Color(0x1b1350),cHor=new THREE.Color(0x3a2d72),cBot=new THREE.Color(FOG);
  for(let i=0;i<pos.count;i++){const y=pos.getY(i)/400;let c;if(y>0.3)c=cMid.clone().lerp(cTop,(y-0.3)/0.7);else if(y>0)c=cHor.clone().lerp(cMid,y/0.3);else c=cHor.clone().lerp(cBot,Math.min(1,-y*4));cols.push(c.r,c.g,c.b);}
  sg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  sky=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false}));sky.renderOrder=-1;scene.add(sky);
  const sp=[];for(let i=0;i<600;i++){const a=Math.random()*TAU,e=0.14+Math.random()*1.3;sp.push(Math.cos(a)*Math.cos(e)*380,Math.sin(e)*380,Math.sin(a)*Math.cos(e)*380);}
  const sgeo=new THREE.BufferGeometry();sgeo.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
  sky.add(new THREE.Points(sgeo,new THREE.PointsMaterial({color:0xe8e4ff,size:1.4,sizeAttenuation:false,fog:false})));
  const moonM=new THREE.Mesh(new THREE.CircleGeometry(9,32),new THREE.MeshBasicMaterial({color:0xf2ecd8,fog:false}));moonM.position.set(-160,200,-260);moonM.lookAt(0,0,0);sky.add(moonM);
  const halo=new THREE.Mesh(new THREE.CircleGeometry(30,32),new THREE.MeshBasicMaterial({map:TX.mist,color:0x9a90d0,transparent:true,opacity:0.35,fog:false,depthWrite:false}));halo.position.set(-159,199,-259);halo.lookAt(0,0,0);sky.add(halo);}
scene.add(new THREE.HemisphereLight(0x5b4fa0,0x2a1a10,0.75));
const moonL=new THREE.DirectionalLight(0x8f88d8,0.42);moonL.position.set(-30,60,-40);scene.add(moonL);
scene.add(new THREE.AmbientLight(0x1a1430,0.35));

/* ---------- taffy tokens ---------- */
const MAXT=260;
const taffyGeo=(()=>{const g=new THREE.BoxGeometry(0.9,0.34,0.1,6,2,1);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),k=1-Math.pow(Math.abs(x)/0.45,4)*0.35;p.setY(i,p.getY(i)*k);p.setZ(i,p.getZ(i)*(0.4+0.6*k));}g.computeVertexNormals();return g;})();
const taffyMesh=new THREE.InstancedMesh(taffyGeo,bas({map:TX.taffy}),MAXT);taffyMesh.frustumCulled=false;taffyMesh.count=0;scene.add(taffyMesh);
const tGlowPos=new Float32Array(MAXT*3);const tGlowGeo=new THREE.BufferGeometry();tGlowGeo.setAttribute('position',new THREE.BufferAttribute(tGlowPos,3));
const tGlow=new THREE.Points(tGlowGeo,new THREE.PointsMaterial({color:0x3aa8ff,size:1.6,map:TX.glow,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));tGlow.frustumCulled=false;scene.add(tGlow);
let tokens=[];
const totalTaffy=baseTokens.length+crates.reduce((a,c)=>a+c.tokens,0);

/* particles */
const PMAX=500,pPos=new Float32Array(PMAX*3),pCol=new Float32Array(PMAX*3),parts=[];
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
const ptsObj=new THREE.Points(pGeo,new THREE.PointsMaterial({size:0.4,map:TX.glow,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));ptsObj.frustumCulled=false;scene.add(ptsObj);
function emit(p,n,cols,spd=4,life=0.8,up=3,grav=1){for(let i=0;i<n&&parts.length<PMAX;i++){const a=Math.random()*TAU,e=Math.random()*spd;
  parts.push({x:p.x,y:p.y,z:p.z,vx:Math.cos(a)*e,vy:up*(0.5+Math.random()),vz:Math.sin(a)*e,l:life*(0.6+Math.random()*0.6),c:new THREE.Color(cols[(Math.random()*cols.length)|0]),g:grav});}}

/* ---------- characters ---------- */
const CHARS=[
  {id:'vampire',name:'Vampire',desc:'A cape that catches the wind. Hold jump to glide.'},
  {id:'mummy',name:'Mummy',desc:'Two rolls of toilet paper and a lot of patience.'},
  {id:'witch',name:'Witch',desc:'Hold jump and she hops on her broom.'},
  {id:'frank',name:'Frankenstein',desc:'Platform boots, a flat top, and bolts from the hardware store.'},
  {id:'ghost',name:'Ghost',desc:"Mom's old bedsheet, two eye holes, and sneakers."},
];
const FACES={};
function limbGeo(r,L,seg=12){const pts=[],n=5;for(let i=0;i<=n;i++){const a=-Math.PI/2+i/n*Math.PI/2;pts.push(new THREE.Vector2(Math.max(0.0001,Math.cos(a)*r),r+Math.sin(a)*r));}
  for(let i=0;i<=n;i++){const a=i/n*Math.PI/2;pts.push(new THREE.Vector2(Math.max(0.0001,Math.cos(a)*r),L-r+Math.sin(a)*r));}
  return new THREE.LatheGeometry(pts,seg).translate(0,-L,0);}
const lathe=(pts,seg=16)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg);
function bag(kind){const g=new THREE.Group();
  if(kind==='pillow'){g.add(new THREE.Mesh(lathe([[0.001,0],[0.14,0.02],[0.2,0.12],[0.19,0.26],[0.11,0.36],[0.06,0.4],[0.08,0.45]],16),lam({color:0xf2f0f8})));
    const st=new THREE.Mesh(new THREE.TorusGeometry(0.075,0.015,6,14),lam({color:0x8a7ac8}));st.rotation.x=Math.PI/2;st.position.y=0.42;g.add(st);return {g,top:0.44};}
  if(kind==='pail'){const m=new THREE.Mesh(lathe([[0.001,0],[0.12,0],[0.15,0.08],[0.165,0.2],[0.155,0.24],[0.14,0.24],[0.13,0.2]],18),lam({map:TX.jack,emissive:0xff8a30,emissiveMap:TX.jackGlow,side:THREE.DoubleSide}));m.rotation.y=-Math.PI/2;g.add(m);}
  else g.add(new THREE.Mesh(lathe([[0.001,0],[0.1,0],[0.16,0.06],[0.17,0.14],[0.14,0.22],[0.16,0.24],[0.13,0.23]],18),lam({color:0x1a181e,side:THREE.DoubleSide})));
  const c=new THREE.Mesh(new THREE.CircleGeometry(0.14,14),lam({color:0xff6a2a,emissive:0x401000}));c.rotation.x=-Math.PI/2;c.position.y=0.2;g.add(c);
  for(let i=0;i<5;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.03,0.04),lam({color:pick([0x2ec5ff,0xe8344a,0xffd23a,0x8ad04a])}));s.position.set(rr(-.08,.08),0.21,rr(-.08,.08));s.rotation.y=rnd()*3;g.add(s);}
  const h=new THREE.Mesh(new THREE.TorusGeometry(0.15,0.012,5,14,Math.PI),M.iron);h.position.y=0.24;g.add(h);return {g,top:0.39};}
function buildChar(id){
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);
  const rig={id,root,body,legs:[],arms:[],armsForward:false,cape:null,broom:null,sheet:null,strips:[]};
  const Lm=(r,len,mat,seg=12)=>new THREE.Mesh(limbGeo(r,len,seg),mat);
  const sph=(r,mat,ws=16,hs=12)=>new THREE.Mesh(new THREE.SphereGeometry(r,ws,hs),mat);
  const face=k=>FACES[k]||(FACES[k]=faceTex(k));
  const legs=(legM,shoeM,ss=1,legLen=0.42)=>{for(const sx of [-0.1,0.1]){const pv=new THREE.Group();pv.position.set(sx,0.46,0);pv.add(Lm(0.085,legLen,legM));
    const f=sph(1,shoeM,14,10);f.scale.set(0.1*ss,0.075*ss,0.15*ss);f.position.set(0,-0.41,0.04);pv.add(f);body.add(pv);rig.legs.push(pv);}};
  const arms=(sleeve,hand,r=0.068)=>{for(const sx of [-0.27,0.27]){const pv=new THREE.Group();pv.position.set(sx,0.86,0);pv.add(Lm(r,0.36,sleeve));const hd=sph(0.075,hand,12,10);hd.position.y=-0.38;pv.add(hd);body.add(pv);rig.arms.push(pv);}};
  const torso=m=>{const t=Lm(0.205,0.52,m,16);t.scale.set(1.12,1,0.82);t.position.y=0.95;body.add(t);const nk=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.08,0.12,10),m);nk.position.y=0.97;body.add(nk);};
  const head=m=>{const hd=sph(0.27,m,24,18);hd.position.y=1.2;body.add(hd);return hd;};
  const giveBag=kind=>{const b=bag(kind);b.g.position.y=-0.38-b.top;rig.arms[1].add(b.g);};
  if(id==='vampire'){const blk=lam({color:0x1a1420}),skin=lam({color:0xebe0ea});legs(blk,lam({color:0x0e0c10}));torso(blk);
    const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.11,0.32,10,1,false,-0.7,1.4),lam({color:0xf4f0ea}));sh.position.set(0,0.78,0.075);body.add(sh);
    for(const s of [-1,1]){const bw=new THREE.Mesh(new THREE.ConeGeometry(0.045,0.1,8),lam({color:0xc0101c}));bw.rotation.z=s*Math.PI/2;bw.position.set(s*0.045,0.9,0.19);body.add(bw);}
    arms(blk,skin);head(lam({map:face('vampire')}));
    const cap=new THREE.Mesh(new THREE.SphereGeometry(0.285,24,12,0,TAU,0,Math.PI*0.42),lam({color:0x120e16}));cap.position.y=1.2;cap.rotation.x=-0.38;body.add(cap);
    const pk=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.12,4),lam({color:0x120e16}));pk.rotation.x=Math.PI;pk.position.set(0,1.38,0.22);body.add(pk);
    const cg=new THREE.PlaneGeometry(0.74,0.98,5,8);cg.translate(0,-0.49,0);const base=cg.attributes.position.array.slice();
    const pv=new THREE.Group();pv.position.set(0,0.92,-0.18);pv.add(new THREE.Mesh(cg,lam({color:0x16101e,side:THREE.BackSide})),new THREE.Mesh(cg,lam({color:0x9a1636,side:THREE.FrontSide})));body.add(pv);rig.cape={pv,geo:cg,base};
    for(const s of [-1,1]){const c=new THREE.Mesh(new THREE.PlaneGeometry(0.24,0.3),lam({color:0x9a1636,side:THREE.DoubleSide}));c.position.set(s*0.15,1.06,-0.12);c.rotation.set(-0.2,s*-0.55,0);body.add(c);}
    giveBag('pail');}
  if(id==='mummy'){const bd=lam({map:TX.bandage});legs(bd,bd,1.05);torso(bd);arms(bd,bd,0.075);head(lam({map:face('mummy')}));rig.armsForward=true;
    [[0.12,0.52,-0.12,body],[-0.1,0.6,0.12,body],[0,-0.3,0,rig.arms[0]]].forEach(([x,y,z,par])=>{const st=new THREE.Mesh(new THREE.PlaneGeometry(0.07,0.5,1,4).translate(0,-0.25,0),lam({map:TX.bandage,side:THREE.DoubleSide}));
      st.position.set(x,y,z);par.add(st);rig.strips.push(st);});
    giveBag('pillow');}
  if(id==='witch'){const pur=lam({color:0x5a2a7a}),skin=lam({color:0xf2cba8}),hair=lam({color:0xd8641c});legs(lam({map:TX.stripes}),lam({color:0x141016}),1.05);
    rig.legs.forEach(l=>{l.children[1].scale.z*=1.3;});torso(pur);
    body.add(new THREE.Mesh(lathe([[0.2,0.66],[0.24,0.56],[0.3,0.44],[0.36,0.3],[0.37,0.27]],20),lam({color:0x4a1e66,side:THREE.DoubleSide})));
    arms(pur,skin);head(lam({map:face('witch')}));
    const cap=new THREE.Mesh(new THREE.SphereGeometry(0.29,24,12,0,TAU,0,Math.PI*0.5),hair);cap.position.y=1.2;cap.rotation.x=-0.45;body.add(cap);
    for(const s of [-1,1]){const br=Lm(0.045,0.34,hair,8);br.position.set(s*0.25,1.2,-0.06);br.rotation.z=s*0.15;body.add(br);}
    const hg=new THREE.ConeGeometry(0.25,0.62,20,6);hg.translate(0,0.31,0);const hp=hg.attributes.position;for(let i=0;i<hp.count;i++){const y=hp.getY(i);hp.setZ(i,hp.getZ(i)-Math.pow(Math.max(0,y-0.25),2)*1.1);}hg.computeVertexNormals();
    const hat=new THREE.Group();const hm=lam({color:0x1c1424});hat.add(new THREE.Mesh(hg,hm));hat.add(new THREE.Mesh(new THREE.CylinderGeometry(0.46,0.46,0.025,28),hm));
    const band=new THREE.Mesh(new THREE.CylinderGeometry(0.255,0.255,0.06,20,1,true),lam({color:0x8a3ac8}));band.position.y=0.05;hat.add(band);hat.position.set(0,1.4,-0.02);hat.rotation.set(-0.15,0,0.12);body.add(hat);
    const broom=new THREE.Group();broom.add(new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,1.3,8),lam({color:0x6a4a2a})));
    const bris=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.42,14),M.straw);bris.position.y=-0.8;bris.rotation.x=Math.PI;broom.add(bris);
    broom.position.set(0,0.8,-0.25);broom.rotation.set(0,0,0.65);body.add(broom);rig.broom=broom;giveBag('cauldron');}
  if(id==='frank'){const gr=lam({color:0x8db36a}),jk=lam({color:0x2e2c34}),hairM=lam({color:0x16121a});legs(lam({color:0x3a3640}),lam({color:0x121014}),1.4);
    rig.legs.forEach(l=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.12,0.16,12),lam({color:0x121014}));b.position.y=-0.34;l.add(b);});
    torso(jk);arms(jk,gr,0.075);rig.armsForward=true;
    const hd=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.27,0.5,24),[lam({map:face('frank')}),hairM,gr]);hd.rotation.y=-Math.PI/2;hd.position.y=1.21;body.add(hd);
    const hair=new THREE.Mesh(new THREE.CylinderGeometry(0.265,0.262,0.1,24),hairM);hair.position.y=1.47;body.add(hair);
    const fr=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.07,0.05),hairM);fr.position.set(0,1.41,0.25);body.add(fr);
    for(const s of [-1,1]){const b=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.14,10),M.chrome);b.rotation.z=Math.PI/2;b.position.set(s*0.12,1.0,0);body.add(b);}
    giveBag('pail');}
  if(id==='ghost'){legs(lam({color:0xf4f4f4}),lam({color:0xc0202c}),1.05,0.3);
    const sg=lathe([[0.001,1.5],[0.15,1.48],[0.26,1.4],[0.31,1.25],[0.32,1.08],[0.35,0.88],[0.4,0.62],[0.46,0.4],[0.52,0.22]],28);const base=sg.attributes.position.array.slice();
    body.add(new THREE.Mesh(sg,lam({color:0xf6f4ff,emissive:0x2a2a40,side:THREE.DoubleSide})));rig.sheet={geo:sg,base};
    for(const s of [-1,1]){const e=new THREE.Mesh(new THREE.CircleGeometry(0.055,14),M.eye);e.scale.y=1.35;e.position.set(s*0.1,1.24,0.305);e.rotation.y=s*0.3;body.add(e);}
    for(const sx of [-0.33,0.33]){const pv=new THREE.Group();pv.position.set(sx,0.92,0);pv.add(Lm(0.08,0.3,lam({color:0xf6f4ff,emissive:0x2a2a40}),10));body.add(pv);rig.arms.push(pv);}
    const b=bag('pillow');b.g.position.y=-0.3-b.top;rig.arms[1].add(b.g);}
  return rig;}
function animRig(rig,st,time){
  const ph=time*13,run=st.run;
  rig.legs.forEach((l,i)=>{const s=i?-1:1;l.rotation.x=st.air?(i?0.35:-0.55):Math.sin(ph)*0.8*run*s;});
  rig.arms.forEach((a,i)=>{const s=i?1:-1;
    if(rig.armsForward){a.rotation.x=-1.35+Math.sin(ph+i)*0.12*run+(st.idle?Math.sin(time*2+i)*0.05:0);a.rotation.z=st.glide?(i?-0.5:0.5):0;}
    else if(st.glide&&rig.id!=='witch'){a.rotation.x=0;a.rotation.z=i?-1.25:1.25;}
    else{a.rotation.x=st.air?-0.6:Math.sin(ph)*0.7*run*s+(st.idle?Math.sin(time*2)*0.04:0);a.rotation.z=st.air?(i?-0.4:0.4):0;}});
  if(rig.cape){const c=rig.cape;c.pv.rotation.x=st.glide?1.35:Math.min(1.0,0.12+st.speed*0.12+(st.air?0.3:0));const p=c.geo.attributes.position;
    for(let i=0;i<p.count;i++){const yn=-c.base[i*3+1]/0.98;p.setZ(i,c.base[i*3+2]-Math.sin(time*9+yn*5+c.base[i*3]*3)*0.06*yn*(0.4+st.speed/5));}p.needsUpdate=true;}
  if(rig.broom){if(st.glide){rig.broom.position.set(0,0.36,0.05);rig.broom.rotation.set(Math.PI/2,0,0);rig.legs.forEach(l=>l.rotation.x=-1.0);}else{rig.broom.position.set(0,0.8,-0.25);rig.broom.rotation.set(0,0,0.65);}}
  if(rig.sheet){const s=rig.sheet,p=s.geo.attributes.position;const fl=st.glide?0.35:st.air?0.15:0.04+st.speed*0.015;
    for(let i=0;i<p.count;i++){const bx=s.base[i*3],by=s.base[i*3+1],bz=s.base[i*3+2];if(by>0.9)continue;const k=(0.9-by)/0.68;const a=Math.atan2(bx,bz);const r=1+k*(fl+Math.sin(a*6+time*7)*0.05);
      p.setXYZ(i,bx*r,by+k*Math.sin(a*5+time*6)*0.03,bz*r);}p.needsUpdate=true;}
  rig.strips.forEach((s,i)=>{s.rotation.x=0.3+Math.sin(time*8+i)*0.3*(0.4+st.speed/4);s.rotation.z=Math.sin(time*5+i*2)*0.2;});}

/* ---------- player ---------- */
const player={x:-62,y:0,z:zr(-62),vx:0,vz:0,vy:0,heading:Math.PI,grounded:true,coyote:0,jumpBuf:0,inv:0,squash:0,gliding:false,taffy:0,bars:0,wet:false};
const PR=0.34,PH=1.5,STEP=0.38;
let rig=null;
const shadowM=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:TX.shadow,transparent:true,depthWrite:false}));shadowM.rotation.x=-Math.PI/2;scene.add(shadowM);
let charIdx=Math.max(0,CHARS.findIndex(c=>c.id===store.char));

/* ---------- ghosts ---------- */
const ghosts=[[-47,zr(-47),4],[0,0,6],[52,27,4],[2,-15,3],[66,14,3],[-50,11,2.5]].map(([cx,cz,r])=>({g:ghostMesh(1),cx,cz,r,a:rnd()*TAU,w:(2.1/r)*(rnd()<.5?-1:1),alive:true,respawn:0,x:cx,y:0,z:cz}));

/* ---------- collision ---------- */
function collideXZ(){const tol=player.grounded?STEP:0.12;
  for(const s of solids){if(s.dead||s.maxY<=player.y+tol||s.minY>=player.y+PH)continue;
    const cx=clamp(player.x,s.minX,s.maxX),cz=clamp(player.z,s.minZ,s.maxZ);const dx=player.x-cx,dz=player.z-cz,d2=dx*dx+dz*dz;if(d2>=PR*PR)continue;
    if(d2>1e-8){const d=Math.sqrt(d2),k=(PR-d)/d;player.x+=dx*k;player.z+=dz*k;}
    else{const a=player.x-s.minX,b=s.maxX-player.x,c=player.z-s.minZ,e=s.maxZ-player.z,m=Math.min(a,b,c,e);
      if(m===a)player.x=s.minX-PR;else if(m===b)player.x=s.maxX+PR;else if(m===c)player.z=s.minZ-PR;else player.z=s.maxZ+PR;}}}
function groundAt(x,z,maxY){let best=gh(x,z),bs=null;const r=PR*0.7;
  for(const s of solids){if(s.dead||s.maxY>maxY||s.maxY<=best)continue;if(x+r<s.minX||x-r>s.maxX||z+r<s.minZ||z-r>s.maxZ)continue;best=s.maxY;bs=s;}return{y:best,s:bs};}
function insideSolid(p){for(const s of solids){if(s.dead||s.maxY-s.minY<1.6)continue;if(p.x>s.minX-0.3&&p.x<s.maxX+0.3&&p.z>s.minZ-0.3&&p.z<s.maxZ+0.3&&p.y<s.maxY+0.6&&p.y>s.minY)return true;}return false;}
function inWater(x,z,y){for(const c of CREEKS){if(creekDist(c,x,z)<1.7&&y<waterY(c,z)-0.05)return true;}return false;}

/* ---------- audio ---------- */
const AU={ctx:null,master:null,muted:false,creekG:null,
  init(){if(this.ctx){this.ctx.resume&&this.ctx.resume();return;}try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
    const c=this.ctx;this.master=c.createGain();this.master.gain.value=this.muted?0:0.7;this.master.connect(c.destination);
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=380;const dg=c.createGain();dg.gain.value=0.05;lp.connect(dg);dg.connect(this.master);
    [55,82.41,110.3].forEach((f,i)=>{const o=c.createOscillator();o.type=i===2?'triangle':'sine';o.frequency.value=f;o.detune.value=(i-1)*7;o.connect(lp);o.start();});
    const lfo=c.createOscillator();lfo.frequency.value=0.07;const lg=c.createGain();lg.gain.value=150;lfo.connect(lg);lg.connect(lp.frequency);lfo.start();
    const buf=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.nb=buf;
    const n=c.createBufferSource();n.buffer=buf;n.loop=true;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=520;bp.Q.value=0.6;const wg=c.createGain();wg.gain.value=0.025;
    n.connect(bp);bp.connect(wg);wg.connect(this.master);n.start();const l2=c.createOscillator();l2.frequency.value=0.11;const l2g=c.createGain();l2g.gain.value=0.02;l2.connect(l2g);l2g.connect(wg.gain);l2.start();
    const n2=c.createBufferSource();n2.buffer=buf;n2.loop=true;const hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=2500;this.creekG=c.createGain();this.creekG.gain.value=0;n2.connect(hp);hp.connect(this.creekG);this.creekG.connect(this.master);n2.start();
    if(c.resume)c.resume();},
  tone(f,dur,type='square',vol=0.05,f2=null,delay=0){if(!this.ctx)return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
    if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+0.03);},
  thud(f=200,dur=0.12,vol=0.3,delay=0){if(!this.ctx)return;const c=this.ctx,t=c.currentTime+delay,s=c.createBufferSource(),lp=c.createBiquadFilter(),g=c.createGain();s.buffer=this.nb;lp.type='lowpass';lp.frequency.value=f;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(lp);lp.connect(g);g.connect(this.master);s.start(t,Math.random());s.stop(t+dur+0.03);},
  pickup(){this.tone(988,0.07,'square',0.04);this.tone(1480,0.12,'square',0.04,null,0.06);},
  jump(){this.tone(260,0.14,'square',0.03,560);},
  crate(){this.thud(500,0.2,0.4);this.tone(180,0.12,'triangle',0.08,80);},
  knock(){[0,0.22,0.44].forEach(d=>this.thud(170,0.09,0.6,d));},
  treat(){[523,659,784,1047].forEach((f,i)=>this.tone(f,0.28,'triangle',0.08,null,i*0.09));},
  hurt(){this.tone(320,0.35,'sawtooth',0.05,80);},
  stomp(){this.tone(500,0.2,'sine',0.1,1300);},
  splash(){this.thud(1400,0.25,0.2);},
  blip(){this.tone(660,0.06,'square',0.035);},
  setMuted(m){this.muted=m;if(this.master)this.master.gain.value=m?0:0.7;}};

/* ---------- HUD ---------- */
const $=id=>document.getElementById(id);
const pkSvg='<svg class="pk" viewBox="0 0 24 22" aria-hidden="true"><path d="M12 5c0-2 1-3 3-3" stroke="#5a7a2a" stroke-width="2" fill="none"/><ellipse cx="12" cy="13" rx="10" ry="8" fill="currentColor"/><path d="M6.5 12l2.2-2.6 2.2 2.6zM13.1 12l2.2-2.6 2.2 2.6zM7 15q5 4 10 0q-5 1.6-10 0z" fill="#1a0e06"/></svg>';
$('houses').innerHTML=HOUSES.map(()=>pkSvg).join('');
$('taffyTotal').textContent=totalTaffy;
function hud(bump){$('taffyCount').textContent=player.taffy;[...document.querySelectorAll('.pk')].forEach((el,i)=>el.classList.toggle('lit',!!HOUSES[i].visited));
  if(bump){const c=$('taffyChip');c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');}}
let toastT=0;function toast(big,small=''){const el=$('toast');el.querySelector('b').textContent=big;el.querySelector('span').textContent=small;el.classList.add('on');toastT=small?3.4:1.4;}
let hintT=0;function hint(s,d=5){$('hint').textContent=s;$('hint').classList.add('on');hintT=d;}
$('controlsList').innerHTML=isTouch
  ?'<li>Left thumb: drag to walk</li><li>JUMP button: jump · hold to glide</li><li>Drag the right side to turn the camera</li>'+(innerHeight>innerWidth?'<li>Turn your phone sideways for the best view</li>':'')
  :'<li>WASD or arrows: walk · Space: jump, hold to glide</li><li>Q / E or drag the mouse: turn the camera</li>';
$('charDots').innerHTML=CHARS.map(()=>'<i></i>').join('');

/* ---------- input ---------- */
const input={sx:0,sy:0,jumpPressed:false,jumpHeld:false};const keys={};
let state='title';
const cam={yaw:0,dist:3.6,ty:1.3,manual:0};
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.repeat)return;keys[e.code]=true;
  if(state==='select'){if(e.code==='ArrowLeft'||e.code==='KeyA')setChar(charIdx-1);if(e.code==='ArrowRight'||e.code==='KeyD')setChar(charIdx+1);if(e.code==='Enter'||e.code==='Space')go();return;}
  if(e.code==='Space'){input.jumpPressed=true;input.jumpHeld=true;}if(state==='title'&&(e.code==='Enter'||e.code==='Space'))toSelect();});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Space')input.jumpHeld=false;});
const game=$('game'),stick=$('stick'),knob=$('knob'),jb=$('jumpBtn');const touch={stick:null,look:null};
game.addEventListener('pointerdown',e=>{if(state!=='play'||e.target.closest('button'))return;
  if(e.pointerType!=='mouse'&&e.clientX<innerWidth*0.45&&!touch.stick){touch.stick={id:e.pointerId,ox:e.clientX,oy:e.clientY};stick.style.left=e.clientX+'px';stick.style.top=e.clientY+'px';stick.hidden=false;knob.style.transform='';}
  else if(!touch.look)touch.look={id:e.pointerId,lx:e.clientX};});
game.addEventListener('pointermove',e=>{if(touch.stick&&e.pointerId===touch.stick.id){let dx=e.clientX-touch.stick.ox,dy=e.clientY-touch.stick.oy;const d=Math.hypot(dx,dy),m=52;if(d>m){dx*=m/d;dy*=m/d;}
    knob.style.transform=`translate(${dx}px,${dy}px)`;input.sx=dx/m;input.sy=-dy/m;}
  else if(touch.look&&e.pointerId===touch.look.id){cam.yaw-=(e.clientX-touch.look.lx)*0.009;touch.look.lx=e.clientX;cam.manual=2.5;}});
const release=e=>{if(touch.stick&&e.pointerId===touch.stick.id){touch.stick=null;stick.hidden=true;input.sx=input.sy=0;}if(touch.look&&e.pointerId===touch.look.id)touch.look=null;};
game.addEventListener('pointerup',release);game.addEventListener('pointercancel',release);
jb.addEventListener('pointerdown',e=>{e.preventDefault();input.jumpPressed=true;input.jumpHeld=true;jb.classList.add('down');try{jb.setPointerCapture(e.pointerId);}catch(_){}});
const jbUp=()=>{input.jumpHeld=false;jb.classList.remove('down');};jb.addEventListener('pointerup',jbUp);jb.addEventListener('pointercancel',jbUp);
$('muteBtn').addEventListener('click',()=>{AU.setMuted(!AU.muted);$('muteBtn').textContent=AU.muted?'SND OFF':'SND ON';});

/* ---------- game flow ---------- */
let playTime=0,endShown=false,started=false,selYaw=0;
function setChar(i){charIdx=(i+CHARS.length)%CHARS.length;if(rig)scene.remove(rig.root);rig=buildChar(CHARS[charIdx].id);scene.add(rig.root);
  $('charName').textContent=CHARS[charIdx].name;$('charDesc').textContent=CHARS[charIdx].desc;[...$('charDots').children].forEach((d,k)=>d.classList.toggle('on',k===charIdx));
  store.char=CHARS[charIdx].id;save();if(state==='select')AU.blip();}
setChar(charIdx);
function resetGame(){player.x=-62;player.z=zr(-62);player.y=gh(player.x,player.z);player.vx=player.vz=player.vy=0;player.heading=Math.PI;player.taffy=0;player.bars=0;player.inv=0;
  tokens=baseTokens.map(p=>({x:p.x,y:p.y,z:p.z,alive:true,tw:null,ph:Math.random()*TAU}));
  crates.forEach(c=>{c.alive=true;c.s.dead=false;c.m.visible=true;});ghosts.forEach(g=>{g.alive=true;g.g.visible=true;});
  HOUSES.forEach(h=>{h.visited=false;h.lamp.material=M.lampOn;h.flash=0;});playTime=0;endShown=false;hud();}
resetGame();
function toSelect(){if(state!=='title'&&state!=='play')return;AU.init();selYaw=state==='play'?cam.yaw:0;
  state='select';$('titleScreen').hidden=true;$('hud').hidden=true;jb.hidden=true;$('selectScreen').hidden=false;setChar(charIdx);}
function go(){if(state!=='select')return;$('selectScreen').hidden=true;$('hud').hidden=false;if(isTouch)jb.hidden=false;state='play';cam.yaw=selYaw;cam.dist=3.6;cam.ty=player.y+1.3;
  if(!started){started=true;hint('Knock on every porch with the light on. The creek is cold, so use the bridges.',6);}}
$('startBtn').addEventListener('click',toSelect);
$('prevBtn').addEventListener('click',()=>setChar(charIdx-1));$('nextBtn').addEventListener('click',()=>setChar(charIdx+1));$('goBtn').addEventListener('click',go);
$('costumeBtn').addEventListener('click',toSelect);
$('wanderBtn').addEventListener('click',()=>{$('endScreen').hidden=true;state='play';if(isTouch)jb.hidden=false;hint('The night keeps going. Find the taffy you missed.',4);});
$('againBtn').addEventListener('click',()=>{$('endScreen').hidden=true;resetGame();cam.yaw=0;state='play';if(isTouch)jb.hidden=false;});

function spawnToken(fx,fy,fz,tx,tz){const g=groundAt(tx,tz,fy+1).y;tokens.push({x:tx,y:g+0.8,z:tz,alive:true,ph:Math.random()*TAU,tw:{fx,fy,fz,t:0}});}
function breakCrate(c){c.alive=false;c.s.dead=true;c.m.visible=false;AU.crate();emit(c.p,26,[0x8a5a2c,0xc48a4a,0xe07a1c],4,0.7,4);
  for(let i=0;i<c.tokens;i++){const a=Math.random()*TAU,d=1.0+Math.random()*0.6;spawnToken(c.p.x,c.p.y,c.p.z,c.p.x+Math.cos(a)*d,c.p.z+Math.sin(a)*d);}}
function onLand(impact,s){player.squash=Math.min(0.3,impact*0.025);if(s&&s.crate&&s.crate.alive&&impact>1.2){breakCrate(s.crate);player.vy=8.5;player.grounded=false;}}
function visit(h){h.visited=true;AU.knock();toast('Knock knock…');
  setTimeout(()=>{AU.treat();player.bars++;toast('TRICK OR TREAT!',h.line);h.flash=1;emit(h.door.clone().add(new V3(0,1.2,0)),40,[0xff8a1f,0x2ec5ff,0xffd24a,0xe8344a,0xf4f2ff],3,1.2,5);
    h.lamp.material=M.lampOff;hud();if(HOUSES.every(x=>x.visited)&&!endShown){endShown=true;setTimeout(showEnd,3200);}},900);}
function showEnd(){state='end';$('stTaffy').textContent=player.taffy+' / '+totalTaffy;$('stBars').textContent=player.bars;const s=playTime|0;$('stTime').textContent=(s/60|0)+':'+String(s%60).padStart(2,'0');$('endScreen').hidden=false;jb.hidden=true;}

/* ---------- update ---------- */
let time=0,splashT=0;
function update(dt){
  playTime+=dt;
  const kx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),ky=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
  let ix=kx+input.sx,iy=ky+input.sy;const len=Math.hypot(ix,iy);if(len>1){ix/=len;iy/=len;}
  if(keys.KeyQ){cam.yaw+=dt*2;cam.manual=1;}if(keys.KeyE){cam.yaw-=dt*2;cam.manual=1;}
  const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);
  const wx=fx*iy+rx*ix,wz=fz*iy+rz*ix;const spd=player.wet?3.6:6.4,acc=(player.grounded?42:20)*dt;
  player.vx+=clamp(wx*spd-player.vx,-acc,acc);player.vz+=clamp(wz*spd-player.vz,-acc,acc);
  if(Math.hypot(ix,iy)>0.1)player.heading=lerpAngle(player.heading,Math.atan2(wx,wz),1-Math.exp(-14*dt));
  player.coyote=player.grounded?0.1:player.coyote-dt;player.jumpBuf-=dt;
  if(input.jumpPressed){player.jumpBuf=0.14;input.jumpPressed=false;}
  if(player.jumpBuf>0&&player.coyote>0){player.vy=10.2;player.grounded=false;player.coyote=0;player.jumpBuf=0;AU.jump();}
  let g=-26;if(player.vy>0&&!input.jumpHeld)g=-50;
  player.gliding=!player.grounded&&player.vy<0&&input.jumpHeld;if(player.gliding)g=-7;
  player.vy=Math.max(player.vy+g*dt,player.gliding?-2.6:-30);
  const prevY=player.y,wasG=player.grounded;
  player.x+=player.vx*dt;collideXZ();player.z+=player.vz*dt;collideXZ();
  player.x=clamp(player.x,-88,88);player.z=clamp(player.z,-50,50);
  const gr=groundAt(player.x,player.z,prevY+(wasG?STEP:0.02));let ny=prevY+player.vy*dt;
  if(ny<=gr.y){const imp=-player.vy;ny=gr.y;player.vy=0;player.grounded=true;if(!wasG)onLand(imp,gr.s);}
  else if(wasG&&player.vy<=0&&prevY-gr.y<=STEP){ny=gr.y;player.vy=0;player.grounded=true;}
  else player.grounded=false;
  player.y=ny;player.inv=Math.max(0,player.inv-dt);
  const wet=inWater(player.x,player.z,player.y);if(wet&&!player.wet){AU.splash();emit(new V3(player.x,player.y+0.4,player.z),18,[0x9ab4ff,0xffffff],2,0.6,3);}player.wet=wet;
  if(wet&&Math.hypot(player.vx,player.vz)>1){splashT-=dt;if(splashT<=0){splashT=0.18;emit(new V3(player.x,player.y+0.35,player.z),4,[0x9ab4ff,0xffffff],1,0.4,2);}}
  const cy=player.y+0.75;
  for(const t of tokens){if(!t.alive||(t.tw&&t.tw.t<0.35))continue;const dx=t.x-player.x,dy=(t.y-cy)*0.8,dz=t.z-player.z;
    if(dx*dx+dy*dy+dz*dz<1.0){t.alive=false;player.taffy++;AU.pickup();emit(new V3(t.x,t.y,t.z),10,[0x2ec5ff,0xffffff,0x6fd2ff],2,0.5,2);hud(true);}}
  for(const h of HOUSES){if(h.visited)continue;const dx=h.door.x-player.x,dz=h.door.z-player.z;if(dx*dx+dz*dz<1.7*1.7&&Math.abs(player.y-h.door.y)<0.6)visit(h);}
  for(const gt of ghosts){if(!gt.alive)continue;const dx=player.x-gt.x,dz=player.z-gt.z;
    if(dx*dx+dz*dz<0.8*0.8&&player.y<gt.y+1.3&&player.y+PH>gt.y+0.1){
      if(player.vy<0&&player.y>gt.y+0.7){gt.alive=false;gt.respawn=14;gt.g.visible=false;player.vy=9;player.grounded=false;AU.stomp();emit(new V3(gt.x,gt.y+0.8,gt.z),30,[0xf4f2ff,0xb8b0ff],3,0.9,3,0.3);}
      else if(player.inv<=0){const d=Math.hypot(dx,dz)||1;player.vx=dx/d*8;player.vz=dz/d*8;player.vy=6;player.grounded=false;player.inv=1.6;AU.hurt();
        const lose=Math.min(2,player.taffy);player.taffy-=lose;for(let i=0;i<lose;i++){const a=Math.random()*TAU,r=1.6+Math.random();spawnToken(player.x,player.y+1,player.z,clamp(player.x+Math.cos(a)*r,-87,87),clamp(player.z+Math.sin(a)*r,-49,49));}
        if(lose)toast('Boo!','The ghost knocked some taffy out of your bag.');hud();}}}
}

function animate(dt){
  time+=dt;
  const o=new THREE.Object3D();let n=0;
  for(const t of tokens){if(!t.alive)continue;if(n>=MAXT)break;let x=t.x,y=t.y+Math.sin(time*2.4+t.ph)*0.12,z=t.z;
    if(t.tw){t.tw.t+=dt/0.55;const f=Math.min(1,t.tw.t);x=t.tw.fx+(t.x-t.tw.fx)*f;z=t.tw.fz+(t.z-t.tw.fz)*f;y=t.tw.fy+(t.y-t.tw.fy)*f+Math.sin(f*Math.PI)*1.6;if(t.tw.t>=1)t.tw=null;}
    o.position.set(x,y,z);o.rotation.set(0.25,time*2.6,0);o.updateMatrix();taffyMesh.setMatrixAt(n,o.matrix);tGlowPos[n*3]=x;tGlowPos[n*3+1]=y;tGlowPos[n*3+2]=z;n++;}
  taffyMesh.count=n;taffyMesh.instanceMatrix.needsUpdate=true;tGlowGeo.setDrawRange(0,n);tGlowGeo.attributes.position.needsUpdate=true;
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.l-=dt;if(p.l<=0){parts.splice(i,1);continue;}p.vy-=9*p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;}
  parts.forEach((p,i)=>{pPos[i*3]=p.x;pPos[i*3+1]=p.y;pPos[i*3+2]=p.z;const f=Math.min(1,p.l*2);pCol[i*3]=p.c.r*f;pCol[i*3+1]=p.c.g*f;pCol[i*3+2]=p.c.b*f;});
  pGeo.setDrawRange(0,parts.length);pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true;
  for(const g of ghosts){if(!g.alive){g.respawn-=dt;if(g.respawn<=0){g.alive=true;g.g.visible=true;}continue;}
    g.a+=g.w*dt;g.x=g.cx+Math.cos(g.a)*g.r;g.z=g.cz+Math.sin(g.a)*g.r;g.y=gh(g.x,g.z)+0.35+Math.sin(time*2+g.a)*0.22;
    g.g.position.set(g.x,g.y,g.z);const s=Math.sign(g.w);g.g.rotation.y=Math.atan2(-Math.sin(g.a)*s,Math.cos(g.a)*s);g.g.children[0].scale.set(1+Math.sin(time*7)*0.05,1,1+Math.cos(time*7)*0.05);}
  hangGhosts.forEach(h=>{h.g.rotation.z=Math.sin(time*1.3+h.ph)*0.12;h.g.rotation.y=time*0.3+h.ph;h.g.position.y=h.base.y+Math.sin(time*1.7+h.ph)*0.05;});
  M.jack.emissiveIntensity=0.85+Math.sin(time*11)*0.08+Math.sin(time*23.7)*0.07;
  TX.water.offset.y-=dt*0.18;TX.sparkle.offset.y-=dt*0.07;TX.sparkle.offset.x=Math.sin(time*0.3)*0.05;
  HOUSES.forEach(h=>{if(h.flash)h.flash=Math.max(0,h.flash-dt*0.8);h.light.intensity=(h.visited?0.55:1.4)+(h.flash||0)*3;});
  if(AU.creekG){let cd=99;for(const c of CREEKS)cd=Math.min(cd,creekDist(c,player.x,player.z));AU.creekG.gain.value=AU.muted?0:0.05*(1-sm(3,22,cd));}
  const sp=Math.hypot(player.vx,player.vz);rig.root.position.set(player.x,player.y,player.z);
  const idle=state!=='play';
  rig.root.rotation.y=state==='select'?selYaw+Math.sin(time*0.7)*0.4:player.heading;
  animRig(rig,{run:player.grounded&&!idle?Math.min(1,sp/6):0,air:!player.grounded&&!idle,glide:player.gliding&&!idle,speed:idle?0:sp,idle},time);
  player.squash=Math.max(0,player.squash-dt*1.5);rig.body.scale.set(1+player.squash,1-player.squash,1+player.squash);
  rig.body.position.y=(player.grounded&&!idle?Math.abs(Math.sin(time*13))*0.05*Math.min(1,sp/6):0)+(idle?Math.sin(time*2.2)*0.015:0);
  rig.root.visible=state!=='title'&&(player.inv<=0||Math.floor(time*16)%2===0);
  const fl=groundAt(player.x,player.z,player.y+0.05).y,hgt=player.y-fl;shadowM.position.set(player.x,fl+0.04,player.z);shadowM.scale.setScalar(Math.max(0.35,1.0-hgt*0.12));shadowM.visible=state!=='title';
}

function updateCamera(dt){
  if(state==='title'){const h=HOUSES[0],a=Math.sin(time*0.12)*0.7;const cx=h.x,cz=h.z+6,cy=h.pad+2.2;camera.position.set(cx+Math.sin(a)*13,cy+2.6,cz+Math.cos(a)*11);camera.lookAt(cx,cy,cz-3);return;}
  if(state==='select'){const d=3.5;camera.position.set(player.x+Math.sin(selYaw)*d,player.y+1.35,player.z+Math.cos(selYaw)*d);camera.lookAt(player.x,player.y+0.95,player.z);return;}
  const moving=Math.hypot(player.vx,player.vz)>1;const ky=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+input.sy;
  if(cam.manual>0)cam.manual-=dt;else if(moving){const rate=ky>0.2?1.4:ky<-0.2?0:0.55;cam.yaw=lerpAngle(cam.yaw,player.heading+Math.PI,1-Math.exp(-rate*dt));}
  cam.ty+=(player.y+1.3-cam.ty)*(1-Math.exp(-(player.y<cam.ty-2?10:4)*dt));
  const portrait=camera.aspect<1,base=portrait?8.5:7,hf=portrait?3.4:3.0;let d=base;const tgt=new V3(player.x,cam.ty,player.z);const p=new V3();
  for(;d>2.2;d-=0.5){p.set(tgt.x+Math.sin(cam.yaw)*d,tgt.y+hf*(d/base),tgt.z+Math.cos(cam.yaw)*d);if(!insideSolid(p))break;}
  cam.dist+=(d-cam.dist)*(1-Math.exp(-(d<cam.dist?12:2.5)*dt));
  camera.position.set(tgt.x+Math.sin(cam.yaw)*cam.dist,tgt.y+hf*(cam.dist/base),tgt.z+Math.cos(cam.yaw)*cam.dist);
  const floorY=gh(camera.position.x,camera.position.z)+0.8;if(camera.position.y<floorY)camera.position.y=floorY;
  camera.lookAt(tgt.x,tgt.y+0.2,tgt.z);}

function resize(){const w=innerWidth,h=innerHeight,s=Math.max(1,Math.min(w,h)/480);renderer.setSize(Math.max(1,Math.floor(w/s)),Math.max(1,Math.floor(h/s)),false);
  camera.aspect=w/h;camera.fov=w<h?72:60;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();

let last=performance.now();
function frame(now){requestAnimationFrame(frame);let dt=(now-last)/1000;last=now;if(dt>0.05)dt=0.05;if(document.hidden)return;
  if(state==='play')update(dt);animate(dt);updateCamera(dt);sky.position.copy(camera.position);
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on');}if(hintT>0){hintT-=dt;if(hintT<=0)$('hint').classList.remove('on');}
  renderer.render(scene,camera);}
requestAnimationFrame(frame);
})();
