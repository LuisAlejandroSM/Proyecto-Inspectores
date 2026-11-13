import { Suspense } from "react";
import CronogramaMensual from "@/modules/cronogramas/components/CronogramaMensual";

// Filtros por URL (searchParams):
//   ?vista=inspector-siho|paramedicos|rescatistas
//   &mes=Enero..Diciembre  &anio=2026  &usuario=<uuid del inspector>
// Ejemplo: /?vista=inspector-siho&mes=Noviembre&anio=2026

function CargandoCronograma() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-10 animate-pulse rounded-2xl bg-zinc-200/60" />
      <div className="h-20 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
      <div className="h-40 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
      <div className="h-96 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
    </div>
  );
}

export default function Page({ searchParams }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-950">Cronogramas de Inspección</h1>
        <p className="mt-1 text-sm text-zinc-500">Planificación mensual de inspecciones operativas por rol (formato CVC-SST-FT-11)</p>
      </div>
      <Suspense fallback={<CargandoCronograma />}>
        <CronogramaMensual searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
