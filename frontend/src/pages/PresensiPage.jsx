import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CameraView from "../components/CameraView.jsx";
import ResultCard from "../components/ResultCard.jsx";
import { recognizeFace } from "../api.js";

const AUTO_INTERVAL_MS = 3000; // jeda antar pemindaian pada mode otomatis
const COOLDOWN_MS = 5000; // setelah berhasil, jeda agar hasil sempat dibaca

/**
 * Absensi untuk mahasiswa. Wajah dikenali -> kehadiran tercatat.
 * Wajah tidak dikenali -> ResultCard menampilkan "Tidak terdaftar" + tautan registrasi.
 * Sengaja TIDAK menampilkan daftar presensi orang lain (privasi): itu hanya untuk admin.
 */
export default function PresensiPage() {
  const cameraRef = useRef(null);
  const busyRef = useRef(false); // mencegah dua permintaan berjalan bersamaan
  const cooldownUntil = useRef(0);

  const [cameraStatus, setCameraStatus] = useState("loading");
  const [result, setResult] = useState({ status: "idle" });
  const [auto, setAuto] = useState(false);

  const scan = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setResult({ status: "loading" });
    try {
      const photo = await cameraRef.current.capture();
      const res = await recognizeFace(photo);
      setResult({ status: res.data.already_recorded ? "already" : "success", data: res.data });
      cooldownUntil.current = Date.now() + COOLDOWN_MS;
    } catch (error) {
      setResult({ status: "error", error });
    } finally {
      busyRef.current = false;
    }
  }, []);

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
      <h1>Absensi</h1>
      <p className="lead">Hadapkan wajah ke kamera. Kehadiran dicatat otomatis jika wajah Anda sudah terdaftar.</p>

      <div className="grid-2">
        <section className="card" aria-label="Kamera">
          <CameraView ref={cameraRef} onStatusChange={setCameraStatus} />
          <div className="controls">
            <button type="button" className="btn btn-primary btn-lg" onClick={scan} disabled={cameraStatus !== "ready" || scanning}>
              {scanning ? "Memproses..." : "Absen Sekarang"}
            </button>
            <label className="check">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} disabled={cameraStatus !== "ready"} />
              <span>Pindai otomatis setiap {AUTO_INTERVAL_MS / 1000} detik</span>
            </label>
          </div>
        </section>

        <section aria-label="Hasil absensi">
          <ResultCard result={result} />
          <div className="card">
            <h2>Belum terdaftar?</h2>
            <p>Daftarkan wajah Anda lebih dulu, setelah itu Anda bisa langsung absen.</p>
            <Link to="/daftar" className="btn btn-secondary">
              Ke halaman registrasi
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
