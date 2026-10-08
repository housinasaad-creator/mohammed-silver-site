/*
  ساعة يد مولَّدة بالكود: علبة فضية، بيزل، ميناء بإشعاع شمسي (كانفاس)، زجاج، عقارب (الثواني تدقّ بقفزة وارتداد)،
  تاج، آذان، سوار (جلد بخياطة أو سلسلة فضية)، وحركة داخلية (تروس وياقوت) تظهر عند التفكيك.
  المحور: وجه الساعة نحو +Y عند البناء، وتُدار مجموعة الخارج ليواجه +Z مع الـ12 للأعلى.
*/
import { THREE, rrShape, canvasTex, clamp, lerp } from './lib3d.js';
import { mats, gem, gemMat } from './jewelry.js';

const DIALS = {
  black: { bg: ['#1b2230', '#07090d'], tick: '#e8edf5', txt: '#e8edf5', lume: '#cfe6ff' },
  navy: { bg: ['#2a4a86', '#0b1a3a'], tick: '#eaf0fb', txt: '#eaf0fb', lume: '#d7e8ff' },
  white: { bg: ['#fbf8f1', '#d9d4c7'], tick: '#1c2230', txt: '#1c2230', lume: '#1c2230' },
  green: { bg: ['#2c6a55', '#0c2a21'], tick: '#eaf4ef', txt: '#eaf4ef', lume: '#d9f2e6' },
  champagne: { bg: ['#efe3c9', '#b9a57d'], tick: '#2a2418', txt: '#2a2418', lume: '#2a2418' }
};
const STRAPS = { 'leather-black': 0x17140f, 'leather-brown': 0x5b3416, 'leather-navy': 0x14223f, 'leather-green': 0x1b3a2d };

function dialDraw(d, text) {
  return (c, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2, g = c.createRadialGradient(cx, cy * .86, 0, cx, cy, R); g.addColorStop(0, d.bg[0]); g.addColorStop(1, d.bg[1]); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.save(); c.translate(cx, cy); for (let i = 0; i < 240; i++) { c.rotate(Math.PI * 2 / 240); c.strokeStyle = `rgba(255,255,255,${.018 + (i % 3) * .008})`; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 40); c.lineTo(0, R); c.stroke(); } c.restore();
    c.save(); c.translate(cx, cy); for (let i = 0; i < 60; i++) { c.rotate(Math.PI * 2 / 60); c.fillStyle = d.tick; c.globalAlpha = i % 5 ? .75 : 0; c.fillRect(-2, -R + 22, 4, i % 5 ? 20 : 0); } c.globalAlpha = 1;
    for (let i = 0; i < 12; i++) { c.save(); c.rotate((i / 12) * Math.PI * 2); const big = i % 3 === 0; c.fillStyle = d.tick; c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 8; c.fillRect(-(big ? 15 : 9), -R + 52, big ? 30 : 18, big ? 92 : 76); c.fillStyle = d.lume; c.globalAlpha = .75; c.fillRect(-(big ? 7 : 3), -R + 64, big ? 14 : 6, big ? 62 : 50); c.restore(); } c.restore();
    c.fillStyle = d.txt; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 54px "Cormorant Garamond", "Manrope", serif'; c.letterSpacing = '8px'; c.fillText(text || 'MOHAMMED', cx, cy - 190);
    c.font = '500 26px "Manrope", sans-serif'; c.letterSpacing = '6px'; c.globalAlpha = .75; c.fillText('AUTOMATIC · SILVER 925', cx, cy + 215); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R - 6, 0, Math.PI * 2); c.stroke();
  };
}
function handShape(len, w, tail = 0) { const s = new THREE.Shape(); s.moveTo(-w / 2, tail); s.lineTo(-w * .62, -len * .1); s.lineTo(0, -len); s.lineTo(w * .62, -len * .1); s.lineTo(w / 2, tail); s.closePath(); return s; }
function gearGeo(R, teeth, th, holes = 0) {
  const s = new THREE.Shape(), root = R * .84; for (let i = 0; i < teeth; i++) { const a0 = (i / teeth) * Math.PI * 2, da = Math.PI * 2 / teeth, p = (k, r) => [Math.cos(a0 + da * k) * r, Math.sin(a0 + da * k) * r]; const pts = [p(0, root), p(.12, R), p(.38, R), p(.5, root)]; pts.forEach((q, j) => (i === 0 && j === 0 ? s.moveTo(q[0], q[1]) : s.lineTo(q[0], q[1]))); }
  s.closePath(); const hole = new THREE.Path(); hole.absarc(0, 0, R * .12, 0, Math.PI * 2, true); s.holes.push(hole);
  for (let i = 0; i < holes; i++) { const a = (i / holes) * Math.PI * 2, h = new THREE.Path(); h.absarc(Math.cos(a) * R * .5, Math.sin(a) * R * .5, R * .17, 0, Math.PI * 2, true); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: false, curveSegments: 6 }); g.rotateX(-Math.PI / 2); return g;
}

export function buildWatch(o = {}) {
  const M = mats(), root = new THREE.Group(), g = new THREE.Group(); root.add(g); root.rotation.x = Math.PI / 2;
  const dial = DIALS[o.dial] || DIALS.black, parts = {}, mk = (name, y = 0) => { const p = new THREE.Group(); p.name = name; p.userData.y0 = y; p.position.y = y; g.add(p); parts[name] = p; return p; };
  const metal = o.strap === 'silver' ? M.silver : M.silver;

  /* العلبة (كوب مجوّف) + الآذان + التاج */
  const cs = mk('case'), cp = [[0, -.2], [.84, -.2], [.9, -.18], [.97, -.12], [1, -.04], [1, .08], [.96, .14], [.9, .16], [.8, .16], [.8, -.12], [0, -.12]].map((p) => new THREE.Vector2(p[0], p[1]));
  cs.add(new THREE.Mesh(new THREE.LatheGeometry(cp, 120), metal));
  [[-.5, -1.02], [.5, -1.02], [-.5, 1.02], [.5, 1.02]].forEach(([x, z]) => { const lug = new THREE.Mesh(new THREE.ExtrudeGeometry(rrShape(.17, .4, .06), { depth: .13, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 3 }), metal); lug.rotation.x = Math.PI / 2; lug.position.set(x, .06, z); cs.add(lug); const pin = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .2, 10), M.dark); pin.rotation.z = Math.PI / 2; pin.position.set(x, -.02, z * (Math.abs(z) > 1 ? 1.07 : 1)); });
  const crown = mk('crown'); const cr = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .16, 28), metal); cr.rotation.z = Math.PI / 2; cr.position.set(1.04, .03, 0); crown.add(cr);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, rib = new THREE.Mesh(new THREE.BoxGeometry(.17, .016, .016), M.dark); rib.position.set(1.045, .03 + Math.sin(a) * .088, Math.cos(a) * .088); rib.rotation.x = -a; crown.add(rib); }
  const back = mk('caseback', -.2); const bk = new THREE.Mesh(new THREE.CylinderGeometry(.78, .78, .05, 80), M.satin); bk.position.y = -.025; back.add(bk); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, sc = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .06, 12), M.dark); sc.position.set(Math.cos(a) * .7, -.05, Math.sin(a) * .7); back.add(sc); }

  /* الحركة الداخلية */
  const mv = mk('movement', -.04); const plate = new THREE.Mesh(new THREE.CylinderGeometry(.74, .74, .03, 80), M.dark); mv.add(plate);
  const gearDefs = [[.34, 22, .0, .3, .02, 3, 'silver'], [.24, 16, -.42, -.28, .04, 4, 'brass'], [.2, 14, .38, -.36, .06, 3, 'silver'], [.15, 12, .1, -.52, .08, 0, 'brass'], [.26, 18, -.36, .34, .06, 0, 'brass']];
  const gears = gearDefs.map(([R, n, x, z, y, holes, m], i) => { const gg = new THREE.Mesh(gearGeo(R, n, .035, holes), m === 'brass' ? M.brass : M.silver); gg.position.set(x, y + .03, z); gg.userData.speed = (i % 2 ? -1 : 1) * (3.2 / n); mv.add(gg); return gg; });
  [[.36, .32], [-.1, .5], [.48, -.1]].forEach(([x, z]) => { const j = gem('ruby', 'round', .06); j.position.set(x, .06, z); mv.add(j); const ring = new THREE.Mesh(new THREE.TorusGeometry(.065, .014, 8, 18), M.brass); ring.rotation.x = Math.PI / 2; ring.position.set(x, .06, z); mv.add(ring); });

  /* الميناء */
  const dl = mk('dial', .14); let dtex = canvasTex(1024, 1024, dialDraw(dial, o.brand)); const dm = new THREE.Mesh(new THREE.CircleGeometry(.8, 96), new THREE.MeshStandardMaterial({ map: dtex, metalness: .55, roughness: .38, envMapIntensity: .9 })); dm.rotation.x = -Math.PI / 2; dl.add(dm);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dtex.dispose(); dtex = canvasTex(1024, 1024, dialDraw(dial, o.brand)); dm.material.map = dtex; dm.material.needsUpdate = true; });

  /* العقارب */
  const hands = mk('hands', .16); const hHour = new THREE.Group(), hMin = new THREE.Group(), hSec = new THREE.Group(); hands.add(hHour, hMin, hSec);
  const ex = (shape, dep) => new THREE.ExtrudeGeometry(shape, { depth: dep, bevelEnabled: false }), flat = (m) => { m.rotation.x = Math.PI / 2; return m; };
  const hm = new THREE.Mesh(ex(handShape(.46, .09, .06), .012), M.silver); flat(hm).position.y = .012; hHour.add(hm); const hm2 = new THREE.Mesh(ex(handShape(.3, .035), .004), new THREE.MeshBasicMaterial({ color: new THREE.Color(dial.lume).multiplyScalar(.9) })); flat(hm2).position.set(0, .0245, -.04); hHour.add(hm2);
  const mm = new THREE.Mesh(ex(handShape(.7, .07, .08), .012), M.silver); flat(mm).position.y = .026; hMin.add(mm); const mm2 = new THREE.Mesh(ex(handShape(.5, .028), .004), new THREE.MeshBasicMaterial({ color: new THREE.Color(dial.lume).multiplyScalar(.9) })); flat(mm2).position.set(0, .0385, -.05); hMin.add(mm2);
  const sm = new THREE.Mesh(ex(handShape(.76, .016, .2), .006), new THREE.MeshStandardMaterial({ color: 0xe5472f, metalness: .7, roughness: .3 })); flat(sm).position.y = .04; hSec.add(sm); const dot = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .014, 24), new THREE.MeshStandardMaterial({ color: 0xe5472f, metalness: .7, roughness: .3 })); dot.position.y = .045; hSec.add(dot);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .1, 24), M.silver); cap.position.y = .045; hands.add(cap);

  /* الزجاج والبيزل */
  const cry = mk('crystal', .16); const dome = new THREE.LatheGeometry([[0, .13], [.4, .125], [.64, .1], [.78, .05], [.8, 0], [.8, -.0]].map((p) => new THREE.Vector2(p[0], p[1])), 80);
  cry.add(new THREE.Mesh(dome, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .16, roughness: 0, metalness: 0, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2.4, depthWrite: false, side: THREE.DoubleSide, ior: 1.5 })));
  const bz = mk('bezel', .14); bz.add(new THREE.Mesh(new THREE.LatheGeometry([[.79, .0], [.97, .0], [1, .03], [.99, .08], [.94, .105], [.84, .1], [.79, .06], [.79, 0]].map((p) => new THREE.Vector2(p[0], p[1])), 120), metal));
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, t = new THREE.Mesh(new THREE.BoxGeometry(.012, .008, .05), M.dark); t.position.set(Math.sin(a) * .9, .108, -Math.cos(a) * .9); t.rotation.y = a; bz.add(t); }

  /* السوار */
  const st = mk('strap', 0); const W = .94, Rz = 1.62, Ry = 1.1, yc = -.78, N = 96, a0 = -Math.asin(1.1 / Rz), a1 = -Math.PI * 2 - a0;
  const P = (a) => new THREE.Vector3(0, yc + Math.cos(a) * Ry, Math.sin(a) * Rz);
  const th = o.strap === 'silver' ? .11 : .1, sides = [[-1, 0], [0, 1], [1, 0], [0, -1]], pos = [], nor = [], uv = [], idx = [];
  for (let sIdx = 0; sIdx < 4; sIdx++) {
    const base = pos.length / 3; for (let i = 0; i <= N; i++) {
      const u = i / N, a = lerp(a0, a1, u), p = P(a), p2 = P(a + (a1 - a0) / N * .5), T = p2.clone().sub(p).normalize(); const Nn = new THREE.Vector3(0, Math.cos(a), Math.sin(a)).normalize(), nrm = new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0), T).normalize();
      const corner = (kx, kn) => p.clone().add(new THREE.Vector3(kx * W / 2, 0, 0)).add(nrm.clone().multiplyScalar(kn * th / 2));
      const [c0, c1] = sIdx === 0 ? [corner(-1, -1), corner(-1, 1)] : sIdx === 1 ? [corner(-1, 1), corner(1, 1)] : sIdx === 2 ? [corner(1, 1), corner(1, -1)] : [corner(1, -1), corner(-1, -1)];
      pos.push(c0.x, c0.y, c0.z, c1.x, c1.y, c1.z); uv.push(u, 0, u, 1);
    }
    for (let i = 0; i < N; i++) { const k = base + i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); sg.setIndex(idx); sg.computeVertexNormals();
  let smat;
  if (o.strap === 'silver') {
    const bump = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#777'; c.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { c.fillStyle = '#fff'; c.fillRect(i * 64 + 6, 8, 46, 48); c.fillStyle = '#222'; c.fillRect(i * 64 + 2, 0, 4, h); } }, false); bump.wrapS = THREE.RepeatWrapping; bump.repeat.set(10, 1);
    smat = new THREE.MeshStandardMaterial({ color: 0xe6eaf0, metalness: 1, roughness: .24, envMapIntensity: 1.3, bumpMap: bump, bumpScale: 2.2 });
  } else {
    const col = new THREE.Color(STRAPS[o.strap] ?? STRAPS['leather-black']);
    const map = canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#' + col.getHexString(); c.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * .05})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); c.fillStyle = `rgba(0,0,0,${Math.random() * .07})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } c.strokeStyle = 'rgba(235,225,205,.55)'; c.lineWidth = 3; c.setLineDash([12, 9]); [h * .13, h * .87].forEach((y) => { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }); });
    smat = new THREE.MeshStandardMaterial({ map, color: 0xffffff, metalness: 0, roughness: .62, envMapIntensity: .55 });
  }
  st.add(new THREE.Mesh(sg, smat));
  if (o.strap !== 'silver') { const bu = new THREE.Mesh(new THREE.TorusGeometry(.2, .035, 10, 4), metal); bu.scale.set(2.2, 1, 1); bu.rotation.set(0, 0, 0); const bp = P(Math.PI * .98 - 0); bu.position.copy(P(-Math.PI * 1.0)).add(new THREE.Vector3(0, -.06, 0)); bu.rotation.y = Math.PI / 2; bu.rotation.x = 0; st.add(bu); }

  const api = {
    root, parts, gears, time: 10 * 3600 + 10 * 60 + 35, ticked: -1, onTick: null,
    setTime(t, animate = true) {   // t بالثواني (يمكن أن تكون كسرية). قفزة الثواني: تقدّم سريع مع ارتداد بسيط ثم ثبات
      const s = Math.floor(t), f = t - s, k = animate ? Math.min(1, f / .13) : 1, bo = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2), sec = (s % 60) + (animate ? bo : 1);
      hSec.rotation.y = -(sec / 60) * Math.PI * 2; hMin.rotation.y = -((t / 60) % 60 / 60) * Math.PI * 2; hHour.rotation.y = -((t / 3600) % 12 / 12) * Math.PI * 2;
      if (animate && s !== api.ticked) { api.ticked = s; api.onTick && api.onTick(s); }
    },
    spin(dt) { gears.forEach((x) => { x.rotation.y += x.userData.speed * dt * 2; }); },
    explode(k, spread = 1) {  // k 0..1: تفكيك على محور الساعة
      const off = { caseback: -1.45, case: -.78, strap: -.78, movement: -.18, dial: .55, hands: 1.1, crystal: 1.75, bezel: 2.2, crown: 0 };
      Object.keys(parts).forEach((n) => { parts[n].position.y = parts[n].userData.y0 + (off[n] || 0) * k * spread; });
      parts.crown.position.x = k * .55 * spread; parts.strap.position.z = 0;
    }
  };
  g.position.y = -0.05; root.userData.api = api; root.userData.explode = api.explode; return api;
}
