/*
  أدوات three.js لمتجر الفضيات: بيئة استوديو داكنة بإضاءات شريطية باردة (تعطي الفضة انعكاساتها)،
  وقاعدة مشهد تعمل فقط حين تكون ظاهرة وتُفكَّك بالكامل من الذاكرة عند الخروج منها.
*/
import * as THREE from './vendor/three.module.min.js';
export { THREE };

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
export const ss = (t) => t * t * (3 - 2 * t);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* غرفة سوداء + نوافذ إضاءة باردة: الشرائح الطولية البيضاء هي ما يمنح الفضة لمعتها */
export function makeEnv(renderer, o = {}) {
  const sc = new THREE.Scene();
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: o.room || 0x05070d, side: THREE.BackSide })));
  const gc = document.createElement('canvas'); gc.width = 8; gc.height = 64; {
    const g = gc.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#fff'); gr.addColorStop(.5, '#dfe8f5'); gr.addColorStop(1, '#4a5568'); g.fillStyle = gr; g.fillRect(0, 0, 8, 64);
  }
  const grad = new THREE.CanvasTexture(gc); grad.colorSpace = THREE.SRGBColorSpace;
  const panel = (w, h, col, k, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: grad, color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(0, 0, 0); sc.add(m); };
  panel(8, 3, 0xffffff, 13, [-2, 7.5, 3]);       // نافذة علوية
  panel(1.1, 10, 0xeaf2ff, 12, [-8, 1.5, 1]);    // شريط طولي يسار
  panel(1.1, 10, 0xffffff, 10, [8, 1.5, 2]);     // شريط طولي يمين
  panel(.8, 8, 0xffffff, 8, [3.2, 1, 8]);        // شريط أمامي ضيّق
  panel(6, 5, 0x7ea6ff, 2.4, [5, 1, -6]);        // حافّة باردة خلفية
  panel(10, 2.2, 0xffffff, 4, [0, 6, -8]);       // ضوء خلفي علوي
  panel(9, 6, 0xf3f7ff, 3.2, [0, 2.5, 9]);       // نافذة أمامية واسعة
  panel(16, 16, 0x8a8f99, 1.5, [0, -5.5, 0]);    // أرضية فاتحة باردة: ترتدّ منها الأسطح المائلة للأسفل (الرؤوس والأساور)
  panel(1.6, 1.6, 0xffc88a, 5, [-6, -2, 6]);     // لمسة دافئة صغيرة للأحجار
  panel(9, 9, 0xffffff, 5.5, [0, 9.3, 0.5]);     // صندوق ضوء علوي كبير: يضيء الأسطح المواجهة للأعلى
  panel(8, 2.2, 0xdfe9ff, 4.2, [0, -1.5, 8]);    // تعبئة أمامية منخفضة
  panel(18, 7, 0xdfe3ea, 1.5, [0, 0.8, -9.4]);    // جدار خلفي خافت: يمنع اسوداد الأسطح المسطّحة العاكسة نحو الأفق
  panel(7, 8, 0xa4abb8, .6, [-9.3, 0, -3]);     // جدارا الجانبين بإضاءة رمادية-زرقاء ناعمة
  panel(7, 8, 0xa4abb8, .6, [9.3, 0, -3]);
  const pm = new THREE.PMREMGenerator(renderer), rt = pm.fromScene(sc, 0.015); pm.dispose(); grad.dispose(); return rt.texture;
}

/* قاعدة مشهد */
export function baseStage(canvas, o = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!o.preserve }); } catch (e) { return null; }
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = o.exposure || 1;
  const coarse = matchMedia('(pointer: coarse)').matches;
  let dprMax = Math.min(devicePixelRatio || 1, o.dprCap || (coarse ? 1.6 : 2));
  const scene = new THREE.Scene(); scene.environment = makeEnv(renderer, o);
  const camera = new THREE.PerspectiveCamera(o.fov || 28, 1, 0.1, 80);
  const S = { renderer, scene, camera, coarse, canvas, vis: false, disposed: false, onFrame: null, onResize: null, time: 0, forceRun: !!o.forceRun };
  let raf = 0, last = 0, acc = 0, frames = 0, slow = 0; const cap = coarse ? 1 / 30 : 1 / 60;
  function resize() {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300; renderer.setPixelRatio(dprMax); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    S.onResize && S.onResize(w, h);
  }
  function frame(now) {
    raf = 0; if (S.disposed || (!S.vis && !S.forceRun) || document.hidden) return;
    const dtRaw = Math.min(.05, (now - last) / 1000); last = now; acc += dtRaw;
    if (acc < cap * .9) { raf = requestAnimationFrame(frame); return; }
    const dt = acc; acc = 0; S.time += dt;
    S.onFrame && S.onFrame(dt, now);
    renderer.render(scene, camera);
    frames++; if (dt > .045) slow++;
    if (frames === 50) { if (slow > 22 && dprMax > 1) { dprMax = Math.max(1, dprMax - .3); resize(); } frames = 0; slow = 0; }
    raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!S.disposed && (S.vis || S.forceRun) && !raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const io = new IntersectionObserver((es) => { S.vis = es[0].isIntersecting; wake(); }, { rootMargin: '80px' }); io.observe(canvas);
  const onWin = () => resize(); addEventListener('resize', onWin); document.addEventListener('visibilitychange', wake);
  S.resize = resize; S.wake = wake;
  S.renderOnce = () => { S.onFrame && S.onFrame(0, performance.now()); renderer.render(scene, camera); };
  S.dispose = () => {
    if (S.disposed) return; S.disposed = true; S.vis = false; cancelAnimationFrame(raf); raf = 0;
    removeEventListener('resize', onWin); document.removeEventListener('visibilitychange', wake); io.disconnect(); S.onDispose && S.onDispose();
    scene.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.material) (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) => { ['map', 'alphaMap', 'bumpMap', 'normalMap', 'roughnessMap'].forEach((k) => m[k] && m[k].dispose && m[k].dispose()); m.dispose(); }); });
    if (scene.environment) scene.environment.dispose(); scene.environment = null; if (scene.background && scene.background.dispose) scene.background.dispose(); scene.background = null;
    renderer.dispose(); renderer.forceContextLoss(); canvas.width = 1; canvas.height = 1;
  };
  S.resize();
  return S;
}

/* مستطيل بزوايا مدوّرة كـShape */
export function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
export function ellipseShape(rx, ry, n = 48) { const s = new THREE.Shape(); for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; i ? s.lineTo(x, y) : s.moveTo(x, y); } return s; }

/* خامة قماشية من كانفاس */
export function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

/* وجه مسطّح بإحداثيات UV مطابقة لحدود الشكل (لنقش النص على لوحة) */
export function shapeFace(shape, material, z = 0) {
  const g = new THREE.ShapeGeometry(shape, 24); g.computeBoundingBox(); const b = g.boundingBox, pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
  const m = new THREE.Mesh(g, material); m.position.z = z; return m;
}
