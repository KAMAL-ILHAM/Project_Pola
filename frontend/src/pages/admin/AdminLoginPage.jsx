import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import BackendTodo from "../../components/BackendTodo.jsx";
import { USE_MOCK } from "../../api.js";
import { useAuth } from "../../auth.jsx";
import { describeError } from "../../utils.js";

/** Halaman login admin. Setelah berhasil, kembali ke halaman admin yang tadi dituju. */
export default function AdminLoginPage() {
  const { admin, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (admin) return <Navigate to="/admin" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await loginAdmin({ username: username.trim(), password });
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  const info = error && describeError(error);

  return (
    <section className="card login-card">
      <h1>Masuk Admin</h1>
      <p className="lead">Halaman ini khusus pengelola sistem presensi.</p>

      <BackendTodo>
        Endpoint POST /auth/login belum ada (lihat docs/TODO_BACKEND_Rama.md). Selama VITE_USE_MOCK=true, gunakan akun
        contoh admin / admin123.
      </BackendTodo>
      {USE_MOCK && <Alert tone="info">Mode mock aktif. Akun contoh: username <strong>admin</strong>, password <strong>admin123</strong>.</Alert>}
      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}

      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="login-user">Username</label>
          <input id="login-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div className="field">
          <label htmlFor="login-pass">Password</label>
          <input id="login-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? "Memeriksa..." : "Masuk"}
        </button>
      </form>
    </section>
  );
}
