'use strict';
/* ============ 大地圖：移動、NPC、看得見的敵人、寶箱 ============ */
let G = null;   // 目前存檔
let W = null;   // 目前世界觀

const OW = {
  L: null, id: null, npcs: [], foes: [], busy: false, bubble: null, bumpCd: 0, idleT: 0, hud: null, hudKey: '',
  p: { x: 0, y: 0, dir: 'down', moving: false, t: 0, tx: 0, ty: 0, dur: 0.22, step: 0, turnWait: 0, cont: false },

  shake: 0, dark: 0, flash: 0, fx: [],
  load(id, x, y, dir) {
    if (!LAYOUTS[id]) { const H0 = (W && W.homeTown) || { map: 'chendu', x: 11, y: 7 }; id = H0.map; x = H0.x; y = H0.y; }   // 防呆：地圖不存在就回起點城鎮
    this.id = id; this.L = LAYOUTS[id];
    Object.assign(this.p, { x, y, dir: dir || this.p.dir, moving: false, t: 0 });
    this.npcs = (this.L.npcs || []).concat((G.flags.cleared && W.postNpcs && W.postNpcs[id]) || []).map(s => {
      const role = W.roles[s.role]; if (!role) return null;
      if (s.route && G.route !== s.route) return null;                 // 依劇情路線出現的 NPC
      if (s.role === 'rival' && G.flags.rivalGone) return null;        // 勁敵離開步道
      if (G.flags['gone:' + id + ':' + s.role]) return null;             // 劇情中離開的人物
      if (s.after && !s.after.every(k => G.defeated[k])) return null;   // 條件未達成，尚未登場
      return { key: id + ':' + s.role, role, x: s.x, y: s.y, dir: s.dir, home: s.dir, sight: s.sight || 0, wander: s.wander, ox: 0, oy: 0, fr: 0, look: role.look };
    }).filter(Boolean);
    this.spawnFoes();
    if (id === 'inkpool') this.spawnSpirit();
    else this.spawnRoamer();
    G.map = id; G.x = x; G.y = y;
    if (!this.L.indoor && !/^r\d/.test(id)) { G.visited = G.visited || {}; G.visited[id] = 1; }
    Sound.play(W.music[this.L.music] || this.L.music); Cloud.paint();
    showBanner(W.mapNames[id]);
  },
  /* 撤退後：讓這隻武器妖消失，並在地圖上別的地方重新生成一隻 */
  respawnFoe(f) {
    this.foes = this.foes.filter(x => x !== f);
    const F = this.L.foes; if (!F) return;
    const spots = [];
    for (let y = 0; y < this.L.rows.length; y++) for (let x = 0; x < this.L.rows[0].length; x++) {
      if (this.tile(x, y) !== (F.on || 'g')) continue;
      if (this.foeAt(x, y) || this.npcAt(x, y)) continue;
      if (Math.abs(x - this.p.x) + Math.abs(y - this.p.y) < 6) continue;     // 不要生在玩家臉上
      spots.push([x, y]);
    }
    if (!spots.length) return;
    const [sx, sy] = pick(spots), st = G.badges.length;
    const sp = F.auto ? pick(monsAtStage(st)) : weighted(F.list.filter(x => (x.stage || 0) <= st)).sp;
    this.foes.push({ sp, lv: rnd(F.lv[0], F.lv[1]) + (F.scale || 0) * st + (G.ng || 0) * 4, x: sx, y: sy, hx: sx, hy: sy, ox: 0, oy: 0, t: Math.random() * 1.5, cool: 1.5, moving: false });
  },
  spawnFoes() {
    this.foes = []; const F = this.L.foes; if (!F) return;
    if (G && G.teacher) return;                    // 教師測試版：不生成野生妖怪
    const on = F.on || 'g';
    const spots = []; this.L.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === on) spots.push([x, y]); }));
    const used = new Set();
    for (let i = 0; i < F.n && spots.length; i++) {
      let s, tries = 0; do { s = pick(spots); tries++; } while ((used.has(s + '') || Math.abs(s[0] - this.p.x) + Math.abs(s[1] - this.p.y) < 4) && tries < 30);
      used.add(s + ''); const st = G.badges.length;
      const sp = F.auto ? pick(monsAtStage(st)) : weighted(F.list.filter(x => (x.stage || 0) <= st)).sp;
      this.foes.push({ sp, lv: rnd(F.lv[0], F.lv[1]) + (F.scale || 0) * st + (G.ng || 0) * 4, x: s[0], y: s[1], hx: s[0], hy: s[1], ox: 0, oy: 0, t: Math.random() * 1.5, cool: 0, moving: false });
    }
  },
  /* 二週目：筆靈／紙靈／墨靈會在城鎮與路線上隨機現身 */
  spawnRoamer() {
    this.npcs = this.npcs.filter(n => n.role.kind !== 'roamer');
    if (!G.ng || this.L.indoor) return;
    const left = GUARDIAN_FIRST.filter(k => !ownsArch(k));
    if (!left.length) { G.roamAt = null; return; }
    if (!G.roamAt || !LAYOUTS[G.roamAt]) rerollRoam();
    if (this.id !== G.roamAt) return;                        // 只會出現在「指引」說的那張地圖
    const spots = [];
    for (let y = 1; y < this.L.rows.length - 1; y++) for (let x = 1; x < this.L.rows[0].length - 1; x++)
      if (!SOLID.has(this.tile(x, y)) && !this.chestAt(x, y) && !this.npcAt(x, y) && Math.abs(x - this.p.x) + Math.abs(y - this.p.y) > 4) spots.push([x, y]);
    if (!spots.length) return;
    const [sx, sy] = pick(spots), a = pick(left);
    const role = { kind: 'roamer', name: weaponName(a), look: { sprite: 'stone' } };
    this.npcs.push({ key: this.id + ':roamer', role, arch: a, x: sx, y: sy, dir: 'down', home: 'down', sight: 0, ox: 0, oy: 0, fr: 0, look: role.look });
  },
  /* 二週目：硯海龍君在墨池裡隨機現身 */
  spawnSpirit() {
    this.npcs = this.npcs.filter(n => n.key !== 'inkpool:stoneSpirit');
    if (!G.ng || ownsArch('g_stone') || !G.flags.shardsAll) return;
    const R0 = W.roles.stoneSpirit; if (!R0) return;
    this.npcs.push({ key: 'inkpool:stoneSpirit', role: R0, x: 8, y: 6, dir: 'down', home: 'down', sight: 0, ox: 0, oy: 0, fr: 0, look: R0.look });
  },
  tile(x, y) { const r = this.L.rows; if (y < 0 || y >= r.length || x < 0 || x >= r[0].length) return this.L.indoor ? 'X' : 'T'; const o = G && G.opened && G.opened[this.id + ':' + x + ',' + y]; return o || r[y][x]; },
  npcAt(x, y) { return this.npcs.find(n => n.x === x && n.y === y); },
  foeAt(x, y) { return this.foes.find(f => f.x === x && f.y === y); },
  chestAt(x, y) { return (this.L.chests || []).find(c => c.x === x && c.y === y); },
  solid(x, y) { return SOLID.has(this.tile(x, y)) || !!this.npcAt(x, y) || !!this.chestAt(x, y); },

  run(fn) { this.busy = true; Promise.resolve().then(fn).catch(e => console.error(e)).finally(() => { this.busy = false; Input.eat(); }); },

  update(dt) {
    const p = this.p; this.bumpCd -= dt; this.updateHud();
    if (this.busy) return;
    this.idleT += dt;
    if (this.idleT > 1.6) { this.idleT = 0; for (const n of this.npcs) if (n.wander && Math.random() < 0.35) n.dir = pick(['up', 'down', 'left', 'right']); }
    if (this.updateFoes(dt)) return;
    if (p.moving) {
      p.t += dt / p.dur;
      if (p.t >= 1) { p.x = p.tx; p.y = p.ty; p.moving = false; p.t = 0; G.x = p.x; G.y = p.y; if (this.onStep()) return; }
      else return;
    }
    if (Input.p('START')) { Sound.sfx('ok'); this.run(() => BookMenu.open()); return; }
    if (Input.p('HOME')) { this.run(() => goHome()); return; }
    if (Input.p('A')) { this.interact(); return; }
    const d = ['up', 'down', 'left', 'right'].find(k => Input.h(k));
    if (!d) { p.cont = false; p.turnWait = 0; return; }
    if (p.dir !== d && !p.cont) { p.dir = d; p.turnWait = 0.08; return; }
    if (p.turnWait > 0) { p.turnWait -= dt; return; }
    p.dir = d; this.tryMove(d);
  },
  tryMove(d) {
    const p = this.p, [dx, dy] = DIRS[d], nx = p.x + dx, ny = p.y + dy;
    const gate = this.L.gates && this.L.gates[nx + ',' + ny];
    if (gate && !gateOpen(gate)) { p.cont = false; this.run(() => say(W.gates[gate])); return; }
    const dw = this.L.doorWarps && this.L.doorWarps[nx + ',' + ny];
    if (dw) { p.cont = false; this.run(() => enterDoor(dw)); return; }
    const f = this.foeAt(nx, ny);
    if (f && f.cool <= 0) { p.cont = false; this.run(() => foeBattle(f)); return; }
    if (this.solid(nx, ny) || f) { if (this.bumpCd <= 0) { Sound.sfx('bump'); this.bumpCd = 0.35; } p.cont = false; return; }
    p.moving = true; p.tx = nx; p.ty = ny; p.t = 0; p.cont = true; p.step++;
    p.dur = Input.h('B') ? 0.12 : 0.22;
  },
  onStep() {
    const p = this.p;
    const w = (this.L.warps || []).find(w => w.x === p.x && w.y === p.y);
    if (w) { this.run(() => w.to === '@ret' ? warpTo(G.ret.map, G.ret.x, G.ret.y, 'down') : warpTo(w.to, w.tx, w.ty, w.dir)); return true; }
    for (const n of this.npcs) if (n.sight && !G.defeated[n.key] && this.sees(n)) { p.cont = false; this.run(() => spotted(n)); return true; }
    if (this.tile(p.x, p.y) === 'g') Sound.sfx('grass');
    return false;
  },
  sees(n) {
    const [dx, dy] = DIRS[n.dir], p = this.p;
    for (let i = 1; i <= n.sight; i++) { const x = n.x + dx * i, y = n.y + dy * i; if (x === p.x && y === p.y) return true; if (SOLID.has(this.tile(x, y)) || this.npcAt(x, y)) return false; }
    return false;
  },
  /* 敵人巡邏：玩家靠近 3 格內會追過來，碰到就開戰 */
  updateFoes(dt) {
    const p = this.p;
    for (const f of this.foes) {
      if (f.cool > 0) f.cool -= dt;
      if (f.moving) continue;
      f.t -= dt; if (f.t > 0) continue;
      const dist = Math.abs(f.x - p.x) + Math.abs(f.y - p.y);
      const chase = dist <= 3 && f.cool <= 0 && G.equip.length;
      f.t = chase ? 0.45 : 0.9 + Math.random() * 1.2;
      let dir;
      if (chase) { const dx = p.x - f.x, dy = p.y - f.y; dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
      else { if (Math.random() < 0.4) continue; dir = pick(['up', 'down', 'left', 'right']); }
      const [ddx, ddy] = DIRS[dir], nx = f.x + ddx, ny = f.y + ddy;
      const tx = p.moving ? p.tx : p.x, ty = p.moving ? p.ty : p.y;
      if (nx === tx && ny === ty) { if (chase && !p.moving) { this.run(() => foeBattle(f)); return true; } continue; }
      if (this.solid(nx, ny) || this.foeAt(nx, ny) || (this.L.warps || []).some(w => w.x === nx && w.y === ny)) continue;
      if (!chase && (Math.abs(nx - f.hx) > 3 || Math.abs(ny - f.hy) > 3)) continue;
      f.moving = true; Anim.run(0.28, k => { f.ox = ddx * 16 * k; f.oy = ddy * 16 * k; }).then(() => { f.x = nx; f.y = ny; f.ox = f.oy = 0; f.moving = false; });
    }
    return false;
  },
  interact() {
    const p = this.p, [dx, dy] = DIRS[p.dir], tx = p.x + dx, ty = p.y + dy, key = tx + ',' + ty;
    const n = this.npcAt(tx, ty) || (this.tile(tx, ty) === 't' && this.npcAt(tx + dx, ty + dy)); if (n) { this.run(() => talkTo(n)); return; }
    const c = this.chestAt(tx, ty); if (c) { this.run(() => openChest(c)); return; }
    const f = this.foeAt(tx, ty); if (f && f.cool <= 0) { this.run(() => foeBattle(f)); return; }
    if (this.L.signs && this.L.signs[key]) { this.run(() => say(W.signs[this.L.signs[key]])); return; }
    const dw = this.L.doorWarps && this.L.doorWarps[key];
    if (dw) { this.run(() => enterDoor(dw)); return; }
    if (this.L.doors && this.L.doors[key]) { this.run(() => doorAct(this.L.doors[key], tx, ty)); return; }
    const dv = this.L.devices && this.L.devices[key]; if (dv) { this.run(() => useDevice(dv)); return; }
    if (this.tile(tx, ty) === '~') this.run(() => say('水面波光粼粼，倒映著天空。'));
  },
  updateHud() {
    if (!Settings.hud || !G || Game.scene !== 'overworld' || !G.equip.length) { if (this.hud) { this.hud.remove(); this.hud = null; this.hudKey = ''; } return; }
    if (!this.hud || !this.hud.isConnected) { this.hud = UI.el('box mhud'); this.hudKey = ''; }
    const key = G.hp + '/' + G.maxhp + '/' + G.wenqi + '/' + G.cur;
    if (key === this.hudKey) return; this.hudKey = key;
    const r = G.hp / G.maxhp;
    this.hud.innerHTML = `<div class="mh-row"><span>氣血</span><div class="inkbar"><i class="${r <= .25 ? 'low' : ''}" style="width:${r * 100}%"></i></div></div><div class="mh-row"><span>文氣</span>${wenqiDots()}</div>`;
  },

  draw(g) {
    const p = this.p, L = this.L; if (!L) return;
    const theme = L.theme || W.theme, mw = L.rows[0].length * 16, mh = L.rows.length * 16;   // 每個城鎮有自己的配色
    const k = p.moving ? p.t : 0;
    const px = (p.moving ? p.x + (p.tx - p.x) * k : p.x) * 16, py = (p.moving ? p.y + (p.ty - p.y) * k : p.y) * 16;
    let cx = px - 112, cy = py - 72;
    cx = Math.round(mw > 240 ? clamp(cx, 0, mw - 240) : (mw - 240) / 2); cy = Math.round(mh > 160 ? clamp(cy, 0, mh - 160) : (mh - 160) / 2);
    if (this.shake > 0) { cx += Math.round((Math.random() - .5) * this.shake * 2); cy += Math.round((Math.random() - .5) * this.shake * 2); }
    const now = performance.now(), wf = Math.floor(now / 500) % 2;
    const x0 = Math.floor(cx / 16) - 1, y0 = Math.floor(cy / 16) - 1;
    if (L.art) ArtMap.draw(g, L.art, cx, cy);            // 美術地圖：直接畫草圖
    else for (let ty = y0; ty < y0 + 12; ty++) for (let tx = x0; tx < x0 + 17; tx++) { const c = this.tile(tx, ty); g.drawImage(GFX.tile(theme, c, c === '~' ? wf : (tx * 5 + ty * 11) & 3), tx * 16 - cx, ty * 16 - cy); }
    for (const [kind, bx, by] of L.props || []) g.drawImage(GFX.building(kind, theme), bx * 16 - cx, by * 16 - cy);   // 整棟建築跨多格
    for (const c of L.chests || []) g.drawImage(GFX.chest(!!G.chests[c.id]), c.x * 16 - cx, c.y * 16 - cy);
    const actors = this.npcs.map(n => ({ y: n.y * 16 + n.oy, draw: () => {
      if (n.look.sprite) { const sp = GFX.special(n.look.sprite), sz = sp.width; const bob = Math.round(Math.sin(now / 300) * 1.5);
        g.drawImage(sp, n.x * 16 + n.ox - cx - (sz - 16) / 2, n.y * 16 + n.oy - cy - (sz - 16) - 3 + bob); }   // 依圖原尺寸畫，不拉伸
      else g.drawImage(GFX.person(n.look, n.dir, n.fr), n.x * 16 + n.ox - cx, n.y * 16 + n.oy - cy - 3); } }));
    for (const f of this.foes) actors.push({ y: f.y * 16 + f.oy, draw: () => {
      const bob = Math.round(Math.abs(Math.sin(now / 220 + f.hx)) * 2); const fx = f.x * 16 + f.ox - cx, fy = f.y * 16 + f.oy - cy;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(fx + 3, fy + 13, 10, 2);
      if (f.cool > 0 && Math.floor(now / 120) % 2) return;
      g.drawImage(GFX.weaponMon(f.sp, W.theme), fx - 1, fy - 4 - bob, 18, 18);
    } });
    const fr = p.moving ? (k < 0.5 ? (p.step % 2 ? 1 : 2) : 0) : 0;
    actors.push({ y: py, draw: () => {
      g.drawImage(GFX.person(G.player.look, p.dir, fr), px - cx, py - cy - 3);
      if (this.tile(p.moving ? p.tx : p.x, p.moving ? p.ty : p.y) === 'g' && (!p.moving || k > 0.5)) g.drawImage(GFX.tile(theme, 'g'), 0, 10, 16, 6, px - cx, py - cy + 10, 16, 6);
    } });
    actors.sort((a, b) => a.y - b.y).forEach(a => a.draw());
    // 任務提示：該對話的對象頭上閃爍
    const marks = questMarks();
    for (const n of this.npcs) { const m = marks[n.role === W.roles.questGiver ? 'questGiver' : n.key.split(':')[1]]; if (m) drawMark(g, n.x * 16 + n.ox - cx + 3, n.y * 16 + n.oy - cy - (n.look.sprite === 'boss' ? 28 : 15), m, now); }
    for (const [k, d] of Object.entries(this.L.devices || {})) if (!G.flags[d.flag]) { const [dx2, dy2] = k.split(',').map(Number); drawMark(g, dx2 * 16 - cx + 4, Math.max(2, dy2 * 16 - cy - 9), 'side', now); }
    for (const f of this.fx || []) f(g, cx, cy);
    if (this.dark > 0) { g.fillStyle = `rgba(8,6,14,${this.dark})`; g.fillRect(0, 0, 240, 160); }
    if (this.flash > 0) { g.fillStyle = `rgba(255,250,235,${this.flash})`; g.fillRect(0, 0, 240, 160); }
    if (this.bubble) { const n = this.bubble; const bx = n.x * 16 + n.ox - cx + 3, by = n.y * 16 + n.oy - cy - 16;
      g.fillStyle = '#2a2018'; g.fillRect(bx - 1, by - 1, 12, 13); g.fillStyle = '#fbf3dc'; g.fillRect(bx, by, 10, 11); g.fillStyle = '#b8322a'; g.fillRect(bx + 4, by + 2, 2, 5); g.fillRect(bx + 4, by + 8, 2, 2); }
  },
};
/* 目前該找誰：main 主線（黃 !）、side 可接支線（藍 !）、report 可回報（黃 ?） */
function storyStage() { return G.badges.length; }
const roleKey = r => { for (const [k, L] of Object.entries(LAYOUTS)) if ((L.npcs || []).some(s => s.role === r)) return k + ':' + r; return r; };
const isDone = r => !!G.defeated[roleKey(r)];
const roleReady = r => { const R = W.roles[r]; return !R.needDefeated || R.needDefeated.every(k => G.defeated[k]); };
function questMarks() {
  const m = {};
  if (W.story) {
    if (!G.flags.prologue) return m;
    const st = W.stages[storyStage()]; if (st) for (const r of st.roles) if (!isDone(r) && roleReady(r)) m[r] = 'main';
    return m;
  }
  if (!G.equip.length) m.mentor = 'main';
  else if (!G.defeated['route1:rival'] && !G.flags.rivalGone) m.rival = 'main';
  else if (!G.badges.length) { m.gymguide = 'main'; m.gym1 = 'main'; m.rivalA = 'main'; m.rivalB = 'main'; }
  const q = G.quests.bugs;
  if (!q || q.state === 'none') m.questGiver = 'side'; else if (q.state === 'active' && q.n >= 3) m.questGiver = 'report';
  return m;
}
const GLYPH = { '!': ['..#..', '..#..', '..#..', '..#..', '.....', '..#..'], '?': ['.###.', '#...#', '...#.', '..#..', '.....', '..#..'] };
/* 只在人物頭上標示：黃「！」主線、藍「！」支線、黃「？」可回報。
   地圖上的出入口不再標箭頭（玩家說看不懂，而且路本身就看得出來）。 */
function drawMark(g, x, y, type, now, dir) {
  const blink = (Math.sin(now / 180) + 1) / 2; if (blink < 0.15) return;
  const bob = Math.round(Math.sin(now / 250) * 1.2); y += bob;
  g.globalAlpha = 0.6 + 0.4 * blink;
  const col = type === 'side' ? '#4aa0f0' : '#f8c830';
  g.fillStyle = '#2a2018'; g.fillRect(x, y, 8, 8); g.fillRect(x + 3, y + 8, 2, 2);
  g.fillStyle = col; g.fillRect(x + 1, y + 1, 6, 6); g.fillRect(x + 3, y + 7, 1, 2);
  g.fillStyle = '#2a2018'; g.fillRect(x + 3, y + 2, 2, 3); g.fillRect(x + 3, y + 6, 2, 1);
  if (type === 'report') { g.fillStyle = col; g.fillRect(x + 3, y + 2, 2, 3); g.fillStyle = '#2a2018'; g.fillRect(x + 2, y + 2, 3, 1); g.fillRect(x + 4, y + 3, 1, 1); g.fillRect(x + 3, y + 4, 1, 1); g.fillRect(x + 3, y + 6, 1, 1); }
  g.globalAlpha = 1;
}
const wenqiDots = () => `<span class="wq">${Array.from({ length: ULT_COST }, (_, i) => `<i class="${i < G.wenqi ? 'on' : ''}"></i>`).join('')}</span>`;
function gateOpen(gate) {
  if (gate === 'needWeapon') return G.equip.length > 0;
  if (gate === 'sideA') return ['r4:m1', 'r4:m2', 'r4:m3'].every(k => G.defeated[k]);
  if (gate === 'sideB') return !!G.flags.sideB;
  const m = /^need(\d)$/.exec(gate); if (m) return G.badges.length >= +m[1];
  return false;
}

/* ---------- 腳本 ---------- */
async function warpTo(map, x, y, dir) {
  if (!LAYOUTS[map]) {                       // 地圖重建期間：還沒做到的地方先擋住
    Sound.sfx('bump');
    await say(`（「${(W.mapNames && W.mapNames[map]) || map}」還在重新設計中，暫時走不過去。）`);
    return;
  }
  Sound.sfx('door'); await fade(1, 0.22); OW.load(map, x, y, dir); autosave(); await sleep(60); await fade(0, 0.22);
  if (map === 'r1' && G.flags.tut === 'pending') {       // 教學戰在步道入口進行（城鎮裡不戰鬥）
    G.flags.tut = 'done'; const M = W.roles.mentor.name;
    await say('就在這裡練習吧！', M);
    await Battle.start({ kind: 'wild', foe: makeFoe('pen_auto', 2), tutorial: true, mentor: M });
  }
}
async function enterDoor(dw) {
  if (dw.need === 'stone') {
    if (!G.flags.stoneAwake) {
      const has = GUARDIAN_FIRST.every(k => ownsArch(k));
      const carried = GUARDIAN_FIRST.every(k => G.equip.map(id => wById(id)).some(w => w && w.arch === k));
      if (!G.ng) { Sound.sfx('bump'); await say(W.gates.stone); return; }
      if (!has) { Sound.sfx('bump'); await say('（泉眼靜靜地冒著墨色的泡。）\n小墨的話又響起來：「要先把筆、紙、墨三隻器靈都收齊。」'); return; }
      if (!carried) { Sound.sfx('bump'); await say('（泉眼微微震了一下，又安靜下來。）\n「……三隻器靈都要帶在身上才行。」（請到選單的「武器」把三隻器靈都放進攜帶欄）'); return; }
      Sound.sfx('badge'); s_flash();
      await say('（你把筆靈、紙靈、墨靈一起舉到泉眼前——三道光落進墨色的水裡。）');
      await say('（泉水劇烈翻湧，從底下傳來一個很老很老的聲音。）');
      await say('「……三寶齊聚，硯海當開。」');
      G.flags.stoneAwake = true; autosave();
      await say('（牆角的墨漬裂開了一條路。）');
    }
    if (!G.flags.inkpoolFound) { G.flags.inkpoolFound = true; await say('（泉眼下的墨漬漾開，露出一條通往地下的路——這裡就是傳說中的「硯海墨池」！）'); } }
  else if (dw.need && G.badges.length < dw.need) { Sound.sfx('bump'); await say(W.gates[dw.gate]); return; }
  if (dw.ret) G.ret = { map: OW.id, x: dw.ret.x, y: dw.ret.y };
  await warpTo(dw.to, dw.tx, dw.ty, dw.dir);
}
async function goHome() {
  if (!(await UI.yesno('要回到主畫面嗎？\n（目前進度會自動儲存）'))) return;
  autosave(); await fade(1, 0.3); titleScreen(); await fade(0, 0.3);
}
async function useDevice(d) {
  if (G.flags[d.flag]) { await say(d.doneText || '（這裡的機關已經解開了。）'); return; }
  await say(d.text);
  const q = QB.draw([d.cat], clamp((OW.L.qlv || 1) + (G.ng || 0), 1, 3), clamp(1 + (G.ng || 0), 1, 3));   // 二週目機關題也變難
  if (!q) { await say('（題庫裡還沒有這類題目，機關自行解開了。）'); G.flags[d.flag] = true; await afterDevice(d); return; }
  const tries = (G.devTry = G.devTry || {});
  const n = tries[d.flag] = (tries[d.flag] || 0) + 1;
  if (n >= 2) await say(`（這個機關已經試過 ${n - 1} 次了。想一想剛才的解析，或用「${itemName('hint')}」刪掉錯的選項。）`);
  const r = await UI.question(q, { move: d.label, mode: 'device', hint: true });
  if (!r.correct) {
    await say(d.fail || '……好像不是這樣。');
    await say('（這一題已經收進「錯題本」了，可以在選單裡複習，之後再回來挑戰這個機關。）');
    return;
  }
  G.flags[d.flag] = true; Sound.sfx('ok');
  await say(d.ok);
  await afterDevice(d);
}
/* ============ 過場：三塊碎片湊齊，硯海龍君從墨池裡升起 ============ */
async function spiritRise() {
  const role = W.roles.stoneSpirit; if (!role) return;
  Sound.play('boss');
  await Anim.run(0.5, k => OW.dark = k * .55);
  await say('（墨池的水一圈一圈往中央捲，露出池底的一方巨硯。）');

  const tx = 8 * 16 + 8, ty = 6 * 16 + 8;
  const from = [[2, 2], [15, 2], [2, 10]].map(([x, y]) => [x * 16 + 8, y * 16 + 8]);
  let t = 0;
  OW.fx.push((g, cx, cy) => {                                   // 三道碎片之光飛向島嶼
    for (const [fx, fy] of from) {
      const x = fx + (tx - fx) * t, y = fy + (ty - fy) * t - Math.sin(t * Math.PI) * 14;
      g.fillStyle = `rgba(255,244,214,${1 - t * .25})`;
      g.fillRect(Math.round(x - cx) - 1, Math.round(y - cy) - 1, 3, 3);
    }
  });
  Sound.sfx('ball');
  await Anim.run(0.9, k => { t = k; });
  OW.fx.length = 0;
  Sound.sfx('badge'); OW.flash = .8;
  await Anim.run(0.45, k => OW.flash = .8 * (1 - k));
  OW.flash = 0;

  const n = { key: 'inkpool:stoneSpirit', role, x: 8, y: 6, dir: 'down', home: 'down',
              sight: 0, ox: 0, oy: 26, fr: 0, look: role.look };
  OW.npcs.push(n);
  let ripple = 0;
  OW.fx.push((g, cx, cy) => {                                   // 水面漣漪
    if (ripple <= 0) return;
    g.strokeStyle = `rgba(206,228,255,${Math.max(0, 1 - ripple / 44)})`; g.lineWidth = 1;
    g.beginPath(); g.ellipse(tx - cx, ty + 9 - cy, ripple, ripple * .4, 0, 0, 7); g.stroke();
  });
  await Anim.run(1.1, k => { n.oy = Math.round(26 * (1 - k)); ripple = k * 46; OW.shake = k < .8 ? 1.2 : 0; });
  n.oy = 0; OW.shake = 0; OW.fx.length = 0;
  await Anim.run(0.5, k => OW.dark = .55 * (1 - k));
  OW.dark = 0;
  for (const t2 of (role.riseLines || [])) await say(t2, t2.startsWith('（') ? undefined : role.name);
  autosave();
}

async function afterDevice(d) {
  const all = Object.values(OW.L.devices).filter(x => x.group === d.group);
  if (!all.every(x => G.flags[x.flag])) return;
  const last = all.find(x => x.onAll) || d;                 // 整組完成的效果寫在其中一個機關上
  await say(last.allText || d.allText || '機關全部解開了！');
  const open = last.open || d.open;
  if (open) { for (const [x, y] of open) G.opened[OW.id + ':' + x + ',' + y] = '_'; Sound.sfx('badge'); }
  if (last.onAll) { G.flags[last.onAll] = true; autosave(); }
  if (last.onAll === 'shardsAll' && OW.id === 'inkpool') await spiritRise();   // 硯海龍君現身
}
async function talkTo(n) {
  const R = n.role; n.dir = OPP[OW.p.dir];
  switch (R.kind) {
    case 'mentor': return mentorTalk(n);
    case 'trainer': case 'rival': case 'gym': return trainerTalk(n);
    case 'quest': return questTalk(n);
    case 'rematch': return rematchTalk(n);
    case 'guardian': return guardianTalk(n);
    case 'spirit': return spiritTalk(n);
    case 'bus': return busTalk(n);
    case 'quest2': return sideQuestTalk(n);
    case 'roamer': return roamerTalk(n);
    case 'roam': return roamHintTalk(n);
    case 'guide': { const L = R.lines[Math.min(storyStage(), R.lines.length - 1)]; await say(L.join('\n\n'), R.name); return; }
    case 'healer': {
      Sound.sfx('door'); await say(R.text); G.hp = G.maxhp;
      if (G.ret) G.lastHeal = { map: G.ret.map, x: G.ret.x, y: G.ret.y };
      Sound.sfx('heal'); await say('（氣血全滿了！）'); autosave(); n.dir = n.home; return; }
    case 'shop': await say(R.text); await Shop.open((G.ret && LAYOUTS[G.ret.map].shop) || ['heal', 'hint']); n.dir = n.home; return;
    case 'smith': await say(R.lines.join('\n\n'), R.name); await Forge.open(); n.dir = n.home; return;
    case 'gift': {                                   // 送禮物（只送一次）
      const key = 'gift:' + n.key;
      if (G.flags[key]) { await say(R.after || '（東西收好了嗎？）', R.name); n.dir = n.home; return; }
      for (const t of R.lines) await say(t, R.name);
      const got = [];
      for (const [id, num] of Object.entries(R.items || {})) { G.bag[id] += num; got.push(`「${itemName(id)}」×${num}`); }
      if (R.money) { G.money += R.money; got.push(`${R.money} 文`); }
      G.flags[key] = true; Sound.sfx('badge'); autosave();
      await say(`${G.player.name} 收到了 ${got.join('、')}！`);
      n.dir = n.home; return; }
    case 'quiz': {                                   // 答對送道具（每個 NPC 只送一次，但可以重答）
      const key = 'quiz:' + n.key;
      if (G.flags[key]) { await say(R.after || '（謝謝你陪我聊天。）', R.name); n.dir = n.home; return; }
      for (const t of R.lines) await say(t, R.name);
      if (!(await UI.yesno(R.ask || '要回答看看嗎？'))) { await say(R.no || '（隨時歡迎回來。）', R.name); n.dir = n.home; return; }
      const q = QB.draw([R.cat], clamp((OW.L.qlv || 1) + (G.ng || 0), 1, 3), 1);
      if (!q) { await say('（題庫裡還沒有這類題目。）'); n.dir = n.home; return; }
      const r = await UI.question(q, { move: R.name, mode: 'device', hint: true });
      if (!r.correct) { await say(R.wrong || '……再想想看。這題收進錯題本了，想通再回來。', R.name); n.dir = n.home; return; }
      const got = [];
      for (const [id, num] of Object.entries(R.items || {})) { G.bag[id] += num; got.push(`「${itemName(id)}」×${num}`); }
      if (R.money) { G.money += R.money; got.push(`${R.money} 文`); }
      G.flags[key] = true; Sound.sfx('badge'); autosave();
      await say(R.win || '答對了！', R.name);
      await say(`${G.player.name} 收到了 ${got.join('、')}！`);
      n.dir = n.home; return; }
    default: await say(R.lines.join('\n\n'), R.name); n.dir = n.home;
  }
}
/* 公車站：可以直接前往已經到過的城鎮 */
const BUS_STOPS = [
  { map: 'chendu', x: 10, y: 13, name: '晨讀村' }, { map: 'zhuyin', x: 4, y: 9, name: '注音坡' },
  { map: 'chaoshu', x: 14, y: 6, name: '抄書巷' }, { map: 'dianji', x: 6, y: 10, name: '典籍港' },
  { map: 'tingyu', x: 6, y: 13, name: '聽雨亭' }, { map: 'huanan', x: 4, y: 13, name: '花南街' },
  { map: 'beilin', x: 6, y: 9, name: '碑林關' }, { map: 'moquan', x: 6, y: 10, name: '墨泉鄉' },
  { map: 'zhongta', x: 6, y: 13, name: '鐘塔台' },
];
async function busTalk(n) {
  const R = n.role;
  G.visited = G.visited || {}; G.visited[OW.id] = 1;
  const list = BUS_STOPS.filter(b => G.visited[b.map] && b.map !== OW.id);
  if (!list.length) { await say('（你還沒去過其他城鎮，先沿著路線走走看吧。）', R.name); return; }
  await say(R.lines[0], R.name);
  const k = await UI.ask('要去哪一個城鎮？', list.map(b => b.name).concat(['算了']));
  if (k < 0 || k >= list.length) return;
  const b = list[k];
  Sound.sfx('door'); await say(`（搭上公車，前往${b.name}……）`);
  await warpTo(b.map, b.x, b.y, 'down');
  G.lastHeal = { map: b.map, x: b.x, y: b.y };
  autosave();
}
/* 支線任務（分組報告、遺失的准考證） */
async function sideQuestTalk(n) {
  const R = n.role, key = 'sq:' + n.key;
  const done = R.need ? R.need.every(k => G.defeated[k]) : !!G.flags[R.needFlag];
  if (G.flags[key]) { await say(R.after, R.name); return; }
  if (!done) { await say(G.flags[key + ':got'] ? R.progress : R.offer, R.name); G.flags[key + ':got'] = true; autosave(); return; }
  G.flags[key] = true; Sound.sfx('badge');
  await say(R.done, R.name);
  const P = R.prize || {};
  if (P.money) G.money += P.money;
  if (P.items) for (const id in P.items) G.bag[id] += P.items[id];
  await say(`得到了 ${P.money} ${W.money}${P.items ? '、' + Object.entries(P.items).map(([id, c]) => `「${itemName(id)}」×${c}`).join('、') : ''}！`);
  autosave();
}
/* 器靈現在會待在某一張地圖，鎮上的小孩會告訴你在哪 */
const ROAM_MAPS = ['chendu', 'r1', 'zhuyin', 'r2', 'chaoshu', 'r3', 'dianji', 'r4', 'tingyu', 'huanan', 'r5', 'beilin', 'r6', 'moquan', 'zhongta'];
function rerollRoam() { const pool = ROAM_MAPS.filter(m => m !== OW.id); G.roamAt = pick(pool.length ? pool : ROAM_MAPS); }
async function roamHintTalk(n) {
  const R = n.role;
  if (!G.ng) { await say(pick(R.idle), R.name); return; }
  const left = GUARDIAN_FIRST.filter(k => !ownsArch(k));
  if (!left.length) { await say(R.none, R.name); return; }
  if (!G.roamAt || !LAYOUTS[G.roamAt]) rerollRoam();
  await say(R.found.replace('{map}', W.mapNames[G.roamAt] || G.roamAt), R.name);
}
/* 二週目：在城鎮與路線上漫遊的器靈（筆靈／紙靈／墨靈） */
async function roamerTalk(n) {
  const a = n.arch;
  await say(`（空氣突然安靜下來——${weaponName(a)}出現了！）`);
  await say(ARCH[a].gdesc || '');
  const role = { kind: 'gym', name: weaponName(a), look: { sprite: a }, reward: 900,
    win: `（${weaponName(a)}輕輕落在你手上。）`,
    foe: { lv: clamp(G.lv, 16, 30), hpMul: 1.5, el: 'none', race: ARCH[a].race, cats: ALL_CATS,
      moves: [['器靈之威', ALL_CATS, 56], ['文心一擊', ALL_CATS, 60]] }, potions: 1 };
  const res = await Battle.start({ kind: 'gym', foe: makePersonFoe(role), role, cats: ALL_CATS });
  OW.npcs = OW.npcs.filter(x => x !== n);
  rerollRoam();
  if (res !== 'win') { await say(`（${weaponName(a)}消失在空氣裡……牠跑到別的地方去了。）`); autosave(); return; }
  await Guardian.give(a);
  if (G.ng > 0 && !G.flags.stoneAwake && GUARDIAN_FIRST.every(k => ownsArch(k)))
    await say('（筆、紙、墨三隻器靈都在你身上了……小墨說過，要帶著牠們去墨泉鄉的泉眼。）');
  autosave();
}
/* 二週目：硯海龍君——先答題才能挑戰，戰鬥中牠有機率直接逃走 */
async function spiritTalk(n) {
  const R = n.role;
  await say(R.appear);
  await say(R.quiz, R.name);
  let passed = false;
  for (let t = 0; t < 2 && !passed; t++) {
    const q = QB.draw(R.foe.cats, 3, clamp(1 + (G.ng || 0), 1, 3));
    if (!q) { passed = true; break; }
    const r = await UI.question(q, { move: '硯海試煉', mode: 'device', hint: true });
    if (r.correct) { passed = true; break; }
    if (t === 0) await say('硯海龍君瞇起眼睛：「……再一題。」', R.name);   // 答錯給第二次機會
  }
  if (!passed) { await say(R.wrong); await respawnSpirit(n); return; }
  await say('（硯海龍君點了點頭。）');
  await say(R.intro, R.name);
  const role = Object.assign({}, R, { foe: Object.assign({}, R.foe, { lv: clamp(G.lv, R.foe.lv, 34) }) });
  const res = await Battle.start({ kind: 'gym', foe: makePersonFoe(role), role, cats: role.foe.cats, fleeRate: R.fleeRate });
  if (res === 'flee') { await say(R.fleeMsg); await respawnSpirit(n); return; }
  if (res !== 'win') return;
  G.money += R.reward;
  await Guardian.give('g_stone');
  OW.npcs = OW.npcs.filter(x => x !== n);
  await say(R.after);
  autosave();
  if (G.ng > 0 && G.badges.length >= 5) await StoryEnding.allDone();   // 二週目＋四寶到齊＝全部完成
}
async function respawnSpirit(n) {
  OW.npcs = OW.npcs.filter(x => x !== n);
  await sleep(300); OW.spawnSpirit(); Sound.sfx('alert');
  autosave();
}
/* 決戰前：對話選擇後，文房四寶中的一隻現身 */
async function guardianTalk(n) {
  const R = n.role;
  if (G.defeated[n.key]) { await say(R.after, R.name); return; }
  if (!G.flags.guardianAsked) {
    for (const t of R.lines) await say(fmt(t), R.name);
    const k = await UI.ask(R.choice.q, R.choice.opts, { name: R.name, cancel: false });
    await say(R.choice.replies[k], R.name);
    G.guardianAnswer = k; G.flags.guardianAsked = true;
  } else await say('（器靈還在等你。）', R.name);
  const r = await Guardian.firstMeet();          // 打贏才能收服，輸了可以再挑戰
  if (r === 'lose') { autosave(); return; }
  G.defeated[n.key] = true;
  await say(R.afterGive, R.name);
  autosave();
}
/* 通關後的再戰：等級會跟著玩家成長 */
async function rematchTalk(n) {
  const R = n.role;
  for (const t of R.lines) await say(fmt(t), t.startsWith('（') ? undefined : R.name);
  const k = await UI.ask(R.ask, ['好，來吧！', '下次吧'], { name: R.name });
  if (k !== 0) { await say(R.no, R.name); return; }
  const role = Object.assign({}, R, { foe: Object.assign({}, R.foe, { lv: Math.max(R.foe.lv, G.lv + 2) }) });
  const res = await Battle.start({ kind: 'gym', foe: makePersonFoe(role), role, cats: role.foe.cats });
  if (res !== 'win') return;
  const P = R.prize || {};
  if (P.frags) { const keys = ARCH_ORDER.filter(a => ARCH[a].ch <= 5); for (let i = 0; i < P.frags; i++) { const a = pick(keys); G.frags[a] = (G.frags[a] || 0) + 1; } }
  if (P.items) for (const id in P.items) G.bag[id] += P.items[id];
  Sound.sfx('badge');
  await say(`得到了${P.frags ? ` 隨機碎片 ×${P.frags}` : ''}${P.items ? `、${Object.entries(P.items).map(([id, n2]) => `「${itemName(id)}」×${n2}`).join('、')}` : ''}！`);
  autosave();
}
async function mentorTalk(n) {
  const R = n.role;
  if (G.equip.length) { G.hp = G.maxhp; Sound.sfx('heal'); await say(R.later, R.name); return; }
  await say(R.intro, R.name);
  const arch = await WeaponPick.open();
  giveWeapon(arch, 0); G.cur = 0; playerStats(); G.hp = G.maxhp;
  Sound.sfx('badge'); await say(`${G.player.name} 得到了「${weaponName(arch)}」！`);
  G.bag.heal += 3; G.bag.hint += 2;
  await say(`${R.name} 還送給你「${itemName('heal')}」×3、「${itemName('hint')}」×2！`);
  const t = await UI.ask('要不要先來一場練習，熟悉一下戰鬥方式？', ['好，來練習！', '不用了，直接出發'], { name: R.name });
  if (t === 0) { G.flags.tut = 'pending'; await say(R.practice, R.name); }
  else { G.flags.tut = 'skip'; await say('那就出發吧！記得：答對才打得中，找出敵人的弱點題型！', R.name); }
  autosave();
}
function giveWeapon(arch, r = 0) {
  const w = newWeapon(arch, r);
  Meta.seeWeapon(G.world, arch, r);
  addWeapon(w);
  if (!w.toBox && G.equip.length < 3) G.equip.push(w.id);
  return w;
}
async function spotted(n) {
  Sound.sfx('alert'); OW.bubble = n; await sleep(650); OW.bubble = null;
  const p = OW.p, [dx, dy] = DIRS[n.dir];
  while (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) > 1) {
    let st = 0; await Anim.run(0.2, k => { n.ox = dx * 16 * k; n.oy = dy * 16 * k; n.fr = k < .5 ? (st % 2 ? 1 : 2) : 0; });
    n.x += dx; n.y += dy; n.ox = n.oy = 0; n.fr = 0; st++;
  }
  p.dir = OPP[n.dir]; await trainerTalk(n);
}
/* ============ 過場：三位菁英倒下後，總複習大魔王從天而降 ============ */
async function bossEntrance() {
  const L = OW.L; if (!L || !L.npcs) return;
  const spec = L.npcs.find(s => s.cut === 'bossDrop' && s.after && s.after.every(k => G.defeated[k]));
  if (!spec) return;
  const flag = 'cut:' + OW.id + ':' + spec.role;
  if (G.flags[flag]) return;
  const role = W.roles[spec.role]; if (!role) return;
  G.flags[flag] = true;

  await say('（三位菁英倒下了。禮堂忽然安靜下來。）');
  await Anim.run(0.6, k => OW.dark = k * 0.72);                     // 燈光全滅
  Sound.play('boss');
  await say('（講台正上方的天花板……裂開了一道縫。）');

  const tx = spec.x * 16 + 8, ty = spec.y * 16 + 14;
  let sr = 0, ring = -1;
  OW.fx.push((g, cx, cy) => {                                        // 地面陰影逐漸放大
    if (sr <= 0) return;
    g.fillStyle = 'rgba(0,0,0,.5)';
    g.beginPath(); g.ellipse(tx - cx, ty - cy, sr, sr * .4, 0, 0, 7); g.fill();
  });
  OW.fx.push((g, cx, cy) => {                                        // 落地衝擊波
    if (ring < 0) return;
    g.strokeStyle = `rgba(255,238,196,${Math.max(0, 1 - ring / 64)})`; g.lineWidth = 2;
    g.beginPath(); g.ellipse(tx - cx, ty - cy, ring, ring * .38, 0, 0, 7); g.stroke();
  });
  await Anim.run(0.8, k => { sr = 2 + k * 15; OW.shake = k * 1.5; });

  const n = { key: OW.id + ':' + spec.role, role, x: spec.x, y: spec.y, dir: spec.dir || 'down',
              home: spec.dir, sight: 0, ox: 0, oy: -190, fr: 0, look: role.look };
  OW.npcs.push(n);
  Sound.sfx('encounter');
  await Anim.run(0.4, k => { n.oy = Math.round(-190 * (1 - k * k)); });   // 加速墜落
  n.oy = 0;

  Sound.sfx('hit'); OW.flash = .9; OW.shake = 8;
  await Anim.run(0.6, k => { OW.shake = 8 * (1 - k); OW.flash = .9 * (1 - k); ring = k * 66; });
  OW.shake = 0; OW.flash = 0; ring = -1;
  await Anim.run(0.5, k => { OW.dark = .72 * (1 - k); sr = 15 * (1 - k); });
  OW.dark = 0; OW.fx.length = 0;

  for (const t of (role.entryLines || [])) await say(t, t.startsWith('（') ? undefined : role.name);
  autosave();
}

async function trainerTalk(n) {
  const R = n.role;
  if (G.defeated[n.key]) { await say(G.route && R.afterA ? (G.route === 'a' ? R.afterA : R.afterB) : R.after, R.name); return; }
  if (!G.equip.length) { await say('……你手上沒有武器？', R.name); return; }
  if (R.needDefeated && !R.needDefeated.every(k => G.defeated[k])) { await say(R.gateText || '……', R.gateText && R.gateText.startsWith('（') ? undefined : R.name); return; }
  await say(R.intro, R.name);
  const res = await Battle.start({ kind: R.kind, foe: makePersonFoe(R), role: R, cats: R.foe.cats });
  if (res !== 'win') return;
  G.defeated[n.key] = true;
  if (R.choice && !G.route) {   // 劇情分支：兩個回答，走向不同
    const k = await UI.ask(R.choice.q, R.choice.opts, { name: R.name, cancel: false });
    G.route = k === 1 ? 'b' : 'a'; Sound.sfx('ok');
    await say(R.choice.replies[k === 1 ? 1 : 0], R.name);
    if (W.story) await Guardian.grant(true);
    await say(G.route === 'a' ? R.afterA : R.afterB, R.name);
    if (!W.story) { await say(`（你選擇了「${W.routeNames[G.route]}」，之後的劇情會跟著改變。）`); G.flags.rivalGone = true; await Anim.run(0.4, k2 => n.oy = -6 * k2); OW.npcs = OW.npcs.filter(x => x !== n); }
  }
  if (R.afterWin && R.afterWin.length) for (const t of R.afterWin) await say(t, t.startsWith('（') ? undefined : R.name);
  if (((R.kind === 'rival' && !R.choice) || R.leaves) && W.story) { G.flags['gone:' + n.key] = true; await Anim.run(0.4, k2 => n.oy = -8 * k2); OW.npcs = OW.npcs.filter(x => x !== n); }
  if (R.kind === 'trainer') await bossEntrance();      // 菁英全滅 → 大魔王登場
  if (R.kind === 'gym') {
    G.badges.push(R.badge); Sound.play('victory'); Sound.sfx('badge');
    if (G.ng > 0 && W.ngLines && W.ngLines[G.badges.length]) for (const t of W.ngLines[G.badges.length]) await say(t);
    await say(`${G.player.name} 拿回了「${R.badge}」！（${G.badges.length} / ${W.story ? 5 : 3}）`);
    if (R.rewardWeapon) { const w = giveWeapon(R.rewardWeapon, R.rewardRarity == null ? 2 : R.rewardRarity); await say(`${R.name} 還給了你武器「${weaponName(w)}」（${RARITY[w.r].n}）！${w.toBox ? '\n（背包滿了，已自動存進「電腦」）' : ''}`); }
    if (!W.story) { await say(R.after, R.name); await ChapterEnd.play(); }
    else if (R.final) { G.chapter = 6; await StoryEnding.play(); }
    else { G.chapter = G.badges.length + 1; Sound.play(W.music[OW.L.music] || OW.L.music); await sleep(200); showBanner(W.chapterName); await say(`【${W.chapterName}】\n${W.stages[storyStage()].text}`); }
  }
  autosave();
}
/* 序幕：八年級教室 */
async function storyPrologue() {
  const M = '小墨';
  for (const t of W.prologue) await say(t);
  OW.npcs.push({ key: 'c8:xiaomo', role: W.roles.xiaomo, x: 3, y: 1, dir: 'down', home: 'down', sight: 0, ox: 0, oy: 0, fr: 0, look: W.roles.xiaomo.look });
  Sound.sfx('badge'); await sleep(300);
  for (const t of W.xiaomoIntro) await say(t, M);
  giveWeapon('brush', 0); G.cur = 0; playerStats(); G.hp = G.maxhp;
  await Battle.start({ kind: 'wild', foe: makeFoe('tool_eraser', 2), tutorial: true, mentor: M });
  await say(W.xiaomoAfter[0], M);
  const w = G.weapons[0]; w.r = 1; G.frags.eraser = Math.max(0, (G.frags.eraser || 0) - 1); Meta.seeWeapon(G.world, 'brush', 1); playerStats();
  Sound.sfx('badge'); s_flash(); await say(`2B 鉛筆吸收了碎片，化成了「良品．${weaponName(w)}」！`);
  G.bag.heal += 3; G.bag.hint += 2; await say(`小墨還給了你「${itemName('heal')}」×3、「${itemName('hint')}」×2！`);
  for (const t of W.xiaomoAfter.slice(1)) await say(t, M);
  OW.npcs = OW.npcs.filter(n => n.key !== 'c8:xiaomo');
  G.flags.prologue = true; G.chapter = 1; showBanner(W.chapterName); autosave();
}
async function questTalk(n) {
  const R = Object.assign({}, n.role), q = G.quests.bugs || (G.quests.bugs = { state: 'none', n: 0 });
  for (const k of ['offer', 'progress']) R[k] = R[k].replace(/\{mon\}/g, monName('brush'));
  if (q.state === 'none') { const ok = await UI.ask(R.offer, ['好，交給我！', '下次吧'], { name: R.name }); if (ok === 0) { q.state = 'active'; Sound.sfx('ok'); await say('【支線任務】消滅 3 隻錯字蟲（可在選單「任務」查看）'); } }
  else if (q.state === 'active' && q.n < 3) await say(`${R.progress}（目前 ${q.n} / 3）`, R.name);
  else if (q.state === 'active') { q.state = 'done'; G.bag.heal2 += 2; G.bag.wenqi += 1; G.money += 200; Sound.sfx('badge');
    await say(R.done, R.name); await say(`得到了「${itemName('heal2')}」×2、「${itemName('wenqi')}」×1 和 200 ${W.money}！`); }
  else await say(R.after, R.name);
  n.dir = n.home;
}
async function foeBattle(f) {
  const res = await Battle.start({ kind: 'wild', foe: makeFoe(f.sp, f.lv) });
  if (res === 'win') { OW.foes = OW.foes.filter(x => x !== f); const q = G.quests.bugs; if (q && q.state === 'active' && f.drop === 'brush') q.n = Math.min(3, q.n + 1); }
  else if (res === 'run' || res === 'flee') OW.respawnFoe(f);   // 撤退：這一隻消失，換個地方重新出現
}
async function openChest(c) {
  if (G.chests[c.id]) { await say('寶箱是空的。'); return; }
  G.chests[c.id] = true; Sound.sfx('catch');
  if (c.weapon) { const w = giveWeapon(c.weapon, c.r || 0); Sound.sfx('badge'); await say(`打開寶箱……找到了武器「${weaponName(w)}」（${RARITY[w.r].n}）！`); await say(w.toBox ? '（背包滿了，已自動存進「電腦」，可在選單的「電腦」取出）' : G.equip.includes(w.id) ? '（已自動放入攜帶欄，可在選單「武器」中切換）' : '（攜帶欄已滿，可在選單「武器」中更換）'); }
  else { const parts = Object.entries(c.items || {}).map(([id, n]) => { G.bag[id] += n; return `「${itemName(id)}」×${n}`; });
    for (const [a, n] of Object.entries(c.frags || {})) { G.frags[a] = (G.frags[a] || 0) + n; parts.push(`「${weaponName(a)}碎片」×${n}`); }
    await say(`打開寶箱……得到了 ${parts.join('、')}！`); }
  autosave();
}
async function doorAct(key, dx, dy) {
  const D = W.doors[key]; if (!D) return;
  if (D.kind === 'home' || D.kind === 'heal') {
    Sound.sfx('door'); if (D.kind === 'heal') await say(D.text);
    G.hp = G.maxhp; G.lastHeal = { map: OW.id, x: dx, y: dy + 1 }; Sound.sfx('heal');
    await say(D.kind === 'home' ? D.text : '（氣血全滿了！）'); autosave();
  } else if (D.kind === 'shop') { Sound.sfx('door'); await say(D.text); await Shop.open(OW.L.shop); }
  else await say(D.text);
}
function autosave() { if (G && G.slot) Slots.write(G.slot, G); }
