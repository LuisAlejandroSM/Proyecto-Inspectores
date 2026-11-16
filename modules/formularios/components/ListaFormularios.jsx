import { connection } from "next/server";
import { requerirAdmin } from "@/modules/auth/dal";
import { listarFormularios, obtenerInspeccionesSinFormulario } from "../queries";
import PanelFormularios from "./PanelFormularios";

// Server Component (solo administradores): lista de formularios creados e inspecciones pendientes.
export default async function ListaFormularios() {
  await connection();
  await requerirAdmin();

  let lista = [];
  let pendientes = [];
  let formulariosHuerfanos = [];
  try {
    const [forms, sinForm] = await Promise.all([
      listarFormularios(),
      obtenerInspeccionesSinFormulario(),
    ]);
    lista = forms;
    pendientes = sinForm.pendientes;
    formulariosHuerfanos = sinForm.formulariosHuerfanos;
  } catch (error) {
    console.error("[formularios] Error listando formularios:", error);
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-sm text-rose-900 shadow-xs">
        No se pudieron cargar los formularios.
      </section>
    );
  }

  return (
    <PanelFormularios
      lista={lista}
      pendientes={pendientes}
      formulariosHuerfanos={formulariosHuerfanos}
    />
  );
}
