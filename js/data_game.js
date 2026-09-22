'use strict';
/* ============ 題型 ============ */
const CATS = {
  '字音': { color: '#d0503a', desc: '讀音辨識' }, '字形': { color: '#d07a1a', desc: '錯別字辨正' },
  '詞義': { color: '#a88a10', desc: '詞語意義與運用' }, '成語': { color: '#3e9830', desc: '成語意義與典故' },
  '修辭': { color: '#1a8e90', desc: '修辭技巧' }, '文言': { color: '#2a60b8', desc: '文言文字詞與文意' },
  '詩詞': { color: '#6a48b8', desc: '古典詩詞曲' }, '常識': { color: '#b03a88', desc: '國學與文學常識' },
  '閱讀': { color: '#4a5a70', desc: '閱讀理解' },
};
const ALL_CATS = Object.keys(CATS);
const catColor = c => (CATS[c] || { color: '#707888' }).color;
const chip = c => `<span class="chip" style="background:${catColor(c)}">${esc(c)}</span>`;

/* ============ 五行屬性：金剋木、木剋土、土剋水、水剋火、火剋金 ============ */
const ELEM = { 金: '#c8a020', 木: '#3e9830', 水: '#2a78c8', 火: '#d8403a', 土: '#9a6a3a' };
const CAT_EL = { '字音': '金', '字形': '金', '詞義': '木', '成語': '木', '修辭': '水', '閱讀': '水', '詩詞': '火', '文言': '土', '常識': '土' };
const KE = { 金: '木', 木: '土', 土: '水', 水: '火', 火: '金' };            // A 剋 KE[A]
const KE_BY = Object.fromEntries(Object.entries(KE).map(([a, b]) => [b, a])); // 被誰剋
const elOfCats = cats => cats.length >= ALL_CATS.length ? null : CAT_EL[cats[0]];
const elChip = e => e ? `<span class="chip el" style="background:${ELEM[e]}">${e}</span>` : '<span class="chip el" style="background:#707888">無</span>';
const catsOfEl = e => ALL_CATS.filter(c => CAT_EL[c] === e);
function elEffect(a, d) { if (!a || !d) return 1; if (KE[a] === d) return 1.5; if (KE[d] === a) return 0.7; return 1; }

/* ============ 武器系統（30 種 × 3 世界名稱）============
   同一列是同一種武器在三個世界的名稱，轉生時依此轉換。
   欄位：代號、擅長題型、最早出現章節、必殺技、[國中, 圖示]、[文人, 圖示]、[俠客, 圖示]、主色 */
const CAT_SKILLS = {
  '字音': ['辨音', '聲韻', '四聲迴旋', '正音天籟'], '字形': ['點畫', '辨形', '筆走龍蛇', '一字千金'],
  '詞義': ['釋詞', '據典', '字字珠璣', '詞鋒如刃'], '成語': ['引經', '典故', '妙語連珠', '成語連環'],
  '修辭': ['譬喻', '轉化', '誇飾', '排比連擊'], '文言': ['誦古', '解經', '之乎者也', '文以載道'],
  '詩詞': ['吟詠', '對仗', '詩情畫意', '千古絕唱'], '常識': ['博聞', '強記', '融會貫通', '學富五車'],
  '閱讀': ['細讀', '精讀', '一目十行', '洞若觀火'],
};
const WEAPON_TABLE = [
  ['brush', ['字形', '字音'], 1, '力透紙背', ['自動鉛筆', 'pen'], ['狼毫筆', 'pen'], ['判官筆', 'pen'], '#f0c040'],
  ['tome', ['成語', '詞義'], 1, '出口成章', ['成語字典', 'book'], ['竹簡', 'book'], ['青鋒劍', 'sword'], '#5a88c8'],
  ['scroll', ['文言', '詩詞'], 1, '氣壯山河', ['國文課本', 'book'], ['玉笛', 'flute'], ['七弦琴', 'zither'], '#3a8a58'],
  ['fan', ['修辭'], 1, '妙筆生花', ['彩色螢光筆', 'pen'], ['宣紙扇', 'fan'], ['鐵骨扇', 'fan'], '#f070b0'],
  ['seal', ['常識', '閱讀'], 1, '真知灼見', ['放大鏡', 'lens'], ['端硯', 'block'], ['袖裡箭', 'dagger'], '#d8a030'],
  ['ruler', ['字形'], 1, '規矩方圓', ['直尺', 'ruler'], ['鎮紙', 'block'], ['鐵尺', 'ruler'], '#e8c070'],
  ['eraser', ['字形'], 1, '去蕪存菁', ['橡皮擦', 'block'], ['刮刀', 'dagger'], ['飛刀', 'dagger'], '#f0a0a0'],
  ['zhuyin', ['字音'], 1, '字正腔圓', ['注音卡', 'card'], ['韻書', 'book'], ['銅鈴', 'bell'], '#e87a50'],
  ['bell', ['字音'], 2, '餘音繞樑', ['上課鐘', 'bell'], ['編鐘', 'bell'], ['鐃鈸', 'orb'], '#c89a30'],
  ['dict', ['詞義'], 2, '一字一珠', ['國語辭典', 'book'], ['爾雅', 'book'], ['鐵棍', 'stick'], '#b83a3a'],
  ['notebook', ['詞義'], 2, '言簡意賅', ['筆記本', 'book'], ['手札', 'card'], ['峨眉刺', 'dagger'], '#58b0a0'],
  ['idiom', ['成語'], 2, '引經據典', ['成語卡', 'card'], ['酒令籌', 'stick'], ['梅花鏢', 'star'], '#4ea838'],
  ['chess', ['成語'], 2, '運籌帷幄', ['跳棋', 'orb'], ['圍棋', 'orb'], ['流星錘', 'orb'], '#303848'],
  ['marker', ['修辭'], 3, '繪聲繪影', ['麥克筆', 'pen'], ['丹青筆', 'pen'], ['雙鉤', 'dagger'], '#8a58c8'],
  ['mic', ['修辭'], 3, '擲地有聲', ['麥克風', 'mic'], ['洞簫', 'flute'], ['鐵笛', 'flute'], '#5a6a80'],
  ['compass', ['常識'], 3, '規行矩步', ['圓規', 'compass'], ['羅盤', 'orb'], ['九節鞭', 'whip'], '#a0a8b8'],
  ['globe', ['常識'], 3, '包羅萬象', ['地球儀', 'globe'], ['渾天儀', 'ring'], ['乾坤圈', 'ring'], '#3a90d0'],
  ['glasses', ['閱讀'], 3, '明察秋毫', ['眼鏡', 'glasses'], ['燈籠', 'lamp'], ['夜明珠', 'orb'], '#6a5a4a'],
  ['bookmark', ['閱讀'], 3, '手不釋卷', ['書籤', 'card'], ['玉書籤', 'card'], ['令牌', 'tablet'], '#48b878'],
  ['poemcard', ['詩詞'], 4, '字字珠璣', ['詩詞卡', 'card'], ['詩箋', 'scroll'], ['琵琶', 'pipa'], '#c85a8a'],
  ['lamp', ['詩詞'], 4, '秉燭夜遊', ['檯燈', 'lamp'], ['宮燈', 'lamp'], ['火摺子', 'stick'], '#e85a3a'],
  ['classic', ['文言'], 4, '溫故知新', ['古文觀止', 'book'], ['四書', 'book'], ['武學秘笈', 'book'], '#7a5a3a'],
  ['maobi', ['文言'], 4, '文以載道', ['毛筆', 'pen'], ['紫毫筆', 'pen'], ['太極劍', 'sword'], '#2a2a34'],
  ['chalk', ['字形', '詞義'], 4, '板上釘釘', ['粉筆', 'pen'], ['硃砂筆', 'pen'], ['鐵筆', 'pen'], '#f0f0e8'],
  ['whistle', ['字音', '修辭'], 4, '一鳴驚人', ['哨子', 'whistle'], ['竹哨', 'whistle'], ['鐵哨', 'whistle'], '#e0b040'],
  ['abacus', ['常識', '成語'], 5, '神機妙算', ['計算機', 'tablet'], ['算盤', 'abacus'], ['鐵算盤', 'abacus'], '#8a5a2a'],
  ['palette', ['詩詞', '修辭'], 5, '詩中有畫', ['水彩盤', 'orb'], ['畫軸', 'scroll'], ['方天畫戟', 'stick'], '#e89040'],
  ['tablet', ['閱讀', '文言'], 5, '博古通今', ['平板電腦', 'tablet'], ['石碑拓本', 'tablet'], ['鐵碑', 'tablet'], '#4a5a70'],
  ['trophy', ['閱讀', '常識', '文言'], 5, '獨占鰲頭', ['獎盃', 'cup'], ['金榜', 'card'], ['盟主令', 'tablet'], '#e0b030'],
  ['legend', ALL_CATS, 5, '文曲天降', ['金牌鋼筆', 'pen'], ['松煙古墨', 'block'], ['龍泉劍', 'sword'], '#e8c040'],
];
/* 守護神器（彩色，只能由劇情取得）：每個世界兩件，依劇情選擇而不同，各有特殊能力 */
const GUARDIANS = {
  g_school_a: { world: 'school', name: '傳承之筆', shape: 'pen', col: '#f8d040', ult: '薪火相傳', passive: 'shield' },
  g_school_b: { world: 'school', name: '榮耀獎盃', shape: 'cup', col: '#f0c030', ult: '金榜題名', passive: 'spring' },
  g_literati_a: { world: 'literati', name: '知音琴', shape: 'zither', col: '#c8905a', ult: '高山流水', passive: 'eye' },
  g_literati_b: { world: 'literati', name: '春秋筆', shape: 'pen', col: '#b8322a', ult: '微言大義', passive: 'bane' },
  g_wuxia_a: { world: 'wuxia', name: '俠義令', shape: 'tablet', col: '#d8a030', ult: '俠之大者', passive: 'regen' },
  g_wuxia_b: { world: 'wuxia', name: '孤鴻劍', shape: 'sword', col: '#c8d8f0', ult: '孤鴻影落', passive: 'retry' },
};
const PASSIVES = {
  shield: { name: '護心', desc: '每場戰鬥第一次被擊中時，傷害歸零。' },
  spring: { name: '文思泉湧', desc: '每場戰鬥開始時，文氣直接 +2。' },
  eye: { name: '慧眼', desc: '選擇題自動刪去一個錯誤選項。' },
  bane: { name: '破妄', desc: '對關主與魔王的傷害 ×1.5。' },
  regen: { name: '回春', desc: '每回合結束時恢復 8% 氣血。' },
  retry: { name: '再思', desc: '每場戰鬥第一次答錯時，可以重答一次。' },
};
const ARCH = {};
function skillsFor(cats) {
  if (cats.length >= ALL_CATS.length) return [['文心', cats, 55], ['雕龍', cats, 65], ['萬卷', cats, 80], ['天章', cats, 100]];
  const a = cats[0], b = cats[1] || cats[0], both = cats.slice(0, 3);
  return cats.length === 1
    ? [[CAT_SKILLS[a][0], [a], 40], [CAT_SKILLS[a][1], [a], 45], [CAT_SKILLS[a][2], [a], 60], [CAT_SKILLS[a][3], [a], 85]]
    : [[CAT_SKILLS[a][0], [a], 40], [CAT_SKILLS[b][0], [b], 40], [CAT_SKILLS[a][2], both, 60], [CAT_SKILLS[b][3], both, 85]];
}
for (const [key, cats, ch, ult, sc, li, wu, col] of WEAPON_TABLE)
  ARCH[key] = { cats, ch, ult, col, names: { school: sc[0], literati: li[0], wuxia: wu[0] }, shapes: { school: sc[1], literati: li[1], wuxia: wu[1] }, skills: skillsFor(cats) };
for (const [key, g] of Object.entries(GUARDIANS))
  ARCH[key] = { cats: ALL_CATS, ch: 9, ult: g.ult, col: g.col, guardian: true, passive: g.passive, names: { school: g.name, literati: g.name, wuxia: g.name }, shapes: { school: g.shape, literati: g.shape, wuxia: g.shape },
    skills: [['守護', ALL_CATS, 70], ['神威', ALL_CATS, 80], ['天啟', ALL_CATS, 95], ['永恆', ALL_CATS, 110]] };
const ARCH_ORDER = WEAPON_TABLE.map(r => r[0]);
const STARTER_ARCHS = ['brush', 'tome', 'scroll'];
const weaponDesc = a => (W.weapons && W.weapons[a] && W.weapons[a][1]) || (ARCH[a].guardian ? `守護神器．特殊能力「${PASSIVES[ARCH[a].passive].name}」：${PASSIVES[ARCH[a].passive].desc}` : `擅長「${ARCH[a].cats.join('」「')}」題型的武器。`);
const MASTERY_STEPS = [0, 10, 25, 45];            // 熟練度門檻 → 武器 Lv1~4
const weaponLv = w => MASTERY_STEPS.filter(s => w.mastery >= s).length;
const weaponSkills = (arch, lv) => ARCH[arch].skills.slice(0, Math.min(4, lv + 1));
const archOf = x => typeof x === 'string' ? x : x.arch;
const weaponName = x => ARCH[archOf(x)].names[W.id];
const ULT_COST = 5;

/* ============ 稀有度 ============
   凡品(白) → 良品(綠) → 精品(藍) → 珍品(紫) → 絕品(金) → 神品(紅)；守護神器(彩) 只能由劇情取得。 */
const RARITY = [
  { n: '凡品', c: '#c8c8c8' }, { n: '良品', c: '#3fae4a' }, { n: '精品', c: '#3a78d8' }, { n: '珍品', c: '#9a4ad8' },
  { n: '絕品', c: '#e0a820' }, { n: '神品', c: '#d83a3a' }, { n: '守護神器', c: 'rainbow' }];
const MERGE_N = [3, 3, 4, 4, 5];   // 升階所需同名同階武器數：白→綠 3、綠→藍 3、藍→紫 4、紫→金 4、金→紅 5
const FRAG_N = 5;                   // 碎片合成一件凡品武器所需數量
const FRAG_RATE = 0.45;             // 打倒武器怪掉落碎片的機率
const RAR_ATK = [0, 2, 4, 7, 10, 14, 20], RAR_POW = [1, 1.1, 1.2, 1.35, 1.5, 1.7, 2];
const RAR_BONUS = ['', '答對時熟練度額外 +1', '剋制屬性時威力 +15%', '答對時恢復 3% 氣血', '剋制屬性時文氣額外 +1', '被剋制時威力不降低'];
const bonusList = r => RAR_BONUS.slice(1, Math.min(r, 5) + 1);
const newWeapon = (arch, r = 0) => ({ id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), arch, r, mastery: 0 });
const wById = id => G.weapons.find(w => w.id === id);
const curW = () => wById(G.equip[G.cur]);
const rarChip = r => `<span class="rchip r${r}">${RARITY[r].n}</span>`;

/* ============ 野生怪物：武器幻化的「武器妖」 ============
   詞靈附在武器上幻化成Ｑ版小妖。打倒後有機率掉落碎片，集滿可合成該武器。
   出招時會用自己武器擅長的題型出「防禦題」。 */
function monInfo(arch) {   // 怪物屬性＝其武器擅長題型的五行；弱點＝剋它的屬性
  const c0 = ARCH[arch].cats[0], i = ALL_CATS.indexOf(c0), el = elOfCats(ARCH[arch].cats) || '金';
  return { el, weak: catsOfEl(KE_BY[el]), resist: catsOfEl(KE[el]), base: { hp: 42 + (i % 3) * 3, atk: 46 + (i % 4) * 2, def: 40 + (i % 3) * 2 } };
}

/* ============ 道具（名稱依世界觀而不同，見 WORLDS.items） ============ */
const ITEMS = {
  heal: { price: 80, desc: '恢復 30 點氣血。', use: 'heal', val: 30 },
  heal2: { price: 200, desc: '恢復 80 點氣血。', use: 'heal', val: 80 },
  wenqi: { price: 150, desc: '文氣增加 2 格。', use: 'wenqi', val: 2 },
  hint: { price: 120, desc: '答選擇題時使用，刪去兩個錯誤選項。', use: 'hint' },
};
const ITEM_ORDER = ['heal', 'heal2', 'wenqi', 'hint'];
const itemName = id => W.items[id];

/* ============ 數值 ============ */
function playerStats() {
  const lv = G.lv, w = G.weapons && G.equip.length ? curW() : null;
  G.maxhp = 28 + lv * 6; G.atk = 7 + lv * 2 + (w ? (weaponLv(w) - 1) * 2 + RAR_ATK[w.r] : 0); G.def = 6 + lv * 2;
  if (G.hp == null || G.hp > G.maxhp) G.hp = G.maxhp;
}
const expNeed = lv => lv * 10 + 10;
const monName = arch => (W.monsters && W.monsters[arch]) || ARCH[arch].names[W.id] + W.monSuffix;
function makeFoe(arch, lv) {
  const M = monInfo(arch), b = M.base;
  const f = { kind: 'mon', sp: arch, lv, name: monName(arch), el: M.el, weak: M.weak, resist: M.resist,
    moves: ARCH[arch].skills.slice(0, 2).map(([n, cats], i) => ({ name: n, cats, pow: i ? 45 : 35 })),
    maxhp: Math.floor(b.hp * lv / 25) + lv + 12, atk: Math.floor(b.atk * lv / 25) + 6, def: Math.floor(b.def * lv / 25) + 6, exp: lv * 6 };
  f.hp = f.maxhp; return f;
}
function makePersonFoe(R) {
  const F = R.foe, lv = F.lv + (G.ng || 0) * 4;
  const el = F.el || (F.weak && F.weak.length ? KE[CAT_EL[F.weak[0]]] : '土');   // 人物的屬性：由弱點題型推回
  const f = { kind: 'person', look: R.look, name: R.name, lv, el, weak: catsOfEl(KE_BY[el]), resist: catsOfEl(KE[el]),
    moves: F.moves.map(([name, cats, pow]) => ({ name, cats, pow })),
    maxhp: Math.floor((12 + lv * 3.5) * (F.hpMul || 1)), atk: Math.floor(5 + lv * 1.6), def: Math.floor(4 + lv * 1.5), exp: Math.floor(lv * 9 * (F.hpMul || 1)) };
  f.hp = f.maxhp; return f;
}

/* ============ 地圖版型（三個世界共用；外觀由世界主題決定） ============
   . 草地  , 道路  g 草叢  T 樹  ~ 水  # 牆  W 窗  D 門  R 屋頂  = 柵欄  S 告示牌  F 花  L 燈  ^ 岩石 */
const SOLID = new Set(['T', '#', 'W', 'D', 'R', '~', '=', 'S', 'L', '^', 'X', 'w', 'b', 't', 'k', 'p']);
const LAYOUTS = {
  town1: { music: 'town', qlv: 1, chapter: 1,
    rows: [
      'TTTTTTTTTTT,,TTTTTTTTTTT',
      'T.....F....,,....RRRRR.T',
      'T..RRRRR...,,....RRRRR.T',
      'T..RRRRR...,,....#W#W#.T',
      'T..#W#D#...,,....##D##.T',
      'T.....,....,,......,...T',
      'T.....,,,,,,,,,,,,,,...T',
      'T..F........,.........FT',
      'T...........,..........T',
      'T.RRRR......,....RRRRR.T',
      'T.RRRR......,....RRRRR.T',
      'T.#D#W....S.,....#W#D#.T',
      'T..,........,.......,..T',
      'T..,,,,,,,,,,,,,,,,,,..T',
      'T..FF.......,.......FF.T',
      'T...........,..........T',
      'T~~~~~......,..........T',
      'TTTTTTTTTTTTTTTTTTTTTTTT'],
    warps: [{ x: 11, y: 0, to: 'route1', tx: 8, ty: 22, dir: 'up' }, { x: 12, y: 0, to: 'route1', tx: 9, ty: 22, dir: 'up' }],
    gates: { '11,0': 'needWeapon', '12,0': 'needWeapon' },
    doors: { '19,4': 'hall1' },
    doorWarps: { '6,4': { to: 'home', tx: 4, ty: 5, dir: 'up', ret: { x: 6, y: 5 } }, '3,11': { to: 'clinic', tx: 4, ty: 5, dir: 'up', ret: { x: 3, y: 12 } }, '20,11': { to: 'store', tx: 4, ty: 5, dir: 'up', ret: { x: 20, y: 12 } } },
    signs: { '10,11': 'sign_town1' },
    npcs: [{ role: 'mentor', x: 13, y: 8, dir: 'down' }, { role: 'tip1', x: 7, y: 14, dir: 'down', wander: 1 }, { role: 'tip2', x: 16, y: 7, dir: 'left', wander: 1 }, { role: 'tip6', x: 19, y: 5, dir: 'down' }],
    shop: ['heal', 'heal2', 'wenqi', 'hint'] },
  route1: { music: 'route', qlv: 2, chapter: 1,
    rows: [
      'TTTTTTTT,,TTTTTTTTTT',
      'T.......,,.........T',
      'T.gggg..,,.gggggg..T',
      'T.gggg..,,.gggggg..T',
      'T.gggg..,,.gggggg..T',
      'T.......,,.........T',
      'TTTT....,,.....TTTTT',
      'T.......,,.........T',
      'T..ggggg,,gggg.....T',
      'T..ggggg,,gggg..S..T',
      'T..ggggg,,gggg.....T',
      'T.......,,.........T',
      'T.======,,======...T',
      'T.......,,.........T',
      'T~~~~...,,...gggg..T',
      'T~~~~...,,...gggg..T',
      'T~~~~...,,...gggg..T',
      'T.......,,.........T',
      'TTTTTT..,,..TTTTTTTT',
      'T.......,,.........T',
      'T.gggggggggggggggg.T',
      'T.gggggggggggggggg.T',
      'T.......,,.........T',
      'TTTTTTTT,,TTTTTTTTTT'],
    warps: [{ x: 8, y: 23, to: 'town1', tx: 11, ty: 1, dir: 'down' }, { x: 9, y: 23, to: 'town1', tx: 12, ty: 1, dir: 'down' },
      { x: 8, y: 0, to: 'town2', tx: 11, ty: 16, dir: 'up' }, { x: 9, y: 0, to: 'town2', tx: 12, ty: 16, dir: 'up' }],
    signs: { '16,9': 'sign_route1' },
    npcs: [{ role: 'trainerA', x: 5, y: 7, dir: 'right', sight: 4 }, { role: 'trainerB', x: 14, y: 19, dir: 'left', sight: 6 }, { role: 'questGiver', x: 12, y: 13, dir: 'down' },
      { role: 'rival', x: 10, y: 5, dir: 'left', sight: 2 }, { role: 'trainerC', x: 3, y: 13, dir: 'right', sight: 5 }],
    chests: [{ id: 'r1a', x: 17, y: 2, weapon: 'fan', r: 1 }, { id: 'r1b', x: 2, y: 17, items: { heal: 3, hint: 2 }, frags: { tome: 2, scroll: 2 } }],
    foes: { n: 11, lv: [3, 6], list: [{ sp: 'brush', w: 3 }, { sp: 'tome', w: 3 }, { sp: 'scroll', w: 3 }, { sp: 'ruler', w: 2 }, { sp: 'eraser', w: 2 }, { sp: 'zhuyin', w: 2 }, { sp: 'fan', w: 1 }] } },
  town2: { music: 'town', qlv: 2, chapter: 1,
    rows: [
      'TTTTTTTTTTT,,TTTTTTTTTTT',
      'T..........,,..........T',
      'T.RRRRR....,,....RRRRR.T',
      'T.RRRRR....,,....RRRRR.T',
      'T.##D##....,,....##D##.T',
      'T...,......,,......,...T',
      'T...,,,,,,,,,,,,,,,,...T',
      'T.F........,,........F.T',
      'T..........,,..........T',
      'T.RRRR.....,,.....RRRR.T',
      'T.RRRR.....,,.....RRRR.T',
      'T.#D#W..S..,,.....W#D#.T',
      'T..,.......,,.......,..T',
      'T..,,,,,,,,,,,,,,,,,,..T',
      'T.F........,,.......FF.T',
      'T..........,,..........T',
      'T..........,,..........T',
      'TTTTTTTTTTT,,TTTTTTTTTTT'],
    warps: [{ x: 11, y: 17, to: 'route1', tx: 8, ty: 1, dir: 'down' }, { x: 12, y: 17, to: 'route1', tx: 9, ty: 1, dir: 'down' }],
    gates: { '11,0': 'trialEnd', '12,0': 'trialEnd' },
    doors: { '19,4': 'hall2' },
    doorWarps: { '4,4': { to: 'gym1', tx: 5, ty: 8, dir: 'up' }, '3,11': { to: 'clinic', tx: 4, ty: 5, dir: 'up', ret: { x: 3, y: 12 } }, '20,11': { to: 'store', tx: 4, ty: 5, dir: 'up', ret: { x: 20, y: 12 } } },
    signs: { '8,11': 'sign_town2' },
    npcs: [{ role: 'gymguide', x: 5, y: 5, dir: 'down' }, { role: 'locked2', x: 19, y: 5, dir: 'down' }, { role: 'guard', x: 13, y: 1, dir: 'left' },
      { role: 'tip4', x: 8, y: 8, dir: 'down', wander: 1 }, { role: 'tip5', x: 16, y: 15, dir: 'up', wander: 1 }, { role: 'smith', x: 15, y: 8, dir: 'down' },
      { role: 'rivalA', x: 9, y: 12, dir: 'down', route: 'a' }],
    shop: ['heal', 'heal2', 'wenqi', 'hint'] },
  /* 室內：_ 地板  w 牆  b 床  t 桌子／櫃檯  k 書櫃  p 盆栽  r 地毯；出口回到進來的地方 */
  home: { music: 'town', qlv: 1, chapter: 1, indoor: 1,
    rows: ['wwwwwwwwww', 'wkk____pbw', 'w_______bw', 'w__tt____w', 'w__tt__r_w', 'wp_______w', 'wwww__wwww'],
    warps: [{ x: 4, y: 6, to: '@ret' }, { x: 5, y: 6, to: '@ret' }],
    npcs: [{ role: 'homeNpc', x: 6, y: 3, dir: 'down' }] },
  clinic: { music: 'town', qlv: 1, chapter: 1, indoor: 1,
    rows: ['wwwwwwwwww', 'wb_kkk__bw', 'w________w', 'wtttt____w', 'w________w', 'wp______pw', 'wwww__wwww'],
    warps: [{ x: 4, y: 6, to: '@ret' }, { x: 5, y: 6, to: '@ret' }],
    npcs: [{ role: 'healer', x: 2, y: 2, dir: 'down' }] },
  store: { music: 'town', qlv: 1, chapter: 1, indoor: 1,
    rows: ['wwwwwwwwww', 'wkkkk_kkkw', 'w________w', 'w__ttt___w', 'w________w', 'wp__rr__pw', 'wwww__wwww'],
    warps: [{ x: 4, y: 6, to: '@ret' }, { x: 5, y: 6, to: '@ret' }],
    npcs: [{ role: 'clerk', x: 4, y: 2, dir: 'down' }] },
  gym1: { music: 'hall', qlv: 2, chapter: 1, indoor: 1,
    rows: [
      '##WW####WW##',
      '#L,,,,,,,,L#',
      '#,,,,,,,,,,#',
      '#,,F,,,,F,,#',
      '#,,,,,,,,,,#',
      '#L,,,,,,,,L#',
      '#,,,,,,,,,,#',
      '#,,,,,,,,,,#',
      '#,,,,,,,,,,#',
      '#####,,#####'],
    warps: [{ x: 5, y: 9, to: 'town2', tx: 4, ty: 5, dir: 'down' }, { x: 6, y: 9, to: 'town2', tx: 4, ty: 5, dir: 'down' }],
    npcs: [{ role: 'gym1', x: 5, y: 2, dir: 'down' }, { role: 'rivalB', x: 8, y: 7, dir: 'left', route: 'b' }] },
};
