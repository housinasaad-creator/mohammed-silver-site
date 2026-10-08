/*
  أصوات المتجر (مولَّدة بالكامل بـ Web Audio، بلا ملفات): دقّة ساعة (تك/تك بنبرتين)، شرارة حجر، حبّة مسبحة،
  إضافة للسلة، ختم الطلب. مطفأة افتراضياً (المتصفح يمنع الصوت قبل أول لمسة)، والزر في الهيدر يشغّلها ويحفظ الاختيار.
*/
export function createSfx() {
  let ctx = null, master = null, noiseBuf = null, enabled = false, flip = false;
  const last = {};
  const ensure = () => {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = .7;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  };
  const gate = (name, ms) => { const n = performance.now(); if (last[name] && n - last[name] < ms) return false; last[name] = n; return true; };
  const run = (name, ms, fn) => { if (!enabled || !gate(name, ms) || !ensure()) return; if (ctx.state === 'suspended') ctx.resume(); try { fn(ctx.currentTime); } catch (e) { /* لا نكسر الصفحة بسبب الصوت */ } };
  const noise = (t, dur, { type = 'bandpass', f = 2500, f2, q = 1, g = .3, at = 0 } = {}) => {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t + at); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + at + dur);
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t + at); gn.gain.exponentialRampToValueAtTime(g, t + at + .003); gn.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
    s.connect(fl); fl.connect(gn); gn.connect(master); s.start(t + at, Math.random() * 1.4); s.stop(t + at + dur + .05);
  };
  const tone = (t, freq, dur, { type = 'sine', f2, g = .15, at = 0 } = {}) => {
    const o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t + at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + at + dur);
    gn.gain.setValueAtTime(0.0001, t + at); gn.gain.exponentialRampToValueAtTime(g, t + at + .004); gn.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
    o.connect(gn); gn.connect(master); o.start(t + at); o.stop(t + at + dur + .05);
  };
  const api = {
    get enabled() { return enabled; },
    restore(v) { enabled = !!v; },
    setOn(v) { enabled = !!v; if (enabled) { ensure(); ctx && ctx.state === 'suspended' && ctx.resume(); api.chime(true); } },
    /* دقّة ساعة: نقرة معدنية قصيرة (ضوضاء مرشّحة + رنين مرتفع قصير) بنبرتين متناوبتين تك/تك */
    tick() { run('tick', 400, (t) => { flip = !flip; noise(t, .028, { type: 'bandpass', f: flip ? 4300 : 3500, q: 2.4, g: .5 }); tone(t, flip ? 2350 : 1950, .05, { type: 'triangle', f2: flip ? 1500 : 1250, g: .09 }); tone(t, flip ? 330 : 280, .07, { f2: 150, g: .12 }); }); },
    chime(force) { if (!enabled) return; if (!force && !gate('chime', 400)) return; ensure(); if (!ctx) return; const t = ctx.currentTime; tone(t, 1568, .7, { g: .08 }); tone(t, 2349, .55, { g: .045, at: .03 }); tone(t, 3136, .4, { g: .022, at: .06 }); },
    glint() { run('glint', 220, (t) => { tone(t, 3300 + Math.random() * 900, .22, { g: .035 }); noise(t, .08, { type: 'highpass', f: 7500, g: .05 }); }); },
    bead() { run('bead', 80, (t) => { tone(t, 1250 + Math.random() * 700, .045, { type: 'triangle', f2: 700, g: .06 }); noise(t, .02, { type: 'bandpass', f: 3000, q: 3, g: .12 }); }); },
    add() { run('add', 120, (t) => { tone(t, 988, .4, { g: .1 }); tone(t, 1480, .5, { g: .08, at: .08 }); noise(t, .2, { type: 'highpass', f: 6200, g: .08 }); }); },
    whoosh() { run('whoosh', 350, (t) => { noise(t, .45, { f: 500, f2: 2200, q: .7, g: .11 }); }); },
    seal() { run('seal', 600, (t) => { [392, 494, 587, 784].forEach((f, i) => tone(t, f, 1.1, { g: .07, at: i * .08 })); noise(t, .6, { type: 'highpass', f: 9000, g: .05, at: .25 }); }); }
  };
  return api;
}
