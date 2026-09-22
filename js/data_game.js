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

/* ============ 武器系統 ============
   六種武器「原型」，三個世界各有不同名稱與外觀。轉生時依原型自動轉換。
   武器等級由「熟練度」決定：用該武器答對題目就會增加。 */
const ARCH = {
  brush: { cats: ['字形', '字音'], skills: [['點畫', ['字形'], 40], ['聲韻', ['字音'], 40], ['筆走龍蛇', ['字形', '字音'], 60], ['一字千金', ['字形', '字音'], 85]], ult: '力透紙背' },
  tome: { cats: ['成語', '詞義'], skills: [['引經', ['成語'], 40], ['據典', ['詞義'], 40], ['妙語連珠', ['成語', '詞義'], 60], ['字字珠璣', ['成語', '詞義'], 85]], ult: '出口成章' },
  scroll: { cats: ['文言', '詩詞'], skills: [['吟詠', ['詩詞'], 40], ['誦古', ['文言'], 40], ['詩情畫意', ['詩詞', '文言'], 60], ['千古絕唱', ['詩詞', '文言'], 85]], ult: '氣壯山河' },
  fan: { cats: ['修辭'], skills: [['譬喻', ['修辭'], 45], ['轉化', ['修辭'], 50], ['誇飾', ['修辭'], 65], ['排比連擊', ['修辭'], 85]], ult: '妙筆生花' },
  seal: { cats: ['常識', '閱讀'], skills: [['博聞', ['常識'], 45], ['細讀', ['閱讀'], 45], ['融會貫通', ['常識', '閱讀'], 65], ['學富五車', ['常識', '閱讀'], 85]], ult: '洞若觀火' },
  legend: { cats: ALL_CATS, skills: [['文心', ALL_CATS, 55], ['雕龍', ALL_CATS, 65], ['萬卷', ALL_CATS, 80], ['天章', ALL_CATS, 100]], ult: '文曲天降' },
};
const ARCH_ORDER = ['brush', 'tome', 'scroll', 'fan', 'seal', 'legend'];
const STARTER_ARCHS = ['brush', 'tome', 'scroll'];
const MASTERY_STEPS = [0, 10, 25, 45];            // 熟練度門檻 → 武器 Lv1~4
const weaponLv = w => MASTERY_STEPS.filter(s => w.mastery >= s).length;
const weaponSkills = (arch, lv) => ARCH[arch].skills.slice(0, Math.min(4, lv + 1));
const archOf = x => typeof x === 'string' ? x : x.arch;
const weaponName = x => W.weapons[archOf(x)][0];
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
const newWeapon = (arch, r = 0) => ({ id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), arch, r, mastery: 0 });
const wById = id => G.weapons.find(w => w.id === id);
const curW = () => wById(G.equip[G.cur]);
const rarChip = r => `<span class="rchip r${r}">${RARITY[r].n}</span>`;

/* ============ 野生怪物：武器幻化的「武器妖」 ============
   詞靈附在武器上幻化成Ｑ版小妖。打倒後有機率掉落碎片，集滿可合成該武器。
   出招時會用自己武器擅長的題型出「防禦題」。 */
const MON = {
  brush: { base: { hp: 40, atk: 46, def: 38 }, weak: ['成語'], resist: ['字形'] },
  tome: { base: { hp: 48, atk: 44, def: 44 }, weak: ['詩詞'], resist: ['成語'] },
  scroll: { base: { hp: 44, atk: 50, def: 40 }, weak: ['修辭'], resist: ['文言'] },
  fan: { base: { hp: 42, atk: 52, def: 40 }, weak: ['閱讀'], resist: ['修辭'] },
  seal: { base: { hp: 46, atk: 48, def: 46 }, weak: ['字音'], resist: ['常識'] },
  legend: { base: { hp: 70, atk: 64, def: 60 }, weak: [], resist: [] },
};

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
const monName = arch => W.monsters[arch];
function makeFoe(arch, lv) {
  const M = MON[arch], b = M.base;
  const f = { kind: 'mon', sp: arch, lv, name: monName(arch), weak: M.weak, resist: M.resist,
    moves: ARCH[arch].skills.slice(0, 2).map(([n, cats], i) => ({ name: n, cats, pow: i ? 45 : 35 })),
    maxhp: Math.floor(b.hp * lv / 25) + lv + 12, atk: Math.floor(b.atk * lv / 25) + 6, def: Math.floor(b.def * lv / 25) + 6, exp: lv * 6 };
  f.hp = f.maxhp; return f;
}
function makePersonFoe(R) {
  const F = R.foe, lv = F.lv + (G.ng || 0) * 4;
  const f = { kind: 'person', look: R.look, name: R.name, lv, weak: F.weak || [], resist: F.resist || [],
    moves: F.moves.map(([name, cats, pow]) => ({ name, cats, pow })),
    maxhp: Math.floor((12 + lv * 3.5) * (F.hpMul || 1)), atk: Math.floor(5 + lv * 1.6), def: Math.floor(4 + lv * 1.5), exp: Math.floor(lv * 9 * (F.hpMul || 1)) };
  f.hp = f.maxhp; return f;
}

/* ============ 地圖版型（三個世界共用；外觀由世界主題決定） ============
   . 草地  , 道路  g 草叢  T 樹  ~ 水  # 牆  W 窗  D 門  R 屋頂  = 柵欄  S 告示牌  F 花  L 燈  ^ 岩石 */
const SOLID = new Set(['T', '#', 'W', 'D', 'R', '~', '=', 'S', 'L', '^', 'X']);
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
    doors: { '6,4': 'home', '19,4': 'hall1', '3,11': 'heal', '20,11': 'shop' },
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
    foes: { n: 10, lv: [3, 6], list: [{ sp: 'brush', w: 3 }, { sp: 'tome', w: 3 }, { sp: 'scroll', w: 3 }, { sp: 'fan', w: 1 }] } },
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
    doors: { '19,4': 'hall2', '3,11': 'heal', '20,11': 'shop' },
    doorWarps: { '4,4': { to: 'gym1', tx: 5, ty: 8, dir: 'up' } },
    signs: { '8,11': 'sign_town2' },
    npcs: [{ role: 'gymguide', x: 5, y: 5, dir: 'down' }, { role: 'locked2', x: 19, y: 5, dir: 'down' }, { role: 'guard', x: 13, y: 1, dir: 'left' },
      { role: 'tip4', x: 8, y: 8, dir: 'down', wander: 1 }, { role: 'tip5', x: 16, y: 15, dir: 'up', wander: 1 }, { role: 'smith', x: 15, y: 8, dir: 'down' }],
    shop: ['heal', 'heal2', 'wenqi', 'hint'] },
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
    npcs: [{ role: 'gym1', x: 5, y: 2, dir: 'down' }] },
};
