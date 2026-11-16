import { connection } from "next/server";
import { ROLES_OPERATIVOS } from "@/db/roles";
import { requerirAdmin } from "@/modules/auth/dal";
import { obtenerTodasAsignacionesInspectores } from "@/modules/formularios/queries";
import { obtenerUsuariosGestion } from "../queries";
import GestionInspectores from "./GestionInspectores";

// Fecha legible calculada en el servidor (evita diferencias de formato entre servidor y navegador).
function textoFechaHora(fecha) {
  if (!fecha) return null;
  const d = new Date(fecha);
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

function textoFechaSimple(fecha) {
  if (!fecha) return null;
  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split("-");
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    return `${parseInt(d, 10)} ${meses[parseInt(m, 10) - 1]} ${y}`;
  }
  const d = new Date(fecha);
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()}`;
}

async function cargarUsuarios() {
  try {
    const [filas, asignaciones] = await Promise.all([
      obtenerUsuariosGestion(),
      obtenerTodasAsignacionesInspectores(),
    ]);
    const ahora = new Date();

    // Mapear asignaciones por usuarioId
    const asignacionesPorUsuario = new Map();
    for (const a of asignaciones) {
      if (!asignacionesPorUsuario.has(a.usuarioId)) {
        asignacionesPorUsuario.set(a.usuarioId, []);
      }
      asignacionesPorUsuario.get(a.usuarioId).push({
        id: a.id,
        formularioId: a.formularioId,
        titulo: a.titulo,
        codigo: a.codigo,
        numPreguntas: Array.isArray(a.campos) ? a.campos.length : 0,
        origen: a.origen,
        estado: a.estado,
        semanaMes: a.semanaMes,
        fechaCronograma: a.fechaCronograma,
        programadoTexto: a.fechaCronograma ? textoFechaSimple(a.fechaCronograma) : null,
        creadoEnTexto: textoFechaSimple(a.creadoEn),
        completadaEnTexto: a.completadaEn ? textoFechaSimple(a.completadaEn) : null,
        nota: a.nota,
      });
    }

    return {
      ok: true,
      usuarios: filas.map(({ bloqueadoHasta, ultimoAcceso, ...u }) => {
        const misAsignaciones = asignacionesPorUsuario.get(u.id) || [];
        const completadas = misAsignaciones.filter((a) => a.estado === "completada").length;
        const pendientes = misAsignaciones.length - completadas;
        return {
          ...u,
          bloqueado: Boolean(bloqueadoHasta && new Date(bloqueadoHasta) > ahora),
          ultimoAcceso: textoFechaHora(ultimoAcceso),
          asignaciones: misAsignaciones,
          totalAsignaciones: misAsignaciones.length,
          completadas,
          pendientes,
        };
      }),
    };
  } catch (error) {
    console.error("[usuarios] Error consultando usuarios:", error);
    return { ok: false, detalle: error?.code ?? error?.message ?? "Error desconocido" };
  }
}

// Server Component: solo administradores. Debe ir dentro de <Suspense>.
export default async function ListadoInspectores({ searchParams }) {
  await connection();
  const admin = await requerirAdmin();

  const params = await searchParams;
  const rolParam = Array.isArray(params?.rol) ? params.rol[0] : params?.rol;
  const rolInicial = ROLES_OPERATIVOS.includes(rolParam) ? rolParam : ROLES_OPERATIVOS[0];

  const resultado = await cargarUsuarios();

  if (!resultado.ok) {
    return (
      <section className="rounded border border-red-300 bg-red-50 p-6">
        <h2 className="text-base font-bold text-red-900">No se pudo conectar con la base de datos.</h2>
        <p className="mt-2 font-mono text-xs text-red-700">{resultado.detalle}</p>
      </section>
    );
  }

  return <GestionInspectores inspectores={resultado.usuarios} rolInicial={rolInicial} usuarioActual={admin} />;
}
