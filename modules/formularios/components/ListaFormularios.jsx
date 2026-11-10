import Link from "next/link";
import { connection } from "next/server";
import { requerirAdmin } from "@/modules/auth/dal";
import { TIPOS_CAMPO } from "../campos";
import { textoFechaHora } from "../fechas";
import { listarFormularios } from "../queries";
import BotonArchivar from "./BotonArchivar";
import BotonEliminarFormulario from "./BotonEliminarFormulario";

// Server Component (solo administradores): lista de formularios creados.
export default async function ListaFormularios() {
  await connection();
  await requerirAdmin();

  let lista;
  try {
    lista = await listarFormularios();
  } catch (error) {
    console.error("[formularios] Error listando formularios:", error);
    return (
      <section className="rounded border border-red-300 bg-red-50 p-6 text-sm text-red-900">
        No se pudieron cargar los formularios.
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/formularios/nuevo"
          className="rounded-xl bg-[#0f1420] px-4 py-2 text-xs font-bold text-white shadow-sm ring-1 ring-white/10 hover:bg-[#1a2337] active:scale-[0.98] transition"
        >
          + Nuevo formulario
        </Link>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
          Aún no hay formularios creados. Cree el primero con <strong>+ Nuevo formulario</strong>.
        </p>
      ) : (
        <section className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-bold text-slate-600">
              <tr>
                <th className="px-5 py-3">Formulario</th>
                <th className="px-4 py-3 text-right">Preguntas</th>
                <th className="px-4 py-3 text-right">Pendientes</th>
                <th className="px-4 py-3 text-right">Completadas</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lista.map((f) => (
                <tr key={f.id} className={`hover:bg-slate-50/60 transition ${f.activo ? "" : "bg-slate-50/80 text-slate-400"}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/formularios/${f.id}/editar`} className="font-bold text-slate-900 hover:text-[#876200] transition">
                        {f.titulo}
                      </Link>
                      {!f.activo && (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          Archivado
                        </span>
                      )}
                      {f.codigo && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                          {f.codigo}
                        </span>
                      )}
                      {f.rol ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {f.rol}
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Sin rol
                        </span>
                      )}
                    </div>
                    {f.descripcion && <span className="block mt-0.5 max-w-md truncate text-xs text-slate-500">{f.descripcion}</span>}
                    <span className="block mt-1 text-[11px] text-slate-400">
                      {f.formato ? `Cronograma: ${f.formato} · ` : ""}Actualizado {textoFechaHora(f.actualizadoEn)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-slate-700">
                    {f.campos.filter((c) => TIPOS_CAMPO[c.tipo]?.esPregunta).length}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-bold text-amber-700">{f.pendientes}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums font-bold text-emerald-700">{f.completadas}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs">
                    <div className="flex flex-col items-end gap-1.5">
                      {/* Las tres vistas del formulario, cada una abre su propia pestaña */}
                      <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white font-bold shadow-2xs">
                        {[
                          ["editar", "Editar"],
                          ["asignar", "Asignar"],
                          ["resultados", "Resultados"],
                        ].map(([pestana, etiqueta], i) => (
                          <Link
                            key={pestana}
                            href={`/formularios/${f.id}/${pestana}`}
                            className={`px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition ${
                              i > 0 ? "border-l border-slate-200" : ""
                            }`}
                          >
                            {etiqueta}
                          </Link>
                        ))}
                      </div>
                      <div className="inline-flex gap-3 text-[11px]">
                        <BotonArchivar id={f.id} activo={f.activo} titulo={f.titulo} />
                        {f.completadas === 0 && <BotonEliminarFormulario id={f.id} titulo={f.titulo} pendientes={f.pendientes} />}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
