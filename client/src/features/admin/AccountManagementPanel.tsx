import { useMemo, useState, type FormEvent } from "react";
import { Clipboard, KeyRound, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type ManagedRole = "user" | "instructor" | "admin";

const roleLabels: Record<ManagedRole, string> = {
  user: "متعلم",
  instructor: "مدرّس",
  admin: "مدير",
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "user" as ManagedRole,
};

export default function AccountManagementPanel() {
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; role: ManagedRole; password: string } | null>(null);
  const accounts = trpc.admin.managedAccounts.useQuery(undefined, { refetchInterval: 30_000 });
  const createAccount = trpc.admin.createAccount.useMutation({
    onSuccess: async result => {
      setCreatedCredentials({
        name: result.account.name || "CyberJocx user",
        email: result.account.email || "",
        role: result.account.role,
        password: form.password,
      });
      setForm(emptyForm);
      await accounts.refetch();
      toast.success("تم إنشاء الحساب بنجاح.");
    },
    onError: error => toast.error(error.message || "تعذر إنشاء الحساب."),
  });

  const rows = accounts.data ?? [];
  const counts = useMemo(() => ({
    total: rows.length,
    admins: rows.filter(row => row.role === "admin").length,
    instructors: rows.filter(row => row.role === "instructor").length,
    users: rows.filter(row => row.role === "user").length,
  }), [rows]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(row =>
      (row.name || "").toLowerCase().includes(query) ||
      (row.email || "").toLowerCase().includes(query) ||
      row.role.toLowerCase().includes(query) ||
      String(row.id).includes(query)
    );
  }, [rows, search]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين.");
      return;
    }
    createAccount.mutate({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    });
  };

  const copyCredentials = async () => {
    if (!createdCredentials) return;
    const text = [
      "CyberJocx account",
      "Name: " + createdCredentials.name,
      "Email: " + createdCredentials.email,
      "Role: " + roleLabels[createdCredentials.role],
      "Initial password: " + createdCredentials.password,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم نسخ بيانات الدخول. ابعتها لصاحب الحساب بشكل آمن.");
    } catch {
      toast.error("المتصفح منع النسخ التلقائي. انسخ بيانات الدخول يدويًا.");
    }
  };

  return (
    <section className="module-stack cj-account-management">
      <header className="admin-hero panel-card">
        <div className="section-tag">// IDENTITY & ACCESS CONTROL</div>
        <h2>إدارة حسابات CyberJocx</h2>
        <p>أنشئ حساب متعلم أو مدرّس أو مدير من لوحة التحكم مباشرة. الحساب الجديد يقدر يدخل من صفحة تسجيل الدخول بالبريد وكلمة المرور التي تحددها.</p>
      </header>

      <div className="admin-metrics">
        <div className="admin-metric panel-card"><Users size={18} /><strong>{counts.total}</strong><span>ALL ACCOUNTS</span></div>
        <div className="admin-metric panel-card"><ShieldCheck size={18} /><strong>{counts.admins}</strong><span>ADMINS</span></div>
        <div className="admin-metric panel-card"><KeyRound size={18} /><strong>{counts.instructors}</strong><span>INSTRUCTORS</span></div>
        <div className="admin-metric panel-card"><Users size={18} /><strong>{counts.users}</strong><span>LEARNERS</span></div>
      </div>

      <form className="admin-editor panel-card" onSubmit={submit}>
        <div className="card-head">
          <div><div className="section-tag">// CREATE ACCOUNT</div><h3><UserPlus size={17} /> إنشاء حساب جديد</h3></div>
          <span className="status-chip">ADMIN CONTROL</span>
        </div>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>اسم صاحب الحساب</span>
            <input required minLength={2} maxLength={120} autoComplete="name" value={form.name} onChange={event => setForm(old => ({ ...old, name: event.target.value }))} placeholder="الاسم بالكامل" />
          </label>
          <label className="admin-field">
            <span>البريد الإلكتروني</span>
            <input required type="email" maxLength={320} autoComplete="email" value={form.email} onChange={event => setForm(old => ({ ...old, email: event.target.value }))} placeholder="name@example.com" />
          </label>
          <label className="admin-field">
            <span>كلمة المرور الأولية (8–128 حرف)</span>
            <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={event => setForm(old => ({ ...old, password: event.target.value }))} placeholder="اكتب كلمة مرور قوية" />
          </label>
          <label className="admin-field">
            <span>تأكيد كلمة المرور</span>
            <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={form.confirmPassword} onChange={event => setForm(old => ({ ...old, confirmPassword: event.target.value }))} placeholder="أعد كتابة كلمة المرور" />
          </label>
          <label className="admin-field full">
            <span>نوع الحساب والصلاحية</span>
            <select value={form.role} onChange={event => setForm(old => ({ ...old, role: event.target.value as ManagedRole }))}>
              <option value="user">User — متعلم</option>
              <option value="instructor">Instructor — مدرّس</option>
              <option value="admin">Admin — مدير المنصة</option>
            </select>
          </label>
        </div>
        <button className="primary-button" type="submit" disabled={createAccount.isPending || !form.name.trim() || !form.email.trim() || form.password.length < 8 || form.password !== form.confirmPassword}>
          <UserPlus size={15} /> {createAccount.isPending ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
        </button>
      </form>

      {createdCredentials && (
        <section className="system-alert" role="status">
          <ShieldCheck size={17} />
          <div className="flex-1 min-w-0">
            <strong>تم إنشاء حساب {roleLabels[createdCredentials.role]}.</strong>
            <p>{createdCredentials.name} · {createdCredentials.email}</p>
            <p>كلمة المرور الأولية: <code>{createdCredentials.password}</code></p>
            <p>احتفظ ببيانات الدخول وشاركها مع صاحب الحساب بشكل خاص، ولا ترسلها في قناة عامة.</p>
          </div>
          <button type="button" className="small-button" onClick={() => void copyCredentials()}><Clipboard size={14} /> نسخ بيانات الدخول</button>
          <button type="button" className="small-button" onClick={() => setCreatedCredentials(null)}>إخفاء</button>
        </section>
      )}

      <section className="admin-table panel-card">
        <div className="card-head">
          <div><div className="section-tag">// ACCOUNT DIRECTORY</div><h3>الحسابات المسجلة</h3></div>
          <span>{filteredRows.length} / {rows.length}</span>
        </div>
        <label className="admin-field">
          <span>بحث بالاسم أو البريد أو رقم الحساب</span>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="pl-9" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="ابحث عن حساب..." />
          </div>
        </label>
        {accounts.isLoading ? <p>جارٍ تحميل الحسابات...</p> : accounts.error ? <p className="text-destructive">تعذر تحميل قائمة الحسابات: {accounts.error.message}</p> : filteredRows.length ? filteredRows.map(account => (
          <article className="cj-admin-review-row" key={account.id}>
            <div className="min-w-0">
              <strong>{account.name || "بدون اسم"}</strong>
              <small>{account.email || "بدون بريد"} · #{account.id}</small>
              <small>إنشاء: {new Date(account.createdAt).toLocaleDateString("ar-EG")} · آخر دخول: {account.lastSignedIn ? new Date(account.lastSignedIn).toLocaleDateString("ar-EG") : "لم يسجل الدخول بعد"}</small>
            </div>
            <span className="status-chip">{roleLabels[account.role as ManagedRole] || account.role}</span>
          </article>
        )) : <p>مفيش حسابات مطابقة لبحثك.</p>}
      </section>
    </section>
  );
}
