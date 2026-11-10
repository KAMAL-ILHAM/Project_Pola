import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import BackendTodo from "../../components/BackendTodo.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { getMyAttendance, markMyAttendance } from "../../api.js";
import { useAuth } from "../../auth.jsx";
import { describeError, formatDate, formatHourMinute, formatTime, todayISO } from "../../utils.js";

/** Beranda mahasiswa (setelah login wajah): status absen hari ini, tombol absen, dan 5 riwayat terakhir. */
export default function MahasiswaBerandaPage() {
  const { student } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getMyAttendance();
      setRows(res.data);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function absen() {
    setMarking(true);
    setNotice(null);
    try {
      const res = await markMyAttendance();
      setNotice(res.data.already_recorded ? "Anda sudah absen hari ini." : "Absen berhasil dicatat.");
      setError(null);
      await load();
    } catch (e) {
      setError(e);
    } finally {
      setMarking(false);
    }
  }

  const todayRow = rows.find((r) => String(r.timestamp).startsWith(todayISO()));
  const info = error && describeError(error);

  return (
    <>
      <h1>Halo, {student.nama}</h1>
      <p className="lead">NIM {student.nim}. Wajah Anda sudah terverifikasi.</p>

      <BackendTodo>
        GET dan POST /me/attendance belum ada. Data harus diambil dari identitas di token mahasiswa (bukan dari parameter), dan
        absen hanya boleh satu kali per hari.
      </BackendTodo>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}

      {loading ? (
        <Spinner label="Memuat data..." />
      ) : (
        <>
          {todayRow ? (
            <div className="result result-success" role="status">
              <h2>Sudah absen hari ini</h2>
              <p className="result-message">
                Kehadiran Anda tercatat pada jam <strong>{formatHourMinute(todayRow.timestamp)}</strong>.
              </p>
            </div>
          ) : (
            <div className="result result-warning">
              <h2>Belum absen hari ini</h2>
              <p>Tekan tombol di bawah untuk mencatat kehadiran Anda.</p>
              <button type="button" className="btn btn-primary btn-lg" onClick={absen} disabled={marking}>
                {marking ? "Mencatat..." : "Absen Sekarang"}
              </button>
            </div>
          )}

          <section className="card">
            <div className="card-head">
              <h2>Riwayat terakhir</h2>
              <Link to="/mahasiswa/riwayat" className="btn btn-secondary btn-sm">
                Lihat semua
              </Link>
            </div>
            {rows.length === 0 ? (
              <p className="empty">Belum ada riwayat kehadiran.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Tanggal</th>
                      <th scope="col">Waktu</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((r) => (
                      <tr key={r.id}>
                        <td>{formatDate(r.timestamp)}</td>
                        <td>{formatTime(r.timestamp)}</td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
