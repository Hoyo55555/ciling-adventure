'use strict';
/* ============ 介面：對話框、選單、答題面板 ============ */
const UI = {
  root: null, stack: [],
  init() { this.root = $('#ui'); },
  get active() { return this.stack.length > 0; },
  update() { const t = this.stack[this.stack.length - 1]; if (t && t.update) t.update(); },
  push(m) { this.stack.push(m); return m; },
  pop(m, keepEl) { const i = this.stack.lastIndexOf(m); if (i >= 0) this.stack.splice(i, 1); if (m.el && !keepEl) m.el.remove(); },
  el(cls, html, style) { const e = h('div', cls, html); if (style) Object.assign(e.style, style); this.root.appendChild(e); return e; },
  clear() { this.stack = []; this.root.innerHTML = ''; },
};
function fmt(t) {
  return String(t).replace(/\{name\}/g, G ? G.player.name : '').replace(/\{money\}/g, W ? W.money : '').replace(/\{weapon\}/g, G && W && G.equip && G.equip.length ? weaponName(G.equip[G.cur]) : '');
}
function paginate(text, max = 46) {
  const out = [];
  for (const block of String(text).split(/\n{2,}/)) {
    let s = block;
    while (s.length > max) {
      let cut = -1;
      for (let i = Math.min(max, s.length - 1); i > max * 0.45; i--) if ('。！？；…」'.includes(s[i])) { cut = i + 1; break; }
      if (cut < 0) for (let i = max; i > max * 0.45; i--) if ('，、：'.includes(s[i])) { cut = i + 1; break; }
      if (cut < 0) cut = max;
      out.push(s.slice(0, cut)); s = s.slice(cut).replace(/^\n/, '');
    }
    if (s) out.push(s);
  }
  return out.length ? out : [''];
}

/* 對話：opt.name 說話者；opt.dark 戰鬥框；opt.auto 毫秒後自動關閉；opt.hold 打完字就返回並保留對話框 */
UI.say = function (text, opt = {}) {
  return new Promise(res => {
    const pages = paginate(fmt(text));
    const box = UI.el('box tb' + (opt.dark ? ' dark' : ''));
    if (opt.right) box.style.right = U(opt.right);
    if (opt.left) box.style.left = U(opt.left);
    const tx = h('div', 'tbtext'), ar = h('div', 'tbarrow', '▼'); box.append(tx, ar); ar.style.visibility = 'hidden';
    const tag = opt.name ? UI.el('box nametag', esc(fmt(opt.name))) : null;
    let pi = 0, n = 0, acc = 0, full = pages[0], done = false, timer = 0, closed = false;
    const last = () => pi >= pages.length - 1;
    const close = () => { if (closed) return; closed = true; UI.pop(m); if (tag) tag.remove(); res(); };
    const finishTyping = () => { n = full.length; tx.textContent = full; done = true;
      if (last() && opt.hold) { UI.pop(m, true); closed = true; res(() => { box.remove(); if (tag) tag.remove(); }); return; }
      ar.style.visibility = (last() && opt.auto) ? 'hidden' : 'visible'; timer = 0; };
    const next = () => {
      if (closed) return;
      if (!done) { finishTyping(); return; }
      Sound.sfx('cursor');
      if (last()) { close(); return; }
      pi++; full = pages[pi]; n = 0; acc = 0; done = false; ar.style.visibility = 'hidden'; tx.textContent = '';
    };
    const m = { el: box, update() {
      if (!done) { acc += opt.fast ? 3 : [0.7, 1.4, 3][Settings.speed]; const k = Math.floor(acc); if (k > n) { n = Math.min(full.length, k); tx.textContent = full.slice(0, n); if (n >= full.length) finishTyping(); } }
      else if (opt.auto && last()) { timer += 1000 / 60; if (timer >= opt.auto) { close(); return; } }
      if (Input.p('A') || Input.p('B')) next();
    } };
    box.addEventListener('pointerdown', e => { e.preventDefault(); next(); });
    UI.push(m);
  });
};
const say = (t, name, extra) => UI.say(t, Object.assign({ name }, extra || {}));

/* 選單：options 可為字串或 {label, disabled, sub} */
UI.choose = function (options, opt = {}) {
  return new Promise(res => {
    const cols = opt.cols || 1;
    const box = UI.el('box menu' + (cols > 1 ? ' grid' : '') + (opt.cls ? ' ' + opt.cls : ''));
    if (cols > 1) box.style.gridTemplateColumns = `repeat(${cols}, auto)`;
    const pos = opt.pos || { right: U(2), bottom: U(50) };
    Object.assign(box.style, pos); if (opt.minW) box.style.minWidth = U(opt.minW);
    options = options.map(o => typeof o === 'object' ? o : { label: String(o) });
    const items = options.map((o, i) => {
      const lab = o.label;
      const d = h('div', 'opt' + (o.disabled ? ' dis' : ''), esc(lab) + (o.sub ? `<span class="sub">${esc(o.sub)}</span>` : ''));
      d.addEventListener('pointerdown', e => { e.preventDefault(); sel = i; render(); confirm(); });
      box.appendChild(d); return d;
    });
    let sel = clamp(opt.start || 0, 0, options.length - 1);
    const render = () => { items.forEach((d, i) => d.classList.toggle('sel', i === sel)); if (opt.onMove) opt.onMove(sel); };
    const confirm = () => { const o = options[sel]; if (o.disabled) { Sound.sfx('bump'); return; } Sound.sfx('ok'); UI.pop(m); res(sel); };
    const m = { el: box, update() {
      const d = Input.dir();
      if (d) { const n = options.length; let s = sel;
        if (cols === 1) { if (d === 'up') s = (sel - 1 + n) % n; if (d === 'down') s = (sel + 1) % n; }
        else { if (d === 'left' && sel % cols > 0) s--; if (d === 'right' && sel % cols < cols - 1 && sel + 1 < n) s++; if (d === 'up' && sel - cols >= 0) s -= cols; if (d === 'down' && sel + cols < n) s += cols; }
        if (s !== sel) { sel = s; Sound.sfx('cursor'); render(); } }
      if (Input.p('A')) confirm();
      else if (Input.p('B') && opt.cancel !== false) { Sound.sfx('back'); UI.pop(m); res(-1); }
    } };
    render(); UI.push(m);
  });
};
/* 說一句話並同時給選項 */
UI.ask = async function (text, options, opt = {}) {
  const close = await UI.say(text, Object.assign({}, opt, { hold: true }));
  const r = await UI.choose(options, opt);
  close(); return r;
};
const ask = (t, opts, name, extra) => UI.ask(t, opts, Object.assign({ name }, extra || {}));
UI.yesno = (t, name) => UI.ask(t, ['是', '否'], { name }).then(r => r === 0);

/* 全螢幕面板：傳入 update(sel) 與 render；回傳 Promise */
UI.panel = function (build) {
  return new Promise(res => {
    const box = UI.el('box panel');
    const ctl = { box, done: v => { UI.pop(m); res(v); } };
    const m = { el: box, update: () => ctl.update && ctl.update() };
    build(ctl); UI.push(m);
  });
};
/* 在面板中做上下選擇的小工具 */
function listNav(ctl, rows, { onPick, onBack, onMove, start = 0 } = {}) {
  let sel = start;
  const paint = () => { rows.forEach((r, i) => r.classList.toggle('sel', i === sel)); const r = rows[sel]; if (r) r.scrollIntoView({ block: 'nearest' }); if (onMove) onMove(sel); };
  rows.forEach((r, i) => r.addEventListener('pointerdown', e => { e.preventDefault(); if (sel === i) { Sound.sfx('ok'); onPick && onPick(i); } else { sel = i; Sound.sfx('cursor'); paint(); } }));
  ctl.update = () => {
    const d = Input.dir();
    if (d === 'up' && sel > 0) { sel--; Sound.sfx('cursor'); paint(); }
    if (d === 'down' && sel < rows.length - 1) { sel++; Sound.sfx('cursor'); paint(); }
    if (Input.p('A') && rows.length) { Sound.sfx('ok'); onPick && onPick(sel); }
    else if (Input.p('B')) { Sound.sfx('back'); onBack && onBack(); }
  };
  paint(); return { get sel() { return sel; }, set sel(v) { sel = v; paint(); }, paint };
}

/* 地點名稱橫幅 */
let bannerEl = null, bannerTimer = null;
function showBanner(text) {
  if (!bannerEl || !bannerEl.isConnected) bannerEl = UI.el('box banner');
  bannerEl.textContent = text; bannerEl.classList.remove('show'); void bannerEl.offsetWidth; bannerEl.classList.add('show');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => bannerEl && bannerEl.classList.remove('show'), 2200);
}

/* 畫面轉場 */
async function fade(to, dur = 0.25, white) {
  const fx = $('#fx'); fx.classList.toggle('white', !!white);
  const from = +fx.style.opacity || 0;
  await Anim.run(dur, k => fx.style.opacity = from + (to - from) * k);
}

/* ============ 答題面板 ============
   mode: 'attack' 答對才命中 / 'defend' 答對可閃避 / 'review' 錯題複習
   回傳 {correct} */
UI.question = function (q, opt = {}) {
  return new Promise(res => {
    const box = UI.el('box qp');
    const modeTxt = { attack: '⚔ 答對才能命中！', defend: '🛡 答對就能閃避！', review: '📖 錯題複習', practice: '✏️ 練習' }[opt.mode] || '';
    const typeTxt = { choice: '選擇題', tf: '是非題', fill: '填空題', order: '排序題' }[q.type];
    box.innerHTML = `<div class="qhead">${chip(q.cat)}<span>${typeTxt}${q.lesson ? '．' + esc(q.lesson) : ''}${opt.move ? '．招式「' + esc(opt.move) + '」' : ''}</span><span class="mode ${opt.mode === 'defend' ? 'def' : ''}">${modeTxt}</span></div>
      <div class="qtext ${q.q.length > 48 ? 'long' : ''}">${esc(q.q)}</div><div class="qbody"></div><div class="qafter"></div>`;
    const body = $('.qbody', box), after = $('.qafter', box);
    let answered = false, result = false, m;
    const finish = (ok, detail) => {
      if (answered) return; answered = true; result = ok; box.classList.add('answered');
      Sound.sfx(ok ? 'correct' : 'wrong');
      const ansTxt = q.type === 'choice' ? q.opts[q.ans] : q.type === 'tf' ? (q.ans ? '○ 正確' : '✕ 錯誤') : q.type === 'fill' ? q.ans[0] : q.parts.join('');
      after.innerHTML = `<div class="qres ${ok ? 'ok' : 'ng'}">${ok ? '◎ 答對了！' : '✕ 答錯了！'}${ok ? '' : `<span class="small" style="font-weight:700;color:#404850;margin-left:.6em">正確答案：${esc(ansTxt)}</span>`}</div>
        ${q.exp ? `<div class="qexp">💡 ${esc(q.exp)}</div>` : ''}<div class="qnext">按 A 繼續 ▶</div>`;
      box.style.cursor = 'pointer';
      setTimeout(() => box.addEventListener('pointerdown', () => { if (m.closing) return; m.closing = true; close(); }), 250);
      Stats.record(q, ok, detail);
    };
    const close = () => { UI.pop(m); res({ correct: result }); };
    let navUpdate = () => { };

    if (q.type === 'choice' || q.type === 'tf') {
      const order = q.type === 'tf' ? [0, 1] : (q.fixed ? q.opts.map((_, i) => i) : shuffle(q.opts.map((_, i) => i)));
      const labels = q.type === 'tf' ? ['○ 正確', '✕ 錯誤'] : q.opts;
      const correctIdx = q.type === 'tf' ? (q.ans ? 0 : 1) : q.ans;
      const long = labels.some(l => l.length > 9);
      const grid = h('div', 'qopts' + (long ? ' one' : '')); body.appendChild(grid);
      const btns = order.map((oi, k) => { const d = h('div', 'qopt', `<span class="k">${q.type === 'tf' ? '' : 'ABCD'[k] + '.'}</span>${esc(labels[oi])}`); d.dataset.oi = oi; grid.appendChild(d); return d; });
      let tools = [];
      const canHint = q.type === 'choice' && q.opts.length > 2 && opt.hint !== false && G && G.bag.hint > 0;
      let hintBtn = null;
      if (canHint) { const t = h('div', 'qtool'); hintBtn = h('div', 'opt', `🎁 使用錦囊（剩 ${G.bag.hint}）`); t.appendChild(hintBtn); body.appendChild(t); tools = [hintBtn]; }
      const all = btns.concat(tools); let sel = 0; const cols = long ? 1 : 2;
      box._pickCorrect = () => choose(btns.findIndex(b => +b.dataset.oi === correctIdx)); // 測試用
      const paint = () => all.forEach((b, i) => b.classList.toggle('sel', i === sel));
      const choose = i => {
        if (answered) return;
        if (all[i] === hintBtn) { useHint(); return; }
        const b = all[i]; if (b.classList.contains('gone')) { Sound.sfx('bump'); return; }
        const oi = +b.dataset.oi, ok = oi === correctIdx;
        btns.forEach(x => { const xo = +x.dataset.oi; if (xo === correctIdx) x.classList.add('ok'); else if (x === b) x.classList.add('ng'); });
        finish(ok, labels[oi]);
      };
      const useHint = () => { if (!G.bag.hint) return; G.bag.hint--; Sound.sfx('ok');
        const wrong = shuffle(btns.filter(b => +b.dataset.oi !== correctIdx)).slice(0, Math.max(0, btns.length - 2)); wrong.forEach(b => b.classList.add('gone'));
        hintBtn.remove(); all.splice(all.indexOf(hintBtn), 1); hintBtn = null; sel = btns.indexOf(btns.find(b => !b.classList.contains('gone'))); paint(); };
      all.forEach((b, i) => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); sel = i; paint(); choose(i); }));
      navUpdate = () => {
        const d = Input.dir(); const nb = btns.length;
        if (d) { let s = sel;
          if (sel >= nb) { if (d === 'up') s = nb - 1; }
          else if (cols === 2) { if (d === 'left' && sel % 2) s--; if (d === 'right' && !(sel % 2) && sel + 1 < nb) s++; if (d === 'up' && sel >= 2) s -= 2; if (d === 'down') s = sel + 2 < nb ? sel + 2 : (all.length > nb ? nb : sel); }
          else { if (d === 'up' && sel > 0) s--; if (d === 'down' && sel < all.length - 1) s++; }
          if (s !== sel) { sel = s; Sound.sfx('cursor'); paint(); } }
        if (Input.p('A')) choose(sel);
      };
      paint();
    } else if (q.type === 'order') {
      const line = h('div', 'ordline'); const grid = h('div', 'qopts'); body.append(line, grid);
      const parts = shuffle(q.parts.map((p, i) => ({ p, i }))); const picked = [];
      const btns = parts.map(o => { const d = h('div', 'qopt', esc(o.p)); grid.appendChild(d); return d; });
      box._pickCorrect = () => q.parts.forEach(p => choose(parts.findIndex((o, k) => o.p === p && !picked.includes(k)))); // 測試用
      const tip = h('div', 'qnext', 'A 選取片段．B 退回上一個'); body.appendChild(tip);
      let sel = 0;
      const paint = () => { btns.forEach((b, i) => { b.classList.toggle('sel', i === sel); b.classList.toggle('gone', picked.includes(i)); }); line.textContent = picked.map(i => parts[i].p).join('　') || '　'; };
      const choose = i => { if (answered || picked.includes(i)) return; picked.push(i); Sound.sfx('cursor');
        if (picked.length === parts.length) { const ok = picked.every((pi, k) => parts[pi].p === q.parts[k]); paint(); tip.remove(); finish(ok, picked.map(i => parts[i].p).join('')); return; }
        const nx = btns.findIndex((_, k) => !picked.includes(k)); sel = nx; paint(); };
      btns.forEach((b, i) => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); sel = i; choose(i); }));
      navUpdate = () => { const d = Input.dir(); if (d) { let s = sel; if (d === 'left' && sel % 2) s--; if (d === 'right' && !(sel % 2) && sel + 1 < btns.length) s++; if (d === 'up' && sel >= 2) s -= 2; if (d === 'down' && sel + 2 < btns.length) s += 2; if (s !== sel) { sel = s; Sound.sfx('cursor'); paint(); } }
        if (Input.p('A')) choose(sel); if (Input.p('B') && picked.length) { picked.pop(); Sound.sfx('back'); paint(); } };
      paint();
    } else { // fill
      const wrap = h('div', 'qfill'); const inp = h('input'); inp.placeholder = '在這裡輸入答案'; inp.maxLength = 20;
      const ok = h('button', 'btn', '確定'); wrap.append(inp, ok); body.appendChild(wrap);
      const norm = s => String(s).normalize('NFKC').replace(/[\s，。、！？「」（）()．.]/g, '');
      const submit = () => { if (answered) return; const v = norm(inp.value); if (!v) { inp.focus(); return; } inp.disabled = true; ok.disabled = true; inp.blur(); finish(q.ans.some(a => norm(a) === v), inp.value); };
      ok.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); submit(); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); submit(); } e.stopPropagation(); });
      inp.addEventListener('pointerdown', e => e.stopPropagation());
      setTimeout(() => inp.focus(), 50);
      navUpdate = () => { if (Input.p('A') && document.activeElement !== inp) inp.focus(); };
    }
    m = { el: box, closing: false, update() { if (answered) { if (Input.p('A') || Input.p('B')) { if (!m.closing) { m.closing = true; close(); } } return; } navUpdate(); } };
    UI.push(m);
  });
};

/* ============ 學習紀錄 ============ */
const Stats = {
  record(q, ok, chosen) {
    if (!G) return;
    const s = G.stats[q.cat] || (G.stats[q.cat] = { r: 0, t: 0 }); s.t++; if (ok) s.r++;
    G.answered = (G.answered || 0) + 1;
    const ch = (G.chStats || (G.chStats = {}))[G.chapter || 1] || (G.chStats[G.chapter || 1] = { r: 0, t: 0 }); ch.t++; if (ok) ch.r++;
    if (ok) { G.streak = (G.streak || 0) + 1; G.bestStreak = Math.max(G.bestStreak || 0, G.streak); } else G.streak = 0;
    const w = G.wrong.find(x => x.id === q.id);
    if (!ok) { if (w) { w.n++; w.last = chosen; w.at = Date.now(); } else G.wrong.unshift({ id: q.id, n: 1, last: chosen, at: Date.now(), snap: q }); if (G.wrong.length > 200) G.wrong.pop(); }
  },
};
