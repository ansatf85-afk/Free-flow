// 1. تحميل مكتبة Firebase (الطريقة القديمة اللي بتشتغل على طول)
var script1 = document.createElement('script');
script1.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
document.head.appendChild(script1);

var script2 = document.createElement('script');
script2.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
document.head.appendChild(script2);

script2.onload = function() {
  // 2. إعدادات Firebase
  var firebaseConfig = {
    databaseURL: "https://freeflow1-default-rtdb.firebaseio.com"
  };
  firebase.initializeApp(firebaseConfig);
  var db = firebase.database();

  // 3. دالة جلب البيانات من Firebase
  function loadData() {
    db.ref('carCount').on('value', function(snapshot) {
      var count = snapshot.val() || 0;
      updateUI(count);
    });
  }

  // 4. دالة تحديث الشاشة (بتعرض الأرقام في مكانها)
  function updateUI(count) {
    // تحديث عدد السيارات
    var waitingEl = document.getElementById('waiting');
    if (waitingEl) waitingEl.innerText = count;

    // تحديث نص الحالة
    var statusEl = document.getElementById('statusText');
    if (statusEl) {
      if (count === 0) statusEl.innerText = "الطابور هادي";
      else if (count < 10) statusEl.innerText = "زحمة خفيفة";
      else statusEl.innerText = "زحمة شديدة";
    }

    // تحديث وقت الانتظار (كل عربية = دقيقة ونص)
    var waitEl = document.getElementById('wait');
    if (waitEl) waitEl.innerText = Math.ceil(count * 1.5);

    // تحديث سيارات اليوم (افتراضي: الرقم × 10)
    var loadedEl = document.getElementById('loaded');
    if (loadedEl) loadedEl.innerText = count * 10;

    // تحديث وقت آخر تحديث
    var updatedEl = document.getElementById('updated');
    if (updatedEl) updatedEl.innerText = new Date().toLocaleTimeString('ar-EG');
  }

  // 5. تشغيل السكريبت
  loadData();
};
