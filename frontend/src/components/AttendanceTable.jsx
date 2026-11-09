import StatusBadge from "./StatusBadge.jsx";
import { formatTime } from "../utils.js";

/**
 * Tabel kehadiran.
 * rows: data dari GET /attendance. showDate=true menambah kolom tanggal.
 */
export default function AttendanceTable({ rows, loading = false, emptyText = "Belum ada data kehadiran.", showDate = false }) {
  if (!loading && rows.length === 0) {
    return <p className="empty">{emptyText}</p>;
  }

  return (
    <div className="table-wrap" aria-busy={loading}>
      <table className="table">
        <caption className="sr-only">Daftar kehadiran mahasiswa</caption>
        <thead>
          <tr>
            <th scope="col">No</th>
            <th scope="col">Nama</th>
            <th scope="col">NIM</th>
            {showDate && <th scope="col">Tanggal</th>}
            <th scope="col">Waktu</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id}>
              <td>{i + 1}</td>
              <td>{row.nama}</td>
              <td>{row.nim}</td>
              {showDate && <td>{new Date(row.timestamp.replace(/\.\d+/, "")).toLocaleDateString("id-ID")}</td>}
              <td>{formatTime(row.timestamp)}</td>
              <td>
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <p className="muted">Memuat data...</p>}
    </div>
  );
}
