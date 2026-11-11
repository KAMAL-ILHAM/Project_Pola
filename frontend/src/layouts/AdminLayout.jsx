import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Shell from "../components/Shell.jsx";
import { RequireAuth, useAuth } from "../auth.jsx";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "layout-grid", end: true },
  { to: "/admin/rekap", label: "Rekap", icon: "calendar-check" },
  { to: "/admin/mahasiswa", label: "Mahasiswa", icon: "users" },
  { to: "/admin/pengaturan", label: "Pengaturan", icon: "sliders" },
];

/** Layout area admin (/admin/...): seluruh halaman di dalamnya dilindungi login admin. */
export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout("admin");
    navigate("/admin/login", { replace: true });
  }

  return (
    <RequireAuth role="admin">
      <Shell
        badge="Admin"
        nav={NAV}
        actions={
          <>
            <span className="user-chip">
              <Icon name="user" />
              <span className="user-chip-name">{admin?.nama}</span>
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout} aria-label="Keluar">
              <Icon name="log-out" />
              <span className="btn-label">Keluar</span>
            </button>
          </>
        }
      />
    </RequireAuth>
  );
}
