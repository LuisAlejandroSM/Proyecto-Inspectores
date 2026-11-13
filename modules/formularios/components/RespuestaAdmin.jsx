import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requerirAdmin } from "@/modules/auth/dal";
import { textoFecha, textoFechaHora } from "../fechas";
import { obtenerAsignacionCompleta } from "../queries";
import EncabezadoFormato from "./EncabezadoFormato";
import VerRespuesta from "./VerRespuesta";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server Component (solo administradores): respuesta completa de un inspector.
export default async function RespuestaAdmin({ params }) {
  await connection();
  await requerirAdmin();

  const { asignacionId } = await params;
  if (!UUID_RE.test(String(asignacionId))) notFound();
  const datos = await obtenerAsignacionCompleta(asignacionId);
  if (!datos) notFound();
  const { asignacion, formulario, inspector, respuesta, fotos } = datos;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/formularios/${formulario.id}/resultados`} className="inline-flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-zinc-950 transition">
        <span aria-hidden="true">←</span> Volver a resultados de {formulario.titulo}
      </Link>
      <EncabezadoFormato
        titulo={formulario.titulo}
        codigo={formulario.codigo}
        emision={formulario.emision}
        revision={formulario.revision}
      >
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2 border-t border-zinc-100 pt-3">
          <div>
            <dt className="inline text-zinc-500 font-medium">Inspector: </dt>
            <dd className="inline font-bold text-zinc-950">
              {inspector.nombre} <span className="font-normal text-zinc-400">({inspector.rol})</span>
            </dd>
          </div>
          <div>
            <dt className="inline text-zinc-500 font-medium">Enviada: </dt>
            <dd className="inline font-bold text-zinc-950">{textoFechaHora(respuesta?.enviadaEn) ?? "Aún no enviada"}</dd>
          </div>
          <div>
            <dt className="inline text-zinc-500 font-medium">Asignada: </dt>
            <dd className="inline text-zinc-800 font-semibold">{textoFechaHora(asignacion.creadoEn)}</dd>
          </div>
          <div>
            <dt className="inline text-zinc-500 font-medium">Fecha límite: </dt>
            <dd className="inline text-zinc-800 font-semibold">{textoFecha(asignacion.fechaLimite) ?? "—"}</dd>
          </div>
        </dl>
      </EncabezadoFormato>

      {respuesta ? (
        <VerRespuesta campos={respuesta.camposSnapshot} respuestas={respuesta.respuestas} fotos={fotos} />
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400 font-medium shadow-xs">
          El inspector todavía no envía este formulario.
        </div>
      )}
    </div>
  );
}
