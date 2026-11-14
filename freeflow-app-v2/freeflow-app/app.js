// ==========================================
// 1. إعدادات Firebase
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://freeflow1-default-rtdb.firebaseio.com"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 2. المتغيرات والدوال المساعدة
// ==========================================
var $ = function (id) { return document.getElementById(id); };
var lastReportTime = 0;

// ==========================================
// 3. جلب البيانات من Firebase (لايف)
// ==========================================
function load() {
  return new Promise((resolve) => {
    const carRef = ref(db, 'carCount');
    onValue(carRef, (snapshot) => {
      const count = snapshot.val() || 0;
      const now = new Date();
      let history = [];
      for (let i = 0; i <= now.getHours(); i++) {
        history.push({ hour: i, waiting: Math.floor(Math.random() * 10) }); 
      }

      resolve({
        updated: now.toISOString(),
        waiting: count,
        status: "open",
        message: "زحمة خفيفة", // <--- خليتها ثابتة هنا
        loaded: count * 12, 
        history: history
      });
    });
  });
}

// ==========================================
// 4. دالة عرض البيانات على الشاشة (UI)
// ==========================================
function render(data) {
  if ($("waiting")) $("waiting").innerText = data.waiting;
  if ($("loaded")) $("loaded").innerText = data.loaded;
  
  if ($("statusText")) $("statusText").innerText = data.message;
  if ($("ferryState")) $("ferryState").innerText = "شغالة";
  
  const statusCard = $("statusCard");
  if (statusCard) {
    // خليت اللون دايماً أخضر (low) مهما كان الرقم
    statusCard.setAttribute("data-level", "low");
  }

  if ($("wait")) {
    let waitTime = Math.ceil(data.waiting * 1.5);
    $("wait").innerText = waitTime;
  }

  if ($("updated")) {
    let d = new Date(data.updated);
    $("updated").innerText = d.toLocaleTimeString('ar-EG');
  }

  if ($("tip")) {
    if (data.waiting === 0) $("tip").innerText = "الوضع ممتاز، توكل على الله.";
    else $("tip").innerText = "زحمة خفيفة، متوقع تخلص قريب.";
  }

  if ($("bestTime")) $("bestTime").innerText = "بعد الساعة 10 مساءً (متوقع)";
}

// ==========================================
// 5. زراير البلاغات
// ==========================================
function setupReports() {
  const buttons = document.querySelectorAll('.reports button');
  buttons.forEach(btn => {
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
// 6. تشغيل التطبيق
// ==========================================
async function init() {
  try {
    const data = await load();
    render(data);
    setupReports();
    
    const carRef = ref(db, 'carCount');
    onValue(carRef, (snapshot) => {
      const count = snapshot.val() || 0;
      render({
        updated: new Date().toISOString(),
        waiting: count,
        status: "open",
        message: "زحمة خفيفة", // <--- ثابتة هنا كمان
        loaded: count * 12,
        history: []
      });
    });
  } catch (err) {
    console.error("حصل خطأ:", err);
  }
}

init();
