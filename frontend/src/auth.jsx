import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { faceLoginStudent, loginAdmin as apiLoginAdmin } from "./api.js";
import { AUTH_EXPIRED_EVENT, clearSession, getSession, saveSession } from "./authStore.js";

const AuthContext = createContext(null);

/**
 * Menyimpan dua sesi terpisah:
 *  - admin   : login username + password
 *  - student : login verifikasi wajah (tanpa sandi)
 */
export function AuthProvider({ children }) {
  const [sessions, setSessions] = useState(() => ({ admin: getSession("admin"), student: getSession("student") }));

  // api.js memicu event ini saat server membalas 401 (token kedaluwarsa/tidak valid)
  useEffect(() => {
    const onExpired = (e) => {
      const role = e.detail?.role;
      if (role) setSessions((s) => ({ ...s, [role]: null }));
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const loginAdmin = useCallback(async ({ username, password }) => {
    const res = await apiLoginAdmin({ username, password });
    const next = { token: res.data.token, nama: res.data.nama || username };
    saveSession("admin", next);
    setSessions((s) => ({ ...s, admin: next }));
  }, []);

  /** Login mahasiswa: kirim foto wajah; jika terverifikasi, sesi dibuat tanpa sandi. */
  const loginStudent = useCallback(async (photo) => {
    const res = await faceLoginStudent(photo);
    const next = { token: res.data.token, nama: res.data.nama, nim: res.data.nim };
    saveSession("student", next);
    setSessions((s) => ({ ...s, student: next }));
  }, []);

  const logout = useCallback((role) => {
    // TODO-BACKEND (opsional): panggil POST /auth/logout agar token dicabut di server.
    clearSession(role);
    setSessions((s) => ({ ...s, [role]: null }));
  }, []);

  const value = useMemo(
    () => ({ admin: sessions.admin, student: sessions.student, loginAdmin, loginStudent, logout }),
    [sessions, loginAdmin, loginStudent, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

const LOGIN_PATH = { admin: "/admin/login", student: "/mahasiswa/masuk" };

/**
 * Pelindung rute: bila belum login untuk peran tersebut, arahkan ke halaman login perannya.
 * PENTING: ini hanya mengatur tampilan. Keamanan sebenarnya harus ditegakkan backend
 * (setiap endpoint wajib memeriksa token), karena kode frontend bisa dilewati.
 */
export function RequireAuth({ role, children }) {
  const session = useAuth()[role];
  const location = useLocation();
  if (!session) return <Navigate to={LOGIN_PATH[role]} replace state={{ from: location.pathname }} />;
  return children;
}
