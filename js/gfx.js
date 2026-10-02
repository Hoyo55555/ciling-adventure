'use strict';
/* ============ 像素繪圖：詞靈、人物、地圖圖塊全部以程式生成，不需外部圖檔 ============ */
const GFX = (() => {
  const OUT = '#181820';
  const NOSHADE = new Set([OUT, '#ffffff']);
  const cache = new Map();

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

  function tile(theme, code, fr = 0) {
    const key = 't:' + theme + code + fr; if (cache.has(key)) return cache.get(key);
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
        else ground();
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
      case '=': ground(); R(0, 5, 16, 2, T.fence); R(0, 10, 16, 2, T.fence); R(1, 3, 3, 11, T.fence); R(12, 3, 3, 11, T.fence); R(1, 13, 3, 1, T.fence2); R(12, 13, 3, 1, T.fence2); R(0, 7, 16, 1, T.fence2); R(0, 12, 16, 1, T.fence2); break;
      case 'S': ground(); R(7, 9, 2, 6, '#7a5230'); R(2, 2, 12, 8, '#7a5230'); R(3, 3, 10, 6, '#c89858'); R(4, 5, 8, 1, '#7a5230'); R(4, 7, 6, 1, '#7a5230'); break;
      case 'F': ground(); { const cs = T.flower; [[4, 4, 0], [11, 6, 1], [6, 11, 2], [12, 12, 0]].forEach(([x, y, i]) => { R(x - 1, y, 3, 1, cs[i]); R(x, y - 1, 1, 3, cs[i]); R(x, y, 1, 1, '#f8c830'); R(x, y + 2, 1, 2, '#3a8a3a'); }); } break;
      case 'L': ground(); R(7, 6, 2, 9, '#40404a'); R(5, 14, 6, 2, '#40404a');
        if (theme === 'school') { R(4, 1, 8, 5, '#40404a'); R(5, 2, 6, 3, T.lamp); }
        else { R(4, 1, 8, 7, T.lamp); R(4, 1, 8, 1, '#40302a'); R(4, 7, 8, 1, '#40302a'); R(6, 3, 4, 3, '#f8d060'); }
        break;
      case '^': ground(); R(2, 5, 12, 10, T.rock); R(4, 3, 8, 3, T.rock); R(4, 4, 4, 2, adj(T.rock, .3)); R(2, 13, 12, 2, adj(T.rock, -.3)); break;
      case 'q': ground(); R(1, 3, 14, 12, '#4a4658'); R(1, 3, 14, 2, '#6a6480');   // 巨硯
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
        /* 縱向分道線：左右都還是跑道時才畫，跑道鋪成一整圈才會連起來 */
        if (!(fr & 2) && !(fr & 8)) R(15, 0, 1, 16, '#c88a78');
        const LW = '#f2f4ea';
        if (fr & 1) R(0, 1, 16, 1, LW);
        if (fr & 2) R(14, 0, 1, 16, LW);
        if (fr & 4) R(0, 14, 16, 1, LW);
        if (fr & 8) R(1, 0, 1, 16, LW);
        break;
      }
      case 'a': ground();                         // 籃球架
        R(7, 9, 2, 7, '#8a8a92'); R(7, 9, 1, 7, '#b4b4bc');
        R(4, 15, 8, 1, '#56565e');
        R(3, 1, 10, 8, '#d8d4c6'); R(3, 1, 10, 1, '#ffffff'); R(3, 8, 10, 1, '#a8a498');
        R(4, 2, 8, 5, '#f4f0e4'); R(6, 3, 4, 3, '#c85030');
        R(5, 9, 6, 1, '#e87a30'); R(5, 9, 1, 2, '#e87a30'); R(10, 9, 1, 2, '#e87a30');
        R(6, 11, 4, 2, '#f6f6f2'); R(7, 13, 2, 1, '#e0e0da');
        break;
      case 'v': ground();                         // 排球網
        R(1, 1, 2, 14, '#8a8a92'); R(13, 1, 2, 14, '#8a8a92');
        R(1, 1, 1, 14, '#b4b4bc'); R(13, 1, 1, 14, '#b4b4bc');
        R(0, 2, 16, 2, '#f6f6f2'); R(0, 2, 16, 1, '#ffffff');
        for (let x = 3; x < 13; x += 2) R(x, 4, 1, 8, '#d4d4cc');
        for (let y = 4; y < 12; y += 2) R(3, y, 10, 1, '#d4d4cc');
        R(1, 15, 2, 1, '#4a4a52'); R(13, 15, 2, 1, '#4a4a52');
        break;
      case 'd': {                                 // 司令台：fr＝哪幾邊不是司令台（上右下左）
        ground();
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
      case 'j': ground();                         // 單槓／爬竿
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
      case 'o': ground();                         // 停好的腳踏車（正面看的一排車頭）
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
      case 'f': g.drawImage(tile(theme, ','), 0, 0);   // 飲水機
        R(3, 3, 10, 12, '#b6bac2'); R(3, 3, 10, 2, '#d8dce4'); R(3, 14, 10, 1, '#70767e');
        R(4, 6, 8, 4, '#888e96'); R(5, 7, 6, 2, '#666c74');
        R(7, 10, 2, 2, '#e0e4ec'); R(6, 12, 4, 1, '#888e96');
        R(11, 5, 1, 1, '#6aa8e0');
        break;
      case 'z': g.drawImage(tile(theme, ','), 0, 0);   // 置物櫃／掃具櫃
        R(0, 0, 16, 15, '#4a6a8a');
        for (const x0 of [0, 8]) {
          R(x0 + 1, 1, 6, 13, '#6288a8'); R(x0 + 1, 1, 6, 1, '#82a8c8');
          for (let y = 3; y < 7; y++) R(x0 + 2, y, 4, 1, '#4a6a8a');
          R(x0 + 5, 9, 1, 2, '#e0e4ec');
        }
        R(0, 14, 16, 2, '#32516e');
        break;
      case '1': g.drawImage(tile(theme, ','), 0, 0);   // 陽台欄杆
        R(0, 2, 16, 2, '#d6d2c6'); R(0, 2, 16, 1, '#efebdf');
        R(0, 8, 16, 1, '#bebaae');
        for (let x = 1; x < 16; x += 3) R(x, 4, 1, 9, '#c6c2b6');
        R(0, 13, 16, 3, '#a6a298'); R(0, 13, 16, 1, '#bebaae');
        break;
      case '2': ground();                         // 公佈欄／獎盃櫃
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
      case '4': ground();                         // 施工圍籬（黃黑斜紋）
        R(0, 2, 16, 12, '#e8b830');
        for (let i = -16; i < 16; i += 6) for (let y = 2; y < 14; y++) { const x = i + (y - 2); if (x >= 0 && x < 16) R(x, y, 3, 1, '#2a2a30'); }
        R(0, 2, 16, 1, '#f8d860'); R(0, 13, 16, 1, '#a88420');
        R(1, 14, 2, 2, '#56565e'); R(13, 14, 2, 2, '#56565e');
        break;
      case '5': ground();                         // 水塔
        R(3, 1, 10, 9, '#8ac0d8'); R(3, 1, 10, 2, '#b2dcee'); R(3, 9, 10, 1, '#5a90a8');
        for (let y = 4; y < 9; y += 2) R(3, y, 10, 1, '#78b0c8');
        R(6, 0, 4, 1, '#5a90a8');
        R(4, 10, 2, 5, '#8a8a92'); R(10, 10, 2, 5, '#8a8a92');
        R(7, 10, 2, 3, '#70767e');
        R(3, 15, 10, 1, '#56565e');
        break;
      case '6': {                                 // 資源回收桶（三色）
        g.drawImage(tile(theme, ','), 0, 0);
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
      case '8': ground();                         // 溫室（玻璃屋）
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
      case '!': ground();                          // 電線桿
        R(6, 0, 4, 16, '#9a8f7e'); R(6, 0, 1, 16, '#b8ad9a'); R(9, 0, 1, 16, '#7d7262');
        for (let y = 3; y < 16; y += 5) R(6, y, 4, 1, '#8a7f6e');
        R(1, 2, 14, 1, '#4a4a52'); R(2, 5, 12, 1, '#4a4a52');          // 橫擔
        R(3, 1, 1, 2, '#6a6a74'); R(12, 1, 1, 2, '#6a6a74');
        R(4, 7, 8, 4, '#6a6a74'); R(4, 7, 8, 1, '#8a8a94');            // 變壓器
        break;
      case '%': ground();                          // 停在路邊的機車
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
      case ':': ground();                          // 公車站牌
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
      case 'K': {                                   // 球場：草皮＋白邊線（fr＝哪幾邊不是球場，由地圖鄰格算出來）
        R(0, 0, 16, 16, '#6fb356');
        for (let y = 0; y < 16; y += 4) R(0, y, 16, 2, '#78bd5e');   // 割草條紋
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
      case 'I': ground(); R(1, 2, 14, 3, '#a8463c'); R(0, 1, 16, 2, '#c85a4a');    // 牌坊／拱門
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
      case 'N': ground(); R(7, 8, 2, 7, '#6a4a32');                                                   // 門牌
        R(2, 3, 12, 6, '#e8dcc0'); R(2, 3, 12, 1, '#b8a888'); R(2, 8, 12, 1, '#b8a888');
        R(4, 5, 8, 1, '#6a5a44'); R(4, 7, 5, 1, '#6a5a44'); break;
      /* ---- 城鎮景物（地圖改版）---- */
      case 'Y': ground();                                   // 竹叢
        for (const [x, h0] of [[3, 2], [7, 0], [11, 3]]) { R(x, h0, 2, 16 - h0, '#5a9a4a'); R(x, h0, 1, 16 - h0, '#86c86a'); for (let y = h0 + 3; y < 16; y += 4) R(x - 1, y, 4, 1, '#3a7a34'); }
        break;
      case 'Z': R(0, 0, 16, 16, '#7ac8d8'); R(0, 0, 16, 16, 'rgba(255,255,255,.10)');   // 湯池
        { const o = fr * 3; R((2 + o) % 16, 5, 6, 1, '#d8f4ff'); R((9 + o) % 16, 11, 5, 1, '#d8f4ff'); }
        R(0, 0, 16, 2, '#b8a890'); R(0, 14, 16, 2, '#b8a890'); break;
      case 'O': ground(); R(4, 2, 8, 12, '#9a968c'); R(5, 3, 6, 10, '#b4b0a4');          // 石碑
        R(6, 5, 4, 1, '#6a6a64'); R(6, 7, 4, 1, '#6a6a64'); R(6, 9, 3, 1, '#6a6a64'); R(3, 13, 10, 2, '#7a766e'); break;
      case 'm': ground(); R(1, 6, 14, 2, '#b8322a'); R(1, 5, 14, 1, '#d84a3a');          // 書攤／市集攤位
        R(2, 8, 12, 6, '#8a5a2a'); R(3, 9, 4, 4, '#e8dcc0'); R(8, 9, 4, 4, '#c8d8f0'); R(2, 13, 12, 1, '#6a4424'); break;
      case 'n': ground(); R(7, 1, 2, 14, '#6a4a32');                                      // 布招／旗幟
        R(2, 2, 5, 8, '#c83838'); R(3, 3, 3, 1, '#f8f0e0'); R(3, 5, 3, 1, '#f8f0e0'); R(9, 2, 5, 8, '#3a68b8'); R(10, 4, 3, 1, '#f8f0e0'); break;
      case 'A': ground(); R(1, 3, 14, 2, '#8a4a3a'); R(2, 1, 12, 2, '#a85a48');          // 涼亭／朗讀亭
        R(2, 5, 2, 10, '#8a6a4a'); R(12, 5, 2, 10, '#8a6a4a'); R(4, 12, 8, 2, '#c8b898'); break;
      case 'Q': ground(); R(2, 4, 12, 10, '#a8763c'); R(3, 5, 10, 8, '#c8964c');         // 木箱堆
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
      case 'p': g.drawImage(tile(theme, '_'), 0, 0); R(5, 10, 6, 5, '#b8603a'); R(4, 9, 8, 2, '#d07a4a'); R(3, 2, 10, 8, '#3e9830'); R(5, 1, 6, 2, '#5ab84a'); R(4, 4, 3, 2, '#7ad86a'); break;
      default: ground();
    }
    cache.set(key, cv); return cv;
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
  function weaponMon(monKey, theme) {
    const key = 'm:' + monKey; if (cache.has(key)) return cache.get(key);
    const q = qart(monKey);
    if (q) { const cv0 = toCanvas(q.size || 32, q.size || 32, raster(q.size || 32, q.size || 32, q.parts, null)); cache.set(key, cv0); return cv0; }
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
  function chest(open) {
    const key = 'chest' + open; if (cache.has(key)) return cache.get(key);
    const P = open ? [{ t: 'r', v: [2, 7, 12, 7], c: '#8a5a2a' }, { t: 'r', v: [3, 8, 10, 2], c: '#3a2410' }, { t: 'r', v: [2, 3, 12, 3], c: '#a86a32' }]
      : [{ t: 'r', v: [2, 6, 12, 8], c: '#8a5a2a' }, { t: 'r', v: [2, 4, 12, 4], c: '#a86a32' }, { t: 'r', v: [2, 8, 12, 1], c: '#d8b040' }, { t: 'r', v: [7, 7, 2, 3], c: '#f0d060' }];
    const cv = toCanvas(16, 16, raster(16, 16, P, null)); cache.set(key, cv); return cv;
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
    oldblock:{ style: 'block', w: 10, h: 7, door: [4, 6], name: '舊校舍', band: '#7a6a52', old: 1 },
    /* door: null ＝ 進不去的建築（警衛室、校門本來就不是給人進去的）。
       護欄會跳過門的檢查，stampProps 也不會蓋出 D。 */
    guard:   { style: 'guard', w: 3, h: 2, door: null, name: '警衛室' },
    /* ---- 通學路（校外）的店面與住宅。style 'shopfront' ＝ 騎樓店面 ---- */
    bfast:   { style: 'shopfront', w: 5, h: 4, over: 1, door: [2, 3], name: '早餐店',
      awn: '#e8a030', awn2: '#b87818', sign: '#f4f0e4', signInk: '#8a4a20' },
    cvs:     { style: 'shopfront', w: 6, h: 4, over: 1, door: [2, 3], name: '便利商店',
      awn: '#3aa06a', awn2: '#247a4c', sign: '#f4f0e4', signInk: '#1f6b46', glassy: 1 },
    flat:    { style: 'shopfront', w: 5, h: 5, over: 1, door: [2, 4], name: '公寓',
      awn: '#8a8a92', awn2: '#62626a', sign: null, floors: 2, shutter: 1 },
    gate:    { style: 'gate',  w: 6, h: 2, door: null, name: '校門' },
  };
  /* 教學樓／舊校舍：平屋頂、兩層、外走廊。
     重點是「長」但不能「重複」—— 兩端有樓梯間、正中央有大門與校名，
     中間的教室跨才是重複的，而且每一跨的窗戶開合不一樣。 */
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
      R(dx - 2, dy - 2, dw + 4, BASE - dy + 2, '#5a6a78');
      R(dx, dy, dw, BASE - dy - 2, '#a8d4ee'); R(dx, dy, dw, 5, '#d6efff');
      R(dx + dw / 2 - 1, dy, 2, BASE - dy - 2, '#5a6a78');
      R(dx + dw / 2 - 6, dy + 16, 2, 5, '#42505c'); R(dx + dw / 2 + 4, dy + 16, 2, 5, '#42505c');
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
    /* 中間的拉門：直立鐵欄 */
    R(PW, 0, W - PW * 2, H, '#6e7682');
    R(PW, 0, W - PW * 2, 4, '#4e555f');                        // 門楣
    R(PW, 4, W - PW * 2, 2, '#98a0ac');
    for (let x = PW + 3; x < W - PW - 2; x += 5) R(x, 7, 2, H - 12, '#8a929e');
    R(PW, H - 5, W - PW * 2, 3, '#4e555f');
    R(PW, H - 2, W - PW * 2, 2, '#3a4048');
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
    /* 遮雨棚：街屋最明顯的特徵 */
    R(0, AWN, W, 7, C.awn2);
    for (let x = 0; x < W; x += 6) R(x, AWN, 3, 7, C.awn);
    R(0, AWN, W, 1, adj(C.awn, .28));
    R(0, AWN + 7, W, 2, adj(C.awn2, -.55));            // 不透明；半透明的線底下沒東西會變成空洞
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
    const dw = 22, dx = C.door[0] * 16 + 8 - dw / 2;
    if (C.shutter) {                                    // 公寓：拉下來的鐵捲門
      R(5, SY + 3, W - 10, H - SY - 7, '#9aa0a8');
      for (let y = SY + 4; y < H - 5; y += 3) R(5, y, W - 10, 1, '#7e848c');
      R(5, SY + 3, W - 10, 2, '#b8bec6');
      R(5, H - 5, W - 10, 2, '#6a7078');
    } else {                                            // 店面：整片落地玻璃＋中間的門
      R(5, SY + 3, W - 10, H - SY - 7, FRAME);
      R(6, SY + 4, W - 12, H - SY - 9, GLASS2);
      R(6, SY + 4, W - 12, Math.round((H - SY - 9) * 0.4), GLASS);
      for (let x = 6 + 13; x < W - 7; x += 13) R(x, SY + 4, 1, H - SY - 9, FRAME);
      if (C.glassy) { R(8, SY + 6, 7, 3, '#eaf7ff'); R(W - 18, SY + 10, 6, 3, '#dff1fb'); }
      R(dx - 2, SY + 2, dw + 4, H - SY - 4, '#5a6a78');
      R(dx, SY + 4, dw, H - SY - 7, '#a8d4ee'); R(dx, SY + 4, dw, 4, '#d6efff');
      R(dx + dw / 2 - 1, SY + 4, 2, H - SY - 7, '#5a6a78');
      R(dx + dw / 2 - 5, SY + 16, 2, 5, '#42505c'); R(dx + dw / 2 + 3, SY + 16, 2, 5, '#42505c');
    }
    R(0, H - 3, W, 3, CON2); R(0, H - 1, W, 1, CON3);
    return cv;
  }

  function campus(kind) {
    const key = 'camp:' + kind; if (cache.has(key)) return cache.get(key);
    const C = CAMPUS[kind] || CAMPUS.clinic;
    if (C.style === 'block') { const cv0 = campusBlock(C); cache.set(key, cv0); return cv0; }
    if (C.style === 'guard') { const cv0 = campusGuard(C); cache.set(key, cv0); return cv0; }
    if (C.style === 'gate')  { const cv0 = campusGate(C);  cache.set(key, cv0); return cv0; }
    if (C.style === 'shopfront') { const cv0 = shopFront(C); cache.set(key, cv0); return cv0; }
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
      R(dx - 2, dy - 2, dw + 4, H - dy + 2, '#5a6a78');
      R(dx, dy, dw, H - dy - 4, '#a8d4ee');
      R(dx, dy, dw, 4, '#d6efff');
      R(dx + dw / 2 - 1, dy, 2, H - dy - 4, '#5a6a78');       // 中縫
      R(dx + dw / 2 - 5, dy + 14, 2, 5, '#42505c');           // 門把
      R(dx + dw / 2 + 3, dy + 14, 2, 5, '#42505c');
      R(dx - 5, H - 4, dw + 10, 4, '#cdc7b8');                // 台階
      R(dx - 5, H - 4, dw + 10, 1, '#e4dfd2');
      R(dx - 8, H - 1, dw + 16, 1, '#ada798');
    }

    /* ---- 牆基 ---- */
    R(0, H - 2, W, 2, '#a8a296');

    cache.set(key, cv); return cv;
  }

  return { person, tile, weapon, weaponMon, special, chest, draft, building, campus, CAMPUS, THEMES, adj, hue, star, pxEllipse, el, OUT };
})();
