import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "wouter";
import { ArrowLeft, LifeBuoy, LoaderCircle, Mail, Send, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "@/features/api/config";
import "./SupportPage.css";

type Notice = { kind: "error" | "success"; text: string } | null;

const categories = [
  { value: "account", label: "الحساب وتسجيل الدخول" },
  { value: "password", label: "نسيت كلمة المرور" },
  { value: "technical", label: "مشكلة تقنية" },
  { value: "courses", label: "الدورات والتعلّم" },
  { value: "billing", label: "الاشتراكات والمدفوعات" },
  { value: "security", label: "بلاغ أمني" },
  { value: "other", label: "موضوع آخر" },
];

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("account");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const response = await fetch(API_BASE_URL + "/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), category, subject: subject.trim(), message: message.trim(), website }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.message === "string" ? result.message : "تعذر إرسال رسالتك الآن. حاول مرة أخرى.");
      }
      setNotice({ kind: "success", text: "وصل طلبك بنجاح إلى فريق الدعم. هنراجع المشكلة ونتواصل معاك على البريد اللي سجلته." });
      setName("");
      setEmail("");
      setCategory("account");
      setSubject("");
      setMessage("");
      setWebsite("");
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "حصل خطأ غير متوقع. حاول مرة أخرى." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="support-page" dir="rtl">
      <div className="support-shell">
        <header className="support-topbar">
          <Link href="/" className="support-brand">Cyber<span>Jocx</span></Link>
          <Link href="/login" className="support-login-link">العودة لتسجيل الدخول <ArrowLeft size={16} /></Link>
        </header>

        <section className="support-card">
          <div className="support-icon"><LifeBuoy size={27} /></div>
          <p className="support-kicker">CYBERJOCX // SUPPORT CENTER</p>
          <h1>إزاي نقدر نساعدك؟</h1>
          <p className="support-intro">ابعت تفاصيل المشكلة، ومش لازم تكون مسجل دخول عشان تتواصل معانا. هنرد عليك على البريد الإلكتروني اللي هتكتبه.</p>

          <form onSubmit={submit} className="support-form">
            <div className="support-fields">
              <label>الاسم
                <input value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={100} autoComplete="name" required placeholder="اسمك" />
              </label>
              <label>البريد الإلكتروني
                <input type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={320} autoComplete="email" required placeholder="name@example.com" />
              </label>
            </div>

            <label>نوع المشكلة
              <select value={category} onChange={event => setCategory(event.target.value)}>
                {categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <label>عنوان الرسالة
              <input value={subject} onChange={event => setSubject(event.target.value)} minLength={5} maxLength={140} required placeholder="اكتب عنوان مختصر للمشكلة" />
            </label>

            <label>تفاصيل المشكلة
              <textarea value={message} onChange={event => setMessage(event.target.value)} minLength={20} maxLength={5000} rows={7} required placeholder="اشرح اللي حصل، والخطوات اللي عملتها، وأي رسالة خطأ ظهرت لك..." />
            </label>

            <label className="support-honeypot" aria-hidden="true" tabIndex={-1}>اترك هذا الحقل فارغًا
              <input value={website} onChange={event => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
            </label>

            <p className="support-safety-note"><ShieldCheck size={16} /> متبعتش كلمة المرور أو كود التحقق أو بيانات الدفع في الرسالة.</p>

            {notice && <div className={"support-notice " + notice.kind} role="status" aria-live="polite">{notice.text}</div>}

            <button className="support-submit" type="submit" disabled={busy}>
              {busy ? <><LoaderCircle className="support-spinner" size={19} /> جاري الإرسال...</> : <><Send size={18} /> إرسال إلى الدعم الفني</>}
            </button>
          </form>

          <footer className="support-footer"><Mail size={16} /> تقدر كمان تراسلنا على <a href="mailto:gebrilfares972@gmail.com">gebrilfares972@gmail.com</a></footer>
        </section>
      </div>
    </main>
  );
}
