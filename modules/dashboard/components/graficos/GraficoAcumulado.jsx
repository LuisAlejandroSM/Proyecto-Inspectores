"use client";

import { useState } from "react";
import { ejeEntero, formatoNumero } from "./escala";
import Tooltip from "./Tooltip";
import { useAncho } from "./useAncho";

const MARGEN = { arriba: 24, derecha: 48, abajo: 28, izquierda: 38 };

/**
 * Gráfico de Área (Area Chart) de avance acumulado mensual (Burn-up).
 * Degradado vertical bajo las series, línea de "Hoy" con badge ejecutivo y tooltip analítico interactivo.
 * @param {{
 *   dias: number,
 *   series: { etiqueta: string, color: string, valores: (number|null)[] }[],
 *   diaHoy?: number,
 *   alto?: number
 * }} props
 */
export default function GraficoAcumulado({ dias, series, diaHoy = 0, alto = 260 }) {
  const [ref, ancho] = useAncho();
  const [activo, setActivo] = useState(null);

  if (ancho === null) return <div ref={ref} style={{ height: alto }} aria-hidden="true" />;

  const maximo = Math.max(0, ...series.flatMap((s) => s.valores.filter((v) => v !== null)));
  const { max, ticks } = ejeEntero(maximo);
  const anchoPlot = ancho - MARGEN.izquierda - MARGEN.derecha;
  const altoPlot = alto - MARGEN.arriba - MARGEN.abajo;
  const yBase = MARGEN.arriba + altoPlot;

  const x = (dia) => MARGEN.izquierda + ((dia - 1) / Math.max(dias - 1, 1)) * anchoPlot;
  const y = (v) => MARGEN.arriba + altoPlot - (v / max) * altoPlot;

  // Ruta de línea pura SVG
  const rutaLinea = (valores) =>
    valores
      .map((v, i) => (v === null ? null : `${x(i + 1)},${y(v)}`))
      .filter(Boolean)
      .map((p, i) => `${i === 0 ? "M" : "L"}${p}`)
      .join("");

  // Ruta de polígono cerrado para el gradiente de área (Area Chart)
  const rutaArea = (valores) => {
    const puntos = valores
      .map((v, i) => (v === null ? null : { x: x(i + 1), y: y(v) }))
      .filter(Boolean);
    if (puntos.length < 2) return "";
    const primerX = puntos[0].x;
    const ultimoX = puntos[puntos.length - 1].x;
    const d = puntos.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join("");
    return `${d}L${ultimoX},${yBase}L${primerX},${yBase}Z`;
  };

  const diaDesdePuntero = (evento) => {
    const rect = evento.currentTarget.getBoundingClientRect();
    const px = evento.clientX - rect.left;
    const dia = Math.round(((px - MARGEN.izquierda) / anchoPlot) * (dias - 1)) + 1;
    return Math.min(Math.max(dia, 1), dias);
  };

  const alTeclado = (e) => {
    if (e.key === "ArrowRight") setActivo((d) => Math.min((d ?? 0) + 1, dias));
    if (e.key === "ArrowLeft") setActivo((d) => Math.max((d ?? 2) - 1, 1));
  };

  // Rótulos al final de cada línea
  const finales = series.map((s) => {
    let ultimo = -1;
    s.valores.forEach((v, i) => {
      if (v !== null) ultimo = i;
    });
    return ultimo < 0 ? null : { dia: ultimo + 1, valor: s.valores[ultimo] };
  });
  const separados =
    finales.filter(Boolean).length < 2 ||
    Math.abs(y(finales[0]?.valor ?? 0) - y(finales[1]?.valor ?? 0)) >= 14;

  const ticksX = [1, 5, 10, 15, 20, 25, dias].filter((d, i, arr) => d <= dias && arr.indexOf(d) === i);

  // Datos para el Tooltip interactivo
  let filasTooltip = [];
  if (activo !== null) {
    const valPlan = series[0]?.valores[activo - 1] ?? null;
    const valEjec = series[1]?.valores[activo - 1] ?? null;
    filasTooltip = [
      {
        etiqueta: "Planificado",
        color: series[0]?.color,
        valor: valPlan !== null ? `${formatoNumero(valPlan)} ins.` : "—",
      },
      {
        etiqueta: "Ejecutado",
        color: series[1]?.color,
        valor: valEjec !== null ? `${formatoNumero(valEjec)} ins.` : "Sin registrar",
      },
    ];
    if (valPlan !== null && valEjec !== null) {
      const dif = valEjec - valPlan;
      filasTooltip.push({
        etiqueta: "Brecha actual",
        color: dif >= 0 ? "var(--viz-good)" : "var(--viz-critical)",
        valor: dif === 0 ? "Al día (0)" : dif > 0 ? `+${dif}` : `${dif}`,
      });
    }
  }

  return (
    <div ref={ref} className="relative">
      <svg
        width={ancho}
        height={alto}
        role="img"
        aria-label="Avance acumulado del mes, planificado frente a ejecutado"
        tabIndex={0}
        onPointerMove={(e) => setActivo(diaDesdePuntero(e))}
        onPointerLeave={() => setActivo(null)}
        onFocus={() => setActivo(diaHoy || 1)}
        onBlur={() => setActivo(null)}
        onKeyDown={alTeclado}
        className="block outline-none select-none"
      >
        <defs>
          <linearGradient id="areaGradPlan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--viz-plan)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--viz-plan)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="areaGradEjec" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--viz-ejec)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--viz-ejec)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Rejilla horizontal sutil */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={MARGEN.izquierda}
              x2={MARGEN.izquierda + anchoPlot}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? "var(--viz-axis)" : "var(--viz-grid)"}
              strokeWidth="1"
            />
            <text
              x={MARGEN.izquierda - 8}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="fill-[var(--viz-muted)] text-[10px] tabular-nums font-medium"
            >
              {formatoNumero(t)}
            </text>
          </g>
        ))}

        {/* Eje X de días */}
        {ticksX.map((d) => (
          <text
            key={d}
            x={x(d)}
            y={alto - 8}
            textAnchor="middle"
            className="fill-[var(--viz-muted)] text-[10px] tabular-nums font-medium"
          >
            {d}
          </text>
        ))}

        {/* Relleno de Área Degradada (Area Chart) */}
        {series[0] && (
          <path d={rutaArea(series[0].valores)} fill="url(#areaGradPlan)" pointerEvents="none" />
        )}
        {series[1] && (
          <path d={rutaArea(series[1].valores)} fill="url(#areaGradEjec)" pointerEvents="none" />
        )}

        {/* Marca vertical de "Hoy" con badge superior ejecutivo */}
        {diaHoy > 0 && diaHoy <= dias && (
          <g pointerEvents="none">
            <line
              x1={x(diaHoy)}
              x2={x(diaHoy)}
              y1={MARGEN.arriba}
              y2={yBase}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <g transform={`translate(${x(diaHoy) - 27}, ${MARGEN.arriba - 18})`}>
              <rect
                width="54"
                height="18"
                rx="4"
                fill="#0f172a"
                className="shadow-xs"
              />
              <text
                x="27"
                y="12"
                textAnchor="middle"
                fill="#ffffff"
                className="text-[9px] font-bold tracking-wider"
              >
                HOY ({diaHoy})
              </text>
            </g>
          </g>
        )}

        {/* Trazos de Líneas */}
        {series.map((s, idx) => (
          <path
            key={s.etiqueta}
            d={rutaLinea(s.valores)}
            fill="none"
            stroke={s.color}
            strokeWidth={idx === 1 ? "2.5" : "2"}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Puntos finales con rótulo de datos */}
        {series.map((s, i) => {
          const f = finales[i];
          if (!f) return null;
          return (
            <g key={s.etiqueta}>
              <circle
                cx={x(f.dia)}
                cy={y(f.valor)}
                r="4.5"
                fill={s.color}
                stroke="var(--viz-surface)"
                strokeWidth="2.5"
                className="shadow-2xs"
              />
              {separados && (
                <text
                  x={x(f.dia) + 8}
                  y={y(f.valor)}
                  dy="0.32em"
                  className="fill-[var(--viz-text-primary)] text-[11px] font-bold tabular-nums"
                >
                  {formatoNumero(f.valor)}
                </text>
              )}
            </g>
          );
        })}

        {/* Cursor interactivo (hover crosshair) y puntos activos con aro halo blanco */}
        {activo !== null && (
          <g pointerEvents="none">
            <line
              x1={x(activo)}
              x2={x(activo)}
              y1={MARGEN.arriba}
              y2={yBase}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            {series.map((s) => {
              const v = s.valores[activo - 1];
              if (v === null || v === undefined) return null;
              return (
                <circle
                  key={s.etiqueta}
                  cx={x(activo)}
                  cy={y(v)}
                  r="5"
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="shadow-sm"
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* Tooltip analítico flotante */}
      {activo !== null && (
        <Tooltip
          x={x(activo)}
          y={MARGEN.arriba}
          anchoContenedor={ancho}
          titulo={`Día ${activo} del mes`}
          filas={filasTooltip}
        />
      )}
    </div>
  );
}
