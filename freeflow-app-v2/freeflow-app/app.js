// ==========================================
// 1. إعدادات Firebase
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://freeflow1-default-rtdb.firebaseio.com"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 2. المتغيرات والدوال المساعدة
// ==========================================
const $ = (id) => document.getElementById(id);
let lastReportTime = 0;

// حدود تحديد مستوى الزحمة — عدّل الأرقام دي حسب طبيعة الطابور الحقيقي عندكم
const LEVELS = {
  low:    { max: 5,        color: "low",    message: "الوضع ممتاز، توكل على الله." },
  medium: { max: 15,       color: "medium", message: "زحمة خفيفة، متوقع تخلص قريب." },
  high:   { max: Infinity, color: "high",   message: "زحمة شديدة، خد بالك في وقتك." }
};

function getLevel(waiting) {
  if (waiting <= LEVELS.low.max) return LEVELS.low;
  if (waiting <= LEVELS.medium.max) return LEVELS.medium;
  return LEVELS.high;
}

// ==========================================
// 3. عرض البيانات على الشاشة (UI) — كل حاجة بقت بتتحسب من data.waiting الحقيقي
// ==========================================
function render(waiting, ferryStatus) {
  const level = getLevel(waiting);

  if ($("waiting")) $("waiting").innerText = waiting;
  if ($("loaded")) $("loaded").innerText = waiting * 12;

  if ($("statusText")) $("statusText").innerText = level.message;
  if ($("tip")) $("tip").innerText = level.message;

  if ($("ferryState")) {
    $("ferryState").innerText = ferryStatus === "stopped" ? "واقفة" : "شغالة";
  }

  const statusCard = $("statusCard");
  if (statusCard) statusCard.setAttribute("data-level", level.color);

  if ($("wait")) $("wait").innerText = Math.ceil(waiting * 1.5);

  if ($("updated")) $("updated").innerText = new Date().toLocaleTimeString('ar-EG');

  if ($("bestTime")) $("bestTime").innerText = "بعد الساعة 10 مساءً (متوقع)";
}

// ==========================================
// 4. تسجيل وقراءة بيانات الزحمة بالساعة — بيانات حقيقية بدل Math.random()
//    بتتخزن تحت history/<تاريخ اليوم>/<الساعة> عشان متتلخبطش بين يوم وتاني
// ==========================================
async function recordAndLoadHistory(waiting) {
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const hour = now.getHours();
  const hourRef = ref(db, `history/${dateKey}/${hour}`);

  try {
    const snap = await get(hourRef);
    const prev = snap.val();
    const newAvg = prev ? Math.round((prev.avg * prev.count + waiting) / (prev.count + 1)) : waiting;
    await set(hourRef, { avg: newAvg, count: prev ? prev.count + 1 : 1 });
  } catch (err) {
    console.error("تعذر تسجيل بيانات الساعة:", err);
  }

  const history = [];
  for (let i = 0; i <= hour; i++) {
    try {
      const s = await get(ref(db, `history/${dateKey}/${i}`));
      const v = s.val();
      history.push({ hour: i, waiting: v ? v.avg : 0 });
    } catch (err) {
      history.push({ hour: i, waiting: 0 });
    }
  }
  return history; // استخدمها هنا لو عندك دالة بترسم الرسم البياني بالساعات
}

// ==========================================
// 5. زراير البلاغات
// ==========================================
function setupReports() {
  document.querySelectorAll('.reports button').forEach(btn => {
    btn.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastReportTime < 60000) {
        alert("استنى دقيقة قبل ما تبعت بلاغ تاني.");
        return;
      }
      const type = btn.getAttribute('data-r');
      const reportRef = ref(db, 'reports/' + type);
      onValue(reportRef, (snapshot) => {
        const currentCount = snapshot.val() || 0;
        set(reportRef, currentCount + 1);
        if ($("r_" + type)) $("r_" + type).innerText = currentCount + 1;
      }, { onlyOnce: true });
      lastReportTime = now;
      alert("تم إرسال بلاغك، شكراً لك!");
    });
  });
}

// ==========================================
// 6. تشغيل التطبيق — مستمع (listener) واحد بس بدل الاتنين المكررين
// ==========================================
function init() {
  setupReports();

  const carRef = ref(db, 'carCount');
  // ملحوظة: مفيش حالياً مصدر حقيقي لحالة العبّارة نفسها.
  // لو عايز تتحكم فيها فعلياً، ضيف قيمة 'running' أو 'stopped' تحت المسار ده في الـ Realtime Database.
  const ferryRef = ref(db, 'ferryStatus');

  let currentFerryStatus = "running";

  onValue(ferryRef, (snapshot) => {
    currentFerryStatus = snapshot.val() || "running";
  });

  onValue(carRef, async (snapshot) => {
    const waiting = snapshot.val() || 0;
    render(waiting, currentFerryStatus);
    await recordAndLoadHistory(waiting);
  }, (err) => console.error("حصل خطأ في جلب البيانات:", err));
}

init();
