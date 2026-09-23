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

/* ============ 種族相剋：筆剋紙、紙剋器、器剋音、音剋兵、兵剋筆 ============ */
const RACE = { 筆: '#d8a030', 紙: '#8a9aa8', 器: '#6a8a58', 音: '#b06ac8', 兵: '#a85040', 墨: '#3a3550' };
const RACE_KE = { 筆: '紙', 紙: '器', 器: '音', 音: '兵', 兵: '墨', 墨: '筆' };
const RACE_KE_BY = Object.fromEntries(Object.entries(RACE_KE).map(([a, b]) => [b, a]));
const raceChip = r => r ? `<span class="chip race" style="background:${RACE[r]}">${r}</span>` : '';
function raceEffect(a, d) { if (!a || !d) return 1; if (RACE_KE[a] === d) return 1.3; if (RACE_KE[d] === a) return 0.85; return 1; }
const DOUBLE_BONUS = 1.2;          // 屬性與種族同時剋制的額外加成
let ATTACK_Q_RATE = 0.5;           // 攻擊時出題的機率（教師可調整）
function loadQRate() { const v = Store.get('ciling_qrate', null); if (v != null) ATTACK_Q_RATE = Math.min(1, Math.max(0.1, +v)); }
function setQRate(v) { ATTACK_Q_RATE = Math.min(1, Math.max(0.1, +v)); Store.set('ciling_qrate', ATTACK_Q_RATE); }
const ATTACK_Q_POW = 1.3;          // 答對後的威力加成
/* 武器親密度：每打完一場戰鬥 +1，分三級，越高越容易觸發「迴避出題」 */
const BOND_STEPS = [10, 20, 35];
const BOND_DODGE = [0, 0.10, 0.15, 0.20];
const bondLv = w => BOND_STEPS.filter(x => (w.bond || 0) >= x).length;
/* 親密度滿級（三級）時，武器依種族再給一項小加成 */
const BOND_MAX_BONUS = 0.05;
const RACE_BOND_STAT = { 筆: 'atk', 紙: 'hp', 器: 'def', 音: 'dodge', 兵: 'atk', 墨: 'def' };
const BOND_STAT_NAME = { atk: '攻擊', def: '防禦', hp: '氣血上限', dodge: '迴避機率' };
const bondStatOf = w => RACE_BOND_STAT[ARCH[archOf(w)].race] || 'atk';   // 無種族（硯海龍君）預設加攻擊
const bondBonus = (w, stat) => (w && bondLv(w) >= 3 && bondStatOf(w) === stat) ? BOND_MAX_BONUS : 0;

/* ============ 狀態異常 ============ */
const STATUS = {
  poison: { name: '中毒', icon: '☠', col: '#7a4ac8', dot: 0.06, turns: 3, hit: '陷入中毒！每回合會損失氣血。' },
  burn: { name: '燒傷', icon: '♨', col: '#d8502a', dot: 0.05, atk: 0.88, turns: 3, hit: '被燒傷了！每回合損血，攻擊也下降。' },
  sleep: { name: '睡眠', icon: '☾', col: '#4a78c8', skip: 0.6, turns: 2, hit: '睡著了！可能無法行動。' },
  para: { name: '麻痺', icon: '⚡', col: '#c8a020', skip: 0.35, turns: 3, hit: '麻痺了！可能無法行動。' },
};
const ST_ORDER = ['poison', 'burn', 'sleep', 'para'];
const stChip = k => `<span class="stchip" style="background:${STATUS[k].col}">${STATUS[k].icon} ${STATUS[k].name}</span>`;
const EL_STATUS = { 火: 'burn', 木: 'poison', 水: 'sleep', 金: 'para', 土: 'poison' };

/* ============ 武器附加效果（鍛造時有機率出現，升階保留） ============ */
const AFFIX = {
  regen: { name: '回春', good: 1, desc: '每回合結束時恢復少量氣血' },
  thorn: { name: '反擊', good: 1, desc: '被攻擊時反彈部分傷害' },
  keen: { name: '銳利', good: 1, desc: '攻擊時有機會造成 1.5 倍傷害' },
  focus: { name: '凝神', good: 1, desc: '攻擊時有機會額外累積文氣' },
  ward: { name: '辟邪', good: 1, desc: '有機會免疫狀態異常並減輕傷害' },
  flame: { name: '燃墨', good: 1, desc: '攻擊時有機會讓對手燒傷' },
  venom: { name: '浸墨', good: 1, desc: '攻擊時有機會讓對手中毒' },
  numb: { name: '震響', good: 1, desc: '攻擊時有機會讓對手麻痺' },
  drowse: { name: '催眠', good: 1, desc: '攻擊時有機會讓對手睡著' },
  brittle: { name: '脆裂', good: 0, desc: '攻擊時有機會威力減半' },
  heavy: { name: '沉重', good: 0, desc: '有機會因為太重而無法行動' },
  leak: { name: '漏墨', good: 0, desc: '每回合有機會自己損失少量氣血' },
};
const AFFIX_GOOD = Object.keys(AFFIX).filter(k => AFFIX[k].good);
const AFFIX_BAD = Object.keys(AFFIX).filter(k => !AFFIX[k].good);
const AFFIX_RATE = 0.32;          // 鍛造出來的武器帶附加效果的機率
const AFFIX_BAD_RATE = 0.25;      // 其中是負面效果的比例
const AFFIX_BASE = 0.25, AFFIX_STEP = 0.1, AFFIX_MAX = 0.6;
const REFINE_COST = 800;          // 洗鍊（重抽附加效果）的花費   // 觸發機率：基礎、每多一把 +、上限
const affixText = w => { const a = w && w.affix; return a ? `${AFFIX[a.k].good ? '✦' : '✧'} ${AFFIX[a.k].name}（${AFFIX[a.k].desc}，機率 ${Math.round(a.rate * 100)}%）` : ''; };
function rollAffix() {
  if (Math.random() > AFFIX_RATE) return null;
  const bad = Math.random() < AFFIX_BAD_RATE;
  return { k: pick(bad ? AFFIX_BAD : AFFIX_GOOD), rate: AFFIX_BASE };
}
/* 合成升階：只保留一個附加效果，但每多一把帶效果的武器就提高觸發機率 */
function mergeAffix(list) {
  const withFx = list.filter(w => w.affix);
  if (!withFx.length) return null;
  const good = withFx.filter(w => AFFIX[w.affix.k].good);
  const base = (good.length ? good : withFx)[0].affix;
  const rate = Math.min(AFFIX_MAX, Math.max(base.rate, AFFIX_BASE) + (withFx.length - 1) * AFFIX_STEP);
  return { k: base.k, rate };
}

/* ============ 圖鑑稱號：每收集 10 種妖怪解鎖一個，收得越多加成越高 ============ */
const DEX_TITLES = [
  { id: 'd10', n: 10, name: '妖怪見習生', stat: 'atk', val: 0.03 },
  { id: 'd20', n: 20, name: '筆墨博物家', stat: 'hp', val: 0.05 },
  { id: 'd30', n: 30, name: '校園妖怪通', stat: 'def', val: 0.07 },
  { id: 'd40', n: 40, name: '圖鑑大師', stat: 'dodge', val: 0.10 },
  { id: 'd50', n: 50, name: '萬象皆知', stat: 'atk', val: 0.13 },
];
/* 收集滿一個種族的所有妖怪，另外解鎖專屬稱號 */
const RACE_TITLES = [
  { id: 'r_bi', race: '筆', name: '筆鋒所至', stat: 'atk', val: 0.06 },
  { id: 'r_zhi', race: '紙', name: '紙短情長', stat: 'hp', val: 0.08 },
  { id: 'r_qi', race: '器', name: '器宇軒昂', stat: 'def', val: 0.08 },
  { id: 'r_yin', race: '音', name: '餘音繞樑', stat: 'dodge', val: 0.08 },
  { id: 'r_bing', race: '兵', name: '兵不血刃', stat: 'atk', val: 0.08 },
  { id: 'r_mo', race: '墨', name: '惜墨如金', stat: 'def', val: 0.06 },
];
/* 文房四寶全部到齊的專屬稱號 */
const SET_TITLES = [{ id: 's_four', set: 'guardians', name: '文房四寶．齊', stat: 'atk', val: 0.12 }];
const hasAllGuardians = () => GUARDIAN_KEYS.every(k => G && G.weapons && G.weapons.some(w => w.arch === k));
const ALL_TITLES = () => DEX_TITLES.concat(RACE_TITLES, SET_TITLES);
const raceSeen = ra => { const all = MON_KEYS.filter(k => monDef(k).race === ra); const d = (Meta.d && Meta.d.dex) || {}; return { got: all.filter(k => d[k]).length, all: all.length }; };
const TITLE_SLOTS = 2;            // 最多同時配戴兩個稱號，可自由組合
const dexCount = () => Object.keys((Meta.d && Meta.d.dex) || {}).length;
const titleUnlocked = t => t.set ? hasAllGuardians() : t.race ? (() => { const r = raceSeen(t.race); return r.all > 0 && r.got >= r.all; })() : dexCount() >= t.n;
const titleNeedText = t => t.set
  ? `集齊文房四寶（${GUARDIAN_KEYS.filter(k => G && G.weapons && G.weapons.some(w => w.arch === k)).length} / ${GUARDIAN_KEYS.length}：筆、紙、墨、硯）`
  : t.race ? (() => { const r = raceSeen(t.race); return `收集齊全部 ${t.race}族妖怪（${r.got} / ${r.all}）`; })() : `圖鑑收集 ${t.n} 種`;
const equippedTitles = () => ((G && G.titles) || []).map(id => ALL_TITLES().find(t => t.id === id)).filter(t => t && titleUnlocked(t));
const titleBonus = stat => equippedTitles().filter(t => t.stat === stat).reduce((a, t) => a + t.val, 0);

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
  ['brush', ['字形', '字音'], 1, '力透紙背', ['2B鉛筆劍', 'pen'], ['狼毫筆', 'pen'], ['判官筆', 'pen'], '#f0c040'],
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
/* 守護器靈．文房四寶：筆、紙、墨各是該種族最強，硯是最頂級（二週目限定、兩種能力） */
const GUARDIANS = {
  g_pen: { world: 'school', name: '文心筆靈', race: '筆', shape: 'pen', col: '#f8d040', ult: '一筆定千秋', passive: 'po',
    desc: '筆族之王。傳說第一個把心裡的話寫下來的人，用的就是牠。' },
  g_paper: { world: 'school', name: '素心紙靈', race: '紙', shape: 'scroll', col: '#f4ecd8', ult: '白紙黑字', passive: 'guard',
    desc: '紙族之王。再重的心事，攤開來就只是一張白紙。' },
  g_ink: { world: 'school', name: '凝香墨靈', race: '墨', shape: 'block', col: '#2a2a3c', ult: '墨染千里', passive: 'bane',
    desc: '墨族之王。磨得越久，字越沉穩。' },
  g_stone: { world: 'school', name: '硯海龍君', race: null, shape: 'orb', col: '#6a8ab0', ult: '硯海無涯', passive: ['spring', 'retry'], ng: true,
    desc: '文房四寶之首，二週目才會現身。筆墨紙都要在牠的硯海裡才能成形。' },
};
const GUARDIAN_KEYS = Object.keys(GUARDIANS);
/* 舊版存檔相容：舊的守護神器代號 → 新的文房四寶器靈 */
const OLD_GUARDIAN_MAP = { g_school_a: 'g_pen', g_school_b: 'g_paper', g_literati_a: 'g_pen', g_literati_b: 'g_ink', g_wuxia_a: 'g_paper', g_wuxia_b: 'g_ink' };
const fixArch = a => OLD_GUARDIAN_MAP[a] || a;
const GUARDIAN_FIRST = GUARDIAN_KEYS.filter(k => !GUARDIANS[k].ng);   // 一週目三選一
const passiveList = a => { const p = ARCH[archOf(a)].passive; return p ? (Array.isArray(p) ? p : [p]) : []; };
const PASSIVES = {
  shield: { name: '護心', desc: '每場戰鬥第一次被擊中時，傷害歸零。' },
  spring: { name: '文思泉湧', desc: '每場戰鬥開始時，文氣直接 +2。' },
  eye: { name: '慧眼', desc: '選擇題自動刪去一個錯誤選項。' },
  bane: { name: '破妄', desc: '對關主與魔王的傷害 ×1.5。' },
  regen: { name: '回春', desc: '每回合結束時恢復 8% 氣血。' },
  retry: { name: '再思', desc: '每場戰鬥第一次答錯時，可以重答一次。' },
  po: { name: '破妄', desc: '戰鬥中選擇題自動刪去一個錯誤選項。' },
  guard: { name: '護心', desc: '受到的傷害減少 40%（答錯時扣血較少）。' },
};
const ARCH = {};
function skillsFor(cats) {
  if (cats.length >= ALL_CATS.length) return [['文心', cats, 55], ['雕龍', cats, 65], ['萬卷', cats, 80], ['天章', cats, 100]];
  const a = cats[0], b = cats[1] || cats[0], both = cats.slice(0, 3);
  return cats.length === 1
    ? [[CAT_SKILLS[a][0], [a], 40], [CAT_SKILLS[a][1], [a], 45], [CAT_SKILLS[a][2], [a], 60], [CAT_SKILLS[a][3], [a], 85]]
    : [[CAT_SKILLS[a][0], [a], 40], [CAT_SKILLS[b][0], [b], 40], [CAT_SKILLS[a][2], both, 60], [CAT_SKILLS[b][3], both, 85]];
}
/* 第三招會依武器五行附帶狀態異常；守護神器的第三招必定附帶 */
function withEffects(list, cats) {
  const el = elOfCats(cats), st = EL_STATUS[el];
  if (st && list[2]) list[2] = list[2].concat([{ inflict: st, rate: 0.4 }]);
  return list;
}
/* 戰術招式：不造成傷害，改為強化自己或干擾對手（武器 Lv.2 以上可用） */
const RACE_TACTIC = {
  筆: { name: '凝神運筆', kind: 'guard', text: '架起筆勢，這一回合不會受到傷害！' },
  紙: { name: '紙上談兵', kind: 'buff', stat: 'atk', val: 0.3, turns: 3, text: '推演戰局，攻擊提升了！' },
  器: { name: '鐵壁陣', kind: 'buff', stat: 'def', val: 0.4, turns: 3, text: '穩住架式，防禦提升了！' },
  音: { name: '亂心音', kind: 'inflict', st: 'para', alt: 'sleep', rate: 0.75, text: '奏出擾人心神的聲音！' },
  兵: { name: '凌厲身法', kind: 'buff', stat: 'dodge', val: 0.25, turns: 3, text: '身法變得輕盈，更容易看穿對手！' },
};
for (const [key, cats, ch, ult, sc, li, wu, col] of WEAPON_TABLE)
  ARCH[key] = { cats, ch, ult, col, names: { school: sc[0], literati: li[0], wuxia: wu[0] }, shapes: { school: sc[1], literati: li[1], wuxia: wu[1] }, skills: withEffects(skillsFor(cats), cats) };
for (const [key, g] of Object.entries(GUARDIANS))
  ARCH[key] = { cats: ALL_CATS, ch: 9, ult: g.ult, col: g.col, guardian: true, passive: g.passive, race: g.race || null, gdesc: g.desc, ng: g.ng, names: { school: g.name, literati: g.name, wuxia: g.name }, shapes: { school: g.shape, literati: g.shape, wuxia: g.shape },
    skills: [['守護', ALL_CATS, 48], ['神威', ALL_CATS, 55], ['天啟', ALL_CATS, 65, { inflict: 'para', rate: 0.5 }], ['永恆', ALL_CATS, 78]] };
const ARCH_RACE = {
  brush: '筆', marker: '筆', maobi: '墨', chalk: '墨', palette: '墨', fan: '兵', tome: '紙', dict: '紙', notebook: '紙', idiom: '紙', poemcard: '紙',
  bookmark: '紙', classic: '紙', scroll: '紙', trophy: '器', ruler: '器', eraser: '器', compass: '器', globe: '器', glasses: '器',
  seal: '器', abacus: '器', tablet: '器', palette: '器', zhuyin: '紙', bell: '音', mic: '音', whistle: '音', lamp: '器', chess: '器', legend: '兵',
};
for (const k in ARCH) if (!ARCH[k].race && !ARCH[k].guardian) ARCH[k].race = ARCH_RACE[k] || '器';
for (const k in ARCH) ARCH[k].tactic = RACE_TACTIC[ARCH[k].race];
const ARCH_ORDER = WEAPON_TABLE.map(r => r[0]);
const STARTER_ARCHS = ['brush', 'tome', 'scroll'];
const weaponDesc = a => (W.weapons && W.weapons[a] && W.weapons[a][1]) || (ARCH[a].guardian
  ? `${ARCH[a].gdesc || ''}\n守護器靈．${passiveList(a).map(p => `能力「${PASSIVES[p].name}」：${PASSIVES[p].desc}`).join('　')}`
  : `擅長「${ARCH[a].cats.join('」「')}」題型的武器。`);
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
const RAR_ATK = [0, 2, 4, 7, 10, 14, 14], RAR_POW = [1, 1.1, 1.2, 1.35, 1.5, 1.7, 1.6];
const RAR_BONUS = ['', '答對時熟練度額外 +1', '剋制屬性時威力 +15%', '答對時恢復 3% 氣血', '剋制屬性時文氣額外 +1', '被剋制時威力不降低'];
const bonusList = r => RAR_BONUS.slice(1, Math.min(r, 5) + 1);
const newWeapon = (arch, r = 0, affix = null) => ({ id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), arch, r, mastery: 0, bond: 0, affix });
const wById = id => G.weapons.find(w => w.id === id);
const curW = () => wById(G.equip[G.cur]);
const rarChip = r => `<span class="rchip r${r}">${RARITY[r].n}</span>`;

/* ============ 武器妖圖鑑（50 種） ============
   同一「種族」有不同「屬性」，例如紅筆（火）、藍筆（水）、黑筆（土）、綠筆（木）都屬於筆族。
   欄位：名稱、種族、五行、外形、顏色、掉落碎片對應的武器、最早出現階段 */
const MONSTERS = {
  pen_auto: ['自動筆妖', '筆', '金', 'pen', '#f0c040', 'brush', 0], pen_shake: ['搖搖筆妖', '筆', '金', 'pen', '#e8a030', 'brush', 0],
  pen_red: ['紅筆妖', '筆', '火', 'pen', '#e04a4a', 'chalk', 1], pen_blue: ['藍筆妖', '筆', '水', 'pen', '#3a78d8', 'marker', 1],
  pen_black: ['黑筆妖', '筆', '土', 'pen', '#3a3a44', 'maobi', 2], pen_green: ['綠筆妖', '筆', '木', 'pen', '#3e9830', 'marker', 2],
  pen_hl: ['螢光筆妖', '筆', '水', 'pen', '#f070b0', 'fan', 1], pen_chalk: ['粉筆妖', '筆', '金', 'pen', '#f0f0e8', 'chalk', 2],
  pen_color: ['彩色筆妖', '筆', '火', 'pen', '#e8804a', 'marker', 2], pen_marker: ['麥克筆妖', '筆', '水', 'pen', '#8a58c8', 'marker', 3],
  pen_mao: ['毛筆妖', '筆', '土', 'pen', '#8a5a2a', 'maobi', 3], pen_fountain: ['鋼筆妖', '筆', '金', 'pen', '#c8c8d8', 'legend', 4],
  paper_text: ['課本妖', '紙', '土', 'book', '#3a8a58', 'scroll', 0], paper_dict: ['字典妖', '紙', '木', 'book', '#5a88c8', 'tome', 0],
  paper_exam: ['考卷妖', '紙', '金', 'card', '#f4f2ea', 'bookmark', 0], paper_work: ['習作妖', '紙', '木', 'book', '#6ab04a', 'notebook', 1],
  paper_hand: ['講義妖', '紙', '木', 'card', '#e8dcc0', 'notebook', 1], paper_idiom: ['成語卡妖', '紙', '木', 'card', '#4ea838', 'idiom', 1],
  paper_contact: ['聯絡簿妖', '紙', '土', 'book', '#c8a030', 'dict', 1], paper_note: ['便條紙妖', '紙', '水', 'card', '#f8e070', 'notebook', 2],
  paper_mark: ['書籤妖', '紙', '水', 'card', '#48b878', 'bookmark', 2], paper_scrap: ['剪貼簿妖', '紙', '水', 'book', '#58b0a0', 'notebook', 2],
  paper_poem: ['詩詞卡妖', '紙', '火', 'card', '#c85a8a', 'poemcard', 3], paper_essay: ['作文紙妖', '紙', '火', 'card', '#f8f0dc', 'tablet', 3],
  tool_ruler: ['直尺妖', '器', '金', 'ruler', '#e8c070', 'ruler', 0], tool_eraser: ['橡皮擦妖', '器', '金', 'block', '#f0a0a0', 'eraser', 0],
  tool_tri: ['三角板妖', '器', '金', 'ruler', '#c8d8f0', 'ruler', 1], ink_white: ['修正液妖', '墨', '金', 'block', '#f8f8f8', 'eraser', 1],
  ink_bottle: ['墨水瓶妖', '墨', '水', 'block', '#2a3a6a', 'maobi', 1], tool_compass: ['圓規妖', '器', '土', 'compass', '#a0a8b8', 'compass', 2],
  tool_scissor: ['剪刀妖', '器', '金', 'dagger', '#c8c8d8', 'eraser', 2], tool_stapler: ['釘書機妖', '器', '金', 'block', '#6a6a80', 'ruler', 2],
  tool_lens: ['放大鏡妖', '器', '水', 'lens', '#d8a030', 'seal', 2], tool_protractor: ['量角器妖', '器', '土', 'ring', '#8ac0d8', 'compass', 3],
  tool_abacus: ['算盤妖', '器', '土', 'abacus', '#8a5a2a', 'abacus', 4], tool_calc: ['計算機妖', '器', '土', 'tablet', '#4a5a70', 'abacus', 4],
  sound_bell: ['上課鐘妖', '音', '金', 'bell', '#c89a30', 'bell', 2], sound_ring: ['下課鈴妖', '音', '金', 'bell', '#e0b040', 'bell', 2],
  sound_flute: ['直笛妖', '音', '火', 'flute', '#6a9a58', 'mic', 2], sound_whistle: ['哨子妖', '音', '水', 'whistle', '#e0b040', 'whistle', 3],
  sound_mic: ['麥克風妖', '音', '水', 'mic', '#5a6a80', 'mic', 3], sound_harmonica: ['口琴妖', '音', '火', 'block', '#a85040', 'mic', 3],
  sound_tamb: ['鈴鼓妖', '音', '木', 'orb', '#d8a060', 'bell', 3], sound_triangle: ['三角鐵妖', '音', '金', 'star', '#c8c8d8', 'bell', 4],
  sound_metro: ['節拍器妖', '音', '土', 'tablet', '#8a6a4a', 'mic', 4],
  arm_fan: ['紙扇妖', '兵', '水', 'fan', '#f0f0f8', 'fan', 3], arm_bamboo: ['竹劍妖', '兵', '木', 'sword', '#8ab858', 'legend', 4],
  arm_wood: ['木刀妖', '兵', '木', 'sword', '#a8784a', 'legend', 4], arm_dart: ['飛鏢妖', '兵', '金', 'star', '#b8c4d4', 'seal', 4],
  arm_stick: ['棍棒妖', '兵', '木', 'stick', '#8a6a3a', 'trophy', 4],
  ink_stick: ['墨條妖', '墨', '木', 'block', '#2a2a34', 'maobi', 2], ink_pad: ['印泥妖', '墨', '火', 'block', '#b8322a', 'seal', 3],
  ink_duster: ['板擦妖', '墨', '土', 'block', '#8a7a5a', 'chalk', 2],
};
const MON_KEYS = Object.keys(MONSTERS);
const monDef = k => { const m = MONSTERS[k]; return { name: m[0], race: m[1], el: m[2], shape: m[3], col: m[4], drop: m[5], stage: m[6] }; };
const monsAtStage = st => MON_KEYS.filter(k => MONSTERS[k][6] <= st);

/* ============ 道具（名稱依世界觀而不同，見 WORLDS.items） ============ */
const ITEMS = {
  heal: { price: 80, desc: '恢復 30 點氣血。', use: 'heal', val: 30 },
  heal2: { price: 200, desc: '恢復 80 點氣血。', use: 'heal', val: 80 },
  wenqi: { price: 150, desc: '文氣增加 2 格。', use: 'wenqi', val: 2 },
  hint: { price: 120, desc: '答選擇題時使用，刪去兩個錯誤選項。', use: 'hint' },
  atkup: { price: 160, desc: '本場戰鬥攻擊提升 25%。', use: 'buff', stat: 'atk', val: 0.25 },
  defup: { price: 160, desc: '本場戰鬥防禦提升 25%。', use: 'buff', stat: 'def', val: 0.25 },
  dodgeup: { price: 180, desc: '本場戰鬥迴避出題的機率 +20%。', use: 'buff', stat: 'dodge', val: 0.2 },
  cure: { price: 120, desc: '解除中毒、燒傷、睡眠、麻痺等狀態。', use: 'cure' },
  ward: { price: 200, desc: '本場戰鬥免疫一次狀態異常。', use: 'ward' },
};
const ITEM_ORDER = ['heal', 'heal2', 'cure', 'ward', 'atkup', 'defup', 'dodgeup', 'wenqi', 'hint'];
const itemName = id => W.items[id];

/* ============ 數值 ============ */
function playerStats() {
  const lv = G.lv, w = G.weapons && G.equip.length ? curW() : null;
  const mHp = 1 + titleBonus('hp') + bondBonus(w, 'hp'), mAtk = 1 + titleBonus('atk') + bondBonus(w, 'atk'), mDef = 1 + titleBonus('def') + bondBonus(w, 'def');
  G.maxhp = Math.round((28 + lv * 6) * mHp);
  G.atk = Math.round((7 + lv * 2 + (w ? (weaponLv(w) - 1) * 2 + RAR_ATK[w.r] : 0)) * mAtk);
  G.def = Math.round((6 + lv * 2) * mDef);
  if (G.hp == null || G.hp > G.maxhp) G.hp = G.maxhp;
}
/* 迴避出題的機率：親密度 + 稱號 + 本場道具加成 */
function dodgeChance(w, extra = 0) { return Math.min(0.6, BOND_DODGE[bondLv(w)] + bondBonus(w, 'dodge') + titleBonus('dodge') + extra); }
const expNeed = lv => lv * 12 + 20;
const monName = key => monDef(key).name;
function makeFoe(key, lv) {
  const M = monDef(key), i = ALL_CATS.indexOf(catsOfEl(M.el)[0]);
  const A = ARCH[M.drop], b = { hp: 42 + (i % 3) * 3, atk: 46 + (i % 4) * 2, def: 40 + (i % 3) * 2 };
  const f = { kind: 'mon', sp: key, lv, name: M.name, el: M.el, race: M.race, drop: M.drop,
    weak: catsOfEl(KE_BY[M.el]), resist: catsOfEl(KE[M.el]),
    moves: A.skills.slice(0, 2).map(([n, cats], i2) => ({ name: n, cats, pow: i2 ? 45 : 35 })),
    maxhp: Math.floor(b.hp * lv / 25) + lv + 12, atk: Math.floor(b.atk * lv / 25) + 6, def: Math.floor(b.def * lv / 25) + 6, exp: lv * 5 };
  f.hp = f.maxhp; return f;
}
function makePersonFoe(R) {
  const F = R.foe, lv = F.lv + (G.ng || 0) * 4;
  const el = F.el === 'none' ? null : F.el || (F.weak && F.weak.length ? KE[CAT_EL[F.weak[0]]] : '土');   // 人物的屬性：由弱點題型推回
  const hpM = R.hpMod && G.flags[R.hpMod.flag] ? R.hpMod.mul : 1, atkM = R.atkMod && G.flags[R.atkMod.flag] ? R.atkMod.mul : 1;
  const ngM = 1 + (G.ng || 0) * 0.15;   // 二週目起，對手的血量再提升
  const f = { kind: 'person', look: R.look, name: R.name, lv, el, race: F.race || null, weak: el ? catsOfEl(KE_BY[el]) : [], resist: el ? catsOfEl(KE[el]) : [],
    moves: F.moves.map(([name, cats, pow, qtype]) => ({ name, cats, pow, qtype })),
    maxhp: Math.floor((20 + lv * 6) * (F.hpMul || 1) * hpM * ngM), atk: Math.floor((5 + lv * 1.6) * atkM), def: Math.floor(4 + lv * 1.5), exp: Math.floor(lv * 5 * (F.hpMul || 1)) };
  f.hp = f.maxhp; return f;
}

/* ============ 地圖版型（三個世界共用；外觀由世界主題決定） ============
   . 草地  , 道路  g 草叢  T 樹  ~ 水  # 牆  W 窗  D 門  R 屋頂  = 柵欄  S 告示牌  F 花  L 燈  ^ 岩石 */
const SOLID = new Set(['T', '#', 'W', 'D', 'R', '~', '=', 'S', 'L', '^', 'X', 'w', 'b', 't', 'k', 'p', 'B', 'M', 'V', 'Y', 'Z', 'O', 'm', 'n', 'A', 'Q']);
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
    shop: ['heal', 'heal2', 'cure', 'atkup', 'defup', 'dodgeup', 'wenqi', 'hint'] },
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
    shop: ['heal', 'heal2', 'cure', 'atkup', 'defup', 'dodgeup', 'wenqi', 'hint'] },
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

/* ============ 國中生涯．獨立劇情地圖 ============
   B 黑板  g（國中主題）散落的考卷堆 */
Object.assign(LAYOUTS, {
  c8: { music: 'town', qlv: 1, indoor: 1, rows: [
      'wwwwBBBBwwww',
      'w__________w',
      'w_tt____tt_w',
      'w__________w',
      'w_tt____tt_w',
      'w__________w',
      'w_tt____tt_w',
      'wp________pw',
      'wwwwww__wwww'],
    warps: [{ x: 6, y: 8, to: 'hallway', tx: 6, ty: 1, dir: 'down' }, { x: 7, y: 8, to: 'hallway', tx: 7, ty: 1, dir: 'down' }] },
  hallway: { music: 'route', qlv: 1, indoor: 1, rows: [
      'wwwwww__wwwwwwwwwww__wwwwwww',
      'w__________________________w',
      'w__gg______gggg______gg____w',
      'w__gg__p___gggg__p___gg____w',
      'w__________________________w',
      'w____gggg______gg_____gggg_w',
      'w____gggg______gg_____gggg_w',
      'w__________________________w',
      'wwwwwwwwwwwww__wwwwwwwwwwwww'],
    warps: [{ x: 6, y: 0, to: 'c8', tx: 6, ty: 7, dir: 'up' }, { x: 7, y: 0, to: 'c8', tx: 7, ty: 7, dir: 'up' },
      { x: 19, y: 0, to: 'c1a', tx: 6, ty: 7, dir: 'up' }, { x: 20, y: 0, to: 'c1a', tx: 7, ty: 7, dir: 'up' },
      { x: 13, y: 8, to: 'campus', tx: 7, ty: 4, dir: 'down' }, { x: 14, y: 8, to: 'campus', tx: 7, ty: 4, dir: 'down' }],
    npcs: [{ role: 'xiaomo', x: 8, y: 4, dir: 'down' }, { role: 'dictA', x: 10, y: 1, dir: 'down', sight: 3 }, { role: 'dictB', x: 18, y: 7, dir: 'up', sight: 3 }],
    chests: [{ id: 'h1', x: 26, y: 2, weapon: 'scroll', r: 0 }, { id: 'h2', x: 1, y: 7, items: { heal: 2, hint: 1 }, frags: { ruler: 2 } }],
    foes: { n: 9, lv: [2, 4], scale: 3, auto: 1 } },
  c1a: { music: 'hall', qlv: 1, indoor: 1, rows: [
      'wwwwBBBBwwww',
      'w____t_____w',
      'w_tt____tt_w',
      'w__________w',
      'w_tt____tt_w',
      'w__________w',
      'w_tt____tt_w',
      'wp________pw',
      'wwwwww__wwww'],
    warps: [{ x: 6, y: 8, to: 'hallway', tx: 19, ty: 1, dir: 'down' }, { x: 7, y: 8, to: 'hallway', tx: 20, ty: 1, dir: 'down' }],
    chests: [{ id: 'c1a1', x: 10, y: 6, items: { heal: 2, hint: 1 } }],
    npcs: [{ role: 'boss1', x: 5, y: 1, dir: 'down' }, { role: 'c1aTip', x: 2, y: 5, dir: 'right' }],
    devices: {
      '4,0': { group: 'bb', flag: 'bb1', cat: '字形', label: '錯字黑板', text: '黑板上浮著扭曲的錯字，正一個個滴下黑墨……\n（找出正確的寫法，就能淨化它！）', ok: '錯字被擦掉了，黑板恢復了乾淨！', allText: '三塊黑板都被淨化了！小老師身上的錯字怨念淡了許多。' },
      '6,0': { group: 'bb', flag: 'bb2', cat: '字形', label: '錯字黑板', text: '第二塊黑板上的錯字正在發抖。', ok: '錯字被擦掉了！', allText: '三塊黑板都被淨化了！小老師身上的錯字怨念淡了許多。' },
      '7,0': { group: 'bb', flag: 'bb3', cat: '字形', label: '錯字黑板', text: '最後一塊黑板寫滿了形近字。', ok: '錯字被擦掉了！', allText: '三塊黑板都被淨化了！小老師身上的錯字怨念淡了許多。', onAll: 'bbAll' } } },
  campus: { music: 'town', qlv: 2, rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T.RRRRRRRRRR....RRRRRRRRRRRR.T',
      'T.RRRRRRRRRR....RRRRRRRRRRRR.T',
      'T.#W#W#D#W#W....#W#W##DD##W#.T',
      'T......,..............,,.....T',
      'T......,,,,,,,,,,,,,,,,,.....T',
      'T..F...,.......,.......F.....T',
      'T......,.......,.............T',
      'T.RRRRR,.......,......RRRRR..T',
      'T.RRRRR,.......,......RRRRR..T',
      'T.#WDW#,.......,......#WDW#..T',
      'T...,..,.......,........,....T',
      'T...,,,,,,,,,,,,,,,,,,,,,....T',
      'T..............,.............T',
      'T.RRRR.........,........RRRR.T',
      'T.#D#W.........,........W#D#.T',
      'T..,...........,..........,..T',
      'T..,,,,,,,,,,,,,,,,,,,,,,,,..T',
      'T..FF..........,.........FF..T',
      'TTTTTTTTTTTTTTT,TTTTTTTTTTTTTT'],
    warps: [{ x: 15, y: 19, to: 'yard', tx: 10, ty: 1, dir: 'down' }],
    gates: { '15,19': 'need2' },
    doorWarps: { '7,3': { to: 'hallway', tx: 13, ty: 7, dir: 'up' },
      '4,10': { to: 'lib', tx: 7, ty: 10, dir: 'up', need: 1, gate: 'need1' },
      '24,10': { to: 'hist', tx: 6, ty: 10, dir: 'up', need: 3, gate: 'need3' },
      '22,3': { to: 'aud', tx: 7, ty: 11, dir: 'up', need: 4, gate: 'need4' }, '23,3': { to: 'aud', tx: 8, ty: 11, dir: 'up', need: 4, gate: 'need4' },
      '3,15': { to: 'clinic', tx: 4, ty: 5, dir: 'up', ret: { x: 3, y: 16 } }, '26,15': { to: 'store', tx: 4, ty: 5, dir: 'up', ret: { x: 26, y: 16 } },
      '15,5': { to: 'inkpool', tx: 7, ty: 10, dir: 'up', ret: { x: 15, y: 6 }, need: 'ng' } },
    signs: {},
    chests: [{ id: 'cam1', x: 2, y: 18, items: { heal: 2, cure: 1 } }, { id: 'cam2', x: 27, y: 4, items: { atkup: 1, defup: 1 } }],
    foes: { n: 4, lv: [3, 6], scale: 3, auto: 1 },
    npcs: [{ role: 'xiaomo', x: 16, y: 7, dir: 'down' }, { role: 'tipA', x: 10, y: 7, dir: 'down', wander: 1 }, { role: 'tipB', x: 20, y: 13, dir: 'left', wander: 1 }, { role: 'tipC', x: 5, y: 18, dir: 'right', wander: 1 }],
    shop: ['heal', 'heal2', 'cure', 'atkup', 'defup', 'dodgeup', 'wenqi', 'hint'] },
  lib: { music: 'hall', qlv: 2, indoor: 1, rows: [
      'wwwwwwwwwwwwwwww',
      'wkk____t_____kkw',
      'wkkkkkkkkkkkkkkw',
      'w_kkkk__kkkk_k_w',
      'w____k______k__w',
      'wkk__k_kkkk_k_kw',
      'w____k____k____w',
      'w_kkkk_kk_kkkk_w',
      'w______________w',
      'wp____kkkk____pw',
      'w______________w',
      'wwwwwww__wwwwwww'],
    warps: [{ x: 7, y: 11, to: 'campus', tx: 4, ty: 11, dir: 'down' }, { x: 8, y: 11, to: 'campus', tx: 4, ty: 11, dir: 'down' }],
    chests: [{ id: 'lib1', x: 1, y: 10, items: { hint: 2, dodgeup: 1 }, frags: { tome: 2 } }],
    npcs: [{ role: 'rival1', x: 6, y: 10, dir: 'right', sight: 2 }, { role: 'boss2', x: 8, y: 1, dir: 'down' }],
    devices: {
      '2,3': { group: 'bk', flag: 'bk1', cat: '成語', label: '飛舞的成語辭典', text: '一本成語辭典在書架前飛來飛去，書頁上缺了一個字……', ok: '辭典安靜地飛回了書架！', allText: '三本辭典都歸位了——中央的書架緩緩讓開，露出通往股長的路！', open: [[7, 2], [8, 2]] },
      '11,3': { group: 'bk', flag: 'bk2', cat: '成語', label: '飛舞的成語辭典', text: '第二本辭典在你頭上盤旋。', ok: '辭典飛回了書架！', allText: '三本辭典都歸位了——中央的書架緩緩讓開！', open: [[7, 2], [8, 2]] },
      '7,7': { group: 'bk', flag: 'bk3', cat: '成語', label: '飛舞的成語辭典', text: '最後一本辭典夾在書架縫隙中。', ok: '辭典回到了原位！', allText: '三本辭典都歸位了——中央的書架緩緩讓開！', open: [[7, 2], [8, 2]] } } },
  yard: { music: 'town', qlv: 2, rows: [
      'TTTTTTTTTT,TTTTTTTTTTT',
      'T.F.F.....,......F.F.T',
      'T.........,..........T',
      'T..TT.....,.....TT...T',
      'T..TT..,,,,,,,..TT...T',
      'T......,.....,.......T',
      'T.~~~..,.RRR.,..F.F..T',
      'T.~~~..,.LtL.,.......T',
      'T.~~~..,,,,,,,..F.F..T',
      'T......,.....,.......T',
      'T..F..,,.....,,..F...T',
      'T.....,.......,......T',
      'T.FF..,.......,...FF.T',
      'T.....,,,,,,,,,......T',
      'T....................T',
      'TTTTTTTTTTTTTTTTTTTTTT'],
    warps: [{ x: 10, y: 0, to: 'campus', tx: 15, ty: 18, dir: 'up' }],
    chests: [{ id: 'yard1', x: 1, y: 14, items: { heal2: 1, cure: 1 } }, { id: 'yard2', x: 20, y: 2, weapon: 'fan', r: 1 }],
    npcs: [{ role: 'm1', x: 4, y: 9, dir: 'right', sight: 3 }, { role: 'm2', x: 16, y: 11, dir: 'left', sight: 3 }, { role: 'm3', x: 10, y: 14, dir: 'up', sight: 1 }, { role: 'boss3', x: 10, y: 8, dir: 'down' }],
    devices: {
      '3,10': { group: 'fl', flag: 'fl1', cat: '修辭', label: '枯萎的花', text: '一朵花因為墨塵而低著頭。\n（用心感受文字，也許它會重新綻放。）', ok: '花瓣舒展開來，散發出淡淡的香氣！', allText: '三朵花都開了，中庭恢復了生氣——助教的氣勢也弱了下來。' },
      '17,10': { group: 'fl', flag: 'fl2', cat: '閱讀', label: '枯萎的花', text: '第二朵花的葉子上積了一層黑墨。', ok: '黑墨散去，花開了！', allText: '三朵花都開了，中庭恢復了生氣！' },
      '2,12': { group: 'fl', flag: 'fl3', cat: '修辭', label: '枯萎的花', text: '最後一朵花只剩下花苞。', ok: '花苞綻放了！', allText: '三朵花都開了，中庭恢復了生氣！', onAll: 'flAll' } } },
  hist: { music: 'hall', qlv: 3, indoor: 1, rows: [
      'wwwwwwwwwwwwww',
      'wkk___t____kkw',
      'w____________w',
      'wkkk_kkkk_kkkw',
      'w____________w',
      'w_p________p_w',
      'wwwwwMMMMwwwww',
      'w____________w',
      'wk__________kw',
      'w____________w',
      'w____________w',
      'wwwwww__wwwwww'],
    warps: [{ x: 6, y: 11, to: 'campus', tx: 24, ty: 11, dir: 'down' }, { x: 7, y: 11, to: 'campus', tx: 24, ty: 11, dir: 'down' }],
    chests: [{ id: 'hist1', x: 1, y: 10, items: { heal2: 2, atkup: 1 }, frags: { classic: 2 } }],
    npcs: [{ role: 'rival2', x: 6, y: 7, dir: 'down', sight: 3 }, { role: 'boss4', x: 7, y: 1, dir: 'down' }],
    devices: {
      '5,6': { group: 'st', flag: 'st1', cat: '文言', label: '古文石碑', text: '石碑上刻著一段古文，字跡被墨塵遮住了一半……\n（讀懂它，石碑就會亮起。）', ok: '石碑亮起了柔和的光！', allText: '三座石碑同時亮起，擋路的石碑緩緩沉入地面，通往檔案室的路開了！', open: [[5, 6], [6, 6], [7, 6], [8, 6]] },
      '6,6': { group: 'st', flag: 'st2', cat: '文言', label: '古文石碑', text: '第二座石碑記載著校史與古語。', ok: '石碑亮起來了！', allText: '三座石碑同時亮起，路開了！', open: [[5, 6], [6, 6], [7, 6], [8, 6]] },
      '7,6': { group: 'st', flag: 'st3', cat: '常識', label: '古文石碑', text: '最後一座石碑上是一段國學常識。', ok: '石碑亮起來了！', allText: '三座石碑同時亮起，路開了！', open: [[5, 6], [6, 6], [7, 6], [8, 6]] } } },
  inkpool: { music: 'boss', qlv: 3, indoor: 1, rows: [
      'wwwwwwwwwwwwwwww',
      'w______________w',
      'w__~~~____~~~__w',
      'w__~~~____~~~__w',
      'w______________w',
      'w____~~~~~~____w',
      'w____~~~~~~____w',
      'w______________w',
      'w__~~~____~~~__w',
      'w__~~~____~~~__w',
      'w______________w',
      'wwwwwww__wwwwwww'],
    warps: [{ x: 7, y: 11, to: 'campus', tx: 15, ty: 6, dir: 'down' }, { x: 8, y: 11, to: 'campus', tx: 15, ty: 6, dir: 'down' }],
    npcs: [], chests: [{ id: 'ink1', x: 1, y: 1, items: { heal2: 3, ward: 2, cure: 2 } }] },
  aud: { music: 'hall', qlv: 3, indoor: 1, rows: [
      'wwwwwBBBBBBwwwww',
      'w______________w',
      'wtttttt__ttttttw',
      'w______rr______w',
      'w_tt_t_rr_t_tt_w',
      'w______rr______w',
      'w_tt_V_rr_t_tt_w',
      'w______rr______w',
      'w_tt_t_rr_t_Vt_w',
      'w______rr______w',
      'wV_t_t_rr_t_tt_w',
      'w______rr______w',
      'wwwwwww__wwwwwww'],
    warps: [{ x: 7, y: 12, to: 'campus', tx: 22, ty: 4, dir: 'down' }, { x: 8, y: 12, to: 'campus', tx: 23, ty: 4, dir: 'down' }],
    chests: [{ id: 'aud1', x: 1, y: 1, items: { heal2: 2, cure: 2, dodgeup: 1 } }, { id: 'aud2', x: 14, y: 1, items: { atkup: 2, defup: 2 } }],
    npcs: [{ role: 'e1', x: 1, y: 9, dir: 'right', sight: 14 }, { role: 'e2', x: 14, y: 7, dir: 'left', sight: 14 }, { role: 'e3', x: 1, y: 5, dir: 'right', sight: 14 }, { role: 'moGuard', x: 4, y: 11, dir: 'right' }, { role: 'boss5', x: 7, y: 1, dir: 'down' }],
    devices: {
      '5,6': { group: 'ad', flag: 'ad1', cat: '閱讀', label: '准考證感應台', text: '講台前的感應台亮著微光，上面寫著：「答對即可凝聚文氣。」', ok: '感應台亮起，一股文氣湧入你的身體！（下場戰鬥文氣 +1）' },
      '12,8': { group: 'ad', flag: 'ad2', cat: '成語', label: '准考證感應台', text: '第二座感應台等著你。', ok: '文氣再度凝聚！（下場戰鬥文氣 +1）' },
      '1,10': { group: 'ad', flag: 'ad3', cat: '文言', label: '准考證感應台', text: '最後一座感應台散發著沉穩的光。', ok: '文氣滿溢！（下場戰鬥文氣 +1）', allText: '三座感應台全部亮起，整座禮堂被文氣照亮了！' } } },
});
