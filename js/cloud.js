'use strict';
/* ============ 雲端存檔（Google 試算表 + Apps Script） ============
   學生用「班級＋座號＋4 位數字密碼」登入，存檔會同步到老師的試算表，
   同時把等級、答對率等摘要寫進表格，方便老師查看全班進度。 */
const Cloud = {
  user: Store.get('ciling_cloud_user', null),
  status: 'idle', pending: new Set(), timer: null, badge: null,
  url() { return Store.get('ciling_cloud_url', '') || (typeof CONFIG !== 'undefined' && CONFIG.cloudUrl) || ''; },
  get enabled() { return !!this.url(); },
  label() { return this.user ? `${this.user.cls}班 ${this.user.no}號` : ''; },
  async call(action, payload) {
    const r = await fetch(this.url(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ action }, payload)) });
    const j = await r.json(); if (!j.ok) throw new Error(j.error || '雲端回應錯誤'); return j;
  },
  async login(cls, no, pin) {
    const j = await this.call('login', { cls, no, pin });
    this.user = { cls, no, pin }; Store.set('ciling_cloud_user', this.user);
    for (let i = 1; i <= SLOT_N; i++) { const d = j.slots[i - 1]; if (d) Store.set(Slots.key(i), JSON.parse(d)); else Store.del(Slots.key(i)); }
    this.setStatus('ok'); return j;
  },
  logout() { this.user = null; Store.del('ciling_cloud_user'); this.setStatus('idle'); },
  /* 登出流程：先把進度上傳，確認成功才登出；失敗時提醒 */
  async logoutFlow() {
    if (!this.user) return true;
    if (!(await UI.yesno(`要登出「${this.label()}」嗎？\n（登出前會先把進度存到雲端）`))) return false;
    if (G && G.slot) { G.savedAt = Date.now(); Store.set(Slots.key(G.slot), G); this.pending.add(G.slot); }
    clearTimeout(this.timer);
    const box = UI.el('box moneybox', '☁ 正在上傳進度……');
    await this.flush(); box.remove();
    if (this.pending.size) {
      Sound.sfx('bump');
      if (!(await UI.ask('⚠️ 進度還沒上傳成功（可能是網路問題）。\n現在登出，這次的進度可能會遺失。', ['先不要登出', '還是要登出'], {})) ) return false;
    }
    const who = this.label(); this.logout(); this.pending.clear(); this.skipped = false;
    Sound.sfx('ok'); await say(`「${who}」已登出。下一位同學可以登入了！`);
    return true;
  },
  queue(n) { if (!this.user || !this.enabled) return; this.pending.add(n); clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 1200); },
  async flush() {
    if (!this.user) return;
    for (const n of [...this.pending]) {
      const g = Slots.read(n);
      try { this.setStatus('syncing'); await this.call('save', Object.assign({ slot: n, data: g ? JSON.stringify(slim(g)) : '', summary: g ? summary(g) : null }, this.user)); this.pending.delete(n); this.setStatus('ok'); }
      catch (e) { console.warn('雲端存檔失敗', e); this.setStatus('error'); clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 15000); return; }
    }
  },
  setStatus(s) { this.status = s; this.paint(); },
  paint() {
    const show = this.enabled && (Game.scene === 'title' || this.status === 'error');
    if (!show) { if (this.badge) { this.badge.remove(); this.badge = null; } return; }
    if (!this.badge || !this.badge.isConnected) { this.badge = h('div', 'cloudbadge'); $('#screen').appendChild(this.badge); }
    const t = !this.user ? '☁ 未登入（只存在這台電腦）' : { syncing: '☁ 同步中…', error: '☁ 同步失敗，稍後重試', ok: '☁ 已同步', idle: '☁ 已登入' }[this.status];
    this.badge.textContent = (this.user ? this.label() + '　' : '') + t; this.badge.className = 'cloudbadge ' + this.status;
  },
};
/* 精簡存檔：題庫中已有的錯題不必存整題 */
function slim(g) { const c = JSON.parse(JSON.stringify(g)); c.wrong = c.wrong.map(w => QB.byId(w.id) ? Object.assign({}, w, { snap: undefined }) : w); return c; }
function summary(g) { const T = totals(g); return { name: g.player.name, world: WORLDS[g.world].name, lv: g.lv, chapter: g.chapter, badges: g.badges.length, answered: T.t, pct: T.pct, wrong: g.wrong.length, minutes: Math.round((g.time || 0) / 60) }; }

/* 登入畫面 */
const LoginPanel = {
  open() {
    return UI.panel(ctl => {
      ctl.box.classList.add('login');
      ctl.box.innerHTML = `<h2>☁ 登入班級帳號</h2><div class="small muted">登入後，存檔會自動存到雲端，換電腦也能繼續玩。第一次登入會自動建立帳號。</div>
        <div class="lg-form"><label>班級<input name="cls" maxlength="6" placeholder="例如 801" inputmode="numeric"></label><label>座號<input name="no" maxlength="3" placeholder="例如 12" inputmode="numeric"></label>
        <label>密碼<input name="pin" maxlength="4" placeholder="4 位數字" inputmode="numeric" type="password"></label></div>
        <div class="lg-msg small"></div><div class="btns"><button class="btn go">登入</button><button class="btn alt skip">不登入（只存在這台電腦）</button></div>` + footKeys('Enter 下一格／登入　Esc 返回');
      const $i = n => $(`input[name=${n}]`, ctl.box), m = $('.lg-msg', ctl.box);
      if (Cloud.user) { $i('cls').value = Cloud.user.cls; $i('no').value = Cloud.user.no; }
      const submit = async () => {
        const cls = $i('cls').value.trim(), no = String(+$i('no').value.trim() || ''), pin = $i('pin').value.trim();
        if (!/^[0-9A-Za-z]{1,6}$/.test(cls) || !/^\d{1,3}$/.test(no)) { m.textContent = '請填寫班級與座號。'; return; }
        if (!/^\d{4}$/.test(pin)) { m.textContent = '密碼要是 4 位數字。第一次登入時設定的密碼，之後都要用同一組喔！'; return; }
        m.textContent = '連線中……';
        try { const j = await Cloud.login(cls, no, pin); m.textContent = ''; Sound.sfx('badge'); ctl.done(j.created ? 'created' : 'ok'); }
        catch (e) { Sound.sfx('bump'); m.textContent = '登入失敗：' + e.message; }
      };
      $('.go', ctl.box).addEventListener('click', submit);
      $('.skip', ctl.box).addEventListener('click', () => ctl.done('skip'));
      ['cls', 'no', 'pin'].forEach((n, i, arr) => $i(n).addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); if (i < 2) $i(arr[i + 1]).focus(); else submit(); } if (e.key === 'Escape') ctl.done(null); }));
      setTimeout(() => $i(Cloud.user ? 'pin' : 'cls').focus(), 50);
      ctl.update = () => { if (Input.p('B')) ctl.done(null); };
    });
  },
};
