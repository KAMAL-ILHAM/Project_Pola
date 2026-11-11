import Icon from "./Icon.jsx";
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
 * Di layar ponsel, tiap baris tampil sebagai kartu (label diambil dari atribut data-label).
 */
export default function AttendanceTable({ rows, loading, showDate = false, emptyText = "Belum ada data.", onDelete }) {
  if (loading) return <Spinner label="Memuat data..." />;
  if (rows.length === 0) return <p className="empty">{emptyText}</p>;

  return (
    <div className="table-wrap">
      <table className="table table-stack">
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
              <td data-label="No">{i + 1}</td>
              <td data-label="Nama" className="cell-strong">
                {row.nama}
              </td>
              <td data-label="NIM">{row.nim}</td>
              {showDate && <td data-label="Tanggal">{formatDate(row.timestamp)}</td>}
              <td data-label="Waktu">{formatTime(row.timestamp)}</td>
              <td data-label="Status">
                <StatusBadge status={row.status} />
              </td>
              {onDelete && (
                <td className="actions">
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(row)} aria-label={`Hapus catatan ${row.nama}`}>
                    <Icon name="trash" />
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
