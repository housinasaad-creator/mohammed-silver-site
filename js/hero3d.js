/*
  هيرو قصة على السكرول (WebGL): كل مرحلة من السكرول تحوّل المشهد، والتقدّم دالة حتمية في p (0..1) فتعمل للأمام والخلف.
  0 ساعة فضية تدقّ بتوقيت الزائر  ->  1 تفكيك الساعة إلى طبقاتها مع بطاقات شرح  ->  2 خاتم بحجر ياقوت يدور وسط أحجار طافية
  ->  3 مسبحة تنساب على الشاشة وبلاكة باسم تتأرجح  ->  4 الخاتم والساعة معاً وأحجار تلمع قبل الكتالوج.
  السكرول عادي (لا اختطاف) والمشهد يُفكَّك بالكامل من الذاكرة حين يبتعد عن الشاشة.
*/
import { THREE, baseStage, clamp, lerp, seg, ss, canvasTex } from './lib3d.js';
import { buildWatch } from './watch.js';
import { buildRing, buildPendant, chainAlong, mats, gemMat, gemInnerMat, gemGeo, GEMS } from './jewelry.js';

export const CHAPTERS = [0, .2, .42, .64, .86];
const pulse = (p, a0, a1, b0, b1) => ss(seg(p, a0, a1)) * (1 - ss(seg(p, b0, b1)));

export function createHero(canvas, opts = {}) {
  const col = new THREE.Color();
  const S = baseStage(canvas, { fov: 28, exposure: 1.06, dprCap: 1.35, forceRun: false });
  if (!S) return null;
  const { scene, camera, coarse } = S, M = mats();
  const api = { p: 0, target: 0, px: 0, py: 0, tx: 0, ty: 0, onTick: null, onChapter: null, anchors: [], chapter: 0 };

  scene.add(new THREE.HemisphereLight(0xf2f0ec, 0x1a1816, .5));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff4e6, .8); rim.position.set(5, 2, -6); scene.add(rim);
  const glow = new THREE.PointLight(0xffffff, 7, 16, 1.6); glow.position.set(0, 2, 5); scene.add(glow);

  /* الساعة */
  const watch = buildWatch({ dial: 'black', strap: 'silver', brand: 'MOHAMMED' }), watchG = new THREE.Group(); watchG.add(watch.root); scene.add(watchG);
  watch.onTick = (s) => { if (api.watchVisible) api.onTick && api.onTick(s); };

  /* الخاتم: هالة بياقوت */
  const ringG = new THREE.Group(), ring = buildRing({ style: 'halo', gem: 'ruby' }); ring.rotation.y = Math.PI / 2; ringG.add(ring); scene.add(ringG);
  const glints = [];
  const starTex = canvasTex(128, 128, (c, w, h) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.65)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    [[0, 1], [1, 0]].forEach(([dx, dy]) => { const l = c.createLinearGradient(64 - dx * 60, 64 - dy * 60, 64 + dx * 60, 64 + dy * 60); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(.5, 'rgba(255,255,255,.95)'); l.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = l; c.fillRect(dx ? 4 : 62, dx ? 62 : 4, dx ? 120 : 4, dx ? 4 : 120); });
  });
  for (let i = 0; i < 5; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); sp.userData = { ph: Math.random() * 6, sp: .6 + Math.random() * .8, r: .2 + Math.random() * .5, a: Math.random() * 6 }; ringG.add(sp); glints.push(sp); }

  /* أحجار طافية: قليلة وكبيرة وبطيئة، وخلف القطع دائماً (عمق سالب) فلا تظهر فوق الساعة أو الخاتم. كل حجر مجسّمان (قشرة شفافة + داخل عاكس) */
  const gemKinds = ['sapphire', 'amethyst', 'emerald', 'ruby', 'topaz', 'pink', 'citrine', 'clear'].slice(0, coarse ? 5 : 8), floaters = [], perKind = 1;
  gemKinds.forEach((k) => {
    const geo = gemGeo('round', 1), outer = new THREE.InstancedMesh(geo, gemMat(k), perKind), inner = new THREE.InstancedMesh(geo, gemInnerMat(k), perKind);
    [outer, inner].forEach((m) => { m.frustumCulled = false; scene.add(m); });
    const arr = []; for (let i = 0; i < perKind; i++) arr.push({ r: 4 + Math.random() * 3.4, a: Math.random() * Math.PI * 2, sp: (Math.random() * .6 + .4) * (Math.random() < .5 ? -1 : 1), y: (Math.random() - .5) * 4.8, z: -8 + Math.random() * 4.4, s: .55 + Math.random() * .45, ph: Math.random() * 6, rot: Math.random() * 3 });
    floaters.push({ outer, inner, arr });
  });

  /* حبّات المسبحة (كهرمان): قشرة نصف شفافة + قلب متوهج، مع تفاوت بسيط في اللون بين الحبّات */
  const NB = coarse ? 34 : 52;
  const bOuter = new THREE.MeshPhysicalMaterial({ color: 0xffb347, transparent: true, opacity: .3, depthWrite: false, roughness: .03, clearcoat: 1, clearcoatRoughness: .03, envMapIntensity: 3.2, ior: 1.55 });
  const bInner = new THREE.MeshStandardMaterial({ color: 0xb85a00, emissive: 0xa33f00, emissiveIntensity: .85, roughness: .22, envMapIntensity: 1.6 });
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(.2, 28, 20), bOuter, NB), beadsIn = new THREE.InstancedMesh(new THREE.SphereGeometry(.172, 20, 14), bInner, NB);
  for (let i = 0; i < NB; i++) { col.setScalar(.88 + Math.random() * .14); beads.setColorAt(i, col); col.setRGB(1, .78 + Math.random() * .22, .55 + Math.random() * .3); beadsIn.setColorAt(i, col); }
  [beads, beadsIn].forEach((m) => { m.frustumCulled = false; scene.add(m); });
  const spacers = new THREE.InstancedMesh(new THREE.CylinderGeometry(.21, .21, .1, 20), M.silver, 5); spacers.frustumCulled = false; scene.add(spacers);

  /* بلاكة معلّقة بسلسلة */
  const pendG = new THREE.Group(), pend = buildPendant({ shape: 'oval', text: 'محمد' }); pend.position.y = -.2; pendG.add(pend);
  const topY = pend.userData.topY - .2, chA = chainAlong([new THREE.Vector3(0, topY - .02, 0), new THREE.Vector3(-.3, topY + 1.4, 0), new THREE.Vector3(-.7, topY + 3.6, -.02)], { link: .17, tube: .03 }), chB = chainAlong([new THREE.Vector3(0, topY - .02, 0), new THREE.Vector3(.3, topY + 1.4, 0), new THREE.Vector3(.7, topY + 3.6, -.02)], { link: .17, tube: .03 });
  pendG.add(chA, chB); scene.add(pendG);

  /* ترتيب الكاميرا حسب شكل الشاشة (جوال طولي: نبتعد قليلاً كي لا تُقصّ القطع) */
  let aspect = 1.6;
  S.onResize = (w, h) => {
    aspect = w / h; camera.position.z = aspect < 1 ? 9.6 * Math.pow(1.05 / aspect, .55) : 9.4;
    /* النص على اليسار في الشاشات العريضة، وفي الأسفل في الجوال: نزيح المشهد كي لا يغطيه النص */
    if (aspect > 1.15) camera.setViewOffset(w, h, -w * .12, 0, w, h); else if (aspect < .9) camera.setViewOffset(w, h, 0, h * .15, w, h); else camera.clearViewOffset();
  };
  S.resize();

  const tmp = new THREE.Vector3(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), eul = new THREE.Euler();
  const t0 = performance.now(); let lastChap = -1;
  const place = (g, x, y, z, s, vis) => { g.position.set(x, y, z); g.scale.setScalar(Math.max(.0001, s)); g.visible = s > .002 && vis !== false; };

  S.onFrame = (dt, now) => {
    const t = (now - t0) / 1000;
    api.p += (api.target - api.p) * (1 - Math.exp(-dt * 7)); api.px += (api.tx - api.px) * (1 - Math.exp(-dt * 4)); api.py += (api.ty - api.py) * (1 - Math.exp(-dt * 4));
    const p = api.p, mob = aspect < 1, sx = mob ? .8 : 1;
    const chap = p < CHAPTERS[1] ? 0 : p < CHAPTERS[2] ? 1 : p < CHAPTERS[3] ? 2 : p < CHAPTERS[4] ? 3 : 4; api.chapter = chap; if (chap !== lastChap) { lastChap = chap; api.onChapter && api.onChapter(chap); }

    /* الكاميرا: حركة بطيئة مع التقدّم + مؤشر الماوس */
    camera.position.x = Math.sin(p * Math.PI * 2) * .5 + api.px * .7; camera.position.y = Math.sin(p * Math.PI) * .3 + api.py * .45; camera.lookAt(0, 0, 0);
    glow.position.set(Math.sin(t * .7) * 4.5, 2.3 + Math.cos(t * .5), 4.5);

    /* الساعة: كاملة في الفصل 0، تتفكّك في الفصل 1، تتلاشى للخاتم، وتعود في الختام */
    const expl = ss(seg(p, .2, .33)) * (1 - ss(seg(p, .365, .43))), wOut = ss(seg(p, .42, .5)), wBack = ss(seg(p, .88, .96));
    const wScale = (p < .6 ? 1 - wOut : wBack * .72) * (1.6 - expl * .22) * sx;
    const fin = ss(seg(p, .88, .96));
    place(watchG, lerp(mob ? 0 : .15, mob ? -.6 : .35, fin) + expl * (mob ? 0 : .35), lerp(0, mob ? .7 : .55, fin) - wOut * .6 * (p < .6 ? 1 : 0), -wOut * 2.5 * (p < .6 ? 1 : 0), wScale, true);
    watchG.rotation.set(lerp(.08, .32, expl) + Math.sin(t * .5) * .03, lerp(0, -.95, expl) + Math.sin(t * .4) * .07 - fin * .35, 0);
    api.watchVisible = watchG.visible && p < .45;
    watch.explode(expl, .68); watch.spin(dt * (1 + expl * 3));
    const d = new Date(); watch.setTime(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000, true);

    /* إحداثيات الشاشة لأجزاء الساعة (لبطاقات الشرح) */
    const an = []; if (expl > .5 && watchG.visible) {
      [['crystal', .5, 0, -.35], ['dial', -.72, 0, .15], ['movement', .7, 0, .1], ['case', -.95, 0, 0]].forEach(([k, lx, ly, lz]) => { const pt = watch.parts[k]; tmp.set(lx, ly, lz); pt.localToWorld(tmp); tmp.project(camera); an.push({ k, x: (tmp.x * .5 + .5), y: (-tmp.y * .5 + .5) }); });
    } api.anchors = an; api.explode = expl; api.onAnchors && api.onAnchors(an, expl);

    /* الخاتم: يظهر في الفصل 2، ويعود صغيراً في الختام */
    const rIn = ss(seg(p, .44, .54)), rOut = ss(seg(p, .62, .7)), rFin = ss(seg(p, .9, .97));
    const ringS = p < .8 ? rIn * (1 - rOut) * 1.45 * sx : rFin * .9 * sx;
    place(ringG, p < .8 ? 0 : lerp(0, mob ? 1.1 : 1.15, rFin), p < .8 ? lerp(-3.4, -.12, rIn) + rOut * 3.4 + (mob ? .35 : 0) : lerp(-3, mob ? -.7 : -1.45, rFin) + (mob ? .5 : 0), p < .8 ? 0 : 1.6, ringS, true);
    ringG.rotation.set(.62, t * .5 + p * 10, 0);
    glints.forEach((g) => { const u = g.userData, o = (Math.sin(t * u.sp + u.ph) * .5 + .5); g.material.opacity = (ringS > .1 ? 1 : 0) * Math.pow(o, 3); const a = u.a + t * .2; g.position.set(Math.cos(a) * u.r * 1.1, 1.0 + Math.sin(a * 1.3) * .35, Math.sin(a) * u.r * 1.1 + .3); g.scale.setScalar(.35 + o * .5); });

    /* الأحجار الطافية: بطيئة وخلف القطع */
    const fv = .6 + .4 * Math.sin(p * Math.PI);
    floaters.forEach(({ outer, inner, arr }, ki) => { arr.forEach((g, i) => { const a = g.a + t * g.sp * .06 + p * 1.1 * (ki % 2 ? 1 : -1); tmp.set(Math.cos(a) * g.r * (mob ? .5 : 1), g.y + Math.sin(t * .22 + g.ph) * .18 - p * .5, g.z); eul.set(g.rot + t * .1, t * .08 + g.rot, 0); q.setFromEuler(eul); const sc = g.s * fv * (mob ? .75 : 1); s3.set(sc, sc, sc); m4.compose(tmp, q, s3); outer.setMatrixAt(i, m4); s3.setScalar(sc * .985); m4.compose(tmp, q, s3); inner.setMatrixAt(i, m4); }); outer.instanceMatrix.needsUpdate = true; inner.instanceMatrix.needsUpdate = true; });

    /* مسبحة تنساب في الفصل 3 */
    const bv = ss(seg(p, .62, .72)) * (1 - ss(seg(p, .84, .9))), flow = p * 2.2 + t * .05;
    beads.visible = bv > .01; beadsIn.visible = beads.visible; spacers.visible = beads.visible;
    if (beads.visible) {
      for (let i = 0; i < NB; i++) {
        const u = (((i / NB + flow) % 1) + 1) % 1, a = u * Math.PI * 2, x = lerp(-9.5, 9.5, u) * (mob ? .5 : 1), y = Math.sin(a + .6) * 1.9 + 1.4 + (mob ? .9 : 0), z = Math.cos(a) * 2.2 - .5, edge = ss(seg(u, 0, .06)) * (1 - ss(seg(u, .94, 1))), s = (.8 + Math.sin(a * 2) * .18) * edge * bv * 1.05;
        tmp.set(x, y, z); q.identity(); s3.set(s, s, s); m4.compose(tmp, q, s3); beads.setMatrixAt(i, m4); beadsIn.setMatrixAt(i, m4);
      }
      beads.instanceMatrix.needsUpdate = true; beadsIn.instanceMatrix.needsUpdate = true;
      for (let k = 0; k < 5; k++) { const u = (((k / 5 + flow + .05) % 1) + 1) % 1, a = u * Math.PI * 2, x = lerp(-9.5, 9.5, u) * (mob ? .5 : 1), y = Math.sin(a + .6) * 1.9 + 1.4 + (mob ? .9 : 0), z = Math.cos(a) * 2.2 - .5, edge = ss(seg(u, 0, .06)) * (1 - ss(seg(u, .94, 1))); tmp.set(x, y, z); eul.set(0, 0, Math.PI / 2 + Math.cos(a) * .6); q.setFromEuler(eul); s3.set(edge * bv, edge * bv, edge * bv); m4.compose(tmp, q, s3); spacers.setMatrixAt(k, m4); }
      spacers.instanceMatrix.needsUpdate = true;
    }

    /* البلاكة المعلّقة */
    const pv = ss(seg(p, .66, .76)) * (1 - ss(seg(p, .84, .9)));
    place(pendG, mob ? .1 : 1.0, lerp(-2.4, -.05, ss(seg(p, .66, .78))) + (mob ? .9 : 0) - (1 - pv) * .8, 0, 1.02 * sx * pv, true);
    pendG.rotation.set(0, Math.sin(t * .8) * .55 + (p - .75) * 1.6, Math.sin(t * 1.1) * .06);
  };
  api.setProgress = (v) => { api.target = clamp(v, 0, 1); };
  api.setPointer = (x, y) => { api.tx = x; api.ty = y; };
  api.dispose = () => S.dispose();
  api.stage = S; api.watch = watch;
  S.renderOnce();
  return api;
}
