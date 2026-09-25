'use strict';
/* ============ 美術地圖：把九座城鎮的手繪草圖接進遊戲 ============
   背景＝草圖（縮到 1 格 = 16px），碰撞＝預先算好的格子，
   其餘（門、出口、NPC、寶箱、機關）全部沿用原本的地圖格式，引擎不用改。 */
const ArtMap = (() => {
  const imgs = {};                    // id -> Image
  const ready = {};                   // id -> true
  let inited = false;

  const scene = {};                   // id -> 已經縮好、也蓋掉草圖人物的離屏畫布

  /* 草圖載入（背景載，載好前先用純色底） */
  function preload() {
    if (typeof GYM_GRID !== 'undefined') {           // 道館室內全部共用同一張草圖
      const gi = new Image();
      gi.onload = () => { for (const id of Object.keys(GYM_GRID)) { ready[id] = true; bake(id); } };
      gi.src = 'assets/concept/gyms.jpg';
      for (const id of Object.keys(GYM_GRID)) imgs[id] = gi;
    }
    for (const id of Object.keys(TOWN_GRID)) {
      const im = new Image();
      im.onload = () => { ready[id] = true; bake(id); };
      im.src = 'assets/concept/towns/' + id + '.jpg';
      imgs[id] = im;
    }
  }

  function mapSize(id) {
    const gy = (typeof GYM_ART !== 'undefined') && GYM_ART[id];
    const [sx, sy, sw, sh] = gy ? gy.rect : ART_RECT[id];
    const sc = gy ? gy.scale : ART_SCALE;
    return { sx, sy, sw, sh, MW: Math.round(sw * sc), MH: Math.round(sh * sc) };
  }

  /* 一次縮好整張地圖存起來：每格畫面就不用再縮一次大圖，也順便把草圖上的
     路人與雜物蓋掉（TOWN_HIDE）。蓋的方式是取附近三塊乾淨地面的「中位數」，
     單一塊被複製過來會造成的重複物件（水池、燈柱）會被中位數洗掉。 */
  function bake(id) {
    const im = imgs[id]; if (!im || !im.naturalWidth) return;
    const { sx, sy, sw, sh, MW, MH } = mapSize(id);
    const cv = document.createElement('canvas'); cv.width = MW; cv.height = MH;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(im, sx, sy, sw, sh, 0, 0, MW, MH);
    scene[id] = cv;
    const hide = (typeof TOWN_HIDE !== 'undefined' && TOWN_HIDE[id]) || [];
    if (hide.length) coverAll(g, MW, MH, hide);
    if (typeof TOWN_GATE !== 'undefined' && TOWN_GATE[id]) decorate(g, id);
  }

  /* 把 hide 清單上的格子用附近地面蓋掉 */
  function coverAll(g, MW, MH, hide) {
    const full = g.getImageData(0, 0, MW, MH), src = full.data;
    /* 一塊一塊蓋、蓋完立刻寫回 src，後面的路人才取得到已經清乾淨的地面
       （路人擠在一起時，直接從旁邊取樣會把隔壁的人一起複製過來） */
    const taken = (x, y) => hide.some(([c, r, w, h]) =>
      x >= c * 16 - 6 && x < (c + w) * 16 + 6 && y >= r * 16 - 6 && y < (r + h) * 16 + 6);
    for (const [c, r, w, h] of hide) {
      const x0 = c * 16, y0 = r * 16, ww = w * 16, hh = h * 16;
      /* 候選取樣位移：上下左右各三段距離，另外加上斜角 */
      const cand = [];
      for (const d of [1, 2, 3, 4, 5, 6, 8]) cand.push([0, (hh + 6) * d], [0, -(hh + 6) * d], [(ww + 6) * d, 0], [-(ww + 6) * d, 0]);
      for (const sx2 of [-1, 1]) for (const sy2 of [-1, 1]) for (const d of [1, 2]) cand.push([(ww + 6) * sx2 * d, (hh + 6) * sy2 * d]);
      /* 用「外框一圈」的顏色差挑最像周圍的三塊，才不會把屋頂蓋到路上 */
      const ring = (ox, oy) => { const a = [];
        for (let x = 0; x < ww; x += 2) { a.push(((y0 + oy - 1) * MW + x0 + ox + x) * 4); a.push(((y0 + oy + hh) * MW + x0 + ox + x) * 4); }
        for (let y = 0; y < hh; y += 2) { a.push(((y0 + oy + y) * MW + x0 + ox - 1) * 4); a.push(((y0 + oy + y) * MW + x0 + ox + ww) * 4); }
        return a; };
      const base = ring(0, 0);
      /* 一塊候選地面好不好用，看兩件事：
         1. 外框一圈跟目標的外框像不像（接得上去嗎）
         2. 這塊本身夠不夠「空」——裡面跟它自己的外框差很多，代表裡面也站了一個人，
            那就不能拿來蓋，不然只是把隔壁的路人複製過來而已。 */
      const pick = skipTaken => {
        const a = [];
        for (const [dx, dy] of cand) {
          if (x0 + dx - 1 < 0 || y0 + dy - 1 < 0 || x0 + dx + ww + 1 > MW || y0 + dy + hh + 1 > MH) continue;
          if (skipTaken && taken(x0 + dx + (ww >> 1), y0 + dy + (hh >> 1))) continue;
          const r2 = ring(dx, dy); let d2 = 0;
          for (let i = 0; i < base.length; i++)
            for (let k = 0; k < 3; k++) d2 += Math.abs(src[base[i] + k] - src[r2[i] + k]);
          /* 這塊自己的外框中位數＝它的地面顏色 */
          const m = k => { const v = r2.map(i => src[i + k]).sort((u, w2) => u - w2); return v[v.length >> 1]; };
          const g1 = [m(0), m(1), m(2)];
          let inner = 0, n2 = 0;
          for (let y = 2; y < hh - 2; y += 2) for (let x = 2; x < ww - 2; x += 2) {
            const i = ((y0 + y + dy) * MW + x0 + x + dx) * 4;
            inner += Math.abs(src[i] - g1[0]) + Math.abs(src[i + 1] - g1[1]) + Math.abs(src[i + 2] - g1[2]); n2++;
          }
          a.push({ dx, dy, d: d2 / base.length + (inner / Math.max(1, n2)) * 2.2 });
        }
        a.sort((p2, q2) => p2.d - q2.d);
        return a;
      };
      /* 路人擠在一起時，附近每一塊都被標記了，這時只好連標記過的也拿來取樣 */
      let scored = pick(true);
      if (!scored.length) scored = pick(false);
      const offs = scored.slice(0, 3).map(o => [o.dx, o.dy]);
      if (!offs.length) continue;
      const buf = new Uint8ClampedArray(ww * hh * 3);
      const fx = 5;                                  // 邊緣羽化寬度
      for (let y = 0; y < hh; y++) for (let x = 0; x < ww; x++) {
        const di = ((y0 + y) * MW + (x0 + x)) * 4;
        const px = [];
        for (const [dx, dy] of offs) { const si = ((y0 + y + dy) * MW + (x0 + x + dx)) * 4; px.push(si); }
        const med = k => { const v = px.map(i => src[i + k]).sort((a, b) => a - b); return v[v.length >> 1]; };
        const edge = Math.min(x, y, ww - 1 - x, hh - 1 - y);
        const a = Math.min(1, (edge + 1) / fx);      // 中間完全蓋掉、邊緣漸層
        for (let k = 0; k < 3; k++) buf[(y * ww + x) * 3 + k] = src[di + k] * (1 - a) + med(k) * a;
      }
      /* 整塊算完才寫回去，免得一邊算一邊被自己蓋過的像素影響 */
      for (let y = 0; y < hh; y++) for (let x = 0; x < ww; x++) {
        const di = ((y0 + y) * MW + (x0 + x)) * 4;
        for (let k = 0; k < 3; k++) src[di + k] = buf[(y * ww + x) * 3 + k];
      }
    }
    g.putImageData(full, 0, 0);
  }

  /* 把草圖畫到畫布上 */
  function draw(g, id, cx, cy) {
    const { MW, MH } = mapSize(id);
    g.fillStyle = '#12100e'; g.fillRect(0, 0, 240, 160);        // 地圖比畫面小時的黑邊
    const cv = scene[id]; if (!cv || !ready[id]) return;
    g.drawImage(cv, -cx, -cy);
  }

  /* ---------- 三大設施的統一外觀 ---------- */
  const F_STYLE = () => (typeof FACILITY_STYLE === 'undefined' ? 'off' : FACILITY_STYLE);
  const facilityOf = to => (typeof FACILITY_OF !== 'undefined' && FACILITY_OF[to]) || null;

  /* 統一建築（80×64＋下方 10px 陰影）門口在 x 32-48、底邊 y 64，
     換算成格子：門在左起第 3 欄、最下面那一列。
     所以要讓門對準 (dc,dr)，左上角就放在 (dc-2, dr-3)。 */
  function bldBox(gate) {
    const kind = facilityOf(gate.to);
    if (kind !== 'clinic' && kind !== 'store') return null;
    const [c, r, w] = gate.r;
    const dc = c + (w >> 1);
    return { kind, col: dc - 2, row: r - 3, w: 5, h: 4, door: [dc, r] };
  }

  /* 24×20 的小招牌：紅十字／黃貨牌／金匾，三座城鎮長得一模一樣 */
  const placed = {};                  // id -> [box]，install() 決定、bake() 照畫
  const SIGNS = {};
  function signOf(kind) {
    if (SIGNS[kind]) return SIGNS[kind];
    const c = document.createElement('canvas'); c.width = 24; c.height = 22;
    const g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    g.fillStyle = 'rgba(20,16,12,.28)'; g.fillRect(3, 16, 18, 3);      // 落在牆上的影子
    R(11, 15, 2, 7, '#4a3420');                                        // 吊桿
    R(1, 0, 22, 16, '#221a12');
    if (kind === 'clinic') { R(2, 1, 20, 14, '#efe6d2'); R(11, 3, 3, 10, '#b8382c'); R(8, 6, 9, 3, '#b8382c'); }
    else if (kind === 'store') { R(2, 1, 20, 14, '#d8a63c'); R(6, 4, 12, 2, '#5a3e14'); R(6, 9, 8, 2, '#5a3e14'); R(16, 9, 2, 2, '#5a3e14'); }
    else { R(2, 1, 20, 14, '#7a2a1e'); R(3, 2, 18, 12, '#c8a040');
      R(5, 4, 4, 3, '#7a2a1e'); R(10, 4, 4, 3, '#7a2a1e'); R(15, 4, 4, 3, '#7a2a1e'); R(5, 9, 14, 2, '#7a2a1e'); }
    SIGNS[kind] = c; return c;
  }

  /* 把統一建築與招牌畫到烘好的地圖上 */
  function decorate(g, id) {
    const style = F_STYLE(); if (style === 'off') return;
    for (const gate of (TOWN_GATE[id] || [])) {
      if (gate.exit) continue;
      const kind = facilityOf(gate.to); if (!kind) continue;
      const [c, r, w] = gate.r, dc = c + (w >> 1);
      const box = (placed[id] || []).find(b => b.door[0] === dc && b.door[1] === r);
      if (box) {
        g.drawImage(GFX.building(box.kind), box.col * 16, box.row * 16);
        continue;                                    // 建築本身就有招牌，不用再掛
      }
      const sg = signOf(kind);
      g.drawImage(sg, Math.round(dc * 16 + 8 - 12), Math.max(0, r * 16 - 24));
    }
  }

  /* 依門口感應區產生 doorWarps／warps，並套用到 LAYOUTS */
  function install() {
    if (inited) return; inited = true;
    preload();
    if (typeof LAYOUTS === 'undefined') return;      // 測試頁只用得到 bake／draw
    if (typeof GYM_GRID !== 'undefined') for (const [id, grid] of Object.entries(GYM_GRID)) installGym(id, grid);
    for (const [id, grid] of Object.entries(TOWN_GRID)) {
      const L = LAYOUTS[id]; if (!L) continue;
      const old = L.doorWarps || {}, oldW = L.warps || [];
      const byTarget = {};
      for (const v of Object.values(old)) (byTarget[v.to] = byTarget[v.to] || []).push(v);
      for (const w of oldW) (byTarget[w.to] = byTarget[w.to] || []).push(w);

      L.rows = grid.slice();          // 複本，下面會把門格改成牆
      L.art = id;                                  // 標記這是美術地圖
      L.indoor = 0;
      const dw = {}, warps = [];
      const R = L.rows, RH = R.length, RW = R[0].length;
      const walkable = (x, y) => y >= 0 && y < RH && x >= 0 && x < RW && R[y][x] === '_';
      const setWall = (x, y) => { if (y < 0 || y >= RH || x < 0 || x >= RW) return;
        R[y] = R[y].slice(0, x) + 'w' + R[y].slice(x + 1); };
      for (const gate of (TOWN_GATE[id] || [])) {
        const [c, r, w, h] = gate.r;
        const src = (byTarget[gate.to] || [])[0] || { to: gate.to, tx: 4, ty: 5, dir: 'up' };
        if (gate.exit) {
          /* 出城口走 warps，踩上去才觸發，所以只留可走的格 */
          for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++)
            if (walkable(x, y)) warps.push({ x, y, to: gate.to, tx: src.tx, ty: src.ty, dir: src.dir || 'down' });
          continue;
        }
        /* 房門：找一格「門前站位」當作回來時的落點，優先正下方 */
        let ret = null;
        for (const [ox, oy] of [[0, h], [w - 1, h], [-1, h - 1], [w, h - 1], [0, -1]]) {
          if (walkable(c + ox, r + oy)) { ret = { x: c + ox, y: r + oy }; break; }
        }
        if (!ret) ret = { x: c, y: r + h };
        for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) {
          const e = { to: gate.to, tx: src.tx, ty: src.ty, dir: src.dir || 'up', ret: { x: ret.x, y: ret.y } };
          if (gate.need != null) { e.need = gate.need; e.gate = typeof gate.need === 'number' ? 'need' + gate.need : gate.need; }
          dw[x + ',' + y] = e;
        }
        /* 門格一律設成不可走：只有「撞上去」才會進門，走過路邊不會被吸進去 */
        for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) setWall(x, y);
        /* 換成統一建築的話，整棟的地基也要擋住（門那一格除外，門要撞得進去）。
           但如果蓋下去會把自己的門堵死（例如碑林關商店的門是從側邊進的），
           那就不要蓋，改成只掛招牌。 */
        const box = F_STYLE() === 'hybrid' && bldBox(gate);
        if (box) {
          const inBox = (x, y) => x >= box.col && x < box.col + box.w && y >= box.row && y < box.row + box.h;
          const stillIn = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => {
            const nx = box.door[0] + dx, ny = box.door[1] + dy;
            return !inBox(nx, ny) && walkable(nx, ny);
          });
          const onMap = box.col >= 0 && box.row >= 0 && box.col + box.w <= RW && box.row + box.h <= RH;
          if (stillIn && onMap) {
            for (let y = box.row; y < box.row + box.h; y++)
              for (let x = box.col; x < box.col + box.w; x++)
                if (!(x === box.door[0] && y === box.door[1])) setWall(x, y);
            (placed[id] = placed[id] || []).push(box);
          }
        }
      }
      L.doorWarps = dw; L.warps = warps;
      /* 以下一律用 L.rows（門格已改成牆），免得有人被放在門上 */
      snapEntities(L, L.rows);
      fixReturns(id, L.rows, TOWN_GATE[id] || []);
      addTownNpcs(id, L, L.rows);
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

  return { install, draw, bake, imgs, ready, scene };
})();

/* LAYOUTS 已經由 data_game.js + data_maps2.js 建好，這裡直接套用 */
ArtMap.install();
