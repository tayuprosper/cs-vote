import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ---------- Settings (change these) ----------
const PORT = Number(process.env.API_PORT || 4100);
const ADMIN_UB = (process.env.ADMIN_UB || "ADMIN001").toUpperCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me-123";

// ---------- Files ----------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const STUDENTS_FILE = path.join(DATA_DIR, "csc_admissions.json");

// ---------- Load students: UB number -> name ----------
const raw = JSON.parse(fs.readFileSync(STUDENTS_FILE, "utf8"));
const students = new Map();
for (const year of raw.academicYears) {
  for (const s of year.students) {
    students.set(s.matricule.trim().toUpperCase(), s.name);
  }
}
console.log(`Loaded ${students.size} students`);

// ---------- Database (one JSON file) ----------
function saveDb(data) {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_FILE); // safe write: never leaves a half-written file
}

function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const fresh = {
      status: "open", // "open" or "closed"
      salt: crypto.randomBytes(16).toString("hex"),
      positions: [], // { id, name, candidates: [{ id, name, matricule, votes }] }
      voters: [], // hashed UB numbers of people who voted at least once
      cast: {}, // positionId -> hashed UB numbers who voted in it
    };
    saveDb(fresh);
    return fresh;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

const db = loadDb();
const sessions = new Map(); // token -> { role, ub, name }

// ---------- Helpers ----------
const clean = (v) => String(v || "").trim().toUpperCase();
const newId = () => crypto.randomUUID().slice(0, 8);
// We store a hash, so the file never shows who voted for what
const hash = (ub) =>
  crypto.createHash("sha256").update(db.salt + ub).digest("hex");

const same = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const isCandidate = (ub) =>
  db.positions.some((p) => p.candidates.some((c) => c.matricule === ub));

function stats() {
  const candidateSet = new Set(
    db.positions.flatMap((p) => p.candidates.map((c) => c.matricule))
  );
  const eligible = students.size - candidateSet.size;
  const voted = db.voters.length;
  return {
    totalStudents: students.size,
    candidates: candidateSet.size,
    eligible,
    voted,
    turnout: eligible ? Math.round((voted / eligible) * 1000) / 10 : 0,
  };
}

function auth(role) {
  return (req, res, next) => {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const session = sessions.get(token);
    if (!session || session.role !== role) {
      return res.status(401).json({ error: "Please log in again" });
    }
    req.session = session;
    next();
  };
}

// ---------- App ----------
const app = express();
app.use(cors());
app.use(express.json());

// Public: is voting open?
app.get("/api/state", (req, res) => {
  res.json({ status: db.status });
});

// Public: results (only after the admin publishes)
app.get("/api/results", (req, res) => {
  if (db.status !== "closed") {
    return res.status(403).json({ error: "Results are not published yet" });
  }
  res.json({
    totals: stats(),
    positions: db.positions.map((p) => ({
      id: p.id,
      name: p.name,
      totalVotes: (db.cast[p.id] || []).length,
      candidates: [...p.candidates].sort((a, b) => b.votes - a.votes),
    })),
  });
});

// ---------- Student routes ----------
app.post("/api/login", (req, res) => {
  const ub = clean(req.body.ub);
  if (!students.has(ub)) {
    return res.status(404).json({ error: "UB number not found" });
  }
  if (db.status === "closed") {
    return res.status(403).json({ error: "Voting is closed" });
  }
  if (isCandidate(ub)) {
    return res
      .status(403)
      .json({ error: "Candidates are not allowed to vote" });
  }
  const token = crypto.randomUUID();
  const name = students.get(ub);
  sessions.set(token, { role: "student", ub, name });
  res.json({ token, name });
});

app.get("/api/ballot", auth("student"), (req, res) => {
  const me = hash(req.session.ub);
  res.json({
    status: db.status,
    positions: db.positions.map((p) => ({
      id: p.id,
      name: p.name,
      // no vote counts here
      candidates: p.candidates.map((c) => ({ id: c.id, name: c.name })),
      voted: (db.cast[p.id] || []).includes(me),
    })),
  });
});

app.post("/api/vote", auth("student"), (req, res) => {
  if (db.status !== "open") {
    return res.status(403).json({ error: "Voting is closed" });
  }
  const { positionId, candidateId } = req.body;
  const ub = req.session.ub;

  if (isCandidate(ub)) {
    return res.status(403).json({ error: "Candidates cannot vote" });
  }
  const position = db.positions.find((p) => p.id === positionId);
  if (!position) return res.status(404).json({ error: "Position not found" });

  const candidate = position.candidates.find((c) => c.id === candidateId);
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });

  const me = hash(ub);
  db.cast[positionId] = db.cast[positionId] || [];
  if (db.cast[positionId].includes(me)) {
    return res.status(409).json({ error: "You already voted in this category" });
  }

  db.cast[positionId].push(me);
  if (!db.voters.includes(me)) db.voters.push(me);
  candidate.votes += 1;
  saveDb(db);
  res.json({ ok: true });
});

// ---------- Admin routes ----------
app.post("/api/admin/login", (req, res) => {
  const ub = clean(req.body.ub);
  const password = req.body.password || "";
  if (!same(ub, ADMIN_UB) || !same(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "Wrong UB number or password" });
  }
  const token = crypto.randomUUID();
  sessions.set(token, { role: "admin", ub });
  res.json({ token });
});

// Stats for the dashboard. Candidate vote counts are NOT included.
app.get("/api/admin/overview", auth("admin"), (req, res) => {
  res.json({
    status: db.status,
    stats: stats(),
    positions: db.positions.map((p) => ({
      id: p.id,
      name: p.name,
      votesCast: (db.cast[p.id] || []).length,
      candidates: p.candidates.map((c) => ({
        id: c.id,
        name: c.name,
        matricule: c.matricule,
      })),
    })),
  });
});

app.post("/api/admin/positions", auth("admin"), (req, res) => {
  if (db.status !== "open") {
    return res.status(403).json({ error: "Voting is closed" });
  }
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Enter a position name" });
  if (db.positions.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ error: "That position already exists" });
  }
  db.positions.push({ id: newId(), name, candidates: [] });
  saveDb(db);
  res.json({ ok: true });
});

app.post("/api/admin/candidates", auth("admin"), (req, res) => {
  if (db.status !== "open") {
    return res.status(403).json({ error: "Voting is closed" });
  }
  const { positionId } = req.body;
  const ub = clean(req.body.matricule);
  const position = db.positions.find((p) => p.id === positionId);
  if (!position) return res.status(404).json({ error: "Position not found" });
  if (!students.has(ub)) {
    return res.status(404).json({ error: "That UB number is not in the list" });
  }
  if (position.candidates.some((c) => c.matricule === ub)) {
    return res.status(409).json({ error: "Already a candidate here" });
  }
  const name = String(req.body.name || "").trim() || students.get(ub);
  // Adding them as a candidate also removes them from the voters list,
  // because isCandidate() is checked at login and at every vote.
  position.candidates.push({ id: newId(), name, matricule: ub, votes: 0 });
  saveDb(db);
  res.json({ ok: true });
});

// Publish results and close voting
app.post("/api/admin/publish", auth("admin"), (req, res) => {
  db.status = "closed";
  saveDb(db);
  sessions.forEach((s, token) => {
    if (s.role === "student") sessions.delete(token);
  });
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));