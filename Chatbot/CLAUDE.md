# Ollama Cloud Chat

แชทบอทภาษาไทย ใช้ Ollama Cloud API (`gemma4:31b`) + Ollama Pro ($20/เดือน)
ซ่อน API key ฝั่ง backend ปลอดภัย

## Repo

- อยู่ใน `mysystems` monorepo: `https://github.com/Gutumrod/mysystems/tree/main/Chatbot`

## สถานะปัจจุบัน (2026-05-09)

### เสร็จแล้ว
- `index.html` — หน้าแชท UI สวย มี markdown + XSS sanitize
- `sw.js` — service worker
- `manifest.json` + icons — พร้อม PWA
- `server.js` — Express backend port 3456, proxy ไป `https://ollama.com/v1/chat/completions`
- `.env` — เก็บ API key (ไม่เข้า git)
- `.gitignore` — กัน `.env`, `node_modules/`, `.DS_Store`
- `.env.example` — template สำหรับ deploy
- Git push ขึ้น `mysystems` repo แล้ว ✅

### สิ่งที่ต้องทำต่อ
1. Deploy ไป Render.com (ฟรี):
   - Repository: `https://github.com/Gutumrod/mysystems`
   - Root Directory: `Chatbot`
   - Env vars: `OLLAMA_API_KEY=b363ee31e4b2491b8208e7d215a96e09.lFB9WFYfuqfH08OKWqkn4myx`, `MODEL_NAME=gemma4:31b`
   - Start command: `node server.js`

### วิธีรันบนเครื่อง
```
node server.js
```
เปิด `http://localhost:3456` หรือดับเบิลคลิก `start.bat`

### Git info
- User: Gutumrod / titazmth@gmail.com
