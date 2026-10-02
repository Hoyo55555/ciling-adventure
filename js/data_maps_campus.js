'use strict';
/* ============================================================
   校園改版的新地圖（施工中）
   ------------------------------------------------------------
   這個檔案**還沒接進正式遊戲**（index.html 沒有載入它）。
   等整套校園地圖做完，再一次換掉現在的 30 張。
   測試頁 test/game.html 會載入它，所以可以邊做邊看。

   規則和 data_maps_v2.js 完全一樣：一個字元就是一格，
   看到什麼就是什麼。差別只有多了 props（整棟建築）：

     props: [['clinic', 2, 3]]

   碰撞由 stampProps() 依建築尺寸自動蓋出來，不用手動維護底下那幾格。
   buildingCheck() 會再驗一次（超出地圖、兩棟重疊、畫得到卻走得過去、
   門沒有 doorWarp、門前站不住、圖沒塗滿）。
   ============================================================ */

const CAMPUS_MAPS = {};

/* ============================================================
   通學路（校外・單向）：家 → 巷口 → 大馬路口 → 校門前 → 前庭
   走到校門回頭看，來時的路不見了 —— 那是夢的第一個破綻。
   ============================================================ */

/* ---- 1. 巷口 20×16：教移動與對話 ---- */
CAMPUS_MAPS.s1 = {
  music: 'route', theme: 't_street', chapter: 0,
  rows: [
    '##......,,,,......##',
    '##......,,,,......##',
    '##.....!,,,,p.....##',
    '##......,,,,......##',
    '##.....%,,,,......##',
    '##.....%,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,!.....##',
    '##......,,,,......##',
    '##.....p,,,,......##',
    '##......,,,,......##',
    '##......,,,,%.....##',
    '##......,,,,%.....##',
    '##......,,,,......##',
    '##................##',
  ],
  /* 左邊：公寓與早餐店；右邊：公寓與自己家 */
  props: [['flat', 2, 2], ['bfast', 2, 9], ['flat', 13, 3], ['flat', 13, 10]],
  doorWarps: {
    '4,6':  { to: 'store_h', tx: 5, ty: 5, dir: 'up', ret: { x: 4,  y: 7 } },
    '4,12': { to: 'store_h', tx: 5, ty: 5, dir: 'up', ret: { x: 4,  y: 13 } },   // 早餐店
    '15,7': { to: 'home',    tx: 5, ty: 5, dir: 'up', ret: { x: 15, y: 8 } },
    '15,14':{ to: 'home',    tx: 5, ty: 5, dir: 'up', ret: { x: 15, y: 15 } },   // 自己家
  },
  warps: [
    { x: 9,  y: 0, to: 's2', tx: 9,  ty: 20, dir: 'up' },
    { x: 10, y: 0, to: 's2', tx: 10, ty: 20, dir: 'up' },
  ],
};

/* ---- 2. 大馬路口 20×22：教商店、道具，以及第一場草叢遭遇 ---- */
CAMPUS_MAPS.s2 = {
  music: 'route', theme: 't_street', chapter: 0,
  rows: [
    '##................##',
    '##................##',
    '##................##',
    '##................##',
    '##................##',
    '##................##',
    '##................##',
    '##.:.!.......!..L.##',
    '##................##',
    '##,,,,,,,00,,,,,,,##',
    '##,,,,,,,00,,,,,,,##',
    '##;;;;;;;00;;;;;;;##',
    '##,,,,,,,00,,,,,,,##',
    '##,,,,,,,00,,,,,,,##',
    '##,,,,,,,00,,,,,,,##',
    '##................##',
    '##.L........ggggg.##',
    '##ggggg.T...ggggg.##',
    '##ggggg.....ggggg.##',
    '##ggggg.T...TTTTT.##',
    '##................##',
    '##................##',
  ],
  props: [['cvs', 2, 3], ['flat', 13, 2]],
  doorWarps: {
    '4,6':  { to: 'store_h', tx: 5, ty: 5, dir: 'up', ret: { x: 4,  y: 7 } },    // 便利商店
    '15,6': { to: 'home',    tx: 5, ty: 5, dir: 'up', ret: { x: 15, y: 7 } },
  },
  /* 行道樹下的草叢：整個遊戲的第一場戰鬥 */
  foes: { lv: [2, 3], scale: 0, auto: 1, rate: .18, safe: 1 },
  warps: [
    { x: 9,  y: 21, to: 's1', tx: 9,  ty: 1,  dir: 'down' },
    { x: 10, y: 21, to: 's1', tx: 10, ty: 1,  dir: 'down' },
    { x: 9,  y: 0,  to: 's3', tx: 10, ty: 14, dir: 'up' },
    { x: 10, y: 0,  to: 's3', tx: 11, ty: 14, dir: 'up' },
  ],
};

/* ---- 3. 校門前 22×16：教碎片、鍛造、錯題本。往上穿過圍牆就進校園 ---- */
CAMPUS_MAPS.s3 = {
  music: 'route', theme: 't_street', chapter: 0,
  rows: [
    '##########,,##########',
    '##========,,========##',
    '##========,,========##',
    '##..................##',
    '##..!..2......2..!..##',
    '##..................##',
    '##..................##',
    '##..ooo........ooo..##',
    '##..ooo........ooo..##',
    '##..................##',
    '##......O....O......##',
    '##..................##',
    '##,,,,,,,0000,,,,,,,##',
    '##;;;;;;;0000;;;;;;##',
    '##,,,,,,,0000,,,,,,,##',
    '##,,,,,,,0000,,,,,,,##',
  ],
  props: [],
  warps: [
    /* 進了校園就回不來了（通學路是單向的）。
       回頭看來時的路不見了 —— 夢的第一個破綻。 */
    { x: 10, y: 0, to: 'front', tx: 12, ty: 16, dir: 'up' },
    { x: 11, y: 0, to: 'front', tx: 13, ty: 16, dir: 'up' },
  ],
};

/* ============================================================
   校園
   ============================================================ */

/* ---- 校門與前庭 26×20 ---- */
CAMPUS_MAPS.front = {
  music: 'town', theme: 't_campus', chapter: 1,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT......................TT',
    'TT......................TT',
    'TT......................TT',
    'TT......................TT',
    'TT......................TT',
    'TT......................TT',
    'TT......................TT',
    'TT,,,,,,,,,,,,,,,,,,,,,,TT',
    'TT2,,,n,,,,,,,,,,,,,,,,,TT',
    'TT,FFFFFFF,T,,,T,,=====,TT',
    'TT,Fdd9ddF,F,,,F,,ooooo,TT',
    'TT,F,,,,,F,,,,,,,,ooooo,TT',
    'TT,FFFFFFF,,,,,,,,=,,,=,TT',
    'TT,,,,,,,,,T,,,T,,,,,,,,TT',
    'TT,,,,,,,O,F,,,FO,,,6,,,TT',
    'TT,,,,,2,,,,,,,,,f,,,TT,TT',
    'TT========......========TT',
    'TT========......========TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  /* 保健室、教學樓、警衛室、校門 */
  props: [['clinic', 2, 4], ['block', 9, 1], ['guard', 3, 15], ['gate', 10, 17]],
  doorWarps: {
    '4,7':  { to: 'clinic_h', tx: 5, ty: 5, dir: 'up', ret: { x: 4,  y: 8 } },
    '14,7': { to: 'hall',     tx: 11, ty: 10, dir: 'up', ret: { x: 14, y: 8 } },   // 教學樓大門→穿堂
  },
  warps: [],
  signs: {},
};

/* ---- 穿堂 24×12（室內・校園中樞，四個方向都通）---- */
CAMPUS_MAPS.hall = {
  music: 'town', theme: 't_campus', chapter: 1, indoor: 1,
  rows: [
    'wwwwwwwwwww__wwwwwwwwwww',
    'w__222_f__w__w__f_222__w',
    'w______________________w',
    'w_p__________________p_w',
    'ww____________________ww',
    '________________________',
    '________________________',
    'ww____________________ww',
    'w_p__________________p_w',
    'w______________________w',
    'w____2__2_w__w_2__2____w',
    'wwwwwwwwwww__wwwwwwwwwww',
  ],
  warps: [
    /* 南→前庭　北→中庭　西→走廊1F　東→禮堂前廣場 */
    { x: 11, y: 11, to: 'front', tx: 14, ty: 8, dir: 'down' },
    { x: 12, y: 11, to: 'front', tx: 14, ty: 8, dir: 'down' },
    { x: 11, y: 0,  to: 'yard2', tx: 11, ty: 14, dir: 'up' },
    { x: 12, y: 0,  to: 'yard2', tx: 12, ty: 14, dir: 'up' },
    { x: 0,  y: 5,  to: 'corridor1', tx: 30, ty: 3, dir: 'left' },
    { x: 0,  y: 6,  to: 'corridor1', tx: 30, ty: 3, dir: 'left' },
    { x: 23, y: 5,  to: 'audyard',   tx: 2,  ty: 8, dir: 'right' },
    { x: 23, y: 6,  to: 'audyard',   tx: 2,  ty: 8, dir: 'right' },
  ],
  signs: {},
};

/* ---- 走廊 1F 32×6（室內）----
   一整排都是窗，只有一扇真的門（一年甲班＝道館①）。
   不放假的門：看起來能進去卻進不去，就是讓人猶豫的東西。
   最左邊牆上的時鐘 7 ＝ 夢的破綻①（永遠停在玩家早上轉的那個時間）。 */
CAMPUS_MAPS.corridor1 = {
  music: 'town', theme: 't_campus', chapter: 1, indoor: 1,
  rows: [
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'w7wWWWwzzwWWWwzzwWDWwzzwWWWwzzww',
    '________________________________',
    '________________________________',
    '________________________________',
    '11111111111111111111111111111111',
  ],
  doorWarps: {
    '18,1': { to: 'c1a', tx: 6, ty: 7, dir: 'up', ret: { x: 18, y: 2 } },   // 一年甲班＝道館①
  },
  warps: [
    { x: 31, y: 2, to: 'hall', tx: 1, ty: 5, dir: 'right' },
    { x: 31, y: 3, to: 'hall', tx: 1, ty: 5, dir: 'right' },
    { x: 31, y: 4, to: 'hall', tx: 1, ty: 6, dir: 'right' },
    { x: 0,  y: 2, to: 'stair1', tx: 8, ty: 6, dir: 'left' },
    { x: 0,  y: 3, to: 'stair1', tx: 8, ty: 6, dir: 'left' },
    { x: 0,  y: 4, to: 'stair1', tx: 8, ty: 6, dir: 'left' },
  ],
  signs: {},
};

/* ---- 中庭 24×18（室外・道館③ 文藝教室在北側）---- */
CAMPUS_MAPS.yard2 = {
  music: 'town', theme: 't_campus', chapter: 3,
  rows: [
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT,,,,,,,,,,,,,,,,,,,,TT',
    'TT.T.......,,..T....T.TT',
    'TTF.~~~+~~.,,...AA....TT',
    'TT..~~~+~~.,,...AA...FTT',
    'TT..~~~+~~.,,..p..p...TT',
    'TTF.~~~+~~.,,........FTT',
    'TT.T.....T.,,.......T.TT',
    'TT..dd9dd..,,..mmmm...TT',
    'TT........F,,F.....T..TT',
    'TTTTTTTTTTT,,TTTTTTTTTTT',
  ],
  props: [['artroom', 8, 1]],
  doorWarps: { '11,6': { to: 'yard', tx: 7, ty: 10, dir: 'up', ret: { x: 11, y: 7 } } },
  warps: [
    { x: 11, y: 17, to: 'hall', tx: 11, ty: 1, dir: 'down' },
    { x: 12, y: 17, to: 'hall', tx: 12, ty: 1, dir: 'down' },
    { x: 4,  y: 0,  to: 'field', tx: 15, ty: 22, dir: 'up' },   // 北→操場
    { x: 5,  y: 0,  to: 'field', tx: 16, ty: 22, dir: 'up' },
  ],
  signs: {},
};

/* ---- 禮堂前廣場 24×17（室外・道館⑤）----
   禮堂正面的大鐘 ＝ 夢的破綻⑤ */
CAMPUS_MAPS.audyard = {
  music: 'town', theme: 't_campus', chapter: 5,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    ',,,,,,,,,,,rr,,,,,,,,,TT',
    ',,,,,,,,,,,rr,,,,,,,,,TT',
    'TT,,,n,,n,,rr,,n,,n,,,TT',
    'TT,T,,,,,,,rr,,,,,,,T,TT',
    'TT,,,,,,,,,rr,,,,,,,,,TT',
    'TT,S,,p,,,,rr,,,,p,,S,TT',
    'TT,,,,,,,,,rr,,,,,,,,,TT',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  props: [['audi', 6, 1]],
  doorWarps: {
    '11,8': { to: 'aud', tx: 7, ty: 12, dir: 'up', ret: { x: 11, y: 9 },
              need: 4, gate: 'need4',
              needFlag: 'guardianDone',
              flagText: '（小墨擋在台階前：「先照我說的去一趟，回來我就讓開。」）' },
  },
  cuts: { '11,9': 'moIntro', '12,9': 'moIntro' },
  warps: [
    { x: 0, y: 9,  to: 'hall', tx: 22, ty: 5, dir: 'left' },
    { x: 0, y: 10, to: 'hall', tx: 22, ty: 6, dir: 'left' },
  ],
  signs: {},
};

/* ---- 樓梯間 10×8（室內）：踩上樓梯就上 2F ---- */
CAMPUS_MAPS.stair1 = {
  music: 'town', theme: 't_campus', chapter: 1, indoor: 1,
  rows: [
    'wwwwwwwwww',
    'w__iiii__w',
    'w__iiii__w',
    'w________w',
    'w_________',
    'w_________',
    'w________w',
    'wwwwwwwwww',
  ],
  warps: [
    { x: 3, y: 1, to: 'corridor2', tx: 1, ty: 3, dir: 'right' },
    { x: 4, y: 1, to: 'corridor2', tx: 1, ty: 3, dir: 'right' },
    { x: 5, y: 1, to: 'corridor2', tx: 1, ty: 3, dir: 'right' },
    { x: 6, y: 1, to: 'corridor2', tx: 1, ty: 3, dir: 'right' },
    { x: 9, y: 4, to: 'corridor1', tx: 1, ty: 3, dir: 'right' },
    { x: 9, y: 5, to: 'corridor1', tx: 1, ty: 3, dir: 'right' },
  ],
  signs: {},
};

/* ---- 走廊 2F 32×6（室內）----
   二樓有兩間：圖書館（道館②）與校史室（道館④）。
   和 1F 一樣，不放假的門 —— 其餘全是窗與置物櫃。 */
CAMPUS_MAPS.corridor2 = {
  music: 'town', theme: 't_campus', chapter: 2, indoor: 1,
  rows: [
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'wzzwWDWwWWWwzzw22wWDWwWWWwzzwwww',
    '________________________________',
    '________________________________',
    '________________________________',
    '11111111111111111111111111111111',
  ],
  doorWarps: {
    '5,1':  { to: 'lib',  tx: 7, ty: 10, dir: 'up', ret: { x: 5,  y: 2 },
              need: 1, gate: 'need1' },                       // 圖書館＝道館②
    '20,1': { to: 'hist', tx: 6, ty: 10, dir: 'up', ret: { x: 20, y: 2 },
              need: 3, gate: 'need3' },                       // 校史室＝道館④
  },
  warps: [
    { x: 0, y: 2, to: 'stair1', tx: 4, ty: 3, dir: 'left' },
    { x: 0, y: 3, to: 'stair1', tx: 4, ty: 3, dir: 'left' },
    { x: 0, y: 4, to: 'stair1', tx: 4, ty: 3, dir: 'left' },
  ],
  signs: { '6,1': 'sg_lib', '21,1': 'sg_hist' },
};

/* ---- 操場與跑道 32×24（室外・全校最大的一張）----
   跑道 u 的白邊線、球場 K 的邊線都是靠鄰格自動算出來的，
   所以鋪多大一片，外圈的線都會自己接成一個完整的框。 */
CAMPUS_MAPS.field = {
  music: 'town', theme: 't_campus', chapter: 2,
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTllllllllllllllllllllllllllllTT',   // 觀眾席
    'TTuuuuuuuuuuuuuuuuuuuuuuuuuuuuTT',   // 跑道（兩格厚的環）
    'TTuuuuuuuuuuuuuuuuuuuuuuuuuuuuTT',
    'TTuu........................uuTT',
    'TTuu.....a..................uuTT',   // 籃球架
    'TTuu.KKKKKKKKK....KKKKKKKKK.uuTT',   // 左：籃球場　右：排球場
    'TTuu.KKKKKKKKK....KKKKKKKKK.uuTT',
    'TTuu.KKKKKKKKK....KKKKKKKKK.uuTT',
    'TTuu.KKKKKKKKK....KvvvvvvvK.uuTT',   // 排球網（兩端留得過去）
    'TTuu.KKKKKKKKK....KKKKKKKKK.uuTT',
    'TTuu.KKKKKKKKK....KKKKKKKKK.uuTT',
    'TTuu.KKKKKKKKK....KKKKKKKKK.uuTT',
    'TTuu.....a..................uuTT',
    'TTuu........................uuTT',
    'TTuu........................uuTT',
    'TTuu.......dddd9dddd........uuTT',   // 司令台＋講桌
    'TTuu.ssss.jj................uuTT',   // 跳遠沙坑＋單槓
    'TTuu.ssss...................uuTT',
    'TTuu........................uuTT',
    'TTuuuuuuuuuuuuuuuuuuuuuuuuuuuuTT',
    'TTuuuuuuuuuuuuuuuuuuuuuuuuuuuuTT',
    'TT,,,,,,,,,,,,,,,,,,,,,,,,,,,,TT',
    'TTTTTTTTTTTTTTT,,TTTTTTTTTTTTTTT',
  ],
  props: [],
  warps: [
    { x: 15, y: 23, to: 'yard2', tx: 4, ty: 1, dir: 'down' },
    { x: 16, y: 23, to: 'yard2', tx: 5, ty: 1, dir: 'down' },
  ],
  signs: {},
};

if (typeof LAYOUTS !== 'undefined') {
  for (const L of Object.values(CAMPUS_MAPS)) if (typeof stampProps === 'function') stampProps(L);
  Object.assign(LAYOUTS, CAMPUS_MAPS);
}
