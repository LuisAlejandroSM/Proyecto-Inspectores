import { connection } from "next/server";
import Link from "next/link";
import { obtenerNotificaciones } from "../queries";

export default async function AlertaDashboardNotificaciones() {
  await connection();
  const sinLeer = await obtenerNotificaciones({ limite: 3, soloNoLeidas: true });

  if (sinLeer.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-950">
                Atención: Inspecciones no completadas ({sinLeer.length})
              </h3>
              <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                Pendientes de revisión
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Hay inspectores que reportaron no haber ejecutado inspecciones asignadas o que tienen formatos pendientes.
            </p>
          </div>
        </div>

        <Link
          href="/notificaciones"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#09090b] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 active:scale-[0.98] transition"
        >
          <span>Ver todas las alertas</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Vista previa de las alertas recientes */}
      <div className="mt-3.5 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-zinc-50/50">
        {sinLeer.map((n) => (
          <div key={n.id} className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:px-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                {n.tipo === "inspeccion_no_ejecutada" ? "N" : "Vencida"}
              </span>
              <span className="font-semibold text-zinc-900 shrink-0">{n.inspectorNombre}:</span>
              <span className="text-zinc-600 truncate max-w-sm sm:max-w-md">{n.titulo}</span>
            </div>
            {n.datos?.observacion && (
              <span className="italic text-zinc-400 truncate max-w-xs text-[11px]">
                &quot;{n.datos.observacion}&quot;
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
