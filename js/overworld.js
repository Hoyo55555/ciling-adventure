'use strict';
/* ============ 大地圖：移動、NPC、看得見的敵人、寶箱 ============ */
let G = null;   // 目前存檔
let W = null;   // 目前世界觀

const OW = {
  L: null, id: null, npcs: [], foes: [], busy: false, bubble: null, bumpCd: 0, idleT: 0, hud: null, hudKey: '',
  p: { x: 0, y: 0, dir: 'down', moving: false, t: 0, tx: 0, ty: 0, dur: 0.22, step: 0, turnWait: 0, cont: false },

  load(id, x, y, dir) {
    this.id = id; this.L = LAYOUTS[id];
    Object.assign(this.p, { x, y, dir: dir || this.p.dir, moving: false, t: 0 });
    this.npcs = (this.L.npcs || []).map(s => {
      const role = W.roles[s.role]; if (!role) return null;
      if (s.route && G.route !== s.route) return null;                 // 依劇情路線出現的 NPC
      if (s.role === 'rival' && G.flags.rivalGone) return null;        // 勁敵離開步道
      return { key: id + ':' + s.role, role, x: s.x, y: s.y, dir: s.dir, home: s.dir, sight: s.sight || 0, wander: s.wander, ox: 0, oy: 0, fr: 0, look: role.look };
    }).filter(Boolean);
    this.spawnFoes();
    G.map = id; G.x = x; G.y = y;
    Sound.play(W.music[this.L.music] || this.L.music); Cloud.paint();
    showBanner(W.mapNames[id]);
  },
  spawnFoes() {
    this.foes = []; const F = this.L.foes; if (!F) return;
    const spots = []; this.L.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'g') spots.push([x, y]); }));
    const used = new Set();
    for (let i = 0; i < F.n && spots.length; i++) {
      let s, tries = 0; do { s = pick(spots); tries++; } while ((used.has(s + '') || Math.abs(s[0] - this.p.x) + Math.abs(s[1] - this.p.y) < 4) && tries < 30);
      used.add(s + ''); const e = weighted(F.list);
      this.foes.push({ sp: e.sp, lv: rnd(F.lv[0], F.lv[1]) + (G.ng || 0) * 4, x: s[0], y: s[1], hx: s[0], hy: s[1], ox: 0, oy: 0, t: Math.random() * 1.5, cool: 0, moving: false });
    }
  },
  tile(x, y) { const r = this.L.rows; if (y < 0 || y >= r.length || x < 0 || x >= r[0].length) return this.L.indoor ? 'X' : 'T'; return r[y][x]; },
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
    if (dw) { p.cont = false; this.run(() => warpTo(dw.to, dw.tx, dw.ty, dw.dir)); return; }
    const f = this.foeAt(nx, ny);
    if (f && f.cool <= 0) { p.cont = false; this.run(() => foeBattle(f)); return; }
    if (this.solid(nx, ny) || f) { if (this.bumpCd <= 0) { Sound.sfx('bump'); this.bumpCd = 0.35; } p.cont = false; return; }
    p.moving = true; p.tx = nx; p.ty = ny; p.t = 0; p.cont = true; p.step++;
    p.dur = Input.h('B') ? 0.12 : 0.22;
  },
  onStep() {
    const p = this.p;
    const w = (this.L.warps || []).find(w => w.x === p.x && w.y === p.y);
    if (w) { this.run(() => warpTo(w.to, w.tx, w.ty, w.dir)); return true; }
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
    const n = this.npcAt(tx, ty); if (n) { this.run(() => talkTo(n)); return; }
    const c = this.chestAt(tx, ty); if (c) { this.run(() => openChest(c)); return; }
    const f = this.foeAt(tx, ty); if (f && f.cool <= 0) { this.run(() => foeBattle(f)); return; }
    if (this.L.signs && this.L.signs[key]) { this.run(() => say(W.signs[this.L.signs[key]])); return; }
    const dw = this.L.doorWarps && this.L.doorWarps[key];
    if (dw) { this.run(() => warpTo(dw.to, dw.tx, dw.ty, dw.dir)); return; }
    if (this.L.doors && this.L.doors[key]) { this.run(() => doorAct(this.L.doors[key], tx, ty)); return; }
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
    const theme = W.theme, mw = L.rows[0].length * 16, mh = L.rows.length * 16;
    const k = p.moving ? p.t : 0;
    const px = (p.moving ? p.x + (p.tx - p.x) * k : p.x) * 16, py = (p.moving ? p.y + (p.ty - p.y) * k : p.y) * 16;
    let cx = px - 112, cy = py - 72;
    cx = Math.round(mw > 240 ? clamp(cx, 0, mw - 240) : (mw - 240) / 2); cy = Math.round(mh > 160 ? clamp(cy, 0, mh - 160) : (mh - 160) / 2);
    const now = performance.now(), wf = Math.floor(now / 500) % 2;
    const x0 = Math.floor(cx / 16) - 1, y0 = Math.floor(cy / 16) - 1;
    for (let ty = y0; ty < y0 + 12; ty++) for (let tx = x0; tx < x0 + 17; tx++) { const c = this.tile(tx, ty); g.drawImage(GFX.tile(theme, c, c === '~' ? wf : 0), tx * 16 - cx, ty * 16 - cy); }
    for (const c of L.chests || []) g.drawImage(GFX.chest(!!G.chests[c.id]), c.x * 16 - cx, c.y * 16 - cy);
    const actors = this.npcs.map(n => ({ y: n.y * 16 + n.oy, draw: () => g.drawImage(GFX.person(n.look, n.dir, n.fr), n.x * 16 + n.ox - cx, n.y * 16 + n.oy - cy - 3) }));
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
    if (this.bubble) { const n = this.bubble; const bx = n.x * 16 + n.ox - cx + 3, by = n.y * 16 + n.oy - cy - 16;
      g.fillStyle = '#2a2018'; g.fillRect(bx - 1, by - 1, 12, 13); g.fillStyle = '#fbf3dc'; g.fillRect(bx, by, 10, 11); g.fillStyle = '#b8322a'; g.fillRect(bx + 4, by + 2, 2, 5); g.fillRect(bx + 4, by + 8, 2, 2); }
  },
};
const wenqiDots = () => `<span class="wq">${Array.from({ length: ULT_COST }, (_, i) => `<i class="${i < G.wenqi ? 'on' : ''}"></i>`).join('')}</span>`;
function gateOpen(gate) { if (gate === 'needWeapon') return G.equip.length > 0; return false; }

/* ---------- 腳本 ---------- */
async function warpTo(map, x, y, dir) {
  Sound.sfx('door'); await fade(1, 0.22); OW.load(map, x, y, dir); autosave(); await sleep(60); await fade(0, 0.22);
  if (map === 'route1' && G.flags.tut === 'pending') {   // 教學戰在步道入口進行（城鎮裡不戰鬥）
    G.flags.tut = 'done'; const M = W.roles.mentor.name;
    await say('就在這裡練習吧！', M);
    await Battle.start({ kind: 'wild', foe: makeFoe('brush', 2), tutorial: true, mentor: M });
  }
}
async function goHome() {
  if (!(await UI.yesno('要回到主畫面嗎？\n（目前進度會自動儲存）'))) return;
  autosave(); await fade(1, 0.3); titleScreen(); await fade(0, 0.3);
}
async function talkTo(n) {
  const R = n.role; n.dir = OPP[OW.p.dir];
  switch (R.kind) {
    case 'mentor': return mentorTalk(n);
    case 'trainer': case 'rival': case 'gym': return trainerTalk(n);
    case 'quest': return questTalk(n);
    case 'smith': await say(R.lines.join('\n\n'), R.name); await Forge.open(); n.dir = n.home; return;
    default: await say(R.lines.join('\n\n'), R.name); n.dir = n.home;
  }
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
  const w = newWeapon(arch, r); G.weapons.push(w);
  Meta.seeWeapon(G.world, arch, r);
  if (G.equip.length < 3) G.equip.push(w.id);
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
async function trainerTalk(n) {
  const R = n.role;
  if (G.defeated[n.key]) { await say(G.route && R.afterA ? (G.route === 'a' ? R.afterA : R.afterB) : R.after, R.name); return; }
  if (!G.equip.length) { await say('……你手上沒有武器？先去找導師吧。', R.name); return; }
  await say(R.intro, R.name);
  const res = await Battle.start({ kind: R.kind, foe: makePersonFoe(R), role: R, cats: R.foe.cats });
  if (res !== 'win') return;
  G.defeated[n.key] = true;
  if (R.choice && !G.route) {   // 劇情分支：兩個回答，走向不同
    const k = await UI.ask(R.choice.q, R.choice.opts, { name: R.name, cancel: false });
    G.route = k === 1 ? 'b' : 'a'; Sound.sfx('ok');
    await say(R.choice.replies[k === 1 ? 1 : 0], R.name);
    await say(G.route === 'a' ? R.afterA : R.afterB, R.name);
    await say(`（你選擇了「${W.routeNames[G.route]}」，之後的劇情會跟著改變。）`);
    G.flags.rivalGone = true; await Anim.run(0.4, k2 => n.oy = -6 * k2); OW.npcs = OW.npcs.filter(x => x !== n);
  }
  if (R.kind === 'gym') {
    G.badges.push(R.badge); Sound.play('victory'); Sound.sfx('badge');
    await say(`${G.player.name} 得到了「${R.badge}」！`);
    if (R.rewardWeapon) { const w = giveWeapon(R.rewardWeapon, R.rewardRarity || 2); await say(`${R.name} 還給了你新武器「${weaponName(w)}」（${RARITY[w.r].n}）！`); }
    await say(R.after, R.name);
    await ChapterEnd.play();
  }
  autosave();
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
  if (res === 'win') { OW.foes = OW.foes.filter(x => x !== f); const q = G.quests.bugs; if (q && q.state === 'active' && f.sp === 'brush') q.n = Math.min(3, q.n + 1); }
  else if (res === 'run') f.cool = 3;
}
async function openChest(c) {
  if (G.chests[c.id]) { await say('寶箱是空的。'); return; }
  G.chests[c.id] = true; Sound.sfx('catch');
  if (c.weapon) { const w = giveWeapon(c.weapon, c.r || 0); Sound.sfx('badge'); await say(`打開寶箱……找到了武器「${weaponName(w)}」（${RARITY[w.r].n}）！`); await say(G.equip.includes(w.id) ? '（已自動放入攜帶欄，可在選單「武器」中切換）' : '（攜帶欄已滿，可在選單「武器」中更換）'); }
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
