import { Suspense } from "react";
import ListadoInspectores from "@/modules/usuarios/components/ListadoInspectores";

export const metadata = {
  title: "Inspectores · Sistema de Inspecciones Preventivas",
};

function Cargando() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="ml-auto h-9 w-44 animate-pulse rounded-2xl bg-zinc-200/60" />
      <div className="h-80 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
    </div>
  );
}

export default function InspectoresPage({ searchParams }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-950">Inspectores Operativos</h1>
        <p className="mt-1 text-sm text-zinc-500 font-medium">
          Personal en campo asignado a la ejecución de cronogramas e inspecciones preventivas
        </p>
      </div>
      <Suspense fallback={<Cargando />}>
        <ListadoInspectores searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
