import { useEffect, useState } from "react";
import Alert from "../../components/Alert.jsx";
import Spinner from "../../components/Spinner.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { getMyAttendance } from "../../api.js";
import { describeError, formatDate, formatTime } from "../../utils.js";

/** Riwayat kehadiran milik mahasiswa yang sedang login (hanya data sendiri). */
export default function MahasiswaRiwayatPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyAttendance()
      .then((res) => setRows(res.data))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const info = error && describeError(error);

  return (
    <>
      <h1>Riwayat Kehadiran</h1>
      <p className="lead">Seluruh catatan kehadiran Anda.</p>

      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}
      {loading ? (
        <Spinner label="Memuat riwayat..." />
      ) : (
        <>
          <div className="stats">
            <StatCard label="Total hadir" value={rows.length} tone="success" />
          </div>
          <section className="card">
            {rows.length === 0 ? (
              <p className="empty">Belum ada riwayat kehadiran.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">No</th>
                      <th scope="col">Tanggal</th>
                      <th scope="col">Waktu</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.id}>
                        <td>{i + 1}</td>
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
