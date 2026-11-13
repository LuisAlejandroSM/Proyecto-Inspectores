"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  eliminarNotificacion,
  marcarNotificacionLeida,
  marcarTodasLeidas,
  verificarInspeccionesVencidas,
} from "../actions";

function formatearFechaHora(fechaStr) {
  if (!fechaStr) return "";
  try {
    const d = new Date(fechaStr);
    return d.toLocaleString("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(fechaStr);
  }
}

export default function ListaNotificaciones({ notificacionesIniciales = [], estadisticasIniciales = {} }) {
  const [filtro, setFiltro] = useState("no-leidas"); // "todas" | "no-leidas" | "no-ejecutadas" | "vencidas"
  const [isPending, startTransition] = useTransition();
  const [mensajeEstado, setMensajeEstado] = useState(null);

  const notificaciones = notificacionesIniciales.filter((n) => {
    if (filtro === "no-leidas") return !n.leida;
    if (filtro === "no-ejecutadas") return n.tipo === "inspeccion_no_ejecutada";
    if (filtro === "vencidas") return n.tipo === "inspeccion_vencida";
    return true;
  });

  const handleMarcarLeida = (id) => {
    startTransition(async () => {
      const res = await marcarNotificacionLeida(id);
      if (!res?.success) setMensajeEstado(res?.error ?? "No se pudo actualizar");
    });
  };

  const handleMarcarTodasLeidas = () => {
    startTransition(async () => {
      const res = await marcarTodasLeidas();
      if (res?.success) {
        setMensajeEstado("Todas las notificaciones fueron marcadas como leídas.");
      } else {
        setMensajeEstado(res?.error ?? "Error al actualizar");
      }
    });
  };

  const handleEliminar = (id) => {
    if (!window.confirm("¿Eliminar esta notificación?")) return;
    startTransition(async () => {
      const res = await eliminarNotificacion(id);
      if (!res?.success) setMensajeEstado(res?.error ?? "Error al eliminar");
    });
  };

  const handleVerificarVencidas = () => {
    startTransition(async () => {
      setMensajeEstado("Verificando inspecciones planificadas no realizadas...");
      const res = await verificarInspeccionesVencidas();
      if (res?.generadas > 0) {
        setMensajeEstado(`Se detectaron ${res.generadas} inspecciones vencidas.`);
      } else {
        setMensajeEstado("No se encontraron nuevas inspecciones vencidas.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Barra de control superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs">
        {/* Pestañas de filtro */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={filtro === "no-leidas"}
            onClick={() => setFiltro("no-leidas")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              filtro === "no-leidas"
                ? "bg-[#09090b] text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <span>No leídas</span>
            {estadisticasIniciales.noLeidas > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                filtro === "no-leidas" ? "bg-amber-500 text-[#09090b]" : "bg-zinc-300 text-zinc-800"
              }`}>
                {estadisticasIniciales.noLeidas}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filtro === "no-ejecutadas"}
            onClick={() => setFiltro("no-ejecutadas")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              filtro === "no-ejecutadas"
                ? "bg-[#09090b] text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <span>No ejecutadas (N)</span>
            {estadisticasIniciales.noEjecutadas > 0 && (
              <span className="rounded-full bg-rose-100 border border-rose-200 px-1.5 py-0.2 text-[10px] font-bold text-rose-700">
                {estadisticasIniciales.noEjecutadas}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filtro === "vencidas"}
            onClick={() => setFiltro("vencidas")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              filtro === "vencidas"
                ? "bg-[#09090b] text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <span>Vencidas</span>
            {estadisticasIniciales.vencidas > 0 && (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                {estadisticasIniciales.vencidas}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filtro === "todas"}
            onClick={() => setFiltro("todas")}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              filtro === "todas"
                ? "bg-[#09090b] text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Todas ({estadisticasIniciales.total ?? 0})
          </button>
        </div>

        {/* Acciones globales */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleVerificarVencidas}
            disabled={isPending}
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-100 transition disabled:opacity-50"
            title="Escanear inspecciones planificadas en días pasados que no fueron ejecutadas"
          >
            Escanear vencidas
          </button>

          {estadisticasIniciales.noLeidas > 0 && (
            <button
              type="button"
              onClick={handleMarcarTodasLeidas}
              disabled={isPending}
              className="rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white px-3.5 py-2 text-xs font-bold shadow-xs active:scale-[0.98] transition disabled:opacity-50"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {mensajeEstado && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs font-bold text-zinc-800 shadow-xs">
          <span>{mensajeEstado}</span>
          <button
            type="button"
            onClick={() => setMensajeEstado(null)}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-700 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Lista de tarjetas */}
      {notificaciones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 font-black text-xl border border-emerald-200">
            ✓
          </div>
          <h3 className="mt-3.5 text-sm font-bold text-zinc-950">
            {filtro === "no-leidas" ? "No tienes notificaciones pendientes" : "Sin notificaciones en este filtro"}
          </h3>
          <p className="mt-1 text-xs text-zinc-400 font-medium">
            Cuando un inspector marque una inspección como no realizada o expire su fecha, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notificaciones.map((n) => {
            const esNoEjecutada = n.tipo === "inspeccion_no_ejecutada";
            const datos = n.datos ?? {};
            const inspectorNombre = n.inspectorNombre || datos.inspectorNombre || "Inspector";
            const inspectorRol = n.inspectorRol || datos.inspectorRol || "Operativo";

            const params = new URLSearchParams();
            if (n.inspectorId) params.set("usuario", n.inspectorId);
            if (datos.mes) params.set("mes", datos.mes);
            if (datos.anio) params.set("anio", String(datos.anio));
            const enlaceCronograma = `/?${params.toString()}`;

            return (
              <article
                key={n.id}
                className={`relative flex flex-col justify-between gap-4 rounded-2xl border p-5 transition md:flex-row md:items-start ${
                  n.leida
                    ? "border-zinc-200 bg-white/70 text-zinc-700 shadow-xs"
                    : esNoEjecutada
                    ? "border-rose-200 bg-white text-zinc-950 shadow-xs ring-1 ring-rose-300"
                    : "border-amber-200 bg-white text-zinc-950 shadow-xs ring-1 ring-amber-300"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                      esNoEjecutada
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {esNoEjecutada ? "N" : "EXP"}
                  </span>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-bold border ${
                          esNoEjecutada
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-300"
                        }`}
                      >
                        {esNoEjecutada ? "No ejecutada (N)" : "Vencida sin completar"}
                      </span>

                      {!n.leida && (
                        <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-pulse" title="Sin leer" />
                      )}

                      <span className="text-xs text-zinc-400 font-medium">
                        {formatearFechaHora(n.creadoEn)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-zinc-950">{n.titulo}</h4>
                    <p className="text-xs leading-relaxed text-zinc-600">{n.mensaje}</p>

                    {/* Observación / Justificación registrada */}
                    {datos.observacion && (
                      <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-xs text-zinc-800">
                        <span className="font-bold text-rose-800">Motivo del inspector:</span>{" "}
                        <span className="italic font-medium">&quot;{datos.observacion}&quot;</span>
                      </div>
                    )}

                    {/* Fila de metadatos */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-500 font-medium">
                      <span className="rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 font-bold text-zinc-700">
                        {inspectorNombre} ({inspectorRol})
                      </span>
                      {datos.elementoNombre && (
                        <span className="rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5">
                          {datos.elementoNombre} {datos.codigoFormato ? `[${datos.codigoFormato}]` : ""}
                        </span>
                      )}
                      {datos.dia && datos.mes && (
                        <span className="rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5">
                          Día {datos.dia} de {datos.mes} {datos.anio ?? ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones de la tarjeta */}
                <div className="flex shrink-0 items-center gap-2 self-end md:self-start">
                  <Link
                    href={enlaceCronograma}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-3 py-1.5 text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition"
                    title="Ver cronograma del inspector"
                  >
                    Ver matriz →
                  </Link>

                  {!n.leida ? (
                    <button
                      type="button"
                      onClick={() => handleMarcarLeida(n.id)}
                      disabled={isPending}
                      className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50"
                      title="Marcar como leída"
                    >
                      ✓ Leída
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-zinc-400">Leída</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleEliminar(n.id)}
                    disabled={isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                    title="Eliminar notificación"
                    aria-label="Eliminar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
