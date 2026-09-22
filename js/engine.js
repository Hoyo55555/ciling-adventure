'use strict';
/* ============ 基礎工具 ============ */
const $ = (s, el = document) => el.querySelector(s);
function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = ms => Anim.run(ms / 1000, () => { });   // 以影格計時，分頁隱藏時會一起暫停
const U = n => `calc(var(--u) * ${n})`;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
function weighted(list) { const tot = list.reduce((s, e) => s + (e.w || 1), 0); let r = Math.random() * tot; for (const e of list) { r -= (e.w || 1); if (r <= 0) return e; } return list[list.length - 1]; }

/* ============ 儲存（localStorage，失敗時靜默） ============ */
const Store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
};

/* ============ 設定 ============ */
const Settings = Object.assign({ music: 6, sfx: 7, speed: 1, hud: true }, Store.get('ciling_settings', {}));
const saveSettings = () => Store.set('ciling_settings', Settings);

/* ============ 輸入 ============ */
const Input = (() => {
  const held = new Set(); let queue = new Set(); let now = new Set();
  const KEYMAP = {
    ArrowUp: ['up'], ArrowDown: ['down'], ArrowLeft: ['left'], ArrowRight: ['right'],
    KeyW: ['up'], KeyS: ['down'], KeyA: ['left'], KeyD: ['right'],
    KeyZ: ['A'], Space: ['A'], Enter: ['A', 'START'], NumpadEnter: ['A', 'START'],
    KeyX: ['B'], Escape: ['B'], ShiftLeft: ['B'], ShiftRight: ['B'], Backspace: ['B'], KeyM: ['START'], KeyH: ['HOME'],
  };
  const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); };
  const codeOf = e => { if (e.code) return e.code; const k = e.key || ''; if (k.length === 1 && /[a-z]/i.test(k)) return 'Key' + k.toUpperCase(); if (k === ' ') return 'Space'; if (k === 'Shift') return 'ShiftLeft'; if (k === 'Esc') return 'Escape'; return k; };
  addEventListener('keydown', e => {
    if (typing(e)) return;
    const ks = KEYMAP[codeOf(e)]; if (!ks) return;
    e.preventDefault(); Sound.unlock();
    for (const k of ks) { if (e.repeat && (k === 'A' || k === 'B' || k === 'START' || k === 'HOME')) continue; queue.add(k); held.add(k); }
  });
  addEventListener('keyup', e => { const ks = KEYMAP[codeOf(e)]; if (ks) ks.forEach(k => held.delete(k)); });
  addEventListener('blur', () => held.clear());
  function bindPad() {
    document.querySelectorAll('[data-key]').forEach(btn => {
      const k = btn.dataset.key; let rep = null, delay = null;
      const down = e => { e.preventDefault(); Sound.unlock(); held.add(k); queue.add(k); btn.classList.add('on');
        if (DIRS[k]) delay = setTimeout(() => { rep = setInterval(() => queue.add(k), 110); }, 350); };
      const up = () => { held.delete(k); btn.classList.remove('on'); clearTimeout(delay); clearInterval(rep); };
      btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up);
      btn.addEventListener('pointerleave', up); btn.addEventListener('pointercancel', up);
      btn.addEventListener('contextmenu', e => e.preventDefault());
    });
  }
  return {
    tick() { now = queue; queue = new Set(); },
    p: k => now.has(k), h: k => held.has(k),
    eat() { now = new Set(); queue = new Set(); },
    dir() { for (const d of ['up', 'down', 'left', 'right']) if (now.has(d)) return d; return null; },
    bindPad,
  };
})();

/* ============ 動畫補間 ============ */
const Anim = {
  list: [],
  run(dur, fn) { return new Promise(res => this.list.push({ t: 0, dur: Math.max(0.001, dur), fn, res })); },
  step(dt) {
    const l = this.list; this.list = [];
    for (const a of l) { a.t += dt; const k = Math.min(1, a.t / a.dur); a.fn(k); if (k < 1) this.list.push(a); else a.res(); }
  },
};

/* ============ 音效與 8-bit 音樂（WebAudio） ============ */
const Sound = (() => {
  let ctx = null, master = null, mus = null, sfxG = null;
  let muted = Store.get('ciling_mute', false);
  let current = null, pendingSong = null, timer = null;
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const freq = n => { const m = /^([A-G]#?)(\d)$/.exec(n); if (!m) return 0; return 440 * Math.pow(2, (NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12); };
  const parse = s => s.trim().split(/\s+/).map(t => { const [n, d] = t.split(':'); return { f: n === '-' ? 0 : freq(n), d: +d || 1 }; });

  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination);
      mus = ctx.createGain(); mus.connect(master);
      sfxG = ctx.createGain(); sfxG.connect(master); applyVol();
      if (pendingSong) { const s = pendingSong; pendingSong = null; play(s); }
    } catch (e) { ctx = null; }
  }
  function tone(f, t0, dur, type = 'square', vol = 1, dest = sfxG, slide = 0) {
    if (!ctx || !f) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.setValueAtTime(vol, t0 + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function noise(t0, dur, vol = 0.5) {
    if (!ctx) return;
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(sfxG); s.start(t0);
  }
  function sfx(name) {
    if (!ctx) return; const t = ctx.currentTime;
    switch (name) {
      case 'cursor': tone(1320, t, 0.035, 'square', 0.25); break;
      case 'ok': tone(880, t, 0.05, 'square', 0.3); tone(1320, t + 0.05, 0.07, 'square', 0.3); break;
      case 'back': tone(660, t, 0.05, 'square', 0.25); tone(440, t + 0.05, 0.06, 'square', 0.25); break;
      case 'bump': tone(110, t, 0.09, 'square', 0.45); break;
      case 'hit': noise(t, 0.18, 0.7); tone(180, t, 0.12, 'square', 0.4, sfxG, 0.4); break;
      case 'correct': [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.07, 0.1, 'square', 0.3)); break;
      case 'wrong': tone(330, t, 0.16, 'sawtooth', 0.35, sfxG, 0.6); tone(220, t + 0.17, 0.24, 'sawtooth', 0.35, sfxG, 0.6); break;
      case 'heal': [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.12, 'triangle', 0.5)); break;
      case 'level': [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.1, 0.14, 'square', 0.3)); tone(1568, t + 0.4, 0.4, 'square', 0.3); break;
      case 'badge': [523, 523, 523, 698, 880, 1047].forEach((f, i) => tone(f, t + i * 0.12, i === 5 ? 0.6 : 0.1, 'square', 0.32)); break;
      case 'ball': tone(600, t, 0.12, 'square', 0.3, sfxG, 2); break;
      case 'shake': tone(220, t, 0.06, 'square', 0.35); tone(180, t + 0.08, 0.06, 'square', 0.35); break;
      case 'catch': [784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.1, 0.15, 'square', 0.3)); break;
      case 'encounter': for (let i = 0; i < 6; i++) tone(1200 - i * 150, t + i * 0.05, 0.05, 'square', 0.3); break;
      case 'run': tone(400, t, 0.06, 'square', 0.3); tone(600, t + 0.07, 0.06, 'square', 0.3); tone(800, t + 0.14, 0.08, 'square', 0.3); break;
      case 'faint': tone(600, t, 0.5, 'square', 0.3, sfxG, 0.25); break;
      case 'door': noise(t, 0.08, 0.3); tone(300, t + 0.05, 0.08, 'triangle', 0.4); break;
      case 'grass': noise(t, 0.05, 0.12); break;
      case 'alert': tone(1568, t, 0.08, 'square', 0.35); tone(2093, t + 0.08, 0.12, 'square', 0.35); break;
    }
  }
  function play(name) {
    if (current === name) return;
    stop(); current = name;
    if (!ctx) { pendingSong = name; return; }
    const S = SONGS[name]; if (!S) return;
    const tracks = S.tracks.map(tr => ({ notes: parse(tr.n), i: 0, t: ctx.currentTime + 0.08, type: tr.type, vol: tr.v }));
    const step = 60 / S.bpm / 2;
    timer = setInterval(() => {
      if (!ctx) return;
      for (const tr of tracks) {
        while (tr.t < ctx.currentTime + 0.25) {
          const n = tr.notes[tr.i];
          if (n.f) tone(n.f, tr.t, n.d * step * 0.92, tr.type, tr.vol, mus);
          tr.t += n.d * step; tr.i++;
          if (tr.i >= tr.notes.length) { if (S.once) { clearInterval(timer); timer = null; break; } tr.i = 0; }
        }
      }
    }, 60);
  }
  function applyVol() { if (!ctx) return; mus.gain.value = Settings.music * 0.035; sfxG.gain.value = Settings.sfx * 0.05; }
  function stop() { if (timer) clearInterval(timer); timer = null; current = null; pendingSong = null; }
  function toggle() { muted = !muted; Store.set('ciling_mute', muted); if (master) master.gain.value = muted ? 0 : 0.5; return muted; }
  return { unlock, sfx, play, stop, toggle, applyVol, get muted() { return muted; }, get song() { return current; } };
})();

/* 原創 8-bit 曲目（五聲音階為主），每軌長度皆為 32 個八分音符 */
const SONGS = {
  title: { bpm: 104, tracks: [
    { type: 'square', v: 0.55, n: 'E5:2 G5:2 A5:4 G5:2 E5:2 D5:4 E5:2 G5:2 C6:2 A5:2 G5:8' },
    { type: 'triangle', v: 0.9, n: 'C3:4 G2:4 A2:4 E2:4 F2:4 G2:4 C3:8' } ] },
  town_school: { bpm: 120, tracks: [
    { type: 'square', v: 0.5, n: 'C5:2 D5:2 E5:2 G5:2 A5:3 G5:1 E5:4 D5:2 E5:2 G5:2 E5:2 D5:4 C5:4' },
    { type: 'triangle', v: 0.9, n: 'C3:2 G3:2 C3:2 G3:2 A2:2 E3:2 A2:2 E3:2 F2:2 C3:2 G2:2 D3:2 G2:2 D3:2 C3:4' } ] },
  town_literati: { bpm: 84, tracks: [
    { type: 'triangle', v: 0.8, n: 'A4:4 C5:2 D5:2 E5:6 D5:2 C5:2 D5:2 E5:2 G5:2 A5:8' },
    { type: 'triangle', v: 0.6, n: 'A2:8 C3:8 D3:8 A2:8' } ] },
  town_wuxia: { bpm: 126, tracks: [
    { type: 'square', v: 0.45, n: 'D5:1 D5:1 F5:2 G5:2 A5:2 C6:2 A5:2 G5:4 F5:2 G5:2 A5:2 F5:2 D5:6 -:2' },
    { type: 'triangle', v: 0.9, n: 'D3:2 A2:2 D3:2 A2:2 F2:2 C3:2 F2:2 C3:2 G2:2 D3:2 G2:2 D3:2 D3:2 A2:2 D3:4' } ] },
  route: { bpm: 132, tracks: [
    { type: 'square', v: 0.45, n: 'G4:2 C5:2 E5:2 G5:2 F5:2 E5:2 D5:4 E5:2 D5:2 C5:2 A4:2 G4:4 -:4' },
    { type: 'triangle', v: 0.9, n: 'C3:4 E3:4 F2:4 G2:4 A2:4 F2:4 G2:4 G2:4' } ] },
  hall: { bpm: 96, tracks: [
    { type: 'square', v: 0.4, n: 'A4:4 E5:4 D5:2 C5:2 B4:4 A4:2 C5:2 E5:4 A5:4 G5:4' },
    { type: 'triangle', v: 0.9, n: 'A2:4 A2:4 F2:4 F2:4 C3:4 C3:4 E2:4 E2:4' } ] },
  battle: { bpm: 156, tracks: [
    { type: 'square', v: 0.45, n: 'A4:1 C5:1 E5:1 A5:1 G5:2 E5:2 D5:1 E5:1 G5:1 A5:1 C6:2 A5:2 G5:1 A5:1 G5:1 E5:1 D5:2 C5:2 D5:2 E5:2 A4:4' },
    { type: 'triangle', v: 0.9, n: 'A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 F2:1 F3:1 F2:1 F3:1 F2:1 F3:1 F2:1 F3:1 G2:1 G3:1 G2:1 G3:1 G2:1 G3:1 G2:1 G3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1 E2:1 E3:1' } ] },
  trainer: { bpm: 166, tracks: [
    { type: 'square', v: 0.45, n: 'E5:1 E5:1 -:1 E5:1 G5:2 A5:2 C6:1 A5:1 G5:1 E5:1 D5:4 E5:1 G5:1 A5:1 C6:1 D6:2 C6:2 A5:2 G5:2 E5:4' },
    { type: 'triangle', v: 0.9, n: 'C3:1 C4:1 C3:1 C4:1 C3:1 C4:1 C3:1 C4:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 A2:1 A3:1 F2:1 F3:1 F2:1 F3:1 F2:1 F3:1 F2:1 F3:1 G2:1 G3:1 G2:1 G3:1 G2:1 G3:1 G2:1 G3:1' } ] },
  boss: { bpm: 172, tracks: [
    { type: 'sawtooth', v: 0.3, n: 'D5:1 F5:1 A5:1 D6:1 C6:2 A5:2 A#4:1 D5:1 F5:1 A#5:1 A5:2 F5:2 C5:1 E5:1 G5:1 C6:1 A#5:2 G5:2 A5:2 E5:2 A4:4' },
    { type: 'triangle', v: 0.9, n: 'D3:1 D2:1 D3:1 D2:1 D3:1 D2:1 D3:1 D2:1 A#2:1 A#1:1 A#2:1 A#1:1 A#2:1 A#1:1 A#2:1 A#1:1 C3:1 C2:1 C3:1 C2:1 C3:1 C2:1 C3:1 C2:1 A2:1 A1:1 A2:1 A1:1 A2:1 A1:1 A2:1 A1:1' } ] },
  victory: { bpm: 150, once: true, tracks: [
    { type: 'square', v: 0.5, n: 'C5:1 E5:1 G5:1 C6:3 G5:1 C6:6' },
    { type: 'triangle', v: 0.9, n: 'C3:2 E3:2 G3:2 C3:6' } ] },
  ending: { bpm: 92, tracks: [
    { type: 'square', v: 0.4, n: 'C5:2 E5:2 G5:4 A5:2 G5:2 E5:4 F5:2 E5:2 D5:4 C5:8' },
    { type: 'triangle', v: 0.9, n: 'C3:8 A2:8 F2:4 G2:4 C3:8' } ] },
};
