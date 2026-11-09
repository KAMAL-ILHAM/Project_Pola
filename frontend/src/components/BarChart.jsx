import { formatShortDate } from "../utils.js";

const W = 600;
const H = 280;
const PAD = { top: 24, right: 16, bottom: 36, left: 36 };

/**
 * Grafik batang kehadiran per hari, digambar dengan SVG biasa (tanpa library).
 * data: [{ tanggal: "YYYY-MM-DD", hadir: number }], total: jumlah mahasiswa (tinggi maksimal grafik),
 * highlight: tanggal yang diberi warna lebih tua.
 */
export default function BarChart({ data, total = 0, highlight }) {
  if (!data || data.length === 0) return <p className="empty">Belum ada data untuk grafik.</p>;

  const max = Math.max(total, ...data.map((d) => d.hadir), 1);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.min(slot * 0.6, 48);
  const labelEvery = Math.ceil(data.length / 10); // tampilkan label x secukupnya agar tidak berdesakan
  const y = (v) => PAD.top + plotH - (v / max) * plotH;

  const summary = data.map((d) => `${formatShortDate(d.tanggal)}: ${d.hadir} hadir`).join(", ");

  return (
    <div className="chart-scroll">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Grafik kehadiran per hari. ${summary}`} className="chart">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(max * f)} y2={y(max * f)} className="chart-grid" />
            <text x={PAD.left - 6} y={y(max * f) + 4} textAnchor="end" className="chart-text">
              {Math.round(max * f)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const top = y(d.hadir);
          const active = d.tanggal === highlight;
          return (
            <g key={d.tanggal}>
              <rect x={x} y={top} width={barW} height={PAD.top + plotH - top} rx="3" className={active ? "chart-bar chart-bar-active" : "chart-bar"}>
                <title>{`${formatShortDate(d.tanggal)}: ${d.hadir} hadir`}</title>
              </rect>
              <text x={x + barW / 2} y={top - 6} textAnchor="middle" className="chart-text chart-value">
                {d.hadir}
              </text>
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 14} textAnchor="middle" className="chart-text">
                  {formatShortDate(d.tanggal)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
