import Link from "next/link";
import { connection } from "next/server";
import { requerirAdmin } from "@/modules/auth/dal";
import NuevaInspeccion from "@/modules/plantillas/components/NuevaInspeccion";
import { completarConEliminadas, obtenerPlantillas } from "@/modules/plantillas/queries";
import { obtenerInspectores, obtenerUsuarioPorId } from "@/modules/usuarios/queries";
import { diaDeFecha, diaDeLaSemana, normalizarFiltros, vistaPorClave, vistaPorRol } from "../constants";
import { obtenerRegistrosUsuario } from "../queries";
import FiltrosCronograma from "./FiltrosCronograma";
import GeneradorCronograma from "./GeneradorCronograma";
import MatrizMes from "./MatrizMes";

// Ejecuta todas las consultas y devuelve un resultado plano (sin JSX dentro del try/catch).
async function cargarDatos(filtros) {
  try {
    const [inspectores, usuarioSeleccionado] = await Promise.all([
      obtenerInspectores(),
      filtros.usuarioId ? obtenerUsuarioPorId(filtros.usuarioId) : Promise.resolve(null),
    ]);

    let vista = vistaPorClave(filtros.vista);

    // Si viene un inspector explícito en la URL y es válido:
    let usuario = usuarioSeleccionado && inspectores.some((i) => i.id === usuarioSeleccionado.id)
      ? usuarioSeleccionado
      : null;

    if (usuario) {
      // Un inspector explícito alinea la pestaña con su rol correspondiente
      vista = vistaPorRol(usuario.rol);
    } else {
      // Sin inspector en la URL: seleccionar automáticamente al primer inspector activo de este rol
      const delRol = inspectores.filter((i) => i.rol === vista.rol);
      usuario = delRol.find((i) => i.activo) || delRol[0] || null;
    }

    if (!usuario) {
      // No hay inspectores registrados para este rol operativo
      return { ok: true, vista, usuario: null, inspectores, plantillas: [], registros: [] };
    }

    const [plantillas, registros] = await Promise.all([
      obtenerPlantillas({ rol: usuario.rol }),
      obtenerRegistrosUsuario({ usuarioId: usuario.id, mes: filtros.mes, anio: filtros.anio }),
    ]);

    // Inspecciones eliminadas que tienen registros este mes: se siguen mostrando (historial).
    const conEliminadas = await completarConEliminadas(plantillas, registros);
    return { ok: true, vista, usuario, inspectores, plantillas: conEliminadas, registros };
  } catch (error) {
    console.error("[cronogramas] Error consultando la base de datos:", error);
    return { ok: false, detalle: error?.code ?? error?.message ?? "Error desconocido" };
  }
}

// Día de la semana (1-5) en que cada formato tiene su primera P del mes.
// Sirve para precargar el generador con la asignación vigente.
function asignacionVigente(registros, mes, anio) {
  const asignacion = {};
  const ordenados = [...registros]
    .filter((r) => r.planificado > 0)
    .sort((a, b) => diaDeFecha(a.fecha) - diaDeFecha(b.fecha));
  for (const r of ordenados) {
    if (asignacion[r.plantillaId]) continue;
    const dow = diaDeLaSemana(mes, anio, diaDeFecha(r.fecha));
    asignacion[r.plantillaId] = dow >= 1 && dow <= 5 ? dow : 1;
  }
  return asignacion;
}

// Server Component: lee los filtros de la URL, carga los datos y ensambla filtros + matriz.
// Debe renderizarse dentro de <Suspense> (usa searchParams y datos en tiempo de request).
export default async function CronogramaMensual({ searchParams }) {
  // Con cacheComponents activo, marca este árbol como dinámico (request-time).
  await connection();
  await requerirAdmin();

  const filtros = normalizarFiltros(await searchParams, new Date());
  const resultado = await cargarDatos(filtros);

  if (!resultado.ok) {
    return (
      <section className="rounded border border-red-300 bg-red-50 p-6">
        <h2 className="text-base font-bold text-red-900">No se pudo conectar con la base de datos.</h2>
        <p className="mt-1 text-sm text-red-800">
          Verifica que PostgreSQL esté corriendo en WSL2 (
          <code className="font-mono">sudo service postgresql start</code>) y que{" "}
          <code className="font-mono">DATABASE_URL</code> en <code className="font-mono">.env.local</code> sea
          correcta.
        </p>
        <p className="mt-2 font-mono text-xs text-red-700">{resultado.detalle}</p>
      </section>
    );
  }

  const { vista, usuario, inspectores, plantillas, registros } = resultado;

  return (
    <div className="space-y-4">
      <FiltrosCronograma
        vista={vista.clave}
        mes={filtros.mes}
        anio={filtros.anio}
        usuarioId={usuario?.id ?? null}
        inspectores={inspectores}
      />

      <NuevaInspeccion key={`nueva|${vista.rol}`} rol={vista.rol} etiquetaRol={vista.etiqueta} />

      {!usuario ? (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-bold text-zinc-600">
            👤
          </div>
          <h2 className="mt-3 text-base font-bold text-zinc-950">
            No hay inspectores registrados en {vista.etiqueta}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500">
            Para generar y consultar cronogramas individuales en este rol, primero debe registrar al personal operativo.
          </p>
          <div className="mt-4">
            <Link
              href="/inspectores"
              className="inline-flex rounded-xl bg-[#09090b] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 transition"
            >
              Registrar inspector →
            </Link>
          </div>
        </section>
      ) : (
        <>
          <GeneradorCronograma
            key={`gen|${usuario.id}|${filtros.mes}|${filtros.anio}`}
            usuarioId={usuario.id}
            usuarioNombre={usuario.nombre}
            mes={filtros.mes}
            anio={filtros.anio}
            plantillas={plantillas}
            asignacionActual={asignacionVigente(registros, filtros.mes, filtros.anio)}
          />

          <MatrizMes
            // La key reinicia el estado local de la matriz al cambiar de vista, mes, año o inspector.
            key={`${vista.clave}|${usuario.id}|${filtros.mes}|${filtros.anio}`}
            modo="individual"
            usuarioId={usuario.id}
            mes={filtros.mes}
            anio={filtros.anio}
            tituloVista={`Cronograma individual · ${usuario.nombre} (${usuario.rol})`}
            plantillas={plantillas}
            registrosIniciales={registros}
          />
        </>
      )}
    </div>
  );
}
