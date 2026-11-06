import { useEffect, useMemo, useState } from "react";
import {
  Bell, Check, ChevronRight, CreditCard, Globe, Link2, LockKeyhole, Moon,
  Shield, Sun, Trash2, UserRound, Monitor, Pencil, Sparkles, Laptop,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import { loadNotificationPreferences, saveNotificationPreferences } from "./preferences";
import "./settings.css";

type SettingsTab = "account" | "security" | "notifications" | "appearance" | "privacy" | "billing" | "connected" | "language";
type UserSummary = {
  id?: number;
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  memberRank?: string | null;
  loginMethod?: string | null;
};

const settingsTabs: { id: SettingsTab; label: string; icon: typeof UserRound }[] = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Moon },
  { id: "privacy", label: "Privacy", icon: LockKeyhole },
  { id: "billing", label: "Billing & Plans", icon: CreditCard },
  { id: "connected", label: "Connected Accounts", icon: Link2 },
  { id: "language", label: "Language", icon: Globe },
];

const accentColors = ["#2585ff", "#873dff", "#e52b9b", "#19c7ed", "#12cda5", "#f47a36"];

export default function SettingsView({
  user,
  isAuthenticated,
  onOpenProfile,
}: {
  user: UserSummary | null | undefined;
  isAuthenticated: boolean;
  onOpenProfile: () => void;
}) {
  const [tab, setTab] = useState<SettingsTab>("appearance");
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [accent, setAccent] = useState(() => {
    if (typeof window === "undefined") return accentColors[1];
    const savedAccent = window.localStorage.getItem("cyberjocx-accent");
    return savedAccent && accentColors.includes(savedAccent) ? savedAccent : accentColors[1];
  });
  const [comingOpen, setComingOpen] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState(() => loadNotificationPreferences(user?.id));
  const { theme, preference, setThemePreference } = useTheme();
  const activeSessions = trpc.auth.activeSessions.useQuery(undefined, { enabled: isAuthenticated && tab === "security" });
  const revokeOtherSessions = trpc.auth.revokeOtherSessions.useMutation({
    onSuccess: async result => {
      await activeSessions.refetch();
      toast.success(result.revokedCount ? `تم إنهاء ${result.revokedCount} جلسة أخرى.` : "لا توجد جلسات أخرى مفتوحة.");
    },
    onError: error => toast.error(error.message || "تعذر إنهاء الجلسات الأخرى."),
  });
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => toast.success("تم حفظ إعدادات الحساب."),
    onError: () => toast.error("تعذر حفظ إعدادات الحساب الآن."),
  });

  useEffect(() => {
    setName(user?.name ?? "");
    setBio(user?.bio ?? "");
    setNotificationPreferences(loadNotificationPreferences(user?.id));
  }, [user?.id, user?.name, user?.bio]);

  useEffect(() => {
    document.documentElement.style.setProperty("--cj-accent", accent);
    document.documentElement.style.setProperty("--cj-settings-accent", accent);
    window.localStorage.setItem("cyberjocx-accent", accent);
  }, [accent]);

  const tabTitle = useMemo(() => settingsTabs.find(item => item.id === tab)?.label ?? "Settings", [tab]);

  const openComingSoon = () => setComingOpen(true);

  function saveAccount() {
    if (!isAuthenticated) {
      toast.info("سجّل الدخول أولًا لحفظ إعدادات الحساب.");
      return;
    }
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 120) {
      toast.error("الاسم لازم يكون من حرفين إلى 120 حرفًا.");
      return;
    }
    updateProfile.mutate({ name: normalizedName, bio: bio.trim() });
  }


  return (
    <section className="cj-settings">
      <header className="cj-settings-heading">
        <div className="cj-settings-heading-icon"><Sparkles size={27} /></div>
        <div><span>// PERSONAL CONTROL CENTER</span><h2>Settings</h2><p>Manage your account, preferences and security.</p></div>
      </header>

      <div className="cj-settings-layout">
        <nav className="cj-settings-nav" aria-label="Settings sections">
          {settingsTabs.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
                <Icon size={18} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="cj-settings-content">
          {tab === "appearance" && (
            <>
              <section className="cj-settings-card">
                <div className="cj-settings-card-title"><Moon size={23} /><div><strong>Appearance</strong><span>Customize the look and feel of your CyberJocx experience.</span></div></div>
                <div className="cj-settings-divider" />
                <h3>Theme</h3>
                <div className="cj-theme-options">
                  <button type="button" className={preference === "light" ? "selected" : ""} aria-pressed={preference === "light"} onClick={() => setThemePreference("light")}><Sun size={22} />Light{preference === "light" && <Check size={15} />}</button>
                  <button type="button" className={preference === "dark" ? "selected" : ""} aria-pressed={preference === "dark"} onClick={() => setThemePreference("dark")}><Moon size={22} />Dark{preference === "dark" && <Check size={15} />}</button>
                  <button type="button" className={preference === "system" ? "selected" : ""} aria-pressed={preference === "system"} onClick={() => setThemePreference("system")}><Monitor size={22} />Auto{preference === "system" && <Check size={15} />}</button>
                </div>
                <div className="cj-settings-divider" />
                <h3>Accent Color</h3>
                <div className="cj-accent-options" aria-label="Accent color">
                  {accentColors.map(color => <button key={color} type="button" aria-label={`Set accent ${color}`} aria-pressed={accent === color} className={accent === color ? "selected" : ""} style={{ backgroundColor: color }} onClick={() => setAccent(color)} />)}
                </div>
              </section>

              <section className="cj-settings-card cj-bio-card">
                <div className="cj-settings-card-title"><Pencil size={22} /><div><strong>Bio</strong><span>Update the short introduction on your profile.</span></div></div>
                <textarea maxLength={300} value={bio} onChange={event => setBio(event.target.value)} placeholder="Write a short introduction about yourself…" />
                <div className="cj-bio-footer"><span>{bio.length}/300</span><button type="button" disabled={updateProfile.isPending || !isAuthenticated} onClick={saveAccount}>{updateProfile.isPending ? "Saving…" : "Save Bio"}</button></div>
              </section>
            </>
          )}

          {tab === "account" && (
            <section className="cj-settings-card cj-account-editor">
              <div className="cj-settings-card-title"><UserRound size={23} /><div><strong>Account Settings</strong><span>Basic information connected to your CyberJocx account.</span></div></div>
              <label>Display Name<input value={name} onChange={event => setName(event.target.value)} maxLength={120} /></label>
              <label>Email Address<input value={user?.email ?? "Not available"} readOnly /></label>
              <label>Profile Bio<textarea value={bio} onChange={event => setBio(event.target.value)} maxLength={300} /></label>
              <div className="cj-settings-actions"><button type="button" disabled={!isAuthenticated || updateProfile.isPending} onClick={saveAccount}>{updateProfile.isPending ? "Saving…" : "Save Changes"}</button><button type="button" className="secondary" onClick={onOpenProfile}>Open Full Profile</button></div>
              {!isAuthenticated && <p className="cj-settings-hint">Sign in to update your account information.</p>}
            </section>
          )}

          {tab === "security" && (
            <section className="cj-settings-card cj-session-panel">
              <div className="cj-settings-card-title"><Shield size={23} /><div><strong>Security & active sessions</strong><span>راجع الجلسات المفتوحة وأنهِ أي جلسة لا تعرفها.</span></div></div>
              <div className="cj-settings-divider" />
              <div className="cj-session-heading"><h3>Active sessions</h3><button type="button" disabled={!isAuthenticated || revokeOtherSessions.isPending || !(activeSessions.data?.some(session => !session.isCurrent))} onClick={() => revokeOtherSessions.mutate()}>{revokeOtherSessions.isPending ? "Signing out…" : "Sign out other sessions"}</button></div>
              {!isAuthenticated ? <p className="cj-settings-hint">سجّل الدخول لعرض جلسات حسابك.</p> :
                activeSessions.isLoading ? <p className="cj-session-status">جارٍ تحميل الجلسات…</p> :
                activeSessions.error ? <p className="cj-settings-hint">تعذر تحميل الجلسات: {activeSessions.error.message}</p> :
                activeSessions.data?.length ? <div className="cj-session-list">{activeSessions.data.map(session => (
                  <article className="cj-session-item" key={session.id}>
                    <span className="cj-session-device"><Laptop size={19} /></span>
                    <div><strong>{session.isCurrent ? "This device · Current session" : "Signed-in device"}</strong><small>{session.userAgent || "Browser details unavailable"}</small><small>Started {new Date(session.createdAt).toLocaleString()} · Expires {new Date(session.expiresAt).toLocaleDateString()}</small></div>
                    {session.isCurrent && <span className="cj-session-current">CURRENT</span>}
                  </article>
                ))}</div> : <p className="cj-session-status">لا توجد جلسات نشطة مسجلة.</p>}
              <p className="cj-settings-hint">الجلسة الحالية لا يمكن إنهاؤها من هذا الزر حتى لا يتم قطع اتصالك قبل تأكيد العملية.</p>
            </section>
          )}

          {tab === "notifications" && (
            <section className="cj-settings-card">
              <div className="cj-settings-card-title"><Bell size={23} /><div><strong>In-app notification preferences</strong><span>اختار أنواع التنبيهات التي تظهر داخل حسابك على هذا المتصفح.</span></div></div>
              <div className="cj-settings-divider" />
              {([
                { key: "cve" as const, title: "CVE intelligence alerts", description: "تنبيهات الثغرات والمخاطر الأمنية." },
                { key: "content" as const, title: "Learning & community updates", description: "تحديثات المحتوى والتعلم ونشاط المجتمع." },
                { key: "system" as const, title: "System notifications", description: "رسائل وحالة المنصة والتحديثات العامة." },
              ]).map(item => (
                <label className="cj-setting-toggle" key={item.key}>
                  <span><strong>{item.title}</strong><small>{item.description}</small></span>
                  <input type="checkbox" checked={notificationPreferences[item.key]} onChange={event => {
                    const next = { ...notificationPreferences, [item.key]: event.target.checked };
                    setNotificationPreferences(next);
                    saveNotificationPreferences(user?.id, next);
                  }} />
                </label>
              ))}
              <p className="cj-settings-hint">التفضيلات محفوظة محليًا لهذا الحساب على هذا المتصفح. لا توقف رسائل البريد الإلكتروني الخارجية.</p>
            </section>
          )}

          {tab === "privacy" && (
            <section className="cj-settings-card">
              <div className="cj-settings-card-title"><LockKeyhole size={23} /><div><strong>Profile privacy</strong><span>ملخص للبيانات التي تظهر للآخرين حاليًا.</span></div></div>
              <div className="cj-settings-divider" />
              <div className="cj-privacy-row"><span>Public profile</span><strong>Display name, avatar, bio and learning identity</strong></div>
              <div className="cj-privacy-row"><span>Private account details</span><strong>Email, phone number and LinkedIn URL</strong></div>
              <p className="cj-settings-hint">بيانات البريد والهاتف وLinkedIn تُستبعد من استجابة الملف العام على الخادم. التحكم الفردي في إخفاء بقية عناصر الملف لم يُنفذ بعد.</p>
              <button className="cj-settings-secondary-action" type="button" onClick={onOpenProfile}>Review my profile</button>
            </section>
          )}

          {(tab === "billing" || tab === "connected" || tab === "language") && (
            <section className="cj-settings-card cj-settings-unavailable">
              <div className="cj-settings-card-title"><Sparkles size={23} /><div><strong>{tabTitle}</strong><span>الحالة الحالية للخدمة</span></div></div>
              <div className="cj-settings-divider" />
              {tab === "billing" && <><h3>Payment provider not configured</h3><p>لا يوجد مزود دفع مربوط بالإنتاج حاليًا؛ لذلك لا يمكن عرض خطط مدفوعة أو تنفيذ اشتراكات بأمان.</p></>}
              {tab === "connected" && <><h3>Sign-in providers</h3><p>تسجيل الدخول عبر {user?.loginMethod === "google" ? "Google" : user?.loginMethod === "github" ? "GitHub" : "الحساب الحالي"} متاح. ربط أكثر من هوية بحساب واحد غير مدعوم حاليًا.</p></>}
              {tab === "language" && <><h3>Full localization is not ready</h3><p>الواجهة تحتوي نصوصًا إنجليزية وعربية غير مكتملة الترجمة؛ تغيير اللغة الآن سيترك أجزاء من التطبيق بلغة مختلفة، لذلك لن أظهر اختيارًا وهميًا.</p></>}
            </section>
          )}
        </div>

        <aside className="cj-settings-aside">
          <section className="cj-settings-card">
            <div className="cj-aside-title"><UserRound size={19} /><strong>Account Settings</strong><button type="button" onClick={onOpenProfile}>Manage</button></div>
            <button className="cj-settings-row" type="button" onClick={openComingSoon}><span className="security-icon purple"><LockKeyhole size={18} /></span><span><b>Change Password</b><small>Update your account password</small></span><ChevronRight size={17} /></button>
            <button className="cj-settings-row" type="button" onClick={openComingSoon}><span className="security-icon blue"><Shield size={18} /></span><span><b>Two-Factor Authentication</b><small>Protect your account with another step</small></span><ChevronRight size={17} /></button>
            <button className="cj-settings-row" type="button" onClick={() => setTab("security")}><span className="security-icon cyan"><Laptop size={18} /></span><span><b>Login Activity</b><small>Review and revoke active sessions</small></span><ChevronRight size={17} /></button>
          </section>

          <section className="cj-settings-card">
            <div className="cj-aside-title"><Bell size={19} /><strong>Notifications Preferences</strong><button type="button" onClick={() => setTab("notifications")}>Manage</button></div>
            {["Course Updates", "CTF Challenges", "Community Activity", "System Notifications"].map((label, index) => (
              <button className="cj-settings-row" type="button" key={label} onClick={() => setTab("notifications")}>
                <span className={`security-icon ${["blue","purple","cyan","green"][index]}`}><Bell size={17} /></span>
                <span><b>{label}</b><small>{["New courses and labs","New challenge activity","Likes, comments and mentions","Important platform updates"][index]}</small></span>
                <span className="cj-preference-soon">Manage</span>
              </button>
            ))}
          </section>

          <section className="cj-settings-card cj-danger-card">
            <div className="cj-aside-title"><Shield size={19} /><strong>Security & Danger Zone</strong></div>
            <button className="cj-delete-account" type="button" onClick={openComingSoon}><Trash2 size={19} /><span><b>Delete Account</b><small>Permanently delete your account</small></span><ChevronRight size={17} /></button>
          </section>
        </aside>
      </div>
      <ComingSoonModal open={comingOpen} onClose={() => setComingOpen(false)} />
    </section>
  );
}
