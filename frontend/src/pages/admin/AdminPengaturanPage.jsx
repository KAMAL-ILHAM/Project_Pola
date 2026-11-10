import { useEffect, useState } from "react";
import Alert from "../../components/Alert.jsx";
import BackendTodo from "../../components/BackendTodo.jsx";
import { changePassword, getSettings, updateSettings } from "../../api.js";
import { describeError } from "../../utils.js";

const MIN_T = 0.3;
const MAX_T = 0.8;

/** Admin: pengaturan sistem (threshold kecocokan wajah) dan ganti password. */
export default function AdminPengaturanPage() {
  return (
    <>
      <h1>Pengaturan</h1>
      <p className="lead">Atur sensitivitas pengenalan wajah dan keamanan akun admin.</p>
      <ThresholdCard />
      <PasswordCard />
    </>
  );
}

function ThresholdCard() {
  const [threshold, setThreshold] = useState(0.5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((res) => setThreshold(res.data.threshold))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const unavailable = error?.errorCode === "NOT_IMPLEMENTED";
  const invalid = Number.isNaN(Number(threshold)) || threshold < MIN_T || threshold > MAX_T;

  async function submit(e) {
    e.preventDefault();
    if (invalid) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await updateSettings({ threshold: Number(threshold) });
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  const info = error && describeError(error);
  return (
    <section className="card">
      <h2>Ambang kecocokan wajah (threshold)</h2>
      <BackendTodo>
        GET/PUT /settings belum ada. Perlu disepakati dengan Alliyah (modul ml) di mana nilai disimpan dan bagaimana match_face
        membacanya. Validasi rentang {MIN_T} - {MAX_T} juga harus dilakukan di server.
      </BackendTodo>
      <p className="muted">
        Wajah dianggap cocok bila jaraknya di bawah nilai ini. Nilai kecil = lebih ketat (risiko wajah sah ditolak), nilai besar
        = lebih longgar (risiko salah kenal). Bawaan: 0.50.
      </p>
      {saved && <Alert tone="success">Pengaturan disimpan.</Alert>}
      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="threshold">Threshold ({MIN_T} - {MAX_T})</label>
          <input
            id="threshold"
            type="number"
            step="0.01"
            min={MIN_T}
            max={MAX_T}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            disabled={loading || unavailable}
          />
          {invalid && <p className="field-error">Isi angka antara {MIN_T} dan {MAX_T}.</p>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || saving || unavailable || invalid}>
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </section>
  );
}

function PasswordCard() {
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const tooShort = baru.length > 0 && baru.length < 8;
  const mismatch = ulang.length > 0 && baru !== ulang;
  const canSubmit = lama && baru.length >= 8 && baru === ulang;

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setDone(false);
    setError(null);
    try {
      await changePassword({ passwordLama: lama, passwordBaru: baru });
      setDone(true);
      setLama("");
      setBaru("");
      setUlang("");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const info = error && describeError(error);
  return (
    <section className="card">
      <h2>Ganti password admin</h2>
      <BackendTodo>POST /auth/change-password belum ada. Password harus disimpan ter-hash (bcrypt/argon2), bukan teks biasa.</BackendTodo>
      {done && <Alert tone="success">Password berhasil diganti.</Alert>}
      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="pw-lama">Password lama</label>
          <input id="pw-lama" type="password" value={lama} onChange={(e) => setLama(e.target.value)} autoComplete="current-password" />
        </div>
        <div className="field">
          <label htmlFor="pw-baru">Password baru (minimal 8 karakter)</label>
          <input id="pw-baru" type="password" value={baru} onChange={(e) => setBaru(e.target.value)} autoComplete="new-password" />
          {tooShort && <p className="field-error">Minimal 8 karakter.</p>}
        </div>
        <div className="field">
          <label htmlFor="pw-ulang">Ulangi password baru</label>
          <input id="pw-ulang" type="password" value={ulang} onChange={(e) => setUlang(e.target.value)} autoComplete="new-password" />
          {mismatch && <p className="field-error">Password tidak sama.</p>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy || !canSubmit}>
          {busy ? "Menyimpan..." : "Ganti password"}
        </button>
      </form>
    </section>
  );
}
