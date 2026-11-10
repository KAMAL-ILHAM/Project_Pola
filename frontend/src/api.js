/**
 * Semua pemanggilan API backend ada di file ini supaya komponen tidak perlu
 * tahu detail URL/format. Semua endpoint membalas format yang sama:
 * { success, message, data, error_code }  (lihat backend/README.md)
 *
 * Tanda "TODO-BACKEND" = endpoint/logika yang BELUM ada di backend dan harus dibuat tim backend.
 * Rangkuman lengkapnya ada di docs/TODO_BACKEND_Rama.md.
 */
import { createMockApi } from "./mock.js";
import { AUTH_EXPIRED_EVENT, clearSession, getToken } from "./authStore.js";

/** true = pakai data contoh (src/mock.js), backend tidak dipakai. Atur lewat VITE_USE_MOCK di .env */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/** Error dari API, membawa error_code supaya UI bisa menampilkan pesan yang tepat. */
export class ApiError extends Error {
  constructor(message, errorCode, status) {
    super(message);
    this.errorCode = errorCode;
    this.status = status;
  }
}

const mock = createMockApi(ApiError);

/** role: "admin" | "student" | undefined (publik). Menentukan token sesi mana yang dikirim. */
async function request(path, options = {}, role) {
  const token = role ? getToken(role) : null;
  const headers = { ...(options.headers || {}) };
  // TODO-BACKEND: endpoint khusus admin/mahasiswa harus memeriksa header ini dan menolak (401) bila token tidak valid.
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.", "NETWORK_ERROR", 0);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // respons bukan JSON, ditangani di bawah
  }

  if (!response.ok || !body || body.success === false) {
    const status = response.status;
    if (status === 401) {
      // sesi tidak berlaku lagi: bersihkan dan beri tahu aplikasi agar kembali ke halaman login
      if (token) {
        clearSession(role);
        window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { role } }));
      }
      throw new ApiError(body?.message || "Sesi berakhir atau tidak berwenang.", body?.error_code || "UNAUTHORIZED", 401);
    }
    // 404/405 tanpa format { success } = rute belum dibuat backend (bukan "data tidak ditemukan")
    if ((status === 404 || status === 405) && (!body || body.success === undefined)) {
      throw new ApiError("Fitur ini belum tersedia di server.", "NOT_IMPLEMENTED", status);
    }
    throw new ApiError(
      body?.message || `Terjadi kesalahan pada server (${status}).`,
      body?.error_code || "UNKNOWN",
      status
    );
  }
  return body;
}

/** Buang parameter kosong agar tidak ikut terkirim di query string. */
function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") q.set(key, value);
  });
  const text = q.toString();
  return text ? `?${text}` : "";
}

const json = (method, payload) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

/* ======================= MAHASISWA ======================= */

/**
 * POST /auth/face-login  (multipart: foto)  ->  data: { token, nama, nim }
 * Verifikasi wajah = login mahasiswa (tanpa sandi). TIDAK mencatat kehadiran.
 * Error: 404 "FACE_NOT_RECOGNIZED" (-> UI menampilkan "Tidak terdaftar"), 400 "NO_FACE_DETECTED".
 * TODO-BACKEND: endpoint belum ada. Gunakan match_face (ml) dengan threshold, lalu terbitkan token berumur pendek.
 * Tambahkan juga: pembatasan percobaan (rate limit) dan deteksi kehidupan/liveness agar foto/layar orang lain tidak bisa dipakai.
 */
export function faceLoginStudent(photo) {
  if (USE_MOCK) return mock.faceLoginStudent();
  const form = new FormData();
  form.append("foto", photo, "capture.jpg");
  return request("/auth/face-login", { method: "POST", body: form });
}

/**
 * GET /me/attendance  ->  data: [{ id, timestamp, status }] milik mahasiswa pada token, terbaru di atas.
 * TODO-BACKEND: endpoint belum ada. Data diambil dari identitas di token, bukan dari parameter.
 */
export function getMyAttendance() {
  if (USE_MOCK) return mock.getMyAttendance(getToken("student"));
  return request("/me/attendance", {}, "student");
}

/**
 * POST /me/attendance  ->  data: { timestamp, status, already_recorded }
 * Mencatat kehadiran hari ini untuk mahasiswa pada token (satu kali per hari).
 * TODO-BACKEND: endpoint belum ada.
 */
export function markMyAttendance() {
  if (USE_MOCK) return mock.markMyAttendance(getToken("student"));
  return request("/me/attendance", { method: "POST" }, "student");
}

/* ======================= PUBLIK ======================= */

/**
 * POST /recognize: kenali wajah lalu langsung catat kehadiran (cara lama, tanpa login).
 * Tidak dipakai lagi oleh UI sejak mahasiswa wajib login wajah.
 * TODO-BACKEND: setelah /auth/face-login dan /me/attendance siap, hapus atau batasi endpoint ini
 * (jika tetap publik, siapa pun bisa absen tanpa login).
 */
export function recognizeFace(photo) {
  if (USE_MOCK) return mock.recognizeFace();
  const form = new FormData();
  form.append("foto", photo, "capture.jpg");
  return request("/recognize", { method: "POST", body: form });
}

/** POST /register: daftar mahasiswa dengan 1-10 foto. */
export function registerStudent({ nama, nim, photos }) {
  if (USE_MOCK) return mock.registerStudent({ nama, nim, photos });
  const form = new FormData();
  form.append("nama", nama);
  form.append("nim", nim);
  photos.forEach((photo, i) => form.append("foto", photo, `foto${i + 1}.jpg`));
  return request("/register", { method: "POST", body: form });
}

/* ======================= ADMIN ======================= */

/**
 * POST /auth/login  body: { username, password }  ->  data: { token, nama }
 * TODO-BACKEND: endpoint ini belum ada. Perlu tabel admin + password ter-hash + token (JWT atau sesi).
 * Error yang diharapkan: 401 dengan error_code "INVALID_CREDENTIALS".
 */
export function loginAdmin({ username, password }) {
  if (USE_MOCK) return mock.loginAdmin({ username, password });
  return request("/auth/login", json("POST", { username, password }));
}

/**
 * GET /students
 * TODO-BACKEND: sekarang endpoint ini terbuka untuk siapa saja. Harus dibatasi hanya untuk admin (token).
 */
export function getStudents() {
  if (USE_MOCK) return mock.getStudents();
  return request("/students", {}, "admin");
}

/** PUT /students/{id}: ubah nama dan/atau NIM. TODO-BACKEND: batasi hanya admin. */
export function updateStudent(id, payload) {
  if (USE_MOCK) return mock.updateStudent(id, payload);
  return request(`/students/${id}`, json("PUT", payload), "admin");
}

/** DELETE /students/{id}: hapus mahasiswa beserta riwayat kehadirannya. TODO-BACKEND: batasi hanya admin. */
export function deleteStudent(id) {
  if (USE_MOCK) return mock.deleteStudent(id);
  return request(`/students/${id}`, { method: "DELETE" }, "admin");
}

/**
 * GET /attendance, filter opsional: tanggal (YYYY-MM-DD) dan nama.
 * TODO-BACKEND: batasi hanya admin. Tambahkan juga parameter rentang `dari` dan `sampai`
 * (saat ini halaman Rekap mengambil semua data lalu memfilter rentang di browser).
 */
export function getAttendance({ tanggal, nama } = {}) {
  if (USE_MOCK) return mock.getAttendance({ tanggal, nama });
  return request(`/attendance${toQuery({ tanggal, nama })}`, {}, "admin");
}

/** GET /attendance/summary: data kartu dan grafik dashboard. TODO-BACKEND: batasi hanya admin. */
export function getSummary({ tanggal, hari } = {}) {
  if (USE_MOCK) return mock.getSummary({ tanggal, hari });
  return request(`/attendance/summary${toQuery({ tanggal, hari })}`, {}, "admin");
}

/**
 * DELETE /attendance/{id}: hapus satu catatan kehadiran (mis. salah deteksi).
 * TODO-BACKEND: endpoint belum ada.
 */
export function deleteAttendance(id) {
  if (USE_MOCK) return mock.deleteAttendance(id);
  return request(`/attendance/${id}`, { method: "DELETE" }, "admin");
}

/**
 * GET /settings  ->  data: { threshold: number }
 * TODO-BACKEND: endpoint belum ada. Nilai threshold milik modul ml (Alliyah), perlu disepakati
 * di mana disimpan (tabel settings / file konfigurasi) dan bagaimana match_face membacanya.
 */
export function getSettings() {
  if (USE_MOCK) return mock.getSettings();
  return request("/settings", {}, "admin");
}

/** PUT /settings  body: { threshold }. TODO-BACKEND: belum ada; hanya admin; validasi rentang 0.30 - 0.80. */
export function updateSettings(payload) {
  if (USE_MOCK) return mock.updateSettings(payload);
  return request("/settings", json("PUT", payload), "admin");
}

/**
 * POST /auth/change-password  body: { password_lama, password_baru }
 * TODO-BACKEND: belum ada. Error yang diharapkan: error_code "WRONG_PASSWORD" bila password lama salah.
 */
export function changePassword({ passwordLama, passwordBaru }) {
  if (USE_MOCK) return mock.changePassword({ passwordLama, passwordBaru });
  return request("/auth/change-password", json("POST", { password_lama: passwordLama, password_baru: passwordBaru }), "admin");
}
