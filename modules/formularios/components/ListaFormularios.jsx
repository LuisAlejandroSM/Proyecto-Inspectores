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
      <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-sm text-rose-900 shadow-xs">
        No se pudieron cargar los formularios.
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/formularios/nuevo"
          className="rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-4 py-2 text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition"
        >
          + Nuevo formulario
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500 shadow-xs">
          Aún no hay formularios creados. Cree el primero con <strong className="text-zinc-950 font-bold">+ Nuevo formulario</strong>.
        </div>
      ) : (
        <>
          {/* Vista móvil (< 768px): Tarjetas apiladas para evitar scroll horizontal */}
          <div className="space-y-3 md:hidden">
            {lista.map((f) => {
              const numPreguntas = f.campos.filter((c) => TIPOS_CAMPO[c.tipo]?.esPregunta).length;
              return (
                <div
                  key={`card-${f.id}`}
                  className={`rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3 ${
                    f.activo ? "" : "opacity-75 bg-zinc-50/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/formularios/${f.id}/editar`}
                      className="font-bold text-base text-zinc-950 hover:text-amber-600 transition"
                    >
                      {f.titulo}
                    </Link>
                    {!f.activo && (
                      <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                        Archivado
                      </span>
                    )}
                    {f.codigo && (
                      <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-600">
                        {f.codigo}
                      </span>
                    )}
                    {f.rol ? (
                      <span className="rounded-full border border-amber-300 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {f.rol}
                      </span>
                    ) : (
                      <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                        Sin rol
                      </span>
                    )}
                  </div>

                  {f.descripcion && (
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{f.descripcion}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-100 text-center">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Preguntas</span>
                      <span className="text-sm font-bold text-zinc-900">{numPreguntas}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">Pendientes</span>
                      <span className="text-sm font-black text-amber-700">{f.pendientes}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">Completadas</span>
                      <span className="text-sm font-black text-emerald-700">{f.completadas}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <span className="text-[11px] text-zinc-400">
                      {textoFechaHora(f.actualizadoEn)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/formularios/${f.id}/editar`}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/formularios/${f.id}/asignar`}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                      >
                        Asignar
                      </Link>
                      <Link
                        href={`/formularios/${f.id}/resultados`}
                        className="rounded-lg bg-[#09090b] text-white px-2.5 py-1 text-xs font-bold shadow-2xs hover:bg-zinc-800"
                      >
                        Resultados
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista escritorio (>= 768px): Tabla moderna con hover y altura generosa */}
          <section className="hidden md:block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-bold text-zinc-600">
                <tr>
                  <th className="px-5 py-3.5">Formulario</th>
                  <th className="px-4 py-3.5 text-right">Preguntas</th>
                  <th className="px-4 py-3.5 text-right">Pendientes</th>
                  <th className="px-4 py-3.5 text-right">Completadas</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-900">
                {lista.map((f) => (
                  <tr key={f.id} className={`hover:bg-zinc-50/70 transition ${f.activo ? "" : "bg-zinc-50/50 text-zinc-400"}`}>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/formularios/${f.id}/editar`} className="font-bold text-zinc-950 hover:text-amber-600 transition">
                          {f.titulo}
                        </Link>
                        {!f.activo && (
                          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                            Archivado
                          </span>
                        )}
                        {f.codigo && (
                          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-600">
                            {f.codigo}
                          </span>
                        )}
                        {f.rol ? (
                          <span className="rounded-full border border-amber-300 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            {f.rol}
                          </span>
                        ) : (
                          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                            Sin rol
                          </span>
                        )}
                      </div>
                      {f.descripcion && <span className="block mt-1 max-w-md truncate text-xs text-zinc-500">{f.descripcion}</span>}
                      <span className="block mt-1 text-[11px] text-zinc-400">
                        {f.formato ? `Cronograma: ${f.formato} · ` : ""}Actualizado {textoFechaHora(f.actualizadoEn)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums font-semibold text-zinc-700">
                      {f.campos.filter((c) => TIPOS_CAMPO[c.tipo]?.esPregunta).length}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums font-black text-amber-700">{f.pendientes}</td>
                    <td className="px-4 py-4 text-right tabular-nums font-black text-emerald-700">{f.completadas}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-xs">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="inline-flex overflow-hidden rounded-xl border border-zinc-200 bg-white font-bold shadow-2xs">
                          {[
                            ["editar", "Editar"],
                            ["asignar", "Asignar"],
                            ["resultados", "Resultados"],
                          ].map(([pestana, etiqueta], i) => (
                            <Link
                              key={pestana}
                              href={`/formularios/${f.id}/${pestana}`}
                              className={`px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition ${
                                i > 0 ? "border-l border-zinc-200" : ""
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
        </>
      )}
    </div>
  );
}
