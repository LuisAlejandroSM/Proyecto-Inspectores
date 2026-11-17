// Figuras numéricas del dashboard (Data Visualization - B2B Executive)
// Cifra principal, indicadores homogéneos, estado de cumplimiento, medidor y barra segmentada continua.

import { formatoNumero, formatoPorcentaje } from "./graficos/escala";
import { estadoCumplimiento } from "../metricas";

const ESTADOS = {
  cumple: {
    etiqueta: "Cumple",
    icono: "✓",
    color: "var(--viz-good)",
    clases: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  riesgo: {
    etiqueta: "En riesgo",
    icono: "!",
    color: "var(--viz-warning)",
    clases: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  critico: {
    etiqueta: "Crítico",
    icono: "✕",
    color: "var(--viz-critical)",
    clases: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
  "sin-datos": {
    etiqueta: "Sin datos",
    icono: "–",
    color: "var(--viz-axis)",
    clases: "bg-slate-50 text-slate-600 border-slate-200/80",
  },
};

/** Estado de cumplimiento: badge tipo píldora moderno y sutil */
export function EstadoCumplimiento({ valor }) {
  const e = ESTADOS[estadoCumplimiento(valor)];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight transition-colors ${e.clases}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: e.color }} />
      {e.etiqueta}
    </span>
  );
}

/** Variación frente al mes anterior con micro-píldora analítica */
function Variacion({ diferencia, unidad = "", referencia, subirEsBueno = true }) {
  if (diferencia === null || diferencia === undefined) {
    return <span className="text-[11px] font-medium text-slate-400">Sin datos de {referencia}</span>;
  }
  const signo = diferencia > 0 ? "↑" : diferencia < 0 ? "↓" : "–";
  const bueno = subirEsBueno === null || diferencia === 0 ? null : (diferencia > 0) === subirEsBueno;
  const clasesPildora =
    bueno === null
      ? "bg-slate-100 text-slate-700 border-slate-200/80"
      : bueno
      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
      : "bg-rose-50 text-rose-700 border-rose-200/80";
  const valor = Math.abs(diferencia);
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${clasesPildora}`}>
      <span>
        {signo} {formatoNumero(valor)}
        {unidad}
      </span>
      <span className="font-normal text-slate-500 opacity-80">vs. {referencia}</span>
    </span>
  );
}

/** Iconos lineales minimalistas estilo SaaS B2B */
function IconoKpi({ tipo }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/80 text-slate-600 shadow-2xs">
      {tipo === "efectividad" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )}
      {tipo === "planificadas" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      {tipo === "ejecutadas" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {tipo === "inspectores" && (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )}
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

/** Cifra principal de Efectividad (Tarjeta 1 del KPI) */
export function CifraPrincipal({ titulo, valor, detalle, diferenciaPuntos, referencia }) {
  return (
    <div className="viz-root flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{titulo}</p>
          <IconoKpi tipo="efectividad" />
        </div>
        <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatoPorcentaje(valor)}
          </p>
          <EstadoCumplimiento valor={valor} />
        </div>
      </div>
      <div className="mt-4 border-t border-slate-100/90 pt-3 flex flex-col gap-1 min-h-[3rem] justify-center">
        {referencia && (
          <div>
            <Variacion diferencia={diferenciaPuntos} unidad=" pts" referencia={referencia} />
          </div>
        )}
        <p className="text-[11px] font-medium text-slate-500 leading-snug">{detalle}</p>
      </div>
    </div>
  );
}

/** Indicador KPI balanceado (Tarjetas 2, 3 y 4) */
export function Indicador({
  etiqueta,
  valor,
  pildora,
  nota,
  detalle,
  diferencia,
  referencia,
  subirEsBueno,
  grande = false,
}) {
  const tipo = deducirTipoKpi(etiqueta);
  return (
    <div
      className={`viz-root rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:border-slate-300 transition-all ${
        grande ? "flex h-full flex-col justify-between p-5 sm:p-6" : "p-5"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{etiqueta}</p>
          {grande && <IconoKpi tipo={tipo} />}
        </div>
        <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 tabular-nums">{valor}</p>
          {pildora && (
            <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/70 px-2 py-0.5 text-[11px] font-semibold text-slate-700 tabular-nums">
              {pildora}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 border-t border-slate-100/90 pt-3 flex flex-col gap-1 min-h-[3rem] justify-center">
        {diferencia !== undefined && diferencia !== null ? (
          <div>
            <Variacion diferencia={diferencia} referencia={referencia} subirEsBueno={subirEsBueno} />
          </div>
        ) : nota ? (
          <span className="text-[11px] font-medium text-slate-500">{nota}</span>
        ) : null}
        {detalle && <p className="text-[11px] font-medium text-slate-500 leading-snug">{detalle}</p>}
      </div>
    </div>
  );
}

/** Medidor de efectividad con barra de progreso limpia */
export function Medidor({ etiqueta, valor, detalle }) {
  const e = ESTADOS[estadoCumplimiento(valor)];
  const relleno = Math.min(valor ?? 0, 1) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">{etiqueta}</span>
        <span className="text-sm font-bold tabular-nums text-slate-900">{formatoPorcentaje(valor)}</span>
      </div>
      <div
        role="meter"
        aria-label={`Efectividad ${etiqueta}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((valor ?? 0) * 100)}
        className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${relleno}%`, background: e.color }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <EstadoCumplimiento valor={valor} />
        <span className="text-[11px] font-medium text-slate-500">{detalle}</span>
      </div>
    </div>
  );
}

/**
 * Barra segmentada continua apilada (Stacked Progress Bar)
 * Una sola barra sólida con divisores finos de 1px blanco y leyenda tabular alineada.
 */
export function BarraSegmentada({ partes }) {
  const total = partes.reduce((s, p) => s + p.valor, 0);
  const visibles = partes.filter((p) => p.valor > 0);
  return (
    <div className="space-y-4">
      {/* Barra continua con bordes redondeados y divisores de 1px */}
      <div
        role="progressbar"
        aria-label={partes.map((p) => `${p.etiqueta}: ${p.valor}`).join(", ")}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={partes[0]?.valor ?? 0}
        className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner"
      >
        {visibles.map((p, idx) => {
          const pct = total > 0 ? (p.valor / total) * 100 : 0;
          return (
            <div
              key={p.etiqueta}
              title={`${p.etiqueta}: ${formatoNumero(p.valor)} (${formatoPorcentaje(p.valor / total)})`}
              className={`h-full transition-all duration-300 ${
                idx < visibles.length - 1 ? "border-r border-white" : ""
              }`}
              style={{
                width: `${pct}%`,
                background: p.color,
              }}
            />
          );
        })}
      </div>

      {/* Desglose tabular alineado */}
      <ul className="space-y-2 text-xs divide-y divide-slate-100">
        {partes.map((p) => {
          const pct = total > 0 ? p.valor / total : 0;
          return (
            <li key={p.etiqueta} className="flex items-center justify-between gap-3 pt-2 first:pt-0">
              <span className="flex items-center gap-2 text-slate-700 font-medium min-w-0">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full shadow-2xs"
                  style={{ background: p.color }}
                />
                <span className="truncate">{p.etiqueta}</span>
              </span>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="font-bold tabular-nums text-slate-900">
                  {formatoNumero(p.valor)}
                </span>
                <span className="text-[11px] font-medium text-slate-400 tabular-nums min-w-[2.75rem] text-right">
                  {total > 0 ? formatoPorcentaje(pct) : "—"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
