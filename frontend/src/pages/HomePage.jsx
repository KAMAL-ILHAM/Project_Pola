import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";

/** Pintu masuk: memisahkan alamat mahasiswa (/mahasiswa) dan admin (/admin). */
export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <h1 className="home-title">Presensi Wajah</h1>
        <p className="lead">Sistem pencatatan kehadiran berbasis pengenalan wajah. Pilih peran Anda untuk melanjutkan.</p>
      </section>

      <div className="role-grid">
        <section className="role-card role-card-cream" aria-labelledby="role-mhs">
          <span className="role-icon">
            <Icon name="scan-face" />
          </span>
          <h2 id="role-mhs">Mahasiswa</h2>
          <ol className="steps">
            <li>Daftarkan wajah Anda sekali saja (3 foto dari sudut berbeda).</li>
            <li>Masuk dengan verifikasi wajah, tanpa sandi.</li>
            <li>Absen dan lihat riwayat kehadiran Anda sendiri.</li>
          </ol>
          <div className="role-actions">
            <Link to="/mahasiswa/masuk" className="btn btn-primary btn-lg">
              <Icon name="scan-face" />
              Masuk dengan Wajah
            </Link>
            <Link to="/mahasiswa/daftar" className="btn btn-secondary btn-lg">
              <Icon name="user-plus" />
              Registrasi Wajah
            </Link>
          </div>
        </section>

        <section className="role-card role-card-dark" aria-labelledby="role-admin">
          <span className="role-icon">
            <Icon name="shield" />
          </span>
          <h2 id="role-admin">Admin</h2>
          <ol className="steps">
            <li>Masuk dengan username dan password.</li>
            <li>Kelola data mahasiswa, pantau dan rekap kehadiran.</li>
            <li>Ekspor CSV dan atur sistem.</li>
          </ol>
          <div className="role-actions">
            <Link to="/admin" className="btn btn-primary btn-lg">
              Masuk sebagai Admin
              <Icon name="arrow-right" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
