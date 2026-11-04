import { useMemo, useState } from "react";
import { Clock3, Crown, Grid2X2, Medal, RefreshCw, Shield, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { DashboardRightRail } from "@/components/FigmaDashboard";
import { ComingSoonModal } from "@/components/ComingSoonModal";
import "./leaderboard.css";

type Period = "all-time";
type PeriodOption = Period | "month" | "week" | "today";

const periods: { id: PeriodOption; label: string; Icon: typeof Trophy }[] = [
  { id: "all-time", label: "All Time", Icon: Trophy },
  { id: "month", label: "This Month", Icon: Grid2X2 },
  { id: "week", label: "This Week", Icon: Grid2X2 },
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

function Avatar({ name, src, size = "normal" }: { name: string | null; src: string | null; size?: "normal" | "large" }) {
  return (
    <span className={`cj-lb-avatar ${size === "large" ? "is-large" : ""}`}>
      {src ? <img src={src} alt="" loading="lazy" /> : <span>{displayName(name).slice(0, 1).toUpperCase()}</span>}
    </span>
  );
}

function points(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString();
}

export default function LeaderboardView() {
  const [period, setPeriod] = useState<Period>("all-time");
  const [comingOpen, setComingOpen] = useState(false);
  const board = trpc.leaderboard.list.useQuery({ period }, { staleTime: 30_000, refetchOnWindowFocus: true });
  const entries = board.data?.entries ?? [];
  const podium = useMemo(() => entries.slice(0, 3), [entries]);
  const podiumOrder = podium.length === 3
    ? [{ entry: podium[1]!, rank: 2 }, { entry: podium[0]!, rank: 1 }, { entry: podium[2]!, rank: 3 }]
    : podium.map((entry, index) => ({ entry, rank: index + 1 }));

  return (
    <>
      <section className="cj-leaderboard-page">
        <div className="cj-lb-main">
          <div className="cj-lb-content">
            <section className="cj-lb-hero">
              <header>
                <span className="cj-lb-hero-icon"><Trophy size={38} /></span>
                <div>
                  <span className="cj-lb-eyebrow">COMMUNITY RANKING</span>
                  <h1>Leaderboard</h1>
                  <p>See how you rank among the CyberJocx community</p>
                </div>
              </header>
              {board.isLoading ? (
                <div className="cj-lb-state"><RefreshCw className="cj-lb-spin" size={20} /> Loading leaderboard…</div>
              ) : board.isError ? (
                <div className="cj-lb-state is-error">
                  <Shield size={25} />
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
                      {rank === 1 && <Crown className="cj-lb-crown" size={25} />}
                      <Avatar name={entry.name} src={entry.avatarUrl} size="large" />
                      <strong>{displayName(entry.name)}</strong>
                      <span>{points(entry.points)} Pts</span>
                      <div className="cj-lb-podium-base"><b>{rank}</b></div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="cj-lb-board">
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
              {!board.isLoading && !board.isError && entries.length > 0 && (
                <div className="cj-lb-table-wrap">
                  <div className="cj-lb-table">
                    <div className="cj-lb-table-head"><span>#</span><span>Operator</span><span>Points</span><span>Member Rank</span></div>
                    {entries.map(entry => (
                      <div className={`cj-lb-row ${entry.isCurrentUser ? "is-current" : ""}`} key={entry.id}>
                        <span className={`cj-lb-rank-number rank-${entry.rank}`}>{entry.rank}</span>
                        <span className="cj-lb-user">
                          <Avatar name={entry.name} src={entry.avatarUrl} />
                          <strong>{displayName(entry.name)}</strong>
                          {entry.isCurrentUser && <small>YOU</small>}
                        </span>
                        <span className="cj-lb-points">{points(entry.points)}</span>
                        <span><b className={`cj-lb-tier rank-${entry.memberRank}`}><Medal size={14} />{rankLabels[entry.memberRank] ?? "Learner"}</b></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="cj-lb-footnote">Rankings use points recorded by platform activities. Only public profile details are displayed.</p>
            </section>
          </div>

          <aside className="cj-lb-rail">
            <div className="figma-dashboard cj-lb-dashboard-scope">
              <DashboardRightRail onComingSoon={() => setComingOpen(true)} />
            </div>
          </aside>
        </div>
      </section>
      <ComingSoonModal open={comingOpen} onClose={() => setComingOpen(false)} />
    </>
  );
}
