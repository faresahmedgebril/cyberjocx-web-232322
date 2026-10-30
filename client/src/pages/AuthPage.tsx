import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, ArrowRight, BarChart3, Eye, EyeOff, Github,
  KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck, UserRound, Zap,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import "./AuthPage.css";

type AuthView = "login" | "signup" | "forgot" | "reset";
type Notice = { kind: "error" | "success"; text: string } | null;

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "https://cyberjocx-api-production.up.railway.app").replace(/\/+$/, "");
const HOME_PATH = import.meta.env.BASE_URL || "/";
const codeRain = [
  "01 ACCESS GRANTED 10", "sudo ./secure --future", "7F 3A C9 00 FF 12",
  "while(true){learn();}", "01001011 10110100", "ssh root@cyberjocx",
  "const skill = 'power';", "nmap -sV 10.0.0.1", "AUTH TOKEN VERIFIED",
  "10110 ENCRYPT 00101", "git commit -m secure", "0x4A 0x2F 0x9D",
  "function defend() {}", "SELECT * FROM skills", "BUILD HACK GROW",
];
const particles = [
  [8, 12, 0], [18, 62, 2.3], [32, 28, 4.1], [43, 78, 1.4],
  [58, 18, 3.2], [67, 55, 0.6], [78, 85, 4.8], [89, 36, 2.1],
];

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [view, setView] = useState<AuthView>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => new URLSearchParams(window.location.search).get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState(() => new URLSearchParams(window.location.search).get("token") || "");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(() => {
    const reason = new URLSearchParams(window.location.search).get("authError");
    if (reason === "github-not-configured") return { kind: "error", text: "تسجيل GitHub غير مفعّل على السيرفر حتى الآن. استخدم البريد أو Google." };
    if (reason === "google-not-configured") return { kind: "error", text: "تسجيل Google غير مفعّل على السيرفر حتى الآن. استخدم البريد أو GitHub." };
    return reason ? { kind: "error", text: "تعذر إكمال تسجيل الدخول الخارجي. جرّب مرة أخرى أو استخدم البريد وكلمة المرور." } : null;
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate("/");
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextView: AuthView =
      location === "/signup" ? "signup" :
      location === "/forgot-password" ? "forgot" :
      location === "/reset-password" ? "reset" : "login";
    setView(nextView);
    if (nextView === "reset") {
      setEmail(params.get("email") || "");
      setResetToken(params.get("token") || "");
    }
  }, [location]);

  function changeView(next: AuthView) {
    setNotice(null);
    setPassword("");
    setConfirmPassword("");
    setView(next);
    const paths: Record<AuthView, string> = {
      login: "/login",
      signup: "/signup",
      forgot: "/forgot-password",
      reset: "/reset-password",
    };
    navigate(paths[next]);
  }

  function showError(message: string) {
    setNotice({ kind: "error", text: message });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if ((view === "signup" || view === "reset") && password !== confirmPassword) {
      showError("كلمتا المرور غير متطابقتين.");
      return;
    }
    if (view === "reset" && !resetToken.trim()) {
      showError("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.");
      return;
    }

    setBusy(true);
    try {
      const endpoint =
        view === "signup" ? "register" :
        view === "forgot" ? "forgot-password" :
        view === "reset" ? "reset-password" : "login";
      const body =
        view === "signup" ? { name: name.trim(), email: email.trim(), password } :
        view === "forgot" ? { email: email.trim() } :
        view === "reset" ? { email: email.trim(), token: resetToken.trim(), password } :
        { email: email.trim(), password, rememberMe };

      const response = await fetch(API_ORIGIN + "/api/auth/" + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof result.message === "string" ? result.message : "تعذر إكمال الطلب. حاول مرة أخرى.");
      }

      if (view === "login" || view === "signup") {
        window.location.assign(HOME_PATH);
        return;
      }
      if (view === "forgot") {
        setNotice({
          kind: "success",
          text: result.message || "لو البريد مرتبط بحساب، هيوصلك رابط استعادة صالح لمدة 30 دقيقة.",
        });
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setPassword("");
      setConfirmPassword("");
      setView("login");
      navigate("/login");
      setNotice({ kind: "success", text: "تم تغيير كلمة المرور. سجّل الدخول بكلمة المرور الجديدة." });
    } catch (error) {
      showError(error instanceof Error ? error.message : "حدث خطأ غير متوقع.");
    } finally {
      setBusy(false);
    }
  }

  function startOAuth(provider: "google" | "github") {
    window.location.assign(API_ORIGIN + "/api/auth/" + provider + "/login");
  }

  const accountView = view === "login" || view === "signup";
  const titles: Record<AuthView, string> = {
    login: "Welcome Back",
    signup: "Create Account",
    forgot: "Recover Account",
    reset: "Reset Password",
  };
  const subtitles: Record<AuthView, string> = {
    login: "Sign in to continue your cybersecurity journey",
    signup: "Create your CyberJocx account and start building real skills",
    forgot: "We will send a secure password-reset link to your email",
    reset: "Choose a new password for your CyberJocx account",
  };
  const titleWords = titles[view].split(" ");
  if (!authLoading && isAuthenticated) return null;

  return (
    <main className="login-page" dir="ltr">
      <div className="code-rain" aria-hidden="true">
        {codeRain.map((code, index) => (
          <span
            key={code}
            style={{
              left: (2 + index * 6.8) + "%",
              animationDelay: -((index * 1.37) % 9) + "s",
              animationDuration: 8 + (index % 5) * 1.35 + "s",
            }}
          >
            {code}
          </span>
        ))}
      </div>

      <section className="story-panel" aria-label="CyberJocx introduction">
        <div className="story-image" style={{ backgroundImage: "url(" + (import.meta.env.BASE_URL || "/") + "assets/cyber-login-reference.jpeg)" }} />
        <div className="scanline" />
        <div className="story-glow glow-one" />
        <div className="story-glow glow-two" />
      </section>

      <section className="login-side">
        <div className="circuit circuit-one" />
        <div className="circuit circuit-two" />
        <div className="particles" aria-hidden="true">
          {particles.map(([left, top, delay], index) => (
            <i key={index} style={{ left: left + "%", top: top + "%", animationDelay: delay + "s" }} />
          ))}
        </div>

        <div className="signup-prompt">
          <span>{view === "signup" ? "Already have an account?" : "Don't have an account?"}</span>
          <button type="button" onClick={() => changeView(view === "signup" ? "login" : "signup")}>
            {view === "signup" ? "Sign In" : "Sign Up"}
          </button>
          <b aria-hidden="true">→</b>
        </div>

        <form className="login-card" onSubmit={submit}>
          <div className="corner corner-tl" />
          <div className="corner corner-br" />

          <header>
            <div className="wordmark">Cyber<span>Jocx</span></div>
            <h1>{titleWords.slice(0, -1).join(" ")} <span>{titleWords[titleWords.length - 1]}</span></h1>
            <p>{subtitles[view]}</p>
          </header>

          {accountView && (
            <>
              <div className="social-row">
                <button type="button" className="social-button" onClick={() => startOAuth("google")} disabled={busy}>
                  <span className="google-mark" aria-hidden="true">G</span>
                  Continue with Google
                </button>
                <button type="button" className="social-button" onClick={() => startOAuth("github")} disabled={busy}>
                  <Github size={27} aria-hidden="true" />
                  Continue with GitHub
                </button>
              </div>
              <div className="divider"><span>OR</span></div>
            </>
          )}

          {view === "signup" && (
            <>
              <label className="field-label" htmlFor="auth-name">Full Name</label>
              <div className="input-wrap">
                <UserRound aria-hidden="true" />
                <input
                  id="auth-name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={120}
                  required
                />
              </div>
            </>
          )}

          <label className="field-label" htmlFor="auth-email">Email Address</label>
          <div className="input-wrap">
            <Mail aria-hidden="true" />
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              maxLength={320}
              required
              readOnly={view === "reset" && Boolean(resetToken)}
            />
          </div>

          {view !== "forgot" && (
            <>
              <label className="field-label" htmlFor="auth-password">
                {view === "reset" ? "New Password" : "Password"}
              </label>
              <div className="input-wrap">
                {view === "reset" ? <KeyRound aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder={view === "reset" ? "Enter a new password" : "Enter your password"}
                  autoComplete={view === "login" ? "current-password" : "new-password"}
                  minLength={8}
                  maxLength={128}
                  required
                />
                <button
                  className="eye-button"
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {(view === "signup" || view === "reset") && (
                <>
                  <label className="field-label" htmlFor="auth-confirm-password">Confirm Password</label>
                  <div className="input-wrap">
                    <LockKeyhole aria-hidden="true" />
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={event => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                    />
                  </div>
                </>
              )}
            </>
          )}

          {view === "login" && (
            <div className="form-options">
              <label>
                <input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} />
                <span />
                Remember me
              </label>
              <button type="button" onClick={() => changeView("forgot")}>Forgot password?</button>
            </div>
          )}

          {notice && (
            <div className={"auth-notice " + notice.kind} role="alert" aria-live="polite">
              {notice.kind === "success" ? <ShieldCheck size={17} /> : <KeyRound size={17} />}
              <span>{notice.text}</span>
            </div>
          )}

          <button className="signin-button" type="submit" disabled={busy}>
            <span>
              {busy ? "Please wait..." :
                view === "login" ? "Sign In" :
                view === "signup" ? "Create Account" :
                view === "forgot" ? "Send Reset Link" : "Reset Password"}
            </span>
            {busy ? <LoaderCircle className="auth-spinner" size={20} /> : <ArrowRight size={21} />}
          </button>

          {view === "login" && (
            <div className="auth-create-account">
              <span>First time on CyberJocx?</span>
              <button type="button" onClick={() => changeView("signup")}>
                Create your first account <ArrowRight size={16} />
              </button>
            </div>
          )}

          {view === "signup" && (
            <div className="auth-create-account">
              <span>Already registered?</span>
              <button type="button" onClick={() => changeView("login")}>
                Sign in to your account <ArrowRight size={16} />
              </button>
            </div>
          )}

          {(view === "forgot" || view === "reset") && (
            <button type="button" className="auth-back-link" onClick={() => changeView("login")}>
              <ArrowLeft size={15} /> Back to sign in
            </button>
          )}

          <footer className="benefits">
            <span><ShieldCheck />Better Skills</span>
            <i />
            <span><Zap />Stronger Security</span>
            <i />
            <span><ChartNoAxesColumnIncreasing />A Safer Tomorrow</span>
          </footer>
        </form>
      </section>
    </main>
  );
}
