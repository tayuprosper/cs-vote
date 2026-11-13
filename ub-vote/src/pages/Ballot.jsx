import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogOut, FiCheckCircle, FiLock, FiBarChart2, FiInbox } from "react-icons/fi";
import { api, tokenKey } from "../api.js";
import { Page, Card, Button, Alert, Avatar, Spinner } from "../components/ui.jsx";

export default function Ballot() {
  const nav = useNavigate();
  const name = sessionStorage.getItem("ubvote-name") || "";
  const [ballot, setBallot] = useState(null);
  const [picks, setPicks] = useState({});
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setBallot(await api("/ballot", { role: "student" }));
    } catch (e) {
      if (e.status === 401) nav("/");
      else setError(e.message);
    }
  }, [nav]);

  useEffect(() => {
    const initialLoad = setTimeout(load, 0);
    return () => clearTimeout(initialLoad);
  }, [load]);

  function logout() {
    sessionStorage.removeItem(tokenKey("student"));
    sessionStorage.removeItem("ubvote-name");
    nav("/");
  }

  async function vote(positionId) {
    setError("");
    setBusyId(positionId);
    try {
      await api("/vote", {
        method: "POST",
        role: "student",
        body: { positionId, candidateId: picks[positionId] },
      });
      await load();
    } catch (e) {
      setError(e.message);
      load();
    } finally {
      setBusyId("");
    }
  }

  const header = (
    <>
      <span className="hidden text-sm font-medium text-slate-600 sm:block">
        {name}
      </span>
      <Button variant="ghost" icon={FiLogOut} onClick={logout} className="h-9 px-3">
        Log out
      </Button>
    </>
  );

  if (!ballot) return <Page right={header}><Spinner /></Page>;

  const done = ballot.positions.filter((p) => p.voted).length;
  const total = ballot.positions.length;

  if (ballot.status === "closed") {
    return (
      <Page right={header} narrow>
        <Card className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
            <FiLock size={22} />
          </span>
          <h1 className="mt-4 text-xl font-bold">Voting is closed</h1>
          <Link to="/results" className="mt-5 block">
            <Button icon={FiBarChart2} className="w-full">See the results</Button>
          </Link>
        </Card>
      </Page>
    );
  }

  return (
    <Page right={header}>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Your ballot</h1>
        <p className="mt-2 text-slate-600">
          Pick one person in each category, then confirm. You cannot change a
          vote after you confirm it.
        </p>
        {total > 0 && (
          <div className="mt-5 max-w-sm">
            <div className="flex justify-between text-sm font-medium text-slate-600">
              <span>Progress</span>
              <span>{done} of {total} categories</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${(done / total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mb-4"><Alert>{error}</Alert></div>

      {total === 0 && (
        <Card className="text-center">
          <FiInbox className="mx-auto text-slate-400" size={28} />
          <h2 className="mt-3 text-lg font-bold">No categories yet</h2>
          <p className="text-sm text-slate-600">
            The admin has not added any positions. Check back soon.
          </p>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {ballot.positions.map((p) => {
          const chosen = p.candidates.find((c) => c.id === picks[p.id]);
          return (
            <Card key={p.id}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{p.name}</h2>
                {p.voted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <FiCheckCircle size={14} /> Vote recorded
                  </span>
                )}
              </div>

              {p.voted ? (
                <p className="mt-3 text-sm text-slate-600">
                  Thanks. Your vote for this category is saved.
                </p>
              ) : p.candidates.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  No candidates in this category yet.
                </p>
              ) : (
                <>
                  <div className="mt-4 space-y-2.5">
                    {p.candidates.map((c) => {
                      const on = picks[p.id] === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setPicks({ ...picks, [p.id]: c.id })}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                            on
                              ? "border-indigo-600 bg-indigo-50 ring-4 ring-indigo-600/10"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <Avatar
                            name={c.name}
                            tone={on ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}
                          />
                          <span className="flex-1 font-semibold">{c.name}</span>
                          <span
                            className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                              on ? "border-indigo-600" : "border-slate-300"
                            }`}
                          >
                            {on && <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    className="mt-5 w-full"
                    disabled={!chosen}
                    loading={busyId === p.id}
                    onClick={() => vote(p.id)}
                  >
                    {chosen ? `Confirm vote for ${chosen.name.split(" ")[0]}` : "Choose a candidate"}
                  </Button>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
