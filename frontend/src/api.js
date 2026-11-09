/**
 * Semua pemanggilan API backend ada di file ini supaya komponen tidak perlu
 * tahu detail URL/format. Semua endpoint membalas format yang sama:
 * { success, message, data, error_code }  (lihat backend/README.md)
 */

// URL API dibaca dari .env (VITE_API_URL). Nilai cadangan hanya untuk kemudahan saat development lokal.
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/** Error dari API, membawa error_code supaya UI bisa menampilkan pesan yang tepat. */
export class ApiError extends Error {
  constructor(message, errorCode, status) {
    super(message);
    this.errorCode = errorCode;
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
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
    throw new ApiError(
      body?.message || `Terjadi kesalahan pada server (${response.status}).`,
      body?.error_code || "UNKNOWN",
      response.status
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

/** POST /recognize: kirim satu foto (Blob), balikan data kehadiran. */
export function recognizeFace(photo) {
  const form = new FormData();
  form.append("foto", photo, "capture.jpg");
  return request("/recognize", { method: "POST", body: form });
}

/** POST /register: daftar mahasiswa dengan 1-10 foto. */
export function registerStudent({ nama, nim, photos }) {
  const form = new FormData();
  form.append("nama", nama);
  form.append("nim", nim);
  photos.forEach((photo, i) => form.append("foto", photo, `foto${i + 1}.jpg`));
  return request("/register", { method: "POST", body: form });
}

/** GET /students */
export function getStudents() {
  return request("/students");
}

/** PUT /students/{id}: ubah nama dan/atau NIM. */
export function updateStudent(id, payload) {
  return request(`/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** DELETE /students/{id}: hapus mahasiswa beserta riwayat kehadirannya. */
export function deleteStudent(id) {
  return request(`/students/${id}`, { method: "DELETE" });
}

/** GET /attendance, filter opsional: tanggal (YYYY-MM-DD) dan nama. */
export function getAttendance({ tanggal, nama } = {}) {
  return request(`/attendance${toQuery({ tanggal, nama })}`);
}

/** GET /attendance/summary: data kartu dan grafik dashboard. */
export function getSummary({ tanggal, hari } = {}) {
  return request(`/attendance/summary${toQuery({ tanggal, hari })}`);
}
