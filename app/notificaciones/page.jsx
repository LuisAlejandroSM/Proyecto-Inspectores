import { Suspense } from "react";
import PanelNotificaciones from "@/modules/notificaciones/components/PanelNotificaciones";

export const metadata = {
  title: "Notificaciones de Inspecciones · Sistema de Inspecciones Preventivas",
};

function Cargando() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-14 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
        <div className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
      </div>
    </div>
  );
}

export default function NotificacionesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-950">
              Notificaciones y Alertas
            </h1>
            <p className="mt-1 text-sm text-zinc-500 font-medium">
              Control de inspecciones no ejecutadas (N), justificaciones de inspectores y formatos pendientes
            </p>
          </div>
        </div>
      </header>

      <Suspense fallback={<Cargando />}>
        <PanelNotificaciones />
      </Suspense>
    </div>
  );
}
