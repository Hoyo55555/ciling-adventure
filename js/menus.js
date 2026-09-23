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
  d: Object.assign({ cleared: {}, armory: {}, reports: [], dex: {} }, Store.get('ciling_meta', {})),
  save() { Store.set('ciling_meta', this.d); },
  seeMon(key) { if (!this.d.dex) this.d.dex = {}; if (!this.d.dex[key]) { this.d.dex[key] = 1; this.save(); } },
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
const tacticText = T => T.kind === 'guard' ? '這一回合不受傷害' : T.kind === 'buff' ? `${BOND_STAT_NAME[T.stat]} +${Math.round(T.val * 100)}%` : `讓對手${STATUS[T.st].name}／${STATUS[T.alt].name}`;
const bondHearts = w => { const lv = bondLv(w); return `<span style="color:#d0506a">${'♥'.repeat(lv)}${'♡'.repeat(3 - lv)}</span> <span class="muted">${w.bond || 0}</span>`; };
const bondText = w => { const lv = bondLv(w), nx = BOND_STEPS[lv]; return lv ? `（迴避機率 ${Math.round(BOND_DODGE[lv] * 100)}%${nx ? `，再 ${nx - (w.bond || 0)} 場升級` : '，已滿級'}）` : `（再 ${BOND_STEPS[0] - (w.bond || 0)} 場戰鬥可解鎖迴避）`; };
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
      const opts = ['角色', '武器', '鍛造', '道具', '兵器譜', '妖怪圖鑑', '稱號', '任務', '錯題本', '學習紀錄', '存檔', '設定'].concat(Cloud.user ? ['登出'] : [], ['回到主畫面', '關閉']);
      const i = await UI.choose(opts, { pos: {}, cls: 'bookmenu', start: sel });
      const L = opts[i]; if (i < 0 || L === '關閉') return; sel = i;
      if (L === '角色') await CharPanel.open();
      if (L === '武器') await WeaponMenu.open();
      if (L === '鍛造') await Forge.open();
      if (L === '道具') await Bag.open({});
      if (L === '兵器譜') await Armory.open();
      if (L === '妖怪圖鑑') await MonDex.open();
      if (L === '稱號') await TitleMenu.open();
      if (L === '任務') await Quests.open();
      if (L === '錯題本') await WrongBook.open();
      if (L === '學習紀錄') await Records.open();
      if (L === '存檔') { autosave(); Sound.sfx('badge'); await say(`已儲存到欄位 ${G.slot}！（${fmtDate(G.savedAt)}）`); }
      if (L === '設定') await SettingsPanel.open();
      if (L === '登出') { if (await Cloud.logoutFlow()) { await fade(1, 0.3); titleScreen(); await fade(0, 0.3); return; } }
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
        <div>${W.story ? W.fragName + ` ${G.badges.length} / 5` : '徽章'}　${G.badges.length ? G.badges.map(b => `<span class="seal">${esc(b.replace('准考證碎片', '碎片'))}</span>`).join(' ') : '<span class="muted">尚未取得</span>'}</div>
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
          r.insertAdjacentHTML('beforeend', `<div class="grow"><b class="rtxt r${w.r}">${esc(weaponName(w))}</b> ${rarChip(w.r)} <span class="small">Lv.${lv}</span> ${elChip(elOfCats(ARCH[w.arch].cats))}${catChips(w.arch)}
            <div class="small muted">熟練度 ${w.mastery}${next != null ? ' / ' + next : '（已滿級）'}　${raceChip(ARCH[w.arch].race)}親密度 ${bondHearts(w)}${passiveList(w.arch).length ? `．<b style="color:#b8322a">能力「${passiveList(w.arch).map(p => PASSIVES[p].name).join('」「')}」</b>` : ''}${w.affix ? `<br><span class="affix ${AFFIX[w.affix.k].good ? '' : 'bad'}">${AFFIX[w.affix.k].good ? '✦' : '✧'} ${AFFIX[w.affix.k].name} ${Math.round(w.affix.rate * 100)}%</span>` : ''}</div></div>
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
        <div style="margin-bottom:${U(2)}">${ARCH[a].race ? `${raceChip(ARCH[a].race)}<span class="muted">族．剋 ${esc(RACE_KE[ARCH[a].race])}族、被 ${esc(RACE_KE_BY[ARCH[a].race])}族所剋</span>` : '<span class="muted">無種族．不受種族相剋影響</span>'}　親密度 ${bondHearts(w)} <span class="muted">${bondText(w)}</span></div>
        ${w.affix ? `<div class="bonus"><span class="affix ${AFFIX[w.affix.k].good ? '' : 'bad'}">${AFFIX[w.affix.k].good ? '✦ 附加效果' : '✧ 附加效果（負面）'}：${AFFIX[w.affix.k].name}</span>——${esc(AFFIX[w.affix.k].desc)}（觸發機率 ${Math.round(w.affix.rate * 100)}%）</div>` : ''}
        ${w.r ? `<div class="bonus">★ 稀有度效果：${bonusList(w.r).join('；')}${passiveList(a).length ? `；守護能力「${passiveList(a).map(p => PASSIVES[p].name).join('」「')}」` : ''}</div>` : '<div class="small muted">凡品武器沒有稀有度效果，升階後會獲得。</div>'}
        ${ARCH[a].skills.map(([n, c, p], i) => { const open = i < lv + 1, el = elOfCats(c); return `<div class="row" style="padding:${U(1)} ${U(2)}"><b class="grow">${open ? esc(n) : '？？？'}</b>${open ? elChip(el) + (el ? `<span class="small muted">剋${KE[el]}</span>` : '') + c.slice(0, 2).map(chip).join('') + `　威力 ${Math.round(p * mul)}` : `<span class="muted">武器 Lv.${i} 解鎖（熟練度 ${MASTERY_STEPS[i - 1]}）</span>`}</div>`; }).join('')}
        ${ARCH[a].tactic ? `<div class="row" style="padding:${U(1)} ${U(2)}"><b class="grow">${lv >= 2 ? '◆ ' + esc(ARCH[a].tactic.name) : '？？？'}</b><span class="muted">${lv >= 2 ? '戰術．' + tacticText(ARCH[a].tactic) : '武器 Lv.2 解鎖戰術招式'}</span></div>` : ''}
        <div class="row" style="padding:${U(1)} ${U(2)}"><b class="grow">★ ${esc(ARCH[a].ult)}</b><span class="muted">必殺技．文氣 5 格</span></div>
        <div class="muted" style="margin-top:${U(2)}">用這件武器答對題目，熟練度 +1；屬性剋制 +2。　五行：金剋木、木剋土、土剋水、水剋火、火剋金<br>種族相剋：筆剋紙、紙剋器、器剋音、音剋兵、兵剋筆。種族與五行同時剋制時，傷害再 ×${DOUBLE_BONUS}。<br>每打完一場戰鬥，使用過的武器親密度 +1；達到 ${BOND_STEPS.join('、')} 分會提升等級，敵人攻擊時有機會讓你答題閃避。<br>親密度滿級（三級）時，這件武器還會讓你的<b>${BOND_STAT_NAME[bondStatOf(w)]}</b>提升 ${Math.round(BOND_MAX_BONUS * 100)}%。</div></div></div>` + footKeys('B 返回');
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
        ctl.box.innerHTML = `<h2>⚒ 鍛造</h2><div class="scroll"></div>` + footKeys(`A 合成　B 返回　｜碎片 ${FRAG_N} 片 → 凡品武器（${Math.round(AFFIX_RATE * 100)}% 機率附帶效果）；同名同階武器 → 升一階，附加效果會保留`);
        const sc = $('.scroll', ctl.box);
        sc.insertAdjacentHTML('beforeend', '<div class="qsec">碎片合成</div>');
        const fr = ARCH_ORDER.filter(a => (G.frags[a] || 0) > 0);
        if (!fr.length) sc.insertAdjacentHTML('beforeend', `<div class="small muted">還沒有碎片。打倒${esc(W.monsters.brush)}等武器妖，有機會掉落碎片。</div>`);
        for (const a of fr) { const n = G.frags[a], ok = n >= FRAG_N; const r = h('div', 'row' + (ok ? '' : ' dis')); r.appendChild(wIcon(a, 0));
          r.insertAdjacentHTML('beforeend', `<div class="grow"><b>${esc(weaponName(a))}碎片</b>　${n} / ${FRAG_N}<div class="small muted">${ok ? '可以合成一件凡品「' + esc(weaponName(a)) + '」' : '還差 ' + (FRAG_N - n) + ' 片'}</div></div>`);
          sc.appendChild(r); acts.push({ r, ok, run: () => { G.frags[a] -= FRAG_N; const w = giveWeapon(a, 0); w.affix = rollAffix();
            return `合成成功！得到了「${weaponName(w)}」（凡品）！${w.affix ? `\n${AFFIX[w.affix.k].good ? '✦ 附加效果' : '✧ 附加效果（負面）'}：${AFFIX[w.affix.k].name}——${AFFIX[w.affix.k].desc}（機率 ${Math.round(w.affix.rate * 100)}%）` : ''}`; } }); }
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
            nw.bond = Math.max(...use.map(x => x.bond || 0));
            nw.affix = mergeAffix(use) || rollAffix();
            const curId = G.equip[G.cur]; let slot = -1;
            for (const x of use) { const i = G.equip.indexOf(x.id); if (i >= 0) { if (slot < 0) slot = i; G.equip.splice(i, 1); } G.weapons.splice(G.weapons.indexOf(x), 1); }
            G.weapons.push(nw); Meta.seeWeapon(G.world, a, nw.r);
            if (slot >= 0) G.equip.splice(slot, 0, nw.id); else if (G.equip.length < 3) G.equip.push(nw.id);
            G.cur = Math.max(0, G.equip.indexOf(use.some(x => x.id === curId) ? nw.id : curId)); playerStats();
            const fxN = use.filter(x => x.affix).length;
            return `升階成功！得到了${RARITY[nw.r].n}「${weaponName(nw)}」！${nw.affix ? `\n${AFFIX[nw.affix.k].good ? '✦' : '✧'} 附加效果「${AFFIX[nw.affix.k].name}」：${AFFIX[nw.affix.k].desc}（機率 ${Math.round(nw.affix.rate * 100)}%）${fxN > 1 ? `\n（合併了 ${fxN} 件帶效果的武器，只保留一個效果，但觸發機率提高了！）` : ''}` : ''}`; } }); }
        sc.insertAdjacentHTML('beforeend', `<div class="qsec">洗鍊（重抽附加效果）</div><div class="small muted">花 ${REFINE_COST} ${esc(W.money)} 重抽一件武器的附加效果，可能變好也可能變差，也可能什麼都沒有。</div>`);
        for (const w of G.weapons) {
          if (ARCH[w.arch].guardian) continue;
          const ok = G.money >= REFINE_COST; const r = h('div', 'row' + (ok ? '' : ' dis'));
          r.appendChild(wIcon(w.arch, w.r));
          r.insertAdjacentHTML('beforeend', `<div class="grow"><b>${esc(weaponName(w))}</b> ${rarChip(w.r)}<div class="small muted">${w.affix ? `目前：<span class="affix ${AFFIX[w.affix.k].good ? '' : 'bad'}">${AFFIX[w.affix.k].name} ${Math.round(w.affix.rate * 100)}%</span>` : '目前沒有附加效果'}</div></div><span class="small">${REFINE_COST}</span>`);
          sc.appendChild(r);
          acts.push({ r, ok, run: async () => {
            if (!(await UI.yesno(`要花 ${REFINE_COST} ${W.money} 洗鍊「${weaponName(w)}」嗎？${w.affix ? '\n（現在的「' + AFFIX[w.affix.k].name + '」會被覆蓋）' : ''}`))) return null;
            G.money -= REFINE_COST;
            const old = w.affix;
            w.affix = rollAffix() || (Math.random() < 0.4 ? { k: pick(AFFIX_GOOD), rate: AFFIX_BASE } : null);
            if (w.affix && old && old.k === w.affix.k) w.affix.rate = Math.min(AFFIX_MAX, old.rate + AFFIX_STEP);
            playerStats();
            return w.affix ? `洗鍊完成！「${weaponName(w)}」現在帶有${AFFIX[w.affix.k].good ? '' : '（負面）'}「${AFFIX[w.affix.k].name}」——${AFFIX[w.affix.k].desc}（機率 ${Math.round(w.affix.rate * 100)}%）` : `洗鍊完成……這次什麼效果都沒有附上。`;
          } });
        }
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
        c.insertAdjacentHTML('beforeend', `<h3>${esc(weaponName(a))}</h3><div class="desc">${esc(weaponDesc(a))}</div><div class="desc"><b>擅長：</b>${catChips(a)} ${elChip(elOfCats(ARCH[a].cats))}</div><div class="desc"><b>招式：</b>${ARCH[a].skills.slice(0, 2).map(s => esc(s[0])).join('、')}…</div>`); wrap.appendChild(c); return c; });
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
        const info = ARCH[a].guardian ? (seen ? '能力：' + passiveList(a).map(p => PASSIVES[p].name).join('、') : (ARCH[a].ng ? '二週目取得' : '劇情取得')) : (seen ? '最高：' + RARITY[seen - 1].n : '尚未取得');
        c.insertAdjacentHTML('beforeend', `<div><b>${seen ? esc(weaponName(a)) : '？？？'}</b><div class="small muted">${info}</div></div>`); box.appendChild(c); };
      ARCH_ORDER.forEach(a => card(a, wrap)); Object.values(W.guardians).forEach(a => card(a, gw));
      const sc = $('.scroll', ctl.box);
      ctl.update = () => { const d = Input.dir(); if (d === 'down') sc.scrollTop += 40; if (d === 'up') sc.scrollTop -= 40; if (Input.p('B') || Input.p('A')) { Sound.sfx('back'); ctl.done(); } };
    });
  },
};

const TitleMenu = {
  open() {
    return UI.panel(ctl => {
      const render = () => {
        const n = dexCount();
        const rows = [];
        ctl.box.innerHTML = `<h2>稱號　<span class="small muted">妖怪圖鑑 ${n} / ${MON_KEYS.length}．最多配戴 ${TITLE_SLOTS} 個</span></h2><div class="scroll"></div>`
          + footKeys('A 配戴／取下　B 返回');
        const sc = $('.scroll', ctl.box);
        sc.insertAdjacentHTML('beforeend', '<div class="small muted">每收集 10 種妖怪解鎖一個稱號，收集越多加成越高；把某一個種族收集齊全，還會解鎖該種族的專屬稱號。效果可自由搭配。</div>');
        for (const t of ALL_TITLES()) {
          const on = (G.titles || []).includes(t.id), got = titleUnlocked(t);
          const r = h('div', 'row' + (got ? '' : ' dis'));
          r.insertAdjacentHTML('beforeend', `<div class="grow"><b>${got ? esc(t.name) : '？？？'}</b> ${got ? `<span class="tchip">${BOND_STAT_NAME[t.stat]} +${Math.round(t.val * 100)}%</span>` : ''}${t.race ? raceChip(t.race) : ''}
            <div class="small muted">${titleNeedText(t)}${got ? ' ✓' : ''}</div></div>
            <span class="small">${on ? '<b class="good">★ 配戴中</b>' : got ? '未配戴' : ''}</span>`);
          sc.appendChild(r); rows.push({ r, t, got, on });
        }
        listNav(ctl, rows.map(x => x.r), { onBack: () => ctl.done(), onPick: async i => {
          const it = rows[i];
          if (!it.got) { Sound.sfx('bump'); await say('圖鑑收集得還不夠，先去認識更多武器妖吧！'); return; }
          G.titles = G.titles || [];
          if (it.on) G.titles = G.titles.filter(x => x !== it.t.id);
          else { if (G.titles.length >= TITLE_SLOTS) { await say(`最多只能同時配戴 ${TITLE_SLOTS} 個稱號，先取下一個吧。`); return; } G.titles.push(it.t.id); }
          Sound.sfx('ok'); playerStats(); autosave(); render();
        } });
      };
      render();
    });
  },
};

const MonDex = {
  open() {
    return UI.panel(ctl => {
      const seen = MON_KEYS.filter(k => Meta.d.dex && Meta.d.dex[k]).length;
      const races = Object.keys(RACE);
      let html = '';
      for (const ra of races) {
        const list = MON_KEYS.filter(k => monDef(k).race === ra);
        html += `<div class="qsec">${esc(ra)}族　<span class="small muted">剋 ${esc(RACE_KE[ra])}族．被 ${esc(RACE_KE_BY[ra])}族所剋</span></div><div class="armory"></div>`;
      }
      const nextT = DEX_TITLES.find(t => t.n > seen);
      ctl.box.innerHTML = `<h2>妖怪圖鑑　<span class="small muted">${seen} / ${MON_KEYS.length}　${nextT ? `再 ${nextT.n - seen} 種解鎖稱號「${esc(nextT.name)}」` : '所有稱號都解鎖了！'}</span></h2><div class="scroll">${html}</div>` + footKeys('↑↓ 捲動　B 返回');
      const boxes = ctl.box.querySelectorAll('.armory');
      races.forEach((ra, i) => {
        for (const k of MON_KEYS.filter(x => monDef(x).race === ra)) {
          const M = monDef(k), got = Meta.d.dex && Meta.d.dex[k];
          const c = h('div', 'arm' + (got ? '' : ' unk'));
          const pic = GFX.el(GFX.weaponMon(k, W.theme), 1.1); if (!got) pic.style.filter = 'brightness(0) opacity(.35)';
          c.appendChild(pic);
          c.insertAdjacentHTML('beforeend', `<div><b>${got ? esc(M.name) : '？？？'}</b><div class="small muted">${got ? `${elChip(M.el)}${raceChip(M.race)}<br>掉落：${esc(weaponName(M.drop))}` : '尚未遇過'}</div></div>`);
          boxes[i].appendChild(c);
        }
      });
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
          if (it.use === 'buff' || it.use === 'cure') { await say(`「${itemName(id)}」要在戰鬥中使用喔！`); return; }
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
    if (W.story) return !G.flags.prologue ? '和小墨談談。' : W.stages[Math.min(G.badges.length, 5)].text;
    if (!G.equip.length) return `去找${W.roles.mentor.name}領取武器。`;
    if (!G.badges.length) return `穿過${W.mapNames.route1}，到${W.mapNames.town2}挑戰關主「${W.roles.gym1.name}」。`;
    return '第一章完成！（試玩版內容到此為止）';
  },
  /* 支線：道館機關、圖鑑收集、錯題複習 */
  sides() {
    const out = [];
    if (W.story) {
      for (const [mid, L] of Object.entries(LAYOUTS)) {
        if (!L.devices) continue;
        const ds = Object.values(L.devices), done = ds.filter(d => G.flags[d.flag]).length;
        const where = (W.mapNames && W.mapNames[mid]) || mid;
        out.push(done >= ds.length
          ? `<s>${esc(where)}的機關（${esc(ds[0].label)}）</s>　<b class="good">已全部解開</b>`
          : `解開${esc(where)}的機關「${esc(ds[0].label)}」（${done} / ${ds.length}）<span class="muted">．答對題目就能解開</span>`);
      }
      const n = dexCount(), nt = DEX_TITLES.find(t => t.n > n);
      out.push(nt ? `妖怪圖鑑收集（${n} / ${MON_KEYS.length}）<span class="muted">．再 ${nt.n - n} 種可解鎖稱號「${esc(nt.name)}」</span>`
        : `<s>妖怪圖鑑收集</s>　<b class="good">全部稱號已解鎖</b>`);
      if (G.ng > 0) {
        const got = G.weapons.some(w => w.arch === 'g_stone');
        out.push(got ? '<s>在「硯海墨池」擊敗硯海龍君</s>　<b class="good">已取得</b>'
          : '在校園牆角的墨漬進入「硯海墨池」，找到並擊敗硯海龍君<span class="muted">．答對題目才能挑戰，牠會換位置</span>');
        const n4 = GUARDIAN_KEYS.filter(k => G.weapons.some(w => w.arch === k)).length;
        out.push(n4 >= 4 ? '<s>集齊文房四寶</s>　<b class="good">已完成</b>' : `集齊文房四寶（${n4} / 4）<span class="muted">．每一週目可獲得一隻</span>`);
      }
      const wn = G.wrong.length;
      out.push(wn ? `複習錯題本（目前 ${wn} 題）<span class="muted">．答對就會從錯題本消失</span>` : `<s>複習錯題本</s>　<b class="good">目前沒有錯題</b>`);
      return out;
    }
    const q = G.quests.bugs, R = W.roles.questGiver;
    out.push(!q || q.state === 'none' ? `<span class="muted">？？？（到${W.mapNames.route1}找找看有沒有人需要幫忙）</span>`
      : q.state === 'active' ? `消滅 3 隻錯字蟲（${q.n} / 3）<span class="muted">．委託人：${esc(R.name)}</span>${q.n >= 3 ? '　<b class="good">可回報！</b>' : ''}` : `<s>消滅 3 隻錯字蟲</s>　<b class="good">已完成</b>`);
    return out;
  },
  open() {
    return UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>任務</h2><div class="scroll"><div class="qsec">主線．${esc(W.chapterName)}</div><div class="qitem">◆ ${esc(Quests.main())}</div>
        <div class="qsec">支線</div>${Quests.sides().map(t => `<div class="qitem">◆ ${t}</div>`).join('')}</div>` + footKeys('↑↓ 捲動　B 返回');
      const sc = $('.scroll', ctl.box);
      ctl.update = () => { const d = Input.dir(); if (d === 'down') sc.scrollTop += 40; if (d === 'up') sc.scrollTop -= 40; if (Input.p('B') || Input.p('A')) { Sound.sfx('back'); ctl.done(); } };
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
const SKINS = ['#fde2c8', '#f8d0a8', '#eebc90', '#d8a070', '#b47a4e', '#8a5a38'];
const HAIRS = ['#1e1a20', '#3a2a24', '#5a3a24', '#8a5a34', '#c08a48', '#e0c070', '#b8b8c0', '#f0f0f0', '#8a2a3a', '#d8603a', '#2a3a7a', '#3a6a4a', '#7a4a98', '#e890b0'];
const TOPS = ['#f8f8f8', '#d8dce4', '#2a3a6a', '#88b8e8', '#c83838', '#f0a0b8', '#f09040', '#f0d050', '#4a9a4a', '#3aa0a0', '#8a5ac8', '#303038', '#8a5a3a', '#e8dcc0'];
const ACCENTS = ['#3a58a0', '#c83838', '#2e6a4a', '#d8b030', '#8a3040', '#404048', '#f0f0f0', '#e07a30', '#6a4a98', '#3aa0c8', '#8a6a4a', '#f08ab0', '#1e1e28', '#a0c040'];
const BOTTOMS = ['#2a2e48', '#303038', '#6a6a78', '#b8a47a', '#6a4a30', '#2e5a3a', '#7a2a38', '#f0f0f0', '#4a6aa0', '#8a3a3a'];
const FACES = [['normal', '一般'], ['smile', '微笑'], ['happy', '開心'], ['cool', '酷（墨鏡）'], ['surprise', '驚訝'], ['wink', '眨眼'], ['blush', '害羞'], ['serious', '認真'], ['sleepy', '想睡']];
const OUTFITS = [['pants', '褲裝'], ['skirt', '裙裝'], ['suit', '套裝']];
/* 自訂文字輸入（含禁用字檢查） */
const TextInput = {
  open({ title, value = '', max = 12, placeholder = '' }) {
    return UI.panel(ctl => {
      ctl.box.classList.add('login');
      ctl.box.innerHTML = `<h2>${esc(title)}</h2><div class="small muted">最多 ${max} 個字。請使用適當的文字，不雅或不當的字詞無法使用。</div>
        <div class="lg-form" style="grid-template-columns:1fr"><input maxlength="${max}" placeholder="${esc(placeholder)}"></div><div class="lg-msg small"></div>
        <div class="btns"><button class="btn go">確定</button><button class="btn alt no">取消</button></div>` + footKeys('Enter 確定　Esc 取消');
      const inp = $('input', ctl.box), m = $('.lg-msg', ctl.box); inp.value = value;
      const ok = () => { const v = inp.value.trim(); if (!v) { m.textContent = '請輸入文字。'; return; } if (!WordFilter.ok(v)) { Sound.sfx('bump'); m.textContent = '這段文字含有不適當的字詞，請重新輸入。'; return; } ctl.done(v); };
      $('.go', ctl.box).addEventListener('click', ok); $('.no', ctl.box).addEventListener('click', () => ctl.done(null));
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); ok(); } if (e.key === 'Escape') ctl.done(null); });
      setTimeout(() => { inp.focus(); inp.select(); }, 50);
      ctl.update = () => { if (Input.p('B')) ctl.done(null); };
    });
  },
};
const CharCreate = {
  open(wid, preset) {
    const Wd = WORLDS[wid];
    const genName = () => pick(Wd.surnames) + pick(Wd.given);
    const P = preset && preset.look || {};
    const idx = (arr, v, d) => { const i = arr.indexOf(v); return i >= 0 ? i : d; };
    const st = { name: preset ? preset.name : genName(), gender: P.gender || pick(['m', 'f']), skin: idx(SKINS, P.skin, 1), hair: idx(HAIRS, P.hair, rnd(0, 5)),
      face: Math.max(0, FACES.findIndex(f => f[0] === P.face)), outfit: Math.max(0, OUTFITS.findIndex(o => o[0] === P.outfit)),
      top: idx(TOPS, P.cloth, wid === 'school' ? 0 : wid === 'literati' ? 3 : 4), acc: idx(ACCENTS, P.cloth2, 0), bottom: idx(BOTTOMS, P.pants, 0), title: Wd.genTitle(), customTitle: false };
    if (!preset && st.gender === 'f' && Math.random() < 0.5) st.outfit = 1;
    const look = () => ({ style: Wd.style, gender: st.gender, skin: SKINS[st.skin], hair: HAIRS[st.hair], face: FACES[st.face][0], outfit: OUTFITS[st.outfit][0], cloth: TOPS[st.top], cloth2: ACCENTS[st.acc], pants: BOTTOMS[st.bottom] });
    const F = [{ k: 'name', label: '名字' }, { k: 'gender', label: '性別' }, { k: 'skin', label: '膚色', list: SKINS }, { k: 'hair', label: '髮色', list: HAIRS }, { k: 'face', label: '表情', list: FACES },
      { k: 'outfit', label: '服裝款式', list: OUTFITS }, { k: 'top', label: '上衣顏色', list: TOPS }, { k: 'acc', label: '配色', list: ACCENTS }, { k: 'bottom', label: '下身顏色', list: BOTTOMS },
      { k: 'title', label: Wd.titleLabel }, { k: 'rand' }, { k: 'go' }];
    return UI.panel(ctl => {
      ctl.box.innerHTML = `<h2>${preset ? '轉生．' : '建立角色．'}${Wd.icon} ${esc(Wd.name)}</h2><div class="cc"><div class="preview"></div><div class="fields"></div></div>` + footKeys('↑↓ 選項目　←→ 變更　A 確認（名號可選擇自訂）　B 返回');
      const pv = $('.preview', ctl.box), fields = $('.fields', ctl.box);
      const els = F.map(() => { const d = h('div', 'field'); fields.appendChild(d); return d; });
      let sel = 0, spin = 0, inp, busy = false;
      const renderPreview = () => { pv.innerHTML = ''; pv.appendChild(GFX.el(GFX.person(look(), ['down', 'left', 'up', 'right'][spin % 4], 0), 4)); };
      const sw = c => `<span class="swatch" style="background:${c}"></span>`;
      const renderFields = () => F.forEach((f, i) => {
        const d = els[i]; d.classList.toggle('sel', i === sel); if (i === sel) d.scrollIntoView({ block: 'nearest' });
        if (f.k === 'name') { if (!inp) { d.innerHTML = `<label>名字</label><div class="val"></div>`; inp = h('input'); inp.maxLength = 8; inp.value = st.name; $('.val', d).appendChild(inp);
          inp.addEventListener('input', () => st.name = inp.value); inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); inp.blur(); } if (e.key === 'Escape') inp.blur(); e.stopPropagation(); }); }
          else if (document.activeElement !== inp) inp.value = st.name; return; }
        if (f.k === 'rand') { d.innerHTML = `<span class="btn alt">🎲 隨機生成角色</span>`; return; }
        if (f.k === 'go') { d.innerHTML = `<span class="btn">▶ ${preset ? '轉生！' : '開始冒險！'}</span>`; return; }
        let v;
        if (f.k === 'gender') v = st.gender === 'm' ? '男生' : '女生';
        else if (f.k === 'face') v = FACES[st.face][1];
        else if (f.k === 'outfit') v = OUTFITS[st.outfit][1];
        else if (f.k === 'title') v = `<span class="small">${esc(st.title)}</span>${st.customTitle ? '<span class="small muted">（自訂）</span>' : ''}`;
        else v = sw(f.list[st[f.k]]) + `<span class="small muted">${st[f.k] + 1}/${f.list.length}</span>`;
        d.innerHTML = `<label>${esc(f.label)}</label><div class="val"><span class="arrow">◀</span>${v}<span class="arrow">▶</span></div>`;
      });
      const change = (k, dl) => {
        const f = F.find(x => x.k === k);
        if (k === 'gender') st.gender = st.gender === 'm' ? 'f' : 'm';
        else if (k === 'title') { st.title = Wd.genTitle(); st.customTitle = false; }
        else if (f.list) st[k] = (st[k] + dl + f.list.length) % f.list.length;
        Sound.sfx('cursor'); renderFields(); renderPreview();
      };
      const randomize = () => { if (!preset) st.name = genName(); st.gender = pick(['m', 'f']);
        for (const f of F) if (f.list) st[f.k] = rnd(0, f.list.length - 1);
        st.skin = rnd(0, 3); st.face = rnd(0, FACES.length - 1); st.title = Wd.genTitle(); st.customTitle = false; Sound.sfx('ok'); renderFields(); renderPreview(); };
      const titleMenu = async () => {
        busy = true;
        const k = await UI.choose(['隨機產生', '自訂名號', '取消'], { pos: { right: U(8), bottom: U(14) } });
        if (k === 0) change('title', 1);
        if (k === 1) { const v = await TextInput.open({ title: `自訂${Wd.titleLabel}`, value: st.customTitle ? st.title : '', max: 12, placeholder: `例如：${Wd.genTitle()}` }); if (v) { st.title = v; st.customTitle = true; Sound.sfx('ok'); renderFields(); } }
        busy = false;
      };
      const go = async () => { st.name = (st.name || '').trim();
        if (!st.name) { Sound.sfx('bump'); sel = 0; renderFields(); inp.focus(); return; }
        if (!WordFilter.ok(st.name)) { Sound.sfx('bump'); await say('名字含有不適當的字詞，請換一個名字。'); sel = 0; renderFields(); inp.focus(); inp.select(); return; }
        if (!WordFilter.ok(st.title)) { Sound.sfx('bump'); await say(`${Wd.titleLabel}含有不適當的字詞，請重新設定。`); return; }
        if (await UI.yesno(`「${st.name}」，${st.title}。\n確定用這個角色${preset ? '轉生' : '展開冒險'}嗎？`)) ctl.done({ name: st.name, title: st.title, look: look() }); };
      const act = i => { const k = F[i].k; if (k === 'name') inp.focus(); else if (k === 'rand') randomize(); else if (k === 'go') { Sound.sfx('ok'); go(); } else if (k === 'title') titleMenu(); else change(k, 1); };
      els.forEach((d, i) => d.addEventListener('pointerdown', e => { if (e.target === inp) { sel = 0; renderFields(); return; } e.preventDefault(); if (busy) return; sel = i;
        if (e.target.classList.contains('arrow')) change(F[i].k, e.target === d.querySelector('.arrow') ? -1 : 1); else act(i); renderFields(); }));
      ctl.update = () => {
        if (document.activeElement === inp || busy) return;
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
  /* 把器靈交給玩家（一週目三選一隨機、二週目硯靈） */
  async give(a) {
    if (G.weapons.some(w => w.arch === a)) return null;
    Sound.sfx('badge'); s_flash();
    const w = newWeapon(a, 6); G.weapons.push(w); Meta.seeWeapon(G.world, a, 6);
    await say(`${G.player.name} 得到了守護器靈「${weaponName(a)}」！`);
    await say(`${ARCH[a].gdesc || ''}`);
    await say(`守護能力：${passiveList(a).map(p => `「${PASSIVES[p].name}」${PASSIVES[p].desc}`).join('\n')}\n（放進攜帶欄就會生效）`);
    if (G.equip.length < 3) G.equip.push(w.id);
    autosave(); return w;
  },
  /* 一週目：決戰前的對話選擇，三隻器靈隨機出現一隻 */
  async firstMeet() {
    if (G.flags.guardianGot) return;
    const pool = GUARDIAN_FIRST.filter(k => !G.weapons.some(w => w.arch === k));
    const a = pick(pool.length ? pool : GUARDIAN_FIRST);
    G.flags.guardianGot = a;
    await say('（你手上的文具同時亮了起來，一道光在空中凝成形體……）');
    await say(`（文房四寶之一——「${weaponName(a)}」現身了！）`);
    await Guardian.give(a);
  },
  async grant(story) { return Guardian.firstMeet(); },
};
function s_flash() { const fx = $('#fx'); fx.classList.add('white'); fx.style.opacity = 0.9; Anim.run(0.6, k => fx.style.opacity = 0.9 * (1 - k)).then(() => fx.classList.remove('white')); }
/* 國中生涯．劇情結局 */
const StoryEnding = {
  async play() {
    const ng = G.ng || 0;
    Sound.play('ending');
    for (const t of W.ending) await say(t);
    if (G.route) await say(W.routeEnd[G.route]);
    s_flash(); await say(W.finale);
    const gotStone = G.weapons.some(w => w.arch === 'g_stone');
    if (ng > 0) {
      await say(gotStone
        ? '（筆、紙、墨、硯——文房四寶都在你手上了。這一次，你是真的把整座校園都讀懂了。）'
        : '（二週目的挑戰完成了。不過墨池深處的硯海龍君，還在等你。）');
    }
    await Credits.play();
    const first = !G.flags.cleared; G.flags.cleared = true;
    const T = totals(G);
    if (first || ng > 0) { Meta.clear(G.world); Meta.addReport({ world: G.world, name: G.player.name, title: rankTitle(T.pct), pct: T.pct, total: T.t, time: G.time, lv: G.lv, ng, at: Date.now() }); }
    autosave();
    await Report.open(G);
    if (ng > 0 && gotStone) { await StoryEnding.allDone(); return; }
    const opts = [].concat(ng > 0 ? [] : ['進入二週目（難度提升，可再挑戰所有道館）'], ['留在校園繼續探索', '重新開始（全新冒險）', '返回標題畫面']);
    const k = await UI.ask('恭喜通關國中生涯！接下來要做什麼呢？', opts, { cancel: false });
    const L = opts[k];
    if (L && L.startsWith('進入二週目')) { await Flow.newGamePlus(); return; }
    if (L === '重新開始（全新冒險）') { Game.scene = 'blank'; Flow.newGame(G.slot); }
    else if (L === '返回標題畫面') { Game.scene = 'blank'; titleScreen(); }
    else Sound.play(W.music[OW.L.music] || OW.L.music);
  },
  /* 二週目＋文房四寶到齊：最終的跑馬燈與謝幕 */
  async allDone() {
    if (G.flags.allDone) return;
    G.flags.allDone = true;
    Sound.play('ending');
    s_flash();
    await say('（筆、紙、墨、硯——文房四寶四隻器靈同時亮了起來。）');
    await say('小墨：「你看，牠們本來就不是武器。」\n「牠們只是在等一個，願意好好讀、好好寫的人。」');
    await Credits.play();
    await say('★ 全部挑戰完成！\n\n感謝遊玩《詞靈冒險．翡翠之卷》。\n願你在每一次考試之外，都還記得文字原本的溫度。');
    autosave();
    const k2 = await UI.ask('接下來要做什麼呢？', ['留在校園繼續探索', '返回標題畫面'], { cancel: false });
    if (k2 === 1) { Game.scene = 'blank'; titleScreen(); } else Sound.play(W.music[OW.L.music] || OW.L.music);
  },
};
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
            <div><b>戰鬥出題頻率</b>　<span class="small muted">攻擊時有多少機率要答題（目前 ${Math.round(ATTACK_Q_RATE * 100)}%）</span></div>
            <div class="btns">${[30, 50, 70, 100].map(v => `<button class="btn ${Math.round(ATTACK_Q_RATE * 100) === v ? '' : 'alt'}" data-a="q${v}">${v}%</button>`).join('')}</div>
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
        if (a[0] === 'q' && /^q\d+$/.test(a)) { setQRate(+a.slice(1) / 100); render(); note(`已設定為 ${Math.round(ATTACK_Q_RATE * 100)}%（本機設定，對這台電腦的所有學生生效）。`); }
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
        <b>⚔ 戰鬥＝答題</b>：武器的每個招式都對應一種國文題型。攻擊時有 <b>${Math.round(ATTACK_Q_RATE * 100)}%</b> 的機會出題，答對這一擊威力 ×${ATTACK_Q_POW} 並累積文氣，答錯則落空。<br>
        <b>🛡 迴避題</b>：武器親密度達到 ${BOND_STEPS[0]} 分後，敵人出招時有機會出題，答對就能完全閃避（一級 10%、二級 15%、三級 20%）。<br>
        <b>❤ 武器親密度</b>：每打完一場戰鬥，這場用過的武器親密度 +1；因為武器變得與你更親密，牠會努力幫你迴避攻擊。滿級（三級）時，武器還會依種族再給 ${Math.round(BOND_MAX_BONUS * 100)}% 的加成（筆＝攻擊、紙＝氣血、器＝防禦、音＝迴避、兵＝攻擊）。<br>
        <b>◆ 戰術招式</b>：武器 Lv.2 以上會多一個「戰術」，用掉一回合但不攻擊——可以擋下這回合的傷害、提升攻擊／防禦／迴避，或讓對手陷入異常狀態。<br>
        <b>☠ 狀態異常</b>：中毒、燒傷每回合會損血（燒傷還會降低攻擊）；睡眠、麻痺有機率無法行動。用「解狀態的道具」可以一次解除，敵人也會自己解。<br>
        <b>🧪 戰鬥道具</b>：除了補血，還有提升攻擊／防禦／迴避的道具（本場有效）與解除狀態的道具，可在福利社購買。館主、勁敵與魔王也會使用道具補血或強化自己。<br>
        <b>✦ 武器附加效果</b>：碎片合成出來的武器有 ${Math.round(AFFIX_RATE * 100)}% 機率帶「附加效果」，例如回春、反擊、銳利、燃墨（讓對手燒傷），也可能是脆裂、沉重等負面效果。升階時附加效果會保留；把兩把有附加效果的武器合在一起，只會留下一個效果，但觸發機率會提高（最高 ${Math.round(AFFIX_MAX * 100)}%）。<br>
        <b>👑 圖鑑稱號</b>：妖怪圖鑑每收集 10 種就解鎖一個稱號，收集越多的稱號加成越高（攻擊／氣血／防禦／迴避）；收集齊某一個種族還會解鎖專屬稱號。最多同時配戴 ${TITLE_SLOTS} 個，可以自由搭配。<br>
        <b>⚒ 洗鍊</b>：在「鍛造」可以花 ${REFINE_COST} ${esc(W.money)} 重抽武器的附加效果；抽到同一種效果時，觸發機率會疊加。<br>
        <b>🐉 守護器靈</b>：文房四寶——筆、紙、墨各是該種族最強，決戰前會依你的回答隨機現身一隻；硯海龍君是四寶之首（有兩種能力），只有二週目才會在隱藏的「硯海墨池」出現。<br>
        <b>🔁 二週目</b>：通關後可以進入二週目，保留等級、武器、圖鑑與稱號，所有對手都會變強，五座道館與魔王可以重新挑戰，並開放隱藏地圖。全部完成就會播放結尾。<br>
        <b>🐾 種族相剋</b>：武器與妖怪都有種族——筆剋紙、紙剋器、器剋音、音剋兵、兵剋筆。剋制威力 ×1.3，被剋制 ×0.85；若種族與五行<b>同時剋制</b>，傷害再 ×${DOUBLE_BONUS}（雙重剋制）。<br>
        <b>☯ 五行相剋</b>：金剋木、木剋土、土剋水、水剋火、火剋金。題型屬性：字音字形＝金、詞義成語＝木、修辭閱讀＝水、詩詞＝火、文言常識＝土。剋制對手威力 ×1.5，被剋制 ×0.7。<br>
        <b>✨ 文氣與必殺技</b>：每次命中或答對題目都會累積 1 格文氣（答錯落空則沒有），集滿 5 格就能施展必殺技（必定命中）。<br>
        <b>🗡 武器熟練度</b>：用武器答對戰鬥中的題目會提升熟練度（屬性剋制時 +2），升級後學會新招式。最多攜帶 3 件武器。<br>
        <b>⚒ 碎片與鍛造</b>：野生怪物是武器幻化的「武器妖」，打倒後有機會掉落該武器的碎片，集滿 5 片可合成武器；同名同階武器可以升階。<br>
        <b>💎 稀有度</b>：凡品（白）→ 良品（綠）→ 精品（藍）→ 珍品（紫）→ 絕品（金）→ 神品（紅）→ 守護神器（彩，只能由劇情取得）。階級越高，附加效果越多：良品熟練度 +1、精品剋制威力 +15%、珍品答對回血 3%、絕品剋制文氣 +1、神品被剋制不減威力。<br>
        <b>🔧 道館機關</b>：每座道館裡都有三個符合館主風格的機關（錯字黑板、飛舞的辭典、枯萎的花、古文石碑、准考證感應台）。答對題目解開全部機關，就能削弱館主或打開新的路。<br>
        <b>📕 妖怪圖鑑</b>：全 ${MON_KEYS.length} 種武器妖，遇過就會自動登錄，可在選單查看種族與屬性。<br>
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
