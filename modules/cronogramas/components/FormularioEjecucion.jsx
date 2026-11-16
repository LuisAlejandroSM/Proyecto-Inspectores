"use client";

import { useState, useTransition } from "react";
import { esSemanaVencida, semanaDelMes } from "../constants";
import { registrarEjecucion } from "../actions";

const MAX_OBSERVACION = 1000;

/**
 * Formulario para que el inspector registre el resultado de UNA inspección asignada:
 * cantidad realizada (− / +), "No se ejecutó (N)" y observación. Se usa en el panel que se
 * abre al tocar una celda de la matriz.
 * Si la semana ya concluyó y no se ejecutó a tiempo, se bloquea la ejecución retroactiva
 * y solo se permite marcar "No ejecutada (N)" con motivo obligatorio.
 * @param {{ item: { plantillaId: string, dia: number, ejecutado: number, noEjecutado: number, observacion: string|null },
 *           mes: string, anio: number, onGuardado?: () => void }} props
 */
export default function FormularioEjecucion({ item, mes, anio, onGuardado }) {
  const [isPending, startTransition] = useTransition();

  const vencida = esSemanaVencida(item.dia, mes, anio);
  const bloqueadaPorVencimiento = vencida && !item.ejecutado;
  const semanaTexto = semanaDelMes(item.dia);

  const [cantidad, setCantidad] = useState(bloqueadaPorVencimiento ? 0 : (item.ejecutado || 0));
  const [noEjecutada, setNoEjecutada] = useState(bloqueadaPorVencimiento ? true : (item.noEjecutado > 0));
  const [observacion, setObservacion] = useState(item.observacion ?? "");
  const [estado, setEstado] = useState({ tipo: "idle", texto: "" });
  const [errorValidacion, setErrorValidacion] = useState("");

  const registrada = item.ejecutado > 0 || item.noEjecutado > 0;
  const cambio =
    cantidad !== (item.ejecutado || 0) ||
    noEjecutada !== (item.noEjecutado > 0) ||
    observacion.trim() !== (item.observacion ?? "");

  const guardar = () => {
    setErrorValidacion("");

    if (bloqueadaPorVencimiento) {
      if (!observacion.trim()) {
        setErrorValidacion("Debe escribir el motivo por el cual no se realizó la inspección.");
        return;
      }
      if (observacion.trim().length < 5) {
        setErrorValidacion("El motivo de no ejecución debe tener al menos 5 caracteres.");
        return;
      }
    } else {
      if (noEjecutada && !observacion.trim()) {
        setErrorValidacion("Al marcar No ejecutada (N), escriba el motivo en la observación.");
        return;
      }
      if (!noEjecutada && cantidad === 0 && !window.confirm("No indicó cantidad ni marcó N. ¿Guardar igualmente?")) {
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await registrarEjecucion({
          plantillaId: item.plantillaId,
          mes,
          anio,
          dia: item.dia,
          ejecutado: bloqueadaPorVencimiento ? 0 : (noEjecutada ? 0 : cantidad),
          noEjecutado: bloqueadaPorVencimiento ? true : noEjecutada,
          observacion: observacion.trim(),
        });
        if (res?.success) {
          setEstado({ tipo: "ok", texto: "Guardado ✓" });
          onGuardado?.();
        } else {
          setEstado({ tipo: "error", texto: res?.error ?? "No se pudo guardar." });
        }
      } catch {
        setEstado({ tipo: "error", texto: "Sin conexión. Intente de nuevo." });
      }
    });
  };

  return (
    <div className="space-y-4">
      {bloqueadaPorVencimiento ? (
        /* Caso: Semana planificada ya concluyó (bloqueo antifalsificación) */
        <>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-rose-950">
              <svg className="h-4 w-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Plazo de {semanaTexto} concluido (No ejecutada)
            </div>
            <p className="text-zinc-600 leading-relaxed">
              Esta inspección correspondía a una semana anterior que ya cerró. Para asegurar la veracidad de la auditoría y evitar falsificaciones, debe registrarse como <strong>No ejecutada (N)</strong> indicando obligatoriamente el motivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-100 px-3.5 py-2 text-xs font-bold text-rose-900 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-rose-600" />
              Estado: No se ejecutó (N)
            </span>
          </div>

          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
            Motivo por el cual no se realizó *
            <textarea
              rows={3}
              maxLength={MAX_OBSERVACION}
              value={observacion}
              disabled={isPending}
              required
              onChange={(e) => {
                setObservacion(e.target.value);
                if (errorValidacion) setErrorValidacion("");
              }}
              placeholder="Explique detalladamente por qué no se pudo realizar (ej. equipo en taller mecánico, condiciones climáticas adversas, operador ausente)..."
              className="mt-1.5 w-full rounded-xl border border-rose-300 bg-white p-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 outline-none transition"
            />
          </label>
        </>
      ) : (
        /* Caso normal: Semana en curso */
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5" aria-label="Cantidad ejecutada">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(0, c - 1))}
                disabled={noEjecutada || isPending}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-base font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition"
                aria-label="Restar uno"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={999}
                value={noEjecutada ? 0 : cantidad}
                disabled={noEjecutada || isPending}
                onChange={(e) => setCantidad(Math.min(999, Math.max(0, Number.parseInt(e.target.value, 10) || 0)))}
                className="h-10 w-16 rounded-xl border border-zinc-200 bg-white text-center text-sm font-bold tabular-nums text-zinc-950 focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 outline-none disabled:bg-zinc-100"
                aria-label="Cantidad de inspecciones realizadas"
              />
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.min(999, c + 1))}
                disabled={noEjecutada || isPending}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-base font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition"
                aria-label="Sumar uno"
              >
                +
              </button>
              <span className="ml-1 text-xs font-medium text-zinc-500">realizadas</span>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-2 text-xs font-bold text-rose-700 shadow-2xs">
              <input
                type="checkbox"
                checked={noEjecutada}
                disabled={isPending}
                onChange={(e) => setNoEjecutada(e.target.checked)}
                className="h-4 w-4 rounded border-rose-300 accent-rose-600"
              />
              No se ejecutó (N)
            </label>
          </div>

          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
            Observación / hallazgo {noEjecutada ? "*" : ""}
            <textarea
              rows={3}
              maxLength={MAX_OBSERVACION}
              value={observacion}
              disabled={isPending}
              onChange={(e) => {
                setObservacion(e.target.value);
                if (errorValidacion) setErrorValidacion("");
              }}
              placeholder={
                noEjecutada
                  ? "Indique el motivo por el cual no se realizó la inspección..."
                  : "Ej. Extintor con presión baja, se reportó a mantenimiento."
              }
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-[#f5b800] focus:ring-4 focus:ring-[#f5b800]/20 outline-none transition"
            />
          </label>
        </>
      )}

      {errorValidacion && (
        <p className="text-xs font-bold text-rose-600">{errorValidacion}</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        {estado.texto && (
          <span
            aria-live="polite"
            className={`text-xs font-semibold ${estado.tipo === "error" ? "text-rose-600" : "text-emerald-700"}`}
          >
            {estado.texto}
          </span>
        )}
        <button
          type="button"
          onClick={guardar}
          disabled={isPending || (!cambio && registrada)}
          className={`rounded-xl px-4 py-2 text-xs font-bold shadow-xs active:scale-[0.98] transition disabled:opacity-40 ${
            bloqueadaPorVencimiento
              ? "bg-rose-600 hover:bg-rose-700 text-white"
              : "bg-[#f5b800] hover:bg-[#e0a800] text-[#09090b]"
          }`}
        >
          {isPending
            ? "Guardando…"
            : bloqueadaPorVencimiento
            ? registrada
              ? "Actualizar motivo (N)"
              : "Registrar No ejecutada (N)"
            : registrada
            ? "Actualizar registro"
            : "Guardar registro"}
        </button>
      </div>
    </div>
  );
}
