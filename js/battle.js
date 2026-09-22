'use strict';
/* ============ 戰鬥：每一招都是一道國文題 ============ */
const Battle = {
  s: null,
  async start(cfg) {
    Input.eat();
    const s = this.s = {
      cfg, kind: cfg.kind, foes: cfg.team.map(t => makeMon(t.sp, t.lv, t.v)), fi: 0, ai: G.party.findIndex(m => m.hp > 0), combo: 0,
      foeSpr: { vis: false, x: 0, y: 0, a: 1, dy: 0, blink: false, trainer: false, scale: 1 },
      allySpr: { vis: false, x: 0, y: 0, a: 1, dy: 0, blink: false, trainer: false, scale: 1 }, ball: null, hud: null, participants: new Set(),
    };
    const song = { wild: 'battle', trainer: 'trainer', gym: 'trainer', boss: 'boss' }[cfg.kind];
    Sound.play(song); Sound.sfx('encounter');
    for (let i = 0; i < 3; i++) { await fade(0.9, 0.07, true); await fade(0, 0.07, true); }
    await fade(1, 0.25);
    Game.scene = 'battle'; if (bannerEl) { bannerEl.remove(); bannerEl = null; } buildHud(s); await fade(0, 0.25);
    let result;
    try { result = await battleLoop(s); }
    catch (e) { console.error(e); result = 'run'; }
    await fade(1, 0.3);
    s.hud.remove(); UI.clear(); this.s = null;
    if (result === 'lose') { await blackout(); }
    Game.scene = 'overworld'; if (result !== 'lose') Sound.play(W.music[OW.L.music]);
    await fade(0, 0.3);
    if (result === 'lose') await say(`${G.player.name} 趕緊回到了能休息的地方……`);
    autosave();
    return result;
  },
  draw(g) {
    const s = this.s; if (!s) return;
    drawBattleBg(g, W.theme);
    const drawSpr = (sp, isFoe) => {
      if (!sp.vis || sp.blink) return;
      g.globalAlpha = sp.a;
      let img, x, y, w, hh;
      if (sp.trainer) { img = GFX.person(sp.trainer, isFoe ? 'down' : 'up', 0); w = hh = 48 * sp.scale; }
      else { const m = isFoe ? s.foes[s.fi] : G.party[s.ai]; img = GFX.creature(m.sp, m.variant); w = hh = 64 * sp.scale; }
      const baseX = isFoe ? 176 : 64, baseY = isFoe ? 70 : 132;
      x = baseX - w / 2 + sp.x; y = baseY - hh + 4 + sp.y + sp.dy;
      if (!isFoe && !sp.trainer) { g.save(); g.translate(Math.round(x + w), Math.round(y)); g.scale(-1, 1); g.drawImage(img, 0, 0, w, hh); g.restore(); }
      else g.drawImage(img, Math.round(x), Math.round(y), w, hh);
      g.globalAlpha = 1;
    };
    drawSpr(s.foeSpr, true); drawSpr(s.allySpr, false);
    if (s.ball) { const b = s.ball; g.fillStyle = '#181820'; g.fillRect(b.x - 4, b.y - 4, 8, 8); g.fillStyle = '#3a4a8a'; g.fillRect(b.x - 3, b.y - 3, 6, 3); g.fillStyle = '#f8f8f8'; g.fillRect(b.x - 3, b.y, 6, 3); g.fillStyle = '#181820'; g.fillRect(b.x - 1, b.y - 1, 2, 2); }
  },
};
function drawBattleBg(g, theme) {
  const sky = { school: ['#b8e4ff', '#e4f6ff'], literati: ['#e8e4d4', '#f6f2e6'], wuxia: ['#f0c890', '#f8e4c0'] }[theme];
  g.fillStyle = sky[0]; g.fillRect(0, 0, 240, 40); g.fillStyle = sky[1]; g.fillRect(0, 40, 240, 50);
  if (theme === 'school') { g.fillStyle = '#d8ccb0'; g.fillRect(10, 52, 90, 30); g.fillStyle = '#c85848'; g.fillRect(6, 46, 98, 7); g.fillStyle = '#88b8e0'; for (let x = 16; x < 96; x += 14) g.fillRect(x, 58, 8, 8); g.fillStyle = '#7ab85a'; g.fillRect(0, 80, 240, 80); g.fillStyle = '#8ac86a'; for (let y = 84; y < 160; y += 8) g.fillRect(0, y, 240, 3); }
  else if (theme === 'literati') { g.fillStyle = '#b8bcb8'; for (const [x, hh] of [[20, 34], [70, 44], [130, 30], [200, 40]]) { for (let i = 0; i < hh; i++) g.fillRect(x - i * 1.2, 86 - i, i * 2.4 + 2, 1); } g.fillStyle = '#d8dcc8'; g.fillRect(0, 86, 240, 74); g.fillStyle = '#c8ccb8'; for (let y = 92; y < 160; y += 10) g.fillRect(0, y, 240, 2); }
  else { g.fillStyle = '#f8a860'; g.fillRect(170, 16, 24, 24); g.fillStyle = '#4a7a3a'; for (const x of [8, 30, 60, 200, 222]) { g.fillRect(x, 0, 5, 88); g.fillRect(x, 20, 5, 1); } g.fillStyle = '#c8b888'; g.fillRect(0, 86, 240, 74); g.fillStyle = '#b8a878'; for (let y = 92; y < 160; y += 9) g.fillRect(0, y, 240, 2); }
  const pl = { school: ['#5a9a48', '#9ad878'], literati: ['#a8ac98', '#e8ecd8'], wuxia: ['#a08a58', '#e0cc98'] }[theme];
  GFX.pxEllipse(g, 176, 68, 44, 9, pl[0]); GFX.pxEllipse(g, 176, 67, 42, 7, pl[1]);
  GFX.pxEllipse(g, 64, 131, 54, 11, pl[0]); GFX.pxEllipse(g, 64, 130, 52, 9, pl[1]);
}

/* ---------- HUD ---------- */
function buildHud(s) {
  const wrap = h('div'); UI.root.appendChild(wrap); s.hud = wrap;
  wrap.innerHTML = `<div class="box hud foe" style="left:${U(6)};top:${U(10)};width:${U(104)};display:none"><div class="nm"><span class="n"></span><span class="l"></span></div><div class="weak"></div><div class="hpbar"><b>HP</b><div class="track"><div class="fill"></div></div></div></div>
    <div class="box hud ally" style="right:${U(4)};top:${U(63)};width:${U(108)};display:none"><div class="nm"><span class="n"></span><span class="l"></span></div><div class="hpbar"><b>HP</b><div class="track"><div class="fill"></div></div></div><div class="hpnum"></div><div class="expbar"><div class="fill"></div></div></div>`;
  s.hf = $('.foe', wrap); s.ha = $('.ally', wrap);
}
const hpClass = (el, r) => { el.classList.toggle('mid', r <= 0.5 && r > 0.2); el.classList.toggle('low', r <= 0.2); };
function hudFoe(s, hp) {
  const m = s.foes[s.fi]; const el = s.hf; el.style.display = '';
  $('.n', el).textContent = monName(m); $('.l', el).textContent = 'Lv.' + m.lv;
  const S = SPECIES[m.sp]; $('.weak', el).innerHTML = G.weakKnown[m.sp] ? '<span class="small muted">弱點 </span>' + S.weak.map(chip).join('') : (G.caught[m.sp] ? '<span class="small muted">★ 已收服</span>' : '');
  const r = (hp == null ? m.hp : hp) / m.maxhp, f = $('.fill', el); f.style.width = (r * 100) + '%'; hpClass(f, r);
}
function hudAlly(s, hp, expR) {
  const m = G.party[s.ai]; const el = s.ha; el.style.display = '';
  $('.n', el).textContent = monName(m); $('.l', el).textContent = 'Lv.' + m.lv;
  const v = hp == null ? m.hp : hp; const r = v / m.maxhp, f = $('.hpbar .fill', el); f.style.width = (r * 100) + '%'; hpClass(f, r);
  $('.hpnum', el).textContent = `${Math.ceil(v)} / ${m.maxhp}`;
  $('.expbar .fill', el).style.width = ((expR == null ? m.exp / expNeed(m.lv) : expR) * 100) + '%';
}
async function tweenHP(s, isFoe, from, to) {
  const d = Math.max(0.25, Math.min(0.8, Math.abs(from - to) / 40));
  await Anim.run(d, k => { const v = from + (to - from) * k; isFoe ? hudFoe(s, v) : hudAlly(s, v); });
}
const msg = (t, extra) => UI.say(t, Object.assign({ dark: true }, extra || {}));
const amsg = (t, ms = 650) => msg(t, { auto: ms });

/* ---------- 動畫 ---------- */
async function slideIn(sp, fromX, dur = 0.5) { sp.vis = true; sp.x = fromX; await Anim.run(dur, k => { sp.x = fromX * (1 - k); }); }
async function lunge(sp, dir) { await Anim.run(0.12, k => sp.x = dir * 10 * Math.sin(k * Math.PI)); sp.x = 0; }
async function blink(sp) { for (let i = 0; i < 4; i++) { sp.blink = true; await sleep(55); sp.blink = false; await sleep(55); } }
async function faintAnim(sp) { Sound.sfx('faint'); await Anim.run(0.4, k => { sp.dy = 30 * k; sp.a = 1 - k; }); sp.vis = false; sp.dy = 0; sp.a = 1; }
async function popIn(sp) { sp.vis = true; sp.trainer = false; await Anim.run(0.25, k => { sp.scale = 0.2 + 0.8 * k; sp.a = k; }); sp.scale = 1; sp.a = 1; }

/* ---------- 主迴圈 ---------- */
const foeOf = s => s.foes[s.fi], allyOf = s => G.party[s.ai];
async function battleLoop(s) {
  const C = s.cfg, T = C.trainer;
  s.allySpr.trainer = G.player.look; s.allySpr.vis = true;
  if (C.kind === 'wild') {
    const f = foeOf(s); G.seen[f.sp] = 1;
    slideIn(s.allySpr, -120, 0.5); await slideIn(s.foeSpr, 140, 0.5); hudFoe(s);
    await msg(`野生的 ${monName(f)} 跳出來了！`);
  } else {
    s.foeSpr.trainer = T.look; slideIn(s.allySpr, -120, 0.5); await slideIn(s.foeSpr, 140, 0.5);
    await msg(`${T.name} 向你發起了挑戰！`);
    await sendFoe(s);
  }
  await Anim.run(0.3, k => s.allySpr.x = -100 * k); s.allySpr.vis = false; s.allySpr.x = 0;
  await sendAlly(s);

  while (true) {
    const act = await chooseAction(s);
    if (act.type === 'run') {
      if (C.kind !== 'wild') { await msg('不能從對戰中逃走！'); continue; }
      if (Math.random() < 0.85) { Sound.sfx('run'); await msg('順利逃走了！'); return 'run'; }
      await msg('逃不掉！');
    } else if (act.type === 'move') { await playerAttack(s, act.mi); }
    else if (act.type === 'item') { const r = await useItemInBattle(s, act); if (r === 'cancel') continue; if (r === 'caught') return 'catch'; }
    else if (act.type === 'switch') {
      await msg(`${monName(allyOf(s))}，回來吧！`, { auto: 500 }); await faintAnim(s.allySpr);
      s.ai = act.idx; await sendAlly(s);
    }
    if (foeOf(s).hp <= 0) { const r = await foeDown(s); if (r) return r; continue; }
    await foeAttack(s);
    if (allyOf(s).hp <= 0) {
      await msg(`${monName(allyOf(s))} 倒下了！`); await faintAnim(s.allySpr);
      if (!G.party.some(m => m.hp > 0)) { await msg(`${G.player.name} 的詞靈全部失去了戰鬥能力……`); return 'lose'; }
      const idx = await Party.open({ mode: 'forced', title: '要派出哪一隻詞靈？' });
      s.ai = idx; await sendAlly(s);
    }
  }
}
async function sendFoe(s) {
  const f = foeOf(s); G.seen[f.sp] = 1;
  if (s.foeSpr.trainer && s.fi === 0) { await Anim.run(0.3, k => s.foeSpr.x = 90 * k); s.foeSpr.vis = false; s.foeSpr.x = 0; }
  await msg(`${s.cfg.trainer.name} 派出了 ${monName(f)}！`, { auto: 500 });
  s.foeSpr.trainer = false; Sound.sfx('ball'); await popIn(s.foeSpr); hudFoe(s);
}
async function sendAlly(s) {
  const m = allyOf(s); s.participants.add(s.ai);
  await msg(`去吧！${monName(m)}！`, { auto: 450 });
  s.allySpr.trainer = false; Sound.sfx('ball'); await popIn(s.allySpr); hudAlly(s);
}
function effect(cats, sp) { const S = SPECIES[sp]; if (cats.some(c => S.weak.includes(c))) return 2; if (cats.some(c => S.resist.includes(c))) return 0.5; return 1; }
function calcDmg(a, d, pow, eff) { return Math.max(1, Math.floor(((2 * a.lv / 5 + 2) * pow * a.atk / d.def / 25 + 2) * eff * (0.9 + Math.random() * 0.15))); }
const areaLv = () => (OW.L && OW.L.qlv) || 3;

async function askQ(q, mode, moveName) {
  if (!q) return { correct: true };
  return UI.question(q, { mode, move: moveName });
}
async function playerAttack(s, mi) {
  const a = allyOf(s), f = foeOf(s);
  const mv = mi < 0 ? STRUGGLE : MOVES[a.moves[mi].id]; if (mi >= 0) a.moves[mi].pp--;
  await amsg(`${monName(a)} 使出了「${mv.name}」！`, 450);
  const r = await askQ(QB.draw(mv.cats, areaLv()), 'attack', mv.name);
  if (!r.correct) { s.combo = 0; await amsg('答錯了……攻擊落空！', 700); return; }
  s.combo++;
  const eff = effect(mv.cats, f.sp); let dmg = calcDmg(a, f, mv.pow, eff); const boost = s.combo >= 3; if (boost) dmg = Math.floor(dmg * 1.5);
  await lunge(s.allySpr, 1); Sound.sfx('hit'); await blink(s.foeSpr);
  const from = f.hp; f.hp = Math.max(0, f.hp - dmg); await tweenHP(s, true, from, f.hp);
  if (eff > 1) { const first = !G.weakKnown[f.sp]; G.weakKnown[f.sp] = 1; hudFoe(s); await amsg(first ? `效果絕佳！${monName(f)} 的弱點是「${SPECIES[f.sp].weak.join('、')}」！` : '效果絕佳！', 800); }
  else if (eff < 1) await amsg('效果不太好……', 650);
  if (boost) await amsg(`連續答對 ${s.combo} 題！文思泉湧，傷害提升！`, 750);
}
async function foeAttack(s) {
  const f = foeOf(s), a = allyOf(s); const mv = MOVES[pick(f.moves).id];
  const who = s.kind === 'wild' ? '野生的 ' : '對手的 ';
  await amsg(`${who}${monName(f)} 使出了「${mv.name}」！`, 450);
  const chance = { wild: 0.3, trainer: 0.45, gym: 0.55, boss: 0.6 }[s.kind];
  if (Math.random() < chance) {
    const cats = s.cfg.cats || mv.cats;
    const r = await askQ(QB.draw(cats, areaLv()), 'defend', mv.name);
    if (r.correct) { await amsg(`你看穿了招式！${monName(a)} 漂亮地閃開了！`, 750); return; }
  }
  const eff = effect(mv.cats, a.sp); const mul = s.kind === 'wild' ? 0.75 : s.kind === 'trainer' ? 0.85 : 0.9;
  const dmg = Math.max(1, Math.floor(calcDmg(f, a, mv.pow, eff) * mul));
  await lunge(s.foeSpr, -1); Sound.sfx('hit'); await blink(s.allySpr);
  const from = a.hp; a.hp = Math.max(0, a.hp - dmg); await tweenHP(s, false, from, a.hp);
  if (eff > 1) await amsg('效果絕佳！', 600); else if (eff < 1) await amsg('效果不太好……', 600);
}
async function foeDown(s) {
  const f = foeOf(s);
  await msg(`${s.kind === 'wild' ? '野生的 ' : '對手的 '}${monName(f)} 倒下了！`); await faintAnim(s.foeSpr); s.hf.style.display = 'none';
  const mult = s.kind === 'wild' ? 1 : 1.5;
  const exp = Math.floor(f.lv * SPECIES[f.sp].expY / 5 * mult);
  await gainExp(s, allyOf(s), exp);
  if (s.fi < s.foes.length - 1) { s.fi++; await sendFoe(s); return null; }
  if (s.kind === 'wild') { const coin = f.lv * 8; G.money += coin; await msg(`撿到了 ${coin} ${W.money}！`); return 'win'; }
  Sound.play('victory');
  const T = s.cfg.trainer; s.foeSpr.trainer = T.look; await slideIn(s.foeSpr, 120, 0.4);
  await msg(`打敗了 ${T.name}！`);
  await msg(T.win, { name: T.name });
  G.money += T.reward; await msg(`${G.player.name} 得到了 ${T.reward} ${W.money}！`);
  return 'win';
}
async function gainExp(s, m, amt) {
  await amsg(`${monName(m)} 獲得了 ${amt} 點經驗值！`, 600);
  m.exp += amt;
  while (m.exp >= expNeed(m.lv)) {
    const startR = (m.exp - amt) / expNeed(m.lv);
    await Anim.run(0.4, k => hudAlly(s, null, Math.min(1, startR + (1 - startR) * k)));
    m.exp -= expNeed(m.lv); amt = m.exp; m.lv++;
    const old = m.maxhp; calcStats(m); m.hp += m.maxhp - old;
    Sound.sfx('level'); hudAlly(s, null, 0);
    await msg(`${monName(m)} 升到了 Lv.${m.lv}！`);
    for (const [L, id] of SPECIES[m.sp].learn) if (L === m.lv) await learnMove(m, id);
  }
  await Anim.run(0.3, k => hudAlly(s, null, (m.exp / expNeed(m.lv)) * k));
}
async function learnMove(m, id) {
  const mv = MOVES[id]; if (m.moves.some(x => x.id === id)) return;
  if (m.moves.length < 4) { m.moves.push({ id, pp: mv.pp }); Sound.sfx('badge'); await msg(`${monName(m)} 學會了「${mv.name}」（${mv.cats.join('、')}）！`); return; }
  await msg(`${monName(m)} 想學習「${mv.name}」（${mv.cats.join('、')}），但已經會四招了。`);
  const opts = m.moves.map(x => ({ label: MOVES[x.id].name, sub: MOVES[x.id].cats.join('、') })).concat(['放棄新招式']);
  const i = await UI.ask('要忘記哪一招呢？', opts, { dark: true, pos: { right: U(2), bottom: U(50) } });
  if (i < 0 || i === 4) { await msg(`${monName(m)} 沒有學習「${mv.name}」。`); return; }
  const old = MOVES[m.moves[i].id].name; m.moves[i] = { id, pp: mv.pp };
  await msg(`一、二……噗！${monName(m)} 忘記了「${old}」，學會了「${mv.name}」！`);
}

/* ---------- 指令選單（戰鬥／背包／詞靈／逃跑） ---------- */
async function chooseAction(s) {
  while (true) {
    const close = await UI.say(`${monName(allyOf(s))} 要怎麼做？`, { dark: true, hold: true, right: 116, fast: true });
    const i = await UI.choose(['戰鬥', '背包', '詞靈', '逃跑'], { cols: 2, cancel: false, start: s.lastCmd || 0, pos: {} , cls: 'cmd' });
    close(); s.lastCmd = i;
    if (i === 0) { const mi = await moveMenu(s); if (mi !== null) return { type: 'move', mi }; }
    else if (i === 1) { const r = await Bag.open({ battle: s }); if (r) return Object.assign({ type: 'item' }, r); }
    else if (i === 2) { const r = await Party.open({ mode: 'battle', title: '要替換成哪一隻？', current: s.ai }); if (r != null && r >= 0) return { type: 'switch', idx: r }; }
    else return { type: 'run' };
  }
}
function moveMenu(s) {
  return new Promise(res => {
    const a = allyOf(s); const f = foeOf(s);
    if (a.moves.every(x => x.pp <= 0)) { msg(`${monName(a)} 的招式都沒有 PP 了，只好「硬記」！`, { auto: 900 }).then(() => res(-1)); return; }
    const box = UI.el('box menu grid movebox'); const info = UI.el('box moveinfo');
    const items = a.moves.map((x, i) => { const d = h('div', 'opt' + (x.pp <= 0 ? ' dis' : ''), esc(MOVES[x.id].name)); d.addEventListener('pointerdown', e => { e.preventDefault(); if (sel === i) pickIt(); else { sel = i; paint(); } }); box.appendChild(d); return d; });
    for (let i = items.length; i < 4; i++) box.appendChild(h('div', 'opt dis', '－'));
    let sel = 0;
    const paint = () => {
      items.forEach((d, i) => d.classList.toggle('sel', i === sel));
      const x = a.moves[sel], M = MOVES[x.id];
      const known = G.weakKnown[f.sp]; const eff = effect(M.cats, f.sp);
      const effTxt = known ? (eff > 1 ? '<b style="color:#d04040">◎ 效果絕佳</b>' : eff < 1 ? '<span class="muted">△ 效果不好</span>' : '○ 普通') : '<span class="muted">？ 效果未知</span>';
      const noQ = !QB.has(M.cats) ? '<br><span class="muted small">（題庫無此類，隨機出題）</span>' : '';
      info.innerHTML = `PP <b>${x.pp}</b>/${M.pp}　威力 ${M.pow}<br>${M.cats.map(chip).join('')}<br>${effTxt}${noQ}`;
    };
    const pickIt = () => { if (a.moves[sel].pp <= 0) { Sound.sfx('bump'); return; } Sound.sfx('ok'); done(sel); };
    const done = v => { UI.pop(m); info.remove(); res(v); };
    const m = { el: box, update() {
      const d = Input.dir(); let s2 = sel; const n = a.moves.length;
      if (d === 'left' && sel % 2) s2--; if (d === 'right' && !(sel % 2) && sel + 1 < n) s2++; if (d === 'up' && sel >= 2) s2 -= 2; if (d === 'down' && sel + 2 < n) s2 += 2;
      if (s2 !== sel) { sel = s2; Sound.sfx('cursor'); paint(); }
      if (Input.p('A')) pickIt(); else if (Input.p('B')) { Sound.sfx('back'); done(null); }
    } };
    paint(); UI.push(m);
  });
}

/* ---------- 戰鬥中使用道具 ---------- */
async function useItemInBattle(s, act) {
  const it = ITEMS[act.id];
  if (it.use === 'ball') {
    if (s.kind !== 'wild') { await msg('不能收服別人的詞靈！'); return 'cancel'; }
    return throwBall(s);
  }
  if (it.use === 'heal' || it.use === 'pp') {
    const m = G.party[act.target]; G.bag[act.id]--;
    if (it.use === 'heal') { const from = m.hp; m.hp = Math.min(m.maxhp, m.hp + it.val); Sound.sfx('heal'); if (act.target === s.ai) await tweenHP(s, false, from, m.hp); await msg(`${monName(m)} 恢復了 ${m.hp - from} 點 HP！`); }
    else { m.moves.forEach(x => x.pp = MOVES[x.id].pp); Sound.sfx('heal'); await msg(`${monName(m)} 的招式 PP 全部恢復了！`); }
    return 'used';
  }
  await msg('這個道具要在答題時使用喔！'); return 'cancel';
}
async function throwBall(s) {
  const f = foeOf(s); G.bag.ball--;
  await amsg(`${G.player.name} 丟出了墨球！`, 400);
  Sound.sfx('ball');
  s.ball = { x: 60, y: 110 }; await Anim.run(0.45, k => { s.ball.x = 60 + (176 - 60) * k; s.ball.y = 110 - 80 * Math.sin(k * Math.PI) * 0.9 + (50 - 110) * k * 0.9; });
  s.ball.x = 176; s.ball.y = 50;
  await Anim.run(0.25, k => { s.foeSpr.scale = 1 - k * 0.9; s.foeSpr.a = 1 - k; }); s.foeSpr.vis = false;
  await Anim.run(0.2, k => s.ball.y = 50 + 12 * k);
  const rate = clamp((1 - f.hp / f.maxhp) * 0.75 + 0.2, 0.08, 0.95); const per = Math.pow(rate, 1 / 3);
  let shakes = 0; while (shakes < 3 && Math.random() < per) shakes++;
  for (let i = 0; i < Math.min(shakes, 3); i++) { await sleep(300); Sound.sfx('shake'); await Anim.run(0.24, k => s.ball.x = 176 + Math.sin(k * Math.PI * 2) * 4); s.ball.x = 176; }
  await sleep(300);
  if (shakes >= 3) {
    Sound.sfx('catch'); await msg(`太好了！成功收服了 ${monName(f)}！`);
    G.caught[f.sp] = 1; s.ball = null; f.exp = 0;
    if (G.party.length < 6) { G.party.push(f); await msg(`${monName(f)} 加入了隊伍！`); }
    else { G.box.push(f); await msg(`隊伍已滿，${monName(f)} 被送到了「書箱」。`); }
    return 'caught';
  }
  s.ball = null; s.foeSpr.vis = true; s.foeSpr.scale = 1; s.foeSpr.a = 1;
  await msg(['哎呀！牠跑出來了！', '差一點就收服了！', '可惜！再試一次吧！'][Math.min(shakes, 2)]);
  return 'used';
}

/* ---------- 全滅 ---------- */
async function blackout() {
  G.money = Math.floor(G.money / 2);
  const h0 = G.lastHeal || { map: 'town1', x: 6, y: 5 };
  healAll(); OW.load(h0.map, h0.x, h0.y, 'down');
}
