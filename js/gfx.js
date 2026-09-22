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

  /* ---------- 詞靈 32×32 ---------- */
  function creature(id, variant = 0) {
    const key = 'c:' + id + ':' + variant; if (cache.has(key)) return cache.get(key);
    const S = SPECIES[id]; let pal = S.pal;
    if (variant) { pal = {}; for (const k in S.pal) pal[k] = hue(S.pal[k], variant); }
    const cv = toCanvas(32, 32, raster(32, 32, S.parts, pal));
    cache.set(key, cv); return cv;
  }

  /* ---------- 人物 16×16（四方向、三格走路） ---------- */
  function personParts(L, dir, fr) {
    const P = [], R = (x, y, w, hh, c, m) => P.push({ t: 'r', v: [x, y, w, hh], c, m }), D = (v, c, m) => P.push({ t: 'd', v, c, m }), E = (v, c, m) => P.push({ t: 'e', v, c, m });
    const sk = L.skin || '#f8d0a8', hr = L.hair || '#3a3040', cl = L.cloth || '#4868b8', c2 = L.cloth2 || adj(cl, -.35), pt = L.pants || '#34344a';
    const girl = L.gender === 'f', robe = L.style === 'literati' || L.robe;
    const side = dir === 'left';
    // 腿
    if (side) { if (fr === 0) R(6, 12, 4, 3, pt); else if (fr === 1) { R(5, 12, 2, 3, pt); R(9, 12, 2, 2, pt); } else { R(6, 12, 2, 2, pt); R(8, 12, 2, 3, pt); } }
    else { R(5, 12, 2, fr === 1 ? 2 : 3, pt); R(9, 12, 2, fr === 2 ? 2 : 3, pt); }
    // 身體
    if (side) { R(5, 8, 6, robe ? 6 : 5, cl); }
    else { R(4, 8, 8, robe ? 6 : 5, cl); R(3, 8, 1, 4, cl, 1); D([[3, 12]], sk, 1); }
    if (robe) { R(side ? 5 : 4, 10, side ? 6 : 8, 1, c2); }
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
    if (dir === 'down') { D([[6, 6], [6, 7]], OUT, 1); if (L.glasses) { D([[5, 6], [7, 6]], '#8090a8', 1); } if (L.beard) { R(5, 8, 6, 2, '#f0f0f0'); D([[7, 10], [8, 10]], '#f0f0f0'); } }
    if (side) { D([[4, 6], [4, 7]], OUT); if (L.glasses) D([[3, 6], [5, 6]], '#8090a8'); if (L.beard) { R(4, 8, 4, 2, '#f0f0f0'); D([[5, 10]], '#f0f0f0'); } }
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
      door: '#6aa8e0', door2: '#3a6aa8', win: '#a0d8f8', win2: '#5878a8', fence: '#f8f8f8', fence2: '#a8a8b0', flower: ['#f86a8a', '#f8e040', '#ffffff'], lamp: '#f8e878', rock: '#a8a8b0' },
    literati: { ground: '#b0d890', ground2: '#90b870', path: '#cfcfc6', path2: '#a8a8a0', pathStyle: 'slab',
      tall: '#4f9a58', tall2: '#98d888', tall3: '#2e6a3a', leaf: '#78b868', leaf2: '#a8d890', leaf3: '#4a8848', trunk: '#6a4a32', treeStyle: 'willow',
      water: '#68b0c8', water2: '#d0f0f0', wall: '#f6f6f0', wall2: '#b8b8b0', roof: '#4a4e5a', roof2: '#2e323c',
      door: '#8a2a22', door2: '#e0b040', win: '#5a3a2a', win2: '#e8dcc0', fence: '#6a4a32', fence2: '#4a3222', flower: ['#f0a0c0', '#ffffff', '#f8d060'], lamp: '#e84838', rock: '#9aa0a0' },
    wuxia: { ground: '#a8c068', ground2: '#88a048', path: '#d0ac7a', path2: '#a8885a', pathStyle: 'dirt',
      tall: '#4a8a3a', tall2: '#90c860', tall3: '#2e5a26', leaf: '#6ab04a', leaf2: '#9ad06a', leaf3: '#3a7a2a', trunk: '#6a4a2a', treeStyle: 'bamboo',
      water: '#4a90b8', water2: '#b0d8f0', wall: '#b07a4a', wall2: '#7a5030', roof: '#6a4a3a', roof2: '#48301f',
      door: '#5a3a22', door2: '#c8a060', win: '#f0e0b8', win2: '#6a4a2a', fence: '#8a6a3a', fence2: '#5a4020', flower: ['#f8e040', '#f07050', '#ffffff'], lamp: '#e04030', rock: '#98948a' },
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
      default: ground();
    }
    cache.set(key, cv); return cv;
  }
  function tileDraw(g, what, T, theme) { g.drawImage(tile(theme, '#'), 0, 0); }

  /* 畫一個像素橢圓（戰鬥場地） */
  function pxEllipse(g, cx, cy, rx, ry, col) { g.fillStyle = col; for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1); } }

  /* 把 canvas 複製成可放進 DOM 的像素圖 */
  function el(src, scale = 2, cls = '') { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); c.className = 'pix ' + cls; c.style.width = U(src.width * scale); c.style.height = U(src.height * scale); return c; }

  return { creature, person, tile, THEMES, adj, hue, star, pxEllipse, el, OUT };
})();
