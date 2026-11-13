import { Suspense } from "react";
import BarraEstadoOffline from "@/modules/formularios/components/BarraEstadoOffline";
import Cargando from "@/modules/formularios/components/Cargando";
import MisFormularios from "@/modules/formularios/components/MisFormularios";

export const metadata = {
  title: "Mis formularios · Sistema de Inspecciones Preventivas",
};

export default function MisFormulariosPage() {
  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-2xl space-y-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-950">Mis Formularios</h1>
          <p className="mt-1 text-sm text-zinc-500 font-medium">Formularios asignados para completar en campo</p>
        </div>
        <BarraEstadoOffline />
      </div>
      <Suspense fallback={<Cargando />}>
        <MisFormularios />
      </Suspense>
    </div>
  );
}
