import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Shell from "../components/Shell.jsx";
import { useAuth } from "../auth.jsx";

const IDLE_MS = 5 * 60 * 1000; // keluar otomatis setelah 5 menit tanpa aktivitas (komputer bersama)

const NAV_LOGGED_IN = [
  { to: "/mahasiswa", label: "Beranda", icon: "home", end: true },
  { to: "/mahasiswa/riwayat", label: "Riwayat", icon: "history" },
];
const NAV_GUEST = [
  { to: "/mahasiswa/masuk", label: "Masuk Wajah", icon: "scan-face" },
  { to: "/mahasiswa/daftar", label: "Registrasi Wajah", icon: "user-plus" },
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
            <span className="user-chip">
              <Icon name="user" />
              <span className="user-chip-name">{student.nama}</span>
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout} aria-label="Keluar">
              <Icon name="log-out" />
              <span className="btn-label">Keluar</span>
            </button>
          </>
        )
      }
    />
  );
}
