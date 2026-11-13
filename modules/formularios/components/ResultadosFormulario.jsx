"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatoNumero, formatoPorcentaje } from "@/modules/dashboard/components/graficos/escala";
import { Indicador } from "@/modules/dashboard/components/Indicadores";
import { esNegativa, esNoAplica } from "../campos";
import { textoFecha } from "../fechas";
import { calcularResultados, fallasDeRespuesta, generarCsv } from "../resultados";

const CLASE_SELECT = "rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:border-zinc-300 focus:bg-white focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition outline-none";

const PERIODOS = [
  ["todo", "Todo"],
  ["7", "Últimos 7 días"],
  ["30", "Últimos 30 días"],
  ["mes", "Este mes"],
];

function desdePeriodo(periodo) {
  const ahora = new Date();
  if (periodo === "mes") return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const dias = Number(periodo);
  return dias ? new Date(ahora.getTime() - dias * 86400000) : null;
}

function colorColumna(col, indicePositiva) {
  if (esNegativa(col)) return "var(--viz-critical)";
  if (esNoAplica(col)) return "var(--viz-axis)";
  return indicePositiva === 0 ? "var(--viz-plan)" : "var(--viz-ejec)";
}

function coloresDeColumnas(columnas) {
  let positivas = 0;
  return Object.fromEntries(
    columnas.map((c) => {
      const color = colorColumna(c, positivas);
      if (!esNegativa(c) && !esNoAplica(c)) positivas += 1;
      return [c, color];
    })
  );
}

function Tarjeta({ titulo, subtitulo, children, accion }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 transition-all">
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-zinc-950">{titulo}</h3>
          {subtitulo && <p className="text-xs text-zinc-500 mt-0.5">{subtitulo}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}

/** Barras horizontales con el valor escrito al final (una sola serie). */
function Barras({ filas, total, color = "var(--viz-plan)" }) {
  const maximo = Math.max(1, ...filas.map((f) => f.cantidad));
  return (
    <ul className="space-y-2.5">
      {filas.map((f) => {
        const pct = total > 0 ? f.cantidad / total : null;
        return (
          <li key={f.etiqueta} className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-3 text-xs sm:grid-cols-[minmax(0,14rem)_1fr]">
            <span className="truncate font-medium text-zinc-700" title={f.etiqueta}>
              {f.etiqueta}
            </span>
            <span className="flex items-center gap-2" title={`${f.etiqueta}: ${f.cantidad} (${formatoPorcentaje(pct)})`}>
              <span className="h-3 rounded-full" style={{ width: `${(f.cantidad / maximo) * 80}%`, minWidth: f.cantidad ? 6 : 0, background: color }} />
              <span className="whitespace-nowrap text-xs font-bold tabular-nums text-zinc-950">
                {f.cantidad} <span className="font-normal text-zinc-400">({formatoPorcentaje(pct)})</span>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ResumenLista({ r }) {
  const colores = coloresDeColumnas(r.columnas);
  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 font-medium" aria-label="Leyenda">
        {r.columnas.map((c) => (
          <li key={c} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs" style={{ background: colores[c] }} />
            {c}
            {esNegativa(c) && " (falla)"}
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
            <tr>
              <th className="py-2 px-3">Ítem</th>
              <th className="w-40 py-2 px-3">Distribución</th>
              {r.columnas.map((c) => (
                <th key={c} className="w-14 py-2 px-3 text-right">
                  {c}
                </th>
              ))}
              <th className="w-16 py-2 px-3 text-right">% falla</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {r.filas.map((f) => (
              <tr key={f.texto} className={`hover:bg-zinc-50/70 transition ${f.fallas > 0 ? "bg-rose-50/30" : ""}`}>
                <td className="py-2 px-3 font-medium text-zinc-900">{f.texto}</td>
                <td className="py-2 px-3">
                  {f.marcadas > 0 ? (
                    <span className="flex h-3 gap-[2px] overflow-hidden rounded-md bg-zinc-100 p-0.5" aria-hidden="true">
                      {r.columnas
                        .filter((c) => f.cuenta[c] > 0)
                        .map((c) => (
                          <span
                            key={c}
                            title={`${c}: ${f.cuenta[c]}`}
                            style={{ flexGrow: f.cuenta[c], background: colores[c] }}
                          />
                        ))}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">Sin respuestas</span>
                  )}
                </td>
                {r.columnas.map((c) => (
                  <td
                    key={c}
                    className={`py-2 px-3 text-right tabular-nums ${
                      esNegativa(c) && f.cuenta[c] > 0 ? "font-bold text-rose-600" : "text-zinc-600"
                    }`}
                  >
                    {f.cuenta[c] || "·"}
                  </td>
                ))}
                <td className="py-2 px-3 text-right text-xs font-bold tabular-nums text-zinc-950">
                  {f.tasaFalla === null ? "—" : formatoPorcentaje(f.tasaFalla)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResumenPregunta({ r }) {
  const subtitulo = `${r.respondidas} de ${r.total} respuesta(s)`;

  let contenido = null;
  if (r.respondidas === 0) {
    contenido = <p className="text-xs text-zinc-400">Nadie respondió esta pregunta en el período.</p>;
  } else if (r.opciones) {
    contenido = <Barras filas={r.opciones} total={r.respondidas} />;
  } else if (r.tipo === "numero" && r.estadisticas) {
    contenido = (
      <dl className="grid grid-cols-3 gap-3">
        {[
          ["Promedio", r.estadisticas.promedio],
          ["Mínimo", r.estadisticas.minimo],
          ["Máximo", r.estadisticas.maximo],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{etiqueta}</dt>
            <dd className="mt-1 text-xl font-black tabular-nums text-zinc-950">
              {Number.isInteger(valor) ? formatoNumero(valor) : valor.toFixed(1).replace(".", ",")}
            </dd>
          </div>
        ))}
      </dl>
    );
  } else if (r.tipo === "fecha") {
    contenido = (
      <div className="space-y-2 text-xs">
        <p className="text-zinc-600 font-medium">
          Desde <strong className="text-zinc-950 font-bold">{textoFecha(r.primera)}</strong> hasta{" "}
          <strong className="text-zinc-950 font-bold">{textoFecha(r.ultima)}</strong>
        </p>
        {r.esVencimiento &&
          (r.vencidas.length > 0 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-bold text-rose-800">✕ {r.vencidas.length} ya vencida(s) al momento de la inspección</p>
              <ul className="mt-1.5 space-y-1 text-xs text-rose-900">
                {r.vencidas.slice(0, 10).map((v) => (
                  <li key={v.asignacionId}>
                    <Link href={`/formularios/respuesta/${v.asignacionId}`} className="hover:underline font-medium">
                      {v.inspector}: venció el {textoFecha(v.valor)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs font-bold text-emerald-700">✓ Ninguna vencida al momento de la inspección</p>
          ))}
      </div>
    );
  } else if (r.agrupados) {
    contenido = (
      <div>
        <p className="mb-2 text-xs text-zinc-500">{r.distintos} valor(es) distinto(s)</p>
        <ul className="max-h-60 divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-200 pr-1">
          {r.agrupados.map((g) => (
            <li key={g.texto} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
              <span className="min-w-0 truncate text-zinc-800 font-medium" title={g.texto}>
                {g.texto}
              </span>
              <span className="shrink-0 text-xs font-bold tabular-nums text-zinc-500">
                {g.cantidad > 1 ? `${g.cantidad} veces` : "1 vez"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  } else if (r.textos) {
    contenido = (
      <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {r.textos.map((t) => (
          <li key={t.asignacionId} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3">
            <p className="whitespace-pre-line text-xs font-medium text-zinc-900 leading-relaxed">{t.texto}</p>
            <Link href={`/formularios/respuesta/${t.asignacionId}`} className="mt-1 block text-[11px] font-semibold text-zinc-500 hover:text-amber-600 transition">
              {t.inspector} · {t.fecha}
            </Link>
          </li>
        ))}
      </ul>
    );
  } else if (r.tipo === "tabla_verificacion") {
    contenido = <ResumenLista r={r} />;
  } else if (r.fotos) {
    contenido = (
      <div>
        <p className="mb-2.5 text-xs text-zinc-500">
          {r.tipo === "firma" ? `${r.cantidad} firma(s)` : `${r.cantidad} foto(s) en total`}
          {r.cantidad > r.fotos.length && ` · se muestran las ${r.fotos.length} más recientes`}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {r.fotos.map((f) => (
            <Link
              key={f.id}
              href={`/formularios/respuesta/${f.asignacionId}`}
              title={`${f.inspector} · ${f.fecha}`}
              className={`block overflow-hidden rounded-xl border border-zinc-200 shadow-2xs hover:border-zinc-400 transition ${
                r.tipo === "firma" ? "h-16 w-32 bg-white p-1" : "h-20 w-20 bg-zinc-100"
              }`}
            >
              <img
                src={`/api/archivos/${f.id}`}
                alt={`${r.etiqueta} — ${f.inspector}`}
                loading="lazy"
                className={`h-full w-full ${r.tipo === "firma" ? "object-contain" : "object-cover"}`}
              />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const accion =
    r.tipo === "tabla_verificacion" && r.fallas > 0 ? (
      <span className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">✕ {r.fallas} falla(s)</span>
    ) : null;

  return (
    <Tarjeta titulo={r.etiqueta} subtitulo={subtitulo} accion={accion}>
      {contenido}
    </Tarjeta>
  );
}

/**
 * Resultados de un formulario para el administrador: indicadores, resumen por pregunta,
 * ítems con más fallas, lista de respuestas y descarga en CSV.
 */
export default function ResultadosFormulario({ titulo, campos, respuestas, asignaciones }) {
  const [inspector, setInspector] = useState("todos");
  const [periodo, setPeriodo] = useState("todo");

  const inspectores = useMemo(() => {
    const mapa = new Map();
    for (const a of asignaciones) mapa.set(a.usuarioId, a.inspector);
    return [...mapa].sort((a, b) => a[1].localeCompare(b[1]));
  }, [asignaciones]);

  const filtradas = useMemo(() => {
    const desde = desdePeriodo(periodo);
    return respuestas.filter(
      (r) => (inspector === "todos" || r.usuarioId === inspector) && (!desde || new Date(r.enviadaEn) >= desde)
    );
  }, [respuestas, inspector, periodo]);

  const asignacionesFiltradas = useMemo(
    () => asignaciones.filter((a) => inspector === "todos" || a.usuarioId === inspector),
    [asignaciones, inspector]
  );

  const datos = useMemo(() => calcularResultados(campos, filtradas, asignacionesFiltradas), [campos, filtradas, asignacionesFiltradas]);
  const ind = datos.indicadores;

  const descargar = () => {
    const blob = new Blob([generarCsv(campos, filtradas)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${titulo.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").toLowerCase() || "formulario"}-respuestas.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="viz-root space-y-4">
      {/* Filtros en una fila, arriba de todo */}
      <div className="flex flex-wrap items-end gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs">
        <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Inspector
          <select value={inspector} onChange={(e) => setInspector(e.target.value)} className={CLASE_SELECT}>
            <option value="todos">Todos</option>
            {inspectores.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Período de envío
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={CLASE_SELECT}>
            {PERIODOS.map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </label>
        <span className="pb-2.5 text-xs font-semibold text-zinc-500">{filtradas.length} respuesta(s)</span>
        <button
          type="button"
          onClick={descargar}
          disabled={filtradas.length === 0}
          className="ml-auto rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-zinc-100 transition disabled:opacity-40"
        >
          Descargar Excel (CSV)
        </button>
      </div>

      {/* Tres indicadores del mismo alto */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Indicador
            grande
            etiqueta="Respondidas"
            valor={`${formatoNumero(ind.respondidas)} de ${formatoNumero(ind.asignadas)}`}
            nota={ind.asignadas ? `${formatoPorcentaje(ind.respondidas / ind.asignadas)} de lo asignado` : "Aún no se asigna"}
          />
        </div>
        <Indicador
          grande
          etiqueta="Pendientes"
          valor={formatoNumero(ind.pendientes)}
          nota={ind.vencidas ? `${formatoNumero(ind.vencidas)} con fecha límite vencida` : "Ninguna vencida"}
        />
        <Indicador
          grande
          etiqueta="Enviadas a tiempo"
          valor={formatoPorcentaje(ind.aTiempo)}
          nota={ind.conLimite ? `De ${formatoNumero(ind.conLimite)} con fecha límite` : "Sin fechas límite"}
        />
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400 font-medium shadow-xs">
          {respuestas.length === 0
            ? "Todavía no hay respuestas. Aparecerán aquí cuando los inspectores envíen el formulario."
            : "No hay respuestas con estos filtros."}
        </div>
      ) : (
        <>
          {datos.peoresItems.length > 0 && (
            <Tarjeta titulo="Ítems con más fallas" subtitulo="Marcados como no conforme o falla en las listas de verificación">
              <ul className="space-y-2.5">
                {datos.peoresItems.map((f) => {
                  const maximo = datos.peoresItems[0].fallas;
                  return (
                    <li key={`${f.lista}|${f.texto}`} className="grid items-center gap-x-3 gap-y-1 text-xs sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <span className="min-w-0">
                        <span className="block font-semibold text-zinc-900 sm:truncate" title={f.texto}>
                          {f.texto}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-400">{f.lista}</span>
                      </span>
                      <span className="flex items-center gap-2" title={`${f.fallas} falla(s) de ${f.marcadas} respuesta(s)`}>
                        <span className="h-3 rounded-full" style={{ width: `${(f.fallas / maximo) * 75}%`, minWidth: 6, background: "var(--viz-critical)" }} />
                        <span className="whitespace-nowrap text-xs font-bold tabular-nums text-zinc-950">
                          {f.fallas} <span className="font-normal text-zinc-400">de {f.marcadas}</span>
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Tarjeta>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-950">Resumen por pregunta</h3>
            {datos.resumenes.map((r) => (
              <ResumenPregunta key={r.id} r={r} />
            ))}
          </div>

          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
            <h3 className="border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5 text-sm font-bold text-zinc-950">Respuestas individuales</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-4">Inspector</th>
                    <th className="py-2.5 px-4">Enviada</th>
                    <th className="py-2.5 px-4">A tiempo</th>
                    <th className="py-2.5 px-4 text-right">Fallas</th>
                    <th className="py-2.5 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-900">
                  {filtradas.map((r) => {
                    const fallas = fallasDeRespuesta(campos, r);
                    return (
                      <tr key={r.id} className="hover:bg-zinc-50/70 transition">
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-zinc-950">{r.inspector}</span>
                          <span className="block text-[11px] text-zinc-400">{r.rol}</span>
                        </td>
                        <td className="py-2.5 px-4 text-zinc-500 font-medium">{r.enviadaTexto}</td>
                        <td className="py-2.5 px-4">
                          {r.aTiempo === null ? (
                            <span className="text-zinc-400">Sin límite</span>
                          ) : r.aTiempo ? (
                            <span className="font-bold text-emerald-700">✓ Sí</span>
                          ) : (
                            <span className="font-bold text-rose-600">✕ Fuera de plazo</span>
                          )}
                        </td>
                        <td className={`py-2.5 px-4 text-right tabular-nums ${fallas ? "font-black text-rose-600" : "text-zinc-400"}`}>{fallas}</td>
                        <td className="whitespace-nowrap py-2.5 px-4 text-right">
                          <Link href={`/formularios/respuesta/${r.id}`} className="font-bold text-zinc-900 hover:text-amber-600 transition">
                            Ver respuesta →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
