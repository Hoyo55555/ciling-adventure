#!/usr/bin/env python3
"""產生教師帳號的新密碼雜湊（密碼只在你自己的電腦上輸入，不會傳給任何人）。
用法：python3 tools/make_teacher_hash.py
再把印出來的 hash 貼到 js/config.js 的 CONFIG.teacher.hash（班級、座號沒改就保持 T、0）。
雜湊方式與 js/cloud.js 的 TeacherAuth 一致：SHA-256("ciling-teacher|班級|座號|密碼")。"""
import getpass, hashlib
cls, no = 'T', '0'
pin = getpass.getpass(f'新的教師密碼（班級 {cls}、座號 {no}，輸入時不會顯示）：')
if len(pin) < 4:
    raise SystemExit('密碼至少 4 個字。')
if pin != getpass.getpass('再輸入一次：'):
    raise SystemExit('兩次不一樣。')
print('\n把這一行貼到 js/config.js：')
print(f"  teacher: {{ cls: '{cls}', no: '{no}', hash: '{hashlib.sha256(f'ciling-teacher|{cls}|{no}|{pin}'.encode()).hexdigest()}' }},")
