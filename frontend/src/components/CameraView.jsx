import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

const MAX_WIDTH = 640; // foto diperkecil agar upload cepat dan jauh di bawah batas 5 MB backend

const PROBLEMS = {
  denied: {
    title: "Izin kamera ditolak",
    text: "Klik ikon gembok/kamera di sebelah alamat situs, ubah izin Kamera menjadi \"Izinkan\", lalu tekan Coba lagi.",
  },
  "no-camera": {
    title: "Kamera tidak ditemukan",
    text: "Sambungkan webcam atau pastikan tidak dipakai aplikasi lain, lalu tekan Coba lagi.",
  },
  unsupported: {
    title: "Browser tidak mendukung kamera",
    text: "Gunakan Chrome, Edge, atau Firefox versi terbaru, dan buka lewat localhost atau HTTPS.",
  },
  error: {
    title: "Kamera tidak dapat dibuka",
    text: "Tutup aplikasi lain yang memakai kamera, lalu tekan Coba lagi.",
  },
};

/**
 * Pratinjau webcam memakai getUserMedia.
 * Induk mengambil gambar lewat ref:  const blob = await cameraRef.current.capture();
 * Props: onStatusChange(status) -> "loading" | "ready" | "denied" | "no-camera" | "unsupported" | "error"
 */
const CameraView = forwardRef(function CameraView({ onStatusChange }, ref) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const runRef = useRef(0); // penanda percobaan terbaru, mencegah stream "yatim" saat komponen cepat di-mount ulang
  const [status, setStatus] = useState("loading");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    const run = ++runRef.current;
    stopStream();
    setStatus("loading");

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (run !== runRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setStatus("ready");
    } catch (err) {
      if (run !== runRef.current) return;
      if (err.name === "NotAllowedError" || err.name === "SecurityError") setStatus("denied");
      else if (err.name === "NotFoundError" || err.name === "OverconstrainedError") setStatus("no-camera");
      else setStatus("error");
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera();
    return () => {
      runRef.current++;
      stopStream(); // matikan lampu kamera saat halaman ditinggalkan
    };
  }, [startCamera, stopStream]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useImperativeHandle(
    ref,
    () => ({
      /** Ambil satu frame dari video sebagai Blob JPEG (tidak dicerminkan). */
      capture() {
        return new Promise((resolve, reject) => {
          const video = videoRef.current;
          if (status !== "ready" || !video || !video.videoWidth) {
            reject(new Error("Kamera belum siap."));
            return;
          }
          const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Gagal mengambil gambar."))), "image/jpeg", 0.9);
        });
      },
    }),
    [status]
  );

  const problem = PROBLEMS[status];

  return (
    <div className="camera">
      {/* video selalu ada di DOM agar ref valid; dicerminkan lewat CSS supaya terasa seperti cermin */}
      <video
        ref={videoRef}
        className="camera-video"
        autoPlay
        playsInline
        muted
        aria-label="Pratinjau kamera"
        hidden={status !== "ready"}
      />
      {status === "ready" && <div className="camera-guide" aria-hidden="true" />}

      {status === "loading" && (
        <div className="camera-message" role="status">
          <span className="spinner" aria-hidden="true" />
          <p>Membuka kamera... Izinkan akses kamera bila diminta browser.</p>
        </div>
      )}

      {problem && (
        <div className="camera-message" role="alert">
          <strong>{problem.title}</strong>
          <p>{problem.text}</p>
          <button type="button" className="btn btn-primary" onClick={startCamera}>
            Coba lagi
          </button>
        </div>
      )}
    </div>
  );
});

export default CameraView;
