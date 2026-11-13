"use client";

import { useMemo, useState, useTransition } from "react";
import { generarCronograma } from "../actions";
import {
  DESCRIPCION_REGLA,
  DIAS_ASIGNABLES,
  diaSemanaPorDefecto,
  planificarDias,
  tipoPeriodicidad,
  usaDiaDeSemana,
} from "../planificacion";
import { hayCambiosPendientes } from "./cambiosPendientes";

/**
 * Asistente para generar el cronograma mensual de un inspector:
 * se eligen los formatos que le corresponden y el día de la semana en que hará cada uno;
 * el servidor coloca las "P" según la periodicidad. Luego se ajusta a mano en la matriz.
 */
export default function GeneradorCronograma({
  usuarioId,
  usuarioNombre,
  mes,
  anio,
  plantillas,
  asignacionActual,
}) {
  const tienePlan = Object.keys(asignacionActual).length > 0;
  const [abierto, setAbierto] = useState(!tienePlan);
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState({ tipo: "idle", texto: "" });

  // Estado por formato: { incluido, diaSemana }. Si ya hay plan, parte de lo asignado.
  const [config, setConfig] = useState(() =>
    Object.fromEntries(
      plantillas.map((p, i) => [
        p.id,
        {
          incluido: tienePlan ? Boolean(asignacionActual[p.id]) : true,
          diaSemana: asignacionActual[p.id] ?? diaSemanaPorDefecto(i),
        },
      ])
    )
  );

  const vistaPrevia = useMemo(() => {
    const porPlantilla = {};
    const porDia = Object.fromEntries(DIAS_ASIGNABLES.map((d) => [d.valor, 0]));
    let total = 0;
    let formatos = 0;
    for (const p of plantillas) {
      const c = config[p.id];
      if (!c?.incluido) continue;
      const dias = planificarDias({
        periodicidad: p.periodicidad,
        cantidadPlanificada: p.cantidadPlanificada,
        diaSemana: c.diaSemana,
        mes,
        anio,
      });
      porPlantilla[p.id] = dias;
      total += dias.length;
      formatos += 1;
      if (usaDiaDeSemana(p.periodicidad)) porDia[c.diaSemana] += dias.length;
    }
    return { porPlantilla, porDia, total, formatos };
  }, [config, plantillas, mes, anio]);

  // Formatos agregados al catálogo después de abrir el generador: sin asignar, lunes por defecto.
  const configDe = (id) => config[id] ?? { incluido: false, diaSemana: 1 };

  const actualizar = (id, cambio) =>
    setConfig((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { incluido: false, diaSemana: 1 }), ...cambio },
    }));

  const marcarTodos = (incluido) =>
    setConfig((prev) =>
      Object.fromEntries(Object.entries(prev).map(([id, c]) => [id, { ...c, incluido }]))
    );

  const handleGenerar = () => {
    if (hayCambiosPendientes()) {
      setMensaje({ tipo: "error", texto: "Guarde o descarte primero los cambios pendientes de la matriz." });
      return;
    }
    if (
      tienePlan &&
      !window.confirm(
        `Se reemplazarán todas las P de ${mes} ${anio} de ${usuarioNombre}. Las ejecuciones ya registradas se conservan. ¿Continuar?`
      )
    ) {
      return;
    }

    const asignaciones = plantillas
      .filter((p) => config[p.id]?.incluido)
      .map((p) => ({ plantillaId: p.id, diaSemana: config[p.id].diaSemana }));

    startTransition(async () => {
      try {
        const res = await generarCronograma({ usuarioId, mes, anio, asignaciones });
        if (res?.success) {
          setMensaje({
            tipo: "ok",
            texto: `Cronograma generado: ${res.planificadas} inspección(es) planificadas en ${res.formatos} formato(s).`,
          });
          setAbierto(false);
        } else {
          setMensaje({ tipo: "error", texto: res?.error ?? "No se pudo generar el cronograma." });
        }
      } catch {
        setMensaje({ tipo: "error", texto: "Sin conexión con el servidor." });
      }
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5">
        <div>
          <h2 className="text-sm font-bold text-zinc-950 tracking-tight">
            Generar cronograma · {usuarioNombre} · {mes} {anio}
          </h2>
          <p className="text-xs text-zinc-500">
            {tienePlan
              ? "Este inspector ya tiene planificación este mes. Puede regenerarla o ajustarla en la matriz."
              : "Elija los formatos que le corresponden y el día de la semana en que hará cada uno."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {mensaje.texto && (
            <span
              aria-live="polite"
              className={`text-xs font-semibold ${mensaje.tipo === "error" ? "text-rose-600" : "text-emerald-700"}`}
            >
              {mensaje.texto}
            </span>
          )}
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            className="rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition"
          >
            {abierto ? "Ocultar" : tienePlan ? "Regenerar plan" : "Generar plan"}
          </button>
        </div>
      </div>

      {abierto && (
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => marcarTodos(true)}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-semibold text-zinc-700 hover:bg-zinc-100 transition"
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => marcarTodos(false)}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-semibold text-zinc-700 hover:bg-zinc-100 transition"
              >
                Ninguno
              </button>
            </div>
            <dl className="flex flex-wrap gap-4 text-zinc-600">
              {DIAS_ASIGNABLES.map((d) => (
                <div key={d.valor} className="flex gap-1.5">
                  <dt className="font-semibold text-zinc-500">{d.etiqueta}</dt>
                  <dd className="font-bold tabular-nums text-zinc-900">{vistaPrevia.porDia[d.valor]}</dd>
                </div>
              ))}
              <div className="flex gap-1.5 border-l border-zinc-200 pl-4">
                <dt className="font-bold text-zinc-700">Total P</dt>
                <dd className="font-black tabular-nums text-zinc-950">{vistaPrevia.total}</dd>
              </div>
            </dl>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-zinc-50 text-xs font-semibold text-zinc-600 border-b border-zinc-200">
                <tr>
                  <th className="w-10 p-2.5 text-center">Asignar</th>
                  <th className="w-10 p-2.5 text-center">N°</th>
                  <th className="p-2.5">Elemento a inspeccionar</th>
                  <th className="p-2.5">Periodicidad</th>
                  <th className="w-24 p-2.5">Día</th>
                  <th className="p-2.5">Días planificados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {plantillas.map((p, indice) => {
                  const c = configDe(p.id);
                  const tipo = tipoPeriodicidad(p.periodicidad);
                  const dias = vistaPrevia.porPlantilla[p.id] ?? [];
                  const conDia = usaDiaDeSemana(p.periodicidad);
                  return (
                    <tr key={p.id} className={`hover:bg-zinc-50/70 transition ${c.incluido ? "" : "opacity-50"}`}>
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={c.incluido}
                          onChange={(e) => actualizar(p.id, { incluido: e.target.checked })}
                          aria-label={`Asignar ${p.elementoNombre}`}
                          className="h-4 w-4 rounded border-zinc-300 accent-[#f5b800]"
                        />
                      </td>
                      <td className="p-2.5 text-center tabular-nums text-zinc-400 font-medium">{indice + 1}</td>
                      <td className="p-2.5 font-medium text-zinc-900">
                        {p.elementoNombre}
                        <span className="ml-1 font-mono text-[10px] font-normal text-zinc-400">{p.codigoFormato}</span>
                      </td>
                      <td className="p-2.5 text-zinc-600">
                        <span className="block max-w-[220px] truncate" title={p.periodicidad}>
                          {p.periodicidad}
                        </span>
                        <span className="text-[10px] text-zinc-400">{DESCRIPCION_REGLA[tipo]}</span>
                      </td>
                      <td className="p-2.5">
                        {conDia ? (
                          <select
                            value={c.diaSemana}
                            disabled={!c.incluido}
                            onChange={(e) => actualizar(p.id, { diaSemana: Number(e.target.value) })}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-900 focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition outline-none"
                          >
                            {DIAS_ASIGNABLES.map((d) => (
                              <option key={d.valor} value={d.valor}>
                                {d.etiqueta}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400">LUN–VIE</span>
                        )}
                      </td>
                      <td className="p-2.5 tabular-nums text-zinc-600">
                        {c.incluido ? (
                          <>
                            <span className="font-bold text-zinc-950">{dias.length} P</span>
                            {dias.length > 0 && dias.length <= 8 && (
                              <span className="ml-1 text-zinc-400">({dias.join(", ")})</span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <span className="text-xs text-zinc-500 font-medium">
              {vistaPrevia.formatos} formato(s) · {vistaPrevia.total} inspección(es) en el mes
            </span>
            <button
              type="button"
              onClick={handleGenerar}
              disabled={isPending}
              className="rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-4 py-2 text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Generando…" : tienePlan ? "Regenerar cronograma" : "Generar cronograma"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
