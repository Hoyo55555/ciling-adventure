'use strict';
/* ============ 像素繪圖：詞靈、人物、地圖圖塊全部以程式生成，不需外部圖檔 ============ */
const GFX = (() => {
  const OUT = '#181820';
  const NOSHADE = new Set([OUT, '#ffffff']);
  const cache = new Map();
  /* ============================================================
     外部圖磚（skin）：Kenney／OGA 的 CC0 素材（assets/kenney/，來源見 README）
     ------------------------------------------------------------
     某個主題的某個字元有登錄 skin，就畫素材圖；沒有的照舊用程式畫。
     under：先在底下鋪哪一種磚（物件圖是去背的）—— '.' 地面、',' 路面、'_' 室內地板、'base' 依室內外自動。
     pick：依 fr（座標雜訊 0–3）選第幾張，讓大片草地不要每格一樣。
     圖還沒載入完之前先畫原本的（不快取），全部載入後清快取，下一格畫面就換上。
     ============================================================ */
  const ASSET = ((typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || '').replace(/js\/gfx\.js.*$/, '') + 'assets/kenney/';
  const IMG = {}, img = f => IMG[f] || (IMG[f] = Object.assign(new Image(), { src: ASSET + f }));
  const sheet = (f, n, cols, step) => ({ im: img(f), sx: (n % cols) * step, sy: Math.floor(n / cols) * step });
  const one = f => ({ im: img(f), sx: 0, sy: 0 });
  const IND = n => sheet('indoor_sheet.png', n, 27, 17), RPG = n => sheet('rpg_sheet.png', n, 57, 17);
  /* 3×3 一組的邊界拼塊（左上、上、右上、左、中、右、左下、下、右下），用鄰格遮罩選 */
  const SET9 = arr => arr.map(RPG);
  const CITY = n => sheet('city_sheet.png', n, 37, 16);
  /* RPG Urban Pack（建築外牆、門窗、屋頂）；MC＝Modern City 用（欄, 列）取 */
  const URB = (c, r) => sheet('urban_sheet.png', r * 27 + c, 27, 16), MC = (c, r) => CITY(r * 37 + c);
  const HOME = ['t_home', 't_dawn'], SCHOOL_IN = ['t_campus', 't_oldwing'];
  const GREEN = ['t_campus', 't_dawn', 'school', 't_slope', 't_port', 't_rain', 't_flower', 't_stele', 't_spring', 't_tower', 't_oldwing'];
  const SKINS = [
    /* ---- 室外自然：Kenney Roguelike / RPG Pack（沒有黑外框、比較柔和）---- */
    { themes: GREEN, code: '.', pick: [RPG(62), RPG(62), RPG(5), RPG(62)] },
    /* 樹：連在一起的用松樹（像官方範例那樣排成一片），單獨一棵用圓樹 */
    /* 樹：素材是兩格高的。pick：0 松樹上半、1 松樹下半、2 圓樹上半、3 圓樹下半、4 單格小松、5 單格圓樹 */
    { themes: GREEN, code: 'T', custom: 'trees', pick: [RPG(586), RPG(643), RPG(583), RPG(640), RPG(529), RPG(526)] },
    /* 水池：3×3 岸邊拼塊；fr 的第 2–5 位是鄰格遮罩 */
    { themes: '*', code: '~', custom: 'set9', shift: 2, pick: SET9([2, 3, 4, 59, 60, 61, 116, 117, 118]) },
    /* 校園的石板路：3×3 拼塊 */
    { themes: ['t_campus', 't_oldwing', 't_slope'], code: ',', custom: 'set9', shift: 2, under: '.', pick: SET9([862, 863, 864, 919, 920, 921, 976, 977, 978]) },
    /* 草叢：RPG Pack 的配色自己畫（這套沒有現成的高草） */
    { themes: '*', code: 'g', custom: 'kgrass', pick: [{ im: { complete: true, naturalWidth: 1 } }] },
    { themes: GREEN, code: 'F', under: '.', pick: [RPG(542), RPG(541), RPG(542), RPG(541)] },       // 花圃
    /* ---- 街道：Kenney Roguelike Modern City（路面）＋ RPG Urban（街道擺設）---- */
    { themes: ['t_street'], code: '.', pick: [CITY(703), CITY(704), CITY(705), CITY(703)] },      // 人行道石板
    { themes: ['t_street'], code: ',', pick: [CITY(714)] },
    /* 柵欄：Urban Pack 的鐵網圍籬，左右自動接（fr＝鄰格遮罩） */
    { themes: '*', code: '=', custom: 'row', under: 'base', pick: [URB(4, 13), URB(5, 13), URB(6, 13), URB(5, 13)] },
    /* 教室門（走廊牆上）：RPG Pack 有小窗的木門 */
    { themes: SCHOOL_IN, code: 'D', indoor: 1, under: 'w', pick: [RPG(210)] },
    /* 街道兩側的邊界：畫成隔壁大樓的屋頂（以前是米色條紋牆，看起來跟地圖外一樣） */
    { themes: ['t_street'], code: '#', custom: 'set9', shift: 0, pick: [URB(8, 3), URB(9, 3), URB(10, 3), URB(8, 4), URB(9, 4), URB(10, 4), URB(8, 5), URB(9, 5), URB(10, 5)] },                                     // 柏油路
    { themes: ['t_street'], code: ';', pick: [CITY(716)] },                                     // 雙黃線
    { themes: ['t_street'], code: '0', pick: [CITY(826)] },                                     // 斑馬線
    /* ---- 室內：Kenney Roguelike / RPG Pack（跟室外同一包，風格才一致）---- */
    { themes: HOME, code: '_', indoor: 1, pick: [RPG(233), RPG(233), RPG(234), RPG(233)] },     // 家裡：木地板
    { themes: SCHOOL_IN, code: '_', indoor: 1, pick: [RPG(121), RPG(121), RPG(178), RPG(121)] },// 學校：米色地磚
    /* 主題教室各自的地板（RPG Pack 第 25 列起的大塊地板：木、灰、米、綠、橘、藍綠） */
    { themes: ['t_forge'], code: '_', indoor: 1, pick: [RPG(1486)] },     // 工藝教室：灰石板
    { themes: ['t_shop'], code: '_', indoor: 1, pick: [RPG(1498)] },      // 福利社／商店：藍綠磁磚
    { themes: ['t_library'], code: '_', indoor: 1, pick: [RPG(1483)] },   // 圖書館：棕木地板
    { themes: ['t_museum'], code: '_', indoor: 1, pick: [RPG(1495)] },    // 校史室：橘褐石磚
    { themes: ['t_stage'], code: '_', indoor: 1, pick: [RPG(1495)] },     // 禮堂：橘褐木地板
    { themes: ['t_art'], code: '_', indoor: 1, pick: [RPG(1492)] },       // 文藝教室（花室）：綠色地磚
    { themes: '*', code: 'w', indoor: 1, custom: 'wall', pick: [RPG(873), RPG(868)] },          // 室內牆：下面是地板的那排用有踢腳板的
    { themes: SCHOOL_IN, code: 'W', indoor: 1, pick: [RPG(215)] },                              // 窗
    { themes: '*', code: 'b', under: '_', pick: [RPG(129)] },                                   // 床
    { themes: HOME, code: ')', under: '_', pick: [RPG(311)] },                                  // 衣櫃
    { themes: HOME, code: 't', under: '_', pick: [RPG(28), RPG(29), RPG(28), RPG(29)] },        // 廚房流理臺／櫃子
    { themes: '*', code: 'q', indoor: 1, custom: 'row', under: '_', pick: [IND(0), IND(1), IND(2), IND(5)] },   // 餐桌：左端、中段、右端、單張
    { themes: '*', code: '$', indoor: 1, under: '_', pick: [IND(54), IND(55)] },   // fr 第 0 位＝上面是課桌 → 用背面
    /* 教室：課桌（桌面朝上的方桌）、課椅（從背面看，放在桌子後面）、牆上的海報 */
    { themes: '*', code: '?', indoor: 1, under: '_', pick: [IND(85), IND(86), IND(85), IND(86)] },
    { themes: '*', code: '@', indoor: 1, under: '_', pick: [IND(55)] },
    { themes: '*', code: '}', indoor: 1, under: '_', pick: [RPG(14)] },       // 熔爐（壁爐）
    { themes: '*', code: '|', indoor: 1, under: '_', pick: [RPG(15)] },       // 鐵砧
    /* 福利社的貨架：Kenney 室內包的櫃子，擺著盒子、瓶子（每格隨位置換一種） */
    { themes: ['t_shop'], code: 'k', indoor: 1, under: '_', pick: [IND(328), IND(329), IND(330), IND(331)] },
    { themes: '*', code: '*', indoor: 1, custom: 'poster', pick: [IND(343), IND(18), IND(370), IND(340)] },                                     // 椅子
    /* 室外的紅地毯（禮堂前的星光大道）：RPG Pack 的橘紅色 3×3 */
    { themes: GREEN, code: 'r', outdoor: 1, custom: 'set9', shift: 0, under: ',', pick: SET9([1093, 1094, 1095, 1150, 1151, 1152, 1207, 1208, 1209]) },
    { themes: '*', code: 'r', indoor: 1, custom: 'set9', shift: 0, under: '_', pick: SET9([922, 923, 924, 979, 980, 981, 1036, 1037, 1038]) },   // 地毯（3×3）
    { themes: ['t_street'], code: 'T', under: '.', pick: [one('urban_0286.png')] },             // 行道樹（花台）
    { themes: '*', code: 'L', under: 'base', pick: [one('urban_0168.png')] },                  // 路燈
    { themes: '*', code: 'S', under: 'base', pick: [RPG(19)] },                                // 木牌（Kenney 路標）
    { themes: '*', code: ':', under: '.', pick: [one('urban_0167.png')] },                     // 站牌
    { themes: '*', code: '4', under: ',', pick: [one('urban_0221.png')] },                     // 施工路障
    { themes: '*', code: '6', under: 'base', pick: [one('urban_0252.png')] },                  // 回收桶
    { themes: '*', code: '!', under: '.', pick: [one('urban_0216.png')], post: 'wires' },      // 電線桿
    /* ---- 室內：Kenney Roguelike Indoors ---- */
    { themes: '*', code: 'p', under: 'base', pick: [IND(16)] },                                // 盆栽
    { themes: '*', code: 'k', under: '_', pick: [RPG(88), RPG(87), RPG(88), RPG(87)] },          // 書櫃
  ];
  const SKIN_IDX = {};
  for (const s of SKINS) for (const t of (s.themes === '*' ? ['*'] : s.themes)) SKIN_IDX[t + s.code] = s;
  /* indoor：只在室內用；outdoor：只在室外用（同一個字元室內外可以是兩種素材，例如地毯） */
  const skinFor = (theme, code) => {
    for (const s of [SKIN_IDX[theme + code], SKIN_IDX['*' + code]]) if (s && !(s.indoor && !INDOOR) && !(s.outdoor && INDOOR)) return s;
    return null;
  };
  const allImgs = () => Object.values(IMG);
  /* 全部載入完 → 清快取，畫面自動換成素材版 */
  const skinsReady = (typeof document === 'undefined') ? Promise.resolve() :
    new Promise(res => setTimeout(() => {
      /* 同一張圖會出現好幾次（例如整張 sheet），要用 addEventListener，用 onload= 會互相蓋掉、永遠等不到 */
      Promise.all(allImgs().map(im => im.complete ? 0 :
        new Promise(r => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); })))
        .then(() => { cache.clear(); res(); });
    }, 0));

  const hex2rgb = hx => { hx = hx.replace('#', ''); return [parseInt(hx.slice(0, 2), 16), parseInt(hx.slice(2, 4), 16), parseInt(hx.slice(4, 6), 16)]; };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  function adj(hx, f) { const [r, g, b] = hex2rgb(hx); const m = v => f > 0 ? v + (255 - v) * f : v * (1 + f); return rgb2hex(m(r), m(g), m(b)); }
  function hue(hx, deg) {
    let [r, g, b] = hex2rgb(hx).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let H = 0, S = 0; const L = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; S = L > .5 ? d / (2 - mx - mn) : d / (mx + mn); H = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; H /= 6; }
    H = (H + deg / 360 + 1) % 1;
    const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    if (!S) return rgb2hex(L * 255, L * 255, L * 255);
    const q = L < .5 ? L * (1 + S) : L + S - L * S, p = 2 * L - q;
    return rgb2hex(f(p, q, H + 1 / 3) * 255, f(p, q, H) * 255, f(p, q, H - 1 / 3) * 255);
  }
  function star(cx, cy, R, r, n = 5) { const pts = []; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return pts; }
  function inPoly(x, y, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; }

  /* 把形狀清單點陣化；m:1 代表左右鏡射一份 */
  function raster(W, H, parts, pal) {
    const buf = new Array(W * H).fill(null);
    const put = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= W || y >= H) return; buf[y * W + x] = c; };
    const col = c => c === '_' ? null : (pal && pal[c]) || c;
    for (const p of parts) {
      for (const mir of (p.m ? [0, 1] : [0])) {
        const X = x => mir ? W - 1 - x : x; const c = col(p.c);
        if (p.t === 'e') { const [cx, cy, rx, ry] = p.v;
          for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
            const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) put(X(x), y, c); } }
        else if (p.t === 'r') { const [x0, y0, w, hh] = p.v; for (let y = y0; y < y0 + hh; y++) for (let x = x0; x < x0 + w; x++) put(X(x), y, c); }
        else if (p.t === 'p') { const pts = p.v; const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
          for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) if (inPoly(x + .5, y + .5, pts)) put(X(x), y, c); }
        else if (p.t === 'd') { for (const [x, y] of p.v) put(X(x), y, c); }
        else if (p.t === 'eye') { const [x, y] = p.v; const eh = p.h || 3; for (let j = 0; j < eh; j++) { put(X(x), y + j, OUT); put(X(x + 1), y + j, OUT); } put(X(x), y, '#ffffff'); }
      }
    }
    return buf;
  }
  function toCanvas(W, H, buf, shadeOn = true) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, c = buf[i];
      if (c) { let f = c;
        if (shadeOn && !NOSHADE.has(c)) { const up = y > 0 ? buf[i - W] : null, dn = y < H - 1 ? buf[i + W] : null, rt = x < W - 1 ? buf[i + 1] : null;
          if (up !== c && up !== OUT) f = adj(c, .22); else if (dn !== c && dn !== OUT) f = adj(c, -.22); else if (rt !== c && rt !== OUT) f = adj(c, -.12); }
        g.fillStyle = f; g.fillRect(x, y, 1, 1);
      } else {
        const n = (x > 0 && buf[i - 1]) || (x < W - 1 && buf[i + 1]) || (y > 0 && buf[i - W]) || (y < H - 1 && buf[i + W]);
        if (n) { g.fillStyle = OUT; g.fillRect(x, y, 1, 1); }
      }
    }
    return cv;
  }

  /* ---------- 人物 16×16（四方向、三格走路） ---------- */
  function personParts(L, dir, fr) {
    const P = [], R = (x, y, w, hh, c, m) => P.push({ t: 'r', v: [x, y, w, hh], c, m }), D = (v, c, m) => P.push({ t: 'd', v, c, m }), E = (v, c, m) => P.push({ t: 'e', v, c, m });
    const sk = L.skin || '#f8d0a8', hr = L.hair || '#3a3040', cl = L.cloth || '#4868b8', c2 = L.cloth2 || adj(cl, -.35), pt = L.pants || '#34344a';
    const girl = L.gender === 'f', side = dir === 'left';
    const outfit = L.outfit || 'pants', robe = L.style === 'literati' || L.robe || outfit === 'suit';
    const legC = outfit === 'skirt' ? (L.sock || '#f4f4f4') : pt;
    if (side) { if (fr === 0) R(6, 12, 4, 3, legC); else if (fr === 1) { R(5, 12, 2, 3, legC); R(9, 12, 2, 2, legC); } else { R(6, 12, 2, 2, legC); R(8, 12, 2, 3, legC); } }
    else { R(5, 12, 2, fr === 1 ? 2 : 3, legC); R(9, 12, 2, fr === 2 ? 2 : 3, legC); }
    if (side) { R(5, 8, 6, robe ? 6 : 5, cl); }
    else { R(4, 8, 8, robe ? 6 : 5, cl); R(3, 8, 1, 4, cl, 1); D([[3, 12]], sk, 1); }
    if (outfit === 'skirt') { if (side) R(4, 11, 7, 3, pt); else R(3, 11, 10, 3, pt); }
    if (robe) { R(side ? 5 : 4, 10, side ? 6 : 8, 1, c2); }
    if (outfit === 'suit' && dir === 'down') { D([[7, 8], [8, 8], [7, 9], [8, 9]], '#ffffff'); D([[6, 8], [6, 9], [9, 8], [9, 9]], c2); D([[7, 10], [8, 10], [7, 11]], L.tie || '#c83838'); }
    if (L.style === 'wuxia') { R(side ? 5 : 4, 11, side ? 6 : 8, 1, c2); }
    if (L.style === 'school' && dir === 'down') { D([[7, 8], [8, 8]], '#ffffff'); D([[7, 9], [8, 9], [7, 10]], c2); }
    if (L.style === 'school' && dir === 'up') { R(5, 8, 6, 4, L.bag || '#c8504a'); }
    if (L.style === 'school' && side) { R(10, 8, 2, 4, L.bag || '#c8504a'); }
    if (side) { R(6, 9, 2, 3, c2); D([[6, 12]], sk); }
    E([side ? 7.5 : 8, 5, 4.6, 4.2], sk);
    if (dir === 'up') { E([8, 4.6, 4.9, 4.4], hr); if (girl) R(4, 6, 8, 4, hr); }
    else if (side) { E([8.3, 3, 4.7, 2.7], hr); R(9, 3, 3, 5, hr); if (girl) R(9, 3, 4, 7, hr); }
    else { E([8, 3, 4.9, 2.7], hr); R(3, 3, 1, 3, hr, 1); if (girl) R(3, 3, 2, 7, hr, 1); }
    if (L.bun) { E([8, 0.8, 2, 1.4], hr); }
    const face = L.face || 'normal', mouth = '#c0504a', eyes = [[6, 6], [6, 7]];
    if (dir === 'down') {
      if (face === 'happy') { D([[5, 7], [6, 6]], OUT, 1); D([[7, 8], [8, 8]], mouth); }
      else if (face === 'sleepy') D([[5, 7], [6, 7]], OUT, 1);
      else if (face === 'cool') { R(4, 6, 3, 2, OUT, 1); D([[7, 6], [8, 6]], OUT); D([[5, 6]], '#8090a8', 1); }
      else if (face === 'wink') { D(eyes, OUT); D([[9, 7], [10, 7]], OUT); D([[7, 8], [8, 8]], mouth); }
      else { D(eyes, OUT, 1);
        if (face === 'smile') D([[7, 8], [8, 8]], mouth);
        if (face === 'surprise') D([[7, 8], [8, 8], [7, 9], [8, 9]], '#602828');
        if (face === 'blush') D([[5, 8]], '#f08a8a', 1);
        if (face === 'serious') { D([[7, 8], [8, 8]], '#7a4a3a'); D([[5, 5], [6, 5]], OUT, 1); } }
      if (L.glasses) { D([[5, 6], [7, 6]], '#8090a8', 1); } if (L.beard) { R(5, 8, 6, 2, '#f0f0f0'); D([[7, 10], [8, 10]], '#f0f0f0'); }
    }
    if (side) {
      if (face === 'happy' || face === 'sleepy') D([[3, 7], [4, 7]], OUT);
      else if (face === 'cool') { R(2, 6, 4, 2, OUT); }
      else { D([[4, 6], [4, 7]], OUT); if (face === 'blush') D([[5, 8]], '#f08a8a'); if (face === 'smile' || face === 'happy' || face === 'wink') D([[3, 8]], mouth); if (face === 'surprise') D([[3, 8]], '#602828'); }
      if (L.glasses) D([[3, 6], [5, 6]], '#8090a8'); if (L.beard) { R(4, 8, 4, 2, '#f0f0f0'); D([[5, 10]], '#f0f0f0'); }
    }
    if (L.style === 'literati' || L.cap) { const cc = L.cap || '#26262e'; R(4, 0, 8, 2, cc); if (side) D([[12, 2], [13, 3], [13, 4]], cc); else if (dir === 'up') D([[4, 2], [11, 2]], cc); }
    if (L.style === 'wuxia') { const bc = L.band || '#d03838'; if (dir !== 'up') R(3, 3, 10, 1, bc); else R(3, 4, 10, 1, bc);
      if (side) D([[12, 4], [13, 5], [13, 6]], bc); if (dir === 'up') { D([[7, 5], [8, 6], [7, 7]], bc); D([[12, 6], [11, 7], [10, 8], [9, 9], [8, 10], [7, 11], [6, 12]], '#c8d0e0'); D([[13, 5], [12, 5]], '#8a5a2a'); }
      if (dir === 'down') D([[13, 5], [12, 6]], '#8a5a2a'); }
    if (L.hat) { R(3, 0, 10, 2, L.hat); R(2, 2, 12, 1, L.hat); }
    return P;
  }
  function person(L, dir = 'down', fr = 0) {
    const d = dir === 'right' ? 'left' : dir;
    const key = 'p:' + JSON.stringify(L) + d + fr + (dir === 'right' ? 'R' : '');
    if (cache.has(key)) return cache.get(key);
    let cv = toCanvas(16, 16, raster(16, 16, personParts(L, d, fr), null), true);
    if (dir === 'right') { const f = document.createElement('canvas'); f.width = 16; f.height = 16; const g = f.getContext('2d'); g.translate(16, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); cv = f; }
    cache.set(key, cv); return cv;
  }

  /* 沿著建築輪廓加一圈深色描邊（草圖裡的物件都有描邊） */
  function outlineBuilding(g, cv, W, H) {
    const d = g.getImageData(0, 0, cv.width, cv.height), p = d.data, w = cv.width, h = cv.height;
    const solid = new Uint8Array(w * h);
    for (let i = 0, q = 0; i < p.length; i += 4, q++) solid[q] = p[i + 3] > 12 ? 1 : 0;
    const OUTL = [34, 26, 22];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const q = y * w + x; if (solid[q]) continue;
      let near = false;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (solid[ny * w + nx]) { near = true; break; }
      }
      if (!near) continue;
      const i = q * 4; p[i] = OUTL[0]; p[i+1] = OUTL[1]; p[i+2] = OUTL[2]; p[i+3] = 235;
    }
    g.putImageData(d, 0, 0);
  }

  /* 草地雜訊的四種排列（x, y, 亮=1 暗=0） */
  const GROUND_V = [
    [[2,3,0],[9,1,1],[13,6,0],[5,9,1],[11,12,0],[3,14,1],[7,6,0],[15,10,1]],
    [[6,2,1],[1,7,0],[12,4,1],[8,11,0],[14,13,1],[4,5,0],[10,9,1],[2,12,0]],
    [[4,1,0],[11,3,1],[7,8,0],[1,11,1],[13,9,0],[9,14,1],[15,5,0],[5,6,1]],
    [[8,4,1],[3,2,0],[14,8,1],[6,13,0],[10,6,1],[12,15,0],[1,5,1],[7,10,0]],
  ];
  /* ---------- 地圖圖塊 16×16 ---------- */
  const THEMES = {
    school: { ground: '#98d470', ground2: '#78b454', path: '#e8dcb8', path2: '#cfc39c', pathStyle: 'tile',
      tall: '#3f9a3a', tall2: '#86d860', tall3: '#276a2a', leaf: '#48a848', leaf2: '#82d06a', leaf3: '#2a7236', trunk: '#8a5a2a', treeStyle: 'round',
      water: '#58b0f0', water2: '#c0e8ff', wall: '#f4ecd4', wall2: '#c8bc9c', roof: '#d85848', roof2: '#a03838',
      door: '#6aa8e0', door2: '#3a6aa8', win: '#a0d8f8', win2: '#5878a8', fence: '#f8f8f8', fence2: '#a8a8b0', flower: ['#f86a8a', '#f8e040', '#ffffff'], lamp: '#f8e878', rock: '#a8a8b0', floor: '#e8e0cc', floor2: '#cfc4a8', iwall: '#f4ecd4', iwall2: '#9ab8d8', blanket: '#5a88c8' },
    literati: { ground: '#b0d890', ground2: '#90b870', path: '#cfcfc6', path2: '#a8a8a0', pathStyle: 'slab',
      tall: '#4f9a58', tall2: '#98d888', tall3: '#2e6a3a', leaf: '#78b868', leaf2: '#a8d890', leaf3: '#4a8848', trunk: '#6a4a32', treeStyle: 'willow',
      water: '#68b0c8', water2: '#d0f0f0', wall: '#f6f6f0', wall2: '#b8b8b0', roof: '#4a4e5a', roof2: '#2e323c',
      door: '#8a2a22', door2: '#e0b040', win: '#5a3a2a', win2: '#e8dcc0', fence: '#6a4a32', fence2: '#4a3222', flower: ['#f0a0c0', '#ffffff', '#f8d060'], lamp: '#e84838', rock: '#9aa0a0', floor: '#c8a070', floor2: '#a88050', iwall: '#f6f2e6', iwall2: '#8a6a4a', blanket: '#6a5a8a' },
    wuxia: { ground: '#a8c068', ground2: '#88a048', path: '#d0ac7a', path2: '#a8885a', pathStyle: 'dirt',
      tall: '#4a8a3a', tall2: '#90c860', tall3: '#2e5a26', leaf: '#6ab04a', leaf2: '#9ad06a', leaf3: '#3a7a2a', trunk: '#6a4a2a', treeStyle: 'bamboo',
      water: '#4a90b8', water2: '#b0d8f0', wall: '#b07a4a', wall2: '#7a5030', roof: '#6a4a3a', roof2: '#48301f',
      door: '#5a3a22', door2: '#c8a060', win: '#f0e0b8', win2: '#6a4a2a', fence: '#8a6a3a', fence2: '#5a4020', flower: ['#f8e040', '#f07050', '#ffffff'], lamp: '#e04030', rock: '#98948a', floor: '#a8784a', floor2: '#86582e', iwall: '#d8b888', iwall2: '#6a4424', blanket: '#a83838' },
  };
  /* 城鎮主題（地圖改版草案）：以 school 為底，換掉地面、屋頂、樹木等顏色 */
  const TOWN_THEMES = {
    /* 晨讀村：晨光下的田埂與紅瓦矮房 */
    t_dawn:   { ground: '#b6e08a', ground2: '#94c068', path: '#e8d4a4', path2: '#c8b083', pathStyle: 'dirt', roof: '#c09a68', roof2: '#8e6c42',
                leaf: '#5ab858', leaf2: '#96e078', leaf3: '#357a3a', trunk: '#8a5a2a', treeStyle: 'round',
                flower: ['#f8b0c8', '#fff0a0', '#ffffff'], fence: '#e8dcc0', fence2: '#b8a888' },
    /* 注音坡：黃綠色坡地、橘黃校舍、石駁坎 */
    t_slope:  { ground: '#c8dc72', ground2: '#a4bc54', path: '#eed7a0', path2: '#cbb27a', pathStyle: 'dirt', roof: '#a98a56', roof2: '#7a5f36',
                leaf: '#7ab848', leaf2: '#b0dc70', leaf3: '#4a8a34', trunk: '#9a6a34', treeStyle: 'round',
                door: '#f8d860', door2: '#b8892a', win: '#d8f0ff', rock: '#cfc0a0', flower: ['#f86a8a', '#f8e040', '#8ad0f8'] },
    /* 抄書巷：泥土色窄巷、深紅磚、少綠意 */
    t_alley:  { ground: '#a89a72', ground2: '#8a7c58', path: '#c4a888', path2: '#9a8064', pathStyle: 'dirt',
                roof: '#8a6a4c', roof2: '#5c452c', leaf: '#6a8a4a', leaf2: '#96b070', leaf3: '#44602e', trunk: '#6a4a2a',
                wall: '#ecdcc4', wall2: '#bca88c', lamp: '#f0c860' },
    /* 典籍港：藍灰石板與水岸 */
    t_port:   { ground: '#7ab89a', ground2: '#5a9878', path: '#c0c4cc', path2: '#98a2ac', pathStyle: 'slab',
                roof: '#6e7686', roof2: '#464d5c', water: '#2f8fd8', water2: '#bfe8ff',
                leaf: '#4a9a78', leaf2: '#7ec8a0', leaf3: '#2e6a52', trunk: '#5a4a3a', wall: '#eef0ea' },
    /* 聽雨亭：濃綠竹林、青瓦 */
    t_bamboo: { ground: '#6ec078', ground2: '#4e9c58', path: '#d4cca4', path2: '#aea278', roof: '#4a7a5a', roof2: '#2e5a3e',
                leaf: '#3a9850', leaf2: '#78d078', leaf3: '#24683a', trunk: '#6a5a3a', treeStyle: 'bamboo',
                water: '#5ac0e8', water2: '#d0f4ff' },
    /* 花南街：粉色街屋與滿街花 */
    t_flower: { ground: '#a8e084', ground2: '#84c060', path: '#f6dcd8', path2: '#d4b4b0', roof: '#c07fa4', roof2: '#8e5878',
                leaf: '#66c060', leaf2: '#a4e884', leaf3: '#3e8a44', trunk: '#8a5a4a',
                flower: ['#f86ab0', '#ffe070', '#ffffff'], wall: '#fdf2e8' },
    /* 碑林關：乾黃土地、碑石、深褐瓦 */
    t_stele:  { ground: '#bcb476', ground2: '#9c9456', path: '#cfa970', path2: '#a88550', pathStyle: 'dirt',
                roof: '#7d6a54', roof2: '#52432f', leaf: '#8a9a58', leaf2: '#b4c078', leaf3: '#5a6a34', trunk: '#7a5a34',
                wall: '#e4d4ac', wall2: '#b4a47c', rock: '#a09a8c', lamp: '#e84838' },
    /* 墨泉鄉：青灰霧氣、墨藍屋瓦 */
    t_spring: { ground: '#7ea898', ground2: '#5e8878', path: '#aeb2b8', path2: '#868a90', pathStyle: 'slab',
                roof: '#44445e', roof2: '#2a2a40', leaf: '#4a8a78', leaf2: '#7ab8a4', leaf3: '#2e5a4e', trunk: '#4a4a52',
                water: '#5a7ab0', water2: '#cfe0f4', wall: '#e2e2e6', lamp: '#d8e8ff' },
    /* 硯海墨池：墨色的水、青灰石岸 */
    t_ink:    { ground: '#3e3a4c', ground2: '#2e2b3a', path: '#6e6a80', path2: '#4e4a60', pathStyle: 'slab',
                water: '#2a2038', water2: '#6a58a0', roof: '#3a3450', roof2: '#241f34',
                leaf: '#3a5a58', leaf2: '#5a8a82', leaf3: '#24403e', trunk: '#3a3444',
                wall: '#5a5670', wall2: '#3a3650', iwall: '#4a4660', iwall2: '#2e2b3e',
                floor: '#6e6a80', floor2: '#4e4a60', rock: '#7a7690', lamp: '#b8a8f0',
                flower: ['#8a7ad0', '#d0c8f8', '#ffffff'], fence: '#6a6480', fence2: '#46425a' },
    /* 通學路（校外）：柏油路、人行道、行道樹。和校園是兩套語彙 */
    t_street: { ground: '#c6c0b4', ground2: '#a8a295', path: '#4e4e58', path2: '#3c3c45', pathStyle: 'road',
                tall: '#4f9a3f', tall2: '#8fd06a', tall3: '#2f6a2a', grassBed: '#5e7a44',
                leaf: '#4e9440', leaf2: '#86c468', leaf3: '#2e5e28', trunk: '#6a5238', treeStyle: 'round',
                roof: '#b05a48', roof2: '#7e3a2e', wall: '#e4ddcc', wall2: '#b8b0a0',
                win: '#bfe0f2', win2: '#7fb4d8', door: '#6a5238', door2: '#473424',
                fence: '#c8ccd2', fence2: '#8e949c', rock: '#9a958c', lamp: '#ffe9a8',
                flower: ['#f06a92', '#ffd54a', '#ffffff'],
                floor: '#d8d2c4', floor2: '#b6b0a2', iwall: '#efe9db', iwall2: '#9ab8d8' },
    /* 校園：水泥鋪面、學校草皮、二丁掛磚牆（校園改版用） */
    t_campus: { ground: '#84c25f', ground2: '#68a746', path: '#cfcabb', path2: '#a9a393', pathStyle: 'slab',
                tall: '#4f9a3f', tall2: '#8fd06a', tall3: '#2f6a2a',
                leaf: '#5aa848', leaf2: '#8fd06a', leaf3: '#356b2c', trunk: '#7a5a34', treeStyle: 'round',
                roof: '#c8443c', roof2: '#8e2a26', wall: '#e8e2d4', wall2: '#bdb5a2',
                win: '#bfe0f2', win2: '#7fb4d8',
                /* 教室門用木色：走廊上的置物櫃 z 是藍灰的，門再用藍灰就分不出來 */
                door: '#9a6a3e', door2: '#6a4524',
                fence: '#dcd8cc', fence2: '#a8a294', rock: '#a8a396', lamp: '#f8e878',
                flower: ['#f06a92', '#ffd54a', '#ffffff'],
                floorStyle: 'terrazzo', floor: '#e0dbcc', floor2: '#c2bcaa', iwall: '#f2eee2', iwall2: '#9ab8d8' },
    /* 舊校舍：同一套但褪色、偏黃灰 */
    t_oldwing:{ ground: '#8aa864', ground2: '#6e8c4c', path: '#b8b2a0', path2: '#948e7c', pathStyle: 'slab',
                leaf: '#5a8a48', leaf2: '#86b068', leaf3: '#35562c', trunk: '#6a5230', treeStyle: 'round',
                roof: '#8a6a52', roof2: '#5c432f', wall: '#cfc5ac', wall2: '#a29882',
                win: '#9ab0b8', win2: '#6e848c', door: '#5a5248', door2: '#3a3630',
                fence: '#b4ae9c', fence2: '#8a8472', rock: '#9a9488', lamp: '#d8cfa0',
                flower: ['#c08a9a', '#d8c86a', '#e8e4d8'],
                floorStyle: 'terrazzo', floor: '#c8c0ae', floor2: '#a8a08e', iwall: '#ddd6c4', iwall2: '#8a9aa8' },
    /* 鐘塔台：冷灰石階與金旗 */
    t_tower:  { ground: '#8ab08a', ground2: '#6a8e6a', path: '#c8c2ba', path2: '#9a948c', pathStyle: 'slab',
                roof: '#4e4e60', roof2: '#30304a', leaf: '#5a9a6a', leaf2: '#8ac490', leaf3: '#36663f', trunk: '#5a5a52',
                wall: '#eeeae2', fence: '#d8b040', fence2: '#a07f20', door: '#c83838', door2: '#7a1c1c' },
  };
  for (const [k, v] of Object.entries(TOWN_THEMES)) THEMES[k] = Object.assign({}, THEMES.school, v);
  /* 主題教室（2026-10-06）：配色沿用校園，各自有自己的地板（見 SKINS）和家具 */
  for (const k of ['t_forge', 't_shop', 't_library', 't_museum', 't_stage', 't_art']) THEMES[k] = Object.assign({}, THEMES.t_campus);
  /* 我的房間：暖色木地板、米色壁紙（序幕的房間不是教室，不能是磨石子） */
  THEMES.t_home = Object.assign({}, THEMES.t_dawn, { floorStyle: 'wood', floor: '#c49a66', floor2: '#a07a4a',
    iwall: '#efe4cc', iwall2: '#b89a72', blanket: '#5a7ac8' });
  /* 位置雜訊用的亂數。回傳的是 uint32，取位元時**一定要用 >>>**：
     `v >> 5` 是帶符號位移，v 超過 2^31 就變負數，`% n` 會得到負的餘數，
     畫出來的雜點會跑到指定範圍的上面去（在 16×16 的磚上只是被裁掉看不見，
     在 96×80 的整棟建築上就會直接畫到屋頂）。 */
  function hash(a, b) { let s = (a * 374761393 + b * 668265263) >>> 0; s = (s ^ (s >>> 13)) * 1274126177 >>> 0; return (s ^ (s >>> 16)) >>> 0; }
  /* 一片瓦屋頂：上緣受光、下緣深色屋簷，瓦列交錯排，整棟疊起來才有立體感 */
  function roofTile(R, T, fr = 0) {
    const a = T.roof, hi = adj(a, .16), lo = T.roof2, dk = adj(T.roof2, -.30);
    R(0, 0, 16, 16, a);
    for (let y = 0; y < 16; y += 4) {
      R(0, y, 16, 1, hi);                       // 每一列瓦的受光邊
      R(0, y + 3, 16, 1, lo);                   // 瓦溝
      const off = ((y / 4) & 1) ? 0 : 4;        // 上下列錯開，像真的瓦
      for (let x = off; x < 16; x += 8) R(x, y + 1, 1, 2, lo);
    }
    R(0, 15, 16, 1, dk);                        // 屋簷最下緣壓深
  }

  /* 三種彩瓦的配色（補給站／商店／道館），招牌版與純屋頂版共用同一份 */
  const RED  = { roof: '#c42e2e', roof2: adj('#c42e2e', -.28) };
  const BLUE = { roof: '#3a68b8', roof2: adj('#3a68b8', -.28) };
  const GOLD = { roof: '#b8861a', roof2: adj('#b8861a', -.28) };

  /* 室內／室外：告示牌、公佈欄、飲水機這類「擺在地上的設施」，
     底下要鋪的是室內地板還是室外地面，不一樣。
     由 OW.draw() 在畫每張地圖之前設好（GFX.setIndoor），
     快取的 key 也要帶著，不然兩種會互相覆蓋。 */
  let INDOOR = false;
  function setIndoor(v) { INDOOR = !!v; }

  function tile(theme, code, fr = 0) {
    const key = 't:' + theme + code + fr + (INDOOR ? 'i' : ''); if (cache.has(key)) return cache.get(key);
    const T = THEMES[theme] ? Object.assign({}, THEMES.school, THEMES[theme]) : THEMES.school;   // 城鎮主題缺的鍵沿用 school
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; const g = cv.getContext('2d');
    const R = (x, y, w, hh, c) => { g.fillStyle = c; g.fillRect(x, y, w, hh); };
    /* 草地雜訊：四種變化，由地圖座標決定，避免整片重複同一個圖案 */
    const ground = (v = 0) => {
      R(0, 0, 16, 16, T.ground);
      const lit = adj(T.ground, .10), drk = T.ground2, drk2 = adj(T.ground2, -.10);
      /* 先鋪一層大面積的深淺塊，再點上細雜訊，遠看才有層次 */
      const PATCH = [[[0, 0, 7, 5], [9, 6, 7, 6]], [[8, 1, 8, 6], [1, 9, 6, 5]],
                     [[3, 2, 6, 6], [10, 10, 5, 5]], [[0, 7, 5, 7], [7, 0, 8, 4]]][v & 3];
      for (const [x, y, w2, h2] of PATCH) R(x, y, w2, h2, adj(T.ground, -.045));
      for (const [x, y, k] of GROUND_V[v & 3]) R(x, y, 1, 1, k ? lit : drk);
      /* 幾撮短草：兩像素高，方向交錯 */
      const TUFT = [[[2, 11], [12, 4]], [[6, 3], [13, 12]], [[4, 13], [9, 7]], [[11, 2], [3, 8]]][v & 3];
      for (const [x, y] of TUFT) { R(x, y, 1, 2, drk2); R(x + 1, y + 1, 1, 1, drk2); R(x - 1, y + 1, 1, 1, drk); }
    };
    /* 設施磚塊的底：室內鋪地板、室外鋪地面 */
    const base = () => { if (INDOOR) g.drawImage(tile(theme, '_'), 0, 0); else ground(); };
    const pave = () => { if (INDOOR) g.drawImage(tile(theme, '_'), 0, 0); else g.drawImage(tile(theme, ','), 0, 0); };
    const sk = skinFor(theme, code);
    if (sk && sk.custom === 'kgrass') {                              // Kenney 風的高草：兩排草叢交錯，左右可以無縫接
      /* 寶可夢式高草：比草地深一階的草床，上面一叢一叢長葉（深綠＋亮綠葉尖＋Kenney 的深色描邊），
         每格依 fr 換排列，整片看起來才不像壁紙 */
      R(0, 0, 16, 16, '#76a82a');                                    // RPG Pack 的配色：草床比草地深一階
      const v = fr & 3, OL = '#4f7426', DG = '#648c32', MG = '#7bad2c', TIP = '#a8d848';
      const blade = (x, y, h, lean) => {                             // 一片葉：由下往上，頂端亮
        for (let i = 0; i < h; i++) { const xx = x + (i > h * .6 ? lean : 0), yy = y - i; if (xx < 0 || xx > 15 || yy < 0) continue;
          R(xx, yy, 1, 1, i === h - 1 ? TIP : i > h / 2 ? MG : DG); }
      };
      const clump = (cx, by) => {                                    // 一叢：五片葉，底下描一條深色
        [[-2, 5, -1], [-1, 7, 0], [0, 8, 0], [1, 7, 1], [2, 5, 1]].forEach(([dx, h, l]) => blade(cx + dx, by, h, l));
        for (let dx = -3; dx <= 3; dx++) { const x = cx + dx; if (x >= 0 && x < 16) R(x, by + 1, 1, 1, OL); }
        if (cx - 3 >= 0) R(cx - 3, by, 1, 1, OL); if (cx + 3 < 16) R(cx + 3, by, 1, 1, OL);
      };
      const LAY = [[[4, 7], [12, 6], [8, 14], [0, 15], [16, 15]], [[3, 6], [11, 7], [7, 14], [15, 13]],
                   [[5, 7], [13, 7], [1, 14], [9, 15]], [[2, 6], [10, 6], [6, 14], [14, 15]]][v];
      for (const [cx, by] of LAY) clump(cx, by);
      cache.set(key, cv); return cv;
    }
    if (sk && sk.custom === 'row') {                                 // 一排接起來的家具：fr 是鄰格遮罩（右2、左8＝那一邊不是同一種）
      const p = sk.pick[(fr & 8) && (fr & 2) ? 3 : (fr & 8) ? 0 : (fr & 2) ? 2 : 1];
      if (p.im.complete && p.im.naturalWidth) { if (sk.under === 'base') base(); else g.drawImage(tile(theme, sk.under || '_', 0), 0, 0); g.imageSmoothingEnabled = false; g.drawImage(p.im, p.sx, p.sy, 16, 16, 0, 0, 16, 16); cache.set(key, cv); return cv; }
      var skinPending = true;
    } else if (sk && sk.custom === 'poster') {                              // 海報：底下是牆（fr 低三位＝牆的收邊旗標），高位＝第幾種圖案
      const p = sk.pick[(fr >> 3) & 3];
      if (p.im.complete && p.im.naturalWidth) { g.drawImage(tile(theme, 'w', fr & 7), 0, 0); g.imageSmoothingEnabled = false; g.drawImage(p.im, p.sx, p.sy, 16, 16, 0, 0, 16, 16); cache.set(key, cv); return cv; }
      var skinPending = true;
    } else if (sk && sk.custom === 'wall') {                                // 室內牆：fr 第 0 位＝下面是房間 → 有踢腳板的那一塊
      const p = sk.pick[(fr & 1) ? 1 : 0];
      if (p.im.complete && p.im.naturalWidth) { g.imageSmoothingEnabled = false; g.drawImage(p.im, p.sx, p.sy, 16, 16, 0, 0, 16, 16); cache.set(key, cv); return cv; }
      var skinPending = true;
    } else if (sk && (sk.custom === 'trees' || sk.custom === 'set9')) {
      const ok = sk.pick.every(p => p.im.complete && p.im.naturalWidth);
      if (ok) {
        let p;
        if (sk.custom === 'trees') {                                   // 樹：上下兩格湊成一棵高樹；湊不成的用單格的樹
          const m = fr & 15, lower = (fr >> 4) & 1, below = (fr >> 5) & 1, round = (fr >> 6) & 1;
          if (m === 15) p = sk.pick[5];                                // 四邊都沒有樹：單獨一棵圓樹
          else if (lower) p = sk.pick[round ? 3 : 1];                  // 高樹的下半（樹幹）
          else if (below) p = sk.pick[round ? 2 : 0];                  // 高樹的上半（樹冠）
          else p = sk.pick[4];                                         // 落單的一格：單格小松
          g.drawImage(tile(theme, '.', 0), 0, 0);
        } else {                                                       // 3×3 拼塊（邊緣那幾塊是半透明的，底下先鋪地面）
          if (sk.under) g.drawImage(tile(theme, sk.under, 0), 0, 0);
          const m = (fr >> sk.shift) & 15, top = m & 1, right = m & 2, bot = m & 4, left = m & 8;
          const row = top && !bot ? 0 : bot && !top ? 2 : 1, col = left && !right ? 0 : right && !left ? 2 : 1;
          p = sk.pick[row * 3 + col];
        }
        g.imageSmoothingEnabled = false; g.drawImage(p.im, p.sx, p.sy, 16, 16, 0, 0, 16, 16);
        cache.set(key, cv); return cv;
      }
      var skinPending = true;
    } else if (sk && sk.custom === 'forest') {                       // 森林拼塊：依鄰格決定用哪一塊
      const ok = sk.pick.every(p => p.im.complete && p.im.naturalWidth);
      if (ok) {
        const m = fr & 15, top = m & 1, right = m & 2, bot = m & 4, left = m & 8;
        let p;
        if (m === 15) p = sk.pick[1];                                 // 四邊都不是樹：單獨一棵（圓樹，有陰影）
        else {
          const row = top && !bot ? 0 : bot && !top ? 2 : 1, col = left && !right ? 0 : right && !left ? 2 : 1;
          p = [[sk.pick[2], sk.pick[3], sk.pick[4]], [sk.pick[5], sk.pick[0], sk.pick[6]], [sk.pick[7], sk.pick[8], sk.pick[9]]][row][col];
        }
        g.drawImage(tile(theme, '.', 0), 0, 0);
        g.imageSmoothingEnabled = false; g.drawImage(p.im, 0, 0);
        cache.set(key, cv); return cv;
      }
      var skinPending = true;
    } else if (sk) {
      const p = sk.pick[fr % sk.pick.length];
      if (p.im.complete && p.im.naturalWidth) {
        if (sk.under === 'base') base(); else if (sk.under === '_') g.drawImage(tile(theme, '_'), 0, 0);
        else if (sk.under) g.drawImage(tile(theme, sk.under, sk.under === 'w' ? 0 : fr & 3), 0, 0);   // 牆的 fr 是護牆板旗標，不是雜訊
        g.imageSmoothingEnabled = false; g.drawImage(p.im, p.sx, p.sy, 16, 16, 0, 0, 16, 16);
        if (sk.post === 'wires') {                                   // 電線桿：橫擔、礙子、兩條電線
          R(1, 2, 14, 2, '#6a6a74'); R(1, 2, 14, 1, '#9a9aa4');
          for (const x of [2, 5, 10, 13]) { R(x, 1, 1, 1, '#f4f4fa'); }
          R(0, 1, 16, 1, 'rgba(40,40,48,.85)'); R(0, 5, 16, 1, 'rgba(40,40,48,.6)');
        }
        cache.set(key, cv); return cv;
      }
      var skinPending = true;                                        // 圖還沒載入：先畫原本的，不快取
    }
    switch (code) {
      case '.': ground(fr); break;
      case ',': {
        R(0, 0, 16, 16, T.path);
        const hi = adj(T.path, .07), lo = T.path2;
        if (T.pathStyle === 'road') {                                   // 柏油路：粗骨料＋中央虛線
          const v0 = fr & 3, m = (fr >> 2) & 15;
          for (let i = 0; i < 16; i++) { const v = hash(i + v0 * 5, 23);
            R(v % 16, (v >>> 4) % 16, 1, 1, (v >>> 9) & 1 ? adj(T.path, .08) : adj(T.path, -.08)); }
          /* 分向線不自動畫：4 格寬的路沒有「正中央那一格」，自動畫會畫到兩側去。
             要分向線的話，地圖自己放一排 ; （車道分向線）。 */
          if (m & 1) R(0, 0, 16, 1, adj(T.path, .20));                  // 和人行道交界
          if (m & 4) R(0, 15, 16, 1, adj(T.path, .20));
          if (m & 2) R(15, 0, 1, 16, adj(T.path, .20));
          if (m & 8) R(0, 0, 1, 16, adj(T.path, .20));
          break;
        }
        if (T.pathStyle === 'tile') {                                  // 方磚
          R(0, 7, 16, 1, lo); R(7, 0, 1, 7, lo); R(15, 8, 1, 8, lo);
          R(0, 8, 16, 1, hi); R(8, 0, 1, 7, hi);
        } else if (T.pathStyle === 'slab') {                           // 石板
          R(0, 0, 16, 1, lo); R(0, 8, 16, 1, lo); R(5, 1, 1, 7, lo); R(12, 9, 1, 7, lo);
          R(0, 1, 16, 1, hi); R(0, 9, 16, 1, hi);
          for (const [x, y] of [[2, 3], [9, 4], [7, 12], [14, 11]]) R(x, y, 2, 1, adj(T.path, -.04));
        } else {                                                        // 泥土路：細碎石＋輪痕
          for (let i = 0; i < 9; i++) { const v = hash(i + fr * 3, 7);
            R(v % 15, (v >>> 4) % 15, 1 + (v >>> 9) % 2, 1, lo); }
          R(0, 5, 16, 1, adj(T.path, -.05)); R(0, 11, 16, 1, adj(T.path, -.05));
          for (const [x, y] of [[3, 2], [11, 8], [6, 13]]) R(x, y, 2, 1, hi);
        }
        break;
      }
      case '&': {                                   // 墨塵：地板上漫開的一灘墨。fr 低四位＝鄰格遮罩（哪幾邊不是墨塵）、高位＝雜訊
        base();
        const m = fr & 15, v = (fr >> 4) & 3, RC = 5;
        const ink = (x, y) => {                      // 圓角矩形，邊緣用雜訊咬出一點不規則；沒有開口的那幾邊一路連到鄰格
          const dx = Math.min(m & 8 ? x : 99, m & 2 ? 15 - x : 99), dy = Math.min(m & 1 ? y : 99, m & 4 ? 15 - y : 99);
          const rim = 1 + ((x * 7 + y * 13 + v * 5) % 3);
          if (dx < 99 && dy < 99) return (dx >= RC || dy >= RC) ? Math.min(dx, dy) >= rim : Math.hypot(RC - dx, RC - dy) <= RC - rim + .5;
          return Math.min(dx, dy) >= rim;
        };
        g.globalAlpha = .94;
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (ink(x, y)) {
          const wet = !ink(x - 1, y) || !ink(x + 1, y) || !ink(x, y - 1) || !ink(x, y + 1);
          g.fillStyle = wet ? '#3d3870' : y < 8 && (x + v) % 5 === 0 && y % 3 === 1 ? '#2a2648' : '#211d3a'; g.fillRect(x, y, 1, 1);
        }
        g.globalAlpha = 1;
        /* 潑出去的小墨點（只在有開口的那一側） */
        if (m & 1) { R(2 + (v * 5) % 11, 0, 1, 1, '#2a2648'); R(9 - v, 1, 2, 1, '#2a2648'); }
        if (m & 4) { R(3 + (v * 3) % 9, 15, 1, 1, '#2a2648'); R(11 - v, 14, 1, 1, '#2a2648'); }
        if (m & 8) { R(0, 3 + (v * 4) % 9, 1, 1, '#2a2648'); R(1, 10 - v, 1, 2, '#2a2648'); }
        if (m & 2) { R(15, 2 + (v * 3) % 10, 1, 1, '#2a2648'); R(14, 9 + v, 1, 2, '#2a2648'); }
        /* 墨面的反光：一小道弧線＋一個亮點 */
        const hx = 4 + v * 2, hy = 4 + (v & 1) * 5;
        if (ink(hx, hy) && ink(hx + 3, hy - 1)) { R(hx, hy, 1, 1, '#8f8bdc'); R(hx + 1, hy - 1, 2, 1, '#8f8bdc'); R(hx + 3, hy, 1, 1, '#8f8bdc'); }
        if (ink(10 - v, 10)) R(10 - v, 10, 1, 1, '#cfccff');
        break;
      }
      case 'g':
        if (theme === 'school') {   // 國中：散落的考卷堆
          R(0, 0, 16, 16, T.floor);
          for (const [x, y, w2, h2] of [[1, 2, 7, 5], [7, 1, 8, 6], [2, 8, 8, 6], [9, 9, 6, 6]]) { R(x, y, w2, h2, '#fbfaf4'); R(x, y + h2 - 1, w2, 1, '#c8c4b4'); R(x + 1, y + 1, w2 - 2, 1, '#9ab0d0'); R(x + 1, y + 3, w2 - 3, 1, '#9ab0d0'); }
          R(3, 10, 2, 1, '#e04a4a'); R(11, 3, 1, 2, '#e04a4a'); R(4, 4, 1, 1, '#16120e'); R(12, 11, 2, 2, '#16120e');
          break;
        }
        /* 底：一般地圖是草地；街道這種鋪面地圖要先鋪一塊植栽土，
           不然草會看起來像從水泥地裡長出來的 */
        if (T.grassBed) { R(0, 0, 16, 16, T.grassBed);
          for (let i = 0; i < 9; i++) { const v = hash(i + fr * 3, 19); R(v % 16, (v >>> 4) % 16, 2, 1, adj(T.grassBed, (v >>> 9) & 1 ? .10 : -.12)); } }
        else ground(fr);                              // 底下先鋪一般草地，長草叢再長在上面
        {
          const dk = T.tall3 || '#276a2a', md = T.tall || '#3f9a3a', lt = T.tall2 || '#86d860';
          const CLUMPS = [[[2, 13], [8, 15], [13, 12]], [[4, 15], [11, 14], [14, 10]],
                          [[1, 12], [7, 14], [12, 15]], [[5, 12], [10, 15], [15, 13]]][fr & 3];
          for (const [bx, by] of CLUMPS) {          // 一叢草＝五片高低不一的葉子
            for (const [dx, h0, c] of [[-2, 4, dk], [-1, 6, md], [0, 8, lt], [1, 6, md], [2, 4, dk]]) {
              const x = bx + dx; if (x < 0 || x > 15) continue;
              R(x, by - h0, 1, h0, c);
              if (h0 > 5) R(x + (dx < 0 ? -1 : 1), by - h0, 1, 1, c);   // 葉尖往外彎
            }
            R(bx - 2, by, 5, 1, dk);
          }
        }
        break;
      case 'T':
        if (T.grassBed) { R(0, 0, 16, 16, T.grassBed);
          for (let i = 0; i < 7; i++) { const v = hash(i + 11, 19); R(v % 16, (v >>> 4) % 16, 2, 1, adj(T.grassBed, -.10)); } }
        else base();
        if (T.treeStyle === 'bamboo') {
          R(0, 0, 16, 16, '#2e4a22');
          for (const [x, o] of [[1, 0], [6, 5], [11, 2]]) { R(x, 0, 3, 16, '#8ab858'); R(x, 0, 1, 16, '#b8dc80'); R(x + 2, 0, 1, 16, '#5a8a38'); R(x, (4 + o) % 16, 3, 1, '#3e6a2a'); R(x, (11 + o) % 16, 3, 1, '#3e6a2a'); }
          for (const [x, y] of [[4, 3], [9, 9], [13, 6], [0, 12]]) { R(x, y, 3, 1, '#4e8a34'); R(x + 1, y - 1, 2, 1, '#4e8a34'); R(x + 2, y + 1, 1, 1, '#4e8a34'); }
        } else {
          /* 樹冠畫滿整格、左右不留縫，整排排起來就是一片密實的樹牆 */
          R(0, 0, 16, 13, T.leaf);
          R(0, 0, 16, 2, T.leaf3);                                   // 上緣壓深，做出前後層次
          R(0, 11, 16, 2, T.leaf3);                                  // 下緣陰影
          for (const [x, y, w2, h2] of [[1, 2, 5, 4], [9, 3, 5, 3], [4, 7, 6, 3], [11, 8, 4, 3]])
            R(x, y, w2, h2, T.leaf2);                                // 受光的葉團
          for (const [x, y] of [[3, 5], [8, 2], [13, 6], [6, 10], [12, 4], [2, 9]])
            R(x, y, 2, 2, T.leaf3);                                  // 暗處的空隙
          R(6, 13, 4, 3, T.trunk); R(6, 13, 1, 3, adj(T.trunk, .2)); // 樹幹只露一小截
          R(5, 15, 6, 1, adj(T.trunk, -.35));
          if (T.treeStyle === 'willow') for (const x of [2, 5, 10, 13]) R(x, 10, 1, 4, T.leaf3);
        }
        break;
      case '~': {                                   // 水面：每格不同的深淺與波紋，靠岸那一側再鋪淺灘
        const wf = fr & 3, m = (fr >> 2) & 15, v = (fr >> 6) & 3, o = wf * 4;
        /* wf＝波浪動畫、m＝上右下左哪一邊不是水、v＝由座標決定的變化，
           沒有 v 的話一大片水會每一格長得一模一樣，貼磚的格線看得清清楚楚 */
        R(0, 0, 16, 16, T.water);
        const dp = adj(T.water, -.09), lt = adj(T.water, .21);
        for (const [x, y, w2, h2] of [[[0, 5, 8, 6], [9, 0, 7, 5]], [[3, 2, 9, 5], [0, 11, 7, 5]],
                                      [[6, 7, 10, 6], [0, 0, 6, 4]], [[2, 9, 8, 5], [8, 2, 7, 6]]][v])
          R(x, y, w2, h2, dp);
        for (const [x, y, w2] of [[[2, 4, 5], [9, 11, 4]], [[5, 2, 4], [1, 12, 6]],
                                  [[8, 6, 5], [3, 13, 4]], [[0, 8, 6], [11, 3, 4]]][v])
          R((x + o) % 16, y, w2, 1, lt);
        if (m) {                                      // 靠岸的那一側：淺灘＋貼著岸邊的浪花
          const sh = adj(T.water, .17), fm = T.water2;
          if (m & 1) { R(0, 0, 16, 2, sh); R((2 + o) % 11, 0, 5, 1, fm); }
          if (m & 2) { R(14, 0, 2, 16, sh); R(15, (3 + o + v) % 11, 1, 5, fm); }
          if (m & 4) { R(0, 14, 16, 2, sh); R((5 + o + v) % 11, 15, 5, 1, fm); }
          if (m & 8) { R(0, 0, 2, 16, sh); R(0, (6 + o + v) % 11, 1, 5, fm); }
        }
        break;
      }
      case '#': {                                   // 牆：上緣接屋簷陰影、中段粉牆斑駁、下緣牆基
        const w = T.wall, lo = T.wall2, dk = adj(T.wall2, -.28), hi = adj(T.wall, .07);
        R(0, 0, 16, 16, w);
        R(0, 0, 16, 2, adj(w, -.15));                                     // 屋簷投在牆上的陰影
        R(0, 2, 16, 1, hi);                                               // 陰影正下方的受光線
        for (let i = 0; i < 5; i++) { const v = hash(i + fr * 6, 11); R(1 + v % 13, 3 + (v >>> 4) % 9, 2, 1, adj(w, -.05)); }
        if (theme === 'wuxia') { for (const x of [0, 5, 10, 15]) R(x, 2, 1, 14, lo); }      // 木構直柱
        else if (theme === 'literati') { R(0, 11, 16, 5, lo); R(0, 11, 16, 1, dk); }        // 磚砌牆裙
        else { R(0, 8, 16, 1, lo); }                                                        // 腰帶
        R(0, 14, 16, 2, lo); R(0, 14, 16, 1, dk);                         // 牆基
        break;
      }
      case 'W': tileDraw(g, 'wall', T, theme);      // 窗：木框＋玻璃反光＋下緣窗台
        {
          const fm = adj(T.wall2, -.18), sill = adj(T.wall2, .14);
          R(2, 2, 12, 11, fm);
          R(3, 3, 10, 9, T.win2); R(3, 3, 10, 8, T.win);
          R(3, 3, 10, 2, adj(T.win, .22));                                // 上緣天光
          if (theme === 'literati') { for (const x of [5, 8, 11]) R(x, 3, 1, 9, fm); for (const y of [6, 9]) R(3, y, 10, 1, fm); }
          else if (theme === 'wuxia') { R(8, 3, 1, 9, fm); R(3, 7, 10, 1, fm); }
          else { R(8, 3, 1, 9, fm); R(4, 4, 3, 2, 'rgba(255,255,255,.55)'); }
          R(1, 12, 14, 2, sill); R(1, 13, 14, 1, adj(T.wall2, -.30));     // 窗台與它的陰影
        }
        break;
      case 'D': tileDraw(g, 'wall', T, theme);      // 門：門框＋雙開門扇＋門檻
        {
          const fm = T.door2, d = T.door, dk = adj(T.door, -.34), hi = adj(T.door, .20);
          R(1, 1, 14, 15, fm); R(1, 1, 14, 1, adj(fm, .22));              // 門框
          R(2, 2, 12, 14, d); R(2, 2, 12, 1, hi);                         // 門扇與門楣受光
          if (theme === 'school') {                                       // 校舍：兩扇玻璃門
            for (const x0 of [3, 9]) { R(x0, 4, 4, 7, dk); R(x0 + 1, 5, 2, 5, '#e8f8ff'); R(x0 + 1, 5, 2, 1, '#ffffff'); }
          } else if (theme === 'literati') {                              // 文人宅：門釘
            for (let y = 4; y < 14; y += 3) for (const x of [4, 11]) R(x, y, 1, 1, fm);
          } else {                                                        // 木門：一扇上下各一塊門板
            for (const x0 of [2, 9]) { R(x0, 3, 5, 5, adj(d, .14)); R(x0, 9, 5, 5, adj(d, .06)); }
          }
          /* 中縫一定最後畫：先畫門板再畫縫，才不會被門板的橫線切成一個十字 */
          R(7, 2, 2, 14, dk);
          R(6, 9, 1, 2, fm); R(9, 9, 1, 2, fm);                           // 兩個門環
          R(1, 15, 14, 1, dk);                                            // 門檻
        }
        break;
      case 'R': roofTile(R, T, fr); break;
      case '=': base(); R(0, 5, 16, 2, T.fence); R(0, 10, 16, 2, T.fence); R(1, 3, 3, 11, T.fence); R(12, 3, 3, 11, T.fence); R(1, 13, 3, 1, T.fence2); R(12, 13, 3, 1, T.fence2); R(0, 7, 16, 1, T.fence2); R(0, 12, 16, 1, T.fence2); break;
      case 'S': base(); R(7, 9, 2, 6, '#7a5230'); R(2, 2, 12, 8, '#7a5230'); R(3, 3, 10, 6, '#c89858'); R(4, 5, 8, 1, '#7a5230'); R(4, 7, 6, 1, '#7a5230'); break;
      case 'F': base(); { const cs = T.flower; [[4, 4, 0], [11, 6, 1], [6, 11, 2], [12, 12, 0]].forEach(([x, y, i]) => { R(x - 1, y, 3, 1, cs[i]); R(x, y - 1, 1, 3, cs[i]); R(x, y, 1, 1, '#f8c830'); R(x, y + 2, 1, 2, '#3a8a3a'); }); } break;
      case 'L': base(); R(7, 6, 2, 9, '#40404a'); R(5, 14, 6, 2, '#40404a');
        if (theme === 'school') { R(4, 1, 8, 5, '#40404a'); R(5, 2, 6, 3, T.lamp); }
        else { R(4, 1, 8, 7, T.lamp); R(4, 1, 8, 1, '#40302a'); R(4, 7, 8, 1, '#40302a'); R(6, 3, 4, 3, '#f8d060'); }
        break;
      case '^': base(); R(2, 5, 12, 10, T.rock); R(4, 3, 8, 3, T.rock); R(4, 4, 4, 2, adj(T.rock, .3)); R(2, 13, 12, 2, adj(T.rock, -.3)); break;
      case 'q': base(); R(1, 3, 14, 12, '#4a4658'); R(1, 3, 14, 2, '#6a6480');   // 巨硯
        R(2, 5, 12, 9, '#332f42'); R(3, 6, 10, 7, '#1a1426');
        R(4, 7, 8, 5, '#0e0a18'); R(5, 8, 3, 1, '#6a58a0'); R(9, 10, 2, 1, '#8a78c0');
        R(1, 14, 14, 1, '#242030'); break;
      case '+': {                                   // 木板橋：橫向木板＋兩側欄杆
        R(0, 0, 16, 16, T.water); { const o = fr * 4; R((3 + o) % 16, 13, 4, 1, T.water2); }
        const w1 = '#a87a48', w2 = '#7e5730', w3 = '#c89a62', rail = '#6a4526';
        R(0, 2, 16, 12, w1);
        for (let y = 2; y < 14; y += 3) { R(0, y, 16, 1, w3); R(0, y + 2, 16, 1, w2); }
        for (const x of [3, 11]) R(x, 2, 1, 12, w2);              // 木板接縫
        R(0, 0, 16, 2, rail); R(0, 1, 16, 1, adj(rail, .25));      // 上欄杆
        R(0, 14, 16, 2, rail); R(0, 14, 16, 1, adj(rail, .25));    // 下欄杆
        for (const x of [1, 7, 13]) { R(x, 0, 2, 3, rail); R(x, 13, 2, 3, rail); }   // 欄杆柱
        break;
      }
      /* ---- 校園設施（2026-09 校園改版新增）----
         原則照舊：看起來像器材的一律走不過去，只有跑道 u 是地面。 */
      case 'u': {                                 // 跑道：紅色 PU。低四位＝邊線（鄰格算出來），高位＝雜訊變化
        R(0, 0, 16, 16, '#a8462f');
        const v0 = (fr >> 4) & 3;
        for (let i = 0; i < 14; i++) { const v = hash(i + v0 * 7, 29); R(v % 16, (v >>> 4) % 16, 1, 1, (v >>> 9) & 1 ? '#b25138' : '#993d29'); }
        /* 分道線要和跑的方向平行：
           左右都還是跑道 ＝ 橫向直道 → 畫橫線
           上下都還是跑道 ＝ 直向直道 → 畫直線
           （原本寫反了，橫向直道上會畫出一條條垂直的刻痕） */
        if (!(fr & 2) && !(fr & 8)) R(0, 15, 16, 1, '#c88a78');
        if (!(fr & 1) && !(fr & 4)) R(15, 0, 1, 16, '#c88a78');
        const LW = '#f2f4ea';
        if (fr & 1) R(0, 1, 16, 1, LW);
        if (fr & 2) R(14, 0, 1, 16, LW);
        if (fr & 4) R(0, 14, 16, 1, LW);
        if (fr & 8) R(1, 0, 1, 16, LW);
        break;
      }
      case 'a': base();                         // 籃球架
        R(7, 9, 2, 7, '#8a8a92'); R(7, 9, 1, 7, '#b4b4bc');
        R(4, 15, 8, 1, '#56565e');
        R(3, 1, 10, 8, '#d8d4c6'); R(3, 1, 10, 1, '#ffffff'); R(3, 8, 10, 1, '#a8a498');
        R(4, 2, 8, 5, '#f4f0e4'); R(6, 3, 4, 3, '#c85030');
        R(5, 9, 6, 1, '#e87a30'); R(5, 9, 1, 2, '#e87a30'); R(10, 9, 1, 2, '#e87a30');
        R(6, 11, 4, 2, '#f6f6f2'); R(7, 13, 2, 1, '#e0e0da');
        break;
      case 'v': base();                         // 排球網
        R(1, 1, 2, 14, '#8a8a92'); R(13, 1, 2, 14, '#8a8a92');
        R(1, 1, 1, 14, '#b4b4bc'); R(13, 1, 1, 14, '#b4b4bc');
        R(0, 2, 16, 2, '#f6f6f2'); R(0, 2, 16, 1, '#ffffff');
        for (let x = 3; x < 13; x += 2) R(x, 4, 1, 8, '#d4d4cc');
        for (let y = 4; y < 12; y += 2) R(3, y, 10, 1, '#d4d4cc');
        R(1, 15, 2, 1, '#4a4a52'); R(13, 15, 2, 1, '#4a4a52');
        break;
      case 'd': {                                 // 司令台：fr＝哪幾邊不是司令台（上右下左）
        base();
        const L0 = fr & 8, R0 = fr & 2;             // 左／右是不是邊緣
        R(0, 2, 16, 13, '#c4bdae'); R(0, 2, 16, 2, '#ddd7c8');   // 台面
        R(0, 8, 16, 1, '#a49d8e');                                // 台面與立面的分界
        R(0, 13, 16, 3, '#8a8376'); R(0, 13, 16, 1, '#a49d8e');   // 台基
        if (L0) { R(0, 2, 1, 13, '#a49d8e'); R(0, 9, 4, 6, '#9a9387'); for (let y = 9; y < 15; y += 2) R(0, y, 4, 1, '#b8b1a4'); }  // 左側台階
        if (R0) { R(15, 2, 1, 13, '#a49d8e'); R(12, 9, 4, 6, '#9a9387'); for (let y = 9; y < 15; y += 2) R(12, y, 4, 1, '#b8b1a4'); }
        break;
      }
      case '9': g.drawImage(tile(theme, 'd', 5), 0, 0);   // 司令台上的講桌（一座只擺一個，不要整排鋪）
        R(3, 3, 10, 7, '#8a6a44'); R(3, 3, 10, 1, '#a8855c'); R(3, 9, 10, 1, '#6a4e30');
        R(4, 5, 8, 2, '#c8a878'); R(4, 5, 8, 1, '#dcc094');
        R(7, 0, 1, 4, '#5a5a62'); R(6, 0, 3, 1, '#2a2a30');       // 麥克風
        break;
      case 'j': base();                         // 單槓／爬竿
        R(2, 3, 2, 12, '#8a8a92'); R(12, 3, 2, 12, '#8a8a92');
        R(2, 3, 1, 12, '#b4b4bc'); R(12, 3, 1, 12, '#b4b4bc');
        R(1, 2, 14, 2, '#c4c4cc'); R(1, 2, 14, 1, '#e4e4ec');
        R(1, 14, 3, 2, '#4a4a52'); R(12, 14, 3, 2, '#4a4a52');
        break;
      case 'l': R(0, 0, 16, 16, '#b4aea2');       // 觀眾席：一階一排座位
        for (let y = 0; y < 16; y += 5) {
          R(0, y, 16, 1, '#87826f');                                  // 階的陰影
          R(0, y + 1, 16, 1, '#c9c3b5');                              // 階的受光邊
          R(0, y + 2, 16, 3, '#aaa497');                              // 座位面
          for (let x = 3; x < 16; x += 5) R(x, y + 2, 1, 3, '#8f8a7c');  // 座位分隔
        }
        for (let i = 0; i < 4; i++) { const v = hash(i + (fr & 3) * 5, 13); R(v % 15, (v >>> 4) % 15, 2, 1, '#a79e90'); }
        break;
      case 'o': base();                         // 停好的腳踏車（正面看的一排車頭）
        R(0, 13, 16, 2, '#9a968c');                                   // 停車格的地面標線
        for (const [x0, col] of [[1, '#3a68b8'], [9, '#c83838']]) {
          R(x0, 2, 6, 1, '#70707a'); R(x0, 2, 1, 3, '#70707a'); R(x0 + 5, 2, 1, 3, '#70707a');   // 龍頭
          R(x0 + 1, 4, 4, 3, '#b0b0b8'); R(x0 + 1, 4, 4, 1, '#d0d0d8');                          // 前籃
          R(x0 + 2, 7, 2, 4, col); R(x0 + 2, 7, 1, 4, adj(col, .28));                            // 車身
          R(x0 + 1, 10, 4, 1, adj(col, -.3));                                                     // 座墊
          R(x0 + 2, 11, 2, 4, '#26262e'); R(x0 + 2, 11, 1, 4, '#44444e');                        // 前輪
          R(x0 + 1, 15, 4, 1, 'rgba(0,0,0,.3)');
        }
        break;
      case 'f': pave();   // 飲水機
        R(3, 3, 10, 12, '#b6bac2'); R(3, 3, 10, 2, '#d8dce4'); R(3, 14, 10, 1, '#70767e');
        R(4, 6, 8, 4, '#888e96'); R(5, 7, 6, 2, '#666c74');
        R(7, 10, 2, 2, '#e0e4ec'); R(6, 12, 4, 1, '#888e96');
        R(11, 5, 1, 1, '#6aa8e0');
        break;
      case 'z': pave();   // 置物櫃／掃具櫃
        R(0, 0, 16, 15, '#4a6a8a');
        for (const x0 of [0, 8]) {
          R(x0 + 1, 1, 6, 13, '#6288a8'); R(x0 + 1, 1, 6, 1, '#82a8c8');
          for (let y = 3; y < 7; y++) R(x0 + 2, y, 4, 1, '#4a6a8a');
          R(x0 + 5, 9, 1, 2, '#e0e4ec');
        }
        R(0, 14, 16, 2, '#32516e');
        break;
      case '1': pave();   // 陽台欄杆
        R(0, 2, 16, 2, '#d6d2c6'); R(0, 2, 16, 1, '#efebdf');
        R(0, 8, 16, 1, '#bebaae');
        for (let x = 1; x < 16; x += 3) R(x, 4, 1, 9, '#c6c2b6');
        R(0, 13, 16, 3, '#a6a298'); R(0, 13, 16, 1, '#bebaae');
        break;
      case '2': base();                         // 公佈欄／獎盃櫃
        R(6, 12, 1, 4, '#6a4a2a'); R(9, 12, 1, 4, '#6a4a2a');
        R(0, 1, 16, 12, '#7a5230'); R(1, 2, 14, 10, '#c8a878');
        for (const [x, y, w2, h2] of [[2, 3, 4, 4], [7, 3, 5, 3], [2, 8, 5, 3], [8, 7, 6, 4]]) { R(x, y, w2, h2, '#f8f4e8'); R(x, y, w2, 1, '#d6cebe'); R(x + 1, y + 1, w2 - 2, 1, '#b0a898'); }
        R(0, 12, 16, 1, '#523620');
        break;
      case '3': R(0, 0, 16, 16, '#c8bca4');       // 爬滿藤蔓的舊牆
        for (let i = 0; i < 7; i++) { const v = hash(i + (fr & 3) * 3, 31); R(v % 15, (v >>> 4) % 12, 2, 1, '#a89c84'); }
        for (const x of [1, 6, 10, 14]) { R(x, 0, 1, 16, '#3a6a38'); R(x + 1, 3, 1, 11, '#4c8a46'); }
        for (const [x, y] of [[2, 4], [7, 8], [11, 2], [14, 10], [4, 12], [12, 6], [8, 14]]) { R(x, y, 2, 2, '#5aa04c'); R(x, y, 1, 1, '#7cc266'); }
        break;
      case '4': base();                         // 施工圍籬（黃黑斜紋）
        R(0, 2, 16, 12, '#e8b830');
        for (let i = -16; i < 16; i += 6) for (let y = 2; y < 14; y++) { const x = i + (y - 2); if (x >= 0 && x < 16) R(x, y, 3, 1, '#2a2a30'); }
        R(0, 2, 16, 1, '#f8d860'); R(0, 13, 16, 1, '#a88420');
        R(1, 14, 2, 2, '#56565e'); R(13, 14, 2, 2, '#56565e');
        break;
      case '5': base();                         // 水塔
        R(3, 1, 10, 9, '#8ac0d8'); R(3, 1, 10, 2, '#b2dcee'); R(3, 9, 10, 1, '#5a90a8');
        for (let y = 4; y < 9; y += 2) R(3, y, 10, 1, '#78b0c8');
        R(6, 0, 4, 1, '#5a90a8');
        R(4, 10, 2, 5, '#8a8a92'); R(10, 10, 2, 5, '#8a8a92');
        R(7, 10, 2, 3, '#70767e');
        R(3, 15, 10, 1, '#56565e');
        break;
      case '6': {                                 // 資源回收桶（三色）
        pave();
        const BIN = ['#3e9830', '#e0b040', '#3a68b8'];
        BIN.forEach((c, i) => { const x = i * 5 + 1;
          R(x, 6, 4, 9, c); R(x, 6, 4, 1, adj(c, .3)); R(x, 14, 4, 1, adj(c, -.35));
          R(x - 1, 4, 6, 2, adj(c, -.18)); R(x + 1, 3, 2, 1, '#4a4a52'); });
        break;
      }
      case '7': g.drawImage(tile(theme, '#'), 0, 0);   // 走廊／禮堂的時鐘
        R(2, 2, 12, 12, '#3a3a44'); R(3, 3, 10, 10, '#f8f6ee'); R(3, 3, 10, 1, '#ffffff');
        for (const [x, y] of [[8, 4], [8, 11], [4, 8], [11, 8]]) R(x, y, 1, 1, '#6a6a74');
        R(8, 5, 1, 4, '#2a2a30');                 // 時針
        R(8, 8, 4, 1, '#c83838');                 // 分針
        R(7, 7, 2, 2, '#2a2a30');
        break;
      case '8': base();                         // 溫室（玻璃屋）
        R(0, 1, 16, 14, '#cfe4ea');
        for (let x = 0; x < 16; x += 5) R(x, 1, 1, 14, '#8aa8b0');
        for (let y = 1; y < 15; y += 5) R(0, y, 16, 1, '#8aa8b0');
        R(2, 3, 3, 2, '#ffffff'); R(10, 7, 3, 2, '#eaf6fa');
        for (const [x, y] of [[3, 10], [7, 11], [12, 9]]) { R(x, y, 2, 3, '#4a8a4a'); R(x, y, 1, 1, '#6aba5a'); }
        R(0, 14, 16, 2, '#7a9098');
        break;
      /* ---- 通學路（校外）---- */
      case '0': R(0, 0, 16, 16, T.path);          // 斑馬線
        for (let i = 0; i < 10; i++) { const v = hash(i + (fr & 3) * 5, 23); R(v % 16, (v >>> 4) % 16, 1, 1, adj(T.path, -.07)); }
        for (let x = 1; x < 16; x += 5) { R(x, 0, 3, 16, '#eceadf'); R(x, 0, 1, 16, '#ffffff'); }
        break;
      case '!': base();                          // 電線桿
        R(6, 0, 4, 16, '#9a8f7e'); R(6, 0, 1, 16, '#b8ad9a'); R(9, 0, 1, 16, '#7d7262');
        for (let y = 3; y < 16; y += 5) R(6, y, 4, 1, '#8a7f6e');
        R(1, 2, 14, 1, '#4a4a52'); R(2, 5, 12, 1, '#4a4a52');          // 橫擔
        R(3, 1, 1, 2, '#6a6a74'); R(12, 1, 1, 2, '#6a6a74');
        R(4, 7, 8, 4, '#6a6a74'); R(4, 7, 8, 1, '#8a8a94');            // 變壓器
        break;
      case '%': base();                          // 停在路邊的機車
        R(0, 13, 16, 2, adj(T.ground, -.12));
        for (const [x0, col] of [[1, '#c83838'], [9, '#3a68b8']]) {
          R(x0 + 1, 3, 4, 2, '#2a2a30'); R(x0, 4, 6, 1, '#4a4a52');     // 龍頭
          R(x0 + 1, 5, 4, 4, col); R(x0 + 1, 5, 4, 1, adj(col, .3));
          R(x0, 9, 6, 2, '#3a3a44'); R(x0 + 1, 11, 4, 4, '#26262e');    // 坐墊與前輪
          R(x0 + 2, 11, 1, 4, '#44444e');
          R(x0 + 1, 15, 4, 1, 'rgba(0,0,0,.3)');
        }
        break;
      case ';': {                                  // 車道分向線（自己擺，走得過去）
        g.drawImage(tile(theme, ',', fr & 3), 0, 0);
        const m = (fr >> 2) & 15;
        const vert = !(m & 1) && !(m & 4);           // 上下都還是分向線 ＝ 直向
        if (vert) { for (let y = 1; y < 16; y += 6) R(7, y, 2, 4, '#e8d46a'); }
        else { for (let x = 1; x < 16; x += 6) R(x, 7, 4, 2, '#e8d46a'); }
        break;
      }
      case ':': base();                          // 公車站牌
        R(7, 4, 2, 12, '#8a8a92'); R(7, 4, 1, 12, '#b0b0b8');
        R(5, 15, 6, 1, '#5a5a62');
        R(2, 0, 12, 6, '#2a68a8'); R(2, 0, 12, 1, '#4a8ac8'); R(2, 5, 12, 1, '#1c4a7c');
        R(3, 1, 10, 4, '#f4f2ea');
        R(4, 2, 8, 1, '#2a68a8'); R(4, 3, 5, 1, '#6a7682');
        break;
      case 'X': R(0, 0, 16, 16, '#16120e'); break;
      /* ---- 城鎮地標 ---- */
      case 'J': R(0, 0, 16, 16, '#d8c470'); R(0, 0, 16, 2, '#a8945a');             // 梯田
        for (let y = 3; y < 16; y += 4) { R(0, y, 16, 2, '#c8b060'); R(1, y, 14, 1, '#e8d890'); }
        R(0, 14, 16, 2, '#8a7a4a'); break;
      case 's': {                                   // 沙坑：細沙，看起來就是地面，走得過去
        R(0, 0, 16, 16, '#e7d3a4');
        for (let i = 0; i < 7; i++) { const v = hash(i + fr * 4, 3); R(v % 15, (v >>> 4) % 15, 2, 1, '#d8c294'); }
        for (const [x, y] of [[[3, 5], [11, 9]], [[6, 2], [2, 12]], [[9, 6], [13, 13]], [[1, 8], [7, 14]]][fr & 3])
          R(x, y, 3, 1, '#f2e2ba');                                       // 被耙過的淺痕
        break; }
      case 'U': {                                   // 鞦韆架：一格一座，明顯是器材，走不過去
        R(0, 0, 16, 16, '#e7d3a4');
        for (let i = 0; i < 5; i++) { const v = hash(i + 9, 3); R(v % 14, 10 + (v >>> 4) % 6, 2, 1, '#d8c294'); }
        R(1, 2, 2, 12, '#8a6a4a'); R(13, 2, 2, 12, '#8a6a4a');            // 兩根立柱
        R(1, 2, 1, 12, '#a88a64'); R(13, 2, 1, 12, '#a88a64');
        R(0, 0, 16, 3, '#6a4f36'); R(0, 0, 16, 1, '#a88a64');             // 橫樑
        R(5, 3, 1, 7, '#b8b0a0'); R(10, 3, 1, 7, '#b8b0a0');              // 吊鍊
        R(4, 10, 3, 2, '#c8503a'); R(9, 10, 3, 2, '#3a6ac8');             // 兩張座椅
        R(1, 14, 2, 1, '#5a4030'); R(13, 14, 2, 1, '#5a4030');            // 柱腳陰影
        break; }
      case 'K': {                                   // 球場：綠色ＰＵ硬地＋白邊線（fr＝哪幾邊不是球場）
        /* 要和旁邊的草皮明顯分開 —— 學校的籃球場排球場是硬地，不是草地 */
        R(0, 0, 16, 16, '#4e9470');
        for (let i = 0; i < 12; i++) { const v = hash(i + (fr & 3) * 7, 37);
          R(v % 16, (v >>> 4) % 16, 1, 1, (v >>> 9) & 1 ? '#56a07a' : '#468866'); }
        const L2 = '#f2f4ea';
        if (fr & 1) R(0, 1, 16, 1, L2);                              // 上邊線
        if (fr & 2) R(14, 0, 1, 16, L2);                             // 右邊線
        if (fr & 4) R(0, 14, 16, 1, L2);                             // 下邊線
        if (fr & 8) R(1, 0, 1, 16, L2);                              // 左邊線
        break; }
      case 'i': R(0, 0, 16, 16, '#c8c2b8'); R(0, 0, 16, 3, '#e0dcd2');             // 石階
        R(0, 5, 16, 1, '#9a948c'); R(0, 10, 16, 1, '#9a948c'); R(0, 15, 16, 1, '#8a847c'); break;
      case 'P': R(0, 10, 16, 6, '#3a9ad8'); R(0, 10, 16, 1, '#bfe8ff');            // 碼頭小船
        { const o = fr * 2; R((3 + o) % 16, 13, 4, 1, '#bfe8ff'); }
        R(3, 7, 10, 4, '#8a5a2a'); R(4, 8, 8, 2, '#b07a3a'); R(7, 1, 1, 6, '#6a4424');
        { const sail = [[8, 2], [13, 6], [8, 6]]; g.fillStyle = '#f4ecd8'; g.beginPath(); g.moveTo(8, 2); g.lineTo(13, 6); g.lineTo(8, 6); g.closePath(); g.fill(); } break;
      case 'E': R(0, 0, 16, 16, '#5a5a68');                                         // 鐘塔（有時鐘）
        R(0, 0, 16, 2, '#7a7a90'); R(2, 3, 12, 11, '#8a8a9c');
        { g.fillStyle = '#f4ecd8'; g.beginPath(); g.arc(8, 8, 4.5, 0, Math.PI * 2); g.fill(); }
        R(7, 4, 1, 5, '#2a2a34'); R(8, 8, 4, 1, '#2a2a34'); break;
      case 'I': base(); R(1, 2, 14, 3, '#a8463c'); R(0, 1, 16, 2, '#c85a4a');    // 牌坊／拱門
        R(2, 5, 3, 11, '#8a5a2a'); R(11, 5, 3, 11, '#8a5a2a');
        R(2, 8, 12, 1, '#a8463c'); break;
      /* ---- 三大公共建築（每個城鎮都一樣）---- */
      /* 彩瓦：紅＝補給站、藍＝商店、金＝道館。一律走 roofTile，
         招牌版（H／C／y）先鋪一樣的瓦，再把招牌掛上去，屋頂才不會兩種畫法對不起來。 */
      case 'h': roofTile(R, RED, fr); break;                                     // 紅瓦（補給站）
      case 'H': roofTile(R, RED, fr);                                            // 紅瓦＋白十字招牌
        R(3, 3, 10, 10, '#c8c0b4'); R(4, 4, 8, 8, '#f8f8f8'); R(4, 4, 8, 1, '#ffffff');
        R(7, 5, 2, 6, '#d83a3a'); R(5, 7, 6, 2, '#d83a3a'); break;
      case 'c': roofTile(R, BLUE, fr); break;                                    // 藍瓦（商店）
      case 'C': roofTile(R, BLUE, fr);                                           // 藍瓦＋商店招牌
        R(2, 3, 12, 10, '#c8bca4'); R(3, 4, 10, 8, '#f4ecd8'); R(3, 4, 10, 1, '#fffaf0');
        R(5, 6, 6, 5, '#e8a030'); R(5, 5, 6, 1, '#c07a20'); R(7, 3, 2, 2, '#c07a20'); break;
      case 'G': roofTile(R, GOLD, fr); break;                                    // 金瓦（道館）
      case 'y': roofTile(R, GOLD, fr);                                           // 金瓦＋匾額
        R(0, 3, 16, 10, '#6a2018'); R(1, 4, 14, 8, '#8a2a22'); R(1, 5, 14, 6, '#f0c040');
        R(1, 5, 14, 1, '#fadd80');
        R(2, 7, 3, 2, '#8a2a22'); R(7, 7, 3, 2, '#8a2a22'); R(12, 7, 3, 2, '#8a2a22'); break;
      /* ---- 室內裝飾 ---- */
      case 'x': R(0, 0, 16, 16, T.iwall || '#f4ecd8'); R(2, 0, 12, 15, '#e8dcc0');                   // 牆上掛軸
        R(2, 0, 12, 2, '#8a5a32'); R(2, 13, 12, 2, '#8a5a32'); R(3, 3, 10, 9, '#f6f0e2');
        R(5, 5, 6, 5, '#3a6a8a'); R(6, 6, 4, 3, '#6aa8c8'); R(4, 11, 3, 1, '#c83838'); break;
      case 'e': g.drawImage(tile(theme, '_'), 0, 0); R(1, 4, 14, 8, '#8a5a32');                      // 講桌
        R(1, 4, 14, 2, '#b07a44'); R(2, 12, 2, 4, '#6a4424'); R(12, 12, 2, 4, '#6a4424');
        R(5, 2, 6, 2, '#f4ecd8'); break;
      /* ---- 特別建築的屋頂與門牌 ---- */
      case 'N': base(); R(7, 8, 2, 7, '#6a4a32');                                                   // 門牌
        R(2, 3, 12, 6, '#e8dcc0'); R(2, 3, 12, 1, '#b8a888'); R(2, 8, 12, 1, '#b8a888');
        R(4, 5, 8, 1, '#6a5a44'); R(4, 7, 5, 1, '#6a5a44'); break;
      /* ---- 城鎮景物（地圖改版）---- */
      case 'Y': base();                                   // 竹叢
        for (const [x, h0] of [[3, 2], [7, 0], [11, 3]]) { R(x, h0, 2, 16 - h0, '#5a9a4a'); R(x, h0, 1, 16 - h0, '#86c86a'); for (let y = h0 + 3; y < 16; y += 4) R(x - 1, y, 4, 1, '#3a7a34'); }
        break;
      case 'Z': R(0, 0, 16, 16, '#7ac8d8'); R(0, 0, 16, 16, 'rgba(255,255,255,.10)');   // 湯池
        { const o = fr * 3; R((2 + o) % 16, 5, 6, 1, '#d8f4ff'); R((9 + o) % 16, 11, 5, 1, '#d8f4ff'); }
        R(0, 0, 16, 2, '#b8a890'); R(0, 14, 16, 2, '#b8a890'); break;
      case 'O': base(); R(4, 2, 8, 12, '#9a968c'); R(5, 3, 6, 10, '#b4b0a4');          // 石碑
        R(6, 5, 4, 1, '#6a6a64'); R(6, 7, 4, 1, '#6a6a64'); R(6, 9, 3, 1, '#6a6a64'); R(3, 13, 10, 2, '#7a766e'); break;
      case 'm': base(); R(1, 6, 14, 2, '#b8322a'); R(1, 5, 14, 1, '#d84a3a');          // 書攤／市集攤位
        R(2, 8, 12, 6, '#8a5a2a'); R(3, 9, 4, 4, '#e8dcc0'); R(8, 9, 4, 4, '#c8d8f0'); R(2, 13, 12, 1, '#6a4424'); break;
      case 'n': base(); R(7, 1, 2, 14, '#6a4a32');                                      // 布招／旗幟
        R(2, 2, 5, 8, '#c83838'); R(3, 3, 3, 1, '#f8f0e0'); R(3, 5, 3, 1, '#f8f0e0'); R(9, 2, 5, 8, '#3a68b8'); R(10, 4, 3, 1, '#f8f0e0'); break;
      case 'A': base(); R(1, 3, 14, 2, '#8a4a3a'); R(2, 1, 12, 2, '#a85a48');          // 涼亭／朗讀亭
        R(2, 5, 2, 10, '#8a6a4a'); R(12, 5, 2, 10, '#8a6a4a'); R(4, 12, 8, 2, '#c8b898'); break;
      case 'Q': base(); R(2, 4, 12, 10, '#a8763c'); R(3, 5, 10, 8, '#c8964c');         // 木箱堆
        R(3, 8, 10, 1, '#8a5a2a'); R(7, 5, 2, 8, '#8a5a2a'); R(2, 13, 12, 1, '#6a4424'); break;
      case 'M': g.drawImage(tile(theme, '_'), 0, 0); R(3, 1, 10, 13, '#8a8a92'); R(4, 2, 8, 11, '#a8a8b0'); R(5, 4, 6, 1, '#6a6a74'); R(5, 6, 6, 1, '#6a6a74'); R(5, 8, 4, 1, '#6a6a74'); R(2, 14, 12, 2, '#6a6a74'); break;
      case 'V': g.drawImage(tile(theme, '_'), 0, 0); R(3, 4, 10, 9, '#4a5a70'); R(4, 5, 8, 5, '#8ad0f0'); R(5, 6, 3, 1, '#f8f8f8'); R(4, 11, 8, 1, '#2a3648'); R(5, 13, 6, 2, '#2a3648'); break;
      case 'B': R(0, 0, 16, 16, T.iwall || '#f4ecd4'); R(0, 2, 16, 10, '#6a4424'); R(0, 3, 16, 8, '#2e5a3a'); R(2, 5, 5, 1, '#e8f0e0'); R(9, 7, 4, 1, '#e8f0e0'); R(0, 12, 16, 4, T.iwall2 || '#9ab8d8'); R(3, 11, 3, 1, '#f8f8f8'); break;
      case '_': {                                   // 室內地板：校舍是磨石子地磚，其餘是木地板
        const lo = T.floor2, hi = adj(T.floor, .07), dk = adj(T.floor2, -.14);
        R(0, 0, 16, 16, T.floor);
        /* 磨石子還是木地板由主題決定，不要用主題名字硬判 */
        if (T.floorStyle ? T.floorStyle === 'terrazzo' : theme === 'school') {
          R(0, 0, 16, 1, lo); R(0, 0, 1, 16, lo);                    // 磚縫
          R(1, 1, 15, 1, hi); R(1, 1, 1, 15, hi);                    // 縫旁受光
          for (let i = 0; i < 9; i++) { const v = hash(i + fr * 7, 21); R(2 + v % 13, 2 + (v >>> 4) % 13, 1, 1, (v >>> 9) & 1 ? hi : lo); }
        } else {
          const off = (fr & 1) ? 3 : 10;                             // 上下排的板頭錯開
          for (let y = 0; y < 16; y += 5) {
            R(0, y, 16, 1, dk);                                      // 板縫
            R(0, y + 1, 16, 1, hi);                                  // 板面上緣受光
            R((off + y) % 15, y + 1, 1, 4, lo);                      // 木板接頭
            for (let i = 0; i < 2; i++) { const v = hash(i + y + fr * 3, 5); R(v % 12, y + 2 + (v >>> 4) % 2, 3, 1, lo); }
          }
        }
        break;
      }
      case 'w': {                                   // 室內牆：只有「下面就是房間地板」的那一排才有護牆板
        R(0, 0, 16, 16, T.iwall);
        for (let i = 0; i < 4; i++) { const v = hash(i + fr * 5, 17); R(1 + v % 13, 1 + (v >>> 4) % 8, 2, 1, adj(T.iwall, -.05)); }
        if (fr & 1) { R(0, 10, 16, 6, T.iwall2); R(0, 10, 16, 1, adj(T.iwall2, -.30)); R(0, 15, 16, 1, adj(T.iwall2, -.40)); }
        if (fr & 2) { R(14, 0, 2, 16, adj(T.iwall, -.10)); R(15, 0, 1, 16, adj(T.iwall, -.22)); }   // 右邊是房間：右緣收邊
        if (fr & 4) { R(0, 0, 2, 16, adj(T.iwall, -.10)); R(0, 0, 1, 16, adj(T.iwall, -.22)); }     // 左邊是房間：左緣收邊
        break;
      }
      case 'r': g.drawImage(tile(theme, '_'), 0, 0); R(1, 1, 14, 14, '#a83838'); R(3, 3, 10, 10, '#c85a4a'); R(5, 5, 6, 6, '#e8c070'); R(7, 7, 2, 2, '#a83838'); break;
      case 'b': g.drawImage(tile(theme, '_'), 0, 0); R(1, 0, 14, 16, '#7a5230'); R(2, 1, 12, 14, '#f4f4f0'); R(2, 1, 12, 4, '#ffffff'); R(3, 2, 10, 2, '#dcdcdc'); R(2, 6, 12, 9, T.blanket); R(2, 6, 12, 1, adj(T.blanket, .25)); break;
      case 't': g.drawImage(tile(theme, '_'), 0, 0); R(0, 2, 16, 11, '#6a4424'); R(0, 2, 16, 7, '#b07a44'); R(0, 2, 16, 1, '#d09a60'); R(1, 13, 2, 3, '#4a2e18'); R(13, 13, 2, 3, '#4a2e18'); break;
      case 'k': R(0, 0, 16, 16, '#5a3a20'); for (const y of [1, 6, 11]) { R(1, y, 14, 4, '#3a2410'); [['#c83838', 1], ['#3a68b8', 3], ['#e0b040', 5], ['#3e9830', 8], ['#8a5ac8', 10], ['#e87a30', 12]].forEach(([c, x]) => R(1 + x, y + (x % 3 === 0 ? 1 : 0), 2, 4 - (x % 3 === 0 ? 1 : 0), c)); R(0, y + 4, 16, 1, '#7a5230'); } break;
      /* ---- 我的房間 ---- */
      case '[': g.drawImage(tile(theme, '_'), 0, 0);              // 書桌：攤開的課本＋檯燈
        R(0, 4, 16, 9, '#7a4c28'); R(0, 4, 16, 6, '#b07a44'); R(0, 4, 16, 1, '#d09a60'); R(0, 10, 16, 1, '#5a3418');
        R(1, 13, 2, 3, '#4a2e18'); R(13, 13, 2, 3, '#4a2e18');
        R(1, 5, 9, 4, '#f4f0e0'); R(5, 5, 1, 4, '#c8bea4');       // 課本
        for (const y of [6, 7]) { R(2, y, 2, 1, '#9a9488'); R(7, y, 2, 1, '#9a9488'); }
        R(12, 1, 1, 6, '#4a4a52'); R(10, 7, 5, 1, '#4a4a52');      // 檯燈
        R(10, 0, 5, 2, '#e8c040'); R(11, 2, 3, 1, '#fff2a8');
        break;
      case ']': g.drawImage(tile(theme, '_'), 0, 0);              // 床頭櫃＋鬧鐘
        R(1, 9, 14, 7, '#7a5230'); R(1, 9, 14, 2, '#a0703c'); R(3, 12, 10, 3, '#6a4424'); R(7, 13, 2, 1, '#e0c070');
        R(4, 0, 2, 2, '#e0c040'); R(10, 0, 2, 2, '#e0c040');       // 鈴鐺
        R(5, 1, 6, 8, '#c83838'); R(4, 2, 8, 6, '#c83838'); R(5, 8, 1, 1, '#5a1818'); R(10, 8, 1, 1, '#5a1818');
        R(5, 2, 6, 6, '#f8f6ee'); R(6, 2, 4, 1, '#ffffff');
        R(8, 3, 1, 2, '#2a2a30'); R(8, 5, 2, 1, '#2a2a30');        // 指針（玩家轉過之後由 clockHands 重畫）
        break;
      case '(': g.drawImage(tile(theme, '_'), 0, 0);              // 書包（准考證露出一角）
        R(4, 2, 1, 4, '#1a2a5a'); R(11, 2, 1, 4, '#1a2a5a');
        R(10, 3, 3, 3, '#f4f0e0'); R(10, 3, 3, 1, '#e8b0a0');
        R(3, 5, 10, 10, '#2a4a8a'); R(3, 5, 10, 5, '#3a5aa8'); R(3, 5, 10, 1, '#5a7ac8'); R(3, 14, 10, 1, '#1a2a5a');
        R(7, 8, 2, 2, '#e0c070');
        break;
      /* 樓梯（一格）：往下＝地板開一個口，台階一階比一階暗，消失在下面；往上＝台階一階比一階亮。
         兩側是木扶手與欄杆柱，一看就知道是樓梯口 */
      case '<': case '>': {
        g.drawImage(tile(theme, '_'), 0, 0);
        const down = code === '<';
        R(2, 0, 12, 16, '#5a3a20');                                         // 樓梯井
        for (let i = 0; i < 5; i++) {
          const y = 1 + i * 3, k = down ? i : 4 - i;                        // k：越大越暗
          R(3, y, 10, 3, adj('#c89058', -k * .16)); R(3, y, 10, 1, adj('#e0b078', -k * .16));
          R(3, y + 2, 10, 1, adj('#5a3a20', -k * .1));
        }
        if (down) { R(3, 13, 10, 3, '#2a1c14'); }                           // 往下：底部是暗的
        else { R(3, 0, 10, 2, '#f0d8b0'); }                                 // 往上：頂端有光
        R(1, 0, 2, 16, '#7a4c28'); R(13, 0, 2, 16, '#7a4c28');             // 扶手
        R(1, 0, 2, 1, '#a8763f'); R(13, 0, 2, 1, '#a8763f');
        for (const y of [3, 8, 13]) { R(1, y, 2, 2, '#4a2e18'); R(13, y, 2, 2, '#4a2e18'); }   // 欄杆柱
        break;
      }
      case ')': R(0, 0, 16, 16, '#6a4424');                         // 衣櫃
        R(1, 1, 7, 15, '#a0703c'); R(8, 1, 7, 15, '#a0703c'); R(1, 1, 14, 1, '#c08a50'); R(8, 1, 1, 15, '#6a4424');
        R(6, 7, 1, 3, '#e0c070'); R(9, 7, 1, 3, '#e0c070');
        break;
      case '/': g.drawImage(tile(theme, 'w', 1), 0, 0);           // 夜裡的窗（牆上）
        R(3, 1, 10, 9, '#5a4a3a'); R(4, 2, 8, 7, '#1a2448'); R(4, 2, 8, 2, '#24305a');
        R(9, 3, 2, 2, '#f0e8b0'); R(5, 5, 1, 1, '#c8d0f0'); R(7, 3, 1, 1, '#a8b0d8');
        R(8, 2, 1, 7, '#5a4a3a'); R(4, 5, 8, 1, '#5a4a3a');
        R(2, 1, 2, 10, '#c86a6a'); R(12, 1, 2, 10, '#c86a6a'); R(2, 1, 2, 1, '#e88a8a'); R(12, 1, 2, 1, '#e88a8a');
        break;
      case 'p': g.drawImage(tile(theme, '_'), 0, 0); R(5, 10, 6, 5, '#b8603a'); R(4, 9, 8, 2, '#d07a4a'); R(3, 2, 10, 8, '#3e9830'); R(5, 1, 6, 2, '#5ab84a'); R(4, 4, 3, 2, '#7ad86a'); break;
      default: base();
    }
    if (!skinPending) cache.set(key, cv); return cv;
  }
  function tileDraw(g, what, T, theme) { g.drawImage(tile(theme, '#'), 0, 0); }

  /* 畫一個像素橢圓（戰鬥場地） */
  function pxEllipse(g, cx, cy, rx, ry, col) { g.fillStyle = col; for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1); } }

  /* 把 canvas 複製成可放進 DOM 的像素圖 */
  function el(src, scale = 2, cls = '') { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); c.className = 'pix ' + cls; c.style.width = U(src.width * scale); c.style.height = U(src.height * scale); return c; }

  /* ---------- 武器圖示 16×16（依世界觀換配色） ---------- */
  const WPAL = {
    school: { a: '#f0c040', b: '#4a78c8', c: '#e8584a', m: '#c8d0dc' },
    literati: { a: '#8a5a32', b: '#2a2a34', c: '#c83a2a', m: '#e8e0c8' },
    wuxia: { a: '#b8c4d4', b: '#6a3a22', c: '#c8a040', m: '#e0e4ec' },
  };
  const WPARTS = {
    brush: [{ t: 'p', v: [[2, 13], [10, 5], [12, 7], [4, 15]], c: 'a' }, { t: 'p', v: [[10, 5], [14, 1], [12, 7]], c: 'b' }, { t: 'r', v: [3, 12, 2, 2], c: 'c' }],
    tome: [{ t: 'r', v: [3, 2, 11, 12], c: 'b' }, { t: 'r', v: [5, 3, 8, 10], c: 'm' }, { t: 'r', v: [3, 2, 2, 12], c: 'c' }, { t: 'r', v: [7, 5, 4, 1], c: 'b' }, { t: 'r', v: [7, 8, 4, 1], c: 'b' }],
    scroll: [{ t: 'r', v: [3, 4, 10, 8], c: 'm' }, { t: 'r', v: [1, 3, 3, 10], c: 'a' }, { t: 'r', v: [12, 3, 3, 10], c: 'a' }, { t: 'r', v: [5, 6, 6, 1], c: 'b' }, { t: 'r', v: [5, 9, 5, 1], c: 'b' }],
    fan: [{ t: 'p', v: [[8, 14], [1, 6], [3, 3], [8, 1], [13, 3], [15, 6]], c: 'm' }, { t: 'd', v: [[8, 13], [7, 11], [6, 9], [5, 7], [4, 5], [9, 11], [10, 9], [11, 7], [12, 5], [8, 11], [8, 9], [8, 7], [8, 5], [8, 3]], c: 'b' }, { t: 'r', v: [7, 13, 2, 2], c: 'c' }],
    seal: [{ t: 'e', v: [7, 7, 5, 5], c: 'a' }, { t: 'e', v: [7, 7, 3.2, 3.2], c: '#bfe4f8' }, { t: 'p', v: [[10, 10], [15, 14], [13, 16], [9, 12]], c: 'b' }, { t: 'd', v: [[5, 5]], c: '#ffffff' }],
    legend: [{ t: 'r', v: [7, 1, 3, 10], c: 'm' }, { t: 'r', v: [8, 1, 1, 10], c: '#ffffff' }, { t: 'r', v: [4, 10, 9, 2], c: 'c' }, { t: 'r', v: [7, 12, 3, 3], c: 'b' }],
  };
  const GFX_STAR = star(8, 8, 7.5, 2.5, 4);
  const SWORD = [{ t: 'p', v: [[4, 11], [12, 3], [14, 2], [13, 4], [5, 12]], c: 'm' }, { t: 'p', v: [[2, 10], [6, 14], [7, 13], [3, 9]], c: 'c' }, { t: 'p', v: [[1, 14], [3, 12], [4, 13], [2, 15]], c: 'b' }];
  const WOVR = {
    'school.scroll': [{ t: 'r', v: [3, 2, 11, 12], c: '#3a8a58' }, { t: 'r', v: [5, 3, 8, 10], c: 'm' }, { t: 'r', v: [3, 2, 2, 12], c: '#2a6a40' }, { t: 'r', v: [7, 5, 4, 1], c: '#3a8a58' }, { t: 'r', v: [7, 8, 3, 1], c: '#3a8a58' }],
    'school.fan': [{ t: 'p', v: [[2, 12], [10, 4], [13, 7], [5, 15]], c: '#f070b0' }, { t: 'p', v: [[10, 4], [13, 1], [15, 3], [13, 7]], c: '#f8e040' }, { t: 'r', v: [4, 11, 3, 2], c: '#ffffff' }],
    'literati.tome': [{ t: 'r', v: [2, 3, 12, 10], c: 'a' }, { t: 'r', v: [4, 3, 1, 10], c: '#5a3a1a' }, { t: 'r', v: [7, 3, 1, 10], c: '#5a3a1a' }, { t: 'r', v: [10, 3, 1, 10], c: '#5a3a1a' }, { t: 'r', v: [2, 5, 12, 1], c: 'c' }, { t: 'r', v: [2, 10, 12, 1], c: 'c' }],
    'literati.scroll': [{ t: 'p', v: [[1, 13], [13, 1], [15, 3], [3, 15]], c: '#6a9a58' }, { t: 'd', v: [[6, 9], [8, 7], [10, 5]], c: '#1a2a14' }, { t: 'r', v: [1, 13, 2, 3], c: 'c' }],
    'literati.seal': [{ t: 'r', v: [2, 4, 12, 9], c: '#4a4a52' }, { t: 'e', v: [8, 9, 4, 2.5], c: '#16161e' }, { t: 'r', v: [4, 5, 8, 2], c: '#6a6a74' }],
    'literati.legend': [{ t: 'p', v: [[5, 2], [11, 2], [11, 14], [5, 14]], c: '#1a1a22' }, { t: 'd', v: [[7, 5], [8, 5], [9, 5], [8, 7], [7, 9], [8, 9], [9, 9], [8, 11]], c: '#e0b040' }],
    'wuxia.tome': SWORD,
    'wuxia.scroll': [{ t: 'p', v: [[1, 7], [14, 2], [15, 5], [2, 11]], c: '#8a5a2a' }, { t: 'p', v: [[2, 8], [14, 3], [14, 3.6], [2, 8.6]], c: 'm' }, { t: 'p', v: [[2, 9.5], [14.5, 4.5], [14.5, 5.1], [2, 10.1]], c: 'm' }, { t: 'r', v: [12, 2, 2, 5], c: '#3a2410' }],
    'wuxia.seal': [{ t: 'p', v: [[2, 13], [11, 4], [12, 5], [3, 14]], c: 'b' }, { t: 'p', v: [[10, 3], [15, 1], [13, 6]], c: 'm' }, { t: 'p', v: [[1, 11], [4, 14], [2, 15], [0, 13]], c: '#c83838' }],
    'wuxia.legend': SWORD.map((q, i) => i === 1 ? Object.assign({}, q, { c: '#e0b040' }) : q),
  };
  /* 通用造型：a＝武器主色、b＝深色、c＝點綴、m＝亮色 */
  const SHAPES = {
    pen: WPARTS.brush, book: WPARTS.tome, scroll: WPARTS.scroll, fan: WPARTS.fan, lens: WPARTS.seal, sword: SWORD,
    flute: WOVR['literati.scroll'], zither: WOVR['wuxia.scroll'],
    ruler: [{ t: 'p', v: [[1, 11], [11, 1], [15, 5], [5, 15]], c: 'a' }, { t: 'd', v: [[4, 10], [6, 8], [8, 6], [10, 4], [5, 11], [9, 7]], c: 'b' }],
    block: [{ t: 'r', v: [2, 5, 12, 7], c: 'a' }, { t: 'r', v: [2, 5, 5, 7], c: 'c' }, { t: 'r', v: [3, 6, 3, 1], c: 'm' }],
    card: [{ t: 'r', v: [3, 1, 10, 14], c: 'b' }, { t: 'r', v: [4, 2, 8, 12], c: 'a' }, { t: 'r', v: [5, 3, 6, 10], c: 'm' }, { t: 'd', v: [[7, 5], [8, 5], [8, 6], [7, 7], [8, 8], [7, 9], [8, 10], [7, 11]], c: 'b' }],
    bell: [{ t: 'r', v: [7, 1, 2, 2], c: 'b' }, { t: 'p', v: [[5, 3], [11, 3], [13, 12], [3, 12]], c: 'a' }, { t: 'r', v: [2, 12, 12, 2], c: 'c' }, { t: 'e', v: [8, 14.5, 1.5, 1.5], c: 'b' }],
    orb: [{ t: 'e', v: [8, 8, 6.5, 6.5], c: 'a' }, { t: 'e', v: [6, 6, 2, 2], c: 'm' }, { t: 'r', v: [7, 0, 2, 2], c: 'b' }],
    ring: [{ t: 'e', v: [8, 8, 7, 7], c: 'a' }, { t: 'e', v: [8, 8, 4.2, 4.2], c: '_' }, { t: 'd', v: [[4, 4], [5, 3]], c: 'm' }],
    lamp: [{ t: 'r', v: [4, 2, 8, 1], c: 'b' }, { t: 'e', v: [8, 8, 5, 5.5], c: 'a' }, { t: 'e', v: [8, 8, 2, 3], c: '#fff4b0' }, { t: 'r', v: [4, 13, 8, 1], c: 'b' }, { t: 'r', v: [7, 14, 2, 2], c: 'c' }],
    dagger: [{ t: 'p', v: [[7, 1], [9, 1], [10, 9], [6, 9]], c: 'm' }, { t: 'r', v: [4, 9, 8, 2], c: 'c' }, { t: 'r', v: [7, 11, 2, 4], c: 'a' }],
    star: [{ t: 'p', v: GFX_STAR, c: 'm' }, { t: 'e', v: [8, 8, 1.6, 1.6], c: 'b' }],
    stick: [{ t: 'p', v: [[2, 13], [12, 3], [14, 5], [4, 15]], c: 'a' }, { t: 'p', v: [[10, 5], [12, 3], [14, 5], [12, 7]], c: 'c' }, { t: 'p', v: [[2, 13], [4, 11], [6, 13], [4, 15]], c: 'c' }],
    pipa: [{ t: 'e', v: [8, 10.5, 5, 5], c: 'a' }, { t: 'r', v: [7, 1, 2, 7], c: 'b' }, { t: 'r', v: [6, 1, 4, 2], c: 'c' }, { t: 'r', v: [7, 8, 1, 7], c: 'm' }, { t: 'r', v: [9, 8, 1, 7], c: 'm' }],
    tablet: [{ t: 'r', v: [3, 1, 10, 14], c: 'b' }, { t: 'r', v: [4, 2, 8, 11], c: 'a' }, { t: 'r', v: [5, 4, 6, 1], c: 'm' }, { t: 'r', v: [5, 7, 6, 1], c: 'm' }, { t: 'r', v: [7, 13, 2, 1], c: 'm' }],
    cup: [{ t: 'p', v: [[3, 2], [13, 2], [11, 9], [5, 9]], c: 'a' }, { t: 'r', v: [7, 9, 2, 3], c: 'a' }, { t: 'r', v: [4, 12, 8, 3], c: 'b' }, { t: 'd', v: [[5, 3], [5, 4]], c: 'm' }, { t: 'r', v: [1, 3, 2, 4], c: 'a' }, { t: 'r', v: [13, 3, 2, 4], c: 'a' }],
    abacus: [{ t: 'r', v: [1, 3, 14, 11], c: 'b' }, { t: 'r', v: [2, 4, 12, 9], c: 'm' }, { t: 'r', v: [2, 7, 12, 1], c: 'b' }, { t: 'd', v: [[3, 5], [6, 5], [9, 5], [12, 5], [4, 9], [7, 10], [10, 9], [12, 11], [5, 11], [8, 9]], c: 'a' }],
    whistle: [{ t: 'e', v: [6, 10, 4.5, 4], c: 'a' }, { t: 'r', v: [8, 6, 7, 4], c: 'a' }, { t: 'e', v: [6, 10, 1.6, 1.6], c: 'b' }, { t: 'r', v: [13, 6, 2, 4], c: 'c' }],
    compass: [{ t: 'p', v: [[7, 2], [9, 2], [4, 15], [3, 14]], c: 'm' }, { t: 'p', v: [[7, 2], [9, 2], [13, 14], [12, 15]], c: 'm' }, { t: 'e', v: [8, 3, 2, 2], c: 'a' }, { t: 'r', v: [3, 13, 2, 2], c: 'c' }],
    globe: [{ t: 'e', v: [8, 7, 6, 6], c: '#58a8e0' }, { t: 'd', v: [[5, 5], [6, 5], [6, 6], [9, 8], [10, 8], [10, 9], [8, 4]], c: '#4ab04a' }, { t: 'r', v: [7, 13, 2, 1], c: 'b' }, { t: 'r', v: [4, 14, 8, 2], c: 'a' }],
    glasses: [{ t: 'e', v: [4.5, 8, 3.5, 3], c: 'a' }, { t: 'e', v: [4.5, 8, 2.2, 1.8], c: '#c8e8f8' }, { t: 'e', v: [11.5, 8, 3.5, 3], c: 'a' }, { t: 'e', v: [11.5, 8, 2.2, 1.8], c: '#c8e8f8' }, { t: 'r', v: [7, 7, 2, 1], c: 'a' }],
    mic: [{ t: 'e', v: [9, 5, 4, 4], c: 'b' }, { t: 'e', v: [9, 5, 2.6, 2.6], c: 'm' }, { t: 'p', v: [[6, 8], [8, 10], [3, 15], [1, 13]], c: 'a' }],
    whip: [{ t: 'r', v: [2, 12, 3, 3], c: 'a' }, { t: 'r', v: [5, 9, 3, 3], c: 'm' }, { t: 'r', v: [8, 6, 3, 3], c: 'a' }, { t: 'r', v: [11, 3, 3, 3], c: 'm' }, { t: 'r', v: [13, 1, 2, 2], c: 'c' }],
  };
  function weapon(arch, theme) {
    const key = 'w:' + arch + theme; if (cache.has(key)) return cache.get(key);
    const qw = qart(arch + '_w');
    if (qw) { const n = qw.size || 16; const cv1 = toCanvas(n, n, raster(n, n, qw.parts, null)); cache.set(key, cv1); return cv1; }
    const A = ARCH[arch]; const special = !A.guardian && WOVR[theme + '.' + arch];
    const pal = Object.assign({}, WPAL[theme] || WPAL.school, special ? {} : { a: A.col });
    const cv = toCanvas(16, 16, raster(16, 16, special || SHAPES[A.shapes[theme]] || SHAPES.pen, pal));
    cache.set(key, cv); return cv;
  }
  /* 武器妖：把武器圖示放大成 32×32，加上眼睛、腳、腮紅 */
  const qart = k => (typeof QART !== 'undefined') && QART[k];
  /* 新畫風的妖怪圖（使用者生圖 → 處理，見 妖怪設計.md）：
     assets/monsters/<id>.png ＝ 戰鬥用 64×64、<id>_icon.png ＝ 圖鑑／標題用 32×32。
     哪些妖怪已經有新圖，寫在 data_game.js 的 MON_ART。圖還沒載入完就先畫舊的、不快取，載入後下一格自然換上。 */
  const MONIMG = {};
  const monImg = (k, icon) => { const f = k + (icon ? '_icon' : '') + '.png'; return MONIMG[f] || (MONIMG[f] = Object.assign(new Image(), { src: ASSET + '../monsters/' + f })); };
  const hasArt = k => typeof MON_ART !== 'undefined' && MON_ART.includes(k);
  const loaded = im => im.complete && im.naturalWidth > 0;
  function monBig(k) { if (!hasArt(k)) return null; const im = monImg(k, false); return loaded(im) ? im : null; }
  function weaponMon(monKey, theme) {
    const key = 'm:' + monKey; if (cache.has(key)) return cache.get(key);
    let pend = false;
    if (hasArt(monKey)) {
      const im = monImg(monKey, true);
      if (loaded(im)) { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); cache.set(key, c); return c; }
      pend = true;
    }
    const q = qart(monKey);
    if (q) { const cv0 = toCanvas(q.size || 32, q.size || 32, raster(q.size || 32, q.size || 32, q.parts, null)); if (!pend) cache.set(key, cv0); return cv0; }
    const M = monDef(monKey); const k = 1.6, ox = 16 - 8 * k, oy = 0;
    const src = SHAPES[M.shape] || SHAPES.pen; const P = [];
    for (const q of src) {
      if (q.t === 'e') P.push({ t: 'e', v: [q.v[0] * k + ox, q.v[1] * k + oy, q.v[2] * k, q.v[3] * k], c: q.c });
      else if (q.t === 'r') P.push({ t: 'r', v: [Math.round(q.v[0] * k + ox), Math.round(q.v[1] * k + oy), Math.round(q.v[2] * k), Math.round(q.v[3] * k)], c: q.c });
      else if (q.t === 'p') P.push({ t: 'p', v: q.v.map(([x, y]) => [x * k + ox, y * k + oy]), c: q.c });
      else if (q.t === 'd') for (const [x, y] of q.v) P.push({ t: 'r', v: [Math.round(x * k + ox), Math.round(y * k + oy), 2, 2], c: q.c });
    }
    P.push({ t: 'e', v: [10, 29.5, 3, 1.8], c: '#3a2a20' }, { t: 'e', v: [22, 29.5, 3, 1.8], c: '#3a2a20' });
    P.push({ t: 'e', v: [12.5, 14, 3, 3.3], c: '#ffffff' }, { t: 'e', v: [19.5, 14, 3, 3.3], c: '#ffffff' });
    P.push({ t: 'r', v: [12, 14, 2, 3], c: OUT }, { t: 'r', v: [19, 14, 2, 3], c: OUT }, { t: 'd', v: [[12, 14], [19, 14]], c: '#ffffff' });
    P.push({ t: 'r', v: [9, 18, 2, 1], c: '#f08080' }, { t: 'r', v: [21, 18, 2, 1], c: '#f08080' }, { t: 'r', v: [15, 19, 2, 1], c: OUT });
    const cv = toCanvas(32, 32, raster(32, 32, P, Object.assign({}, WPAL[theme] || WPAL.school, { a: M.col })));
    if (!pend) cache.set(key, cv); return cv;
  }
  /* 有動畫的劇情角色（使用者提供的造型，assets/sprites/）：
     big ＝ 戰鬥／過場用，每格 64×60；map ＝ 地圖用，每格 24×24（左右對稱、手點）。
     四格：0 原位、1 下沉、2 上浮、3 閉眼。圖還沒載入完回傳 null，呼叫端改用 special() 的舊圖。 */
  const SHEETS = {
    xiaomo: { big: [img('../sprites/xiaomo_big.png'), 64, 60], map: [img('../sprites/xiaomo_map.png'), 24, 24] },
  };
  /* 旋渦（夢中小鎮的入口）：24×24，八格旋轉，三條螺旋臂＋中心亮點 */
  function vortexFrame(f) {
    const key = 'vortex:' + f; if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas'); cv.width = 24; cv.height = 24; const g = cv.getContext('2d');
    const rg = g.createRadialGradient(12, 12, 1, 12, 12, 12); rg.addColorStop(0, 'rgba(232,220,255,.55)'); rg.addColorStop(1, 'rgba(120,90,220,0)'); g.fillStyle = rg; g.fillRect(0, 0, 24, 24);
    for (let arm = 0; arm < 3; arm++) for (let j = 0; j < 20; j++) {
      const r = .6 + j * .55, a = j * .5 + f * (Math.PI / 12) + arm * 2.094;
      g.fillStyle = j > 15 ? '#f4efff' : j > 9 ? '#b89cff' : j > 4 ? '#8a6af0' : '#5a3ab8';
      g.fillRect(Math.round(11 + Math.cos(a) * r), Math.round(11 + Math.sin(a) * r * .9), 2, 2);
    }
    g.fillStyle = '#ffffff'; g.fillRect(11, 11, 2, 2);
    cache.set(key, cv); return cv;
  }
  /* 攤開的書（圖書館夢中小鎮的入口）：Pixel Book (Animated)，Gokhan Solak，CC-BY 3.0（assets/book/LICENSE_pixel_book.txt）
     9 格 64×64：第 0 格靜止、1～8 格翻一頁。地圖上用 32×32（2×2 取一格，深色線條優先，才不會把外框吃掉）。 */
  const BOOK = img('../book/book_sheet.png'), BOOK_MAP = 24;                           // 地圖上的書預設 24×24（跟旋渦、小墨一樣大）；角色可用 look.size 指定
  /* 縮小到 n×n（n 可以不是整除）：每個目標點看原圖對應的一塊，有足夠深色就留深色線條，否則取最多的顏色 */
  function shrinkTo(src, n) {
    const out = document.createElement('canvas'); out.width = out.height = n;
    const W0 = src.width, sg = src.getContext('2d').getImageData(0, 0, W0, W0).data, og = out.getContext('2d'), od = og.createImageData(n, n), k = W0 / n;
    const lum = q => q[0] * .3 + q[1] * .59 + q[2] * .11;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const c = [];
      for (let yy = Math.floor(y * k); yy < Math.ceil((y + 1) * k); yy++) for (let xx = Math.floor(x * k); xx < Math.ceil((x + 1) * k); xx++) {
        const i = (yy * W0 + xx) * 4; if (sg[i + 3] > 40) c.push([sg[i], sg[i + 1], sg[i + 2]]); }
      const total = (Math.ceil((y + 1) * k) - Math.floor(y * k)) * (Math.ceil((x + 1) * k) - Math.floor(x * k));
      if (c.length < total * .45) continue;                                            // 邊角只沾到一點：不要，輪廓才乾淨
      const dark = c.filter(q => lum(q) < 70);
      let pick;
      if (dark.length >= Math.max(1, c.length * .3)) pick = dark.reduce((m, q) => lum(q) < lum(m) ? q : m);   // 有深色線條就留深色
      else { const cnt = new Map(); for (const q of c) { const key = q.map(v => v >> 4).join(','); const e = cnt.get(key) || [0, q]; e[0]++; cnt.set(key, e); } pick = [...cnt.values()].sort((a1, b1) => b1[0] - a1[0])[0][1]; }
      const i = (y * n + x) * 4; od.data[i] = pick[0]; od.data[i + 1] = pick[1]; od.data[i + 2] = pick[2]; od.data[i + 3] = 255;
    }
    og.putImageData(od, 0, 0); return out;
  }
  function bookFrame(f, size) {
    const key = 'book:' + f + ':' + size; if (cache.has(key)) return cache.get(key);
    if (!(BOOK.complete && BOOK.naturalWidth)) return null;                           // 圖還沒載入：先不畫
    const full = document.createElement('canvas'); full.width = full.height = 64;
    full.getContext('2d').drawImage(BOOK, f * 64, 0, 64, 64, 0, 0, 64, 64);
    const out = size === 64 ? full : shrinkTo(full, size); cache.set(key, out); return out;
  }
  function anim(kind, size, now) {
    if (kind === 'vortex') return vortexFrame(Math.floor(now / 90) % 8);
    if (kind === 'book') {                                                              // 靜止約 1.2 秒，再翻一頁（8 格 × 110ms）
      const t = now % 2080, f = t < 1200 ? 0 : Math.min(8, 1 + Math.floor((t - 1200) / 110));
      const N = size === 'big' ? 64 : typeof size === 'number' ? size : BOOK_MAP;                // size 可以直接給像素（入口 20、醒來 24）
      return bookFrame(f, N) || (cache.get('book:blank') || (cache.set('book:blank', Object.assign(document.createElement('canvas'), { width: 24, height: 24 })), cache.get('book:blank')));
    }
    const s = SHEETS[kind] && SHEETS[kind][size]; if (!s) return null;
    const [im, w, h] = s; if (!(im.complete && im.naturalWidth)) return null;
    const t = Math.floor(now / 170);
    const f = t % 28 >= 26 ? 3 : [0, 1, 0, 2][t % 4];            // 大約每 5 秒眨一次眼
    const key = 'anim:' + kind + size + f; if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(im, f * w, 0, w, h, 0, 0, w, h);
    cache.set(key, cv); return cv;
  }
  /* 劇情角色：小墨（水墨小精靈）、總複習大魔王（考卷與黑墨揉成的怪獸） */
  function special(kind) {
    const key = 'sp:' + kind; if (cache.has(key)) return cache.get(key);
    const q = qart(kind);
    if (q) { const n = q.size || 32; const cv0 = toCanvas(n, n, raster(n, n, q.parts, null), q.shade !== false); cache.set(key, cv0); return cv0; }
    let cv;
    if (kind === 'xiaomo') {
      cv = toCanvas(16, 16, raster(16, 16, [
        { t: 'p', v: [[5, 8], [8, 1], [11, 8]], c: '#2a2a3a' }, { t: 'e', v: [8, 10, 5, 4.5], c: '#2a2a3a' }, { t: 'e', v: [6, 7, 1.2, 1.5], c: '#5a5a78' },
        { t: 'r', v: [5, 9, 2, 2], c: '#ffffff' }, { t: 'r', v: [9, 9, 2, 2], c: '#ffffff' }, { t: 'd', v: [[6, 10], [10, 10]], c: OUT },
        { t: 'd', v: [[4, 12], [12, 12]], c: '#f08a8a' }, { t: 'd', v: [[7, 12], [8, 12]], c: '#f8f8f8' }, { t: 'd', v: [[2, 14], [14, 13]], c: '#2a2a3a' }], null), false);
    } else if (kind === 'stone') {          // 硯海龍君：硯台化成的器靈
      cv = toCanvas(32, 32, raster(32, 32, [
        { t: 'e', v: [16, 22, 14, 7], c: '#4a5a72' }, { t: 'e', v: [16, 21, 11, 5], c: '#2a3446' },
        { t: 'e', v: [16, 20, 8, 3.5], c: '#16203a' }, { t: 'r', v: [6, 22, 20, 4], c: '#5a6a84' },
        { t: 'p', v: [[8, 14], [16, 4], [24, 14]], c: '#3a4a64' },
        { t: 'e', v: [12, 12, 2.6, 2.6], c: '#f8f8f8' }, { t: 'e', v: [20, 12, 2.6, 2.6], c: '#f8f8f8' },
        { t: 'e', v: [12, 12, 1.2, 1.4], c: '#16120e' }, { t: 'e', v: [20, 12, 1.2, 1.4], c: '#16120e' },
        { t: 'd', v: [[7, 9], [25, 9], [6, 17], [26, 17]], c: '#8ad0f0' },
        { t: 'r', v: [14, 16, 4, 1], c: '#8ad0f0' }], null));
    } else {
      cv = toCanvas(32, 32, raster(32, 32, [
        { t: 'p', v: [[3, 28], [6, 8], [16, 2], [27, 7], [29, 28]], c: '#e8e2d0' },
        { t: 'p', v: [[6, 12], [14, 6], [12, 20]], c: '#d4ccb4' }, { t: 'p', v: [[20, 10], [27, 14], [22, 22]], c: '#d4ccb4' },
        { t: 'r', v: [8, 22, 16, 1], c: '#b8b0a0' }, { t: 'r', v: [9, 25, 14, 1], c: '#b8b0a0' }, { t: 'r', v: [7, 9, 6, 1], c: '#b8b0a0' },
        { t: 'e', v: [10, 6, 3, 2.5], c: '#16120e' }, { t: 'e', v: [24, 22, 3.5, 3], c: '#16120e' }, { t: 'e', v: [5, 20, 2, 3], c: '#16120e' }, { t: 'e', v: [27, 9, 2, 2], c: '#16120e' },
        { t: 'e', v: [11, 14, 3.5, 3], c: '#16120e' }, { t: 'e', v: [21, 14, 3.5, 3], c: '#16120e' }, { t: 'r', v: [10, 13, 2, 2], c: '#f03838' }, { t: 'r', v: [21, 13, 2, 2], c: '#f03838' },
        { t: 'p', v: [[10, 19], [22, 19], [20, 23], [18, 21], [16, 24], [14, 21], [12, 23]], c: '#16120e' },
        { t: 'd', v: [[13, 20], [15, 20], [17, 20], [19, 20]], c: '#f8f8f8' }], null));
    }
    cache.set(key, cv); return cv;
  }
  /* 草案預覽用：直接把 parts 畫成圖（不進遊戲流程） */
  function draft(key, sp) {
    const k = 'q:' + key; if (cache.has(k)) return cache.get(k);
    const n = sp.size || 32;
    const cv = toCanvas(n, n, raster(n, n, sp.parts, null));
    cache.set(k, cv); return cv;
  }
  /* 機關：題卷台（2026-10-06）。木製讀書台，上面攤著一卷題目，蓋著印；沒解開是紅印、解開是綠印。
     所有地圖的機關都畫這個（overworld 在機關那一格先鋪地面，再蓋上這張圖，未解開時另外加一圈光暈）。 */
  function devProp(solved) {
    const key = 'dev:' + (solved ? 1 : 0); if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas'); cv.width = cv.height = 16; const g = cv.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }, O = '#2a2018';
    R(3, 14, 10, 1, 'rgba(0,0,0,.25)');
    R(6, 10, 4, 4, O); R(7, 10, 2, 4, '#8a5a2a'); R(5, 14, 6, 1, O);                                   // 台腳
    R(1, 7, 14, 4, O); R(2, 8, 12, 2, '#b07a3c'); R(2, 8, 12, 1, '#d09a58'); R(2, 10, 12, 1, '#7a4a20');   // 斜面台
    R(2, 2, 12, 7, O); R(3, 3, 10, 5, '#f4e8c6'); R(3, 7, 10, 1, '#d8c490');                            // 卷面
    R(1, 3, 2, 5, O); R(2, 4, 1, 3, '#c8a860'); R(13, 3, 2, 5, O); R(13, 4, 1, 3, '#c8a860');          // 兩端的軸
    R(4, 4, 6, 1, '#6a5a40'); R(4, 6, 4, 1, '#6a5a40');                                                // 題目的字
    R(10, 5, 3, 3, solved ? '#2f7a4a' : '#c83830'); R(11, 6, 1, 1, solved ? '#9be8b0' : '#e8827a');     // 印
    cache.set(key, cv); return cv;
  }
  function chest(open) {
    const key = 'chest' + open; if (cache.has(key)) return cache.get(key);
    const S = RPG(550);                                              // Kenney 的鐵箍木箱；沒有打開的版本，開啟時把箱蓋換成黑色箱內
    if (!(S.im.complete && S.im.naturalWidth)) {                      // 圖還沒載入：先畫舊的，不快取
      const P = [{ t: 'r', v: [2, 6, 12, 8], c: '#8a5a2a' }, { t: 'r', v: [2, 4, 12, 4], c: '#a86a32' }, { t: 'r', v: [7, 7, 2, 3], c: '#f0d060' }];
      return toCanvas(16, 16, raster(16, 16, P, null));
    }
    const cv = document.createElement('canvas'); cv.width = cv.height = 16; const g = cv.getContext('2d');
    g.drawImage(S.im, S.sx, S.sy, 16, 16, 0, 0, 16, 16);
    if (open) {
      g.clearRect(0, 0, 16, 8);                                                       // 上半（箱蓋）拿掉
      g.drawImage(S.im, S.sx, S.sy + 8, 16, 8, 0, 8, 16, 8);                           // 下半原樣
      g.fillStyle = '#9aa0a4'; g.fillRect(1, 5, 14, 3); g.fillStyle = '#2a1c12'; g.fillRect(2, 6, 12, 2);   // 敞開的箱口
      g.fillStyle = '#c9a050'; g.fillRect(4, 7, 3, 1); g.fillRect(9, 7, 2, 1);        // 底下一點點金色
    }
    cache.set(key, cv); return cv;
  }


  /* ---------- 城鎮三大公共建築：整棟一張圖（3/4 斜視、跨多格） ---------- */
  const BPAL = {
    /* 配色貼近草圖：低彩度、暖木色、深色描邊 */
    clinic: { a: '#c0503e', b: '#8e3226', c: '#d9776a', d: '#5d1f16',
              wall: '#e8dcc0', wall2: '#c5b494', base: '#9a8a70', beam: '#6f4a2c',
              door: '#8a5634', door2: '#54341e', win: '#c6dce4', win2: '#7a94a0',
              sign: '#efe6d2', signEdge: '#a8987c', mark: '#b8382c', lamp: '#f0d8c8' },
    store:  { a: '#3f6a94', b: '#27455f', c: '#6d97bd', d: '#182b3c',
              wall: '#e8dcc0', wall2: '#c5b494', base: '#9a8a70', beam: '#6f4a2c',
              door: '#8a5634', door2: '#54341e', win: '#c6dce4', win2: '#7a94a0',
              sign: '#d8a63c', signEdge: '#8a6a24', mark: '#5a3e14', lamp: '#f2e0b8' },
    gym:    { a: '#c09a44', b: '#8a6a24', c: '#dcbc70', d: '#5a4414',
              wall: '#e4d8bc', wall2: '#c0b090', base: '#948468', beam: '#6a4424',
              door: '#8e3226', door2: '#4e1a12', win: '#e0cc9a', win2: '#94764a',
              sign: '#7a2a1e', signEdge: '#c8a040', mark: '#c8a040', lamp: '#f2ddb0' },
  };

  /* 一層屋頂：屋脊＋瓦面＋出簷瓦當 */
  function roofTier(R, P, x0, y0, w, h, ridge) {
    const eave = 3;                                   // 下緣往外出簷的像素
    if (ridge) {
      R(x0 + 5, y0, w - 10, 3, P.d);                  // 屋脊
      R(x0 + 6, y0 + 1, w - 12, 1, P.c);
      R(x0 + 2, y0 - 3, 4, 6, P.d); R(x0 + w - 6, y0 - 3, 4, 6, P.d);   // 兩端鴟吻
      R(x0 + 2, y0 - 3, 4, 1, P.b); R(x0 + w - 6, y0 - 3, 4, 1, P.b);
    }
    const top = y0 + (ridge ? 3 : 0), body = h - (ridge ? 3 : 0);
    for (let i = 0; i < body; i++) {
      const t = i / body;
      const out = Math.round(t * eave);
      const col = t < .18 ? P.c : t < .62 ? P.a : t < .88 ? P.b : P.d;
      R(x0 + 4 - out, top + i, w - 8 + out * 2, 1, col);
    }
    for (let x = x0 + 6; x < x0 + w - 6; x += 7) R(x, top, 1, body - 2, P.b);   // 瓦溝
    const by = y0 + h - 3, bw = w - 8 + eave * 2, bx = x0 + 4 - eave;
    R(bx - 1, by, bw + 2, 3, P.d);                    // 簷口
    for (let x = bx + 1; x < bx + bw; x += 7) { R(x, by + 1, 3, 2, P.c); R(x + 1, by + 2, 1, 1, P.a); }  // 瓦當
  }

  /* 木格窗 */
  function winPane(R, P, x, y, w, h) {
    R(x - 1, y - 1, w + 2, h + 2, P.beam);
    R(x, y, w, h, P.win);
    R(x, y, w, Math.max(1, Math.round(h / 3)), adj(P.win, .25));
    for (let i = x + 2; i < x + w; i += 3) R(i, y, 1, h, P.win2);
    R(x, y + Math.round(h / 2), w, 1, P.win2);
  }

  function building(kind, theme = 'school') {
    const key = 'bld:' + kind + (kind === 'house' ? ':' + theme : ''); if (cache.has(key)) return cache.get(key);
    const gym = kind === 'gym', house = kind === 'house';
    const T = THEMES[theme] || THEMES.school;
    const P = house ? { a: T.roof, b: adj(T.roof, -.22), c: adj(T.roof, .28), d: adj(T.roof2, -.25),
                        wall: T.wall || '#f4ecd4', wall2: T.wall2 || '#c8bc9c', base: adj(T.wall2 || '#c8bc9c', -.25),
                        beam: T.trunk || '#8a5634', door: T.door || '#8a5a34', door2: adj(T.door || '#8a5a34', -.35),
                        win: T.win || '#bfe4f6', win2: adj(T.win || '#bfe4f6', -.35), lamp: '#ffe2dc' } : BPAL[kind];
    const shrine = kind === 'shrine', tower = kind === 'tower';
    const W = gym || tower ? 96 : shrine ? 48 : 80, H = tower ? 112 : gym ? 80 : shrine ? 48 : 64;
    const SH = 10;                                   // 底部多留一點畫布給落地陰影
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + SH;
    const g = cv.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    /* 先鋪落地陰影：往右下散開，讓房子「站」在地上而不是貼上去 */
    for (const [dy, a0, inset] of [[2, .10, 2], [4, .13, 4], [6, .10, 8], [8, .06, 14]]) {
      g.fillStyle = `rgba(28,24,40,${a0})`;
      g.fillRect(inset + 2, H - 4 + dy, W - inset * 2 + 4, 2);
    }
    g.fillStyle = 'rgba(28,24,40,.16)'; g.fillRect(W - 3, 14, 6, H - 14);      // 右側牆面投影

    if (tower) {
      /* 鐘塔：石造塔身＋大時鐘＋紅毯拱門（鐘塔台道館） */
      const K = { st: '#9aa0ac', st2: '#7b8290', st3: '#5e646f', dk: '#454a55',
                  gold: '#e0b83c', gold2: '#a5821c', red: '#a8302a', red2: '#74201c' };
      R(44, 0, 8, 10, K.gold2); R(45, 1, 6, 6, K.gold);                       // 旗桿與旗
      R(52, 2, 12, 7, K.red); R(52, 2, 12, 1, K.red2);
      R(34, 10, 28, 6, K.st3); R(36, 12, 24, 3, K.st2);                       // 塔尖底座
      R(30, 16, 36, 30, K.st); R(30, 16, 36, 2, adj(K.st, .2));               // 鐘樓
      for (const x of [33, 62]) R(x, 18, 2, 26, K.st2);
      { g.fillStyle = '#f6efdb'; g.beginPath(); g.arc(48, 30, 11, 0, 7); g.fill();
        g.fillStyle = K.dk; g.beginPath(); g.arc(48, 30, 11, 0, 7); g.lineWidth = 2; g.strokeStyle = K.gold2; g.stroke(); }
      R(47, 22, 2, 9, K.dk); R(48, 29, 8, 2, K.dk); R(47, 29, 3, 3, K.gold2); // 指針
      for (const [dx, dy] of [[0, -9], [9, 0], [0, 9], [-9, 0]]) R(48 + dx - 1, 30 + dy - 1, 2, 2, K.st3);
      R(26, 46, 44, 6, K.st3); R(28, 48, 40, 2, K.st2);                       // 出簷
      R(22, 52, 52, 60, K.st); R(22, 52, 52, 2, adj(K.st, .18));              // 塔身
      for (const x of [25, 45, 68]) R(x, 54, 3, 58, K.st2);                   // 壁柱
      for (const y of [58, 78]) for (const x of [31, 58]) {                   // 拱窗
        R(x, y, 7, 12, K.dk); R(x + 1, y + 1, 5, 10, '#2c3550'); R(x + 1, y + 1, 5, 3, '#4a6a9a');
      }
      R(30, 60, 12, 9, K.red); R(31, 61, 10, 7, K.gold);                      // 兩面校徽旗
      R(56, 60, 12, 9, K.red); R(57, 61, 10, 7, K.gold);
      R(38, 84, 20, 28, K.dk); R(40, 86, 16, 26, '#241d2c');                  // 拱門
      { g.fillStyle = K.dk; g.beginPath(); g.arc(48, 88, 10, Math.PI, 0); g.fill();
        g.fillStyle = '#241d2c'; g.beginPath(); g.arc(48, 88, 8, Math.PI, 0); g.fill(); }
      R(42, 92, 12, 20, K.red); R(43, 92, 10, 20, '#c04038');                 // 紅毯
      R(34, 106, 28, 3, '#c6bfae'); R(30, 109, 36, 3, '#aca591');             // 台階
    } else if (shrine) {
      /* 泉眼小祠：青瓦小屋＋黑洞洞的入口＋兩盞石燈 */
      const S = { a: '#5a6472', b: '#3a4250', c: '#8e98a6', d: '#242a36' };
      roofTier(R, S, 4, 2, 40, 18, true);
      R(8, 20, 32, 2, '#4a4038');
      R(9, 22, 30, 22, '#b8b4a8'); R(9, 22, 30, 2, '#d2cec2');
      for (const x of [9, 37]) R(x, 22, 2, 22, '#948f84');
      R(9, 41, 30, 3, '#7c776c');
      R(18, 26, 12, 18, '#171a22');                      // 門洞
      R(18, 26, 12, 2, '#0d0f15'); R(19, 30, 10, 12, '#22182c');
      R(22, 34, 4, 8, '#3a2050');                        // 裡面漾著墨光
      R(15, 24, 18, 3, '#8a2a22'); R(16, 25, 16, 1, '#e0b040');   // 小匾
      for (const x of [6, 39]) {                          // 石燈籠
        R(x, 30, 4, 12, '#9a958a'); R(x - 1, 27, 6, 4, '#8a857a');
        R(x, 28, 4, 2, '#f8e8a0'); R(x - 2, 25, 8, 2, '#7c776c');
      }
      for (const [x, y, w2] of [[13, 44, 22], [11, 46, 26]]) R(x, y, w2, 2, '#a09a8e');   // 台階
    } else if (gym) {
      /* 重簷歇山：上層小屋頂＋下層大屋頂 */
      roofTier(R, P, 20, 2, 56, 20, true);
      R(24, 22, 48, 4, P.wall2); R(24, 22, 48, 1, P.beam);       // 上下簷之間的短牆
      roofTier(R, P, 0, 24, 96, 22, false);
      R(2, 46, 92, 3, P.beam);                                   // 椽枋
      R(3, 49, 90, 31, P.wall); R(3, 49, 90, 2, adj(P.wall, .2));
      for (let x = 8; x < 90; x += 22) R(x, 49, 2, 31, P.wall2);  // 牆柱
      R(3, 76, 90, 4, P.base);                                   // 牆基
      /* 長匾額：紅底金框＋金字紋 */
      R(16, 52, 64, 14, P.signEdge); R(18, 54, 60, 10, P.sign);
      for (let i = 0; i < 4; i++) { const x = 24 + i * 14; R(x, 56, 7, 6, P.mark); R(x + 2, 58, 3, 2, P.sign); }
      /* 雙開門＋門釘 */
      R(32, 62, 32, 18, P.door2); R(34, 64, 13, 16, P.door); R(49, 64, 13, 16, P.door);
      R(47, 62, 2, 18, P.door2);
      for (let y = 67; y < 78; y += 4) for (const x of [38, 43, 53, 58]) R(x, y, 2, 2, P.mark);
      R(28, 76, 40, 4, '#cfc3a2'); R(26, 79, 44, 1, '#a89878');   // 台階
      /* 兩側燈籠 */
      for (const x of [22, 70]) { R(x, 52, 1, 6, P.beam); R(x - 3, 58, 7, 9, '#c0302a'); R(x - 2, 60, 5, 5, P.lamp); R(x - 3, 67, 7, 2, P.signEdge); }
    } else {
      roofTier(R, P, 0, 4, 80, 26, true);
      R(2, 30, 76, 3, P.beam);
      R(3, 33, 74, 27, P.wall); R(3, 33, 74, 2, adj(P.wall, .2));
      for (const x of [3, 38, 75]) R(x, 33, 2, 27, P.wall2);
      R(3, 57, 74, 3, P.base);
      winPane(R, P, 8, 38, 13, 11); winPane(R, P, 59, 38, 13, 11);
      if (house) {
        R(30, 34, 20, 3, P.beam);                                    // 門楣
        R(12, 20, 6, 10, adj(P.b, -.15)); R(12, 19, 6, 2, P.d);       // 煙囪
      } else if (kind === 'clinic') {
        R(28, 34, 24, 16, P.signEdge); R(29, 35, 22, 14, P.sign);   // 白底招牌
        R(38, 37, 4, 10, P.mark); R(35, 40, 10, 4, P.mark);          // 紅十字
      } else {
        R(26, 33, 28, 4, P.beam);                                    // 幌子橫桿
        R(29, 36, 22, 13, P.signEdge); R(30, 37, 20, 11, P.sign);    // 黃色貨牌
        R(34, 40, 12, 2, P.mark); R(34, 44, 8, 2, P.mark);
        R(6, 52, 9, 8, '#a8733e'); R(6, 52, 9, 2, '#d8a45a');        // 門口貨箱
        R(10, 54, 1, 6, '#7a4c22');
      }
      R(32, 46, 16, 18, P.door2); R(33, 47, 14, 17, P.door);
      R(33, 47, 14, 3, adj(P.door, .25)); R(44, 54, 2, 3, '#f0d878');  // 門環
      R(27, 60, 26, 3, '#cfc3a2'); R(25, 63, 30, 1, '#a89878');
      if (!house) for (const x of [26, 52]) { R(x, 36, 1, 5, P.beam); R(x - 2, 41, 5, 7, '#c0302a'); R(x - 1, 43, 3, 3, P.lamp); }
    }
    outlineBuilding(g, cv, W, H + SH);
    cache.set(key, cv); return cv;
  }

  /* ============================================================
     校園建築：整棟畫成一張圖，不是把同一塊 16×16 磚重複鋪
     ------------------------------------------------------------
     為什麼要這樣做：一個字元只能對應一張固定的磚，屋頂那格
     永遠不知道自己是不是角落，所以拼出來一定是平的、重複的。
     這裡直接在 96×80 的畫布上畫，弧形屋簷、轉角柱、招牌才做得出來。

     碰撞不放在這裡。建築宣告自己佔幾格（cells），地圖底下那塊
     一定要是走不過去的字元，門的位置一定要是門 —— 由 checker 擋著，
     兩份資料不會各走各的（那正是舊版空氣牆的來源）。
     ============================================================ */
  const CAMPUS = {
    /* style: 'hut' ＝ 斜屋頂的小房子（保健室、福利社）
              'block' ＝ 平屋頂的教學樓，兩層、外走廊、可以拉很長 */
    /* over: 1 ＝ 圖往上多畫一格。斜屋頂的尖端會蓋到上面那一格，
       但那一格仍然走得過去（走過去時人會被屋頂擋住一點，寶可夢也是這樣）。
       這樣 footprint 內就能完全塗滿，底下的磚不會透出來。 */
    clinic:  { style: 'hut', w: 6, h: 4, over: 1, door: [2, 3], name: '保健室',
      roof: '#c8443c', roof2: '#e0685c', roof3: '#8e2a26', mark: 'cross' },
    store:   { style: 'hut', w: 6, h: 4, over: 1, door: [2, 3], name: '福利社',
      roof: '#3a68b8', roof2: '#5a8ad8', roof3: '#244a8e', mark: 'shop' },
    /* 教學樓：門在正中央那一跨，左右各排教室。w 可以改，長短都畫得出來 */
    block:   { style: 'block', w: 12, h: 7, door: [5, 6], name: '教學樓', band: '#c8443c' },
    block8:  { style: 'block', w: 8,  h: 7, door: [3, 6], name: '教學樓（短）', band: '#c8443c' },
    lib8:    { style: 'block', w: 8,  h: 7, door: [3, 6], name: '圖書館', band: '#b8743c' },
    oldblock:{ style: 'block', w: 10, h: 7, door: [4, 6], name: '舊校舍', band: '#7a6a52', old: 1 },
    /* door: null ＝ 進不去的建築（警衛室、校門本來就不是給人進去的）。
       護欄會跳過門的檢查，stampProps 也不會蓋出 D。 */
    guard:   { style: 'guard', w: 3, h: 2, door: null, name: '警衛室' },
    /* 大禮堂（活動中心）：第五章的舞台。正面有門廊柱、大鐘與布條 */
    audi:    { style: 'audi', w: 12, h: 8, over: 1, door: [5, 7], name: '大禮堂' },
    /* 文藝教室（道館③）：中庭旁的小棟 */
    artroom: { style: 'block', w: 8, h: 6, door: [3, 5], name: '文藝教室', band: '#d8629a', kground: 't_campus' },
    /* ---- 通學路（校外）的店面與住宅。style 'shopfront' ＝ 騎樓店面 ---- */
    bfast:   { style: 'shopfront', w: 5, h: 4, over: 1, door: [2, 3], name: '早餐店',
      awn: '#e8a030', awn2: '#b87818', sign: '#f4f0e4', signInk: '#8a4a20' },
    cvs:     { style: 'shopfront', w: 6, h: 4, over: 1, door: [2, 3], name: '便利商店',
      awn: '#3aa06a', awn2: '#247a4c', sign: '#f4f0e4', signInk: '#1f6b46', glassy: 1 },
    flat:    { style: 'shopfront', w: 5, h: 5, over: 1, door: [2, 4], name: '公寓',
      awn: '#8a8a92', awn2: '#62626a', sign: null, floors: 2, shutter: 1 },
    gate:    { style: 'gate',  w: 6, h: 2, door: null, name: '校門' },
    /* 開著的校門：中間兩格走得過去（walk），通學路和校園靠它雙向相連 */
    gateopen:{ style: 'gate',  w: 6, h: 2, door: null, name: '校門（開著）', open: 1, walk: [[2, 0], [3, 0], [2, 1], [3, 1]] },
    /* 進不去的公寓：沒有門，一樓是鐵捲門 */
    flatx:   { style: 'shopfront', w: 5, h: 5, over: 1, door: null, name: '公寓',
      awn: '#8a8a92', awn2: '#62626a', sign: null, floors: 2, ground: 'home' },
    flaty:   { style: 'shopfront', w: 5, h: 5, over: 1, door: null, name: '公寓',
      awn: '#8a8a92', awn2: '#62626a', sign: null, floors: 2, ground: 'home' },
    /* 打烊的小店（進不去）：讓街景不要每棟都長一樣 */
    shopx:   { style: 'shopfront', w: 5, h: 5, over: 1, door: null, name: '小店（打烊）',
      awn: '#d85a4a', awn2: '#a03a2e', sign: '#f4f0e4', signInk: '#a03a2e', floors: 2, ground: 'closed' },
    /* 自己家：兩層樓的透天厝，木門＋小雨遮，一眼看得出是「家」 */
    house:   { style: 'house', w: 5, h: 5, over: 1, door: [2, 4], name: '我家' },
  };
  /* 教學樓／舊校舍：平屋頂、兩層、外走廊。
     重點是「長」但不能「重複」—— 兩端有樓梯間、正中央有大門與校名，
     中間的教室跨才是重複的，而且每一跨的窗戶開合不一樣。 */
  /* 進得去的門一律長這樣：深色門洞、一片拉開的玻璃門、亮色門楣、台階。
     以前的門是淺藍玻璃，跟窗戶長得一樣，玩家看不出哪裡能進去（2026-10-05 回饋）。 */
  function entrance(R, dx, dy, dw, bottom, wood) {
    const FR = wood ? '#4a2e18' : '#3a434e', LEAF = wood ? '#9a6a3e' : '#8fb8d0';
    R(dx - 3, dy - 4, dw + 6, bottom - dy + 4, FR);                    // 門框
    R(dx - 3, dy - 4, dw + 6, 3, wood ? '#c8a040' : '#e8c048');        // 門楣（亮色）
    R(dx, dy, dw, bottom - dy, '#221c2a');                              // 門洞（深）
    R(dx, bottom - 6, dw, 6, '#3c3038');                                // 門內地板透出一點光
    R(dx + 2, bottom - 4, dw - 4, 2, '#5a4a46');
    const lw = Math.round(dw * 0.38);                                   // 拉開到一邊的門片
    R(dx, dy, lw, bottom - dy, LEAF); R(dx, dy, lw, 3, adj(LEAF, .3));
    R(dx + lw - 1, dy, 1, bottom - dy, FR);
    R(dx + lw - 4, dy + Math.round((bottom - dy) * 0.45), 2, 5, wood ? '#e0b860' : '#2e3640');   // 門把
    R(dx - 6, bottom, dw + 12, 3, '#b8b0a0'); R(dx - 6, bottom, dw + 12, 1, '#e0d8c8');          // 台階
  }
  function campusBlock(C) {
    const W = C.w * 16, H = C.h * 16, SH = 8;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + SH;
    const g = cv.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const old = !!C.old;
    const CON = old ? '#b6ae9c' : '#d8d2c2';      // 水泥
    const CON2 = old ? '#948c7a' : '#b8b2a2';
    const CON3 = old ? '#6e6858' : '#9a9484';
    const TILE = old ? '#cdbfa2' : '#e8d8bc';     // 二丁掛磚
    const TILE2 = old ? '#ab9d80' : '#cfbfa2';
    const GLASS = old ? '#9ab0b8' : '#bfe0f2', GLASS2 = old ? '#6e848c' : '#7fb4d8';
    const FRAME = old ? '#6a7078' : '#8a9098';

    const ROOF_H = 30, F2 = 34, F2H = 34, SLAB = F2 + F2H, F1 = SLAB + 6, BASE = H - 6;

    R(4, H - 2, W - 8, SH, 'rgba(0,0,0,.20)');    // 落地陰影

    /* ---- 平屋頂：女兒牆圍一圈，裡面是水泥屋頂 ---- */
    R(0, 0, W, ROOF_H, CON2);
    R(3, 3, W - 6, ROOF_H - 6, CON);                       // 屋頂面
    for (let x = 10; x < W - 10; x += 24) R(x, 5, 1, ROOF_H - 10, CON2);   // 洩水溝
    R(0, 0, W, 3, adj(CON, .16));                          // 女兒牆上緣受光
    R(0, ROOF_H - 4, W, 4, CON3);                          // 女兒牆下緣壓深
    R(0, ROOF_H - 1, W, 1, 'rgba(0,0,0,.28)');
    /* 屋頂上的雜物：水塔與通風口，只擺一邊，不要對稱 */
    R(W - 26, 6, 12, 10, '#8ac0d8'); R(W - 26, 6, 12, 2, '#b2dcee'); R(W - 26, 15, 12, 1, '#5a90a8');
    R(W - 24, 16, 2, 5, CON3); R(W - 18, 16, 2, 5, CON3);
    for (const x of [12, 20]) { R(x, 8, 5, 5, CON3); R(x, 8, 5, 1, CON); }

    /* 女兒牆到二樓之間那一段：屋簷的厚度。沒填就會透出背景，屋頂看起來像浮著 */
    R(0, ROOF_H, W, F2 - ROOF_H, CON3);
    R(0, ROOF_H, W, 1, adj(CON3, .18));
    R(0, F2 - 1, W, 1, 'rgba(0,0,0,.30)');

    /* ---- 二樓：外走廊 ---- */
    R(0, F2, W, F2H, TILE);
    for (let y = F2 + 3; y < SLAB; y += 6) R(0, y, W, 1, TILE2);          // 二丁掛的橫縫
    R(0, F2, W, 2, 'rgba(0,0,0,.18)');                                     // 屋簷陰影
    /* 教室窗：每 32px 一跨，兩端留給樓梯間 */
    const bayL = 16, bayR = W - 16;
    for (let x = bayL + 4; x + 24 <= bayR - 4; x += 32) {
      R(x - 1, F2 + 8, 26, 16, FRAME);
      R(x, F2 + 9, 24, 14, GLASS2); R(x, F2 + 9, 24, 7, GLASS);
      R(x + 11, F2 + 9, 2, 14, FRAME);
      if (((x / 32) | 0) % 3 === 1) R(x + 13, F2 + 9, 10, 14, adj(GLASS, .18));   // 有的窗開著，不要每扇一樣
      R(x + 2, F2 + 11, 6, 3, '#eaf7ff');
    }
    /* 外走廊欄杆：整條，但上緣扶手是連續的，所以看起來是一條不是一格格 */
    R(0, SLAB - 12, W, 3, adj(CON, .10)); R(0, SLAB - 12, W, 1, adj(CON, .26));
    for (let x = 2; x < W; x += 4) R(x, SLAB - 9, 1, 7, CON2);
    R(0, SLAB - 3, W, 3, CON2);

    /* ---- 樓板 ---- */
    R(0, SLAB, W, 6, CON); R(0, SLAB, W, 1, adj(CON, .22)); R(0, SLAB + 5, W, 1, CON3);
    if (C.band) { R(0, SLAB + 2, W, 2, C.band); }                          // 學校常見的色帶

    /* ---- 一樓 ---- */
    R(0, F1, W, BASE - F1, TILE);
    for (let y = F1 + 3; y < BASE; y += 6) R(0, y, W, 1, TILE2);
    R(0, F1, W, 2, 'rgba(0,0,0,.16)');
    for (let x = bayL + 4; x + 24 <= bayR - 4; x += 32) {
      const dx2 = C.door[0] * 16;
      if (x < dx2 + 24 && x + 24 > dx2) continue;                          // 大門那一跨不放窗
      R(x - 1, F1 + 6, 26, 18, FRAME);
      R(x, F1 + 7, 24, 16, GLASS2); R(x, F1 + 7, 24, 8, GLASS);
      R(x + 11, F1 + 7, 2, 16, FRAME);
      R(x + 2, F1 + 9, 6, 3, '#eaf7ff');
      R(x - 2, F1 + 24, 28, 2, CON2);
    }

    /* ---- 兩端的樓梯間：整片實牆＋直長窗，讓長條建築有「端點」 ---- */
    for (const sx of [0, W - 16]) {
      R(sx, F2, 16, BASE - F2, CON);
      R(sx, F2, 16, 2, 'rgba(0,0,0,.18)');
      R(sx + (sx ? 0 : 15), F2, 1, BASE - F2, CON2);
      R(sx + 5, F2 + 8, 6, 20, FRAME); R(sx + 6, F2 + 9, 4, 18, GLASS2);
      R(sx + 6, F2 + 9, 4, 6, GLASS);
      R(sx + 5, F1 + 6, 6, 18, FRAME); R(sx + 6, F1 + 7, 4, 16, GLASS2);
      R(sx + 6, F1 + 7, 4, 5, GLASS);
    }

    /* ---- 正中央的大門與校名 ---- */
    {
      const dw = 26, dx = C.door[0] * 16 + 8 - dw / 2, dy = F1 + 4;
      R(dx - 6, SLAB - 2, dw + 12, 8, CON);                                // 門廊雨遮
      R(dx - 6, SLAB - 2, dw + 12, 1, adj(CON, .22));
      R(dx - 6, SLAB + 5, dw + 12, 1, CON3);
      R(dx - 4, F1 + 2, 3, BASE - F1 - 2, CON);                            // 門廊柱
      R(dx + dw + 1, F1 + 2, 3, BASE - F1 - 2, CON);
      entrance(R, dx, dy, dw, BASE - 1, false);
      /* 校名牌：掛在雨遮上方 */
      const sw = 34, sx2 = dx + dw / 2 - sw / 2;
      R(sx2 - 1, SLAB - 13, sw + 2, 11, CON3);
      R(sx2, SLAB - 12, sw, 9, old ? '#9a9080' : '#f6f2e4');
      for (let i = 0; i < 4; i++) R(sx2 + 4 + i * 8, SLAB - 10, 5, 5, old ? '#6e6858' : '#7a6a52');
      R(dx - 8, BASE, dw + 16, 4, CON2); R(dx - 8, BASE, dw + 16, 1, CON);  // 台階
    }

    /* ---- 牆基 ---- */
    R(0, BASE, W, H - BASE, CON2); R(0, H - 2, W, 2, CON3);
    return cv;
  }
  /* 警衛室：小小一間，重點是那扇大窗（警衛要看得到外面）。進不去。 */
  function campusGuard(C) {
    const W = C.w * 16, H = C.h * 16, SH = 6;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + SH;
    const g = cv.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    R(3, H - 2, W - 6, SH, 'rgba(0,0,0,.20)');
    const RH = 13;
    /* 斜屋頂。整個 footprint 一定要塗滿：透明的地方會讓底下蓋出來的
       實心磚透出來，屋頂看起來就會比房子還寬。 */
    for (let y = 0; y < RH; y++) { const t = y / RH;
      R(0, y, W, 1, t < 0.2 ? '#e0685c' : t > 0.74 ? '#8e2a26' : '#c8443c'); }
    for (let x = 6; x < W; x += 6) for (let y = 2; y < RH - 2; y++) R(x, y, 1, 1, '#ad3a33');
    R(0, RH, W, 2, '#8e2a26'); R(0, RH + 2, W, 2, '#5f1d1a'); R(0, RH + 4, W, 1, '#3d120f');   // 不透明，半透明的線底下沒東西會變成空洞
    /* 牆與大窗 */
    R(0, RH + 5, W, H - RH - 5, '#e8e2d4');
    R(0, RH + 5, W, 2, 'rgba(0,0,0,.16)');
    R(2, RH + 9, W - 4, 12, '#8a9098');
    R(3, RH + 10, W - 6, 10, '#7fb4d8'); R(3, RH + 10, W - 6, 5, '#bfe0f2');
    for (let x = 3 + 10; x < W - 4; x += 11) R(x, RH + 10, 1, 10, '#8a9098');
    R(5, RH + 12, 5, 3, '#eaf7ff');
    R(1, RH + 21, W - 2, 2, '#bdb5a2');                       // 窗台
    R(0, H - 3, W, 3, '#a8a296');
    return cv;
  }

  /* 校門：兩根門柱夾一道拉門。整個是實心的，通學路是單向的，進來就出不去。 */
  function campusGate(C) {
    const W = C.w * 16, H = C.h * 16, SH = 6;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + SH;
    const g = cv.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    R(3, H - 2, W - 6, SH, 'rgba(0,0,0,.22)');
    const PW = 18;
    /* footprint 內一定要塗滿，柱頂與燈都收進來，不能超出去 */
    /* 中間的拉門：直立鐵欄。open 的校門只在兩側各留一段（拉開了），中間兩格是空的、走得過去 */
    const spans = C.open ? [[PW, 14], [W - PW - 14, 14]] : [[PW, W - PW * 2]];
    for (const [sx, sw] of spans) {
      R(sx, 0, sw, H, '#6e7682');
      R(sx, 0, sw, 4, '#4e555f');                                // 門楣
      R(sx, 4, sw, 2, '#98a0ac');
      for (let x = sx + 3; x < sx + sw - 2; x += 5) R(x, 7, 2, H - 12, '#8a929e');
      R(sx, H - 5, sw, 3, '#4e555f');
      R(sx, H - 2, sw, 2, '#3a4048');
    }
    if (C.open) {                                               // 門上的拱形校名牌橫跨過去
      R(PW - 2, 0, W - PW * 2 + 4, 5, '#3a4048'); R(PW - 2, 0, W - PW * 2 + 4, 1, '#6e7682');
      const sw = 30, sx = W / 2 - sw / 2;
      R(sx, 0, sw, 6, '#f2eee2'); for (let i = 0; i < 4; i++) R(sx + 4 + i * 6, 1, 4, 4, '#2e4a7a');
    }
    /* 兩根門柱 */
    for (const px of [0, W - PW]) {
      R(px, 0, PW, H, '#c9c2b0');
      R(px, 7, 2, H - 7, '#e2dbc8');
      R(px + PW - 2, 7, 2, H - 7, '#a59e8c');
      for (let y = 12; y < H - 6; y += 7) R(px + 2, y, PW - 4, 1, '#b6af9d');        // 磚縫
      R(px, 0, PW, 7, '#b6af9d'); R(px, 0, PW, 2, '#dad3c0');                        // 柱頭
      R(px + PW / 2 - 3, 2, 6, 4, '#f4e8a0'); R(px + PW / 2 - 3, 2, 6, 1, '#fff6c8'); // 柱頂的燈
      R(px, H - 4, PW, 4, '#a59e8c'); R(px, H - 1, PW, 1, '#8a8478');                // 柱基
    }
    /* 左柱上的校名牌 */
    R(2, 10, PW - 4, 16, '#f2eee2');
    R(2, 10, PW - 4, 1, '#ffffff'); R(2, 25, PW - 4, 1, '#c9c2b0');
    for (let i = 0; i < 3; i++) R(5, 12 + i * 5, 8, 3, '#4a5a70');
    return cv;
  }

  /* 自己家（透天厝）：米色磁磚、鐵窗、一樓木門有小雨遮、門牌、兩盆花 */
  function houseFront(C) {
    const W = C.w * 16, OV = C.over || 0, H = (C.h + OV) * 16, SH = 8;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + SH;
    const g = cv.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    R(4, H - 2, W - 8, SH, 'rgba(0,0,0,.22)');
    /* 屋頂：鐵皮加蓋的斜屋頂（台灣透天的頂樓） */
    R(0, 0, W, 14, '#4a7a9a'); for (let x = 0; x < W; x += 4) R(x, 0, 2, 14, '#5a8aaa');
    R(0, 0, W, 2, '#7aa8c8'); R(0, 12, W, 3, '#2e5068');
    /* 牆：暖米色磁磚 */
    const WALL = '#eadcc0', WALL2 = '#d2c2a2';
    R(0, 15, W, H - 15, WALL);
    for (let y = 19; y < H - 4; y += 5) R(0, y, W, 1, WALL2);
    R(0, 15, W, 2, 'rgba(0,0,0,.16)');
    R(0, 15, 3, H - 15, WALL2); R(W - 3, 15, 3, H - 15, WALL2);
    /* 二樓、三樓的窗＋鐵窗 */
    for (const wy of [22, 46]) for (const wx of [8, W - 30]) {
      R(wx - 2, wy - 2, 26, 18, '#8a7a62');
      R(wx, wy, 22, 14, '#7fb4d8'); R(wx, wy, 22, 6, '#bfe0f2');
      for (let x = wx + 1; x < wx + 22; x += 4) R(x, wy - 1, 1, 16, '#4e555f');   // 鐵窗
      R(wx - 1, wy - 1, 24, 1, '#4e555f'); R(wx - 1, wy + 14, 24, 1, '#4e555f');
      R(wx - 3, wy + 16, 28, 2, WALL2);
    }
    /* 一樓：木門＋小雨遮 */
    const dw = 20, dx = C.door[0] * 16 + 8 - dw / 2, dy = H - 30;
    R(dx - 7, dy - 9, dw + 14, 5, '#c8443c'); R(dx - 7, dy - 9, dw + 14, 1, '#e0685c'); R(dx - 7, dy - 5, dw + 14, 2, '#8e2a26');   // 雨遮
    entrance(R, dx, dy, dw, H - 4, true);
    R(dx + dw + 6, dy + 2, 8, 5, '#3a68b8'); R(dx + dw + 7, dy + 3, 6, 1, '#eaf2ff');            // 門牌
    /* 門邊兩盆花 */
    for (const px of [dx - 14, dx + dw + 6]) {
      R(px + 1, H - 11, 8, 7, '#b8603a'); R(px, H - 12, 10, 2, '#d07a4a');
      R(px, H - 20, 10, 8, '#3e9830'); R(px + 2, H - 22, 6, 3, '#5ab84a'); R(px + 3, H - 19, 2, 2, '#f06a92');
    }
    /* 右邊：機車停在一樓的鐵窗前 */
    R(W - 22, H - 26, 16, 14, '#8a7a62'); R(W - 21, H - 25, 14, 12, '#7fb4d8');
    for (let x = W - 20; x < W - 7; x += 3) R(x, H - 26, 1, 14, '#4e555f');
    R(0, H - 2, W, 2, '#a8a296');
    return cv;
  }
  /* 騎樓店面／公寓：台灣街屋的樣子 —— 上面是住家，下面是店面，中間一道遮雨棚。
     footprint 內一定塗滿；屋頂的女兒牆往上超出一格（over: 1）。 */
  function shopFront(C) {
    const W = C.w * 16, OV = C.over || 0, H = (C.h + OV) * 16, SH = 8;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + SH;
    const g = cv.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const TILEC = '#ded5c2', TILE2 = '#bdb3a0', CON = '#cfc9bd', CON2 = '#a8a295', CON3 = '#847e72';
    const GLASS = '#bfe0f2', GLASS2 = '#7fb4d8', FRAME = '#8a9098';
    const floors = C.floors || 1;                       // 店面上面還有幾層住家
    const SHOP_H = 30;                                  // 一樓店面的高度
    const AWN = H - SHOP_H - 8;                         // 遮雨棚的位置
    R(4, H - 2, W - 8, SH, 'rgba(0,0,0,.22)');

    /* 屋頂女兒牆（超出的那一格） */
    R(0, 0, W, 12, CON2); R(2, 2, W - 4, 8, CON); R(0, 0, W, 2, adj(CON, .18));
    R(0, 10, W, 2, CON3);
    /* 樓上住家 */
    R(0, 12, W, AWN - 12, TILEC);
    for (let y = 15; y < AWN; y += 6) R(0, y, W, 1, TILE2);
    R(0, 12, W, 2, 'rgba(0,0,0,.16)');
    for (let f = 0; f < floors; f++) {
      const fy = 16 + f * Math.max(16, Math.floor((AWN - 18) / floors));
      if (fy + 12 > AWN) break;
      for (let x = 5; x + 12 <= W - 5; x += 18) {
        R(x - 1, fy - 1, 14, 12, FRAME);
        R(x, fy, 12, 10, GLASS2); R(x, fy, 12, 5, GLASS);
        R(x + 5, fy, 2, 10, FRAME); R(x + 1, fy + 1, 4, 2, '#eaf7ff');
        R(x - 2, fy + 11, 16, 2, CON2);                 // 窗台
      }
    }
    /* 遮雨棚：街屋最明顯的特徵。住家（ground: 'home'）沒有遮雨棚，只有一道水泥窗簷 */
    if (C.ground === 'home') {
      R(0, AWN, W, 9, TILEC); for (let y = AWN + 2; y < AWN + 9; y += 6) R(0, y, W, 1, TILE2);
      R(0, AWN + 5, W, 3, CON); R(0, AWN + 5, W, 1, adj(CON, .2)); R(0, AWN + 8, W, 1, CON3);
    } else {
      R(0, AWN, W, 7, C.awn2);
      for (let x = 0; x < W; x += 6) R(x, AWN, 3, 7, C.awn);
      R(0, AWN, W, 1, adj(C.awn, .28));
      R(0, AWN + 7, W, 2, adj(C.awn2, -.55));          // 不透明；半透明的線底下沒東西會變成空洞
    }
    /* 招牌：掛在遮雨棚上面 */
    if (C.sign) {
      const sw = Math.min(W - 12, 46), sx = Math.round((W - sw) / 2), sy = AWN - 13;
      R(sx - 1, sy - 1, sw + 2, 13, C.awn2);
      R(sx, sy, sw, 11, C.sign);
      for (let i = 0; i * 10 + 10 < sw; i++) R(sx + 5 + i * 10, sy + 3, 6, 6, C.signInk);
    }
    /* 一樓店面 */
    const SY = AWN + 9;
    R(0, SY, W, H - SY, CON);
    R(0, SY, W, 1, adj(CON, .20));
    R(0, SY, 4, H - SY, CON2); R(W - 4, SY, 4, H - SY, CON2);          // 騎樓柱
    R(3, SY, 1, H - SY, CON3); R(W - 4, SY, 1, H - SY, adj(CON, .2));
    const dw = 22, dx = C.door ? C.door[0] * 16 + 8 - dw / 2 : 0;
    if (C.ground === 'home') {                          // 一樓也是住家：拉上窗簾的窗、窗台花箱（進不去，所以不畫門）
      R(4, SY, W - 8, H - SY - 3, TILEC);
      for (let y = SY + 3; y < H - 4; y += 6) R(4, y, W - 8, 1, TILE2);
      const ww = Math.floor((W - 20) / 2);
      for (const wx of [8, W - 8 - ww]) {
        R(wx - 1, SY + 3, ww + 2, 15, FRAME);
        R(wx, SY + 4, ww, 13, GLASS2); R(wx, SY + 4, ww, 5, GLASS);
        R(wx, SY + 4, Math.floor(ww / 2) - 1, 13, '#e8d8a8'); R(wx + Math.ceil(ww / 2) + 1, SY + 4, Math.floor(ww / 2) - 1, 13, '#e8d8a8');   // 窗簾
        R(wx + Math.floor(ww / 2) - 1, SY + 4, 2, 13, FRAME);
        R(wx - 2, SY + 18, ww + 4, 4, '#8a5a34'); R(wx - 2, SY + 18, ww + 4, 1, '#a8763f');               // 花箱
        for (let x = wx; x < wx + ww; x += 4) { R(x, SY + 15, 3, 3, '#3e9830'); R(x + 1, SY + 14, 1, 1, ['#f06a92', '#ffd54a', '#ffffff'][(x >> 2) % 3]); }
      }
    } else if (C.ground === 'closed') {                 // 打烊的小店：玻璃櫥窗看得到貨架，掛著「休息中」，沒有門
      R(5, SY + 3, W - 10, H - SY - 7, FRAME);
      R(6, SY + 4, W - 12, H - SY - 9, '#5a6a78');
      for (let y = SY + 8; y < H - 6; y += 6) { R(7, y, W - 14, 1, '#8a7a62');
        for (let x = 8; x < W - 9; x += 5) R(x, y - 3, 3, 3, ['#e87a50', '#ffd54a', '#5ab84a', '#5a8ad8'][((x + y) >> 2) % 4]); }
      R(6, SY + 4, W - 12, 3, '#7a8a98');
      const bw = 20, bx = Math.round(W / 2 - bw / 2);
      R(bx + 4, SY + 3, 1, 4, '#4e555f'); R(bx + bw - 5, SY + 3, 1, 4, '#4e555f');
      R(bx, SY + 7, bw, 8, '#f4f0e4'); R(bx, SY + 7, bw, 1, '#ffffff');
      for (let i = 0; i < 3; i++) R(bx + 3 + i * 5, SY + 9, 4, 4, '#c8443c');                    // 休息中
    } else {                                            // 店面：整片落地玻璃＋中間的門
      R(5, SY + 3, W - 10, H - SY - 7, FRAME);
      R(6, SY + 4, W - 12, H - SY - 9, GLASS2);
      R(6, SY + 4, W - 12, Math.round((H - SY - 9) * 0.4), GLASS);
      for (let x = 6 + 13; x < W - 7; x += 13) R(x, SY + 4, 1, H - SY - 9, FRAME);
      if (C.glassy) { R(8, SY + 6, 7, 3, '#eaf7ff'); R(W - 18, SY + 10, 6, 3, '#dff1fb'); }
      if (C.door) entrance(R, dx, SY + 5, dw, H - 4, false);
    }
    R(0, H - 3, W, 3, CON2); R(0, H - 1, W, 1, CON3);
    return cv;
  }

  /* 大禮堂：整個校園最大的一棟。正面有門廊柱、大鐘、布條與大階梯。
     大鐘之後要接 G.flags.dreamClock（夢裡所有的鐘都停在玩家早上轉的那個時間），
     現在先畫成固定的時間。 */
  function campusAudi(C) {
    const W = C.w * 16, OV = C.over || 0, H = (C.h + OV) * 16, SH = 10;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + SH;
    const g = cv.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const ROOF = '#6e7686', ROOF2 = '#8e96a6', ROOF3 = '#484f5c';
    const WALL = '#ece6d8', WALL2 = '#cdc6b4', WALL3 = '#a39c8a';
    const COL = '#f4efe2', COL2 = '#d2cbb8';
    const RH = 46, BASE = H - 8;

    R(5, H - 2, W - 10, SH, 'rgba(0,0,0,.24)');

    /* 屋頂：中間高、兩側低的大跨距屋頂 */
    const inset = y => y >= 16 ? 0 : Math.round(9 * (1 - y / 16));
    for (let y = 0; y < RH; y++) {
      const i = inset(y), t = y / RH;
      R(i, y, W - i * 2, 1, t < 0.14 ? ROOF2 : t > 0.80 ? ROOF3 : ROOF);
    }
    for (let x = 10; x < W; x += 10) for (let y = 2; y < RH - 3; y++) { const i = inset(y); if (x > i && x < W - i - 1) R(x, y, 1, 1, adj(ROOF, -.14)); }
    R(0, RH, W, 3, ROOF3); R(0, RH, W, 1, adj(ROOF3, .26));
    R(0, RH + 3, W, 2, adj(ROOF3, -.45));

    /* 牆 */
    R(0, RH + 5, W, BASE - RH - 5, WALL);
    R(0, RH + 5, W, 2, 'rgba(0,0,0,.18)');
    for (let i = 0; i < 40; i++) { const v = hash(i, 13); R(v % W, RH + 9 + (v >>> 5) % (BASE - RH - 16), 2, 1, WALL2); }

    /* 兩側的高窗 */
    for (const wx of [8, W - 8 - 22]) {
      R(wx - 1, RH + 12, 24, 34, '#8a9098');
      R(wx, RH + 13, 22, 32, '#7fb4d8'); R(wx, RH + 13, 22, 14, '#bfe0f2');
      for (let x = wx + 7; x < wx + 22; x += 7) R(x, RH + 13, 1, 32, '#8a9098');
      R(wx, RH + 27, 22, 1, '#8a9098');
      R(wx + 2, RH + 15, 6, 4, '#eaf7ff');
      R(wx - 2, RH + 45, 26, 2, WALL2);
    }

    /* 中央門廊：四根柱子 + 山牆 */
    const px0 = Math.round(W / 2) - 36, pw = 72;
    R(px0 - 3, RH + 2, pw + 6, 10, WALL2); R(px0 - 3, RH + 2, pw + 6, 2, '#fbf7ea');   // 山牆
    for (let i = 0; i < 4; i++) {
      const cx = px0 + 4 + i * 21;
      R(cx, RH + 12, 9, BASE - RH - 14, COL);
      R(cx, RH + 12, 2, BASE - RH - 14, '#ffffff');
      R(cx + 7, RH + 12, 2, BASE - RH - 14, COL2);
      R(cx - 2, RH + 12, 13, 3, COL2); R(cx - 2, BASE - 5, 13, 5, COL2);
    }
    /* 大鐘：掛在山牆正中央 */
    {
      const cx = Math.round(W / 2), cy = RH - 12;
      R(cx - 13, cy - 13, 26, 26, '#3a3a44');
      R(cx - 11, cy - 11, 22, 22, '#f8f6ee'); R(cx - 11, cy - 11, 22, 2, '#ffffff');
      for (const [dx, dy] of [[0, -9], [0, 8], [-9, 0], [8, 0]]) R(cx + dx, cy + dy, 1, 1, '#6a6a74');
      R(cx, cy - 7, 1, 7, '#2a2a30');            // 時針
      R(cx, cy, 6, 1, '#c83838');                // 分針
      R(cx - 1, cy - 1, 2, 2, '#2a2a30');
    }
    /* 門：正中央的雙開大門 */
    {
      const dw = 30, dx = C.door[0] * 16 + 8 - dw / 2, dy = RH + 24;
      R(dx - 3, dy - 3, dw + 6, BASE - dy + 3, '#5a4a38');
      R(dx, dy, dw, BASE - dy, '#8a5a34'); R(dx, dy, dw, 3, '#a8763f');
      R(dx + dw / 2 - 1, dy, 2, BASE - dy, '#5a4a38');
      for (let y = dy + 8; y < BASE - 6; y += 9) for (const ox of [7, dw - 9]) R(dx + ox, y, 2, 2, '#d8b060');
      R(dx + dw / 2 - 7, dy + 20, 3, 7, '#d8b060'); R(dx + dw / 2 + 4, dy + 20, 3, 7, '#d8b060');
    }
    /* 布條：掛在門廊上方 */
    R(px0 + 6, RH + 14, pw - 12, 9, '#c0302a');
    R(px0 + 6, RH + 14, pw - 12, 2, '#e04a40');
    for (let i = 0; i < 5; i++) R(px0 + 14 + i * 11, RH + 17, 5, 4, '#f0d878');

    /* 牆基：先把整條鋪滿，再把階梯疊上去。
       只畫階梯那一段的話，兩側會留下沒塗到的格子（護欄會抓出來）。 */
    R(0, BASE, W, H - BASE, WALL2); R(0, BASE, W, 1, adj(WALL2, .18));
    /* 大階梯 */
    R(px0 - 8, BASE, pw + 16, 4, '#ddd7c8'); R(px0 - 8, BASE, pw + 16, 1, '#f4efe2');
    R(px0 - 12, BASE + 4, pw + 24, 4, '#cdc6b4');
    R(0, H - 1, W, 1, WALL3);
    return cv;
  }

  /* ============================================================
     建築外觀：Kenney RPG Urban Pack 拼出來（2026-10-05「繼續道路建築跟室內」）
     ------------------------------------------------------------
     KITS[kind](C) 回傳一個「由上往下、一列一列」的格子表，
     每格是一張素材或好幾張疊在一起（後面的疊在上面）。
     列數 ＝ h + over，寬 ＝ w；門一定要在 C.door 那一格（護欄會檢查 footprint 塗滿）。
     圖還沒載入完 → 先用原本程式畫的版本，不快取。
     ============================================================ */
  /* 屋頂九宮格（左上角在素材表的哪一格） */
  const K_ROOF = { beige: [URB, 0, 3], gray: [URB, 8, 0], grayb: [URB, 8, 3], lawn: [URB, 0, 0] };
  function kRoof(name, w, h) {
    if (name === 'red') {        // 紅色平屋頂（Modern City）：0,1 列是四個角，2/3 欄是上下左右邊
      return Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => {
        const t = y === 0, b = y === h - 1, l = x === 0, r = x === w - 1;
        const [c, rr] = t && l ? [0, 0] : t && r ? [1, 0] : b && l ? [0, 1] : b && r ? [1, 1] : t ? [2, 0] : b ? [2, 1] : l ? [3, 0] : r ? [3, 1] : [6, 0];
        return [MC(c, rr)];
      }));
    }
    const [S, c0, r0] = K_ROOF[name];
    return Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) =>
      [S(c0 + (x === 0 ? 0 : x === w - 1 ? 2 : 1), r0 + (y === 0 ? 0 : y === h - 1 ? 2 : 1))]));
  }
  /* 外牆：f ＝ 素材的第幾列（0 頂、1 樓層腰帶、2 素面、3 牆基），左右兩端有轉角磚 */
  function kWall(name, w, fs) {
    const r0 = { red: 0, orange: 4 }[name];
    return fs.map(f => Array.from({ length: w }, (_, x) => [URB(x === 0 ? 17 : x === w - 1 ? 19 : 18, r0 + f)]));
  }
  const kPut = (G, x, y, ...ps) => { for (const p of ps) G[y][x].push(p); return G; };
  const KP = {
    win: URB(12, 13), winBig: URB(13, 13), winWide: URB(13, 14), winArch: URB(12, 12), winGray: URB(13, 16),
    doorWood: URB(13, 10), doorWhite2: URB(15, 10), doorGray2: URB(15, 12), doorGlass: URB(14, 9),
    shop: [URB(8, 13), URB(9, 13), URB(10, 13)], shopG: [URB(8, 14), URB(9, 14), URB(10, 14)],
    awnG: [MC(24, 13), MC(25, 13), MC(26, 13)], awnO: [MC(27, 13), MC(28, 13), MC(29, 13)],
    signG: [MC(32, 4), MC(33, 4)],
    plant: MC(34, 12), bush: MC(31, 13),
    vent: MC(25, 14), vent2: MC(27, 14), ac: MC(28, 14),
  };
  /* 一整排：左端、中間（重複）、右端 */
  const kRun = (G, x0, x1, y, [l, m, r]) => { for (let x = x0; x <= x1; x++) G[y][x].push(x === x0 ? l : x === x1 ? r : m); return G; };
  const KITS = {
    /* 我家：米色屋頂、橘磚兩層樓、木門 */
    house: C => { const G = [...kRoof('beige', C.w, 2), ...kWall('orange', C.w, [0, 1, 2, 3])];
      kPut(G, 1, 2, KP.win); kPut(G, 3, 2, KP.win); kPut(G, 1, 4, KP.winBig); kPut(G, 3, 4, KP.winBig);
      kPut(G, 0, 5, KP.bush); kPut(G, C.w - 1, 5, KP.bush);
      kPut(G, C.door[0], 5, KP.doorWood); return G; },
    /* 公寓（進不去）：紅磚、窗戶排整齊，一樓也只有窗 —— 沒有門，就不會讓人以為進得去 */
    flatx: C => { const G = [...kRoof('grayb', C.w, 2), ...kWall('red', C.w, [0, 1, 2, 3])];
      for (const x of [1, 3]) { kPut(G, x, 2, KP.win); kPut(G, x, 4, KP.win); kPut(G, x, 5, KP.winWide); } return G; },
    flaty: C => { const G = [...kRoof('beige', C.w, 2), ...kWall('orange', C.w, [0, 1, 2, 3])];
      for (const x of [1, 2, 3]) { kPut(G, x, 2, KP.winArch); kPut(G, x, 4, KP.winGray); } kPut(G, 2, 5, KP.winWide); return G; },
    /* 打烊的小店：橘色遮雨棚＋暗掉的櫥窗 */
    shopx: C => { const G = [...kRoof('gray', C.w, 2), ...kWall('orange', C.w, [0, 1, 2, 3])];
      kPut(G, 1, 2, KP.win); kPut(G, 3, 2, KP.win); kRun(G, 0, C.w - 1, 4, KP.awnO); kRun(G, 1, 3, 5, KP.shop); return G; },
    /* 便利商店：綠招牌＋綠白遮雨棚＋整面玻璃，門在 door */
    cvs: C => { const G = [...kRoof('grayb', C.w, 2), ...kWall('red', C.w, [0, 2, 3])];
      kPut(G, 1, 2, KP.signG[0]); kPut(G, 2, 2, KP.signG[1]); kPut(G, 4, 2, KP.win);
      kPut(G, 1, 1, KP.ac); kPut(G, 4, 0, KP.vent);
      kRun(G, 0, C.w - 1, 3, KP.awnG);
      kRun(G, 0, C.w - 1, 4, KP.shopG); kPut(G, C.door[0], 4, KP.doorWhite2); return G; },
    /* 保健室／藥局：紅屋頂、白色雙開門、紅十字招牌（招牌在 post 畫） */
    clinic: C => { const G = [...kRoof('red', C.w, 2), ...kWall('red', C.w, [0, 2, 3])];
      kPut(G, 1, 3, KP.win); kPut(G, C.w - 2, 3, KP.win); kPut(G, C.w - 2, 4, KP.winBig);
      kPut(G, C.door[0], 4, KP.doorWhite2); return G; },
    /* 教學樓：灰屋頂、紅磚、一整排教室窗，大門是灰色雙開門 */
    block: C => { const G = [...kRoof('grayb', C.w, 3), ...kWall('red', C.w, [0, 1, 2, 3])];
      for (let x = 1; x < C.w - 1; x++) { kPut(G, x, 3, KP.winBig); kPut(G, x, 5, KP.winBig); if (x !== C.door[0]) kPut(G, x, 6, KP.win); }
      kPut(G, 2, 1, KP.ac); kPut(G, 7, 1, KP.vent); kPut(G, 9, 0, KP.vent2);
      kPut(G, C.door[0], 6, KP.doorGray2); return G; },
    /* 文藝教室：屋頂是一片草皮花園，拱形窗 */
    artroom: C => { const G = [...kRoof('lawn', C.w, 2), ...kWall('orange', C.w, [0, 1, 2, 3])];
      for (const x of [1, 2, 5, 6]) { kPut(G, x, 2, KP.winArch); kPut(G, x, 4, KP.winBig); }
      kPut(G, 1, 5, KP.plant); kPut(G, 6, 5, KP.plant);
      kPut(G, C.door[0], 5, KP.doorWood); return G; },
    /* 大禮堂：大片灰屋頂、紅磚、高窗、灰色大門 */
    audi: C => { const G = [...kRoof('gray', C.w, 4), ...kWall('red', C.w, [0, 1, 2, 2, 3])];
      for (let x = 1; x < C.w - 1; x++) if (Math.abs(x - C.door[0] - 0.5) > 1) { kPut(G, x, 4, KP.winArch); kPut(G, x, 6, KP.winBig); kPut(G, x, 7, KP.winBig); }
      kPut(G, C.door[0] - 1, 8, KP.plant); kPut(G, C.door[0] + 1, 8, KP.plant);
      kPut(G, 2, 1, KP.ac); kPut(G, 3, 1, KP.ac); kPut(G, 8, 2, KP.vent); kPut(G, 9, 1, KP.vent2);
      kPut(G, C.door[0], 8, KP.doorGray2); return G; },
  };
  /* 素材拼不出來的小東西：招牌上的字樣、十字 */
  /* 夢中小鎮的道館：8 格寬的小教學樓 */
  KITS.block8 = C => { const G = [...kRoof('grayb', C.w, 3), ...kWall('red', C.w, [0, 1, 2, 3])];
    for (let x = 1; x < C.w - 1; x++) { kPut(G, x, 3, KP.winBig); kPut(G, x, 5, KP.winBig); if (x !== C.door[0]) kPut(G, x, 6, KP.win); }
    kPut(G, 2, 1, KP.ac); kPut(G, 5, 1, KP.vent);
    kPut(G, C.door[0], 6, KP.doorGray2); return G; };
  const KPOST = {
    clinic: (R, C) => { R(0, 0, C.w * 16, 1, '#5a3a3a'); R(0, 0, 1, 32, '#5a3a3a'); R(C.w * 16 - 1, 0, 1, 32, '#5a3a3a');   // 屋頂描邊，跟其他建築的外框一致
      const sx = C.door[0] * 16 - 4, sy = 2 * 16 + 2;   // 門的正上方：白底紅十字
      R(sx, sy, 24, 12, '#5a4a5a'); R(sx + 1, sy + 1, 22, 10, '#f8f6f0'); R(sx + 10, sy + 2, 4, 8, '#d83a34'); R(sx + 7, sy + 4, 10, 4, '#d83a34'); },
    block: (R, C) => { const sx = C.door[0] * 16 - 8, sy = 4 * 16 + 4;    // 大門上方的校名牌
      R(sx, sy, 32, 8, '#5a4a5a'); R(sx + 1, sy + 1, 30, 6, '#f4ecd0'); for (let i = 0; i < 4; i++) R(sx + 4 + i * 7, sy + 2, 4, 4, '#8a3a2a'); },
    audi: (R, C) => { const sx = C.door[0] * 16 - 12, sy = 5 * 16 + 3;   // 大門上方的布條
      R(sx, sy, 40, 9, '#a8322a'); R(sx, sy, 40, 1, '#d84a3a'); for (let i = 0; i < 5; i++) R(sx + 4 + i * 7, sy + 3, 4, 3, '#f8e8b0'); },
  };
  KPOST.block8 = KPOST.block;
  /* 夢中的圖書館（書海港的道館）：橘磚外牆的 8 格寬小樓，屋頂擺著書堆般的通風口 */
  KITS.lib8 = C => { const G = [...kRoof('grayb', C.w, 3), ...kWall('orange', C.w, [0, 1, 2, 3])];
    for (let x = 1; x < C.w - 1; x++) { kPut(G, x, 3, KP.winArch); kPut(G, x, 5, KP.winBig); if (x !== C.door[0]) kPut(G, x, 6, KP.win); }
    kPut(G, 2, 1, KP.vent); kPut(G, 5, 1, KP.vent2);
    kPut(G, C.door[0], 6, KP.doorWood); return G; };
  KPOST.lib8 = KPOST.block;
  function kitBuild(kind, C) {
    const G = KITS[kind](C), W = C.w * 16, H = G.length * 16, SH = 8;
    if (G.some(row => row.some(ps => ps.some(p => !(p.im.complete && p.im.naturalWidth))))) return null;   // 還沒載入
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + SH;
    const g = cv.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    R(4, H - 2, W - 8, SH, 'rgba(0,0,0,.22)');                      // 落地陰影
    /* 圓角屋頂（草皮）四個角會透空：先鋪一層地面，看起來就是屋頂後面的草地 */
    if (C.kground) for (const [x, y] of [[0, 0], [C.w - 1, 0], [0, 1], [C.w - 1, 1]]) g.drawImage(tile(C.kground, '.', 0), x * 16, y * 16);
    G.forEach((row, y) => row.forEach((ps, x) => ps.forEach(p => g.drawImage(p.im, p.sx, p.sy, 16, 16, x * 16, y * 16, 16, 16))));
    if (KPOST[kind]) KPOST[kind](R, C);
    return cv;
  }

  function campus(kind) {
    const key = 'camp:' + kind; if (cache.has(key)) return cache.get(key);
    const C = CAMPUS[kind] || CAMPUS.clinic;
    if (KITS[kind]) { const cv0 = kitBuild(kind, C); if (cv0) { cache.set(key, cv0); return cv0; } return campusOld(kind, C); }
    const cv1 = campusOld(kind, C); cache.set(key, cv1); return cv1;
  }
  function campusOld(kind, C) {
    const key = 'camp:' + kind;
    if (C.style === 'block') { const cv0 = campusBlock(C); cache.set(key, cv0); return cv0; }
    if (C.style === 'guard') { const cv0 = campusGuard(C); cache.set(key, cv0); return cv0; }
    if (C.style === 'gate')  { const cv0 = campusGate(C);  cache.set(key, cv0); return cv0; }
    if (C.style === 'shopfront') { const cv0 = shopFront(C); cache.set(key, cv0); return cv0; }
    if (C.style === 'house') { const cv0 = houseFront(C); cache.set(key, cv0); return cv0; }
    if (C.style === 'audi') { const cv0 = campusAudi(C); cache.set(key, cv0); return cv0; }
    const W = C.w * 16, H = (C.h + (C.over || 0)) * 16, SH = 8;   // H 是圖的高度，含往上超出的部分
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + SH;
    const g = cv.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

    const ROOF_H = Math.round(H * 0.44);          // 屋頂佔的高度
    const WALL_Y = ROOF_H + 6;                     // 牆從哪裡開始

    /* ---- 落地陰影 ---- */
    R(4, H - 2, W - 8, SH, 'rgba(0,0,0,.20)');
    R(7, H + 2, W - 14, SH - 4, 'rgba(0,0,0,.14)');

    /* ---- 屋頂：上窄下寬的弧形，轉角是圓的 ---- */
    /* 弧線只在「往上超出去的那一格」裡收，第 15 列以後就是滿版，
       footprint 內才不會有透明的地方 */
    const inset = y => y >= 15 ? 0 : Math.round(11 * (1 - y / 15));
    for (let y = 0; y < ROOF_H; y++) {
      const i = inset(y), x0 = i, w = W - i * 2;
      const t = y / ROOF_H;
      let col = C.roof;
      if (t < 0.18) col = C.roof2;                 // 上緣受光
      else if (t > 0.76) col = C.roof3;            // 下緣壓深
      R(x0, y, w, 1, col);
      if (y === 0) R(x0, y, w, 1, adj(C.roof2, .30));
    }
    /* 瓦的直溝：每 8 px 一條，兩側跟著弧線縮進去 */
    for (let x = 8; x < W; x += 8) {
      for (let y = 2; y < ROOF_H - 2; y++) { const i = inset(y); if (x > i + 1 && x < W - i - 1) R(x, y, 1, 1, adj(C.roof, -.16)); }
    }
    /* 屋簷：最下面三層，一層比一層深，最後壓一條黑邊 */
    R(0, ROOF_H, W, 3, C.roof3);
    R(0, ROOF_H, W, 1, adj(C.roof3, .22));
    R(0, ROOF_H + 3, W, 2, adj(C.roof3, -.42));
    R(0, ROOF_H + 5, W, 1, adj(C.roof3, -.55));   // 不透明；半透明的線底下沒東西會變成空洞

    /* ---- 屋頂上的招牌 ---- */
    {
      const sw = 30, sh = 18, sx = Math.round((W - sw) / 2), sy = Math.round(ROOF_H * 0.30);
      R(sx - 1, sy - 1, sw + 2, sh + 2, '#d8d2c4');
      R(sx, sy, sw, sh, '#fbf8f0'); R(sx, sy, sw, 1, '#ffffff');
      R(sx, sy + sh - 1, sw, 1, '#cdc7b8');
      if (C.mark === 'cross') {                    // 保健室：紅十字
        R(sx + sw / 2 - 2, sy + 3, 4, 12, '#d83a34');
        R(sx + 5, sy + sh / 2 - 2, sw - 10, 4, '#d83a34');
      } else {                                     // 福利社：黃色貨牌
        R(sx + 4, sy + 4, sw - 8, sh - 8, '#e8a030');
        R(sx + 4, sy + 4, sw - 8, 1, '#f8c860');
        R(sx + 7, sy + 7, sw - 14, 2, '#8a5a18'); R(sx + 7, sy + 11, sw - 18, 2, '#8a5a18');
      }
    }

    /* ---- 牆體 ---- */
    R(0, WALL_Y, W, H - WALL_Y, '#f0ece0');
    R(0, WALL_Y, W, 2, '#ded8c8');                 // 屋簷投下的陰影
    R(0, WALL_Y + 2, W, 1, '#fbf8ee');
    for (let i = 0; i < 26; i++) { const v = hash(i, 7); R(v % W, WALL_Y + 4 + (v >>> 5) % (H - WALL_Y - 12), 2, 1, '#e6e1d4'); }

    /* ---- 轉角柱 ---- */
    for (const x of [0, W - 7]) {
      R(x, WALL_Y, 7, H - WALL_Y, '#e4dfd2');
      R(x, WALL_Y, 1, H - WALL_Y, '#fbf8ee');
      R(x + 6, WALL_Y, 1, H - WALL_Y, '#bdb7a8');
      R(x, H - 6, 7, 6, '#c8c2b2'); R(x, H - 6, 7, 1, '#ded8c8');
    }

    /* ---- 窗戶（左右各一扇大窗）---- */
    const winY = WALL_Y + 7, winH = H - WALL_Y - 20;
    for (const wx of [10, W - 10 - 24]) {
      R(wx - 1, winY - 1, 26, winH + 2, '#8a9098');
      R(wx, winY, 24, winH, '#7fb4d8');
      R(wx, winY, 24, Math.round(winH * 0.42), '#bfe0f2');
      R(wx + 2, winY + 2, 7, 4, '#eaf7ff');        // 反光
      R(wx + 11, winY, 2, winH, '#8a9098');        // 中框
      R(wx, winY + Math.round(winH / 2), 24, 1, '#8a9098');
      R(wx - 2, winY + winH, 28, 2, '#ded8c8');    // 窗台
      R(wx - 2, winY + winH + 2, 28, 1, '#b5afa0');
    }

    /* ---- 門：正中央的雙開玻璃門 ---- */
    {
      const dw = 22, dx = Math.round((W - dw) / 2), dy = WALL_Y + 6;
      entrance(R, dx, dy, dw, H - 4, false);
    }

    /* ---- 牆基 ---- */
    R(0, H - 2, W, 2, '#a8a296');

    cache.set(key, cv); return cv;
  }

  /* 時鐘指針：玩家在房間轉的時間，夢裡每一個鐘都停在這裡。
     kind '7' 是走廊／禮堂的掛鐘，']' 是床頭的鬧鐘。min ＝ 一天中的第幾分鐘。 */
  function clockHands(g, x, y, kind, min) {
    const big = kind === '7';
    const cx = x + 8, cy = y + (big ? 8 : 5), face = '#f8f6ee';
    if (big) { g.fillStyle = face; g.fillRect(x + 4, y + 4, 8, 8);
      g.fillStyle = '#6a6a74'; for (const [a, b] of [[8, 4], [8, 11], [4, 8], [11, 8]]) g.fillRect(x + a, y + b, 1, 1); }
    else { g.fillStyle = face; g.fillRect(x + 5, y + 3, 6, 5); }
    const line = (ang, len, col) => {
      g.fillStyle = col;
      for (let i = 0; i <= len * 2; i++) { const t = i / 2;
        g.fillRect(Math.round(cx + Math.sin(ang) * t - .5), Math.round(cy - Math.cos(ang) * t - .5), 1, 1); }
    };
    const h = (min / 60) % 12, m = min % 60;
    line(m / 60 * Math.PI * 2, big ? 4 : 2.5, big ? '#c83838' : '#2a2a30');
    line(h / 12 * Math.PI * 2, big ? 2.5 : 1.5, '#2a2a30');
    g.fillStyle = '#2a2a30'; g.fillRect(cx - 1, cy - 1, 2, 2);
  }
  /* 門前的地墊：進得去的門前面一律鋪一塊，告訴玩家「從這裡進去」 */
  function doormat() {
    const key = 'doormat'; if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; const g = cv.getContext('2d');
    g.fillStyle = '#7a2a26'; g.fillRect(2, 0, 12, 7); g.fillStyle = '#a8443a'; g.fillRect(3, 1, 10, 5);
    g.fillStyle = '#d8a050'; for (let x = 4; x < 12; x += 2) g.fillRect(x, 2, 1, 3);
    cache.set(key, cv); return cv;
  }
  /* 門牌：掛在門上方的牆上，一塊有顏色和小圖案的木牌（房間名稱在靠近時顯示在畫面上方，字太小畫在牌子上看不清楚）。
     kind：class 教室、shop 店、craft 工藝、lib 圖書、hist 校史、art 文藝、hall 禮堂、cross 保健 */
  const PLATES = {
    class: ['#3a6aa8', '#7aa8e0', ['#####', '#...#', '#.#.#', '#...#', '#####']],
    shop:  ['#2f8a58', '#6ac890', ['.#.#.', '#####', '#...#', '#...#', '.###.']],
    craft: ['#b8602a', '#e8a060', ['#####', '.###.', '..#..', '.###.', '#####']],
    lib:   ['#7a4a2a', '#c89060', ['#####', '#.#.#', '#.#.#', '#.#.#', '#####']],
    hist:  ['#6a6a78', '#b0b0c0', ['#####', '.#.#.', '.#.#.', '.#.#.', '#####']],
    art:   ['#b84a80', '#e890b8', ['.###.', '#.#.#', '##.##', '#.#.#', '.###.']],
    hall:  ['#6a3a98', '#a878d8', ['..#..', '.###.', '#####', '.###.', '..#..']],
    cross: ['#c83a34', '#f08a80', ['..#..', '..#..', '#####', '..#..', '..#..']],
  };
  function plate(kind) {
    const key = 'plate:' + kind; if (cache.has(key)) return cache.get(key);
    const [col, hi, glyph] = PLATES[kind] || PLATES.class;
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 12; const g = cv.getContext('2d');
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(1, 0, 14, 11, '#2a2018'); R(2, 1, 12, 9, col); R(2, 1, 12, 1, hi); R(2, 1, 1, 9, hi);     // 外框、牌面、左上受光
    R(7, 10, 2, 1, '#2a2018');                                                                  // 掛鉤
    glyph.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') R(5 + x, 3 + y, 1, 1, '#fffbe8'); }));
    cache.set(key, cv); return cv;
  }
  /* 地圖出口的箭頭：指向要走出去的方向 */
  function exitArrow(dir) {
    const key = 'arrow:' + dir; if (cache.has(key)) return cache.get(key);
    const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; const g = cv.getContext('2d');
    const pts = [[8, 3], [13, 9], [10, 9], [10, 13], [6, 13], [6, 9], [3, 9]];       // 朝上的箭頭
    const rot = { up: 0, right: 1, down: 2, left: 3 }[dir];
    const T = ([x, y]) => { for (let i = 0; i < rot; i++) [x, y] = [16 - y, x]; return [x, y]; };
    g.beginPath(); pts.map(T).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
    g.fillStyle = 'rgba(255,248,220,.9)'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(60,40,20,.75)'; g.stroke();
    cache.set(key, cv); return cv;
  }
  return { anim, bookFrame, devProp, monBig, plate, person, tile, setIndoor, clockHands, doormat, exitArrow, skinsReady, SKINS, weapon, weaponMon, special, chest, draft, building, campus, CAMPUS, THEMES, adj, hue, star, pxEllipse, el, OUT };
})();
