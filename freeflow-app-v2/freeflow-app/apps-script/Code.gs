/**
 * فري فلو — API بسيط يقرأ الشيت ويرجّع JSON للتطبيق.
 *
 * شكل الشيت المفترض (الصف الأول عناوين):
 *   A: Timestamp (الوقت)   B: Waiting (السيارات المنتظرة)   C: Loaded (إجمالي اللي اتحمّل)
 *
 * لو أعمدتك مختلفة، غيّر الأرقام في COL تحت.
 *
 * حالة العبّارة (اختياري): اعمل شيت تاني اسمه "Status":
 *   A2: open أو closed      B2: رسالة للمستخدمين (مثلاً: متوقفة بسبب الأحوال الجوية)
 * عدّل الخلية والتطبيق هيعرض الحالة وهيبعت تنبيه لمين فاتح التطبيق.
 */
var SHEET_NAME = "";            // سيبه فاضي = أول شيت
var TZ = "Africa/Cairo";
var COL = { time: 0, waiting: 1, loaded: 2 };   // ترتيب العمود يبدأ من 0

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  var rows = sh.getDataRange().getValues().slice(1).filter(function (r) {
    return r[COL.time] instanceof Date;
  });

  if (!rows.length) {
    return json({ updated: new Date().toISOString(), status: "open", message: "", waiting: 0, loaded: 0, history: [] });
  }

  var last = rows[rows.length - 1];

  var status = "open", message = "";
  var st = ss.getSheetByName("Status");
  if (st) {
    status = String(st.getRange("A2").getValue() || "open").toLowerCase().trim();
    message = String(st.getRange("B2").getValue() || "");
  }
  var today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");

  // متوسط السيارات المنتظرة لكل ساعة النهارده
  var sums = {}, counts = {};
  rows.forEach(function (r) {
    var d = r[COL.time];
    if (Utilities.formatDate(d, TZ, "yyyy-MM-dd") !== today) { return; }
    var h = Number(Utilities.formatDate(d, TZ, "H"));
    sums[h] = (sums[h] || 0) + Number(r[COL.waiting] || 0);
    counts[h] = (counts[h] || 0) + 1;
  });
  var history = Object.keys(sums).map(Number).sort(function (a, b) { return a - b; })
    .map(function (h) { return { hour: h, waiting: Math.round(sums[h] / counts[h]) }; });

  return json({
    updated: last[COL.time].toISOString(),
    status: status,
    message: message,
    waiting: Number(last[COL.waiting] || 0),
    loaded: Number(last[COL.loaded] || 0),
    history: history
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
