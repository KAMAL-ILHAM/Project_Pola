/**
 * Penyimpanan sesi di sessionStorage (hilang saat tab ditutup), terpisah per peran:
 * "admin" dan "student". Hanya menyimpan token + nama. JANGAN simpan foto wajah di sini atau di localStorage.
 */
const KEYS = { admin: "presensi_admin_session", student: "presensi_student_session" };
export const AUTH_EXPIRED_EVENT = "presensi:auth-expired";

export function getSession(role) {
  try {
    return JSON.parse(sessionStorage.getItem(KEYS[role]));
  } catch {
    return null;
  }
}
export function saveSession(role, session) {
  try {
    sessionStorage.setItem(KEYS[role], JSON.stringify(session));
  } catch {
    // penyimpanan diblokir browser: sesi hanya hidup di memori
  }
}
export function clearSession(role) {
  try {
    sessionStorage.removeItem(KEYS[role]);
  } catch {
    // diabaikan
  }
}
export const getToken = (role) => getSession(role)?.token || null;
