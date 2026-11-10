import { Suspense } from "react";
import CronogramaMensual from "@/modules/cronogramas/components/CronogramaMensual";

// Filtros por URL (searchParams):
//   ?vista=inspector-siho|paramedicos|rescatistas
//   &mes=Enero..Diciembre  &anio=2026  &usuario=<uuid del inspector>
// Ejemplo: /?vista=inspector-siho&mes=Noviembre&anio=2026

function CargandoCronograma() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-10 animate-pulse rounded bg-slate-200/70" />
      <div className="h-16 animate-pulse rounded border border-slate-200 bg-white" />
      <div className="h-40 animate-pulse rounded border border-slate-200 bg-white" />
      <div className="h-96 animate-pulse rounded border border-slate-200 bg-white" />
    </div>
  );
}

export default function Page({ searchParams }) {
  // searchParams se pasa como promesa y se resuelve dentro del Suspense,
  // así el layout forma parte del shell estático prerenderizado.
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cronogramas de Inspección</h1>
        <p className="mt-1 text-sm text-slate-500">Planificación mensual de inspecciones operativas por rol (formato CVC-SST-FT-11)</p>
      </div>
      <Suspense fallback={<CargandoCronograma />}>
        <CronogramaMensual searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
