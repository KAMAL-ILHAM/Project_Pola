import { Link } from "react-router-dom";
import Shell from "../components/Shell.jsx";

const NAV = [
  { to: "/", label: "Beranda", end: true },
  { to: "/daftar", label: "Registrasi Wajah" },
  { to: "/presensi", label: "Absensi" },
];

/** Layout area mahasiswa (publik, tanpa login). */
export default function StudentLayout() {
  return (
    <Shell
      nav={NAV}
      actions={
        <Link to="/admin" className="btn btn-secondary btn-sm">
          Masuk Admin
        </Link>
      }
    />
  );
}
