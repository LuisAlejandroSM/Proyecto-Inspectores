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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
        {/* Pestañas de filtro */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={filtro === "no-leidas"}
            onClick={() => setFiltro("no-leidas")}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              filtro === "no-leidas"
                ? "bg-[#0f1420] text-white shadow-sm ring-1 ring-white/10"
                : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            <span>No leídas</span>
            {estadisticasIniciales.noLeidas > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                filtro === "no-leidas" ? "bg-red-500 text-white" : "bg-red-600 text-white"
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
                ? "bg-rose-700 text-white shadow-sm"
                : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            <span>No ejecutadas (N)</span>
            {estadisticasIniciales.noEjecutadas > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-800">
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
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            <span>Vencidas</span>
            {estadisticasIniciales.vencidas > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
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
                ? "bg-[#0f1420] text-white shadow-sm ring-1 ring-white/10"
                : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80"
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
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
            title="Escanear inspecciones planificadas en días pasados que no fueron ejecutadas"
          >
            Escanear vencidas
          </button>

          {estadisticasIniciales.noLeidas > 0 && (
            <button
              type="button"
              onClick={handleMarcarTodasLeidas}
              disabled={isPending}
              className="rounded-xl bg-[#0f1420] px-3.5 py-2 text-xs font-bold text-white shadow-sm ring-1 ring-white/10 hover:bg-[#1a2337] active:scale-[0.98] transition disabled:opacity-50"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
      </div>

      {mensajeEstado && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-900">
          <span>{mensajeEstado}</span>
          <button
            type="button"
            onClick={() => setMensajeEstado(null)}
            className="text-xs font-bold text-blue-700 hover:text-blue-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Lista de tarjetas */}
      {notificaciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
            ✓
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-800">
            {filtro === "no-leidas" ? "No tienes notificaciones pendientes" : "Sin notificaciones en este filtro"}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
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

            // Enlace al cronograma de ese inspector en ese mes
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
                    ? "border-slate-200/90 bg-white/70 text-slate-700 shadow-2xs"
                    : esNoEjecutada
                    ? "border-rose-200 bg-rose-50/30 text-slate-900 shadow-sm ring-1 ring-rose-400/20"
                    : "border-amber-200 bg-amber-50/30 text-slate-900 shadow-sm ring-1 ring-amber-400/20"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Ícono de tipo */}
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      esNoEjecutada
                        ? "bg-rose-100 text-rose-700 border border-rose-200/60"
                        : "bg-amber-100 text-amber-800 border border-amber-200/60"
                    }`}
                  >
                    {esNoEjecutada ? "N" : "EXP"}
                  </span>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          esNoEjecutada
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {esNoEjecutada ? "No ejecutada (N)" : "Vencida sin completar"}
                      </span>

                      {!n.leida && (
                        <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" title="Sin leer" />
                      )}

                      <span className="text-xs text-slate-500">
                        {formatearFechaHora(n.creadoEn)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{n.titulo}</h4>
                    <p className="text-xs leading-relaxed text-slate-700">{n.mensaje}</p>

                    {/* Observación / Justificación registrada */}
                    {datos.observacion && (
                      <div className="mt-2 rounded-xl border border-rose-200/80 bg-white p-3 text-xs text-slate-800 shadow-2xs">
                        <span className="font-bold text-rose-800">Motivo del inspector:</span>{" "}
                        <span className="italic">&quot;{datos.observacion}&quot;</span>
                      </div>
                    )}

                    {/* Fila de metadatos */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600">
                      <span className="rounded bg-slate-200/70 px-2 py-0.5 font-medium">
                        👤 {inspectorNombre} ({inspectorRol})
                      </span>
                      {datos.elementoNombre && (
                        <span className="rounded bg-slate-200/70 px-2 py-0.5 font-medium">
                          📋 {datos.elementoNombre} {datos.codigoFormato ? `[${datos.codigoFormato}]` : ""}
                        </span>
                      )}
                      {datos.dia && datos.mes && (
                        <span className="rounded bg-slate-200/70 px-2 py-0.5 font-medium">
                          📅 Día {datos.dia} de {datos.mes} {datos.anio ?? ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones de la tarjeta */}
                <div className="flex shrink-0 items-center gap-2 self-end md:self-start">
                  <Link
                    href={enlaceCronograma}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                    title="Ver cronograma del inspector"
                  >
                    📊 Ver matriz
                  </Link>

                  {!n.leida ? (
                    <button
                      type="button"
                      onClick={() => handleMarcarLeida(n.id)}
                      disabled={isPending}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                      title="Marcar como leída"
                    >
                      ✓ Leída
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-600">Leída</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleEliminar(n.id)}
                    disabled={isPending}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Eliminar notificación"
                    aria-label="Eliminar"
                  >
                    🗑️
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
