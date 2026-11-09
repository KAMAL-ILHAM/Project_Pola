import { useCallback, useEffect, useState } from "react";
import StatCard from "../components/StatCard.jsx";
import BarChart from "../components/BarChart.jsx";
import AttendanceTable from "../components/AttendanceTable.jsx";
import Alert from "../components/Alert.jsx";
import { getAttendance, getSummary } from "../api.js";
import { describeError, formatDate, formatTime, todayISO, useDebounce } from "../utils.js";

const REFRESH_MS = 30000; // data diperbarui otomatis tiap 30 detik

export default function DashboardPage() {
  const [tanggal, setTanggal] = useState(todayISO());
  const [hari, setHari] = useState(7);
  const [nama, setNama] = useState("");
  const namaQuery = useDebounce(nama);

  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([getSummary({ tanggal, hari }), getAttendance({ tanggal, nama: namaQuery })]);
      setSummary(s.data);
      setRows(a.data);
      setUpdatedAt(new Date().toISOString());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [tanggal, hari, namaQuery]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const info = error && describeError(error);

  return (
    <>
      <h1>Dashboard</h1>
      <p className="lead">Ringkasan kehadiran untuk {formatDate(tanggal)}.</p>

      <div className="toolbar">
        <label className="field-inline">
          <span>Tanggal</span>
          <input type="date" value={tanggal} max={todayISO()} onChange={(e) => e.target.value && setTanggal(e.target.value)} />
        </label>
        <label className="field-inline">
          <span>Grafik</span>
          <select value={hari} onChange={(e) => setHari(Number(e.target.value))}>
            <option value={7}>7 hari</option>
            <option value={14}>14 hari</option>
            <option value={30}>30 hari</option>
          </select>
        </label>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          {loading ? "Memuat..." : "Muat ulang"}
        </button>
        {updatedAt && <span className="muted">Diperbarui {formatTime(updatedAt)}</span>}
      </div>

      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}

      {summary && (
        <>
          <div className="stats">
            <StatCard label="Total mahasiswa" value={summary.total_mahasiswa} />
            <StatCard label="Hadir" value={summary.hadir} tone="success" />
            <StatCard label="Belum hadir" value={summary.belum_hadir} tone="warning" />
            <StatCard label="Persentase hadir" value={`${summary.persentase_hadir}%`} tone="info" />
          </div>

          <section className="card">
            <h2>Kehadiran {hari} hari terakhir</h2>
            <BarChart data={summary.harian} total={summary.total_mahasiswa} highlight={summary.tanggal} />
          </section>
        </>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Daftar hadir</h2>
          <label className="field-inline">
            <span className="sr-only">Cari nama</span>
            <input type="search" placeholder="Cari nama..." value={nama} onChange={(e) => setNama(e.target.value)} />
          </label>
        </div>
        <AttendanceTable
          rows={rows}
          loading={loading && rows.length === 0}
          emptyText={namaQuery ? "Tidak ada hasil untuk pencarian ini." : "Belum ada yang hadir pada tanggal ini."}
        />
      </section>
    </>
  );
}
