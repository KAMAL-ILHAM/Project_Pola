import Spinner from "./Spinner.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { formatDate, formatTime } from "../utils.js";

/**
 * Tabel kehadiran. Props:
 *  rows       : [{ id, nama, nim, timestamp, status }]
 *  loading    : tampilkan spinner
 *  showDate   : tampilkan kolom tanggal (untuk rekap lintas hari)
 *  emptyText  : teks bila data kosong
 *  onDelete   : (opsional, khusus admin) fungsi(row) -> menambah kolom Aksi dengan tombol Hapus
 */
export default function AttendanceTable({ rows, loading, showDate = false, emptyText = "Belum ada data.", onDelete }) {
  if (loading) return <Spinner label="Memuat data..." />;
  if (rows.length === 0) return <p className="empty">{emptyText}</p>;

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">No</th>
            <th scope="col">Nama</th>
            <th scope="col">NIM</th>
            {showDate && <th scope="col">Tanggal</th>}
            <th scope="col">Waktu</th>
            <th scope="col">Status</th>
            {onDelete && <th scope="col">Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id}>
              <td>{i + 1}</td>
              <td>{row.nama}</td>
              <td>{row.nim}</td>
              {showDate && <td>{formatDate(row.timestamp)}</td>}
              <td>{formatTime(row.timestamp)}</td>
              <td>
                <StatusBadge status={row.status} />
              </td>
              {onDelete && (
                <td>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(row)}>
                    Hapus
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
