# الباك إند (بدون مكتبات)
```
API_KEY=سر-قوي PORT=3000 node backend/server.js
```
الحساسات: `curl -X POST localhost:3000/api/reading -H "x-api-key: سر-قوي" -H "Content-Type: application/json" -d '{"waiting":25,"loaded":310}'`
المشغّل: `curl -X POST localhost:3000/api/ferry -H "x-api-key: سر-قوي" -H "Content-Type: application/json" -d '{"status":"closed","message":"توقف بسبب الطقس"}'`
في `config.js` خلّي `API_URL: "/api/status"` (لو التطبيق متقدّم من نفس السيرفر).
