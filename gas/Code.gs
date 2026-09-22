/**
 * 詞靈冒險．雲端存檔服務（Google Apps Script）
 * 部署方式請見專案根目錄的「雲端存檔設定說明.md」。
 *
 * 試算表「存檔」工作表的欄位：
 * 帳號｜密碼（雜湊）｜存檔1｜存檔2｜存檔3｜更新時間｜名字｜世界觀｜等級｜章節｜徽章數｜答題數｜答對率｜錯題數｜遊玩分鐘
 */
const SHEET_NAME = '存檔';
const HEADERS = ['帳號', '密碼', '存檔1', '存檔2', '存檔3', '更新時間', '名字', '世界觀', '等級', '章節', '徽章數', '答題數', '答對率', '錯題數', '遊玩分鐘'];

function doGet() { return json({ ok: true, msg: '詞靈冒險雲端存檔服務運作中' }); }

function doPost(e) {
  let res;
  try { res = handle(JSON.parse(e.postData.contents)); }
  catch (err) { res = { ok: false, error: String(err && err.message || err) }; }
  return json(res);
}

function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) { sh = ss.insertSheet(SHEET_NAME); sh.appendRow(HEADERS); sh.setFrozenRows(1); sh.hideColumns(2, 4); }
  return sh;
}

function hashPin(pin) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'ciling:' + pin));
}

function findRow(sh, id) {
  const n = sh.getLastRow() - 1; if (n < 1) return 0;
  const ids = sh.getRange(2, 1, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}

function handle(q) {
  const cls = String(q.cls || '').trim(), no = String(q.no || '').trim(), pin = String(q.pin || '').trim();
  if (!/^[0-9A-Za-z]{1,6}$/.test(cls) || !/^\d{1,3}$/.test(no)) throw new Error('班級或座號格式不正確');
  if (!/^\d{4}$/.test(pin)) throw new Error('密碼必須是 4 位數字');
  const id = cls + '班' + no + '號';
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = getSheet(); let row = findRow(sh, id);
    if (!row) {
      if (q.action !== 'login') throw new Error('找不到帳號，請重新登入');
      sh.appendRow([id, hashPin(pin), '', '', '', new Date()]);
      return { ok: true, created: true, slots: ['', '', ''] };
    }
    if (sh.getRange(row, 2).getValue() !== hashPin(pin)) throw new Error('密碼錯誤（忘記密碼請找老師）');
    if (q.action === 'login') return { ok: true, slots: sh.getRange(row, 3, 1, 3).getValues()[0].map(String) };
    if (q.action === 'save') {
      const n = Number(q.slot); if (!(n >= 1 && n <= 3)) throw new Error('存檔欄位錯誤');
      const data = String(q.data || ''); if (data.length > 49000) throw new Error('存檔太大');
      sh.getRange(row, 2 + n).setValue(data); sh.getRange(row, 6).setValue(new Date());
      const s = q.summary;
      if (s) sh.getRange(row, 7, 1, 9).setValues([[s.name, s.world, s.lv, s.chapter, s.badges, s.answered, s.pct + '%', s.wrong, s.minutes]]);
      return { ok: true };
    }
    throw new Error('未知的操作');
  } finally { lock.releaseLock(); }
}

/** 老師用：重設某位學生的密碼（在 Apps Script 編輯器中修改參數後執行） */
function resetPin() {
  const id = '801班12號', newPin = '0000';
  const sh = getSheet(), row = findRow(sh, id);
  if (!row) throw new Error('找不到 ' + id);
  sh.getRange(row, 2).setValue(hashPin(newPin));
}
