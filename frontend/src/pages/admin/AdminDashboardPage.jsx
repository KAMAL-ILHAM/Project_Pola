import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import AttendanceTable from "../../components/AttendanceTable.jsx";
import BackendTodo from "../../components/BackendTodo.jsx";
import BarChart from "../../components/BarChart.jsx";
import Segmented from "../../components/Segmented.jsx";
import Spinner from "../../components/Spinner.jsx";
import Gauge from "../../components/Gauge.jsx";
import { getAttendance, getStudents, getSummary } from "../../api.js";
import { addDays, describeError, formatDate, todayISO } from "../../utils.js";
import Icon from "../../components/Icon.jsx";

const REFRESH_MS = 30000; // hanya untuk tampilan "Hari ini"
const DAY_OPTIONS = [
  { key: "today", label: "Hari ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "custom", label: "Tanggal lain" },
];

/**
 * Dashboard admin: siapa yang sudah dan belum hadir pada hari ini, kemarin, atau tanggal lain.
 * "Belum hadir" dihitung di browser: semua mahasiswa terdaftar dikurangi yang punya catatan hadir pada tanggal itu.
 */
export default function AdminDashboardPage() {
  const [mode, setMode] = useState("today");
  const [custom, setCustom] = useState(addDays(todayISO(), -2));
  const [hari, setHari] = useState(7);
  const [tab, setTab] = useState("hadir");
  const [query, setQuery] = useState("");

  const [summary, setSummary] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tanggal = mode === "today" ? todayISO() : mode === "yesterday" ? addDays(todayISO(), -1) : custom;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, att, stu] = await Promise.all([getSummary({ tanggal, hari }), getAttendance({ tanggal }), getStudents()]);
      setSummary(sum.data);
      setAttendance(att.data);
      setStudents(stu.data);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [tanggal, hari]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (mode !== "today") return;
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [mode, load]);

  const q = query.trim().toLowerCase();
  const match = (nama, nim) => !q || nama.toLowerCase().includes(q) || nim.includes(q);

  const hadirRows = useMemo(() => attendance.filter((a) => match(a.nama, a.nim)), [attendance, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const belumRows = useMemo(() => {
    const hadirNim = new Set(attendance.map((a) => a.nim));
    return students.filter((s) => !hadirNim.has(s.nim) && match(s.nama, s.nim));
  }, [students, attendance, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const info = error && describeError(error);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="lead">Kehadiran pada {formatDate(tanggal)}.</p>
        </div>
        <Link to="/admin/rekap" className="btn btn-primary">
          <Icon name="calendar-check" />
          Rekap &amp; ekspor CSV
        </Link>
      </div>

      <BackendTodo>
        GET /attendance/summary dan GET /attendance perlu dilindungi token admin. Daftar &quot;belum hadir&quot; untuk hari lampau
        butuh field created_at pada mahasiswa (mahasiswa yang mendaftar setelah tanggal itu tidak boleh dihitung belum hadir).
      </BackendTodo>

      <div className="toolbar">
        <Segmented label="Pilih hari" options={DAY_OPTIONS} value={mode} onChange={setMode} />
        {mode === "custom" && (
          <label className="field-inline">
            <span>Tanggal</span>
            <input type="date" value={custom} max={todayISO()} onChange={(e) => e.target.value && setCustom(e.target.value)} />
          </label>
        )}
        <label className="field-inline">
          <span>Grafik</span>
          <select value={hari} onChange={(e) => setHari(Number(e.target.value))}>
            <option value={7}>7 hari</option>
            <option value={14}>14 hari</option>
            <option value={30}>30 hari</option>
          </select>
        </label>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          <Icon name="refresh" />
          {loading ? "Memuat..." : "Muat ulang"}
        </button>
      </div>

      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}

      {!summary && loading && <Spinner label="Memuat ringkasan..." />}
      {summary && (
        <>
          <section className="panel-cream" aria-label="Ringkasan kehadiran">
            <div className="panel-chart">
              <h2 className="panel-title">Kehadiran {hari} hari terakhir</h2>
              <BarChart data={summary.harian} total={summary.total_mahasiswa} highlight={summary.tanggal} />
            </div>
            <div className="panel-gauge">
              <Gauge value={summary.persentase_hadir} label="Hadir" />
            </div>
            <dl className="panel-numbers">
              <div className="big-stat">
                <dt className="big-label">Mahasiswa hadir</dt>
                <dd className="big-number">{summary.hadir}</dd>
              </div>
              <div className="big-stat">
                <dt className="big-label">Belum hadir</dt>
                <dd className="big-number">{summary.belum_hadir}</dd>
              </div>
              <div className="big-stat">
                <dt className="big-label">Total terdaftar</dt>
                <dd className="big-number">{summary.total_mahasiswa}</dd>
              </div>
            </dl>
          </section>
        </>
      )}

      <section className="card">
        <div className="card-head">
          <Segmented
            label="Daftar"
            value={tab}
            onChange={setTab}
            options={[
              { key: "hadir", label: `Sudah hadir (${hadirRows.length})` },
              { key: "belum", label: `Belum hadir (${belumRows.length})` },
            ]}
          />
          <label className="field-inline">
            <span className="sr-only">Cari nama atau NIM</span>
            <input type="search" placeholder="Cari nama atau NIM..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        {tab === "hadir" ? (
          <AttendanceTable rows={hadirRows} loading={loading && attendance.length === 0} emptyText="Belum ada yang hadir pada tanggal ini." />
        ) : belumRows.length === 0 ? (
          <p className="empty">Semua mahasiswa sudah hadir.</p>
        ) : (
          <div className="table-wrap">
            <table className="table table-stack">
              <thead>
                <tr>
                  <th scope="col">No</th>
                  <th scope="col">Nama</th>
                  <th scope="col">NIM</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {belumRows.map((s, i) => (
                  <tr key={s.id}>
                    <td data-label="No">{i + 1}</td>
                    <td data-label="Nama">{s.nama}</td>
                    <td data-label="NIM">{s.nim}</td>
                    <td data-label="Status">
                      <span className="badge badge-warning">Belum hadir</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
