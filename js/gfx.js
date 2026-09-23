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
    // 腿
    if (side) { if (fr === 0) R(6, 12, 4, 3, legC); else if (fr === 1) { R(5, 12, 2, 3, legC); R(9, 12, 2, 2, legC); } else { R(6, 12, 2, 2, legC); R(8, 12, 2, 3, legC); } }
    else { R(5, 12, 2, fr === 1 ? 2 : 3, legC); R(9, 12, 2, fr === 2 ? 2 : 3, legC); }
    // 身體
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
    // 頭
    E([side ? 7.5 : 8, 5, 4.6, 4.2], sk);
    // 頭髮
    if (dir === 'up') { E([8, 4.6, 4.9, 4.4], hr); if (girl) R(4, 6, 8, 4, hr); }
    else if (side) { E([8.3, 3, 4.7, 2.7], hr); R(9, 3, 3, 5, hr); if (girl) R(9, 3, 4, 7, hr); }
    else { E([8, 3, 4.9, 2.7], hr); R(3, 3, 1, 3, hr, 1); if (girl) R(3, 3, 2, 7, hr, 1); }
    if (L.bun) { E([8, 0.8, 2, 1.4], hr); }
    // 眼睛與臉部
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
    // 配件
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
  function hash(a, b) { let s = (a * 374761393 + b * 668265263) >>> 0; s = (s ^ (s >>> 13)) * 1274126177 >>> 0; return (s ^ (s >>> 16)) >>> 0; }
  function tile(theme, code, fr = 0) {
    const key = 't:' + theme + code + fr; if (cache.has(key)) return cache.get(key);
    const T = THEMES[theme]; const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; const g = cv.getContext('2d');
    const R = (x, y, w, hh, c) => { g.fillStyle = c; g.fillRect(x, y, w, hh); };
    const ground = () => { R(0, 0, 16, 16, T.ground); [[3, 5], [11, 11], [12, 3], [5, 13]].forEach(([x, y]) => { R(x, y, 1, 1, T.ground2); R(x - 1, y - 1, 1, 1, T.ground2); R(x + 1, y - 1, 1, 1, T.ground2); }); };
    switch (code) {
      case '.': ground(); break;
      case ',':
        R(0, 0, 16, 16, T.path);
        if (T.pathStyle === 'tile') { R(0, 7, 16, 1, T.path2); R(7, 0, 1, 7, T.path2); R(15, 8, 1, 8, T.path2); }
        else if (T.pathStyle === 'slab') { R(0, 0, 16, 1, T.path2); R(0, 8, 16, 1, T.path2); R(5, 1, 1, 7, T.path2); R(12, 9, 1, 7, T.path2); }
        else { for (let i = 0; i < 7; i++) { const v = hash(i, 7); R(v % 15, (v >> 4) % 15, 1 + (v >> 9) % 2, 1, T.path2); } }
        break;
      case 'g':
        if (theme === 'school') {   // 國中：散落的考卷堆
          R(0, 0, 16, 16, T.floor);
          for (const [x, y, w2, h2] of [[1, 2, 7, 5], [7, 1, 8, 6], [2, 8, 8, 6], [9, 9, 6, 6]]) { R(x, y, w2, h2, '#fbfaf4'); R(x, y + h2 - 1, w2, 1, '#c8c4b4'); R(x + 1, y + 1, w2 - 2, 1, '#9ab0d0'); R(x + 1, y + 3, w2 - 3, 1, '#9ab0d0'); }
          R(3, 10, 2, 1, '#e04a4a'); R(11, 3, 1, 2, '#e04a4a'); R(4, 4, 1, 1, '#16120e'); R(12, 11, 2, 2, '#16120e');
          break;
        }
        R(0, 0, 16, 16, T.tall);
        for (const [bx, by] of [[0, 1], [8, 1], [4, 8], [12, 8]]) { R(bx + 1, by + 3, 1, 4, T.tall3); R(bx + 5, by + 3, 1, 4, T.tall3); R(bx + 2, by + 1, 1, 2, T.tall2); R(bx + 3, by, 1, 2, T.tall2); R(bx + 4, by + 1, 1, 2, T.tall2); R(bx + 2, by + 3, 3, 1, T.tall3); }
        R(0, 15, 16, 1, T.tall3); break;
      case 'T':
        ground();
        if (T.treeStyle === 'bamboo') {
          R(0, 0, 16, 16, '#2e4a22');
          for (const [x, o] of [[1, 0], [6, 5], [11, 2]]) { R(x, 0, 3, 16, '#8ab858'); R(x, 0, 1, 16, '#b8dc80'); R(x + 2, 0, 1, 16, '#5a8a38'); R(x, (4 + o) % 16, 3, 1, '#3e6a2a'); R(x, (11 + o) % 16, 3, 1, '#3e6a2a'); }
          for (const [x, y] of [[4, 3], [9, 9], [13, 6], [0, 12]]) { R(x, y, 3, 1, '#4e8a34'); R(x + 1, y - 1, 2, 1, '#4e8a34'); R(x + 2, y + 1, 1, 1, '#4e8a34'); }
        } else {
          R(6, 11, 4, 5, T.trunk); R(6, 11, 1, 5, adj(T.trunk, .2));
          const rows = [[4, 8], [2, 12], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [2, 12], [2, 12], [4, 8], [5, 6]];
          rows.forEach(([x, w], y) => R(x, y + 1, w, 1, T.leaf));
          R(3, 3, 4, 2, T.leaf2); R(4, 2, 2, 1, T.leaf2); R(9, 5, 3, 2, T.leaf2);
          R(2, 8, 12, 1, T.leaf3); R(3, 9, 10, 1, T.leaf3); R(5, 11, 6, 1, T.leaf3);
          if (T.treeStyle === 'willow') { for (const x of [2, 5, 10, 13]) R(x, 9, 1, 5, T.leaf3); }
          R(0, 0, 1, 1, T.leaf3);
        }
        break;
      case '~': R(0, 0, 16, 16, T.water); { const o = fr * 4; R((2 + o) % 16, 4, 5, 1, T.water2); R((9 + o) % 16, 10, 5, 1, T.water2); R((13 + o) % 16, 1, 3, 1, T.water2); } break;
      case '#': R(0, 0, 16, 16, T.wall);
        if (theme === 'wuxia') { for (const x of [0, 5, 10, 15]) R(x, 0, 1, 16, T.wall2); }
        else if (theme === 'literati') { R(0, 12, 16, 4, T.wall2); R(0, 12, 16, 1, adj(T.wall2, -.25)); }
        else { R(0, 7, 16, 1, T.wall2); R(0, 15, 16, 1, T.wall2); }
        break;
      case 'W': tileDraw(g, 'wall', T, theme);
        if (theme === 'literati') { R(3, 3, 10, 8, T.win); R(4, 4, 8, 6, T.win2); R(7, 4, 2, 6, T.win); R(4, 6, 8, 2, T.win); }
        else if (theme === 'wuxia') { R(3, 3, 10, 9, T.win2); R(4, 4, 8, 7, T.win); R(8, 4, 1, 7, T.win2); R(4, 7, 8, 1, T.win2); }
        else { R(3, 2, 10, 9, T.win2); R(4, 3, 8, 7, T.win); R(5, 4, 3, 2, '#ffffff'); R(8, 3, 1, 7, T.win2); }
        break;
      case 'D': tileDraw(g, 'wall', T, theme);
        R(2, 2, 12, 14, T.door2); R(3, 3, 10, 13, T.door);
        if (theme === 'school') { R(7, 3, 2, 13, T.door2); R(4, 4, 2, 4, '#e8f8ff'); R(10, 4, 2, 4, '#e8f8ff'); }
        else if (theme === 'literati') { R(7, 3, 2, 13, adj(T.door, -.3)); R(5, 9, 1, 1, T.door2); R(10, 9, 1, 1, T.door2); }
        else { R(3, 3, 10, 6, '#c84838'); R(3, 8, 10, 1, '#8a2a20'); }
        break;
      case 'R': R(0, 0, 16, 16, T.roof);
        if (theme === 'school') { for (const y of [3, 7, 11, 15]) R(0, y, 16, 1, T.roof2); for (let y = 0; y < 16; y += 4) R((y / 4 % 2) * 4 + 2, y, 1, 3, T.roof2); }
        else { for (const x of [1, 5, 9, 13]) { R(x, 0, 2, 16, T.roof2); R(x + 2, 0, 1, 16, adj(T.roof, .15)); } R(0, 15, 16, 1, adj(T.roof2, -.3)); }
        break;
      case '=': ground(); R(0, 5, 16, 2, T.fence); R(0, 10, 16, 2, T.fence); R(1, 3, 3, 11, T.fence); R(12, 3, 3, 11, T.fence); R(1, 13, 3, 1, T.fence2); R(12, 13, 3, 1, T.fence2); R(0, 7, 16, 1, T.fence2); R(0, 12, 16, 1, T.fence2); break;
      case 'S': ground(); R(7, 9, 2, 6, '#7a5230'); R(2, 2, 12, 8, '#7a5230'); R(3, 3, 10, 6, '#c89858'); R(4, 5, 8, 1, '#7a5230'); R(4, 7, 6, 1, '#7a5230'); break;
      case 'F': ground(); { const cs = T.flower; [[4, 4, 0], [11, 6, 1], [6, 11, 2], [12, 12, 0]].forEach(([x, y, i]) => { R(x - 1, y, 3, 1, cs[i]); R(x, y - 1, 1, 3, cs[i]); R(x, y, 1, 1, '#f8c830'); R(x, y + 2, 1, 2, '#3a8a3a'); }); } break;
      case 'L': ground(); R(7, 6, 2, 9, '#40404a'); R(5, 14, 6, 2, '#40404a');
        if (theme === 'school') { R(4, 1, 8, 5, '#40404a'); R(5, 2, 6, 3, T.lamp); }
        else { R(4, 1, 8, 7, T.lamp); R(4, 1, 8, 1, '#40302a'); R(4, 7, 8, 1, '#40302a'); R(6, 3, 4, 3, '#f8d060'); }
        break;
      case '^': ground(); R(2, 5, 12, 10, T.rock); R(4, 3, 8, 3, T.rock); R(4, 4, 4, 2, adj(T.rock, .3)); R(2, 13, 12, 2, adj(T.rock, -.3)); break;
      case 'X': R(0, 0, 16, 16, '#16120e'); break;
      case 'M': g.drawImage(tile(theme, '_'), 0, 0); R(3, 1, 10, 13, '#8a8a92'); R(4, 2, 8, 11, '#a8a8b0'); R(5, 4, 6, 1, '#6a6a74'); R(5, 6, 6, 1, '#6a6a74'); R(5, 8, 4, 1, '#6a6a74'); R(2, 14, 12, 2, '#6a6a74'); break;
      case 'V': g.drawImage(tile(theme, '_'), 0, 0); R(3, 4, 10, 9, '#4a5a70'); R(4, 5, 8, 5, '#8ad0f0'); R(5, 6, 3, 1, '#f8f8f8'); R(4, 11, 8, 1, '#2a3648'); R(5, 13, 6, 2, '#2a3648'); break;
      case 'B': R(0, 0, 16, 16, T.iwall || '#f4ecd4'); R(0, 2, 16, 10, '#6a4424'); R(0, 3, 16, 8, '#2e5a3a'); R(2, 5, 5, 1, '#e8f0e0'); R(9, 7, 4, 1, '#e8f0e0'); R(0, 12, 16, 4, T.iwall2 || '#9ab8d8'); R(3, 11, 3, 1, '#f8f8f8'); break;
      case '_': R(0, 0, 16, 16, T.floor); if (theme === 'school') { R(0, 0, 16, 1, T.floor2); R(0, 0, 1, 16, T.floor2); } else { R(0, 5, 16, 1, T.floor2); R(0, 11, 16, 1, T.floor2); R(6, 0, 1, 5, T.floor2); R(11, 6, 1, 5, T.floor2); } break;
      case 'w': R(0, 0, 16, 16, T.iwall); R(0, 10, 16, 6, T.iwall2); R(0, 10, 16, 1, adj(T.iwall2, -.3)); R(0, 15, 16, 1, adj(T.iwall2, -.4)); break;
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
    const A = ARCH[arch]; const special = !A.guardian && WOVR[theme + '.' + arch];
    const pal = Object.assign({}, WPAL[theme] || WPAL.school, special ? {} : { a: A.col });
    const cv = toCanvas(16, 16, raster(16, 16, special || SHAPES[A.shapes[theme]] || SHAPES.pen, pal));
    cache.set(key, cv); return cv;
  }
  /* 武器妖：把武器圖示放大成 32×32，加上眼睛、腳、腮紅 */
  function weaponMon(monKey, theme) {
    const key = 'm:' + monKey; if (cache.has(key)) return cache.get(key);
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
    let cv;
    if (kind === 'xiaomo') {
      cv = toCanvas(16, 16, raster(16, 16, [
        { t: 'p', v: [[5, 8], [8, 1], [11, 8]], c: '#2a2a3a' }, { t: 'e', v: [8, 10, 5, 4.5], c: '#2a2a3a' }, { t: 'e', v: [6, 7, 1.2, 1.5], c: '#5a5a78' },
        { t: 'r', v: [5, 9, 2, 2], c: '#ffffff' }, { t: 'r', v: [9, 9, 2, 2], c: '#ffffff' }, { t: 'd', v: [[6, 10], [10, 10]], c: OUT },
        { t: 'd', v: [[4, 12], [12, 12]], c: '#f08a8a' }, { t: 'd', v: [[7, 12], [8, 12]], c: '#f8f8f8' }, { t: 'd', v: [[2, 14], [14, 13]], c: '#2a2a3a' }], null), false);
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
  function chest(open) {
    const key = 'chest' + open; if (cache.has(key)) return cache.get(key);
    const P = open ? [{ t: 'r', v: [2, 7, 12, 7], c: '#8a5a2a' }, { t: 'r', v: [3, 8, 10, 2], c: '#3a2410' }, { t: 'r', v: [2, 3, 12, 3], c: '#a86a32' }]
      : [{ t: 'r', v: [2, 6, 12, 8], c: '#8a5a2a' }, { t: 'r', v: [2, 4, 12, 4], c: '#a86a32' }, { t: 'r', v: [2, 8, 12, 1], c: '#d8b040' }, { t: 'r', v: [7, 7, 2, 3], c: '#f0d060' }];
    const cv = toCanvas(16, 16, raster(16, 16, P, null)); cache.set(key, cv); return cv;
  }

  return { person, tile, weapon, weaponMon, special, chest, THEMES, adj, hue, star, pxEllipse, el, OUT };
})();
