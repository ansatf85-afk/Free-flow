// تحميل مكتبة Firebase
var script = document.createElement('script');
script.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
document.head.appendChild(script);

var script2 = document.createElement('script');
script2.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
document.head.appendChild(script2);

script2.onload = function() {
  // إعدادات Firebase
  var firebaseConfig = {
    databaseURL: "https://freeflow1-default-rtdb.firebaseio.com"
  };
  firebase.initializeApp(firebaseConfig);
  var db = firebase.database();

  // جلب البيانات
  db.ref('carCount').on('value', function(snapshot) {
    var count = snapshot.val() || 0;
    
    // تحديث الشاشة
    if (document.getElementById('waiting')) {
      document.getElementById('waiting').innerText = count;
    }
    if (document.getElementById('statusText')) {
      if (count === 0) document.getElementById('statusText').innerText = "الطابور هادي";
      else if (count < 10) document.getElementById('statusText').innerText = "زحمة خفيفة";
      else document.getElementById('statusText').innerText = "زحمة شديدة";
    }
    if (document.getElementById('wait')) {
      document.getElementById('wait').innerText = Math.ceil(count * 1.5);
    }
    if (document.getElementById('loaded')) {
      document.getElementById('loaded').innerText = count * 10;
    }
    if (document.getElementById('updated')) {
      document.getElementById('updated').innerText = new Date().toLocaleTimeString('ar-EG');
    }
  });
};
