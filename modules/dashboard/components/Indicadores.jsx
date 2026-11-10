// Figuras numéricas del dashboard (sin interacción): cifra principal, indicadores,
// estado de cumplimiento, medidor y barra segmentada.

import { formatoNumero, formatoPorcentaje } from "./graficos/escala";
import { estadoCumplimiento } from "../metricas";

const ESTADOS = {
  cumple: { etiqueta: "Cumple", icono: "✓", color: "var(--viz-good)" },
  riesgo: { etiqueta: "En riesgo", icono: "!", color: "var(--viz-warning)" },
  critico: { etiqueta: "Crítico", icono: "✕", color: "var(--viz-critical)" },
  "sin-datos": { etiqueta: "Sin datos", icono: "–", color: "var(--viz-axis)" },
};

/** Estado de cumplimiento: siempre ícono + texto, nunca solo color. */
export function EstadoCumplimiento({ valor }) {
  const e = ESTADOS[estadoCumplimiento(valor)];
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-[var(--viz-text-secondary)]">
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ background: e.color, color: e.color === "var(--viz-warning)" ? "#0b0b0b" : "#ffffff" }}
      >
        {e.icono}
      </span>
      {e.etiqueta}
    </span>
  );
}

/** Variación frente al mes anterior. `subirEsBueno` decide el color (null = neutro). */
function Variacion({ diferencia, unidad = "", referencia, subirEsBueno = true }) {
  if (diferencia === null || diferencia === undefined) {
    return <span className="text-xs text-slate-400">Sin dato de {referencia}</span>;
  }
  const signo = diferencia > 0 ? "↑" : diferencia < 0 ? "↓" : "–";
  const bueno = subirEsBueno === null || diferencia === 0 ? null : (diferencia > 0) === subirEsBueno;
  const clasesPildora =
    bueno === null
      ? "bg-slate-100 text-slate-600 border-slate-200"
      : bueno
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-rose-50 text-rose-700 border-rose-200";
  const valor = Math.abs(diferencia);
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold ${clasesPildora}`}>
      {signo} {formatoNumero(valor)}
      {unidad} <span className="font-normal opacity-75">vs. {referencia}</span>
    </span>
  );
}

/** Cifra principal del dashboard (una sola por vista). */
export function CifraPrincipal({ titulo, valor, detalle, diferenciaPuntos, referencia }) {
  return (
    <div className="viz-root flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{titulo}</p>
        <p className="mt-2 text-5xl font-black tracking-tight text-slate-900">
          {formatoPorcentaje(valor)}
        </p>
        <div className="mt-2.5">
          <EstadoCumplimiento valor={valor} />
        </div>
      </div>
      <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
        {referencia && <Variacion diferencia={diferenciaPuntos} unidad=" pts" referencia={referencia} />}
        <p className="text-xs text-slate-500">{detalle}</p>
      </div>
    </div>
  );
}

/**
 * Indicador: etiqueta · valor · variación o nota.
 * `grande`: versión del dashboard, ocupa todo el alto de su fila con la cifra más grande.
 */
export function Indicador({ etiqueta, valor, nota, diferencia, referencia, subirEsBueno, grande = false }) {
  return (
    <div
      className={`viz-root rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-shadow ${
        grande ? "flex h-full flex-col justify-between p-5 sm:p-6" : "p-5"
      }`}
    >
      <p className={`font-bold text-slate-500 uppercase tracking-wider ${grande ? "text-xs" : "text-[11px]"}`}>{etiqueta}</p>
      <p className={`font-black tracking-tight text-slate-900 ${grande ? "mt-3 text-4xl sm:text-5xl" : "mt-1.5 text-3xl"}`}>{valor}</p>
      <div className={`min-h-[1.25rem] ${grande ? "mt-3" : "mt-2"}`}>
        {diferencia !== undefined ? (
          <Variacion diferencia={diferencia} referencia={referencia} subirEsBueno={subirEsBueno} />
        ) : (
          <span className="text-xs text-slate-400">{nota}</span>
        )}
      </div>
    </div>
  );
}

/** Medidor de efectividad: relleno con color de estado y pista del mismo tono, más claro. */
export function Medidor({ etiqueta, valor, detalle }) {
  const e = ESTADOS[estadoCumplimiento(valor)];
  const relleno = Math.min(valor ?? 0, 1) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-[var(--viz-text-primary)]">{etiqueta}</span>
        <span className="text-sm font-semibold text-[var(--viz-text-primary)]">{formatoPorcentaje(valor)}</span>
      </div>
      <div
        role="meter"
        aria-label={`Efectividad ${etiqueta}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((valor ?? 0) * 100)}
        className="relative h-2 overflow-hidden rounded-full"
        style={{ background: `color-mix(in srgb, ${e.color} 22%, transparent)` }}
      >
        <div className="h-full rounded-full" style={{ width: `${relleno}%`, background: e.color }} />
      </div>
      <div className="flex items-center justify-between">
        <EstadoCumplimiento valor={valor} />
        <span className="text-xs text-[var(--viz-muted)]">{detalle}</span>
      </div>
    </div>
  );
}

/**
 * Barra segmentada alta: un total dividido en partes (≤ 6). Cada bloque muestra su
 * porcentaje si cabe; la leyenda nombra las partes y la lista inferior da las cifras.
 * @param {{ partes: { etiqueta: string, valor: number, color: string, textoOscuro?: boolean }[] }} props
 */
export function BarraSegmentada({ partes }) {
  const total = partes.reduce((s, p) => s + p.valor, 0);
  const visibles = partes.filter((p) => p.valor > 0);
  return (
    <div className="space-y-3">
      <div
        role="img"
        aria-label={partes.map((p) => `${p.etiqueta}: ${p.valor}`).join(", ")}
        className="flex h-7 w-full gap-[2px]"
      >
        {visibles.map((p) => {
          const pct = p.valor / total;
          return (
            <div
              key={p.etiqueta}
              title={`${p.etiqueta}: ${formatoNumero(p.valor)} (${formatoPorcentaje(pct)})`}
              className="flex h-full items-center rounded px-2 text-[11px] font-semibold"
              style={{ width: `${pct * 100}%`, background: p.color, color: p.textoOscuro ? "#0b0b0b" : "#ffffff" }}
            >
              {pct >= 0.12 ? formatoPorcentaje(pct) : ""}
            </div>
          );
        })}
      </div>
      <ul className="space-y-1 text-xs">
        {partes.map((p) => (
          <li key={p.etiqueta} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[var(--viz-text-secondary)]">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
              {p.etiqueta}
            </span>
            <span className="font-semibold tabular-nums text-[var(--viz-text-primary)]">
              {formatoNumero(p.valor)}{" "}
              <span className="font-normal text-[var(--viz-muted)]">
                ({total > 0 ? formatoPorcentaje(p.valor / total) : "—"})
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
