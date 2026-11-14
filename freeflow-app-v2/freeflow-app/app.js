// 1. تحميل مكتبة Firebase (الطريقة القديمة)
var script = document.createElement('script');
script.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
document.head.appendChild(script);

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

  // 3. قراءة البيانات وتحديث الشاشة لايف
  db.ref('carCount').on('value', function(snapshot) {
    var count = snapshot.val() || 0;
    
    // أ. تحديث عدد السيارات المنتظرة
    var waitingEl = document.getElementById('waiting');
    if (waitingEl) waitingEl.innerText = count;

    // ب. تحديث حالة الطابور (بناءً على الرقم)
    var statusEl = document.getElementById('statusText');
    if (statusEl) {
      if (count === 0) statusEl.innerText = "الطابور هادي";
      else if (count <= 20) statusEl.innerText = "زحمة خفيفة";
      else statusEl.innerText = "زحمة شديدة";
    }

    // ج. تحديث وقت الانتظار (افترضنا كل عربية بتاخد 3 دقايق)
    var waitEl = document.getElementById('wait');
    if (waitEl) waitEl.innerText = count * 3;

    // د. تحديث سيارات اليوم (لو الرقم تراكمي، هيظهر كده)
    var loadedEl = document.getElementById('loaded');
    if (loadedEl) loadedEl.innerText = count * 5;

    // هـ. تحديث وقت آخر تحديث
    var updatedEl = document.getElementById('updated');
    if (updatedEl) updatedEl.innerText = new Date().toLocaleTimeString('ar-EG');

    // و. إخفاء كلمة "جاري التحميل" لو كانت ظاهرة في مكان تاني
    var loadingTexts = document.querySelectorAll('.pill');
    loadingTexts.forEach(function(el) {
      if (el.innerText.includes("جاري")) el.style.display = 'none';
    });
  });
};
