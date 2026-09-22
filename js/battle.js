'use strict';
/* ============ 戰鬥：橫向對峙，每一招都是一道國文題 ============ */
const Battle = {
  s: null,
  async start(cfg) {
    if (this.s) return 'busy';   // 防止重複開戰
    Input.eat();
    const foe = cfg.foe;
    const s = this.s = { cfg, foe, kind: cfg.kind, first: true,
      me: { x: 0, dy: 0, a: 1, blink: false, vis: true }, fo: { x: 0, dy: 0, a: 1, blink: false, vis: true }, flash: 0, burst: null };
    Sound.play({ wild: 'battle', trainer: 'trainer', rival: 'trainer', gym: 'boss' }[cfg.kind]); Sound.sfx('encounter');
    await Ink.cover();
    Game.scene = 'battle'; if (bannerEl) { bannerEl.remove(); bannerEl = null; } if (OW.hud) { OW.hud.remove(); OW.hud = null; }
    buildHud(s); await Ink.reveal();
    let result;
    try { result = await battleLoop(s); } catch (e) { console.error(e); result = 'run'; }
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
    <div class="bh-row wpn"><span class="wicon"></span><span class="rtxt r${w.r}">${esc(weaponName(arch))}</span> <span class="muted">Lv.${weaponLv(w)}</span></div>`;
  $('.wicon', s.hm).appendChild(GFX.el(GFX.weapon(arch, W.theme), 0.6));
}
function hudFoe(s, hp) {
  const f = s.foe, v = hp == null ? f.hp : hp, r = v / f.maxhp, known = G.weakKnown[foeKey(f)];
  s.hf.innerHTML = `<div class="bh-top"><b>${esc(f.name)}</b><span>Lv.${f.lv}</span></div>
    <div class="bh-row"><span class="lab">氣血</span><div class="inkbar foe"><i style="width:${r * 100}%"></i></div></div>
    <div class="bh-row small">${known ? '弱點 ' + f.weak.map(chip).join('') : '<span class="muted">弱點：？？？</span>'}</div>`;
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
function effect(cats, f) { if (cats.some(c => f.weak.includes(c))) return 2; if (cats.some(c => f.resist.includes(c))) return 0.5; return 1; }
function calcDmg(a, d, pow, eff) { return Math.max(1, Math.floor(((2 * a.lv / 5 + 2) * pow * a.atk / d.def / 25 + 2) * eff * (0.9 + Math.random() * 0.15))); }
const qLv = () => [OW.L ? OW.L.qlv + (G.ng ? 1 : 0) : 3, G.ng ? 2 : 1];

/* ---------- 主迴圈 ---------- */
async function battleLoop(s) {
  const C = s.cfg, f = s.foe, tut = C.tutorial;
  slideIn(s.me, -90); await slideIn(s.fo, 90);
  if (f.kind === 'mon') { G.seen[f.sp] = 1; await msg(tut ? `（練習戰）${f.name} 跳了出來！` : `${f.name} 擋住了去路！`); }
  else await msg(`${f.name} 向你發起了挑戰！`);
  if (tut) await msg('選「出招」，再選一個招式。\n每個招式都對應一種國文題型——答對才打得中！', { name: C.mentor });
  let turn = 0;
  while (true) {
    turn++;
    const act = await chooseAction(s);
    if (act.type === 'run') {
      if (C.kind !== 'wild') { await msg('這場對決不能撤退！'); continue; }
      if (tut || Math.random() < 0.85) { Sound.sfx('run'); await msg('順利撤退了！'); return 'run'; }
      await msg('撤退失敗！');
    } else if (act.type === 'skill') { await playerAttack(s, act.skill); }
    else if (act.type === 'ult') { await playerUlt(s); }
    else if (act.type === 'item') { const r = await useItem(s, act.id); if (r === 'cancel') continue; }
    else if (act.type === 'switch') { G.cur = act.idx; playerStats(); hudMe(s); Sound.sfx('ok'); await msg(`換上了「${weaponName(curW())}」！`); }
    if (tut && turn === 1) {
      if (s.lastCorrect) { G.wenqi = ULT_COST; hudMe(s); await msg('答對了就會累積「文氣」（右上角的圓點）。\n文氣集滿 5 格，就能施展必殺技！\n\n這次先借你滿滿的文氣，下一回合試試看吧！', { name: C.mentor }); }
      else await msg('答錯沒關係，看完解析就是學到了！錯題會收進「錯題本」。', { name: C.mentor });
    }
    if (f.hp <= 0) return await victory(s);
    await foeTurn(s, tut && turn === 1);
    if (G.hp <= 0) {
      if (tut) { G.hp = 1; hudMe(s); await msg('練習戰不會倒下，放心！', { name: C.mentor }); continue; }
      await faint(s.me); await msg('眼前一黑……'); return 'lose';
    }
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
    const w = curW(), arch = w.arch, skills = weaponSkills(arch, weaponLv(w)).map(([name, cats, pow]) => ({ name, cats, pow: Math.round(pow * RAR_POW[w.r]) }));
    const canUlt = G.wenqi >= ULT_COST;
    const list = skills.concat(canUlt ? [{ name: '★ ' + ARCH[arch].ult, ult: true }] : []);
    const box = UI.el('box menu bcmd skills'); const info = UI.el('box skillinfo');
    const items = list.map((sk, i) => { const d = h('div', 'opt' + (sk.ult ? ' ult' : ''), esc(sk.name)); d.addEventListener('pointerdown', e => { e.preventDefault(); if (sel === i) pickIt(); else { sel = i; paint(); } }); box.appendChild(d); return d; });
    let sel = 0;
    const paint = () => {
      items.forEach((d, i) => d.classList.toggle('sel', i === sel));
      const sk = list[sel];
      if (sk.ult) { info.innerHTML = `<b>必殺技</b>．消耗 5 格文氣<br>不必答題，必定命中，威力 120！`; return; }
      const known = G.weakKnown[foeKey(s.foe)], eff = effect(sk.cats, s.foe);
      const effTxt = known ? (eff > 1 ? '<b class="good">◎ 打中弱點！</b>' : eff < 1 ? '<span class="muted">△ 效果不好</span>' : '○ 普通') : '<span class="muted">？ 效果未知</span>';
      info.innerHTML = `${sk.cats.map(chip).join('')}　威力 ${sk.pow}<br>${effTxt}${!QB.has(sk.cats) ? '<br><span class="muted small">（題庫無此類，隨機出題）</span>' : ''}`;
    };
    const pickIt = () => { Sound.sfx('ok'); done(list[sel].ult ? { type: 'ult' } : { type: 'skill', skill: list[sel] }); };
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
  await amsg(`${G.player.name} 使出了「${sk.name}」！`, 400);
  const [maxLv, minLv] = qLv();
  const q = QB.draw(sk.cats, maxLv, minLv);
  const r = q ? await UI.question(q, { mode: 'attack', move: sk.name }) : { correct: true };
  s.lastCorrect = r.correct;
  if (!r.correct) { await amsg('答錯了……攻擊落空！', 700); return; }
  const eff = effect(sk.cats, f); const dmg = calcDmg(G, f, sk.pow, eff);
  G.wenqi = Math.min(ULT_COST, G.wenqi + 1);
  await lunge(s.me, 1); Sound.sfx('hit'); inkBurst(s, 178, 72, '#2a2018'); await blink(s.fo);
  const from = f.hp; f.hp = Math.max(0, f.hp - dmg); await tweenHP(s, true, from, f.hp); hudMe(s);
  if (eff > 1) { const first = !G.weakKnown[foeKey(f)]; G.weakKnown[foeKey(f)] = 1; hudFoe(s); await amsg(first ? `打中弱點！${f.name} 的弱點是「${f.weak.join('、')}」！` : '打中弱點！', 800); }
  else if (eff < 1) await amsg('效果不太好……', 600);
  // 武器熟練度
  const before = weaponLv(w); w.mastery += eff > 1 ? 2 : 1; const after = weaponLv(w);
  if (after > before) {
    Sound.sfx('level'); playerStats(); hudMe(s);
    const sks = weaponSkills(arch, after), nw = sks.length > weaponSkills(arch, before).length ? sks[sks.length - 1][0] : null;
    await msg(`「${weaponName(arch)}」升到了 Lv.${after}！${nw ? `\n習得新招式「${nw}」！` : '\n攻擊力提升了！'}`);
  }
}
async function playerUlt(s) {
  const f = s.foe, w = curW(), arch = w.arch;
  G.wenqi = 0; hudMe(s);
  await msg(`文氣凝聚——必殺技「${ARCH[arch].ult}」！`, { auto: 700 });
  s.flash = 1; Sound.sfx('badge'); await Anim.run(0.5, k => s.flash = 1 - k); s.flash = 0;
  await lunge(s.me, 1); Sound.sfx('hit'); inkBurst(s, 178, 72, '#b8322a'); inkBurst(s, 170, 66, '#16120e'); await blink(s.fo);
  const dmg = calcDmg(G, f, Math.round(120 * RAR_POW[w.r]), 1); const from = f.hp; f.hp = Math.max(0, f.hp - dmg); await tweenHP(s, true, from, f.hp);
}
async function foeTurn(s, forceQ) {
  const f = s.foe, mv = pick(f.moves);
  await amsg(`${f.name} 使出了「${mv.name}」！`, 450);
  const chance = { wild: 0.3, trainer: 0.45, rival: 0.5, gym: 0.55 }[s.kind];
  if (forceQ || Math.random() < chance) {
    if (forceQ) await msg('敵人出招時有時會「出題」——答對就能完全閃避！', { name: s.cfg.mentor });
    const [maxLv, minLv] = qLv();
    const q = QB.draw(s.cfg.cats || mv.cats, maxLv, minLv);
    if (q) { const r = await UI.question(q, { mode: 'defend', move: mv.name }); if (r.correct) { G.wenqi = Math.min(ULT_COST, G.wenqi + 1); hudMe(s); await amsg('你看穿了招式，漂亮地閃開了！', 750); return; } }
  }
  const eff = 1; const mul = s.kind === 'wild' ? 0.8 : 0.9;
  const dmg = Math.max(1, Math.floor(calcDmg(f, G, mv.pow, eff) * mul));
  await lunge(s.fo, -1); Sound.sfx('hit'); await blink(s.me);
  const from = G.hp; G.hp = Math.max(0, G.hp - dmg); await tweenHP(s, false, from, G.hp);
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
    G.frags[f.sp] = (G.frags[f.sp] || 0) + 1; Sound.sfx('catch');
    const n = G.frags[f.sp];
    await msg(`${f.name} 掉落了「${weaponName(f.sp)}碎片」！（${n} / ${FRAG_N}）${n >= FRAG_N ? '\n碎片夠了！可以到選單的「鍛造」合成武器！' : ''}`);
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
  return 'used';
}
