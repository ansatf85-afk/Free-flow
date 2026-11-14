// ==========================================
// 1. إعدادات Firebase
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://freeflow1-default-rtdb.firebaseio.com"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 2. المتغيرات والدوال المساعدة
// ==========================================
var $ = function (id) { return document.getElementById(id); };
var lastReportTime = 0; // عشان نمنع السبام في زراير البلاغات

// ==========================================
// 3. جلب البيانات من Firebase (لايف)
// ==========================================
function load() {
  return new Promise((resolve) => {
    const carRef = ref(db, 'carCount');
    
    // onValue بتخلي الموقع يسمع أي تحديث بيحصل في Firebase
    onValue(carRef, (snapshot) => {
      const count = snapshot.val() || 0;
      const now = new Date();
      
      // محاكاة لبيانات الرسم البياني (ممكن نطورها بعدين)
      let history = [];
      for (let i = 0; i <= now.getHours(); i++) {
        history.push({ hour: i, waiting: Math.floor(Math.random() * 10) }); 
      }

      resolve({
        updated: now.toISOString(),
        waiting: count,
        status: count > 15 ? "busy" : "open",
        message: count > 15 ? "زحمة شديدة" : (count > 0 ? "زحمة خفيفة" : "الرحلات منتظمة"),
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
  // 1. تحديث عدد السيارات
  if ($("waiting")) $("waiting").innerText = data.waiting;
  if ($("loaded")) $("loaded").innerText = data.loaded;
  
  // 2. تحديث حالة العبّارة والنص
  if ($("statusText")) $("statusText").innerText = data.message;
  if ($("ferryState")) $("ferryState").innerText = data.status === "open" ? "شغالة" : "واقفة";
  
  // 3. تحديث كارت الحالة (لون أخضر/أحمر)
  const statusCard = $("statusCard");
  if (statusCard) {
    if (data.waiting > 15) statusCard.setAttribute("data-level", "high");
    else if (data.waiting > 5) statusCard.setAttribute("data-level", "medium");
    else statusCard.setAttribute("data-level", "low");
  }

  // 4. حساب وقت الانتظار (كل سيارة = دقيقة ونص)
  if ($("wait")) {
    let waitTime = Math.ceil(data.waiting * 1.5);
    $("wait").innerText = waitTime;
  }

  // 5. تحديث وقت آخر تحديث
  if ($("updated")) {
    let d = new Date(data.updated);
    $("updated").innerText = d.toLocaleTimeString('ar-EG');
  }

  // 6. نصيحة الآن (بتتغير حسب الزحمة)
  if ($("tip")) {
    if (data.waiting === 0) $("tip").innerText = "الوضع ممتاز، توكل على الله.";
    else if (data.waiting < 10) $("tip").innerText = "زحمة خفيفة، متوقع تخلص قريب.";
    else $("tip").innerText = "زحمة شديدة، يفضل تستنى شوية.";
  }

  // 7. أنسب وقت للسفر
  if ($("bestTime")) $("bestTime").innerText = "بعد الساعة 10 مساءً (متوقع)";
}

// ==========================================
// 5. زراير البلاغات (عشان تشتغل مع Firebase)
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
      
      // زيادة العداد في Firebase
      onValue(reportRef, (snapshot) => {
        const currentCount = snapshot.val() || 0;
        set(reportRef, currentCount + 1);
        // تحديث الشاشة
        if ($("r_" + type)) $("r_" + type).innerText = currentCount + 1;
      }, { onlyOnce: true });
      
      lastReportTime = now;
      alert("تم إرسال بلاغك، شكراً لك!");
    });
  });
}

// ==========================================
// 6. تشغيل التطبيق أول ما الصفحة تفتح
// ==========================================
async function init() {
  try {
    // نجيب البيانات الأولية
    const data = await load();
    render(data); // نعرضها على الشاشة
    
    // نجهز الزراير
    setupReports();
    
    // نسمع للتحديثات اللايف من الحساس
    const carRef = ref(db, 'carCount');
    onValue(carRef, (snapshot) => {
      const count = snapshot.val() || 0;
      // كل ما الرقم يتغير في Firebase، بنحدث الشاشة على طول
      render({
        updated: new Date().toISOString(),
        waiting: count,
        status: count > 15 ? "busy" : "open",
        message: count > 15 ? "زحمة شديدة" : (count > 0 ? "زحمة خفيفة" : "الرحلات منتظمة"),
        loaded: count * 12,
        history: []
      });
    });
    
  } catch (err) {
    console.error("حصل خطأ:", err);
  }
}

// نبدأ الشغل
init();
