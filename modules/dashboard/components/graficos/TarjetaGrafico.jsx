"use client";

import { useState } from "react";

/**
 * Contenedor de una gráfica: título, subtítulo, leyenda y botón "Ver tabla"
 * (la versión en tabla es el equivalente accesible de cada gráfica).
 * @param {{
 *   titulo: string,
 *   subtitulo?: string,
 *   leyenda?: { etiqueta: string, color: string, forma: "barra"|"linea" }[],
 *   tabla: { columnas: string[], filas: (string|number)[][] },
 *   vacio?: string|null,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 * `className` permite estirar la tarjeta (h-full / flex-1) para igualar el alto con sus vecinas.
 */
export default function TarjetaGrafico({ titulo, subtitulo, leyenda = [], tabla, vacio = null, children, className = "" }) {
  const [verTabla, setVerTabla] = useState(false);

  return (
    <figure className={`viz-root flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 transition-all ${className}`}>
      <figcaption className="mb-3.5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-zinc-950">{titulo}</h3>
          {subtitulo && <p className="text-xs text-zinc-500 mt-0.5">{subtitulo}</p>}
        </div>
        {!vacio && (
          <button
            type="button"
            onClick={() => setVerTabla((v) => !v)}
            aria-pressed={verTabla}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition"
          >
            {verTabla ? "Ver gráfica" : "Ver tabla"}
          </button>
        )}
      </figcaption>

      {leyenda.length > 1 && !vacio && !verTabla && (
        <ul className="mb-3 flex flex-wrap gap-4 text-xs text-zinc-500 font-medium">
          {leyenda.map((l) => (
            <li key={l.etiqueta} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={l.forma === "linea" ? "h-1 w-4 rounded-full" : "h-2.5 w-2.5 rounded-xs"}
                style={{ background: l.color }}
              />
              {l.etiqueta}
            </li>
          ))}
        </ul>
      )}

      {vacio ? (
        <div className="flex min-h-[160px] flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 text-center text-xs text-zinc-400 font-medium">
          {vacio}
        </div>
      ) : verTabla ? (
        <div className="max-h-[320px] overflow-auto rounded-xl border border-zinc-200">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
              <tr>
                {tabla.columnas.map((c, i) => (
                  <th key={c} className={`px-3 py-2 ${i > 0 ? "text-right" : ""}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-900">
              {tabla.filas.map((fila, i) => (
                <tr key={i} className="hover:bg-zinc-50/70 transition">
                  {fila.map((celda, j) => (
                    <td key={j} className={`px-3 py-2 ${j > 0 ? "text-right tabular-nums font-medium" : ""}`}>
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
