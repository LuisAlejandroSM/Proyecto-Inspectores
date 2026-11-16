import { Suspense } from "react";
import Cargando from "@/modules/formularios/components/Cargando";
import NuevoFormulario from "@/modules/formularios/components/NuevoFormulario";

export const metadata = {
  title: "Nuevo formulario · Sistema de Inspecciones Preventivas",
};

export default async function NuevoFormularioPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<Cargando />}>
      <NuevoFormulario searchParams={sp} />
    </Suspense>
  );
}
