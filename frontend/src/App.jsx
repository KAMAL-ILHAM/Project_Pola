import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth.jsx";
import Shell from "./components/Shell.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import MahasiswaLayout from "./layouts/MahasiswaLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import DaftarPage from "./pages/DaftarPage.jsx";
import MahasiswaLoginPage from "./pages/mahasiswa/MahasiswaLoginPage.jsx";
import MahasiswaBerandaPage from "./pages/mahasiswa/MahasiswaBerandaPage.jsx";
import MahasiswaRiwayatPage from "./pages/mahasiswa/MahasiswaRiwayatPage.jsx";
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminRekapPage from "./pages/admin/AdminRekapPage.jsx";
import AdminMahasiswaPage from "./pages/admin/AdminMahasiswaPage.jsx";
import AdminPengaturanPage from "./pages/admin/AdminPengaturanPage.jsx";

function NotFound() {
  return (
    <>
      <h1>Halaman tidak ditemukan</h1>
      <p className="lead">Alamat yang Anda buka tidak ada.</p>
    </>
  );
}

/**
 * Dua area dengan alamat berbeda:
 *  - Mahasiswa : /mahasiswa/masuk (login wajah), /mahasiswa/daftar (registrasi), /mahasiswa, /mahasiswa/riwayat (wajib login)
 *  - Admin     : /admin/login, lalu /admin, /admin/rekap, /admin/mahasiswa, /admin/pengaturan (wajib login)
 * Untuk memakai subdomain terpisah di server (mis. admin.contoh.ac.id), arahkan masing-masing ke awalan path ini.
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Shell nav={[]} />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="mahasiswa" element={<MahasiswaLayout />}>
          <Route index element={<RequireAuth role="student"><MahasiswaBerandaPage /></RequireAuth>} />
          <Route path="riwayat" element={<RequireAuth role="student"><MahasiswaRiwayatPage /></RequireAuth>} />
          <Route path="masuk" element={<MahasiswaLoginPage />} />
          <Route path="daftar" element={<DaftarPage mode="student" />} />
        </Route>

        <Route element={<Shell nav={[]} badge="Admin" />}>
          <Route path="admin/login" element={<AdminLoginPage />} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="rekap" element={<AdminRekapPage />} />
          <Route path="mahasiswa" element={<AdminMahasiswaPage />} />
          <Route path="mahasiswa/tambah" element={<DaftarPage mode="admin" />} />
          <Route path="pengaturan" element={<AdminPengaturanPage />} />
        </Route>

        {/* alamat lama tetap berfungsi */}
        <Route path="daftar" element={<Navigate to="/mahasiswa/daftar" replace />} />
        <Route path="presensi" element={<Navigate to="/mahasiswa/masuk" replace />} />
        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="rekap" element={<Navigate to="/admin/rekap" replace />} />
      </Routes>
    </AuthProvider>
  );
}
