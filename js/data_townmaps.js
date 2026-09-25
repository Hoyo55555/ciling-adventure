'use strict';
/* ============ 美術地圖：九座城鎮用手繪草圖當背景，碰撞用 16×16 格子 ============
   ART_RECT：草圖裡「畫」的範圍（扣掉捲軸邊框）
   ART_SCALE：草圖縮放，讓一棟房子約 4×3 格、主角約房子的 1/3 高
   TOWN_GRID：預先算好的碰撞格（'_' 可走、'w' 牆）
   TOWN_GATE：門口與出城的感應區（格子座標）                              */

const ART_SCALE = 0.33;
const ART_RECT = {
  chendu:  [0, 0, 2000, 1090],
  zhuyin:  [95, 85, 1810, 710],
  chaoshu: [40, 75, 1920, 935],
  dianji:  [30, 20, 1940, 1050],
  tingyu:  [95, 80, 1810, 905],
  huanan:  [95, 105, 1810, 875],
  beilin:  [95, 100, 1810, 880],
  moquan:  [95, 115, 1810, 875],
  zhongta: [0, 0, 2000, 1091],
};

const TOWN_GRID = {
"chendu":["wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwww_wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwww_wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwww_wwwwwww_______wwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwww________wwwwwwwwwwwwwww","wwwwwwwwwwwwwwwww_____________w__wwwwwwww","wwwwwwwwwwww_ww____wwwwww____ww__w___wwww","wwwwwwwwwwww_____wwwwwwwwww_______wwww_w_","wwwwwwwwwwww_____wwwwwwwwwww________w____","wwwwwwwww_______wwwwwwww_________________","wwwwwwwww_______wwwwwwww________________w","wwwwwwwwwwww____wwwwwwwwwwww___wwwwwwwwww","wwwwwwwwwww_ww___www___wwwww___wwwwwwwwww","wwwwwwwwww_______www__wwwwww___w_wwwwwwww","wwwwwwwwww_____________________wwwwwwwwww","wwwwwwwwww__ww________________wwww__wwwww","wwwwwwwwwwwwww____wwww____ww__________www","wwwwwwwwwwwwwww___wwwww__www__________www","wwwwwwwwwwwwwww______ww_____wwwwwwwwwwwww"],
"zhuyin":["wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","www_______wwwwwwwwwwwwwwwwwwww_____ww","wwww______w___wwwwwwwwww___________ww","wwwwwww___w___wwwwwwwwww___________ww","www__________________________w_____ww","www__________________________www__www","www__________________________www__www","www__________________________www__www","www__________________________ww___www","www___________wwwww__www_____ww___www","www___________w___wwww_______www__www","wwwwwwwwwww___wwwwwwwwww_____wwwwwwww"],
"chaoshu":["wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwww_ww____wwwwwwwwwwwwww","wwwwwwwwwwwwwwwwww_ww____wwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwww____wwwwwwwwwwwwww","wwwwwwwwwwwwwwwwww______________wwwwwww","wwwwwwwwwwwwwwwwww______________wwwwwww","wwwwwwwwwwwwwwwwww______________wwwwwww","wwwwwwwwwwwwwwwww_______________wwwwwww","wwwwwwwwwwwwwwwwww______________wwwwwww","wwwwwwwwwwwwwwwww_______________wwwwwww","wwwwwwwwwwww____________________wwwwwww","wwwwwwwwwww_____________________wwwwwww","wwwwwwwwwww_____________________wwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww"],
"dianji":["wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwww_wwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwww_wwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwww_wwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwww_wwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwww__________________________","wwwwwwwwwwwwww__wwwwwww___wwwwwww_______","wwwwwwwwwwwwww__wwwwwww___wwwwwww__wwwww","wwwwwwwwwwwwww__wwwwwww___wwwwwww__wwwww","wwwwwwwwwwwwww__wwwwwww___wwwwwww__wwwww","wwwwwwwwwwwwww__wwwwwww___wwwwwww__wwwww","wwwwwwwwwwwwww__wwwwwww___wwwwwww__wwwww","wwwwwwwwwwwwww_____________________wwwww","wwwwwwwwwwwwww__________________________","wwwwwwwwwwwwww__wwwwwwww____wwwwwwwwww__","wwwwwwwwwwwwww__wwwwwwww____wwwwwwwwww__","wwwwwwwwwwwwww__wwwwwwww____wwwwwwwwww__","wwwwwwwwwwwwww__wwwwwwww____wwwwwwwwww__"],
"tingyu":["wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwww_wwwwww_____wwwww","wwwwwwwwwwwwwwwwwwww_wwwwww_____wwwww","wwwwwwwwwwwwwwwwwwwwwwwwwww____wwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwww_____wwwww","wwwwwwwwwwww___________________wwwwww","wwwwwwwwwwwww_______________wwwwwwwww","wwwww_wwwwwww_____________wwwwwwwwwww","wwww__wwwwwww_____________wwwwwwwwwww","wwwwwwwwwwwww_____________wwwwwwwwwww","wwwww_wwwwwww_____________wwwwwwwwwww","wwwww_wwwwwww_____________wwwwwwwwwww","wwwwwwwwwwwww_____________wwwwwwwwwww","wwwwwwwwwwwwwww_________________wwwww","wwww_wwwwwwwwwww__________ww____wwwww","wwwwwwww________________________wwwww","wwwww___________________________wwwww"],
"huanan":["wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","www______wwwwwwwwwwwwwwwwwwww___w_www","www_www_wwwwwwwww_____wwwwwww_ww__www","www_wwwwww_wwwwww_____wwwwwwww_ww_www","wwww_________wwww_____wwww________www","www__________wwww_____wwww________www","wwww_________wwww_____wwww________www","wwww_________wwww_____wwww________www","wwww_________wwww_____wwww________www","wwww_________w_ww_____wwww________www","www_______________________________www","www_______________________________www","www_______________________________www","www_______________________________www","wwww______________________________www","www__wwww__w_______________wwwwww_www"],
"beilin":["wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","www__________ww_wwwwwwwwwwwwwww___www","www______www_wwwww__wwwwwwwwwww___www","www_____wwww_wwww_w__w___wwwwww___www","wwww___wwwwwwwwwwwwwwww__wwwwwww__www","www_w__ww_wwwwwwwwwwwww_wwwwwwwww_www","wwwww_ww__wwwwww_wwww____wwwwwww__www","wwwww__w__w_wwww__ww______________www","wwwww________wwwwwww______________www","www________________________wwwwww_www","www_________ww___ww________wwwwww_www","www_________ww___ww___ww___wwwwww_www","www_________ww___ww___ww___wwwwww_www","www_________ww___ww___ww__________www","www___www_________________________www","www___www_________________________www","www___www_________________________www"],
"moquan":["wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwwwwww__________________wwwwwwwww","wwwwwwwwww__________________wwwwwwwww","wwwwwwwwww___wwwwwww________wwwwwwwww","wwwwwwwwww___wwwwwww________wwwwwwwww","wwwww_wwww___wwwwwww______wwwwwwwwwww","wwwww_wwww___wwwwwww______wwwwwwwwwww","wwwww_wwww________________wwwwwwwwwww","wwwww_wwwwwwwwww____wwwwwwwwwwwwwwwww","wwwww_____wwwwww____wwwwww____wwwwwww","wwwww_____wwwwww____wwwwww____wwwwwww","wwwww_________________________wwwwwww","wwwww_________________________wwwwwww"],
"zhongta":["www____wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","www____wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","www____wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","www______wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwww____wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwww____wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwww________wwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwww________wwwwwwwwwwwwwwwwwwwwwwwwwwww","wwwwwww______wwwwwwwwwwwwwwwwwwwwwwwwwwww","w__________________wwww__________________","w_wwwwwwwwww_______wwwwwwwwwwwwwwwwwwwww_","w_wwwwwwwwww_______wwwwwwwwwwwwwwwwwwwww_","w_wwwwwwwwww_______wwwwwwwwwwwwwwwwwwwww_","w__________________wwww__________________","w____wwwwwww_______wwww__________________","w____wwwwwww_______wwww_________wwwwww___","w____wwwwwww____________________wwwwww___","w____wwwwwww____________________wwwwww___","w_______________________________wwwwww___","w_____wwwwwwwwwwww______________wwwwww___","w_____wwwwwwwwwwww_______________________","w_____wwwwwwwwwwww_______________________"],
};

/* 門口與出城的感應區：r = [欄, 列, 寬, 高] */
const TOWN_GATE = {
  chendu: [
    { to: 'home', r: [10, 15, 2, 1] },
    { to: 'c8', r: [28, 7, 2, 1] },
    { to: 'clinic_h', r: [33, 18, 2, 1] },
    { to: 'r1',       r: [24, 21, 4, 1], exit: 1 },
  ],
  zhuyin: [
    { to: 'c1a', r: [24, 3, 2, 1] },
    { to: 'r1',       r: [11, 13, 3, 1], exit: 1 },
    { to: 'r2',       r: [24, 13, 5, 1], exit: 1 },
  ],
  chaoshu: [
    { to: 'forge', r: [27, 7, 2, 1] },
    { to: 'clinic_h', r: [15, 13, 2, 1] },
    { to: 'store_h', r: [26, 14, 2, 1] },
    { to: 'r2',       r: [21, 5, 3, 1], exit: 1 },
    { to: 'r3',       r: [21, 16, 3, 1], exit: 1 },
  ],
  dianji: [
    { to: 'lib', r: [29, 9, 2, 1], need: 1 },
    { to: 'clinic_c', r: [18, 14, 2, 1] },
    { to: 'store_c', r: [34, 15, 2, 1] },
    { to: 'r3',       r: [36, 8, 1, 3], exit: 1 },
    { to: 'r4',       r: [22, 20, 4, 1], exit: 1 },
  ],
  tingyu: [
    { to: 'clinic_o', r: [9, 15, 2, 1] },
    { to: 'r4',       r: [20, 17, 4, 1], exit: 1 },
  ],
  huanan: [
    { to: 'yard', r: [18, 4, 1, 1], need: 2 },
    { to: 'clinic_c', r: [5, 11, 1, 1] },
    { to: 'store_c', r: [28, 13, 1, 1] },
    { to: 'r4',       r: [3, 12, 1, 3], exit: 1 },
    { to: 'r5',       r: [17, 17, 4, 1], exit: 1 },
  ],
  beilin: [
    { to: 'hist', r: [15, 12, 2, 1], need: 3 },
    { to: 'clinic_o', r: [27, 7, 2, 1] },
    { to: 'store_o', r: [30, 10, 2, 1] },
    { to: 'r5',       r: [33, 8, 1, 3], exit: 1 },
    { to: 'r6',       r: [8, 17, 4, 1], exit: 1 },
  ],
  moquan: [
    { to: 'clinic_o', r: [8, 13, 2, 1] },
    { to: 'store_o', r: [27, 13, 2, 1] },
    { to: 'inkpool', r: [18, 11, 2, 1], need: 'stone' },
    { to: 'r6',       r: [22, 17, 4, 1], exit: 1 },
  ],
  zhongta: [
    { to: 'clinic_c', r: [7, 17, 2, 1] },
    { to: 'store_c', r: [34, 19, 2, 1] },
    { to: 'aud', r: [19, 15, 2, 1], need: 4 },
    { to: 'r6',       r: [3, 0, 5, 1], exit: 1 },
  ],
};

/* 各城鎮的居民（會送禮物／答題送道具／閒聊） */
const TOWN_NPCS = {
  chendu:  ['t_cd_a', 't_cd_b'],
  zhuyin:  ['t_zy_a', 't_zy_b'],
  chaoshu: ['t_cs_a', 't_cs_b'],
  dianji:  ['t_dj_a', 't_dj_b'],
  tingyu:  ['t_ty_a'],
  huanan:  ['t_hn_a', 't_hn_b'],
  beilin:  ['t_bl_a', 't_bl_b'],
  moquan:  ['t_mq_a', 't_mq_b'],
  zhongta: ['t_zt_a', 't_zt_b'],
};

/* ===== 道館室內：同樣用手繪草圖當背景 ===== */
const GYM_ART = {
  c1a:  { rect: [78, 118, 848, 352],  scale: 0.34 },
  lib:  { rect: [968, 118, 762, 352], scale: 0.38 },
  yard: { rect: [78, 560, 590, 350],  scale: 0.49 },
  hist: { rect: [706, 560, 462, 350], scale: 0.62 },
  aud:  { rect: [1206, 560, 528, 350], scale: 0.55 },
};
const GYM_GRID = {
"c1a":["www______w_______w","w__w__w_www__w____","w_ww__w__w___w_ww_","w______________www","w_________________","w_________________","w_________________"],
"lib":["_wwwwwwwwwwwwwwwww","_wwwwwwwwwwwwwwwww","_wwwwwwwwwwwwwwwww","_wwww_w_wwwwww__ww","________________w_","________________w_","__________________","_w________________"],
"yard":["wwww__wwwwwwwww__w","www______www______","w________www______","w___wwww_ww__www_w","wwwwwwww_ww__wwwww","www__________wwwww","www__________ww_ww","www__________wwwww","www__________ww_ww","www__________ww_ww"],
"hist":["wwwww_wwwwwwwwwww","wwwww_wwwwwwwwwww","wwwww_wwwwwwwwwww","wwwww___wwwwwwwww","ww_www________w__","ww_www_www____www","ww_______________","ww_______________","ww_______________","ww_______________","ww_______________","ww_________ww____","www_w__www__w___w"],
"aud":["www_wwwwwwwwwwwwww","www_wwwwwwwwwwwwww","www_wwwwwwwwwwwwww","www_wwwwwwwwwwwwww","ww__wwwwwwwwwww__w","ww__wwwwwwwwwwwwww","_w____________w___","_w____________w___","__w_____________ww","_ww_____________ww","_ww_____________ww","www__www_www____ww"],
};

/* ---------------------------------------------------------------
   TOWN_HIDE：草圖上畫的路人（格子座標 [col, row, 寬, 高]）
   這些人不是遊戲裡的 NPC，走過去也不能對話，所以開圖時用附近的地面蓋掉。
   一個草圖路人大約 1 格寬、3 格高（第一列是頭）。
   蓋的做法見 artmaps.js 的 coverAll()：取三塊相近的乾淨地面取中位數，
   再往邊緣做漸層，避免直接複製一塊造成重複的物件。
   --------------------------------------------------------------- */
const TOWN_HIDE = {
  /* 晨讀村 */
  chendu: [[16, 7, 1, 3], [18, 18, 1, 3], [34, 7, 1, 3], [28, 13, 1, 3], [25, 19, 1, 3]],
  /* 注音坡 */
  zhuyin: [[10, 7, 2, 2], [9, 13, 1, 1], [23, 3, 1, 3], [23, 7, 1, 3], [26, 7, 1, 3], [23, 9, 1, 1],
    [26, 9, 1, 1], [30, 8, 1, 3], [19, 10, 1, 3]],
  /* 抄書鎮 */
  chaoshu: [[15, 11, 1, 3], [18, 11, 1, 3], [11, 14, 1, 3], [20, 7, 1, 3], [21, 11, 1, 3], [21, 13, 1, 3],
    [22, 13, 1, 3], [25, 13, 1, 3], [25, 8, 1, 1]],
  /* 典籍港 */
  dianji: [[10, 7, 1, 3], [16, 7, 1, 3], [13, 10, 1, 3], [16, 10, 1, 3], [12, 14, 1, 3], [16, 14, 1, 3],
    [17, 14, 1, 3], [33, 9, 1, 3], [32, 11, 2, 2], [20, 15, 1, 3], [30, 18, 1, 3]],
  /* 聽雨亭 */
  tingyu: [[3, 7, 1, 3], [16, 5, 1, 3], [9, 14, 1, 3], [29, 14, 1, 3]],
  /* 花南街 */
  huanan: [[8, 6, 1, 3], [7, 7, 1, 3], [9, 8, 1, 3], [17, 6, 1, 3], [18, 6, 1, 3], [17, 11, 1, 3],
    [8, 16, 1, 3], [19, 6, 1, 3], [22, 7, 1, 3], [23, 7, 1, 3], [27, 6, 1, 3], [28, 7, 1, 3],
    [30, 10, 1, 3], [31, 10, 1, 3], [32, 10, 1, 3], [22, 13, 1, 3], [26, 13, 1, 3], [33, 14, 1, 3],
    [34, 14, 1, 3]],
  /* 碑林關 */
  beilin: [[13, 7, 1, 3], [13, 12, 1, 3], [12, 13, 1, 3], [17, 13, 1, 3], [21, 3, 1, 3], [22, 7, 1, 3],
    [24, 6, 1, 3], [29, 6, 1, 3], [20, 11, 1, 3], [27, 11, 1, 3]],
  /* 墨泉鄉 */
  moquan: [[12, 7, 1, 3], [14, 7, 1, 3], [10, 12, 1, 3], [22, 8, 1, 3], [23, 9, 1, 3], [19, 10, 1, 3],
    [23, 14, 1, 3]],
  /* 鐘塔台 */
  zhongta: [[18, 15, 1, 3], [15, 18, 1, 3], [30, 14, 1, 3]],
};
