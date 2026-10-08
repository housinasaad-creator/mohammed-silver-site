/*
  الأتيليه: مشهد WebGL تفاعلي مدفوع بإعدادات (config) لكل قطعة: الخاتم والساعة والمسبحة. يُبنى حين يقترب من الشاشة ويُفكَّك حين يبتعد.
  اسحب لتدوير القطعة. كل تغيير في الخيارات يُعيد بناء القطعة بنبضة (تنكمش ثم تعود)، ويمكن التقاط صورة مربعة للتصميم لإرسالها.
*/
import { THREE, baseStage, canvasTex, clamp } from './lib3d.js';
import { buildRingCustom, buildMisbaha } from './jewelry.js';
import { buildWatch } from './watch.js';

const TASSEL = { silver: 'silver', black: 0x1b1d24, burgundy: 0x5a1020, navy: 0x1a2a4a, ivory: 0xe8e0d0 };
const WATCH_K = { 36: .9, 40: 1, 44: 1.1 };

export function createAtelier(canvas, init = {}) {
  const S = baseStage(canvas, { fov: 26, exposure: 1.06, dprCap: 1.5, forceRun: false });
  if (!S) return null;
  const { scene, camera } = S, api = { tab: init.tab || 'ring', cfg: init.cfg || {}, onTick: null, dragging: false, onDrag: null };
  let accent = new THREE.Color(init.accent || '#d9c59d');

  scene.add(new THREE.HemisphereLight(0xf2f0ec, 0x1a1816, .55));
  const key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(-4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff4e6, .85); rim.position.set(5, 2, -6); scene.add(rim);
  const glow = new THREE.PointLight(0xffffff, 6, 16, 1.6); glow.position.set(2, 2.5, 5); scene.add(glow);

  /* قاعدة مضيئة تحت القطعة + غبار لامع صاعد (بلون الثيم الحالي) */
  const haloM = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .5 }), halo2M = haloM.clone();
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.55, .012, 8, 128), haloM); halo.rotation.x = Math.PI / 2; halo.position.y = -2.25; scene.add(halo);
  const halo2 = new THREE.Mesh(halo.geometry, halo2M); halo2.material.opacity = .2; halo2.rotation.x = Math.PI / 2; halo2.position.y = -2.25; halo2.scale.setScalar(1.35); scene.add(halo2);
  const discM = new THREE.MeshBasicMaterial({ color: accent, map: canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); }, false), transparent: true, depthWrite: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.5, 64), discM); disc.rotation.x = -Math.PI / 2; disc.position.y = -2.24; scene.add(disc);
  const NP = S.coarse ? 36 : 70, pp = new Float32Array(NP * 3), ph = [];
  for (let i = 0; i < NP; i++) { pp[i * 3] = (Math.random() - .5) * 6; pp[i * 3 + 1] = Math.random() * 5.4 - 2.4; pp[i * 3 + 2] = (Math.random() - .5) * 3 - .5; ph.push(Math.random() * 6); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const dustM = new THREE.PointsMaterial({ color: accent.clone().lerp(new THREE.Color(0xffffff), .5), map: canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }), size: .14, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 });
  scene.add(new THREE.Points(pg, dustM));

  const tilt = new THREE.Group(), spin = new THREE.Group(); tilt.add(spin); scene.add(tilt);
  let obj = null, watchApi = null, pending = null, phase = 'in', tIn = 0, sOut = 1, userA = 0, vel = 0, tabNow = null, t0 = performance.now();

  function clearObj() { if (!obj) return; spin.remove(obj); obj.traverse((n) => { if (n.geometry) n.geometry.dispose(); const ms = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : []; ms.forEach((m) => { ['map', 'alphaMap'].forEach((k) => m[k] && m[k].dispose && m[k].dispose()); }); }); obj = null; watchApi = null; }
  function build(tab, cfg) {
    clearObj(); tabNow = tab; const holder = new THREE.Group();
    if (tab === 'ring') { const r = buildRingCustom(cfg); r.rotation.y = Math.PI / 2; r.scale.setScalar(1.12); r.position.y = -.42; holder.add(r); tilt.rotation.x = .5; camera.position.set(0, .4, 10); }
    else if (tab === 'watch') { watchApi = buildWatch({ dial: cfg.dial, strap: cfg.strap, brand: cfg.brand || 'MOHAMMED', finish: cfg.finish, bezelGems: cfg.bezel }); watchApi.onTick = (s) => api.onTick && api.onTick(s); watchApi.root.scale.setScalar(1.25 * (WATCH_K[cfg.size] || 1)); holder.add(watchApi.root); tilt.rotation.x = .1; camera.position.set(0, .3, 11.4); }
    else { const m = buildMisbaha({ bead: cfg.bead, beads: +cfg.count || 33, tassel: TASSEL[cfg.tassel] }); m.scale.setScalar(1.12); m.position.y = .15; holder.add(m); tilt.rotation.x = .08; camera.position.set(0, .1, 12); }
    camera.lookAt(0, -.1, 0); obj = holder; spin.add(holder);
  }
  /* تبديل القطعة أو أي خيار: تنكمش القطعة الحالية ثم تُبنى الجديدة وتعود بنبضة */
  api.set = (tab, cfg) => {
    api.tab = tab; api.cfg = cfg; const rebuild = () => build(tab, cfg);
    if (!obj) { rebuild(); phase = 'in'; tIn = 0; } else { pending = rebuild; phase = 'out'; }
  };
  api.setAccent = (hex) => { accent = new THREE.Color(hex); haloM.color.copy(accent); halo2M.color.copy(accent); discM.color.copy(accent); dustM.color.copy(accent).lerp(new THREE.Color(0xffffff), .5); };
  /* صورة مربعة للتصميم الحالي (تُرسم بحجم px ثم يعود العرض لحجمه) */
  api.snapshot = (px = 1000) => {
    const R = S.renderer; R.setPixelRatio(1); R.setSize(px, px, false); camera.aspect = 1; camera.updateProjectionMatrix();
    halo.visible = halo2.visible = false; R.render(scene, camera); halo.visible = halo2.visible = true;
    const c2 = document.createElement('canvas'); c2.width = c2.height = px; c2.getContext('2d').drawImage(canvas, 0, 0, px, px);
    S.resize(); return c2;
  };

  /* سحب بالإصبع أو الفأرة */
  let down = false, lastX = 0;
  const pd = (e) => { down = true; api.dragging = true; lastX = e.clientX; vel = 0; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); api.onDrag && api.onDrag(true); };
  const pm = (e) => { if (!down) return; const dx = e.clientX - lastX; lastX = e.clientX; userA += dx * .011; vel = dx * .011; };
  const pu = () => { if (!down) return; down = false; api.dragging = false; api.onDrag && api.onDrag(false); };
  canvas.addEventListener('pointerdown', pd); canvas.addEventListener('pointermove', pm); addEventListener('pointerup', pu); canvas.addEventListener('pointercancel', pu);

  S.onResize = (w, h) => { camera.fov = w / h < .9 ? 30 : 26; camera.updateProjectionMatrix(); };
  S.onDispose = () => { canvas.removeEventListener('pointerdown', pd); canvas.removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); canvas.removeEventListener('pointercancel', pu); clearObj(); };

  S.onFrame = (dt, now) => {
    const t = (now - t0) / 1000; let sc = 1;
    if (phase === 'out') { sOut = Math.max(0, sOut - dt * 8); sc = sOut; if (sOut <= 0) { pending && pending(); pending = null; phase = 'in'; tIn = 0; sOut = 1; sc = 0; } }
    else if (phase === 'in') { tIn = Math.min(1, tIn + dt * 2.4); const x = tIn - 1; sc = 1 + 2.70158 * x * x * x + 1.70158 * x * x; if (tIn >= 1) phase = 'idle'; }
    if (!down) { userA += vel; vel *= Math.pow(.04, dt); }
    const auto = tabNow === 'ring' ? t * .5 : Math.sin(t * .55) * (tabNow === 'watch' ? .5 : .7);
    spin.rotation.y = auto + userA; spin.scale.setScalar(Math.max(.001, sc)); spin.position.y = Math.sin(t * .9) * .09;
    if (watchApi) { const d = new Date(); watchApi.setTime(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000, true); watchApi.spin(dt); }
    halo.rotation.z = t * .25; halo2.rotation.z = -t * .15; haloM.opacity = .42 + Math.sin(t * 1.6) * .12;
    glow.position.set(Math.sin(t * .6) * 4.5, 2.5 + Math.cos(t * .4), 4.5);
    const a = pg.attributes.position; for (let i = 0; i < NP; i++) { let y = a.getY(i) + dt * (.12 + (i % 5) * .03); if (y > 3.1) y = -2.4; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * .5 + ph[i]) * dt * .06); } a.needsUpdate = true;
  };

  build(api.tab, api.cfg); S.renderOnce();
  api.dispose = () => S.dispose(); api.stage = S;
  return api;
}
