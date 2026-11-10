import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CameraView from "../components/CameraView.jsx";
import BackendTodo from "../components/BackendTodo.jsx";
import Alert from "../components/Alert.jsx";
import { registerStudent } from "../api.js";

const MAX_PHOTOS = 10; // sesuai batas backend
const MIN_PHOTOS = 3; // depan, sedikit kiri, sedikit kanan

/** mode: "student" (publik, mahasiswa mendaftar sendiri) atau "admin" (admin menambah mahasiswa). */
export default function DaftarPage({ mode = "student" }) {
  const cameraRef = useRef(null);
  const nextId = useRef(1);

  const [cameraStatus, setCameraStatus] = useState("loading");
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [photos, setPhotos] = useState([]); // { id, blob, url }
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // lepas URL pratinjau saat halaman ditutup agar memori tidak bocor
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  function addPhoto(blob) {
    setPhotos((prev) => {
      if (prev.length >= MAX_PHOTOS) return prev;
      return [...prev, { id: nextId.current++, blob, url: URL.createObjectURL(blob) }];
    });
  }

  async function takePhoto() {
    try {
      addPhoto(await cameraRef.current.capture());
      setFieldErrors((f) => ({ ...f, photos: undefined }));
    } catch (err) {
      setError(err);
    }
  }

  function onUpload(e) {
    Array.from(e.target.files).forEach(addPhoto);
    e.target.value = ""; // agar file yang sama bisa dipilih lagi
  }

  function removePhoto(id) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  function validate() {
    const errors = {};
    if (!nama.trim()) errors.nama = "Nama wajib diisi.";
    if (!/^\d{5,20}$/.test(nim.trim())) errors.nim = "NIM harus berupa angka, 5 sampai 20 digit.";
    if (photos.length < MIN_PHOTOS) errors.photos = `Ambil minimal ${MIN_PHOTOS} foto wajah (sekarang ${photos.length}).`;
    if (!consent) errors.consent = "Persetujuan pemilik wajah wajib dicentang.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await registerStudent({ nama: nama.trim(), nim: nim.trim(), photos: photos.map((p) => p.blob) });
      setSuccess(res.data);
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
      setNama("");
      setNim("");
      setConsent(false);
    } catch (err) {
      setError(err); // pesan backend sudah menyebut foto ke berapa yang bermasalah
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>{mode === "admin" ? "Tambah Mahasiswa" : "Registrasi Wajah"}</h1>
      <p className="lead">Isi data mahasiswa lalu ambil beberapa foto wajah dari sudut berbeda agar pengenalan lebih akurat.</p>
      {mode === "student" && (
        <BackendTodo>
          Pendaftaran mandiri belum memverifikasi identitas: siapa pun bisa mendaftar dengan NIM orang lain. Putuskan bersama
          tim: validasi NIM ke data akademik, atau status pendaftaran &quot;menunggu persetujuan admin&quot; (perlu field status
          di tabel students dan endpoint approve).
        </BackendTodo>
      )}

      {success && (
        <Alert tone="success" title="Pendaftaran berhasil">
          {success.nama} ({success.nim}) terdaftar dengan {success.jumlah_foto} foto. {mode === "admin" ? (
            <Link to="/admin/mahasiswa">Kembali ke daftar mahasiswa</Link>
          ) : (
            <Link to="/mahasiswa/masuk" className="btn btn-primary btn-sm">
              Lanjut: masuk dengan wajah
            </Link>
          )}
        </Alert>
      )}
      {error && (
        <Alert tone="danger" title="Pendaftaran gagal">
          {error.message}
        </Alert>
      )}

      <form className="grid-2" onSubmit={submit} noValidate>
        <section className="card">
          <h2>Data mahasiswa</h2>
          <div className="field">
            <label htmlFor="nama">Nama lengkap</label>
            <input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} maxLength={100} autoComplete="off" aria-invalid={!!fieldErrors.nama} aria-describedby={fieldErrors.nama ? "nama-err" : undefined} />
            {fieldErrors.nama && (
              <p id="nama-err" className="field-error">
                {fieldErrors.nama}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="nim">NIM</label>
            <input id="nim" value={nim} onChange={(e) => setNim(e.target.value)} inputMode="numeric" autoComplete="off" aria-invalid={!!fieldErrors.nim} aria-describedby={fieldErrors.nim ? "nim-err" : undefined} />
            {fieldErrors.nim && (
              <p id="nim-err" className="field-error">
                {fieldErrors.nim}
              </p>
            )}
          </div>

          <div className="field">
            <label className="check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-describedby={fieldErrors.consent ? "consent-err" : undefined} />
              <span>Pemilik wajah menyetujui foto wajahnya diproses untuk keperluan presensi.</span>
            </label>
            {fieldErrors.consent && (
              <p id="consent-err" className="field-error">
                {fieldErrors.consent}
              </p>
            )}
            <p className="muted">Foto tidak disimpan; hanya data numerik (encoding) wajah yang disimpan, dan dapat dihapus kapan saja dari halaman Mahasiswa.</p>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? "Mendaftarkan..." : "Daftarkan"}
          </button>
        </section>

        <section className="card" aria-label="Pengambilan foto">
          <h2>
            Foto wajah ({photos.length}/{MAX_PHOTOS})
          </h2>
          <CameraView ref={cameraRef} onStatusChange={setCameraStatus} />
          <div className="controls">
            <button type="button" className="btn btn-secondary" onClick={takePhoto} disabled={cameraStatus !== "ready" || photos.length >= MAX_PHOTOS}>
              Ambil foto
            </button>
            <label className="btn btn-secondary file-btn">
              Unggah dari berkas
              <input type="file" accept="image/jpeg,image/png" multiple onChange={onUpload} disabled={photos.length >= MAX_PHOTOS} />
            </label>
          </div>
          <p className="muted">
            Minimal {MIN_PHOTOS} foto: menghadap depan, sedikit menoleh kiri, dan sedikit menoleh kanan, dengan cahaya cukup. Satu wajah per foto.
          </p>
          {fieldErrors.photos && <p className="field-error">{fieldErrors.photos}</p>}

          {photos.length > 0 && (
            <ul className="thumbs">
              {photos.map((p, i) => (
                <li key={p.id}>
                  <img src={p.url} alt={`Foto ${i + 1}`} />
                  <button type="button" className="thumb-remove" onClick={() => removePhoto(p.id)} aria-label={`Hapus foto ${i + 1}`}>
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </form>
    </>
  );
}
