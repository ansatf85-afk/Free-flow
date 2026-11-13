(function () {
  "use strict";
  var C = window.CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var DEMO = !C.API_URL;

  var localReports = { long_queue: 0, short_queue: 0, ferry_stopped: 0, ferry_running: 0 };

  // ---------- بيانات تجريبية ----------
  function demoData() {
    var now = new Date();
    var h = now.getHours() + now.getMinutes() / 60;
    // ذروة الصبح (8) وذروة المغرب (17)
    function curve(x) {
      return 6 + 38 * Math.exp(-Math.pow(x - 8, 2) / 5) + 44 * Math.exp(-Math.pow(x - 17, 2) / 6);
    }
    var history = [];
    for (var i = 0; i <= now.getHours(); i++) {
      history.push({ hour: i, waiting: Math.round(curve(i + 0.5)) });
    }
    var waiting = Math.max(0, Math.round(curve(h) + (Math.random() * 6 - 3)));
    return {
      updated: now.toISOString(),
      waiting: waiting,
      status: "open",
      message: "الرحلات منتظمة",
      loaded: Math.round(h * 22),
      history: history,
      reports: localReports
    };
  }

  // ---------- جلب البيانات ----------
  function load() {
    if (DEMO) { return Promise.resolve(demoData()); }
    return fetch(C.API_URL, { cache: "no-store" }).then(function (r) {
      if (!r.ok) { throw new Error("HTTP " + r.status); }
      return r.json();
    });
  }

  // ---------- العرض ----------
  function level(n) { return n < C.LOW ? "low" : (n >= C.HIGH ? "high" : "mid"); }
  var TEXT = { low: "الطابور هادي", mid: "زحمة متوسطة", high: "زحمة شديدة" };
  var TIP = {
    low: "الوقت مناسب للوصول للعبّارة، الطابور قصير والانتظار قليل.",
    mid: "فيه زحمة متوسطة. لو مش مستعجل، ممكن تنتظر شوية لحد ما الطابور يقل.",
    high: "الزحمة شديدة دلوقتي. لو تقدر تأجل رحلتك شوية، هتوفر وقت كبير في الانتظار."
  };

  function fmtTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) { return "--"; }
    return d.toLocaleString("ar-EG", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" });
  }

  function drawChart(history) {
    var box = $("chart");
    if (!history || !history.length) { box.textContent = "لا توجد بيانات بعد"; return; }
    var W = 320, H = 140, padB = 22, padT = 8;
    var max = Math.max.apply(null, history.map(function (p) { return p.waiting; }).concat([C.HIGH]));
    var nowH = new Date().getHours();
    var bw = W / 24;
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="الزحمة على مدار اليوم">';
    // خط حد الزحمة
    var yHigh = padT + (H - padB - padT) * (1 - C.HIGH / max);
    s += '<line x1="0" x2="' + W + '" y1="' + yHigh + '" y2="' + yHigh + '" stroke="#d63a3a" stroke-dasharray="3 3" opacity=".5"/>';
    history.forEach(function (p) {
      var h = (H - padB - padT) * (p.waiting / max);
      var color = level(p.waiting) === "high" ? "#d63a3a" : (level(p.waiting) === "mid" ? "#e6a100" : "#1f9d55");
      var op = p.hour === nowH ? 1 : 0.65;
      s += '<rect x="' + (p.hour * bw + 1.5) + '" y="' + (H - padB - h) + '" width="' + (bw - 3) +
           '" height="' + h + '" rx="2" fill="' + color + '" opacity="' + op + '"/>';
    });
    [0, 6, 12, 18, 23].forEach(function (hr) {
      s += '<text x="' + (hr * bw + bw / 2) + '" y="' + (H - 6) + '" font-size="9" text-anchor="middle" fill="#6b7b8d">' + hr + "</text>";
    });
    s += "</svg>";
    box.innerHTML = s;
  }

  var prev = { status: null, level: null };

  function notify(title, body) {
    if (!("Notification" in window) || Notification.permission !== "granted") { return; }
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (reg && reg.showNotification) { reg.showNotification(title, { body: body, icon: "icon-192.png", dir: "rtl", lang: "ar" }); }
      else { new Notification(title, { body: body, icon: "icon-192.png" }); }
    });
  }

  function renderStatus(d) {
    var st = d.status === "closed" ? "closed" : "open";
    $("ferryStatus").setAttribute("data-state", st);
    $("ferryState").textContent = st === "open" ? "تعمل الآن" : "متوقفة مؤقتاً";
    $("ferryMsg").textContent = d.message || "";
    if (prev.status && prev.status !== st) {
      notify(st === "open" ? "العبّارة عادت للعمل" : "تنبيه: العبّارة متوقفة", d.message || "");
    }
    prev.status = st;
  }

  function render(d) {
    var w = Number(d.waiting) || 0;
    var lv = level(w);
    renderStatus(d);
    if (prev.level && prev.level !== "high" && lv === "high") {
      notify("زحمة شديدة عند العبّارة", "السيارات المنتظرة: " + w + " — وقت الانتظار تقريباً " + Math.ceil(w / C.FERRY_CAPACITY) * C.TRIP_MINUTES + " دقيقة");
    }
    prev.level = lv;
    $("waiting").textContent = w;
    $("statusCard").setAttribute("data-level", lv);
    $("statusText").textContent = TEXT[lv];
    $("tip").textContent = TIP[lv];
    $("wait").textContent = Math.ceil(w / C.FERRY_CAPACITY) * C.TRIP_MINUTES;
    $("loaded").textContent = d.loaded != null ? d.loaded : "--";
    $("updated").textContent = fmtTime(d.updated);
    drawChart(d.history);
    renderBest(d.history);
    var rp = d.reports || {};
    ["long_queue", "short_queue", "ferry_stopped", "ferry_running"].forEach(function (k) { $("r_" + k).textContent = rp[k] || 0; });

    var ageMin = (Date.now() - new Date(d.updated).getTime()) / 60000;
    $("staleBanner").classList.toggle("hidden", DEMO || !(ageMin > C.STALE_MINUTES));
  }

  function renderBest(history) {
    var nowH = new Date().getHours();
    var pts = (history || []).filter(function (p) { return p.hour !== nowH; });
    if (pts.length < 3) { $("bestTime").textContent = "محتاجين بيانات أكتر عشان نحدد أنسب وقت."; return; }
    var best = pts.reduce(function (a, b) { return b.waiting < a.waiting ? b : a; });
    var worst = pts.reduce(function (a, b) { return b.waiting > a.waiting ? b : a; });
    $("bestTime").textContent = "أهدى وقت النهارده كان الساعة " + best.hour + ":00 (حوالي " + best.waiting + " سيارة)، وأزحم وقت الساعة " + worst.hour + ":00 (حوالي " + worst.waiting + " سيارة).";
  }

  function sendReport(type, btn) {
    btn.disabled = true;
    var done = function (msg) { $("reportMsg").textContent = msg; setTimeout(function () { btn.disabled = false; }, 4000); tick(); };
    if (!C.REPORT_URL) { localReports[type]++; return done("تم (وضع تجريبي) ✓"); }
    fetch(C.REPORT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: type }) })
      .then(function (r) { done(r.ok ? "شكراً على بلاغك ✓" : (r.status === 429 ? "استنى 5 دقايق قبل بلاغ جديد" : "تعذّر الإرسال")); })
      .catch(function () { done("تعذّر الإرسال"); });
  }
  Array.prototype.forEach.call(document.querySelectorAll(".reports button"), function (b) {
    b.addEventListener("click", function () { sendReport(b.getAttribute("data-r"), b); });
  });

  $("shareBtn").addEventListener("click", function () {
    var t = "فري فلو: " + $("statusText").textContent + " — " + $("waiting").textContent + " سيارة منتظرة، الانتظار حوالي " + $("wait").textContent + " دقيقة.";
    if (navigator.share) { navigator.share({ title: "فري فلو", text: t, url: location.href }).catch(function () {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(t + " " + location.href); $("shareBtn").textContent = "تم النسخ ✓"; }
  });

  function tick() {
    load().then(render).catch(function () {
      $("statusText").textContent = "تعذّر تحميل البيانات";
    });
  }

  function fillList(id, items, a, b) {
    $(id).innerHTML = items.map(function (x) {
      return "<li><span>" + x[a] + "</span><span>" + x[b] + "</span></li>";
    }).join("");
  }
  fillList("scheduleList", C.SCHEDULE, "title", "hours");
  fillList("faresList", C.FARES, "name", "price");
  $("mapsBtn").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.MAPS_QUERY);

  function syncNotifyBtn() {
    var b = $("notifyBtn");
    if (!("Notification" in window)) { b.classList.add("hidden"); return; }
    if (Notification.permission === "granted") { b.textContent = "التنبيهات مفعّلة ✓"; b.disabled = true; }
  }
  $("notifyBtn").addEventListener("click", function () {
    Notification.requestPermission().then(syncNotifyBtn);
  });
  syncNotifyBtn();

  $("demoBanner").classList.toggle("hidden", !DEMO);
  tick();
  setInterval(tick, C.REFRESH_SECONDS * 1000);

  // ---------- PWA ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
  var deferred;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    $("installBtn").classList.remove("hidden");
  });
  $("installBtn").addEventListener("click", function () {
    if (!deferred) { return; }
    deferred.prompt();
    deferred = null;
    $("installBtn").classList.add("hidden");
  });
})();
