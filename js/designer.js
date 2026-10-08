/*
  مصمّم القطع (الأتيليه): تعريف الخيارات لكل قطعة، الإعدادات الافتراضية، تقدير السعر بالليرة، وسطور الملخّص (لبطاقة التصميم والحقيبة ورسالة واتساب).
  الأسعار تقديرية (المتجر تجريبي) وتُؤكَّد مع الزبون على واتساب.
*/
export const SW = {
  amethyst: '#8a4fd6', sapphire: '#3a6fe8', emerald: '#14a468', ruby: '#d6193f', topaz: '#5ec0f0', citrine: '#f5ab2e', pink: '#e8629f', clear: '#eef3fb',
  turquoise: '#2db6a8', agate: '#a32e1e', onyx: '#17171c', coral: '#dd4a3a', lapis: '#2347b0', tigereye: '#8a5a1c', pearl: '#f2ebe0', amber: '#d8851a', silver: '#c8cfdb',
  black: '#1c2434', navy: '#27498a', white: '#f1ede2', green: '#2a6a54', champagne: '#d9c9a4',
  'leather-black': '#17140f', 'leather-brown': '#5b3416', 'leather-tan': '#9a6a3a', 'leather-green': '#1b3a2d', 'leather-navy': '#14223f', 'leather-burgundy': '#4a1420', 'leather-grey': '#3a3d44', 'tassel-black': '#1b1d24', 'tassel-burgundy': '#5a1020', 'tassel-navy': '#1a2a4a', 'tassel-ivory': '#e8e0d0', 'tassel-silver': '#c8cfdb'
};

export const DEF = {
  ring: { style: 'solitaire', gem: 'sapphire', cut: 'round', size: 'm', thick: 'classic', finish: 'polish', pattern: 'smooth', side: 'none', glyph: 'M', ringSize: '56', inside: '', note: '' },
  watch: { dial: 'navy', strap: 'silver', size: '40', finish: 'polish', bezel: 'none', brand: 'MOHAMMED', back: '', note: '' },
  beads: { bead: 'amber', count: '33', tassel: 'silver', cap: '', note: '' }
};
/* حقول لا تغيّر المجسّم (فلا نُعيد بناءه عند تغييرها) */
export const NO3D = ['inside', 'ringSize', 'note', 'back', 'cap'];

const HEAD_CUT = ['solitaire', 'halo', 'trilogy', 'bezel', 'cluster'];
const faceted = ['amethyst', 'sapphire', 'emerald', 'ruby', 'topaz', 'citrine', 'pink', 'clear'], cabo = ['turquoise', 'agate', 'onyx', 'coral', 'lapis', 'tigereye', 'pearl'];
/* type: chips | sw (دوائر ألوان) | text | area | select */
export const GROUPS = {
  ring: [
    { k: 'style', l: 'g_style', type: 'chips', opts: ['solitaire', 'halo', 'trilogy', 'bezel', 'cluster', 'eternity', 'signet', 'band'], n: 'rs_' },
    { k: 'gem', l: 'g_stone', type: 'sw', opts: [...faceted, ...cabo], n: 'gem_', show: (c) => c.style !== 'signet' },
    { k: 'cut', l: 'g_cut', type: 'chips', opts: ['round', 'oval', 'emerald', 'cabochon'], n: 'cut_', show: (c) => HEAD_CUT.includes(c.style) },
    { k: 'size', l: 'g_size', type: 'chips', opts: ['s', 'm', 'l'], n: 'sz_' },
    { k: 'thick', l: 'g_thick', type: 'chips', opts: ['light', 'classic', 'heavy'], n: 'th_' },
    { k: 'finish', l: 'g_finish', type: 'chips', opts: ['polish', 'satin', 'antique'], n: 'fn_' },
    { k: 'pattern', l: 'g_pattern', type: 'chips', opts: ['smooth', 'lines', 'chevron', 'hammer'], n: 'pt_' },
    { k: 'side', l: 'g_side', type: 'chips', opts: ['none', 'clear', 'match'], n: 'sd_', show: (c) => c.style !== 'eternity' && c.style !== 'band' },
    { k: 'glyph', l: 'g_glyph', type: 'text', max: 4, ph: 'ph_glyph', h: 'h_glyph', show: (c) => c.style === 'signet' },
    { k: 'ringSize', l: 'o_size', type: 'select', opts: ['50', '52', '54', '56', '58', '60', '62', '64', '66'] },
    { k: 'inside', l: 'g_inside', type: 'text', max: 20, ph: 'ph_inside' },
    { k: 'note', l: 'l_note', type: 'area', ph: 'ph_note', h: 'h_note' }
  ],
  watch: [
    { k: 'dial', l: 'g_dial', type: 'sw', opts: ['black', 'navy', 'white', 'green', 'champagne'], n: 'd_' },
    { k: 'strap', l: 'g_strap', type: 'sw', opts: ['silver', 'leather-black', 'leather-brown', 'leather-tan', 'leather-green', 'leather-navy', 'leather-burgundy', 'leather-grey'], n: 'st_', nf: (v) => v.replace('leather-', '') },
    { k: 'size', l: 'g_wsize', type: 'chips', opts: ['36', '40', '44'], raw: (v) => v + ' mm' },
    { k: 'finish', l: 'g_case', type: 'chips', opts: ['polish', 'satin', 'antique'], n: 'fn_' },
    { k: 'bezel', l: 'g_bezel', type: 'chips', opts: ['none', 'clear', 'sapphire', 'ruby', 'emerald'], n: 'bz_' },
    { k: 'brand', l: 'g_brand', type: 'text', max: 10, ph: 'ph_brand', h: 'h_brand' },
    { k: 'back', l: 'g_back', type: 'text', max: 24, ph: 'ph_back' },
    { k: 'note', l: 'l_note', type: 'area', ph: 'ph_note', h: 'h_note' }
  ],
  beads: [
    { k: 'bead', l: 'g_bead', type: 'sw', opts: ['amber', 'onyx', 'silver', 'tigereye', 'turquoise', 'coral', 'pearl', 'lapis', 'agate', 'emerald'], n: 'b_' },
    { k: 'count', l: 'g_count', type: 'chips', opts: ['33', '66', '99'], n: 'cnt_' },
    { k: 'tassel', l: 'g_tassel', type: 'sw', opts: ['silver', 'black', 'burgundy', 'navy', 'ivory'], n: 'ts_', color: (v) => SW['tassel-' + v] },
    { k: 'cap', l: 'g_cap', type: 'text', max: 20, ph: 'ph_cap' },
    { k: 'note', l: 'l_note', type: 'area', ph: 'ph_note', h: 'h_note' }
  ]
};
export const visible = (tab, cfg) => GROUPS[tab].filter((g) => !g.show || g.show(cfg));
export const optName = (g, v, t) => (g.raw ? g.raw(v) : g.n ? t(g.n + (g.nf ? g.nf(v) : v)) : v);
export const swColor = (g, v) => (g.color ? g.color(v) : SW[v] || '#888');

/* ---- تقدير السعر (ليرة) ---- */
const STYLE_P = { solitaire: 1500, halo: 2100, trilogy: 2600, bezel: 1450, cluster: 2050, eternity: 2850, signet: 1750, band: 1150 };
const STONE_P = { amethyst: 300, citrine: 300, topaz: 350, pink: 550, sapphire: 950, ruby: 1050, emerald: 1250, clear: 250, turquoise: 250, agate: 150, onyx: 120, coral: 420, lapis: 320, tigereye: 200, pearl: 520 };
const BEAD_P = { amber: 3850, onyx: 2950, silver: 6750, tigereye: 3450, turquoise: 3950, coral: 4350, pearl: 5200, lapis: 3700, agate: 3200, emerald: 5600 };
const r50 = (n) => Math.round(n / 50) * 50;
export function price(tab, c) {
  if (tab === 'ring') {
    const k = { s: .7, m: 1, l: 1.5 }[c.size] || 1, cut = { round: 1, oval: 1.05, emerald: 1.15, cabochon: .9 }[c.cut] || 1;
    const stoneP = c.style === 'signet' ? 0 : (STONE_P[c.gem] || 300) * k * (HEAD_CUT.includes(c.style) ? cut : 1) * (c.style === 'eternity' ? 1.9 : c.style === 'cluster' ? 1.4 : c.style === 'trilogy' ? 1.8 : c.style === 'band' ? .4 : 1);
    return r50((STYLE_P[c.style] || 1500) + stoneP + ({ light: 0, classic: 250, heavy: 600 }[c.thick] || 0) + (c.finish === 'antique' ? 120 : 0) + ({ smooth: 0, lines: 100, chevron: 160, hammer: 160 }[c.pattern] || 0) + ({ none: 0, clear: 450, match: 700 }[c.side] || 0) + (c.style === 'signet' ? [0, 0, 90, 140, 200][Math.min(4, (c.glyph || '').length)] : 0));
  }
  if (tab === 'watch') return r50(6900 + (c.strap === 'silver' ? 3600 : 0) + ({ 36: -300, 40: 0, 44: 400 }[c.size] || 0) + (c.finish === 'antique' ? 150 : 0) + ({ none: 0, clear: 1200, sapphire: 1900, ruby: 1900, emerald: 1900 }[c.bezel] || 0));
  return r50((BEAD_P[c.bead] || 3500) * ({ 33: 1, 66: 1.7, 99: 2.3 }[c.count] || 1) + (c.tassel === 'silver' ? 350 : 0));
}

/* ---- سطور الملخّص: [اسم الحقل, القيمة] بلغة الزائر ---- */
export function lines(tab, c, t) {
  const out = [], nm = (g, v) => optName(g, v, t);
  visible(tab, c).forEach((g) => {
    if (g.type === 'area' && !c[g.k]) return; if (g.type === 'text' && !c[g.k]) return;
    if (g.k === 'bezel' && c[g.k] === 'none') return;
    out.push([t(g.l), g.type === 'chips' || g.type === 'sw' ? nm(g, c[g.k]) : c[g.k]]);
  });
  return out;
}
export const summary = (tab, c, t) => lines(tab, c, t).filter(([, v]) => v).slice(0, 6).map(([, v]) => String(v).replace(' · ', ' ')).join(' · ');
