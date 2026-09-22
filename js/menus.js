'use strict';
/* ============ 存檔欄位與永久紀錄 ============ */
const SLOT_N = 3;
const Slots = {
  key: n => Cloud.user ? `ciling_u_${Cloud.user.cls}_${Cloud.user.no}_slot_${n}` : 'ciling_slot_' + n,
  read(n) { return Store.get(this.key(n), null); },
  write(n, g) { g.savedAt = Date.now(); const ok = Store.set(this.key(n), g); Cloud.queue(n); return ok; },
  del(n) { Store.del(this.key(n)); Cloud.queue(n); },
  any() { for (let i = 1; i <= SLOT_N; i++) if (this.read(i)) return true; return false; },
  cleared() { const r = []; for (let i = 1; i <= SLOT_N; i++) { const g = this.read(i); if (g && g.flags && g.flags.cleared) r.push(i); } return r; },
};
const Meta = {
  d: Object.assign({ cleared: {}, armory: {}, reports: [] }, Store.get('ciling_meta', {})),
  save() { Store.set('ciling_meta', this.d); },
  seeWeapon(world, arch, r = 0) { const k = world + ':' + arch; if ((this.d.armory[k] || 0) < r + 1) { this.d.armory[k] = r + 1; this.save(); } },
  hasAny() { return Object.keys(this.d.cleared).length > 0 || this.d.reports.length > 0; },
  clear(world) { this.d.cleared[world] = (this.d.cleared[world] || 0) + 1; this.save(); },
  addReport(r) { this.d.reports.unshift(r); this.d.reports = this.d.reports.slice(0, 20); this.save(); },
};
const fmtTime = s => { const m = Math.floor((s || 0) / 60); return `${Math.floor(m / 60)} 小時 ${m % 60} 分`; };
const fmtDate = t => { if (!t) return ''; const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const footKeys = t => `<div class="foot">${t || 'A 確認　B 返回'}</div>`;
const inkBar = (v, max, low) => { const r = clamp(v / max, 0, 1); return `<div class="inkbar"><i class="${low && r <= .25 ? 'low' : ''}" style="width:${r * 100}%"></i></div>`; };
function totals(g) { let r = 0, t = 0; for (const c in g.stats) { r += g.stats[c].r; t += g.stats[c].t; } return { r, t, pct: t ? Math.round(r / t * 100) : 0 }; }
function download(name, blobOrText, type) { const blob = blobOrText instanceof Blob ? blobOrText : new Blob([blobOrText], { type }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
function pickFile(accept) { return new Promise(res => { const f = document.createElement('input'); f.type = 'file'; f.accept = accept; f.onchange = () => { const file = f.files[0]; if (!file) return res(null); const rd = new FileReader(); rd.onload = () => res({ name: file.name, text: String(rd.result) }); rd.readAsText(file, 'utf-8'); }; f.click(); }); }
const catChips = a => ARCH[a].cats.length >= ALL_CATS.length ? '<span class="chip" style="background:#2e261e">全題型</span>' : ARCH[a].cats.map(chip).join('');
/* 帶稀有度外框的武器圖示 */
function wIcon(arch, r, scale = 1.2) { const b = h('span', 'wbox r' + r); b.appendChild(GFX.el(GFX.weapon(arch, W.theme), scale)); return b; }
const closeOnAB = ctl => { ctl.update = () => { if (Input.p('B') || Input.p('A')) { Sound.sfx('back'); ctl.done(); } }; };

/* ============ 存檔畫面 ============ */
const SlotScreen = {
  open(mode) {   // mode: load / new / rebirth
    return UI.panel(ctl => {
      const title = { load: '讀取存檔', new: '選擇存檔欄位', rebirth: '選擇要轉生的存檔' }[mode];
      const render = () => {
        ctl.box.innerHTML = `<h2>${title}</h2><div class="scroll"></div>` + footKeys(mode === 'load' ? 'A 選擇（可載入、匯出、刪除）　B 返回' : 'A 選擇　B 返回');
        const sc = $('.scroll', ctl.box); const rows = [];
        for (let i = 1; i <= SLOT_N; i++) {
          const g = Slots.read(i); const r = h('div', 'row slot');
          if (g) { const Wd = WORLDS[g.world];
            r.innerHTML = `<div class="slotno">${i}</div><div class="grow"><b>${esc(g.player.name)}</b>　<span class="small">${Wd.icon} ${esc(Wd.name)}．Lv.${g.lv}${g.ng ? `．轉生 ${g.ng} 次` : ''}${g.flags.cleared ? '．<b class="good">已通關</b>' : ''}</span>
              <div class="small muted">${esc(g.flags.cleared ? '試玩版完成' : Wd.chapterName)}．遊玩 ${fmtTime(g.time)}．存於 ${fmtDate(g.savedAt)}</div></div>`;
            if (mode === 'rebirth' && !g.flags.cleared) r.classList.add('dis');
          } else r.innerHTML = `<div class="slotno">${i}</div><div class="grow muted">（空白欄位）</div>`;
          sc.appendChild(r); rows.push(r);
        }
        if (mode === 'load') { const r = h('div', 'row', '<div class="slotno">＋</div><div class="grow">📥 匯入存檔檔案（從其他電腦帶來的存檔）</div>'); sc.appendChild(r); rows.push(r); }
        listNav(ctl, rows, { onBack: () => ctl.done(null), onPick });
      };
      async function onPick(i) {
        const n = i + 1, g = Slots.read(n);
        if (mode === 'load' && n > SLOT_N) return importSave();
        if (mode === 'rebirth') { if (!g || !g.flags.cleared) { Sound.sfx('bump'); return; } return ctl.done(n); }
        if (mode === 'new') { if (g && !(await UI.yesno(`欄位 ${n} 已有存檔（${g.player.name}），要覆蓋嗎？`))) return; return ctl.done(n); }
        if (!g) { Sound.sfx('bump'); return; }
        const k = await UI.choose(['載入', '匯出存檔檔案', '刪除', '取消'], { pos: { right: U(8), bottom: U(10) } });
        if (k === 0) return ctl.done(n);
        if (k === 1) { download(`詞靈冒險_存檔${n}_${g.player.name}.json`, JSON.stringify(g), 'application/json'); await say('已下載存檔檔案。換電腦時，用「匯入存檔檔案」就能繼續玩。'); }
        if (k === 2 && await UI.yesno(`確定要刪除欄位 ${n}（${g.player.name}）嗎？刪除後無法復原。`)) { Slots.del(n); render(); }
      }
      async function importSave() {
        const f = await pickFile('.json'); if (!f) return;
        let g; try { g = JSON.parse(f.text); if (!g.world || !g.player || !WORLDS[g.world]) throw 0; } catch (e) { await say('這不是有效的存檔檔案。'); return; }
        const k = await UI.ask('要匯入到哪一個欄位？', ['欄位 1', '欄位 2', '欄位 3', '取消']);
        if (k < 0 || k > 2) return; const n = k + 1;
        if (Slots.read(n) && !(await UI.yesno(`欄位 ${n} 已有存檔，要覆蓋嗎？`))) return;
        g.slot = n; Slots.write(n, g); Sound.sfx('badge'); await say(`已匯入「${g.player.name}」的存檔到欄位 ${n}！`); render();
      }
      render();
    });
  },
};

/* ============ 書冊選單（左側展開） ============ */
const BookMenu = {
  async open() {
    let sel = 0;
    while (true) {
      const opts = ['角色', '武器', '鍛造', '道具', '兵器譜', '任務', '錯題本', '學習紀錄', '存檔', '設定', '回到主畫面', '關閉'];
      const i = await UI.choose(opts, { pos: {}, cls: 'bookmenu', start: sel });
      const L = opts[i]; if (i < 0 || L === '關閉') return; sel = i;
      if (L === '角色') await CharPanel.open();
      if (L === '武器') await WeaponMenu.open();
      if (L === '鍛造') await Forge.open();
      if (L === '道具') await Bag.open({});
      if (L === '兵器譜') await Armory.open();
      if (L === '任務') await Quests.open();
      if (L === '錯題本') await WrongBook.open();
      if (L === '學習紀錄') await Records.open();
      if (L === '存檔') { autosave(); Sound.sfx('badge'); await say(`已儲存到欄位 ${G.slot}！（${fmtDate(G.savedAt)}）`); }
      if (L === '設定') await SettingsPanel.open();
      if (L === '回到主畫面') { await goHome(); if (Game.scene === 'title') return; }
    }
  },
};
const CharPanel = {
  open() {
    return UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>角色</h2><div style="display:flex;gap:${U(8)};flex:1;min-height:0"><div class="pv"></div><div class="grow small" style="line-height:1.7">
        <div><b style="font-size:1.25em">${esc(G.player.name)}</b>　<span class="muted">${esc(G.player.title)}</span></div>
        <div>${W.icon} ${esc(W.name)}．${esc(W.chapterName)}${G.ng ? `．轉生 ${G.ng} 次` : ''}</div>
        <div>等級 <b>${G.lv}</b>　經驗 ${G.exp} / ${expNeed(G.lv)}</div>
        <div style="display:flex;gap:${U(3)};align-items:center">氣血 ${inkBar(G.hp, G.maxhp, 1)} ${G.hp}/${G.maxhp}</div>
        <div>攻擊 ${G.atk}　防禦 ${G.def}　文氣 ${wenqiDots()}</div>
        <div>${esc(W.money)} ${G.money}　遊玩時間 ${fmtTime(G.time)}</div>
        <div>徽章　${G.badges.length ? G.badges.map(b => `<span class="seal">${esc(b)}</span>`).join(' ') : '<span class="muted">尚未取得</span>'}</div>
        </div></div>` + footKeys('B 返回');
      $('.pv', ctl.box).appendChild(GFX.el(GFX.person(G.player.look, 'down', 0), 4.5)); closeOnAB(ctl);
    });
  },
};

/* ---------- 武器 ---------- */
function sortedWeapons() { return G.weapons.slice().sort((a, b) => (G.equip.indexOf(b.id) >= 0) - (G.equip.indexOf(a.id) >= 0) || b.r - a.r || ARCH_ORDER.indexOf(a.arch) - ARCH_ORDER.indexOf(b.arch)); }
const WeaponMenu = {
  open() {
    return UI.panel(ctl => {
      const render = () => {
        const list = sortedWeapons();
        ctl.box.innerHTML = `<h2>武器　<span class="small muted">共 ${list.length} 件．最多攜帶 3 件，戰鬥中可切換</span></h2><div class="scroll"></div>` + footKeys('A 選擇　B 返回');
        const sc = $('.scroll', ctl.box);
        const rows = list.map(w => { const lv = weaponLv(w), next = MASTERY_STEPS[lv], slot = G.equip.indexOf(w.id); const r = h('div', 'row');
          r.appendChild(wIcon(w.arch, w.r));
          r.insertAdjacentHTML('beforeend', `<div class="grow"><b class="rtxt r${w.r}">${esc(weaponName(w))}</b> ${rarChip(w.r)} <span class="small">Lv.${lv}</span> ${catChips(w.arch)}
            <div class="small muted">熟練度 ${w.mastery}${next != null ? ' / ' + next : '（已滿級）'}${ARCH[w.arch].passive ? `．<b style="color:#b8322a">能力「${PASSIVES[ARCH[w.arch].passive].name}」</b>` : ''}</div></div>
            <span class="small">${slot === G.cur ? '<b class="good">★ 使用中</b>' : slot >= 0 ? `攜帶 ${slot + 1}` : '<span class="muted">收納中</span>'}</span>`);
          sc.appendChild(r); return r; });
        listNav(ctl, rows, { onBack: () => ctl.done(), onPick: async i => {
          const w = list[i], slot = G.equip.indexOf(w.id);
          const opts = [slot >= 0 ? '設為使用中' : '放入攜帶欄', slot >= 0 ? '從攜帶欄取出' : null, '查看招式', '取消'].filter(Boolean);
          const k = await UI.choose(opts, { pos: { right: U(8), bottom: U(10) } }); const o = opts[k];
          if (o === '設為使用中') { G.cur = slot; playerStats(); Sound.sfx('ok'); }
          if (o === '放入攜帶欄') { if (G.equip.length >= 3) { const j = await UI.ask('攜帶欄滿了，要替換哪一件？', G.equip.map(id => { const x = wById(id); return { label: weaponName(x), sub: RARITY[x.r].n }; }).concat(['取消'])); if (j < 0 || j > 2) return render(); G.equip[j] = w.id; if (j === G.cur) playerStats(); } else G.equip.push(w.id); Sound.sfx('ok'); }
          if (o === '從攜帶欄取出') { if (G.equip.length <= 1) { await say('至少要攜帶一件武器！'); return; } const cur = G.equip[G.cur]; G.equip.splice(slot, 1); G.cur = Math.max(0, G.equip.indexOf(cur)); playerStats(); Sound.sfx('ok'); }
          if (o === '查看招式') await WeaponMenu.detail(w);
          render();
        } });
      };
      render();
    });
  },
  detail(w) {
    return UI.panel(ctl => {
      const a = w.arch, lv = weaponLv(w), mul = RAR_POW[w.r];
      ctl.box.innerHTML = `<h2><span class="rtxt r${w.r}">${esc(weaponName(w))}</span>　${rarChip(w.r)} <span class="small muted">Lv.${lv}</span></h2><div style="display:flex;gap:${U(6)};flex:1;min-height:0"><div class="pv"></div><div class="grow scroll small">
        <div>${esc(weaponDesc(a))}</div><div style="margin:${U(2)} 0">擅長 ${catChips(a)}　<span class="muted">稀有度加成：攻擊 +${RAR_ATK[w.r]}、招式威力 ×${mul}</span></div>
        ${ARCH[a].skills.map(([n, c, p], i) => { const open = i < lv + 1; return `<div class="row" style="padding:${U(1)} ${U(2)}"><b class="grow">${open ? esc(n) : '？？？'}</b>${open ? c.slice(0, 3).map(chip).join('') + `　威力 ${Math.round(p * mul)}` : `<span class="muted">武器 Lv.${i} 解鎖（熟練度 ${MASTERY_STEPS[i - 1]}）</span>`}</div>`; }).join('')}
        <div class="row" style="padding:${U(1)} ${U(2)}"><b class="grow">★ ${esc(ARCH[a].ult)}</b><span class="muted">必殺技．文氣 5 格</span></div>
        <div class="muted" style="margin-top:${U(2)}">用這件武器答對題目，熟練度 +1；打中弱點 +2。</div></div></div>` + footKeys('B 返回');
      $('.pv', ctl.box).appendChild(wIcon(a, w.r, 4)); closeOnAB(ctl);
    });
  },
};

/* ---------- 鍛造：碎片合成、升階合成 ---------- */
const Forge = {
  open() {
    return UI.panel(ctl => {
      const render = () => {
        const acts = [];
        ctl.box.innerHTML = `<h2>⚒ 鍛造</h2><div class="scroll"></div>` + footKeys(`A 合成　B 返回　｜碎片 ${FRAG_N} 片 → 凡品武器；同名同階武器 → 升一階（彩色守護神器無法合成）`);
        const sc = $('.scroll', ctl.box);
        sc.insertAdjacentHTML('beforeend', '<div class="qsec">碎片合成</div>');
        const fr = ARCH_ORDER.filter(a => (G.frags[a] || 0) > 0);
        if (!fr.length) sc.insertAdjacentHTML('beforeend', `<div class="small muted">還沒有碎片。打倒${esc(W.monsters.brush)}等武器妖，有機會掉落碎片。</div>`);
        for (const a of fr) { const n = G.frags[a], ok = n >= FRAG_N; const r = h('div', 'row' + (ok ? '' : ' dis')); r.appendChild(wIcon(a, 0));
          r.insertAdjacentHTML('beforeend', `<div class="grow"><b>${esc(weaponName(a))}碎片</b>　${n} / ${FRAG_N}<div class="small muted">${ok ? '可以合成一件凡品「' + esc(weaponName(a)) + '」' : '還差 ' + (FRAG_N - n) + ' 片'}</div></div>`);
          sc.appendChild(r); acts.push({ r, ok, run: () => { G.frags[a] -= FRAG_N; const w = giveWeapon(a, 0); return `合成成功！得到了「${weaponName(w)}」（凡品）！`; } }); }
        sc.insertAdjacentHTML('beforeend', '<div class="qsec">升階合成</div>');
        const groups = {}; for (const w of G.weapons) if (w.r < 5 && !ARCH[w.arch].guardian) (groups[w.arch + ':' + w.r] || (groups[w.arch + ':' + w.r] = [])).push(w);
        const keys = Object.keys(groups).sort((x, y) => ARCH_ORDER.indexOf(x.split(':')[0]) - ARCH_ORDER.indexOf(y.split(':')[0]) || +x.split(':')[1] - +y.split(':')[1]);
        if (!keys.length) sc.insertAdjacentHTML('beforeend', '<div class="small muted">沒有可以升階的武器。</div>');
        for (const k of keys) { const g = groups[k], a = g[0].arch, rr = g[0].r, need = MERGE_N[rr], ok = g.length >= need; const r = h('div', 'row' + (ok ? '' : ' dis'));
          r.appendChild(wIcon(a, rr));
          r.insertAdjacentHTML('beforeend', `<div class="grow"><b>${esc(weaponName(a))}</b> ${rarChip(rr)} × ${g.length} / ${need}　→　${rarChip(rr + 1)}<div class="small muted">${ok ? '可以升階！熟練度保留最高的一件' : '還差 ' + (need - g.length) + ' 件同名同階武器'}</div></div>`);
          sc.appendChild(r); acts.push({ r, ok, run: async () => {
            if (!(await UI.yesno(`要消耗 ${need} 件${RARITY[rr].n}「${weaponName(a)}」，合成一件${RARITY[rr + 1].n}嗎？`))) return null;
            const use = g.slice().sort((x, y) => (G.equip.indexOf(x.id) >= 0) - (G.equip.indexOf(y.id) >= 0) || x.mastery - y.mastery).slice(0, need);
            const nw = newWeapon(a, rr + 1); nw.mastery = Math.max(...use.map(x => x.mastery));
            const curId = G.equip[G.cur]; let slot = -1;
            for (const x of use) { const i = G.equip.indexOf(x.id); if (i >= 0) { if (slot < 0) slot = i; G.equip.splice(i, 1); } G.weapons.splice(G.weapons.indexOf(x), 1); }
            G.weapons.push(nw); Meta.seeWeapon(G.world, a, nw.r);
            if (slot >= 0) G.equip.splice(slot, 0, nw.id); else if (G.equip.length < 3) G.equip.push(nw.id);
            G.cur = Math.max(0, G.equip.indexOf(use.some(x => x.id === curId) ? nw.id : curId)); playerStats();
            return `升階成功！得到了${RARITY[nw.r].n}「${weaponName(nw)}」！`; } }); }
        listNav(ctl, acts.map(x => x.r), { onBack: () => ctl.done(), onPick: async i => { const A = acts[i]; if (!A.ok) { Sound.sfx('bump'); return; } const m = await A.run(); if (!m) return; Sound.sfx('badge'); await say(m); autosave(); render(); } });
      };
      render();
    });
  },
};
const WeaponPick = {
  open() {
    return new Promise(res => UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>選擇你的第一件武器</h2><div class="cards"></div>` + footKeys('←→ 選擇　A 決定');
      const wrap = $('.cards', ctl.box);
      const cards = STARTER_ARCHS.map(a => { const c = h('div', 'card'); const hold = h('div', 'cardpic'); hold.appendChild(GFX.el(GFX.weapon(a, W.theme), 3)); c.appendChild(hold);
        c.insertAdjacentHTML('beforeend', `<h3>${esc(weaponName(a))}</h3><div class="desc">${esc(weaponDesc(a))}</div><div class="desc"><b>擅長：</b>${catChips(a)}</div><div class="desc"><b>招式：</b>${ARCH[a].skills.slice(0, 2).map(s => esc(s[0])).join('、')}…</div>`); wrap.appendChild(c); return c; });
      let sel = 0; const paint = () => cards.forEach((c, i) => c.classList.toggle('sel', i === sel));
      const choose = async () => { Sound.sfx('ok'); if (await UI.yesno(`確定要選擇「${weaponName(STARTER_ARCHS[sel])}」嗎？\n（之後還能取得其他武器）`)) ctl.done(STARTER_ARCHS[sel]); };
      cards.forEach((c, i) => c.addEventListener('pointerdown', e => { e.preventDefault(); if (sel === i) choose(); else { sel = i; Sound.sfx('cursor'); paint(); } }));
      ctl.update = () => { const d = Input.dir(); if (d === 'left' && sel > 0) { sel--; Sound.sfx('cursor'); paint(); } if (d === 'right' && sel < 2) { sel++; Sound.sfx('cursor'); paint(); } if (Input.p('A')) choose(); };
      paint();
    }).then(res));
  },
};
const Armory = {
  open() {
    return UI.panel(ctl => {
      const got = ARCH_ORDER.filter(a => Meta.d.armory[G.world + ':' + a]).length; const all = Object.keys(Meta.d.armory).filter(k => !ARCH[k.split(':')[1]].guardian).length;
      ctl.box.innerHTML = `<h2>兵器譜．${esc(W.name)}　<span class="small muted">${got} / ${ARCH_ORDER.length}（三世界合計 ${all} / ${ARCH_ORDER.length * 3}）</span></h2><div class="scroll"><div class="armory"></div><div class="qsec">守護神器（依劇情選擇取得）</div><div class="armory g"></div></div>` + footKeys('↑↓ 捲動　B 返回');
      const wrap = $('.armory', ctl.box), gw = $('.armory.g', ctl.box);
      const card = (a, box) => { const seen = Meta.d.armory[G.world + ':' + a]; const c = h('div', 'arm' + (seen ? '' : ' unk'));
        const pic = wIcon(a, seen ? seen - 1 : (ARCH[a].guardian ? 6 : 0), 1.3); if (!seen) pic.style.filter = 'brightness(0) opacity(.35)'; c.appendChild(pic);
        const info = ARCH[a].guardian ? (seen ? '能力：' + PASSIVES[ARCH[a].passive].name : '劇情取得') : (seen ? '最高：' + RARITY[seen - 1].n : `第 ${ARCH[a].ch} 章出現`);
        c.insertAdjacentHTML('beforeend', `<div><b>${seen ? esc(weaponName(a)) : '？？？'}</b><div class="small muted">${info}</div></div>`); box.appendChild(c); };
      ARCH_ORDER.forEach(a => card(a, wrap)); Object.values(W.guardians).forEach(a => card(a, gw));
      const sc = $('.scroll', ctl.box);
      ctl.update = () => { const d = Input.dir(); if (d === 'down') sc.scrollTop += 40; if (d === 'up') sc.scrollTop -= 40; if (Input.p('B') || Input.p('A')) { Sound.sfx('back'); ctl.done(); } };
    });
  },
};

/* ---------- 道具與商店 ---------- */
const Bag = {
  open({ battle } = {}) {
    return UI.panel(ctl => {
      const ids = ITEM_ORDER.filter(id => G.bag[id] > 0);
      ctl.box.innerHTML = `<h2>道具　<span class="small muted">${G.money} ${esc(W.money)}</span></h2><div class="scroll"></div><div class="small desc" style="min-height:${U(12)};padding-top:${U(2)}"></div>` + footKeys();
      const sc = $('.scroll', ctl.box), desc = $('.desc', ctl.box);
      if (!ids.length) sc.innerHTML = '<div class="muted">沒有道具……</div>';
      const rows = ids.map(id => { const r = h('div', 'row', `<b class="grow">${esc(itemName(id))}</b><span>× ${G.bag[id]}</span>`); sc.appendChild(r); return r; });
      listNav(ctl, rows, { onMove: i => desc.textContent = ids[i] ? ITEMS[ids[i]].desc : '', onBack: () => ctl.done(null),
        onPick: async i => { const id = ids[i], it = ITEMS[id];
          if (it.use === 'hint') { await say(`「${itemName(id)}」要在答題時使用喔！`); return; }
          if (it.use === 'heal' && G.hp >= G.maxhp) { await say('氣血已經是滿的了。'); return; }
          if (it.use === 'wenqi' && G.wenqi >= ULT_COST) { await say('文氣已經滿了。'); return; }
          if (battle) return ctl.done(id);
          G.bag[id]--; Sound.sfx('heal');
          if (it.use === 'heal') { const f = G.hp; G.hp = Math.min(G.maxhp, G.hp + it.val); await say(`恢復了 ${G.hp - f} 點氣血！`); }
          else { G.wenqi = Math.min(ULT_COST, G.wenqi + it.val); await say('文氣增加了！'); }
          ctl.done(null); } });
    });
  },
};
const Shop = {
  async open(list) {
    const moneyBox = UI.el('box moneybox'); const upd = () => moneyBox.innerHTML = `${esc(W.money)}<br><b>${G.money}</b>`; upd();
    let sel = 0;
    while (true) {
      const opts = list.map(id => ({ label: itemName(id), sub: `${ITEMS[id].price}　持有 ${G.bag[id] || 0}` })).concat(['離開']);
      const i = await UI.choose(opts, { pos: { right: U(2), top: U(2) }, start: sel }); if (i < 0 || i === list.length) break; sel = i;
      const id = list[i], it = ITEMS[id];
      const q = await UI.ask(`「${itemName(id)}」：${it.desc}\n要買幾個？`, ['1 個', '3 個', '5 個', '算了']);
      if (q < 0 || q === 3) continue; const n = [1, 3, 5][q], cost = n * it.price;
      if (G.money < cost) { Sound.sfx('bump'); await say(`${W.money}不夠喔！`); continue; }
      G.money -= cost; G.bag[id] += n; upd(); Sound.sfx('ok'); await say(`買了 ${n} 個「${itemName(id)}」！`);
    }
    moneyBox.remove(); autosave();
  },
};

/* ---------- 任務 ---------- */
const Quests = {
  main() {
    if (!G.equip.length) return `去找${W.roles.mentor.name}領取武器。`;
    if (!G.badges.length) return `穿過${W.mapNames.route1}，到${W.mapNames.town2}挑戰關主「${W.roles.gym1.name}」。`;
    return '第一章完成！（試玩版內容到此為止）';
  },
  open() {
    return UI.panel(ctl => {
      const q = G.quests.bugs; const R = W.roles.questGiver;
      const side = !q || q.state === 'none' ? `<span class="muted">？？？（到${W.mapNames.route1}找找看有沒有人需要幫忙）</span>`
        : q.state === 'active' ? `消滅 3 隻錯字蟲（${q.n} / 3）<span class="muted">．委託人：${esc(R.name)}</span>${q.n >= 3 ? '　<b class="good">可回報！</b>' : ''}` : `<s>消滅 3 隻錯字蟲</s>　<b class="good">已完成</b>`;
      ctl.box.innerHTML = `<h2>任務</h2><div class="scroll"><div class="qsec">主線．${esc(W.chapterName)}</div><div class="qitem">◆ ${esc(Quests.main())}</div>
        <div class="qsec">支線</div><div class="qitem">◆ ${side}</div></div>` + footKeys('B 返回'); closeOnAB(ctl);
    });
  },
};

/* ---------- 錯題本 ---------- */
const WrongBook = {
  open() {
    return UI.panel(ctl => {
      const render = () => {
        const list = G.wrong;
        ctl.box.innerHTML = `<h2>錯題本　<span class="small muted">共 ${list.length} 題</span></h2><div class="scroll"></div>` + footKeys('A 查看／複習　B 返回');
        const sc = $('.scroll', ctl.box); const rows = [];
        const r0 = h('div', 'row', list.length ? `<b>✏️ 開始複習（最多 10 題，答對就移出錯題本，每題獎勵 20 ${esc(W.money)}）</b>` : '<span class="muted">目前沒有錯題，太棒了！</span>'); sc.appendChild(r0); rows.push(r0);
        list.forEach(w => { const q = QB.byId(w.id) || w.snap; const r = h('div', 'row', `${chip(q.cat)}<span class="grow ellip">${esc(q.q.replace(/\n/g, ' '))}</span><span class="small muted">錯 ${w.n} 次</span>`); sc.appendChild(r); rows.push(r); });
        listNav(ctl, rows, { onBack: () => ctl.done(), onPick: async i => {
          if (i === 0) { if (!list.length) return; await WrongBook.review(); render(); return; }
          const w = list[i - 1], q = QB.byId(w.id) || w.snap;
          await UI.panel(c2 => { c2.box.innerHTML = `<h2>${chip(q.cat)} 題目解析</h2><div class="scroll"><div style="font-weight:700;white-space:pre-wrap">${esc(q.q)}</div>
            ${q.opts ? `<div class="small" style="margin:${U(2)} 0">${q.opts.map((o, k) => `${'ABCD'[k]}. ${esc(o)}`).join('　')}</div>` : ''}
            <div style="margin:${U(2)} 0">✅ 正確答案：<b>${esc(answerText(q))}</b></div><div class="small muted">你上次的答案：${esc(w.last || '－')}</div>
            ${q.exp ? `<div class="qexp" style="margin-top:${U(3)}">💡 ${esc(q.exp)}</div>` : ''}</div>` + footKeys('B 返回'); closeOnAB(c2); });
        } });
      };
      render();
    });
  },
  async review() {
    const batch = G.wrong.slice(0, 10); let right = 0;
    for (const w of batch) { const q = QB.byId(w.id) || w.snap; const r = await UI.question(q, { mode: 'review', hint: false }); if (r.correct) { right++; G.wrong = G.wrong.filter(x => x.id !== w.id); G.money += 20; } }
    Sound.sfx('badge'); await say(`複習結束！答對 ${right} / ${batch.length} 題，獲得 ${right * 20} ${W.money}。`); autosave();
  },
};
const answerText = q => q.type === 'choice' ? q.opts[q.ans] : q.type === 'tf' ? (q.ans ? '○ 正確' : '✕ 錯誤') : q.type === 'fill' ? q.ans.join(' / ') : q.parts.join('');

/* ---------- 學習紀錄 ---------- */
function catRows(stats) {
  const cats = ALL_CATS.concat(Object.keys(stats).filter(c => !CATS[c]));
  return cats.map(c => { const s = stats[c] || { r: 0, t: 0 }; const pct = s.t ? Math.round(s.r / s.t * 100) : 0;
    return `<div class="catrow">${chip(c)}<div class="bar"><i style="width:${pct}%;background:${catColor(c)}"></i></div><span class="small">${s.t ? pct + '%' : '－'}　${s.r}/${s.t}</span></div>`; }).join('');
}
function weakestCat(stats) { return Object.keys(stats).filter(c => stats[c].t >= 3 && stats[c].r / stats[c].t < 0.8).sort((a, b) => stats[a].r / stats[a].t - stats[b].r / stats[b].t)[0]; }
const Records = {
  open() {
    return UI.panel(ctl => {
      const T = totals(G), wk = weakestCat(G.stats);
      ctl.box.innerHTML = `<h2>學習紀錄</h2><div class="scroll"><div style="margin-bottom:${U(2)}">總答題 <b>${T.t}</b>　答對率 <b>${T.pct}%</b>　最高連對 <b>${G.bestStreak || 0}</b>　錯題 <b>${G.wrong.length}</b></div>
        ${catRows(G.stats)}${wk ? `<div class="small" style="margin-top:${U(2)}">📌 建議加強：${chip(wk)}　可以換用擅長這類題型的武器多練習，或到錯題本複習！</div>` : ''}</div>` + footKeys('B 返回');
      closeOnAB(ctl);
    });
  },
};

/* ---------- 設定 ---------- */
const SettingsPanel = {
  open() {
    return UI.panel(ctl => {
      const F = [{ k: 'music', label: '音樂音量' }, { k: 'sfx', label: '音效音量' }, { k: 'speed', label: '文字速度' }, { k: 'hud', label: '地圖狀態列' }, { k: 'help', label: '遊戲說明' }];
      ctl.box.innerHTML = `<h2>設定</h2><div class="fields"></div>` + footKeys('↑↓ 選擇　←→ 調整　B 返回');
      const wrap = $('.fields', ctl.box); const els = F.map(() => { const d = h('div', 'field'); wrap.appendChild(d); return d; });
      let sel = 0;
      const val = k => k === 'help' ? '<span class="muted">按 A 查看</span>' : k === 'speed' ? ['慢', '中', '快'][Settings.speed] : k === 'hud' ? (Settings.hud ? '顯示' : '隱藏') : '■'.repeat(Settings[k]) + '<span class="muted">' + '□'.repeat(10 - Settings[k]) + '</span>';
      const paint = () => F.forEach((f, i) => { els[i].classList.toggle('sel', i === sel); els[i].innerHTML = `<label>${f.label}</label><div class="val"><span class="arrow">◀</span>${val(f.k)}<span class="arrow">▶</span></div>`; });
      const change = (k, d) => { if (k === 'help') return; if (k === 'speed') Settings.speed = clamp(Settings.speed + d, 0, 2); else if (k === 'hud') Settings.hud = !Settings.hud; else Settings[k] = clamp(Settings[k] + d, 0, 10); Sound.applyVol(); saveSettings(); Sound.sfx('cursor'); paint(); };
      els.forEach((d, i) => d.addEventListener('pointerdown', e => { e.preventDefault(); sel = i; if (F[i].k === 'help') { Help.open(); return; } change(F[i].k, e.target === d.querySelector('.arrow') ? -1 : 1); }));
      ctl.update = () => { const d = Input.dir(); if (d === 'up' && sel > 0) { sel--; paint(); } if (d === 'down' && sel < F.length - 1) { sel++; paint(); } if (d === 'left' || d === 'right') change(F[sel].k, d === 'left' ? -1 : 1);
        if (Input.p('A') && F[sel].k === 'help') { Sound.sfx('ok'); Help.open(); return; } if (Input.p('B') || Input.p('A')) { Sound.sfx('back'); ctl.done(); } };
      paint();
    });
  },
};

/* ============ 世界觀選擇、角色生成 ============ */
const HAIRS = ['#2a2228', '#5a3a24', '#a86a38', '#d8b060', '#7a3a58', '#3a4a7a'];
const CLOTHES = { school: ['#f8f8f8', '#e8f0ff', '#fff4e0', '#f0f0f0'], literati: ['#88a0c8', '#a8c8a0', '#d8a8b8', '#e8e0c8', '#8a7ab0'], wuxia: ['#a84040', '#3a5a8a', '#3a7a4a', '#303038', '#e8e0d0'] };
const CLOTH2 = { school: ['#3a58a0', '#2e6a4a', '#8a3040', '#404048'], literati: ['#384870', '#4a6a40', '#8a4058', '#8a7040', '#4a3a6a'], wuxia: ['#e0c050', '#c8c8d8', '#d8a040', '#c83838', '#6a4a2a'] };
const CharCreate = {
  open(wid, preset) {
    const Wd = WORLDS[wid];
    const genName = () => pick(Wd.surnames) + pick(Wd.given);
    const st = { name: preset ? preset.name : genName(), gender: preset ? (preset.look.gender || 'm') : pick(['m', 'f']), hair: rnd(0, HAIRS.length - 1), cloth: 0, cloth2: 0, title: Wd.genTitle() };
    if (preset) { const hi = HAIRS.indexOf(preset.look.hair); if (hi >= 0) st.hair = hi; }
    const look = () => ({ style: Wd.style, gender: st.gender, hair: HAIRS[st.hair], cloth: CLOTHES[Wd.style][st.cloth], cloth2: CLOTH2[Wd.style][st.cloth2], skin: '#f8d0a8' });
    return UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>${preset ? '轉生．' : '建立角色．'}${Wd.icon} ${esc(Wd.name)}</h2><div class="cc"><div class="preview"></div><div class="fields"></div></div>` + footKeys('↑↓ 選項目　←→ 變更（名號可重新生成）　A 確認　B 返回');
      const pv = $('.preview', ctl.box), fields = $('.fields', ctl.box);
      const F = [{ k: 'name', label: '名字' }, { k: 'gender', label: '性別' }, { k: 'hair', label: '髮色' }, { k: 'cloth', label: '衣服' }, { k: 'cloth2', label: '配色' }, { k: 'title', label: Wd.titleLabel }, { k: 'rand' }, { k: 'go' }];
      const els = F.map(() => { const d = h('div', 'field'); fields.appendChild(d); return d; });
      let sel = 0, spin = 0, inp;
      const renderPreview = () => { pv.innerHTML = ''; pv.appendChild(GFX.el(GFX.person(look(), ['down', 'left', 'up', 'right'][spin % 4], 0), 4)); };
      const sw = c => `<span class="swatch" style="background:${c}"></span>`;
      const renderFields = () => F.forEach((f, i) => {
        const d = els[i]; d.classList.toggle('sel', i === sel);
        if (f.k === 'name') { if (!inp) { d.innerHTML = `<label>名字</label><div class="val"></div>`; inp = h('input'); inp.maxLength = 8; inp.value = st.name; $('.val', d).appendChild(inp);
          inp.addEventListener('input', () => st.name = inp.value); inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); inp.blur(); } if (e.key === 'Escape') inp.blur(); e.stopPropagation(); }); }
          else if (document.activeElement !== inp) inp.value = st.name; return; }
        if (f.k === 'rand') { d.innerHTML = `<span class="btn alt">🎲 隨機生成角色</span>`; return; }
        if (f.k === 'go') { d.innerHTML = `<span class="btn">▶ ${preset ? '轉生！' : '開始冒險！'}</span>`; return; }
        let v = f.k === 'gender' ? (st.gender === 'm' ? '男生' : '女生') : f.k === 'hair' ? sw(HAIRS[st.hair]) : f.k === 'cloth' ? sw(CLOTHES[Wd.style][st.cloth]) : f.k === 'cloth2' ? sw(CLOTH2[Wd.style][st.cloth2]) : `<span class="small">${esc(st.title)}</span>`;
        d.innerHTML = `<label>${esc(f.label)}</label><div class="val"><span class="arrow">◀</span>${v}<span class="arrow">▶</span></div>`;
      });
      const change = (k, dl) => {
        if (k === 'gender') st.gender = st.gender === 'm' ? 'f' : 'm';
        if (k === 'hair') st.hair = (st.hair + dl + HAIRS.length) % HAIRS.length;
        if (k === 'cloth') st.cloth = (st.cloth + dl + CLOTHES[Wd.style].length) % CLOTHES[Wd.style].length;
        if (k === 'cloth2') st.cloth2 = (st.cloth2 + dl + CLOTH2[Wd.style].length) % CLOTH2[Wd.style].length;
        if (k === 'title') st.title = Wd.genTitle();
        Sound.sfx('cursor'); renderFields(); renderPreview();
      };
      const randomize = () => { if (!preset) st.name = genName(); st.gender = pick(['m', 'f']); st.hair = rnd(0, HAIRS.length - 1); st.cloth = rnd(0, CLOTHES[Wd.style].length - 1); st.cloth2 = rnd(0, CLOTH2[Wd.style].length - 1); st.title = Wd.genTitle(); Sound.sfx('ok'); renderFields(); renderPreview(); };
      const go = async () => { st.name = (st.name || '').trim(); if (!st.name) { Sound.sfx('bump'); sel = 0; renderFields(); inp.focus(); return; }
        if (await UI.yesno(`「${st.name}」，${st.title}。\n確定用這個角色${preset ? '轉生' : '展開冒險'}嗎？`)) ctl.done({ name: st.name, title: st.title, look: look() }); };
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

/* ============ 章節結算、結局、成績單 ============ */
const ChapterEnd = {
  async play() {
    const c = (G.chStats || {})[G.chapter] || { r: 0, t: 0 };
    Sound.play('victory');
    await UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>🏮 ${esc(W.chapterName)}　完成！</h2><div class="scroll result">
        <div class="bigstat"><div><b>${c.t}</b><span>本章答題</span></div><div><b>${c.t ? Math.round(c.r / c.t * 100) : 0}%</b><span>答對率</span></div><div><b>Lv.${G.lv}</b><span>目前等級</span></div><div><b>${G.weapons.length}</b><span>擁有武器</span></div></div>
        <div style="margin-top:${U(3)}">取得徽章：${G.badges.map(b => `<span class="seal">${esc(b)}</span>`).join(' ')}</div>
        <div class="small muted" style="margin-top:${U(2)}">進度已自動儲存。</div></div>` + footKeys('A 繼續');
      closeOnAB(ctl);
    });
    autosave();
    await Guardian.grant();
    await say('（試玩版的內容到這裡結束，接下來會播放通關畫面。）');
    await Ending.play();
  },
};
/* 守護神器：正式版在主線結局取得；試玩版於第一章結尾示範 */
const Guardian = {
  async grant() {
    const route = G.route || 'a'; const a = W.guardians[route];
    if (G.weapons.some(w => w.arch === a)) return;
    await say(`（試玩版示範：正式版中，守護神器會在主線結局、打倒最終魔王後取得。你選擇了「${W.routeNames[route]}」，所以會得到這一件。）`);
    Sound.sfx('badge'); s_flash();
    const w = newWeapon(a, 6); G.weapons.push(w); Meta.seeWeapon(G.world, a, 6);
    await say(`${G.player.name} 得到了守護神器「${weaponName(a)}」！`);
    await say(`特殊能力「${PASSIVES[ARCH[a].passive].name}」：${PASSIVES[ARCH[a].passive].desc}\n（放進攜帶欄就會生效）`);
    if (G.equip.length < 3) G.equip.push(w.id); autosave();
  },
};
function s_flash() { const fx = $('#fx'); fx.classList.add('white'); fx.style.opacity = 0.9; Anim.run(0.6, k => fx.style.opacity = 0.9 * (1 - k)).then(() => fx.classList.remove('white')); }
function rankTitle(p) { return p >= 90 ? '文曲下凡' : p >= 80 ? '博學鴻儒' : p >= 65 ? '飽讀詩書' : p >= 50 ? '勤學書生' : '初出茅廬'; }
const Ending = {
  async play() {
    Sound.play('ending');
    for (const t of W.ending) await say(t);
    if (G.route) await say(W.routeEnd[G.route]);
    await Credits.play();
    const first = !G.flags.cleared; G.flags.cleared = true;
    const T = totals(G);
    const rep = { world: G.world, name: G.player.name, title: rankTitle(T.pct), pct: T.pct, total: T.t, time: G.time, lv: G.lv, ng: G.ng || 0, at: Date.now() };
    if (first) { Meta.clear(G.world); Meta.addReport(rep); }
    autosave();
    await Report.open(G);
    const k = await UI.ask('接下來要做什麼呢？', ['轉生到其他世界（保留能力）', '重新開始（全新冒險）', '返回標題畫面', '留在這個世界繼續探索'], { pos: { right: U(2), bottom: U(50) }, cancel: false });
    if (k === 0) { Game.scene = 'blank'; Flow.rebirth(G.slot); }
    else if (k === 1) { Game.scene = 'blank'; Flow.newGame(G.slot); }
    else if (k === 2) { Game.scene = 'blank'; titleScreen(); }
    else Sound.play(W.music[OW.L.music]);
  },
};
const Credits = {
  play() {
    return UI.panel(ctl => {
      ctl.box.classList.add('credits');
      ctl.box.innerHTML = `<div class="roll"><h2>詞靈冒險．翡翠之卷</h2><p>試玩版</p><p><b>企劃</b><br>國文科教師</p><p><b>程式・像素美術・音樂</b><br>Claude</p><p><b>國文內容</b><br>國中國文課程</p><p><b>感謝遊玩</b></p></div>` + footKeys('A 跳過');
      const roll = $('.roll', ctl.box); let y = 0; const t0 = performance.now();
      ctl.update = () => { y = (performance.now() - t0) / 40; roll.style.transform = `translateY(${-y}px)`; if (Input.p('A') || Input.p('B') || y > roll.offsetHeight + 40) ctl.done(); };
    });
  },
};
const Report = {
  open(g) {
    const Wd = WORLDS[g.world], T = totals(g), wk = weakestCat(g.stats);
    const top = g.wrong.slice().sort((a, b) => b.n - a.n).slice(0, 5).map(w => QB.byId(w.id) || w.snap);
    return UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>📜 冒險成績單</h2><div class="scroll report">
        <div class="rp-head"><div class="pv"></div><div class="grow"><b style="font-size:1.2em">${esc(g.player.name)}</b>　<span class="seal big">${rankTitle(T.pct)}</span>
          <div class="small">${Wd.icon} ${esc(Wd.name)}${g.ng ? `．轉生 ${g.ng} 次` : ''}．Lv.${g.lv}．遊玩 ${fmtTime(g.time)}</div>
          <div class="small">總答題 <b>${T.t}</b>．答對率 <b>${T.pct}%</b>．最高連對 <b>${g.bestStreak || 0}</b></div></div></div>
        <div class="qsec">各題型答對率</div>${catRows(g.stats)}
        <div class="qsec">各章答對率</div>${Object.entries(g.chStats || {}).map(([ch, c]) => `<div class="small">第 ${ch} 章：${c.t ? Math.round(c.r / c.t * 100) : 0}%（${c.r}/${c.t}）</div>`).join('') || '<div class="small muted">－</div>'}
        <div class="qsec">最常答錯的題目</div>${top.length ? top.map(q => `<div class="small wrongitem">${chip(q.cat)}${esc(q.q.replace(/\n/g, ' ').slice(0, 40))}<br><span class="muted">答案：${esc(answerText(q))}</span></div>`).join('') : '<div class="small muted">沒有錯題，太厲害了！</div>'}
        ${wk ? `<div class="small" style="margin-top:${U(2)}">📌 建議加強：${chip(wk)}</div>` : ''}
        </div><div class="btnrow"><span class="btn dl">⬇ 下載成績單圖片</span></div>` + footKeys('↑↓ 捲動　A 繼續　（可下載圖片交給老師）');
      $('.pv', ctl.box).appendChild(GFX.el(GFX.person(g.player.look, 'down', 0), 3));
      $('.dl', ctl.box).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Report.image(g); });
      const sc = $('.scroll', ctl.box);
      ctl.update = () => { const d = Input.dir(); if (d === 'down') sc.scrollTop += 40; if (d === 'up') sc.scrollTop -= 40; if (Input.p('A') || Input.p('B')) { Sound.sfx('ok'); ctl.done(); } };
    });
  },
  image(g) {
    const Wd = WORLDS[g.world], T = totals(g), W0 = 720, cats = ALL_CATS;
    const top = g.wrong.slice().sort((a, b) => b.n - a.n).slice(0, 5).map(w => QB.byId(w.id) || w.snap);
    const H = 560 + cats.length * 34 + top.length * 58;
    const cv = document.createElement('canvas'); cv.width = W0; cv.height = H; const c = cv.getContext('2d');
    const F = (s, w = 400) => `${w} ${s}px "PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif`;
    c.fillStyle = '#f6efdc'; c.fillRect(0, 0, W0, H); c.strokeStyle = '#3a2a1a'; c.lineWidth = 6; c.strokeRect(14, 14, W0 - 28, H - 28); c.lineWidth = 1.5; c.strokeRect(26, 26, W0 - 52, H - 52);
    c.fillStyle = '#2a2018'; c.font = F(40, 900); c.textAlign = 'center'; c.fillText('詞靈冒險．冒險成績單', W0 / 2, 90);
    c.font = F(20); c.fillStyle = '#6a5a48'; c.fillText(`${Wd.name}${g.ng ? `．轉生 ${g.ng} 次` : ''}　${new Date().toLocaleDateString('zh-TW')}`, W0 / 2, 124);
    const pimg = GFX.person(g.player.look, 'down', 0); c.imageSmoothingEnabled = false; c.drawImage(pimg, 60, 150, 96, 96);
    c.textAlign = 'left'; c.fillStyle = '#2a2018'; c.font = F(34, 900); c.fillText(g.player.name, 180, 190);
    c.font = F(18); c.fillStyle = '#6a5a48'; c.fillText(g.player.title, 180, 220);
    c.fillStyle = '#b8322a'; c.fillRect(W0 - 230, 160, 170, 64); c.fillStyle = '#fff4e0'; c.font = F(30, 900); c.textAlign = 'center'; c.fillText(rankTitle(T.pct), W0 - 145, 204);
    c.textAlign = 'left'; c.fillStyle = '#2a2018'; c.font = F(22);
    const stats = [['總答題', T.t + ' 題'], ['答對率', T.pct + '%'], ['最高連對', (g.bestStreak || 0) + ' 題'], ['遊玩時間', fmtTime(g.time)]];
    stats.forEach(([k, v], i) => { const x = 60 + i * 158; c.fillStyle = '#8a7a64'; c.font = F(16); c.fillText(k, x, 290); c.fillStyle = '#2a2018'; c.font = F(26, 700); c.fillText(v, x, 324); });
    let y = 380; c.fillStyle = '#2a2018'; c.font = F(22, 700); c.fillText('各題型答對率', 60, y); y += 20;
    cats.forEach(cat => { const s = g.stats[cat] || { r: 0, t: 0 }, p = s.t ? s.r / s.t : 0; y += 34;
      c.fillStyle = catColor(cat); c.fillRect(60, y - 20, 56, 26); c.fillStyle = '#fff'; c.font = F(16, 700); c.fillText(cat, 72, y - 1);
      c.fillStyle = '#e4dcc8'; c.fillRect(130, y - 16, 400, 18); c.fillStyle = catColor(cat); c.fillRect(130, y - 16, 400 * p, 18);
      c.fillStyle = '#2a2018'; c.font = F(16); c.fillText(s.t ? `${Math.round(p * 100)}%（${s.r}/${s.t}）` : '－', 545, y - 1); });
    y += 60; c.font = F(22, 700); c.fillText('最常答錯的題目', 60, y);
    if (!top.length) { y += 36; c.font = F(18); c.fillText('沒有錯題！', 60, y); }
    top.forEach(q => { y += 34; c.font = F(17, 700); c.fillStyle = catColor(q.cat); c.fillText(`【${q.cat}】`, 60, y); c.fillStyle = '#2a2018'; c.fillText(q.q.replace(/\n/g, ' ').slice(0, 30) + (q.q.length > 30 ? '…' : ''), 130, y);
      y += 24; c.font = F(16); c.fillStyle = '#6a5a48'; c.fillText('答案：' + answerText(q).slice(0, 34), 130, y); });
    cv.toBlob(b => download(`詞靈冒險成績單_${g.player.name}.png`, b));
  },
};

/* ============ 教師設定 ============ */
const Teacher = {
  open() {
    return UI.panel(ctl => {
      const box = ctl.box; box.classList.add('teacher');
      const render = () => {
        const cats = QB.cats(); const lessons = QB.lessons();
        box.innerHTML = `<h2>👩‍🏫 教師設定．題庫管理</h2><div class="grid2">
          <div class="col"><div><b>目前題庫：</b>${QB.source === 'custom' ? '自訂題庫' : '示範題庫'}，共 ${QB.all.length} 題（啟用 ${QB.active().length} 題）</div>
            <div class="catwrap">${ALL_CATS.concat(Object.keys(cats).filter(c => !CATS[c])).map(c => `<span>${chip(c)}${cats[c] || 0}</span>`).join('')}</div>
            <div class="btns"><button class="btn" data-a="imp">📥 匯入（取代）</button><button class="btn alt" data-a="add">➕ 匯入（附加）</button></div>
            <div class="btns"><button class="btn alt" data-a="tpl">📄 下載 CSV 範本</button><button class="btn alt" data-a="exp">📤 匯出目前題庫</button></div>
            <div class="btns"><button class="btn warn" data-a="reset">還原示範題庫</button></div>
            <div><b>雲端存檔網址</b>　<span class="small ${Cloud.enabled ? 'good' : 'muted'}">${Cloud.enabled ? '已設定' : '未設定（只存在本機）'}</span></div>
            <div class="btns"><button class="btn alt" data-a="cloud">設定網址（本機）</button><button class="btn alt" data-a="cloudtest">測試連線</button></div>
            <div class="muted small msg"></div></div>
          <div class="col"><div><b>課次篩選</b>（取消勾選即不出該課題目）</div><div class="scroll">${lessons.map(([l, n], i) => `<label class="chk"><input type="checkbox" data-l="${i}" ${QB.off.has(l) ? '' : 'checked'}>${esc(l)}<span class="muted">（${n}）</span></label>`).join('')}</div>
            <div class="small muted">支援 CSV（Excel／Google 試算表另存 CSV）與 JSON。</div></div></div>` + footKeys('B 返回標題（本頁請用滑鼠操作）');
        box.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', () => { const l = lessons[+cb.dataset.l][0]; if (cb.checked) QB.off.delete(l); else QB.off.add(l); if (!QB.active().length) { QB.off.delete(l); cb.checked = true; alert('至少要保留一個課次喔！'); } QB.saveOff(); render(); }));
        box.querySelectorAll('button[data-a]').forEach(b => b.addEventListener('click', () => action(b.dataset.a)));
      };
      const note = t => { const m = $('.msg', box); if (m) m.textContent = t; };
      const action = async a => {
        if (a === 'imp' || a === 'add') { const f = await pickFile('.csv,.json,.txt,.tsv'); if (!f) return;
          try { let list, errs = [];
            if (/\.json$/i.test(f.name) || /^\s*[\[{]/.test(f.text)) { const j = JSON.parse(f.text); list = Array.isArray(j) ? j : (j.questions || []); } else ({ list, errs } = csvToQuestions(f.text));
            if (!list.length) throw new Error('沒有讀到任何題目'); QB.setBank(list, a === 'add' ? 'append' : 'replace'); render();
            note(`✅ 成功匯入 ${list.length} 題。${errs.length ? '略過 ' + errs.length + ' 題：' + errs.slice(0, 3).join('；') : ''}`);
          } catch (e) { note('❌ 匯入失敗：' + e.message); } }
        if (a === 'tpl') download('詞靈冒險_題庫範本.csv', questionsToCSV(QUESTIONS_SAMPLE.slice(0, 6).map(normalizeQ).concat(QUESTIONS_SAMPLE.filter(q => q.type && q.type !== 'choice').map(normalizeQ))), 'text/csv;charset=utf-8');
        if (a === 'exp') download('詞靈冒險_目前題庫.csv', questionsToCSV(QB.all), 'text/csv;charset=utf-8');
        if (a === 'reset' && confirm('確定要還原成示範題庫嗎？自訂題庫會被清除。')) { QB.reset(); render(); note('已還原示範題庫。'); }
        if (a === 'cloud') { const u = prompt('貼上 Apps Script 部署網址（留空＝取消本機設定，改用 config.js）：', Store.get('ciling_cloud_url', '') || ''); if (u !== null) { if (u.trim()) Store.set('ciling_cloud_url', u.trim()); else Store.del('ciling_cloud_url'); render(); note('已更新。要讓全班都使用，請把網址寫進 js/config.js。'); } }
        if (a === 'cloudtest') { if (!Cloud.enabled) { note('尚未設定雲端網址。'); return; } note('連線中……'); try { const r = await fetch(Cloud.url()); const j = await r.json(); note(j.ok ? '✅ 連線成功：' + (j.msg || '') : '❌ ' + j.error); } catch (e) { note('❌ 連線失敗：' + e.message); } }
      };
      render(); ctl.update = () => { if (Input.p('B')) { Sound.sfx('back'); ctl.done(); } };
    });
  },
};
const Help = {
  open() {
    return UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>遊戲說明</h2><div class="scroll small" style="line-height:1.7">
        <b>🎮 操作</b>：方向鍵／WASD 移動，Z 或空白鍵＝確認，X 或 Esc＝取消（按住可奔跑），Enter 或 M＝開啟選單。手機可用下方按鍵，也能直接點選畫面。<br>
        <b>⚔ 戰鬥＝答題</b>：武器的每個招式都對應一種國文題型，<b>答對才能命中</b>。<br>
        <b>🛡 防禦題</b>：敵人出招時有機會「出題」，答對就能完全閃避。<br>
        <b>🎯 弱點</b>：每個敵人都有弱點題型，打中弱點傷害兩倍。換上擅長該題型的武器吧！<br>
        <b>✨ 文氣與必殺技</b>：每答對一題累積 1 格文氣，集滿 5 格就能施展必殺技（必定命中）。<br>
        <b>🗡 武器熟練度</b>：用武器答對題目會提升熟練度，升級後學會新招式。最多攜帶 3 件武器。<br>
        <b>⚒ 碎片與鍛造</b>：野生怪物是武器幻化的「武器妖」，打倒後有機會掉落該武器的碎片，集滿 5 片可合成武器；同名同階武器可以升階。<br>
        <b>💎 稀有度</b>：凡品（白）→ 良品（綠）→ 精品（藍）→ 珍品（紫）→ 絕品（金）→ 神品（紅）→ 守護神器（彩，只能由劇情取得）。<br>
        <b>👀 看得見的敵人</b>：敵人在地圖上走動，靠近會追過來；不想打可以繞路。<br>
        <b>💾 存檔</b>：共 3 個欄位，切換地圖、戰鬥後會自動存檔；也能匯出存檔檔案帶到其他電腦。<br>
        <b>📖 錯題本</b>：答錯的題目會自動收錄，隨時可以複習。</div>` + footKeys('B 返回');
      closeOnAB(ctl);
    });
  },
};
const RecordHall = {
  open() {
    return UI.panel(ctl => {
      const d = Meta.d; const all = Object.keys(d.armory).length;
      ctl.box.innerHTML = `<h2>📚 紀錄館</h2><div class="scroll small">
        <div class="qsec">世界通關</div>${WORLD_ORDER.map(w => `<div>${WORLDS[w].icon} ${esc(WORLDS[w].name)}：${d.cleared[w] ? `<b class="good">已通關 ${d.cleared[w]} 次</b>` : '<span class="muted">未通關</span>'}</div>`).join('')}
        <div class="qsec">兵器譜</div><div>三世界合計收集 <b>${all}</b> / ${ARCH_ORDER.length * 3}</div>
        <div class="qsec">歷次成績單</div>${d.reports.length ? d.reports.map(r => `<div>${fmtDate(r.at)}　${esc(r.name)}．${esc(WORLDS[r.world].name)}．<span class="seal">${esc(r.title)}</span>　答對率 ${r.pct}%（${r.total} 題）</div>`).join('') : '<div class="muted">還沒有通關紀錄。</div>'}
        </div>` + footKeys('B 返回'); closeOnAB(ctl);
    });
  },
};
