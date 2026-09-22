'use strict';
/* ============ 主程式：場景切換、標題、開新遊戲 ============ */
const Game = { scene: 'title' };
const Title = {
  t: 0,
  draw(g) {
    this.t += 1 / 60; const t = this.t;
    g.fillStyle = '#7ad0f8'; g.fillRect(0, 0, 240, 160);
    g.fillStyle = '#a8e4ff'; g.fillRect(0, 60, 240, 40);
    g.fillStyle = '#ffffff'; for (const [x, y, w] of [[20, 20, 30], [120, 30, 40], [190, 14, 26]]) { const xx = ((x - t * 6) % 280 + 280) % 280 - 40; g.fillRect(xx, y, w, 6); g.fillRect(xx + 6, y - 4, w - 12, 4); }
    g.fillStyle = '#3aa070'; for (let x = 0; x < 240; x++) { const hh = 14 + Math.sin(x / 22) * 8 + Math.sin(x / 9) * 3; g.fillRect(x, 108 - hh, 1, hh); }
    const off = Math.floor(t * 20) % 16;
    for (let x = -16; x < 256; x += 16) { g.drawImage(GFX.tile('school', '.'), x - off, 108); g.drawImage(GFX.tile('school', ','), x - off, 124); g.drawImage(GFX.tile('school', 'g'), x - off, 140); }
    STARTERS.forEach((id, i) => { const bob = Math.abs(Math.sin(t * 5 + i)) * 5; g.drawImage(GFX.creature(id), 44 + i * 60, 90 - bob, 32, 32); });
  },
};
const Blank = { draw(g) { g.fillStyle = '#000'; g.fillRect(0, 0, 240, 160); } };
const SCENES = { title: Title, overworld: OW, battle: Battle, blank: Blank };

/* ---------- 版面大小 ---------- */
function resize() {
  const narrow = window.innerWidth <= 560; const padH = narrow ? 250 : 215, vw = window.innerWidth - (narrow ? 34 : 64), vh = window.innerHeight - padH;
  const w = Math.max(240, Math.floor(Math.min(vw, vh * 1.5, 900)));
  document.documentElement.style.setProperty('--w', w + 'px');
  document.documentElement.style.setProperty('--u', (w / 240) + 'px');
}

/* ---------- 迴圈 ---------- */
let lastT = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  frame(dt); requestAnimationFrame(loop);
}
/* 除錯用：在背景分頁中手動推進 n 個影格 */
window.__run = async (n = 60) => { const ch = new MessageChannel(); const y = () => new Promise(r => { ch.port1.onmessage = () => r(); ch.port2.postMessage(0); }); for (let i = 0; i < n; i++) { frame(1 / 60); await y(); } };
function frame(dt) {
  Input.tick();
  if (UI.active) UI.update(); else { const S = SCENES[Game.scene]; if (S.update) S.update(dt); }
  Anim.step(dt);
  if (G && Game.scene !== 'title') G.time = (G.time || 0) + dt;
  const g = CTX; g.imageSmoothingEnabled = false; (SCENES[Game.scene] || Blank).draw(g);
}

/* ---------- 標題流程 ---------- */
async function titleScreen() {
  UI.clear(); Game.scene = 'title'; G = null; W = null; Sound.play('title');
  const logo = UI.el('logo', `<div class="t1">詞靈冒險</div><div class="t2">翡翠之卷</div><div class="t3">國中國文 × 像素冒險</div>`);
  const press = UI.el('press', '按 A（Z 鍵）開始');
  await new Promise(res => { const m = { update() { if (Input.p('A') || Input.p('START')) { Sound.sfx('ok'); UI.pop(m); res(); } } }; press.addEventListener('pointerdown', () => { Sound.unlock(); Sound.sfx('ok'); UI.pop(m); res(); }); UI.push(m); });
  press.remove();
  while (true) {
    const save = Store.get('ciling_save', null);
    const opts = [{ label: '繼續冒險', disabled: !save, sub: save ? `${save.player.name}．${WORLDS[save.world].name}` : '' }, '新的冒險', '教師設定', '遊戲說明'];
    const i = await UI.choose(opts, { pos: { left: '50%', bottom: U(8), transform: 'translateX(-50%)' }, cancel: false, start: save ? 0 : 1, minW: 110 });
    if (i === 0) { logo.remove(); return continueGame(save); }
    if (i === 1) { if (save && !(await UI.yesno('開始新的冒險會覆蓋原本的存檔，確定嗎？'))) continue; logo.style.display = 'none'; const ok = await newGame(); if (ok) { logo.remove(); return; } logo.style.display = ''; }
    if (i === 2) { logo.style.display = 'none'; await Teacher.open(); logo.style.display = ''; }
    if (i === 3) { logo.style.display = 'none'; await Help.open(); logo.style.display = ''; }
  }
}
function freshState(world, player) {
  return { v: 1, world, player, map: 'town1', x: 6, y: 5, party: [], box: [], bag: { ink: 0, ink2: 0, tea: 0, ball: 0, hint: 0 }, money: 500,
    badges: [], flags: {}, defeated: {}, stats: {}, wrong: [], seen: {}, caught: {}, weakKnown: {}, lastHeal: { map: 'town1', x: 6, y: 5 }, time: 0, streak: 0, bestStreak: 0 };
}
async function newGame() {
  while (true) {
    const wid = await WorldSelect.open(); if (!wid) return false;
    W = WORLDS[wid]; G = freshState(wid, { name: '', title: '', look: {} });
    const pl = await CharCreate.open(wid); if (!pl) { G = null; W = null; continue; }
    G.player = pl;
    await fade(1, 0.4); UI.clear(); Game.scene = 'blank'; await fade(0, 0.1);
    Sound.play(W.music.town);
    for (const t of W.prologue) await say(t);
    await fade(1, 0.3);
    Game.scene = 'overworld'; OW.load('town1', 6, 5, 'down'); autosave();
    await fade(0, 0.4);
    return true;
  }
}
async function continueGame(save) {
  G = save; W = WORLDS[G.world];
  // 補齊舊存檔可能缺少的欄位
  const base = freshState(G.world, G.player); for (const k in base) if (G[k] == null) G[k] = base[k];
  await fade(1, 0.3); UI.clear(); Game.scene = 'overworld';
  OW.load(G.map, G.x, G.y, 'down'); await fade(0, 0.3);
}

/* ---------- 啟動 ---------- */
const CTX = $('#cv').getContext('2d');
window.addEventListener('resize', resize); resize();
UI.init(); QB.init(); Input.bindPad();
$('#muteBtn').addEventListener('click', () => { Sound.unlock(); const m = Sound.toggle(); $('#muteBtn').firstChild.textContent = m ? '✕' : '♪'; });
if (Sound.muted) $('#muteBtn').firstChild.textContent = '✕';
window.addEventListener('pointerdown', () => Sound.unlock(), { once: true });
requestAnimationFrame(loop);
titleScreen();
