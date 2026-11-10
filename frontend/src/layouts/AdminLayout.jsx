import { useNavigate } from "react-router-dom";
import Shell from "../components/Shell.jsx";
import { RequireAuth, useAuth } from "../auth.jsx";

const NAV = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/rekap", label: "Rekap" },
  { to: "/admin/mahasiswa", label: "Mahasiswa" },
  { to: "/admin/pengaturan", label: "Pengaturan" },
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
            <span className="navbar-user">{admin?.nama}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Keluar
            </button>
          </>
        }
      />
    </RequireAuth>
  );
}
