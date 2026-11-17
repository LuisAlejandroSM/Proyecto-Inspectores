import { Suspense } from "react";
import DashboardMetricas from "@/modules/dashboard/components/DashboardMetricas";
import AlertaDashboardNotificaciones from "@/modules/notificaciones/components/AlertaDashboardNotificaciones";

export const metadata = {
  title: "Dashboard · Sistema de Inspecciones Preventivas",
};

// Filtros por URL: ?mes=Enero..Diciembre&anio=2026&rol=todos|inspector-siho|paramedicos|rescatistas

function Cargando() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-20 animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
    </div>
  );
}

export default function DashboardPage({ searchParams }) {
  return (
    <div className="space-y-5">
      <Suspense fallback={null}>
        <AlertaDashboardNotificaciones />
      </Suspense>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard de Métricas</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Control analítico de inspecciones preventivas, efectividad operacional y cobertura SST
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Operación Activa
          </span>
        </div>
      </div>
      <Suspense fallback={<Cargando />}>
        <DashboardMetricas searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
