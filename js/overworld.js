'use strict';
/* ============ 大地圖：移動、NPC、看得見的敵人、寶箱 ============ */
let G = null;   // 目前存檔
let W = null;   // 目前世界觀

const OW = {
  L: null, id: null, npcs: [], busy: false, bubble: null, bumpCd: 0, idleT: 0, hud: null, hudKey: '',
  p: { x: 0, y: 0, dir: 'down', moving: false, t: 0, tx: 0, ty: 0, dur: 0.22, step: 0, turnWait: 0, cont: false },

  shake: 0, dark: 0, flash: 0, fx: [],
  load(id, x, y, dir) {
    if (!LAYOUTS[id]) { const H0 = (W && W.homeTown) || { map: 'chendu', x: 11, y: 7 }; id = H0.map; x = H0.x; y = H0.y; }   // 防呆：地圖不存在就回起點城鎮
    this.id = id; this.L = LAYOUTS[id];
    Object.assign(this.p, { x, y, dir: dir || this.p.dir, moving: false, t: 0 });
    this.npcs = (this.L.npcs || []).concat((G.flags.cleared && W.postNpcs && W.postNpcs[id]) || []).map(s => {
      const role = W.roles[s.role]; if (!role) return null;
      if (s.route && G.route !== s.route) return null;                 // 依劇情路線出現的 NPC
      if (s.role === 'rival' && G.flags.rivalGone) return null;        // 勁敵離開步道
      if (G.flags['gone:' + id + ':' + s.role]) return null;             // 劇情中離開的人物
      if (s.after && !s.after.every(k => G.defeated[k])) return null;   // 條件未達成，尚未登場
      /* 器靈：被指引到這裡、而且還沒做出決定時才出現。
         用「有沒有做決定」而不是「有沒有擁有」——教師測試版一開局就有全部武器，
         用擁有判斷的話老師永遠看不到這段。 */
      if (s.gq && (G.flags.guardianQuest !== s.gq || G.flags.guardianDone)) return null;
      if (s.needFlag && !G.flags[s.needFlag]) return null;
      /* retry：周以恆②之後現身的器靈，輸了會留在這裡等你再挑戰 */
      if (s.retry && G.flags.guardianRetry !== role.gq) return null;
      if (s.hideFlag && G.flags[s.hideFlag]) return null;
      /* 校園版所有地方一開始就走得到，所以用「拿到幾片碎片」決定人物什麼時候登場、什麼時候離開 */
      if (s.minBadges != null && G.badges.length < s.minBadges) return null;
      if (s.maxBadges != null && G.badges.length > s.maxBadges) return null;
      return { key: id + ':' + s.role + (s.retry ? ':retry' : ''), retry: !!s.retry, role, x: s.x, y: s.y, dir: s.dir, home: s.dir, sight: s.sight || 0, wander: s.wander, ox: 0, oy: 0, fr: 0, look: role.look };
    }).filter(Boolean);
    this.resetEncounter();
    if (id === 'inkpool') this.spawnSpirit();
    else this.spawnRoamer();
    G.map = id; G.x = x; G.y = y;
    if (!this.L.indoor && !/^r\d/.test(id)) { G.visited = G.visited || {}; G.visited[id] = 1; }
    Sound.play(W.music[this.L.music] || this.L.music); Cloud.paint();
    showBanner(W.mapNames[id]);
  },
  /* 野生武器妖不再站在地圖上，改成「走在草叢裡才會隨機遇到」。
     地圖的 foes 設定從「放幾隻」變成「這張地圖的遇敵表」：
       on    踩在哪一種磚上才會遇敵（預設 'g' 草叢）
       safe  剛踩進草叢的前幾步一定不會遇到
       rate  之後每走一步的遇敵機率
       lv / scale / auto / list 與原本相同 */
  resetEncounter() { this.grassSteps = 0; },
  /* 回傳 true 代表這一步觸發了戰鬥，onStep 就不要再做別的事 */
  rollEncounter() {
    const F = this.L.foes; if (!F) return false;
    if (G && G.teacher) return false;              // 教師測試版：不遇敵
    if (!G.equip || !G.equip.length) return false; // 手上沒武器就不該被拖進戰鬥
    const p = this.p;
    if (this.tile(p.x, p.y) !== (F.on || 'g')) { this.grassSteps = 0; return false; }
    this.grassSteps = (this.grassSteps || 0) + 1;
    if (this.grassSteps <= (F.safe == null ? 2 : F.safe)) return false;
    if (Math.random() >= (F.rate == null ? 0.16 : F.rate)) return false;
    this.grassSteps = 0;
    const st = G.badges.length;
    const sp = F.auto ? pick(monsAtStage(st)) : weighted(F.list.filter(x => (x.stage || 0) <= st)).sp;
    const lv = rnd(F.lv[0], F.lv[1]) + (F.scale || 0) * st + (G.ng || 0) * 4;
    p.cont = false;
    this.run(() => wildEncounter(sp, lv));
    return true;
  },
  /* 二週目：筆靈／紙靈／墨靈會在城鎮與路線上隨機現身 */
  spawnRoamer() {
    this.npcs = this.npcs.filter(n => n.role.kind !== 'roamer');
    if (!G.ng || this.L.indoor) return;
    const left = GUARDIAN_FIRST.filter(k => !ownsArch(k));
    if (!left.length) { G.roamAt = null; return; }
    if (!G.roamAt || !LAYOUTS[G.roamAt]) rerollRoam();
    if (this.id !== G.roamAt) return;                        // 只會出現在「指引」說的那張地圖
    const spots = [];
    for (let y = 1; y < this.L.rows.length - 1; y++) for (let x = 1; x < this.L.rows[0].length - 1; x++)
      if (!SOLID.has(this.tile(x, y)) && !this.chestAt(x, y) && !this.npcAt(x, y) && Math.abs(x - this.p.x) + Math.abs(y - this.p.y) > 4) spots.push([x, y]);
    if (!spots.length) return;
    const [sx, sy] = pick(spots), a = pick(left);
    const role = { kind: 'roamer', name: weaponName(a), look: { sprite: 'stone' } };
    this.npcs.push({ key: this.id + ':roamer', role, arch: a, x: sx, y: sy, dir: 'down', home: 'down', sight: 0, ox: 0, oy: 0, fr: 0, look: role.look });
  },
  /* 二週目：硯海龍君在墨池裡隨機現身 */
  spawnSpirit() {
    this.npcs = this.npcs.filter(n => n.key !== 'inkpool:stoneSpirit');
    if (!G.ng || ownsArch('g_stone') || !G.flags.shardsAll) return;
    const R0 = W.roles.stoneSpirit; if (!R0) return;
    this.npcs.push({ key: 'inkpool:stoneSpirit', role: R0, x: 8, y: 6, dir: 'down', home: 'down', sight: 0, ox: 0, oy: 0, fr: 0, look: R0.look });
  },
  /* 上／右／下／左 四個位元：哪幾邊不是同一種磚。水面的岸線與球場的邊線都靠它畫 */
  edgeMask(x, y, c) {
    /* 地圖外面當成同一種磚：路、水走到地圖邊緣是「繼續延伸出去」，不是在邊上收邊 */
    const r = this.L.rows, out = (a, b) => b < 0 || b >= r.length || a < 0 || a >= r[0].length;
    const diff = (a, b) => !out(a, b) && this.tile(a, b) !== c;
    return (diff(x, y - 1) ? 1 : 0) | (diff(x + 1, y) ? 2 : 0) | (diff(x, y + 1) ? 4 : 0) | (diff(x - 1, y) ? 8 : 0);
  },
  tile(x, y) { const r = this.L.rows; if (y < 0 || y >= r.length || x < 0 || x >= r[0].length) return this.L.indoor ? 'X' : 'T'; const o = G && G.opened && G.opened[this.id + ':' + x + ',' + y]; return o || r[y][x]; },
  npcAt(x, y) { return this.npcs.find(n => n.x === x && n.y === y); },
  chestAt(x, y) { return (this.L.chests || []).find(c => c.x === x && c.y === y); },
  solid(x, y) { return SOLID.has(this.tile(x, y)) || !!this.npcAt(x, y) || !!this.chestAt(x, y) || this.eave(x, y); },
  /* 屋簷底下走不過去（stampProps 記在 L.eaves） */
  eave(x, y) { const L = this.L; if (!L.eaves) return false; if (!L.eaveSet) L.eaveSet = new Set(L.eaves); return L.eaveSet.has(x + ',' + y); },

  run(fn) { this.busy = true; Promise.resolve().then(fn).catch(e => console.error(e)).finally(() => { this.busy = false; Input.eat(); }); },

  update(dt) {
    const p = this.p; this.bumpCd -= dt; this.updateHud();
    if (this.busy) return;
    this.idleT += dt;
    if (this.idleT > 1.6) { this.idleT = 0; for (const n of this.npcs) if (n.wander && Math.random() < 0.35) n.dir = pick(['up', 'down', 'left', 'right']); }
    if (p.moving) {
      p.t += dt / p.dur;
      if (p.t >= 1) { p.x = p.tx; p.y = p.ty; p.moving = false; p.t = 0; G.x = p.x; G.y = p.y; if (this.onStep()) return; }
      else return;
    }
    if (Input.p('START')) { Sound.sfx('ok'); this.run(() => BookMenu.open()); return; }
    if (Input.p('HOME')) { this.run(() => goHome()); return; }
    if (Input.p('A')) { this.interact(); return; }
    const d = ['up', 'down', 'left', 'right'].find(k => Input.h(k));
    if (!d) { p.cont = false; p.turnWait = 0; return; }
    if (p.dir !== d && !p.cont) { p.dir = d; p.turnWait = 0.08; return; }
    if (p.turnWait > 0) { p.turnWait -= dt; return; }
    p.dir = d; this.tryMove(d);
  },
  tryMove(d) {
    const p = this.p, [dx, dy] = DIRS[d], nx = p.x + dx, ny = p.y + dy;
    const gate = this.L.gates && this.L.gates[nx + ',' + ny];
    if (gate && !gateOpen(gate)) { p.cont = false; this.run(() => say(W.gates[gate])); return; }
    const dw = this.L.doorWarps && this.L.doorWarps[nx + ',' + ny];
    if (dw) { p.cont = false; this.run(() => enterDoor(dw)); return; }
    if (this.solid(nx, ny)) { if (this.bumpCd <= 0) { Sound.sfx('bump'); this.bumpCd = 0.35; } p.cont = false; return; }
    p.moving = true; p.tx = nx; p.ty = ny; p.t = 0; p.cont = true; p.step++;
    p.dur = Input.h('B') ? 0.12 : 0.22;
  },
  onStep() {
    const p = this.p;
    /* 過場觸發格：踩上去播一次就不再播 */
    const cutName = this.L.cuts && this.L.cuts[p.x + ',' + p.y];
    if (cutName && !G.flags['cut:' + this.id + ':' + cutName] && CUTS[cutName]
        && G.badges.length >= (CUT_NEED[cutName] || 0)) {        // 校園裡禮堂一開始就到得了，碎片不夠時不播
      G.flags['cut:' + this.id + ':' + cutName] = true;
      this.run(() => CUTS[cutName]()); return true;
    }
    const w = (this.L.warps || []).find(w => w.x === p.x && w.y === p.y);
    if (w) { this.run(() => w.to === '@ret' ? warpTo(G.ret.map, G.ret.x, G.ret.y, 'down') : warpTo(w.to, w.tx, w.ty, w.dir)); return true; }
    for (const n of this.npcs) if (n.sight && !G.defeated[n.key] && this.sees(n)) { p.cont = false; this.run(() => spotted(n)); return true; }
    if (this.tile(p.x, p.y) === 'g' || this.tile(p.x, p.y) === '&') Sound.sfx('grass');
    /* 草叢隨機遇敵：擺在最後，出口與被發現都優先於遇敵 */
    if (this.rollEncounter()) return true;
    return false;
  },
  sees(n) {
    const [dx, dy] = DIRS[n.dir], p = this.p;
    for (let i = 1; i <= n.sight; i++) { const x = n.x + dx * i, y = n.y + dy * i; if (x === p.x && y === p.y) return true; if (SOLID.has(this.tile(x, y)) || this.npcAt(x, y)) return false; }
    return false;
  },
  interact() {
    const p = this.p, [dx, dy] = DIRS[p.dir], tx = p.x + dx, ty = p.y + dy, key = tx + ',' + ty;
    const n = this.npcAt(tx, ty) || (this.tile(tx, ty) === 't' && this.npcAt(tx + dx, ty + dy)); if (n) { this.run(() => talkTo(n)); return; }
    const c = this.chestAt(tx, ty); if (c) { this.run(() => openChest(c)); return; }
    if (this.L.signs && this.L.signs[key]) { this.run(() => say(W.signs[this.L.signs[key]])); return; }
    const dw = this.L.doorWarps && this.L.doorWarps[key];
    if (dw) { this.run(() => enterDoor(dw)); return; }
    if (this.L.doors && this.L.doors[key]) { this.run(() => doorAct(this.L.doors[key], tx, ty)); return; }
    const dv = this.L.devices && this.L.devices[key]; if (dv) { this.run(() => useDevice(dv)); return; }
    const act = this.L.acts && this.L.acts[key]; if (act && ACTS[act]) { this.run(() => ACTS[act]()); return; }
    if (this.tile(tx, ty) === '~') this.run(() => say('水面波光粼粼，倒映著天空。'));
  },
  updateHud() {
    if (!Settings.hud || !G || Game.scene !== 'overworld' || !G.equip.length) { if (this.hud) { this.hud.remove(); this.hud = null; this.hudKey = ''; } return; }
    if (!this.hud || !this.hud.isConnected) { this.hud = UI.el('box mhud'); this.hudKey = ''; }
    const key = G.hp + '/' + G.maxhp + '/' + G.wenqi + '/' + G.cur;
    if (key === this.hudKey) return; this.hudKey = key;
    const r = G.hp / G.maxhp;
    this.hud.innerHTML = `<div class="mh-row"><span>氣血</span><div class="inkbar"><i class="${r <= .25 ? 'low' : ''}" style="width:${r * 100}%"></i></div></div><div class="mh-row"><span>文氣</span>${wenqiDots()}</div>`;
  },

  draw(g) {
    const p = this.p, L = this.L; if (!L) return;
    const theme = L.theme || W.theme, mw = L.rows[0].length * 16, mh = L.rows.length * 16;   // 每個城鎮有自己的配色
    const k = p.moving ? p.t : 0;
    const px = (p.moving ? p.x + (p.tx - p.x) * k : p.x) * 16, py = (p.moving ? p.y + (p.ty - p.y) * k : p.y) * 16;
    let cx = px - 112, cy = py - 72;
    cx = Math.round(mw > 240 ? clamp(cx, 0, mw - 240) : (mw - 240) / 2); cy = Math.round(mh > 160 ? clamp(cy, 0, mh - 160) : (mh - 160) / 2);
    if (this.shake > 0) { cx += Math.round((Math.random() - .5) * this.shake * 2); cy += Math.round((Math.random() - .5) * this.shake * 2); }
    const now = performance.now(), wf = Math.floor(now / 500) % 2;
    const x0 = Math.floor(cx / 16) - 1, y0 = Math.floor(cy / 16) - 1;
    GFX.setIndoor(!!L.indoor);                          // 設施磚塊的底要跟著室內／室外換
    if (L.art) ArtMap.draw(g, L.art, cx, cy);            // 美術地圖：直接畫草圖
    else for (let ty = y0; ty < y0 + 12; ty++) for (let tx = x0; tx < x0 + 17; tx++) {
      const c = this.tile(tx, ty);
      /* 水面：低兩位是波浪動畫、高位是岸線；球場：整個 fr 就是邊線；其餘：由座標決定的四種變化 */
      const fr2 = c === '~' ? (wf | (this.edgeMask(tx, ty, '~') << 2) | (((tx * 5 + ty * 11) & 3) << 6))
                : c === 'K' ? this.edgeMask(tx, ty, 'K')
                : c === 'r' ? this.edgeMask(tx, ty, 'r')                  // 地毯：3×3 拼塊
                : c === 'q' ? this.edgeMask(tx, ty, 'q')                  // 餐桌：左右接起來
                : c === '=' ? this.edgeMask(tx, ty, '=')                  // 柵欄：左右接起來
                : c === '&' ? (this.edgeMask(tx, ty, '&') | (((tx * 5 + ty * 11) & 3) << 4))   // 墨塵：邊緣遮罩＋雜訊
                : c === '#' && theme === 't_street' ? this.edgeMask(tx, ty, '#')   // 街邊大樓屋頂：3×3 拼塊
                /* 樹：鄰格遮罩＋「在這一串直的樹裡是上半還是下半」——素材的樹是兩格高（上半樹冠＋下半樹幹） */
                : c === 'T' ? treeFr(this, tx, ty)
                /* 跑道：低四位是白邊線、高位是雜訊變化 */
                : c === 'u' ? (this.edgeMask(tx, ty, 'u') | (((tx * 5 + ty * 11) & 3) << 4))
                /* 司令台：只有中段才擺講桌，整排鋪起來才不會重複 */
                : c === 'd' ? this.edgeMask(tx, ty, 'd')
                /* 路：低兩位是變化、高位是鄰格。柏油路靠它決定分向線的方向 */
                : c === ',' ? (((tx * 5 + ty * 11) & 3) | (this.edgeMask(tx, ty, ',') << 2))
                : c === ';' ? (((tx * 5 + ty * 11) & 3) | (this.edgeMask(tx, ty, ';') << 2))
                /* 室內牆：哪幾邊是房間（下／右／左），才在那一邊畫護牆板與收邊陰影 */
                : c === 'w' ? ((SOLID.has(this.tile(tx, ty + 1)) ? 0 : 1)
                             | (SOLID.has(this.tile(tx + 1, ty)) ? 0 : 2)
                             | (SOLID.has(this.tile(tx - 1, ty)) ? 0 : 4))
                : (tx * 5 + ty * 11) & 3;
      g.drawImage(GFX.tile(theme, c, fr2), tx * 16 - cx, ty * 16 - cy);
    }
    /* 夢裡的鐘：玩家在房間轉過鬧鐘之後，每一個鐘都停在那個時間 */
    if (G.flags.dreamClock != null) for (let ty = y0; ty < y0 + 12; ty++) for (let tx = x0; tx < x0 + 17; tx++) {
      const c = this.tile(tx, ty); if (c === '7' || c === ']') GFX.clockHands(g, tx * 16 - cx, ty * 16 - cy, c, G.flags.dreamClock);
    }
    /* 整棟建築跨多格：校園建築走 GFX.campus，其餘沿用舊的 GFX.building */
    for (const [kind, bx, by] of L.props || []) {
      const C = GFX.CAMPUS && GFX.CAMPUS[kind];
      const im = C ? GFX.campus(kind) : GFX.building(kind, theme);
      g.drawImage(im, bx * 16 - cx, (by - ((C && C.over) || 0)) * 16 - cy);   // over：圖往上超出 footprint 幾格
    }
    /* 看得出「從哪裡進去、從哪裡出去」（2026-10-05 試玩回饋）：
       進得去的門前面鋪地墊；走到地圖邊緣的出口畫一個會輕輕晃的箭頭 */
    for (const [k, d] of Object.entries(L.doorWarps || {})) {
      if (d.hidden) continue;                                          // 秘密入口（硯海墨池）不提示
      const [x, y] = k.split(',').map(Number);
      if (!SOLID.has(this.tile(x, y + 1))) g.drawImage(GFX.doormat(), x * 16 - cx, (y + 1) * 16 - cy);
    }
    {
      const H2 = L.rows.length, W2 = L.rows[0].length, bob = Math.round(Math.sin(now / 260) * 1.5);
      for (const w of L.warps || []) {
        const dir = exitDir(L, w);
        if (!dir) continue;
        const [ax, ay] = DIRS[dir];
        g.drawImage(GFX.exitArrow(dir), w.x * 16 - cx + ax * bob, w.y * 16 - cy + ay * bob);
      }
    }
    for (const c of L.chests || []) g.drawImage(GFX.chest(!!G.chests[c.id]), c.x * 16 - cx, c.y * 16 - cy);
    const actors = this.npcs.map(n => ({ y: n.y * 16 + n.oy, draw: () => {
      if (n.look.sprite) { const sp = GFX.anim(n.look.sprite, 'map', now) || GFX.special(n.look.sprite), sw = sp.width, sh = sp.height; const bob = Math.round(Math.sin(now / 300) * 1.5);
        g.drawImage(sp, n.x * 16 + n.ox - cx - (sw - 16) / 2, n.y * 16 + n.oy - cy - (sh - 16) - 3 + bob); }   // 依圖原尺寸畫，不拉伸；有動畫的（小墨）播四格
      else g.drawImage(GFX.person(n.look, n.dir, n.fr), n.x * 16 + n.ox - cx, n.y * 16 + n.oy - cy - 3); } }));
    const fr = p.moving ? (k < 0.5 ? (p.step % 2 ? 1 : 2) : 0) : 0;
    actors.push({ y: py, draw: () => {
      g.drawImage(GFX.person(G.player.look, p.dir, fr), px - cx, py - cy - 3 - (p.hop || 0));   // hop：過場用的跳起高度
      if (this.tile(p.moving ? p.tx : p.x, p.moving ? p.ty : p.y) === 'g' && (!p.moving || k > 0.5)) g.drawImage(GFX.tile(theme, 'g'), 0, 10, 16, 6, px - cx, py - cy + 10, 16, 6);
    } });
    actors.sort((a, b) => a.y - b.y).forEach(a => a.draw());
    /* 屋簷：建築往上超出 footprint 的那幾格（over）最後再畫一次，
       人走到屋簷下會被擋住一點（站在房子後面），不會看起來像站在屋頂上（2026-10-05 回饋） */
    for (const [kind, bx, by] of L.props || []) {
      const C = GFX.CAMPUS && GFX.CAMPUS[kind]; if (!C || !C.over) continue;
      const im = GFX.campus(kind), oh = C.over * 16;
      g.drawImage(im, 0, 0, im.width, oh, bx * 16 - cx, (by - C.over) * 16 - cy, im.width, oh);
    }
    // 任務提示：該對話的對象頭上閃爍
    const marks = questMarks();
    for (const n of this.npcs) { const m = marks[n.role === W.roles.questGiver ? 'questGiver' : n.key.split(':')[1]]; if (m) drawMark(g, n.x * 16 + n.ox - cx + 3, n.y * 16 + n.oy - cy - (n.look.sprite === 'boss' ? 28 : 15), m, now); }
    for (const [k, d] of Object.entries(this.L.devices || {})) if (!G.flags[d.flag]) { const [dx2, dy2] = k.split(',').map(Number); drawMark(g, dx2 * 16 - cx + 4, Math.max(2, dy2 * 16 - cy - 9), 'side', now); }
    for (const f of this.fx || []) f(g, cx, cy);
    /* night：序幕結束前房間是暗的（天還沒亮）。用地圖資料決定，讀檔回來也一樣暗 */
    const dk = Math.max(this.dark, L.night && !G.flags.prologue ? L.night : 0);
    if (dk > 0) { g.fillStyle = `rgba(8,6,14,${dk})`; g.fillRect(0, 0, 240, 160); }
    if (this.flash > 0) { g.fillStyle = `rgba(255,250,235,${this.flash})`; g.fillRect(0, 0, 240, 160); }
    if (this.bubble) { const n = this.bubble; const bx = n.x * 16 + n.ox - cx + 3, by = n.y * 16 + n.oy - cy - 16;
      g.fillStyle = '#2a2018'; g.fillRect(bx - 1, by - 1, 12, 13); g.fillStyle = '#fbf3dc'; g.fillRect(bx, by, 10, 11); g.fillStyle = '#b8322a'; g.fillRect(bx + 4, by + 2, 2, 5); g.fillRect(bx + 4, by + 8, 2, 2); }
  },
};
/* 目前該找誰：main 主線（黃 !）、side 可接支線（藍 !）、report 可回報（黃 ?） */
function storyStage() { return G.badges.length; }
const roleKey = r => { for (const [k, L] of Object.entries(LAYOUTS)) if ((L.npcs || []).some(s => s.role === r)) return k + ':' + r; return r; };
const isDone = r => !!G.defeated[roleKey(r)];
const roleReady = r => { const R = W.roles[r]; return !R.needDefeated || R.needDefeated.every(k => G.defeated[k]); };
function questMarks() {
  const m = {};
  if (W.story) {
    if (!G.flags.prologue) return m;
    const st = W.stages[storyStage()]; if (st) for (const r of st.roles) if (!isDone(r) && roleReady(r)) m[r] = 'main';
    return m;
  }
  if (!G.equip.length) m.mentor = 'main';
  else if (!G.defeated['route1:rival'] && !G.flags.rivalGone) m.rival = 'main';
  else if (!G.badges.length) { m.gymguide = 'main'; m.gym1 = 'main'; m.rivalA = 'main'; m.rivalB = 'main'; }
  const q = G.quests.bugs;
  if (!q || q.state === 'none') m.questGiver = 'side'; else if (q.state === 'active' && q.n >= 3) m.questGiver = 'report';
  return m;
}
const GLYPH = { '!': ['..#..', '..#..', '..#..', '..#..', '.....', '..#..'], '?': ['.###.', '#...#', '...#.', '..#..', '.....', '..#..'] };
/* 只在人物頭上標示：黃「！」主線、藍「！」支線、黃「？」可回報。
   地圖上的出入口不再標箭頭（玩家說看不懂，而且路本身就看得出來）。 */
function drawMark(g, x, y, type, now, dir) {
  const blink = (Math.sin(now / 180) + 1) / 2; if (blink < 0.15) return;
  const bob = Math.round(Math.sin(now / 250) * 1.2); y += bob;
  g.globalAlpha = 0.6 + 0.4 * blink;
  const col = type === 'side' ? '#4aa0f0' : '#f8c830';
  g.fillStyle = '#2a2018'; g.fillRect(x, y, 8, 8); g.fillRect(x + 3, y + 8, 2, 2);
  g.fillStyle = col; g.fillRect(x + 1, y + 1, 6, 6); g.fillRect(x + 3, y + 7, 1, 2);
  g.fillStyle = '#2a2018'; g.fillRect(x + 3, y + 2, 2, 3); g.fillRect(x + 3, y + 6, 2, 1);
  if (type === 'report') { g.fillStyle = col; g.fillRect(x + 3, y + 2, 2, 3); g.fillStyle = '#2a2018'; g.fillRect(x + 2, y + 2, 3, 1); g.fillRect(x + 4, y + 3, 1, 1); g.fillRect(x + 3, y + 4, 1, 1); g.fillRect(x + 3, y + 6, 1, 1); }
  g.globalAlpha = 1;
}
const wenqiDots = () => `<span class="wq">${Array.from({ length: ULT_COST }, (_, i) => `<i class="${i < G.wenqi ? 'on' : ''}"></i>`).join('')}</span>`;
/* 支線Ａ要點醒的三個人：以任務人物的資料為準，換地圖時只要改一個地方 */
/* 樹的 fr：低 4 位鄰格遮罩；第 4 位＝這格是一棵高樹的下半；第 5 位＝下面還有樹（可以當上半）；第 6 位＝這一欄種圓樹
   從這一串直的樹最上面那格往下數，偶數格當上半、奇數格當下半，兩格湊成一棵完整的樹。 */
function treeFr(ow, x, y) {
  const L = ow.L, isT = (a, b) => b >= 0 && b < L.rows.length && a >= 0 && a < L.rows[0].length && ow.tile(a, b) === 'T';
  let k = 0; while (isT(x, y - k - 1)) k++;
  return ow.edgeMask(x, y, 'T') | ((k & 1) << 4) | ((isT(x, y + 1) ? 1 : 0) << 5) | (0 << 6);   // 第 6 位（圓樹）不用了：圍起來的樹統一用松樹
}
/* 出口箭頭的方向：在地圖邊緣就朝外；不在邊緣的（開著的校門、樓梯）朝「擋住的那一邊」 */
function exitDir(L, w) {
  const H = L.rows.length, Wd = L.rows[0].length;
  if (w.y === 0) return 'up'; if (w.y === H - 1) return 'down'; if (w.x === 0) return 'left'; if (w.x === Wd - 1) return 'right';
  const at = (x, y) => (L.rows[y] || '')[x];
  const blocked = (x, y) => { const c = at(x, y); return c === undefined || SOLID.has(c); };
  for (const d of ['down', 'up', 'left', 'right']) {
    const [dx, dy] = DIRS[d];
    if (blocked(w.x + dx, w.y + dy) && !blocked(w.x - dx, w.y - dy)) return d;
  }
  return null;
}
function sideANeed() { const R = W.roles.sideAGiver; return (R && R.need) || ['r4:m1', 'r4:m2', 'r4:m3']; }
function gateOpen(gate) {
  if (gate === 'needWeapon') return G.equip.length > 0;
  if (gate === 'sideA') return sideANeed().every(k => G.defeated[k]);
  if (gate === 'sideB') return !!G.flags.sideB;
  if (gate === 'prologue') return !!G.flags.prologue;
  const m = /^need(\d)$/.exec(gate); if (m) return G.badges.length >= +m[1];
  return false;
}

/* ---------- 腳本 ---------- */
async function warpTo(map, x, y, dir) {
  if (!LAYOUTS[map]) {                       // 地圖重建期間：還沒做到的地方先擋住
    Sound.sfx('bump');
    await say(`（「${(W.mapNames && W.mapNames[map]) || map}」還在重新設計中，暫時走不過去。）`);
    return;
  }
  Sound.sfx('door'); await fade(1, 0.22); OW.load(map, x, y, dir); autosave(); await sleep(60); await fade(0, 0.22);
  if (LAYOUTS[map].tutorial && G.flags.tut === 'pending') {   // 教學戰在有 tutorial 標記的地圖入口進行（城鎮裡不戰鬥）
    G.flags.tut = 'done'; const M = W.roles.mentor.name;
    await say('就在這裡練習吧！', M);
    await Battle.start({ kind: 'wild', foe: makeFoe('pen_auto', 2), tutorial: true, mentor: M });
  }
}
async function enterDoor(dw) {
  if (dw.need === 'stone') {
    if (!G.flags.stoneAwake) {
      const has = GUARDIAN_FIRST.every(k => ownsArch(k));
      const carried = GUARDIAN_FIRST.every(k => G.equip.map(id => wById(id)).some(w => w && w.arch === k));
      if (!G.ng) { Sound.sfx('bump'); await say(W.gates.stone); return; }
      if (!has) { Sound.sfx('bump'); await say('（泉眼靜靜地冒著墨色的泡。）\n小墨的話又響起來：「要先把筆、紙、墨三隻器靈都收齊。」'); return; }
      if (!carried) { Sound.sfx('bump'); await say('（泉眼微微震了一下，又安靜下來。）\n「……三隻器靈都要帶在身上才行。」（請到選單的「武器」把三隻器靈都放進攜帶欄）'); return; }
      Sound.sfx('badge'); s_flash();
      await say('（你把筆靈、紙靈、墨靈一起舉到泉眼前——三道光落進墨色的水裡。）');
      await say('（泉水劇烈翻湧，從底下傳來一個很老很老的聲音。）');
      await say('「……三寶齊聚，硯海當開。」');
      G.flags.stoneAwake = true; autosave();
      await say('（牆角的墨漬裂開了一條路。）');
    }
    if (!G.flags.inkpoolFound) { G.flags.inkpoolFound = true; await say('（泉眼下的墨漬漾開，露出一條通往地下的路——這裡就是傳說中的「硯海墨池」！）'); } }
  else if (dw.needFlag && !G.flags[dw.needFlag]) { Sound.sfx('bump'); await say(dw.flagText || '（現在還不能進去。）'); return; }
  else if (dw.need && G.badges.length < dw.need) {
    Sound.sfx('bump');
    /* 沒寫 gate 就從 need 推出來（need: 2 → 'need2'），再沒有就用通用句，
       免得 say(undefined) 在畫面上印出「undefined」 */
    const key = dw.gate || (typeof dw.need === 'number' ? 'need' + dw.need : dw.need);
    await say((W.gates && W.gates[key]) || `（這裡需要 ${dw.need} 片碎片才進得去。）`);
    return;
  }
  if (dw.ret) G.ret = { map: OW.id, x: dw.ret.x, y: dw.ret.y };
  await warpTo(dw.to, dw.tx, dw.ty, dw.dir);
}
async function goHome() {
  if (!(await UI.yesno('要回到主畫面嗎？\n（目前進度會自動儲存）'))) return;
  autosave(); await fade(1, 0.3); titleScreen(); await fade(0, 0.3);
}
async function useDevice(d) {
  if (G.flags[d.flag]) { await say(d.doneText || '（這裡的機關已經解開了。）'); return; }
  await say(d.text);
  const q = QB.draw([d.cat], clamp((OW.L.qlv || 1) + (G.ng || 0), 1, 3), clamp(1 + (G.ng || 0), 1, 3));   // 二週目機關題也變難
  if (!q) { await say('（題庫裡還沒有這類題目，機關自行解開了。）'); G.flags[d.flag] = true; await afterDevice(d); return; }
  const tries = (G.devTry = G.devTry || {});
  const n = tries[d.flag] = (tries[d.flag] || 0) + 1;
  if (n >= 2) await say(`（這個機關已經試過 ${n - 1} 次了。想一想剛才的解析，或用「${itemName('hint')}」刪掉錯的選項。）`);
  const r = await UI.question(q, { move: d.label, mode: 'device', hint: true });
  if (!r.correct) {
    await say(d.fail || '……好像不是這樣。');
    await say('（這一題已經收進「錯題本」了，可以在選單裡複習，之後再回來挑戰這個機關。）');
    return;
  }
  G.flags[d.flag] = true; Sound.sfx('ok');
  await say(d.ok);
  await afterDevice(d);
}
/* ============ 過場：三塊碎片湊齊，硯海龍君從墨池裡升起 ============ */
async function spiritRise() {
  const role = W.roles.stoneSpirit; if (!role) return;
  Sound.play('boss');
  await Anim.run(0.5, k => OW.dark = k * .55);
  await say('（墨池的水一圈一圈往中央捲，露出池底的一方巨硯。）');

  const tx = 8 * 16 + 8, ty = 6 * 16 + 8;
  const from = [[2, 2], [15, 2], [2, 10]].map(([x, y]) => [x * 16 + 8, y * 16 + 8]);
  let t = 0;
  OW.fx.push((g, cx, cy) => {                                   // 三道碎片之光飛向島嶼
    for (const [fx, fy] of from) {
      const x = fx + (tx - fx) * t, y = fy + (ty - fy) * t - Math.sin(t * Math.PI) * 14;
      g.fillStyle = `rgba(255,244,214,${1 - t * .25})`;
      g.fillRect(Math.round(x - cx) - 1, Math.round(y - cy) - 1, 3, 3);
    }
  });
  Sound.sfx('ball');
  await Anim.run(0.9, k => { t = k; });
  OW.fx.length = 0;
  Sound.sfx('badge'); OW.flash = .8;
  await Anim.run(0.45, k => OW.flash = .8 * (1 - k));
  OW.flash = 0;

  const n = { key: 'inkpool:stoneSpirit', role, x: 8, y: 6, dir: 'down', home: 'down',
              sight: 0, ox: 0, oy: 26, fr: 0, look: role.look };
  OW.npcs.push(n);
  let ripple = 0;
  OW.fx.push((g, cx, cy) => {                                   // 水面漣漪
    if (ripple <= 0) return;
    g.strokeStyle = `rgba(206,228,255,${Math.max(0, 1 - ripple / 44)})`; g.lineWidth = 1;
    g.beginPath(); g.ellipse(tx - cx, ty + 9 - cy, ripple, ripple * .4, 0, 0, 7); g.stroke();
  });
  await Anim.run(1.1, k => { n.oy = Math.round(26 * (1 - k)); ripple = k * 46; OW.shake = k < .8 ? 1.2 : 0; });
  n.oy = 0; OW.shake = 0; OW.fx.length = 0;
  await Anim.run(0.5, k => OW.dark = .55 * (1 - k));
  OW.dark = 0;
  for (const t2 of (role.riseLines || [])) await say(t2, t2.startsWith('（') ? undefined : role.name);
  autosave();
}

async function afterDevice(d) {
  const all = Object.values(OW.L.devices).filter(x => x.group === d.group);
  if (!all.every(x => G.flags[x.flag])) return;
  const last = all.find(x => x.onAll) || d;                 // 整組完成的效果寫在其中一個機關上
  await say(last.allText || d.allText || '機關全部解開了！');
  const open = last.open || d.open;
  if (open) { for (const [x, y] of open) G.opened[OW.id + ':' + x + ',' + y] = '_'; Sound.sfx('badge'); }
  if (last.onAll) { G.flags[last.onAll] = true; autosave(); }
  if (last.onAll === 'shardsAll' && OW.id === 'inkpool') await spiritRise();   // 硯海龍君現身
}
async function talkTo(n) {
  const R = n.role; n.dir = OPP[OW.p.dir];
  switch (R.kind) {
    case 'mentor': return mentorTalk(n);
    /* 同一個 kind 兩種人：有 gq 的是器靈本體（要打一場），沒有的是小墨（守在禮堂）。
       以前這裡寫了兩個 case 'guardian'，第二個永遠跑不到，小墨被當成器靈 → 丟例外，大魔王永遠解不開。 */
    case 'guardian': return n.retry ? guardianRetry(n) : n.role.gq ? guardianSpirit(n) : guardianTalk(n);
    case 'trainer': case 'rival': case 'gym': return trainerTalk(n);
    case 'quest': return questTalk(n);
    case 'rematch': return rematchTalk(n);
    case 'spirit': return spiritTalk(n);
    case 'bus': return busTalk(n);
    case 'quest2': return sideQuestTalk(n);
    case 'roamer': return roamerTalk(n);
    case 'roam': return roamHintTalk(n);
    case 'guide': { const L = R.lines[Math.min(storyStage(), R.lines.length - 1)]; await say(L.join('\n\n'), R.name); return; }
    case 'healer': {
      Sound.sfx('door'); await say(R.text); G.hp = G.maxhp;
      if (G.ret) G.lastHeal = { map: G.ret.map, x: G.ret.x, y: G.ret.y };
      Sound.sfx('heal'); await say('（氣血全滿了！）'); autosave(); n.dir = n.home; return; }
    case 'shop': await say(R.text); await Shop.open((G.ret && LAYOUTS[G.ret.map].shop) || ['heal', 'hint']); n.dir = n.home; return;
    case 'smith': await say(R.lines.join('\n\n'), R.name); await Forge.open(); n.dir = n.home; return;
    case 'gift': {                                   // 送禮物（只送一次）
      const key = 'gift:' + n.key;
      if (G.flags[key]) { await say(R.after || '（東西收好了嗎？）', R.name); n.dir = n.home; return; }
      for (const t of R.lines) await say(t, R.name);
      const got = [];
      for (const [id, num] of Object.entries(R.items || {})) { G.bag[id] += num; got.push(`「${itemName(id)}」×${num}`); }
      if (R.money) { G.money += R.money; got.push(`${R.money} 文`); }
      G.flags[key] = true; Sound.sfx('badge'); autosave();
      await say(`${G.player.name} 收到了 ${got.join('、')}！`);
      n.dir = n.home; return; }
    case 'quiz': {                                   // 答對送道具（每個 NPC 只送一次，但可以重答）
      const key = 'quiz:' + n.key;
      if (G.flags[key]) { await say(R.after || '（謝謝你陪我聊天。）', R.name); n.dir = n.home; return; }
      for (const t of R.lines) await say(t, R.name);
      if (!(await UI.yesno(R.ask || '要回答看看嗎？'))) { await say(R.no || '（隨時歡迎回來。）', R.name); n.dir = n.home; return; }
      const q = QB.draw([R.cat], clamp((OW.L.qlv || 1) + (G.ng || 0), 1, 3), 1);
      if (!q) { await say('（題庫裡還沒有這類題目。）'); n.dir = n.home; return; }
      const r = await UI.question(q, { move: R.name, mode: 'device', hint: true });
      if (!r.correct) { await say(R.wrong || '……再想想看。這題收進錯題本了，想通再回來。', R.name); n.dir = n.home; return; }
      const got = [];
      for (const [id, num] of Object.entries(R.items || {})) { G.bag[id] += num; got.push(`「${itemName(id)}」×${num}`); }
      if (R.money) { G.money += R.money; got.push(`${R.money} 文`); }
      G.flags[key] = true; Sound.sfx('badge'); autosave();
      await say(R.win || '答對了！', R.name);
      await say(`${G.player.name} 收到了 ${got.join('、')}！`);
      n.dir = n.home; return; }
    default: await say(R.lines.join('\n\n'), R.name); n.dir = n.home;
  }
}
/* 公車站：可以直接前往已經到過的城鎮 */
const BUS_STOPS = [
  { map: 'chendu', x: 10, y: 13, name: '晨讀村' }, { map: 'zhuyin', x: 4, y: 9, name: '注音坡' },
  { map: 'chaoshu', x: 14, y: 6, name: '抄書巷' }, { map: 'dianji', x: 6, y: 10, name: '典籍港' },
  { map: 'tingyu', x: 6, y: 13, name: '聽雨亭' }, { map: 'huanan', x: 4, y: 13, name: '花南街' },
  { map: 'beilin', x: 6, y: 9, name: '碑林關' }, { map: 'moquan', x: 6, y: 10, name: '墨泉鄉' },
  { map: 'zhongta', x: 6, y: 13, name: '鐘塔台' },
];
async function busTalk(n) {
  const R = n.role;
  G.visited = G.visited || {}; G.visited[OW.id] = 1;
  const list = BUS_STOPS.filter(b => G.visited[b.map] && b.map !== OW.id);
  if (!list.length) { await say('（你還沒去過其他城鎮，先沿著路線走走看吧。）', R.name); return; }
  await say(R.lines[0], R.name);
  const k = await UI.ask('要去哪一個城鎮？', list.map(b => b.name).concat(['算了']));
  if (k < 0 || k >= list.length) return;
  const b = list[k];
  Sound.sfx('door'); await say(`（搭上公車，前往${b.name}……）`);
  await warpTo(b.map, b.x, b.y, 'down');
  G.lastHeal = { map: b.map, x: b.x, y: b.y };
  autosave();
}
/* 支線任務（分組報告、遺失的准考證） */
async function sideQuestTalk(n) {
  const R = n.role, key = 'sq:' + n.key;
  const done = R.need ? R.need.every(k => G.defeated[k]) : !!G.flags[R.needFlag];
  if (G.flags[key]) { await say(R.after, R.name); return; }
  if (!done) { await say(G.flags[key + ':got'] ? R.progress : R.offer, R.name); G.flags[key + ':got'] = true; autosave(); return; }
  G.flags[key] = true; Sound.sfx('badge');
  await say(R.done, R.name);
  const P = R.prize || {};
  if (P.money) G.money += P.money;
  if (P.items) for (const id in P.items) G.bag[id] += P.items[id];
  await say(`得到了 ${P.money} ${W.money}${P.items ? '、' + Object.entries(P.items).map(([id, c]) => `「${itemName(id)}」×${c}`).join('、') : ''}！`);
  autosave();
}
/* 器靈現在會待在某一張地圖，鎮上的小孩會告訴你在哪 */
const ROAM_MAPS = ['chendu', 'r1', 'zhuyin', 'r2', 'chaoshu', 'r3', 'dianji', 'r4', 'tingyu', 'huanan', 'r5', 'beilin', 'r6', 'moquan', 'zhongta'];
function rerollRoam() { const all = W.roamMaps || ROAM_MAPS, pool = all.filter(m => m !== OW.id); G.roamAt = pick(pool.length ? pool : all); }
async function roamHintTalk(n) {
  const R = n.role;
  if (!G.ng) { await say(pick(R.idle), R.name); return; }
  const left = GUARDIAN_FIRST.filter(k => !ownsArch(k));
  if (!left.length) { await say(R.none, R.name); return; }
  if (!G.roamAt || !LAYOUTS[G.roamAt]) rerollRoam();
  await say(R.found.replace('{map}', W.mapNames[G.roamAt] || G.roamAt), R.name);
}
/* 二週目：在城鎮與路線上漫遊的器靈（筆靈／紙靈／墨靈） */
async function roamerTalk(n) {
  const a = n.arch;
  await say(`（空氣突然安靜下來——${weaponName(a)}出現了！）`);
  await say(ARCH[a].gdesc || '');
  const role = { kind: 'gym', name: weaponName(a), look: { sprite: a }, reward: 900,
    win: `（${weaponName(a)}輕輕落在你手上。）`,
    foe: { lv: clamp(G.lv, 16, 30), hpMul: 1.5, el: 'none', race: ARCH[a].race, cats: ALL_CATS,
      moves: [['器靈之威', ALL_CATS, 56], ['文心一擊', ALL_CATS, 60]] }, potions: 1 };
  const res = await Battle.start({ kind: 'gym', foe: makePersonFoe(role), role, cats: ALL_CATS });
  OW.npcs = OW.npcs.filter(x => x !== n);
  rerollRoam();
  if (res !== 'win') { await say(`（${weaponName(a)}消失在空氣裡……牠跑到別的地方去了。）`); autosave(); return; }
  await Guardian.give(a);
  if (G.ng > 0 && !G.flags.stoneAwake && GUARDIAN_FIRST.every(k => ownsArch(k)))
    await say('（筆、紙、墨三隻器靈都在你身上了……小墨說過，要帶著牠們去墨泉鄉的泉眼。）');
  autosave();
}
/* 二週目：硯海龍君——先答題才能挑戰，戰鬥中牠有機率直接逃走 */
async function spiritTalk(n) {
  const R = n.role;
  await say(R.appear);
  await say(R.quiz, R.name);
  let passed = false;
  for (let t = 0; t < 2 && !passed; t++) {
    const q = QB.draw(R.foe.cats, 3, clamp(1 + (G.ng || 0), 1, 3));
    if (!q) { passed = true; break; }
    const r = await UI.question(q, { move: '硯海試煉', mode: 'device', hint: true });
    if (r.correct) { passed = true; break; }
    if (t === 0) await say('硯海龍君瞇起眼睛：「……再一題。」', R.name);   // 答錯給第二次機會
  }
  if (!passed) { await say(R.wrong); await respawnSpirit(n); return; }
  await say('（硯海龍君點了點頭。）');
  await say(R.intro, R.name);
  const role = Object.assign({}, R, { foe: Object.assign({}, R.foe, { lv: clamp(G.lv, R.foe.lv, 34) }) });
  const res = await Battle.start({ kind: 'gym', foe: makePersonFoe(role), role, cats: role.foe.cats, fleeRate: R.fleeRate });
  if (res === 'flee') { await say(R.fleeMsg); await respawnSpirit(n); return; }
  if (res !== 'win') return;
  G.money += R.reward;
  await Guardian.give('g_stone');
  OW.npcs = OW.npcs.filter(x => x !== n);
  await say(R.after);
  autosave();
  if (G.ng > 0 && G.badges.length >= 5) await StoryEnding.allDone();   // 二週目＋四寶到齊＝全部完成
}
async function respawnSpirit(n) {
  OW.npcs = OW.npcs.filter(x => x !== n);
  await sleep(300); OW.spawnSpirit(); Sound.sfx('alert');
  autosave();
}
/* ============================================================
   守護神器任務
   ------------------------------------------------------------
   走到鐘塔台道館門口 → 小墨衝出來擋下你，講守護神器的故事，
   問你一個問題；答案決定要去哪裡找哪一隻器靈。
   到那裡打贏牠之後，可以決定要不要請牠並肩作戰。
   決定完（收服或婉拒）才進得了道館。
   ============================================================ */
const GQ_CLUE = {
  g_pen:   { where: 'c8',     place: '晨讀教室',
    clue: '「去你第一次把心裡的話寫下來的地方——那間早自習的教室。」' },
  g_paper: { where: 'tingyu', place: '聽雨亭',
    clue: '「去那個雨一直下、可以把心事攤開來晾乾的地方——聽雨亭。」' },
  g_ink:   { where: 'moquan', place: '墨泉鄉',
    clue: '「去那個把墨磨了幾百年的地方——墨泉鄉的泉眼旁邊。」' },
};
/* 世界可以覆寫器靈的地點（校園版用） */
const gqClue = arch => (W.gqClue && W.gqClue[arch]) || GQ_CLUE[arch];
/* 過場要幾片碎片才會播 */
const CUT_NEED = { moIntro: 4 };
const CUTS = {
  /* 鐘塔台道館門口：小墨從道館裡面跑出來擋住你 */
  async moIntro() {
    const M = '小墨';
    const L = OW.L;
    /* 從地圖資料找出道館那扇門，小墨就是從那裡跑出來的 */
    const doorKey = Object.keys(L.doorWarps || {}).find(k => (L.doorWarps[k].needFlag === 'guardianDone'));
    const [dx, dy] = (doorKey || '14,5').split(',').map(Number);
    const p = OW.p;

    await say('（你正要走上禮堂的台階——）');
    /* 門「碰」地被推開 */
    Sound.sfx('door'); OW.shake = 3;
    await Anim.run(0.25, k => OW.shake = 3 * (1 - k)); OW.shake = 0;
    await Anim.run(0.30, k => OW.dark = k * 0.35);

    /* 小墨從門後冒出來，再一路跑到你面前停住 */
    const mo = { key: 'cut:xiaomo', role: { name: M }, x: dx, y: dy, dir: 'down',
                 home: 'down', sight: 0, ox: 0, oy: 0, fr: 0, look: { sprite: 'xiaomo' } };
    OW.npcs.push(mo);
    try {
      mo.oy = 15;                                            // 先整隻藏在門後面
      Sound.sfx('alert');
      await Anim.run(0.30, k => { mo.oy = Math.round(15 - 13 * k); });    // 從門縫探出來
      /* 玩家被嚇得往後跳一格 —— 空出來的那一格才是小墨的落點，兩個人才不會疊在一起 */
      const [pdx, pdy] = DIRS[p.dir] || [0, -1];
      const bx = p.x - pdx, by = p.y - pdy;
      const landX = p.x, landY = p.y;
      const canHop = !OW.solid(bx, by) && !(OW.L.warps || []).some(w => w.x === bx && w.y === by)
                     && !(OW.L.cuts && OW.L.cuts[bx + ',' + by]);
      if (canHop) {
        Sound.sfx('bump');
        p.moving = true; p.tx = bx; p.ty = by; p.t = 0;
        await Anim.run(0.30, k => { p.t = k; p.hop = Math.round(Math.sin(k * Math.PI) * 6); });
        p.x = bx; p.y = by; p.moving = false; p.t = 0; p.hop = 0;
        G.x = p.x; G.y = p.y;
      }
      /* 小墨從門口一跳，落在玩家原本站的那一格，正對著你 */
      Sound.sfx('bump');
      const fromX = dx * 16, fromY = dy * 16, toX = landX * 16, toY = landY * 16;
      await Anim.run(0.40, k => {
        mo.ox = Math.round((toX - fromX) * k);
        mo.oy = Math.round(2 + (toY - fromY - 2) * k - Math.sin(k * Math.PI) * 10);
      });
      mo.x = landX; mo.y = landY; mo.ox = 0; mo.oy = canHop ? 0 : 6; mo.dir = 'down';
      Sound.sfx('ok'); OW.shake = 2.5;
      const rest = mo.oy;
      await Anim.run(0.22, k => { OW.shake = 2.5 * (1 - k); mo.oy = rest - Math.round(Math.sin(k * Math.PI) * 2); });
      mo.oy = rest; OW.shake = 0;
      await Anim.run(0.30, k => OW.dark = 0.35 * (1 - k)); OW.dark = 0;

      await say('（小墨從禮堂的門裡衝了出來，一路蹦到你面前，張開雙手擋住台階。）');
      for (const t of (W.moIntro || [])) await say(t, M);
      await CUTS._moAsk(M);
    } finally {
      OW.npcs = OW.npcs.filter(n => n !== mo); OW.dark = 0; OW.shake = 0;
      p.hop = 0; p.moving = false; p.t = 0;
    }
  },
  /* 問題與線索（從 moIntro 拆出來，動畫結束後才問） */
  async _moAsk(M) {
    const k = await UI.ask(
      '小墨：「那我問你——把心裡的話留下來，最要緊的是哪一件事？」',
      ['動筆的勇氣', '攤開來面對', '沉住氣慢慢磨'],
      { name: M, cancel: false });
    const arch = ['g_pen', 'g_paper', 'g_ink'][k] || 'g_pen';
    G.flags.guardianQuest = arch;
    const C = gqClue(arch);
    await say((W.moPick && W.moPick[k]) || '小墨：「……我就知道你會這樣說。」', M);
    await say(`小墨：「那牠會在那裡等你。」\n${C.clue}`, M);
    await say(`（目標：到「${C.place}」找「${weaponName(arch)}」。）\n（決定好之後再回來挑戰道館。）`);
    autosave();
  },
};
/* 器靈本體：打贏之後由玩家決定要不要請牠同行 */
async function guardianSpirit(n) {
  const arch = n.role.gq, nm = weaponName(arch);
  await say(`（空氣一沉——「${nm}」從光裡凝出形體。）`);
  await say(ARCH[arch].gdesc || GUARDIANS[arch].desc || '');
  await say('（牠沒有要直接跟你走的意思——牠在等你證明自己。）');
  const role = { kind: 'gym', name: nm, look: { sprite: arch }, reward: 800,
    win: `（${nm}收起光芒，靜靜地停在你面前。）`,
    foe: { lv: clamp(G.lv, 16, 30), hpMul: 1.5, el: 'none', race: ARCH[arch].race, cats: ALL_CATS,
      moves: [['器靈之威', ALL_CATS, 54], ['文心一擊', ALL_CATS, 58]] }, potions: 1 };
  const res = await Battle.start({ kind: 'gym', foe: makePersonFoe(role), role, cats: ALL_CATS });
  if (res !== 'win') { await say(`（${nm}的光暗了下來……牠還會在這裡等你。）`); autosave(); return; }
  /* 打贏了，但要不要並肩作戰是玩家決定 */
  await say(`（${nm}沒有離開。牠停在半空中，像在等你開口。）`);
  const yes = await UI.yesno(`要請「${nm}」與你並肩作戰嗎？`);
  if (!yes) {
    await say(`（你搖搖頭。${nm}輕輕點了一下，退回光裡。）`);
    await say('（牠會留在這裡。想通了再回來找牠。）');
    G.flags.guardianDone = true; autosave(); return;      // 婉拒也算做完決定
  }
  const w = await Guardian.give(arch);
  if (!w) await say(`（${nm}化成一道光，落回你身上——牠本來就認得你。）`);
  G.flags.guardianDone = true;
  OW.npcs = OW.npcs.filter(x => x !== n);
  await say('（可以回鐘塔台了。小墨在那裡等你。）');
  autosave();
}
/* 周以恆②之後現身、但上次打輸的器靈：再挑戰一次 */
async function guardianRetry(n) {
  await say(`（「${weaponName(n.role.gq)}」還在這裡，靜靜地等著你。）`);
  const r = await Guardian.firstMeet();
  if (r !== 'lose') OW.npcs = OW.npcs.filter(x => x !== n);
}
/* 決戰前：對話選擇後，文房四寶中的一隻現身 */
async function guardianTalk(n) {
  const R = n.role, M = R.name;
  /* 禮堂裡、三位菁英都倒下之後：小墨最後的叮嚀，聽完大魔王才會現身 */
  if (G.defeated[n.key]) { await say(R.after, M); return; }
  if (R.needDefeated && R.needDefeated.every(k => G.defeated[k])) {
    for (const t of R.lines) await say(fmt(t), M);
    const k = await UI.ask(R.choice.q, R.choice.opts, { name: M, cancel: false });
    await say(R.choice.replies[k === 1 ? 1 : 0], M);
    const a = G.flags.guardianQuest;
    await say(a && ownsArch(a) ? R.afterGive : '別怕。你已經自己做過一次決定了。', M);
    G.defeated[n.key] = true; autosave(); return;
  }
  const arch = G.flags.guardianQuest;
  if (!arch) { await say('小墨：「先到門口看看吧，我有話要跟你說。」', M); return; }
  const C = gqClue(arch);
  if (ownsArch(arch)) { await say(`小墨：「${weaponName(arch)}願意跟你走了啊……那就沒問題了。」`, M); await say(R.afterGive || '小墨：「上去吧，我在這裡等你。」', M); return; }
  if (G.flags.guardianDone) { await say('小墨：「你自己決定的，我不多說。」', M); await say('小墨：「上去吧——記得，答不出來的時候就深呼吸。」', M); return; }
  await say(`小墨：「還沒去嗎？${C.clue}」`, M);
  await say(`（目標：到「${C.place}」找「${weaponName(arch)}」。）`, undefined);
}
/* 通關後的再戰：等級會跟著玩家成長 */
async function rematchTalk(n) {
  const R = n.role;
  if (!G.equip.length) { await say('……你手上沒有武器？先到選單的「武器」帶一把在身上吧。', R.name); return; }   // 跟對手一樣先擋：沒武器開戰會出錯
  for (const t of R.lines) await say(fmt(t), t.startsWith('（') ? undefined : R.name);
  const k = await UI.ask(R.ask, ['好，來吧！', '下次吧'], { name: R.name });
  if (k !== 0) { await say(R.no, R.name); return; }
  const role = Object.assign({}, R, { foe: Object.assign({}, R.foe, { lv: Math.max(R.foe.lv, G.lv + 2) }) });
  const res = await Battle.start({ kind: 'gym', foe: makePersonFoe(role), role, cats: role.foe.cats });
  if (res !== 'win') return;
  const P = R.prize || {};
  if (P.frags) { const keys = ARCH_ORDER.filter(a => ARCH[a].ch <= 5); for (let i = 0; i < P.frags; i++) { const a = pick(keys); G.frags[a] = (G.frags[a] || 0) + 1; } }
  if (P.items) for (const id in P.items) G.bag[id] += P.items[id];
  Sound.sfx('badge');
  await say(`得到了${P.frags ? ` 隨機碎片 ×${P.frags}` : ''}${P.items ? `、${Object.entries(P.items).map(([id, n2]) => `「${itemName(id)}」×${n2}`).join('、')}` : ''}！`);
  autosave();
}
async function mentorTalk(n) {
  const R = n.role;
  if (G.equip.length) { G.hp = G.maxhp; Sound.sfx('heal'); await say(R.later, R.name); return; }
  await say(R.intro, R.name);
  const arch = await WeaponPick.open();
  giveWeapon(arch, 0); G.cur = 0; playerStats(); G.hp = G.maxhp;
  Sound.sfx('badge'); await say(`${G.player.name} 得到了「${weaponName(arch)}」！`);
  G.bag.heal += 3; G.bag.hint += 2;
  await say(`${R.name} 還送給你「${itemName('heal')}」×3、「${itemName('hint')}」×2！`);
  const t = await UI.ask('要不要先來一場練習，熟悉一下戰鬥方式？', ['好，來練習！', '不用了，直接出發'], { name: R.name });
  if (t === 0) { G.flags.tut = 'pending'; await say(R.practice, R.name); }
  else { G.flags.tut = 'skip'; await say('那就出發吧！記得：答對才打得中，找出敵人的弱點題型！', R.name); }
  autosave();
}
function giveWeapon(arch, r = 0) {
  const w = newWeapon(arch, r);
  Meta.seeWeapon(G.world, arch, r);
  addWeapon(w);
  if (!w.toBox && G.equip.length < 3) G.equip.push(w.id);
  return w;
}
async function spotted(n) {
  Sound.sfx('alert'); OW.bubble = n; await sleep(650); OW.bubble = null;
  const p = OW.p, [dx, dy] = DIRS[n.dir];
  while (Math.abs(p.x - n.x) + Math.abs(p.y - n.y) > 1) {
    let st = 0; await Anim.run(0.2, k => { n.ox = dx * 16 * k; n.oy = dy * 16 * k; n.fr = k < .5 ? (st % 2 ? 1 : 2) : 0; });
    n.x += dx; n.y += dy; n.ox = n.oy = 0; n.fr = 0; st++;
  }
  p.dir = OPP[n.dir]; await trainerTalk(n);
}
/* ============ 過場：三位菁英倒下後，總複習大魔王從天而降 ============ */
async function bossEntrance() {
  const L = OW.L; if (!L || !L.npcs) return;
  const spec = L.npcs.find(s => s.cut === 'bossDrop' && s.after && s.after.every(k => G.defeated[k]));
  if (!spec) return;
  const flag = 'cut:' + OW.id + ':' + spec.role;
  if (G.flags[flag]) return;
  const role = W.roles[spec.role]; if (!role) return;
  G.flags[flag] = true;

  await say('（三位菁英倒下了。禮堂忽然安靜下來。）');
  await Anim.run(0.6, k => OW.dark = k * 0.72);                     // 燈光全滅
  Sound.play('boss');
  await say('（講台正上方的天花板……裂開了一道縫。）');

  const tx = spec.x * 16 + 8, ty = spec.y * 16 + 14;
  let sr = 0, ring = -1;
  OW.fx.push((g, cx, cy) => {                                        // 地面陰影逐漸放大
    if (sr <= 0) return;
    g.fillStyle = 'rgba(0,0,0,.5)';
    g.beginPath(); g.ellipse(tx - cx, ty - cy, sr, sr * .4, 0, 0, 7); g.fill();
  });
  OW.fx.push((g, cx, cy) => {                                        // 落地衝擊波
    if (ring < 0) return;
    g.strokeStyle = `rgba(255,238,196,${Math.max(0, 1 - ring / 64)})`; g.lineWidth = 2;
    g.beginPath(); g.ellipse(tx - cx, ty - cy, ring, ring * .38, 0, 0, 7); g.stroke();
  });
  await Anim.run(0.8, k => { sr = 2 + k * 15; OW.shake = k * 1.5; });

  const n = { key: OW.id + ':' + spec.role, role, x: spec.x, y: spec.y, dir: spec.dir || 'down',
              home: spec.dir, sight: 0, ox: 0, oy: -190, fr: 0, look: role.look };
  OW.npcs.push(n);
  Sound.sfx('encounter');
  await Anim.run(0.4, k => { n.oy = Math.round(-190 * (1 - k * k)); });   // 加速墜落
  n.oy = 0;

  Sound.sfx('hit'); OW.flash = .9; OW.shake = 8;
  await Anim.run(0.6, k => { OW.shake = 8 * (1 - k); OW.flash = .9 * (1 - k); ring = k * 66; });
  OW.shake = 0; OW.flash = 0; ring = -1;
  await Anim.run(0.5, k => { OW.dark = .72 * (1 - k); sr = 15 * (1 - k); });
  OW.dark = 0; OW.fx.length = 0;

  for (const t of (role.entryLines || [])) await say(t, t.startsWith('（') ? undefined : role.name);
  autosave();
}

async function trainerTalk(n) {
  const R = n.role;
  if (G.defeated[n.key]) { await say(G.route && R.afterA ? (G.route === 'a' ? R.afterA : R.afterB) : R.after, R.name); return; }
  if (!G.equip.length) { await say('……你手上沒有武器？', R.name); return; }
  if (R.needDefeated && !R.needDefeated.every(k => G.defeated[k])) { await say(R.gateText || '……', R.gateText && R.gateText.startsWith('（') ? undefined : R.name); return; }
  await say(R.intro, R.name);
  const res = await Battle.start({ kind: R.kind, foe: makePersonFoe(R), role: R, cats: R.foe.cats });
  if (res !== 'win') return;
  G.defeated[n.key] = true;
  let grant = false;
  if (R.choice && !G.route) {   // 劇情分支：兩個回答，走向不同
    const k = await UI.ask(R.choice.q, R.choice.opts, { name: R.name, cancel: false });
    G.route = k === 1 ? 'b' : 'a'; Sound.sfx('ok');
    await say(R.choice.replies[k === 1 ? 1 : 0], R.name);
    grant = !!W.story;
    await say(G.route === 'a' ? R.afterA : R.afterB, R.name);
    if (!W.story) { await say(`（你選擇了「${W.routeNames[G.route]}」，之後的劇情會跟著改變。）`); G.flags.rivalGone = true; await Anim.run(0.4, k2 => n.oy = -6 * k2); OW.npcs = OW.npcs.filter(x => x !== n); }
  }
  if (R.afterWin && R.afterWin.length) for (const t of R.afterWin) await say(t, t.startsWith('（') ? undefined : R.name);
  /* 器靈現身放在對方把話說完之後：輸了會被送回休息處，對方的台詞不能在那邊才講 */
  if (grant) await Guardian.grant(true);
  if (((R.kind === 'rival' && !R.choice) || R.leaves) && W.story) { G.flags['gone:' + n.key] = true; await Anim.run(0.4, k2 => n.oy = -8 * k2); OW.npcs = OW.npcs.filter(x => x !== n); }
  if (R.kind === 'trainer') await bossEntrance();      // 菁英全滅 → 大魔王登場
  if (R.kind === 'gym') {
    G.badges.push(R.badge); Sound.play('victory'); Sound.sfx('badge');
    if (G.ng > 0 && W.ngLines && W.ngLines[G.badges.length]) for (const t of W.ngLines[G.badges.length]) await say(t);
    await say(`${G.player.name} 拿回了「${R.badge}」！（${G.badges.length} / ${W.story ? 5 : 3}）`);
    if (R.rewardWeapon) { const w = giveWeapon(R.rewardWeapon, R.rewardRarity == null ? 2 : R.rewardRarity); await say(`${R.name} 還給了你武器「${weaponName(w)}」（${RARITY[w.r].n}）！${w.toBox ? '\n（背包滿了，已自動存進「電腦」）' : ''}`); }
    if (!W.story) { await say(R.after, R.name); await ChapterEnd.play(); }
    else if (R.final) { G.chapter = 6; await StoryEnding.play(); }
    else { G.chapter = G.badges.length + 1; Sound.play(W.music[OW.L.music] || OW.L.music); await sleep(200); showBanner(W.chapterName); await say(`【${W.chapterName}】\n${W.stages[storyStage()].text}`); }
  }
  autosave();
}
/* 序幕：八年級教室 */
async function storyPrologue() {
  if (OW.id === 'room') return roomPrologue();     // 校園版：從自己房間醒來
  const M = '小墨';
  for (const t of W.prologue) await say(t);
  OW.npcs.push({ key: 'c8:xiaomo', role: W.roles.xiaomo, x: 3, y: 1, dir: 'down', home: 'down', sight: 0, ox: 0, oy: 0, fr: 0, look: W.roles.xiaomo.look });
  Sound.sfx('badge'); await sleep(300);
  for (const t of W.xiaomoIntro) await say(t, M);
  giveWeapon('brush', 0); G.cur = 0; playerStats(); G.hp = G.maxhp;
  await Battle.start({ kind: 'wild', foe: makeFoe('tool_eraser', 2), tutorial: true, mentor: M });
  await say(W.xiaomoAfter[0], M);
  const w = G.weapons[0]; w.r = 1; G.frags.eraser = Math.max(0, (G.frags.eraser || 0) - 1); Meta.seeWeapon(G.world, 'brush', 1); playerStats();
  Sound.sfx('badge'); s_flash(); await say(`2B 鉛筆吸收了碎片，化成了「良品．${weaponName(w)}」！`);
  G.bag.heal += 3; G.bag.hint += 2; await say(`小墨還給了你「${itemName('heal')}」×3、「${itemName('hint')}」×2！`);
  for (const t of W.xiaomoAfter.slice(1)) await say(t, M);
  OW.npcs = OW.npcs.filter(n => n.key !== 'c8:xiaomo');
  G.flags.prologue = true; G.chapter = 1; showBanner(W.chapterName); autosave();
}
/* ============================================================
   校園版序幕：凌晨在自己房間驚醒
   ------------------------------------------------------------
   G.flags.pro：1 醒來了、要看時間　2 鬧鐘轉好了、要看准考證
   房間裡可以按的東西寫在地圖的 acts（床頭鬧鐘、書包）。
   ============================================================ */
function hhmm(min) { return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0'); }
async function roomPrologue() {
  if (!G.flags.pro) {
    await sleep(400);
    for (const t of W.wakeUp) await say(t);
    G.flags.pro = 1; autosave();
  } else await say(G.flags.pro === 1 ? '（先確認一下時間吧。床頭的鬧鐘就在旁邊。）' : '（接著是准考證。它應該還在書包裡。）');
}
const ACTS = {
  /* 床頭鬧鐘：不判對錯，轉到幾點都可以。轉完就記住，夢裡每一個鐘都會停在這裡 */
  async alarmClock() {
    if (G.flags.dreamClock != null) {
      await say(`（鬧鐘停在 ${hhmm(G.flags.dreamClock)}。）` + (G.flags.prologue ? '' : '\n（時間確認過了。接著是准考證。）'));
      return;
    }
    await say('（鬧鐘的指針好像停住了。你把它拿起來，轉到——）');
    const min = await ClockPanel.open(6 * 60);
    G.flags.dreamClock = min; Sound.sfx('ok'); autosave();
    await say(`（你把鬧鐘轉到 ${hhmm(min)}，放回床頭。）\n（……好，就是這個時間。）`);
    if (!G.flags.prologue) { G.flags.pro = 2; autosave(); await say('（接著是……准考證。它應該還在書包裡。）'); }
  },
  /* 書包：確認准考證 → 墨水剝落 → 小墨登場 → 教學戰 */
  async schoolbag() {
    if (G.flags.prologue) { await say('（書包裡裝著課本和鉛筆盒。准考證……已經碎成五片了。）'); return; }
    if (G.flags.pro !== 2) { await say('（准考證在書包裡……先看看現在幾點吧。）'); return; }
    await roomXiaomo();
  },
};
async function roomXiaomo() {
  const M = '小墨';
  for (const t of W.ticketCheck) await say(t);
  Sound.sfx('grass'); OW.shake = 2; await Anim.run(0.4, k => OW.shake = 2 * (1 - k)); OW.shake = 0;
  for (const t of W.ticketInk) await say(t);
  /* 小墨從書桌上的課本裡跳出來 */
  const [mx, my] = [[8, 1], [8, 2], [7, 2], [5, 2], [6, 3]].find(([x, y]) => !(x === OW.p.x && y === OW.p.y) && !OW.solid(x, y));
  const mo = { key: 'room:xiaomo', role: W.roles.xiaomo, x: mx, y: my, dir: 'down', home: 'down', sight: 0, ox: 0, oy: -12, fr: 0, look: W.roles.xiaomo.look };
  OW.npcs.push(mo); Sound.sfx('badge');
  await Anim.run(0.35, k => mo.oy = -12 * (1 - k) - Math.sin(k * Math.PI) * 6); mo.oy = 0;
  await sleep(200);
  for (const t of W.xiaomoHome) await say(t, M);
  giveWeapon('brush', 0); G.cur = 0; playerStats(); G.hp = G.maxhp;
  await Battle.start({ kind: 'wild', foe: makeFoe('tool_eraser', 2), tutorial: true, mentor: M });
  await say(W.xiaomoAfter[0], M);
  const w = G.weapons[0]; w.r = 1; G.frags.eraser = Math.max(0, (G.frags.eraser || 0) - 1); Meta.seeWeapon(G.world, 'brush', 1); playerStats();
  Sound.sfx('badge'); s_flash(); await say(`2B 鉛筆吸收了碎片，化成了「良品．${weaponName(w)}」！`);
  G.bag.heal += 3; G.bag.hint += 2; await say(`小墨還給了你「${itemName('heal')}」×3、「${itemName('hint')}」×2！`);
  await say(W.xiaomoAfter[1], M);
  for (const t of W.xiaomoGo) await say(t, M);
  OW.npcs = OW.npcs.filter(n => n !== mo);
  await say('（小墨鑽進了你的書包。）');
  G.flags.prologue = true; delete G.flags.pro; G.chapter = 1;
  await say('（……窗外的天色，不知道什麼時候已經亮了。）');
  showBanner(W.chapterName); autosave();
}
/* 轉鬧鐘的小面板：↑↓ 調整、←→ 換時／分、A 確定（手機可以直接點上下的箭頭） */
const ClockPanel = {
  open(start) {
    return new Promise(res => {
      let hh = Math.floor(start / 60), mm = start % 60, f = 0;
      const box = UI.el('box clockp');
      box.innerHTML = `<div class="ct">轉動鬧鐘</div><canvas width="40" height="40"></canvas>
        <div class="cd"><div class="cf" data-f="0"><b data-d="1">▲</b><span></span><b data-d="-1">▼</b></div><i>:</i>
        <div class="cf" data-f="1"><b data-d="1">▲</b><span></span><b data-d="-1">▼</b></div></div>
        <div class="ch">↑↓ 調整　←→ 時／分　A 確定</div><div class="ok">確定</div>`;
      const cv = box.querySelector('canvas'), g = cv.getContext('2d'), spans = box.querySelectorAll('.cf span'), fs = box.querySelectorAll('.cf');
      const paint = () => {
        spans[0].textContent = String(hh).padStart(2, '0'); spans[1].textContent = String(mm).padStart(2, '0');
        fs.forEach((e, i) => e.classList.toggle('sel', i === f));
        g.clearRect(0, 0, 40, 40); g.fillStyle = '#c83838'; g.beginPath(); g.arc(20, 21, 17, 0, 7); g.fill();
        g.fillStyle = '#e0c040'; g.fillRect(4, 2, 7, 5); g.fillRect(29, 2, 7, 5);
        g.fillStyle = '#f8f6ee'; g.beginPath(); g.arc(20, 21, 14, 0, 7); g.fill();
        g.fillStyle = '#6a6a74'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(Math.round(20 + Math.sin(a) * 12) - .5, Math.round(21 - Math.cos(a) * 12) - .5, 1, 1); }
        const hand = (a, len, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(20, 21); g.lineTo(20 + Math.sin(a) * len, 21 - Math.cos(a) * len); g.stroke(); };
        hand(((hh % 12) + mm / 60) / 12 * Math.PI * 2, 7, 2.5, '#2a2a30'); hand(mm / 60 * Math.PI * 2, 11, 1.5, '#2a2a30');
        g.fillStyle = '#2a2a30'; g.fillRect(19, 20, 2, 2);
      };
      const bump = (field, d) => { if (field === 0) hh = (hh + d + 24) % 24; else mm = (mm + d * 5 + 60) % 60; Sound.sfx('cursor'); paint(); };
      const done = () => { Sound.sfx('ok'); UI.pop(m); res(hh * 60 + mm); };
      box.querySelectorAll('.cf b').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); f = +b.parentNode.dataset.f; bump(f, +b.dataset.d); }));
      box.querySelector('.ok').addEventListener('pointerdown', e => { e.preventDefault(); done(); });
      const m = { el: box, update() {
        const d = Input.dir();
        if (d === 'up') bump(f, 1); else if (d === 'down') bump(f, -1);
        else if (d === 'left' || d === 'right') { f = 1 - f; Sound.sfx('cursor'); paint(); }
        if (Input.p('A')) done();
      } };
      m.get = () => hh * 60 + mm; m.set = v => { hh = Math.floor(v / 60); mm = v % 60; paint(); }; m.done = done;   // 測試用
      paint(); UI.push(m);
    });
  },
};
async function questTalk(n) {
  const R = Object.assign({}, n.role), q = G.quests.bugs || (G.quests.bugs = { state: 'none', n: 0 });
  for (const k of ['offer', 'progress']) R[k] = R[k].replace(/\{mon\}/g, monName('brush'));
  if (q.state === 'none') { const ok = await UI.ask(R.offer, ['好，交給我！', '下次吧'], { name: R.name }); if (ok === 0) { q.state = 'active'; Sound.sfx('ok'); await say('【支線任務】消滅 3 隻錯字蟲（可在選單「任務」查看）'); } }
  else if (q.state === 'active' && q.n < 3) await say(`${R.progress}（目前 ${q.n} / 3）`, R.name);
  else if (q.state === 'active') { q.state = 'done'; G.bag.heal2 += 2; G.bag.wenqi += 1; G.money += 200; Sound.sfx('badge');
    await say(R.done, R.name); await say(`得到了「${itemName('heal2')}」×2、「${itemName('wenqi')}」×1 和 200 ${W.money}！`); }
  else await say(R.after, R.name);
  n.dir = n.home;
}
/* 草叢裡蹦出一隻武器妖 */
async function wildEncounter(sp, lv) {
  const foe = makeFoe(sp, lv);
  Sound.sfx('grass'); OW.shake = 2;
  await Anim.run(0.22, k => OW.shake = 2 * (1 - k)); OW.shake = 0;
  const res = await Battle.start({ kind: 'wild', foe });
  /* 支線任務「消滅 3 隻錯字蟲」：用戰鬥物件的 drop 判斷，
     地圖上那份簡略的野怪資料沒有 drop，以前這一行永遠不成立。 */
  if (res === 'win') { const q = G.quests.bugs; if (q && q.state === 'active' && foe.drop === 'brush') q.n = Math.min(3, q.n + 1); }
}
async function openChest(c) {
  if (G.chests[c.id]) { await say('寶箱是空的。'); return; }
  G.chests[c.id] = true; Sound.sfx('catch');
  if (c.weapon) { const w = giveWeapon(c.weapon, c.r || 0); Sound.sfx('badge'); await say(`打開寶箱……找到了武器「${weaponName(w)}」（${RARITY[w.r].n}）！`); await say(w.toBox ? '（背包滿了，已自動存進「電腦」，可在選單的「電腦」取出）' : G.equip.includes(w.id) ? '（已自動放入攜帶欄，可在選單「武器」中切換）' : '（攜帶欄已滿，可在選單「武器」中更換）'); }
  else { const parts = Object.entries(c.items || {}).map(([id, n]) => { G.bag[id] += n; return `「${itemName(id)}」×${n}`; });
    for (const [a, n] of Object.entries(c.frags || {})) { G.frags[a] = (G.frags[a] || 0) + n; parts.push(`「${weaponName(a)}碎片」×${n}`); }
    await say(`打開寶箱……得到了 ${parts.join('、')}！`); }
  autosave();
}
async function doorAct(key, dx, dy) {
  const D = W.doors[key]; if (!D) return;
  if (D.kind === 'home' || D.kind === 'heal') {
    Sound.sfx('door'); if (D.kind === 'heal') await say(D.text);
    G.hp = G.maxhp; G.lastHeal = { map: OW.id, x: dx, y: dy + 1 }; Sound.sfx('heal');
    await say(D.kind === 'home' ? D.text : '（氣血全滿了！）'); autosave();
  } else if (D.kind === 'shop') { Sound.sfx('door'); await say(D.text); await Shop.open(OW.L.shop); }
  else await say(D.text);
}
function autosave() { if (G && G.slot) Slots.write(G.slot, G); }
