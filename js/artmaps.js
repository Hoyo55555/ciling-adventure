'use strict';
/* ============ 美術地圖：把九座城鎮的手繪草圖接進遊戲 ============
   背景＝草圖（縮到 1 格 = 16px），碰撞＝預先算好的格子，
   其餘（門、出口、NPC、寶箱、機關）全部沿用原本的地圖格式，引擎不用改。 */
const ArtMap = (() => {
  const imgs = {};                    // id -> Image
  const ready = {};                   // id -> true
  let inited = false;

  /* 草圖載入（背景載，載好前先用純色底） */
  function preload() {
    if (typeof GYM_GRID !== 'undefined') {           // 道館室內全部共用同一張草圖
      const gi = new Image();
      gi.onload = () => { for (const id of Object.keys(GYM_GRID)) ready[id] = true; };
      gi.src = 'assets/concept/gyms.jpg';
      for (const id of Object.keys(GYM_GRID)) imgs[id] = gi;
    }
    for (const id of Object.keys(TOWN_GRID)) {
      const im = new Image();
      im.onload = () => { ready[id] = true; };
      im.src = 'assets/concept/towns/' + id + '.jpg';
      imgs[id] = im;
    }
  }

  /* 把草圖畫到畫布上（依 ART_RECT 裁切、依 ART_SCALE 縮放） */
  function draw(g, id, cx, cy) {
    const im = imgs[id];
    const gy = (typeof GYM_ART !== 'undefined') && GYM_ART[id];
    const [sx, sy, sw, sh] = gy ? gy.rect : ART_RECT[id];
    const sc = gy ? gy.scale : ART_SCALE;
    const MW = Math.round(sw * sc), MH = Math.round(sh * sc);
    g.fillStyle = '#12100e'; g.fillRect(0, 0, 240, 160);        // 地圖比畫面小時的黑邊
    if (!im || !ready[id]) return;
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(im, sx, sy, sw, sh, -cx, -cy, MW, MH);
    g.imageSmoothingEnabled = false;
  }

  /* 依門口感應區產生 doorWarps／warps，並套用到 LAYOUTS */
  function install() {
    if (inited) return; inited = true;
    preload();
    if (typeof GYM_GRID !== 'undefined') for (const [id, grid] of Object.entries(GYM_GRID)) installGym(id, grid);
    for (const [id, grid] of Object.entries(TOWN_GRID)) {
      const L = LAYOUTS[id]; if (!L) continue;
      const old = L.doorWarps || {}, oldW = L.warps || [];
      const byTarget = {};
      for (const v of Object.values(old)) (byTarget[v.to] = byTarget[v.to] || []).push(v);
      for (const w of oldW) (byTarget[w.to] = byTarget[w.to] || []).push(w);

      L.rows = grid.slice();
      L.art = id;                                  // 標記這是美術地圖
      L.indoor = 0;
      const dw = {}, warps = [];
      for (const gate of (TOWN_GATE[id] || [])) {
        const [c, r, w, h] = gate.r;
        const src = (byTarget[gate.to] || [])[0] || { to: gate.to, tx: 4, ty: 5, dir: 'up' };
        for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) {
          if (gate.exit) warps.push({ x, y, to: gate.to, tx: src.tx, ty: src.ty, dir: src.dir || 'down' });
          else {
            const e = { to: gate.to, tx: src.tx, ty: src.ty, dir: src.dir || 'up', ret: { x: c, y: r + h } };
            if (gate.need != null) { e.need = gate.need; e.gate = typeof gate.need === 'number' ? 'need' + gate.need : gate.need; }
            dw[x + ',' + y] = e;
          }
        }
      }
      L.doorWarps = dw; L.warps = warps;
      snapEntities(L, grid);
      fixReturns(id, grid, TOWN_GATE[id] || []);
      addTownNpcs(id, L, grid);
    }
  }

  /* 道館室內：草圖當背景，館主放最上方可走列、入口放最下方可走列 */
  function installGym(id, grid) {
    const L = LAYOUTS[id]; if (!L) return;
    const rows = grid.length, cols = grid[0].length;
    const free = (x, y) => y >= 0 && y < rows && x >= 0 && x < cols && grid[y][x] === '_';
    const rowSpots = r => { const a = []; for (let c = 0; c < cols; c++) if (free(c, r)) a.push(c); return a; };
    let topRow = -1, botRow = -1;
    for (let r = 0; r < rows && topRow < 0; r++) if (rowSpots(r).length >= 3) topRow = r;
    for (let r = rows - 1; r >= 0 && botRow < 0; r--) if (rowSpots(r).length >= 2) botRow = r;
    if (topRow < 0 || botRow < 0) return;
    const mid = a => a[a.length >> 1];
    const oldW = L.warps || [];
    L.rows = grid.slice(); L.art = id; L.indoor = 1;
    /* 出口：最下方可走列的中間兩格 */
    const bs = rowSpots(botRow), bx = mid(bs);
    const back = oldW[0] || { to: 'chendu', tx: 4, ty: 5, dir: 'down' };
    L.warps = [{ x: bx, y: botRow, to: back.to, tx: back.tx, ty: back.ty, dir: 'down' }];
    if (free(bx + 1, botRow)) L.warps.push({ x: bx + 1, y: botRow, to: back.to, tx: back.tx, ty: back.ty, dir: 'down' });
    /* 館主與其他 NPC：從上往下排 */
    const used = new Set(L.warps.map(w => w.x + ',' + w.y));
    const pick = (r0) => { for (let r = r0; r < rows; r++) { const a = rowSpots(r).filter(c => !used.has(c + ',' + r));
        if (a.length) { const c = mid(a); used.add(c + ',' + r); return [c, r]; } } return null; };
    const npcs = L.npcs || [];
    const boss = npcs.find(n => /^(boss|rival)/.test(n.role)) || npcs[0];
    if (boss) { const p = pick(topRow); if (p) { boss.x = p[0]; boss.y = p[1]; boss.dir = 'down'; } }
    for (const n of npcs) { if (n === boss) continue;
      const p = pick(topRow + 1); if (p) { n.x = p[0]; n.y = p[1]; n.dir = 'down'; n.sight = 0; } }
    /* 機關：放在可走格旁邊的牆上 */
    if (L.devices) { const d2 = {}, keys = Object.keys(L.devices);
      keys.forEach((k, i) => { const r = topRow + 1 + ((i * 2) % Math.max(1, rows - topRow - 2));
        const a = rowSpots(Math.min(rows - 1, r)); if (!a.length) { d2[k] = L.devices[k]; return; }
        const c = a[Math.min(a.length - 1, Math.floor(a.length * (i + 1) / (keys.length + 1)))];
        let put = null;
        for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) if (!free(c + dx, r + dy)) { put = (c + dx) + ',' + (r + dy); break; }
        d2[put || (c + ',' + r)] = L.devices[k]; });
      L.devices = d2; }
    /* 寶箱 */
    for (const ch of (L.chests || [])) { const p = pick(topRow + 1); if (p) { ch.x = p[0]; ch.y = p[1]; } }
  }

  /* 把城鎮居民放到主要活動區裡，避開門口與既有 NPC */
  function addTownNpcs(id, L, grid) {
    const list = (typeof TOWN_NPCS !== 'undefined' && TOWN_NPCS[id]) || []; if (!list.length) return;
    const rows = grid.length, cols = grid[0].length;
    const free = (x, y) => y >= 0 && y < rows && x >= 0 && x < cols && grid[y][x] === '_';
    /* 主要連通區 */
    const seen = Array.from({ length: rows }, () => new Array(cols).fill(0));
    let main = [], best = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!free(c, r) || seen[r][c]) continue;
      const st = [[r, c]]; seen[r][c] = 1; const cells = [];
      while (st.length) { const [y, x] = st.pop(); cells.push([y, x]);
        for (const [dy, dx] of [[1,0],[-1,0],[0,1],[0,-1]]) { const ny = y+dy, nx = x+dx;
          if (!free(nx, ny) || seen[ny] === undefined || seen[ny][nx]) continue; seen[ny][nx] = 1; st.push([ny, nx]); } }
      if (cells.length > best) { best = cells.length; main = cells; }
    }
    if (!main.length) return;
    /* 排除門口／出口附近與已有 NPC 的位置 */
    const bad = new Set();
    for (const gt of (TOWN_GATE[id] || [])) { const [c, r, w, h] = gt.r;
      for (let y = r - 2; y < r + h + 2; y++) for (let x = c - 2; x < c + w + 2; x++) bad.add(x + ',' + y); }
    for (const n of (L.npcs || [])) bad.add(n.x + ',' + n.y);
    for (const ch of (L.chests || [])) bad.add(ch.x + ',' + ch.y);
    const pool = main.filter(([y, x]) => !bad.has(x + ',' + y));
    if (!pool.length) return;
    pool.sort((a, b) => (a[0] * cols + a[1]) - (b[0] * cols + b[1]));
    L.npcs = L.npcs || [];
    list.forEach((role, i) => {
      const spot = pool[Math.floor(pool.length * (i + 1) / (list.length + 1))];
      if (!spot) return;
      L.npcs.push({ role, x: spot[1], y: spot[0], dir: 'down' });
      bad.add(spot[1] + ',' + spot[0]);
    });
  }

  /* 路線地圖回到城鎮時，落點要在城鎮裡走得到的格子上 */
  function fixReturns(id, grid, gates) {
    const rows = grid.length, cols = grid[0].length;
    const free = (x, y) => y >= 0 && y < rows && x >= 0 && x < cols && grid[y][x] === '_';
    for (const gt of gates) {
      if (!gt.exit) continue;
      const [c, r, w, h] = gt.r;
      /* 從出口往城鎮內部找第一格可走的地方 */
      let land = null;
      const dirs = r === 0 ? [[0, 1]] : r + h >= rows ? [[0, -1]] : c === 0 ? [[1, 0]] : [[-1, 0], [0, -1], [0, 1], [1, 0]];
      for (const [dx, dy] of dirs) for (let k = 1; k <= 6 && !land; k++) {
        const x = c + (w >> 1) + dx * k, y = r + (h >> 1) + dy * k;
        if (free(x, y)) land = [x, y];
      }
      if (!land) continue;
      const R = LAYOUTS[gt.to]; if (!R || !R.warps) continue;
      for (const w2 of R.warps) if (w2.to === id) { w2.tx = land[0]; w2.ty = land[1]; }
    }
  }

  /* NPC／寶箱／機關如果落在牆上，往外找最近的可走格 */
  function snapEntities(L, grid) {
    const rows = grid.length, cols = grid[0].length;
    const free = (x, y) => y >= 0 && y < rows && x >= 0 && x < cols && grid[y][x] === '_';
    const taken = new Set();
    const snap = (x, y) => {
      x = Math.min(cols - 1, Math.max(0, Math.round(x * cols / 24)));
      y = Math.min(rows - 1, Math.max(0, Math.round(y * rows / 16)));
      for (let r = 0; r < Math.max(cols, rows); r++)
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
          if (free(nx, ny) && !taken.has(k)) { taken.add(k); return [nx, ny]; }
        }
      return [x, y];
    };
    for (const n of (L.npcs || [])) { const [x, y] = snap(n.x, n.y); n.x = x; n.y = y; }
    for (const c of (L.chests || [])) { const [x, y] = snap(c.x, c.y); c.x = x; c.y = y; }
    if (L.signs) { const s2 = {}; for (const [k, v] of Object.entries(L.signs)) {
      const [x0, y0] = k.split(',').map(Number); const [x, y] = snap(x0, y0);
      /* 告示牌要放在牆上（面對它才讀得到），所以往旁邊找一格牆 */
      let put = null;
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) if (!free(x + dx, y + dy)) { put = (x + dx) + ',' + (y + dy); break; }
      s2[put || (x + ',' + y)] = v; } L.signs = s2; }
    if (L.devices) { const d2 = {}; for (const [k, v] of Object.entries(L.devices)) {
      const [x0, y0] = k.split(',').map(Number); const [x, y] = snap(x0, y0);
      let put = null;
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) if (!free(x + dx, y + dy)) { put = (x + dx) + ',' + (y + dy); break; }
      d2[put || (x + ',' + y)] = v; } L.devices = d2; }
  }

  return { install, draw, imgs, ready };
})();

/* LAYOUTS 已經由 data_game.js + data_maps2.js 建好，這裡直接套用 */
ArtMap.install();
