/** Label status kehadiran, mis. "hadir". Warna tidak jadi satu-satunya penanda karena ada teksnya. */
export default function StatusBadge({ status }) {
  const text = status ? status.charAt(0).toUpperCase() + status.slice(1) : "-";
  return <span className={`badge badge-${status === "hadir" ? "success" : "neutral"}`}>{text}</span>;
}
