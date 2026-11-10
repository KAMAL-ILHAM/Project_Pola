import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import Modal from "../../components/Modal.jsx";
import Spinner from "../../components/Spinner.jsx";
import { deleteStudent, getAttendance, getStudents, updateStudent } from "../../api.js";
import BackendTodo from "../../components/BackendTodo.jsx";
import { describeError, todayISO } from "../../utils.js";

/** Admin: kelola data mahasiswa terdaftar (lihat, cari, tambah, ubah, hapus). */
export default function AdminMahasiswaPage() {
  const [students, setStudents] = useState([]);
  const [presentIds, setPresentIds] = useState(new Set()); // id mahasiswa yang sudah hadir hari ini
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // mahasiswa yang sedang diedit
  const [deleting, setDeleting] = useState(null); // mahasiswa yang akan dihapus

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, today] = await Promise.all([
        getStudents(),
        getAttendance({ tanggal: todayISO() }).catch(() => ({ data: [] })), // pelengkap; gagal tidak mengganggu daftar
      ]);
      setStudents(res.data);
      setPresentIds(new Set(today.data.map((a) => a.nim)));
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

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? students.filter((s) => s.nama.toLowerCase().includes(q) || s.nim.includes(q)) : students;
  }, [students, query]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mahasiswa</h1>
          <p className="lead">Kelola data mahasiswa yang wajahnya sudah terdaftar.</p>
        </div>
        <Link to="/admin/mahasiswa/tambah" className="btn btn-primary">
          Tambah mahasiswa
        </Link>
      </div>

      <BackendTodo>
        GET/PUT/DELETE /students harus dilindungi token admin. Tambahkan juga field created_at (tanggal pendaftaran) pada
        data mahasiswa agar admin bisa melihat kapan mahasiswa mendaftar dan agar daftar &quot;belum hadir&quot; di hari lampau
        tidak menghitung mahasiswa yang belum terdaftar saat itu.
      </BackendTodo>

      {notice && (
        <Alert tone="success">
          {notice}
        </Alert>
      )}
      {error && (
        <Alert tone={describeError(error).tone} title={describeError(error).title}>
          {describeError(error).hint}
        </Alert>
      )}

      <section className="card">
        <div className="card-head">
          <h2>{students.length} mahasiswa terdaftar</h2>
          <label className="field-inline">
            <span className="sr-only">Cari nama atau NIM</span>
            <input type="search" placeholder="Cari nama atau NIM..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        {loading && students.length === 0 ? (
          <Spinner />
        ) : shown.length === 0 ? (
          <p className="empty">{query ? "Tidak ada hasil untuk pencarian ini." : "Belum ada mahasiswa terdaftar."}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Daftar mahasiswa terdaftar</caption>
              <thead>
                <tr>
                  <th scope="col">Nama</th>
                  <th scope="col">NIM</th>
                  <th scope="col">Jumlah foto</th>
                  <th scope="col">Hari ini</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.id}>
                    <td>{s.nama}</td>
                    <td>{s.nim}</td>
                    <td>{s.jumlah_foto}</td>
                    <td>
                      {presentIds.has(s.nim) ? <span className="badge badge-success">Hadir</span> : <span className="badge badge-warning">Belum hadir</span>}
                    </td>
                    <td className="actions">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(s)} aria-label={`Ubah data ${s.nama}`}>
                        Ubah
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleting(s)} aria-label={`Hapus ${s.nama}`}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <EditDialog
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={(name) => {
            setEditing(null);
            setNotice(`Data ${name} berhasil diperbarui.`);
            load();
          }}
        />
      )}
      {deleting && (
        <DeleteDialog
          student={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(name) => {
            setDeleting(null);
            setNotice(`${name} berhasil dihapus.`);
            load();
          }}
        />
      )}
    </>
  );
}

/** Dialog ubah nama/NIM. */
function EditDialog({ student, onClose, onSaved }) {
  const [nama, setNama] = useState(student.nama);
  const [nim, setNim] = useState(student.nim);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await updateStudent(student.id, { nama: nama.trim(), nim: nim.trim() });
      onSaved(res.data.nama);
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  return (
    <Modal title="Ubah data mahasiswa" onClose={onClose}>
      <form onSubmit={submit}>
        {error && (
          <Alert tone={describeError(error).tone} title={describeError(error).title}>
            {describeError(error).hint}
          </Alert>
        )}
        <div className="field">
          <label htmlFor="edit-nama">Nama</label>
          <input id="edit-nama" value={nama} onChange={(e) => setNama(e.target.value)} required maxLength={100} />
        </div>
        <div className="field">
          <label htmlFor="edit-nim">NIM</label>
          <input id="edit-nim" value={nim} onChange={(e) => setNim(e.target.value)} required inputMode="numeric" pattern="\d{5,20}" title="NIM berupa angka, 5 sampai 20 digit" />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Dialog konfirmasi hapus. Backend ikut menghapus data wajah dan riwayat kehadiran. */
function DeleteDialog({ student, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteStudent(student.id);
      onDeleted(student.nama);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <Modal title="Hapus mahasiswa?" onClose={onClose}>
      {error && (
        <Alert tone={describeError(error).tone} title={describeError(error).title}>
          {describeError(error).hint}
        </Alert>
      )}
      <p>
        Data wajah dan seluruh riwayat kehadiran <strong>{student.nama}</strong> ({student.nim}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
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
