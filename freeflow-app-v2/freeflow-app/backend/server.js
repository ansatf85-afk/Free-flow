// فري فلو — باك إند بدون أي مكتبات (Node 18+ فقط). التشغيل: API_KEY=سر node backend/server.js
const http = require("http"), fs = require("fs"), path = require("path");
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "change-me";
const FILE = process.env.DATA_FILE || path.join(__dirname, "data.json");
const ROOT = path.join(__dirname, "..");
const TZ = "Africa/Cairo";
const REPORT_TYPES = ["long_queue", "short_queue", "ferry_stopped", "ferry_running"];

let db = { readings: [], status: { status: "open", message: "" }, reports: [] };
try { db = Object.assign(db, JSON.parse(fs.readFileSync(FILE, "utf8"))); } catch (e) {}
const save = () => fs.writeFile(FILE, JSON.stringify(db), () => {});
const cairoHour = (d) => Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: TZ }).format(d)) % 24;
const cairoDay = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

function statusPayload() {
  const last = db.readings[db.readings.length - 1];
  const today = cairoDay(new Date()), sums = {}, counts = {};
  db.readings.forEach((r) => {
    const d = new Date(r.t); if (cairoDay(d) !== today) return;
    const h = cairoHour(d); sums[h] = (sums[h] || 0) + r.waiting; counts[h] = (counts[h] || 0) + 1;
  });
  const history = Object.keys(sums).map(Number).sort((a, b) => a - b).map((h) => ({ hour: h, waiting: Math.round(sums[h] / counts[h]) }));
  const since = Date.now() - 30 * 60000, reports = {};
  REPORT_TYPES.forEach((t) => (reports[t] = 0));
  db.reports.forEach((r) => { if (r.t > since) reports[r.type]++; });
  return { updated: last ? new Date(last.t).toISOString() : new Date().toISOString(), status: db.status.status, message: db.status.message,
    waiting: last ? last.waiting : 0, loaded: last ? last.loaded : 0, history, reports };
}

function body(req) {
  return new Promise((ok, no) => { let s = ""; req.on("data", (c) => { s += c; if (s.length > 1e4) { req.destroy(); no(); } });
    req.on("end", () => { try { ok(JSON.parse(s || "{}")); } catch (e) { no(e); } }); });
}
const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj)); };
const authed = (req) => req.headers["x-api-key"] === API_KEY;
const lastReport = {}; // IP → وقت آخر بلاغ (منع التكرار)

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json" };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") return send(res, 204, {});
  try {
    if (u.pathname === "/api/status" && req.method === "GET") return send(res, 200, statusPayload());
    if (u.pathname === "/api/reading" && req.method === "POST") { // من الحساسات
      if (!authed(req)) return send(res, 401, { error: "bad key" });
      const b = await body(req), w = Number(b.waiting);
      if (!Number.isFinite(w) || w < 0) return send(res, 400, { error: "waiting" });
      db.readings.push({ t: Date.now(), waiting: Math.round(w), loaded: Number(b.loaded) || 0 });
      db.readings = db.readings.slice(-20000); save(); return send(res, 200, { ok: true });
    }
    if (u.pathname === "/api/ferry" && req.method === "POST") { // تحكم المشغّل
      if (!authed(req)) return send(res, 401, { error: "bad key" });
      const b = await body(req);
      db.status = { status: b.status === "closed" ? "closed" : "open", message: String(b.message || "").slice(0, 200) };
      save(); return send(res, 200, { ok: true });
    }
    if (u.pathname === "/api/report" && req.method === "POST") { // بلاغ من مستخدم
      const b = await body(req), ip = req.socket.remoteAddress;
      if (REPORT_TYPES.indexOf(b.type) < 0) return send(res, 400, { error: "type" });
      if (Date.now() - (lastReport[ip] || 0) < 5 * 60000) return send(res, 429, { error: "wait" });
      lastReport[ip] = Date.now();
      db.reports.push({ t: Date.now(), type: b.type });
      db.reports = db.reports.filter((r) => r.t > Date.now() - 24 * 3600000); save(); return send(res, 200, { ok: true });
    }
    // ملفات التطبيق (بدون مجلد backend)
    let p = path.normalize(decodeURIComponent(u.pathname)).replace(/^(\.\.[\/\\])+/, "");
    if (p === "/" || p === path.sep) p = "index.html";
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || f.startsWith(path.join(ROOT, "backend")) || f.startsWith(path.join(ROOT, "apps-script"))) return send(res, 404, {});
    fs.readFile(f, (e, data) => e ? send(res, 404, { error: "not found" }) : (res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" }), res.end(data)));
  } catch (e) { send(res, 400, { error: "bad request" }); }
}).listen(PORT, () => console.log("فري فلو شغّال على http://localhost:" + PORT));
