'use strict';
/* ============ 主程式：開場、標題、流程 ============ */
const Game = { scene: 'title' };
/* 目前只開放「國中生涯」獨立劇情；要恢復世界觀選擇，把這裡改成 null */
const STORY_WORLD = 'school';
const HEROES = [
  { style: 'school', hair: '#2a2228', cloth: '#f8f8f8', cloth2: '#3a58a0' },
  { style: 'literati', hair: '#2a2228', cloth: '#88a0c8', cloth2: '#384870', gender: 'f' },
  { style: 'wuxia', hair: '#2a2228', cloth: '#a84040', cloth2: '#e0c050' }];
const Title = {
  t: 0,
  draw(g) {
    this.t += 1 / 60; const t = this.t;
    g.fillStyle = '#f3ead2'; g.fillRect(0, 0, 240, 160);
    g.fillStyle = '#e4d8b8'; for (let y = 0; y < 160; y += 6) g.fillRect(0, y, 240, 1);
    const hills = (col, base, amp, sp, off) => { g.fillStyle = col; for (let x = 0; x < 240; x++) { const xx = x + t * sp + off; const hh = base + Math.sin(xx / 30) * amp + Math.sin(xx / 11) * amp * 0.3; g.fillRect(x, 118 - hh, 1, hh); } };
    hills('#d4ccb4', 46, 10, 3, 0); hills('#b8b4a0', 30, 8, 8, 90); hills('#8a8a7a', 16, 5, 16, 40);
    g.fillStyle = '#b8322a'; g.fillRect(196, 18, 18, 18); g.fillStyle = '#f3ead2'; g.fillRect(200, 22, 10, 2); g.fillRect(204, 22, 2, 10); g.fillRect(200, 28, 10, 2);
    const off = Math.floor(t * 30) % 16;
    for (let x = -16; x < 256; x += 16) { g.drawImage(GFX.tile('literati', ','), x - off, 118); g.drawImage(GFX.tile('literati', '.'), x - off, 134); g.drawImage(GFX.tile('literati', '.'), x - off, 150); }
    const fr = Math.floor(t * 6) % 2 ? 1 : 2;
    HEROES.forEach((L, i) => { const x = 40 + i * 34; g.drawImage(GFX.person(L, 'right', fr), x, 94, 24, 24); g.drawImage(GFX.weapon(STARTER_ARCHS[i], L.style), x + 18, 104, 10, 10); });
    const bob = Math.abs(Math.sin(t * 5)) * 4; g.drawImage(GFX.weaponMon('pen_auto', 'school'), 176, 88 - bob, 30, 30);
  },
};
const Blank = { draw(g) { g.fillStyle = '#16120e'; g.fillRect(0, 0, 240, 160); } };
/* ---------- 世界觀選擇動畫：三幅畫卷依序升起，選定後展開並介紹角色與冒險 ---------- */
function drawDiorama(g, wid, x, w, t) {
  const Wd = WORLDS[wid], th = Wd.theme, i = WORLD_ORDER.indexOf(wid);
  const sky = { school: ['#bfe6ff', '#e6f6ff'], literati: ['#e6dfc8', '#f6f1e2'], wuxia: ['#f0b878', '#f8dcb0'] }[wid];
  g.fillStyle = sky[0]; g.fillRect(x, 0, w, 64); g.fillStyle = sky[1]; g.fillRect(x, 32, w, 32);
  if (wid === 'wuxia') { g.fillStyle = '#f8a860'; g.fillRect(x + w - 30, 10, 16, 16); }
  if (wid === 'literati') { g.fillStyle = '#b8322a'; g.fillRect(x + w - 26, 10, 12, 12); }
  g.save(); g.translate(0, -18);
  for (let tx = Math.floor(x / 16) * 16 - 16; tx < x + w + 16; tx += 16) { g.drawImage(GFX.tile(th, 'T'), tx, 48); g.drawImage(GFX.tile(th, '.'), tx, 64); g.drawImage(GFX.tile(th, '.'), tx, 80); g.drawImage(GFX.tile(th, '.'), tx, 96); g.drawImage(GFX.tile(th, ','), tx, 112); g.drawImage(GFX.tile(th, '.'), tx, 128); g.drawImage(GFX.tile(th, 'g'), tx, 144); g.drawImage(GFX.tile(th, 'g'), tx, 160); }
  const cx = x + w / 2, bx = Math.round(cx - 24);
  ['R', 'R', 'R'].forEach((c, k) => g.drawImage(GFX.tile(th, c), bx + k * 16, 64)); ['#', 'D', 'W'].forEach((c, k) => g.drawImage(GFX.tile(th, c), bx + k * 16, 80));
  const fr = Math.floor(t * 6) % 2 ? 1 : 2, walk = w > 100 ? Math.sin(t * 0.8) * 30 : 0;
  g.drawImage(GFX.person(HEROES[i], 'right', fr), Math.round(cx - 34 + walk), 98, 32, 32);
  g.drawImage(GFX.weapon(STARTER_ARCHS[i], th), Math.round(cx - 12 + walk), 110, 14, 14);
  const bob = Math.abs(Math.sin(t * 4 + i)) * 3; g.drawImage(GFX.weaponMon(['paper_dict', 'tool_ruler', 'sound_bell'][i], th), Math.round(cx + 8 + walk * 0.5), Math.round(102 - bob), 26, 26);
  g.restore();
}
const WorldPick = {
  t: 0, sel: 0, enter: 0, exp: 0, chosen: -1, exclude: null,
  draw(g) {
    this.t += 1 / 60; g.fillStyle = '#16120e'; g.fillRect(0, 0, 240, 160);
    for (let i = 0; i < 3; i++) {
      let x = i * 80, w = 80;
      if (this.chosen >= 0) { if (i !== this.chosen) { if (this.exp > 0.98) continue; } else { x = i * 80 * (1 - this.exp); w = 80 + 160 * this.exp; } }
      const rise = (1 - clamp(this.enter * 2.2 - i * 0.55, 0, 1)); const oy = Math.round(rise * rise * 160);
      g.save(); g.beginPath(); g.rect(x, oy, w, 160); g.clip(); g.translate(0, oy);
      drawDiorama(g, WORLD_ORDER[i], x, w, this.t);
      const dim = this.chosen < 0 ? (i !== this.sel ? 0.55 : 0) : (i !== this.chosen ? 0.7 : 0);
      if (WORLD_ORDER[i] === this.exclude) { g.fillStyle = 'rgba(16,12,8,.75)'; g.fillRect(x, 0, w, 160); }
      else if (dim) { g.fillStyle = `rgba(16,12,8,${dim})`; g.fillRect(x, 0, w, 160); }
      g.restore();
      if (this.chosen < 0) { g.fillStyle = '#16120e'; g.fillRect(x + w - 1, 0, 2, 160); }
    }
  },
  async open(opt = {}) {
    Object.assign(this, { exclude: opt.exclude || null, chosen: -1, exp: 0, enter: 0 });
    this.sel = WORLD_ORDER.findIndex(w => w !== this.exclude);
    UI.clear(); setWorldClass(null); Game.scene = 'worldpick'; Sound.play('title');
    const head = UI.el('box wp-head', esc(opt.title || '選擇你要冒險的世界'));
    const labels = WORLD_ORDER.map((w, i) => UI.el('box wp-label', `<b>${WORLDS[w].icon} ${esc(WORLDS[w].name)}</b>${w !== STORY_WORLD ? '<br><span class="small muted">製作中</span>' : Meta.d.cleared[w] ? '<br><span class="small good">✓ 已通關</span>' : ''}`, { left: U(i * 80 + 4), width: U(72) }));
    const foot = UI.el('wp-foot', '←→ 選擇　A 決定　B 返回');
    const cleanup = () => { head.remove(); labels.forEach(l => l.remove()); foot.remove(); };
    await Anim.run(1.1, k => this.enter = k);
    while (true) {
      const paint = () => labels.forEach((l, i) => l.classList.toggle('sel', i === this.sel));
      paint();
      const pick = await new Promise(res => {
        const ok = i => { if (WORLD_ORDER[i] === this.exclude) { Sound.sfx('bump'); return; } UI.pop(m); res(i); };
        const m = { update: () => { const d = Input.dir();
          if (d === 'left' && this.sel > 0) { this.sel--; Sound.sfx('cursor'); paint(); } if (d === 'right' && this.sel < 2) { this.sel++; Sound.sfx('cursor'); paint(); }
          if (Input.p('A')) ok(this.sel); else if (Input.p('B')) { Sound.sfx('back'); UI.pop(m); res(-1); } } };
        labels.forEach((l, i) => l.onpointerdown = e => { e.preventDefault(); if (this.sel === i) ok(i); else { this.sel = i; Sound.sfx('cursor'); paint(); } });
        UI.push(m);
      });
      if (pick < 0) { cleanup(); return null; }
      if (WORLD_ORDER[pick] !== STORY_WORLD) {      // 其他世界觀尚未開放
        Sound.sfx('bump');
        await UI.say(`${WORLDS[WORLD_ORDER[pick]].icon} ${WORLDS[WORLD_ORDER[pick]].name}\n\n製作中，未來有機會開放。\n目前請先體驗「🏫 國中生涯」的完整故事！`);
        continue;
      }
      Sound.sfx('ok'); this.chosen = pick; [head, foot, ...labels].forEach(e => e.style.display = 'none');
      await Anim.run(0.7, k => this.exp = k * k * (3 - 2 * k));
      const Wd = WORLDS[WORLD_ORDER[pick]]; setWorldClass(Wd.id); Sound.play(Wd.music.town);
      const ttl = UI.el('box wp-title', `${Wd.icon} ${esc(Wd.name)}`);
      for (const t of Wd.intro) await UI.say(t);
      const k = await UI.ask('要進入這個世界嗎？', ['進入這個世界', '回去重新選擇']);
      ttl.remove();
      if (k === 0) { cleanup(); return Wd.id; }
      setWorldClass(null); Sound.play('title'); await Anim.run(0.5, q => this.exp = 1 - q); this.chosen = -1; [head, foot, ...labels].forEach(e => e.style.display = '');
    }
  },
};
const SCENES = { title: Title, overworld: OW, battle: Battle, blank: Blank, worldpick: WorldPick };

function setWorldClass(wid) { document.body.classList.remove('w-school', 'w-literati', 'w-wuxia'); if (wid) document.body.classList.add('w-' + wid); }

/* ---------- 版面大小 ---------- */
function resize() {
  const narrow = window.innerWidth <= 560; const padH = narrow ? 250 : 215, vw = window.innerWidth - (narrow ? 34 : 64), vh = window.innerHeight - padH;
  const w = Math.max(240, Math.floor(Math.min(vw, vh * 1.5, 900)));
  document.documentElement.style.setProperty('--w', w + 'px'); document.documentElement.style.setProperty('--u', (w / 240) + 'px');
}

/* ---------- 迴圈 ---------- */
let lastT = performance.now();
function loop(now) { const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; frame(dt); requestAnimationFrame(loop); }
window.__run = async (n = 60) => { const ch = new MessageChannel(); const y = () => new Promise(r => { ch.port1.onmessage = () => r(); ch.port2.postMessage(0); }); for (let i = 0; i < n; i++) { frame(1 / 60); await y(); } };
function frame(dt) {
  Input.tick();
  if (UI.active) UI.update(); else { const S = SCENES[Game.scene]; if (S.update) S.update(dt); }
  Anim.step(dt);
  if (G && (Game.scene === 'overworld' || Game.scene === 'battle')) G.time = (G.time || 0) + dt;
  const g = CTX; g.imageSmoothingEnabled = false; (SCENES[Game.scene] || Blank).draw(g);
}

/* ---------- 開場動畫：一滴墨落在宣紙上 ---------- */
async function opening() {
  const cv = $('#ink'), g = cv.getContext('2d'); cv.style.opacity = 1; Game.scene = 'blank';
  let skip = false; const m = { update() { if (Input.p('A') || Input.p('B') || Input.p('START')) skip = true; } }; UI.push(m);
  const paper = () => { g.fillStyle = '#f3ead2'; g.fillRect(0, 0, 240, 160); };
  const steps = [
    [0.9, k => { paper(); if (skip) return; const y = -10 + 90 * k * k; g.fillStyle = '#16120e'; g.fillRect(118, y, 4, 6); g.fillRect(117, y + 2, 6, 3); }],
    [1.1, k => { paper(); g.fillStyle = '#16120e'; const r = 4 + 70 * Math.sqrt(k); g.beginPath(); g.arc(120, 82, r, 0, 7); g.fill(); for (let i = 0; i < 9; i++) { const a = i * 0.7; g.beginPath(); g.arc(120 + Math.cos(a) * r * 1.1, 82 + Math.sin(a) * r * 0.9, r * 0.18, 0, 7); g.fill(); } }],
    [0.9, k => { g.fillStyle = '#16120e'; g.fillRect(0, 0, 240, 160); g.globalAlpha = k; g.fillStyle = '#f3ead2'; g.font = 'bold 26px "PingFang TC","Noto Sans TC",sans-serif'; g.textAlign = 'center'; g.fillText('詞靈冒險', 120, 88); g.globalAlpha = 1; }],
  ];
  for (const [d, fn] of steps) { if (skip) break; await Anim.run(d, fn); }
  UI.pop(m); Game.scene = 'title';
  await Anim.run(0.5, k => cv.style.opacity = 1 - k); g.clearRect(0, 0, 240, 160); cv.style.opacity = 0;
}

/* ---------- 標題 ---------- */
async function titleScreen() {
  UI.clear(); setWorldClass(null); Game.scene = 'title'; G = null; W = null; Sound.play('title');
  const logo = UI.el('logo', `<div class="t1">詞靈冒險</div><div class="t2">翡翠之卷</div><div class="t3">國中國文 × 像素冒險　試玩版</div>`);
  // 右上角小連結：沒有雲端存檔時，教師從這裡登入；教師登入後才出現「教師設定」
  const tlink = UI.el('teacherlink', ''); const paintLink = () => { tlink.textContent = TeacherAuth.on ? '👩‍🏫 教師設定' : (Cloud.enabled ? '' : '🔑 教師登入'); tlink.style.display = tlink.textContent ? '' : 'none'; };
  tlink.addEventListener('pointerdown', async e => { e.preventDefault(); if (UI.stack.some(m => m.el && m.el.classList.contains('panel'))) return;
    if (TeacherAuth.on) Teacher.open(); else { const r = await LoginPanel.open(); if (r === 'teacher') await say('教師登入成功！標題選單已出現「教師設定」。'); paintLink(); Cloud.paint(); } });
  paintLink();
  let sel = 0; Cloud.paint();
  if (Cloud.enabled && !Cloud.user && !Cloud.skipped && !TeacherAuth.on) { logo.style.display = 'none'; const r = await LoginPanel.open(); if (r === 'skip' || r === null) Cloud.skipped = true; if (r === 'created') await say('帳號建立完成！之後請用同一組班級、座號和密碼登入。'); if (r === 'teacher') await say('教師登入成功！標題選單已出現「教師設定」。'); logo.style.display = ''; paintLink(); Cloud.paint(); }
  while (true) {
    // 只有「新的冒險」與「設定」一定出現；其他選項要有理由才出現
    const labels = [].concat(Slots.any() ? ['繼續冒險'] : [], ['新的冒險'], Meta.hasAny() ? ['紀錄館'] : [], ['設定'], TeacherAuth.on ? ['教師設定', '教師登出'] : Cloud.enabled ? [Cloud.user ? '登出' : '登入帳號'] : []);
    const i = await UI.choose(labels, { pos: { left: '50%', bottom: U(6), transform: 'translateX(-50%)' }, cancel: false, start: Math.min(sel, labels.length - 1), cls: 'titlemenu', cols: labels.length > 3 ? 2 : 1 });
    sel = i; const L = labels[i];
    logo.style.display = 'none';
    if (L === '繼續冒險') { const n = await SlotScreen.open('load'); if (n) { logo.remove(); tlink.remove(); return Flow.load(n); } }
    if (L === '新的冒險') { const n = await SlotScreen.open('new'); if (n) { logo.remove(); const ok = await Flow.newGame(n); if (ok) return; return titleScreen(); } }
    if (L === '登出' || L === '登入帳號') {
      if (L === '登出' && !(await Cloud.logoutFlow())) { logo.style.display = ''; continue; }
      const r = await LoginPanel.open(); if (r === 'skip' || r === null) Cloud.skipped = true; if (r === 'created') await say('帳號建立完成！之後請用同一組班級、座號和密碼登入。'); if (r === 'teacher') await say('教師登入成功！標題選單已出現「教師設定」。'); paintLink(); Cloud.paint(); }
    if (L === '教師設定') await Teacher.open();
    if (L === '教師登出') { if (await UI.yesno('要登出教師模式嗎？')) { TeacherAuth.logout(); Cloud.skipped = false; paintLink(); Cloud.paint(); await say('已登出教師模式。'); logo.remove(); tlink.remove(); return titleScreen(); } }
    if (L === '紀錄館') await RecordHall.open();
    if (L === '設定') await SettingsPanel.open();
    logo.style.display = '';
  }
}

/* ---------- 存檔資料 ---------- */
function freshState(world, player, slot) {
  return { v: 2, slot, world, player, map: 'town1', x: 6, y: 5, lv: 3, exp: 0, hp: null, weapons: [], equip: [], cur: 0, wenqi: 0,
    bag: { heal: 0, heal2: 0, wenqi: 0, hint: 0, atkup: 0, defup: 0, dodgeup: 0, cure: 0 }, frags: {}, money: 300, chapter: 1, badges: [], flags: {}, defeated: {}, chests: {}, quests: {}, opened: {}, titles: [],
    stats: {}, chStats: {}, wrong: [], seen: {}, weakKnown: {}, lastHeal: { map: 'town1', x: 6, y: 5 }, ret: { map: 'town1', x: 6, y: 5 }, time: 0, streak: 0, bestStreak: 0, answered: 0, ng: 0 };
}
const Flow = {
  async load(n) {
    G = Slots.read(n); if (!G) return titleScreen(); G.slot = n; W = WORLDS[G.world]; setWorldClass(G.world);
    const base = freshState(G.world, G.player, n); for (const k in base) if (G[k] == null) G[k] = base[k];
    if (!Array.isArray(G.weapons)) {   // 舊版存檔：武器由「每種一件」轉換為武器實體
      const old = G.weapons, map = {}; G.weapons = [];
      for (const a in old) { const w = newWeapon(a, 0); w.mastery = old[a].mastery || 0; G.weapons.push(w); map[a] = w.id; }
      G.equip = G.equip.map(a => map[a]).filter(Boolean); G.cur = 0;
    }
    if (G.map === 'town2' && !LAYOUTS.town2.rows[G.y]) { G.x = 11; G.y = 12; }
    for (const id of ITEM_ORDER) if (G.bag[id] == null) G.bag[id] = 0;        // 舊存檔補上新道具欄位
    if (!Array.isArray(G.titles)) G.titles = [];
    for (const w of G.weapons) {
      if (w.bond == null) w.bond = 0; if (w.affix === undefined) w.affix = null;
      const na = fixArch(w.arch);                     // 舊的守護神器換成新的文房四寶
      if (na !== w.arch) { w.arch = na; w.r = 6; Meta.seeWeapon(G.world, na, 6); }
      if (!ARCH[w.arch]) w.arch = 'brush';            // 萬一遇到不存在的武器，至少不會壞掉
    }
    if (G.flags.guardianGot) G.flags.guardianGot = fixArch(G.flags.guardianGot);
    G.titles = (G.titles || []).filter(id => ALL_TITLES().some(t => t.id === id));
    playerStats();
    if (W.story && !G.flags.prologue) { const S0 = W.start; G.map = S0.map; G.x = S0.x; G.y = S0.y; G.weapons = []; G.equip = []; }
    await fade(1, 0.3); UI.clear(); Game.scene = 'overworld'; OW.load(G.map, G.x, G.y, 'down'); await fade(0, 0.3);
    if (W.story && !G.flags.prologue) OW.run(() => storyPrologue());
  },
  async newGame(slot, preset) {
    while (true) {
      UI.clear(); setWorldClass(null); Game.scene = 'title';
      const wid = await WorldPick.open(); if (!wid) return false;
      W = WORLDS[wid]; setWorldClass(wid); Game.scene = 'title'; G = freshState(wid, { name: '', title: '', look: {} }, slot);
      const pl = await CharCreate.open(wid, preset); if (!pl) { G = null; W = null; continue; }
      G.player = pl; playerStats();
      await Flow.start(); return true;
    }
  },
  /* 二週目：保留養成，重新挑戰所有道館，敵人更強，開放隱藏地圖 */
  async newGamePlus() {
    const ng = (G.ng || 0) + 1;
    for (const t of (W.ngIntro || [])) await say(t, t.startsWith('（') ? undefined : '小墨');
    await say('【二週目】\n等級、武器、碎片、圖鑑與稱號都會保留，但所有對手都會變得更強，題目也會變難。\n五座道館與最終魔王可以重新挑戰！');
    G.ng = ng;
    G.badges = []; G.defeated = {}; G.opened = {}; G.devTry = {}; G.route = null; G.chapter = 1;
    const keep = { prologue: true, tut: 'skip', cleared: true };
    G.flags = keep;
    G.hp = G.maxhp; G.wenqi = 0;
    const S0 = { map: 'campus', x: 15, y: 6 };
    G.lastHeal = { map: S0.map, x: S0.x, y: S0.y }; G.ret = Object.assign({}, S0);
    autosave();
    await fade(1, 0.4); UI.clear(); Game.scene = 'overworld'; OW.load(S0.map, S0.x, S0.y, 'down'); await fade(0, 0.4);
    showBanner(`二週目．難度提升（×${ng}）`);
    await say('（回到校園。墨塵又聚集起來了——這一次，牠們更強了。）');
    autosave();
  },
  async rebirth(slot) {
    const old = Slots.read(slot); if (!old) return false;
    while (true) {
      UI.clear(); setWorldClass(null); Game.scene = 'title';
      await say('轉生後會保留：等級、武器（含稀有度與熟練度）、碎片、錯題本、學習紀錄。\n敵人和題目會變得更難喔！');
      const wid = await WorldPick.open({ title: '要轉生到哪一個世界？', exclude: old.world }); if (!wid) return false;
      W = WORLDS[wid]; setWorldClass(wid); Game.scene = 'title';
      const pl = await CharCreate.open(wid, old.player); if (!pl) continue;
      G = freshState(wid, pl, slot);
      Object.assign(G, { lv: old.lv, exp: old.exp, weapons: JSON.parse(JSON.stringify(old.weapons)), equip: old.equip.slice(), frags: old.frags || {}, stats: old.stats, wrong: old.wrong,
        bestStreak: old.bestStreak, answered: old.answered, weakKnown: old.weakKnown, bag: old.bag, money: Math.floor(old.money / 2), ng: (old.ng || 0) + 1,
        history: (old.history || []).concat([{ world: old.world, time: old.time, at: Date.now() }]) });
      for (const w of G.weapons) Meta.seeWeapon(wid, w.arch, w.r);
      G.flags.tut = 'skip'; playerStats(); G.hp = G.maxhp;
      await Flow.start();
      await say(`（轉生完成！你帶著 Lv.${G.lv} 的實力與 ${G.weapons.length} 件武器來到了${W.name}。武器已化為這個世界的兵器。）`);
      return true;
    }
  },
  async start() {
    const S0 = W.story ? W.start : { map: 'town1', x: 6, y: 5, dir: 'down' };
    G.map = S0.map; G.lastHeal = W.story ? { map: 'campus', x: 3, y: 16 } : G.lastHeal;
    await fade(1, 0.4); UI.clear(); Game.scene = 'overworld'; OW.load(S0.map, S0.x, S0.y, S0.dir); autosave(); await fade(0, 0.4);
    await sleep(200); showBanner(W.chapterName);
    if (W.story) { if (!G.flags.prologue) OW.run(() => storyPrologue()); }
    else await say(W.start);
  },
};

/* ---------- 啟動 ---------- */
const CTX = $('#cv').getContext('2d');
window.addEventListener('resize', resize); resize();
UI.init(); QB.init(); loadQRate(); Input.bindPad();
$('#muteBtn').addEventListener('click', () => { Sound.unlock(); const m = Sound.toggle(); $('#muteBtn').firstChild.textContent = m ? '✕' : '♪'; });
if (Sound.muted) $('#muteBtn').firstChild.textContent = '✕';
window.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
window.addEventListener('keydown', e => {   // 教師設定快捷鍵：在標題畫面按 T
  if (Game.scene === 'title' && !G && TeacherAuth.on && (e.key === 't' || e.key === 'T') && !/INPUT|TEXTAREA/.test(e.target.tagName) && !UI.stack.some(m => m.el && m.el.classList.contains('panel'))) Teacher.open();
});
requestAnimationFrame(loop);
opening().then(titleScreen);
