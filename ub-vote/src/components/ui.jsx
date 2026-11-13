import { Link } from "react-router-dom";
import {
  FiCheckSquare,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
        <FiCheckSquare size={18} />
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        UBCOMBSA VOTES
      </span>
    </Link>
  );
}

export function Page({ right, children, narrow = false }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">{right}</div>
        </div>
      </header>
      <main
        className={`mx-auto px-4 py-8 sm:px-6 sm:py-12 ${
          narrow ? "max-w-md" : "max-w-5xl"
        }`}
      >
        {children}
      </main>
    </div>
  );
}

export function Card({ className = "", children }) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 ${className}`}
    >
      {children}
    </section>
  );
}

const styles = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/25",
  ghost: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  soft: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
};

export function Button({
  variant = "primary",
  loading = false,
  icon: Icon,
  children,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {loading ? <FiLoader className="animate-spin" size={16} /> : Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export function Field({ label, icon: Icon, className = "", ...props }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </span>
      )}
      <span className="relative block">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
        )}
        <input
          {...props}
          className={`h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${
            Icon ? "pl-11" : "pl-4"
          } ${className}`}
        />
      </span>
    </label>
  );
}

export function Alert({ kind = "error", children }) {
  if (!children) return null;
  const ok = kind === "success";
  const Icon = ok ? FiCheckCircle : FiAlertCircle;
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
        ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
      }`}
    >
      <Icon className="mt-0.5 shrink-0" size={16} />
      <span>{children}</span>
    </div>
  );
}

export function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon size={16} />
        </span>
        {label}
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Avatar({ name, size = "h-11 w-11", tone = "bg-slate-100 text-slate-600" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-sm font-bold ${size} ${tone}`}
    >
      {initials}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="grid place-items-center py-24 text-slate-400">
      <FiLoader className="animate-spin" size={28} />
    </div>
  );
}
