import { NavLink, Outlet } from "react-router-dom";
import Icon from "./Icon.jsx";

function NavItems({ nav }) {
  return (
    <ul className="nav-list">
      {nav.map((item) => (
        <li key={item.to}>
          <NavLink to={item.to} end={item.end} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            {item.icon && <Icon name={item.icon} />}
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function Brand({ badge, className = "brand" }) {
  return (
    <p className={className}>
      <span className="brand-mark">
        <Icon name="scan-face" />
      </span>
      <span className="brand-name">Presensi Wajah</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </p>
  );
}

/**
 * Kerangka halaman bersama untuk area mahasiswa dan admin.
 *  - Desktop: sidebar kiri (menu + ikon) dan konten di kanan.
 *  - Ponsel (<= 900px): sidebar berganti menjadi menu tab di bagian bawah layar.
 *  - Tanpa menu (nav kosong, mis. beranda dan login admin): hanya header sederhana.
 * nav: [{ to, label, icon?, end? }]   actions: elemen di kanan atas   badge: label kecil di samping nama aplikasi
 */
export default function Shell({ badge, nav, actions }) {
  const hasNav = nav.length > 0;
  return (
    <div className={`app ${hasNav ? "app-with-nav" : "app-plain"}`}>
      <a className="skip-link" href="#main">
        Lewati ke konten utama
      </a>

      {hasNav && (
        <aside className="sidebar">
          <Brand badge={badge} />
          <nav aria-label="Menu utama">
            <p className="nav-heading">Menu</p>
            <NavItems nav={nav} />
          </nav>
          <p className="sidebar-foot">Pengenalan Pola - Kelompok 7</p>
        </aside>
      )}

      <div className="content">
        <header className="topbar">
          <Brand badge={badge} className="brand brand-top" />
          <div className="topbar-actions">{actions}</div>
        </header>
        <main id="main" className="main">
          <Outlet />
        </main>
        {!hasNav && <footer className="footer">Pengenalan Pola - Kelompok 7</footer>}
      </div>

      {hasNav && (
        <nav className="bottom-nav" aria-label="Menu utama (ponsel)">
          <NavItems nav={nav} />
        </nav>
      )}
    </div>
  );
}
