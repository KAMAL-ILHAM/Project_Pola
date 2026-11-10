/** Deretan tombol pilihan tunggal (mis. Hari ini / Kemarin). options: [{ key, label }] */
export default function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="segmented">
      {options.map((o) => (
        <button key={o.key} type="button" className="seg-btn" aria-pressed={value === o.key} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
