import { useEffect, useMemo, useState } from "react";
import {
  Bell, Check, ChevronRight, CreditCard, Globe, Link2, LockKeyhole, Moon,
  Shield, Sun, Trash2, UserRound, Monitor, Pencil, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import "./settings.css";

type SettingsTab = "account" | "security" | "notifications" | "appearance" | "privacy" | "billing" | "connected" | "language";
type UserSummary = {
  id?: number;
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  memberRank?: string | null;
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
  const { theme, toggleTheme } = useTheme();
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => toast.success("تم حفظ إعدادات الحساب."),
    onError: () => toast.error("تعذر حفظ إعدادات الحساب الآن."),
  });

  useEffect(() => {
    setName(user?.name ?? "");
    setBio(user?.bio ?? "");
  }, [user?.name, user?.bio]);

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
                  <button type="button" className={theme === "light" ? "selected" : ""} aria-pressed={theme === "light"} onClick={() => { if (theme !== "light") toggleTheme?.(); }}><Sun size={22} />Light{theme === "light" && <Check size={15} />}</button>
                  <button type="button" className={theme === "dark" ? "selected" : ""} aria-pressed={theme === "dark"} onClick={() => { if (theme !== "dark") toggleTheme?.(); }}><Moon size={22} />Dark{theme === "dark" && <Check size={15} />}</button>
                  <button type="button" onClick={openComingSoon}><Monitor size={22} />Auto</button>
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

          {tab !== "appearance" && tab !== "account" && (
            <section className="cj-settings-coming">
              <div><Sparkles size={26} /></div>
              <span>// {tabTitle.toUpperCase()}</span>
              <h3>Coming Soon</h3>
              <button type="button" onClick={openComingSoon}>View status</button>
            </section>
          )}
        </div>

        <aside className="cj-settings-aside">
          <section className="cj-settings-card">
            <div className="cj-aside-title"><UserRound size={19} /><strong>Account Settings</strong><button type="button" onClick={onOpenProfile}>Manage</button></div>
            <button className="cj-settings-row" type="button" onClick={openComingSoon}><span className="security-icon purple"><LockKeyhole size={18} /></span><span><b>Change Password</b><small>Update your account password</small></span><ChevronRight size={17} /></button>
            <button className="cj-settings-row" type="button" onClick={openComingSoon}><span className="security-icon blue"><Shield size={18} /></span><span><b>Two-Factor Authentication</b><small>Protect your account with another step</small></span><ChevronRight size={17} /></button>
            <button className="cj-settings-row" type="button" onClick={openComingSoon}><span className="security-icon cyan"><Bell size={18} /></span><span><b>Login Activity</b><small>Review recent account sessions</small></span><ChevronRight size={17} /></button>
          </section>

          <section className="cj-settings-card">
            <div className="cj-aside-title"><Bell size={19} /><strong>Notifications Preferences</strong><button type="button" onClick={openComingSoon}>Manage</button></div>
            {["Course Updates", "CTF Challenges", "Community Activity", "System Notifications"].map((label, index) => (
              <button className="cj-settings-row" type="button" key={label} onClick={openComingSoon}>
                <span className={`security-icon ${["blue","purple","cyan","green"][index]}`}><Bell size={17} /></span>
                <span><b>{label}</b><small>{["New courses and labs","New challenge activity","Likes, comments and mentions","Important platform updates"][index]}</small></span>
                <span className="cj-preference-soon">Soon</span>
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
