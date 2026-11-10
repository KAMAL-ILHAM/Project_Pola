import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell from "../components/Shell.jsx";
import { useAuth } from "../auth.jsx";

const IDLE_MS = 5 * 60 * 1000; // keluar otomatis setelah 5 menit tanpa aktivitas (komputer bersama)

const NAV_LOGGED_IN = [
  { to: "/mahasiswa", label: "Beranda", end: true },
  { to: "/mahasiswa/riwayat", label: "Riwayat" },
];
const NAV_GUEST = [
  { to: "/mahasiswa/masuk", label: "Masuk dengan Wajah" },
  { to: "/mahasiswa/daftar", label: "Registrasi Wajah" },
];

/** Layout area mahasiswa (/mahasiswa/...). Menu berubah sesuai status login. */
export default function MahasiswaLayout() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();

  // Logout otomatis bila tidak ada aktivitas, supaya sesi tidak tertinggal di komputer bersama
  useEffect(() => {
    if (!student) return undefined;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout("student");
        navigate("/mahasiswa/masuk", { replace: true, state: { expired: true } });
      }, IDLE_MS);
    };
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [student, logout, navigate]);

  function handleLogout() {
    logout("student");
    navigate("/mahasiswa/masuk", { replace: true });
  }

  return (
    <Shell
      nav={student ? NAV_LOGGED_IN : NAV_GUEST}
      actions={
        student && (
          <>
            <span className="navbar-user">{student.nama}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Keluar
            </button>
          </>
        )
      }
    />
  );
}
