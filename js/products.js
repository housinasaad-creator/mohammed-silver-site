/*
  كتالوج متجر محمد (نموذج تجريبي: العلامة والمنتجات والأسعار خيالية). الأسعار بالليرة التركية.
  spec = وصف القطعة لأداة التصوير (tools/studio.html) التي تنتج صورتي كل منتج (a, b) بإضاءة استوديو.
*/
export const CATS = ['watch', 'ring', 'pendant', 'necklace', 'tasbih'];

export const GEMN = {
  amethyst: { tr: 'Ametist', en: 'Amethyst', ar: 'أميثيست' }, sapphire: { tr: 'Safir', en: 'Sapphire', ar: 'ياقوت أزرق' }, emerald: { tr: 'Zümrüt', en: 'Emerald', ar: 'زمرد' },
  ruby: { tr: 'Yakut', en: 'Ruby', ar: 'ياقوت أحمر' }, turquoise: { tr: 'Firuze', en: 'Turquoise', ar: 'فيروز' }, agate: { tr: 'Akik', en: 'Agate (Aqeeq)', ar: 'عقيق' },
  amber: { tr: 'Kehribar', en: 'Amber', ar: 'كهرمان' }, onyx: { tr: 'Oniks', en: 'Onyx', ar: 'أونيكس' }, tigereye: { tr: 'Kaplan gözü', en: "Tiger's eye", ar: 'عين النمر' },
  coral: { tr: 'Mercan', en: 'Coral', ar: 'مرجان' }, silver: { tr: 'Gümüş', en: 'Silver', ar: 'فضة' }
};

/* [id, cat, spec, price(TL), {tr,en,ar} الاسم, gem/null] */
const P = (id, cat, spec, price, tr, en, ar, gem = null) => ({ id, cat, spec, price, name: { tr, en, ar }, gem });
export const PRODUCTS = [
  /* ساعات */
  P('watch-noir', 'watch', { cat: 'watch', dial: 'black', strap: 'leather-brown' }, 8950, 'Noir Deri Kordon', 'Noir · Leather Strap', 'نوار · سوار جلد'),
  P('watch-marine', 'watch', { cat: 'watch', dial: 'navy', strap: 'silver' }, 11500, 'Marine Gümüş Bilezik', 'Marine · Silver Bracelet', 'مارين · سوار فضة'),
  P('watch-blanc', 'watch', { cat: 'watch', dial: 'white', strap: 'leather-black' }, 7450, 'Blanc Siyah Deri', 'Blanc · Black Leather', 'بلان · جلد أسود'),
  P('watch-forest', 'watch', { cat: 'watch', dial: 'green', strap: 'leather-green' }, 9250, 'Forest Yeşil Kadran', 'Forest · Green Dial', 'فورست · ميناء أخضر'),
  P('watch-sable', 'watch', { cat: 'watch', dial: 'champagne', strap: 'leather-brown' }, 8250, 'Sable Şampanya', 'Sable · Champagne', 'سيبل · شمبانيا'),
  P('watch-onyx', 'watch', { cat: 'watch', dial: 'black', strap: 'silver' }, 12500, 'Onyx Gümüş Bilezik', 'Onyx · Silver Bracelet', 'أونيكس · سوار فضة'),
  /* خواتم */
  P('ring-amethyst', 'ring', { cat: 'ring', style: 'solitaire', gem: 'amethyst' }, 2450, 'Ametist Tek Taş Yüzük', 'Amethyst Solitaire Ring', 'خاتم أميثيست سوليتير', 'amethyst'),
  P('ring-sapphire', 'ring', { cat: 'ring', style: 'halo', gem: 'sapphire' }, 3200, 'Safir Halo Yüzük', 'Sapphire Halo Ring', 'خاتم ياقوت أزرق بهالة', 'sapphire'),
  P('ring-signet', 'ring', { cat: 'ring', style: 'signet', glyph: 'M' }, 2950, 'Mühür Yüzük', 'Signet Ring', 'خاتم ختم', null),
  P('ring-turquoise', 'ring', { cat: 'ring', style: 'cabochon', gem: 'turquoise' }, 1850, 'Firuze Taşlı Yüzük', 'Turquoise Cabochon Ring', 'خاتم فيروز', 'turquoise'),
  P('ring-agate', 'ring', { cat: 'ring', style: 'cabochon', gem: 'agate' }, 1650, 'Akik Yüzük', 'Agate (Aqeeq) Ring', 'خاتم عقيق', 'agate'),
  P('ring-emerald', 'ring', { cat: 'ring', style: 'trilogy', gem: 'emerald' }, 3650, 'Zümrüt Üçlü Yüzük', 'Emerald Trilogy Ring', 'خاتم ثلاثي زمرد', 'emerald'),
  P('ring-ruby', 'ring', { cat: 'ring', style: 'band', gem: 'ruby' }, 2150, 'Yakut Bant Yüzük', 'Ruby Band Ring', 'خاتم حلقة بياقوتة', 'ruby'),
  /* بلاكات */
  P('pend-name', 'pendant', { cat: 'pendant', shape: 'oval', text: 'محمد' }, 1450, 'Oval İsim Plakası', 'Oval Name Plate', 'بلاكة اسم بيضاوية'),
  P('pend-shield', 'pendant', { cat: 'pendant', shape: 'shield', text: 'M' }, 1750, 'Kalkan Kolye', 'Shield Pendant', 'بلاكة درع'),
  P('pend-bar', 'pendant', { cat: 'pendant', shape: 'bar', text: 'MOHAMMED' }, 1250, 'Bar İsim Kolye', 'Bar Name Pendant', 'بلاكة شريط باسمك'),
  P('pend-turquoise', 'pendant', { cat: 'pendant', shape: 'round', gem: 'turquoise', halo: true, text: '' }, 2250, 'Firuze Madalyon', 'Turquoise Medallion', 'ميدالية فيروز', 'turquoise'),
  P('pend-ruby', 'pendant', { cat: 'pendant', shape: 'tag', gem: 'ruby', text: '' }, 2650, 'Yakut Etiket Kolye', 'Ruby Tag Pendant', 'بلاكة مستطيلة بياقوتة', 'ruby'),
  P('pend-mashallah', 'pendant', { cat: 'pendant', shape: 'round', text: 'ما شاء الله' }, 1950, 'Maşallah Madalyon', 'Mashallah Medallion', 'ميدالية ما شاء الله'),
  /* طواق وسلاسل */
  P('chain-curb', 'necklace', { cat: 'chain', type: 'curb' }, 2250, 'Curb Zincir Kolye', 'Curb Chain Necklace', 'سلسلة كيرب فضة'),
  P('chain-figaro', 'necklace', { cat: 'chain', type: 'figaro' }, 2650, 'Figaro Zincir Kolye', 'Figaro Chain Necklace', 'سلسلة فيغارو فضة'),
  P('chain-ball', 'necklace', { cat: 'chain', type: 'ball' }, 1350, 'Top Zincir Kolye', 'Ball Chain Necklace', 'سلسلة كرات فضة'),
  P('chain-shield', 'necklace', { cat: 'chain', type: 'curb', pendant: { shape: 'shield', text: 'M' } }, 3150, 'Kalkan Madalyonlu Zincir', 'Chain with Shield Pendant', 'سلسلة مع بلاكة درع'),
  P('torc-rope', 'necklace', { cat: 'torc' }, 4950, 'Halat Gümüş Tasma', 'Braided Silver Torc', 'طوق فضة مجدول'),
  P('torc-gem', 'necklace', { cat: 'torc', gem: 'turquoise' }, 5650, 'Firuze Taşlı Tasma', 'Torc with Turquoise', 'طوق فضة بفيروزة', 'turquoise'),
  /* مسابح */
  P('tasbih-amber', 'tasbih', { cat: 'tasbih', bead: 'amber' }, 3850, 'Kehribar Tesbih', 'Amber Prayer Beads', 'مسبحة كهرمان', 'amber'),
  P('tasbih-onyx', 'tasbih', { cat: 'tasbih', bead: 'onyx' }, 2950, 'Oniks Tesbih', 'Onyx Prayer Beads', 'مسبحة أونيكس', 'onyx'),
  P('tasbih-silver', 'tasbih', { cat: 'tasbih', bead: 'silver', tassel: 'silver' }, 6750, 'Gümüş Tesbih', 'Silver Prayer Beads', 'مسبحة فضة', 'silver'),
  P('tasbih-tigereye', 'tasbih', { cat: 'tasbih', bead: 'tigereye' }, 3450, 'Kaplan Gözü Tesbih', "Tiger's Eye Prayer Beads", 'مسبحة عين النمر', 'tigereye'),
  P('tasbih-turquoise', 'tasbih', { cat: 'tasbih', bead: 'turquoise' }, 3950, 'Firuze Tesbih', 'Turquoise Prayer Beads', 'مسبحة فيروز', 'turquoise'),
  P('tasbih-coral', 'tasbih', { cat: 'tasbih', bead: 'coral' }, 4350, 'Mercan Tesbih', 'Coral Prayer Beads', 'مسبحة مرجان', 'coral')
];

/* وصف قصير يُركَّب من نوع القطعة والحجر (ثلاث لغات) */
export const MAT = { tr: '925 ayar gümüş', en: 'Sterling silver 925', ar: 'فضة عيار 925' };
export function describe(p, lang) {
  const g = p.gem ? GEMN[p.gem][lang] : null, m = MAT[lang];
  const T = {
    watch: { tr: `Gümüş kasa, otomatik görünümlü kadran ve ${p.spec.strap === 'silver' ? 'gümüş bilezik' : 'el dikişli deri kordon'}. Saniye ibresi gerçek bir saat gibi tık tık ilerler.`, en: `Silver case, sunburst dial and a ${p.spec.strap === 'silver' ? 'silver bracelet' : 'hand-stitched leather strap'}. The second hand ticks like the real thing.`, ar: `علبة فضية وميناء بإشعاع شمسي و${p.spec.strap === 'silver' ? 'سوار فضة' : 'سوار جلد مخيّط يدوياً'}. عقرب الثواني يدقّ كما في الساعة الحقيقية.` },
    ring: { tr: g ? `${m}, ${g} ile. Günlük kullanıma uygun, rahat kalıp.` : `${m}, kişiye özel harfle. Mat ve parlak yüzey birlikte.`, en: g ? `${m} set with ${g}. Comfortable fit for everyday wear.` : `${m} with a personal engraved letter. Matte and polished finish together.`, ar: g ? `${m} مرصّعة بـ${g}. مريحة للاستعمال اليومي.` : `${m} بحرف منقوش باسمك. سطح مطفي ولامع معاً.` },
    pendant: { tr: g ? `${m}, ${g} detaylı. Zincirle birlikte gelir.` : `${m}, isme özel kazıma. Zincirle birlikte gelir.`, en: g ? `${m} with ${g} detail. Comes with a chain.` : `${m} with a custom engraving. Comes with a chain.`, ar: g ? `${m} بتفصيل من ${g}. تأتي مع سلسلة.` : `${m} بنقش حسب الطلب. تأتي مع سلسلة.` },
    necklace: { tr: `${m}, ${g ? g + ' detaylı, ' : ''}ağır ve dengeli bir his. Kilidi güvenli.`, en: `${m}${g ? ' with ' + g : ''}, a heavy, balanced feel with a secure clasp.`, ar: `${m}${g ? ' مع ' + g : ''}، ثقل متوازن وقفل آمن.` },
    tasbih: { tr: `33 tane ${g}, gümüş ayırıcılar ve uzun imame. Elde zarif durur.`, en: `33 beads of ${g}, silver spacers and a long imame. Elegant in the hand.`, ar: `33 حبّة من ${g} مع فواصل فضية وإمامة طويلة. أنيقة في اليد.` }
  };
  return T[p.cat][lang];
}
