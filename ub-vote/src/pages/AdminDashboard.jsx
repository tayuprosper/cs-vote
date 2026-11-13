import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUsers, FiCheckSquare, FiPercent, FiAward, FiList, FiPlus,
  FiLogOut, FiSend, FiBarChart2, FiUserPlus, FiAlertTriangle,
} from "react-icons/fi";
import { api, tokenKey } from "../api.js";
import { Page, Card, Button, Field, Alert, Stat, Avatar, Spinner } from "../components/ui.jsx";

function PositionCard({ position, onChange, onError, open }) {
  const [ub, setUb] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    onError("");
    try {
      await api("/admin/candidates", {
        method: "POST",
        role: "admin",
        body: { positionId: position.id, matricule: ub, name },
      });
      setUb("");
      setName("");
      onChange();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold">{position.name}</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {position.votesCast} votes cast
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {position.candidates.length === 0 && (
          <li className="text-sm text-slate-500">No candidates yet.</li>
        )}
        {position.candidates.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
            <Avatar name={c.name} size="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{c.name}</p>
              <p className="text-xs text-slate-500">{c.matricule}</p>
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <form onSubmit={add} className="mt-5 space-y-3 border-t border-slate-100 pt-5">
          <Field
            placeholder="Candidate UB number"
            value={ub}
            onChange={(e) => setUb(e.target.value.toUpperCase())}
            required
          />
          <Field
            placeholder="Display name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" variant="soft" icon={FiUserPlus} loading={busy} className="w-full">
            Add candidate
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api("/admin/overview", { role: "admin" }));
    } catch (e) {
      if (e.status === 401) nav("/admin");
      else setError(e.message);
    }
  }, [nav]);

  useEffect(() => {
    const initialLoad = setTimeout(load, 0);
    const t = setInterval(load, 10000); // refresh stats every 10 seconds
    return () => {
      clearTimeout(initialLoad);
      clearInterval(t);
    };
  }, [load]);

  function logout() {
    sessionStorage.removeItem(tokenKey("admin"));
    nav("/admin");
  }

  async function addPosition(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/admin/positions", { method: "POST", role: "admin", body: { name: newPosition } });
      setNewPosition("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    try {
      await api("/admin/publish", { method: "POST", role: "admin" });
      setConfirming(false);
      await load();
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  const header = (
    <Button variant="ghost" icon={FiLogOut} onClick={logout} className="h-9 px-3">
      Log out
    </Button>
  );

  if (!data) return <Page right={header}><Spinner /></Page>;

  const open = data.status === "open";
  const s = data.stats;

  return (
    <Page right={header}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-600">
            Vote counts stay hidden until you publish.
          </p>
        </div>
        {open ? (
          <Button variant="danger" icon={FiSend} onClick={() => setConfirming(true)}>
            Publish results
          </Button>
        ) : (
          <Link to="/results">
            <Button icon={FiBarChart2}>View results</Button>
          </Link>
        )}
      </div>

      {!open && (
        <div className="mb-6">
          <Alert kind="success">Results are published and voting is closed.</Alert>
        </div>
      )}
      <div className="mb-6"><Alert>{error}</Alert></div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Stat icon={FiUsers} label="Students" value={s.totalStudents} hint="On the list" />
        <Stat icon={FiList} label="Can vote" value={s.eligible} hint="Candidates removed" />
        <Stat icon={FiCheckSquare} label="Voted" value={s.voted} hint="At least one category" />
        <Stat icon={FiPercent} label="Turnout" value={`${s.turnout}%`} />
        <Stat icon={FiAward} label="Candidates" value={s.candidates} />
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${Math.min(s.turnout, 100)}%` }}
        />
      </div>

      <h2 className="mb-4 mt-10 text-xl font-bold">Positions and candidates</h2>

      {open && (
        <Card className="mb-5">
          <form onSubmit={addPosition} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field
                label="New position"
                placeholder="e.g. President"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                required
              />
            </div>
            <Button type="submit" icon={FiPlus} loading={busy} className="h-12">
              Add position
            </Button>
          </form>
        </Card>
      )}

      {data.positions.length === 0 ? (
        <p className="text-slate-500">No positions yet. Add the first one above.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {data.positions.map((p) => (
            <PositionCard key={p.id} position={p} open={open} onChange={load} onError={setError} />
          ))}
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <FiAlertTriangle size={22} />
            </span>
            <h2 className="mt-4 text-xl font-bold">Publish results?</h2>
            <p className="mt-2 text-sm text-slate-600">
              This closes voting for everyone and shows the results. You cannot
              undo it.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" loading={busy} onClick={publish}>
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
