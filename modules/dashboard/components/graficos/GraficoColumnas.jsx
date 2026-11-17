"use client";

import { useState } from "react";
import { ejeEntero, formatoNumero, pathColumna } from "./escala";
import Tooltip from "./Tooltip";
import { useAncho } from "./useAncho";

const MARGEN = { arriba: 22, derecha: 16, abajo: 28, izquierda: 38 };
const GAP = 3; // Separación entre columnas agrupadas
const MAX_COLUMNA = 28;

/**
 * Columnas verticales ejecutivas (estilo Stripe / Tremor).
 * Admite múltiples series, barras fantasma para meses sin datos y línea de promedio analítico.
 * @param {{
 *   categorias: string[],
 *   series: { etiqueta: string, color: string, valores: number[] }[],
 *   alto?: number,
 *   etiquetaEje?: string,
 *   lineaPromedio?: { valor: number, etiqueta: string } | null
 * }} props
 */
export default function GraficoColumnas({
  categorias,
  series,
  alto = 220,
  etiquetaEje = "",
  lineaPromedio = null,
}) {
  const [ref, ancho] = useAncho();
  const [activo, setActivo] = useState(null);

  if (ancho === null) return <div ref={ref} style={{ height: alto }} aria-hidden="true" />;

  const maximo = Math.max(
    0,
    ...series.flatMap((s) => s.valores),
    lineaPromedio?.valor ?? 0
  );
  const { max, ticks } = ejeEntero(maximo);
  const anchoPlot = ancho - MARGEN.izquierda - MARGEN.derecha;
  const altoPlot = alto - MARGEN.arriba - MARGEN.abajo;
  const yBase = MARGEN.arriba + altoPlot;

  const banda = anchoPlot / Math.max(categorias.length, 1);
  const k = series.length;
  const anchoColumna = Math.max(5, Math.min(MAX_COLUMNA, (banda * 0.68 - GAP * (k - 1)) / k));
  const anchoGrupo = anchoColumna * k + GAP * (k - 1);
  const y = (v) => MARGEN.arriba + altoPlot - (v / max) * altoPlot;
  const rotular = k === 1;

  return (
    <div ref={ref} className="relative" onPointerLeave={() => setActivo(null)}>
      <svg
        width={ancho}
        height={alto}
        role="img"
        aria-label={etiquetaEje}
        className="block select-none"
      >
        {/* Rejilla y etiquetas del eje Y */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={MARGEN.izquierda}
              x2={ancho - MARGEN.derecha}
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

        {/* Línea analítica de promedio (Benchmark) */}
        {lineaPromedio && lineaPromedio.valor > 0 && (
          <g pointerEvents="none">
            <line
              x1={MARGEN.izquierda}
              x2={ancho - MARGEN.derecha}
              y1={y(lineaPromedio.valor)}
              y2={y(lineaPromedio.valor)}
              stroke="#94a3b8"
              strokeWidth="1.25"
              strokeDasharray="4 3"
            />
            <g transform={`translate(${ancho - MARGEN.derecha - 106}, ${y(lineaPromedio.valor) - 9})`}>
              <rect
                width="106"
                height="18"
                rx="4"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="1"
                className="shadow-2xs"
              />
              <text
                x="53"
                y="12"
                textAnchor="middle"
                fill="#475569"
                className="text-[9px] font-bold tracking-tight"
              >
                {lineaPromedio.etiqueta}
              </text>
            </g>
          </g>
        )}

        {/* Columnas por categoría */}
        {categorias.map((cat, i) => {
          const x0 = MARGEN.izquierda + banda * i + (banda - anchoGrupo) / 2;
          const enfocado = activo === i;
          const todosCero = series.every((s) => (s.valores[i] ?? 0) === 0);

          return (
            <g
              key={cat}
              tabIndex={0}
              aria-label={`${cat}: ${series.map((s) => `${s.etiqueta} ${s.valores[i]}`).join(", ")}`}
              onPointerEnter={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              onBlur={() => setActivo(null)}
              className="outline-none cursor-pointer"
            >
              {/* Área de interacción transparente */}
              <rect
                x={MARGEN.izquierda + banda * i}
                y={MARGEN.arriba}
                width={banda}
                height={altoPlot}
                fill={enfocado ? "rgba(15, 23, 42, 0.03)" : "transparent"}
                rx="6"
              />

              {/* Barra fantasma sutil para meses sin datos */}
              {todosCero && (
                <rect
                  x={x0}
                  y={yBase - 4}
                  width={anchoGrupo}
                  height={4}
                  rx="2"
                  fill="#e2e8f0"
                  opacity={enfocado ? 1 : 0.65}
                />
              )}

              {/* Columnas activas con esquinas superiores redondeadas */}
              {!todosCero &&
                series.map((s, j) => {
                  const v = s.valores[i] ?? 0;
                  const xCol = x0 + j * (anchoColumna + GAP);
                  if (v <= 0) return null;
                  return (
                    <g key={s.etiqueta}>
                      <path
                        d={pathColumna(xCol, y(v), anchoColumna, yBase)}
                        fill={s.color}
                        opacity={activo === null || enfocado ? 1 : 0.6}
                        className="transition-opacity duration-150"
                      />
                      {rotular && (
                        <text
                          x={xCol + anchoColumna / 2}
                          y={y(v) - 6}
                          textAnchor="middle"
                          className="fill-[var(--viz-text-primary)] text-[10px] font-bold tabular-nums"
                        >
                          {formatoNumero(v)}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Rótulo de la categoría en el eje X */}
              <text
                x={MARGEN.izquierda + banda * i + banda / 2}
                y={alto - 8}
                textAnchor="middle"
                className={`text-[10px] tabular-nums transition-colors ${
                  enfocado
                    ? "fill-[var(--viz-text-primary)] font-bold"
                    : "fill-[var(--viz-muted)] font-medium"
                }`}
              >
                {cat}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip analítico flotante */}
      {activo !== null && (
        <Tooltip
          x={MARGEN.izquierda + banda * activo + banda / 2}
          y={MARGEN.arriba}
          anchoContenedor={ancho}
          titulo={categorias[activo]}
          filas={
            series.every((s) => (s.valores[activo] ?? 0) === 0)
              ? [{ etiqueta: "Estado", valor: "Sin registros en este mes" }]
              : series.map((s) => ({
                  color: s.color,
                  valor: `${formatoNumero(s.valores[activo])} ins.`,
                  etiqueta: s.etiqueta,
                }))
          }
        />
      )}
    </div>
  );
}
