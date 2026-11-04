import { useMemo, useState } from "react";
import {
  Award, CalendarDays, Clock3, Crown, Medal, RefreshCw, ShieldCheck, Star,
  Trophy, Zap, BookOpen, Bug,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import "./leaderboard.css";

type Period = "all-time";
type PeriodOption = Period | "month" | "week" | "today";

type LeaderboardStats = {
  points: number | null;
  coursesCompleted: number | null;
  cvesTracked: number | null;
};

const periods: { id: PeriodOption; label: string; Icon: typeof Trophy }[] = [
  { id: "all-time", label: "All Time", Icon: Trophy },
  { id: "month", label: "This Month", Icon: CalendarDays },
  { id: "week", label: "This Week", Icon: CalendarDays },
  { id: "today", label: "Today", Icon: Clock3 },
];

const rankLabels: Record<string, string> = {
  learner: "Learner",
  contributor: "Contributor",
  analyst: "Analyst",
  mentor: "Mentor",
  elite: "Elite",
};

function displayName(name: string | null | undefined) {
  return name?.trim() || "CyberJocx Member";
}

function points(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString();
}

function Avatar({ name, src, size = "normal" }: {
  name: string | null | undefined;
  src: string | null | undefined;
  size?: "normal" | "large";
}) {
  return (
    <span className={`cj-lb-avatar ${size === "large" ? "is-large" : ""}`}>
      {src ? <img src={src} alt="" loading="lazy" /> : <span>{displayName(name).slice(0, 1).toUpperCase()}</span>}
    </span>
  );
}

export default function LeaderboardView({
  stats,
  userName,
  onSignIn,
}: {
  stats: LeaderboardStats;
  userName: string;
  onSignIn: () => void;
}) {
  const [period, setPeriod] = useState<Period>("all-time");
  const [comingOpen, setComingOpen] = useState(false);
  const board = trpc.leaderboard.list.useQuery({ period }, { staleTime: 30_000, refetchOnWindowFocus: true });
  const entries = board.data?.entries ?? [];
  const current = board.data?.currentUser ?? null;
  const podium = useMemo(() => entries.slice(0, 3), [entries]);
  const podiumOrder = podium.length === 3
    ? [{ entry: podium[1]!, rank: 2 }, { entry: podium[0]!, rank: 1 }, { entry: podium[2]!, rank: 3 }]
    : podium.map((entry, index) => ({ entry, rank: index + 1 }));
  const topScore = Number(entries[0]?.points ?? 0);
  const currentPoints = Number(current?.points ?? 0);
  const currentShare = current && topScore > 0 ? Math.min(100, Math.round((currentPoints / topScore) * 100)) : 0;
  const pointsBehindLeader = Math.max(0, topScore - currentPoints);
  const quickStats = [
    { label: "Total Points", value: current ? points(current.points) : stats.points !== null ? points(stats.points) : "—", Icon: Star, tone: "gold" },
    { label: "Completed Courses", value: stats.coursesCompleted !== null ? points(stats.coursesCompleted) : "—", Icon: BookOpen, tone: "blue" },
    { label: "CVE Intelligence", value: stats.cvesTracked !== null ? points(stats.cvesTracked) : "—", Icon: Bug, tone: "cyan" },
  ];

  return (
    <>
      <section className="cj-lb-reference-page">
        <div className="cj-lb-main-column">
          <section className="cj-lb-stage">
            <div className="cj-lb-cityscape" aria-hidden="true">
              <span /><span /><span /><span /><span /><span /><span /><span /><span />
            </div>
            <header className="cj-lb-stage-heading">
              <span className="cj-lb-title-icon"><Trophy size={36} /></span>
              <div>
                <span className="cj-lb-eyebrow">COMMUNITY RANKING</span>
                <h1>Leaderboard</h1>
                <p>See how you rank among the CyberJocx community.</p>
              </div>
            </header>

            {board.isLoading ? (
              <div className="cj-lb-state"><RefreshCw className="cj-lb-spin" size={21} /> Loading leaderboard…</div>
            ) : board.isError ? (
              <div className="cj-lb-state is-error">
                <ShieldCheck size={25} />
                <strong>Leaderboard unavailable</strong>
                <span>تعذر تحميل الترتيب الآن. حاول مرة أخرى.</span>
                <button type="button" onClick={() => void board.refetch()}>Retry</button>
              </div>
            ) : entries.length === 0 ? (
              <div className="cj-lb-state">
                <Trophy size={28} />
                <strong>No ranking data yet</strong>
                <span>سيظهر ترتيب المجتمع بمجرد تسجيل نقاط فعلية.</span>
              </div>
            ) : (
              <div className="cj-lb-podium">
                {podiumOrder.map(({ entry, rank }) => (
                  <article className={`cj-lb-podium-user place-${rank}`} key={entry.id}>
                    <div className="cj-lb-podium-halo">
                      {rank === 1 && <Crown className="cj-lb-podium-crown" size={25} />}
                      <Avatar name={entry.name} src={entry.avatarUrl} size="large" />
                    </div>
                    <strong>{displayName(entry.name)}</strong>
                    <span className="cj-lb-podium-points"><Star size={14} fill="currentColor" /> {points(entry.points)} Pts</span>
                    <div className="cj-lb-podium-base"><b>{rank}</b></div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="cj-lb-ranking-section">
            <div className="cj-lb-periods" role="tablist" aria-label="Leaderboard period">
              {periods.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={period === id}
                  className={period === id ? "is-active" : ""}
                  onClick={() => id === "all-time" ? setPeriod("all-time") : setComingOpen(true)}
                >
                  <Icon size={16} />{label}
                </button>
              ))}
            </div>

            <section className="cj-lb-table-card">
              <div className="cj-lb-table">
                <div className="cj-lb-table-head">
                  <span>#</span><span>User</span><span>Points</span><span>Rank</span><span>Score Progress</span>
                </div>
                {board.isLoading ? (
                  <div className="cj-lb-table-state"><RefreshCw className="cj-lb-spin" size={18} /> Loading ranks…</div>
                ) : board.isError ? (
                  <div className="cj-lb-table-state">Ranking data could not be loaded.</div>
                ) : entries.length === 0 ? (
                  <div className="cj-lb-table-state">No members have recorded points yet.</div>
                ) : entries.map(entry => {
                  const scoreShare = topScore > 0 ? Math.min(100, Math.round((Number(entry.points) / topScore) * 100)) : 0;
                  return (
                    <div className={`cj-lb-row ${entry.isCurrentUser ? "is-current" : ""} ${entry.rank === 1 ? "is-first" : ""}`} key={entry.id}>
                      <span className={`cj-lb-rank-number rank-${entry.rank}`}>
                        {entry.rank <= 3 ? <b>{entry.rank}</b> : entry.rank}
                      </span>
                      <span className="cj-lb-table-user">
                        {entry.rank === 1 ? <Crown className="cj-lb-row-crown gold" size={17} /> : entry.rank === 2 ? <Medal className="cj-lb-row-crown silver" size={17} /> : entry.rank === 3 ? <Medal className="cj-lb-row-crown bronze" size={17} /> : <span className="cj-lb-row-crown-spacer" />}
                        <Avatar name={entry.name} src={entry.avatarUrl} />
                        <strong>{displayName(entry.name)}</strong>
                        {entry.isCurrentUser && <small>YOU</small>}
                      </span>
                      <span className="cj-lb-points">{points(entry.points)}</span>
                      <span>
                        <b className={`cj-lb-tier rank-${entry.memberRank}`}>
                          <ShieldCheck size={14} />{rankLabels[entry.memberRank] ?? "Learner"}
                        </b>
                      </span>
                      <span className="cj-lb-score-progress">
                        <span>{scoreShare}%</span>
                        <i><b style={{ width: `${scoreShare}%` }} /></i>
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="cj-lb-footnote">Rankings use points recorded by platform activities. Only public profile details are displayed.</p>
            </section>
          </section>
        </div>

        <aside className="cj-lb-side-column">
          <section className="cj-lb-profile-card">
            <div className="cj-lb-card-topline"><span><Award size={16} /> YOUR POSITION</span><i>LIVE</i></div>
            {current ? (
              <>
                <div className="cj-lb-profile-main">
                  <div className="cj-lb-rank-emblem"><ShieldCheck size={35} /><b>{rankLabels[current.memberRank] ?? "Member"}</b></div>
                  <div className="cj-lb-profile-details">
                    <strong>{points(current.points)} <small>PTS</small></strong>
                    <span>{displayName(current.name)}</span>
                    <div className="cj-lb-progress-track"><i style={{ width: `${currentShare}%` }} /></div>
                    <small>{current.rank === 1 ? "You are leading the board" : current.rank ? `Rank #${current.rank}` : "Outside the top 50"} · {current.rank === 1 ? "Top position" : `${points(pointsBehindLeader)} pts to first place`}</small>
                  </div>
                </div>
                <div className="cj-lb-profile-bottom">
                  <div><Star size={18} /><strong>{points(current.points)}</strong><small>Points</small></div>
                  <div><Crown size={18} /><strong>{rankLabels[current.memberRank] ?? "Member"}</strong><small>Member Rank</small></div>
                </div>
              </>
            ) : (
              <div className="cj-lb-profile-guest">
                <div className="cj-lb-rank-emblem"><ShieldCheck size={35} /><b>GUEST</b></div>
                <p>Sign in to see your personal points and ranking progress.</p>
                <button type="button" onClick={onSignIn}>Sign In</button>
              </div>
            )}
          </section>

          <section className="cj-lb-quick-stats">
            <header><Zap size={19} /><h2>Quick Stats</h2></header>
            {quickStats.map(({ label, value, Icon, tone }) => (
              <div className="cj-lb-quick-stat" key={label}>
                <span className={tone}><Icon size={19} /></span>
                <strong>{label}</strong>
                <b>{value}</b>
              </div>
            ))}
          </section>

          <section className="cj-lb-encouragement">
            <div className="cj-lb-quote-mark open">“</div>
            <img src={`${import.meta.env.BASE_URL}assets/cyber-hacker.jpg`} alt="" aria-hidden="true" />
            <p><strong>Keep going, {current ? displayName(current.name) : userName}!</strong><br />Every course completed and every skill practiced takes you one step further.</p>
            <div className="cj-lb-quote-mark close">”</div>
          </section>
        </aside>
      </section>
      <ComingSoonModal open={comingOpen} onClose={() => setComingOpen(false)} />
    </>
  );
}
