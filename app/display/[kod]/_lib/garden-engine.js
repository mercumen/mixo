/* eslint-disable */
// @ts-nocheck
/**
 * ANI BAHÇESİ — sahne motoru.
 *
 * KAYNAK: `docs/design/ani-bahcesi-demo.html` içindeki demo. Gövde HARFİYEN
 * korundu; tek eklemeler en altta işaretli "MIXO KÖPRÜSÜ" bloğu ve
 * `rafId` ataması. Sebep: demo görsel olarak onaylanmış durumda, motoru
 * yeniden yazmak onu bozma riski demekti. Sahne kalibrasyonu (ışık, cam,
 * renk) demo'daki değerlerle birebir aynı.
 *
 * THREE global olarak bekleniyor (CDN'den yükleniyor) — bkz. garden-stage.tsx.
 *
 * DEMO ARAYÜZÜ: motor dosya seçici, ayar paneli, final kutusu gibi demo
 * öğelerinin DOM'da var olduğunu varsayıyor. Silmek yerine GİZLİ kabuklar
 * üretiyoruz (aşağıdaki shim): böylece motor koduna hiç dokunmadan
 * çalışıyor ve sahada gerekirse ayar paneli açılabiliyor.
 */

/** Motorun aradığı, ekranda GÖRÜNMEYECEK demo öğeleri. */
const SHIM_IDS = [
  ["addBtn", "button"], ["demoBtn", "button"], ["resetBtn", "button"],
  ["finalBtn", "button"], ["setBtn", "button"], ["fsBtn", "button"],
  ["file", "input"], ["setPanel", "aside"], ["setClose", "button"],
  ["setBody", "div"], ["setReset", "button"], ["nameBox", "div"],
  ["nameInput", "input"], ["nameGo", "button"], ["nameImgBtn", "button"],
  ["finImg", "input"], ["nameCancel", "button"], ["drop", "div"],
  ["toast", "div"],
];

/**
 * Sahneyi kurar.
 *
 * @param {HTMLElement} host  #stage ve #vignette'in içine kurulacağı kap
 * @returns {{addImage:Function, reset:Function, count:Function,
 *            finaleActive:Function, showFinale:Function, dispose:Function}}
 */
export function createGarden(host) {
  if (typeof window === "undefined" || !window.THREE) {
    throw new Error("THREE yüklenmedi");
  }
  const THREE = window.THREE;
  const api = {};
  let rafId = 0;

  // --- demo öğeleri için gizli kabuklar -------------------------------------
  const shims = document.createElement("div");
  shims.style.display = "none";
  shims.setAttribute("aria-hidden", "true");
  for (const [id, tag] of SHIM_IDS) {
    if (document.getElementById(id)) continue;
    const el = document.createElement(tag);
    el.id = id;
    if (tag === "input") el.type = id === "nameInput" ? "text" : "file";
    if (id === "nameInput") el.placeholder = "Anı Bahçesi";
    shims.appendChild(el);
  }
  host.appendChild(shims);

  // --- motorun beklediği sahne kapları -------------------------------------
  let stageEl = document.getElementById("stage");
  if (!stageEl) {
    stageEl = document.createElement("div");
    stageEl.id = "stage";
    host.appendChild(stageEl);
  }
  let vignetteEl = document.getElementById("vignette");
  if (!vignetteEl) {
    vignetteEl = document.createElement("div");
    vignetteEl.id = "vignette";
    host.appendChild(vignetteEl);
  }

  // ==========================================================================
  // BURADAN AŞAĞISI DEMO GÖVDESİ — DEĞİŞTİRİLMEDİ
  // ==========================================================================
"use strict";
var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var CAP = 15;             // foto yaprağı sayısı — 5×3 tam dikdörtgen mozaik için 15
var BUD = 26;             // başlangıçtaki iç tomurcuk yaprakları — boşken de gül gibi dursun
var SPAN = 116;           // yerleşim ölçeği: gülün açıklığı. Küçültürsen açılır, büyütürsen sıkılaşır

// canlı ayar durumu — Ayarlar panelinden değişir
var S = {
  keyInt:2.35, keyCol:'#FFE4D2', fillInt:.55, ambInt:2.4,
  glowInt:2.45, stemLight:2.2, hueOn:true, hueSpeed:.07,
  rough:.02, coat:0, emiss:.41, envI:.4, stemEmiss:.35,
  glassOn:true, trans:1, thick:.4, ior:2.29, gRough:0,
  petalBump:.006, texAmt:.6,
  spin:.003, wind:1.65, sway:1.7, petalHue:360, petalSpread:64,
  cloudN:80000, cloudSpeed:.3, cloudSize:4.3, cloudOpa:.8, hueC:.725, hueW:.275,
  vign:1, holdCardS:1.5, holdAS:2.8, holdBS:4.5
};
var DEF = JSON.parse(JSON.stringify(S));
var glassExtras = [];                             // cam moduna katılan sap/çanak/yaprak/tomurcuk malzemeleri
var greenMats = [];                               // sap/çanak/yeşil yaprak malzemeleri — dal ışıması ayarı
var GOLDEN = 137.50776 * Math.PI/180;

// ---------- sahne ----------
var stage = document.getElementById('stage');
var renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(innerWidth, innerHeight);
stage.appendChild(renderer.domElement);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x130B12);
scene.fog = new THREE.Fog(0x130B12, 4.2, 9.5);

// ışıklandırma — yapraklara hacim ve sıcaklık verir
var ambL = new THREE.AmbientLight(0x3A1626, 1.15); scene.add(ambL);
var keyL = new THREE.DirectionalLight(0xFFE4D2, 1.25);
keyL.position.set(2.6, 3.0, 2.2); scene.add(keyL);
var fillL = new THREE.DirectionalLight(0x6E4A8C, .3);
fillL.position.set(-2.8, -.8, -1.5); scene.add(fillL);
var glowL = new THREE.PointLight(0xFF4D5E, 1.35, 3.6, 2);
glowL.position.set(0, .5, 0); scene.add(glowL);
var stemL = new THREE.PointLight(0xFFEEDD, 2.2, 3.5, 2);   // sapı önden yalayan glint — cam sap bu parıltıyla okunur
stemL.position.set(.7, -.75, 1.5); scene.add(stemL);

// cam efekti için stüdyo yansıma haritası — yapraklar dönerken ışık şeritleri üzerinde kayar
var envMap = (function(){
  var faces = [];
  for(var f=0; f<6; f++){
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    var gr = g.createLinearGradient(0,64,0,0);
    gr.addColorStop(0,'#160610'); gr.addColorStop(.6,'#33101E'); gr.addColorStop(1,'#6E2030');
    g.fillStyle = gr; g.fillRect(0,0,64,64);
    var rad = g.createRadialGradient(32, f===2?16:10, 2, 32, f===2?16:10, 40);
    rad.addColorStop(0,'rgba(255,224,214,'+(f===2?'.45':'.2')+')');
    rad.addColorStop(1,'rgba(255,224,214,0)');
    g.fillStyle = rad; g.fillRect(0,0,64,64);                                 // yumuşak stüdyo ışığı
    faces.push(c);
  }
  var tex = new THREE.CubeTexture(faces);
  tex.needsUpdate = true;
  return tex;
})();

// yaprak kabartma haritası — yumuşak oluklar, kenarlarda sıfırlanan güvenlik payı
var petalBump = (function(){
  var W=512, H=640;
  var det = document.createElement('canvas'); det.width=W; det.height=H;   // 1) detay katmanı
  var g = det.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0,0,W,H);
  g.lineCap = 'round';
  g.strokeStyle = '#606060'; g.lineWidth = 9;                              // orta damar — geniş, ılımlı oluk
  g.beginPath(); g.moveTo(W*.5,H*.93); g.quadraticCurveTo(W*.52,H*.5, W*.5,H*.12); g.stroke();
  g.strokeStyle = '#6a6a6a'; g.lineWidth = 4;                              // yan damarlar
  for(var v=-2; v<=2; v++){
    if(!v) continue;
    g.beginPath(); g.moveTo(W*.5,H*.9);
    g.quadraticCurveTo(W*(.5+v*.085),H*.5, W*(.5+v*.12),H*.2); g.stroke();
  }
  for(var k=0; k<20; k++){                                                 // boyuna ince kırışıklıklar — çok hafif
    var f = (k/19-.5)*2;
    g.strokeStyle = k%2 ? '#767676' : '#8a8a8a';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(W*(.5+f*.05), H*.88);
    g.quadraticCurveTo(W*(.5+f*.24), H*.5, W*(.5+f*.34), H*.18); g.stroke();
  }
  for(var n=0; n<340; n++){                                                // pürüz yerine yumuşak beneklenme
    g.fillStyle = (Math.random()<.5 ? 'rgba(0,0,0,' : 'rgba(255,255,255,') + (Math.random()*.045) + ')';
    g.beginPath(); g.arc(Math.random()*W, Math.random()*H, 3+Math.random()*6, 0, 6.29); g.fill();
  }
  var msk = document.createElement('canvas'); msk.width=W; msk.height=H;   // 2) kenar güvenlik payı
  var m = msk.getContext('2d');
  m.fillStyle = '#808080'; m.fillRect(0,0,W,H);
  m.save();
  m.translate(W/2,H/2); m.scale(.9,.93); m.translate(-W/2,-H/2);           // %7-10 içeri çekilmiş yaprak
  petalPath(m,W,H); m.clip();
  m.drawImage(det,0,0);
  m.restore();
  var c = document.createElement('canvas'); c.width=W; c.height=H;         // 3) tamamını yumuşat
  var o = c.getContext('2d');
  o.fillStyle = '#808080'; o.fillRect(0,0,W,H);
  o.filter = 'blur(3px)';
  o.drawImage(msk,0,0);
  o.filter = 'none';
  var t = new THREE.CanvasTexture(c);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
})();

var camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, .1, 40);
camera.position.set(0, 1.25, 3.9);

var plant = new THREE.Group();               // kök pivotu — tüm bitki buradan salınır
plant.position.y = -1.03;
scene.add(plant);
var rose = new THREE.Group();
rose.position.y = 1.08;
plant.add(rose);

// akan piksel bulutu (GPU'da hesaplanır) — ayarlardan yeniden kurulabilir
var cloud, cloudU;
function buildCloud(){
  if(cloud){
    scene.remove(cloud);
    cloud.geometry.dispose(); cloud.material.dispose();
  }
  var CLOUD_N = REDUCED ? Math.min(14000, S.cloudN) : (innerWidth < 700 ? Math.min(28000, S.cloudN) : S.cloudN);
  var pos = new Float32Array(CLOUD_N*3);
  var seed = new Float32Array(CLOUD_N);
  for(var i=0;i<CLOUD_N;i++){
    var fg = Math.random() < .12;                 // %12'si gülün önünden geçen ince katman
    pos[i*3]   = (Math.random()-.5)*12;
    pos[i*3+1] = fg ? -1.2 + Math.random()*3.9 : -3.6 + Math.random()*6.3;   // arka katman alt bölgeye de iner — spotun yerini bulut doldurur
    pos[i*3+2] = fg ? .8 + Math.random()*1.4 : -4.9 + Math.random()*4.2;
    seed[i] = Math.random();
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed,1));
  cloudU = {
    uTime:{value:0}, uPulse:{value:0},
    uSpeed:{value: REDUCED ? .08 : S.cloudSpeed},
    uSize:{value: renderer.getPixelRatio()*S.cloudSize},
    uOpa:{value: S.cloudOpa},
    uHueC:{value: S.hueC},
    uHueW:{value: S.hueW}
  };
  var mat = new THREE.ShaderMaterial({
    uniforms: cloudU,
    transparent:false, depthWrite:false, blending:THREE.AdditiveBlending,   // opak listede: cam içinden kırılarak görünür
    vertexShader: [
      'attribute float aSeed;',
      'uniform float uTime,uPulse,uSpeed,uSize,uHueC,uHueW;',
      'varying float vMix,vA,vSpark;',
      'void main(){',
      '  vec3 p=position;',
      '  p.x=mod(p.x+uTime*uSpeed*(.4+aSeed*.6)+6.,12.)-6.;',
      '  float t=uTime;',
      '  float amp=.22+uPulse*.5;',
      '  p.x+=amp*(sin(p.y*1.7+t*.5+aSeed*6.28)+sin(p.z*1.3-t*.31));',
      '  p.y+=amp*(sin(p.z*1.9+t*.42)+sin(p.x*1.1+t*.26+aSeed*3.1));',
      '  p.z+=amp*.6*(sin(p.x*1.5-t*.37)+sin(p.y*1.2+t*.44));',
      '  float m0=fract(aSeed*7.13 + p.y*.06 + uTime*.015);',
      '  vMix=fract(uHueC + abs(m0*2.-1.)*uHueW);',
      '  vSpark=step(.94, fract(aSeed*13.7));',
      '  vec4 mv=modelViewMatrix*vec4(p,1.);',
      '  float dist=-mv.z;',
      '  vA=(.35+.65*aSeed)*smoothstep(10.,5.5,dist)*smoothstep(.4,1.6,dist);',
      '  vA*=.75+uPulse*.6;',
      '  gl_PointSize=uSize*(.5+aSeed)*(3.6/dist);',
      '  gl_Position=projectionMatrix*mv;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform float uOpa;',
      'varying float vMix,vA,vSpark;',
      'vec3 h2r(vec3 c){ vec3 p=abs(fract(c.xxx+vec3(0.,.6666,.3333))*6.-3.); return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y); }',
      'void main(){',
      '  vec2 q=gl_PointCoord-.5;',
      '  float a=smoothstep(.5,.05,length(q));',
      '  vec3 col=h2r(vec3(vMix,.8,1.));',
      '  col=mix(col,vec3(1.,.94,.88),vSpark*.75);',
      '  gl_FragColor=vec4(col,a*vA*uOpa);',
      '}'
    ].join('\n')
  });
  cloud = new THREE.Points(geo, mat);
  cloud.renderOrder = -1;
  cloud.frustumCulled = false;
  scene.add(cloud);
}
buildCloud();
function cloudPulse(){ if(!REDUCED) cloudU.uPulse.value = Math.min(1.4, cloudU.uPulse.value + 1); }

// çekirdek tomurcuk
(function(){
  var coreMat = new THREE.MeshPhysicalMaterial({color:0x5C0A16, roughness:.95, metalness:0, clearcoat:0, envMap:envMap, envMapIntensity:.08});
  coreMat.userData = {rough0:.95, env0:.08};
  glassExtras.push(coreMat);
  var core = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 16), coreMat);
  core.position.y = .34; core.scale.y = 1.25;
  rose.add(core);
})();

// ---------- yaprak dokusu ----------
var PETAL_HUES = ['#CD277F','#CD2766','#CD274D','#CD2733','#CD3327','#CD4D27','#CD6627','#CD7F27'];
var petalOverlay = null;                          // panelden yüklenen kullanıcı dokusu
function shade(hex,f){
  var n=parseInt(hex.slice(1),16), r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  return 'rgb('+Math.round(r*f)+','+Math.round(g*f)+','+Math.round(b*f)+')';
}
function petalPath(g,W,H){
  g.beginPath();
  g.moveTo(W*.5, H*.97);
  g.bezierCurveTo(W*.07, H*.74, W*.03, H*.30, W*.5, H*.045);
  g.bezierCurveTo(W*.97, H*.30, W*.93, H*.74, W*.5, H*.97);
  g.closePath();
}
function coverDraw(g, img, W, H){
  var iw = img.width||img.videoWidth, ih = img.height||img.videoHeight;
  var s = Math.max(W/iw, H/ih), w = iw*s, h = ih*s;
  g.drawImage(img, (W-w)/2, (H-h)/2, w, h);
}
function makePetalTexture(img){
  var W=512, H=640;
  var c = document.createElement('canvas'); c.width=W; c.height=H;
  var g = c.getContext('2d');
  petalPath(g,W,H); g.save(); g.clip();

  var tint = PETAL_HUES[(Math.random()*PETAL_HUES.length)|0];
  if(img){
    g.filter = 'grayscale(1) contrast(1.06) brightness(1.05)';
    coverDraw(g,img,W,H);
    g.filter = 'none';
    g.globalCompositeOperation = 'color';        // duotone: parlaklık korunur, yaprağın tonuna boyanır
    g.fillStyle = tint;
    g.fillRect(0,0,W,H);
  }else{
    var pg = g.createLinearGradient(0,H,0,0);
    pg.addColorStop(0, shade(tint,.32));
    pg.addColorStop(1, tint);
    g.fillStyle = pg; g.fillRect(0,0,W,H);
  }

  if(petalOverlay && S.texAmt > 0){               // kullanıcı dokusu — yaprağın kumaşı
    g.globalAlpha = S.texAmt;
    g.globalCompositeOperation = 'overlay';
    coverDraw(g, petalOverlay, W, H);
    g.globalAlpha = 1;
  }

  // taban gölgesi
  g.globalCompositeOperation = 'multiply';
  var sh = g.createLinearGradient(0,H,0,H*.35);
  sh.addColorStop(0, shade(tint,.3)); sh.addColorStop(1,'rgba(255,255,255,1)');
  g.fillStyle = sh; g.fillRect(0,0,W,H);

  // uç ışığı
  g.globalCompositeOperation = 'screen';
  var hi = g.createRadialGradient(W*.5,H*.16,20, W*.5,H*.2,W*.65);
  hi.addColorStop(0,'rgba(255,238,235,.26)'); hi.addColorStop(1,'rgba(255,238,235,0)');
  g.fillStyle = hi; g.fillRect(0,0,W,H);

  // damarlar — ortada bir, yanlara fan gibi dört ince
  g.globalCompositeOperation = 'multiply';
  g.strokeStyle = 'rgba(25,12,20,.2)'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(W*.5,H*.95); g.quadraticCurveTo(W*.52,H*.5, W*.5,H*.09); g.stroke();
  g.strokeStyle = 'rgba(25,12,20,.12)'; g.lineWidth = 3;
  for(var v=-2;v<=2;v++){
    if(!v) continue;
    g.beginPath(); g.moveTo(W*.5,H*.94);
    g.quadraticCurveTo(W*(.5+v*.09),H*.5, W*(.5+v*.135),H*.16); g.stroke();
  }

  // tane dokusu — plastik pürüzsüzlüğü kırar
  g.fillStyle = 'rgba(20,10,16,.05)';
  for(var n=0;n<700;n++) g.fillRect(Math.random()*W,Math.random()*H,2,2);
  g.globalCompositeOperation = 'screen';
  g.fillStyle = 'rgba(255,240,240,.04)';
  for(n=0;n<350;n++) g.fillRect(Math.random()*W,Math.random()*H,2,2);
  g.restore();

  // kenar — belli belirsiz
  g.globalCompositeOperation = 'source-over';
  petalPath(g,W,H);
  g.strokeStyle = 'rgba(255,238,235,.2)'; g.lineWidth = 3; g.stroke();

  var t = new THREE.CanvasTexture(c);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

// ---------- yaprak geometrisi (kavisli) ----------
var petalGeo = (function(){
  var geo = new THREE.PlaneGeometry(1, 1.3, 10, 14);
  geo.translate(0, .65, 0);                       // taban orijine
  var p = geo.attributes.position;
  for(var i=0;i<p.count;i++){
    var x=p.getX(i), y=p.getY(i), ny=y/1.3;
    var arch = Math.sin(ny*Math.PI*.9)*.3;        // boyuna kavis
    var curl = -(x*x)*1.5*(.2+.8*ny);             // yanlar geriye kıvrılır
    var tip  = Math.pow(Math.max(0,(ny-.68)/.32),1.8)*.24;  // uç dışa döner — gül karakteri
    p.setZ(i, arch+curl+tip);
  }
  geo.computeVertexNormals();
  return geo;
})();

// ---------- sap, yapraklar, dikenler ----------
var swayParts = [];                              // rüzgârda titreşecek yeşil parçalar
function makeLeafTexture(){
  var W=256, H=340;
  var c = document.createElement('canvas'); c.width=W; c.height=H;
  var g = c.getContext('2d');
  petalPath(g,W,H); g.save(); g.clip();
  var pg = g.createLinearGradient(0,H,0,0);
  pg.addColorStop(0,'#1E3618'); pg.addColorStop(1,'#3E6B2E');
  g.fillStyle = pg; g.fillRect(0,0,W,H);
  g.globalCompositeOperation = 'multiply';
  g.strokeStyle = 'rgba(16,38,12,.5)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(W*.5,H*.95); g.quadraticCurveTo(W*.52,H*.5, W*.5,H*.08); g.stroke();
  g.strokeStyle = 'rgba(16,38,12,.3)'; g.lineWidth = 2;
  for(var v=-2;v<=2;v++){
    if(!v) continue;
    g.beginPath(); g.moveTo(W*.5,H*.8);
    g.quadraticCurveTo(W*(.5+v*.1),H*.45, W*(.5+v*.16),H*.18); g.stroke();
  }
  g.restore();
  return new THREE.CanvasTexture(c);
}
function makeStemTexture(){
  var W=512, H=128;
  var c = document.createElement('canvas'); c.width=W; c.height=H;
  var g = c.getContext('2d');
  g.fillStyle = '#375631'; g.fillRect(0,0,W,H);
  for(var i=0;i<16;i++){                          // boyuna damarlar — dikişsiz dalgalı çizgiler
    var y = 10+Math.random()*(H-20);
    var light = Math.random()<.5;
    g.strokeStyle = light ? 'rgba(96,140,72,'+(0.1+Math.random()*.14)+')' : 'rgba(20,36,14,'+(0.14+Math.random()*.14)+')';
    g.lineWidth = 1.5+Math.random()*3;
    var k = 1+((Math.random()*3)|0), ph = Math.random()*6.28, amp = 1+Math.random()*3;
    g.beginPath();
    for(var x=0;x<=W;x+=8){
      var yy = y + Math.sin(x/W*6.283*k+ph)*amp;
      if(x===0) g.moveTo(x,yy); else g.lineTo(x,yy);
    }
    g.stroke();
  }
  for(i=0;i<5;i++){                               // güneş yanığı kızıllıklar
    var rx = Math.random()*W, ry = Math.random()*H;
    var rg = g.createRadialGradient(rx,ry,2, rx,ry,30+Math.random()*40);
    rg.addColorStop(0,'rgba(122,54,40,.09)'); rg.addColorStop(1,'rgba(122,54,40,0)');
    g.fillStyle = rg; g.fillRect(0,0,W,H);
  }
  for(i=0;i<70;i++){                              // lentiseller — küçük açık benekler
    g.fillStyle = 'rgba(196,186,140,'+(0.06+Math.random()*.09)+')';
    var lw = 1+Math.random()*2.5;
    g.fillRect(Math.random()*W, 8+Math.random()*(H-16), lw, lw*.6);
  }
  for(i=0;i<500;i++){                             // ince tane
    g.fillStyle = Math.random()<.5 ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.04)';
    g.fillRect(Math.random()*W, Math.random()*H, 1.5, 1.5);
  }
  return c;
}
(function(){
  var stemTex = new THREE.CanvasTexture(makeStemTexture());
  stemTex.wrapS = stemTex.wrapT = THREE.RepeatWrapping;
  stemTex.repeat.set(2,1);
  var curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,-1.9,0),                  // sap ekranın altına dek uzar
    new THREE.Vector3(.06,-.78,.03),
    new THREE.Vector3(-.05,-.46,-.02),
    new THREE.Vector3(0,.05,0)
  ]);
  var stemMat = new THREE.MeshPhysicalMaterial({map:stemTex, bumpMap:stemTex, bumpScale:.006, roughness:.85, metalness:0, envMap:envMap, envMapIntensity:0,
    emissive:0xffffff, emissiveMap:stemTex, emissiveIntensity:S.stemEmiss});   // cam modu dışında karanlıkta dal okunsun
  stemMat.userData = {rough0:.85, env0:0, map0:stemTex, mapGlass:null, emis0:stemTex};   // camda doku kalkar → renksiz cam
  glassExtras.push(stemMat); greenMats.push(stemMat);
  var stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, .026, 12, false), stemMat);
  rose.add(stem);
  var leafTex = makeLeafTexture();
  var leafClearTex = (function(){                 // cam modu için renksiz yaprak — şekli alfa kanalı verir
    var c = document.createElement('canvas'); c.width=256; c.height=340;
    var g = c.getContext('2d');
    petalPath(g,256,340); g.fillStyle = '#EDEAE4'; g.fill();
    return new THREE.CanvasTexture(c);
  })();
  var leafMat = new THREE.MeshPhysicalMaterial({
    map: leafTex, transparent:true, alphaTest:.3,
    side:THREE.DoubleSide, roughness:.82, metalness:0,
    clearcoat:.15, clearcoatRoughness:.5, envMap:envMap, envMapIntensity:.1,
    bumpMap:petalBump, bumpScale:.004,
    emissive:0xffffff, emissiveMap:leafTex, emissiveIntensity:S.stemEmiss
  });
  leafMat.userData = {rough0:.82, env0:.1, map0:leafTex, mapGlass:leafClearTex, emis0:leafTex};
  glassExtras.push(leafMat); greenMats.push(leafMat);
  var l1 = new THREE.Mesh(petalGeo, leafMat);
  l1.scale.set(.3,.42,.36); l1.position.set(.06,-.68,.03);
  l1.rotation.set(.55,.4,-1.15); rose.add(l1);
  swayParts.push({m:l1, bx:.55, bz:-1.15, amp:.1, sp:1.35, ph:Math.random()*6.28});
  var l2 = new THREE.Mesh(petalGeo, leafMat);
  l2.scale.set(.24,.34,.29); l2.position.set(-.05,-.44,-.02);
  l2.rotation.set(.45,-.6,1.2); rose.add(l2);
  swayParts.push({m:l2, bx:.45, bz:1.2, amp:.12, sp:1.6, ph:Math.random()*6.28});

  // uzayan alt sapın yaprakları — iki yana dönüşümlü, eğrinin üzerine oturur
  [[ .05, -1.00, .02,   .32,.45,.38,   .50, -.5,  1.15,  .11, 1.45],
   [ .03, -1.32, .01,   .26,.37,.31,   .60, 2.2, -1.10,  .10, 1.30],
   [ .015,-1.60, .01,   .29,.41,.34,   .48, 1.1,  1.05,  .12, 1.55]].forEach(function(q){
    var lf = new THREE.Mesh(petalGeo, leafMat);
    lf.position.set(q[0],q[1],q[2]);
    lf.scale.set(q[3],q[4],q[5]);
    lf.rotation.set(q[6],q[7],q[8]);
    rose.add(lf);
    swayParts.push({m:lf, bx:q[6], bz:q[8], amp:q[9], sp:q[10], ph:Math.random()*6.28});
  });

  // çanak: sapla gövdeyi kaynaştıran yeşil kupa + üç sepal
  var calyxPts = [];                              // organik kupa profili — sap kalınlığından başlar, içe kıvrılarak biter
  [[.026,0],[.032,.02],[.052,.05],[.082,.09],[.105,.13],[.116,.17],[.108,.20],[.088,.215]]
    .forEach(function(q){ calyxPts.push(new THREE.Vector2(q[0], q[1])); });
  var calyxMat = new THREE.MeshPhysicalMaterial({map:stemTex, bumpMap:stemTex, bumpScale:.005, roughness:.8, metalness:0, side:THREE.DoubleSide, envMap:envMap, envMapIntensity:0,
    emissive:0xffffff, emissiveMap:stemTex, emissiveIntensity:S.stemEmiss});
  calyxMat.userData = {rough0:.8, env0:0, map0:stemTex, mapGlass:null, emis0:stemTex};
  glassExtras.push(calyxMat); greenMats.push(calyxMat);
  var calyx = new THREE.Mesh(new THREE.LatheGeometry(calyxPts, 20), calyxMat);
  calyx.position.y = .02;                         // sapın bittiği yerden kesintisiz büyür
  rose.add(calyx);
  for(var si=0; si<3; si++){
    var hold = new THREE.Group();
    hold.rotation.y = si*2.094 + .5;
    var sp = new THREE.Mesh(petalGeo, leafMat);
    sp.scale.set(.17,.25,.2);
    sp.position.set(0, .12, .1);
    sp.rotation.x = 2.05;                         // kupanın belinden dışa sarkan sepal
    hold.add(sp); rose.add(hold);
    swayParts.push({m:sp, bx:1.9, bz:0, amp:.05, sp:1.1, ph:si*2.1});
  }
})();

// ---------- slot yerleşimi (phyllotaxis) ----------
function slotParams(i){
  var t = Math.min(1, i/(SPAN-1));               // dökülme sayısından bağımsız — kapasite değişse de gül aynı durur
  var e = Math.pow(t,.72);
  return {
    angle: i*GOLDEN,
    tilt:  .1 + 1.22*e,          // merkez neredeyse dik, dış kademeli açılır
    y:     .38 - .56*e,
    out:   .02 + .24*e,
    scale: .3 + .95*e
  };
}

// ---------- yaprak yönetimi ----------
var petals = [];      // {holder, mesh, mat, born, p, phase, isPhoto}
var photoCount = 0;
var slotNext = 0;
var countEl = document.getElementById('count');

function makePetalEntry(tex, isPhoto){
  var slot, reuse = null;
  if(slotNext < CAP+BUD){ slot = slotNext++; }
  else{
    for(var i=0;i<petals.length;i++){ if(petals[i].isPhoto){ reuse = petals[i]; break; } }
  }
  var mat = new THREE.MeshPhysicalMaterial({
    map:tex, transparent:true, side:THREE.DoubleSide,
    roughness:S.glassOn ? S.gRough : S.rough, metalness:0,
    clearcoat:S.coat,                             // 0 = kadife, 1 = cam cilası
    transmission:S.glassOn ? S.trans : 0,         // gerçek cam: ışık içinden kırılarak geçer
    thickness:S.thick, ior:S.ior,
    bumpMap:petalBump, bumpScale:S.petalBump,
    emissive:0xffffff, emissiveMap:tex, emissiveIntensity:S.emiss,   // içten sızan ışık
    envMap:envMap, envMapIntensity:S.envI,
    alphaTest:.3, depthWrite:true,               // derinlik yazımı: dönerken yapraklar birbirinin içinden geçmez
    opacity:0
  });

  if(reuse){
    spawnFaller(reuse);                          // eski yaprak kopar, düşer, buluta karışır
    reuse.mesh.material = reuse.mat = mat;
    reuse.pending = true; reuse.born = Infinity;
    petals.splice(petals.indexOf(reuse),1); petals.push(reuse);
    return reuse;
  }
  var base = slotParams(slot);
  var jit = .25 + .75*Math.min(1, slot/(BUD*1.4)); // merkezde az, dışa doğru artan doğal dağınıklık
  var p = {
    angle: base.angle + (Math.random()-.5)*.16*jit,
    tilt:  base.tilt  + (Math.random()-.5)*.14*jit,
    y:     base.y,
    out:   base.out * (1+(Math.random()-.5)*.14*jit),
    scale: base.scale*(1+(Math.random()-.5)*.18*jit),
    sx:    .82+Math.random()*.16
  };
  var holder = new THREE.Group();
  holder.rotation.y = p.angle;
  var mesh = new THREE.Mesh(petalGeo, mat);
  mesh.position.set(0, p.y, p.out);
  mesh.scale.setScalar(.001);
  holder.add(mesh); rose.add(holder);
  var entry = {holder:holder, mesh:mesh, mat:mat, born:Infinity, pending:true, p:p, phase:Math.random()*6.28, isPhoto:!!isPhoto};
  petals.push(entry);
  return entry;
}
function activatePetal(entry){
  entry.pending = false;
  entry.born = performance.now();
  if(entry.isPhoto){
    photoCount++; countEl.textContent = photoCount; cloudPulse();
    if(photoCount >= CAP) scheduleFinale();       // gül doldu → hatıralar isme dönüşsün
  }
}
function spawnPetal(tex, isPhoto){ activatePetal(makePetalEntry(tex, isPhoto)); }

// ---------- solan yapraklar: kopar, düşer, arka plandaki buluta karışır ----------
var fallers = [], puffs = [];
var PUF_VS = [
  'attribute vec3 aColor;',
  'attribute vec3 aVel;',
  'attribute float aSeed;',
  'uniform float uT;',
  'uniform float uSize;',
  'varying vec3 vColor;',
  'varying float vA;',
  'void main(){',
  '  vec3 p = position + aVel * uT;',
  '  p.y = p.y - 0.3 * uT * uT;',
  '  p.x = p.x + sin(uT * 3.0 + aSeed * 6.28) * 0.05;',
  '  p.z = p.z + cos(uT * 2.6 + aSeed * 6.28) * 0.05;',
  '  vColor = aColor;',
  '  vA = (1.0 - uT) * 0.85;',
  '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
  '  float dist = max(-mv.z, 0.5);',
  '  gl_PointSize = uSize * (0.6 + aSeed * 0.7) * (3.2 / dist);',
  '  gl_Position = projectionMatrix * mv;',
  '}'
].join('\n');

function spawnFaller(pe){
  if(REDUCED){ pe.mat.map && pe.mat.map.dispose(); pe.mat.dispose(); return; }
  pe.mesh.updateMatrixWorld(true);
  var m = new THREE.Mesh(petalGeo, pe.mat);
  pe.mesh.matrixWorld.decompose(m.position, m.quaternion, m.scale);
  pe.mat.alphaTest = 0; pe.mat.depthWrite = false; pe.mat.needsUpdate = true;  // solarken kesilme olmasın
  scene.add(m);
  fallers.push({mesh:m, mat:pe.mat, t0:performance.now(), puffed:false,
    vx:(Math.random()-.5)*.3, vz:(Math.random()-.5)*.3,
    sx:(Math.random()-.5)*2.4, sy:(Math.random()-.5)*1.8, sz:(Math.random()-.5)*2.4});
}

function spawnPuff(mesh, mat){
  var cv = mat.map && mat.map.image;
  if(!cv || !cv.getContext) return;
  var dd = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
  var posA = petalGeo.attributes.position, uvA = petalGeo.attributes.uv, vCount = posA.count;
  mesh.updateMatrixWorld(true);
  var pos=[], cols=[], vels=[], seeds=[], v3 = new THREE.Vector3();
  for(var i=0;i<160;i++){
    var vi=(Math.random()*vCount)|0;
    var u=uvA.getX(vi), vv=uvA.getY(vi);
    var px=Math.min(cv.width-1,(u*cv.width)|0);
    var py=Math.min(cv.height-1,((1-vv)*cv.height)|0);
    var id4=(py*cv.width+px)*4;
    if(dd[id4+3]<120) continue;
    v3.set(posA.getX(vi), posA.getY(vi), posA.getZ(vi));
    mesh.localToWorld(v3);
    pos.push(v3.x, v3.y, v3.z);
    cols.push(dd[id4]/255, dd[id4+1]/255, dd[id4+2]/255);
    vels.push(.28+(Math.random()-.5)*.5, (Math.random()-.5)*.35, -(.6+Math.random()*1.5));  // akışa katılıp geri süzülür
    seeds.push(Math.random());
  }
  if(!pos.length) return;
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('aColor',   new THREE.Float32BufferAttribute(cols,3));
  geo.setAttribute('aVel',     new THREE.Float32BufferAttribute(vels,3));
  geo.setAttribute('aSeed',    new THREE.Float32BufferAttribute(seeds,1));
  var U = { uT:{value:0}, uSize:{value:renderer.getPixelRatio()*2.8} };
  var pts = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms:U, transparent:true, depthWrite:false,
    blending:THREE.AdditiveBlending, vertexShader:PUF_VS, fragmentShader:DIS_FS
  }));
  pts.frustumCulled = false;
  scene.add(pts);
  puffs.push({pts:pts, U:U, t0:performance.now()});
}

function clearFallers(){
  for(var i=fallers.length-1;i>=0;i--){
    scene.remove(fallers[i].mesh);
    fallers[i].mat.map && fallers[i].mat.map.dispose(); fallers[i].mat.dispose();
  }
  fallers.length = 0;
  for(i=puffs.length-1;i>=0;i--){
    scene.remove(puffs[i].pts);
    puffs[i].pts.geometry.dispose(); puffs[i].pts.material.dispose();
  }
  puffs.length = 0;
}

// başlangıç tomurcuğu
for(var b=0;b<BUD;b++){
  spawnPetal(makePetalTexture(null), false);
  petals[petals.length-1].born = performance.now() + b*55;   // içten dışa açılarak uyanır
}

// ---------- fotoğraf kartı töreni ----------
var cards = [];
var cardGeo = new THREE.PlaneGeometry(.58, .72);
var DIRV = new THREE.Vector3(), RIGHTV = new THREE.Vector3(), UPV = new THREE.Vector3(0,1,0);
var HOLDV = new THREE.Vector3(), TMPV = new THREE.Vector3();

function holdPos(out, jx, jy){
  camera.getWorldDirection(DIRV);
  RIGHTV.crossVectors(DIRV, UPV).normalize();
  var halfH = Math.tan(camera.fov*Math.PI/360)*2.5;
  var halfW = halfH*camera.aspect;
  var limX = Math.max(.12, halfW - .40);          // kart kenardan taşmasın
  var limY = Math.max(.10, halfH - .48);
  out.copy(camera.position)
     .addScaledVector(DIRV, 2.5)
     .addScaledVector(RIGHTV, jx*limX)            // çiçeğin sağında ya da solunda
     .addScaledVector(UPV, (jy||0)*limY);
}

function makeCardTexture(img){
  var W=460, H=560, R=20, P=20, B=64;
  var c = document.createElement('canvas'); c.width=W; c.height=H;
  var g = c.getContext('2d');
  g.beginPath();
  g.moveTo(R,0); g.arcTo(W,0,W,H,R); g.arcTo(W,H,0,H,R); g.arcTo(0,H,0,0,R); g.arcTo(0,0,W,0,R); g.closePath();
  g.fillStyle = '#FBF6EE'; g.fill();
  g.save(); g.clip();
  g.save();
  g.beginPath(); g.rect(P,P,W-2*P,H-P-B); g.clip();
  var iw = img.width||1, ih = img.height||1, rw = W-2*P, rh = H-P-B;
  var s = Math.max(rw/iw, rh/ih), dw = iw*s, dh = ih*s;
  g.drawImage(img, P+(rw-dw)/2, P+(rh-dh)/2, dw, dh);
  g.globalAlpha = .06; g.fillStyle = '#C2325F'; g.fillRect(P,P,rw,rh); g.globalAlpha = 1;
  g.restore();
  g.fillStyle = '#D8A24A';
  g.beginPath(); g.arc(W/2, H-B/2, 5, 0, 6.29); g.fill();
  g.restore();
  var t = new THREE.CanvasTexture(c);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return {tex:t, canvas:c};
}

// kartın piksellerine çözülüp güle akması — shader
var DIS_VS = [
  'attribute vec3 aColor;',
  'attribute float aSeed;',
  'attribute float aDelay;',
  'uniform float uProg,uSize;',
  'uniform vec3 uTarget;',
  'varying vec3 vColor;',
  'varying float vA;',
  'void main(){',
  '  float k=clamp((uProg-aDelay)/(1.-aDelay),0.,1.);',
  '  float e=k*k*(3.-2.*k);',
  '  vec3 dir=uTarget-position;',
  '  float dl=max(length(dir),.0001);',
  '  dir/=dl;',
  '  vec3 side=normalize(cross(dir,vec3(0.,1.,0.))+vec3(.0001));',
  '  vec3 upv=normalize(cross(side,dir));',
  '  vec3 p=mix(position,uTarget,e);',
  '  float amp=sin(k*3.14159);',
  '  p+=side*sin(k*6.283*(1.+aSeed*1.5)+aSeed*6.283)*amp*(.12+aSeed*.2);',
  '  p+=upv*amp*(.18+aSeed*.22);',
  '  p+=vec3(sin(uProg*30.+aSeed*40.),cos(uProg*26.+aSeed*33.),0.)*.004*(1.-e);',
  '  vColor=aColor;',
  '  vA=min(1.,uProg*40.);',
  '  vA*=1.-smoothstep(.82,1.,k);',
  '  vec4 mv=modelViewMatrix*vec4(p,1.);',
  '  gl_PointSize=uSize*(.7+aSeed*.6)*(1.-.5*e)*(3.2/max(-mv.z,.5));',
  '  gl_Position=projectionMatrix*mv;',
  '}'
].join('\n');
var DIS_FS = [
  'varying vec3 vColor;',
  'varying float vA;',
  'void main(){',
  '  vec2 c=gl_PointCoord-.5;',
  '  float a=smoothstep(.5,.12,length(c));',
  '  gl_FragColor=vec4(vColor,a*vA);',
  '}'
].join('\n');

function buildDissolve(cd){
  var COLS=34, ROWS=42, gW=.58, gH=.72;
  var srcC = cd.canvas;
  var data = srcC.getContext('2d').getImageData(0,0,srcC.width,srcC.height).data;
  cd.mesh.updateMatrixWorld(true);
  var m = cd.mesh.matrixWorld;
  var starts=[], cols=[], seeds=[], delays=[];
  var v3 = new THREE.Vector3();
  for(var r=0;r<ROWS;r++){
    for(var q=0;q<COLS;q++){
      var u=(q+.5)/COLS, v=(r+.5)/ROWS;
      var px = Math.min(srcC.width-1, (u*srcC.width)|0);
      var py = Math.min(srcC.height-1,(v*srcC.height)|0);
      var idx = (py*srcC.width+px)*4;
      if(data[idx+3] < 120) continue;             // yuvarlak köşe boşlukları atlanır
      v3.set((u-.5)*gW, (.5-v)*gH, 0).applyMatrix4(m);
      starts.push(v3.x, v3.y, v3.z);
      cols.push(data[idx]/255, data[idx+1]/255, data[idx+2]/255);
      seeds.push(Math.random());
      delays.push(v*.2 + Math.random()*.12);      // üstten alta süpürerek çözülür — güle emiliyormuş gibi
    }
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(starts,3));
  geo.setAttribute('aColor',   new THREE.Float32BufferAttribute(cols,3));
  geo.setAttribute('aSeed',    new THREE.Float32BufferAttribute(seeds,1));
  geo.setAttribute('aDelay',   new THREE.Float32BufferAttribute(delays,1));
  var U = { uProg:{value:0}, uTarget:{value:new THREE.Vector3()}, uSize:{value:renderer.getPixelRatio()*3.2} };
  cd.pts = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms:U, transparent:true, depthWrite:false,
    vertexShader:DIS_VS, fragmentShader:DIS_FS
  }));
  cd.ptsU = U;
  cd.pts.frustumCulled = false;
  scene.add(cd.pts);
}

var lastSide = 0;
var photoLog = [];                                // biriken fotoğraflar
var finalePhoto = null;                           // döngü finalinde oluşacak fotoğraf (seçilmemişse kolaj)
function startCeremony(img){
  photoLog.push(img);
  if(photoLog.length > CAP) photoLog.shift();
  var entry = makePetalEntry(makePetalTexture(img), true);
  if(REDUCED){ activatePetal(entry); return; }        // hareket azaltılmışsa tören yok, direkt takılır
  var ct = makeCardTexture(img);
  var mat = new THREE.MeshBasicMaterial({map:ct.tex, transparent:true, depthWrite:false, opacity:0});
  var mesh = new THREE.Mesh(cardGeo, mat);
  scene.add(mesh);
  var side = Math.random() < .5 ? -1 : 1;
  if(side === lastSide && Math.random() < .7) side = -side;   // arka arkaya aynı tarafa düşmesin
  lastSide = side;
  cards.push({mesh:mesh, mat:mat, canvas:ct.canvas, entry:entry, t0:performance.now(),
    jx: side*(.72+Math.random()*.26), jy: -.35+Math.random()*.5, ph:Math.random()*6.28});
}

// tören zamanlaması (ms)
var C_POP = 450, C_HOLD = 1500, C_FLY = 1400;

// ---------- final: gül çözülür, isim yazılır ----------
var FIN_VS = [
  'attribute vec3 aColor;',
  'attribute vec3 aColor2;',
  'attribute vec3 aColor3;',
  'attribute vec3 aTarget;',
  'attribute vec3 aTarget2;',
  'attribute float aSeed;',
  'attribute float aDelay;',
  'uniform float uProg;',
  'uniform float uMorph;',
  'uniform float uTime;',
  'uniform float uSize;',
  'varying vec3 vColor;',
  'varying float vA;',
  'void main(){',
  '  vec3 start = position;',
  '  vec3 flatPos = vec3(start.x, 0.0, start.z);',
  '  vec3 radial = normalize(flatPos + vec3(0.0001, 0.0, 0.0001));',
  '  float drop = 1.15 + aSeed * 0.85;',
  '  vec3 mid = start + radial * (0.35 + aSeed * 0.45);',
  '  mid.y = mid.y - drop;',
  '  mid.x = mid.x + sin(aSeed * 40.0) * 0.3;',
  '  mid.z = mid.z + cos(aSeed * 35.0) * 0.3;',
  '  float ka = smoothstep(0.0, 0.45, uProg);',
  '  float ea = ka * ka;',
  '  float kbRaw = smoothstep(0.45, 1.0, uProg);',
  '  float kb = clamp((kbRaw - aDelay) / (1.0 - aDelay), 0.0, 1.0);',
  '  float eb = kb * kb * (3.0 - 2.0 * kb);',
  '  vec3 p1 = mix(mix(start, mid, ea), aTarget, eb);',
  '  float dm = aDelay * 0.6;',
  '  float km = clamp((uMorph - dm) / (1.0 - dm), 0.0, 1.0);',
  '  float em = km * km * (3.0 - 2.0 * km);',
  '  vec3 scat = vec3(sin(aSeed*23.0), cos(aSeed*17.0), sin(aSeed*31.0)) * (0.3 + aSeed*0.3);',
  '  vec3 p = mix(p1, aTarget2, em) + scat * sin(em * 3.14159);',
  '  float wander = (1.0 - eb) * (1.0 - 0.3 * ea);',
  '  p.x = p.x + sin(uTime * 1.6 + aSeed * 31.0) * 0.025 * wander;',
  '  p.y = p.y + sin(uTime * 1.3 + aSeed * 47.0) * 0.025 * wander;',
  '  p.z = p.z + cos(uTime * 1.4 + aSeed * 23.0) * 0.025 * wander;',
  '  p.x = p.x + sin(uTime * 1.8 + aSeed * 60.0) * 0.006 * eb;',
  '  p.y = p.y + cos(uTime * 1.5 + aSeed * 50.0) * 0.006 * eb;',
  '  vColor = mix(mix(aColor, aColor2, eb), aColor3, em);',
  '  vA = 0.9 + 0.1 * sin(uTime * 2.2 + aSeed * 20.0);',
  '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
  '  float dist = max(-mv.z, 0.5);',
  '  gl_PointSize = uSize * (0.6 + aSeed * 0.7) * (1.0 - 0.2 * eb) * (1.0 - 0.12 * em) * (3.4 / dist);',
  '  gl_Position = projectionMatrix * mv;',
  '}'
].join('\n');
var FIN_FS = [
  'varying vec3 vColor;',
  'varying float vA;',
  'void main(){',
  '  vec2 c = gl_PointCoord - vec2(0.5, 0.5);',
  '  float a = smoothstep(0.5, 0.12, length(c));',
  '  gl_FragColor = vec4(vColor, a * vA);',
  '}'
].join('\n');

var finale = {pts:null, U:null, prog:0, dir:0, t0:0, img:null, imgMat:null, img2:null, imgMat2:null, morph:0, mdir:0, mT0:0, twoStage:false, phase:'', directBack:false, auto:false, holdUntil:0, pending:false};
var finalBtn = document.getElementById('finalBtn');

function sampleName(name){
  var W=1024, H=300;
  var c = document.createElement('canvas'); c.width=W; c.height=H;
  var g = c.getContext('2d');
  g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
  var size=170;
  g.font='600 '+size+'px "Cormorant Garamond", Georgia, serif';
  while(g.measureText(name).width > W*.92 && size>40){
    size-=8; g.font='600 '+size+'px "Cormorant Garamond", Georgia, serif';
  }
  g.fillText(name, W/2, H/2);
  var d = g.getImageData(0,0,W,H).data, pts=[];
  for(var y=0;y<H;y+=3){
    for(var x=0;x<W;x+=3){
      if(d[(y*W+x)*4+3] > 128) pts.push(x,y);
    }
  }
  return {pts:pts, W:W, H:H};
}

function makeTextCollage(name, imgs){
  var W=1600, H=Math.round(W*(name ? .34 : .62));
  var c = document.createElement('canvas'); c.width=W; c.height=H;
  var g = c.getContext('2d');
  if(imgs.length){                                // fotoğrafları ızgara halinde döşe
    var n = imgs.length;
    var cols = Math.max(1, Math.round(Math.sqrt(n*W/H))), rows = Math.ceil(n/cols);
    var bestGap = 1e9;
    for(var cc=1; cc<=n; cc++){                   // tam dikdörtgen: n'i tam bölen en dengeli ızgara
      if(n % cc) continue;
      var rr = n/cc, ca = (W/cc)/(H/rr);
      if(ca < .45 || ca > 2.4) continue;
      var gap = Math.abs(Math.log(ca));
      if(gap < bestGap){ bestGap = gap; cols = cc; rows = rr; }
    }
    var cw = W/cols, ch = H/rows;
    for(var i=0;i<n;i++){
      var cx = (i%cols)*cw, cy = ((i/cols)|0)*ch;
      g.save(); g.beginPath(); g.rect(cx,cy,cw,ch); g.clip();
      var im = imgs[i], iw = im.width||1, ih = im.height||1;
      var sc = Math.max(cw/iw, ch/ih);
      g.drawImage(im, cx+(cw-iw*sc)/2, cy+(ch-ih*sc)/2, iw*sc, ih*sc);
      g.restore();
    }
    g.globalCompositeOperation = 'source-atop';   // hafif sıcaklık, yazı bütünlüğü için
    g.fillStyle = 'rgba(226,58,85,.14)'; g.fillRect(0,0,W,H);
  }else{
    var lg = g.createLinearGradient(0,H,W,0);
    lg.addColorStop(0,'#C21F3A'); lg.addColorStop(1,'#D9821F');
    g.fillStyle = lg; g.fillRect(0,0,W,H);
  }
  if(name){
    g.globalCompositeOperation = 'destination-in';// kolajı yazının içine hapset
    g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#fff';
    var size = Math.round(H*.62);
    g.font='600 '+size+'px "Cormorant Garamond", Georgia, serif';
    while(g.measureText(name).width > W*.9 && size > 40){
      size -= 8; g.font='600 '+size+'px "Cormorant Garamond", Georgia, serif';
    }
    g.fillText(name, W/2, H/2);
    g.globalCompositeOperation = 'source-over';   // harflere ince kontur
    g.strokeStyle='rgba(255,226,232,.45)'; g.lineWidth=3;
    g.strokeText(name, W/2, H/2);
  }
  return c;
}

function sampleImage(img){
  var IW=220, ar=(img.height||1)/(img.width||1);
  var IH=Math.max(70, Math.min(220, Math.round(IW*ar)));
  var c = document.createElement('canvas'); c.width=IW; c.height=IH;
  var g = c.getContext('2d');
  coverDraw(g, img, IW, IH);
  var d = g.getImageData(0,0,IW,IH).data, out=[];
  for(var y=0;y<IH;y+=2){
    for(var x=0;x<IW;x+=2){
      var i4=(y*IW+x)*4, r=d[i4], gg=d[i4+1], b=d[i4+2], al=d[i4+3];
      if(al<40) continue;                         // yazının dışı boş kalır
      var lum=(r*.299+gg*.587+b*.114);
      if(lum<8) continue;
      out.push(x, y, r/255, gg/255, b/255, Math.max(.1, lum/255));
    }
  }
  return {pts:out, W:IW, H:IH};
}

function flushCards(){
  clearFallers();
  for(var ci=cards.length-1;ci>=0;ci--){
    var cd = cards[ci];
    if(!cd.done) activatePetal(cd.entry);
    if(!cd.cardGone) scene.remove(cd.mesh);
    cd.mat.map && cd.mat.map.dispose(); cd.mat.dispose();
    if(cd.pts){ scene.remove(cd.pts); cd.pts.geometry.dispose(); cd.pts.material.dispose(); }
  }
  cards.length = 0;
}

function launchFinale(name, imgA, auto, imgB){
  try{
  flushCards();
  scene.updateMatrixWorld(true);
  var nameMode = !!name && !imgA;
  var tA = nameMode ? sampleName(name) : sampleImage(imgA);
  var sA = nameMode ? 2 : 6;
  var nA = tA.pts.length/sA;
  if(!nA){ toast(nameMode ? 'İsim okunamadı' : 'Fotoğraf okunamadı'); return; }
  var twoStage = !!imgB;                          // 2. perde: mozaik → tek fotoğraf
  var tB = null, nB = 0;
  if(twoStage){
    tB = sampleImage(imgB); nB = tB.pts.length/6;
    if(!nB) twoStage = false;
  }

  var live = 0;
  for(var i=0;i<petals.length;i++) if(!petals[i].pending) live++;
  var per = Math.min(320, Math.max(110, Math.round(34000/Math.max(1,live))));

  var TWA = nameMode ? 3.4 : 3.2, scA = TWA/tA.W;
  var scB = twoStage ? 3.2/tB.W : 0;
  var TY=.1, TZ=.6;
  var camQ = camera.quaternion.clone();           // oluşum düzlemi kameraya paralel — foto dik durur
  var RV = new THREE.Vector3(1,0,0).applyQuaternion(camQ);
  var UV2 = new THREE.Vector3(0,1,0).applyQuaternion(camQ);
  var FV = new THREE.Vector3(0,0,-1).applyQuaternion(camQ);
  var CV = new THREE.Vector3(0, TY, TZ);

  var posA = petalGeo.attributes.position, uvA = petalGeo.attributes.uv, vCount = posA.count;
  var starts=[], colsA=[], cols2=[], cols3=[], seeds=[], delays=[], targets=[], targets2=[];
  var v3 = new THREE.Vector3(), seqA = 0, seqB = 0;

  for(i=0;i<petals.length;i++){
    var pe = petals[i];
    if(pe.pending) continue;
    var cv = pe.mat.map.image;
    var dd = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
    for(var j=0;j<per;j++){
      var placed=false;
      for(var tr=0;tr<4 && !placed;tr++){
        var vi=(Math.random()*vCount)|0;
        var u=uvA.getX(vi), vv=uvA.getY(vi);
        var px=Math.min(cv.width-1,(u*cv.width)|0);
        var py=Math.min(cv.height-1,((1-vv)*cv.height)|0);
        var id4=(py*cv.width+px)*4;
        if(dd[id4+3]>120){
          v3.set(posA.getX(vi)+(Math.random()-.5)*.05, posA.getY(vi)+(Math.random()-.5)*.05, posA.getZ(vi));
          pe.mesh.localToWorld(v3);
          starts.push(v3.x,v3.y,v3.z);
          var r0=dd[id4]/255, g0=dd[id4+1]/255, b0=dd[id4+2]/255;
          colsA.push(r0,g0,b0);
          var tx, ty;
          if(nameMode){
            var ti=(Math.random()*nA)|0;
            tx=tA.pts[ti*2]; ty=tA.pts[ti*2+1];
            cols2.push(r0,g0,b0);
            delays.push((tx/tA.W)*.3 + Math.random()*.06);
          }else{
            var b6=(seqA++ % nA)*6;
            tx=tA.pts[b6]; ty=tA.pts[b6+1];
            cols2.push(tA.pts[b6+2], tA.pts[b6+3], tA.pts[b6+4]);
            delays.push((1-tA.pts[b6+5])*.28 + Math.random()*.05);
          }
          var wx=(tx-tA.W/2)*scA+(Math.random()-.5)*.012;
          var wy=(tA.H/2-ty)*scA+(Math.random()-.5)*.012;
          var wd=(Math.random()-.5)*.06;
          targets.push(CV.x+RV.x*wx+UV2.x*wy+FV.x*wd,
                       CV.y+RV.y*wx+UV2.y*wy+FV.y*wd,
                       CV.z+RV.z*wx+UV2.z*wy+FV.z*wd);
          if(twoStage){
            var c6=(seqB++ % nB)*6;
            var bx=tB.pts[c6], by=tB.pts[c6+1];
            cols3.push(tB.pts[c6+2], tB.pts[c6+3], tB.pts[c6+4]);
            var bwx=(bx-tB.W/2)*scB+(Math.random()-.5)*.012;
            var bwy=(tB.H/2-by)*scB+(Math.random()-.5)*.012;
            var bwd=(Math.random()-.5)*.06;
            targets2.push(CV.x+RV.x*bwx+UV2.x*bwy+FV.x*bwd,
                          CV.y+RV.y*bwx+UV2.y*bwy+FV.y*bwd,
                          CV.z+RV.z*bwx+UV2.z*bwy+FV.z*bwd);
          }else{
            var L=targets.length;
            targets2.push(targets[L-3], targets[L-2], targets[L-1]);
            var LC=cols2.length;
            cols3.push(cols2[LC-3], cols2[LC-2], cols2[LC-1]);
          }
          seeds.push(Math.random());
          placed=true;
        }
      }
    }
  }
  if(!starts.length){ toast('Önce güle birkaç yaprak ekle'); return; }

  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(starts,3));
  geo.setAttribute('aColor',   new THREE.Float32BufferAttribute(colsA,3));
  geo.setAttribute('aColor2',  new THREE.Float32BufferAttribute(cols2,3));
  geo.setAttribute('aColor3',  new THREE.Float32BufferAttribute(cols3,3));
  geo.setAttribute('aTarget',  new THREE.Float32BufferAttribute(targets,3));
  geo.setAttribute('aTarget2', new THREE.Float32BufferAttribute(targets2,3));
  geo.setAttribute('aSeed',    new THREE.Float32BufferAttribute(seeds,1));
  geo.setAttribute('aDelay',   new THREE.Float32BufferAttribute(delays,1));
  finale.U = { uProg:{value:0}, uMorph:{value:0}, uTime:{value:0}, uSize:{value:renderer.getPixelRatio()*3.0} };
  finale.pts = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms:finale.U, transparent:true, depthWrite:false,
    vertexShader:FIN_VS, fragmentShader:FIN_FS
  }));
  finale.pts.frustumCulled = false;
  scene.add(finale.pts);

  function makePanel(srcImg, tD, sc, depth, order){
    var dc = document.createElement('canvas');
    dc.width = 896; dc.height = Math.round(896 * tD.H / tD.W);
    coverDraw(dc.getContext('2d'), srcImg, dc.width, dc.height);
    var dTex = new THREE.CanvasTexture(dc);
    dTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    var pm = new THREE.MeshBasicMaterial({map:dTex, transparent:true, opacity:0, depthWrite:false});
    var pl = new THREE.Mesh(new THREE.PlaneGeometry(tD.W*sc, tD.H*sc), pm);
    pl.quaternion.copy(camQ);
    pl.position.copy(CV).addScaledVector(FV, depth);
    pl.renderOrder = order;
    scene.add(pl);
    return {mesh:pl, mat:pm};
  }
  if(!nameMode){
    var pA = makePanel(imgA, tA, scA, -.05, 3);   // 1. perde: birleşen anılar mozaiği
    finale.img = pA.mesh; finale.imgMat = pA.mat;
  }
  if(twoStage){
    var pB = makePanel(imgB, tB, scB, -.07, 4);   // 2. perde: seçilen tek fotoğraf
    finale.img2 = pB.mesh; finale.imgMat2 = pB.mat;
  }

  finale.prog = 0; finale.dir = 1; finale.t0 = performance.now();
  finale.morph = 0; finale.mdir = 0; finale.mT0 = 0;
  finale.twoStage = twoStage; finale.phase = ''; finale.directBack = false;
  finale.auto = !!auto; finale.holdUntil = 0;
  rose.visible = false;
  finalBtn.disabled = true; finalBtn.textContent = '…';
  }catch(err){
    rose.visible = true;
    finalBtn.disabled = false; finalBtn.textContent = 'Final';
    toast('Final başlatılamadı: ' + err.message);
  }
}

function scheduleFinale(){
  if(finale.pts || finale.pending) return;
  finale.pending = true;
  setTimeout(function(){
    finale.pending = false;
    if(finale.pts || photoCount < CAP) return;
    var mosaic = makeTextCollage(null, photoLog.slice());              // 1. perde: anılar birleşir
    launchFinale(null, mosaic, true, finalePhoto);                      // 2. perde: seçilen fotoğrafa evrilir
  }, 1400);
}

function cleanupFinale(){
  if(finale.pts){
    scene.remove(finale.pts);
    finale.pts.geometry.dispose(); finale.pts.material.dispose();
  }
  if(finale.img){
    scene.remove(finale.img);
    finale.img.geometry.dispose();
    finale.imgMat.map && finale.imgMat.map.dispose();
    finale.imgMat.dispose();
  }
  if(finale.img2){
    scene.remove(finale.img2);
    finale.img2.geometry.dispose();
    finale.imgMat2.map && finale.imgMat2.map.dispose();
    finale.imgMat2.dispose();
  }
  finale.img = null; finale.imgMat = null; finale.img2 = null; finale.imgMat2 = null;
  finale.pts = null; finale.U = null; finale.prog = 0; finale.dir = 0;
  finale.morph = 0; finale.mdir = 0; finale.mT0 = 0; finale.twoStage = false; finale.phase = ''; finale.directBack = false;
  finale.auto = false; finale.holdUntil = 0;
  rose.visible = true;
  finalBtn.disabled = false; finalBtn.textContent = 'Final';
}


// ---------- animasyon ----------
function easeOutBack(k){ var c=1.35; return 1 + (c+1)*Math.pow(k-1,3) + c*Math.pow(k-1,2); }
var clock = new THREE.Clock();
var lastT = 0;

function tick(){
  rafId = requestAnimationFrame(tick);
  var t = clock.getElapsedTime();
  var now = performance.now();
  var dt = t - lastT; lastT = t;

  var windF = REDUCED ? 0 : (.6 + .4*(.5 + .25*(Math.sin(t*.37)+Math.sin(t*.23+2.1)))) * S.wind;  // esinti güçlenip zayıflar
  if(S.hueOn){
    var hueT = (.9 + (Math.sin(t*S.hueSpeed)*.5+.5)*.2) % 1;     // pembe→kırmızı→altın arasında salınır
    glowL.color.setHSL(hueT, .85, .62);                          // çiçeğin içindeki spot renk gezer
  }
  if(!finale.pts){
    rose.rotation.y += REDUCED ? .0005 : S.spin;                // finalde gül donuk kalır ki geri dönüş hizalı olsun
    plant.rotation.z = REDUCED ? 0 : Math.sin(t*.5)*.03*S.sway*windF;  // kökten esneme
    plant.rotation.x = REDUCED ? 0 : Math.sin(t*.41+1.2)*.016*S.sway*windF;
  }
  camera.position.y = 1.25 + (REDUCED?0:Math.sin(t*.32)*.07);
  camera.lookAt(0,.12,0);

  if(cloud){
    cloudU.uTime.value = t;
    cloudU.uPulse.value += (0 - cloudU.uPulse.value) * Math.min(1, dt*2.4);
  }

  if(finale.pts){
    finale.U.uTime.value = t;
    if(finale.dir > 0){
      finale.prog = Math.min(1, (now - finale.t0)/4400);
      if(finale.prog >= 1){
        finale.dir = 0;
        if(finale.auto){
          finale.phase = finale.twoStage ? 'A' : 'B';
          finale.holdUntil = now + (finale.twoStage ? S.holdAS*1000 : S.holdBS*1000);   // mozaik kısa, tek foto uzun izlenir
        }else{
          finalBtn.disabled = false; finalBtn.textContent = 'Güle dön';
        }
      }
    }else if(finale.dir < 0){
      finale.prog = Math.max(0, 1 - (now - finale.t0)/3000);
      if(finale.prog <= 0){
        var wasAuto = finale.auto;
        cleanupFinale();
        if(wasAuto) shedPhotoPetals();            // gül geri geldi → anı yaprakları dökülür, gonca kalır
      }
    }
    if(finale.mdir > 0){                          // mozaik parçalanır → tek fotoğrafa evrilir
      finale.morph = Math.min(1, (now - finale.mT0)/2600);
      if(finale.morph >= 1){
        finale.mdir = 0;
        finale.phase = 'B';
        finale.holdUntil = now + S.holdBS*1000;
      }
    }else if(finale.mdir < 0){                    // geri sarma: önce mozaiğe döner
      finale.morph = Math.max(0, 1 - (now - finale.mT0)/2000);
      if(finale.morph <= 0){
        finale.mdir = 0;
        finale.dir = -1; finale.t0 = now;         // sonra güle geri örülür
      }
    }
    if(finale.auto && finale.dir === 0 && finale.mdir === 0 && finale.holdUntil && now > finale.holdUntil){
      finale.holdUntil = 0;
      if(finale.phase === 'A'){
        finale.mdir = 1; finale.mT0 = now;
      }else if(finale.twoStage && finale.morph >= 1){
        var g = finale.pts.geometry;              // foto pozisyonları ana hedef olur — mozaik durağı atlanır
        g.attributes.aTarget.array.set(g.attributes.aTarget2.array);
        g.attributes.aTarget.needsUpdate = true;
        g.attributes.aColor2.array.set(g.attributes.aColor3.array);
        g.attributes.aColor2.needsUpdate = true;
        finale.morph = 0; finale.U.uMorph.value = 0;
        if(finale.img){                           // mozaik paneli artık gereksiz
          scene.remove(finale.img); finale.img.geometry.dispose();
          finale.imgMat.map && finale.imgMat.map.dispose(); finale.imgMat.dispose();
          finale.img = null; finale.imgMat = null;
        }
        finale.directBack = true;
        finale.dir = -1; finale.t0 = now;         // fotodan doğrudan güle örülür
      }else{
        finale.dir = -1; finale.t0 = now;
      }
    }
    if(finale.U){
      finale.U.uProg.value = finale.prog;
      finale.U.uMorph.value = finale.morph;
      if(finale.imgMat){                          // 1. panel: morph başlarken hızla söner
        var iop = (finale.prog - .88) / .12;
        iop = Math.max(0, Math.min(1, iop)) * (1 - Math.min(1, finale.morph/.15));
        finale.imgMat.opacity = iop;
      }
      if(finale.imgMat2){                         // 2. panel: morph biterken belirir, dönüşte prog ile söner
        var iop2 = finale.directBack ? (finale.prog - .88) / .12 : (finale.morph - .85) / .15;
        finale.imgMat2.opacity = Math.max(0, Math.min(1, iop2));
      }
    }
  }

  for(var i=0;i<petals.length;i++){
    var pe = petals[i];
    if(pe.pending){ pe.mat.opacity = 0; pe.mesh.scale.setScalar(.001); continue; }
    var k = Math.min(1,(now-pe.born)/1400);
    var e = easeOutBack(k);
    var s = pe.p.scale*(.06+.94*Math.max(0,e));
    pe.mesh.scale.set(s*(pe.p.sx||1), s, s);
    var lively = .35 + .5*pe.p.tilt;                            // dış yapraklar daha oynak
    var wave = Math.sin(t*1.1 + pe.p.angle*2.0);                // çiçeğin etrafında dolaşan rüzgâr dalgası
    pe.mesh.rotation.x = pe.p.tilt*(.5+.5*e) + (REDUCED?0:(Math.sin(t*.52+1.3)*.024 + wave*.014)*lively*windF);
    pe.mat.opacity = Math.max(0, Math.min(1,k*2.2));
    pe.mesh.rotation.z = REDUCED ? 0 : (Math.sin(t*.9+pe.phase)*.012 + wave*.01)*lively*windF;
  }

  if(!REDUCED){
    for(var wi=0; wi<swayParts.length; wi++){
      var wp = swayParts[wi];
      wp.m.rotation.z = wp.bz + Math.sin(t*wp.sp + wp.ph)*wp.amp*windF;
      wp.m.rotation.x = wp.bx + Math.sin(t*wp.sp*.8 + wp.ph + 1.1)*wp.amp*.5*windF;
    }
  }

  for(var fi=fallers.length-1;fi>=0;fi--){
    var fa = fallers[fi], age = (now-fa.t0)/1000, kf = age/2.8;
    fa.mesh.position.y -= (.32 + .5*age)*dt;                    // ivmelenerek düşer
    fa.mesh.position.x += fa.vx*dt;
    fa.mesh.position.z += fa.vz*dt;
    fa.mesh.rotation.x += fa.sx*dt; fa.mesh.rotation.y += fa.sy*dt; fa.mesh.rotation.z += fa.sz*dt;
    fa.mat.opacity = Math.max(0, 1-kf*1.15);
    if(!fa.puffed && kf > .5){ spawnPuff(fa.mesh, fa.mat); fa.puffed = true; }  // yolda toza dönüşür
    if(kf >= 1){
      scene.remove(fa.mesh);
      fa.mat.map && fa.mat.map.dispose(); fa.mat.dispose();
      fallers.splice(fi,1);
    }
  }

  for(var pi=puffs.length-1;pi>=0;pi--){
    var pu = puffs[pi], kp = (now-pu.t0)/2400;
    pu.U.uT.value = Math.min(1, kp);
    if(kp >= 1){
      scene.remove(pu.pts);
      pu.pts.geometry.dispose(); pu.pts.material.dispose();
      puffs.splice(pi,1);
    }
  }

  for(var ci=cards.length-1;ci>=0;ci--){
    var cd = cards[ci], el = now-cd.t0;
    if(!cd.pts) cd.mesh.quaternion.copy(camera.quaternion);
    holdPos(HOLDV, cd.jx, cd.jy);
    if(el < C_POP){
      var k1 = el/C_POP, e1 = Math.max(0, easeOutBack(k1));
      cd.mesh.position.copy(HOLDV).addScaledVector(RIGHTV, cd.jx>0 ? .3*(1-e1) : -.3*(1-e1));
      cd.mesh.scale.setScalar(.25+.75*e1);
      cd.mat.opacity = Math.min(1, k1*1.6);
    }else if(el < C_POP+C_HOLD){
      cd.mesh.position.copy(HOLDV).addScaledVector(UPV, Math.sin(t*1.8+cd.ph)*.02);
      cd.mesh.scale.setScalar(1);
      cd.mat.opacity = 1;
    }else{
      var fe = el - C_POP - C_HOLD;
      if(!cd.pts) buildDissolve(cd);              // kartın o anki duruşundan piksel ızgarası çıkar
      var k2 = Math.min(1, fe/C_FLY);
      cd.mat.opacity = Math.max(0, 1 - fe/180);   // kart hızla söner, pikseller aynı yerde devralır
      if(cd.mat.opacity<=0 && !cd.cardGone){ scene.remove(cd.mesh); cd.cardGone = true; }
      cd.entry.mesh.getWorldPosition(TMPV);       // gül döndükçe hedef canlı güncellenir
      cd.ptsU.uTarget.value.copy(TMPV);
      cd.ptsU.uProg.value = k2;
      if(k2 > .72 && !cd.done){ activatePetal(cd.entry); cd.done = true; }  // pikseller varırken yaprak açılır
      if(k2 >= 1){
        if(!cd.cardGone) scene.remove(cd.mesh);
        cd.mat.map.dispose(); cd.mat.dispose();
        scene.remove(cd.pts);
        cd.pts.geometry.dispose(); cd.pts.material.dispose();
        cards.splice(ci,1);
      }
    }
  }
  renderer.render(scene,camera);
}
tick();

addEventListener('resize',function(){
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

// ---------- fotoğraf alma ----------
var queue = [], draining = false;
function drain(){
  if(draining) return; draining = true;
  (function next(){
    if(!queue.length){ draining=false; return; }
    if(finale.pts || performance.now() < cascadeUntil){ setTimeout(next, 600); return; }   // final ve dökülme sırasında tören bekler
    var img = queue.shift();
    startCeremony(img);
    var gap = REDUCED ? 250 : (queue.length > 6 ? 900 : 1500);
    setTimeout(next, gap);                        // önceki kart uçuşa geçerken yenisi belirsin
  })();
}
function addFiles(files){
  var list = Array.prototype.slice.call(files).filter(function(f){return /^image\//.test(f.type);}).slice(0,40);
  if(!list.length) return;
  toast(list.length===1 ? 'Bir anı güle katılıyor…' : list.length+' anı güle katılıyor…');
  list.forEach(function(f){
    var url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function(){ queue.push(img); drain(); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

var fileInput = document.getElementById('file');
document.getElementById('addBtn').addEventListener('click',function(){ fileInput.click(); });
fileInput.addEventListener('change',function(){ addFiles(this.files); this.value=''; });

// sürükle-bırak
var drop = document.getElementById('drop'), dragDepth = 0;
addEventListener('dragenter',function(e){ e.preventDefault(); dragDepth++; drop.classList.add('on'); });
addEventListener('dragover', function(e){ e.preventDefault(); });
addEventListener('dragleave',function(e){ e.preventDefault(); if(--dragDepth<=0){dragDepth=0;drop.classList.remove('on');} });
addEventListener('drop',    function(e){ e.preventDefault(); dragDepth=0; drop.classList.remove('on'); if(e.dataTransfer) addFiles(e.dataTransfer.files); });

// örnek yapraklar (fotoğrafsız sunum için)
document.getElementById('demoBtn').addEventListener('click',function(){
  var pals = [['#8E2A52','#F0A9C0'],['#6E1030','#D97B9C'],['#A63B6B','#FFC9D8'],['#7E1436','#E58BA9']];
  for(var i=0;i<10;i++){
    var c = document.createElement('canvas'); c.width=512; c.height=640;
    var g = c.getContext('2d');
    var pal = pals[i%pals.length];
    var lg = g.createLinearGradient(0,640,Math.random()*512,0);
    lg.addColorStop(0,pal[0]); lg.addColorStop(1,pal[1]);
    g.fillStyle=lg; g.fillRect(0,0,512,640);
    for(var j=0;j<7;j++){
      g.fillStyle='rgba(255,255,255,'+(0.05+Math.random()*0.1)+')';
      g.beginPath(); g.arc(Math.random()*512,Math.random()*640,30+Math.random()*90,0,6.29); g.fill();
    }
    queue.push(c);
  }
  toast('10 örnek anı ekleniyor…');
  drain();
});

// ---------- ayarlar paneli ----------
function applyLights(){
  keyL.intensity = S.keyInt; keyL.color.set(S.keyCol);
  fillL.intensity = S.fillInt; ambL.intensity = S.ambInt;
  glowL.intensity = S.glowInt;
  stemL.intensity = S.stemLight;
  if(!S.hueOn){ glowL.color.set('#FF4D5E'); }
}
function applyPetals(hard){
  for(var i=0;i<petals.length;i++){
    var m = petals[i].mat;
    m.roughness = S.glassOn ? S.gRough : S.rough;
    m.emissiveIntensity = S.emiss;
    m.bumpScale = S.petalBump;
    m.envMapIntensity = S.glassOn ? Math.max(S.envI, .45) : S.envI;   // camda kenar parlaması şart
    if(hard){
      m.clearcoat = S.coat;
      m.transmission = S.glassOn ? S.trans : 0;
      m.thickness = S.thick; m.ior = S.ior;
      m.needsUpdate = true;
    }
  }
  if(hard) applyGlassExtras();
}
function applyGlassExtras(){
  for(var i=0;i<glassExtras.length;i++){
    var m = glassExtras[i];
    m.transmission = S.glassOn ? S.trans : 0;
    m.thickness = S.thick; m.ior = S.ior;
    m.roughness = S.glassOn ? Math.max(S.gRough, .08) : m.userData.rough0;
    m.envMapIntensity = S.glassOn ? Math.max(m.userData.env0, .45) : m.userData.env0;
    if('map0' in m.userData){                     // yeşiller camda renksiz — beyaz kenar ışıltısıyla okunur
      m.map = S.glassOn ? m.userData.mapGlass : m.userData.map0;
      m.emissiveMap = S.glassOn ? null : m.userData.emis0;   // camda nötr beyaz, yeşil vermez
      if(S.glassOn) m.envMapIntensity = 1.5;
    }
    m.needsUpdate = true;
  }
  applyGreens();
}
function applyGreens(){
  for(var i=0;i<greenMats.length;i++) greenMats[i].emissiveIntensity = S.glassOn ? 0 : S.stemEmiss;   // camda ışıma yok — saf şeffaf, ışıkla okunur
}
function applyCloudU(){
  if(!cloudU) return;
  cloudU.uSpeed.value = REDUCED ? .08 : S.cloudSpeed;
  cloudU.uSize.value = renderer.getPixelRatio()*S.cloudSize;
  cloudU.uOpa.value = S.cloudOpa;
  cloudU.uHueC.value = S.hueC;
  cloudU.uHueW.value = S.hueW;
}
function applyVign(){
  document.getElementById('vignette').style.background =
    'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 44%, rgba(10,4,9,'+S.vign+') 100%)';
}
function applyTimes(){ C_HOLD = S.holdCardS*1000; }
function rebuildHues(){
  PETAL_HUES.length = 0;
  for(var i=0;i<8;i++){
    var h = ((S.petalHue + (i/7-.5)*S.petalSpread)%360+360)%360;
    var col = new THREE.Color(); col.setHSL(h/360, .68, .48);
    PETAL_HUES.push('#'+col.getHexString());
  }
}
var PETAL_DEF = null;                             // ilk paletin kopyası — sıfırlamada geri gelir

var ROWS = [
  ['h','Işık'],
  ['r','Ana ışık','keyInt',0,3,.05,applyLights],
  ['c','Ana ışık rengi','keyCol',applyLights],
  ['r','Dolgu ışık','fillInt',0,1.5,.05,applyLights],
  ['r','Ortam ışığı','ambInt',0,3,.05,applyLights],
  ['r','İç spot','glowInt',0,4,.05,applyLights],
  ['r','Sap ışığı','stemLight',0,6,.1,applyLights],
  ['t','Spot renk döngüsü','hueOn',applyLights],
  ['r','Döngü hızı','hueSpeed',.02,1,.01,null],
  ['h','Gül'],
  ['t','Cam modu','glassOn',function(){ if(S.glassOn && S.trans < .6) S.trans = 1; applyPetals(true); buildPanel(); }],
  ['R','Cam şeffaflığı','trans',0,1,.05,function(){applyPetals(true);}],
  ['R','Cam kalınlığı','thick',0,2,.05,function(){applyPetals(true);}],
  ['R','Kırılma (IOR)','ior',1,2.33,.01,function(){applyPetals(true);}],
  ['r','Cam pürüzü (buzlu)','gRough',0,1,.02,function(){applyPetals(false);}],
  ['r','Matlık','rough',.02,1,.02,function(){applyPetals(false);}],
  ['R','Cila','coat',0,1,.05,function(){applyPetals(true);}],
  ['r','İçten ışıma','emiss',0,.6,.01,function(){applyPetals(false);}],
  ['r','Dal ışıması','stemEmiss',0,1,.02,applyGreens],
  ['r','Yansıma','envI',0,1,.02,function(){applyPetals(false);}],
  ['r','Dönüş hızı','spin',0,.008,.0002,null],
  ['r','Rüzgâr','wind',0,3,.05,null],
  ['r','Salınım','sway',0,3,.05,null],
  ['r','Kabartma','petalBump',0,.025,.001,function(){applyPetals(false);}],
  ['f','Yaprak dokusu*','texFile'],
  ['r','Doku şiddeti*','texAmt',0,1,.05,null],
  ['r','Yaprak tonu*','petalHue',0,360,1,rebuildHues],
  ['r','Ton çeşitliliği*','petalSpread',0,160,2,rebuildHues],
  ['h','Arka plan'],
  ['R','Parçacık sayısı','cloudN',5000,120000,5000,function(){buildCloud();}],
  ['r','Akış hızı','cloudSpeed',0,2,.02,applyCloudU],
  ['r','Nokta boyutu','cloudSize',.5,6,.1,applyCloudU],
  ['r','Opaklık','cloudOpa',0,1,.02,applyCloudU],
  ['r','Renk merkezi','hueC',0,1,.005,applyCloudU],
  ['r','Renk bandı','hueW',0,.5,.005,applyCloudU],
  ['h','Sahne'],
  ['r','Vinyet','vign',0,1,.02,applyVign],
  ['h','Süreler (sn)'],
  ['r','Kart bekleme','holdCardS',.3,4,.1,applyTimes],
  ['r','Mozaik süresi','holdAS',1,8,.5,null],
  ['r','Foto süresi','holdBS',1,10,.5,null]
];

var setPanel = document.getElementById('setPanel');
var setBody = document.getElementById('setBody');
function fmtVal(v){ return Math.abs(v) >= 100 ? Math.round(v) : Math.round(v*1000)/1000; }
function buildPanel(){
  setBody.innerHTML = '';
  ROWS.forEach(function(row){
    if(row[0] === 'h'){
      var h = document.createElement('h3'); h.textContent = row[1];
      setBody.appendChild(h); return;
    }
    var d = document.createElement('div'); d.className = 'srow';
    var l = document.createElement('label'); l.textContent = row[1]; d.appendChild(l);
    if(row[0] === 'c'){
      var ci = document.createElement('input'); ci.type = 'color'; ci.value = S[row[2]];
      ci.addEventListener('input', function(){ S[row[2]] = ci.value; row[3] && row[3](); });
      d.appendChild(ci);
    }else if(row[0] === 'f'){
      var fb = document.createElement('button'); fb.className = 'btn';
      fb.style.cssText = 'flex:1;padding:8px 10px;font-size:12px';
      fb.textContent = petalOverlay ? 'Değiştir' : 'Seç';
      var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.style.display = 'none';
      fb.addEventListener('click', function(){ fi.click(); });
      fi.addEventListener('change', function(){
        var f = fi.files && fi.files[0]; fi.value = '';
        if(!f || !/^image\//.test(f.type)) return;
        var u = URL.createObjectURL(f);
        var im = new Image();
        im.onload = function(){
          URL.revokeObjectURL(u);
          petalOverlay = im;
          if(S.texAmt === 0) S.texAmt = .6;
          toast('Doku kaydedildi — yeni yapraklara uygulanır');
          buildPanel();
        };
        im.src = u;
      });
      d.appendChild(fb); d.appendChild(fi);
    }else if(row[0] === 't'){
      var tb = document.createElement('input'); tb.type = 'checkbox'; tb.checked = !!S[row[2]];
      tb.addEventListener('change', function(){ S[row[2]] = tb.checked; row[3] && row[3](); });
      d.appendChild(tb);
    }else{
      var r = document.createElement('input'); r.type = 'range';
      r.min = row[3]; r.max = row[4]; r.step = row[5]; r.value = S[row[2]];
      var v = document.createElement('span'); v.className = 'sval'; v.textContent = fmtVal(S[row[2]]);
      r.addEventListener(row[0] === 'R' ? 'change' : 'input', function(){
        S[row[2]] = parseFloat(r.value); v.textContent = fmtVal(S[row[2]]);
        row[6] && row[6]();
      });
      if(row[0] === 'R') r.addEventListener('input', function(){ v.textContent = fmtVal(parseFloat(r.value)); });
      d.appendChild(r); d.appendChild(v);
    }
    setBody.appendChild(d);
  });
}
buildPanel();
PETAL_DEF = PETAL_HUES.slice();
applyLights(); applyPetals(true); applyCloudU(); applyVign(); applyTimes();   // gömülü varsayılanlar sahneye işlensin

document.getElementById('setBtn').addEventListener('click', function(){ setPanel.classList.toggle('on'); });
document.getElementById('setClose').addEventListener('click', function(){ setPanel.classList.remove('on'); });
document.getElementById('setReset').addEventListener('click', function(){
  Object.assign(S, JSON.parse(JSON.stringify(DEF)));
  petalOverlay = null;
  PETAL_HUES.length = 0; PETAL_DEF.forEach(function(h){ PETAL_HUES.push(h); });
  applyLights(); applyPetals(true); applyGreens(); buildCloud(); applyVign(); applyTimes();
  buildPanel();
  toast('Ayarlar varsayılana döndü');
});

// final akışı
var nameBox = document.getElementById('nameBox');
var nameInput = document.getElementById('nameInput');
finalBtn.addEventListener('click', function(){
  if(finale.pts){
    if(finale.dir === 0 && finale.prog >= 1){      // yazı duruyor → geri sar
      finale.dir = -1; finale.t0 = performance.now();
      finalBtn.disabled = true; finalBtn.textContent = '…';
    }
    return;
  }
  nameBox.classList.add('on');
  setTimeout(function(){ nameInput.focus(); }, 50);
});
document.getElementById('nameGo').addEventListener('click', function(){
  var name = nameInput.value.trim() || nameInput.placeholder;
  nameBox.classList.remove('on');
  launchFinale(null, makeTextCollage(name, photoLog.slice()), false);
});
document.getElementById('nameImgBtn').addEventListener('click', function(){
  document.getElementById('finImg').click();
});
document.getElementById('finImg').addEventListener('change', function(){
  var f = this.files && this.files[0]; this.value='';
  if(!f || !/^image\//.test(f.type)) return;
  var url = URL.createObjectURL(f);
  var im = new Image();
  im.onload = function(){
    URL.revokeObjectURL(url);
    finalePhoto = im;                             // döngü finali bu fotoğrafa evrilecek
    nameBox.classList.remove('on');
    toast('Final fotoğrafı kaydedildi — döngüde kullanılacak');
  };
  im.src = url;
});
document.getElementById('nameCancel').addEventListener('click', function(){
  nameBox.classList.remove('on');
});
nameInput.addEventListener('keydown', function(e){
  if(e.key === 'Enter') document.getElementById('nameGo').click();
});

// sıfırla
var cascadeUntil = 0;
function shedPhotoPetals(){
  var list = [];
  for(var i=0;i<petals.length;i++) if(petals[i].isPhoto) list.push(petals[i]);
  photoCount = 0; countEl.textContent = '0';
  photoLog.length = 0;
  slotNext = BUD;
  cascadeUntil = performance.now() + list.length*130 + 600;
  list.forEach(function(pe, idx){
    setTimeout(function(){
      var at = petals.indexOf(pe);
      if(at === -1) return;
      spawnFaller(pe);                            // tek tek kopar, süzülür, buluta karışır
      rose.remove(pe.holder);
      petals.splice(at,1);
    }, idx*130);
  });
}

function resetGarden(keepQueue){
  cascadeUntil = 0;
  cleanupFinale();
  clearFallers();
  for(var i=petals.length-1;i>=0;i--){
    var pe = petals[i];
    if(!pe.isPhoto) continue;
    rose.remove(pe.holder);
    pe.mat.map && pe.mat.map.dispose(); pe.mat.dispose();
    petals.splice(i,1);
  }
  for(var ci=cards.length-1;ci>=0;ci--){
    var cd = cards[ci];
    if(!cd.cardGone) scene.remove(cd.mesh);
    cd.mat.map && cd.mat.map.dispose(); cd.mat.dispose();
    if(cd.pts){ scene.remove(cd.pts); cd.pts.geometry.dispose(); cd.pts.material.dispose(); }
  }
  cards.length = 0;
  slotNext = BUD; photoCount = 0; photoLog.length = 0;
  if(!keepQueue) queue.length = 0;
  countEl.textContent = '0';
}

document.getElementById('resetBtn').addEventListener('click',function(){
  resetGarden(false);
  toast('Bahçe sıfırlandı');
});

// tam ekran
document.getElementById('fsBtn').addEventListener('click',function(){
  var el = document.documentElement;
  if(document.fullscreenElement){ document.exitFullscreen(); }
  else if(el.requestFullscreen){
    el.requestFullscreen().catch(function(){ toast('Tarayıcı tam ekrana izin vermedi'); });
  }else{ toast('Bu tarayıcı tam ekranı desteklemiyor'); }
});

// toast
var toastEl = document.getElementById('toast'), toastT;
function toast(msg){
  toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('on'); },2400);
}
addEventListener('error', function(e){ toast('Hata: ' + (e.message || 'bilinmeyen')); });

  // ==========================================================================
  // MIXO KÖPRÜSÜ — demo'da olmayan tek ekleme.
  // Motorun kapanışları içinden dışarıya tutamak veriyoruz; React tarafı
  // sadece bu yüzeyi görüyor, motorun içine hiç girmiyor.
  // ==========================================================================
  api.addImage = function (img) { queue.push(img); drain(); };
  api.reset = function () { resetGarden(false); };
  api.count = function () { return photoCount; };
  api.finaleActive = function () { return !!finale.pts; };
  api.queueLength = function () { return queue.length; };
  api.showFinale = function (name) {
    if (finale.pts) return;
    launchFinale(null, makeTextCollage(name || "Anı Bahçesi", photoLog.slice()), false);
  };
  api.dispose = function () {
    try {
      cancelAnimationFrame(rafId);
      resetGarden(false);
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    } catch (e) { /* sayfa kapanıyor, yutulabilir */ }
  };

  return api;
}
