/** Kotak pesan untuk umpan balik. tone: success | info | warning | danger. */
export default function Alert({ tone = "info", title, children }) {
  // pesan bernada peringatan/bahaya dibacakan langsung oleh screen reader
  const role = tone === "danger" || tone === "warning" ? "alert" : "status";
  return (
    <div className={`alert alert-${tone}`} role={role}>
      {title && <strong className="alert-title">{title}</strong>}
      {children && <div>{children}</div>}
    </div>
  );
}
