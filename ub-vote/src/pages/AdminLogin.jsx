import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiShield, FiLock, FiArrowRight } from "react-icons/fi";
import { api, tokenKey } from "../api.js";
import { Page, Card, Button, Field, Alert } from "../components/ui.jsx";

export default function AdminLogin() {
  const nav = useNavigate();
  const [ub, setUb] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/admin/login", {
        method: "POST",
        body: { ub, password },
      });
      sessionStorage.setItem(tokenKey("admin"), data.token);
      nav("/admin/dashboard");
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
        <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-indigo-600">
          Student vote
        </Link>
      }
    >
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Admin sign in</h1>
        <p className="mt-3 text-slate-600">
          Manage positions, candidates and results.
        </p>
      </div>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Admin UB number"
            icon={FiShield}
            value={ub}
            onChange={(e) => setUb(e.target.value.toUpperCase())}
            autoComplete="off"
            required
          />
          <Field
            label="Password"
            icon={FiLock}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Alert>{error}</Alert>
          <Button type="submit" loading={loading} className="w-full h-12">
            Sign in <FiArrowRight size={16} />
          </Button>
        </form>
      </Card>
    </Page>
  );
}
