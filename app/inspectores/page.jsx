import { Suspense } from "react";
import ListadoInspectores from "@/modules/usuarios/components/ListadoInspectores";

export const metadata = {
  title: "Inspectores · Sistema de Inspecciones Preventivas",
};

function Cargando() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="ml-auto h-9 w-44 animate-pulse rounded bg-slate-200/70" />
      <div className="h-80 animate-pulse rounded border border-slate-200 bg-white" />
    </div>
  );
}

export default function InspectoresPage({ searchParams }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inspectores Operativos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Personal en campo asignado a la ejecución de cronogramas e inspecciones preventivas
        </p>
      </div>
      <Suspense fallback={<Cargando />}>
        <ListadoInspectores searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
