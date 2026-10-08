/*
  متجر محمد: منطق الصفحة. اللغات (AR/EN/TR) والكتالوج والمعاينة والحقيبة والطلب بواتساب والصوت،
  وإدارة دورة حياة مشاهد WebGL (تُبنى عند الاقتراب وتُفكَّك من الذاكرة عند الابتعاد) وكذلك صور البطاقات البعيدة.
*/
import { T, CONFIG } from './content.js';
import { PRODUCTS, CATS, GEMN, MAT, describe } from './products.js';
import { createHero, CHAPTERS } from './hero3d.js';
import { createAtelier } from './atelier.js';
import { DEF, NO3D, GROUPS, visible, optName, swColor, price, lines, summary } from './designer.js';
import { createSfx } from './sfx.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement; root.classList.add('js');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), wait = (ms) => new Promise((r) => setTimeout(r, ms));
const store = { get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* التخزين غير متاح */ } } };
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ------------------------------------------------------------------ اللغة */
const qLang = new URLSearchParams(location.search).get('lang');
let lang = T[qLang] ? qLang : (T[store.get('msv-lang')] ? store.get('msv-lang') : ((navigator.language || 'en').slice(0, 2).toLowerCase()));
if (!T[lang]) lang = 'en';
const t = (k) => (T[lang][k] ?? T.en[k] ?? k);
const THEMES = ['obsidian', 'emerald', 'burgundy'], qTheme = new URLSearchParams(location.search).get('theme');
let theme = THEMES.includes(qTheme) ? qTheme : (THEMES.includes(store.get('msv-theme')) ? store.get('msv-theme') : 'obsidian');
root.dataset.theme = theme;
const nf = { ar: new Intl.NumberFormat('en-US'), en: new Intl.NumberFormat('en-US'), tr: new Intl.NumberFormat('tr-TR') };
const money = (n) => `${nf[lang].format(n)} ${CONFIG.currency}`;
const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
const img = (id, v) => `assets/products/${id}-${v}.webp`;

function split(el, text) {
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><i style="--n:${i}">${esc(w)}</i></span>`).join(' ');
}
function applyTexts() {
  root.lang = lang; root.dataset.lang = lang; document.title = t('title');
  $$('[data-i]').forEach((el) => { const v = t(el.dataset.i); if (el.matches('.ttl')) split(el, v); else el.textContent = v; });
  $('#snd').setAttribute('aria-label', t(sfx.enabled ? 'sound_off' : 'sound_on')); $('#bagBtn').setAttribute('aria-label', t('bag_open')); $('#langs').setAttribute('aria-label', t('lang'));
  $('#mClose').setAttribute('aria-label', t('close')); $('#bagClose').setAttribute('aria-label', t('close')); $('#thm').setAttribute('aria-label', `${t('theme')}: ${t('thm_' + theme)}`); $('#thm').title = t('thm_' + theme);
}
const sfx = createSfx(); sfx.restore(store.get('msv-snd') === '1');
/* خطوط النقش على الأحجار والميناء تُرسَم داخل كانفاس، فنحمّلها صراحة قبل بناء أي مشهد */
const fontsP = Promise.race([Promise.all([document.fonts.load('700 48px "Reem Kufi"'), document.fonts.load('700 48px "Amiri"'), document.fonts.load('700 48px "Markazi Text"'), document.fonts.load('600 48px "Cormorant Garamond"'), document.fonts.load('500 20px "Manrope"')]).catch(() => {}), wait(2500)]);

/* ------------------------------------------------------------------ الهيرو (WebGL) ودورة حياته */
const story = $('#story'), stage = $('#stage'), poster = $('#poster'), cue = $('#cue');
let hero = null, heroCanvas = null, stageW = 1, stageH = 1, chapter = -1;
const coEls = Object.fromEntries($$('.co').map((e, i) => { e.dataset.side = i % 2 ? 'l' : 'r'; return [e.dataset.k, e]; }));
new ResizeObserver(() => { stageW = stage.clientWidth || 1; stageH = stage.clientHeight || 1; }).observe(stage);

function mountHero() {
  if (hero) return;
  const c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true'); poster.after(c);
  const h = createHero(c);
  if (!h) { c.remove(); $('#note3d').hidden = false; return; }
  heroCanvas = c; hero = h; stage.classList.add('live'); $('#note3d').hidden = true;
  hero.onTick = () => sfx.tick();
  let lastO = -1;
  hero.onAnchors = (an, ex) => {
    const o = clamp((ex - .55) / .3, 0, 1);
    if (!an.length) { if (lastO !== 0) { lastO = 0; Object.values(coEls).forEach((e) => { e.style.opacity = 0; }); } return; }
    lastO = o;
    const items = an.map((a) => ({ k: a.k, x: a.x * stageW, y: a.y * stageH })).sort((p1, p2) => p1.y - p2.y);
    for (let i = 1; i < items.length; i++) for (let j = 0; j < i; j++) if (Math.abs(items[i].x - items[j].x) < 210 && Math.abs(items[i].y - items[j].y) < 46) items[i].y = items[j].y + 46;
    items.forEach((a) => { const el = coEls[a.k]; if (!el) return; el.style.transform = `translate3d(${a.x.toFixed(1)}px,${clamp(a.y, 90, stageH - 60).toFixed(1)}px,0)`; el.style.opacity = o.toFixed(2); });
  };
  hero.setProgress(heroP()); hero.p = hero.target;
}
function unmountHero() {
  if (!hero) return; hero.dispose(); hero = null; heroCanvas && heroCanvas.remove(); heroCanvas = null; stage.classList.remove('live');
  Object.values(coEls).forEach((e) => { e.style.opacity = 0; });
}
let heroWanted = false;
new IntersectionObserver((es) => { heroWanted = es[0].isIntersecting; if (heroWanted) fontsP.then(() => { if (heroWanted) mountHero(); }); else unmountHero(); }, { rootMargin: '120% 0px' }).observe(story);
stage.addEventListener('pointermove', (e) => { if (hero && fine) hero.setPointer(e.clientX / innerWidth - .5, -(e.clientY / innerHeight - .5)); });

const heroP = () => { const r = story.getBoundingClientRect(), total = Math.max(1, r.height - innerHeight); return clamp(-r.top / total, 0, 1); };
const chapOf = (p) => (p < CHAPTERS[1] ? 0 : p < CHAPTERS[2] ? 1 : p < CHAPTERS[3] ? 2 : p < CHAPTERS[4] ? 3 : 4);
function setChapter(i) {
  if (i === chapter) return; const first = chapter < 0; chapter = i;
  $$('.chap').forEach((c) => c.classList.toggle('on', +c.dataset.c === i)); $$('#rail button').forEach((b) => b.classList.toggle('on', +b.dataset.c === i));
  if (!first) sfx.whoosh();
}
$('#rail').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; const r = story.getBoundingClientRect(), total = r.height - innerHeight, top = r.top + scrollY;
  scrollTo({ top: top + (CHAPTERS[+b.dataset.c] + (+b.dataset.c ? .03 : 0)) * total, behavior: reduced ? 'auto' : 'smooth' });
});

/* ------------------------------------------------------------------ تمرير الصفحة */
const hdr = $('#hdr'), pfill = $('#pfill'); let ticking = false;
function onScroll() {
  ticking = false; const y = scrollY, max = Math.max(1, root.scrollHeight - innerHeight);
  hdr.classList.toggle('solid', y > 40); pfill.style.transform = `scaleX(${clamp(y / max, 0, 1).toFixed(4)})`; cue.classList.toggle('gone', y > 80);
  const p = heroP(); hero && hero.setProgress(p); setChapter(chapOf(p));
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true }); addEventListener('resize', () => requestAnimationFrame(onScroll));

/* ------------------------------------------------------------------ الكتالوج */
let cat = 'all', sortKey = 'f';
const grid = $('#grid'), filters = $('#filters');
const needsOpts = (p) => p.cat === 'ring' || p.spec.cat === 'chain' || (p.cat === 'pendant' && p.spec.text);
const sub = (p) => (p.cat === 'watch' ? { ar: 'علبة فضة · أوتوماتيك', en: 'Silver case · Automatic', tr: 'Gümüş kasa · Otomatik' }[lang] : MAT[lang] + (p.gem ? ' · ' + GEMN[p.gem][lang] : ''));
function ordered() {
  let a = PRODUCTS.filter((p) => cat === 'all' || p.cat === cat);
  if (sortKey === 'l') a = [...a].sort((x, y) => x.price - y.price); else if (sortKey === 'h') a = [...a].sort((x, y) => y.price - x.price);
  else if (cat === 'all') { const g = CATS.map((c) => a.filter((p) => p.cat === c)), out = []; for (let i = 0; i < 8; i++) g.forEach((l) => l[i] && out.push(l[i])); a = out; }
  return a;
}
function renderFilters() {
  filters.innerHTML = ['all', ...CATS].map((c) => `<button type="button" class="chip${c === cat ? ' on' : ''}" data-c="${c}">${esc(t('f_' + c))}<i>${c === 'all' ? PRODUCTS.length : PRODUCTS.filter((p) => p.cat === c).length}</i></button>`).join('');
}
function cardHtml(p) {
  const nm = esc(p.name[lang]);
  return `<article class="card pre" data-id="${p.id}"><button type="button" class="im" data-act="view" aria-label="${nm}"><img class="a" alt="${nm}" width="760" height="950" decoding="async" data-src="${img(p.id, 'a')}"><img class="b" alt="" width="760" height="950" decoding="async" data-src="${img(p.id, 'b')}"><span class="tag">${esc(t('f_' + p.cat))}</span><span class="glare"></span><span class="qv">${esc(t('view'))}</span></button>
<div class="meta"><div><h3 class="nm">${nm}</h3><p class="sub">${esc(sub(p))}</p></div><p class="pr">${money(p.price)}</p><button type="button" class="addb" data-act="add" aria-label="${esc(t('add'))}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button></div></article>`;
}
let cardIO, loadIO;
function renderGrid() {
  const list = ordered(); cardIO && cardIO.disconnect(); loadIO && loadIO.disconnect();
  grid.innerHTML = list.length ? list.map(cardHtml).join('') : `<p class="empty">—</p>`;
  $('#count').textContent = `${list.length} ${t('items')}`;
  const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length || 4;
  cardIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { const el = e.target, i = $$('.card', grid).indexOf(el); el.style.transitionDelay = `${(i % cols) * 70}ms`; el.classList.remove('pre'); setTimeout(() => { el.style.transitionDelay = ''; }, 1200); cardIO.unobserve(el); } }), { rootMargin: '0px 0px -6% 0px' });
  /* ذاكرة: الصور البعيدة (أكثر من ~3 شاشات) تُستبدل بصورة فارغة وتعود عند الاقتراب */
  loadIO = new IntersectionObserver((es) => es.forEach((e) => {
    const a = $('img.a', e.target), b = $('img.b', e.target);
    if (e.isIntersecting) { if (a.dataset.src && a.getAttribute('src') !== a.dataset.src) a.src = a.dataset.src; if (b.dataset.on === '1' && b.getAttribute('src') !== b.dataset.src) b.src = b.dataset.src; }
    else { [a, b].forEach((i) => { if (i.getAttribute('src') && i.getAttribute('src') !== BLANK) i.src = BLANK; }); }
  }), { rootMargin: '280% 0px' });
  $$('.card', grid).forEach((c) => { cardIO.observe(c); loadIO.observe(c); });
}
filters.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) setCat(b.dataset.c); });
function setCat(c) { cat = c; renderFilters(); renderGrid(); sfx.glint(); }
$('#sort').addEventListener('change', (e) => { sortKey = e.target.value; renderGrid(); });
grid.addEventListener('click', (e) => {
  const card = e.target.closest('.card'); if (!card) return; const p = byId[card.dataset.id], act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'add') { if (needsOpts(p)) openModal(p.id); else { bagAdd({ id: p.id, qty: 1 }); flyFrom($('img.a', card)); } }
  else if (act === 'view') openModal(p.id);
});
/* صورة الزاوية الثانية تُحمَّل عند أول تمرير للفأرة فقط، ثم ميلان خفيف ولمعة تتبع المؤشر */
grid.addEventListener('pointerover', (e) => { const im = e.target.closest('.im'); if (!im) return; const b = $('img.b', im); if (b && b.dataset.on !== '1' && b.getAttribute('src') !== b.dataset.src && fine) { b.dataset.on = '1'; b.src = b.dataset.src; } });
if (fine && !reduced) {
  grid.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.card'); if (!card) return; const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.classList.add('tilt'); card.style.transform = `perspective(900px) rotateX(${((.5 - y) * 6).toFixed(2)}deg) rotateY(${((x - .5) * 7).toFixed(2)}deg) translateY(-4px)`; card.style.setProperty('--gx', `${(x * 100).toFixed(0)}%`); card.style.setProperty('--gy', `${(y * 100).toFixed(0)}%`);
  });
  grid.addEventListener('pointerout', (e) => { const card = e.target.closest('.card'); if (card && !card.contains(e.relatedTarget)) { card.classList.remove('tilt'); card.style.transform = ''; } });
}

/* ------------------------------------------------------------------ المعاينة السريعة */
const modal = $('#modal'); let cur = null, lastFocus = null;
const lock = (on) => { root.style.overflow = on ? 'hidden' : ''; };
function optHtml(p) {
  let h = '';
  if (p.cat === 'ring') h += `<label class="mopt"><span>${esc(t('o_size'))}</span><select id="oSize">${[50, 52, 54, 56, 58, 60, 62, 64].map((s) => `<option${s === 56 ? ' selected' : ''}>${s}</option>`).join('')}</select></label>`;
  if (p.spec.cat === 'chain') h += `<label class="mopt"><span>${esc(t('o_length'))}</span><select id="oLen">${[40, 45, 50, 55].map((s) => `<option value="${s}"${s === 45 ? ' selected' : ''}>${s} ${esc(t('o_cm'))}</option>`).join('')}</select></label>`;
  if ((p.cat === 'pendant' && p.spec.text) || p.id === 'ring-signet') h += `<label class="mopt"><span>${esc(t('o_engrave'))}</span><input type="text" id="oEng" maxlength="16" placeholder="${esc(t('o_engrave_ph'))}" autocomplete="off"></label>`;
  return h;
}
function modalHtml(p) {
  const g = p.gem ? GEMN[p.gem][lang] : t('none');
  return `<p class="kick">${esc(t('f_' + p.cat))}</p><h3>${esc(p.name[lang])}</h3><div class="big">${money(p.price)}</div><p class="desc">${esc(describe(p, lang))}</p>
<ul class="specs"><li><span>${esc(t('spec_mat'))}</span><b>${esc(MAT[lang])}</b></li><li><span>${esc(t('spec_stone'))}</span><b>${esc(g)}</b></li><li><span>${esc(t('spec_warranty'))}</span><b>${esc(t(p.cat === 'watch' ? 'warranty_watch' : 'warranty_other'))}</b></li></ul>
${optHtml(p)}<label class="ck"><input type="checkbox" id="oGift"><span>${esc(t('o_gift'))}</span></label>
<div class="buy"><div class="qty"><button type="button" data-q="-1" aria-label="-">−</button><span id="oQ">1</span><button type="button" data-q="1" aria-label="+">+</button></div><button type="button" class="btn pri mag" id="oAdd"><span>${esc(t('add'))}</span></button></div>`;
}
function openModal(id) {
  const p = byId[id]; if (!p) return; cur = { id, q: 1, v: 'a' }; lastFocus = document.activeElement;
  $('#mInfo').innerHTML = modalHtml(p);
  const a = $('#mA'), b = $('#mB'); a.src = img(id, 'a'); a.alt = p.name[lang]; a.classList.remove('off'); b.src = img(id, 'b'); b.alt = ''; b.classList.add('off');
  $('#mTh').innerHTML = ['a', 'b'].map((v) => `<button type="button" data-v="${v}" class="${v === 'a' ? 'on' : ''}" aria-label="${v}"><img alt="" src="${img(id, v)}"></button>`).join('');
  modal.classList.add('on'); modal.setAttribute('aria-hidden', 'false'); lock(true); sfx.whoosh(); setTimeout(() => $('#mClose').focus({ preventScroll: true }), 80);
  bindMag($$('.mag', modal));
}
function closeModal() {
  if (!modal.classList.contains('on')) return; modal.classList.remove('on'); modal.setAttribute('aria-hidden', 'true'); if (!$('#drawer').classList.contains('on')) lock(false);
  setTimeout(() => { $('#mA').removeAttribute('src'); $('#mB').removeAttribute('src'); $('#mTh').innerHTML = ''; }, 600); lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
}
function showView(v) { if (!cur) return; cur.v = v; $('#mA').classList.toggle('off', v !== 'a'); $('#mB').classList.toggle('off', v !== 'b'); $$('#mTh button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)); }
$('#mTh').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showView(b.dataset.v); });
$('#mImg').addEventListener('click', () => { if (!fine) showView(cur && cur.v === 'a' ? 'b' : 'a'); });
if (fine) { const mi = $('#mImg'); mi.addEventListener('pointermove', (e) => { const r = mi.getBoundingClientRect(); mi.style.setProperty('--zx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`); mi.style.setProperty('--zy', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`); mi.classList.add('zoom'); }); mi.addEventListener('pointerleave', () => mi.classList.remove('zoom')); }
$('#mInfo').addEventListener('click', (e) => {
  const q = e.target.closest('[data-q]'); if (q && cur) { cur.q = clamp(cur.q + +q.dataset.q, 1, 9); $('#oQ').textContent = cur.q; return; }
  if (e.target.closest('#oAdd') && cur) {
    const item = { id: cur.id, qty: cur.q, gift: $('#oGift').checked }; if ($('#oSize')) item.size = $('#oSize').value; if ($('#oLen')) item.len = $('#oLen').value; if ($('#oEng') && $('#oEng').value.trim()) item.eng = $('#oEng').value.trim();
    const btn = $('#oAdd'); flyFrom($('#mA')); bagAdd(item); btn.classList.add('ok'); $('span', btn).textContent = '✓ ' + t('added'); setTimeout(closeModal, 750);
  }
});
$('#mClose').addEventListener('click', closeModal); $('#mBack').addEventListener('click', closeModal);

/* ------------------------------------------------------------------ الحقيبة (منتجات الكتالوج + تصاميم الأتيليه) */
let bag = []; try { bag = JSON.parse(store.get('msv-bag', '[]')).filter((i) => i.qty > 0 && (i.custom ? DEF[i.custom] && i.cfg : byId[i.id])); } catch (e) { bag = []; }
const drawer = $('#drawer'), scrim = $('#scrim'), bagBtn = $('#bagBtn');
const keyOf = (i) => (i.custom ? `c|${i.custom}|${JSON.stringify(i.cfg)}` : [i.id, i.size || '', i.len || '', i.eng || '', i.gift ? 1 : 0].join('|'));
function bagAdd(item) { const k = keyOf(item), ex = bag.find((i) => keyOf(i) === k); if (ex) ex.qty = Math.min(20, ex.qty + (item.qty || 1)); else bag.push({ ...item, qty: item.qty || 1 }); saveBag(); renderBag(); sfx.add(); }
function saveBag() { store.set('msv-bag', JSON.stringify(bag)); }
const unit = (i) => (i.custom ? price(i.custom, i.cfg) : byId[i.id].price), itemName = (i) => (i.custom ? t('c_' + i.custom) : byId[i.id].name[lang]);
const itemImg = (i) => (i.custom ? i.thumb || 'assets/favicon-192.png' : img(i.id, 'a'));
const optLine = (i) => (i.custom ? summary(i.custom, i.cfg, t) : [i.size && `${t('wa_size')}: ${i.size}`, i.len && `${t('wa_len')}: ${i.len} ${t('o_cm')}`, i.eng && `${t('wa_eng')}: ${i.eng}`, i.gift && t('wa_gift')].filter(Boolean).join(' · '));
const total = () => bag.reduce((s, i) => s + unit(i) * i.qty, 0);
function renderBag() {
  const n = bag.reduce((s, i) => s + i.qty, 0), c = $('#bagCount'); c.textContent = n; c.classList.toggle('has', n > 0);
  $('#bagFoot').hidden = !n;
  $('#bagList').innerHTML = n ? bag.map((i, ix) => { const ol = optLine(i); return `<div class="it"><img src="${itemImg(i)}" alt="" loading="lazy"><div><h4>${esc(itemName(i))}</h4>${ol ? `<p>${esc(ol)}</p>` : ''}<div class="qty"><button type="button" data-ix="${ix}" data-d="-1" aria-label="-">−</button><span>${i.qty}</span><button type="button" data-ix="${ix}" data-d="1" aria-label="+">+</button></div></div><div class="pr">${money(unit(i) * i.qty)}<br><button type="button" class="rm" data-ix="${ix}" data-d="0">${esc(t('rm'))}</button></div></div>`; }).join('')
    : `<div class="empty-bag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6.500a3 3 0 0 1 6 0V8"/></svg><b>${esc(t('bag_empty'))}</b><span>${esc(t('bag_empty_p'))}</span></div>`;
  $('#bagTotal').textContent = money(total());
}
$('#bagList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ix]'); if (!b) return; const ix = +b.dataset.ix, d = +b.dataset.d;
  if (d === 0) bag.splice(ix, 1); else { bag[ix].qty += d; if (bag[ix].qty < 1) bag.splice(ix, 1); else if (bag[ix].qty > 20) bag[ix].qty = 20; }
  saveBag(); renderBag();
});
function openBag() { drawer.classList.add('on'); scrim.classList.add('on'); drawer.setAttribute('aria-hidden', 'false'); lock(true); sfx.whoosh(); setTimeout(() => $('#bagClose').focus({ preventScroll: true }), 120); }
function closeBag() { drawer.classList.remove('on'); scrim.classList.remove('on'); drawer.setAttribute('aria-hidden', 'true'); if (!modal.classList.contains('on')) lock(false); bagBtn.focus({ preventScroll: true }); }
bagBtn.addEventListener('click', openBag); $('#bagClose').addEventListener('click', closeBag); scrim.addEventListener('click', closeBag);
$('#bagClear').addEventListener('click', () => { bag = []; saveBag(); renderBag(); });
const waLink = (msg) => `https://wa.me/${CONFIG.wa}?text=${encodeURIComponent(msg)}`;
const detailLines = (tab, cfg) => lines(tab, cfg, t).filter(([, v]) => v).map(([k, v]) => `   - ${k}: ${v}`);
$('#bagSend').addEventListener('click', () => {
  if (!bag.length) return;
  const out = bag.map((i, ix) => `${ix + 1}) ${itemName(i)} ×${i.qty} — ${money(unit(i) * i.qty)}` + (i.custom ? '\n' + detailLines(i.custom, i.cfg).join('\n') : (optLine(i) ? '\n   ' + optLine(i) : '')));
  const msg = `${t('wa_hi')}\n\n${out.join('\n')}\n\n${t('wa_total')}: ${money(total())}\n\n${t('wa_end')} `;
  sfx.seal(); window.open(waLink(msg), '_blank', 'noopener');
});
function flyFrom(el, src) {
  if (reduced || !el) return; const r = el.getBoundingClientRect(), b = bagBtn.getBoundingClientRect(); if (!r.width) return;
  const f = document.createElement('img'); f.className = 'fly'; f.src = src || el.currentSrc || el.src; f.alt = ''; const sx = r.left + r.width / 2, sy = r.top + r.height / 2; f.style.left = `${sx - 27}px`; f.style.top = `${sy - 34}px`; document.body.appendChild(f);
  const dx = b.left + b.width / 2 - sx, dy = b.top + b.height / 2 - sy;
  const an = f.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * .4}px,${dy * .4 - 110}px) scale(.85) rotate(-8deg)`, opacity: 1, offset: .45 }, { transform: `translate(${dx}px,${dy}px) scale(.25) rotate(10deg)`, opacity: .15 }], { duration: 820, easing: 'cubic-bezier(.45,.05,.25,1)' });
  an.onfinish = () => { f.remove(); bagBtn.classList.remove('bump'); void bagBtn.offsetWidth; bagBtn.classList.add('bump'); };
}
let toastT = 0;
function toast(msg) { let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3600); }

/* ------------------------------------------------------------------ الأتيليه: مصمّم الخاتم والساعة والمسبحة */
const at = { tab: ['ring', 'watch', 'beads'].includes(store.get('msv-at-tab')) ? store.get('msv-at-tab') : 'ring', cfg: { ring: { ...DEF.ring }, watch: { ...DEF.watch }, beads: { ...DEF.beads } } };
try { const sv = JSON.parse(store.get('msv-at', 'null')); if (sv) ['ring', 'watch', 'beads'].forEach((k) => { if (!sv[k]) return; GROUPS[k].forEach((g) => { const v = sv[k][g.k]; if (v === undefined) return; if (g.opts && !g.opts.includes(String(v))) return; at.cfg[k][g.k] = String(v).slice(0, 400); }); }); } catch (e) { /* قيم محفوظة تالفة: نتجاهلها */ }
let atelier = null, atCanvas = null, atTimer = 0; const cfgNow = () => at.cfg[at.tab], atCopy = () => ({ ...cfgNow() });
const saveAt = () => { store.set('msv-at', JSON.stringify(at.cfg)); store.set('msv-at-tab', at.tab); };
const accentHex = () => getComputedStyle(root).getPropertyValue('--accent').trim() || '#d9c59d';
const FACETED = ['amethyst', 'sapphire', 'emerald', 'ruby', 'topaz', 'citrine', 'pink', 'clear'];
function groupHtml(g, c) {
  const val = c[g.k], isOpt = g.type === 'chips' || g.type === 'sw', head = `<h4 class="g-l"><span>${esc(t(g.l))}</span>${isOpt ? `<em>${esc(optName(g, val, t))}</em>` : ''}</h4>`;
  let body = '';
  if (g.type === 'chips') body = `<div class="opts">${g.opts.map((v) => `<button type="button" class="opt${v === val ? ' on' : ''}" data-g="${g.k}" data-v="${v}">${esc(optName(g, v, t))}</button>`).join('')}</div>`;
  else if (g.type === 'sw') body = `<div class="swatches">${g.opts.map((v) => `<button type="button" class="sw${v === val ? ' on' : ''}" data-g="${g.k}" data-v="${v}" style="--c:${swColor(g, v)}"><span class="dot"></span><span>${esc(optName(g, v, t))}</span></button>`).join('')}</div>`;
  else if (g.type === 'select') body = `<select data-g="${g.k}">${g.opts.map((v) => `<option${v === val ? ' selected' : ''}>${v}</option>`).join('')}</select>`;
  else if (g.type === 'text') body = `<input type="text" data-g="${g.k}" maxlength="${g.max}" value="${esc(val)}" placeholder="${esc(t(g.ph))}" autocomplete="off">${g.h ? `<small>${esc(t(g.h))}</small>` : ''}`;
  else body = `<textarea data-g="${g.k}" rows="3" maxlength="400" placeholder="${esc(t(g.ph))}">${esc(val)}</textarea>${g.h ? `<small class="hl">${esc(t(g.h))}</small>` : ''}`;
  return `<section class="grp${g.type === 'area' ? ' note' : ''}" data-grp="${g.k}">${head}${body}</section>`;
}
function atSummary() {
  const c = cfgNow(), ls = lines(at.tab, c, t).filter(([, v]) => v);
  $('#atSumL').textContent = summary(at.tab, c, t); $('#atPrice').textContent = '≈ ' + money(price(at.tab, c)); $('#atName').textContent = ls.slice(0, 2).map(([, v]) => v).join(' · ');
}
function renderAt(focusSel) {
  const c = cfgNow(); $('#atGroups').innerHTML = visible(at.tab, c).map((g) => groupHtml(g, c)).join('');
  $$('#atTabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === at.tab)); atSummary();
  if (focusSel) { const f = $(focusSel, $('#atGroups')); f && f.focus({ preventScroll: true }); }
}
function push3d() { atelier && atelier.set(at.tab, atCopy()); }
function atSet(k, v, snd) {
  const c = cfgNow(); c[k] = v;
  if (at.tab === 'ring' && k === 'gem' && ['solitaire', 'halo', 'trilogy', 'bezel', 'cluster'].includes(c.style)) { if (!FACETED.includes(v) && (c.cut === 'round' || c.cut === 'oval')) c.cut = 'cabochon'; else if (FACETED.includes(v) && c.cut === 'cabochon') c.cut = 'round'; }
  saveAt(); renderAt(`[data-g="${k}"][data-v="${v}"]`); push3d();
  const nm = $('#atName'); nm.classList.add('sw'); setTimeout(() => nm.classList.remove('sw'), 40);
  if (snd) (at.tab === 'beads' ? sfx.bead() : sfx.glint());
}
$('#atGroups').addEventListener('click', (e) => { const b = e.target.closest('button[data-g]'); if (b) atSet(b.dataset.g, b.dataset.v, true); });
$('#atGroups').addEventListener('change', (e) => { const el = e.target; if (el.tagName === 'SELECT' && el.dataset.g) { cfgNow()[el.dataset.g] = el.value; saveAt(); atSummary(); } });
$('#atGroups').addEventListener('input', (e) => {
  const el = e.target, k = el.dataset.g; if (!k || el.tagName === 'SELECT') return; let v = el.value;
  if (k === 'brand') { v = v.replace(/[^A-Za-z0-9 .&'-]/g, '').toUpperCase().slice(0, 10); if (v !== el.value) el.value = v; }
  if (k === 'glyph') { const ar = /[\u0600-\u06FF]/.test(v); v = [...v].slice(0, ar ? 4 : 3).join(''); if (v !== el.value) el.value = v; }
  cfgNow()[k] = v; saveAt(); atSummary();
  if (!NO3D.includes(k)) { clearTimeout(atTimer); atTimer = setTimeout(push3d, 450); }
});
$('#atTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b && b.dataset.t !== at.tab) { at.tab = b.dataset.t; saveAt(); renderAt(); push3d(); sfx.glint(); } });
$('#atSee').addEventListener('click', () => { setCat({ ring: 'ring', watch: 'watch', beads: 'tasbih' }[at.tab]); $('#collection').scrollIntoView({ behavior: 'instant' }); });
const logoImg = new Image(); logoImg.src = 'assets/logo-silver.png';
/* صورة التصميم: عرض الثري دي فوق خلفية الثيم مع الاسم والملخص والسعر التقديري */
function composeDesign(px = 1000, withText = true) {
  if (!atelier) return null; const src = atelier.snapshot(px), H = withText ? Math.round(px * 1.22) : px, c = document.createElement('canvas'); c.width = px; c.height = H;
  const x = c.getContext('2d'), css = getComputedStyle(root), g = x.createRadialGradient(px / 2, px * .45, 30, px / 2, px * .5, px * .85); g.addColorStop(0, css.getPropertyValue('--stage1').trim() || '#25221e'); g.addColorStop(1, css.getPropertyValue('--stage2').trim() || '#0f0e0d'); x.fillStyle = g; x.fillRect(0, 0, px, H);
  x.drawImage(src, 0, 0, px, px);
  if (withText) {
    const fg = `rgb(${css.getPropertyValue('--fgc').trim() || '244,240,232'})`, ac = accentHex(); x.textAlign = 'center'; x.direction = lang === 'ar' ? 'rtl' : 'ltr';
    if (logoImg.complete && logoImg.naturalWidth) x.drawImage(logoImg, px * .04, px * .035, px * .13, px * .13 * logoImg.naturalHeight / logoImg.naturalWidth);
    x.fillStyle = fg; x.font = `600 ${px * .05}px "Cormorant Garamond","Markazi Text",serif`; x.fillText(t('c_' + at.tab), px / 2, px + px * .07);
    x.fillStyle = css.getPropertyValue('--mut').trim() || '#aaa'; x.font = `500 ${px * .03}px "Manrope","Tajawal",sans-serif`;
    const words = summary(at.tab, cfgNow(), t).split(' · '); let line = '', y = px + px * .125; words.forEach((w) => { const tr = line ? line + ' · ' + w : w; if (x.measureText(tr).width > px * .9 && line) { x.fillText(line, px / 2, y); y += px * .045; line = w; } else line = tr; }); x.fillText(line, px / 2, y);
    x.direction = 'ltr'; x.fillStyle = ac; x.font = `600 ${px * .045}px "Cormorant Garamond","Markazi Text",serif`; x.fillText('≈ ' + money(price(at.tab, cfgNow())), px / 2, H - px * .04);
  }
  return c;
}
const toBlob = (cv) => new Promise((res) => cv.toBlob(res, 'image/png'));
async function saveDesign() {
  const cv = composeDesign(1000, true); if (!cv) return false; const blob = await toBlob(cv); if (!blob) return false;
  const file = new File([blob], `mohammed-${at.tab}-design.png`, { type: 'image/png' });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'MOHAMMED' }); return true; } catch (e) { if (e && e.name === 'AbortError') return false; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); return true;
}
$('#atSave').addEventListener('click', async () => { if (await saveDesign()) { toast(t('at_saved')); sfx.add(); } });
$('#atWa').addEventListener('click', () => {
  const c = cfgNow(), msg = `${t('wa_design')}\n\n*${t('c_' + at.tab)}*\n${detailLines(at.tab, c).join('\n')}\n\n${t('wa_est')}: ≈ ${money(price(at.tab, c))}\n\n${t('wa_pic')}`;
  sfx.seal(); window.open(waLink(msg), '_blank', 'noopener'); toast(t('at_step2'));
});
$('#atBag').addEventListener('click', () => {
  const cv = composeDesign(240, false); let thumb = ''; if (cv) { const t2 = document.createElement('canvas'); t2.width = 120; t2.height = 150; const x = t2.getContext('2d'); x.fillStyle = '#111'; x.fillRect(0, 0, 120, 150); x.drawImage(cv, 0, 12, 120, 120); thumb = t2.toDataURL('image/jpeg', .72); }
  bagAdd({ custom: at.tab, cfg: atCopy(), qty: 1, thumb }); flyFrom($('#atView'), thumb || undefined); toast(t('at_added'));
});
function mountAt() {
  if (atelier) return; const c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true'); $('#atView').prepend(c);
  const a = createAtelier(c, { tab: at.tab, cfg: atCopy(), accent: accentHex() }); if (!a) { c.remove(); return; }
  atCanvas = c; atelier = a; a.onTick = () => { if (at.tab === 'watch') sfx.tick(); };
  a.onDrag = (d) => { cursorEl.classList.toggle('drag', d); if (d) $('.at-hint').classList.add('gone'); };
}
function unmountAt() { if (!atelier) return; atelier.dispose(); atelier = null; atCanvas && atCanvas.remove(); atCanvas = null; }
let atWanted = false;
new IntersectionObserver((es) => { atWanted = es[0].isIntersecting; if (atWanted) fontsP.then(() => { if (atWanted) (window.requestIdleCallback || ((f) => setTimeout(f, 60)))(() => { if (atWanted) mountAt(); }); }); else unmountAt(); }, { rootMargin: '40% 0px' }).observe($('#atelier'));

/* ------------------------------------------------------------------ مبدّل اللغة (دائرة تتسع من مكان الضغط) */
const langsEl = $('#langs');
function syncLangs(flip) {
  langsEl.style.setProperty('--i', ['ar', 'en', 'tr'].indexOf(lang));
  $$('#langs button').forEach((b) => { const on = b.dataset.l === lang; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); if (on && flip) { b.classList.remove('flip'); void b.offsetWidth; b.classList.add('flip'); } });
}
function renderAll() { applyTexts(); renderFilters(); renderGrid(); renderBag(); renderAt(); $('#sort').value = sortKey; if (cur && modal.classList.contains('on')) { const q = cur.q, v = cur.v; $('#mInfo').innerHTML = modalHtml(byId[cur.id]); cur.q = q; $('#oQ').textContent = q; showView(v); bindMag($$('.mag', modal)); } $('#waLink').href = `https://wa.me/${CONFIG.wa}`; }
function setLang(k, btn) {
  if (k === lang) return;
  const apply = () => { lang = k; store.set('msv-lang', lang); const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u); renderAll(); syncLangs(true); };
  const r = btn.getBoundingClientRect(); root.style.setProperty('--vx', `${Math.round(r.left + r.width / 2)}px`); root.style.setProperty('--vy', `${Math.round(r.top + r.height / 2)}px`);
  if (document.startViewTransition && !reduced) { const vt = document.startViewTransition(apply); vt.finished.catch(() => {}); } else apply();
}
langsEl.addEventListener('click', (e) => { const b = e.target.closest('button'); b && setLang(b.dataset.l, b); });

/* ------------------------------------------------------------------ الصوت */
const sndBtn = $('#snd');
function syncSnd() { sndBtn.setAttribute('aria-pressed', sfx.enabled); sndBtn.setAttribute('aria-label', t(sfx.enabled ? 'sound_off' : 'sound_on')); }
sndBtn.addEventListener('click', () => { sfx.setOn(!sfx.enabled); store.set('msv-snd', sfx.enabled ? '1' : '0'); syncSnd(); });

/* ------------------------------------------------------------------ تفاصيل صغيرة: كشف عند التمرير، مؤشر، أزرار مغناطيسية */
const rvIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rvIO.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.rv').forEach((el, i) => { el.style.setProperty('--d', `${(i % 4) * 90}ms`); rvIO.observe(el); });
const cursorEl = $('#cursor');
if (fine && !reduced) {
  document.body.classList.add('hascur'); let cx = -50, cy = -50, tx = -50, ty = -50;
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  addEventListener('pointerover', (e) => { const hit = e.target.closest && e.target.closest('a, button, select, input, label, .card'); cursorEl.classList.toggle('big', !!hit && !cursorEl.classList.contains('drag')); });
  (function loop() { cx += (tx - cx) * .22; cy += (ty - cy) * .22; cursorEl.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`; requestAnimationFrame(loop); })();
}
function bindMag(els) {
  if (!fine || reduced) return;
  els.forEach((b) => { if (b.dataset.mag) return; b.dataset.mag = '1'; b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .16).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .22).toFixed(1)}px)`; }); b.addEventListener('pointerleave', () => { b.style.transform = ''; }); });
}
bindMag($$('.mag'));
addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (modal.classList.contains('on')) closeModal(); else if (drawer.classList.contains('on')) closeBag(); } });

/* ------------------------------------------------------------------ اللون (ثلاث لوحات) وتنقّل فوري وصور الكتالوج */
function applyTheme() {
  root.dataset.theme = theme; const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = getComputedStyle(root).getPropertyValue('--bg').trim();
  atelier && atelier.setAccent(accentHex()); $('#thm').setAttribute('aria-label', `${t('theme')}: ${t('thm_' + theme)}`); $('#thm').title = t('thm_' + theme);
}
$('#thm').addEventListener('click', () => {
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length], btn = $('#thm'), r = btn.getBoundingClientRect();
  root.style.setProperty('--vx', `${Math.round(r.left + r.width / 2)}px`); root.style.setProperty('--vy', `${Math.round(r.top + r.height / 2)}px`);
  const apply = () => { theme = next; store.set('msv-theme', theme); const u = new URL(location.href); u.searchParams.set('theme', theme); history.replaceState(null, '', u); applyTheme(); };
  if (document.startViewTransition && !reduced) { const vt = document.startViewTransition(apply); vt.finished.catch(() => {}); } else apply(); sfx.glint();
});
/* روابط الأقسام تقفز فوراً (لا تمرير ناعم عبر الهيرو الثقيل) */
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return; const id = a.getAttribute('href'); if (id.length < 2) return;
  const el = id === '#top' ? document.body : $(id); if (!el) return; e.preventDefault();
  if (id === '#top') window.scrollTo({ top: 0, behavior: 'instant' }); else el.scrollIntoView({ behavior: 'instant', block: 'start' });
  history.replaceState(null, '', location.pathname + location.search + id);
});
/* صور البطاقات: تظهر بتلاشٍ عند اكتمال التحميل فوق هيكل لامع، وأول ثماني صور تُجهَّز مسبقاً بعد فراغ الصفحة */
grid.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') e.target.classList.add('in'); }, true);
setTimeout(() => { ordered().slice(0, 8).forEach((p) => { const i = new Image(); i.decoding = 'async'; i.src = img(p.id, 'a'); }); }, 2200);

/* ------------------------------------------------------------------ تشغيل */
renderAll(); syncLangs(false); syncSnd(); onScroll();
const loader = $('#loader');
fontsP.then(() => wait(900)).then(() => { loader.classList.add('out'); setTimeout(() => loader.remove(), 1000); onScroll(); });
