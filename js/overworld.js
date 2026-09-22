'use strict';
/* ============ 大地圖：移動、碰撞、NPC、草叢遇敵、訓練家視線 ============ */
let G = null;   // 遊戲存檔狀態
let W = null;   // 目前世界觀資料

const OW = {
  L: null, id: null, npcs: [], busy: false, bubble: null, bumpCd: 0, idleT: 0,
  p: { x: 0, y: 0, dir: 'down', moving: false, t: 0, tx: 0, ty: 0, dur: 0.22, step: 0, turnWait: 0, cont: false },

  load(id, x, y, dir) {
    this.id = id; this.L = LAYOUTS[id];
    const p = this.p; Object.assign(p, { x, y, dir: dir || p.dir, moving: false, t: 0 });
    this.npcs = (this.L.npcs || []).map(s => {
      const role = W.roles[s.role]; if (!role) return null;
      return { key: id + ':' + s.role, role, x: s.x, y: s.y, dir: s.dir, home: s.dir, sight: s.sight || 0, wander: s.wander, ox: 0, oy: 0, fr: 0, look: Object.assign({ style: role.look.style }, role.look) };
    }).filter(Boolean);
    G.map = id; G.x = x; G.y = y;
    Sound.play(W.music[this.L.music] || 'route');
    showBanner(W.mapNames[id]);
  },
  tile(x, y) { const r = this.L.rows; if (y < 0 || y >= r.length || x < 0 || x >= r[0].length) return 'T'; return r[y][x]; },
  npcAt(x, y) { return this.npcs.find(n => n.x === x && n.y === y); },
  blocked(x, y) { return SOLID.has(this.tile(x, y)) || !!this.npcAt(x, y) || y < 0 || x < 0 || y >= this.L.rows.length || x >= this.L.rows[0].length; },

  run(fn) {
    this.busy = true;
    Promise.resolve().then(fn).catch(e => { console.error(e); }).finally(() => { this.busy = false; Input.eat(); });
  },

  update(dt) {
    const p = this.p; this.bumpCd -= dt;
    if (this.busy) return;
    // NPC 偶爾轉身
    this.idleT += dt;
    if (this.idleT > 1.6) { this.idleT = 0; for (const n of this.npcs) if (n.wander && Math.random() < 0.35) n.dir = pick(['up', 'down', 'left', 'right']); }
    if (p.moving) {
      p.t += dt / p.dur;
      if (p.t >= 1) { p.x = p.tx; p.y = p.ty; p.moving = false; p.t = 0; G.x = p.x; G.y = p.y; G.steps = (G.steps || 0) + 1; if (this.onStep()) return; }
      else return;
    }
    if (Input.p('START')) { Sound.sfx('ok'); this.run(() => StartMenu.open()); return; }
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
    if (this.blocked(nx, ny)) { if (this.bumpCd <= 0) { Sound.sfx('bump'); this.bumpCd = 0.35; } p.cont = false; return; }
    p.moving = true; p.tx = nx; p.ty = ny; p.t = 0; p.cont = true; p.step++;
    p.dur = Input.h('B') ? 0.12 : 0.22;
  },

  onStep() {
    const p = this.p;
    const w = (this.L.warps || []).find(w => w.x === p.x && w.y === p.y);
    if (w) { this.run(() => warpTo(w.to, w.tx, w.ty, w.dir)); return true; }
    for (const n of this.npcs) {
      if (n.sight && !G.defeated[n.key] && this.sees(n)) { p.cont = false; this.run(() => spotted(n)); return true; }
    }
    if (this.tile(p.x, p.y) === 'g') {
      Sound.sfx('grass');
      if (G.party.length && this.L.enc && Math.random() < 0.11) { p.cont = false; this.run(() => wildEncounter()); return true; }
    }
    return false;
  },
  sees(n) {
    const [dx, dy] = DIRS[n.dir], p = this.p;
    for (let i = 1; i <= n.sight; i++) {
      const x = n.x + dx * i, y = n.y + dy * i;
      if (x === p.x && y === p.y) return true;
      if (SOLID.has(this.tile(x, y)) || this.npcAt(x, y)) return false;
    }
    return false;
  },

  interact() {
    const p = this.p, [dx, dy] = DIRS[p.dir], tx = p.x + dx, ty = p.y + dy, key = tx + ',' + ty;
    const n = this.npcAt(tx, ty);
    if (n) { this.run(() => talkTo(n)); return; }
    if (this.L.signs && this.L.signs[key]) { this.run(() => say(W.signs[this.L.signs[key]])); return; }
    if (this.L.doors && this.L.doors[key]) { this.run(() => doorAct(this.L.doors[key], tx, ty)); return; }
    if (this.tile(tx, ty) === '~') { this.run(() => say('水面波光粼粼，倒映著天空。')); return; }
  },

  /* ---------- 繪製 ---------- */
  draw(g) {
    const p = this.p, L = this.L; if (!L) return;
    const theme = W.theme, mw = L.rows[0].length * 16, mh = L.rows.length * 16;
    const k = p.moving ? p.t : 0, [dx, dy] = DIRS[p.dir];
    const px = (p.moving ? p.x + (p.tx - p.x) * k : p.x) * 16, py = (p.moving ? p.y + (p.ty - p.y) * k : p.y) * 16;
    let cx = px - 112, cy = py - 64;
    cx = mw > 240 ? clamp(cx, 0, mw - 240) : (mw - 240) / 2; cy = mh > 160 ? clamp(cy, 0, mh - 160) : (mh - 160) / 2;
    cx = Math.round(cx); cy = Math.round(cy);
    const wf = Math.floor(performance.now() / 500) % 2;
    const x0 = Math.floor(cx / 16) - 1, y0 = Math.floor(cy / 16) - 1;
    for (let ty = y0; ty < y0 + 12; ty++) for (let tx = x0; tx < x0 + 17; tx++) {
      const c = this.tile(tx, ty); g.drawImage(GFX.tile(theme, c, c === '~' ? wf : 0), tx * 16 - cx, ty * 16 - cy);
    }
    // 人物（依 y 排序）
    const actors = this.npcs.map(n => ({ y: n.y * 16 + n.oy, draw: () => {
      const spr = GFX.person(n.look, n.dir, n.fr); g.drawImage(spr, n.x * 16 + n.ox - cx, n.y * 16 + n.oy - cy - 3);
    } }));
    const fr = p.moving ? (k < 0.5 ? (p.step % 2 ? 1 : 2) : 0) : 0;
    actors.push({ y: py, draw: () => {
      g.drawImage(GFX.person(G.player.look, p.dir, fr), px - cx, py - cy - 3);
      const onGrass = this.tile(p.moving ? p.tx : p.x, p.moving ? p.ty : p.y) === 'g' && (!p.moving || k > 0.5);
      if (onGrass) g.drawImage(GFX.tile(theme, 'g'), 0, 10, 16, 6, px - cx, py - cy + 10, 16, 6);
    } });
    actors.sort((a, b) => a.y - b.y).forEach(a => a.draw());
    if (this.bubble) { const n = this.bubble; const bx = n.x * 16 + n.ox - cx + 3, by = n.y * 16 + n.oy - cy - 16;
      g.fillStyle = '#181820'; g.fillRect(bx - 1, by - 1, 12, 13); g.fillStyle = '#ffffff'; g.fillRect(bx, by, 10, 11); g.fillStyle = '#e03030'; g.fillRect(bx + 4, by + 2, 2, 5); g.fillRect(bx + 4, by + 8, 2, 2); }
  },
};

function gateOpen(gate) {
  if (gate === 'needStarter') return G.party.length > 0;
  if (gate === 'needBadges3') return G.badges.length >= 3;
  return true;
}

/* ---------- 劇情腳本 ---------- */
async function warpTo(map, x, y, dir) {
  Sound.sfx('door'); await fade(1, 0.22);
  OW.load(map, x, y, dir); autosave();
  await sleep(60); await fade(0, 0.22);
}
async function talkTo(n) {
  const R = n.role; n.dir = OPP[OW.p.dir];
  switch (R.kind) {
    case 'mentor': return mentorTalk(n);
    case 'gym': case 'boss': case 'trainer': return trainerTalk(n);
    case 'guard': return say(G.badges.length >= 3 ? R.open : R.lines.join('\n\n'), R.name);
    default: await say(R.lines.join('\n\n'), R.name); n.dir = n.home;
  }
}
async function mentorTalk(n) {
  const R = n.role;
  if (!G.party.length) {
    await say(R.intro, R.name);
    const sp = await StarterPick.open();
    const m = makeMon(sp, 5); G.party.push(m); G.seen[sp] = 1; G.caught[sp] = 1;
    Sound.sfx('badge'); await say(`${G.player.name} 和 ${monName(m)} 成為了夥伴！`);
    G.bag.ball += 5; G.bag.ink += 3; G.bag.hint += 3;
    await say(`${R.name} 送給你「墨球」×5、「墨水」×3、「錦囊」×3！`);
    await say(R.after, R.name); autosave();
  } else { healAll(); Sound.sfx('heal'); await say(R.later, R.name); }
}
async function spotted(n) {
  Sound.sfx('alert'); OW.bubble = n; await sleep(700); OW.bubble = null;
  const p = OW.p, [dx, dy] = DIRS[n.dir];
  while (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) > 1) {
    let st = 0; await Anim.run(0.2, k => { n.ox = dx * 16 * k; n.oy = dy * 16 * k; n.fr = k < .5 ? (st % 2 ? 1 : 2) : 0; });
    n.x += dx; n.y += dy; n.ox = n.oy = 0; n.fr = 0; st++;
  }
  p.dir = OPP[n.dir];
  await trainerTalk(n);
}
async function trainerTalk(n) {
  const R = n.role;
  if (G.defeated[n.key]) { await say(R.after, R.name); return; }
  if (R.need != null && G.badges.length < R.need) { await say(R.gate || '……', R.name); return; }
  if (!G.party.some(m => m.hp > 0)) { await say('你的詞靈都沒有力氣了，先去休息吧！'); return; }
  await say(R.intro, R.name);
  const res = await Battle.start({ kind: R.kind === 'trainer' ? 'trainer' : R.kind, trainer: R, team: R.team.map(([sp, lv, v]) => ({ sp, lv, v })), cats: R.cats });
  if (res === 'win') {
    G.defeated[n.key] = true;
    if (R.badge) {
      G.badges.push(R.badge); Sound.play('victory'); Sound.sfx('badge');
      await say(W.badgeMsg.replace('{badge}', R.badge));
      await say(R.after, R.name);
      Sound.play(W.music[OW.L.music]);
    }
    if (R.kind === 'boss') { await Ending.play(); }
    autosave();
  }
}
async function wildEncounter() {
  const e = weighted(OW.L.enc);
  await Battle.start({ kind: 'wild', team: [{ sp: e.sp, lv: rnd(e.min, e.max) }] });
}
async function doorAct(key, dx, dy) {
  const D = W.doors[key]; if (!D) return;
  if (D.kind === 'home' || D.kind === 'heal') {
    Sound.sfx('door');
    if (D.kind === 'heal') await say(D.text);
    healAll(); G.lastHeal = { map: OW.id, x: dx, y: dy + 1 };
    Sound.sfx('heal');
    await say(D.kind === 'home' ? D.text : '（隊伍全部恢復了元氣！）');
    autosave();
  } else if (D.kind === 'shop') { Sound.sfx('door'); await say(D.text); await Shop.open(OW.L.shop || ['ink', 'ball']); }
  else await say(D.text);
}
function healAll() { for (const m of G.party) { m.hp = m.maxhp; for (const mv of m.moves) mv.pp = MOVES[mv.id].pp; } }
function autosave() { if (G) { G.savedAt = Date.now(); Store.set('ciling_save', G); } }
