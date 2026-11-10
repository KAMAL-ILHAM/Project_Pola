/**
 * Data contoh (mock) supaya frontend bisa dikerjakan saat backend belum siap.
 * Aktifkan dengan VITE_USE_MOCK=true di frontend/.env. Format respons sama dengan backend:
 * { success, message, data, error_code }. Data hanya di memori (hilang saat refresh).
 * Akun admin MOCK: username "admin", password "admin123" (hanya untuk mock, bukan akun sungguhan).
 */
const pad = (n) => String(n).padStart(2, "0");
const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const stamp = (daysAgo, h, m) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${dateStr(d)}T${pad(h)}:${pad(m)}:00`;
};
const wait = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const ok = (message, data) => ({ success: true, message, data, error_code: null });

export function createMockApi(ApiError) {
  let students = [
    { id: 1, nama: "Budi Santoso", nim: "2411102441001", jumlah_foto: 3 },
    { id: 2, nama: "Siti Aisyah", nim: "2411102441002", jumlah_foto: 4 },
    { id: 3, nama: "Andi Pratama", nim: "2411102441003", jumlah_foto: 3 },
    { id: 4, nama: "Dewi Lestari", nim: "2411102441004", jumlah_foto: 5 },
    { id: 5, nama: "Rizal Fauzi", nim: "2411102441005", jumlah_foto: 3 },
  ];
  let nextStudentId = 6;
  let nextAttId = 1;
  let attendance = [];
  // riwayat 14 hari terakhir; sebagian mahasiswa sengaja tidak hadir agar daftar "belum hadir" terisi
  for (let d = 13; d >= 0; d--) {
    students.forEach((s, i) => {
      if ((d + i) % 3 !== 2) {
        attendance.push({ id: nextAttId++, student_id: s.id, timestamp: stamp(d, 7, 40 + i * 3), status: "hadir" });
      }
    });
  }
  let settings = { threshold: 0.5 };
  let adminPassword = "admin123";

  const withStudent = (a) => {
    const s = students.find((x) => x.id === a.student_id);
    return { ...a, nama: s.nama, nim: s.nim };
  };
  const fail = (status, code, message) => new ApiError(message, code, status);

  return {
    async loginAdmin({ username, password }) {
      await wait(500);
      if (username !== "admin" || password !== adminPassword) {
        throw fail(401, "INVALID_CREDENTIALS", "Username atau password salah.");
      }
      return ok("Login berhasil", { token: "mock-token", nama: "Administrator" });
    },

    async changePassword({ passwordLama, passwordBaru }) {
      await wait(500);
      if (passwordLama !== adminPassword) throw fail(400, "WRONG_PASSWORD", "Password lama salah.");
      adminPassword = passwordBaru;
      return ok("Password diperbarui", null);
    },

    async getSettings() {
      await wait(300);
      return ok("Pengaturan", { ...settings });
    },

    async updateSettings(payload) {
      await wait(400);
      settings = { ...settings, ...payload };
      return ok("Pengaturan disimpan", { ...settings });
    },

    /** Login wajah (mock): ~1 dari 5 percobaan "tidak dikenali" untuk menguji tampilan "Tidak terdaftar". */
    async faceLoginStudent() {
      await wait(900);
      if (students.length === 0 || Math.random() < 0.2) {
        throw fail(404, "FACE_NOT_RECOGNIZED", "Wajah tidak dikenali.");
      }
      const s = students[Math.floor(Math.random() * students.length)];
      return ok("Verifikasi wajah berhasil", { token: `mock-student-${s.id}`, nama: s.nama, nim: s.nim });
    },

    async getMyAttendance(token) {
      await wait();
      const id = Number(String(token || "").replace("mock-student-", ""));
      if (!students.some((s) => s.id === id)) throw fail(401, "UNAUTHORIZED", "Sesi tidak valid.");
      const rows = attendance
        .filter((a) => a.student_id === id)
        .map(({ id: rid, timestamp, status }) => ({ id: rid, timestamp, status }))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return ok(`${rows.length} catatan kehadiran`, rows);
    },

    async markMyAttendance(token) {
      await wait(600);
      const id = Number(String(token || "").replace("mock-student-", ""));
      if (!students.some((s) => s.id === id)) throw fail(401, "UNAUTHORIZED", "Sesi tidak valid.");
      const today = dateStr(new Date());
      const existing = attendance.find((a) => a.student_id === id && a.timestamp.startsWith(today));
      let record = existing;
      if (!record) {
        const now = new Date();
        record = {
          id: nextAttId++,
          student_id: id,
          timestamp: `${today}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
          status: "hadir",
        };
        attendance.push(record);
      }
      return ok(existing ? "Sudah absen hari ini" : "Kehadiran dicatat", {
        timestamp: record.timestamp,
        status: record.status,
        already_recorded: !!existing,
      });
    },

    async getStudents() {
      await wait();
      return ok(`${students.length} mahasiswa terdaftar`, students.map((s) => ({ ...s })));
    },

    async registerStudent({ nama, nim, photos }) {
      await wait(800);
      if (students.some((s) => s.nim === nim)) throw fail(409, "NIM_ALREADY_REGISTERED", "NIM sudah terdaftar.");
      const s = { id: nextStudentId++, nama, nim, jumlah_foto: photos.length };
      students.push(s);
      return ok(`Pendaftaran berhasil (${photos.length} foto)`, { ...s });
    },

    async updateStudent(id, payload) {
      await wait();
      const s = students.find((x) => x.id === id);
      if (!s) throw fail(404, "STUDENT_NOT_FOUND", "Mahasiswa tidak ditemukan.");
      if (payload.nim && students.some((x) => x.nim === payload.nim && x.id !== id)) {
        throw fail(409, "NIM_ALREADY_REGISTERED", "NIM sudah terdaftar.");
      }
      Object.assign(s, payload);
      return ok("Data diperbarui", { ...s });
    },

    async deleteStudent(id) {
      await wait();
      if (!students.some((x) => x.id === id)) throw fail(404, "STUDENT_NOT_FOUND", "Mahasiswa tidak ditemukan.");
      students = students.filter((x) => x.id !== id);
      attendance = attendance.filter((a) => a.student_id !== id);
      return ok("Mahasiswa dihapus", null);
    },

    /** Mock memilih mahasiswa acak; ~1 dari 5 pindaian "tidak dikenali" untuk menguji tampilan "Tidak terdaftar". */
    async recognizeFace() {
      await wait(900);
      if (students.length === 0 || Math.random() < 0.2) {
        throw fail(404, "FACE_NOT_RECOGNIZED", "Wajah tidak dikenali.");
      }
      const s = students[Math.floor(Math.random() * students.length)];
      const today = dateStr(new Date());
      const existing = attendance.find((a) => a.student_id === s.id && a.timestamp.startsWith(today));
      let record = existing;
      if (!record) {
        const now = new Date();
        record = {
          id: nextAttId++,
          student_id: s.id,
          timestamp: `${today}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
          status: "hadir",
        };
        attendance.push(record);
      }
      return ok(`Kehadiran ${s.nama} berhasil dicatat`, {
        nama: s.nama,
        nim: s.nim,
        distance: 0.31,
        already_recorded: !!existing,
        timestamp: record.timestamp,
        status: record.status,
      });
    },

    async getAttendance({ tanggal, nama } = {}) {
      await wait();
      let rows = attendance.map(withStudent);
      if (tanggal) rows = rows.filter((a) => a.timestamp.startsWith(tanggal));
      if (nama && nama.trim()) rows = rows.filter((a) => a.nama.toLowerCase().includes(nama.trim().toLowerCase()));
      rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return ok(`${rows.length} catatan kehadiran`, rows);
    },

    async deleteAttendance(id) {
      await wait();
      if (!attendance.some((a) => a.id === id)) throw fail(404, "ATTENDANCE_NOT_FOUND", "Catatan tidak ditemukan.");
      attendance = attendance.filter((a) => a.id !== id);
      return ok("Catatan dihapus", null);
    },

    async getSummary({ tanggal, hari = 7 } = {}) {
      await wait();
      const target = tanggal || dateStr(new Date());
      const [y, m, d] = target.split("-").map(Number);
      const countOn = (day) => new Set(attendance.filter((a) => a.timestamp.startsWith(day)).map((a) => a.student_id)).size;
      const harian = [];
      for (let i = hari - 1; i >= 0; i--) {
        const day = dateStr(new Date(y, m - 1, d - i));
        harian.push({ tanggal: day, hadir: countOn(day) });
      }
      const total = students.length;
      const hadir = countOn(target);
      return ok("Ringkasan kehadiran", {
        tanggal: target,
        total_mahasiswa: total,
        hadir,
        belum_hadir: Math.max(total - hadir, 0),
        persentase_hadir: total ? Math.round((hadir / total) * 1000) / 10 : 0,
        harian,
      });
    },
  };
}
