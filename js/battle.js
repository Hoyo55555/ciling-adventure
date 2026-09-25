'use strict';
/* ============ 戰鬥：橫向對峙，每一招都是一道國文題 ============ */
const Battle = {
  s: null,
  async start(cfg) {
    if (this.s) return 'busy';   // 防止重複開戰
    /* 教師測試模式：略過所有戰鬥，直接判定勝利，方便快速跑完劇情 */
    if (G && G.teacher) {
      const nm = (cfg.role && cfg.role.name) || (cfg.foe && cfg.foe.name) || '對手';
      Sound.sfx('ok');
      await say(`（教師測試版：自動戰勝「${nm}」）`);
      return 'win';
    }
    Input.eat();
    const foe = cfg.foe;
    const s = this.s = { cfg, foe, kind: cfg.kind, first: true,
      me: { x: 0, dy: 0, a: 1, blink: false, vis: true }, fo: { x: 0, dy: 0, a: 1, blink: false, vis: true }, flash: 0, burst: null, used: new Set(),
      st: { me: {}, foe: {} },                       // 狀態異常：{ 名稱: 剩餘回合 }
      buff: { atk: 0, def: 0, dodge: 0 },            // 本場道具／戰術加成
      fbuff: { atk: 0, def: 0 }, guardTurn: false };
    foe.potions = foe.potions == null ? (cfg.role && cfg.role.potions != null ? cfg.role.potions : ({ gym: 1, rival: 1, trainer: 1, wild: 0 }[cfg.kind] || 0)) : foe.potions;
    if (foe.kind === 'mon' && foe.sp) Meta.seeMon(foe.sp);
    if (cfg.role && cfg.role.wenqiFlags) {
      const n = cfg.role.wenqiFlags.filter(f => G.flags[f]).length;
      if (n) { G.wenqi = Math.min(ULT_COST, G.wenqi + n); s.wenqiGift = n; }
    }
    Sound.play({ wild: 'battle', trainer: 'trainer', rival: 'trainer', gym: 'boss' }[cfg.kind]); Sound.sfx('encounter');
    await Ink.cover();
    Game.scene = 'battle'; if (bannerEl) { bannerEl.remove(); bannerEl = null; } if (OW.hud) { OW.hud.remove(); OW.hud = null; }
    buildHud(s); await Ink.reveal();
    let result, bondMsg = [];
    try { result = await battleLoop(s); } catch (e) { console.error(e); result = 'run'; }
    for (const id of s.used) { const w = wById(id); if (!w) continue; const b0 = bondLv(w); w.bond = (w.bond || 0) + 1; if (bondLv(w) > b0) bondMsg.push(`「${weaponName(w)}」的親密度提升到 ${bondLv(w)} 級！迴避的機會變高了！`); }
    if (bondMsg.length) for (const t of bondMsg) await msg(t);
    await fade(1, 0.3);
    s.hud.remove(); UI.clear(); this.s = null;
    if (result === 'lose') { const h0 = G.lastHeal; G.hp = G.maxhp; OW.load(h0.map, h0.x, h0.y, 'down'); }
    Game.scene = 'overworld'; if (result !== 'lose') Sound.play(W.music[OW.L.music]);
    await fade(0, 0.3);
    if (result === 'lose') await say('你在休息處醒了過來，氣血已經恢復了。（戰敗不會損失金錢）');
    autosave();
    return result;
  },
  draw(g) {
    const s = this.s; if (!s) return;
    drawBattleBg(g, W.theme);
    // 玩家（面向右）與武器
    if (s.me.vis && !s.me.blink) {
      g.globalAlpha = s.me.a;
      const x = 34 + s.me.x, y = 56 + s.me.dy;
      g.drawImage(GFX.person(G.player.look, 'right', 0), x, y, 48, 48);
      const w = curW(); if (w) g.drawImage(GFX.weapon(w.arch, W.theme), x + 38, y + 18, 24, 24);
      g.globalAlpha = 1;
    }
    // 敵人
    if (s.fo.vis && !s.fo.blink) {
      g.globalAlpha = s.fo.a; const f = s.foe;
      if (f.kind === 'mon') g.drawImage(GFX.weaponMon(f.sp, W.theme), 146 + s.fo.x, 40 + s.fo.dy, 64, 64);
      else if (f.look.sprite) g.drawImage(GFX.special(f.look.sprite), 138 + s.fo.x, 22 + s.fo.dy + Math.round(Math.sin(performance.now() / 300) * 2), 80, 80);
      else g.drawImage(GFX.person(f.look, 'left', 0), 154 + s.fo.x, 56 + s.fo.dy, 48, 48);
      g.globalAlpha = 1;
    }
    if (s.burst) { const b = s.burst; g.fillStyle = b.col; for (const d of b.dots) { const r = d.r * b.k; g.fillRect(Math.round(b.x + d.dx * b.k * 40 - r / 2), Math.round(b.y + d.dy * b.k * 30 - r / 2), Math.ceil(r), Math.ceil(r)); } }
    if (s.flash > 0) { g.fillStyle = `rgba(255,250,235,${s.flash})`; g.fillRect(0, 0, 240, 160); }
  },
};
function drawBattleBg(g, theme) {
  const T = { school: ['#bfe6ff', '#e6f6ff', '#8ccf6a', '#6aaf4c'], literati: ['#ece6d2', '#f6f1e2', '#cfd3bc', '#b0b49c'], wuxia: ['#f0c890', '#f8e2bc', '#c4b27e', '#a8945e'] }[theme];
  g.fillStyle = T[0]; g.fillRect(0, 0, 240, 50); g.fillStyle = T[1]; g.fillRect(0, 50, 240, 64);
  if (theme === 'school') { g.fillStyle = '#e0d4b8'; g.fillRect(150, 56, 84, 44); g.fillStyle = '#c85848'; g.fillRect(146, 50, 92, 7); g.fillStyle = '#90bce0'; for (let x = 156; x < 230; x += 14) g.fillRect(x, 64, 8, 8); g.fillStyle = '#ffffff'; g.fillRect(20, 20, 30, 6); g.fillRect(26, 16, 18, 4); }
  else if (theme === 'literati') { g.fillStyle = '#bcc0bc'; for (const [x, hh] of [[30, 40], [90, 52], [200, 44]]) for (let i = 0; i < hh; i++) g.fillRect(x - i * 1.3, 100 - i, i * 2.6 + 2, 1); g.fillStyle = '#9aa09a'; for (const [x, hh] of [[140, 30]]) for (let i = 0; i < hh; i++) g.fillRect(x - i * 1.3, 100 - i, i * 2.6 + 2, 1); g.fillStyle = '#b8322a'; g.fillRect(212, 10, 14, 14); }
  else { g.fillStyle = '#f8a860'; g.fillRect(186, 16, 22, 22); g.fillStyle = '#4a7a3a'; for (const x of [6, 22, 120, 214, 230]) { g.fillRect(x, 0, 5, 100); g.fillRect(x, 30, 5, 1); } }
  g.fillStyle = T[2]; g.fillRect(0, 100, 240, 60); g.fillStyle = T[3]; g.fillRect(0, 100, 240, 2); for (let y = 108; y < 160; y += 9) g.fillRect(0, y, 240, 1);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(40, 102, 36, 3); g.fillRect(156, 102, 44, 3);
}

/* ---------- 墨水轉場 ---------- */
const Ink = {
  cv: null, blobs: [],
  ctx() { if (!this.cv) this.cv = $('#ink'); return this.cv.getContext('2d'); },
  async cover(dur = 0.55) {
    const g = this.ctx(); this.cv.style.opacity = 1; g.clearRect(0, 0, 240, 160);
    this.blobs = Array.from({ length: 16 }, () => ({ x: rnd(0, 240), y: rnd(0, 160), r: rnd(40, 90), d: Math.random() * 0.4 }));
    await Anim.run(dur, k => { g.fillStyle = '#16120e'; for (const b of this.blobs) { const kk = clamp((k - b.d) / (1 - b.d), 0, 1); if (kk <= 0) continue; const r = b.r * kk;
      g.beginPath(); g.arc(b.x, b.y, r, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 5; i++) { const a = i * 1.3 + b.x; g.beginPath(); g.arc(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, r * 0.25, 0, Math.PI * 2); g.fill(); } } });
    g.fillStyle = '#16120e'; g.fillRect(0, 0, 240, 160);
  },
  async reveal(dur = 0.4) { await Anim.run(dur, k => this.cv.style.opacity = 1 - k); this.ctx().clearRect(0, 0, 240, 160); this.cv.style.opacity = 0; },
};

/* ---------- HUD ---------- */
function buildHud(s) {
  const wrap = h('div'); UI.root.appendChild(wrap); s.hud = wrap;
  wrap.innerHTML = `<div class="box bh me"></div><div class="box bh foe"></div>`;
  s.hm = $('.me', wrap); s.hf = $('.foe', wrap); hudMe(s); hudFoe(s);
}
const foeKey = f => f.kind === 'mon' ? f.sp : 'p:' + f.name;
function hudMe(s, hp) {
  const v = hp == null ? G.hp : hp, r = v / G.maxhp, w = curW(), arch = w.arch;
  s.hm.innerHTML = `<div class="bh-top"><b>${esc(G.player.name)}</b><span>Lv.${G.lv}</span></div>
    <div class="bh-row"><span class="lab">氣血</span><div class="inkbar"><i class="${r <= .25 ? 'low' : ''}" style="width:${r * 100}%"></i></div><span class="num">${Math.ceil(v)}/${G.maxhp}</span></div>
    <div class="bh-row"><span class="lab">文氣</span>${wenqiDots()}${G.wenqi >= ULT_COST ? '<span class="ready">必殺可用！</span>' : ''}</div>
    <div class="bh-row wpn"><span class="wicon"></span><span class="rtxt r${w.r}">${esc(weaponName(arch))}</span> <span class="muted">Lv.${weaponLv(w)}</span>${raceChip(ARCH[arch].race)}<span class="muted">親密 ${'♥'.repeat(bondLv(w)) || '－'}</span></div>
    ${stLine(s, 'me')}`;
  $('.wicon', s.hm).appendChild(GFX.el(GFX.weapon(arch, W.theme), 0.6));
}
function hudFoe(s, hp) {
  const f = s.foe, v = hp == null ? f.hp : hp, r = v / f.maxhp, known = G.weakKnown[foeKey(f)];
  s.hf.innerHTML = `<div class="bh-top"><b>${esc(f.name)}</b><span>Lv.${f.lv}</span></div>
    <div class="bh-row"><span class="lab">氣血</span><div class="inkbar foe"><i style="width:${r * 100}%"></i></div></div>
    <div class="bh-row small">${elChip(f.el)}${f.el ? `<span class="muted">怕</span>${elChip(KE_BY[f.el])}` : '<span class="muted">無屬性</span>'}${f.race ? `　${raceChip(f.race)}<span class="muted">怕</span>${raceChip(RACE_KE_BY[f.race])}` : ''}</div>
    ${stLine(s, 'foe')}`;
}
/* ---------- 狀態異常 ---------- */
function stLine(s, who) {
  if (!s || !s.st) return '';
  const st = s.st[who], keys = Object.keys(st).filter(k => st[k] > 0);
  const bf = who === 'me' ? s.buff : s.fbuff;
  const bl = [];
  if (bf && bf.atk) bl.push(`<span class="stchip" style="background:#b8322a">▲攻 +${Math.round(bf.atk * 100)}%</span>`);
  if (bf && bf.def) bl.push(`<span class="stchip" style="background:#3a78d8">▲防 +${Math.round(bf.def * 100)}%</span>`);
  if (bf && bf.dodge) bl.push(`<span class="stchip" style="background:#3fae4a">▲避 +${Math.round(bf.dodge * 100)}%</span>`);
  if (!keys.length && !bl.length) return '';
  return `<div class="bh-row small st">${keys.map(stChip).join('')}${bl.join('')}</div>`;
}
const hasSt = (s, who, k) => (s.st[who][k] || 0) > 0;
async function addSt(s, who, k, turns) {
  const name = who === 'me' ? G.player.name : s.foe.name;
  if (who === 'me' && wardBlock(s)) { await amsg(`「${weaponName(curW())}」的辟邪之力擋下了${STATUS[k].name}！`, 700); return false; }
  if (hasSt(s, who, k)) { await amsg(`${name} 已經處於${STATUS[k].name}狀態了。`, 600); return false; }
  s.st[who][k] = turns || STATUS[k].turns || 3;
  Sound.sfx('alert'); hudMe(s); hudFoe(s);
  await amsg(`${name} ${STATUS[k].hit}`, 800);
  return true;
}
function wardBlock(s) {
  if (s.wardCharge > 0) { s.wardCharge--; return true; }
  const w = curW(); return w && w.affix && w.affix.k === 'ward' && Math.random() < w.affix.rate;
}
function clearSt(s, who) { s.st[who] = {}; hudMe(s); hudFoe(s); }
/* 回合結束的持續傷害與倒數 */
async function tickStatus(s, who) {
  const st = s.st[who], isFoe = who === 'foe', target = isFoe ? s.foe : G;
  for (const k of Object.keys(st)) {
    if (st[k] <= 0) { delete st[k]; continue; }
    const D = STATUS[k];
    if (D.dot) {
      const dmg = Math.max(1, Math.round((isFoe ? s.foe.maxhp : G.maxhp) * D.dot));
      const from = isFoe ? s.foe.hp : G.hp, to = Math.max(0, from - dmg);
      if (isFoe) s.foe.hp = to; else G.hp = to;
      Sound.sfx('hit'); await tweenHP(s, isFoe, from, to);
      await amsg(`${isFoe ? s.foe.name : G.player.name} 因為${D.name}損失了 ${dmg} 點氣血！`, 650);
      if (to <= 0) return;
    }
    st[k]--;
    if (st[k] <= 0) { delete st[k]; hudMe(s); hudFoe(s); await amsg(`${isFoe ? s.foe.name : G.player.name} 的${D.name}解除了。`, 600); }
  }
}
/* 睡眠／麻痺：有機率無法行動 */
async function stSkip(s, who) {
  for (const k of ['sleep', 'para']) {
    if (!hasSt(s, who, k)) continue;
    const D = STATUS[k];
    if (Math.random() < D.skip) {
      await amsg(`${who === 'me' ? G.player.name : s.foe.name} 因為${D.name}無法行動！`, 800);
      if (k === 'sleep' && Math.random() < 0.5) { delete s.st[who].sleep; hudMe(s); hudFoe(s); await amsg('……醒過來了！', 550); }
      return true;
    }
  }
  return false;
}
async function tweenHP(s, isFoe, from, to) {
  const d = Math.max(0.25, Math.min(0.7, Math.abs(from - to) / 40));
  await Anim.run(d, k => { const v = from + (to - from) * k; isFoe ? hudFoe(s, v) : hudMe(s, v); });
}
const msg = (t, extra) => UI.say(t, Object.assign({}, extra || {}));
const amsg = (t, ms = 650) => msg(t, { auto: ms });
async function lunge(sp, dir) { await Anim.run(0.14, k => sp.x = dir * 16 * Math.sin(k * Math.PI)); sp.x = 0; }
async function blink(sp) { for (let i = 0; i < 4; i++) { sp.blink = true; await sleep(50); sp.blink = false; await sleep(50); } }
async function slideIn(sp, from) { sp.x = from; await Anim.run(0.45, k => sp.x = from * (1 - k)); }
async function faint(sp) { Sound.sfx('faint'); await Anim.run(0.4, k => { sp.dy = 20 * k; sp.a = 1 - k; }); sp.vis = false; }
async function inkBurst(s, x, y, col) { s.burst = { x, y, col, k: 0, dots: Array.from({ length: 22 }, () => ({ dx: Math.random() * 2 - 1, dy: Math.random() * 2 - 1, r: 2 + Math.random() * 5 })) }; await Anim.run(0.35, k => s.burst.k = k); s.burst = null; }

/* ---------- 數值 ---------- */
/* 五行相剋：招式屬性＝招式第一個題型的五行；種族相剋：武器種族 vs 敵人種族 */
function effect(cats, f) { return elEffect(elOfCats(cats), f.el); }
function combo(cats, f, arch) {
  const el = elEffect(elOfCats(cats), f.el), ra = raceEffect(ARCH[arch].race, f.race);
  const dbl = el > 1 && ra > 1;
  return { el, ra, dbl, mul: el * ra * (dbl ? DOUBLE_BONUS : 1) };
}
const effText = (e, a, d) => e > 1 ? `<b class="good">◎ ${a}剋${d} ×1.5</b>` : e < 1 ? `<span class="bad">△ ${d}剋${a} ×0.7</span>` : `○ ${a || '無'}對${d} 普通`;
const raceText = (r, a, d) => !a || !d ? '' : r > 1 ? `<b class="good">◎ ${a}剋${d} ×1.3</b>` : r < 1 ? `<span class="bad">△ ${d}剋${a} ×0.85</span>` : `○ ${a}對${d} 普通`;
function calcDmg(a, d, pow, eff) { return Math.max(1, Math.floor(((2 * a.lv / 5 + 2) * pow * a.atk / d.def / 25 + 2) * eff * (0.9 + Math.random() * 0.15))); }
/* 帶入本場增益／狀態後的攻防值 */
function statsOf(s, who) {
  if (who === 'me') {
    const burn = hasSt(s, 'me', 'burn') ? STATUS.burn.atk : 1;
    return { lv: G.lv, atk: G.atk * (1 + s.buff.atk) * burn, def: G.def * (1 + s.buff.def) };
  }
  const f = s.foe, burn = hasSt(s, 'foe', 'burn') ? STATUS.burn.atk : 1;
  return { lv: f.lv, atk: f.atk * (1 + s.fbuff.atk) * burn, def: f.def * (1 + s.fbuff.def) };
}
/* 題目難度：二週目起只抽比較難的題（上下限一起往上抬） */
const qLv = () => { const ng = G.ng || 0, base = OW.L ? OW.L.qlv : 3;
  return [clamp(base + ng, 1, 3), clamp(1 + ng, 1, 3)]; };
/* 錯題強化：35% 機率從錯題本中挑同類題目再出一次 */
const AGAIN_RATE = 0.35;
function drawQ(cats, qtype) {
  const [maxLv, minLv] = qLv();
  if (qtype) { const pool = QB.active().filter(q => q.type === qtype); if (pool.length) { const fresh = pool.filter(q => !QB.recent.includes(q.id)); const q = pick(fresh.length ? fresh : pool); QB.recent.push(q.id); return { q, again: false }; } }
  const pool = G.wrong.map(w => QB.byId(w.id)).filter(q => q && cats.includes(q.cat) && !QB.off.has(QB.lessonOf(q)) && !QB.recent.includes(q.id));
  if (pool.length && Math.random() < AGAIN_RATE) { const q = pick(pool); QB.recent.push(q.id); if (QB.recent.length > 20) QB.recent.shift(); return { q, again: true }; }
  return { q: QB.draw(cats, maxLv, minLv), again: false };
}
/* 攜帶中的守護神器能力 */
const passives = () => new Set(G.equip.map(id => wById(id)).filter(Boolean).flatMap(w => passiveList(w.arch)));
async function askQ(s, cats, mode, move, qtype) {
  const d = drawQ(cats, qtype); if (!d.q) return { correct: true };
  return UI.question(d.q, { mode, move, again: d.again, autoHint: s.pas.has('eye') || s.pas.has('po') });
}

/* ---------- 主迴圈 ---------- */
async function battleLoop(s) {
  const C = s.cfg, f = s.foe, tut = C.tutorial;
  s.pas = passives();
  slideIn(s.me, -90); await slideIn(s.fo, 90);
  if (f.kind === 'mon') { G.seen[f.sp] = 1; await msg(tut ? `（練習戰）${f.name} 跳了出來！` : `${f.name} 擋住了去路！`); }
  else await msg(`${f.name} 向你發起了挑戰！`);
  if (tut) { await msg('選「出招」，再選一個招式。\n攻擊時有機會湧現文字的力量——答對問題，那一擊會更強！', { name: C.mentor });
    await msg('招式和敵人都有「五行」屬性（金剋木、木剋土、土剋水、水剋火、火剋金），還有「種族」（筆剋紙、紙剋器、器剋音、音剋兵、兵剋筆）。\n兩種同時剋制，傷害會大幅提升！', { name: C.mentor }); }
  if (s.pas.has('spring')) { G.wenqi = Math.min(ULT_COST, G.wenqi + 2); hudMe(s); await amsg('守護神器「文思泉湧」發動！文氣 +2', 800); }
  // 屬性／種族被剋制時提醒換武器（教學用）
  if (C.kind !== 'wild' && G.equip.length > 1) {
    const w0 = curW(), myEl = elOfCats(ARCH[w0.arch].cats);
    const elBad = f.el && myEl && elEffect(f.el, myEl) > 1, raBad = f.race && raceEffect(f.race, ARCH[w0.arch].race) > 1;
    if (elBad || raBad) {
      const better = G.equip.map(id => wById(id)).filter(w2 => w2 && w2.id !== w0.id)
        .find(w2 => (f.el ? elEffect(elOfCats(ARCH[w2.arch].cats), f.el) : 1) > 1 || (f.race ? raceEffect(ARCH[w2.arch].race, f.race) : 1) > 1);
      await amsg(`（${f.name} ${elBad ? `的${f.el}屬性剋制你的${myEl}` : `的${f.race}族剋制你的${ARCH[w0.arch].race}族`}！${better ? `帶著的「${weaponName(better)}」也許更有利——可以用「換武器」切換。` : '試著用「換武器」或戰術應對吧。'}）`, 1400);
    }
  }
  let turn = 0;
  if (C.fleeRate && Math.random() < C.fleeRate) s.fleeTurn = 1;   // 一進入戰鬥就判定是否逃走
  while (true) {
    turn++;
    s.guardTurn = false;
    if (s.tacticCd > 0) s.tacticCd--;
    if (await stSkip(s, 'me')) { await foeTurn(s, false); if (await endOfRound(s) === 'lose') return 'lose'; if (G.hp <= 0) { await faint(s.me); await msg('眼前一黑……'); return 'lose'; } continue; }
    const act = await chooseAction(s);
    if (act.type === 'run') {
      if (C.kind !== 'wild') { await msg('這場對決不能撤退！'); continue; }
      if (tut || Math.random() < 0.85) { Sound.sfx('run'); await msg('順利撤退了！'); return 'run'; }
      await msg('撤退失敗！');
    } else if (act.type === 'skill') { await playerAttack(s, act.skill); }
    else if (act.type === 'tactic') { await useTactic(s); }
    else if (act.type === 'ult') { await playerUlt(s); }
    else if (act.type === 'item') { const r = await useItem(s, act.id); if (r === 'cancel') continue; }
    else if (act.type === 'switch') { G.cur = act.idx; playerStats(); hudMe(s); Sound.sfx('ok'); await msg(`換上了「${weaponName(curW())}」！`); }
    if (tut && turn === 1) {
      if (s.lastCorrect) { G.wenqi = ULT_COST; hudMe(s); await msg('答對了就會累積「文氣」（右上角的圓點）。\n文氣集滿 5 格，就能施展必殺技！\n\n這次先借你滿滿的文氣，下一回合試試看吧！', { name: C.mentor }); }
      else await msg('答錯沒關係，看完解析就是學到了！錯題會收進「錯題本」。', { name: C.mentor });
    }
    if (f.hp <= 0) return await victory(s);
    if (s.fleeTurn && turn >= s.fleeTurn) { Sound.sfx('run'); await msg(`${f.name} 看了你一眼，化成一灘墨水——溜走了！`); return 'flee'; }
    await foeTurn(s, tut && turn === 1);
    if (G.hp > 0 && f.hp > 0) { const r = await endOfRound(s); if (r === 'win') return await victory(s); }
    if (f.hp <= 0) return await victory(s);
    if (G.hp <= 0) {
      if (tut) { G.hp = 1; hudMe(s); await msg('練習戰不會倒下，放心！', { name: C.mentor }); continue; }
      await faint(s.me); await msg('眼前一黑……'); return 'lose';
    }
  }
}
/* 回合結束：守護能力、武器附加效果、狀態傷害 */
async function endOfRound(s) {
  const w = curW();
  if (s.pas.has('regen') && G.hp > 0 && G.hp < G.maxhp) { const from = G.hp; G.hp = Math.min(G.maxhp, G.hp + Math.ceil(G.maxhp * 0.08)); await tweenHP(s, false, from, G.hp); await amsg(`守護神器「回春」：恢復 ${G.hp - from} 點氣血`, 600); }
  if (w && w.affix && G.hp > 0) {
    if (w.affix.k === 'regen' && G.hp < G.maxhp && Math.random() < Math.max(0.5, w.affix.rate)) {
      const from = G.hp; G.hp = Math.min(G.maxhp, G.hp + Math.ceil(G.maxhp * 0.04)); await tweenHP(s, false, from, G.hp);
      await amsg(`「${weaponName(w)}」的回春之力：恢復 ${G.hp - from} 點氣血`, 600);
    }
    if (w.affix.k === 'leak' && Math.random() < w.affix.rate) {
      const from = G.hp, dmg = Math.max(1, Math.ceil(G.maxhp * 0.03)); G.hp = Math.max(1, G.hp - dmg); await tweenHP(s, false, from, G.hp);
      await amsg(`「${weaponName(w)}」漏出了墨汁……損失 ${from - G.hp} 點氣血。`, 600);
    }
  }
  await tickStatus(s, 'foe'); if (s.foe.hp <= 0) return 'win';
  await tickStatus(s, 'me'); if (G.hp <= 0) return 'lose';
  return null;
}
/* 戰術招式：不攻擊，改為強化自己或干擾對手 */
async function useTactic(s) {
  const w = curW(), T = ARCH[w.arch].tactic;
  s.used.add(w.id); s.tacticCd = 3;
  await amsg(`${G.player.name} 使出了戰術「${T.name}」！`, 500);
  if (T.kind === 'guard') { s.guardTurn = true; Sound.sfx('ok'); await amsg(T.text, 800); return; }
  if (T.kind === 'buff') { s.buff[T.stat] = Math.min(0.6, s.buff[T.stat] + T.val); Sound.sfx('heal'); hudMe(s); await amsg(T.text, 800); return; }
  if (T.kind === 'inflict') {
    await amsg(T.text, 700);
    if (Math.random() < T.rate) await addSt(s, 'foe', Math.random() < 0.5 ? T.st : T.alt);
    else await amsg('可惜……對手沒有受到影響。', 650);
  }
}
async function chooseAction(s) {
  while (true) {
    const close = await UI.say('要怎麼做？', { hold: true, left: 64, fast: true });
    const i = await UI.choose(['出招', '換武器', '道具', '撤退'], { cancel: false, start: s.lastCmd || 0, pos: {}, cls: 'bcmd' });
    close(); s.lastCmd = i;
    if (i === 0) { const r = await skillMenu(s); if (r) return r; }
    else if (i === 1) {
      const others = G.equip.map((id, k) => ({ w: wById(id), k })).filter(o => o.k !== G.cur);
      if (!others.length) { await msg('你目前只攜帶一件武器。'); continue; }
      const k = await UI.ask('要換成哪一件武器？（會用掉這一回合）', others.map(o => ({ label: weaponName(o.w), sub: RARITY[o.w.r].n + '．' + ARCH[o.w.arch].cats.join('、') })).concat(['取消']), {});
      if (k >= 0 && k < others.length) return { type: 'switch', idx: others[k].k };
    }
    else if (i === 2) { const r = await Bag.open({ battle: true }); if (r) return { type: 'item', id: r }; }
    else return { type: 'run' };
  }
}
function skillMenu(s) {
  return new Promise(res => {
    const w = curW(), arch = w.arch, skills = weaponSkills(arch, weaponLv(w)).map(([name, cats, pow, fx]) => ({ name, cats, pow: Math.round(pow * RAR_POW[w.r]), fx }));
    const canUlt = G.wenqi >= ULT_COST, T = ARCH[arch].tactic, canTactic = weaponLv(w) >= 2 && T && !(s.tacticCd > 0);
    const list = skills.concat(canTactic ? [{ name: '◆ ' + T.name, tactic: T }] : [], canUlt ? [{ name: '★ ' + ARCH[arch].ult, ult: true }] : []);
    const box = UI.el('box menu bcmd skills' + (list.length >= 5 ? ' many' : '')); const info = UI.el('box skillinfo');
    const items = list.map((sk, i) => { const d = h('div', 'opt' + (sk.ult ? ' ult' : ''), esc(sk.name)); d.addEventListener('pointerdown', e => { e.preventDefault(); if (sel === i) pickIt(); else { sel = i; paint(); } }); box.appendChild(d); return d; });
    let sel = 0;
    const paint = () => {
      items.forEach((d, i) => d.classList.toggle('sel', i === sel));
      if (items[sel] && items[sel].scrollIntoView) items[sel].scrollIntoView({ block: 'nearest' });
      const sk = list[sel];
      if (sk.ult) { info.innerHTML = `<b>必殺技</b>．消耗 5 格文氣<br>不必答題，必定命中，威力 120！`; return; }
      if (sk.tactic) { const T = sk.tactic;
        info.innerHTML = `<b>戰術</b>．不造成傷害，用掉這一回合<br>${T.kind === 'guard' ? '這一回合不會受到傷害' : T.kind === 'buff' ? `${BOND_STAT_NAME[T.stat]} 提升 ${Math.round(T.val * 100)}%（本場有效）` : `${Math.round(T.rate * 100)}% 機率讓對手${STATUS[T.st].name}或${STATUS[T.alt].name}`}`; return; }
      const el = elOfCats(sk.cats), c = combo(sk.cats, s.foe, arch), ra = ARCH[arch].race;
      info.innerHTML = `${sk.cats.slice(0, 2).map(chip).join('')}　威力 ${sk.pow}<br>${elChip(el)}${effText(c.el, el, s.foe.el)}<br>${raceChip(ra)}${raceText(c.ra, ra, s.foe.race) || '<span class="muted">對手無種族</span>'}${c.dbl ? '<br><b class="good">★ 雙重剋制！再 ×1.2</b>' : ''}${sk.fx && sk.fx.inflict ? `<br><b style="color:${STATUS[sk.fx.inflict].col}">${Math.round(sk.fx.rate * 100)}% 機率讓對手${STATUS[sk.fx.inflict].name}</b>` : ''}`;
    };
    const pickIt = () => { Sound.sfx('ok'); const it = list[sel]; done(it.ult ? { type: 'ult' } : it.tactic ? { type: 'tactic' } : { type: 'skill', skill: it }); };
    const done = v => { UI.pop(m); info.remove(); res(v); };
    const m = { el: box, update() {
      const d = Input.dir();
      if (d === 'up' && sel > 0) { sel--; Sound.sfx('cursor'); paint(); } if (d === 'down' && sel < list.length - 1) { sel++; Sound.sfx('cursor'); paint(); }
      if (Input.p('A')) pickIt(); else if (Input.p('B')) { Sound.sfx('back'); done(null); }
    } };
    paint(); UI.push(m);
  });
}
async function playerAttack(s, sk) {
  const f = s.foe, w = curW(), arch = w.arch;
  s.used.add(w.id);
  await amsg(`${G.player.name} 使出了「${sk.name}」！`, 400);
  let qBonus = 1;
  if (Math.random() < ATTACK_Q_RATE) {          // 攻擊時有機率出題，答對威力提升
    await amsg('文字的力量湧現——答對問題，這一擊會更強！', 700);
    let r = await askQ(s, sk.cats, 'attack', sk.name);
    if (!r.correct && s.pas.has('retry') && !s.retryUsed) { s.retryUsed = true; await msg('守護神器「再思」發動！再給你一次機會！'); r = await askQ(s, sk.cats, 'attack', sk.name); }
    s.lastCorrect = r.correct;
    if (!r.correct) { await amsg('答錯了……這一擊落空了！', 700); return; }
    qBonus = ATTACK_Q_POW;
    G.wenqi = Math.min(ULT_COST, G.wenqi + 1);
    if (w.r >= 3 && G.hp < G.maxhp) G.hp = Math.min(G.maxhp, G.hp + Math.ceil(G.maxhp * 0.03));   // 珍品以上：答對恢復 3% 氣血
  }
  else { G.wenqi = Math.min(ULT_COST, G.wenqi + 1); }   // 沒出題的一擊：命中就累積文氣
  const c = combo(sk.cats, f, arch);
  let mul = c.mul;
  if (c.el < 1 && w.r >= 5) mul = mul / c.el;                      // 神品：被屬性剋制時威力不降低
  if (c.el > 1 && w.r >= 2) mul *= 1.15;                           // 精品以上：屬性剋制時威力 +15%
  if (c.el > 1 && w.r >= 4 && qBonus > 1) G.wenqi = Math.min(ULT_COST, G.wenqi + 1);
  let dmg = Math.floor(calcDmg(statsOf(s, 'me'), statsOf(s, 'foe'), sk.pow, mul) * qBonus * (s.pas.has('bane') && s.kind === 'gym' ? 1.5 : 1));
  let fxMsg = '';
  const af = w.affix;
  if (af && Math.random() < af.rate) {
    if (af.k === 'keen') { dmg = Math.floor(dmg * 1.5); fxMsg = `「${weaponName(w)}」的銳利之力發動，傷害提升！`; }
    if (af.k === 'brittle') { dmg = Math.max(1, Math.floor(dmg * 0.5)); fxMsg = `「${weaponName(w)}」有些脆裂，威力減半了……`; }
    if (af.k === 'focus') { G.wenqi = Math.min(ULT_COST, G.wenqi + 1); fxMsg = `「${weaponName(w)}」凝神聚氣，文氣額外 +1！`; }
    if (af.k === 'heavy') { await amsg(`「${weaponName(w)}」太沉重了，這一擊揮空了……`, 800); return; }
  }
  await lunge(s.me, 1); Sound.sfx('hit'); inkBurst(s, 178, 72, '#2a2018'); await blink(s.fo);
  const from = f.hp; f.hp = Math.max(0, f.hp - dmg); await tweenHP(s, true, from, f.hp); hudMe(s);
  if (fxMsg) await amsg(fxMsg, 750);
  const el = elOfCats(sk.cats), ra = ARCH[arch].race;
  if (c.dbl) { G.weakKnown[foeKey(f)] = 1; await amsg(`${el}剋${f.el}、${ra}剋${f.race}——雙重剋制！傷害大幅提升！`, 900); }
  else if (c.el > 1) { G.weakKnown[foeKey(f)] = 1; await amsg(`${el}剋${f.el}！效果絕佳！`, 750); }
  else if (c.ra > 1) await amsg(`${ra}剋${f.race}！種族相剋，傷害提升！`, 750);
  else if (c.el < 1) await amsg(`${f.el}剋${el}……效果不太好。`, 650);
  else if (c.ra < 1) await amsg(`${f.race}剋${ra}……有點吃力。`, 650);
  // 招式附帶的狀態異常 + 武器附加效果的狀態
  if (f.hp > 0 && sk.fx && sk.fx.inflict && Math.random() < sk.fx.rate) await addSt(s, 'foe', sk.fx.inflict);
  if (f.hp > 0 && af && Math.random() < af.rate) {
    const m = { flame: 'burn', venom: 'poison', numb: 'para', drowse: 'sleep' }[af.k];
    if (m) { await amsg(`「${weaponName(w)}」的${AFFIX[af.k].name}之力發動！`, 650); await addSt(s, 'foe', m); }
  }
  // 武器熟練度
  const before = weaponLv(w);
  if (qBonus > 1) w.mastery += (c.mul > 1 ? 2 : 1) + (w.r >= 1 ? 1 : 0);   // 答對題目才會提升熟練度
  const after = weaponLv(w);
  if (after > before) {
    Sound.sfx('level'); playerStats(); hudMe(s);
    const sks = weaponSkills(arch, after), nw = sks.length > weaponSkills(arch, before).length ? sks[sks.length - 1][0] : null;
    await msg(`「${weaponName(arch)}」升到了 Lv.${after}！${nw ? `\n習得新招式「${nw}」！` : '\n攻擊力提升了！'}`);
  }
}
async function playerUlt(s) {
  const f = s.foe, w = curW(), arch = w.arch;
  s.used.add(w.id); G.wenqi = 0; hudMe(s);
  await msg(`文氣凝聚——必殺技「${ARCH[arch].ult}」！`, { auto: 700 });
  s.flash = 1; Sound.sfx('badge'); await Anim.run(0.5, k => s.flash = 1 - k); s.flash = 0;
  await lunge(s.me, 1); Sound.sfx('hit'); inkBurst(s, 178, 72, '#b8322a'); inkBurst(s, 170, 66, '#16120e'); await blink(s.fo);
  const dmg = Math.floor(calcDmg(statsOf(s, 'me'), statsOf(s, 'foe'), Math.round(120 * RAR_POW[w.r]), 1) * (s.pas.has('bane') && s.kind === 'gym' ? 1.5 : 1)); const from = f.hp; f.hp = Math.max(0, f.hp - dmg); await tweenHP(s, true, from, f.hp);
}
async function foeTurn(s, forceQ) {
  const f = s.foe;
  if (await stSkip(s, 'foe')) return;
  if (await foeUseItem(s)) return;                       // 館主、勁敵等會使用道具
  const mv = pick(f.moves);
  await amsg(`${f.name} 使出了「${mv.name}」！`, 450);
  const w = curW(), chance = Math.max(0, dodgeChance(w, s.buff.dodge) - (s.dodgeDown ? 0.1 : 0));
  if (forceQ || mv.qtype || Math.random() < chance) {
    if (mv.qtype === 'order') await amsg('文章的段落被打亂了！把它排回正確的順序！', 800);
    else await amsg(`「${weaponName(w)}」和你變得更親密了，牠努力想幫你迴避——答對問題就能閃過！`, 900);
    if (forceQ) await msg('武器親密度夠高時，敵人出招會讓你「出題」——答對就能完全閃避！', { name: s.cfg.mentor });
    const r = await askQ(s, mv.qtype ? mv.cats : (s.cfg.cats || mv.cats), 'defend', mv.name, mv.qtype);
    if (r.correct) { G.wenqi = Math.min(ULT_COST, G.wenqi + 1); hudMe(s); await amsg('你看穿了招式，漂亮地閃開了！', 750); return; }
  }
  if (s.guardTurn) { await lunge(s.fo, -1); s.flash = 0.6; await Anim.run(0.25, k => s.flash = 0.6 * (1 - k)); await amsg('你早已架好架式，完全擋下了這一擊！', 800); return; }
  const myEl = elOfCats(ARCH[curW().arch].cats), mvEl = elOfCats(mv.cats);
  const rMul = f.race ? (raceEffect(f.race, ARCH[curW().arch].race) > 1 ? 1.15 : raceEffect(f.race, ARCH[curW().arch].race) < 1 ? 0.9 : 1) : 1;
  const eff = (elEffect(mvEl, myEl) > 1 ? 1.25 : elEffect(mvEl, myEl) < 1 ? 0.8 : 1) * rMul;   // 敵人屬性與種族對你手上武器
  const mul = s.kind === 'wild' ? 0.8 : 0.82;
  let dmg = Math.max(1, Math.floor(calcDmg(statsOf(s, 'foe'), statsOf(s, 'me'), mv.pow, eff) * mul));
  const wa = curW().affix;
  if (wa && wa.k === 'ward' && Math.random() < wa.rate) { dmg = Math.max(1, Math.floor(dmg * 0.6)); await amsg(`「${weaponName(curW())}」的辟邪之力減輕了傷害！`, 700); }
  if (s.pas.has('guard')) { dmg = Math.max(1, Math.floor(dmg * 0.6)); if (!s.guardMsg) { s.guardMsg = true; await amsg('守護神器「護心」守護著你，傷害減輕了！', 700); } }
  if (s.pas.has('shield') && !s.shieldUsed) { s.shieldUsed = true; await lunge(s.fo, -1); s.flash = 0.8; await Anim.run(0.3, k => s.flash = 0.8 * (1 - k)); await amsg('守護神器「護心」發動！這次攻擊完全擋下了！', 800); return; }
  await lunge(s.fo, -1); Sound.sfx('hit'); await blink(s.me);
  const from = G.hp; G.hp = Math.max(0, G.hp - dmg); await tweenHP(s, false, from, G.hp);
  if (eff > 1) await amsg(`${mvEl}剋${myEl}！你受到較重的傷害！`, 650); else if (eff < 1) await amsg(`${myEl}剋${mvEl}，你擋下了部分傷害。`, 650);
  // 反擊：武器附加效果
  if (wa && wa.k === 'thorn' && G.hp > 0 && Math.random() < wa.rate) {
    const back = Math.max(1, Math.round(dmg * 0.25)), from2 = f.hp; f.hp = Math.max(0, f.hp - back);
    Sound.sfx('hit'); await tweenHP(s, true, from2, f.hp);
    await amsg(`「${weaponName(curW())}」反彈了 ${back} 點傷害！`, 700);
  }
  // 敵人的招式也可能造成狀態異常（依對手屬性）
  if (G.hp > 0 && f.el && EL_STATUS[f.el] && Math.random() < (s.kind === 'wild' ? 0.06 : 0.12)) await addSt(s, 'me', EL_STATUS[f.el]);
}
/* 館主／勁敵／天王／魔王：血量偏低時會吃藥，也可能強化自己或解除狀態 */
async function foeUseItem(s) {
  const f = s.foe;
  if (f.kind !== 'person' || !f.potions) return false;
  const low = f.hp / f.maxhp;
  const bad = Object.keys(s.st.foe).filter(k => s.st.foe[k] > 0);
  if (bad.length && Math.random() < 0.35) {
    f.potions--; clearSt(s, 'foe'); Sound.sfx('heal');
    await amsg(`${f.name} 用了道具，解除了不良狀態！`, 850);
    return true;
  }
  if (low < 0.4 && Math.random() < 0.5) {
    f.potions--; const from = f.hp, amt = Math.round(f.maxhp * 0.22);
    f.hp = Math.min(f.maxhp, f.hp + amt); Sound.sfx('heal'); await tweenHP(s, true, from, f.hp);
    await amsg(`${f.name} 喝下了補給品，恢復了 ${f.hp - from} 點氣血！`, 900);
    return true;
  }
  if ((s.buff.atk || s.buff.def || s.buff.dodge) && Math.random() < 0.25) {
    f.potions--; s.buff = { atk: 0, def: 0, dodge: 0 }; playerStats(); hudMe(s); Sound.sfx('alert');
    await amsg(`${f.name} 撒出墨粉，把你剛才的加成全都抹掉了！`, 900);
    return true;
  }
  if (!s.dodgeDown && Math.random() < 0.15) {
    f.potions--; s.dodgeDown = true; hudMe(s); Sound.sfx('alert');
    await amsg(`${f.name} 加快了出招速度，你變得比較難看穿牠的動作……（迴避機率下降）`, 950);
    return true;
  }
  if (low < 0.75 && !s.fbuff.atk && Math.random() < 0.18) {
    f.potions--; s.fbuff.atk = 0.25; hudFoe(s); Sound.sfx('alert');
    await amsg(`${f.name} 用了提神道具，氣勢變強了！（攻擊提升）`, 900);
    return true;
  }
  return false;
}
async function victory(s) {
  const f = s.foe, C = s.cfg;
  await faint(s.fo);
  if (f.kind === 'mon') await msg(`打倒了 ${f.name}！`);
  else { Sound.play('victory'); s.fo.vis = true; s.fo.a = 1; s.fo.dy = 0; await msg(C.role.win, { name: f.name }); }
  const exp = f.exp; await amsg(`獲得 ${exp} 點經驗值！`, 600);
  G.exp += exp;
  while (G.exp >= expNeed(G.lv)) {
    G.exp -= expNeed(G.lv); G.lv++; const old = G.maxhp; playerStats(); G.hp += G.maxhp - old; hudMe(s);
    Sound.sfx('level'); await msg(`${G.player.name} 升到了 Lv.${G.lv}！氣血上限提升到 ${G.maxhp}！`);
  }
  const coin = f.kind === 'mon' ? f.lv * 8 : C.role.reward; G.money += coin;
  await msg(`得到了 ${coin} ${W.money}！`);
  if (f.kind === 'mon' && (C.tutorial || Math.random() < FRAG_RATE)) {
    G.frags[f.drop] = (G.frags[f.drop] || 0) + 1; Sound.sfx('catch');
    const n = G.frags[f.drop];
    await msg(`${f.name} 掉落了「${weaponName(f.drop)}碎片」！（${n} / ${FRAG_N}）${n >= FRAG_N ? '\n碎片夠了！可以到選單的「鍛造」合成武器！' : ''}`);
  }
  if (C.tutorial) { G.wenqi = 0; await msg('很好！打倒敵人會得到經驗值，讓你升級。\n\n用同一件武器答對題目，武器熟練度會提升，還能學到新招式喔！\n\n去吧！', { name: C.mentor }); }
  return 'win';
}
async function useItem(s, id) {
  const it = ITEMS[id];
  if (it.use === 'hint') { await msg(`「${itemName(id)}」要在答題時使用喔！`); return 'cancel'; }
  G.bag[id]--;
  if (it.use === 'heal') { const from = G.hp; G.hp = Math.min(G.maxhp, G.hp + it.val); Sound.sfx('heal'); await tweenHP(s, false, from, G.hp); await msg(`用了「${itemName(id)}」，恢復了 ${G.hp - from} 點氣血！`); }
  if (it.use === 'wenqi') { G.wenqi = Math.min(ULT_COST, G.wenqi + it.val); Sound.sfx('heal'); hudMe(s); await msg(`用了「${itemName(id)}」，文氣增加了！`); }
  if (it.use === 'buff') { s.buff[it.stat] = Math.min(0.6, s.buff[it.stat] + it.val); playerStats(); Sound.sfx('heal'); hudMe(s); await msg(`用了「${itemName(id)}」，${BOND_STAT_NAME[it.stat]}提升了！（本場有效）`); }
  if (it.use === 'ward') { s.wardCharge = (s.wardCharge || 0) + 1; Sound.sfx('heal'); await msg(`用了「${itemName(id)}」，接下來的一次狀態異常會被擋下！`); }
  if (it.use === 'cure') { const had = Object.keys(s.st.me).length; clearSt(s, 'me'); Sound.sfx('heal'); await msg(had ? `用了「${itemName(id)}」，所有不良狀態都解除了！` : `用了「${itemName(id)}」，但現在沒有不良狀態……`); }
  return 'used';
}
