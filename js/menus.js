'use strict';
/* ============ 各種選單畫面 ============ */
const hpBarHTML = m => { const r = m.hp / m.maxhp; return `<div class="hpbar"><b>HP</b><div class="track"><div class="fill ${r <= .2 ? 'low' : r <= .5 ? 'mid' : ''}" style="width:${r * 100}%"></div></div></div>`; };
const footKeys = t => `<div class="foot">${t || 'A 確認　B 返回'}</div>`;

/* ---------- START 選單 ---------- */
const StartMenu = {
  async open() {
    let sel = 0;
    while (true) {
      const opts = ['詞靈', '背包', '錯題本', '學習紀錄', '冒險手冊', '存檔', '關閉'];
      const i = await UI.choose(opts, { pos: { right: U(2), top: U(2) }, start: sel, minW: 62 });
      if (i < 0 || i === 6) return; sel = i;
      if (i === 0) await Party.open({ mode: 'view', title: '我的詞靈' });
      if (i === 1) await Bag.open({});
      if (i === 2) await WrongBook.open();
      if (i === 3) await Records.open();
      if (i === 4) await Card.open();
      if (i === 5) { const ok = await UI.yesno('要記錄目前的冒險進度嗎？'); if (ok) { autosave(); Sound.sfx('badge'); await say(`${G.player.name} 把進度記錄下來了！`); } }
    }
  },
};

/* ---------- 詞靈隊伍 ---------- */
const Party = {
  open({ mode = 'view', title = '我的詞靈', current = -1, filter } = {}) {
    return UI.panel(ctl => {
      const box = ctl.box;
      const render = () => {
        box.innerHTML = `<h2>${esc(title)}</h2><div class="scroll"></div>` + footKeys(mode === 'forced' ? 'A 選擇（必須派出一隻）' : 'A 選擇　B 返回');
        const sc = $('.scroll', box);
        const rows = G.party.map((m, i) => {
          const r = h('div', 'row'); r.appendChild(GFX.el(GFX.creature(m.sp, m.variant), 0.9));
          r.insertAdjacentHTML('beforeend', `<div class="grow"><div style="display:flex;justify-content:space-between"><b>${esc(monName(m))}${i === current ? ' <span class="small muted">（出戰中）</span>' : ''}</b><span>Lv.${m.lv}</span></div>${hpBarHTML(m)}<div class="small" style="text-align:right">${m.hp} / ${m.maxhp}${m.hp <= 0 ? '　<b style="color:#d04040">無法戰鬥</b>' : ''}</div></div>`);
          sc.appendChild(r); return r;
        });
        return rows;
      };
      let rows = render();
      const nav = () => listNav(ctl, rows, { onPick, onBack: () => { if (mode !== 'forced') ctl.done(-1); } });
      async function onPick(i) {
        const m = G.party[i];
        if (mode === 'target') return ctl.done(i);
        if (mode === 'forced') { if (m.hp <= 0) { Sound.sfx('bump'); return; } return ctl.done(i); }
        const opts = mode === 'battle' ? ['替換上場', '查看能力', '取消'] : ['查看能力', '換到第一位', '取消'];
        const k = await UI.choose(opts, { pos: { right: U(6), bottom: U(8) } });
        if (mode === 'battle' && k === 0) { if (i === current) { await say(`${monName(m)} 已經在場上了！`); } else if (m.hp <= 0) { await say(`${monName(m)} 已經沒有力氣戰鬥了！`); } else return ctl.done(i); }
        if ((mode === 'battle' && k === 1) || (mode !== 'battle' && k === 0)) await Summary.open(m);
        if (mode !== 'battle' && k === 1 && i > 0) { G.party.splice(i, 1); G.party.unshift(m); rows = render(); nav(); Sound.sfx('ok'); return; }
        rows = render(); const n = nav(); n.sel = i;
      }
      nav();
    });
  },
};
const Summary = {
  open(m) {
    return UI.panel(ctl => {
      const S = SPECIES[m.sp];
      ctl.box.innerHTML = `<h2>${esc(S.name)}　<span class="small muted">Lv.${m.lv}</span></h2>
        <div style="display:flex;gap:${U(6)};flex:1;min-height:0"><div class="sp"></div><div class="grow scroll">
        <div class="small" style="margin-bottom:${U(2)}">${esc(S.desc)}</div>
        ${hpBarHTML(m)}<div class="small">HP ${m.hp}/${m.maxhp}　攻擊 ${m.atk}　防禦 ${m.def}　經驗 ${m.exp}/${expNeed(m.lv)}</div>
        <div class="small" style="margin:${U(2)} 0">弱點 ${S.weak.map(chip).join('') || '－'}　抗性 ${S.resist.map(chip).join('') || '－'}</div>
        ${m.moves.map(x => { const M = MOVES[x.id]; return `<div class="row" style="padding:${U(1)} ${U(2)}"><b class="grow">${esc(M.name)}</b>${M.cats.map(chip).join('')}<span class="small">威力 ${M.pow}　PP ${x.pp}/${M.pp}</span></div>`; }).join('')}
        </div></div>` + footKeys('B 返回');
      $('.sp', ctl.box).appendChild(GFX.el(GFX.creature(m.sp, m.variant), 2));
      ctl.update = () => { if (Input.p('B') || Input.p('A')) { Sound.sfx('back'); ctl.done(); } };
      ctl.box.addEventListener('pointerdown', () => ctl.done());
    });
  },
};

/* ---------- 背包 ---------- */
const Bag = {
  open({ battle } = {}) {
    return UI.panel(ctl => {
      const box = ctl.box;
      const ids = ITEM_ORDER.filter(id => G.bag[id] > 0);
      box.innerHTML = `<h2>背包　<span class="small muted">${G.money} ${esc(W.money)}</span></h2><div class="scroll"></div><div class="small desc" style="min-height:${U(12)};padding-top:${U(2)}"></div>` + footKeys();
      const sc = $('.scroll', box), desc = $('.desc', box);
      if (!ids.length) sc.innerHTML = '<div class="muted">背包空空的……</div>';
      const rows = ids.map(id => { const r = h('div', 'row', `<b class="grow">${esc(ITEMS[id].name)}</b><span>× ${G.bag[id]}</span>`); sc.appendChild(r); return r; });
      listNav(ctl, rows, {
        onMove: i => desc.textContent = ids[i] ? ITEMS[ids[i]].desc : '',
        onBack: () => ctl.done(null),
        onPick: async i => {
          const id = ids[i], it = ITEMS[id];
          if (it.use === 'hint') { await say('「錦囊」要在答題時使用喔！'); return; }
          if (it.use === 'ball') { if (battle) return ctl.done({ id }); await say('「墨球」要在和野生詞靈戰鬥時使用！'); return; }
          const t = await Party.open({ mode: 'target', title: `要對誰使用「${it.name}」？` });
          if (t < 0) return;
          const m = G.party[t];
          if (it.use === 'heal' && (m.hp >= m.maxhp || m.hp <= 0)) { await say(m.hp <= 0 ? '倒下的詞靈要到休息處才能恢復。' : `${monName(m)} 的 HP 已經是滿的了。`); return; }
          if (battle) return ctl.done({ id, target: t });
          G.bag[id]--; Sound.sfx('heal');
          if (it.use === 'heal') { const f = m.hp; m.hp = Math.min(m.maxhp, m.hp + it.val); await say(`${monName(m)} 恢復了 ${m.hp - f} 點 HP！`); }
          else { m.moves.forEach(x => x.pp = MOVES[x.id].pp); await say(`${monName(m)} 的 PP 全部恢復了！`); }
          ctl.done(null);
        },
      });
    });
  },
};

/* ---------- 商店 ---------- */
const Shop = {
  async open(list) {
    const moneyBox = UI.el('box moneybox'); const upd = () => moneyBox.innerHTML = `${esc(W.money)}<br><b>${G.money}</b>`; upd();
    let sel = 0;
    while (true) {
      const opts = list.map(id => ({ label: ITEMS[id].name, sub: `${ITEMS[id].price} ${W.money}　持有 ${G.bag[id] || 0}` })).concat(['離開']);
      const i = await UI.choose(opts, { pos: { right: U(2), top: U(2) }, start: sel });
      if (i < 0 || i === list.length) break; sel = i;
      const id = list[i], it = ITEMS[id];
      const q = await UI.ask(`「${it.name}」：${it.desc}\n要買幾個？`, ['1 個', '3 個', '5 個', '算了'], { pos: { right: U(2), bottom: U(50) } });
      if (q < 0 || q === 3) continue;
      const n = [1, 3, 5][q], cost = n * it.price;
      if (G.money < cost) { Sound.sfx('bump'); await say(`${W.money}不夠喔！`); continue; }
      G.money -= cost; G.bag[id] = (G.bag[id] || 0) + n; upd(); Sound.sfx('ok');
      await say(`買了 ${n} 個「${it.name}」！謝謝惠顧！`);
    }
    moneyBox.remove(); autosave();
  },
};

/* ---------- 錯題本 ---------- */
const WrongBook = {
  open() {
    return UI.panel(ctl => {
      const box = ctl.box;
      const render = () => {
        const list = G.wrong;
        box.innerHTML = `<h2>錯題本　<span class="small muted">共 ${list.length} 題</span></h2><div class="scroll"></div>` + footKeys('A 查看／複習　B 返回');
        const sc = $('.scroll', box);
        const rows = [];
        const r0 = h('div', 'row', list.length ? `<b>✏️ 開始複習（最多 10 題，答對會移出錯題本，每題獎勵 20 ${esc(W.money)}）</b>` : '<span class="muted">目前沒有錯題，太棒了！繼續保持！</span>'); sc.appendChild(r0); rows.push(r0);
        list.forEach(w => { const q = QB.byId(w.id) || w.snap; const r = h('div', 'row', `${chip(q.cat)}<span class="grow ellip">${esc(q.q.replace(/\n/g, ' '))}</span><span class="small muted">錯 ${w.n} 次</span>`); sc.appendChild(r); rows.push(r); });
        listNav(ctl, rows, { onBack: () => ctl.done(), onPick: async i => {
          if (i === 0) { if (!list.length) return; await WrongBook.review(); render(); return; }
          const w = list[i - 1], q = QB.byId(w.id) || w.snap;
          const ansTxt = q.type === 'choice' ? q.opts[q.ans] : q.type === 'tf' ? (q.ans ? '○ 正確' : '✕ 錯誤') : q.type === 'fill' ? q.ans.join(' / ') : q.parts.join('');
          await UI.panel(c2 => { c2.box.innerHTML = `<h2>${chip(q.cat)} 題目解析</h2><div class="scroll"><div style="font-weight:700;white-space:pre-wrap">${esc(q.q)}</div>
            ${q.opts ? '<div class="small" style="margin:' + U(2) + ' 0">' + q.opts.map((o, k) => `${'ABCD'[k]}. ${esc(o)}`).join('　') + '</div>' : ''}
            <div style="margin:${U(2)} 0">✅ 正確答案：<b>${esc(ansTxt)}</b></div><div class="small muted">你上次的答案：${esc(w.last || '－')}</div>
            ${q.exp ? `<div class="qexp" style="margin-top:${U(3)}">💡 ${esc(q.exp)}</div>` : ''}</div>` + footKeys('B 返回');
            c2.update = () => { if (Input.p('B') || Input.p('A')) { Sound.sfx('back'); c2.done(); } }; });
        } });
      };
      render();
    });
  },
  async review() {
    const batch = G.wrong.slice(0, 10); let right = 0;
    for (const w of batch) {
      const q = QB.byId(w.id) || w.snap;
      const before = G.wrong.length;
      const r = await UI.question(q, { mode: 'review', hint: false });
      if (r.correct) { right++; G.wrong = G.wrong.filter(x => x.id !== w.id); G.money += 20; }
      void before;
    }
    Sound.sfx('badge');
    await say(`複習結束！答對 ${right} / ${batch.length} 題，獲得 ${right * 20} ${W.money}。`);
    autosave();
  },
};

/* ---------- 學習紀錄 ---------- */
const Records = {
  open() {
    return UI.panel(ctl => {
      const cats = Object.keys(CATS).concat(Object.keys(G.stats).filter(c => !CATS[c]));
      let tr = 0, tt = 0; for (const c in G.stats) { tr += G.stats[c].r; tt += G.stats[c].t; }
      const rows = cats.map(c => { const s = G.stats[c] || { r: 0, t: 0 }; const pct = s.t ? Math.round(s.r / s.t * 100) : 0;
        return `<div style="display:grid;grid-template-columns:${U(28)} 1fr ${U(50)};gap:${U(3)};align-items:center;margin:${U(1)} 0">${chip(c)}<div class="bar"><i style="width:${pct}%;background:${catColor(c)}"></i></div><span class="small">${s.t ? pct + '%' : '－'}　${s.r}/${s.t}</span></div>`; }).join('');
      const weakest = cats.filter(c => G.stats[c] && G.stats[c].t >= 3).sort((a, b) => G.stats[a].r / G.stats[a].t - G.stats[b].r / G.stats[b].t)[0];
      ctl.box.innerHTML = `<h2>學習紀錄</h2><div class="scroll">
        <div style="margin-bottom:${U(2)}">總答題 <b>${tt}</b> 題　答對率 <b>${tt ? Math.round(tr / tt * 100) : 0}%</b>　最高連對 <b>${G.bestStreak || 0}</b> 題　錯題本 <b>${G.wrong.length}</b> 題</div>
        ${rows}${weakest ? `<div class="small" style="margin-top:${U(2)}">📌 建議加強：${chip(weakest)} 可以多用這類招式練習，或到錯題本複習！</div>` : ''}</div>` + footKeys('B 返回');
      ctl.update = () => { if (Input.p('B') || Input.p('A')) { Sound.sfx('back'); ctl.done(); } };
    });
  },
};

/* ---------- 冒險手冊（訓練家卡） ---------- */
const Card = {
  open() {
    return UI.panel(ctl => {
      const t = Math.floor((G.time || 0) / 60); const allBadges = ['gym1', 'gym2', 'gym3'].map(k => W.roles[k]);
      ctl.box.innerHTML = `<h2>冒險手冊．${esc(W.name)}</h2><div style="display:flex;gap:${U(8)};flex:1"><div class="pv"></div><div class="grow">
        <div><b style="font-size:1.2em">${esc(G.player.name)}</b></div><div class="small muted">${esc(W.titleLabel)}：${esc(G.player.title)}</div>
        <div style="margin-top:${U(3)}">${esc(W.money)}：<b>${G.money}</b>　冒險時間：${Math.floor(t / 60)} 小時 ${t % 60} 分</div>
        <div>詞靈圖鑑：見過 <b>${Object.keys(G.seen).length}</b>　收服 <b>${Object.keys(G.caught).length}</b> / ${Object.keys(SPECIES).length}</div>
        <div style="margin:${U(3)} 0 ${U(1)}">徽章</div><div class="badges">${allBadges.map(r => { const got = G.badges.includes(r.badge); return `<div class="badge ${got ? '' : 'off'}" style="background:${r.badgeColor}" title="${esc(r.badge)}">${esc(r.badge[0])}</div>`; }).join('')}</div>
        <div class="small muted" style="margin-top:${U(1)}">${allBadges.map(r => G.badges.includes(r.badge) ? esc(r.badge) : '？？？').join('　')}</div>
        </div></div>` + footKeys('B 返回');
      $('.pv', ctl.box).appendChild(GFX.el(GFX.person(G.player.look, 'down', 0), 4.5));
      ctl.update = () => { if (Input.p('B') || Input.p('A')) { Sound.sfx('back'); ctl.done(); } };
    });
  },
};

/* ---------- 選擇第一隻詞靈 ---------- */
const StarterPick = {
  open() {
    return new Promise(res => {
      const loop = () => UI.panel(ctl => {
        ctl.box.innerHTML = `<h2>選擇你的夥伴</h2><div class="cards"></div>` + footKeys('←→ 選擇　A 決定');
        const wrap = $('.cards', ctl.box);
        const cards = STARTERS.map(id => { const S = SPECIES[id]; const cats = [...new Set(S.learn.map(([, m]) => MOVES[m].cats).flat())];
          const c = h('div', 'card'); const holder = h('div'); holder.style.cssText = `display:flex;justify-content:center;background:#eef6f0;border-radius:${U(3)}`; holder.appendChild(GFX.el(GFX.creature(id), 1.2)); c.appendChild(holder);
          c.insertAdjacentHTML('beforeend', `<h3>${esc(S.name)}</h3><div class="desc">${esc(S.desc)}</div><div class="desc"><b>擅長：</b><br>${cats.map(chip).join('')}</div>`); wrap.appendChild(c); return c; });
        let sel = 0; const paint = () => cards.forEach((c, i) => c.classList.toggle('sel', i === sel));
        const choose = async () => { Sound.sfx('ok'); const ok = await UI.yesno(`確定要選擇「${SPECIES[STARTERS[sel]].name}」嗎？`); if (ok) { ctl.done(STARTERS[sel]); } };
        cards.forEach((c, i) => c.addEventListener('pointerdown', e => { e.preventDefault(); if (sel === i) choose(); else { sel = i; Sound.sfx('cursor'); paint(); } }));
        ctl.update = () => { const d = Input.dir(); if (d === 'left' && sel > 0) { sel--; Sound.sfx('cursor'); paint(); } if (d === 'right' && sel < 2) { sel++; Sound.sfx('cursor'); paint(); } if (Input.p('A')) choose(); };
        paint();
      }).then(res);
      loop();
    });
  },
};

/* ---------- 世界觀選擇 ---------- */
function worldPreview(wid) {
  const Wd = WORLDS[wid]; const cv = document.createElement('canvas'); cv.width = 96; cv.height = 48; const g = cv.getContext('2d');
  const rows = ['TTTTTT', 'R R.g.', '#D.,gg'];
  const scene = [['T', 'T', 'T', 'T', 'T', 'T'], ['R', 'R', '.', '.', 'g', 'g'], ['#', 'D', ',', ',', 'g', 'g']]; void rows;
  scene.forEach((r, y) => r.forEach((c, x) => g.drawImage(GFX.tile(Wd.theme, c), x * 16, y * 16)));
  const look = Object.assign({ style: Wd.style }, Wd.roles.mentor.look);
  g.drawImage(GFX.person({ style: Wd.style, hair: '#302020', cloth: wid === 'school' ? '#f8f8f8' : wid === 'literati' ? '#88a0c8' : '#a84040', cloth2: '#3a58a0' }, 'down', 0), 40, 26);
  g.drawImage(GFX.person(look, 'left', 0), 60, 26);
  return cv;
}
const WorldSelect = {
  open() {
    return UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>選擇你的世界觀</h2><div class="cards"></div>` + footKeys('←→ 選擇　A 決定　B 返回');
      const wrap = $('.cards', ctl.box);
      const cards = WORLD_ORDER.map(id => { const Wd = WORLDS[id]; const c = h('div', 'card'); const pv = worldPreview(id); pv.className = 'pix'; c.appendChild(pv);
        c.insertAdjacentHTML('beforeend', `<h3>${Wd.icon} ${esc(Wd.name)}</h3><div class="desc">${esc(Wd.tagline)}</div><div class="desc"><b>三大關主：</b><br>${['gym1', 'gym2', 'gym3'].map(k => esc(Wd.roles[k].name)).join('<br>')}</div><div class="desc"><b>學習路線：</b>${esc(Wd.focus)}</div>`); wrap.appendChild(c); return c; });
      let sel = 0; const paint = () => cards.forEach((c, i) => c.classList.toggle('sel', i === sel));
      cards.forEach((c, i) => c.addEventListener('pointerdown', e => { e.preventDefault(); if (sel === i) { Sound.sfx('ok'); ctl.done(WORLD_ORDER[i]); } else { sel = i; Sound.sfx('cursor'); paint(); } }));
      ctl.update = () => { const d = Input.dir(); if (d === 'left' && sel > 0) { sel--; Sound.sfx('cursor'); paint(); } if (d === 'right' && sel < 2) { sel++; Sound.sfx('cursor'); paint(); }
        if (Input.p('A')) { Sound.sfx('ok'); ctl.done(WORLD_ORDER[sel]); } else if (Input.p('B')) { Sound.sfx('back'); ctl.done(null); } };
      paint();
    });
  },
};

/* ---------- 角色生成 ---------- */
const HAIRS = ['#2a2228', '#5a3a24', '#a86a38', '#d8b060', '#7a3a58', '#3a4a7a'];
const CLOTHES = { school: ['#f8f8f8', '#e8f0ff', '#fff4e0', '#f0f0f0'], literati: ['#88a0c8', '#a8c8a0', '#d8a8b8', '#e8e0c8', '#8a7ab0'], wuxia: ['#a84040', '#3a5a8a', '#3a7a4a', '#303038', '#e8e0d0'] };
const CLOTH2 = { school: ['#3a58a0', '#2e6a4a', '#8a3040', '#404048'], literati: ['#384870', '#4a6a40', '#8a4058', '#8a7040', '#4a3a6a'], wuxia: ['#e0c050', '#c8c8d8', '#d8a040', '#c83838', '#6a4a2a'] };
const CharCreate = {
  open(wid) {
    const Wd = WORLDS[wid];
    const genName = () => pick(Wd.surnames) + pick(Wd.given);
    const st = { name: genName(), gender: pick(['m', 'f']), hair: rnd(0, HAIRS.length - 1), cloth: 0, cloth2: 0, title: Wd.genTitle() };
    const look = () => ({ style: Wd.style, gender: st.gender, hair: HAIRS[st.hair], cloth: CLOTHES[Wd.style][st.cloth], cloth2: CLOTH2[Wd.style][st.cloth2], skin: '#f8d0a8' });
    return UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>建立角色．${Wd.icon} ${esc(Wd.name)}</h2><div class="cc"><div class="preview"></div><div class="fields"></div></div>` + footKeys('↑↓ 選項目　←→ 變更（名號可重新生成）　A 確認　B 返回');
      const pv = $('.preview', ctl.box), fields = $('.fields', ctl.box);
      const F = [
        { k: 'name', label: '名字' }, { k: 'gender', label: '性別' }, { k: 'hair', label: '髮色' }, { k: 'cloth', label: '衣服' }, { k: 'cloth2', label: '配色' },
        { k: 'title', label: Wd.titleLabel }, { k: 'rand', label: '' }, { k: 'go', label: '' }];
      const els = F.map(f => { const d = h('div', 'field'); fields.appendChild(d); return d; });
      let sel = 0, spin = 0, inp;
      const renderPreview = () => { pv.innerHTML = ''; pv.appendChild(GFX.el(GFX.person(look(), ['down', 'left', 'up', 'right'][spin % 4], 0), 4)); };
      const sw = c => `<span class="swatch" style="background:${c}"></span>`;
      const renderFields = () => F.forEach((f, i) => {
        const d = els[i]; d.classList.toggle('sel', i === sel);
        if (f.k === 'name') { if (!inp) { d.innerHTML = `<label>名字</label><div class="val"></div>`; inp = h('input'); inp.maxLength = 8; inp.value = st.name; $('.val', d).appendChild(inp);
          inp.addEventListener('input', () => st.name = inp.value); inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); inp.blur(); } if (e.key === 'Escape') inp.blur(); e.stopPropagation(); }); }
          else if (document.activeElement !== inp) inp.value = st.name; return; }
        if (f.k === 'rand') { d.innerHTML = `<span class="btn alt">🎲 隨機生成角色</span>`; return; }
        if (f.k === 'go') { d.innerHTML = `<span class="btn">▶ 開始冒險！</span>`; return; }
        let v = '';
        if (f.k === 'gender') v = st.gender === 'm' ? '男生' : '女生';
        if (f.k === 'hair') v = sw(HAIRS[st.hair]); if (f.k === 'cloth') v = sw(CLOTHES[Wd.style][st.cloth]); if (f.k === 'cloth2') v = sw(CLOTH2[Wd.style][st.cloth2]);
        if (f.k === 'title') v = `<span class="small">${esc(st.title)}</span>`;
        d.innerHTML = `<label>${esc(f.label)}</label><div class="val"><span class="arrow">◀</span>${v}<span class="arrow">▶</span></div>`;
      });
      const change = (k, dlt) => {
        if (k === 'gender') st.gender = st.gender === 'm' ? 'f' : 'm';
        if (k === 'hair') st.hair = (st.hair + dlt + HAIRS.length) % HAIRS.length;
        if (k === 'cloth') st.cloth = (st.cloth + dlt + CLOTHES[Wd.style].length) % CLOTHES[Wd.style].length;
        if (k === 'cloth2') st.cloth2 = (st.cloth2 + dlt + CLOTH2[Wd.style].length) % CLOTH2[Wd.style].length;
        if (k === 'title') st.title = Wd.genTitle();
        Sound.sfx('cursor'); renderFields(); renderPreview();
      };
      const randomize = () => { st.name = genName(); st.gender = pick(['m', 'f']); st.hair = rnd(0, HAIRS.length - 1); st.cloth = rnd(0, CLOTHES[Wd.style].length - 1); st.cloth2 = rnd(0, CLOTH2[Wd.style].length - 1); st.title = Wd.genTitle(); Sound.sfx('ok'); renderFields(); renderPreview(); };
      const go = async () => { st.name = (st.name || '').trim(); if (!st.name) { Sound.sfx('bump'); sel = 0; renderFields(); inp.focus(); return; }
        const ok = await UI.yesno(`「${st.name}」，${st.title}。\n就用這個角色展開冒險嗎？`); if (ok) ctl.done({ name: st.name, title: st.title, look: look() }); };
      const act = i => { const k = F[i].k; if (k === 'name') inp.focus(); else if (k === 'rand') randomize(); else if (k === 'go') { Sound.sfx('ok'); go(); } else change(k, 1); };
      els.forEach((d, i) => d.addEventListener('pointerdown', e => { if (e.target === inp) { sel = 0; renderFields(); return; } e.preventDefault(); sel = i;
        if (e.target.classList.contains('arrow')) change(F[i].k, e.target === d.querySelector('.arrow') ? -1 : 1); else act(i); renderFields(); }));
      ctl.update = () => {
        if (document.activeElement === inp) return;
        const d = Input.dir();
        if (d === 'up' && sel > 0) { sel--; Sound.sfx('cursor'); renderFields(); }
        if (d === 'down' && sel < F.length - 1) { sel++; Sound.sfx('cursor'); renderFields(); }
        if ((d === 'left' || d === 'right') && !['name', 'rand', 'go'].includes(F[sel].k)) change(F[sel].k, d === 'left' ? -1 : 1);
        if (Input.p('A')) act(sel); else if (Input.p('B')) { Sound.sfx('back'); ctl.done(null); }
      };
      const spinT = setInterval(() => { if (!ctl.box.isConnected) { clearInterval(spinT); return; } spin++; renderPreview(); }, 900);
      renderFields(); renderPreview();
    });
  },
};

/* ---------- 教師設定：匯入題庫、課次篩選 ---------- */
const Teacher = {
  open() {
    return UI.panel(ctl => {
      const box = ctl.box; box.classList.add('teacher');
      const render = () => {
        const cats = QB.cats(); const lessons = QB.lessons();
        box.innerHTML = `<h2>👩‍🏫 教師設定．題庫管理</h2><div class="grid2">
          <div class="col"><div><b>目前題庫：</b>${QB.source === 'custom' ? '自訂題庫' : '示範題庫'}，共 ${QB.all.length} 題（啟用 ${QB.active().length} 題）</div>
            <div class="catwrap">${Object.keys(CATS).concat(Object.keys(cats).filter(c => !CATS[c])).map(c => `<span>${chip(c)}${cats[c] || 0}</span>`).join('')}</div>
            <div class="btns"><button class="btn" data-a="imp">📥 匯入（取代）</button><button class="btn alt" data-a="add">➕ 匯入（附加）</button></div>
            <div class="btns"><button class="btn alt" data-a="tpl">📄 下載 CSV 範本</button><button class="btn alt" data-a="exp">📤 匯出目前題庫</button></div>
            <div class="btns"><button class="btn warn" data-a="reset">還原示範題庫</button><button class="btn warn" data-a="wipe">清除遊戲存檔</button></div>
            <div class="muted small msg"></div></div>
          <div class="col"><div><b>課次篩選</b>（取消勾選即不出該課題目）</div><div class="scroll">${lessons.map(([l, n], i) => `<label class="chk"><input type="checkbox" data-l="${i}" ${QB.off.has(l) ? '' : 'checked'}>${esc(l)}<span class="muted">（${n}）</span></label>`).join('')}</div>
            <div class="small muted">支援 CSV（Excel／Google 試算表另存 CSV）與 JSON。欄位：題型、分類、難度、課次、題目、選項1～4、答案、解析。</div></div>
          </div>` + footKeys('B 返回標題（本頁請用滑鼠操作）');
        box.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', () => { const l = lessons[+cb.dataset.l][0]; if (cb.checked) QB.off.delete(l); else QB.off.add(l); if (!QB.active().length) { QB.off.delete(l); cb.checked = true; alert('至少要保留一個課次喔！'); } QB.saveOff(); render(); }));
        box.querySelectorAll('button[data-a]').forEach(b => b.addEventListener('click', () => action(b.dataset.a)));
      };
      const note = t => { const m = $('.msg', box); if (m) m.textContent = t; };
      const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
      const action = a => {
        if (a === 'imp' || a === 'add') {
          const f = document.createElement('input'); f.type = 'file'; f.accept = '.csv,.json,.txt,.tsv';
          f.onchange = () => { const file = f.files[0]; if (!file) return; const rd = new FileReader();
            rd.onload = () => { try { const txt = String(rd.result); let list, errs = [];
              if (/\.json$/i.test(file.name) || /^\s*[\[{]/.test(txt)) { const j = JSON.parse(txt); list = Array.isArray(j) ? j : (j.questions || []); }
              else ({ list, errs } = csvToQuestions(txt));
              if (!list.length) throw new Error('沒有讀到任何題目'); QB.setBank(list, a === 'add' ? 'append' : 'replace'); render();
              note(`✅ 成功匯入 ${list.length} 題。${errs.length ? '略過 ' + errs.length + ' 題：' + errs.slice(0, 3).join('；') : ''}`);
            } catch (e) { note('❌ 匯入失敗：' + e.message); } };
            rd.readAsText(file, 'utf-8'); };
          f.click();
        }
        if (a === 'tpl') download('詞靈冒險_題庫範本.csv', questionsToCSV(QUESTIONS_SAMPLE.slice(0, 6).map(normalizeQ).concat(QUESTIONS_SAMPLE.filter(q => q.type && q.type !== 'choice').map(normalizeQ))), 'text/csv;charset=utf-8');
        if (a === 'exp') download('詞靈冒險_目前題庫.csv', questionsToCSV(QB.all), 'text/csv;charset=utf-8');
        if (a === 'reset') { if (confirm('確定要還原成示範題庫嗎？自訂題庫會被清除。')) { QB.reset(); render(); note('已還原示範題庫。'); } }
        if (a === 'wipe') { if (confirm('確定要清除這台電腦上的遊戲存檔嗎？')) { Store.del('ciling_save'); note('存檔已清除。'); } }
      };
      render();
      ctl.update = () => { if (Input.p('B')) { Sound.sfx('back'); ctl.done(); } };
    });
  },
};

/* ---------- 操作說明 ---------- */
const Help = {
  open() {
    return UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>遊戲說明</h2><div class="scroll small" style="line-height:1.7">
        <b>🎮 操作</b>：方向鍵／WASD 移動，Z 或空白鍵＝A（確認、對話），X 或 Esc＝B（取消，按住可奔跑），Enter 或 M＝開啟選單。手機可用下方按鍵，也能直接點選畫面。<br>
        <b>⚔ 戰鬥＝答題</b>：每一招都對應一種國文題型（字音、字形、詞義、成語、修辭、文言、詩詞、常識、閱讀）。<b>答對才能命中</b>；連續答對 3 題以上傷害提升！<br>
        <b>🛡 防禦題</b>：對手出招時有機會「出題」，答對就能完全閃避。<br>
        <b>🎯 弱點</b>：每種詞靈都有弱點題型，打中弱點「效果絕佳」，傷害兩倍。<br>
        <b>🔴 收服</b>：把野生詞靈 HP 打低後丟「墨球」，就能收服牠成為夥伴。<br>
        <b>🎁 錦囊</b>：答選擇題時可以使用，刪去兩個錯誤選項。<br>
        <b>📖 錯題本</b>：答錯的題目會自動收錄，隨時可以複習，答對就移出錯題本。<br>
        <b>🏅 目標</b>：打敗三位關主取得三枚徽章，再挑戰最終魔王！</div>` + footKeys('B 返回');
      ctl.update = () => { if (Input.p('B') || Input.p('A')) { Sound.sfx('back'); ctl.done(); } };
    });
  },
};

/* ---------- 結局與成績單 ---------- */
const Ending = {
  async play() {
    Sound.play('ending'); G.flags.cleared = true;
    for (const t of W.ending) await say(t);
    let tr = 0, tt = 0; for (const c in G.stats) { tr += G.stats[c].r; tt += G.stats[c].t; }
    await UI.panel(ctl => {
      const t = Math.floor((G.time || 0) / 60);
      ctl.box.innerHTML = `<h2>🎉 恭喜通關！冒險成績單</h2><div style="display:flex;gap:${U(8)}"><div class="pv"></div><div class="grow">
        <div><b>${esc(G.player.name)}</b>　<span class="small muted">${esc(G.player.title)}</span></div>
        <div>世界觀：${esc(W.name)}　冒險時間：${Math.floor(t / 60)} 小時 ${t % 60} 分</div>
        <div>總答題：<b>${tt}</b> 題　答對率：<b>${tt ? Math.round(tr / tt * 100) : 0}%</b>　最高連對：<b>${G.bestStreak || 0}</b></div>
        <div>收服詞靈：<b>${Object.keys(G.caught).length}</b> 種　錯題本剩餘：<b>${G.wrong.length}</b> 題</div>
        <div class="small" style="margin-top:${U(4)}">感謝遊玩《詞靈冒險．翡翠之卷》！你可以繼續在世界中探索、收服詞靈、複習錯題。</div></div></div>` + footKeys('A 繼續');
      $('.pv', ctl.box).appendChild(GFX.el(GFX.person(G.player.look, 'down', 0), 4.5));
      ctl.update = () => { if (Input.p('A') || Input.p('B')) { Sound.sfx('ok'); ctl.done(); } };
    });
    Sound.play(W.music[OW.L.music]);
  },
};
