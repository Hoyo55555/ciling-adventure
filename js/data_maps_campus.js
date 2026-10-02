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
    '15,14':{ to: 'room',    tx: 4, ty: 6, dir: 'up', ret: { x: 15, y: 15 } },   // 自己家（我的房間）
  },
  warps: [
    { x: 9,  y: 0, to: 's2', tx: 9,  ty: 20, dir: 'up' },
    { x: 10, y: 0, to: 's2', tx: 10, ty: 20, dir: 'up' },
  ],
};

/* ---- 2. 大馬路口 20×22：教商店、道具，以及第一場草叢遭遇 ---- */
CAMPUS_MAPS.s2 = {
  music: 'route', theme: 't_street', chapter: 0, tutorial: 1,   // tutorial：新手教學戰在這裡
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
   一整排窗之間有四扇門：福利社、自己的教室、一年甲班（道館①）、工藝教室。
   不放假的門：看起來能進去卻進不去，就是讓人猶豫的東西。
   最左邊牆上的時鐘 7 ＝ 夢的破綻①（永遠停在玩家早上轉的那個時間）。 */
CAMPUS_MAPS.corridor1 = {
  music: 'town', theme: 't_campus', chapter: 1, indoor: 1,
  rows: [
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'w7wWDWwzzwWDWwzzwWDWwzzwWDWwzzww',
    '________________________________',
    '________________________________',
    '________________________________',
    '11111111111111111111111111111111',
  ],
  doorWarps: {
    '4,1':  { to: 'store_c', tx: 5, ty: 5, dir: 'up', ret: { x: 4,  y: 2 } },   // 福利社（通學路是單向的，校內要能補貨）
    '11,1': { to: 'c8',      tx: 6, ty: 7, dir: 'up', ret: { x: 11, y: 2 } },   // 自己的教室（王老師、筆靈）
    '18,1': { to: 'c1a',     tx: 6, ty: 7, dir: 'up', ret: { x: 18, y: 2 } },   // 一年甲班＝道館①
    '25,1': { to: 'forge',   tx: 5, ty: 5, dir: 'up', ret: { x: 25, y: 2 } },   // 工藝教室（碎片合成、武器升階）
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
  doorWarps: {
    '11,6': { to: 'yard', tx: 7, ty: 10, dir: 'up', ret: { x: 11, y: 7 },
              need: 2, gate: 'need2' },                       // 文藝教室＝道館③（要兩片碎片）
  },
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

/* ---- 我的房間 10×8（室內・序幕）----
   凌晨在這裡驚醒：先轉床頭的鬧鐘（]），再確認書包（(）裡的准考證。
   序幕結束前房間是暗的（night），門口被擋住（gates: prologue）。 */
CAMPUS_MAPS.room = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1, night: .45,
  rows: [
    'www/wwww/w',
    'wb]__k[[_w',
    'wb____(__w',
    'w_______)w',
    'w__rr___)w',
    'wp_rr____w',
    'w________w',
    'wwww__wwww',
  ],
  warps: [{ x: 4, y: 7, to: '@ret' }, { x: 5, y: 7, to: '@ret' }],
  gates: { '4,7': 'prologue', '5,7': 'prologue' },
  acts: { '2,1': 'alarmClock', '6,2': 'schoolbag' },
  signs: { '3,0': 'rm_window', '8,0': 'rm_window', '7,1': 'rm_desk', '5,1': 'rm_shelf',
           '8,3': 'rm_closet', '8,4': 'rm_closet', '1,2': 'rm_bed' },
  npcs: [],
};

/* ============================================================
   人物配置（從舊的 30 張地圖搬進校園）
   ------------------------------------------------------------
   校園是一張網，不是一條線：一開學每個地方都走得到。
   所以「什麼時候登場」不再靠地圖順序，而是靠碎片數：
     minBadges  至少要幾片才出現　　maxBadges  超過幾片就離開
   主線人物：
     周以恆①  走廊 2F，1 片時出現（打贏他圖書館的股長才肯打）
     三位組員  中庭，2 片起（點醒三人，文藝教室的助教才肯打）
     周以恆②  樓梯間，3 片時出現（打贏他校史室的助教才肯打）
     小墨      禮堂前，接下守護神器任務之後守在台階旁
   居民的台詞還是舊城鎮的版本，寫新劇情時一起改。
   ============================================================ */
const CAMPUS_NPCS = {
  s1: [
    { role: 't_cd_a', x: 6,  y: 8,  dir: 'right' },
    { role: 't_cd_b', x: 14, y: 9,  dir: 'down' },
  ],
  s2: [
    { role: 'dictA',  x: 7,  y: 18, dir: 'right', sight: 3 },   // 草叢邊：第一個會攔人的同學
  ],
  s3: [
    { role: 'dictB',     x: 7,  y: 6,  dir: 'right', sight: 3 },
    { role: 'roamHint2', x: 16, y: 9,  dir: 'down' },
    { role: 't_zy_a',    x: 4,  y: 11, dir: 'down' },
  ],
  front: [
    { role: 'gymTip1',  x: 16, y: 8,  dir: 'down' },
    { role: 't_zy_b',   x: 12, y: 12, dir: 'down', wander: 1 },
    { role: 'townTip2', x: 20, y: 14, dir: 'down', wander: 1 },
  ],
  hall: [
    { role: 't_cs_a',   x: 4,  y: 2,  dir: 'down' },
    { role: 't_cs_b',   x: 19, y: 2,  dir: 'down' },
    { role: 'townTip3', x: 4,  y: 9,  dir: 'right' },
    { role: 'gymTip2',  x: 19, y: 9,  dir: 'left' },
    { role: 'roamHint', x: 16, y: 3,  dir: 'down' },
  ],
  corridor1: [
    { role: 't_r2a',    x: 14, y: 4,  dir: 'up', sight: 2 },    // 面向上：整條走廊的寬度都看得到
    { role: 'forgeTip', x: 27, y: 2,  dir: 'down' },
  ],
  stair1: [
    { role: 't_r2b',  x: 2, y: 5, dir: 'right', sight: 3 },
    { role: 'rival2', x: 2, y: 3, dir: 'right', sight: 3, minBadges: 3, maxBadges: 3 },
  ],
  corridor2: [
    { role: 'rival1',  x: 4,  y: 4, dir: 'up', sight: 2, minBadges: 1, maxBadges: 1 },
    { role: 't_r3a',   x: 14, y: 2, dir: 'down', sight: 2 },
    { role: 'gymTip4', x: 22, y: 2, dir: 'down' },
    { role: 't_dj_a',  x: 27, y: 3, dir: 'left' },
  ],
  yard2: [
    { role: 'm1', x: 14, y: 13, dir: 'left', sight: 3, minBadges: 2 },
    { role: 'm2', x: 7,  y: 4,  dir: 'down', sight: 3, minBadges: 2 },
    { role: 'm3', x: 19, y: 13, dir: 'left', sight: 3, minBadges: 2 },
    { role: 'sideAGiver', x: 13, y: 10, dir: 'left', minBadges: 2 },
    { role: 'gymTip3',  x: 13, y: 7,  dir: 'down' },
    { role: 'townTip4', x: 19, y: 15, dir: 'down', wander: 1 },
    { role: 't_hn_a',   x: 4,  y: 14, dir: 'down' },
    { role: 't_hn_b',   x: 20, y: 10, dir: 'down', wander: 1 },
    { role: 'gd_paper', x: 16, y: 12, dir: 'up',   gq: 'g_paper' },   // 涼亭下（神器據點重做前的暫時位置）
    { role: 'gd_ink',   x: 10, y: 11, dir: 'left', gq: 'g_ink' },     // 水池邊（同上）
  ],
  field: [
    { role: 'sideBGiver', x: 13, y: 14, dir: 'down' },
    { role: 'sparring',   x: 7,  y: 15, dir: 'down' },
    { role: 'sparring2',  x: 24, y: 15, dir: 'down' },
    { role: 't_r3b',      x: 16, y: 5,  dir: 'down', sight: 3 },
    { role: 't_r5a',      x: 20, y: 18, dir: 'left', sight: 3 },
    { role: 't_bl_a',     x: 6,  y: 19, dir: 'down' },
  ],
  audyard: [
    { role: 'moGuard', x: 13, y: 9,  dir: 'left', needFlag: 'guardianQuest' },   // 交代完之後守在台階旁
    { role: 'gymTip5', x: 9,  y: 10, dir: 'right' },
    { role: 't_zt_a',  x: 4,  y: 13, dir: 'down' },
    { role: 't_zt_b',  x: 17, y: 13, dir: 'down', wander: 1 },
    { role: 'townTip6', x: 19, y: 10, dir: 'down', wander: 1 },
    { role: 'ngHint',  x: 6,  y: 12, dir: 'down' },
  ],
};
for (const [id, list] of Object.entries(CAMPUS_NPCS)) CAMPUS_MAPS[id].npcs = list;

/* 操場：學弟的三張准考證碎紙（支線Ｂ） */
CAMPUS_MAPS.field.devices = {
  '9,1':   { group: 'paper', flag: 'pa1', cat: '文言', label: '准考證碎紙',
    text: '一張碎紙卡在觀眾席的椅縫裡。\n（讀懂上面的字，才能把它抽出來。）',
    ok: '碎紙拿到了！', allText: '三張碎紙都找齊了！可以還給學弟了。' },
  '10,17': { group: 'paper', flag: 'pa2', cat: '常識', label: '准考證碎紙',
    text: '第二張碎紙夾在沙坑邊的單槓底下。', ok: '碎紙拿到了！', allText: '三張碎紙都找齊了！' },
  '22,9':  { group: 'paper', flag: 'pa3', cat: '成語', label: '准考證碎紙',
    text: '最後一張碎紙掛在排球網上。', ok: '碎紙拿到了！',
    allText: '三張碎紙都找齊了！', onAll: 'sideB' },
};

/* ============================================================
   校園版的劇情條件（由 data_worlds.js 在建好國中生涯之後呼叫）
   舊地圖寫死的地名在這裡換成校園的位置。正式換上校園版時，
   這些會直接寫回 data_worlds.js，這個函式就可以拿掉。
   ============================================================ */
function CAMPUS_PATCH(S) {
  const R = S.roles;
  R.boss2.needDefeated = ['corridor2:rival1'];
  R.boss3.needDefeated = ['yard2:m1', 'yard2:m2', 'yard2:m3'];
  R.sideAGiver.need    = ['yard2:m1', 'yard2:m2', 'yard2:m3'];
  R.boss4.needDefeated = ['stair1:rival2'];
  /* 器靈的地點：神器據點重做（待辦 1）之前先放在中庭 */
  S.gqClue = {
    g_paper: { where: 'yard2', place: '中庭的涼亭',
      clue: '「去那個可以躲雨、把心事攤開來晾乾的地方——中庭的涼亭。」' },
    g_ink:   { where: 'yard2', place: '中庭的水池',
      clue: '「去那個水面黑得像墨的地方——中庭的水池邊。」' },
  };
  S.roamMaps = ['s1', 's2', 's3', 'front', 'yard2', 'field', 'audyard'];
  /* 起點：自己的房間（床邊，面向床頭鬧鐘）。出門落在巷口自己家門前 */
  S.start = { map: 'room', x: 2, y: 2, dir: 'up', ret: { map: 's1', x: 15, y: 15 } };
  /* 回城點：前庭的保健室門口（通學路是單向的，回不了家） */
  S.homeTown = { map: 'front', x: 4, y: 8 };
  S.gates = Object.assign({}, S.gates, { prologue: '（……還沒準備好。先確認時間和准考證吧。）' });
  S.signs = Object.assign({}, S.signs, {
    rm_window: '（窗外還是黑的。路燈下一個人也沒有。）',
    rm_desk: '（書桌上攤著國文課本，旁邊壓著一疊寫到一半的模擬考卷。）',
    rm_shelf: '（書架上排滿了參考書。每一本的書背都被翻得起毛了。）',
    rm_closet: '（衣櫃裡掛著燙好的制服。）',
    rm_bed: '（被子還是溫的。可是你已經睡不著了。）',
  });
  S.postNpcs = Object.assign({}, S.postNpcs, {
    front: [{ role: 'postRival', x: 12, y: 13, dir: 'down' }],
  });
  Object.assign(S.mapNames, {
    s1: '巷口', s2: '大馬路口', s3: '校門前', front: '校門與前庭', hall: '穿堂',
    corridor1: '走廊 1F', stair1: '樓梯間', corridor2: '走廊 2F', yard2: '中庭',
    field: '操場與跑道', audyard: '禮堂前廣場', room: '我的房間',
  });
}

if (typeof LAYOUTS !== 'undefined') {
  for (const L of Object.values(CAMPUS_MAPS)) if (typeof stampProps === 'function') stampProps(L);
  Object.assign(LAYOUTS, CAMPUS_MAPS);
}
