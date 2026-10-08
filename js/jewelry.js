/*
  مجوهرات مولَّدة بالكود بالكامل (بلا ملفات نماذج): أحجار كريمة، خواتم، بلاكات، سلاسل، طوق، مسابح.
  المستخدمة في الهيرو الحيّ، وفي أداة التصوير التي تنتج صور الكتالوج (صور تو دي عادية بإضاءة استوديو).
*/
import { THREE, rrShape, ellipseShape, canvasTex, shapeFace, clamp } from './lib3d.js';

/* ------------------------------------------------------------------ الخامات */
export const GEMS = {
  amethyst: { c: 0x7b3fc4 }, emerald: { c: 0x10985f, e: .26 }, ruby: { c: 0xd01238, e: .28 }, sapphire: { c: 0x2c62e0 }, topaz: { c: 0x5ab8ec },
  citrine: { c: 0xf2a42a }, pink: { c: 0xe0589a }, clear: { c: 0xe9f1ff, e: .05 },
  onyx: { c: 0x0c0c10, op: 1 }, turquoise: { c: 0x2db6a8, op: 1 }, agate: { c: 0x8c2a1c, op: 1 }, coral: { c: 0xdd4a3a, op: 1 },
  amber: { c: 0xd8851a, tr: 1 }, tigereye: { c: 0x8a5a1c, op: 1 }, pearl: { c: 0xf5efe6, op: 1 }, lapis: { c: 0x1c3fa0, op: 1 }
};
const cache = {};
export function mats() {
  if (cache.silver) return cache;
  cache.silver = new THREE.MeshStandardMaterial({ color: 0xe9edf3, metalness: 1, roughness: .17, envMapIntensity: 1.35 });
  cache.satin = new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 1, roughness: .36, envMapIntensity: 1.2 });
  cache.dark = new THREE.MeshStandardMaterial({ color: 0x59606b, metalness: 1, roughness: .42, envMapIntensity: 1 });
  cache.brass = new THREE.MeshStandardMaterial({ color: 0xc9a36a, metalness: 1, roughness: .28, envMapIntensity: 1.3 });
  cache.black = new THREE.MeshStandardMaterial({ color: 0x0d0e12, metalness: .2, roughness: .35, envMapIntensity: 1 });
  return cache;
}
const gemCache = {};
export function gemMat(name) {
  if (gemCache[name]) return gemCache[name]; const d = GEMS[name] || GEMS.amethyst; const col = new THREE.Color(d.c);
  let m;
  if (d.op) m = new THREE.MeshPhysicalMaterial({ color: col, metalness: 0, roughness: name === 'pearl' ? .22 : .1, clearcoat: 1, clearcoatRoughness: .06, envMapIntensity: 1.7, sheen: name === 'pearl' ? 1 : 0, sheenColor: new THREE.Color(0xffd6e6) });
  else m = new THREE.MeshPhysicalMaterial({ color: col, metalness: 0, roughness: .04, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 3.4, flatShading: true, emissive: col.clone().multiplyScalar(d.e ?? .42), iridescence: .35, iridescenceIOR: 1.7, specularIntensity: 1 });
  gemCache[name] = m; return m;
}

/* ------------------------------------------------------------------ أحجار */
function facet(g) { const n = g.toNonIndexed(); n.computeVertexNormals(); return n; }
export function gemGeo(cut = 'round', r = 1) {
  if (cut === 'cabochon') { const g = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(r, r * .62, r); const base = new THREE.CylinderGeometry(r, r * .96, r * .12, 40, 1, true); base.translate(0, -r * .06, 0); return g; }
  const P = cut === 'emerald'
    ? [[0, -.5], [.55, -.28], [.92, -.03], [1, 0], [1, .05], [.9, .2], [.62, .3], [0, .3]]
    : [[0, -.58], [.5, -.3], [.96, -.02], [1, 0], [1, .05], [.76, .21], [.55, .31], [0, .31]];
  const g = new THREE.LatheGeometry(P.map((p) => new THREE.Vector2(p[0] * r, p[1] * r)), cut === 'emerald' ? 8 : 16);
  if (cut === 'oval') g.scale(1.28, 1, .86); if (cut === 'emerald') g.scale(1.25, 1, .85);
  return facet(g);
}
export const gem = (name, cut = 'round', r = 1) => { const m = new THREE.Mesh(gemGeo(cut, r), gemMat(name)); m.userData.gem = true; return m; };

/* ------------------------------------------------------------------ مساعدات */
function bandGeo(rIn, rOut, w) {
  const rad = Math.min((rOut - rIn) / 2.2, w / 3), pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); pts.push(new THREE.Vector2(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)); } };
  corner(rOut - rad, w / 2 - rad, 0); corner(rIn + rad, w / 2 - rad, Math.PI / 2); corner(rIn + rad, -w / 2 + rad, Math.PI); corner(rOut - rad, -w / 2 + rad, Math.PI * 1.5); pts.push(pts[0].clone());
  const g = new THREE.LatheGeometry(pts.reverse(), 96); g.rotateX(Math.PI / 2); return g;
}
const upQ = new THREE.Quaternion(), tmpV = new THREE.Vector3();
function onSurface(mesh, pos, normal) { mesh.position.copy(pos); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal.clone().normalize()); return mesh; }
function claws(g, r, n, h, mat, y0 = 0) { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.PI / n; const c = new THREE.Mesh(new THREE.CylinderGeometry(.028, .04, h, 8), mat); c.position.set(Math.cos(a) * r * .9, y0 + h / 2 - .02, Math.sin(a) * r * .9); c.rotation.set(Math.sin(a) * .22, 0, -Math.cos(a) * .22); g.add(c); const t = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 8), mat); t.position.set(Math.cos(a) * r * .8, y0 + h - .02, Math.sin(a) * r * .8); g.add(t); } }

/* ------------------------------------------------------------------ خاتم  (المحور Z، والحجر نحو +Y) */
export function buildRing(o = {}) {
  const M = mats(), g = new THREE.Group(), R = .92, T = o.thick ?? .13, W = o.width ?? .34, style = o.style || 'solitaire', G = o.gem || 'amethyst';
  const band = new THREE.Mesh(bandGeo(R, R + T, style === 'band' ? W * 1.55 : W), M.silver); g.add(band);
  const top = R + T;
  if (style === 'solitaire') {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(.4, .15, .2, 24), M.silver); cone.position.y = top + .06; g.add(cone);
    const s = gem(G, o.cut || 'round', .44); s.position.y = top + .32; g.add(s); const h = new THREE.Group(); h.position.y = top + .2; claws(h, .44, 4, .24, M.silver); g.add(h);
  } else if (style === 'halo') {
    const s = gem(G, o.cut || 'round', .33); s.position.y = top + .25; g.add(s);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(.52, .3, .16, 40), M.silver); plate.position.y = top + .04; g.add(plate);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, st = gem('clear', 'round', .075); st.position.set(Math.cos(a) * .43, top + .15, Math.sin(a) * .43); g.add(st); }
    for (let k = -1; k <= 1; k += 2) for (let i = 1; i <= 5; i++) { const a = k * (.42 + i * .2), st = gem('clear', 'round', .06); st.position.set(Math.sin(a) * (top - .004), Math.cos(a) * (top - .004), 0); st.rotation.z = -a; g.add(st); }
  } else if (style === 'signet') {
    const sh = ellipseShape(.44, .6), pl = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .1, bevelEnabled: true, bevelThickness: .045, bevelSize: .045, bevelSegments: 4, curveSegments: 48 }), M.silver);
    pl.rotation.x = -Math.PI / 2; pl.position.y = top + .02; g.add(pl);
    const tex = canvasTex(512, 512, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = `700 ${o.glyph === 'M' ? 280 : 250}px "Reem Kufi", "Amiri", serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.glyph || 'م', w / 2, h / 2 + 16); c.lineWidth = 12; c.strokeStyle = '#fff'; c.beginPath(); c.ellipse(w / 2, h / 2, 176, 226, 0, 0, Math.PI * 2); c.stroke(); }, false);
    const fm = new THREE.MeshStandardMaterial({ color: 0x232830, metalness: 1, roughness: .5, alphaMap: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    { const br = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#808080'; c.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const y = Math.random() * h; c.strokeStyle = `rgba(${Math.random() < .5 ? 255 : 0},${Math.random() < .5 ? 255 : 0},255,${Math.random() * .22})`; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + (Math.random() - .5) * 4); c.stroke(); } }, false); br.wrapS = br.wrapT = THREE.RepeatWrapping; pl.material = new THREE.MeshStandardMaterial({ color: 0xdfe3ea, metalness: 1, roughness: .34, envMapIntensity: 1.2, bumpMap: br, bumpScale: .5 }); }
    const face = shapeFace(ellipseShape(.44, .6), fm, 0); face.rotation.x = -Math.PI / 2; face.position.y = top + .02 + .1 + .045 + .002; g.add(face);
    for (let k = -1; k <= 1; k += 2) { const w = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, .2), M.silver); w.position.set(0, top - .02, k * .46); g.add(w); }
  } else if (style === 'cabochon') {
    const sc = (m) => { m.scale.x = 1.15; m.scale.z = .8; return m; };
    const cup = sc(new THREE.Mesh(new THREE.CylinderGeometry(.5, .32, .22, 40), M.silver)); cup.position.y = top + .06; g.add(cup);
    const bez = sc(new THREE.Mesh(new THREE.TorusGeometry(.46, .06, 14, 48), M.silver)); bez.rotation.x = Math.PI / 2; bez.position.y = top + .17; g.add(bez);
    const s = sc(gem(G, 'cabochon', .5)); s.position.y = top + .15; g.add(s);
  } else if (style === 'trilogy') {
    [[-.62, .27], [0, .4], [.62, .27]].forEach(([z, r]) => { const cc = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * .42, .18 + r * .3, 28), M.silver); cc.position.set(0, top + .04 + r * .1, z); const s = gem(G, 'round', r); s.position.set(0, top + .16 + r * .12, z); g.add(cc, s); });
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1.5, 16), M.silver); bridge.rotation.x = Math.PI / 2; bridge.position.y = top + .02; g.add(bridge);
  } else if (style === 'band') {
    const tex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#777'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 5; for (let i = 0; i < 8; i++) { const x = i * 32 + 16; c.beginPath(); c.moveTo(x - 10, 8); c.lineTo(x, 32); c.lineTo(x - 10, 56); c.moveTo(x + 6, 8); c.lineTo(x + 16, 32); c.lineTo(x + 6, 56); c.stroke(); } }, false);
    tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(4, 1); band.geometry.dispose(); band.geometry = bandGeo(R, R + T, W * 1.45);
    band.material = new THREE.MeshStandardMaterial({ color: 0xe9edf3, metalness: 1, roughness: .2, envMapIntensity: 1.4, bumpMap: tex, bumpScale: 1.2 });
    const s = gem(G, 'round', .2); s.position.y = top + .03; s.scale.y = .7; g.add(s); const ring = new THREE.Mesh(new THREE.TorusGeometry(.23, .045, 12, 36), M.silver); ring.rotation.x = Math.PI / 2; ring.position.y = top + .03; g.add(ring);
  }
  g.userData.top = top; return g;
}

/* ------------------------------------------------------------------ سلاسل */
function frame(T, i, twist = 0) { const ref = Math.abs(T.z) > .9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1); const N = ref.sub(T.clone().multiplyScalar(ref.dot(T))).normalize(); N.applyAxisAngle(T, (i % 2) * Math.PI / 2 + twist); const Y = new THREE.Vector3().crossVectors(N, T).normalize(); return [T.clone(), Y, N]; }
export function chainAlong(pts, o = {}) {
  const M = mats(), g = new THREE.Group(), curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), L = curve.getLength(), type = o.type || 'curb', mat = o.mat || M.silver;
  const ll = o.link ?? .17, tube = o.tube ?? .036;
  if (type === 'ball') {
    const r = o.r ?? .05, step = r * 2.15, n = Math.floor(L / step), im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 16, 12), mat, n), m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { const p = curve.getPointAt(Math.min(1, (i + .5) / n)); m4.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, m4); } g.add(im); const th = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, r * .22, 6, false), M.dark); g.add(th); return g;
  }
  const pattern = type === 'figaro' ? [.62, .62, .62, 1.7] : [1];
  const lens = []; let d = 0, i = 0; while (true) { const k = pattern[i % pattern.length], len = ll * k, step = len * .74; if (d + len > L) break; lens.push({ s: d + len / 2, k }); d += step; i++; }
  const kinds = {}; lens.forEach((l, idx) => { (kinds[l.k] = kinds[l.k] || []).push({ ...l, idx }); });
  Object.entries(kinds).forEach(([k, arr]) => {
    const kk = +k, geo = new THREE.TorusGeometry(ll * .5 * kk, tube, 10, 22); geo.scale(1.0, .62, 1); geo.rotateY(0);
    const im = new THREE.InstancedMesh(geo, mat, arr.length), m4 = new THREE.Matrix4();
    arr.forEach((l, j) => { const u = clamp(l.s / L, 0, 1), p = curve.getPointAt(u), T = curve.getTangentAt(u), [X, Y, Z] = frame(T, l.idx, type === 'curb' ? .35 : 0); m4.makeBasis(X, Y, Z); m4.setPosition(p); im.setMatrixAt(j, m4); }); g.add(im);
  });
  return g;
}
export function necklaceCurve(w = 2.2, h = 1.6, ends = .4) { const pts = []; for (let i = 0; i <= 28; i++) { const a = Math.PI + ends + (i / 28) * (Math.PI - 2 * ends); pts.push(new THREE.Vector3(Math.cos(a) * w / 2, Math.sin(a) * h + h * .1, 0)); } return pts; }

/* طوق صلب مجدول */
export function buildTorc(o = {}) {
  const M = mats(), g = new THREE.Group(), A0 = Math.PI * 1.1, A1 = Math.PI * 1.9, rx = 1.05, ry = .92;
  const pt = (t, off = 0, r = 0, k = 7) => { const a = A0 + (A1 - A0) * t, cx = Math.cos(a) * rx, cy = Math.sin(a) * ry, nx = Math.cos(a), ny = Math.sin(a), ph = t * Math.PI * 2 * k + off; return new THREE.Vector3(cx + nx * Math.cos(ph) * r, cy + ny * Math.cos(ph) * r, Math.sin(ph) * r); };
  const strands = o.strands ?? 2;
  for (let s = 0; s < strands; s++) { const pts = []; for (let i = 0; i <= 260; i++) pts.push(pt(i / 260, (s / strands) * Math.PI * 2, .05)); const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, .052, 10, false), M.silver); g.add(m); }
  [0, 1].forEach((t) => { const b = new THREE.Mesh(new THREE.SphereGeometry(.14, 24, 16), M.silver); b.position.copy(pt(t)); g.add(b); const col = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .14, 20), M.silver); col.position.copy(pt(t)); col.lookAt(pt(t === 0 ? .01 : .99)); col.rotateX(Math.PI / 2); g.add(col); });
  if (o.gem) { const m = new THREE.Mesh(new THREE.SphereGeometry(.0, 4, 4), M.silver); const s = gem(o.gem, 'oval', .17); const p = pt(.5); s.position.set(p.x, p.y - .02, .06); s.rotation.x = Math.PI / 2; g.add(s); const ring = new THREE.Mesh(new THREE.TorusGeometry(.2, .035, 10, 30), M.silver); ring.scale.set(1.28, .86, 1); ring.position.set(p.x, p.y - .02, .06); g.add(ring); }
  return g;
}

/* ------------------------------------------------------------------ بلاكة / قلادة */
export function buildPendant(o = {}) {
  const M = mats(), g = new THREE.Group(), kind = o.shape || 'oval', text = o.text || 'محمد';
  let shape, fh = .8;
  if (kind === 'oval') shape = ellipseShape(.62, .8);
  else if (kind === 'round') { shape = ellipseShape(.72, .72); fh = .72; }
  else if (kind === 'bar') { shape = rrShape(1.5, .42, .12); fh = .21; }
  else if (kind === 'tag') { shape = rrShape(.92, 1.3, .2); fh = .65; }
  else { shape = new THREE.Shape(); shape.moveTo(-.58, .78); shape.lineTo(.58, .78); shape.lineTo(.58, .08); shape.bezierCurveTo(.58, -.4, .2, -.7, 0, -.88); shape.bezierCurveTo(-.2, -.7, -.58, -.4, -.58, .08); shape.lineTo(-.58, .78); }
  const dep = .09, bev = .035, geo = new THREE.ExtrudeGeometry(shape, { depth: dep, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 48 });
  geo.translate(0, 0, -dep / 2);
  const br = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#808080'; c.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { const y = Math.random() * h; c.strokeStyle = `rgba(${Math.random() < .5 ? 255 : 0},${Math.random() < .5 ? 255 : 0},255,${Math.random() * .2})`; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + (Math.random() - .5) * 3); c.stroke(); } }, false); br.wrapS = br.wrapT = THREE.RepeatWrapping;
  const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xd9dde4, metalness: 1, roughness: .3, envMapIntensity: 1.05, bumpMap: br, bumpScale: .45 })); g.add(body);
  const frame2 = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .005, bevelEnabled: false, curveSegments: 48 }), M.satin);
  const zf = dep / 2 + bev + .001;
  const tex = canvasTex(1024, 1024, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const long = text.length > 6; c.font = `700 ${long ? 150 : 330}px "Reem Kufi", "Amiri", "Cormorant Garamond", serif`;
    if (kind === 'bar') c.font = `700 ${long ? 210 : 300}px "Reem Kufi", "Amiri", "Cormorant Garamond", serif`;
    c.fillText(text, w / 2, h / 2 + 18, w * .78);
    c.lineWidth = 14; c.strokeStyle = '#fff'; c.beginPath(); const m = 74; c.roundRect(m, kind === 'bar' ? 300 : m, w - m * 2, kind === 'bar' ? h - 600 : h - m * 2, kind === 'round' || kind === 'oval' ? 400 : 60); c.stroke();
  }, false);
  const fm = new THREE.MeshStandardMaterial({ color: 0x1e232b, metalness: 1, roughness: .55, alphaMap: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  if (!o.gem) { const face = shapeFace(shape, fm, zf); g.add(face); }
  if (o.gem) { const s = gem(o.gem, kind === 'bar' ? 'emerald' : 'round', kind === 'bar' ? .26 : .36); s.position.set(0, 0, zf + .02); s.rotation.x = Math.PI / 2; g.add(s); const rr = new THREE.Mesh(new THREE.TorusGeometry(kind === 'bar' ? .27 : .38, .045, 10, 36), M.silver); rr.position.set(0, 0, zf + .005); if (kind === 'bar') rr.scale.set(1.3, .8, 1); g.add(rr);
    if (o.halo) for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, st = gem('clear', 'round', .06); st.position.set(Math.cos(a) * .55, Math.sin(a) * .55, zf + .02); st.rotation.x = Math.PI / 2; g.add(st); } }
  const top = kind === 'bar' ? .21 + bev : (kind === 'tag' ? .65 + bev : (kind === 'round' ? .72 + bev : (kind === 'shield' ? .78 + bev : .8 + bev)));
  const bail = new THREE.Mesh(new THREE.TorusGeometry(.1, .03, 10, 24), M.silver); bail.position.set(0, top + .08, 0); g.add(bail); g.userData.topY = top + .18;
  return g;
}

/* ------------------------------------------------------------------ مسبحة  (33 حبة + إمامة + شرّابة) */
export function misbahaPath(n = 33, a = 1.12, b = 1.6) {  // مسار بيضاوي، والإمامة عند أسفل المسار
  const pts = []; for (let i = 0; i < 96; i++) { const f = -Math.PI / 2 + (i / 96) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(f) * a * (1 - .1 * Math.sin(f)), Math.sin(f) * b + b * .12, Math.sin(f * 2) * .015)); }
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal');
}
export function buildMisbaha(o = {}) {
  const M = mats(), g = new THREE.Group(), N = o.beads ?? 33, mat = o.bead || 'amber', curve = misbahaPath(N), L = curve.getLength();
  const isGem = GEMS[mat], bm = isGem ? gemMat(mat) : (mat === 'silver' ? M.silver : M.dark);
  const beadMat = mat === 'amber' ? new THREE.MeshPhysicalMaterial({ color: 0xd8851a, roughness: .12, clearcoat: 1, clearcoatRoughness: .05, transmission: 0, envMapIntensity: 2, emissive: 0x6a2a00, emissiveIntensity: .35 }) : (mat === 'tigereye' ? new THREE.MeshPhysicalMaterial({ color: 0x9a6420, roughness: .14, clearcoat: 1, envMapIntensity: 1.8, emissive: 0x3a1a00, emissiveIntensity: .4 }) : bm.clone());
  if (beadMat.flatShading) beadMat.flatShading = false;
  const r = (L / (N + 3)) * .46, im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 28, 20), beadMat, N), m4 = new THREE.Matrix4(), sMat = [];
  // الإمامة والفواصل تحتل موضع الصفر (أسفل المسبحة): نوزّع الحبّات على بقية القوس
  const gap = .035; let k = 0;
  for (let i = 0; i < N; i++) { const u = gap + (i / (N - 1)) * (1 - 2 * gap); const p = curve.getPointAt(u); m4.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(k++, m4); }
  g.add(im);
  const th = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, r * .06, 6, true), M.dark); g.add(th);
  [1 / 3, 2 / 3].forEach((u) => { const p = curve.getPointAt(u), T = curve.getTangentAt(u), d = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, r * .55, 24), M.silver); d.position.copy(p); d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), T); g.add(d); });
  // إمامة طويلة + حبّتان + شرّابة
  const p0 = curve.getPointAt(0), im2 = new THREE.Mesh(new THREE.CapsuleGeometry(r * .78, r * 2.8, 8, 20), beadMat); im2.position.copy(p0).add(new THREE.Vector3(0, -r * 1.6, 0)); g.add(im2);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * .5, r * .9, r * .5, 20), M.silver); cap.position.copy(p0).add(new THREE.Vector3(0, -r * 3.6, 0)); g.add(cap);
  const tcount = 36, tg = new THREE.CylinderGeometry(r * .035, r * .05, 1, 5), tm = new THREE.InstancedMesh(tg, o.tassel === 'silver' ? M.silver : new THREE.MeshStandardMaterial({ color: o.tassel || 0x1b1d24, roughness: .55, metalness: o.tassel === 'silver' ? 1 : .1 }), tcount), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), base = p0.clone().add(new THREE.Vector3(0, -r * 3.85, 0));
  for (let i = 0; i < tcount; i++) { const a = (i / tcount) * Math.PI * 2, spread = .12 + (i % 3) * .05, len = r * (5.2 + (i % 4) * .5), dir = new THREE.Vector3(Math.cos(a) * spread, -1, Math.sin(a) * spread).normalize(); q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); s3.set(1, len, 1); m4.compose(base.clone().add(dir.clone().multiplyScalar(len / 2)), q, s3); tm.setMatrixAt(i, m4); }
  g.add(tm); const knot = new THREE.Mesh(new THREE.SphereGeometry(r * .55, 16, 12), M.silver); knot.position.copy(base).add(new THREE.Vector3(0, -r * .1, 0)); g.add(knot);
  g.userData.r = r; return g;
}
