import { useCallback, useEffect, useRef, useState } from "react";
import CameraView from "../components/CameraView.jsx";
import ResultCard from "../components/ResultCard.jsx";
import AttendanceTable from "../components/AttendanceTable.jsx";
import { getAttendance, recognizeFace } from "../api.js";
import { todayISO } from "../utils.js";

const AUTO_INTERVAL_MS = 3000; // jeda antar pemindaian pada mode otomatis
const COOLDOWN_MS = 5000; // setelah berhasil, jeda agar hasil sempat dibaca

export default function PresensiPage() {
  const cameraRef = useRef(null);
  const busyRef = useRef(false); // mencegah dua permintaan berjalan bersamaan
  const cooldownUntil = useRef(0);

  const [cameraStatus, setCameraStatus] = useState("loading");
  const [result, setResult] = useState({ status: "idle" });
  const [auto, setAuto] = useState(false);
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const loadRecent = useCallback(async () => {
    try {
      const res = await getAttendance({ tanggal: todayISO() });
      setRecent(res.data.slice(0, 5));
    } catch {
      setRecent([]); // daftar ini hanya pelengkap; kegagalannya tidak perlu mengganggu presensi
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const scan = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setResult({ status: "loading" });
    try {
      const photo = await cameraRef.current.capture();
      const res = await recognizeFace(photo);
      setResult({ status: res.data.already_recorded ? "already" : "success", data: res.data });
      cooldownUntil.current = Date.now() + COOLDOWN_MS;
      loadRecent();
    } catch (error) {
      setResult({ status: "error", error });
    } finally {
      busyRef.current = false;
    }
  }, [loadRecent]);

  // Mode otomatis: pindai berkala selama kamera siap
  useEffect(() => {
    if (!auto || cameraStatus !== "ready") return;
    const id = setInterval(() => {
      if (Date.now() >= cooldownUntil.current) scan();
    }, AUTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [auto, cameraStatus, scan]);

  const scanning = result.status === "loading";

  return (
    <>
      <h1>Presensi</h1>
      <p className="lead">Hadapkan wajah ke kamera. Kehadiran akan dicatat otomatis jika wajah dikenali.</p>

      <div className="grid-2">
        <section className="card" aria-label="Kamera">
          <CameraView ref={cameraRef} onStatusChange={setCameraStatus} />
          <div className="controls">
            <button type="button" className="btn btn-primary btn-lg" onClick={scan} disabled={cameraStatus !== "ready" || scanning}>
              {scanning ? "Memproses..." : "Presensi Sekarang"}
            </button>
            <label className="check">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} disabled={cameraStatus !== "ready"} />
              <span>Pindai otomatis setiap {AUTO_INTERVAL_MS / 1000} detik</span>
            </label>
          </div>
        </section>

        <section aria-label="Hasil presensi">
          <ResultCard result={result} />
          <div className="card">
            <h2>Presensi terbaru hari ini</h2>
            <AttendanceTable rows={recent} loading={recentLoading} emptyText="Belum ada yang presensi hari ini." />
          </div>
        </section>
      </div>
    </>
  );
}
