import { useEffect, useRef, useState } from "react";
import { formatShortDate } from "../utils.js";

const H = 240;
const PAD = { top: 22, right: 8, bottom: 34, left: 28 };

/**
 * Grafik batang kehadiran per hari, digambar dengan SVG biasa (tanpa library).
 * Lebar mengikuti wadahnya (ResizeObserver) sehingga teks tetap terbaca di layar ponsel.
 * data: [{ tanggal: "YYYY-MM-DD", hadir: number }], total: jumlah mahasiswa (tinggi maksimal grafik),
 * highlight: tanggal yang diberi batang gelap penuh; hari lain berpola garis miring.
 */
export default function BarChart({ data, total = 0, highlight }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(560);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.floor(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) return <p className="empty">Belum ada data untuk grafik.</p>;

  const max = Math.max(total, ...data.map((d) => d.hadir), 1);
  const plotW = width - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.max(6, Math.min(slot * 0.62, 36));
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 52)))); // cegah label saling menimpa
  const y = (v) => PAD.top + plotH - (v / max) * plotH;
  const summary = data.map((d) => `${formatShortDate(d.tanggal)}: ${d.hadir} hadir`).join(", ");

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${width} ${H}`} width={width} height={H} role="img" aria-label={`Grafik kehadiran per hari. ${summary}`} className="chart">
        <defs>
          <pattern id="chart-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#ecede2" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#b9bba8" strokeWidth="2" />
          </pattern>
        </defs>

        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(max * f)} y2={y(max * f)} className="chart-grid" />
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
              <rect
                x={x}
                y={top}
                width={barW}
                height={Math.max(PAD.top + plotH - top, 0)}
                rx="4"
                fill="url(#chart-hatch)"
                className={active ? "chart-bar chart-bar-active" : "chart-bar"}
              >
                <title>{`${formatShortDate(d.tanggal)}: ${d.hadir} hadir`}</title>
              </rect>
              {(slot >= 22 || active) && (
                <text x={x + barW / 2} y={top - 6} textAnchor="middle" className="chart-text chart-value">
                  {d.hadir}
                </text>
              )}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 12} textAnchor="middle" className="chart-text">
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
