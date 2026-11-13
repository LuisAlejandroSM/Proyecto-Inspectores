import Link from "next/link";
import { connection } from "next/server";
import { ROLES_OPERATIVOS } from "@/db/roles";
import { requerirUsuario } from "@/modules/auth/dal";
import { formatoNumero, formatoPorcentaje } from "@/modules/dashboard/components/graficos/escala";
import { CifraPrincipal, Indicador } from "@/modules/dashboard/components/Indicadores";
import { calcularMetricas, diaDeCorte } from "@/modules/dashboard/metricas";
import { obtenerDetalleMes } from "@/modules/dashboard/queries";
import { completarConEliminadas, obtenerPlantillas } from "@/modules/plantillas/queries";
import { listarFormulariosDelCronograma } from "@/modules/formularios/queries";
import { diaDeFecha, diasEnMes, normalizarFiltros, numeroMes } from "../constants";
import VistaInspector from "./VistaInspector";

// Server Component de "Mi cronograma": solo los datos del usuario de la sesión.
export default async function MiCronograma({ searchParams }) {
  await connection();
  const usuario = await requerirUsuario();

  if (!ROLES_OPERATIVOS.includes(usuario.rol)) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-xs">
        Su usuario es de administración y no tiene inspecciones asignadas.{" "}
        <Link href="/dashboard" className="font-bold text-zinc-950 underline decoration-[#f5b800] decoration-2">
          Ir al dashboard
        </Link>
      </section>
    );
  }

  const ahora = new Date();
  const hoy = { dia: ahora.getDate(), mes: ahora.getMonth() + 1, anio: ahora.getFullYear() };
  const { mes, anio } = normalizarFiltros(await searchParams, ahora);

  let detalle;
  let plantillas;
  let formularios = [];
  try {
    [detalle, plantillas, formularios] = await Promise.all([
      obtenerDetalleMes({ mes, anio, usuarioId: usuario.id }),
      obtenerPlantillas({ rol: usuario.rol }),
      listarFormulariosDelCronograma({ usuarioId: usuario.id, mes, anio }),
    ]);
  } catch (error) {
    console.error("[mi-cronograma] Error consultando la base de datos:", error);
    detalle = null;
  }

  if (!detalle) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-sm text-rose-900 shadow-xs">
        No se pudo cargar su cronograma. Intente de nuevo en unos minutos.
      </section>
    );
  }

  plantillas = await completarConEliminadas(plantillas, detalle);

  const m = calcularMetricas(detalle, { mes, anio, hoy });
  const t = m.total;
  const totalDias = diasEnMes(mes, anio);
  const corte = diaDeCorte(mes, anio, hoy);
  const mesEnCurso = numeroMes(mes) === hoy.mes && anio === hoy.anio;
  const diaActual = mesEnCurso ? hoy.dia : corte === totalDias ? totalDias + 1 : 0;

  const formularioPorCelda = new Map(
    formularios.map((f) => [`${f.plantillaId}|${diaDeFecha(f.fecha)}`, { asignacionId: f.asignacionId, estado: f.estado, titulo: f.titulo }])
  );

  const items = detalle
    .filter((r) => r.planificado > 0)
    .map((r) => ({
      formulario: formularioPorCelda.get(`${r.plantillaId}|${diaDeFecha(r.fecha)}`) ?? null,
      plantillaId: r.plantillaId,
      dia: diaDeFecha(r.fecha),
      elemento: r.elemento,
      codigo: r.codigo,
      periodicidad: r.periodicidad,
      orden: r.orden,
      ejecutado: Number(r.ejecutado) || 0,
      noEjecutado: Number(r.noEjecutado) || 0,
      observacion: r.observacion,
    }));

  const asignadas = new Set(detalle.map((r) => r.plantillaId));
  const registros = detalle.map((r) => ({
    plantillaId: r.plantillaId,
    fecha: r.fecha,
    planificado: r.planificado,
    ejecutado: r.ejecutado,
    noEjecutado: r.noEjecutado,
    observacion: r.observacion,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-950">Hola, {usuario.nombre}</h1>
        <p className="mt-1 text-sm text-zinc-500 font-medium">
          {usuario.rol} · Cronograma de inspecciones preventivas de {mes} {anio}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div className="col-span-2 lg:col-span-1">
          <CifraPrincipal
            titulo={mesEnCurso ? "Mi efectividad a la fecha" : "Mi efectividad del mes"}
            valor={t.efectividad}
            diferenciaPuntos={null}
            referencia={null}
            detalle={`Ejecutadas ÷ planificadas${mesEnCurso ? " hasta hoy" : ""}: ${formatoNumero(
              t.ejecutadasALaFecha
            )} de ${formatoNumero(t.planificadasALaFecha)}`}
          />
        </div>
        <Indicador
          etiqueta="Pendientes de registrar"
          valor={formatoNumero(t.pendientes)}
          nota="Días pasados sin cantidad ni N"
        />
        <Indicador
          etiqueta="Asignadas en el mes"
          valor={formatoNumero(t.planificadas)}
          nota={`${formatoNumero(t.restantes)} por delante · ${formatoNumero(t.noEjecutadas)} marcadas N`}
        />
        <Indicador
          etiqueta="Cumplimiento en la fecha"
          valor={formatoPorcentaje(t.cumplimientoEnFecha)}
          nota={`${formatoNumero(t.enFecha)} hechas el día previsto`}
        />
      </div>

      <VistaInspector
        mes={mes}
        anio={anio}
        diaActual={diaActual}
        items={items}
        plantillas={plantillas.filter((p) => asignadas.has(p.id))}
        registros={registros}
        tituloMatriz={`Matriz de ${mes} ${anio} · ${usuario.nombre}`}
      />
    </div>
  );
}
