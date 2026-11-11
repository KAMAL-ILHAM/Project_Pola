"""Demo webcam: kotak deteksi wajah + waktu proses.

Jalankan dari root repo:  python -m cv.demo
Tombol: q = keluar, m = ganti model hog/cnn.
"""
import time

import cv2

from . import detect_faces


def main(camera_index=0):
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise SystemExit("Webcam tidak bisa dibuka. Coba camera_index lain atau tutup aplikasi yang memakai kamera.")
    model = "hog"
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        start = time.perf_counter()
        boxes = detect_faces(frame, model=model)
        ms = (time.perf_counter() - start) * 1000
        for top, right, bottom, left in boxes:
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
        cv2.putText(frame, f"model={model} wajah={len(boxes)} {ms:.0f} ms", (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.imshow("Demo deteksi wajah (q keluar, m ganti model)", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        if key == ord("m"):
            model = "cnn" if model == "hog" else "hog"
    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
