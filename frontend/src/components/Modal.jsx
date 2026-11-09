import { useEffect, useRef } from "react";

/** Dialog sederhana: tutup dengan tombol Esc atau klik latar gelap. */
export default function Modal({ title, onClose, children }) {
  const boxRef = useRef(null);

  useEffect(() => {
    boxRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={boxRef}>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
