/**
 * Pengukur setengah lingkaran berbentuk garis-garis kecil (tick), mis. persentase kehadiran.
 * value: 0-100. Garis gelap = bagian yang terisi. Digambar dengan SVG biasa (tanpa library).
 */
const TICKS = 40;
const CX = 120;
const CY = 118;
const R_IN = 84;
const R_OUT = 108;

export default function Gauge({ value = 0, label = "Hadir" }) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  const filled = Math.round((percent / 100) * TICKS);

  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const angle = Math.PI - (i * Math.PI) / (TICKS - 1); // dari kiri (180 derajat) ke kanan (0 derajat)
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return (
      <line
        key={i}
        x1={CX + R_IN * cos}
        y1={CY - R_IN * sin}
        x2={CX + R_OUT * cos}
        y2={CY - R_OUT * sin}
        className={i < filled ? "gauge-tick gauge-tick-on" : "gauge-tick"}
      />
    );
  });

  return (
    <svg viewBox="0 0 240 150" className="gauge" role="img" aria-label={`${label} ${percent} persen`}>
      {ticks}
      <text x={CX} y={CY - 18} textAnchor="middle" className="gauge-value">
        {percent}%
      </text>
      <text x={CX} y={CY + 6} textAnchor="middle" className="gauge-label">
        {label}
      </text>
    </svg>
  );
}
