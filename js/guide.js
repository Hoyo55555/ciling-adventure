'use strict';
/* ============ 目標引導 ============
   玩家（尤其是教師版）常常不知道「下一步該去哪、該做什麼」，所以由資料算出目前的目標：
   - 主線：目前這一章（W.stages）裡第一個還沒做完的角色；要先打倒的人、要先解的機關、夢中小鎮的委託，都會一路追到「現在就能做的那一件事」。
   - 不直接顯示在遊戲畫面上（2026-10-06 使用者要求）：由路上的人「開口說」（小墨、道館守門人、路人，見 overworld.js 的 guideHint），
     以及選單「任務」、被擋住時的提示（化身、道館主）。
   - 會算出從現在的位置走到目標那張地圖的路線（一格一格換地圖的名字）。 */
const Guide = {
  mapName: id => (W.mapNames && W.mapNames[id]) || id,
  /* 這個世界實際在用的地圖（校園版只算校園與夢中小鎮；舊的城鎮地圖還留在 LAYOUTS 裡，不能算進來） */
  maps() { return (W && W.campus && typeof CAMPUS_MAPS !== 'undefined') ? CAMPUS_MAPS : LAYOUTS; },
  /* 這個角色現在站在哪（依碎片數與旗標挑出此刻真的會出現的那一個；挑不到就取第一個） */
  where(role) {
    let first = null;
    for (const [m, L] of Object.entries(this.maps())) for (const s of (L.npcs || [])) {
      if (s.role !== role) continue;
      const at = { map: m, key: s.key || m + ':' + role };
      first = first || at;
      if (s.retry || (s.needFlag && !G.flags[s.needFlag]) || (s.hideFlag && G.flags[s.hideFlag])) continue;
      if (s.minBadges != null && G.badges.length < s.minBadges) continue;
      if (s.maxBadges != null && G.badges.length > s.maxBadges) continue;
      return at;
    }
    return first;
  },
  go(role, verb) {
    const at = this.where(role), R = W.roles[role]; if (!at) return null;
    return { map: at.map, role, text: `去「${this.mapName(at.map)}」${verb || '找'}「${R.name}」`, short: `${verb || '找'}「${R.name}」（${this.mapName(at.map)}）` };
  },
  devices(mapId, flag) {
    const ds = Object.values((this.maps()[mapId] || {}).devices || {}), done = ds.filter(d => G.flags[d.flag]).length;
    const name = ds[0] ? ds[0].label : '機關';
    return { map: mapId, text: `在「${this.mapName(mapId)}」解開機關「${name}」（${done} / ${ds.length}）`, short: `解開機關（${done}/${ds.length}）（${this.mapName(mapId)}）`, flag };
  },
  /* 要完成 role，現在就該做的下一件事；已經完成回傳 null */
  step(r, seen = new Set()) {
    if (seen.has(r)) return null; seen.add(r);
    const R = W.roles[r]; if (!R) return null;
    const at = this.where(r);
    if (at && G.defeated[at.key]) return null;
    for (const k of (R.needDefeated || [])) if (!G.defeated[k]) {            // 要先打倒的人
      const s = this.step(k.split(':')[1], seen) || this.go(k.split(':')[1]); if (s) return s;
    }
    /* 大魔王要走到講台前的紅毯才會從天而降 */
    if (at) { const spec = (this.maps()[at.map].npcs || []).find(q => q.role === r), cut = spec && spec.cut;
      if (cut && spec.needFlag && !G.flags[spec.needFlag]) { const tile = Object.keys(this.maps()[at.map].cuts || {}).find(k => this.maps()[at.map].cuts[k] === cut) || '';
        return { map: at.map, walk: tile.split(',').map(Number), text: `走到「${this.mapName(at.map)}」講台前的紅毯上，「${R.name}」就在那裡等你`, short: `走到講台前的紅毯（${this.mapName(at.map)}）` }; } }
    if (R.kind === 'avatar') {
      if (R.dream && W.dreams[R.dream] && G.flags[W.dreams[R.dream].enteredFlag]) return null;     // 已經進過夢：化身這一步算完成（不戰鬥的入口不會留下「打倒」的紀錄）
      if (R.gateFlag && !G.flags[R.gateFlag] && at) return Object.assign(this.devices(at.map, R.gateFlag), { dream: R.dream });
      return Object.assign(this.go(r, R.noFight ? '讀' : '找'), { dream: R.dream });
    }
    if (R.kind === 'gym' && R.dream && W.dreams && W.dreams[R.dream]) {       // 夢中的道館主
      const D = W.dreams[R.dream], inDream = G.flags.dream === R.dream;
      if (G.flags.dream && !inDream) { const O = W.dreams[G.flags.dream]; return { map: O.town.map, text: `先從選單「醒來」，回到${O.homeName}`, short: `先「醒來」回${O.homeName}`, dream: G.flags.dream }; }
      if (inDream) {
        if (!G.flags[D.openFlag]) { const n = typeof dreamDoneCount === 'function' ? dreamDoneCount(R.dream) : 0;
          return { map: D.town.map, text: `在「${D.name}」幫居民完成委託，任意 ${D.need} 件（${n} / ${D.need}）`, short: `幫居民完成委託（${n}/${D.need}）（${D.name}）`, dream: R.dream }; }
        return Object.assign(this.go(r, '找'), { dream: R.dream });
      }
      if (G.flags[D.enteredFlag]) {
        const por = Object.entries(W.roles).find(([, x]) => x.dream === R.dream && x.kind === 'portal' && !x.wake);
        return { map: D.home.map, text: `回到「${this.mapName(D.home.map)}」，從「${por ? por[1].name : '入口'}」進入夢中小鎮「${D.name}」`, short: `從「${por ? por[1].name : '入口'}」進夢（${this.mapName(D.home.map)}）`, dream: R.dream };
      }
      const av = Object.entries(W.roles).find(([, x]) => x.dream === R.dream && x.kind === 'avatar');
      if (av) return this.step(av[0], seen);
    }
    return this.go(r, '找');
  },
  objective() {
    if (!W || !W.story || !G || !G.flags) return null;
    if (!G.flags.prologue) {                                                   // 序幕：房間裡 鬧鐘 → 書包 → 小墨
      const where = this.mapName('room');
      return G.flags.pro === 2 || G.flags.dreamClock != null
        ? { map: 'room', text: `在「${where}」檢查書包，確認准考證`, short: `檢查書包（${where}）` }
        : { map: 'room', text: `在「${where}」確認床頭的鬧鐘`, short: `確認鬧鐘（${where}）` };
    }
    if (G.flags.cleared) return null;
    const st = W.stages[Math.min(G.badges.length, W.stages.length - 1)];
    const gd = this.guardianStep(st); if (gd) return this.withRoute(gd);
    for (const r of (st.roles || [])) { const s = this.step(r); if (s) return this.withRoute(s); }
    return { text: st.text, short: st.name };
  },
  /* 大禮堂的門要先做完「器靈」的決定才打得開（門的 needFlag 是 guardianDone）：先到禮堂前廣場聽小墨交代，再去找器靈 */
  guardianStep(st) {
    const door = Object.values((this.maps().audyard || {}).doorWarps || {}).find(d => d.needFlag === 'guardianDone');
    if (!door || G.flags.guardianDone || !(st.roles || []).some(r => W.roles[r] && W.roles[r].kind === 'gym' && !W.roles[r].dream)) return null;
    const arch = G.flags.guardianQuest;
    if (!arch) return { map: 'audyard', text: `去「${this.mapName('audyard')}」，往大禮堂的台階走`, short: '往大禮堂的台階走' };
    const C = typeof gqClue === 'function' && gqClue(arch); const gr = Object.keys(W.roles).find(k => W.roles[k].gq === arch);
    if (!C || !gr) return null;
    return { map: C.where, role: gr, text: `到「${C.place}」找「${W.roles[gr].name}」\n（${C.clue.replace(/[「」]/g, '')}）`, short: `找「${W.roles[gr].name}」（${C.place}）`, guardian: true };
  },
  /* 地圖之間的路：走路／進門都算一步（雙向） */
  graph() {
    if (this._g && this._gW === W) return this._g;
    const M = this.maps(), g = {}, add = (a, b) => { if (!b || b === '@ret' || !M[b]) return; (g[a] = g[a] || new Set()).add(b); (g[b] = g[b] || new Set()).add(a); };
    for (const [id, L] of Object.entries(M)) { for (const w of (L.warps || [])) add(id, w.to); for (const d of Object.values(L.doorWarps || {})) add(id, d.to); }
    this._gW = W; return this._g = g;
  },
  route(from, to) {
    if (from === to) return [from];
    const g = this.graph(), prev = { [from]: null }, q = [from];
    while (q.length) { const x = q.shift(); for (const y of (g[x] || [])) if (!(y in prev)) { prev[y] = x; if (y === to) { const p = [y]; for (let c = x; c != null; c = prev[c]) p.unshift(c); return p; } q.push(y); } }
    return null;
  },
  withRoute(s) {
    if (!s.map || !OW.id) return s;
    const p = this.route(OW.id, s.map);
    if (p && p.length > 1) { s.route = p; s.text += `\n路線：${p.map(m => this.mapName(m)).join(' → ')}`; s.next = p[1]; }
    s.here = OW.id === s.map;
    return s;
  },
  /* 這個目標的「身分」：同一件事做到一半（機關 1/3、委託 2/3）不算新目標，換了要做的事才算 */
  key(o) { return `${Math.min(G.badges.length, 9)}|${o.role || o.map}|${o.flag ? 'dev' : ''}|${o.dream || ''}|${o.text.includes('委託') ? 'q' : ''}`; },
  /* 要不要讓小墨出現：目標換成新的、而且還沒告訴過玩家 */
  shouldTell() {
    if (!W || !W.story || !G || !G.flags.prologue || G.flags.cleared || G.flags.moOff) return null;      // moOff：測試用，關掉小墨的主線引導
    const o = this.objective(); if (!o) return null;
    return G.flags.moTold === this.key(o) ? null : o;
  },
};
