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
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-zinc-500">
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-2xs"
        style={{ background: e.color, color: e.color === "var(--viz-warning)" ? "#09090b" : "#ffffff" }}
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
    return <span className="text-xs text-zinc-400">Sin dato de {referencia}</span>;
  }
  const signo = diferencia > 0 ? "↑" : diferencia < 0 ? "↓" : "–";
  const bueno = subirEsBueno === null || diferencia === 0 ? null : (diferencia > 0) === subirEsBueno;
  const clasesPildora =
    bueno === null
      ? "bg-zinc-100 text-zinc-700 border-zinc-200"
      : bueno
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-rose-50 text-rose-700 border-rose-200";
  const valor = Math.abs(diferencia);
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${clasesPildora}`}>
      {signo} {formatoNumero(valor)}
      {unidad} <span className="font-normal opacity-75">vs. {referencia}</span>
    </span>
  );
}

/** Iconos lineales por tipo de métrica con contenedor con tinte amarillo suave */
function IconoKpi({ tipo }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
      {tipo === "efectividad" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )}
      {tipo === "planificadas" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      {tipo === "ejecutadas" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {tipo === "inspectores" && (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )}
    </div>
  );
}

/** Cifra principal del dashboard (una sola por vista). */
export function CifraPrincipal({ titulo, valor, detalle, diferenciaPuntos, referencia }) {
  return (
    <div className="viz-root flex h-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs hover:border-zinc-300 transition-all">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{titulo}</p>
          <IconoKpi tipo="efectividad" />
        </div>
        <p className="mt-2 text-4xl sm:text-5xl font-black tracking-tight text-zinc-950">
          {formatoPorcentaje(valor)}
        </p>
        <div className="mt-2.5">
          <EstadoCumplimiento valor={valor} />
        </div>
      </div>
      <div className="mt-4 space-y-1.5 border-t border-zinc-100 pt-3">
        {referencia && <Variacion diferencia={diferenciaPuntos} unidad=" pts" referencia={referencia} />}
        <p className="text-xs text-zinc-500">{detalle}</p>
      </div>
    </div>
  );
}

function deducirTipoKpi(etiqueta) {
  const norm = etiqueta.toLowerCase();
  if (norm.includes("planificad")) return "planificadas";
  if (norm.includes("ejecutad")) return "ejecutadas";
  if (norm.includes("inspector")) return "inspectores";
  return "efectividad";
}

/**
 * Indicador: etiqueta · valor · variación o nota.
 * `grande`: versión del dashboard, ocupa todo el alto de su fila con la cifra más grande.
 */
export function Indicador({ etiqueta, valor, nota, diferencia, referencia, subirEsBueno, grande = false }) {
  const tipo = deducirTipoKpi(etiqueta);
  return (
    <div
      className={`viz-root rounded-2xl border border-zinc-200 bg-white shadow-xs hover:border-zinc-300 transition-all ${
        grande ? "flex h-full flex-col justify-between p-5 sm:p-6" : "p-5"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className={`font-bold text-zinc-500 uppercase tracking-wider ${grande ? "text-xs" : "text-[11px]"}`}>{etiqueta}</p>
          {grande && <IconoKpi tipo={tipo} />}
        </div>
        <p className={`font-black tracking-tight text-zinc-950 ${grande ? "mt-3 text-3xl sm:text-4xl" : "mt-1.5 text-2xl sm:text-3xl"}`}>{valor}</p>
      </div>
      <div className={`min-h-[1.25rem] ${grande ? "mt-3" : "mt-2"}`}>
        {diferencia !== undefined && diferencia !== null ? (
          <Variacion diferencia={diferencia} referencia={referencia} subirEsBueno={subirEsBueno} />
        ) : (
          <span className="text-xs text-zinc-400">{nota}</span>
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
        <span className="text-sm font-semibold text-zinc-900">{etiqueta}</span>
        <span className="text-sm font-bold tabular-nums text-zinc-950">{formatoPorcentaje(valor)}</span>
      </div>
      <div
        role="meter"
        aria-label={`Efectividad ${etiqueta}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((valor ?? 0) * 100)}
        className="relative h-2.5 overflow-hidden rounded-full bg-zinc-100"
        style={{ background: `color-mix(in srgb, ${e.color} 20%, #f4f4f5)` }}
      >
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${relleno}%`, background: e.color }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <EstadoCumplimiento valor={valor} />
        <span className="text-zinc-500">{detalle}</span>
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
        className="flex h-8 w-full gap-[2px] overflow-hidden rounded-xl bg-zinc-100 p-0.5"
      >
        {visibles.map((p) => {
          const pct = p.valor / total;
          return (
            <div
              key={p.etiqueta}
              title={`${p.etiqueta}: ${formatoNumero(p.valor)} (${formatoPorcentaje(pct)})`}
              className="flex h-full items-center justify-center rounded-lg px-2 text-[11px] font-bold transition-all"
              style={{ width: `${pct * 100}%`, background: p.color, color: p.textoOscuro ? "#09090b" : "#ffffff" }}
            >
              {pct >= 0.12 ? formatoPorcentaje(pct) : ""}
            </div>
          );
        })}
      </div>
      <ul className="space-y-1.5 text-xs">
        {partes.map((p) => (
          <li key={p.etiqueta} className="flex items-center justify-between gap-2 py-0.5">
            <span className="flex items-center gap-2 text-zinc-600 font-medium">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm shadow-2xs" style={{ background: p.color }} />
              {p.etiqueta}
            </span>
            <span className="font-bold tabular-nums text-zinc-950">
              {formatoNumero(p.valor)}{" "}
              <span className="font-normal text-zinc-400">
                ({total > 0 ? formatoPorcentaje(p.valor / total) : "—"})
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
