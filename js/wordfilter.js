'use strict';
/* ============ 禁用字過濾（名字、名號等自訂文字） ============
   比對前會先去掉空白與符號、轉成半形小寫，避免用「幹 你」「f.u.c.k」繞過。
   ALLOW 是含有禁用字、但屬正常用語的詞（例如「幹部」「操場」「貧賤」），比對前先移除。
   老師可在 js/config.js 的 bannedWords / allowedWords 增加詞語。 */
const WordFilter = (() => {
  const BAN = [
    // 髒話、辱罵
    '幹你', '幹妳', '幹他', '幹她', '幹林', '幹拎', '姦你', '靠北', '靠腰', '靠杯', '哭爸', '哭夭', '機掰', '雞掰', '機歪', '雞歪', '機八', '雞巴', '鸡巴', '懶叫', '懶覺', '羼', '屄', '屌', '尻',
    '操你', '操妳', '操他', '操她', '草你', '肏', '他媽', '他妈', '你媽', '你妈', '妳媽', '媽的', '妈的', '馬的', '三小', '殺小', '北七', '白痴', '白癡', '智障', '低能', '腦殘', '脑残', '廢物', '废物',
    '賤人', '贱人', '犯賤', '下賤', '婊', '王八蛋', '混蛋', '畜生', '狗娘', '去死', '死全家', '滾蛋', '垃圾人', '傻逼', '傻b', '沙比', '煞筆', '草泥馬', '草泥马', '尼瑪', '尼玛', '屁眼', '幹', '干你', '干妳',
    // 18 禁
    '性交', '做愛', '做爱', '色情', '情色', '裸體', '裸体', '裸照', '全裸', '口交', '肛交', '強姦', '强奸', '強暴', '輪姦', '援交', '約炮', '約砲', '约炮', '打炮', '打砲', '陰莖', '阴茎', '陰道', '阴道', '陰蒂',
    '乳頭', '乳头', '奶子', '巨乳', '自慰', '成人片', 'a片', 'av女優', '一夜情', '黃片', '黄片', '春藥', '內射', '中出', '蘿莉控', '淫', '18禁', '十八禁', '性愛', '性爱', '射精', '勃起', '妓女', '嫖',
    // 暴力、毒品
    '殺人', '杀人', '砍死', '自殺', '自杀', '吸毒', '毒品', '大麻', '安非他命', 'k他命', '海洛因', '炸彈', '炸弹', '恐怖份子',
    // 歧視
    '支那', '黑鬼', '娘炮', '娘砲', '死gay', '殘廢', '残废', '智缺',
    // 英文
    'fuck', 'fuk', 'fck', 'shit', 'bitch', 'dick', 'pussy', 'cunt', 'porn', 'sex', 'nigger', 'nigga', 'asshole', 'bastard', 'slut', 'whore', 'wtf', 'stfu', 'motherfucker', 'penis', 'vagina', 'boob',
  ];
  const ALLOW = ['幹部', '幹事', '能幹', '樹幹', '骨幹', '主幹', '軀幹', '幹練', '幹勁', '才幹', '精幹', '實幹', '苦幹', '幹道', '幹線', '貧賤', '卑賤', '淫雨', '浸淫', '尻尾', 'sussex', 'essex'];
  const norm = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}_]/gu, '');
  const lists = () => {
    const extraBan = (typeof CONFIG !== 'undefined' && CONFIG.bannedWords) || [], extraAllow = (typeof CONFIG !== 'undefined' && CONFIG.allowedWords) || [];
    return { ban: BAN.concat(extraBan).map(norm).filter(Boolean), allow: ALLOW.concat(extraAllow).map(norm).filter(Boolean).sort((a, b) => b.length - a.length) };
  };
  return {
    /* 回傳 true 表示可以使用 */
    ok(text) {
      const { ban, allow } = lists(); let t = norm(text);
      for (const a of allow) t = t.split(a).join('＿');
      return !ban.some(b => t.includes(b));
    },
  };
})();
