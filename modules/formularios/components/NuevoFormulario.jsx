import Link from "next/link";
import { connection } from "next/server";
import { requerirAdmin } from "@/modules/auth/dal";
import { cargarFormatosParaVincular } from "../formatos";
import EditorFormulario from "./EditorFormulario";

// Server Component (solo administradores): constructor vacío para un formulario nuevo.
export default async function NuevoFormulario({ searchParams }) {
  await connection();
  await requerirAdmin();
  const formatos = await cargarFormatosParaVincular();

  const valoresIniciales = searchParams
    ? {
        plantillaId: searchParams.plantillaId || "",
        rol: searchParams.rol || "",
        titulo: searchParams.titulo || "",
        codigo: searchParams.codigo || "",
      }
    : null;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/formularios" className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition">
          <span aria-hidden="true">←</span> Formularios
        </Link>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">Nuevo Formulario</h1>
      </div>
      <EditorFormulario formulario={null} formatos={formatos} valoresIniciales={valoresIniciales} />
    </div>
  );
}
