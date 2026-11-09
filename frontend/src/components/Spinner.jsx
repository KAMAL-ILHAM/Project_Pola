/** Indikator memuat. Teks untuk screen reader selalu ada. */
export default function Spinner({ label = "Memuat..." }) {
  return (
    <span className="spinner-wrap">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
