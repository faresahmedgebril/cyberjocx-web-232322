import { ReactNode, useMemo, useState } from "react";
import "./FigmaDashboard.css";

type IconName =
  | "home" | "server" | "target" | "trophy" | "user" | "book" | "roadmap"
  | "shield" | "bug" | "tools" | "users" | "store" | "settings" | "sun"
  | "bell" | "search" | "star" | "terminal" | "check" | "lock" | "bolt"
  | "code" | "network" | "linux" | "chevron" | "message" | "close" | "expand"

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
}

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>
}

const navigation: { icon: IconName; label: string }[] = [
  { icon: "home", label: "Home" }, { icon: "server", label: "Machines" },
  { icon: "target", label: "Challenges" }, { icon: "trophy", label: "Leaderboard" },
  { icon: "user", label: "Profile" }, { icon: "book", label: "Courses" },
  { icon: "roadmap", label: "Tracks / Roadmaps" }, { icon: "shield", label: "CVE" },
  { icon: "bug", label: "Malware" }, { icon: "tools", label: "Tools" },
  { icon: "users", label: "Community" }, { icon: "store", label: "Marketplace" },
  { icon: "settings", label: "Settings" },
]

const stats: { icon: IconName; title: string; value: string; gain: string; progress: number }[] = [
  { icon: "star", title: "Total Points", value: "1,420", gain: "+120", progress: 82 },
  { icon: "book", title: "Completed Courses", value: "3", gain: "+1", progress: 20 },
  { icon: "server", title: "Machines Solved", value: "2", gain: "+1", progress: 20 },
  { icon: "target", title: "Challenges Solved", value: "5", gain: "+2", progress: 40 },
]

const pathSteps = [
  { name: "Web Fundamentals", status: "Completed" }, { name: "Linux Basics", status: "Completed" },
  { name: "Network Security", status: "In Progress" }, { name: "Penetration Testing", status: "Locked" },
  { name: "Malware Analysis", status: "Locked" }, { name: "Advanced Exploitation", status: "Locked" },
]

const courses: { icon: IconName; name: string; detail: string; progress: number }[] = [
  { icon: "linux", name: "Linux Basics", detail: "Beginner • 5h", progress: 60 },
  { icon: "network", name: "Network Security", detail: "Intermediate • 8h", progress: 30 },
  { icon: "code", name: "Web Exploitation", detail: "Intermediate • 10h", progress: 0 },
  { icon: "bug", name: "Malware Analysis", detail: "Advanced • 12h", progress: 0 },
]

const activity: { icon: IconName; text: string; time: string; tone: string }[] = [
  { icon: "target", text: "Solved machine - Blue", time: "2 hours ago", tone: "green" },
  { icon: "book", text: "Completed course - Linux Basics", time: "5 hours ago", tone: "purple" },
  { icon: "star", text: "Earned 100 points", time: "6 hours ago", tone: "purple" },
  { icon: "users", text: "Joined community discussion", time: "8 hours ago", tone: "blue" },
  { icon: "shield", text: "New CVE available - CVE-2024-1234", time: "10 hours ago", tone: "purple" },
]

const initialGoals = [
  { text: "Complete Network Security course", done: true }, { text: "Solve 1 machine", done: true },
  { text: "Read 1 blog post", done: false }, { text: "Join community discussion", done: false },
  { text: "Practice 1 challenge", done: false },
]

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

function SectionTitle({ icon, children, action }: { icon: IconName; children: ReactNode; action?: string }) {
  return <div className="section-title"><span className="title-icon"><Icon name={icon} size={23} /></span><h2>{children}</h2>{action && <button className="outline-action">{action} <span>→</span></button>}</div>
}

type FigmaDashboardProps = {
  stats: { points: number; coursesCompleted: number; activeCourses: number; cvesTracked: number };
  learningCourses: Array<{ id?: number | string; title: string; category?: string; level?: string; progress?: number }>;
  userName: string;
  onNavigate: (target: string) => void;
  onOpenAuth: () => void;
};

export default function FigmaDashboard({ stats: liveStats, learningCourses, userName, onNavigate, onOpenAuth }: FigmaDashboardProps) {
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
  const [activeNav, setActiveNav] = useState("Home")
  const [search, setSearch] = useState("")
  const [bright, setBright] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(true)
  const [goals, setGoals] = useState(initialGoals)
  const [toast, setToast] = useState("")

  const matches = useMemo(() => dashboardCourses.filter((course) => course.name.toLowerCase().includes(search.toLowerCase())), [dashboardCourses, search])
  const completedGoals = goals.filter((goal) => goal.done).length

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 1800)
  }

  return <div className={`figma-dashboard ${bright ? "bright" : ""}`}>
    <header className="topbar">
      <div className="brand">
        <img src={`${import.meta.env.BASE_URL}assets/cyber-hacker.jpg`} alt="CyberJocx" />
        <strong>Cyber<span>Jocx</span></strong>
        <b>DASHBOARD</b>
      </div>
      <label className="search-box">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything... (courses, machines, CVEs, etc.)" />
        <Icon name="search" size={20} />
        {search && <small>{matches.length} course{matches.length === 1 ? "" : "s"}</small>}
      </label>
      <div className="top-actions">
        <button className="round-button" aria-label="Toggle brightness" onClick={() => setBright(!bright)}><Icon name="sun" size={27} /></button>
        <button className="round-button notification" aria-label="Notifications" onClick={() => notify("You have 3 new notifications")}><Icon name="bell" size={26} /><i>3</i></button>
        <button className="profile-button" onClick={onOpenAuth}><span><Icon name="user" size={22} /></span><b>{userName || "GHOST_OPERATOR"}</b><Icon name="chevron" size={14} /></button>
      </div>
    </header>

    <aside className="sidebar">
      <nav aria-label="Dashboard navigation">
        {navigation.map((item) => <button key={item.label} className={`nav-item ${activeNav === item.label ? "active" : ""}`} onClick={() => { setActiveNav(item.label); const targets: Record<string, string> = { Home: "dashboard", Profile: "profile", Courses: "learning", "Tracks / Roadmaps": "tracks", CVE: "cves", Malware: "malware", Tools: "tools", Community: "community", Marketplace: "market", Machines: "machines", Challenges: "challenges", Leaderboard: "leaderboard", Settings: "settings" }; if (item.label === "Home" || item.label in targets) onNavigate(targets[item.label]); else notify(`${item.label} selected`); }}><Icon name={item.icon} size={23} /><span>{item.label}</span></button>)}
      </nav>
      <div className="sidebar-brand" role="button" tabIndex={0} onClick={() => onNavigate("dashboard")}>
        <img src="/assets/cyber-hacker.jpg" alt="Hooded CyberJocx character" />
        <strong>Cyber<span>Jocx</span></strong>
        <small>Secure Your Mind</small>
      </div>
    </aside>

    <main>
      <div className="dashboard-grid">
        <div className="main-column">
          <Panel className="welcome-card">
            <img
              className="welcome-image"
              src={`${import.meta.env.BASE_URL}assets/dashboard-welcome.jpg`}
              alt={`Welcome back, ${userName || "operator"}. Keep learning. Keep hacking. Keep growing.`}
            />
          </Panel>

          <div className="stats-grid">
            {dashboardStats.map((stat) => <Panel className="stat-card" key={stat.title}><span className="stat-icon"><Icon name={stat.icon} size={28} /></span><div><small>{stat.title}</small><strong>{stat.value}</strong><em>↑ {stat.gain}</em></div><span className="sparkline" aria-hidden="true" /><div className="mini-progress"><i style={{ width: `${stat.progress}%` }} /></div><b className="percent">{stat.progress}%</b></Panel>)}
          </div>

          <Panel className="learning-panel">
            <SectionTitle icon="target" action="Continue Learning">Your Learning Path</SectionTitle>
            <div className="learning-path">
              {pathSteps.map((step, index) => <div className={`path-step ${step.status === "Completed" ? "complete" : step.status === "In Progress" ? "current" : "locked"}`} key={step.name}>
                <div className="step-track"><span className="step-circle">{step.status === "Completed" ? <Icon name="check" size={23} /> : step.status === "Locked" ? <Icon name="lock" size={18} /> : index + 1}</span>{index < pathSteps.length - 1 && <i />}</div>
                <small>{index + 1}</small><strong>{step.name}</strong><b>{step.status}</b>
              </div>)}
            </div>
          </Panel>

          <Panel className="courses-panel">
            <SectionTitle icon="book" action="View All">Featured Courses</SectionTitle>
            <div className="course-grid">
              {dashboardCourses.map((course) => <article className="course-card" key={course.name}><div className="course-heading"><span><Icon name={course.icon} size={25} /></span><div><strong>{course.name}</strong><small>{course.detail}</small></div></div><div className="course-progress"><i style={{ width: `${course.progress}%` }} /></div><b>{course.progress}%</b><button onClick={() => onNavigate("learning")}>{course.progress ? "Continue" : "Start"} →</button></article>)}
            </div>
          </Panel>
        </div>

        <div className="right-column">
          <Panel className="activity-panel">
            <SectionTitle icon="bolt" action="View All">Recent Activity</SectionTitle>
            <div className="activity-list">{activity.map((item) => <div className="activity-item" key={item.text}><span className={item.tone}><Icon name={item.icon} size={23} /></span><div><strong>{item.text}</strong><small>{item.time}</small></div></div>)}</div>
          </Panel>

          <Panel className={`terminal-panel ${terminalOpen ? "" : "closed"}`}>
            <div className="terminal-head"><span><Icon name="terminal" size={22} /></span><h2>Quick Terminal</h2><div><button aria-label="Minimize terminal" onClick={() => setTerminalOpen(!terminalOpen)}>−</button><button aria-label="Expand terminal" onClick={() => notify("Terminal expanded")}><Icon name="expand" size={14} /></button><button aria-label="Close terminal" onClick={() => setTerminalOpen(false)}><Icon name="close" size={15} /></button></div></div>
            {terminalOpen && <div className="terminal"><p><em>kali@cyberjocx</em>:~$ nmap -sC -sV 10.10.10.10</p><p>Starting Nmap 7.94 ...</p><br /><p>PORT&nbsp;&nbsp;&nbsp;&nbsp; STATE&nbsp;&nbsp; SERVICE&nbsp;&nbsp; VERSION</p><p>22/tcp&nbsp;&nbsp; open&nbsp;&nbsp;&nbsp; ssh&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OpenSSH 8.9p1</p><p>80/tcp&nbsp;&nbsp; open&nbsp;&nbsp;&nbsp; http&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Apache 2.4.41</p><p>443/tcp&nbsp; open&nbsp;&nbsp;&nbsp; https&nbsp;&nbsp;&nbsp;&nbsp; Apache 2.4.41</p><br /><p>Nmap done: 1 IP address (1 host up)</p><p><em>kali@cyberjocx</em>:~$ <span className="cursor" /></p></div>}
          </Panel>

          <Panel className="goals-panel">
            <div className="goals-head"><span><Icon name="target" size={23} /></span><h2>Today's Goals</h2><i /><b>{completedGoals} / 5</b></div>
            <div className="goal-list">{goals.map((goal, index) => <label key={goal.text}><input type="checkbox" checked={goal.done} onChange={() => setGoals((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item))} /><span><Icon name="check" size={15} /></span>{goal.text}</label>)}</div>
          </Panel>
        </div>
      </div>
    </main>

    <footer><strong>Cyber<span>Jocx</span></strong><b>v1.0.0</b><i /><span>Learn</span><small>•</small><span>Practice</span><small>•</small><span>Become Better</span><div className="online"><i /> Online <b>1,248 members</b><Icon name="message" size={16} /></div></footer>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>
}
