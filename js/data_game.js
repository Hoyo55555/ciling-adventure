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
const weaponName = arch => W.weapons[arch][0];
const ULT_COST = 5;

/* ============ 敵人（詞妖） ============ */
const SPECIES = {
  cuozi: { name: '錯字蟲', desc: '專門把字寫錯的小蟲，身上的花紋是寫歪的筆畫。', base: { hp: 40, atk: 45, def: 38 }, weak: ['字形'], resist: ['閱讀'], moves: ['bite', 'scrawl'], pal: { a: '#9ccc3c', b: '#6a9a2a', c: '#e84a4a', d: '#f8e070' },
    parts: [{ t: 'r', v: [9, 28, 3, 2], c: 'b', m: 1 }, { t: 'e', v: [16, 22, 9, 7.5], c: 'a' }, { t: 'r', v: [8, 20, 16, 1], c: 'b' }, { t: 'r', v: [9, 24, 14, 1], c: 'b' },
      { t: 'd', v: [[11, 3], [12, 4], [12, 5], [13, 6]], c: 'b', m: 1 }, { t: 'e', v: [10.5, 2.5, 1.6, 1.6], c: 'c', m: 1 }, { t: 'e', v: [16, 11.5, 8, 6.5], c: 'a' },
      { t: 'eye', v: [12, 10], m: 1 }, { t: 'd', v: [[14, 15], [15, 16], [16, 16], [17, 15]], c: 'c' }, { t: 'd', v: [[14, 21], [15, 22], [16, 23], [17, 22], [18, 21]], c: 'd' }] },
  zhuyin: { name: '注音鼠', desc: '耳朵像「ㄅ」的小老鼠，最愛把聲調弄亂。', base: { hp: 38, atk: 48, def: 36 }, weak: ['字音'], resist: ['成語'], moves: ['tail', 'tones'], pal: { a: '#b8b8cc', b: '#f4a8b8', c: '#6a6a80', d: '#f4f4f8' },
    parts: [{ t: 'e', v: [8, 8, 5.5, 5.5], c: 'a', m: 1 }, { t: 'e', v: [8, 8, 3.5, 3.5], c: 'b', m: 1 }, { t: 'e', v: [16, 23, 7.5, 7], c: 'a' }, { t: 'e', v: [16, 24, 4.5, 4.5], c: 'd' },
      { t: 'e', v: [16, 14, 8, 6.5], c: 'a' }, { t: 'eye', v: [12, 12], m: 1 }, { t: 'd', v: [[15, 16], [16, 16]], c: 'b' }, { t: 'd', v: [[8, 15], [9, 15], [8, 17], [9, 16]], c: 'c', m: 1 },
      { t: 'e', v: [11, 29, 2.5, 1.5], c: 'b', m: 1 }, { t: 'd', v: [[14, 21], [15, 21], [16, 21], [17, 21], [17, 22], [16, 23], [15, 24]], c: 'c' }] },
  motuan: { name: '墨團', desc: '一團會動的墨漬，會把詞語塗得意思不清。', base: { hp: 46, atk: 42, def: 44 }, weak: ['詞義'], resist: ['字音'], moves: ['squirt', 'glue'], pal: { a: '#3a4a8a', b: '#7a8ad8', c: '#ffffff', d: '#1e2850' },
    parts: [{ t: 'p', v: [[9, 17], [16, 3], [23, 17]], c: 'a' }, { t: 'e', v: [16, 21, 11, 8.5], c: 'a' }, { t: 'e', v: [11, 15, 2, 3], c: 'b' },
      { t: 'e', v: [8, 29.5, 2, 1.5], c: 'a' }, { t: 'e', v: [23, 30, 1.5, 1.2], c: 'a' }, { t: 'eye', v: [12, 18], m: 1 }, { t: 'd', v: [[15, 24], [16, 24]], c: 'd' }] },
  chengyu: { name: '成語蛙', desc: '背上有四個圓點的青蛙，據說每一點都是一個字。', base: { hp: 48, atk: 46, def: 44 }, weak: ['成語'], resist: ['修辭'], moves: ['croak', 'well'], pal: { a: '#4cb07a', b: '#e8f0a0', c: '#2e7a50', d: '#f06a6a' },
    parts: [{ t: 'e', v: [7, 26, 5, 3.5], c: 'c', m: 1 }, { t: 'e', v: [16, 21, 11, 8], c: 'a' }, { t: 'e', v: [16, 24, 6, 4.5], c: 'b' }, { t: 'e', v: [10, 11, 4, 4], c: 'a', m: 1 },
      { t: 'e', v: [10, 11, 2.5, 2.5], c: '#ffffff', m: 1 }, { t: 'r', v: [10, 11, 2, 2], c: '#181820', m: 1 }, { t: 'r', v: [11, 18, 10, 1], c: 'c' }, { t: 'e', v: [8, 17, 1.5, 1], c: 'd', m: 1 },
      { t: 'd', v: [[10, 22], [22, 22], [9, 25], [23, 25]], c: 'c' }] },
  xiuci: { name: '修辭蝶', desc: '翅膀會變換花紋的蝴蝶，一會兒譬喻，一會兒擬人。', base: { hp: 42, atk: 52, def: 40 }, weak: ['修辭'], resist: ['詞義'], moves: ['dust', 'dance'], pal: { a: '#e86ab0', b: '#7ad0f0', c: '#3a2a4a', d: '#f8e070' },
    parts: [{ t: 'e', v: [8, 11, 7, 7], c: 'a', m: 1 }, { t: 'e', v: [9, 22, 5.5, 5], c: 'b', m: 1 }, { t: 'e', v: [7, 10, 2.5, 2.5], c: 'd', m: 1 }, { t: 'e', v: [9, 22, 2, 2], c: '#ffffff', m: 1 },
      { t: 'e', v: [16, 17, 2.5, 10], c: 'c' }, { t: 'e', v: [16, 7, 3.5, 3], c: 'c' }, { t: 'd', v: [[14, 4], [13, 3], [12, 2]], c: 'c', m: 1 }, { t: 'd', v: [[14, 7]], c: '#ffffff', m: 1 }] },
  zhujian: { name: '竹簡蛇', desc: '由一片片竹簡串成的蛇，身上刻滿了古文。', base: { hp: 50, atk: 50, def: 46 }, weak: ['文言'], resist: ['字形'], moves: ['wrap', 'fang'], pal: { a: '#c8b070', b: '#8a7040', c: '#e84a4a', d: '#e8d8a0' },
    parts: [{ t: 'e', v: [16, 25, 11, 5], c: 'a' }, { t: 'e', v: [16, 20, 8, 4], c: 'a' }, { t: 'r', v: [9, 23, 1, 6], c: 'b', m: 1 }, { t: 'r', v: [13, 18, 1, 11], c: 'b', m: 1 },
      { t: 'r', v: [14, 14, 4, 5], c: 'a' }, { t: 'e', v: [16, 11, 6, 5.5], c: 'a' }, { t: 'eye', v: [13, 9], m: 1 }, { t: 'd', v: [[15, 17], [16, 17], [14, 18], [17, 18]], c: 'c' }] },
  shihun: { name: '詩魂燈', desc: '寄宿著千年詩魂的紅燈籠，會吟出熊熊燃燒的絕句。', base: { hp: 44, atk: 54, def: 42 }, weak: ['詩詞'], resist: ['文言'], moves: ['flame', 'quatrain'], pal: { a: '#e85a4a', b: '#f8c040', c: '#8a2a2a', d: '#fff0b0' },
    parts: [{ t: 'r', v: [15, 1, 2, 3], c: 'c' }, { t: 'r', v: [12, 4, 8, 3], c: 'c' }, { t: 'e', v: [16, 16, 10, 10], c: 'a' }, { t: 'e', v: [16, 16, 6, 10], c: 'c' }, { t: 'e', v: [16, 16, 5, 9.6], c: 'a' },
      { t: 'e', v: [16, 18, 3, 3], c: 'd' }, { t: 'eye', v: [12, 13], m: 1 }, { t: 'r', v: [12, 26, 8, 2], c: 'c' }, { t: 'r', v: [15, 28, 2, 3], c: 'b' }, { t: 'p', v: [[3, 22], [5, 12], [7, 22]], c: 'b', m: 1 }] },
  wenqu: { name: '文曲星', desc: '主掌天下文運的星辰之靈。', base: { hp: 70, atk: 64, def: 60 }, weak: ['閱讀'], resist: [], moves: ['starlight', 'scrolls', 'poemsea', 'starplan'], pal: { a: '#f8d040', b: '#fff4b0', c: '#b07a10', d: '#6a4ae0' },
    parts: [{ t: 'e', v: [16, 16, 15, 15], c: 'd' }, { t: 'e', v: [16, 16, 13.2, 13.2], c: '_' }, { t: 'p', v: GFX.star(16, 17, 13, 5.5), c: 'a' }, { t: 'e', v: [16, 18, 4.5, 4], c: 'b' },
      { t: 'eye', v: [13, 15], m: 1 }, { t: 'd', v: [[15, 20], [16, 20]], c: 'c' }] },
};
/* 敵人的招式（敵人出招時可能出「防禦題」，題型依招式而定） */
const MOVES = {
  bite: { name: '錯字咬', cats: ['字形'], pow: 35 }, scrawl: { name: '亂筆', cats: ['字形'], pow: 50 },
  tail: { name: '拼音尾', cats: ['字音'], pow: 35 }, tones: { name: '聲調亂舞', cats: ['字音'], pow: 50 },
  squirt: { name: '墨汁噴', cats: ['詞義'], pow: 35 }, glue: { name: '黏墨', cats: ['詞義'], pow: 50 },
  croak: { name: '蛙鳴', cats: ['成語'], pow: 35 }, well: { name: '井底之躍', cats: ['成語'], pow: 50 },
  dust: { name: '譬喻粉', cats: ['修辭'], pow: 35 }, dance: { name: '擬人舞', cats: ['修辭'], pow: 55 },
  wrap: { name: '簡纏', cats: ['文言'], pow: 35 }, fang: { name: '古文毒牙', cats: ['文言'], pow: 55 },
  flame: { name: '燈火', cats: ['詩詞'], pow: 35 }, quatrain: { name: '絕句焰', cats: ['詩詞'], pow: 55 },
  starlight: { name: '文曲光', cats: ['常識'], pow: 60 }, starplan: { name: '星辰策', cats: ['閱讀'], pow: 70 },
  scrolls: { name: '萬卷書', cats: ['文言'], pow: 70 }, poemsea: { name: '詩海', cats: ['詩詞'], pow: 70 },
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
  const lv = G.lv, w = G.weapons[G.equip[G.cur]];
  G.maxhp = 28 + lv * 6; G.atk = 7 + lv * 2 + (w ? (weaponLv(w) - 1) * 2 : 0); G.def = 6 + lv * 2;
  if (G.hp == null || G.hp > G.maxhp) G.hp = G.maxhp;
}
const expNeed = lv => lv * 10 + 10;
function makeFoe(sp, lv, variant = 0) {
  const S = SPECIES[sp]; const b = S.base;
  const f = { kind: 'mon', sp, lv, variant, name: S.name, weak: S.weak, resist: S.resist, moves: S.moves.map(id => MOVES[id]),
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
const SOLID = new Set(['T', '#', 'W', 'D', 'R', '~', '=', 'S', 'L', '^']);
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
      { role: 'rival', x: 10, y: 5, dir: 'left', sight: 2 }],
    chests: [{ id: 'r1a', x: 17, y: 2, weapon: 'fan' }, { id: 'r1b', x: 2, y: 17, items: { heal: 3, hint: 2 } }],
    foes: { n: 9, lv: [3, 6], list: [{ sp: 'cuozi', w: 3 }, { sp: 'zhuyin', w: 3 }, { sp: 'motuan', w: 2 }, { sp: 'chengyu', w: 1 }] } },
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
      'Tggg.......,,.......FF.T',
      'Tggg.......,,..........T',
      'Tggg.......,,..........T',
      'TTTTTTTTTTT,,TTTTTTTTTTT'],
    warps: [{ x: 11, y: 17, to: 'route1', tx: 8, ty: 1, dir: 'down' }, { x: 12, y: 17, to: 'route1', tx: 9, ty: 1, dir: 'down' }],
    gates: { '11,0': 'trialEnd', '12,0': 'trialEnd' },
    doors: { '4,4': 'gymdoor', '19,4': 'hall2', '3,11': 'heal', '20,11': 'shop' },
    signs: { '8,11': 'sign_town2' },
    npcs: [{ role: 'gym1', x: 4, y: 5, dir: 'down' }, { role: 'locked2', x: 19, y: 5, dir: 'down' }, { role: 'guard', x: 13, y: 1, dir: 'left' },
      { role: 'tip4', x: 8, y: 8, dir: 'down', wander: 1 }, { role: 'tip5', x: 16, y: 15, dir: 'up', wander: 1 }, { role: 'trainerC', x: 15, y: 8, dir: 'left', sight: 3 }],
    foes: { n: 3, lv: [6, 8], list: [{ sp: 'xiuci', w: 2 }, { sp: 'zhujian', w: 2 }, { sp: 'shihun', w: 2 }] },
    shop: ['heal', 'heal2', 'wenqi', 'hint'] },
};
