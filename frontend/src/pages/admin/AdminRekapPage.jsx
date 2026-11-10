import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "../../components/Alert.jsx";
import AttendanceTable from "../../components/AttendanceTable.jsx";
import BackendTodo from "../../components/BackendTodo.jsx";
import Modal from "../../components/Modal.jsx";
import Segmented from "../../components/Segmented.jsx";
import { deleteAttendance, getAttendance } from "../../api.js";
import { addDays, describeError, downloadAttendanceCSV, formatDate, todayISO, useDebounce } from "../../utils.js";

const PRESETS = [
  { key: "today", label: "Hari ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "7", label: "7 hari terakhir" },
  { key: "30", label: "30 hari terakhir" },
  { key: "all", label: "Semua" },
  { key: "custom", label: "Pilih rentang" },
];

/** Ubah pilihan cepat menjadi rentang [dari, sampai] (YYYY-MM-DD). String kosong = tanpa batas. */
function rangeFor(preset, dari, sampai) {
  const today = todayISO();
  switch (preset) {
    case "today":
      return [today, today];
    case "yesterday": {
      const y = addDays(today, -1);
      return [y, y];
    }
    case "7":
      return [addDays(today, -6), today];
    case "30":
      return [addDays(today, -29), today];
    case "all":
      return ["", ""];
    default:
      return [dari, sampai];
  }
}

/** Admin: rekap kehadiran per rentang tanggal + filter nama + ekspor CSV + hapus catatan. */
export default function AdminRekapPage() {
  const [preset, setPreset] = useState("7");
  const [dari, setDari] = useState(addDays(todayISO(), -6));
  const [sampai, setSampai] = useState(todayISO());
  const [nama, setNama] = useState("");
  const namaQuery = useDebounce(nama);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [from, to] = rangeFor(preset, dari, sampai);
  const invalidRange = preset === "custom" && (!dari || !sampai || dari > sampai);

  const load = useCallback(async () => {
    if (invalidRange) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Satu hari: filter di server. Rentang lain: ambil semua lalu saring di browser.
      // TODO-BACKEND: tambah parameter dari & sampai di GET /attendance agar penyaringan dilakukan server.
      const res = await getAttendance({ tanggal: from && from === to ? from : "", nama: namaQuery });
      setRows(
        res.data.filter((r) => {
          const day = String(r.timestamp).slice(0, 10);
          return (!from || day >= from) && (!to || day <= to);
        })
      );
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [invalidRange, from, to, namaQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const uniqueStudents = useMemo(() => new Set(rows.map((r) => r.nim)).size, [rows]);
  const info = error && describeError(error);

  function exportCSV() {
    downloadAttendanceCSV(rows, `rekap_kehadiran_${from || "awal"}_sampai_${to || "akhir"}.csv`);
  }

  return (
    <>
      <h1>Rekap Kehadiran</h1>
      <p className="lead">Lihat kehadiran per hari atau rentang tanggal, lalu unduh sebagai CSV.</p>

      <BackendTodo>
        Penyaringan rentang tanggal saat ini dilakukan di browser setelah mengambil semua data. Tambahkan parameter dari/sampai di
        GET /attendance (dan pagination bila data besar). Tombol Hapus memakai DELETE /attendance/&#123;id&#125; yang belum ada.
      </BackendTodo>

      <div className="toolbar">
        <Segmented label="Pilih periode" options={PRESETS} value={preset} onChange={setPreset} />
      </div>
      <div className="toolbar">
        {preset === "custom" && (
          <>
            <label className="field-inline">
              <span>Dari</span>
              <input type="date" value={dari} max={todayISO()} onChange={(e) => setDari(e.target.value)} />
            </label>
            <label className="field-inline">
              <span>Sampai</span>
              <input type="date" value={sampai} max={todayISO()} onChange={(e) => setSampai(e.target.value)} />
            </label>
          </>
        )}
        <label className="field-inline">
          <span>Nama</span>
          <input type="search" placeholder="Cari nama..." value={nama} onChange={(e) => setNama(e.target.value)} />
        </label>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          {loading ? "Memuat..." : "Muat ulang"}
        </button>
        <button type="button" className="btn btn-primary" onClick={exportCSV} disabled={rows.length === 0}>
          Ekspor CSV
        </button>
      </div>

      {invalidRange && (
        <Alert tone="warning" title="Rentang tanggal belum benar">
          Isi kedua tanggal, dan pastikan tanggal &quot;Dari&quot; tidak melewati &quot;Sampai&quot;.
        </Alert>
      )}
      {notice && <Alert tone="success">{notice}</Alert>}
      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}

      <section className="card">
        <div className="card-head">
          <h2>
            {rows.length} catatan dari {uniqueStudents} mahasiswa
          </h2>
          <span className="muted">{from || to ? `${formatDate(from || to)}${from !== to ? ` - ${formatDate(to)}` : ""}` : "Semua tanggal"}</span>
        </div>
        <AttendanceTable
          rows={rows}
          loading={loading && rows.length === 0}
          showDate
          emptyText={namaQuery ? "Tidak ada hasil untuk pencarian ini." : "Belum ada data kehadiran untuk periode ini."}
          onDelete={setDeleting}
        />
      </section>

      {deleting && (
        <DeleteRecordDialog
          row={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setNotice(`Catatan kehadiran ${deleting.nama} dihapus.`);
            setDeleting(null);
            load();
          }}
        />
      )}
    </>
  );
}

/** Dialog konfirmasi hapus satu catatan kehadiran. */
function DeleteRecordDialog({ row, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteAttendance(row.id);
      onDeleted();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  const info = error && describeError(error);
  return (
    <Modal title="Hapus catatan kehadiran?" onClose={onClose}>
      {error && (
        <Alert tone={info.tone} title={info.title}>
          {info.hint}
        </Alert>
      )}
      <p>
        Catatan kehadiran <strong>{row.nama}</strong> pada {formatDate(row.timestamp)} akan dihapus. Gunakan hanya untuk
        memperbaiki kesalahan pencatatan.
      </p>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Batal
        </button>
        <button type="button" className="btn btn-danger" onClick={confirm} disabled={busy}>
          {busy ? "Menghapus..." : "Ya, hapus"}
        </button>
      </div>
    </Modal>
  );
}
