import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Alert from "../../components/Alert.jsx";
import BackendTodo from "../../components/BackendTodo.jsx";
import CameraView from "../../components/CameraView.jsx";
import ResultCard from "../../components/ResultCard.jsx";
import { useAuth } from "../../auth.jsx";
import Icon from "../../components/Icon.jsx";

const IDLE_TEXT = {
  title: "Siap verifikasi",
  text: "Posisikan wajah di dalam bingkai dengan cahaya cukup, lalu tekan Masuk dengan Wajah. Tidak perlu sandi.",
};

/**
 * Login mahasiswa dengan verifikasi wajah.
 * Wajah terverifikasi -> masuk ke beranda mahasiswa. Wajah tidak dikenali -> "Tidak terdaftar" + tautan registrasi.
 */
export default function MahasiswaLoginPage() {
  const { student, loginStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cameraRef = useRef(null);
  const busyRef = useRef(false);
  const [cameraStatus, setCameraStatus] = useState("loading");
  const [result, setResult] = useState({ status: "idle" });

  if (student) return <Navigate to="/mahasiswa" replace />;

  async function verify() {
    if (busyRef.current) return;
    busyRef.current = true;
    setResult({ status: "loading" });
    try {
      const photo = await cameraRef.current.capture();
      await loginStudent(photo);
      navigate(location.state?.from || "/mahasiswa", { replace: true });
    } catch (error) {
      setResult({ status: "error", error });
      busyRef.current = false;
    }
  }

  const scanning = result.status === "loading";

  return (
    <>
      <h1>Masuk dengan Wajah</h1>
      <p className="lead">Verifikasi wajah menggantikan sandi. Setelah masuk, Anda bisa absen dan melihat riwayat kehadiran sendiri.</p>

      <BackendTodo>
        POST /auth/face-login belum ada (lihat docs/TODO_BACKEND_Rama.md). Perlu juga deteksi liveness agar foto/layar orang lain
        tidak bisa dipakai masuk, dan pembatasan jumlah percobaan.
      </BackendTodo>
      {location.state?.expired && (
        <Alert tone="info" title="Sesi berakhir">
          Anda keluar otomatis karena tidak ada aktivitas. Verifikasi wajah lagi untuk masuk.
        </Alert>
      )}

      <div className="grid-2">
        <section className="card" aria-label="Kamera">
          <CameraView ref={cameraRef} onStatusChange={setCameraStatus} />
          <div className="controls">
            <button type="button" className="btn btn-primary btn-lg" onClick={verify} disabled={cameraStatus !== "ready" || scanning}>
              <Icon name="scan-face" />
              {scanning ? "Memverifikasi..." : "Masuk dengan Wajah"}
            </button>
          </div>
        </section>

        <section aria-label="Hasil verifikasi">
          <ResultCard result={result} idle={IDLE_TEXT} />
          <div className="card">
            <h2>Belum terdaftar?</h2>
            <p>Daftarkan wajah Anda dulu. Setelah itu Anda bisa masuk dengan verifikasi wajah.</p>
            <Link to="/mahasiswa/daftar" className="btn btn-secondary">
              Registrasi wajah
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
