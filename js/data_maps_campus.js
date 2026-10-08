'use strict';
/* ============================================================
   校園地圖（國中生涯的正式地圖）
   ------------------------------------------------------------
   index.html 在 data_maps_v2.js 之後載入它。舊的 30 張仍然留著：
   道館、保健室、商店這些室內沿用舊檔，另外兩個世界（書院、武俠）也還用舊地圖。
   國中生涯的起點、章節、劇情條件由檔尾的 CAMPUS_PATCH() 換成校園版。

   規則和 data_maps_v2.js 完全一樣：一個字元就是一格，
   看到什麼就是什麼。差別只有多了 props（整棟建築）：

     props: [['clinic', 2, 3]]

   碰撞由 stampProps() 依建築尺寸自動蓋出來，不用手動維護底下那幾格。
   buildingCheck() 會再驗一次（超出地圖、兩棟重疊、畫得到卻走得過去、
   門沒有 doorWarp、門前站不住、圖沒塗滿）。
   ============================================================ */

const CAMPUS_MAPS = {};

/* ============================================================
   通學路（校外・雙向）：家 → 巷口 → 大馬路口 → 校門前 → 前庭
   原本設計成單向（回頭路不見＝夢的破綻），試玩後改成雙向：回不了頭太卡（2026-10-05）。
   ============================================================ */

/* ---- 1. 巷口 20×16：教移動與對話 ---- */
/* 墨塵角落（校舍裡的遇敵點）：走廊、穿堂、樓梯間的角落有幾灘漫開的墨，踩進去會遇到武器妖。
   學校裡本來沒有草叢，收集碎片只能往外跑；這樣在校內也能練、能撿碎片。
   名單跟著所在樓層走（1F＝B 注音坡、2F＝C 典籍港）。 */
const inkFoes = pool => ({ on: '&', pool, lv: [3, 6], scale: 4, rate: .26, safe: 0 });
const INK_B = inkFoes('B'), INK_C = inkFoes('C');

CAMPUS_MAPS.s1 = {
  music: 'route', theme: 't_street', chapter: 0,
  rows: [
    '##======,,,,======##',
    '##......,,,,......##',
    '##.....!,,,,p.....##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,!.....##',
    '##......,,,,......##',
    '##.....p,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##================##',
  ],
  /* 左上陳家公寓、左下早餐店、右上李家公寓都進得去（居民樓，可以閒聊）；右下是自己家（透天厝，木門＋地墊）。
     巷子往南是死巷（圍牆），往北整條路寬都通到大馬路口。起點這裡不放商店。 */
  props: [['flatd', 2, 2], ['bkfast', 2, 10], ['flatyd', 13, 2], ['house', 13, 9]],
  doorWarps: {
    '15,13': { label: '我家', to: 'house1f', tx: 4, ty: 6, dir: 'up', ret: { x: 15, y: 14 } },   // 自己家（一樓客廳，媽媽在這裡）
    '4,6':   { label: '陳家公寓', to: 'chenA1', tx: 4, ty: 6, dir: 'up', ret: { x: 4, y: 7 } },     // 兩層：奶奶與小豆，樓上是爸爸與姊姊
    '4,13':  { label: '早餐店', to: 'bkf', tx: 4, ty: 5, dir: 'up', ret: { x: 4, y: 14 } },
    '15,6':  { label: '李家公寓', to: 'liB1', tx: 4, ty: 6, dir: 'up', ret: { x: 15, y: 7 } },     // 三層：管理員、補習班老師、作家
  },
  warps: [8, 9, 10, 11].map(x => ({ x, y: 0, to: 'path1', tx: x, ty: 20, dir: 'up' })),
};

/* ---- 2. 大馬路口 20×22：教商店、道具，以及第一場草叢遭遇 ---- */
/* ---- 2. 通學路 20×22：河堤旁的步道，兩邊都是草叢——整段上學路收集碎片的主要地方 ----
   試玩回饋（2026-10-05）：「大馬路口改成通學路，都是草叢跟 NPC」，第一場戰鬥也在這裡。 */
CAMPUS_MAPS.path1 = {
  music: 'route', theme: 't_campus', chapter: 0, tutorial: 1,
  rows: [
    'TTTTTTTT,,,,TTTTTTTT',
    'TT....T.,,,,.T....TT',
    'TTggggg.,,,,.gggggTT',
    'TTggggg.,,,,.gggggTT',
    'TTggggg.,,,,.gggggTT',
    'TT..T...,,,,...T..TT',
    'TT......,,,,......TT',
    'TTggg..F,,,,F..gggTT',
    'TTggg...,,,,...gggTT',
    'TTggg...,,,,...gggTT',
    'TT...T..,,,,..T...TT',
    'TT~~~...,,,,......TT',
    'TT~~~...,,,,.gggggTT',
    'TT.....L,,,,.gggggTT',
    'TTgggg..,,,,..ggggTT',
    'TTgggg..,,,,..ggggTT',
    'TTgggg.L,,,,L.ggggTT',
    'TT......,,,,......TT',
    'TT..T...,,,,...T..TT',
    'TTggg...,,,,...gggTT',
    'TTggg...,,,,...gggTT',
    'TTTTTTTT,,,,TTTTTTTT',
  ],
  props: [],
  /* 等級跟著碎片數慢慢長：一開始 Lv2–4，四片時 Lv10–12，回家路上還是有得練 */
  foes: { lv: [2, 4], scale: 2, pool: 'A', rate: .18, safe: 1 },
  warps: [8, 9, 10, 11].flatMap(x => [
    { x, y: 21, to: 's1', tx: x, ty: 1,  dir: 'down' },
    { x, y: 0,  to: 's2', tx: x, ty: 20, dir: 'up' },
  ]),
};

CAMPUS_MAPS.s2 = {
  music: 'route', theme: 't_street', chapter: 0,
  /* 十字路口：只有補給站（左下，回血）與便利商店（左上，買東西）。草叢搬到通學路了。 */
  rows: [
    '##======,,,,======##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##.:.!..,,,,.!..L.##',
    '##......,,,,......##',
    ',4,,,,00,,,,00,,,,4,',
    ',4,,,,00,,,,00,,,,4,',
    ';4;;;;00,,,,00;;;;4;',
    ',4,,,,00,,,,00,,,,4,',
    ',4,,,,00,,,,00,,,,4,',
    ',4,,,,00,,,,00,,,,4,',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##......,,,,......##',
    '##======,,,,======##',
  ],
  props: [['cvs', 2, 3], ['flatyd', 13, 2], ['clinic', 2, 16], ['flatx', 13, 16]],
  doorWarps: {
    '4,6':  { plate: 'shop', label: '便利商店', to: 'store_h',  tx: 5, ty: 5, dir: 'up', ret: { x: 4, y: 7 } },    // 便利商店
    '4,19': { plate: 'cross', label: '補給站', to: 'pharmacy', tx: 4, ty: 5, dir: 'up', ret: { x: 4, y: 20 } },   // 補給站
    '15,6': { label: '幸福大樓', to: 'xfC1', tx: 4, ty: 6, dir: 'up', ret: { x: 15, y: 7 } },               // 四層：管理員、上班族、退休國文老師、頂樓養鴿子的阿伯
  },
  warps: [8, 9, 10, 11].flatMap(x => [
    { x, y: 21, to: 'path1', tx: x,     ty: 1,  dir: 'down' },
    { x, y: 0,  to: 's3',    tx: x + 1, ty: 14, dir: 'up' },
  ]),
};

/* 補給站（大馬路口的小診所）：跟保健室同一個格局，阿姨換人 */
CAMPUS_MAPS.pharmacy = {
  music: 'town', theme: 't_dawn', chapter: 0, indoor: 1,
  rows: [
    'ww*wwww*ww',
    'wb_kkk__bw',
    'w________w',
    'wtttt____w',
    'w_p____p_w',
    'w________w',
    'wwww__wwww',
  ],
  warps: [{ x: 4, y: 6, to: '@ret' }, { x: 5, y: 6, to: '@ret' }],
  npcs: [{ role: 'pharmacist', x: 2, y: 2, dir: 'down' }],
};

/* ---- 3. 校門前 22×16：教碎片、鍛造、錯題本。往上穿過圍牆就進校園 ---- */
CAMPUS_MAPS.s3 = {
  music: 'route', theme: 't_street', chapter: 0,
  /* 北邊是開著的校門（中間兩格走得過去），往下一條人行道接到斑馬線。
     斑馬線一路通到下緣，走下去就回大馬路口。 */
  rows: [
    '########......########',
    '##======......======##',
    '##========,,========##',
    '##........,,........##',
    '##..!..2..,,..2..!..##',
    '##........,,........##',
    '##........,,........##',
    '##........,,........##',
    '##........,,........##',
    '##.ggggg..,,..ggggg.##',
    '##.ggggg`.,,.`ggggg.##',
    '##.ggggg..,,..ggggg.##',
    ',4,,,,,,,0000,,,,,,,4,',
    ';4;;;;;;;0000;;;;;;;4;',
    ',4,,,,,,,0000,,,,,,,4,',
    ',4=======0000=======4,',
  ],
  props: [['gateopen', 8, 0]],
  /* 斑馬線兩側的草叢（試玩回饋：校門前也補一些，收集碎片才不會太難） */
  foes: { lv: [3, 5], scale: 3, pool: 'A', rate: .16, safe: 2 },
  warps: [
    { x: 10, y: 0, to: 'front', tx: 12, ty: 16, dir: 'up' },
    { x: 11, y: 0, to: 'front', tx: 13, ty: 16, dir: 'up' },
    ...[9, 10, 11, 12].map(x => ({ x, y: 15, to: 's2', tx: x - 1, ty: 1, dir: 'down' })),
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
    'TT...................gggTT',
    'TT...................gggTT',
    'TT...................gggTT',
    'TT...................gggTT',
    'TT...................gggTT',
    'TT...................gggTT',
    'TT......................TT',
    'TT,,,,,,,,,,,,,,,,,,,,,,TT',
    'TT2,,,n,,,,,,,,,,,,,,,,,TT',
    'TT,FFFFFFF,T,,,T,,=====,TT',
    'TT,Fdd9ddF,F,,,F,,,,,,,,TT',
    'TT,F,,,,,F,,,,,,,,,,,,,,TT',
    'TT,FFFFFFF,,,,,,,,=,,,=,TT',
    'TT,,,,,,,,,T,,,T,,,,,,,,TT',
    'TT,,,,,,,{,F,,,F-,,,6,,,TT',
    'TT,,,,,2,,,,,,,,,f,,,TT,TT',
    'TT========......========TT',
    'TT========......========TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  /* 保健室、教學樓、警衛室、校門 */
  props: [['clinic', 2, 4], ['block', 9, 1], ['guard', 3, 15], ['gateopen', 10, 17]],
  /* 教學樓旁的雜草叢：校內可以練功的地方。等級跟著碎片數長（0 片 Lv2–5 … 4 片 Lv18–21），
     對齊舊版六條步道的曲線 —— 校園一開學就全部走得到，不能用「哪張地圖」決定強弱。 */
  foes: { lv: [2, 5], scale: 4, pool: 'A', rate: .16, safe: 2 },
  doorWarps: {
    '4,7':  { plate: 'cross', label: '保健室', to: 'clinic_h', tx: 5, ty: 5, dir: 'up', ret: { x: 4,  y: 8 } },
    '14,7': { plate: 'class', label: '教學樓', to: 'hall',     tx: 11, ty: 10, dir: 'up', ret: { x: 14, y: 8 } },   // 教學樓大門→穿堂
  },
  /* 校門開著：從中間走出去就回到校門前（通學路改成雙向，2026-10-05） */
  warps: [
    { x: 12, y: 18, to: 's3', tx: 10, ty: 1, dir: 'down' },
    { x: 13, y: 18, to: 's3', tx: 11, ty: 1, dir: 'down' },
  ],
  signs: {},
};

/* ---- 穿堂 24×12（室內・校園中樞，四個方向都通）---- */
CAMPUS_MAPS.hall = {
  music: 'town', theme: 't_campus', chapter: 1, indoor: 1,
  rows: [
    'wwwwwwww*ww__ww*wwwwwwww',
    'w__222_f__w__w__f_222__w',
    'w______________________w',
    'w_p__________________p_w',
    'ww____________________ww',
    '________________________',
    '________________________',
    'ww____________________ww',
    'w_p__________________p_w',
    'w&&&________________&&&w',
    'w&&&_2__2_w__w_2__2_&&&w',
    'wwwwwwwwwww__wwwwwwwwwww',
  ],
  foes: INK_B,
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
    'w7wWDWwzz*WDWwzzwWDWwzz*WDWwzzww',
    '________________________________',
    '_______&&_______&&____&&________',
    '_______&&_______&&____&&________',
    '11111111111111111111111111111111',
    '..T.....T.......TT.....T......T.',   // 欄杆外面是下方的中庭（只看得到、走不到），不要讓畫面外一片黑
    '..T.....T.......TT.....T......T.',
    '................................',
  ],
  foes: INK_B,
  doorWarps: {
    '4,1':  { plate: 'shop', label: '福利社', to: 'store_c', tx: 5, ty: 5, dir: 'up', ret: { x: 4,  y: 2 } },   // 福利社（通學路是單向的，校內要能補貨）
    '11,1': { plate: 'class', label: '自己的教室', to: 'c8',      tx: 6, ty: 7, dir: 'up', ret: { x: 11, y: 2 } },   // 自己的教室（王老師、筆靈）
    '18,1': { plate: 'class', label: '一年甲班', to: 'c1a',     tx: 6, ty: 7, dir: 'up', ret: { x: 18, y: 2 } },   // 一年甲班＝道館①
    '25,1': { plate: 'craft', label: '工藝教室', to: 'forge',   tx: 5, ty: 5, dir: 'up', ret: { x: 25, y: 2 } },   // 工藝教室（碎片合成、武器升階）
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
    'TTTT,,TTTTTTTTTTTT3333TT',   // 4–5：往北到操場的小路；18–21：爬滿藤蔓的舊牆角（二週目：硯海墨池的入口）
    'TT..,,................TT',
    'TTgg,,..........ggggggTT',
    'TTgg,,..........ggggggTT',
    'TTgg,,..........ggggggTT',
    'TTgg,,................TT',
    'TT..,,..ggggg.........TT',
    'TT..,,..ggggg.........TT',
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
  foes: { lv: [4, 7], scale: 4, pool: 'D', rate: .16, safe: 2 },
  props: [['artroom', 8, 1]],
  doorWarps: {
    '11,6': { plate: 'art', label: '文藝教室', to: 'yard', tx: 7, ty: 10, dir: 'up', ret: { x: 11, y: 7 },
              need: 2, gate: 'need2' },                       // 文藝教室＝道館③（要兩片碎片）
    /* 舊牆角的墨漬：二週目、三隻器靈都帶在身上才打得開（跟舊版墨泉鄉的泉眼同一套） */
    '19,0': { to: 'inkpool', tx: 7, ty: 10, dir: 'up', ret: { x: 19, y: 1 }, need: 'stone', hidden: 1 },   // hidden：秘密入口，不鋪地墊
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
    'TT.gggggg......gggggg.TT',
    'TT.gggggg......gggggg.TT',
    'TT.gggggg......gggggg.TT',
    'TT.gggggg......gggggg.TT',
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
  foes: { lv: [5, 8], scale: 4, pool: 'F', rate: .16, safe: 2 },
  props: [['audi', 6, 1]],
  doorWarps: {
    '11,8': { plate: 'hall', label: '大禮堂', to: 'aud', tx: 7, ty: 12, dir: 'up', ret: { x: 11, y: 9 },
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
    'ww*wwww*ww',
    'w__iiii__w',
    'w__iiii__w',
    'w________w',
    'w_________',
    'w___&&____',
    'w___&&___w',
    'wwwwwwwwww',
  ],
  foes: INK_B,
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
    'wzz*WDWwWWW*zzw22wWDWwWWW*zzw*ww',
    '_______________________________w',
    '_________&&_____&&_____&&______w',
    '_________&&_____&&_____&&______w',
    '11111111111111111111111111111111',
    '..T.....T.......TT.....T......T.',   // 欄杆外面是下方的中庭（只看得到、走不到），不要讓畫面外一片黑
    '..T.....T.......TT.....T......T.',
    '................................',
  ],
  foes: INK_C,
  doorWarps: {
    '5,1':  { plate: 'lib', label: '圖書館', to: 'lib',  tx: 7, ty: 10, dir: 'up', ret: { x: 5,  y: 2 },
              need: 1, gate: 'need1' },                       // 圖書館＝道館②
    '20,1': { plate: 'hist', label: '校史室', to: 'hist', tx: 6, ty: 10, dir: 'up', ret: { x: 20, y: 2 },
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
    'TTuu.ssss.jj.........gggggg.uuTT',   // 跳遠沙坑＋單槓
    'TTuu.ssss............gggggg.uuTT',
    'TTuu.................gggggg.uuTT',
    'TTuuuuuuuuuuuuuuuuuuuuuuuuuuuuTT',
    'TTuuuuuuuuuuuuuuuuuuuuuuuuuuuuTT',
    'TT,,,,,,,,,,,,,,,,,,,,,,,,,,,,TT',
    'TTTTTTTTTTTTTTT,,TTTTTTTTTTTTTTT',
  ],
  props: [],
  /* 操場角落的雜草叢（跟前庭同一套：等級跟著碎片數長，稍微強一點） */
  foes: { lv: [3, 6], scale: 4, pool: 'E', rate: .16, safe: 2 },
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
    'w_____(__w',
    'w_______)w',
    'w__rr___)w',
    'wp_rr____w',
    'w_______<w',
    'wwwwwwwwww',
  ],
  /* 房間在二樓：右下角那一格是往下的樓梯，走上去就到一樓客廳（媽媽在那裡）。序幕做完之前被擋住 */
  warps: [{ x: 8, y: 6, to: 'house1f', tx: 8, ty: 2, dir: 'down' }],
  gates: { '8,6': 'prologue' },
  acts: { '2,1': 'alarmClock', '6,2': 'schoolbag' },
  signs: { '3,0': 'rm_window', '8,0': 'rm_window', '7,1': 'rm_desk', '5,1': 'rm_shelf',
           '8,3': 'rm_closet', '8,4': 'rm_closet', '1,1': 'rm_bed' },
  npcs: [],
};

/* ---- 我家一樓 10×8（客廳＋廚房）----
   樓梯上去是我的房間；門出去是巷口。媽媽在廚房，跟她說話可以回滿體力。 */
CAMPUS_MAPS.house1f = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1,
  rows: [
    'wwww/w/www',
    'wttt____>w',
    'w________w',
    'w__qq____w',
    'w__$$__V_w',
    'wp_______w',
    'w__rr___pw',
    'wwww__wwww',
  ],
  warps: [
    { x: 8, y: 1, to: 'room', tx: 7, ty: 6, dir: 'left' },          // 往上的樓梯（一格）
    { x: 4, y: 7, to: '@ret' }, { x: 5, y: 7, to: '@ret' },
  ],
  npcs: [{ role: 'homeNpc', x: 2, y: 2, dir: 'down' }],
  signs: { '4,0': 'h1_window', '6,0': 'h1_window', '7,4': 'h1_tv', '1,1': 'h1_kitchen', '3,3': 'h1_table', '4,3': 'h1_table' },
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

/* ============================================================
   夢中小鎮 ① 注音坡（2026-10-06）
   ------------------------------------------------------------
   碎片留下來的夢。從一年甲班的旋渦進來，在這裡幫 3 件麻煩，道館的門才會開（W.dreams.zy）。
   · zy_town  小鎮：旋渦（醒來）、茶棚（休息處）、4 位委託人、壞掉的路牌（機關）、道館大門
   · zy_slope 坡道：草叢（B 區：1F 注音坡的妖怪）、3 個箱子（找回積木）、錯字大王
   · zy_gym   夢中的一年甲班：真正的小老師
   ============================================================ */
CAMPUS_MAPS.zy_town = {
  music: 'town', theme: 't_slope', chapter: 1, dream: 'zy',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT,,,,,,,,,,,,,,,,,,,,TT',
    'TT.T...L...,,...L...T.TT',
    'TT..F...,,,,,,,,...F..TT',
    'TT......,,,,,,,,......TT',
    'TT.S....,,,,,,,,....S.TT',
    'TT......,,,,,,,,......TT',
    'TT..mm.....,,.........TT',
    'TT.......F.,,...T.....TT',
    'TTT..F.T...,,..S..F..TTT',
    'TTTTTTTTTTT,,TTTTTTTTTTT',
  ],
  props: [['flatd', 2, 2], ['block8', 8, 1], ['flatyd', 17, 2]],
  doorWarps: {
    '4,6':  { label: '包子鋪', to: 'zy_bun1', tx: 4, ty: 6, dir: 'up', ret: { x: 4, y: 7 } },
    '19,6': { label: '坡下人家', to: 'zy_home', tx: 4, ty: 6, dir: 'up', ret: { x: 19, y: 7 } },
    '11,7': { plate: 'class', label: '夢中的一年甲班', to: 'zy_gym', tx: 6, ty: 7, dir: 'up', ret: { x: 11, y: 8 },
              needFlag: 'zyOpen', flagText: '（教室的大門被夢鎖著……要先把四個聲調找回來，放上小鎮裡的石板，門才會開。）' },
  },
  warps: [
    { x: 11, y: 17, to: 'zy_slope', tx: 9,  ty: 1, dir: 'down' },
    { x: 12, y: 17, to: 'zy_slope', tx: 10, ty: 1, dir: 'down' },
  ],
  /* 注音坡的解謎（2026-10-07 再改）：不接委託，直接探索。四個聲調的碎片藏在坡道草叢、路邊的房子裡（也有廢紙這種沒用的閃光點）；
     碎片拿到這四塊石板上，踩上去對得上就會亮，四塊都亮道館才開。小鎮裡只放 2 個閃光點，其餘在坡道與房子裡。 */
  sparks: {
    '3,13':  { id: 'zs_t1', title: '一團皺掉的紙屑', text: ['攤開來看，上面是小孩亂畫的ㄅㄆㄇ，畫得歪歪扭扭。'] },
    '20,16': { id: 'zs_t2', frag: 'zn1', title: '一聲的碎片 ˉ', text: ['碎片上是一條平平的橫線「ˉ」。', '「一聲：平平的，像把聲音拉成一條直線。」'] },
  },
  plates: { flag: 'zsAll', anyFlag: 'znAny',
    items: [
      { x: 3, y: 11, key: 'zn1', mark: 'ˉ', name: '一聲', note: 262, demo: '「ˉ」一聲：平平的，像把聲音拉成一條直線。\n例：媽（ㄇㄚ）。' },
      { x: 6, y: 11, key: 'zn2', mark: 'ˊ', name: '二聲', note: 330, demo: '「ˊ」二聲：往上揚，像在問「咦？」。\n例：麻（ㄇㄚˊ）。' },
      { x: 3, y: 14, key: 'zn3', mark: 'ˇ', name: '三聲', note: 392, demo: '「ˇ」三聲：先降後升，像嘆氣再慢慢站起來。\n例：馬（ㄇㄚˇ）。' },
      { x: 6, y: 14, key: 'zn4', mark: 'ˋ', name: '四聲', note: 523, demo: '「ˋ」四聲：往下掉，乾脆俐落，像在說「對！」。\n例：罵（ㄇㄚˋ）。' },
    ],
    missing: it => [`（石板上刻著「${it.name} ${it.mark}」，凹槽空空的。）`, '（身上沒有這一聲的碎片，也沒有萬能碎片。到坡道的草叢、路邊的房子裡找找閃光的地方。）'],
    done: ['（四塊石板同時亮起，發出清亮的音階。）', '（遠處的路牌，一面一面立了起來。）'] },
  signs: {},
};
CAMPUS_MAPS.zy_slope = {
  music: 'route', theme: 't_slope', chapter: 1, dream: 'zy',
  rows: [
    'TTTTTTTTT,,TTTTTTTTT',
    'TT.......,,.......TT',
    'TT.T...T.,,.......TT',
    'TTggggg..,,.......TT',
    'TTggggg..,,.......TT',
    'TTggggg..,,.T.....TT',
    'TTggggg..,,.......TT',
    'TT.......,,.......TT',
    'TT.F.....,,...T...TT',
    'TT..T..iiiiii.....TT',
    'TT.....iiiiii...F.TT',
    'TT.......,,.......TT',
    'TT.......,,..gggggTT',
    'TT.T...F.,,..gggggTT',
    'TT.......,,..gggggTT',
    'TT.......,,..gggggTT',
    'TTggggg..,,..gggggTT',
    'TTggggg..,,.......TT',
    'TTggggg..,,.T.....TT',
    'TTggggg.TS,....T..TT',
    'TT...F...,,..F....TT',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  foes: { lv: [5, 8], scale: 3, pool: 'B', rate: .17, safe: 2 },
  props: [['house', 13, 2]],
  doorWarps: { '15,6': { label: '坡上小屋', to: 'zy_hut', tx: 4, ty: 5, dir: 'up', ret: { x: 15, y: 7 } } },
  warps: [
    { x: 9,  y: 0, to: 'zy_town', tx: 11, ty: 16, dir: 'up' },
    { x: 10, y: 0, to: 'zy_town', tx: 12, ty: 16, dir: 'up' },
  ],
  /* 坡道的閃光點：草叢裡 4 個（兩個是真的碎片，兩個只是垃圾）；坡上有一間小屋可以進去 */
  sparks: {
    '3,4':   { id: 'zs_s1', title: '一個空的墨水瓶', text: ['瓶底還黏著一點乾掉的墨，聞起來像舊教室的味道。'] },
    '15,13': { id: 'zs_s2', frag: 'zn3', title: '三聲的碎片 ˇ', text: ['碎片上是一個小小的「ˇ」。', '「三聲：先降後升，像嘆氣——先低下去，再慢慢站起來。」'] },
    '5,17':  { id: 'zs_s3', title: '半截粉筆', text: ['粉筆斷成兩截，上面還有牙印。是誰在緊張的時候咬的呢？'] },
    '4,19':  { id: 'zs_s4', frag: 'zn4', title: '四聲的碎片 ˋ', text: ['碎片上是一條往右下掉的線「ˋ」。', '「四聲：往下掉，乾脆俐落，像在說「對！」。」'] },
  },
  chests: [
    { x: 5,  y: 7,  id: 'zyb1', items: { hint: 1 } },
    { x: 16, y: 18, id: 'zyb2', items: { heal: 1 } },
    { x: 4,  y: 15, id: 'zyb3', items: { hint: 1 } },
  ],
  signs: { '9,19': 'zy_rest' },
};
CAMPUS_MAPS.zy_gym = {
  music: 'town', theme: 't_campus', chapter: 1, indoor: 1, dream: 'zy',
  rows: [
    'w**wBBBBBB*w',
    'w____e_____w',
    'w__________w',
    'w_??_rr_??_w',
    'w_$______$_w',
    'w_??_rr_??_w',
    'wp$$____$$pw',
    'w__________w',
    'wwwww__wwwww',
  ],
  warps: [
    { x: 5, y: 8, to: 'zy_town', tx: 11, ty: 8, dir: 'down' },
    { x: 6, y: 8, to: 'zy_town', tx: 12, ty: 8, dir: 'down' },
  ],
  signs: {},
};

/* ============================================================
   夢中小鎮 ② 書海港（圖書館的夢，W.dreams.dj）
   ------------------------------------------------------------
   成語圖書股長怕被比較：居民是她「收藏卻沒讀懂」的成語。港口、棧橋、書箱。
   進夢：現實的圖書館（lib）→ 書頁翻飛（pages）→ 這裡。
   dj_town 書海港：攤開的書（醒來）、茶亭（休息）、4 位委託人、周以恆、3 塊成語石碑（機關）、道館大門
   dj_pier 船埠：C 區妖怪、3 個寶箱（走失的借書證）、鈴鐺小偷、青蛙學弟
   dj_gym 夢中的圖書館：真正的股長
   ============================================================ */
CAMPUS_MAPS.dj_town = {
  music: 'town', theme: 't_port', chapter: 2, dream: 'dj',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT,,,,,,,,,,,,,,,,,,,,TT',
    'TT.....,S,,,,,,,S.....TT',
    'TTO....,,,,,,,,,,....OTT',
    'TT~~~~~~~~++++~~~~~~~~TT',
    'TT~~~~~~~~++++~~~~~~~~TT',
    'TT~~~~~~~~+++O~~~~~~~~TT',
    'TT~~~~~~~~++++~~~~~~~~TT',
    'TT~~~~~~~~++++~~~~~~~~TT',
    'TT~~~~~~~~++++~~~~~~~~TT',
    'TTTTTTTTTTT++TTTTTTTTTTT',
  ],
  props: [['shopx', 2, 2], ['lib8', 8, 1], ['flaty', 17, 2]],
  doorWarps: {
    '11,7': { plate: 'lib', label: '夢中的圖書館', to: 'dj_gym', tx: 7, ty: 10, dir: 'up', ret: { x: 11, y: 8 },
              needFlag: 'djOpen', flagText: '（圖書館的大門被夢鎖著……先幫港口的人解決麻煩吧。）' },
  },
  warps: [
    { x: 11, y: 17, to: 'dj_pier', tx: 9,  ty: 1, dir: 'down' },
    { x: 12, y: 17, to: 'dj_pier', tx: 10, ty: 1, dir: 'down' },
  ],
  devices: {
    '2,10':  { group: 'djstone', flag: 'ds1', cat: '成語', label: '成語石碑',
      text: '石碑上刻著一個成語，缺了一個字。碑腳下坐著一隻兔子的石像……\n（把缺的字補回去，石碑就會亮起來。）',
      ok: '缺的字回到了石碑上，石碑亮了起來！', allText: '三塊石碑都亮起來了！' },
    '21,10': { group: 'djstone', flag: 'ds2', cat: '成語', label: '成語石碑',
      text: '第二塊石碑被海風磨得看不清楚，只剩下半個字。', ok: '字跡清楚了，石碑也亮了！', allText: '三塊石碑都亮起來了！' },
    '13,13': { group: 'djstone', flag: 'ds3', cat: '成語', label: '成語石碑', under: '+',
      text: '棧橋邊的最後一塊石碑，浪花打濕了一半的字。', ok: '最後一塊石碑也亮了——整座港口的石碑都連成了一句話！',
      allText: '三塊石碑都亮起來了——港口的人不會再「守著樹墩等兔子」了！', onAll: 'dsAll' },
  },
  signs: { '8,9': 'dj_board1', '16,9': 'dj_board2' },
};
CAMPUS_MAPS.dj_pier = {
  music: 'town', theme: 't_port', chapter: 2, dream: 'dj',
  rows: [
    'TTTTTTTTT++TTTTTTTTT',
    'TT.......++.......TT',
    'TT.......++.......TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT.ggggg.,,.......TT',
    'TT.ggggg.,,.......TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.......,,.ggggg.TT',
    'TT~~~~...,,.ggggg.TT',
    'TT~~~~...,,.......TT',
    'TT~~~~...,,.......TT',
    'TT~~~~...,,.......TT',
    'TT.......,,.....O.TT',
    'TT.ggggg.,,.......TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg,,,,ggggg.TT',
    'TT.ggggg,,,,ggggg.TT',
    'TT......,,,,......TT',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  foes: { lv: [9, 12], scale: 3, pool: 'C', rate: .17, safe: 2 },
  warps: [
    { x: 9,  y: 0, to: 'dj_town', tx: 11, ty: 16, dir: 'up' },
    { x: 10, y: 0, to: 'dj_town', tx: 12, ty: 16, dir: 'up' },
  ],
  chests: [
    { x: 3,  y: 2,  id: 'djb1', items: { hint: 1 } },
    { x: 17, y: 12, id: 'djb2', items: { heal: 1 } },
    { x: 10, y: 20, id: 'djb3', items: { hint: 1 } },
  ],
  signs: { '16,14': 'dj_well' },
};
CAMPUS_MAPS.dj_gym = {
  music: 'hall', theme: 't_library', chapter: 2, indoor: 1, dream: 'dj',
  rows: [
    'wwww**wwww**wwww',
    'wkk__________kkw',
    'w______________w',
    'w_kkkk____kkkk_w',
    'w______________w',
    'w_kkkk____kkkk_w',
    'w______________w',
    'wp____________pw',
    'w______________w',
    'w______________w',
    'w______________w',
    'wwwwwww__wwwwwww',
  ],
  warps: [
    { x: 7, y: 11, to: 'dj_town', tx: 11, ty: 8, dir: 'down' },
    { x: 8, y: 11, to: 'dj_town', tx: 12, ty: 8, dir: 'down' },
  ],
  signs: {},
};

/* ============================================================
   夢中小鎮 ③ 花南街（文藝教室的夢，W.dreams.hn）
   ------------------------------------------------------------
   現代文青助教怕「不夠美」：居民是他「過度裝飾」的修辭（譬喻、擬人、誇飾、排比）。下著花雨的街。
   進夢：現實的文藝教室（yard）→ 助教本人邀你 → 花雨落下（petals）→ 這裡。
   hn_town 花南街：含苞的花（醒來）、花攤老闆娘（休息）、4 位委託人、小婷、3 盆花（機關）、道館大門
   hn_pavilion 聽雨亭：D 區妖怪、3 個寶箱（走失的風鈴）、吹牛的漁夫、雙胞胎、老詩人
   hn_gym 夢中的花室：真正的助教
   ============================================================ */
CAMPUS_MAPS.hn_town = {
  music: 'town', theme: 't_flower', chapter: 3, dream: 'hn',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TT....................TT',
    'TT.F................F.TT',
    'TT.F................F.TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT,,,,,,,,,,,,,,,,,,,,TT',
    'TT.mmm.F.S,,,.SF.mmm..TT',
    'TT.....F..,,,..F......TT',
    'TT....~~~~,,,,~~~~....TT',
    'TT....~~~~,,,,~~~~....TT',
    'TT..F.~~~~,,,,~~~~.F..TT',
    'TT....~~~~,,,,~~~~....TT',
    'TT....~~~~,,,,~~~~....TT',
    'TT....~~~~,,,,~~~~....TT',
    'TTTTTTTTTTT,,TTTTTTTTTTT',
  ],
  props: [['artroom', 8, 1]],
  doorWarps: {
    '11,6': { plate: 'art', label: '夢中的花室', to: 'hn_gym', tx: 7, ty: 10, dir: 'up', ret: { x: 11, y: 7 },
              needFlag: 'hnOpen', flagText: '（溫室的門被花雨鎖著……先幫街上的人解決麻煩吧。）' },
  },
  warps: [
    { x: 11, y: 17, to: 'hn_pavilion', tx: 9,  ty: 1, dir: 'down' },
    { x: 12, y: 17, to: 'hn_pavilion', tx: 10, ty: 1, dir: 'down' },
  ],
  devices: {
    '7,10':  { group: 'hnflower', flag: 'hf1', cat: '修辭', label: '低頭的花', under: 'F',
      text: '一盆花低著頭，花瓣上寫滿了「像……像……」。\n（把它到底像什麼說清楚，花就會開。）',
      ok: '花瓣舒展開來——「像」說完了，剩下的就是花本身。', allText: '三盆花都開了！' },
    '15,10': { group: 'hnflower', flag: 'hf2', cat: '修辭', label: '低頭的花', under: 'F',
      text: '第二盆花的葉子上掛著一長串形容詞，壓得它抬不起頭。', ok: '形容詞落了下來，花也抬起頭了！', allText: '三盆花都開了！' },
    '19,13': { group: 'hnflower', flag: 'hf3', cat: '修辭', label: '低頭的花', under: 'F',
      text: '最後一盆花，被雨淋得只剩下花苞。', ok: '最後一盆也開了——整條街的花，都看得見了！',
      allText: '三盆花都開了——賣花人再也不用只會說「像……」了！', onAll: 'hfAll' },
  },
  signs: { '9,9': 'hn_board1', '14,9': 'hn_board2' },
};
CAMPUS_MAPS.hn_pavilion = {
  music: 'town', theme: 't_flower', chapter: 3, dream: 'hn',
  rows: [
    'TTTTTTTTT,,TTTTTTTTT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT~~~~...,,...~~~~TT',
    'TT~~~~...,,...~~~~TT',
    'TT~~~~...,,...~~~~TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT.......,,S......TT',
    'TT.......AA.......TT',
    'TT.......AA.......TT',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  foes: { lv: [12, 15], scale: 3, pool: 'D', rate: .17, safe: 2 },
  warps: [
    { x: 9,  y: 0, to: 'hn_town', tx: 11, ty: 16, dir: 'up' },
    { x: 10, y: 0, to: 'hn_town', tx: 12, ty: 16, dir: 'up' },
  ],
  chests: [
    { x: 3,  y: 2,  id: 'hnb1', items: { hint: 1 } },
    { x: 16, y: 12, id: 'hnb2', items: { heal: 1 } },
    { x: 3,  y: 17, id: 'hnb3', items: { hint: 1 } },
  ],
  signs: { '11,18': 'hn_rain' },
};
CAMPUS_MAPS.hn_gym = {
  music: 'hall', theme: 't_flower', chapter: 3, indoor: 1, dream: 'hn',
  rows: [
    'www**wwwwww**www',
    'w____t____t____w',
    'w_FF________FF_w',
    'w______rr______w',
    'w_~~~__rr__~~~_w',
    'w_~~~__rr__~~~_w',
    'w______rr______w',
    'w_FF___rr___FF_w',
    'w______________w',
    'wp____A__A____pw',
    'w______________w',
    'wwwwwww__wwwwwww',
  ],
  warps: [
    { x: 7, y: 11, to: 'hn_town', tx: 11, ty: 7, dir: 'down' },
    { x: 8, y: 11, to: 'hn_town', tx: 12, ty: 7, dir: 'down' },
  ],
  signs: {},
};

/* ============================================================
   夢中小鎮 ④ 碑林關（校史室的夢，W.dreams.pl）
   ------------------------------------------------------------
   古典研究助教怕「被遺忘」：居民是刻在碑上、沒人再讀的古人話。夜裡的關隘書院，滿山遍野都是碑。
   整座夢是文言文風格：居民說淺近文言（每句下面一行白話「譯」），夢裡所有戰鬥與題目都只考文言（W.dreams.pl.onlyCat）。
   進夢：現實的校史室（hist）→ 讀歷屆榜（不戰鬥）→ 墨暈（ink）→ 這裡。
   pl_town 碑林關：還鄉碑（醒來）、驛站老卒（休息）、4 位委託人、周以恆、3 座古文石碑（機關）、書院大門
   pl_road 古碑小徑：E 區妖怪、3 個寶箱（走失的竹簡）、迂腐的書生、師兄弟、守碑老人
   pl_gym 夢中的檔案室：真正的助教
   ============================================================ */
CAMPUS_MAPS.pl_town = {
  music: 'town', theme: 't_stele', chapter: 4, dream: 'pl',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT....................TT',
    'TT,,,,,,,,,,,,,,,,,,,,TT',
    'TT.......S,,,,S.......TT',
    'TT........,,,,........TT',
    'TT.O.O.O..,,,,..O.O.O.TT',
    'TT........,,,,........TT',
    'TT.O.O.O..,,,,..O.O.O.TT',
    'TT........,,,,........TT',
    'TT.O.O.O..,,,,..O.O.O.TT',
    'TT........,,,,........TT',
    'TTTTTTTTTTT,,TTTTTTTTTTT',
  ],
  props: [['oldblock', 7, 1]],
  doorWarps: {
    '11,7': { plate: 'hist', label: '夢中的檔案室', to: 'pl_gym', tx: 7, ty: 10, dir: 'up', ret: { x: 11, y: 8 },
              needFlag: 'plOpen', flagText: '（書院的門被墨封著……先幫關裡的人解決麻煩吧。）' },
  },
  warps: [
    { x: 11, y: 17, to: 'pl_road', tx: 9,  ty: 1, dir: 'down' },
    { x: 12, y: 17, to: 'pl_road', tx: 10, ty: 1, dir: 'down' },
  ],
  devices: {
    '3,11':  { group: 'plstone', flag: 'ps1', cat: '文言', label: '古文石碑',
      text: '碑上刻著一句古文，缺了一個虛詞，墨痕尚濕。\n（把缺的字補回去，石碑就會亮起來。）',
      ok: '缺字回到了碑上，石碑亮了起來！', allText: '三座石碑都亮起來了！' },
    '20,13': { group: 'plstone', flag: 'ps2', cat: '文言', label: '古文石碑',
      text: '第二座碑被風雨磨得看不清楚，只剩半句。', ok: '字跡清楚了，石碑也亮了！', allText: '三座石碑都亮起來了！' },
    '7,15':  { group: 'plstone', flag: 'ps3', cat: '文言', label: '古文石碑',
      text: '碑林深處的最後一座碑，字被青苔蓋住了一半。', ok: '最後一座碑也亮了——整片碑林連成了一篇文章！',
      allText: '三座碑都亮起來了——關門前的碑，再沒有缺字了！', onAll: 'psAll' },
  },
  signs: { '9,9': 'pl_gate', '14,9': 'pl_board' },
};
CAMPUS_MAPS.pl_road = {
  music: 'town', theme: 't_stele', chapter: 4, dream: 'pl',
  rows: [
    'TTTTTTTTT,,TTTTTTTTT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TTOOOO...,,...OOOOTT',
    'TTOOOO...,,...OOOOTT',
    'TTOOOO...,,...OOOOTT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.ggggg.,,.ggggg.TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT.......,,S......TT',
    'TT.......OO.......TT',
    'TT.......OO.......TT',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  foes: { lv: [14, 17], scale: 3, pool: 'E', rate: .17, safe: 2 },
  warps: [
    { x: 9,  y: 0, to: 'pl_town', tx: 11, ty: 16, dir: 'up' },
    { x: 10, y: 0, to: 'pl_town', tx: 12, ty: 16, dir: 'up' },
  ],
  chests: [
    { x: 3,  y: 2,  id: 'plb1', items: { hint: 1 } },
    { x: 16, y: 12, id: 'plb2', items: { heal: 1 } },
    { x: 3,  y: 17, id: 'plb3', items: { hint: 1 } },
  ],
  signs: { '11,18': 'pl_road' },
};
CAMPUS_MAPS.pl_gym = {
  music: 'hall', theme: 't_stele', chapter: 4, indoor: 1, dream: 'pl',
  rows: [
    'wwwwwwwwwwwwwwww',
    'wkk____tt____kkw',
    'w______________w',
    'wkkk__kkkk__kkkw',
    'w______________w',
    'w_p__________p_w',
    'w______________w',
    'wk__OO____OO__kw',
    'w______________w',
    'w______________w',
    'w______________w',
    'wwwwwww__wwwwwww',
  ],
  warps: [
    { x: 7, y: 11, to: 'pl_town', tx: 11, ty: 8, dir: 'down' },
    { x: 8, y: 11, to: 'pl_town', tx: 12, ty: 8, dir: 'down' },
  ],
  signs: {},
};

/* ---- 注音坡的三間房子（2026-10-07）---- */
/* 注音坡的包子鋪 1F（鎮上左邊的房子）：老闆娘 */
CAMPUS_MAPS.zy_bun1 = {
  music: 'town', theme: 't_home', chapter: 1, indoor: 1, dream: 'zy',
  rows: [
    'wwww/w/www',
    'wtt_____>w',
    'w________w',
    'w_qq__qq_w',
    'w_$$__$$_w',
    'wp_______w',
    'w_rr___p_w',
    'wwww__wwww',
  ],
  warps: [
    { x: 8, y: 1, to: 'zy_bun2', tx: 7, ty: 6, dir: 'left' },
    { x: 4, y: 7, to: '@ret' },
    { x: 5, y: 7, to: '@ret' },
  ],
  sparks: {
    '8,5': { id: 'zs_b1', title: '一袋麵粉', text: ['袋子上的字被麵粉蓋住了，只看得出「發」字的一半。'] },
  },
  npcs: [],
};

/* 注音坡的包子鋪 2F：老闆娘的臥室，床邊藏著二聲的碎片 */
CAMPUS_MAPS.zy_bun2 = {
  music: 'town', theme: 't_home', chapter: 1, indoor: 1, dream: 'zy',
  rows: [
    'www/wwww/w',
    'wb_)__[__w',
    'w________w',
    'w_k___b__w',
    'w________w',
    'wp_rr____w',
    'w_rr____<w',
    'wwwwwwwwww',
  ],
  warps: [
    { x: 8, y: 6, to: 'zy_bun1', tx: 8, ty: 2, dir: 'down' },
  ],
  sparks: {
    '3,4': { id: 'zs_b2', frag: 'zn2', title: '二聲的碎片 ˊ', text: ['碎片上是一條往右上揚的線「ˊ」。', '「二聲：往上揚，像在問「咦？」。」'] },
  },
  npcs: [],
};

/* 坡下人家（鎮上右邊的房子）：小愛 */
CAMPUS_MAPS.zy_home = {
  music: 'town', theme: 't_home', chapter: 1, indoor: 1, dream: 'zy',
  rows: [
    'wwww/w/www',
    'wkk______w',
    'w________w',
    'w_qq_____w',
    'w_$$__pk_w',
    'w________w',
    'wp__rr___w',
    'wwww__wwww',
  ],
  warps: [
    { x: 4, y: 7, to: '@ret' },
    { x: 5, y: 7, to: '@ret' },
  ],
  sparks: {
    '7,5': { id: 'zs_h1', title: '一本舊作業簿', text: ['翻開來，每一頁的字都寫得很用力，擦了又寫、寫了又擦，紙都磨薄了。'] },
  },
  npcs: [],
};

/* 坡上小屋：沒人住的小屋，角落裡只有一些舊東西 */
CAMPUS_MAPS.zy_hut = {
  music: 'town', theme: 't_home', chapter: 1, indoor: 1, dream: 'zy',
  rows: [
    'wwww/w/www',
    'wk______kw',
    'w________w',
    'w__rr____w',
    'wp_rr___pw',
    'w________w',
    'wwww__wwww',
  ],
  warps: [
    { x: 4, y: 6, to: '@ret' },
    { x: 5, y: 6, to: '@ret' },
  ],
  sparks: {
    '2,5': { id: 'zs_u1', title: '一隻舊鞋墊', text: ['……為什麼會有鞋墊在這裡？不管了。'] },
  },
  npcs: [],
};

/* ============ 居民樓（2026-10-07）：巷口與大馬路口的公寓、早餐店，進得去、有人可以閒聊 ============ */
/* 陳家公寓 1F（巷口左上，兩層）：奶奶與小豆 */
CAMPUS_MAPS.chenA1 = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1,
  rows: [
    'wwww/w/www',
    'wkk_____>w',
    'w________w',
    'w_qq_____w',
    'w_$$__pk_w',
    'w________w',
    'wp__rr___w',
    'wwww__wwww',
  ],
  warps: [
    { x: 8, y: 1, to: 'chenA2', tx: 7, ty: 6, dir: 'left' },
    { x: 4, y: 7, to: '@ret' },
    { x: 5, y: 7, to: '@ret' },
  ],
  npcs: [],
};

/* 陳家公寓 2F：剛下夜班的爸爸、準備會考的姊姊 */
CAMPUS_MAPS.chenA2 = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1,
  rows: [
    'www/wwww/w',
    'wb_)__[__w',
    'w________w',
    'w_k___b__w',
    'w________w',
    'wp_rr____w',
    'w_rr____<w',
    'wwwwwwwwww',
  ],
  warps: [
    { x: 8, y: 6, to: 'chenA1', tx: 8, ty: 2, dir: 'down' },
  ],
  npcs: [],
};

/* 李家公寓 1F（巷口右上，三層）：管理員與送報的大哥 */
CAMPUS_MAPS.liB1 = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1,
  rows: [
    'wwww/w/www',
    'wtt_____>w',
    'w________w',
    'w_kk_____w',
    'w________w',
    'w_rr___p_w',
    'wprr_____w',
    'wwww__wwww',
  ],
  warps: [
    { x: 8, y: 1, to: 'liB2', tx: 7, ty: 6, dir: 'left' },
    { x: 4, y: 7, to: '@ret' },
    { x: 5, y: 7, to: '@ret' },
  ],
  npcs: [],
};

/* 李家公寓 2F：補習班李老師與助教姊姊 */
CAMPUS_MAPS.liB2 = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1,
  rows: [
    'www/wwww/w',
    'wkk[____>w',
    'w________w',
    'w_qq_____w',
    'w_$$_____w',
    'wp_rr____w',
    'w__rr___<w',
    'wwwwwwwwww',
  ],
  warps: [
    { x: 8, y: 1, to: 'liB3', tx: 7, ty: 6, dir: 'left' },
    { x: 8, y: 6, to: 'liB1', tx: 8, ty: 2, dir: 'down' },
  ],
  npcs: [],
};

/* 李家公寓 3F：關在房間裡的作家與來催稿的編輯 */
CAMPUS_MAPS.liB3 = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1,
  rows: [
    'www/wwww/w',
    'w[[_kkb__w',
    'w________w',
    'w_______kw',
    'w_rr_____w',
    'wprr_____w',
    'w_______<w',
    'wwwwwwwwww',
  ],
  warps: [
    { x: 8, y: 6, to: 'liB2', tx: 8, ty: 2, dir: 'down' },
  ],
  npcs: [],
};

/* 幸福大樓 1F（大馬路口右上，四層）：警衛阿伯與外送員 */
CAMPUS_MAPS.xfC1 = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1,
  rows: [
    'wwww/w/www',
    'wtt_____>w',
    'w________w',
    'w__kk____w',
    'w________w',
    'wp__rr__pw',
    'w___rr___w',
    'wwww__wwww',
  ],
  warps: [
    { x: 8, y: 1, to: 'xfC2', tx: 7, ty: 6, dir: 'left' },
    { x: 4, y: 7, to: '@ret' },
    { x: 5, y: 7, to: '@ret' },
  ],
  npcs: [],
};

/* 幸福大樓 2F：上班族姊姊與加班的叔叔 */
CAMPUS_MAPS.xfC2 = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1,
  rows: [
    'www/wwww/w',
    'wk[_____>w',
    'w________w',
    'w_qq__k__w',
    'w_$$_____w',
    'wp_rr____w',
    'w__rr___<w',
    'wwwwwwwwww',
  ],
  warps: [
    { x: 8, y: 1, to: 'xfC3', tx: 7, ty: 6, dir: 'left' },
    { x: 8, y: 6, to: 'xfC1', tx: 8, ty: 2, dir: 'down' },
  ],
  npcs: [],
};

/* 幸福大樓 3F：退休的國文老師 */
CAMPUS_MAPS.xfC3 = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1,
  rows: [
    'www/wwww/w',
    'wkkkk_kk>w',
    'w________w',
    'w_qq_____w',
    'w_$$__k__w',
    'wp_rr____w',
    'w__rr___<w',
    'wwwwwwwwww',
  ],
  warps: [
    { x: 8, y: 1, to: 'xfC4', tx: 7, ty: 6, dir: 'left' },
    { x: 8, y: 6, to: 'xfC2', tx: 8, ty: 2, dir: 'down' },
  ],
  npcs: [],
};

/* 幸福大樓 4F（頂樓加蓋）：養鴿子的阿伯與小朋友 */
CAMPUS_MAPS.xfC4 = {
  music: 'town', theme: 't_home', chapter: 0, indoor: 1,
  rows: [
    'www/wwww/w',
    'wb_)____kw',
    'w________w',
    'w_rr_____w',
    'wprr__qq_w',
    'w_____$$_w',
    'w_______<w',
    'wwwwwwwwww',
  ],
  warps: [
    { x: 8, y: 6, to: 'xfC3', tx: 8, ty: 2, dir: 'down' },
  ],
  npcs: [],
};

/* 早餐店（巷口左下）：老闆娘與兩位客人 */
CAMPUS_MAPS.bkf = {
  music: 'town', theme: 't_shop', chapter: 0, indoor: 1,
  rows: [
    'ww*wwww*ww',
    'wkkk__kkkw',
    'w__ttttt_w',
    'w________w',
    'w_qq__qq_w',
    'w_$$__$$_w',
    'wwww__wwww',
  ],
  warps: [
    { x: 4, y: 6, to: '@ret' },
    { x: 5, y: 6, to: '@ret' },
  ],
  npcs: [],
};

const CAMPUS_NPCS = {
  zy_bun1: [{ role: 'zyG3', x: 3, y: 1, dir: 'down' }],
  zy_home: [{ role: 'zyG4', x: 4, y: 2, dir: 'down' }],
  s2: [
    { role: 'chatBus', x: 4, y: 8, dir: 'up' },
    { role: 'chatDog', x: 16, y: 8, dir: 'left', wander: 1 },
  ],

  /* 居民樓與街坊：只閒聊（kind: 'chat'），每次說話換一段 */
  chenA1: [{ role: 'chatChenGma', x: 4, y: 2, dir: 'down' }, { role: 'chatXiaodou', x: 6, y: 5, dir: 'left' }],
  chenA2: [{ role: 'chatChenDad', x: 5, y: 3, dir: 'right' }, { role: 'chatSister', x: 6, y: 2, dir: 'up' }],
  liB1: [{ role: 'chatGuardA', x: 3, y: 1, dir: 'down' }, { role: 'chatPostman', x: 6, y: 5, dir: 'left' }],
  liB2: [{ role: 'chatTutor', x: 4, y: 4, dir: 'left' }, { role: 'chatTutorAsst', x: 6, y: 3, dir: 'down' }],
  liB3: [{ role: 'chatWriter', x: 2, y: 2, dir: 'up' }, { role: 'chatEditor', x: 5, y: 4, dir: 'left' }],
  xfC1: [{ role: 'chatGuardB', x: 3, y: 1, dir: 'down' }, { role: 'chatDelivery', x: 6, y: 4, dir: 'left' }],
  xfC2: [{ role: 'chatOffice', x: 5, y: 4, dir: 'left' }, { role: 'chatOvertime', x: 2, y: 2, dir: 'up' }],
  xfC3: [{ role: 'chatRetired', x: 5, y: 3, dir: 'left' }],
  xfC4: [{ role: 'chatPigeon', x: 4, y: 2, dir: 'down' }, { role: 'chatKid', x: 7, y: 3, dir: 'left' }],
  bkf: [{ role: 'chatBkOwner', x: 5, y: 1, dir: 'down' }, { role: 'chatBkGuest', x: 2, y: 3, dir: 'right' }, { role: 'chatBkKid', x: 7, y: 3, dir: 'left' }],
  s1: [
    { role: 't_cd_a', x: 7,  y: 7,  dir: 'right' },
    { role: 't_cd_b', x: 12, y: 8,  dir: 'right' },
    { role: 'chatPaper',  x: 17, y: 7, dir: 'left' },
  ],
  path1: [
    { role: 'dictA',  x: 7,  y: 9,  dir: 'right', sight: 3 },   // 草叢邊：第一個會攔人的同學
    { role: 'dictB',  x: 12, y: 4,  dir: 'left',  sight: 3 },
    { role: 't_zy_a', x: 6,  y: 17, dir: 'down' },
  ],
  s3: [
    { role: 'roamHint2', x: 19, y: 5,  dir: 'down' },
    { role: 'chatGuide', x: 12, y: 11, dir: 'left' },
    { role: 'chatBreakfast', x: 4, y: 6, dir: 'right', wander: 1 },
  ],
  front: [
    { role: 'gymTip1',  x: 16, y: 8,  dir: 'down' },
    { role: 't_zy_b',   x: 12, y: 12, dir: 'down', wander: 1 },
    { role: 'townTip2', x: 20, y: 14, dir: 'down', wander: 1 },
    { role: 'chatFr1', x: 9, y: 9, dir: 'right' },
    { role: 'chatFr2', x: 10, y: 9, dir: 'left' },
    { role: 'chatSweep', x: 3, y: 14, dir: 'down', wander: 1 },
  ],
  zy_town: [
    { role: 'zyWake', x: 12, y: 11, dir: 'down' },
    { role: 'zyG1',   x: 8,  y: 11, dir: 'left' },      // 路牌匠：說明「要怎麼樣道館的門才會開」
    { role: 'zyTea',  x: 4,  y: 15, dir: 'up' },        // 補血婆婆
  ],
  zy_slope: [
    { role: 'zyThug', x: 10, y: 13, dir: 'up', sight: 3 },
    { role: 'zyKid',  x: 14, y: 9,  dir: 'left', sight: 3 },
    { role: 'zyTr1',  x: 12, y: 7,  dir: 'left', sight: 3 },
    { role: 'zyTr2',  x: 4,  y: 10, dir: 'right', sight: 3 },
    { role: 'zyG2',   x: 6,  y: 12, dir: 'right' },
    { role: 'zyTip1', x: 6,  y: 9,  dir: 'down' },
    { role: 'zyTip2', x: 13, y: 17, dir: 'left' },
    { role: 'zyQuiz', x: 12, y: 15, dir: 'left', wander: 1 },
  ],
  zy_gym: [
    { role: 'boss1', x: 5, y: 2, dir: 'down', key: 'c1a:boss1' },   // 真正的小老師。打倒的紀錄沿用 c1a:boss1（舊存檔、測試都不用改）
  ],
  dj_town: [
    { role: 'djWake',  x: 12, y: 9,  dir: 'down' },
    { role: 'djTea',   x: 5,  y: 9,  dir: 'down' },
    { role: 'djG2',    x: 3,  y: 9,  dir: 'right' },
    { role: 'djG1',    x: 19, y: 9,  dir: 'down' },
    { role: 'djG3',    x: 18, y: 10, dir: 'right' },
    { role: 'djG4',    x: 8,  y: 10, dir: 'left' },
    { role: 'djRival', x: 14, y: 10, dir: 'left' },
    { role: 'djQuiz',  x: 16, y: 10, dir: 'down' },
    { role: 'djDock',  x: 9,  y: 9,  dir: 'down' },
  ],
  dj_pier: [
    { role: 'djBell', x: 13, y: 4,  dir: 'left', sight: 3 },
    { role: 'djFrog', x: 15, y: 15, dir: 'left', sight: 3 },
  ],
  dj_gym: [
    { role: 'boss2', x: 8, y: 2, dir: 'down', key: 'lib:boss2' },   // 真正的股長。打倒的紀錄沿用 lib:boss2（舊存檔、測試都不用改）
  ],
  hn_town: [
    { role: 'hnWake', x: 12, y: 9,  dir: 'down' },
    { role: 'hnShop', x: 4,  y: 10, dir: 'down' },
    { role: 'hnG1',   x: 8,  y: 10, dir: 'left' },
    { role: 'hnG2',   x: 19, y: 10, dir: 'down' },
    { role: 'hnG3',   x: 5,  y: 14, dir: 'right' },
    { role: 'hnG4',   x: 18, y: 14, dir: 'left' },
    { role: 'hnTing', x: 13, y: 10, dir: 'left' },
    { role: 'hnQuiz', x: 17, y: 10, dir: 'down' },
  ],
  hn_pavilion: [
    { role: 'hnFish',  x: 12, y: 9,  dir: 'left',  sight: 3 },
    { role: 'hnTwinA', x: 8,  y: 16, dir: 'right', sight: 3 },
    { role: 'hnTwinB', x: 11, y: 16, dir: 'left',  sight: 3 },
    { role: 'hnPoet',  x: 10, y: 18, dir: 'left' },
  ],
  hn_gym: [
    { role: 'boss3', x: 7, y: 1, dir: 'down', key: 'yard:boss3' },   // 真正的助教。打倒的紀錄沿用 yard:boss3（舊存檔、測試都不用改）
  ],
  pl_town: [
    { role: 'plWake',  x: 12, y: 9,  dir: 'down' },
    { role: 'plPost',  x: 4,  y: 10, dir: 'down' },
    { role: 'plG1',    x: 8,  y: 10, dir: 'right' },
    { role: 'plG2',    x: 19, y: 10, dir: 'down' },
    { role: 'plG3',    x: 6,  y: 12, dir: 'down' },
    { role: 'plG4',    x: 17, y: 12, dir: 'down' },
    { role: 'plZhou',  x: 15, y: 10, dir: 'left' },
    { role: 'plQuiz',  x: 17, y: 10, dir: 'down' },
  ],
  pl_road: [
    { role: 'plPedant', x: 12, y: 9,  dir: 'left',  sight: 3 },
    { role: 'plTwinA',  x: 8,  y: 16, dir: 'right', sight: 3 },
    { role: 'plTwinB',  x: 11, y: 16, dir: 'left',  sight: 3 },
    { role: 'plElder',  x: 10, y: 18, dir: 'left' },
  ],
  pl_gym: [
    { role: 'boss4', x: 8, y: 2, dir: 'down', key: 'hist:boss4' },   // 真正的助教。打倒的紀錄沿用 hist:boss4（舊存檔、測試都不用改）
  ],
  hall: [
    { role: 'spar_h',  x: 12, y: 8,  dir: 'down' },
    { role: 'inkTip',  x: 5,  y: 8,  dir: 'down' },
    { role: 't_cs_a',   x: 4,  y: 2,  dir: 'down' },
    { role: 't_cs_b',   x: 19, y: 2,  dir: 'down' },
    { role: 'townTip3', x: 4,  y: 9,  dir: 'right' },
    { role: 'gymTip2',  x: 19, y: 9,  dir: 'left' },
    { role: 'roamHint', x: 16, y: 3,  dir: 'down' },
    { role: 'chatExam', x: 8, y: 5, dir: 'right' },
    { role: 'chatExam2', x: 15, y: 6, dir: 'left' },
  ],
  corridor1: [
    { role: 'spar_c1', x: 10, y: 4,  dir: 'up' },
    { role: 't_r2a',    x: 14, y: 4,  dir: 'up', sight: 2 },    // 面向上：整條走廊的寬度都看得到
    { role: 'forgeTip', x: 27, y: 2,  dir: 'down' },
  ],
  stair1: [
    { role: 'spar_s',  x: 7,  y: 3,  dir: 'left' },
    { role: 't_r2b',  x: 2, y: 5, dir: 'right', sight: 3 },
    { role: 'rival2', x: 2, y: 3, dir: 'right', sight: 3, minBadges: 3, maxBadges: 3 },
    /* 周以恆②之後現身的器靈：打輸了會留在樓梯間等你（哪一隻是隨機的，三隻都放，只會出現那一隻） */
    { role: 'gd_pen',   x: 6, y: 5, dir: 'down', retry: 1 },
    { role: 'gd_paper', x: 6, y: 5, dir: 'down', retry: 1 },
    { role: 'gd_ink',   x: 6, y: 5, dir: 'down', retry: 1 },
  ],
  corridor2: [
    { role: 'spar_c2', x: 7,  y: 3,  dir: 'right' },
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
    { role: 'chatClub', x: 6, y: 9, dir: 'down' },
    { role: 'chatLunch', x: 21, y: 8, dir: 'left' },
  ],
  field: [
    { role: 'sideBGiver', x: 13, y: 14, dir: 'down' },
    { role: 'sparring',   x: 7,  y: 15, dir: 'down' },
    { role: 'sparring2',  x: 24, y: 15, dir: 'down' },
    { role: 't_r3b',      x: 16, y: 5,  dir: 'down', sight: 3 },
    { role: 't_r5a',      x: 20, y: 18, dir: 'left', sight: 3 },
    { role: 't_bl_a',     x: 6,  y: 19, dir: 'down' },
    { role: 'chatBall', x: 10, y: 13, dir: 'left' },
    { role: 'chatRun', x: 10, y: 3, dir: 'right' },
  ],
  audyard: [
    { role: 'gymTip5', x: 9,  y: 10, dir: 'right' },
    { role: 't_zt_a',  x: 4,  y: 13, dir: 'down' },
    { role: 't_zt_b',  x: 17, y: 13, dir: 'down', wander: 1 },
    { role: 'townTip6', x: 19, y: 10, dir: 'down', wander: 1 },
    { role: 'chatBoard', x: 6, y: 12, dir: 'up' },
  ],
};
for (const [id, list] of Object.entries(CAMPUS_NPCS)) CAMPUS_MAPS[id].npcs = list;

/* 小墨出現的地方（主線引導）：走到這些格子，如果「現在該做的事」換了新的，小墨會跳出來說接下來要做什麼，說完就走；
   做完之後走到下一個點，他會再出現一次（見 overworld.js 的 moGuide、guide.js 的 shouldTell）。
   沿著主要動線擺在校門前庭、穿堂、走廊、樓梯間、中庭；禮堂前有自己的小墨過場（moIntro），所以那裡不放。 */
const col = (xs, ys) => xs.flatMap(x => ys.map(y => x + ',' + y));
CAMPUS_MAPS.front.guideTiles = [...col([12, 13, 14, 15], [8]), ...col([12, 13], [12])];
CAMPUS_MAPS.hall.guideTiles = col([11, 12], [5, 6]);
CAMPUS_MAPS.corridor1.guideTiles = col([6, 14, 22, 29], [2, 3, 4]);
CAMPUS_MAPS.stair1.guideTiles = col([4, 5, 6], [3]);
CAMPUS_MAPS.corridor2.guideTiles = col([6, 14, 22, 29], [2, 3, 4]);
CAMPUS_MAPS.yard2.guideTiles = [...col([10, 11, 12, 13], [8]), ...col([11, 12], [9])];

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
  R.avatar2.needDefeated = ['corridor2:rival1'];            // 圖書館的化身要先打倒周以恆；真正的股長在夢裡，不用再擋
  R.avatar3.needDefeated = ['yard2:m1', 'yard2:m2', 'yard2:m3'];   // 文藝教室的助教要先點醒三位組員；真正的助教在夢裡，不用再擋
  R.sideAGiver.need    = ['yard2:m1', 'yard2:m2', 'yard2:m3'];
  R.avatar4.needDefeated = ['stair1:rival2'];               // 校史室的歷屆榜要先安頓周以恆才讀得清；真正的助教在夢裡，不用再擋
  /* 器靈的地點：神器據點重做（待辦 1）之前先放在中庭 */
  S.gqClue = {
    g_pen:   { where: 'c8', place: '自己的教室',
      clue: '「去你第一次把心裡的話寫下來的地方——你自己的教室。」' },
    g_paper: { where: 'yard2', place: '中庭的涼亭',
      clue: '「去那個可以躲雨、把心事攤開來晾乾的地方——中庭的涼亭。」' },
    g_ink:   { where: 'yard2', place: '中庭的水池',
      clue: '「去那個水面黑得像墨的地方——中庭的水池邊。」' },
  };
  S.roamMaps = ['s1', 'path1', 's2', 's3', 'front', 'yard2', 'field', 'audyard'];
  R.pharmacist = { kind: 'healer', name: '補給站阿姨', look: { hair: '#3a2a20', cloth: '#f8f8f8', cloth2: '#5ab88a', gender: 'f' },
    text: '補給站阿姨：「上學路上辛苦了，喝杯熱茶再走吧！」' };
  /* 起點：自己的房間（床邊，面向床頭鬧鐘）。出門落在巷口自己家門前 */
  S.start = { map: 'room', x: 2, y: 2, dir: 'up', ret: { map: 's1', x: 15, y: 14 } };
  /* 回城點：前庭的保健室門口（通學路是單向的，回不了家） */
  S.homeTown = { map: 'front', x: 4, y: 8 };
  /* 新遊戲（和二週目）的休息處：家裡一樓、媽媽旁邊。去過保健室或跟媽媽說過話就會更新 */
  S.startHeal = { map: 'house1f', x: 2, y: 3 };
  /* 二週目：同一個夢又做了一次，在同一個房間醒來 */
  S.ngStart = { map: 'room', x: 2, y: 2, dir: 'up', ret: { map: 's1', x: 15, y: 14 } };
  S.gates = Object.assign({}, S.gates, { prologue: '（……還沒準備好。先確認時間和准考證吧。）' });
  S.signs = Object.assign({}, S.signs, {
    rm_window: '（窗外還是黑的。路燈下一個人也沒有。）',
    rm_desk: '（書桌上攤著國文課本，旁邊壓著一疊寫到一半的模擬考卷。）',
    rm_shelf: '（書架上排滿了參考書。每一本的書背都被翻得起毛了。）',
    rm_closet: '（衣櫃裡掛著燙好的制服。）',
    rm_bed: '（被子還是溫的。可是你已經睡不著了。）',
    h1_window: '（窗外是巷子。早上上學的人一個接一個走過去。）',
    h1_tv: '（電視開著晨間新聞：「……今年會考倒數——」你把頻道轉掉了。）',
    h1_kitchen: '（瓦斯爐上還溫著一鍋粥。）',
    h1_table: '（餐桌上放著你的便當盒，還有一張紙條：「考試加油！」）',
    dj_board1: '（排行榜上的名字一直在換，名次亂成一團，只有最上面兩行是固定的。）',
    dj_board2: '（榜單最底下有一行小字：「借了幾本不重要，讀懂幾本才重要。」不知道是誰寫的。）',
    hn_board1: '（花攤的招牌：「本店的花，每一朵都像……」後面被劃掉了，改寫成兩個小字：「很香。」）',
    hn_board2: '（告示板上的字寫得又小又密。最後一行被人用手指抹過，只剩下一個淡淡的「真」。）',
    hn_rain: '（聽雨亭的柱子上刻著：「雨聲不必翻譯，聽得見就好。」）',
    pl_gate: '（關門上的橫匾：「碑林關」。匾下小字：「入此關者，先識字。」）\n（譯：進這座關的人，先要認得字。）',
    pl_board: '（告示：「晨鐘暮鼓，書聲不輟。」）\n（譯：早晚鐘鼓，讀書聲不斷。）',
    pl_road: '（碑上刻著：「學而時習之，不亦說乎？」）\n（譯：學了又時常溫習，不是很愉快嗎？）',
    dj_well: '（一口乾涸的老井。井口刻著：「天只有井口那麼大？」）',
    zy_rest: '（坡道盡頭有一張長椅，椅背上刻著：「讀得慢也沒關係，唸對才是真的。」下面還有一行很小的字：「——小老師」）',
  });
  S.campus = true;
  /* 居民樓與街坊的閒聊（2026-10-07）：kind 'chat'，不給東西、不打架，每次說話輪流換下一段。
     話題圍著「國中生的日子」：開學、會考、字、被比較、怕寫不好——讓街坊像真的住在這裡。 */
  const st = (hair, c2, extra) => Object.assign({ hair, cloth: '#f8f8f8', cloth2: c2, style: 'school' }, extra || {});
  const CH = (name, look, chats) => ({ kind: 'chat', name, look, chats });
  Object.assign(R, {
    chatChenGma: CH('陳奶奶', { hair: '#d8d8d8', cloth: '#b07a8a', gender: 'f' }, [
      ['啊，開學第一天呀？書包有沒有帶齊？', '我孫子小豆今天也要上學，吵著要穿新鞋，現在還在鞋櫃那邊轉圈圈。'],
      ['以前我們讀書，是一個字一個字抄在石板上的。', '你們現在用的筆，比我那時候的好太多了。'],
      ['人老了就愛念叨，你別嫌煩。', '去吧，路上慢慢走，不要跑。']]),
    chatXiaodou: CH('小豆', st('#2a2a2a', '#e8a030', { gender: 'm' }), [
      ['我在背唐詩！「床前明月光」……後面是什麼來著？', '奶奶說後面是「疑是地上霜」，可是我覺得地上沒有霜啊。'],
      ['你是國中生嗎？國中的國文是不是很可怕？', '我同學說，國中的字有一百萬個。'],
      ['我長大要當……當……老師！不對，是鞋店老闆。']]),
    chatChenDad: CH('陳爸爸', { hair: '#3a3a3a', cloth: '#6a7a9a' }, [
      ['噓——小聲一點，我剛下夜班。', '你是要去上學的吧？早自習聽說很早開始，真辛苦。'],
      ['我年輕的時候也討厭國文，總覺得那些字跟日子沒關係。', '後來寫信給我太太，才發現一個字就能讓她笑一整天。']]),
    chatSister: CH('陳家姊姊', st('#201818', '#8a58c8', { gender: 'f' }), [
      ['會考倒數……我每天看著那行字，心都在抖。', '你也要小心，別太晚睡。'],
      ['我書桌上那疊考卷，一半是寫完的，一半是「明天一定寫」的。', '……你別跟人說。']]),
    chatGuardA: CH('管理員阿伯', { hair: '#909090', cloth: '#5a6a5a', hat: '#4a5a4a' }, [
      ['早啊，這棟三層，一二三樓我都認得。', '一樓是我，二樓是補習班的李老師，三樓住了個整天關在房間裡的作家。'],
      ['信件放信箱，包裹放這裡，不要弄混。', '你要上樓看看也行，輕聲一點。']]),
    chatPostman: CH('送報的大哥', { hair: '#2a2a2a', cloth: '#3a6a4a', hat: '#2a5a3a' }, [
      ['今天的報紙頭版寫著「會考倒數五十天」，看得我都緊張。', '你們國中生真辛苦。'],
      ['我每天送兩百份報紙，字認得最多的人大概是我。', '可惜認得多，不一定懂得多。']]),
    chatTutor: CH('補習班李老師', { hair: '#2a2a2a', cloth: '#7a6a8a', glasses: 1 }, [
      ['我在批改作文。題目是「一件小事」，十個學生有八個寫「扶老奶奶過馬路」。', '我也不是說不好，只是……老奶奶一定很累吧。'],
      ['好作文不用華麗，把那件小事「看清楚」就夠了。', '看清楚，才寫得出來。']]),
    chatTutorAsst: CH('助教姊姊', st('#3a2a20', '#d8629a', { gender: 'f' }), [
      ['我負責幫老師影印講義，一天印了八百張，手都是碳粉味。'],
      ['學生交來的字，有的工整、有的像蚯蚓。', '我看久了，居然能從字看出他們那天的心情。']]),
    chatWriter: CH('作家', { hair: '#4a3a30', cloth: '#6a6a7a', glasses: 1 }, [
      ['這個詞我寫了三天，還是覺得不對。', '「寂寞」跟「孤獨」到底差在哪？你覺得呢？'],
      ['寫東西的人最怕兩件事：寫不出來，還有寫出來沒人看。', '……我兩個都怕。'],
      ['不過啊，只要有一個人讀懂，就值得了。']]),
    chatEditor: CH('編輯小姐', { hair: '#2a1a14', cloth: '#c85a5a', gender: 'f' }, [
      ['我是來催稿的。他說「快好了」，已經說了三個禮拜。'],
      ['其實我最喜歡看他寫到一半的稿子，字很亂，可是很真。']]),
    chatGuardB: CH('警衛阿伯', { hair: '#a0a0a0', cloth: '#4a5a7a', hat: '#3a4a6a' }, [
      ['住戶每天進出，我都記得。', '有人今天笑得很開心，我就知道他順利；有人低著頭，我就說聲加油。'],
      ['這棟四層樓，頂樓有人養鴿子，吵是吵了點，可是每天早上聽著也習慣了。']]),
    chatDelivery: CH('外送員', { hair: '#2a2a2a', cloth: '#e8a030', hat: '#c88a20' }, [
      ['這棟四樓的訂單最多，也最難送——電梯壞了，要爬樓梯。'],
      ['我也曾經是國中生，現在每天靠看門牌號碼過日子。', '數字比字簡單多了，哈哈。']]),
    chatOffice: CH('上班族姊姊', { hair: '#2a1a14', cloth: '#6a7a8a', gender: 'f' }, [
      ['昨天簡報被主管說「不夠有感情」，我還在想是少了哪一個形容詞。', '你們國文課，會教怎麼寫「有感情」嗎？'],
      ['同事升遷了，我只是點頭說恭喜。', '心裡其實……算了，你快去上學吧。']]),
    chatOvertime: CH('加班的叔叔', { hair: '#3a3a3a', cloth: '#7a8a9a', glasses: 1 }, [
      ['再給我五分鐘，這封信我再改一個字。'],
      ['一封信改十遍，不是我龜毛，是怕一個字用錯，對方就誤會了。']]),
    chatRetired: CH('退休國文老師', { hair: '#e0e0e0', cloth: '#7a6a5a', glasses: 1, beard: 1 }, [
      ['我教了三十年國文，退休後最大的樂趣，是看公園裡的人讀報紙。', '你知道「讀書」兩個字，最早是什麼意思嗎？……我也不知道，所以才一直讀。'],
      ['有個學生，當年說他最討厭古文。', '去年他寄來一張卡片，全是文言文。哈哈，現在換我看不懂了。'],
      ['學國文不是為了考一百分。', '是將來有一天，你能把想說的話說得剛剛好。']]),
    chatPigeon: CH('養鴿子的阿伯', { hair: '#b0b0b0', cloth: '#8a7a5a', hat: '#6a5a3a' }, [
      ['屋頂這二十隻鴿子，每一隻都有名字。', '那隻灰的叫「之乎」，那隻白的叫「者也」。'],
      ['鴿子認得回家的路，比人厲害多了。', '人常常忙著趕路，就忘了自己要去哪。']]),
    chatKid: CH('頂樓的小朋友', st('#2a1a14', '#6aa8d8', { gender: 'f' }), [
      ['我們家有大冒險：從一樓爬到四樓，不能用電梯！', '你也要試試看嗎？'],
      ['我偷偷告訴你，鴿子最喜歡吃的不是米，是爺爺講的笑話。']]),
    chatBkOwner: CH('早餐店老闆娘', { hair: '#4a2a1a', cloth: '#e8e0d0', gender: 'f' }, [
      ['蛋餅加蛋？奶茶要微糖對不對？', '……咦，你還沒開口。算了，我記得你每天都來。'],
      ['今天的蛋餅特別香吧？我偷偷多加了一點蔥。', '去吧，上學別遲到。']]),
    chatBkGuest: CH('上班族客人', { hair: '#2a2a2a', cloth: '#5a6a8a' }, [
      ['老闆娘的蛋餅，吃了一口整天都有精神。', '……可惜沒辦法吃一口，就考一百分。'],
      ['我每天這個時間都在這裡，看著你們穿制服的一個個走過去。', '好像看見以前的自己。']]),
    chatBkKid: CH('小學生', st('#2a2a2a', '#4a78c8', { gender: 'm' }), [
      ['我今天要帶兩個飯糰去學校，一個自己吃，一個給同桌。', '他昨天把我的橡皮擦借走了，還沒還。'],
      ['老闆娘會偷偷多送我一片蘿蔔糕，不要告訴別人喔。']]),
    chatPaper: CH('讀報的叔叔', { hair: '#6a5a4a', cloth: '#7a8a6a' }, [
      ['新聞說今年會考作文題目很難預測。', '我看啊，題目再難，只要是真心話就不會太差。'],
      ['我每天只看兩個版面：副刊和天氣。其他的，太吵。']]),
    chatBus: CH('等公車的上班族', { hair: '#2a2a2a', cloth: '#6a6a8a' }, [
      ['這班公車永遠在我快遲到的時候才來。', '你們學生可以用走的，真好。'],
      ['每天站在這個站牌，我就在心裡默背昨天的會議重點。', '背不起來的時候，就看看雲。']]),
    chatDog: CH('遛狗的阿姨', { hair: '#6a3a2a', cloth: '#a85a8a', gender: 'f' }, [
      ['我家的狗叫「小逗」，因為牠一出門就停下來逗每一棵電線桿。', '你看牠，又在聞了。'],
      ['早上遛狗是我一天最安靜的時候。', '路上的字──招牌、路標、公告──我都慢慢讀一遍。']]),
    chatGuide: CH('導護志工媽媽', { hair: '#3a2a20', cloth: '#e8c030', hat: '#e8c030', gender: 'f' }, [
      ['同學早！過馬路要看左右，眼睛不要只看手機喔。', '今天會有點涼，外套拉好。'],
      ['我每天站在這裡，認得每一個走進校門的孩子。', '你昨天的鞋帶有鬆開過，今天綁緊了，很棒。']]),
    chatBreakfast: CH('買早餐的同學', st('#4a2a1a', '#3a8a58', { gender: 'f' }), [
      ['我早餐一定要吃蛋餅，沒吃就整天沒力氣。', '你吃過了嗎？沒吃的話，巷口那家很好吃。'],
      ['我同桌每天遲到，我都幫他買一份放在抽屜。', '他說我是他的「早餐之神」。']]),
    chatFr1: CH('同學甲', st('#2a1a14', '#4a78c8', { gender: 'm' }), [
      ['欸，昨天的國文習作你寫了嗎？第三題我寫了又擦、擦了又寫。'],
      ['我決定了，今天開始每天背一個成語。', '……明天再開始好了。']]),
    chatFr2: CH('同學乙', st('#3a2a20', '#d8629a', { gender: 'f' }), [
      ['你看他，又在說明天開始。', '他這句話我已經聽了三十七次了。'],
      ['其實我也想開始，只是不知道從哪裡開始。']]),
    chatSweep: CH('打掃的同學', st('#1a1a20', '#8a8a92', { gender: 'm' }), [
      ['外掃區的落葉怎麼掃都掃不完，掃完這邊，那邊又掉了。', '好像在寫作業，寫完一題又來一題。'],
      ['不過掃乾淨的時候，心情會很好，很奇怪吧？']]),
    chatExam: CH('剛考完試的同學', st('#2a2a2a', '#c8a040', { gender: 'm' }), [
      ['剛剛小考最後一題，我寫了又擦，擦了又寫，最後交了白卷。', '……不對，我有寫名字。'],
      ['考完試的感覺很奇怪，好像腦袋被掏空，又好像被塞滿了答案。']]),
    chatExam2: CH('等著對答案的同學', st('#4a2a1a', '#6a8ac8', { gender: 'f' }), [
      ['先別告訴我答案！我想自己再想一想。', '……好吧，你說，我心臟準備好了。'],
      ['對完答案才發現，我有一題明明會，卻寫成別的字。']]),
    chatClub: CH('社團學長', st('#3a2a20', '#8a58c8', { gender: 'm' }), [
      ['社團博覽會快到了，我們攤位還缺一塊招牌。', '誰字寫得好看？……你看我幹嘛，我字很醜。'],
      ['社團是學校裡最自由的地方，想做什麼就做什麼。', '當然，要先把功課寫完。']]),
    chatLunch: CH('吃便當的同學', st('#2a1a14', '#e8a030', { gender: 'f' }), [
      ['我每天的便當都是爸爸做的，今天的蛋有點焦。', '可是我還是全部吃完了。'],
      ['中午的中庭最好，太陽曬著，風吹著，什麼煩惱都慢慢變小。']]),
    chatBall: CH('打籃球的同學', st('#1a1a20', '#d8483c', { gender: 'm' }), [
      ['投進三分球的時候，整個世界都安靜了。', '考試要是也有這種感覺就好了。'],
      ['我國文不好，但我背得出每一個球員的名字。', '……你說，這算不算一種記憶力？']]),
    chatRun: CH('練跑步的學姊', st('#201818', '#3a8a58', { gender: 'f' }), [
      ['跑步的時候，我什麼都不想，腦袋反而最清楚。', '有時候卡住的作文題，就在跑完第三圈的時候想通了。'],
      ['你也來跑一圈？不用很快，慢慢跑也算。']]),
    chatBoard: CH('看公佈欄的同學', st('#3a2a20', '#c8a040', { gender: 'f' }), [
      ['我每天都來看榜，不是在找自己，是在找朋友的名字。', '看到他們名次進步，我比自己進步還開心。'],
      ['公佈欄貼了好多社團海報，我一張一張看過去，心裡有點羨慕。']]),
  });
  /* 通關（二週目）後：四位關主回到自己的教室，說「我又訓練變強了」，跟他們說話就能再挑戰（不用湊碎片、不用進夢）。第五位是大禮堂的 postBoss */
  const REMATCH = [
    ['postT1', 'boss1', ['（小老師站在黑板前，手裡的粉筆很穩。）', '我又訓練變強了。這次我先把字寫在黑板上給你看——再挑戰一次吧！'], '小老師', '……還是你比較準。不過我會再練的。'],
    ['postT2', 'boss2', ['（股長把借閱證收進口袋。）', '這個學期我又多讀了好幾本，我又訓練變強了。再挑戰一次吧！'], '股長', '……這次輸得心服口服。讀懂的那一本，真的不會變。'],
    ['postT3', 'boss3', ['「這次我寫得比較簡單了。」', '我又訓練變強了，把句子說清楚這件事，再挑戰一次吧！'], '助教', '……你說得比我清楚。好的文字，真的是把真心說清楚。'],
    ['postT4', 'boss4', ['「讀得慢，才讀得進去。」', '我又訓練變強了，再挑戰一次吧！'], '助教', '……碑，是讓人讀的。而你，是讀得最認真的那一個。'],
  ];
  REMATCH.forEach(([id, bid, lines, who, win], i) => {
    const B = R[bid];
    R[id] = { kind: 'rematch', name: B.name, look: B.look, lines, lvAdd: -5,   // 等級跟著玩家（二週目再 +4 → 比玩家高 1 級），血量比第一次打時少一點，輸了可以再來
      ask: `要再挑戰${B.name}一次嗎？（敵人會比上次更強）`, no: '好，想挑戰的時候再來找我。',
      reward: Math.floor(B.reward / 2), win,
      foe: Object.assign({}, B.foe, { lv: B.foe.lv + 14, hpMul: B.foe.hpMul * 0.7 }), potions: 2,
      prize: { money: Math.floor(B.reward / 2), frags: 1, items: { heal2: 1 } } };
  });
  S.postNpcs = Object.assign({}, S.postNpcs, {
    front: [{ role: 'postRival', x: 12, y: 13, dir: 'down' }],
    yard2: [{ role: 'tipInk', x: 17, y: 1, dir: 'right' }],      // 通關後：指點舊牆角（硯海墨池）
    c1a: [{ role: 'postT1', x: 6, y: 2, dir: 'down' }],
    lib: [{ role: 'postT2', x: 7, y: 1, dir: 'down' }],
    yard: [{ role: 'postT3', x: 8, y: 1, dir: 'down' }],
    hist: [{ role: 'postT4', x: 8, y: 1, dir: 'down' }],
  });
  /* 章節名稱與目標（劇情選單、換章時的橫幅會顯示） */
  const ST = [
    ['第一道館．一年甲班', '到教學樓走廊 1F 的「一年甲班」，把黑板上的錯字改完，見見小老師。'],
    ['第二道館．圖書館', '在走廊 2F 找到周以恆，再進圖書館挑戰成語圖書股長。'],
    ['第三道館．文藝教室', '到中庭幫報告組長叫醒三位組員，再挑戰文藝教室的現代文青助教。'],
    ['第四道館．校史室', '在樓梯間再次面對周以恆，然後到走廊 2F 的校史室。'],
    ['第五道館．大禮堂', '到禮堂前廣場——小墨在那裡等你。'],
  ];
  ST.forEach(([name, text], i) => Object.assign(S.stages[i], { name, text, tiles: [] }));
  /* 選單「地圖」：校園版的清單（區域地圖重做〔待辦 5〕之前的過渡版） */
  S.mapChain = [
    { id: 'house1f', kind: 'rest', tag: '媽媽可以幫你回復' }, { id: 's1', kind: 'path', tag: '家門口' }, { id: 'path1', kind: 'path', tag: '草叢多・練功' },
    { id: 's2', kind: 'rest', tag: '補給站・便利商店' }, { id: 's3', kind: 'path', tag: '草叢' },
    { id: 'front', kind: 'rest', tag: '保健室・練功草叢' }, { id: 'hall', kind: 'area' },
    { id: 'corridor1', kind: 'area', tag: '福利社・工藝教室・自己的教室' }, { id: 'c1a', kind: 'gym', gym: 1 },
    { id: 'stair1', kind: 'area' }, { id: 'corridor2', kind: 'area' }, { id: 'lib', kind: 'gym', gym: 2 },
    { id: 'yard2', kind: 'area', side: 'sideA' }, { id: 'yard', kind: 'gym', gym: 3 },
    { id: 'hist', kind: 'gym', gym: 4 }, { id: 'field', kind: 'area', side: 'sideB', tag: '練功草叢' },
    { id: 'audyard', kind: 'area' }, { id: 'aud', kind: 'gym', gym: 5 },
  ];
  S.mapLegend = '🟡 道館　🔵 保健室　🟢 通學路　🟠 校園';
  /* 夢中小鎮（2026-10-06）：進夢、醒來、休息處、開門條件、劇情台詞 */
  S.dreams = {
    zy: { name: '注音坡', home: { map: 'c1a', x: 5, y: 3, dir: 'down' }, town: { map: 'zy_town', x: 11, y: 10, dir: 'down' },
      heal: { map: 'zy_town', x: 11, y: 10 }, need: 4, openFlag: 'zyOpen', doneFlag: 'zyDone', enteredFlag: 'zyEntered', seenFlag: 'zySeen',
      legacyKey: 'c1a:boss1', homeName: '教室', fx: 'vortex', tint: [140, 110, 230, .15],
      glyphs: ['字', '音', '形', 'ㄅ', '注', 'ㄆ', '錯', '對', 'ㄇ', '夢', '筆', 'ㄈ', '墨', '紙'],
      openText: ['（遠處傳來一聲清脆的鐘響——坡頂道館的大門，開了。）', '（你想起老爺爺說的話：「你替她說一句：寫錯，沒關係。」）'],
      arrive: ['（睜開眼睛，周圍的樹、坡道、房子，都像是從課本裡長出來的。）',
               '小墨：「別怕，這是「注音坡」——碎片留下的夢。」',
               '小墨：「這裡的每個人，都是小老師「怕寫錯」的字變出來的。」',
               '小墨：「真正的小老師在坡頂的道館裡，但夢把門鎖上了。小鎮裡的路牌匠知道門要怎麼開，去跟他聊聊。」',
               '小墨：「想回教室的話，隨時可以從旋渦、或選單的「醒來」回去，進度都會留著。」'],
      finish: ['（小老師身上的墨塵一點一點散開。整個小鎮的輪廓也像水彩一樣，慢慢淡去……）',
               '（老爺爺、阿聲、小注音、小愛……每個人都朝你揮了揮手。）',
               '小墨：「夢要醒了。你做得很好。」',
               '小墨：「碎片，是一個人心裡最怕被看見的那一頁。」',
               '小墨：「旋渦會留在教室裡。想念這裡的人，隨時可以回來看看。」'],
      afterWake: ['（你回到了一年甲班。黑板上的錯字全都不見了，教室中央的旋渦還在，輕輕地轉著。）',
                  '（講台上，小老師拿起粉筆，在黑板上寫下了很慢、很工整的兩個字：「注音」。）',
                  '小老師：「……這次，我自己寫的。」'] },
    dj: { name: '書海港', home: { map: 'lib', x: 8, y: 3, dir: 'down' }, town: { map: 'dj_town', x: 11, y: 9, dir: 'down' },
      heal: { map: 'dj_town', x: 5, y: 10 }, need: 3, openFlag: 'djOpen', doneFlag: 'djDone', enteredFlag: 'djEntered', seenFlag: 'djSeen',
      legacyKey: 'lib:boss2', homeName: '圖書館', fx: 'pages', tint: [255, 190, 100, .17],
      glyphs: ['守', '株', '待', '兔', '亡', '羊', '補', '牢', '掩', '耳', '盜', '鈴', '井', '蛙', '書', '頁'],
      openText: ['（遠處傳來翻動書頁的聲音——港口盡頭，圖書館的大門開了。）', '（你想起老管理員說的話：「榜單可以換，讀懂的那一本不會。」）'],
      arrive: ['（書頁停了下來。你站在一座港口的石板路上，海面上漂著一頁一頁的書。）',
               '小墨：「別怕，這是「書海港」——圖書館碎片留下的夢。」',
               '小墨：「這裡的居民，都是股長「收藏卻沒讀懂」的成語變出來的。」',
               '小墨：「真正的股長在港口盡頭的圖書館裡，但夢把門鎖上了。幫港口的人解決三件麻煩，夢才會鬆口。」',
               '小墨：「想回圖書館的話，隨時可以從攤開的書、或選單的「醒來」回去，進度都會留著。」'],
      finish: ['（股長身上的書頁一頁一頁飛了起來。整座港口像被風翻過的書，慢慢闔上……）',
               '（老農夫、老陳、鈴鐺鋪老闆、周以恆……每個人都朝你揮了揮手。）',
               '小墨：「夢要醒了。你做得很好。」',
               '小墨：「碎片，是一個人心裡最怕被看見的那一頁。」',
               '小墨：「那本書會留在圖書館裡。想念這裡的人，隨時可以回來看看。」'],
      afterWake: ['（你回到了圖書館。書架靜靜立著，中間那本攤開的書還在，輕輕地翻著頁。）',
                  '（角落的長桌邊，股長和周以恆各自抱著一本書，並肩坐著，誰也沒說話。）',
                  '周以恆：「……借同一本，也行。」',
                  '股長：「這本，我想從頭讀。」'] },
    hn: { name: '花南街', home: { map: 'yard', x: 7, y: 3, dir: 'down' }, town: { map: 'hn_town', x: 11, y: 9, dir: 'down' },
      heal: { map: 'hn_town', x: 5, y: 10 }, need: 3, openFlag: 'hnOpen', doneFlag: 'hnDone', enteredFlag: 'hnEntered', seenFlag: 'hnSeen',
      legacyKey: 'yard:boss3', homeName: '文藝教室', fx: 'petals', tint: [255, 170, 205, .16],
      glyphs: ['花', '雨', '風', '像', '如', '對', '排', '比', '詩', '美', '字', '夢'],
      openText: ['（遠處傳來玻璃輕輕打開的聲音——街尾，溫室的門開了。）', '（你想起花攤老闆娘說的話：「他以前每天來買一朵花，說是要送給阿嬤。」）'],
      arrive: ['（花雨停了。你站在一條鋪滿花瓣的街上，兩旁是一整排花攤，遠處有座小小的亭子。）',
               '小墨：「別怕，這是「花南街」——助教的碎片留下的夢。」',
               '小墨：「這裡的居民，都是助教「過度裝飾」的修辭變出來的。」',
               '小墨：「真正的助教在街尾的溫室裡，但夢把門鎖上了。幫街上的人解決三件麻煩，夢才會鬆口。」',
               '小墨：「想回文藝教室的話，隨時可以從含苞的花、或選單的「醒來」回去，進度都會留著。」'],
      finish: ['（助教身上的花瓣一片一片飛了起來，把整條街染成淡淡的粉紅……）',
               '（賣花人、風鈴小妹、垂釣的大叔、雙胞胎……每個人都朝你揮了揮手。）',
               '小墨：「夢要醒了。你做得很好。」',
               '小墨：「碎片，是一個人心裡最怕被看見的那一頁。」',
               '小墨：「那朵花會留在文藝教室裡。想念這裡的人，隨時可以回來看看。」'],
      afterWake: ['（你回到了文藝教室。花圃裡的花都開著，溫室中央，含苞的花輕輕地合著。）',
                  '（助教站在窗邊，手裡捏著一片花瓣，花瓣上是一句很短的話。）',
                  '助教：「……給阿嬤的。這次，我想親口念給她聽。」'] },
    pl: { name: '碑林關', home: { map: 'hist', x: 7, y: 2, dir: 'down' }, town: { map: 'pl_town', x: 11, y: 9, dir: 'down' },
      heal: { map: 'pl_town', x: 5, y: 10 }, need: 3, openFlag: 'plOpen', doneFlag: 'plDone', enteredFlag: 'plEntered', seenFlag: 'plSeen',
      legacyKey: 'hist:boss4', homeName: '校史室', fx: 'ink', tint: [200, 160, 90, .18], onlyCat: '文言',
      glyphs: ['之', '乎', '者', '也', '矣', '焉', '哉', '曰', '而', '其', '以', '於'],
      openText: ['（遠處傳來石門緩緩推開的聲音——書院的門，開了。）', '（你想起守碑老人說的話：「榜末空一格，非留與誰，乃未寫畢也。」）'],
      arrive: ['（墨漫開，又慢慢退去。你站在一座夜裡的關隘前，月光下，滿山遍野都是碑。）',
               '小墨：「別怕，這是「碑林關」——助教的碎片留下的夢。」',
               '小墨：「這裡的居民，都是刻在碑上、沒人再讀的古人話變出來的，所以大家都說文言文。」',
               '小墨：「別擔心，每句話下面，我都幫你譯成白話了。這座夢裡的題目，也全都是文言文喔。」',
               '小墨：「真正的助教在書院的檔案室裡，但夢把門鎖上了。幫關裡的人解決三件麻煩，夢才會鬆口。」',
               '小墨：「想回校史室的話，隨時可以從還鄉碑、或選單的「醒來」回去，進度都會留著。」'],
      finish: ['（助教身上的墨一滴一滴落下，整座碑林在月光下，一塊一塊亮了起來……）',
               '（老吏、書童、書生、師兄弟……每個人都朝你揮了揮手。）',
               '小墨：「夢要醒了。你做得很好。」',
               '小墨：「碎片，是一個人心裡最怕被看見的那一頁。」',
               '小墨：「那塊榜會留在校史室裡。想念這裡的人，隨時可以回來看看。」'],
      afterWake: ['（你回到了校史室。榜靜靜立著，最後一格裡，多了一個名字，墨還是新的。）',
                  '（周以恆站在榜前，沒有背，只是一個字一個字地讀。）',
                  '周以恆：「……原來，是這麼唸的。」',
                  '（遠處，大禮堂傳來了沉重的鐘聲。）'] },
  };
  /* 注音坡（探索式）：找聲調碎片放上石板，四塊都亮了道館才開。打夢裡的人有機率掉「萬能碎片」。 */
  S.dreams.zy.explore = { label: '聲調碎片', hint: '到坡道的草叢、路邊的房子裡找閃光點，找回四個聲調的碎片，放上小鎮裡的石板',
    status() {
      const P = platesOf('zy'), miss = P.items.filter(it => !G.flags['pl:' + it.key]), have = miss.filter(it => G.flags['spf:' + it.key]), none = miss.filter(it => !G.flags['spf:' + it.key]), any = G.flags[P.anyFlag] || 0;
      const out = [`石板亮了 ${platesLit(P)} / ${P.items.length} 塊。`];
      if (have.length) out.push(`你身上有「${have.map(i => i.name).join('、')}」的碎片，拿去踩對應的石板吧。`);
      if (none.length) out.push(`還沒找到：${none.map(i => i.name).join('、')}。` + (any ? `（你有 ${any} 片萬能碎片，哪一聲都能用。）` : '草叢和房子裡找找看；打贏夢裡的人，也有機會掉出一片「萬能碎片」。'));
      return out;
    } };
  S.dreams.zy.drop = { chance: 0.45, text: '（對方掉下了一片閃著光的碎片——是「萬能碎片」，哪一聲都能用！）' };
  S.stages[0].roles = ['avatar1', 'boss1'];
  S.stages[1].roles = ['rival1', 'avatar2', 'boss2'];
  S.stages[2].roles = ['m1', 'm2', 'm3', 'avatar3', 'boss3'];
  S.stages[3].roles = ['rival2', 'avatar4', 'boss4'];
  /* 教師版「直達」的分類 */
  S.travelGroups = [
    ['家．通學路', ['room', 'house1f', 's1', 'path1', 's2', 'pharmacy', 's3']],
    ['居民樓', ['chenA1', 'chenA2', 'liB1', 'liB2', 'liB3', 'xfC1', 'xfC2', 'xfC3', 'xfC4', 'bkf']],
    ['校園', ['front', 'hall', 'corridor1', 'stair1', 'corridor2', 'yard2', 'field', 'audyard']],
    ['道館', ['c1a', 'lib', 'yard', 'hist', 'aud']],
    ['夢中小鎮', ['zy_town', 'zy_slope', 'zy_bun1', 'zy_bun2', 'zy_home', 'zy_hut', 'zy_gym', 'dj_town', 'dj_pier', 'dj_gym', 'hn_town', 'hn_pavilion', 'hn_gym', 'pl_town', 'pl_road', 'pl_gym']],
    ['教室．其他', ['c8', 'clinic_h', 'store_c', 'forge', 'inkpool']],
  ];
  Object.assign(S.mapNames, {
    s1: '巷口', path1: '通學路', s2: '大馬路口', s3: '校門前', pharmacy: '補給站', front: '校門與前庭', hall: '穿堂',
    corridor1: '走廊 1F', stair1: '樓梯間', corridor2: '走廊 2F', yard2: '中庭',
    chenA1: '陳家公寓（1F）', chenA2: '陳家公寓（2F）', liB1: '李家公寓（1F）', liB2: '李家公寓（2F）', liB3: '李家公寓（3F）',
    xfC1: '幸福大樓（1F）', xfC2: '幸福大樓（2F）', xfC3: '幸福大樓（3F）', xfC4: '幸福大樓（4F）', bkf: '早餐店',
    field: '操場與跑道', audyard: '禮堂前廣場', room: '我的房間（2F）', house1f: '我家（1F）', c8: '自己的教室',
    c1a: '一年甲班', lib: '圖書館', yard: '文藝教室', hist: '校史室', aud: '大禮堂',
    clinic_h: '保健室', store_h: '便利商店', store_c: '福利社', forge: '工藝教室',
    zy_bun1: '包子鋪', zy_bun2: '包子鋪（2F）', zy_home: '坡下人家', zy_hut: '坡上小屋',
    zy_town: '夢中小鎮．注音坡', zy_slope: '注音坡道', zy_gym: '夢中的一年甲班',
    dj_town: '夢中小鎮．書海港', dj_pier: '船埠', dj_gym: '夢中的圖書館',
    hn_town: '夢中小鎮．花南街', hn_pavilion: '聽雨亭', hn_gym: '夢中的花室',
    pl_town: '夢中小鎮．碑林關', pl_road: '古碑小徑', pl_gym: '夢中的檔案室',
  });
}

/* ============================================================
   舊存檔搬進校園（main.js 讀檔時呼叫，每個存檔只搬一次）
   ------------------------------------------------------------
   · 站在舊地圖 → 移到回城點（前庭保健室門口）
   · 在道館室內 → 出口改回校園那扇門的門口
   · 打倒過的人、送過的禮物、看過的過場：舊地名換成那個人在校園的新位置
     （例：dianji:rival1 → corridor2:rival1，不然道館②的股長永遠不肯打）
   回傳 true 代表有搬動，main.js 會跟玩家說一聲。
   ============================================================ */
function migrateToCampus(G) {
  if (!G || G.campusV) return false;
  G.campusV = 1;
  const camp = id => !!CAMPUS_MAPS[id];
  const doorTo = {};                                  // 室內 → 校園的哪扇門
  for (const [id, L] of Object.entries(CAMPUS_MAPS))
    for (const d of Object.values(L.doorWarps || {})) if (!doorTo[d.to]) doorTo[d.to] = { map: id, x: d.ret.x, y: d.ret.y };
  const home = {};                                    // 人物 → 校園的新家（同一個人放兩處就不搬）
  for (const [id, list] of Object.entries(CAMPUS_NPCS)) for (const sp of list) home[sp.role] = home[sp.role] === undefined ? id : null;
  const old = id => !camp(id) && !doorTo[id];
  const rekey = (map, role) => (old(map) && home[role]) ? home[role] + ':' + role : null;
  let moved = false;
  for (const k of Object.keys(G.defeated || {})) {
    const [m, r] = k.split(':'); const nk = rekey(m, r);
    if (nk) { G.defeated[nk] = G.defeated[k]; delete G.defeated[k]; moved = true; }
  }
  for (const k of Object.keys(G.flags || {})) {
    const p = k.split(':'); if (p.length !== 3) continue;
    let nk = null;
    if (['gift', 'quiz', 'gone'].includes(p[0])) { const r = rekey(p[1], p[2]); if (r) nk = p[0] + ':' + r; }
    if (p[0] === 'cut' && p[2] === 'moIntro' && old(p[1])) nk = 'cut:audyard:moIntro';
    if (nk) { G.flags[nk] = G.flags[k]; delete G.flags[k]; moved = true; }
  }
  const H = W.homeTown;
  if (old(G.map)) { G.map = H.map; G.x = H.x; G.y = H.y; moved = true; }
  if (!G.ret || old(G.ret.map)) G.ret = Object.assign({}, doorTo[G.map] || H);
  if (!G.lastHeal || old(G.lastHeal.map)) G.lastHeal = Object.assign({}, H);
  if (G.roamAt && !(W.roamMaps || []).includes(G.roamAt)) G.roamAt = null;
  return moved;
}

/* ============================================================
   主題教室（2026-10-06）
   ------------------------------------------------------------
   以前每間教室都是同一種配置（桌子其實是櫃檯），走進去分不出是哪間。
   現在每間有自己的地板、家具、海報，一進門就知道自己在哪：
     自己的教室／一年甲班：課桌椅排整齊、側牆海報（甲班有三塊黑板）
     工藝教室：灰石板地、熔爐與鐵砧　福利社／便利商店：藍綠磁磚、貨架擺滿盒子瓶子
     圖書館：棕木地板　校史室：橘褐石磚、牆上掛史料　文藝教室（花室）：綠地磚　禮堂：橘褐木地板、觀眾席
   只換磚、不動 NPC／機關／寶箱／出入口的位置（座標不變，測試照舊）。
   ============================================================ */
const ROOM_REDO = {
  c8: { theme: 't_campus', rows: [
    'w**wBBBBw**w',
    'w____e_____w',
    'w_??____??_w',
    'w_$$____$$_w',
    'w_??____??_w',
    'w_$$____$$_w',
    'w_??____??_w',
    'wp$$____$$pw',
    'wwwww__wwwww' ] },
  c1a: { theme: 't_campus', rows: [
    'w**wBBBBBB*w',
    'w___MeM_M__w',
    'w__________w',
    'w_??_rr_??_w',
    'w_$______$_w',
    'w_??_rr_??_w',
    'wp$$____$_pw',
    'w__________w',
    'wwwww__wwwww' ] },
  forge: { theme: 't_forge', rows: [
    'wwwwwwwwwwww',
    'w}|_ttt__|}w',
    'w__________w',
    'w_t_____t__w',
    'w__r____r__w',
    'wp________pw',
    'wwwww__wwwww' ] },
  store_c: { theme: 't_shop', rows: [
    'wwwwwwwwwwww',
    'wkkkkk_kkkkw',
    'w__________w',
    'w__tttt____w',
    'w____rr____w',
    'wp________pw',
    'wwwww__wwwww' ] },
  store_h: { theme: 't_shop', rows: [
    'ww*wwww*ww',
    'wkkkk_kkkw',
    'w________w',
    'w__ttt___w',
    'w________w',
    'wp__rr__pw',
    'wwww__wwww' ] },
  clinic_h: { theme: 't_campus', rows: [
    'ww*wwww*ww',
    'wb_kkk__bw',
    'w________w',
    'wtttt____w',
    'w_p____p_w',
    'w________w',
    'wwww__wwww' ] },
  lib: { theme: 't_library', rows: [
    'wwww**wwwwww**ww',
    'wkk__________kkw',
    'wkkkkkkkkkkkkkkw',
    'w_QQ__k__kk_QQ_w',
    'w____k______k__w',
    'wQQ__k_kkkk_k_Qw',
    'w____k____k____w',
    'w_kkkk_kk_kkkk_w',
    'w__QQ______QQ__w',
    'wp____kkkk____pw',
    'w______________w',
    'wwwwwww__wwwwwww' ] },
  hist: { theme: 't_museum', rows: [
    'www*wwwwwww*ww',
    'wkk___t____kkw',
    'w____________w',
    'wkkk_kkkk_kkkw',
    'w____________w',
    'w_p________p_w',
    'w**wwwwwwww**w',
    'w____MMM_____w',
    'wk__OO__OO__kw',
    'w____________w',
    'w____________w',
    'wwwwww__wwwwww' ] },
  yard: { theme: 't_art', rows: [
    'www**wwwwww**www',
    'w____t____t____w',
    'w_FF________FF_w',
    'w______rr______w',
    'w_~~~__rr__~~~_w',
    'w_~~~__rr__~~~_w',
    'w______rr______w',
    'w_FF___rr___FF_w',
    'w______________w',
    'wp____A__A____pw',
    'w______________w',
    'wwwwwww__wwwwwww' ] },
  aud: { theme: 't_stage', rows: [
    'wwwwwwwwwwwwwwww',
    'ww**wBBBBBBw**ww',
    'w______________w',
    'w@@@@@@__@@@@@@w',
    'w______rr______w',
    'w_@@_V_rr_@_@@_w',
    'w______rr______w',
    'w_@@_@_rr_@_@@_w',
    'w______rr______w',
    'w_@@_@_rr_V_@@_w',
    'w______rr______w',
    'wV_@_@_rr_@_@@_w',
    'w______rr______w',
    'wwwwwww__wwwwwww' ] },
};
/* 一年甲班：小老師是「碎片化身」，旋渦在打完化身之後留在原地（夢中小鎮的入口，詳見 W.dreams.zy） */
ROOM_REDO.c1a.npcs = [
  { role: 'avatar1',  x: 5, y: 2, dir: 'down', hideFlag: 'zyEntered' },
  { role: 'zyPortal', x: 5, y: 2, dir: 'down', needFlag: 'zyEntered' },
  { role: 'gy1a',   x: 3, y: 4, dir: 'right', sight: 3 },
  { role: 'gy1b',   x: 8, y: 4, dir: 'left',  sight: 3 },
  { role: 'c1aTip', x: 2, y: 7, dir: 'right' },
];
/* 文藝教室：助教本人邀你進夢（沒有碎片化身）。三盆花開了、組員都點醒之後才肯談；含苞的花在進夢之後留在原地（花南街的入口，詳見 W.dreams.hn） */
ROOM_REDO.yard.npcs = [
  { role: 'avatar3', x: 7, y: 1, dir: 'down', hideFlag: 'hnEntered' },
  { role: 'hnPortal', x: 7, y: 1, dir: 'down', needFlag: 'hnEntered' },
  /* 教室裡的對手從一開始就站在這裡（玩家會以為真的要打了；夢醒之後才出現的話太突兀）。打倒館主之後沒打的人算已打完（settleGyms） */
  { role: 'gy3a', x: 4,  y: 8, dir: 'right', sight: 3 },
  { role: 'gy3b', x: 11, y: 8, dir: 'left',  sight: 3 },
];
/* 校史室：沒有人邀你。三座古文石碑亮起、石碑牆沉下之後，檔案室裡只有一塊歷屆榜（最後一格空著，你的名字浮現）；
   讀完被墨寫進夢裡，榜在進過夢之後留在原地當入口（碑林關，詳見 W.dreams.pl）。助教本人在夢裡。 */
ROOM_REDO.hist.npcs = [
  { role: 'avatar4', x: 7, y: 1, dir: 'down', hideFlag: 'plEntered' },
  { role: 'plPortal', x: 7, y: 1, dir: 'down', needFlag: 'plEntered' },
  { role: 'gy4a', x: 3,  y: 9, dir: 'right', sight: 3 },
  { role: 'gy4b', x: 10, y: 9, dir: 'left',  sight: 3 },
];
/* 圖書館：股長是「碎片化身」，三本辭典歸位、書架讓開後才見得到；攤開的書在打完化身之後留在原地（書海港的入口，詳見 W.dreams.dj） */
ROOM_REDO.lib.npcs = [
  { role: 'avatar2', x: 8, y: 1, dir: 'down', hideFlag: 'djEntered' },
  { role: 'djPortal', x: 8, y: 1, dir: 'down', needFlag: 'djEntered' },
  { role: 'gy2a', x: 5,  y: 8, dir: 'right', sight: 3 },
  { role: 'gy2b', x: 10, y: 8, dir: 'left',  sight: 3 },
];
/* 機關改成「題卷台」：靠牆的機關往前挪一格，站在牆前（台子本身的圖在 overworld 畫） */
const moveDevices = (id, map) => { const dv = {}; for (const [k, d] of Object.entries(LAYOUTS[id].devices)) dv[map[k] || k] = d; ROOM_REDO[id].devices = dv; };
moveDevices('c1a', { '4,0': '4,1', '6,0': '6,1', '8,0': '8,1' });
moveDevices('hist', { '5,6': '5,7', '6,6': '6,7', '7,6': '7,7' });
for (const [id, patch] of Object.entries(ROOM_REDO)) {
  const base = LAYOUTS[id]; if (!base) continue;
  CAMPUS_MAPS[id] = Object.assign({}, base, patch);
}
CAMPUS_MAPS.pharmacy.theme = 't_shop';

if (typeof LAYOUTS !== 'undefined') {
  for (const L of Object.values(CAMPUS_MAPS)) if (typeof stampProps === 'function') stampProps(L);
  Object.assign(LAYOUTS, CAMPUS_MAPS);
}
