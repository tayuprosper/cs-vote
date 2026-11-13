import { useEffect, useState } from "react";
import { FiUsers, FiCheckSquare, FiPercent, FiAward, FiLock } from "react-icons/fi";
import { api } from "../api.js";
import { Page, Card, Stat, Avatar, Spinner } from "../components/ui.jsx";

export default function Results() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/results").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <Page narrow>
        <Card className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
            <FiLock size={22} />
          </span>
          <h1 className="mt-4 text-xl font-bold">No results yet</h1>
          <p className="mt-1 text-sm text-slate-600">{error}</p>
        </Card>
      </Page>
    );
  }
  if (!data) return <Page><Spinner /></Page>;

  const t = data.totals;

  return (
    <Page>
      <h1 className="text-3xl font-extrabold tracking-tight">Election results</h1>
      <p className="mt-2 text-slate-600">Voting is closed. These are the final numbers.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat icon={FiUsers} label="Eligible" value={t.eligible} />
        <Stat icon={FiCheckSquare} label="Voted" value={t.voted} />
        <Stat icon={FiPercent} label="Turnout" value={`${t.turnout}%`} />
        <Stat icon={FiAward} label="Candidates" value={t.candidates} />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {data.positions.map((p) => {
          const max = Math.max(0, ...p.candidates.map((c) => c.votes));
          return (
            <Card key={p.id}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{p.name}</h2>
                <span className="text-sm font-medium text-slate-500">{p.totalVotes} votes</span>
              </div>
              <div className="mt-5 space-y-5">
                {p.candidates.length === 0 && (
                  <p className="text-sm text-slate-500">No candidates.</p>
                )}
                {p.candidates.map((c) => {
                  const pct = p.totalVotes ? Math.round((c.votes / p.totalVotes) * 1000) / 10 : 0;
                  const win = max > 0 && c.votes === max;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={c.name}
                          size="h-9 w-9"
                          tone={win ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}
                        />
                        <span className="flex-1 font-semibold">
                          {c.name}
                          {win && (
                            <FiAward className="ml-2 inline text-amber-500" size={16} />
                          )}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {c.votes} ({pct}%)
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${win ? "bg-indigo-600" : "bg-slate-300"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
