/*
  الأتيليه: مشهد WebGL تفاعلي (يُبنى حين يقترب من الشاشة ويُفكَّك حين يبتعد). اسحب لتدوير القطعة، وبدّل الحجر أو الميناء أو الحبّات.
  القطعة تنكمش ثم تعود بنبض عند كل تبديل، مع شرارات وغبار لامع حولها.
*/
import { THREE, baseStage, canvasTex, clamp, lerp, ss } from './lib3d.js';
import { buildRing, buildMisbaha, GEMS } from './jewelry.js';
import { buildWatch } from './watch.js';

export const AT = {
  ring: ['amethyst', 'sapphire', 'emerald', 'ruby', 'topaz', 'citrine', 'pink'],
  watch: ['black', 'navy', 'white', 'green', 'champagne'],
  beads: ['amber', 'onyx', 'silver', 'tigereye', 'turquoise', 'coral']
};
const STRAP = { black: 'leather-brown', navy: 'silver', white: 'leather-black', green: 'leather-green', champagne: 'leather-brown' };
export const SWATCH = {
  amethyst: '#8a4fd6', sapphire: '#3a6fe8', emerald: '#14a468', ruby: '#d6193f', topaz: '#5ec0f0', citrine: '#f5ab2e', pink: '#e8629f',
  black: '#1c2434', navy: '#27498a', white: '#f1ede2', green: '#2a6a54', champagne: '#d9c9a4',
  amber: '#d8851a', onyx: '#14141a', silver: '#c8cfdb', tigereye: '#8a5a1c', turquoise: '#2db6a8', coral: '#dd4a3a'
};

export function createAtelier(canvas, init = {}) {
  const S = baseStage(canvas, { fov: 26, exposure: 1.06, dprCap: 1.6, forceRun: false });
  if (!S) return null;
  const { scene, camera } = S, api = { tab: init.tab || 'ring', key: init.key || 'amethyst', onTick: null, dragging: false };

  scene.add(new THREE.HemisphereLight(0xdbe6ff, 0x161a24, .55));
  const key = new THREE.DirectionalLight(0xffffff, 1.15); key.position.set(-4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb4ff, .9); rim.position.set(5, 2, -6); scene.add(rim);
  const glow = new THREE.PointLight(0xffffff, 6, 16, 1.6); glow.position.set(2, 2.5, 5); scene.add(glow);

  /* قاعدة مضيئة تحت القطعة + غبار لامع صاعد */
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.55, .012, 8, 128), new THREE.MeshBasicMaterial({ color: 0xa9c8ff, transparent: true, opacity: .55 })); halo.rotation.x = Math.PI / 2; halo.position.y = -2.25; scene.add(halo);
  const halo2 = halo.clone(); halo2.material = halo.material.clone(); halo2.material.opacity = .22; halo2.scale.setScalar(1.35); scene.add(halo2);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.5, 64), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(150,185,255,.35)'); g.addColorStop(1, 'rgba(150,185,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); }, false), transparent: true, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.y = -2.24; scene.add(disc);
  const NP = S.coarse ? 40 : 80, pp = new Float32Array(NP * 3), ph = [];
  for (let i = 0; i < NP; i++) { pp[i * 3] = (Math.random() - .5) * 6; pp[i * 3 + 1] = Math.random() * 5.4 - 2.4; pp[i * 3 + 2] = (Math.random() - .5) * 3 - .5; ph.push(Math.random() * 6); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ map: canvasTex(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(190,215,255,.5)'); g.addColorStop(1, 'rgba(190,215,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }), size: .14, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 })); scene.add(dust);

  const tilt = new THREE.Group(), spin = new THREE.Group(); tilt.add(spin); scene.add(tilt);
  let obj = null, watchApi = null, pending = null, phase = 'in', tIn = 0, sOut = 1, userA = 0, vel = 0, tabNow = null, t0 = performance.now();

  function clearObj() { if (!obj) return; spin.remove(obj); obj.traverse((n) => { if (n.geometry) n.geometry.dispose(); const ms = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : []; ms.forEach((m) => { ['map', 'bumpMap', 'alphaMap'].forEach((k) => m[k] && m[k].dispose && m[k].dispose()); }); }); obj = null; watchApi = null; }
  function build(tab, key) {
    clearObj(); tabNow = tab; const holder = new THREE.Group();
    if (tab === 'ring') { const r = buildRing({ style: 'solitaire', gem: key }); r.rotation.y = Math.PI / 2; r.scale.setScalar(1.2); r.position.y = -.45; holder.add(r); tilt.rotation.x = .5; camera.position.set(0, .4, 9.6); }
    else if (tab === 'watch') { watchApi = buildWatch({ dial: key, strap: STRAP[key] || 'silver', brand: 'MOHAMMED' }); watchApi.onTick = (s) => api.onTick && api.onTick(s); watchApi.root.scale.setScalar(1.25); holder.add(watchApi.root); tilt.rotation.x = .1; camera.position.set(0, .3, 11.2); }
    else { const m = buildMisbaha({ bead: key, tassel: key === 'silver' ? 'silver' : undefined }); m.scale.setScalar(1.12); m.position.y = .15; holder.add(m); tilt.rotation.x = .08; camera.position.set(0, .1, 12); }
    camera.lookAt(0, -.1, 0); obj = holder; spin.add(holder);
  }
  api.set = (tab, key) => {
    if (tab === api.tab && key === api.key && obj) return;
    const rebuild = () => { api.tab = tab; api.key = key; build(tab, key); };
    if (!obj) { rebuild(); phase = 'in'; tIn = 0; } else { pending = rebuild; phase = 'out'; }
  };

  /* سحب بالإصبع أو الفأرة */
  let down = false, lastX = 0;
  const pd = (e) => { down = true; api.dragging = true; lastX = e.clientX; vel = 0; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); api.onDrag && api.onDrag(true); };
  const pm = (e) => { if (!down) return; const dx = e.clientX - lastX; lastX = e.clientX; userA += dx * .011; vel = dx * .011; };
  const pu = () => { if (!down) return; down = false; api.dragging = false; api.onDrag && api.onDrag(false); };
  canvas.addEventListener('pointerdown', pd); canvas.addEventListener('pointermove', pm); addEventListener('pointerup', pu); canvas.addEventListener('pointercancel', pu);

  S.onResize = (w, h) => { const a = w / h; camera.fov = a < .9 ? 30 : 26; camera.updateProjectionMatrix(); };
  S.onDispose = () => { canvas.removeEventListener('pointerdown', pd); canvas.removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); canvas.removeEventListener('pointercancel', pu); clearObj(); };

  S.onFrame = (dt, now) => {
    const t = (now - t0) / 1000;
    let sc = 1;
    if (phase === 'out') { sOut = Math.max(0, sOut - dt * 7); sc = sOut; if (sOut <= 0) { pending && pending(); pending = null; phase = 'in'; tIn = 0; sOut = 1; sc = 0; } }
    else if (phase === 'in') { tIn = Math.min(1, tIn + dt * 2.2); const x = tIn - 1; sc = 1 + 2.70158 * x * x * x + 1.70158 * x * x; if (tIn >= 1) phase = 'idle'; }
    if (!down) { userA += vel; vel *= Math.pow(.04, dt); }
    const auto = tabNow === 'ring' ? t * .5 : Math.sin(t * .55) * (tabNow === 'watch' ? .5 : .7);
    spin.rotation.y = auto + userA; spin.scale.setScalar(Math.max(.001, sc)); spin.position.y = Math.sin(t * .9) * .09;
    if (watchApi) { const d = new Date(); watchApi.setTime(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000, true); watchApi.spin(dt); }
    halo.rotation.z = t * .25; halo2.rotation.z = -t * .15; halo.material.opacity = .45 + Math.sin(t * 1.6) * .12;
    glow.position.set(Math.sin(t * .6) * 4.5, 2.5 + Math.cos(t * .4), 4.5);
    const a = pg.attributes.position; for (let i = 0; i < NP; i++) { let y = a.getY(i) + dt * (.12 + (i % 5) * .03); if (y > 3.1) y = -2.4; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * .5 + ph[i]) * dt * .06); } a.needsUpdate = true;
  };

  build(api.tab, api.key); S.renderOnce();
  api.dispose = () => S.dispose(); api.stage = S;
  return api;
}
