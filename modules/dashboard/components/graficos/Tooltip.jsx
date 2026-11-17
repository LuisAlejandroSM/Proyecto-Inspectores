"use client";

/**
 * Tooltip corporativo interactivo estilo Tremor / Stripe Analytics
 * Tarjeta translúcida con backdrop-blur, números tabulares alineados a la derecha y bullets redondeados.
 * @param {{
 *   x: number,
 *   y: number,
 *   anchoContenedor: number,
 *   titulo: string,
 *   filas: { color?: string, valor: string, etiqueta: string }[]
 * }} props
 */
export default function Tooltip({ x, y, anchoContenedor, titulo, filas }) {
  const ANCHO = 210;
  // Asegura que el tooltip nunca se salga por la derecha o por la izquierda del contenedor
  const izquierda = Math.min(Math.max(x + 14, 8), anchoContenedor - ANCHO - 8);

  return (
    <div
      role="status"
      className="pointer-events-none absolute z-30 rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-md px-3.5 py-2.5 text-xs shadow-xl ring-1 ring-slate-950/5 transition-all duration-75"
      style={{ left: izquierda, top: Math.max(y - 14, 0), width: ANCHO }}
    >
      <div className="mb-2 pb-1.5 border-b border-slate-100 flex items-center justify-between">
        <p className="font-bold text-slate-800 text-[11px] tracking-tight">{titulo}</p>
      </div>
      <ul className="space-y-1.5">
        {filas.map((f) => (
          <li key={f.etiqueta} className="flex items-center justify-between gap-2.5">
            <span className="flex items-center gap-2 text-slate-600 font-medium min-w-0">
              {f.color && (
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full shadow-2xs"
                  style={{ background: f.color }}
                />
              )}
              <span className="truncate text-[11px]">{f.etiqueta}</span>
            </span>
            <span className="font-bold tabular-nums text-slate-900 shrink-0 text-xs">
              {f.valor}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
