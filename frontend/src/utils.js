import { useEffect, useState } from "react";

const pad = (n) => String(n).padStart(2, "0");

/** Tanggal hari ini (zona waktu lokal) dalam format YYYY-MM-DD. */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Ubah "YYYY-MM-DD" menjadi Date lokal (new Date("YYYY-MM-DD") akan dibaca UTC, bisa meleset sehari). */
export function parseLocalDate(text) {
  const [y, m, d] = text.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Timestamp dari backend tidak punya zona waktu; pecahan detik dibuang agar aman di semua browser. */
function parseTimestamp(iso) {
  return new Date(String(iso).replace(/\.\d+/, ""));
}

export function formatTime(iso) {
  return parseTimestamp(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Jam dan menit saja, contoh "20.11" (untuk kalimat seperti "pada jam 20.11"). */
export function formatHourMinute(iso) {
  return parseTimestamp(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? parseLocalDate(iso) : parseTimestamp(iso);
  return date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Label pendek untuk sumbu grafik, contoh "09/11". */
export function formatShortDate(text) {
  const d = parseLocalDate(text);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** Hook: nilai baru baru dipakai setelah pengguna berhenti mengetik (menghindari request tiap huruf). */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/**
 * Pesan ramah untuk tiap error_code dari backend.
 * tone: warning = bisa dicoba lagi, danger = ada masalah, info = hanya informasi.
 */
const ERROR_INFO = {
  NO_FACE_DETECTED: {
    tone: "warning",
    title: "Wajah tidak terdeteksi",
    hint: "Hadapkan wajah ke kamera, pastikan cahaya cukup dan wajah tidak tertutup, lalu coba lagi.",
  },
  MULTIPLE_FACES: {
    tone: "warning",
    title: "Terdeteksi lebih dari satu wajah",
    hint: "Pastikan hanya satu orang yang berada di depan kamera.",
  },
  FACE_NOT_RECOGNIZED: {
    tone: "danger",
    title: "Wajah tidak dikenali",
    hint: "Wajah belum terdaftar atau gambar kurang jelas. Coba lagi, atau minta admin mendaftarkan wajah Anda.",
  },
  NETWORK_ERROR: {
    tone: "danger",
    title: "Server tidak dapat dihubungi",
    hint: "Periksa koneksi dan pastikan backend sudah dijalankan.",
  },
  INVALID_IMAGE: { tone: "danger", title: "Gambar tidak valid", hint: "Gunakan foto berformat JPEG atau PNG." },
  IMAGE_TOO_LARGE: { tone: "danger", title: "Ukuran gambar terlalu besar", hint: "Ukuran maksimal 5 MB per foto." },
  NIM_ALREADY_REGISTERED: { tone: "warning", title: "NIM sudah terdaftar", hint: "Periksa kembali NIM, atau cari datanya di halaman Mahasiswa." },
  TOO_MANY_PHOTOS: { tone: "warning", title: "Terlalu banyak foto", hint: "Maksimal 10 foto per pendaftaran." },
  INVALID_INPUT: { tone: "warning", title: "Data belum benar", hint: "Periksa kembali isian formulir." },
  NOT_IMPLEMENTED: { tone: "info", title: "Fitur belum tersedia", hint: "Bagian ini masih menunggu backend. Hubungi tim backend (Rizky)." },
  UNAUTHORIZED: { tone: "warning", title: "Sesi berakhir", hint: "Silakan masuk kembali." },
  INVALID_CREDENTIALS: { tone: "danger", title: "Username atau password salah", hint: "Periksa kembali lalu coba lagi." },
  WRONG_PASSWORD: { tone: "danger", title: "Password lama salah", hint: "Masukkan password admin yang sedang dipakai." },
  STUDENT_NOT_FOUND: { tone: "danger", title: "Data mahasiswa tidak ditemukan", hint: "Muat ulang halaman lalu coba lagi." },
};

/** Ubah error apa pun menjadi { tone, title, hint } yang siap ditampilkan. */
export function describeError(error) {
  const info = ERROR_INFO[error?.errorCode];
  if (info) return info;
  return {
    tone: "danger",
    title: "Terjadi kesalahan",
    hint: error?.message || "Silakan coba lagi.",
  };
}

/**
 * Unduh baris kehadiran (data dari GET /attendance) sebagai file CSV.
 * - BOM (\ufeff) di awal agar Excel membaca UTF-8 dengan benar.
 * - Tanda kutip digandakan agar nama yang mengandung koma/kutip tidak merusak kolom.
 * - NIM diberi awalan ' supaya Excel tidak mengubahnya jadi notasi ilmiah (2.41E+12).
 */
export function downloadAttendanceCSV(rows, filename = "rekap_kehadiran.csv") {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["No", "Nama", "NIM", "Tanggal", "Waktu", "Status"];
  const lines = rows.map((r, i) =>
    [i + 1, r.nama, `'${r.nim}`, String(r.timestamp).slice(0, 10), String(r.timestamp).slice(11, 19), r.status].map(esc).join(",")
  );
  const csv = "\ufeff" + [header.map(esc).join(","), ...lines].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Tambah (atau kurangi, jika negatif) hari pada tanggal "YYYY-MM-DD", hasilnya "YYYY-MM-DD" (waktu lokal). */
export function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
