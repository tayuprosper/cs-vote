import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUser, FiArrowRight, FiLock, FiBarChart2 } from "react-icons/fi";
import { api, tokenKey } from "../api.js";
import { Page, Card, Button, Field, Alert } from "../components/ui.jsx";

export default function StudentLogin() {
  const nav = useNavigate();
  const [ub, setUb] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    api("/state").then((s) => setClosed(s.status === "closed")).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/login", { method: "POST", body: { ub } });
      sessionStorage.setItem(tokenKey("student"), data.token);
      sessionStorage.setItem("ubvote-name", data.name);
      nav("/vote");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page
      narrow
      right={
        <Link
          to="/admin"
          className="text-sm font-semibold text-slate-600 hover:text-indigo-600"
        >
          Admin
        </Link>
      }
    >
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Your vote, your voice
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-slate-600">
          Enter your UB number to see the ballot. Each category takes one vote
          and votes cannot be changed.
        </p>
      </div>

      <Card>
        {closed ? (
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
              <FiLock size={22} />
            </span>
            <h2 className="mt-4 text-xl font-bold">Voting is closed</h2>
            <p className="mt-1 text-sm text-slate-600">
              The results have been published.
            </p>
            <Link to="/results" className="mt-5 block">
              <Button icon={FiBarChart2} className="w-full">
                See the results
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="UB number"
              icon={FiUser}
              value={ub}
              onChange={(e) => setUb(e.target.value.toUpperCase())}
              placeholder="SC26A683"
              autoComplete="off"
              autoFocus
              required
            />
            <Alert>{error}</Alert>
            <Button type="submit" loading={loading} className="w-full h-12">
              Continue to ballot
              <FiArrowRight size={16} />
            </Button>
          </form>
        )}
      </Card>
    </Page>
  );
}
