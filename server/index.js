require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

app.use(cors());
app.use(express.json());

// Create tables on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE
  );
`).catch((e) => console.error("DB init failed:", e.message));

// Auth middleware: verifies the JWT and sets req.userId
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  try {
    req.userId = jwt.verify(token, JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// ---------- Auth routes ----------
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [email, hash]
    );
    res.json({ token: jwt.sign({ id: rows[0].id }, JWT_SECRET, { expiresIn: "7d" }) });
  } catch (e) {
    res.status(400).json({ error: e.code === "23505" ? "Email already registered" : "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({ token: jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" }) });
});

// ---------- Task routes (protected, scoped to the logged-in user) ----------
app.get("/api/tasks", auth, async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM tasks WHERE user_id = $1 ORDER BY id", [req.userId]);
  res.json(rows);
});

app.post("/api/tasks", auth, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const { rows } = await pool.query(
    "INSERT INTO tasks (user_id, title) VALUES ($1, $2) RETURNING *",
    [req.userId, title]
  );
  res.json(rows[0]);
});

app.put("/api/tasks/:id", auth, async (req, res) => {
  const { rows } = await pool.query(
    "UPDATE tasks SET done = NOT done WHERE id = $1 AND user_id = $2 RETURNING *",
    [req.params.id, req.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: "Not found" });
  res.json(rows[0]);
});

app.delete("/api/tasks/:id", auth, async (req, res) => {
  await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
  res.json({ ok: true });
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
