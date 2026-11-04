import { ReactNode, useEffect, useMemo, useState } from "react";
import "./FigmaDashboard.css";
import { ComingSoonModal } from "@/components/ComingSoonModal";

type IconName =
  | "home" | "server" | "target" | "trophy" | "user" | "book" | "roadmap"
  | "shield" | "bug" | "tools" | "users" | "store" | "settings" | "sun" | "moon"
  | "bell" | "search" | "star" | "terminal" | "check" | "lock" | "bolt"
  | "code" | "network" | "linux" | "chevron" | "message" | "close" | "expand" | "logout"

const iconPaths: Record<IconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></>,
  server: <><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /><path d="M7 7h.01M7 17h.01M16 7h2M16 17h2" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0Z" /></>,
  book: <><path d="M4 5a3 3 0 0 1 3-2h5v17H7a3 3 0 0 0-3 2Z" /><path d="M20 5a3 3 0 0 0-3-2h-5v17h5a3 3 0 0 1 3 2Z" /></>,
  roadmap: <><path d="M5 19V8M12 19V4M19 19v-7" /><path d="M3 19h18M3 8h4M10 4h4M17 12h4" /></>,
  shield: <path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5Z" />,
  bug: <><path d="M8 8h8v7a4 4 0 0 1-8 0Z" /><path d="M9 8a3 3 0 0 1 6 0M4 11h4M16 11h4M5 17l3-1M19 17l-3-1M12 4V2" /></>,
  tools: <><path d="m14 7 3-3 3 3-3 3" /><path d="M16 8 7 17M5 14l5 5-3 3-5-5Z" /></>,
  users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2" /><path d="M3 20a6 6 0 0 1 12 0M14 17a5 5 0 0 1 7 3" /></>,
  store: <><path d="M4 10v10h16V10M3 4h18l-2 6H5Z" /><path d="M9 20v-6h6v6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 3.1a7 7 0 0 0-1.7 1L5 6.1 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5l2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 3.1h5l.4-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2.1-1.5c.1-.3.1-.7.1-1Z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></>,
  moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  star: <path d="m12 2 3 6 6.5 1-4.8 4.6 1.2 6.4-5.9-3.1L6.1 20l1.2-6.4L2.5 9 9 8Z" />,
  terminal: <><path d="m5 7 4 4-4 4M11 16h7" /><rect x="2" y="3" width="20" height="18" rx="2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6Z" />,
  code: <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" />,
  network: <><circle cx="12" cy="5" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><path d="m11 7-5 9M13 7l5 9M7 18h10" /></>,
  linux: <><ellipse cx="12" cy="13" rx="6" ry="8" /><path d="m10 12 2 1 2-1M7 18l-3 3M17 18l3 3" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
  message: <><path d="M4 4h16v13H8l-4 4Z" /><path d="M8 9h8M8 13h5" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  expand: <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
}

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>
}

const navigation: { icon: IconName; label: string; target?: string; comingSoon?: boolean; dividerBefore?: boolean }[] = [
  { icon: "home", label: "Home", target: "dashboard" },
  { icon: "server", label: "Dashboard", target: "dashboard" },
  { icon: "book", label: "Courses", target: "learning" },
  { icon: "roadmap", label: "Roadmap", target: "tracks" },
  { icon: "tools", label: "Labs", comingSoon: true },
  { icon: "target", label: "CTF", comingSoon: true },
  { icon: "shield", label: "CVE Center", target: "cves" },
  { icon: "bug", label: "Malware", target: "malware" },
  { icon: "users", label: "Community", target: "community" },
  { icon: "store", label: "Market", target: "market" },
  { icon: "terminal", label: "AI Assistant", target: "ai" },
  { icon: "network", label: "Tracks", target: "tracks", dividerBefore: true },
  { icon: "trophy", label: "Leaderboard", target: "leaderboard" },
  { icon: "settings", label: "Settings", target: "settings" },
  { icon: "logout", label: "Log Out", target: "logout", dividerBefore: true },
]

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

function SectionTitle({ icon, children, action, onAction }: { icon: IconName; children: ReactNode; action?: string; onAction?: () => void }) {
  return <div className="section-title"><span className="title-icon"><Icon name={icon} size={23} /></span><h2>{children}</h2>{action && <button type="button" className="outline-action" onClick={onAction}>{action} <span>→</span></button>}</div>
}

export function DashboardRightRail({ onComingSoon }: { onComingSoon: () => void }) {
  const [terminalOpen, setTerminalOpen] = useState(true);

  return (
    <div className="right-column">
      <Panel className="activity-panel">
        <SectionTitle icon="bolt" action="View All" onAction={onComingSoon}>Recent Activity</SectionTitle>
        <div className="dashboard-placeholder">Coming Soon</div>
      </Panel>

      <Panel className={`terminal-panel ${terminalOpen ? "" : "closed"}`}>
        <div className="terminal-head"><span><Icon name="terminal" size={22} /></span><h2>Quick Terminal</h2><div><button aria-label="Minimize terminal" onClick={() => setTerminalOpen(!terminalOpen)}>−</button><button aria-label="Expand terminal" onClick={onComingSoon}><Icon name="expand" size={14} /></button><button aria-label="Close terminal" onClick={() => setTerminalOpen(false)}><Icon name="close" size={15} /></button></div></div>
        {terminalOpen && <div className="terminal dashboard-placeholder">Coming Soon</div>}
      </Panel>

      <Panel className="goals-panel">
        <div className="goals-head"><span><Icon name="target" size={23} /></span><h2>Today's Goals</h2><i /></div>
        <div className="dashboard-placeholder">Coming Soon</div>
      </Panel>
    </div>
  );
}


type FigmaDashboardProps = {
  stats: { points: number; coursesCompleted: number; activeCourses: number; cvesTracked: number };
  learningCourses: Array<{ id?: number | string; title: string; category?: string; level?: string; progress?: number }>;
  userName: string;
  userAvatarUrl?: string | null;
  activePage?: string;
  pageContent?: ReactNode;
  onNavigate: (target: string) => void;
  onOpenAuth: () => void;
  onLogout?: () => void;
};

export default function FigmaDashboard({ stats: liveStats, learningCourses, userName, userAvatarUrl, activePage = "Home", pageContent, onNavigate, onOpenAuth, onLogout }: FigmaDashboardProps) {
  const dashboardStats = [
    { icon: "star" as IconName, title: "Total Points", value: liveStats.points.toLocaleString(), gain: "LIVE", progress: Math.min(100, Math.max(8, liveStats.points % 100)) },
    { icon: "book" as IconName, title: "Completed Courses", value: String(liveStats.coursesCompleted), gain: "SYNC", progress: Math.min(100, liveStats.coursesCompleted * 20) },
    { icon: "server" as IconName, title: "Active Courses", value: String(liveStats.activeCourses), gain: "SYNC", progress: Math.min(100, liveStats.activeCourses * 25) },
    { icon: "shield" as IconName, title: "CVE Intelligence", value: String(liveStats.cvesTracked), gain: "LIVE", progress: Math.min(100, liveStats.cvesTracked * 5) },
  ];
  const dashboardCourses = useMemo(() => learningCourses.slice(0, 4).map((course, index) => ({
    icon: (course.category?.toLowerCase().includes("linux") ? "linux" : course.category?.toLowerCase().includes("network") ? "network" : index === 3 ? "bug" : "code") as IconName,
    name: course.title,
    detail: `${course.level || "Learning"} • ${course.category || "Course"}`,
    progress: Math.max(0, Math.min(100, Number(course.progress || 0))),
  })), [learningCourses]);
  const [activeNav, setActiveNav] = useState(activePage)
  const [search, setSearch] = useState("")
  const [comingSoonOpen, setComingSoonOpen] = useState(false)

  useEffect(() => setActiveNav(activePage), [activePage]);

  const matches = useMemo(() => dashboardCourses.filter((course) => course.name.toLowerCase().includes(search.toLowerCase())), [dashboardCourses, search])

  return <div className="figma-dashboard">
    <header className="topbar">
      <div className="brand">
        <img src={`${import.meta.env.BASE_URL}assets/cyber-hacker.jpg`} alt="CyberJocx" />
        <strong>Cyber<span>Jocx</span></strong>
        <b>DASHBOARD</b>
      </div>
      <label className="search-box">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything…" />
        <Icon name="search" size={20} />
        {search && <small>{matches.length} course{matches.length === 1 ? "" : "s"}</small>}
      </label>
      <div className="top-actions">
        <button className="round-button notification" aria-label="Notifications" onClick={() => setComingSoonOpen(true)}><Icon name="bell" size={26} /><i>1</i></button>
        <button className="round-button" aria-label="Appearance settings" onClick={() => setComingSoonOpen(true)}><Icon name="moon" size={25} /></button>
        <button className="profile-button" onClick={onOpenAuth}>
          <span>{userAvatarUrl ? <img src={userAvatarUrl} alt="" /> : <Icon name="user" size={22} />}</span>
          <b>{userName || "GHOST_OPERATOR"}</b><Icon name="chevron" size={14} />
        </button>
      </div>
    </header>

    <aside className="sidebar">
      <nav aria-label="Dashboard navigation">
        {navigation.map((item) => <button key={item.label} className={`nav-item ${activeNav === item.label ? "active" : ""} ${item.dividerBefore ? "nav-item--section" : ""}`} onClick={() => { if (item.target === "logout") { onLogout?.(); return; } if (item.comingSoon || !item.target) { setComingSoonOpen(true); return; } setActiveNav(item.label); onNavigate(item.target); }}><Icon name={item.icon} size={23} /><span>{item.label}</span></button>)}
      </nav>
      <div className="sidebar-brand" role="button" tabIndex={0} onClick={() => onNavigate("dashboard")} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onNavigate("dashboard"); } }}>
        <img src={`${import.meta.env.BASE_URL}assets/cyber-hacker.jpg`} alt="Hooded CyberJocx character" />
        <strong>Cyber<span>Jocx</span></strong>
        <small>Secure Your Mind</small>
      </div>
    </aside>

    <main className={pageContent ? "has-page-content" : ""}>
      {pageContent ?? <div className="dashboard-grid">
        <div className="main-column">
          <Panel className="welcome-card">
            <img
              className="welcome-image"
              src={`${import.meta.env.BASE_URL}assets/dashboard-welcome.jpg`}
              alt="CyberJocx neon cyberpunk learning city"
            />
            <div className="welcome-copy">
              <h1>Welcome back,<br /><span>{userName || "Operator"}</span></h1>
              <p>Keep learning. Keep hacking. Keep growing.</p>
            </div>
          </Panel>

          <div className="stats-grid">
            {dashboardStats.map((stat) => <Panel className="stat-card" key={stat.title}><span className="stat-icon"><Icon name={stat.icon} size={28} /></span><div><small>{stat.title}</small><strong>{stat.value}</strong><em>↑ {stat.gain}</em></div><span className="sparkline" aria-hidden="true" /><div className="mini-progress"><i style={{ width: `${stat.progress}%` }} /></div><b className="percent">{stat.progress}%</b></Panel>)}
          </div>

          <Panel className="learning-panel">
            <SectionTitle icon="target" action="Continue Learning" onAction={() => onNavigate("learning")}>Your Learning Path</SectionTitle>
            <div className="dashboard-placeholder">Coming Soon</div>
          </Panel>

          <Panel className="courses-panel">
            <SectionTitle icon="book" action="View All" onAction={() => onNavigate("learning")}>Featured Courses</SectionTitle>
            <div className="course-grid">
              {dashboardCourses.map((course) => <article className="course-card" key={course.name}><div className="course-heading"><span><Icon name={course.icon} size={25} /></span><div><strong>{course.name}</strong><small>{course.detail}</small></div></div><div className="course-progress"><i style={{ width: `${course.progress}%` }} /></div><b>{course.progress}%</b><button onClick={() => onNavigate("learning")}>{course.progress ? "Continue" : "Start"} →</button></article>)}
            </div>
          </Panel>
        </div>

        <DashboardRightRail onComingSoon={() => setComingSoonOpen(true)} />
      </div>}
    </main>

    <footer><strong>Cyber<span>Jocx</span></strong><b>v1.0.0</b><i /><span>Learn</span><small>•</small><span>Practice</span><small>•</small><span>Become Better</span><div className="online"><Icon name="message" size={16} /> Community</div></footer>
    <ComingSoonModal open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
  </div>
}
