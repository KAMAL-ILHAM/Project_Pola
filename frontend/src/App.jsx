import { NavLink, Route, Routes } from "react-router-dom";
import PresensiPage from "./pages/PresensiPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MahasiswaPage from "./pages/MahasiswaPage.jsx";
import DaftarPage from "./pages/DaftarPage.jsx";

const NAV = [
  { to: "/", label: "Presensi", end: true },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/mahasiswa", label: "Mahasiswa" },
  { to: "/daftar", label: "Daftar Wajah" },
];

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Lewati ke konten utama
      </a>
      <header className="navbar">
        <div className="container navbar-inner">
          <p className="brand">Presensi Wajah</p>
          <nav aria-label="Menu utama">
            <ul className="nav-list">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="container main">
        <Routes>
          <Route path="/" element={<PresensiPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/mahasiswa" element={<MahasiswaPage />} />
          <Route path="/daftar" element={<DaftarPage />} />
          <Route path="*" element={<p className="empty">Halaman tidak ditemukan.</p>} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container">Pengenalan Pola, Kelompok 7. Data wajah hanya diproses dengan persetujuan pemiliknya.</div>
      </footer>
    </>
  );
}
