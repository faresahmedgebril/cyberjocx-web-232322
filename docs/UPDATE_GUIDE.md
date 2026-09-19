# دليل تحديث CyberJocx ونشره

هذا الدليل يشرح الطريقة الآمنة لتعديل الكود ورفع التحديثات إلى GitHub. المستودع هو `faresahmedgebril/cyberjocx-web-232322` والفرع المنشور هو `main`.

## 1. تجهيز المشروع لأول مرة

```bash
git clone https://github.com/faresahmedgebril/cyberjocx-web-232322.git
cd cyberjocx-web-232322
pnpm install --frozen-lockfile
```

لا تضع أسرار الإنتاج داخل الملفات أو داخل Git. انسخ `.env.example` إلى `.env` محليًا، وضع القيم المحلية فقط. ملف `.env` مستثنى من Git عبر `.gitignore`.

## 2. إنشاء فرع للتعديل

```bash
git checkout -b feature/اسم-التعديل
```

عدّل الملفات المطلوبة، ثم شغّل الفحوصات:

```bash
pnpm typecheck
pnpm test
pnpm build
```

لا ترفع التعديل إذا فشل أي أمر من الأوامر السابقة.

## 3. حفظ التعديل ورفعه إلى GitHub

```bash
git add .
git commit -m "وصف مختصر للتعديل"
git push -u origin feature/اسم-التعديل
```

بعد الرفع، افتح GitHub وأنشئ Pull Request من الفرع إلى `main`. راجع الملفات والتغييرات، ثم ادمج Pull Request بعد نجاح الفحوصات.

إذا كان التعديل صغيرًا ومراجعًا، يمكن رفعه مباشرة إلى `main`:

```bash
git checkout main
git pull --ff-only origin main
git add .
git commit -m "وصف مختصر للتعديل"
git push origin main
```

## 4. النشر التلقائي

بعد ربط GitHub:

- Cloudflare Pages يبني الواجهة من فرع `main`.
- Render يبني خدمة الـAPI من فرع `main` إذا كانت خدمة Render منشأة ومفعّلة.
- لا ترفع `dist/` أو `node_modules/` أو `.env`.
- راقب سجل Actions أو سجل البناء في المنصة بعد كل Push.

## 5. متغيرات Cloudflare Pages

ضع المتغيرات العامة فقط في Pages:

```text
VITE_API_BASE_URL=https://رابط-الباك-إند-على-render.onrender.com
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

لا تضع في Cloudflare Pages: `DATABASE_URL` أو `JWT_SECRET` أو `GOOGLE_CLIENT_SECRET` أو `CRON_SECRET` أو مفاتيح التخزين أو مفتاح الذكاء الاصطناعي.

إعدادات البناء:

```text
Build command: pnpm install --frozen-lockfile && pnpm build:client
Output directory: dist/public
Production branch: main
```

## 6. متغيرات Render API

القيم التالية مطلوبة في خدمة الـAPI الإنتاجية:

```text
NODE_ENV=production
SERVICE_ROLE=api
PORT=10000
TRUST_PROXY=true
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DATABASE
APP_WEB_URL=https://PROJECT.pages.dev
CORS_ORIGINS=https://PROJECT.pages.dev
JWT_SECRET=قيمة عشوائية طويلة لا تقل عن 32 حرفًا
SESSION_COOKIE_SAMESITE=none
SESSION_COOKIE_SECURE=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://API.onrender.com/api/auth/google/callback
CRON_SECRET=قيمة عشوائية طويلة
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=...
STORAGE_REGION=auto
STORAGE_BUCKET=...
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
STORAGE_PUBLIC_BASE_URL=...
AI_API_KEY=...
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
NVD_API_URL=https://services.nvd.nist.gov/rest/json/cves/2.0
NVD_API_KEY=...
LOG_LEVEL=info
```

ضع `GOOGLE_CLIENT_SECRET` ومفاتيح التخزين والـAI وقاعدة البيانات في Render فقط. لا تضعها في GitHub أو Cloudflare.

## 7. التحقق بعد النشر

استبدل الروابط الفعلية ثم نفّذ:

```bash
curl -fsS https://API.onrender.com/health
curl -fsS https://API.onrender.com/ready
```

يجب أن يعيد `/health` استجابة ناجحة. ويجب أن يعيد `/ready` حالة ناجحة بعد اتصال قاعدة البيانات. افتح رابط Pages وتحقق من تحميل الواجهة، ثم اختبر تسجيل Google، إنشاء جلسة، تسجيل الخروج، وطلبات الـAPI من المتصفح.

## 8. التحقق من الربط التلقائي

1. ادخل إلى GitHub وافتح آخر commit على `main`.
2. افتح Cloudflare Pages وتحقق من وجود Production Deployment بنفس commit SHA.
3. افتح Render وتحقق من وجود Deploy بنفس commit SHA.
4. غيّر نصًا غير حساس في الواجهة، شغّل الفحوصات، ثم ارفع commit صغيرًا.
5. راقب أن Cloudflare يبدأ Build تلقائيًا وأن Render يبدأ Deploy تلقائيًا.
6. افتح الموقع بعد اكتمال النشر وتأكد من ظهور التعديل.

إذا لم يبدأ البناء، تحقق من أن GitHub App متصل بالحساب الصحيح، وأن `main` هو Production Branch، وأن إعدادات Auto Deploy مفعّلة.

## 9. قواعد الأمان

لا ترسل كلمات المرور أو مفاتيح API داخل المحادثة أو Issues أو Pull Requests. غيّر أي مفتاح تم كشفه، واستخدم Secret/Environment Variable في المنصة. احتفظ بـ`main` مستقرًا، واستخدم فروعًا وPull Requests للتعديلات الكبيرة.
