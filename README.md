<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>التطبيق الإسلامي الشامل</title>
  <style>
    body {
      font-family: "Amiri", serif;
      background: #f0f8f5;
      color: #222;
      text-align: center;
      direction: rtl;
    }
    header {
      background: #2d6a4f;
      color: #fff;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    section {
      background: #fff;
      margin: 10px;
      padding: 15px;
      border-radius: 12px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    h2 {
      color: #2d6a4f;
    }
    button {
      background: #2d6a4f;
      color: #fff;
      border: none;
      padding: 10px 20px;
      margin: 5px;
      border-radius: 8px;
      cursor: pointer;
    }
    button:hover {
      background: #1b4332;
    }
    #compass {
      width: 200px;
      height: 200px;
      border: 5px solid #2d6a4f;
      border-radius: 50%;
      margin: 20px auto;
      position: relative;
    }
    #needle {
      width: 4px;
      height: 90px;
      background: red;
      position: absolute;
      top: 10px;
      left: 50%;
      transform-origin: bottom center;
      transform: rotate(0deg);
    }
  </style>
</head>
<body>
  <header>
    <h1>🌙 التطبيق الإسلامي الشامل</h1>
  </header>

  <!-- مواقيت الصلاة -->
  <section>
    <h2>🕌 مواقيت الصلاة</h2>
    <p>الفجر: <span id="fajr">--</span></p>
    <p>الظهر: <span id="dhuhr">--</span></p>
    <p>العصر: <span id="asr">--</span></p>
    <p>المغرب: <span id="maghrib">--</span></p>
    <p>العشاء: <span id="isha">--</span></p>
    <p>📅 التاريخ الهجري: <span id="date"></span></p>
  </section>

  <!-- بوصلة القبلة -->
  <section>
    <h2>🧭 اتجاه القبلة</h2>
    <div id="compass">
      <div id="needle"></div>
    </div>
    <p>وجّه سهم البوصلة نحو الكعبة</p>
  </section>

  <!-- الأذكار -->
  <section>
    <h2>📿 أذكار الصباح والمساء</h2>
    <p id="zekr">"أستغفر الله الذي لا إله إلا هو الحي القيوم وأتوب إليه"</p>
    <button onclick="nextZekr()">التالي ➡</button>
  </section>

  <!-- مسبحة إلكترونية -->
  <section>
    <h2>🔢 المسبحة الإلكترونية</h2>
    <p>العدد الحالي: <span id="count">0</span></p>
    <button onclick="tasbeeh()">سبحان الله</button>
    <button onclick="reset()">إعادة التصفير</button>
  </section>

  <audio id="azanSound" src="https://www.islamcan.com/audio/adhan/azan1.mp3"></audio>

  <script>
    const meccaLat = 21.4225;
    const meccaLon = 39.8262;

    // قائمة الأذكار
    const azkar = [
      "أستغفر الله الذي لا إله إلا هو الحي القيوم وأتوب إليه",
      "سبحان الله وبحمده، سبحان الله العظيم",
      "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير",
      "اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور"
    ];
    let currentZekr = 0;

    function nextZekr() {
      currentZekr = (currentZekr + 1) % azkar.length;
      document.getElementById("zekr").textContent = azkar[currentZekr];
    }

    // مسبحة
    let count = 0;
    function tasbeeh() {
      count++;
      document.getElementById("count").textContent = count;
    }
    function reset() {
      count = 0;
      document.getElementById("count").textContent = count;
    }

    // الحصول على الموقع الجغرافي
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      alert("المتصفح لا يدعم تحديد الموقع.");
    }

    function success(position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // جلب مواقيت الصلاة
      fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`)
        .then(response => response.json())
        .then(data => {
          const timings = data.data.timings;
          document.getElementById("fajr").textContent = timings.Fajr;
          document.getElementById("dhuhr").textContent = timings.Dhuhr;
          document.getElementById("asr").textContent = timings.Asr;
          document.getElementById("maghrib").textContent = timings.Maghrib;
          document.getElementById("isha").textContent = timings.Isha;
          document.getElementById("date").textContent = data.data.date.hijri.date + " هـ";

          // تنبيه صوتي قبل الأذان بـ 5 دقائق
          scheduleNotification(timings);
        });

      // حساب زاوية القبلة
      const qiblaAngle = calculateQibla(lat, lon, meccaLat, meccaLon);

      // تشغيل مستشعر البوصلة
      if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientationabsolute", (event) => {
          if (event.alpha !== null) {
            let heading = event.alpha;
            let angle = qiblaAngle - heading;
            document.getElementById("needle").style.transform = `rotate(${angle}deg)`;
          }
        }, true);
      }
    }

    function error() {
      alert("تعذر الحصول على موقعك.");
    }

    function calculateQibla(lat1, lon1, lat2, lon2) {
      let φ1 = lat1 * Math.PI / 180;
      let φ2 = lat2 * Math.PI / 180;
      let Δλ = (lon2 - lon1) * Math.PI / 180;
      let y = Math.sin(Δλ) * Math.cos(φ2);
      let x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      let θ = Math.atan2(y, x);
      return (θ * 180 / Math.PI + 360) % 360;
    }

    function scheduleNotification(timings) {
      const audio = document.getElementById("azanSound");
      const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

      prayerNames.forEach(prayer => {
        let time = timings[prayer];
        let now = new Date();
        let [h, m] = time.split(":");
        let prayerTime = new Date();
        prayerTime.setHours(h, m, 0, 0);

        // قبل الأذان بـ 5 دقائق
        prayerTime.setMinutes(prayerTime.getMinutes() - 5);

        let delay = prayerTime - now;
        if (delay > 0) {
          setTimeout(() => {
            alert(`⏰ تذكير: اقترب وقت صلاة ${prayer}`);
            audio.play();
          }, delay);
        }
      });
    }
  </script>
</body>
</html># elian
تطبيق اسلامي 
