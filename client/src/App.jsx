import { useState, useEffect } from "react";

// Small fetch helper that attaches the JWT
async function api(path, token, method = "GET", body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function Auth({ onToken }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const { token } = await api(`/${mode}`, null, "POST", { email, password });
      onToken(token);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <h1>{mode === "login" ? "Log in" : "Register"}</h1>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="error">{error}</p>}
      <button type="submit">{mode === "login" ? "Log in" : "Create account"}</button>
      <p className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
        {mode === "login" ? "No account? Register" : "Have an account? Log in"}
      </p>
    </form>
  );
}

function Tasks({ token, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    api("/tasks", token).then(setTasks).catch(onLogout);
  }, []);

  async function add(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const task = await api("/tasks", token, "POST", { title });
    setTasks([...tasks, task]);
    setTitle("");
  }

  async function toggle(id) {
    const updated = await api(`/tasks/${id}`, token, "PUT");
    setTasks(tasks.map((t) => (t.id === id ? updated : t)));
  }

  async function remove(id) {
    await api(`/tasks/${id}`, token, "DELETE");
    setTasks(tasks.filter((t) => t.id !== id));
  }

  return (
    <div className="card">
      <div className="row">
        <h1>My Tasks</h1>
        <button className="ghost" onClick={onLogout}>Log out</button>
      </div>
      <form onSubmit={add} className="row">
        <input placeholder="New task..." value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <span className={t.done ? "done" : ""} onClick={() => toggle(t.id)}>{t.title}</span>
            <button className="ghost" onClick={() => remove(t.id)}>✕</button>
          </li>
        ))}
        {tasks.length === 0 && <p className="muted">No tasks yet.</p>}
      </ul>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  function saveToken(t) {
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
    setToken(t);
  }

  return token
    ? <Tasks token={token} onLogout={() => saveToken(null)} />
    : <Auth onToken={saveToken} />;
}
