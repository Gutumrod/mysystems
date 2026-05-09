# Ollama Cloud Chat

แชทบอทภาษาไทย ใช้ Ollama Cloud API (`gemma4:31b`) + Ollama Pro ($20/เดือน)
ซ่อน API key ฝั่ง backend ปลอดภัย

## สถานะปัจจุบัน (2026-05-09)

### เสร็จแล้ว
- `index.html` — หน้าแชท UI สวย มี markdown + XSS sanitize
- `sw.js` — service worker (fixed syntax)
- `manifest.json` + icons — พร้อม PWA
- `server.js` — Express backend port 3456, proxy ไป `https://ollama.com/v1/chat/completions`
- `.env` — เก็บ API key (ไม่เข้า git)
- ทดสอบ API แล้ว → ใช้งานได้จริง

### สิ่งที่ต้องทำต่อ
1. `gh auth login --web` — login GitHub
2. `gh repo create ollama-cloud-chat --public --source=. --push`
3. Deploy ไป Render.com (ฟรี):
   - ตั้ง env vars: `OLLAMA_API_KEY`, `MODEL_NAME=gemma4:31b`
   - Start command: `node server.js`

### วิธีรันบนเครื่อง
```
node server.js
```
เปิด `http://localhost:3456` หรือดับเบิลคลิก `start.bat`

### Git info
- User: Gutumrod / titazmth@gmail.com
