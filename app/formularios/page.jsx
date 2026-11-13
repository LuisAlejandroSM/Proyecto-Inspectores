import { Suspense } from "react";
import Cargando from "@/modules/formularios/components/Cargando";
import ListaFormularios from "@/modules/formularios/components/ListaFormularios";

export const metadata = {
  title: "Formularios · Sistema de Inspecciones Preventivas",
};

export default function FormulariosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-950">Formularios de Inspección</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Diseño y asignación de formatos de inspección digital con listas de verificación, fotos y firmas
        </p>
      </div>
      <Suspense fallback={<Cargando />}>
        <ListaFormularios />
      </Suspense>
    </div>
  );
}
