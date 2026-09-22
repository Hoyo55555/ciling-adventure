'use strict';
/* =====================================================================
   遊戲設定（老師只需要改這個檔案）
   cloudUrl：雲端存檔網址。照「雲端存檔設定說明.md」部署 Google Apps Script 後，
             把得到的網址（https://script.google.com/macros/s/……/exec）貼在引號中。
             留空＝只存在學生自己的電腦（瀏覽器）裡。
   ===================================================================== */
const CONFIG = {
  /* 額外的禁用字（名字、名號不能使用），例如：['某某', '某某某'] */
  bannedWords: [],
  /* 被誤擋、其實可以使用的詞，例如：['幹部'] */
  allowedWords: [],
  cloudUrl: 'https://script.google.com/macros/s/AKfycbzM0EyBzxe3eCZvvkq28rEsMZ1HvLePG6WLnmWtrpUT9hL8k722GWUkkXOEzwY4mwET/exec',
};
