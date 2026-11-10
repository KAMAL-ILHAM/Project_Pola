import { Link } from "react-router-dom";
import Spinner from "./Spinner.jsx";
import { describeError, formatDate, formatHourMinute, formatTime } from "../utils.js";

/**
 * Kartu hasil pengenalan wajah.
 * result: { status: "idle" | "loading" | "success" | "already" | "error", data?, error? }
 */
/** idle: (opsional) { title, text } untuk mengganti teks awal, mis. pada halaman login wajah. */
export default function ResultCard({ result, idle }) {
  const { status, data, error } = result;

  if (status === "idle") {
    return (
      <div className="result result-idle" aria-live="polite">
        <h2>{idle?.title ?? "Siap presensi"}</h2>
        <p>{idle?.text ?? "Posisikan wajah di dalam bingkai, lalu tekan tombol Presensi Sekarang."}</p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="result result-loading" aria-live="polite" aria-busy="true">
        <h2>Mengenali wajah</h2>
        <Spinner label="Mohon tunggu sebentar..." />
      </div>
    );
  }

  // Wajah tidak cocok dengan data mana pun: tampilkan "Tidak terdaftar" + ajakan registrasi
  if (status === "error" && error?.errorCode === "FACE_NOT_RECOGNIZED") {
    return (
      <div className="result result-danger" role="alert">
        <h2>Tidak terdaftar</h2>
        <p>
          Wajah Anda belum terdaftar di sistem. Jika Anda sudah mendaftar, coba lagi dengan cahaya yang lebih terang dan
          wajah menghadap lurus ke kamera.
        </p>
        <Link to="/mahasiswa/daftar" className="btn btn-primary">
          Daftarkan wajah sekarang
        </Link>
      </div>
    );
  }

  if (status === "error") {
    const info = describeError(error);
    return (
      <div className={`result result-${info.tone}`} role="alert">
        <h2>{info.title}</h2>
        <p>{info.hint}</p>
      </div>
    );
  }

  // success atau already
  const already = status === "already";
  return (
    <div className={`result ${already ? "result-info" : "result-success"}`} role="status">
      <h2>{already ? "Sudah melakukan presensi" : "Presensi berhasil"}</h2>
      <p className="result-name">{data.nama}</p>
      <p className="result-message">
        {already ? "Sudah melakukan presensi hari ini pada jam " : "Sudah melakukan presensi pada jam "}
        <strong>{formatHourMinute(data.timestamp)}</strong>
      </p>
      <dl className="result-detail">
        <div>
          <dt>NIM</dt>
          <dd>{data.nim}</dd>
        </div>
        <div>
          <dt>Tanggal</dt>
          <dd>{formatDate(data.timestamp)}</dd>
        </div>
        <div>
          <dt>Waktu</dt>
          <dd>{formatTime(data.timestamp)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd className="result-status">{data.status}</dd>
        </div>
      </dl>
      <p className="result-note">Jarak kecocokan: {Number(data.distance).toFixed(2)} (makin kecil makin mirip)</p>
    </div>
  );
}
