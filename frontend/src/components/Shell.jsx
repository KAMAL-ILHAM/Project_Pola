import { NavLink, Outlet } from "react-router-dom";

/**
 * Kerangka halaman bersama (header, menu, footer). Dipakai layout mahasiswa dan admin
 * supaya tampilan konsisten; hanya isi menu dan tombol di kanan yang berbeda.
 * nav: [{ to, label, end? }]   actions: elemen di sisi kanan header   badge: label kecil di samping nama aplikasi
 */
export default function Shell({ badge, nav, actions }) {
  return (
    <>
      <a className="skip-link" href="#main">
        Lewati ke konten utama
      </a>
      <header className="navbar">
        <div className="container navbar-inner">
          <p className="brand">
            Presensi Wajah
            {badge && <span className="nav-badge">{badge}</span>}
          </p>
          <nav aria-label="Menu utama">
            <ul className="nav-list">
              {nav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {actions && <div className="navbar-actions">{actions}</div>}
        </div>
      </header>
      <main id="main" className="container main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container">Pengenalan Pola - Kelompok 7</div>
      </footer>
    </>
  );
}
