'use strict';
/* ============================================================
   地圖（新版）
   ------------------------------------------------------------
   一格 16×16 像素，一個字元就是一格。
   **看到什麼就是什麼**：能不能走完全由字元決定，不再有另一份碰撞資料，
   所以不會出現「看起來是路卻走不過去」的空氣牆。

   ---- 地面（走得過去） ----
   .  草地          ,  泥土路          _  室內地板
   g  草叢（會遇敵）  s  沙地            b  橋
   d  門口踏墊（站上去會進門）

   ---- 擋住（走不過去） ----
   T  樹（兩格高的上半）   t  樹（下半）
   #  牆      W  窗       R  屋頂      r  屋簷
   ~  水      =  柵欄      ^  岩石      F  花圃
   S  告示牌（可讀）       L  路燈       B  黑板

   ---- 規則 ----
   1. 城鎮四周一律用 T/t 圍起來，**唯一的缺口就是出入口**，
      而且出入口一定有一條 `,` 的路接出去，玩家一眼就看得到往哪走。
   2. 房子一定是完整的長方形，屋頂 R 在上、牆 # 在下、門 d 在最下面那一列，
      門前一定留一格 `,` 的路。房子本身整塊都走不過去。
   3. 路 `,` 要連成一條線，不能斷掉；草地 `.` 可以走，但主要動線靠路引導。
   4. 每張地圖做完都要跑連通測試：出入口之間一定走得通。
   5. **會讓人猶豫「這到底能不能走」的東西一律不要放。**
      看起來像器材、像設施的，就要設成走不過去；
      看起來像地面的（球場、廣場），就要用柵欄或路把邊界圈出來，
      讓玩家一眼知道那是一塊可以走進去的場地。
   ============================================================ */

/* 磚塊表：key = 字元，walk = 走不走得過去。
   這些字元 gfx.js 都已經畫得出來，不用另外做美術。 */
const TILES = {
  /* ---- 走得過去 ---- */
  '.': { walk: 1, name: '草地' },
  ',': { walk: 1, name: '路' },
  'g': { walk: 1, name: '草叢（會遇敵）' },
  'i': { walk: 1, name: '石階（山道的階梯路）' },
  '+': { walk: 1, name: '木板橋' },
  '_': { walk: 1, name: '室內地板' },
  'U': { walk: 0, name: '鞦韆架（遊具）' },
  'K': { walk: 1, name: '球場（要用柵欄圍起來才看得出是場地）' },
  'r': { walk: 1, name: '地毯' },
  /* ---- 走不過去 ---- */
  'T': { walk: 0, name: '樹' },
  '#': { walk: 0, name: '牆' },
  'W': { walk: 0, name: '窗' },
  'D': { walk: 0, name: '門（撞上去會進去）' },
  'R': { walk: 0, name: '屋頂' },
  'h': { walk: 0, name: '紅瓦（補給站）' },
  'H': { walk: 0, name: '紅瓦＋十字招牌' },
  'c': { walk: 0, name: '藍瓦（商店）' },
  'C': { walk: 0, name: '藍瓦＋商店招牌' },
  'G': { walk: 0, name: '金瓦（道館）' },
  'y': { walk: 0, name: '金瓦＋匾額' },
  '~': { walk: 0, name: '水' },
  '=': { walk: 0, name: '柵欄' },
  '^': { walk: 0, name: '岩石' },
  'F': { walk: 0, name: '花圃' },
  'S': { walk: 0, name: '告示牌（可讀）' },
  'L': { walk: 0, name: '路燈' },
  'J': { walk: 0, name: '稻田' },
  'N': { walk: 0, name: '門牌' },
  'O': { walk: 0, name: '石碑' },
  'Q': { walk: 0, name: '木箱堆' },
  'm': { walk: 0, name: '市集攤位' },
  'n': { walk: 0, name: '布招／旗幟' },
  'B': { walk: 0, name: '黑板' },
  'M': { walk: 0, name: '感應台／石碑牆（機關做在上面）' },
  'Y': { walk: 0, name: '竹叢' },
  'A': { walk: 0, name: '涼亭' },
  'Z': { walk: 0, name: '湯池／溫泉' },
  'E': { walk: 0, name: '大時鐘（一格一個，不要整片鋪）' },
  'V': { walk: 0, name: '螢幕／儀器' },
  'w': { walk: 0, name: '室內牆' },
  'k': { walk: 0, name: '書架' },
  'b': { walk: 0, name: '床' },
  't': { walk: 0, name: '櫃檯' },
  'p': { walk: 0, name: '盆栽' },
  'e': { walk: 0, name: '講桌' },
  'x': { walk: 0, name: '掛軸' },
};
for (const [ch, t] of Object.entries(TILES)) if (!t.walk) SOLID.add(ch);

/* ------------------------------------------------------------
   地圖一張一張加進來。格式：
     MAPS.chendu = {
       name: '晨讀村', music: 'town', theme: 't_dawn',
       rows: [ '一列一個字串', ... ],
       doors:  { '12,9': { to: 'home', tx: 5, ty: 6, dir: 'up' } },   // 站上 d 會進去
       exits:  [ { x: 16, y: 21, to: 'r1', tx: 11, ty: 15, dir: 'up' } ],
       npcs: [], chests: [], signs: {},
     };
   已完成（第一～三章）：
     全部 30 張都完成了：
     室外 chendu r1 zhuyin r2 chaoshu r3 dianji r4 tingyu huanan r5 beilin r6 moquan zhongta
     室內 home c8 clinic_h store_h clinic_c store_c clinic_o store_o forge
          c1a lib yard hist aud inkpool
   ------------------------------------------------------------ */
const MAPS = {};

/* ============================================================
   ① 晨讀村 chendu　25×20　晨光田園（暖黃＋嫩綠）
   ------------------------------------------------------------
        0    5    0    5    0
   0  TTTTTTTTTTT,,TTTTTTTTTTTT  ← 北出口：樹牆唯一的缺口，路直接接出去
   5  TT.#WDW#...,,.#WWDWW#..TT     我家(5,5)　晨讀教室(17,5)
   6  TT.,,,,,,,,,,,,,,,,,,..TT     橫向大街：一條路串起所有門口
  13  TT.#WDW#...,,..=======.TT     保健室(5,13)
   ============================================================ */
MAPS.chendu = {
  music: 'town', qlv: 1, chapter: 1, theme: 't_dawn',
  rows: [
    'TTTTTTTTTTT,,TTTTTTTTTTTT',
    'TT.........,,..........TT',
    'TT......S..,,.RRRRRRR..TT',
    'TT.RRRRR...,,.RRRRRRR..TT',
    'TT.RRRRR...,,.RRRRRRR..TT',
    'TT.#WDW#...,,.#WWDWW#..TT',
    'TT.,,,,,,,,,,,,,,,,,,..TT',
    'TT.........,,..........TT',
    'TT....F....,,..........TT',
    'TT.........,,..=======.TT',
    'TT.........,,..=JJJJJ=.TT',
    'TT.hhHhh...,,..=JJJJJ=.TT',
    'TT.hhhhh...,,..=JJJJJ=.TT',
    'TT.#WDW#...,,..=======.TT',
    'TT.,,,,,,,,,,..........TT',
    'TT.........,,..........TT',
    'TT....F....,,....~~~~~.TT',
    'TT.........,,....~~~~~.TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  /* 門：站在門前撞上去才會進去（門那一格本身走不過去） */
  doorWarps: {
    '5,5':  { to: 'home',     tx: 5, ty: 5, dir: 'up', ret: { x: 5, y: 6 } },
    '17,5': { to: 'c8',       tx: 6, ty: 7, dir: 'up', ret: { x: 17, y: 6 } },
    '5,13': { to: 'clinic_h', tx: 5, ty: 5, dir: 'up', ret: { x: 5, y: 14 } },
  },
  /* 出城：踩上去就走（一定在樹牆的缺口上） */
  warps: [
    { x: 11, y: 0, to: 'r1', tx: 9,  ty: 23, dir: 'up' },
    { x: 12, y: 0, to: 'r1', tx: 10, ty: 23, dir: 'up' },
  ],
  signs: { '8,2': 'sign_chendu' },
  npcs: [
    { role: 't_cd_a', x: 9,  y: 7, dir: 'down' },
    { role: 't_cd_b', x: 15, y: 7, dir: 'down' },
  ],
  chests: [{ x: 21, y: 1, id: 'chendu1', items: { potion: 2 } }],
};



/* ============================================================
   ② 晨讀田埂道 r1　20×25　田埂（稻田夾道，t_dawn 同一組配色）
   ------------------------------------------------------------
   南接晨讀村、北接注音坡，中央一條直路；西邊繞一圈到寶箱。
   草叢共 60 格，是第一次遇到武器妖的地方。
   ============================================================ */
MAPS.r1 = {
  music: 'route', qlv: 1, chapter: 1, theme: 't_dawn',
  rows: [
    'TTTTTTTTT,,TTTTTTTTT',
    'TT.......,,.......TT',
    'TT.ggggg.,,.......TT',
    'TT.ggggg.,,.=====.TT',
    'TT.ggggg.,,.=JJJ=.TT',
    'TT.......,,.=JJJ=.TT',
    'TT.......,,.=====.TT',
    'TT.......,,.......TT',
    'TT,,,,,,,,,.......TT',
    'TT,......,,.......TT',
    'TT,.^^^..,,.ggggg.TT',
    'TT,.^^^..,,.ggggg.TT',
    'TT,......,,.ggggg.TT',
    'TT,,,,,,,,,.......TT',
    'TT.......,,.......TT',
    'TT.ggggg.,,.=====.TT',
    'TT.ggggg.,,.=JJJ=.TT',
    'TT.ggggg.,,.=====.TT',
    'TT.......,,.......TT',
    'TT.......,,.ggggg.TT',
    'TT.......,,.ggggg.TT',
    'TT..F....,,.ggggg.TT',
    'TT.......,,...F...TT',
    'TT.......,,.......TT',
    'TTTTTTTTT,,TTTTTTTTT',
  ],
  warps: [
    { x: 9,  y: 24, to: 'chendu', tx: 11, ty: 1, dir: 'down' },
    { x: 10, y: 24, to: 'chendu', tx: 12, ty: 1, dir: 'down' },
    { x: 9,  y: 0,  to: 'zhuyin', tx: 11, ty: 16, dir: 'up' },
    { x: 10, y: 0,  to: 'zhuyin', tx: 12, ty: 16, dir: 'up' },
  ],
  foes: { n: 6, lv: [2, 4], scale: 1, auto: 1 },
  npcs: [
    { role: 'dictA',     x: 8,  y: 7,  dir: 'right', sight: 3 },
    { role: 'dictB',     x: 11, y: 18, dir: 'left',  sight: 3 },
    { role: 'roamHint2', x: 4,  y: 9,  dir: 'down' },
  ],
  chests: [{ x: 5, y: 12, id: 'r1a', items: { heal: 2, hint: 1 } }],
};

/* ============================================================
   ③ 注音坡 zhuyin　25×18　低年級校舍（橘黃＋粉筆色）
   ------------------------------------------------------------
   上半是校舍（道館①），下半是補給站與商店，
   右邊沙坑、石階、球場＝小學部的遊戲區。
   南接晨讀田埂道、北接抄書石階。
   ============================================================ */
MAPS.zhuyin = {
  music: 'town', qlv: 1, chapter: 1, theme: 't_slope',
  rows: [
    'TTTTTTTTTTT,,TTTTTTTTTTTT',
    'TT........S,,..........TT',
    'TT.GGyyyGG.,,..........TT',
    'TT.GGGGGGG.,,...UUU....TT',
    'TT.GGGGGGG.,,..........TT',
    'TT.#WWDWW#S,,..........TT',
    'TT.,,,,,,,,,,,,,,,,,,..TT',
    'TT.........,,..........TT',
    'TT.........,,..........TT',
    'TT.........,,..........TT',
    'TT.hhHhh...,,...ccCcc..TT',
    'TT.hhhhh...,,...ccccc..TT',
    'TT.#WDW#...,,...#WDW#..TT',
    'TT.,,,,,,,,,,,,,,,,,,..TT',
    'TT.........,,.===,===..TT',
    'TT..F......,,.=KKKKK=..TT',
    'TT......F..,,.=KKKKK=..TT',
    'TTTTTTTTTTT,,TTTTTTTTTTTT',
  ],
  doorWarps: {
    '6,5':   { to: 'c1a',      tx: 8, ty: 7, dir: 'up', ret: { x: 6,  y: 6 } },
    '5,12':  { to: 'clinic_h', tx: 5, ty: 5, dir: 'up', ret: { x: 5,  y: 13 } },
    '18,12': { to: 'store_h',  tx: 5, ty: 5, dir: 'up', ret: { x: 18, y: 13 } },
  },
  warps: [
    { x: 11, y: 17, to: 'r1', tx: 9,  ty: 1, dir: 'down' },
    { x: 12, y: 17, to: 'r1', tx: 10, ty: 1, dir: 'down' },
    { x: 11, y: 0,  to: 'r2', tx: 8, ty: 23, dir: 'up' },
    { x: 12, y: 0,  to: 'r2', tx: 9, ty: 23, dir: 'up' },
  ],
  shop: ['heal', 'hint'],                       // 商店賣什麼（Shop 讀的是進來時所在的城鎮）
  signs: { '10,1': 'sign_zhuyin', '10,5': 'sg29' },
  npcs: [
    { role: 'gymTip1', x: 10, y: 6,  dir: 'up' },
    { role: 't_zy_a',  x: 8,  y: 9,  dir: 'down' },
    { role: 't_zy_b',  x: 15, y: 7,  dir: 'down', wander: 1 },
  ],
  chests: [{ x: 21, y: 15, id: 'zy1', items: { heal: 2 } }],
};

/* ============================================================
   室內：出口一律在最下面那一排牆的缺口，踩上去就出去（to: '@ret'）
   ------------------------------------------------------------
   _ 地板　w 牆　b 床　t 桌／櫃檯　k 書架／貨架　p 盆栽　r 地毯
   B 黑板　e 講桌
   ============================================================ */

/* ④ 我的家 home　10×7 */
MAPS.home = {
  music: 'town', qlv: 1, chapter: 1, indoor: 1, theme: 't_dawn',
  rows: [
    'wwwwwwwwww',
    'wkk____pbw',
    'w_______bw',
    'w__tt____w',
    'w__tt__r_w',
    'wp_______w',
    'wwww__wwww',
  ],
  warps: [{ x: 4, y: 6, to: '@ret' }, { x: 5, y: 6, to: '@ret' }],
  npcs: [{ role: 'homeNpc', x: 6, y: 3, dir: 'down' }],
};

/* ⑤ 晨讀教室 c8　12×9　（序幕從這裡開始） */
MAPS.c8 = {
  music: 'town', qlv: 1, chapter: 1, indoor: 1, theme: 't_dawn',
  rows: [
    'wwwwBBBBwwww',
    'w____e_____w',
    'w_tt____tt_w',
    'w__________w',
    'w_tt____tt_w',
    'w__________w',
    'w_tt____tt_w',
    'wp________pw',
    'wwwww__wwwww',
  ],
  /* 這裡是新遊戲的起點：玩家不是從門進來的，所以 G.ret 還不存在，
     出口不能用 '@ret'（會卡在教室裡出不去），要明確寫回晨讀村的教室門口。 */
  warps: [
    { x: 5, y: 8, to: 'chendu', tx: 17, ty: 6, dir: 'down' },
    { x: 6, y: 8, to: 'chendu', tx: 17, ty: 6, dir: 'down' },
  ],
  npcs: [{ role: 'mentor', x: 5, y: 2, dir: 'down' }],
};

/* ⑥ 保健室（田園）clinic_h　10×7 */
MAPS.clinic_h = {
  music: 'town', qlv: 1, chapter: 1, indoor: 1, theme: 't_dawn',
  rows: [
    'wwwwwwwwww',
    'wb_kkk__bw',
    'w________w',
    'wtttt____w',
    'w_p____p_w',
    'w________w',
    'wwww__wwww',
  ],
  warps: [{ x: 4, y: 6, to: '@ret' }, { x: 5, y: 6, to: '@ret' }],
  npcs: [{ role: 'healer', x: 2, y: 2, dir: 'down' }],
};

/* ⑦ 商店（田園）store_h　10×7 */
MAPS.store_h = {
  music: 'town', qlv: 1, chapter: 1, indoor: 1, theme: 't_dawn',
  rows: [
    'wwwwwwwwww',
    'wkkkk_kkkw',
    'w________w',
    'w__ttt___w',
    'w________w',
    'wp__rr__pw',
    'wwww__wwww',
  ],
  warps: [{ x: 4, y: 6, to: '@ret' }, { x: 5, y: 6, to: '@ret' }],
  npcs: [{ role: 'clerk', x: 4, y: 2, dir: 'down' }],
};

/* ============================================================
   ⑧ 注音坡道館 c1a　12×9　低年級教室（橘黃＋粉筆色）
   ------------------------------------------------------------
   道館的共通版型（之後四座照這個做）：
     · 玩家從最下面那排牆的缺口進來（正中央兩格）
     · 館主站在正上方中央，前面一定留一格站位
     · 三個機關做在最上面那排牆上，站在它下面按 A 互動
     · 寶箱放在右下
   這一座：後牆一整排黑板，三塊是「錯字黑板」（考字形），
   三塊都淨化之後館主血量 −20%（flag: bbAll）。
   ============================================================ */
MAPS.c1a = {
  music: 'hall', qlv: 1, chapter: 1, indoor: 1, theme: 't_slope',
  rows: [
    'wwwwBBBBBBww',
    'w____e_____w',
    'w__________w',
    'w_tt_rr_tt_w',
    'w__________w',
    'w_tt_rr_tt_w',
    'wp________pw',
    'w__________w',
    'wwwww__wwwww',
  ],
  warps: [
    { x: 5, y: 8, to: 'zhuyin', tx: 6, ty: 6, dir: 'down' },
    { x: 6, y: 8, to: 'zhuyin', tx: 6, ty: 6, dir: 'down' },
  ],
  npcs: [
    { role: 'boss1',  x: 5, y: 2, dir: 'down' },
    { role: 'gy1a',   x: 3, y: 4, dir: 'right', sight: 3 },
    { role: 'gy1b',   x: 8, y: 4, dir: 'left',  sight: 3 },
    { role: 'c1aTip', x: 2, y: 7, dir: 'right' },
  ],
  chests: [{ x: 9, y: 6, id: 'c1a1', items: { heal: 2, hint: 1 } }],
  devices: {
    '4,0': { group: 'bb', flag: 'bb1', cat: '字形', label: '錯字黑板',
      text: '黑板上浮著扭曲的錯字，正一個個滴下黑墨……\n（找出正確的寫法，就能淨化它！）',
      ok: '錯字被擦掉了，黑板恢復了乾淨！',
      allText: '三塊黑板都被淨化了！小老師身上的錯字怨念淡了許多。' },
    '6,0': { group: 'bb', flag: 'bb2', cat: '字形', label: '錯字黑板',
      text: '第二塊黑板上的錯字正在發抖。',
      ok: '錯字被擦掉了！',
      allText: '三塊黑板都被淨化了！' },
    '8,0': { group: 'bb', flag: 'bb3', cat: '字形', label: '錯字黑板',
      text: '最後一塊黑板寫滿了形近字。',
      ok: '錯字被擦掉了！',
      allText: '三塊黑板都被淨化了！小老師身上的錯字怨念淡了許多。',
      onAll: 'bbAll' },
  },
};

/* ============================================================
   ⑨ 抄書石階 r2　18×25　石階山道（灰石＋紅燈籠，t_alley）
   ------------------------------------------------------------
   一整條石階從南爬到北，兩側掛紅燈籠。
   中段往西有一條岔路，盡頭用岩石框出一個小角落放寶箱。
   草叢 46 格；兩位視線型對手守在階梯邊。
   南接注音坡、北接抄書巷。
   ============================================================ */
MAPS.r2 = {
  music: 'route', qlv: 2, chapter: 2, theme: 't_alley',
  rows: [
    'TTTTTTTTiiTTTTTTTT',
    'TT......ii......TT',
    'TT......ii..QQ..TT',
    'TT..ggggii..QQ..TT',
    'TT..gggLiiL.....TT',
    'TT..ggggii......TT',
    'TT......ii.gggg.TT',
    'TT......ii.gggg.TT',
    'TT......ii.gggg.TT',
    'TT.....LiiL.....TT',
    'TT......ii......TT',
    'TT......ii......TT',
    'TT.iiiiiii......TT',
    'TT.^.^..ii......TT',
    'TT......ii......TT',
    'TT...^^.ii......TT',
    'TT...^^LiiLgggg.TT',
    'TT......ii.gggg.TT',
    'TT......ii.gggg.TT',
    'TT..ggggii......TT',
    'TT..ggggii......TT',
    'TT..gggLiiL.QQ..TT',
    'TT......ii..QQ..TT',
    'TT......ii......TT',
    'TTTTTTTTiiTTTTTTTT',
  ],
  warps: [
    { x: 8, y: 24, to: 'zhuyin',  tx: 11, ty: 1,  dir: 'down' },
    { x: 9, y: 24, to: 'zhuyin',  tx: 12, ty: 1,  dir: 'down' },
    { x: 8, y: 0,  to: 'chaoshu', tx: 11, ty: 18, dir: 'up' },
    { x: 9, y: 0,  to: 'chaoshu', tx: 12, ty: 18, dir: 'up' },
  ],
  foes: { n: 7, lv: [4, 7], scale: 1, auto: 1 },
  npcs: [
    { role: 't_r2a',     x: 7,  y: 7,  dir: 'right', sight: 3 },
    { role: 't_r2b',     x: 10, y: 17, dir: 'left',  sight: 3 },
    { role: 'roamHint2', x: 11, y: 12, dir: 'down' },
  ],
  chests: [{ x: 4, y: 13, id: 'r2a', frags: { tome: 2 }, items: { heal: 1 } }],
};

/* ============================================================
   ⑩ 抄書巷 chaoshu　25×20　老街（暗紅褐＋燈籠，t_alley）
   ------------------------------------------------------------
   兩條橫街串起三個門：補給站(5,4)、鍛造工坊(17,4)、商店(5,11)。
   街上有市集攤位、布招、燈籠、木箱——全部走不過去，
   路與空地才走得過去（規則 5）。
   南接抄書石階、北接運書河道。
   ============================================================ */
MAPS.chaoshu = {
  music: 'town', qlv: 2, chapter: 2, theme: 't_alley',
  rows: [
    'TTTTTTTTTTT,,TTTTTTTTTTTT',
    'TT........S,,..........TT',
    'TT.hhHhh...,,..RRRRR...TT',
    'TT.hhhhh...,,..RRRRR...TT',
    'TT.#WDW#.S.,,..#WDW#...TT',
    'TT.,,,,,,,,,,,,,,,,,,..TT',
    'TT.....L.L.,,.L...L....TT',
    'TT.........,,..n...n...TT',
    'TT.........,,..mmmm....TT',
    'TT.ccCcc...,,..mmmm....TT',
    'TT.ccccc...,,..........TT',
    'TT.#WDW#.S.,,..........TT',
    'TT.,,,,,,,,,,,,,,,,,,..TT',
    'TT.....L.L.,,.L...L....TT',
    'TT.........,,......QQ..TT',
    'TT.........,,......QQ..TT',
    'TT.........,,..mmmm....TT',
    'TT.........,,..........TT',
    'TT.........,,..........TT',
    'TTTTTTTTTTT,,TTTTTTTTTTTT',
  ],
  doorWarps: {
    '5,4':  { to: 'clinic_h', tx: 5, ty: 5, dir: 'up', ret: { x: 5,  y: 5 } },
    '17,4': { to: 'forge',    tx: 5, ty: 5, dir: 'up', ret: { x: 17, y: 5 } },
    '5,11': { to: 'store_h',  tx: 5, ty: 5, dir: 'up', ret: { x: 5,  y: 12 } },
  },
  warps: [
    { x: 11, y: 19, to: 'r2', tx: 8, ty: 1,  dir: 'down' },
    { x: 12, y: 19, to: 'r2', tx: 9, ty: 1,  dir: 'down' },
    { x: 11, y: 0,  to: 'r3', tx: 9,  ty: 23, dir: 'up' },
    { x: 12, y: 0,  to: 'r3', tx: 10, ty: 23, dir: 'up' },
  ],
  shop: ['heal', 'heal2', 'cure', 'ward', 'atkup', 'defup', 'hint'],
  signs: { '10,1': 'sign_chaoshu', '9,4': 'sg7', '9,11': 'sg9' },
  npcs: [
    { role: 'busStop',  x: 14, y: 7,  dir: 'down' },
    { role: 'forgeTip', x: 16, y: 6,  dir: 'up' },
    { role: 'townTip2', x: 8,  y: 7,  dir: 'left', wander: 1 },
    { role: 'roamHint', x: 9,  y: 14, dir: 'down' },
    { role: 't_cs_a',   x: 6,  y: 14, dir: 'down' },
    { role: 't_cs_b',   x: 15, y: 13, dir: 'down' },
  ],
  chests: [{ x: 21, y: 14, id: 'cs1', items: { hint: 2, heal2: 1 } }],
};

/* ⑪ 鍛造工坊 forge　12×7（碎片換武器） */
MAPS.forge = {
  music: 'town', qlv: 2, chapter: 2, indoor: 1, theme: 't_alley',
  rows: [
    'wwwwwwwwwwww',
    'wkk_ttt__kkw',
    'w__________w',
    'w_t_____t__w',
    'w__r____r__w',
    'wp________pw',
    'wwwww__wwwww',
  ],
  warps: [{ x: 5, y: 6, to: '@ret' }, { x: 6, y: 6, to: '@ret' }],
  npcs: [{ role: 'smith', x: 5, y: 2, dir: 'down' }],
};

/* ============================================================
   ⑫ 運書河道 r3　20×25　河道（t_port 藍灰）
   ------------------------------------------------------------
   兩條橫向河道把路切成三段，主路上各架一座橋跨過去。
   橋用的是木板橋磚塊（'+'），兩側有欄杆。
   草叢 48 格；兩位視線型對手守在路邊。
   南接抄書巷、北接典籍港。
   ============================================================ */
MAPS.r3 = {
  music: 'route', qlv: 2, chapter: 2, theme: 't_port',
  rows: [
    'TTTTTTTTT,,TTTTTTTTT',
    'TT.......,,.......TT',
    'TT.gggg..,,..QQ...TT',
    'TT.gggg..,,..QQ...TT',
    'TT.gggg..,,.......TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT~~~~~~~++~~~~~~~TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT....^^.,,..gggg.TT',
    'TT....^^.,,..gggg.TT',
    'TT.......,,..gggg.TT',
    'TT.gggg..,,.......TT',
    'TT.gggg..,,.......TT',
    'TT.gggg..,,.......TT',
    'TT.......,,.......TT',
    'TT~~~~~~~++~~~~~~~TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT..QQ...,,..gggg.TT',
    'TT..QQ...,,..gggg.TT',
    'TT.......,,..gggg.TT',
    'TT.......,,.......TT',
    'TTTTTTTTT,,TTTTTTTTT',
  ],
  warps: [
    { x: 9,  y: 24, to: 'chaoshu', tx: 11, ty: 1, dir: 'down' },
    { x: 10, y: 24, to: 'chaoshu', tx: 12, ty: 1, dir: 'down' },
    { x: 9,  y: 0,  to: 'dianji',  tx: 13, ty: 18, dir: 'up' },
    { x: 10, y: 0,  to: 'dianji',  tx: 14, ty: 18, dir: 'up' },
  ],
  foes: { n: 7, lv: [6, 9], scale: 1, auto: 1 },
  npcs: [
    { role: 't_r3a',     x: 8,  y: 8,  dir: 'right', sight: 3 },
    { role: 't_r3b',     x: 11, y: 12, dir: 'left',  sight: 3 },
    { role: 'roamHint2', x: 4,  y: 9,  dir: 'down' },
  ],
  chests: [{ x: 3, y: 19, id: 'r3a', items: { atkup: 1, heal: 2 } }],
};

/* ============================================================
   ⑬ 典籍港 dianji　28×20　碼頭（藍灰＋木箱，t_port）
   ------------------------------------------------------------
   主路南北直通，兩條橫街分別接到道館②(19,4)、補給站(5,4)、商店(20,11)。
   左下是港灣水面與成堆的書箱。南接運書河道、北接聲音鐘步道。
   ============================================================ */
MAPS.dianji = {
  music: 'town', qlv: 2, chapter: 2, theme: 't_port',
  rows: [
    'TTTTTTTTTTTTT,,TTTTTTTTTTTTT',
    'TT..........S,,...........TT',
    'TT.hhHhh.....,,.GGyyyGG...TT',
    'TT.hhhhh.....,,.GGGGGGG...TT',
    'TT.#WDW#.....,,.#WWDWW#.S.TT',
    'TT...........,,...........TT',
    'TT.,,,,,,,,,,,,,,,,,,,,,..TT',
    'TT........L..,,.......L...TT',
    'TT...........,,...........TT',
    'TT...........,,...ccCcc...TT',
    'TT...........,,...ccccc...TT',
    'TT...........,,..S#WDW#...TT',
    'TT...........,,...........TT',
    'TT.,,,,,,,,,,,,,,,,,,,,,..TT',
    'TT.QQ..QQ....,,...........TT',
    'TT~~~~~~~....,,.....QQQQ..TT',
    'TT~~~~~~~....,,.....QQQQ..TT',
    'TT~~~~~~~....,,...........TT',
    'TT~~~~~~~....,,...........TT',
    'TTTTTTTTTTTTT,,TTTTTTTTTTTTT',
  ],
  doorWarps: {
    '19,4':  { to: 'lib',      tx: 7, ty: 10, dir: 'up', ret: { x: 19, y: 5 }, need: 1, gate: 'need1' },
    '5,4':   { to: 'clinic_c', tx: 5, ty: 5,  dir: 'up', ret: { x: 5,  y: 5 } },
    '20,11': { to: 'store_c',  tx: 5, ty: 5,  dir: 'up', ret: { x: 20, y: 12 } },
  },
  warps: [
    { x: 13, y: 19, to: 'r3', tx: 9,  ty: 1,  dir: 'down' },
    { x: 14, y: 19, to: 'r3', tx: 10, ty: 1,  dir: 'down' },
    { x: 13, y: 0,  to: 'r4', tx: 9,  ty: 26, dir: 'up' },
    { x: 14, y: 0,  to: 'r4', tx: 10, ty: 26, dir: 'up' },
  ],
  shop: ['heal', 'heal2', 'cure', 'ward', 'atkup', 'defup', 'hint'],
  signs: { '12,1': 'sign_dianji', '24,4': 'sg30', '17,11': 'sg10' },
  npcs: [
    { role: 'townTip3', x: 10, y: 8,  dir: 'down' },
    /* 勁敵①：擋在往道館②的路上。boss2 的 needDefeated 指名 dianji:rival1，
       沒有他，成語圖書股長永遠打不了。 */
    { role: 'rival1',   x: 19, y: 7,  dir: 'up', sight: 2 },
    { role: 'gymTip2',  x: 21, y: 6,  dir: 'down' },   // 不能站在 (19,5)：那是道館門唯一的門前站位
    { role: 't_dj_a',   x: 7,  y: 12, dir: 'down' },
    { role: 't_dj_b',   x: 22, y: 12, dir: 'down', wander: 1 },   // 不能放 (22,9)：那是商店的屋頂
  ],
  chests: [{ x: 23, y: 18, id: 'dj1', items: { heal2: 2, hint: 1 } }],
};

/* ============================================================
   ⑭ 典籍港道館 lib　16×12　倉庫改的圖書館（書架迷宮）
   ------------------------------------------------------------
   這一座是「解開才通得過」型：中央那道書架牆把館主關在後面，
   三本飛舞的成語辭典全部歸位後，(7,2)(8,2) 兩格才會讓開。
   ============================================================ */
MAPS.lib = {
  music: 'hall', qlv: 2, chapter: 2, indoor: 1, theme: 't_port',
  rows: [
    'wwwwwwwwwwwwwwww',
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
    'wwwwwww__wwwwwww',
  ],
  warps: [
    { x: 7, y: 11, to: 'dianji', tx: 19, ty: 5, dir: 'down' },
    { x: 8, y: 11, to: 'dianji', tx: 19, ty: 5, dir: 'down' },
  ],
  npcs: [{ role: 'boss2', x: 8, y: 1, dir: 'down' }],
  chests: [{ x: 1, y: 10, id: 'lib1', items: { hint: 2, dodgeup: 1 }, frags: { tome: 2 } }],
  devices: {
    '2,3': { group: 'bk', flag: 'bk1', cat: '成語', label: '飛舞的成語辭典',
      text: '一本成語辭典在書箱上飛來飛去，書頁上缺了一個字……',
      ok: '辭典安靜地飛回了書架！',
      allText: '三本辭典都歸位了——中央的書架緩緩讓開，露出通往股長的路！',
      open: [[7, 2], [8, 2]] },
    '10,3': { group: 'bk', flag: 'bk2', cat: '成語', label: '飛舞的成語辭典',
      text: '第二本辭典在你頭上盤旋。',
      ok: '辭典飛回了書架！',
      allText: '三本辭典都歸位了！',
      open: [[7, 2], [8, 2]] },
    '7,7': { group: 'bk', flag: 'bk3', cat: '成語', label: '飛舞的成語辭典',
      text: '最後一本辭典夾在書箱縫隙中。',
      ok: '辭典回到了原位！',
      allText: '三本辭典都歸位了——中央的書架緩緩讓開！',
      open: [[7, 2], [8, 2]], onAll: 'bkAll' },
  },
};

/* ⑮ 保健室（城市）clinic_c　12×7 */
MAPS.clinic_c = {
  music: 'town', qlv: 2, chapter: 2, indoor: 1, theme: 't_city',
  rows: [
    'wwwwwwwwwwww',
    'wbb_kkkk__bw',
    'w__________w',
    'wtttt___tttw',
    'w_p______p_w',
    'w__________w',
    'wwwww__wwwww',
  ],
  warps: [{ x: 5, y: 6, to: '@ret' }, { x: 6, y: 6, to: '@ret' }],
  npcs: [{ role: 'healer', x: 3, y: 2, dir: 'down' }],
};

/* ⑯ 商店（城市）store_c　12×7 */
MAPS.store_c = {
  music: 'town', qlv: 2, chapter: 2, indoor: 1, theme: 't_port',
  rows: [
    'wwwwwwwwwwww',
    'wkkkkk_kkkkw',
    'w__________w',
    'w__tttt____w',
    'w____rr____w',
    'wp________pw',
    'wwwww__wwwww',
  ],
  warps: [{ x: 5, y: 6, to: '@ret' }, { x: 6, y: 6, to: '@ret' }],
  npcs: [{ role: 'clerk', x: 4, y: 2, dir: 'down' }],
};

/* ============================================================
   ⑬ 聲音鐘步道 r4　20×28　竹林（t_bamboo）
   ------------------------------------------------------------
   南接典籍港、北接花南街，中段往西有一條岔路通到聽雨亭（死路休息站）。
   往北的路被墨塵纏住（gates: sideA）——要先打贏分組報告三人組 m1/m2/m3
   才過得去；三個人都站在主路旁邊，往北走一定會遇到。
   ============================================================ */
MAPS.r4 = {
  music: 'route', qlv: 2, chapter: 3, theme: 't_bamboo',
  rows: [
    'TTTTTTTTT,,TTTTTTTTT',
    'TT.......,,.......TT',
    'TT.......,,.YY....TT',
    'TT.gggg..,,.YY....TT',
    'TT.gggg..,,.......TT',
    'TT.gggg..,,.......TT',
    'TT.......,,.......TT',
    'TT.......,,.gggg..TT',
    'TT.......,,.gggg..TT',
    'TT.......,,.gggg..TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT.......,,.......TT',
    'TT.gggg..,,.......TT',
    'TT.gggg..,,.......TT',
    'TT.gggg..,,.......TT',
    'TT.......,,.......TT',
    'TT.......,,..^^^..TT',
    'TT.......,,..^^^..TT',
    'TT.......,,.......TT',
    ',,,,,,,,,,,.......TT',
    'TT.......,,.......TT',
    'TT.......,,.gggg..TT',
    'TT.......,,.gggg..TT',
    'TT..YY...,,.gggg..TT',
    'TT..YY...,,.......TT',
    'TT.......,,.......TT',
    'TTTTTTTTT,,TTTTTTTTT',
  ],
  gates: { '9,5': 'sideA', '10,5': 'sideA' },
  warps: [
    { x: 9,  y: 27, to: 'dianji', tx: 13, ty: 1,  dir: 'down' },
    { x: 10, y: 27, to: 'dianji', tx: 14, ty: 1,  dir: 'down' },
    { x: 9,  y: 0,  to: 'huanan', tx: 11, ty: 18, dir: 'up' },
    { x: 10, y: 0,  to: 'huanan', tx: 12, ty: 18, dir: 'up' },
    { x: 0,  y: 20, to: 'tingyu', tx: 18, ty: 8,  dir: 'left' },
  ],
  foes: { n: 8, lv: [8, 11], scale: 1, auto: 1 },
  npcs: [
    { role: 'm1',         x: 8,  y: 7,  dir: 'right', sight: 3 },
    { role: 'm2',         x: 11, y: 12, dir: 'left',  sight: 3 },
    { role: 'm3',         x: 11, y: 16, dir: 'left',  sight: 3 },
    { role: 'sideAGiver', x: 12, y: 6,  dir: 'down' },
    { role: 'roamHint2',  x: 4,  y: 19, dir: 'down' },
  ],
  chests: [{ x: 16, y: 2, id: 'r4a', items: { ward: 1, heal2: 1 } }],
};

/* ============================================================
   ⑭ 聽雨亭 tingyu　20×15　雨中茶亭（t_bamboo）
   ------------------------------------------------------------
   只有東邊一個出入口的死路支線：茶屋（補給站）可以回血，
   還有水池、涼亭與兩位可以切磋的同學。
   ============================================================ */
MAPS.tingyu = {
  music: 'town', qlv: 2, chapter: 3, theme: 't_bamboo',
  rows: [
    'TTTTTTTTTTTTTTTTTTTT',
    'TT.................T',
    'TT........S........T',
    'TT..hhHhh..~~~~~...T',
    'TT..hhhhh..~~~~~...T',
    'TT..#WDW#..~~~~~...T',
    'TT.........~~~~~...T',
    'TT.................T',
    'TT.,,,,,,,,,,,,,,,,,',
    'TT............F....T',
    'TT.......AA........T',
    'TT.......AA........T',
    'TT.................T',
    'TT.................T',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  doorWarps: { '6,5': { to: 'clinic_o', tx: 5, ty: 5, dir: 'up', ret: { x: 6, y: 6 } } },
  warps: [{ x: 19, y: 8, to: 'r4', tx: 1, ty: 20, dir: 'right' }],
  signs: { '10,2': 'sign_tingyu' },
  npcs: [
    { role: 'busStop',   x: 7,  y: 10, dir: 'down' },
    { role: 'sparring',  x: 13, y: 9,  dir: 'down' },
    { role: 'townTip4',  x: 4,  y: 9,  dir: 'right', wander: 1 },
    { role: 'sparring2', x: 16, y: 10, dir: 'left' },
    { role: 'roamHint',  x: 3,  y: 11, dir: 'down' },
    { role: 't_ty_a',    x: 14, y: 12, dir: 'down' },
  ],
  chests: [{ x: 17, y: 12, id: 'ty1', items: { heal2: 2, wenqi: 1 } }],
};

/* ============================================================
   ⑮ 花南街 huanan　25×20　花市拱廊（t_flower）
   ------------------------------------------------------------
   兩條橫街接到道館③(17,4)、補給站(5,4)、商店(5,11)；
   右邊是花圃與水池。南接聲音鐘步道、北接古碑小徑。
   道館③要兩片碎片。
   ============================================================ */
MAPS.huanan = {
  music: 'town', qlv: 3, chapter: 3, theme: 't_flower',
  rows: [
    'TTTTTTTTTTT,,TTTTTTTTTTTT',
    'TT........S,,..........TT',
    'TT.hhHhh...,,.GGyyyGG..TT',
    'TT.hhhhh...,,.GGGGGGG..TT',
    'TT.#WDW#.S.,,.#WWDWW#..TT',
    'TT.........,,..........TT',
    'TT.,,,,,,,,,,,,,,,,,,..TT',
    'TT.........,,..........TT',
    'TT.........,,..FFFFFF..TT',
    'TT.ccCcc...,,..FFFFFF..TT',
    'TT.ccccc...,,..FFFFFF..TT',
    'TT.#WDW#.S.,,..........TT',
    'TT.........,,..........TT',
    'TT.,,,,,,,,,,,,,,,,,,..TT',
    'TT.........,,..........TT',
    'TT.....FFF.,,..~~~~~~..TT',
    'TT.....FFF.,,..~~~~~~..TT',
    'TT.........,,..........TT',
    'TT.........,,..........TT',
    'TTTTTTTTTTT,,TTTTTTTTTTTT',
  ],
  doorWarps: {
    '17,4': { to: 'yard',     tx: 7, ty: 10, dir: 'up', ret: { x: 17, y: 5 }, need: 2, gate: 'need2' },
    '5,4':  { to: 'clinic_c', tx: 5, ty: 5,  dir: 'up', ret: { x: 5,  y: 5 } },
    '5,11': { to: 'store_c',  tx: 5, ty: 5,  dir: 'up', ret: { x: 5,  y: 12 } },
  },
  warps: [
    { x: 11, y: 19, to: 'r4', tx: 9,  ty: 1, dir: 'down' },
    { x: 12, y: 19, to: 'r4', tx: 10, ty: 1, dir: 'down' },
    { x: 11, y: 0,  to: 'r5', tx: 8, ty: 23, dir: 'up' },
    { x: 12, y: 0,  to: 'r5', tx: 9, ty: 23, dir: 'up' },
  ],
  shop: ['heal', 'heal2', 'cure', 'ward', 'atkup', 'defup', 'dodgeup', 'wenqi', 'hint'],
  signs: { '10,1': 'sign_huanan', '9,4': 'sg31', '9,11': 'sg17' },
  npcs: [
    { role: 'busStop',  x: 8,  y: 7,  dir: 'down' },
    { role: 'gymTip3',  x: 17, y: 7,  dir: 'up' },
    { role: 'roamHint', x: 21, y: 12, dir: 'down' },
    { role: 't_hn_a',   x: 6,  y: 14, dir: 'down' },
    { role: 't_hn_b',   x: 20, y: 18, dir: 'down', wander: 1 },
  ],
  chests: [{ x: 21, y: 17, id: 'hn1', items: { dodgeup: 1, heal2: 1 } }],
};

/* ============================================================
   ⑯ 花南街道館 yard　16×12　室內花園
   ------------------------------------------------------------
   中央一條紅毯直通館主，兩側水池與花圃、兩座涼亭。
   三盆枯萎的花全部開花後，館主攻擊 −20%（flag: flAll）。
   ============================================================ */
MAPS.yard = {
  music: 'hall', qlv: 3, chapter: 3, indoor: 1, theme: 't_flower',
  rows: [
    'wwwwwwwwwwwwwwww',
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
    { x: 7, y: 11, to: 'huanan', tx: 17, ty: 5, dir: 'down' },
    { x: 8, y: 11, to: 'huanan', tx: 17, ty: 5, dir: 'down' },
  ],
  npcs: [{ role: 'boss3', x: 7, y: 1, dir: 'down' }],
  chests: [{ x: 14, y: 10, id: 'yard1', items: { heal2: 1, cure: 1 } }],
  devices: {
    '2,2':  { group: 'fl', flag: 'fl1', cat: '修辭', label: '枯萎的花',
      text: '一盆花因為墨塵而低著頭。\n（用心感受文字，也許它會重新綻放。）',
      ok: '花瓣舒展開來，散發出淡淡的香氣！',
      allText: '三盆花都開了，花室恢復了生氣——助教的氣勢也弱了下來。' },
    '13,2': { group: 'fl', flag: 'fl2', cat: '閱讀', label: '枯萎的花',
      text: '第二盆花的葉子上積了一層黑墨。',
      ok: '黑墨散去，花開了！', allText: '三盆花都開了！' },
    '2,7':  { group: 'fl', flag: 'fl3', cat: '修辭', label: '枯萎的花',
      text: '最後一盆花只剩下花苞。',
      ok: '花苞綻放了！', allText: '三盆花都開了，花室恢復了生氣！', onAll: 'flAll' },
  },
};

/* ⑰ 保健室（古風）clinic_o　10×7 */
MAPS.clinic_o = {
  music: 'town', qlv: 2, chapter: 3, indoor: 1, theme: 't_stele',
  rows: [
    'wwwwwwwwww',
    'wb_ttt__bw',
    'w________w',
    'wk_____k_w',
    'w_p____p_w',
    'w________w',
    'wwww__wwww',
  ],
  warps: [{ x: 4, y: 6, to: '@ret' }, { x: 5, y: 6, to: '@ret' }],
  npcs: [{ role: 'healer', x: 2, y: 2, dir: 'down' }],
};

/* ============================================================
   ⑱ 古碑小徑 r5　18×25　碑石小徑（t_stele）
   南接花南街、北接碑林關。勁敵②守在半路（boss4 的前置）。
   ============================================================ */
MAPS.r5 = {
  music: 'route', qlv: 3, chapter: 4, theme: 't_stele',
  rows: [
    'TTTTTTTT,,TTTTTTTT',
    'TT......,,......TT',
    'TT......,,..O...TT',
    'TT.gggg.,,......TT',
    'TT.gggg.,,..O.O.TT',
    'TT.gggg.,,......TT',
    'TT......,,......TT',
    'TT..O.O.,,......TT',
    'TT......,,.gggg.TT',
    'TT......,,.gggg.TT',
    'TT......,,.gggg.TT',
    'TT......,,......TT',
    'TT..O.O.,,..^^..TT',
    'TT......,,..^^..TT',
    'TT......,,......TT',
    'TT.gggg.,,..O.O.TT',
    'TT.gggg.,,......TT',
    'TT.gggg.,,......TT',
    'TT......,,......TT',
    'TT......,,.gggg.TT',
    'TT......,,.gggg.TT',
    'TT...O..,,.gggg.TT',
    'TT......,,......TT',
    'TT......,,......TT',
    'TTTTTTTT,,TTTTTTTT',
  ],
  warps: [
    { x: 8, y: 24, to: 'huanan', tx: 11, ty: 1, dir: 'down' },
    { x: 9, y: 24, to: 'huanan', tx: 12, ty: 1, dir: 'down' },
    { x: 8, y: 0,  to: 'beilin', tx: 11, ty: 18, dir: 'up' },
    { x: 9, y: 0,  to: 'beilin', tx: 12, ty: 18, dir: 'up' },
  ],
  foes: { n: 8, lv: [11, 14], scale: 1, auto: 1 },
  npcs: [
    { role: 'rival2',    x: 7,  y: 9,  dir: 'right', sight: 3 },
    { role: 't_r5a',     x: 10, y: 17, dir: 'left',  sight: 3 },
    { role: 'roamHint2', x: 4,  y: 20, dir: 'down' },
  ],
  chests: [{ x: 14, y: 2, id: 'r5a', frags: { classic: 2 }, items: { heal2: 1 } }],
};

/* ============================================================
   ⑲ 碑林關 beilin　25×20　關口書院（t_stele）
   兩條橫街接到道館④(17,4)、補給站(5,4)、商店(5,11)；右邊是碑林。
   道館④要三片碎片。南接古碑小徑、北接考鐘坡。
   ============================================================ */
MAPS.beilin = {
  music: 'town', qlv: 3, chapter: 4, theme: 't_stele',
  rows: [
    'TTTTTTTTTTT,,TTTTTTTTTTTT',
    'TT........S,,..........TT',
    'TT.hhHhh...,,.GGyyyGG..TT',
    'TT.hhhhh...,,.GGGGGGG..TT',
    'TT.#WDW#.S.,,.#WWDWW#..TT',
    'TT.........,,..........TT',
    'TT.,,,,,,,,,,,,,,,,,,..TT',
    'TT.........,,..........TT',
    'TT.........,,..O.O.O...TT',
    'TT.ccCcc...,,..........TT',
    'TT.ccccc...,,..O.O.O...TT',
    'TT.#WDW#.S.,,..........TT',
    'TT.........,,..........TT',
    'TT.,,,,,,,,,,,,,,,,,,..TT',
    'TT.........,,..........TT',
    'TT....O.O..,,..........TT',
    'TT.........,,..O.O.O...TT',
    'TT....O.O..,,..........TT',
    'TT.........,,..........TT',
    'TTTTTTTTTTT,,TTTTTTTTTTTT',
  ],
  doorWarps: {
    '17,4': { to: 'hist',     tx: 6, ty: 10, dir: 'up', ret: { x: 17, y: 5 }, need: 3, gate: 'need3' },
    '5,4':  { to: 'clinic_o', tx: 4, ty: 5,  dir: 'up', ret: { x: 5,  y: 5 } },
    '5,11': { to: 'store_o',  tx: 4, ty: 5,  dir: 'up', ret: { x: 5,  y: 12 } },
  },
  warps: [
    { x: 11, y: 19, to: 'r5', tx: 8, ty: 1, dir: 'down' },
    { x: 12, y: 19, to: 'r5', tx: 9, ty: 1, dir: 'down' },
    { x: 11, y: 0,  to: 'r6', tx: 10, ty: 26, dir: 'up' },
    { x: 12, y: 0,  to: 'r6', tx: 11, ty: 26, dir: 'up' },
  ],
  shop: ['heal', 'heal2', 'cure', 'ward', 'atkup', 'defup', 'dodgeup', 'wenqi', 'hint'],
  signs: { '10,1': 'sign_beilin', '9,4': 'sg32', '9,11': 'sg21' },
  npcs: [
    { role: 'busStop',  x: 8,  y: 7,  dir: 'down' },
    { role: 'gymTip4',  x: 17, y: 7,  dir: 'up' },
    { role: 'townTip6', x: 21, y: 5,  dir: 'left', wander: 1 },
    { role: 'roamHint', x: 21, y: 12, dir: 'down' },
    { role: 't_bl_a',   x: 6,  y: 12, dir: 'down' },
    { role: 't_bl_b',   x: 16, y: 14, dir: 'down' },
  ],
  chests: [{ x: 21, y: 17, id: 'bl1', items: { heal2: 2, cure: 2 } }],
};

/* ============================================================
   ⑳ 碑林關道館 hist　14×12　書院碑林（解開才通得過型）
   下半是碑林，中間一道石碑牆把館主關在上半的檔案室裡；
   三座古文石碑全部亮起後 (5,6)～(8,6) 沉入地面才通得過。
   ============================================================ */
MAPS.hist = {
  music: 'hall', qlv: 3, chapter: 4, indoor: 1, theme: 't_stele',
  rows: [
    'wwwwwwwwwwwwww',
    'wkk___t____kkw',
    'w____________w',
    'wkkk_kkkk_kkkw',
    'w____________w',
    'w_p________p_w',
    'wwwwwMMMMwwwww',
    'w____________w',
    'wk__OO__OO__kw',
    'w____________w',
    'w____________w',
    'wwwwww__wwwwww',
  ],
  warps: [
    { x: 6, y: 11, to: 'beilin', tx: 17, ty: 5, dir: 'down' },
    { x: 7, y: 11, to: 'beilin', tx: 17, ty: 5, dir: 'down' },
  ],
  npcs: [{ role: 'boss4', x: 7, y: 1, dir: 'down' }],
  chests: [{ x: 1, y: 10, id: 'hist1', items: { heal2: 2, atkup: 1 }, frags: { classic: 2 } }],
  devices: {
    '5,6': { group: 'st', flag: 'st1', cat: '文言', label: '古文石碑',
      text: '石碑上刻著一段古文，字跡被墨塵遮住了一半……\n（讀懂它，石碑就會亮起。）',
      ok: '石碑亮起了柔和的光！',
      allText: '三座石碑同時亮起，擋路的石碑緩緩沉入地面，通往檔案室的路開了！',
      open: [[5, 6], [6, 6], [7, 6], [8, 6]] },
    '6,6': { group: 'st', flag: 'st2', cat: '文言', label: '古文石碑',
      text: '第二座石碑記載著校史與古語。', ok: '石碑亮起來了！',
      allText: '三座石碑同時亮起，路開了！', open: [[5, 6], [6, 6], [7, 6], [8, 6]] },
    '7,6': { group: 'st', flag: 'st3', cat: '常識', label: '古文石碑',
      text: '最後一座石碑上是一段國學常識。', ok: '石碑亮起來了！',
      allText: '三座石碑同時亮起，路開了！',
      open: [[5, 6], [6, 6], [7, 6], [8, 6]], onAll: 'stAll' },
  },
};

/* ㉑ 商店（古風）store_o　10×7 */
MAPS.store_o = {
  music: 'town', qlv: 3, chapter: 4, indoor: 1, theme: 't_stele',
  rows: [
    'wwwwwwwwww',
    'wkk_kk_kkw',
    'w________w',
    'w__ttt___w',
    'w________w',
    'wp__rr__pw',
    'wwww__wwww',
  ],
  warps: [{ x: 4, y: 6, to: '@ret' }, { x: 5, y: 6, to: '@ret' }],
  npcs: [{ role: 'clerk', x: 4, y: 2, dir: 'down' }],
};

/* ============================================================
   ㉒ 考鐘坡 r6　22×28　上坡（t_spring）
   南接碑林關、北接鐘塔台，中段往西一條岔路通到墨泉鄉。
   往北被風擋住（gates: sideB）：要先把三張准考證碎紙找齊
   （三個機關做在石碑上，答對才抽得出來）。
   ============================================================ */
MAPS.r6 = {
  music: 'route', qlv: 3, chapter: 5, theme: 't_spring',
  rows: [
    'TTTTTTTTTT,,TTTTTTTTTT',
    'TT........ii........TT',
    'TT........ii........TT',
    'TT..gggg..ii........TT',
    'TT..gggg..ii........TT',
    'TT..gggg..ii........TT',
    'TT........ii........TT',
    'TT.....O..ii.O......TT',
    'TT........ii.ggggg..TT',
    'TT........ii.ggggg..TT',
    'TT........ii.ggggg..TT',
    'TT........ii........TT',
    'TT....O...ii........TT',
    'TT........ii........TT',
    'TT..gggg..ii........TT',
    'TT..gggg..ii........TT',
    'TT..gggg..ii........TT',
    'TT........ii..^^^...TT',
    'TT........ii..^^^...TT',
    'TT........ii........TT',
    ',,,,,,,,,,,i........TT',
    'TT........ii........TT',
    'TT........ii.ggggg..TT',
    'TT........ii.ggggg..TT',
    'TT...YY...ii.ggggg..TT',
    'TT...YY...ii........TT',
    'TT........ii........TT',
    'TTTTTTTTTT,,TTTTTTTTTT',
  ],
  gates: { '10,5': 'sideB', '11,5': 'sideB' },
  warps: [
    { x: 10, y: 27, to: 'beilin',  tx: 11, ty: 1,  dir: 'down' },
    { x: 11, y: 27, to: 'beilin',  tx: 12, ty: 1,  dir: 'down' },
    { x: 10, y: 0,  to: 'zhongta', tx: 13, ty: 18, dir: 'up' },
    { x: 11, y: 0,  to: 'zhongta', tx: 14, ty: 18, dir: 'up' },
    { x: 0,  y: 20, to: 'moquan',  tx: 20, ty: 9,  dir: 'left' },
  ],
  foes: { n: 9, lv: [14, 18], scale: 1, auto: 1 },
  npcs: [
    { role: 'sideBGiver', x: 12, y: 6,  dir: 'down' },
    { role: 'roamHint2',  x: 5,  y: 19, dir: 'down' },
  ],
  chests: [{ x: 18, y: 2, id: 'r6a', items: { ward: 2, heal2: 2 } }],
  devices: {
    '13,7': { group: 'paper', flag: 'pa1', cat: '文言', label: '准考證碎紙',
      text: '一張被風吹住的碎紙卡在石碑縫裡。\n（讀懂上面的字，才能把它抽出來。）',
      ok: '碎紙拿到了！', allText: '三張碎紙都找齊了！可以還給學弟妹了。' },
    '7,7':  { group: 'paper', flag: 'pa2', cat: '常識', label: '准考證碎紙',
      text: '第二張碎紙泡在泉水邊。', ok: '碎紙拿到了！', allText: '三張碎紙都找齊了！' },
    '6,12': { group: 'paper', flag: 'pa3', cat: '成語', label: '准考證碎紙',
      text: '最後一張碎紙黏在草叢裡。', ok: '碎紙拿到了！',
      allText: '三張碎紙都找齊了！', onAll: 'sideB' },
  },
};

/* ============================================================
   ㉓ 墨泉鄉 moquan　22×18　溫泉聚落（t_spring）
   只有東邊一個出入口的死路支線：補給站、商店，
   以及硯海墨池的入口（要集齊三件守護神器、二週目才開）。
   ============================================================ */
MAPS.moquan = {
  music: 'town', qlv: 3, chapter: 5, theme: 't_spring',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TT...................T',
    'TT........S..........T',
    'TT.......ZZZZ........T',
    'TT.hhHhh.ZZZZ..ccCcc.T',
    'TT.hhhhh.ZZZZ..ccccc.T',
    'TT.#WDW#.......#WDW#.T',
    'TT...................T',
    'TT......S............T',
    'TT.,,,,,,,,,,,,,,,,,,,',
    'TT...................T',
    'TT...................T',
    'TT.ZZZ...RRR....ZZZ..T',
    'TT.ZZZ...#D#....ZZZ..T',
    'TT...................T',
    'TT...................T',
    'TT...................T',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  doorWarps: {
    '5,6':   { to: 'clinic_o', tx: 4, ty: 5,  dir: 'up', ret: { x: 5,  y: 7 } },
    '17,6':  { to: 'store_o',  tx: 4, ty: 5,  dir: 'up', ret: { x: 17, y: 7 } },
    '10,13': { to: 'inkpool',  tx: 7, ty: 10, dir: 'up', ret: { x: 10, y: 14 }, need: 'stone' },
  },
  warps: [{ x: 21, y: 9, to: 'r6', tx: 1, ty: 20, dir: 'right' }],
  shop: ['heal', 'heal2', 'cure', 'ward', 'atkup', 'defup', 'dodgeup', 'wenqi', 'hint'],
  signs: { '10,2': 'sign_moquan', '8,8': 'sg23' },
  npcs: [
    { role: 'busStop',   x: 7,  y: 10, dir: 'down' },
    { role: 'springTip', x: 14, y: 11, dir: 'left' },
    { role: 'ngHint',    x: 12, y: 8,  dir: 'down' },
    { role: 'roamHint',  x: 6,  y: 14, dir: 'down' },
    { role: 'tipInk',    x: 12, y: 13, dir: 'left' },
    { role: 't_mq_a',    x: 8,  y: 15, dir: 'down' },
  ],
  chests: [{ x: 19, y: 15, id: 'mq1', items: { heal2: 2, ward: 1 } }],
};

/* ㉔ 硯海墨池 inkpool　16×12　地底墨池（隱藏關）
   二週目集齊三件守護神器後，硯海龍君會從池底升起（spiritRise）。 */
MAPS.inkpool = {
  music: 'boss', qlv: 3, chapter: 5, indoor: 1, theme: 't_spring',
  rows: [
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
    'wwwwwww__wwwwwww',
  ],
  warps: [
    { x: 7, y: 11, to: 'moquan', tx: 10, ty: 14, dir: 'down' },
    { x: 8, y: 11, to: 'moquan', tx: 10, ty: 14, dir: 'down' },
  ],
  npcs: [],
  chests: [{ x: 1, y: 1, id: 'ink1', items: { heal2: 3, ward: 2, cure: 2 } }],
};

/* ============================================================
   ㉕ 鐘塔台 zhongta　28×20　會考會場（t_tower）
   正中央是大鐘塔，塔下就是道館⑤（要四片碎片）。
   兩側紅毯廣場、補給站與商店。南接考鐘坡。
   ============================================================ */
MAPS.zhongta = {
  music: 'town', qlv: 3, chapter: 5, theme: 't_tower',
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT..........#####.........TT',
    'TT..........##E##.........TT',
    'TT.hhHhh...GGyyyGG........TT',
    'TT.hhhhh...GGGGGGG........TT',
    'TT.#WDW#...#WWDWW#........TT',
    'TT...........,,...........TT',
    'TT.,,,,,,,,,,,,,,,,,,,,,..TT',
    'TT..........S,,.S.........TT',
    'TT...........,,...........TT',
    'TT...........,,....ccCcc..TT',
    'TT...........,,....ccccc..TT',
    'TT...........,,....#WDW#..TT',
    'TT.,,,,,,,,,,,,,,,,,,,,,..TT',
    'TT..........S,,...........TT',
    'TT..rrrrr....,,...rrrrr...TT',
    'TT..rrrrr....,,...rrrrr...TT',
    'TT..rrrrr....,,...rrrrr...TT',
    'TT...........,,...........TT',
    'TTTTTTTTTTTTT,,TTTTTTTTTTTTT',
  ],
  doorWarps: {
    '14,5': { to: 'aud',      tx: 7, ty: 11, dir: 'up', ret: { x: 14, y: 6 }, need: 4, gate: 'need4' },
    '5,5':  { to: 'clinic_c', tx: 5, ty: 5,  dir: 'up', ret: { x: 5,  y: 6 } },
    '21,12':{ to: 'store_c',  tx: 5, ty: 5,  dir: 'up', ret: { x: 21, y: 13 } },
  },
  warps: [
    { x: 13, y: 19, to: 'r6', tx: 10, ty: 1, dir: 'down' },
    { x: 14, y: 19, to: 'r6', tx: 11, ty: 1, dir: 'down' },
  ],
  shop: ['heal', 'heal2', 'cure', 'ward', 'atkup', 'defup', 'dodgeup', 'wenqi', 'hint'],
  signs: { '12,8': 'sign_zhongta', '16,8': 'sign_zhongta2', '12,14': 'sg25' },
  npcs: [
    { role: 'busStop',  x: 9,  y: 9,  dir: 'down' },
    { role: 'gymTip5',  x: 17, y: 6,  dir: 'left' },   // 不能站 (15,6)：那是道館門 (15,5) 唯一的門前站位
    { role: 'roamHint', x: 20, y: 8,  dir: 'down' },
    { role: 't_zt_a',   x: 6,  y: 14, dir: 'down' },
    { role: 't_zt_b',   x: 20, y: 16, dir: 'down', wander: 1 },
  ],
  chests: [{ x: 23, y: 17, id: 'zt1', items: { heal2: 3, cure: 2 } }],
};

/* ============================================================
   ㉖ 鐘塔台道館 aud　16×13　大禮堂（最終戰）
   中央一條紅毯直通講台，三位天王視線很長（14 格）會主動攔人；
   三位都打倒之後，大魔王才會從天而降（cut: 'bossDrop'）。
   三座准考證感應台答對可讓下場戰鬥文氣 +1。
   ============================================================ */
MAPS.aud = {
  music: 'hall', qlv: 3, chapter: 5, indoor: 1, theme: 't_tower',
  rows: [
    'wwwwwBBBBBBwwwww',
    'w______________w',
    'wtttttt__ttttttw',
    'w______rr______w',
    'w_tt_V_rr_t_tt_w',
    'w______rr______w',
    'w_tt_t_rr_t_tt_w',
    'w______rr______w',
    'w_tt_t_rr_V_tt_w',
    'w______rr______w',
    'wV_t_t_rr_t_tt_w',
    'w______rr______w',
    'wwwwwww__wwwwwww',
  ],
  warps: [
    { x: 7, y: 12, to: 'zhongta', tx: 14, ty: 6, dir: 'down' },
    { x: 8, y: 12, to: 'zhongta', tx: 14, ty: 6, dir: 'down' },
  ],
  npcs: [
    { role: 'e1',      x: 1,  y: 9,  dir: 'right', sight: 14 },
    { role: 'e2',      x: 14, y: 7,  dir: 'left',  sight: 14 },
    { role: 'e3',      x: 1,  y: 5,  dir: 'right', sight: 14 },
    { role: 'moGuard', x: 4,  y: 11, dir: 'right' },
    /* 三位天王都倒下之後，大魔王才登場（bossEntrance 會播從天而降的動畫） */
    { role: 'boss5',   x: 7,  y: 1,  dir: 'down', cut: 'bossDrop',
      after: ['aud:e1', 'aud:e2', 'aud:e3'] },
  ],
  chests: [
    { x: 1,  y: 1, id: 'aud1', items: { heal2: 2, cure: 2, dodgeup: 1 } },
    { x: 14, y: 1, id: 'aud2', items: { atkup: 2, defup: 2 } },
  ],
  devices: {
    '5,4':  { group: 'ad', flag: 'ad1', cat: '閱讀', label: '准考證感應台',
      text: '講台前的感應台亮著微光，上面寫著：「答對即可凝聚文氣。」',
      ok: '感應台亮起，一股文氣湧入你的身體！（下場戰鬥文氣 +1）' },
    '10,8': { group: 'ad', flag: 'ad2', cat: '成語', label: '准考證感應台',
      text: '第二座感應台等著你。', ok: '文氣再度凝聚！（下場戰鬥文氣 +1）' },
    '1,10': { group: 'ad', flag: 'ad3', cat: '文言', label: '准考證感應台',
      text: '最後一座感應台散發著沉穩的光。', ok: '文氣滿溢！（下場戰鬥文氣 +1）',
      allText: '三座感應台全部亮起，整座禮堂被文氣照亮了！' },
  },
};

/* 全部地圖一次掛進引擎（新地圖請加在這一行之前） */
Object.assign(LAYOUTS, MAPS);
