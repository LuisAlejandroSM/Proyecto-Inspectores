import Link from "next/link";
import { connection } from "next/server";
import { requerirAdmin } from "@/modules/auth/dal";
import { cargarFormatosParaVincular } from "../formatos";
import EditorFormulario from "./EditorFormulario";

// Server Component (solo administradores): constructor vacío para un formulario nuevo.
export default async function NuevoFormulario() {
  await connection();
  await requerirAdmin();
  const formatos = await cargarFormatosParaVincular();
  return (
    <div className="space-y-4">
      <div>
        <Link href="/formularios" className="text-sm font-semibold text-blue-700 hover:underline">
          ← Formularios
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Nuevo Formulario</h1>
      </div>
      <EditorFormulario formulario={null} formatos={formatos} />
    </div>
  );
}
