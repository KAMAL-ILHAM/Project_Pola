import { Link } from "react-router-dom";

/** Pintu masuk: memisahkan alamat mahasiswa (/mahasiswa) dan admin (/admin). */
export default function HomePage() {
  return (
    <>
      <h1>Presensi Wajah</h1>
      <p className="lead">Sistem pencatatan kehadiran berbasis pengenalan wajah. Pilih peran Anda untuk melanjutkan.</p>

      <div className="role-grid">
        <section className="card role-card" aria-labelledby="role-mhs">
          <h2 id="role-mhs">Mahasiswa</h2>
          <ol className="steps">
            <li>Daftarkan wajah Anda sekali saja (3 foto dari sudut berbeda).</li>
            <li>Masuk dengan verifikasi wajah, tanpa sandi.</li>
            <li>Absen dan lihat riwayat kehadiran Anda sendiri.</li>
          </ol>
          <div className="role-actions">
            <Link to="/mahasiswa/masuk" className="btn btn-primary btn-lg">
              Masuk dengan Wajah
            </Link>
            <Link to="/mahasiswa/daftar" className="btn btn-secondary btn-lg">
              Registrasi Wajah
            </Link>
          </div>
        </section>

        <section className="card role-card" aria-labelledby="role-admin">
          <h2 id="role-admin">Admin</h2>
          <ol className="steps">
            <li>Masuk dengan username dan password.</li>
            <li>Kelola data mahasiswa, pantau dan rekap kehadiran.</li>
            <li>Ekspor CSV dan atur sistem.</li>
          </ol>
          <div className="role-actions">
            <Link to="/admin" className="btn btn-primary btn-lg">
              Masuk sebagai Admin
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
