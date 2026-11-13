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
      <div className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
    </div>
  );
}

export default function DashboardPage({ searchParams }) {
  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <AlertaDashboardNotificaciones />
      </Suspense>
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-950">Dashboard de Métricas</h1>
        <p className="mt-1 text-sm text-zinc-500">Indicadores clave de inspecciones preventivas y efectividad operativa mensual</p>
      </div>
      <Suspense fallback={<Cargando />}>
        <DashboardMetricas searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
