import { useState } from "react";
import { Award, Crown, Medal, RefreshCw, Shield, Trophy, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "./leaderboard.css";

type Period = "all-time" | "month" | "week" | "today";

const periods: { id: Period; label: string }[] = [
  { id: "all-time", label: "All Time" },
  { id: "month", label: "This Month" },
  { id: "week", label: "This Week" },
  { id: "today", label: "Today" },
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

function Avatar({ name, src }: { name: string | null; src: string | null }) {
  return (
    <span className="cj-leader-avatar">
      {src ? <img src={src} alt="" loading="lazy" /> : <span>{displayName(name).slice(0, 1).toUpperCase()}</span>}
    </span>
  );
}

export default function LeaderboardView() {
  const [period, setPeriod] = useState<Period>("all-time");
  const board = trpc.leaderboard.list.useQuery({ period });
  const entries = board.data?.entries ?? [];
  const podium = entries.length >= 3
    ? [{ entry: entries[1]!, rank: 2 }, { entry: entries[0]!, rank: 1 }, { entry: entries[2]!, rank: 3 }]
    : entries.map((entry, index) => ({ entry, rank: index + 1 }));
  const current = board.data?.currentUser ?? null;

  return (
    <section className="cj-leaderboard">
      <header className="cj-leader-hero">
        <div className="cj-leader-heading">
          <span className="cj-leader-heading-icon"><Trophy size={30} /></span>
          <div>
            <span className="cj-leader-eyebrow">// COMMUNITY RANKING</span>
            <h2>Leaderboard</h2>
            <p>See how you rank among the CyberJocx community.</p>
          </div>
        </div>
        <div className="cj-leader-period" role="tablist" aria-label="Leaderboard period">
          {periods.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={period === item.id}
              className={period === item.id ? "is-active" : ""}
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {board.isLoading ? (
        <div className="cj-leader-state"><RefreshCw className="cj-spin" size={20} /> Loading leaderboard…</div>
      ) : board.isError && board.error.data?.code === "NOT_FOUND" ? (
        <div className="cj-leader-state">
          <Trophy size={28} />
          <strong>Coming Soon</strong>
        </div>
      ) : board.isError ? (
        <div className="cj-leader-state is-error">
          <Shield size={22} />
          <strong>Leaderboard unavailable</strong>
          <span>تعذر تحميل الترتيب الآن. حاول مرة أخرى.</span>
          <button type="button" onClick={() => void board.refetch()}>Retry</button>
        </div>
      ) : entries.length === 0 ? (
        <div className="cj-leader-state">
          <Trophy size={28} />
          <strong>No ranking data yet</strong>
          <span>سيظهر ترتيب المجتمع بمجرد تسجيل نقاط فعلية.</span>
        </div>
      ) : (
        <>
          <div className="cj-leader-grid">
            <section className="cj-leader-main-card">
              <div className="cj-podium">
                {podium.map(({ entry, rank: actualRank }) => {
                  const rankClass = actualRank === 1 ? "first" : actualRank === 2 ? "second" : "third";
                  return (
                    <article className={`cj-podium-person ${rankClass}`} key={entry.id}>
                      {actualRank === 1 && <Crown className="cj-podium-crown" size={22} />}
                      <Avatar name={entry.name} src={entry.avatarUrl} />
                      <strong>{displayName(entry.name)}</strong>
                      <span>{Number(entry.points).toLocaleString()} XP</span>
                      <b className="cj-podium-base">{actualRank}</b>
                    </article>
                  );
                })}
              </div>
              <div className="cj-ranking-header">
                <div><span>// GLOBAL RANKING</span><h3>Top Operators</h3></div>
                <span className="cj-live-pill"><i /> LIVE DATA</span>
              </div>
              <div className="cj-ranking-table-wrap">
                <table className="cj-ranking-table">
                  <thead><tr><th>#</th><th>Operator</th><th>Points</th><th>Member Rank</th></tr></thead>
                  <tbody>
                    {entries.map(entry => (
                      <tr key={entry.id} className={entry.isCurrentUser ? "is-current" : ""}>
                        <td><span className={`cj-rank-number rank-${entry.rank}`}>{entry.rank}</span></td>
                        <td>
                          <span className="cj-ranking-user">
                            <Avatar name={entry.name} src={entry.avatarUrl} />
                            <strong>{displayName(entry.name)}</strong>
                            {entry.isCurrentUser && <small>YOU</small>}
                          </span>
                        </td>
                        <td className="cj-points-cell">{Number(entry.points).toLocaleString()}</td>
                        <td><span className={`cj-member-rank rank-${entry.memberRank}`}><Medal size={13} />{rankLabels[entry.memberRank] ?? "Learner"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="cj-ranking-footnote">Ranking is calculated from recorded platform points. Only public profile details are displayed.</p>
            </section>

            <aside className="cj-leader-aside">
              <section className="cj-leader-profile-card">
                <div className="cj-leader-card-label"><Award size={17} /> YOUR POSITION</div>
                {current ? (
                  <>
                    <Avatar name={current.name} src={current.avatarUrl} />
                    <strong>{displayName(current.name)}</strong>
                    <span className="cj-your-points">{Number(current.points).toLocaleString()} <small>XP</small></span>
                    <p>{current.rank ? `Rank #${current.rank}` : "Not currently in the top 50"}</p>
                  </>
                ) : (
                  <div className="cj-leader-guest"><Users size={22} /><span>Sign in to see your position.</span></div>
                )}
              </section>
              <section className="cj-leader-note">
                <Trophy size={23} />
                <strong>Earn your place.</strong>
                <p>Complete courses, challenges and practical activities to build your verified points.</p>
              </section>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
