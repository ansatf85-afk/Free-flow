# فري فلو — تطبيق متابعة طابور عبّارة بورسعيد ⇄ بورفؤاد

تطبيق ويب (PWA) بيتثبت على الموبايل زي أي تطبيق، وبيقرأ بيانات الحساسات من Google Sheets.

## 1) تشغيله على GitHub Pages (مجاني)
1. ارفع كل الملفات (ماعدا مجلد `apps-script`) على Repository جديد.
2. من Settings ← Pages ← Source: `main` / root ← Save.
3. الرابط هيظهر بعد دقيقة: `https://اسمك.github.io/اسم-الريبو/`
4. افتح الرابط من الموبايل ← "تثبيت التطبيق" أو Add to Home Screen.

الوضع الافتراضي **تجريبي** (بيانات وهمية) لحد ما تربط الشيت.

## 2) ربطه بالبيانات الحقيقية
1. افتح الـ Google Sheet ← Extensions ← Apps Script.
2. الصق محتوى `apps-script/Code.gs` (عدّل أرقام الأعمدة لو مختلفة).
3. Deploy ← New deployment ← Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. انسخ الـ Web app URL وحطه في `config.js`:
   ```js
   API_URL: "https://script.google.com/macros/s/XXXX/exec",
   ```
5. ارفع التعديل على GitHub، والتطبيق هيعرض الداتا الحقيقية.

## 3) الإعدادات (config.js)
سعة العبّارة، وقت الرحلة، وحدود الزحمة (أخضر / أصفر / أحمر) كلها قابلة للتعديل.
