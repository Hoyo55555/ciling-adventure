'use strict';
/* ============ 主程式：開場、標題、流程 ============ */
const Game = { scene: 'title' };
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
    const bob = Math.abs(Math.sin(t * 5)) * 4; g.drawImage(GFX.creature('cuozi'), 176, 88 - bob, 30, 30);
  },
};
const Blank = { draw(g) { g.fillStyle = '#16120e'; g.fillRect(0, 0, 240, 160); } };
const SCENES = { title: Title, overworld: OW, battle: Battle, blank: Blank };

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
  let sel = Slots.any() ? 0 : 1;
  while (true) {
    const canReborn = Slots.cleared().length > 0;
    const opts = [{ label: '繼續冒險', disabled: !Slots.any() }, '新的冒險'].concat(canReborn ? ['轉生'] : []).concat(['紀錄館', '設定', '教師設定', '遊戲說明']);
    const labels = opts.map(o => typeof o === 'string' ? o : o.label);
    const i = await UI.choose(opts, { pos: { left: '50%', bottom: U(6), transform: 'translateX(-50%)' }, cancel: false, start: sel, cls: 'titlemenu', cols: 2 });
    sel = i; const L = labels[i];
    logo.style.display = 'none';
    if (L === '繼續冒險') { const n = await SlotScreen.open('load'); if (n) { logo.remove(); return Flow.load(n); } }
    if (L === '新的冒險') { const n = await SlotScreen.open('new'); if (n) { logo.remove(); const ok = await Flow.newGame(n); if (ok) return; return titleScreen(); } }
    if (L === '轉生') { const n = await SlotScreen.open('rebirth'); if (n) { logo.remove(); const ok = await Flow.rebirth(n); if (ok) return; return titleScreen(); } }
    if (L === '紀錄館') await RecordHall.open();
    if (L === '設定') await SettingsPanel.open();
    if (L === '教師設定') await Teacher.open();
    if (L === '遊戲說明') await Help.open();
    logo.style.display = '';
  }
}

/* ---------- 存檔資料 ---------- */
function freshState(world, player, slot) {
  return { v: 2, slot, world, player, map: 'town1', x: 6, y: 5, lv: 3, exp: 0, hp: null, weapons: {}, equip: [], cur: 0, wenqi: 0,
    bag: { heal: 0, heal2: 0, wenqi: 0, hint: 0 }, money: 300, chapter: 1, badges: [], flags: {}, defeated: {}, chests: {}, quests: {},
    stats: {}, chStats: {}, wrong: [], seen: {}, weakKnown: {}, lastHeal: { map: 'town1', x: 6, y: 5 }, time: 0, streak: 0, bestStreak: 0, answered: 0, ng: 0 };
}
const Flow = {
  async load(n) {
    G = Slots.read(n); if (!G) return titleScreen(); G.slot = n; W = WORLDS[G.world]; setWorldClass(G.world);
    const base = freshState(G.world, G.player, n); for (const k in base) if (G[k] == null) G[k] = base[k];
    playerStats();
    await fade(1, 0.3); UI.clear(); Game.scene = 'overworld'; OW.load(G.map, G.x, G.y, 'down'); await fade(0, 0.3);
  },
  async newGame(slot, preset) {
    while (true) {
      UI.clear(); setWorldClass(null); Game.scene = 'title';
      const wid = await WorldSelect.open(); if (!wid) return false;
      W = WORLDS[wid]; setWorldClass(wid); G = freshState(wid, { name: '', title: '', look: {} }, slot);
      const pl = await CharCreate.open(wid, preset); if (!pl) { G = null; W = null; continue; }
      G.player = pl; playerStats();
      await Flow.prologue(); return true;
    }
  },
  async rebirth(slot) {
    const old = Slots.read(slot); if (!old) return false;
    while (true) {
      UI.clear(); setWorldClass(null); Game.scene = 'title';
      await say('轉生後會保留：等級、武器與熟練度、錯題本、學習紀錄。\n敵人和題目會變得更難喔！');
      const wid = await WorldSelect.open({ title: '要轉生到哪一個世界？', exclude: old.world }); if (!wid) return false;
      W = WORLDS[wid]; setWorldClass(wid);
      const pl = await CharCreate.open(wid, old.player); if (!pl) continue;
      G = freshState(wid, pl, slot);
      Object.assign(G, { lv: old.lv, exp: old.exp, weapons: JSON.parse(JSON.stringify(old.weapons)), equip: old.equip.slice(), stats: old.stats, wrong: old.wrong,
        bestStreak: old.bestStreak, answered: old.answered, weakKnown: old.weakKnown, bag: old.bag, money: Math.floor(old.money / 2), ng: (old.ng || 0) + 1,
        history: (old.history || []).concat([{ world: old.world, time: old.time, at: Date.now() }]) });
      for (const a in G.weapons) Meta.seeWeapon(wid, a);
      playerStats(); G.hp = G.maxhp;
      await Flow.prologue();
      await say(`（轉生完成！你帶著 Lv.${G.lv} 的實力與 ${Object.keys(G.weapons).length} 件武器的熟練度，來到了${W.name}。武器已化為這個世界的兵器。）`);
      return true;
    }
  },
  async prologue() {
    await fade(1, 0.4); UI.clear(); Game.scene = 'blank'; await fade(0, 0.1);
    Sound.play(W.music.town);
    for (const t of W.prologue) await say(t);
    await fade(1, 0.3); Game.scene = 'overworld'; OW.load('town1', 6, 5, 'down'); autosave(); await fade(0, 0.4);
    await sleep(300); showBanner(W.chapterName);
  },
};

/* ---------- 啟動 ---------- */
const CTX = $('#cv').getContext('2d');
window.addEventListener('resize', resize); resize();
UI.init(); QB.init(); Input.bindPad();
$('#muteBtn').addEventListener('click', () => { Sound.unlock(); const m = Sound.toggle(); $('#muteBtn').firstChild.textContent = m ? '✕' : '♪'; });
if (Sound.muted) $('#muteBtn').firstChild.textContent = '✕';
window.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
requestAnimationFrame(loop);
opening().then(titleScreen);
