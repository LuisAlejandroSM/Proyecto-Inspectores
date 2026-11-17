"use client";

import { useState } from "react";

/**
 * Contenedor corporativo de gráfica: título, subtítulo, leyenda y botón "Ver tabla".
 * Diseño optimizado para evitar saltos de línea indeseados en columnas estrechas.
 * @param {{
 *   titulo: string,
 *   subtitulo?: string,
 *   leyenda?: { etiqueta: string, color: string, forma: "barra"|"linea" }[],
 *   tabla: { columnas: string[], filas: (string|number)[][] },
 *   vacio?: string|null,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function TarjetaGrafico({
  titulo,
  subtitulo,
  leyenda = [],
  tabla,
  vacio = null,
  children,
  className = "",
}) {
  const [verTabla, setVerTabla] = useState(false);

  return (
    <figure
      className={`viz-root flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all ${className}`}
    >
      {/* Cabecera balanceada con flex sin quiebre accidental */}
      <figcaption className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{titulo}</h3>
          {subtitulo && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitulo}</p>}
        </div>
        {!vacio && (
          <button
            type="button"
            onClick={() => setVerTabla((v) => !v)}
            aria-pressed={verTabla}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-2xs"
          >
            <svg
              className="h-3 w-3 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {verTabla ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              )}
            </svg>
            {verTabla ? "Ver gráfica" : "Ver tabla"}
          </button>
        )}
      </figcaption>

      {/* Leyenda corporativa */}
      {leyenda.length > 1 && !vacio && !verTabla && (
        <ul className="mb-3.5 flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
          {leyenda.map((l) => (
            <li key={l.etiqueta} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={l.forma === "linea" ? "h-1 w-3.5 rounded-full" : "h-2 w-2 rounded-xs"}
                style={{ background: l.color }}
              />
              <span className="text-slate-600">{l.etiqueta}</span>
            </li>
          ))}
        </ul>
      )}

      {vacio ? (
        <div className="flex min-h-[160px] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 text-center text-xs text-slate-400 font-medium">
          {vacio}
        </div>
      ) : verTabla ? (
        <div className="max-h-[320px] overflow-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
              <tr>
                {tabla.columnas.map((c, i) => (
                  <th key={c} className={`px-3 py-2 ${i > 0 ? "text-right" : ""}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {tabla.filas.map((fila, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition">
                  {fila.map((celda, j) => (
                    <td
                      key={j}
                      className={`px-3 py-2 ${j > 0 ? "text-right tabular-nums font-semibold" : ""}`}
                    >
                      {celda}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </figure>
  );
}
