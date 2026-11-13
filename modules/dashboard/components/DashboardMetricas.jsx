import Link from "next/link";
import { connection } from "next/server";
import { requerirAdmin } from "@/modules/auth/dal";
import { normalizarFiltros, numeroMes, VISTAS } from "@/modules/cronogramas/constants";
import { obtenerInspectores } from "@/modules/usuarios/queries";
import { calcularMetricas, mesesAnteriores, razon } from "../metricas";
import { obtenerDetalleMes, obtenerObservacionesRecientes, obtenerTotalesPorMes } from "../queries";
import { diaDeFecha } from "@/modules/cronogramas/constants";
import FiltrosDashboard from "./FiltrosDashboard";
import BarrasRanking from "./graficos/BarrasRanking";
import { formatoNumero, formatoPorcentaje } from "./graficos/escala";
import GraficoAcumulado from "./graficos/GraficoAcumulado";
import GraficoColumnas from "./graficos/GraficoColumnas";
import TarjetaGrafico from "./graficos/TarjetaGrafico";
import { BarraSegmentada, CifraPrincipal, Indicador, Medidor } from "./Indicadores";

const COLOR_PLAN = "var(--viz-plan)";
const COLOR_EJEC = "var(--viz-ejec)";
const MESES_TENDENCIA = 6;

function leerFiltros(searchParams, hoy) {
  const base = normalizarFiltros(searchParams, hoy);
  const rolParam = Array.isArray(searchParams?.rol) ? searchParams.rol[0] : searchParams?.rol;
  const vista = VISTAS.find((v) => v.clave === rolParam);
  return { mes: base.mes, anio: base.anio, rolClave: vista?.clave ?? "todos", rol: vista?.rol ?? null };
}

async function cargarDatos({ mes, anio, rol }) {
  try {
    const periodos = mesesAnteriores(mes, anio, MESES_TENDENCIA);
    const anterior = periodos[periodos.length - 2];
    const [detalle, detalleAnterior, totales, inspectores, observaciones] = await Promise.all([
      obtenerDetalleMes({ mes, anio, rol }),
      obtenerDetalleMes({ mes: anterior.mes, anio: anterior.anio, rol }),
      obtenerTotalesPorMes({ periodos, rol }),
      obtenerInspectores({ rol }),
      obtenerObservacionesRecientes({ mes, anio, rol }),
    ]);
    return {
      ok: true,
      detalle,
      observaciones,
      detalleAnterior,
      anterior,
      totales,
      periodos,
      inspectoresActivos: inspectores.length,
    };
  } catch (error) {
    console.error("[dashboard] Error consultando la base de datos:", error);
    return { ok: false, detalle: error?.code ?? error?.message ?? "Error desconocido" };
  }
}

// Server Component: lee filtros de la URL, calcula métricas y arma el dashboard.
export default async function DashboardMetricas({ searchParams }) {
  await connection();
  await requerirAdmin();

  const ahora = new Date();
  const hoy = { dia: ahora.getDate(), mes: ahora.getMonth() + 1, anio: ahora.getFullYear() };
  const filtros = leerFiltros(await searchParams, ahora);
  const datos = await cargarDatos(filtros);

  if (!datos.ok) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs">
        <h2 className="text-base font-bold text-rose-950">No se pudo conectar con la base de datos.</h2>
        <p className="mt-2 font-mono text-xs text-rose-700">{datos.detalle}</p>
      </section>
    );
  }

  const m = calcularMetricas(datos.detalle, { mes: filtros.mes, anio: filtros.anio, hoy });
  const t = m.total;

  // Tendencia de los últimos meses (en orden cronológico).
  const tendencia = datos.periodos.map((p) => {
    const fila = datos.totales.find((x) => x.mes === p.mes && x.anio === p.anio);
    return { ...p, planificadas: fila?.planificadas ?? 0, ejecutadas: fila?.ejecutadas ?? 0 };
  });
  // Comparación con el mes anterior. Si el mes está en curso se compara con el mes anterior
  // cortado en el mismo día (p. ej. 1–2 de noviembre vs. 1–2 de octubre), no con el mes completo.
  const mesEnCurso = m.corte > 0 && m.corte < m.totalDias;
  const { anterior } = datos;
  const hoyAnterior = mesEnCurso
    ? { dia: m.corte, mes: numeroMes(anterior.mes), anio: anterior.anio }
    : { dia: 1, mes: 1, anio: 9999 }; // mes anterior completo
  const prev = calcularMetricas(datos.detalleAnterior, { mes: anterior.mes, anio: anterior.anio, hoy: hoyAnterior }).total;
  const hayAnterior = prev.planificadas > 0 || prev.ejecutadas > 0;
  const diferenciaPuntos =
    hayAnterior && t.efectividad !== null && prev.efectividad !== null
      ? Math.round((t.efectividad - prev.efectividad) * 100)
      : null;
  const refAnterior = mesEnCurso ? `${anterior.mes} (días 1–${m.corte})` : anterior.mes;
  const sinPlan = t.planificadas === 0 && t.ejecutadas === 0;
  const etiquetaRol = filtros.rol ?? "todos los roles";

  // Ranking de inspectores: va abajo con todos los roles, o a la derecha del avance con un rol filtrado.
  const tarjetaInspectores = (className) => (
    <TarjetaGrafico
      className={className}
      titulo="Efectividad por inspector"
      subtitulo="Ejecutadas ÷ planificadas a la fecha, de mayor a menor"
      vacio={m.inspectores.length === 0 ? "Ningún inspector tiene cronograma este mes." : null}
      tabla={{
        columnas: ["Inspector", "Planificadas", "Ejecutadas", "N", "Pendientes", "Efectividad"],
        filas: m.inspectores.map((i) => [
          i.nombre,
          i.pALaFecha,
          i.eALaFecha,
          i.noEjecutadas,
          i.pendientes,
          formatoPorcentaje(i.efectividad),
        ]),
      }}
    >
      <BarrasRanking
        color={COLOR_PLAN}
        filas={m.inspectores.map((i) => ({
          etiqueta: i.nombre,
          valor: i.efectividad,
          detalle: `${formatoNumero(i.eALaFecha)} de ${formatoNumero(i.pALaFecha)} · ${formatoNumero(i.pendientes)} pendientes`,
        }))}
      />
    </TarjetaGrafico>
  );

  return (
    <div className="space-y-4">
      <FiltrosDashboard mes={filtros.mes} anio={filtros.anio} rol={filtros.rolClave} />

      {sinPlan && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 font-bold text-xs">
            ℹ
          </span>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
            No hay inspecciones planificadas en <strong className="text-zinc-950 font-semibold">{filtros.mes} {filtros.anio}</strong> para <strong className="text-zinc-950 font-semibold">{etiquetaRol}</strong>. Genere los
            cronogramas desde{" "}
            <Link href="/" className="font-bold text-zinc-950 underline decoration-[#f5b800] decoration-2 underline-offset-2 hover:text-[#d97706] transition">
              Cronogramas
            </Link>{" "}
            para visualizar las métricas consolidadas.
          </p>
        </div>
      )}

      {/* Indicadores principales: una fila de 4, todos del mismo alto */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <CifraPrincipal
            titulo={mesEnCurso ? "Efectividad a la fecha" : "Efectividad del mes"}
            valor={t.efectividad}
            diferenciaPuntos={diferenciaPuntos}
            referencia={refAnterior}
            detalle={`Ejecutadas ÷ planificadas${mesEnCurso ? " hasta hoy" : ""}: ${formatoNumero(
              t.ejecutadasALaFecha
            )} de ${formatoNumero(t.planificadasALaFecha)}`}
          />
        </div>
        <Indicador
          grande
          etiqueta="Inspecciones planificadas"
          valor={formatoNumero(t.planificadas)}
          diferencia={hayAnterior ? t.planificadas - prev.planificadas : null}
          referencia={anterior.mes}
          subirEsBueno={null}
        />
        <Indicador
          grande
          etiqueta="Inspecciones ejecutadas"
          valor={formatoNumero(t.ejecutadas)}
          diferencia={hayAnterior ? t.ejecutadasALaFecha - prev.ejecutadasALaFecha : null}
          referencia={refAnterior}
          subirEsBueno
        />
        <div className="col-span-2 sm:col-span-1">
          <Indicador
            grande
            etiqueta="Inspectores con cronograma"
            valor={`${formatoNumero(t.inspectoresConPlan)} de ${formatoNumero(datos.inspectoresActivos)}`}
            nota={`${formatoNumero(t.restantes)} inspecciones programadas por delante`}
          />
        </div>
      </div>

      {/* Avance del mes + resultado de lo planificado */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TarjetaGrafico
            className="h-full"
            titulo="Avance acumulado del mes"
            subtitulo="Inspecciones acumuladas día a día: lo planificado frente a lo ejecutado"
            leyenda={[
              { etiqueta: "Planificado", color: COLOR_PLAN, forma: "linea" },
              { etiqueta: "Ejecutado", color: COLOR_EJEC, forma: "linea" },
            ]}
            vacio={sinPlan ? "Sin datos para este mes." : null}
            tabla={{
              columnas: ["Día", "Planificado acumulado", "Ejecutado acumulado"],
              filas: m.acumulado.map((d) => [d.dia, d.planificado, d.ejecutado ?? "—"]),
            }}
          >
            <GraficoAcumulado
              alto={filtros.rol ? 260 : 300}
              dias={m.totalDias}
              diaHoy={mesEnCurso ? m.corte : 0}
              series={[
                { etiqueta: "Planificado", color: COLOR_PLAN, valores: m.acumulado.map((d) => d.planificado) },
                { etiqueta: "Ejecutado", color: COLOR_EJEC, valores: m.acumulado.map((d) => d.ejecutado) },
              ]}
            />
          </TarjetaGrafico>
        </div>

        <div className="flex flex-col gap-4">
          <TarjetaGrafico
            className="flex-1"
            titulo="Resultado de lo planificado"
            subtitulo={mesEnCurso ? "Inspecciones planificadas hasta hoy" : "Inspecciones planificadas del mes"}
            vacio={t.planificadasALaFecha === 0 ? "Aún no hay inspecciones planificadas vencidas." : null}
            tabla={{
              columnas: ["Resultado", "Inspecciones"],
              filas: [
                ["Ejecutadas", m.resultadoPlan.ejecutadas],
                ["Sin registrar", m.resultadoPlan.sinRegistro],
                ["No ejecutadas (N)", m.resultadoPlan.noEjecutadas],
              ],
            }}
          >
            <BarraSegmentada
              partes={[
                { etiqueta: "Ejecutadas", valor: m.resultadoPlan.ejecutadas, color: "var(--viz-good)" },
                { etiqueta: "Sin registrar", valor: m.resultadoPlan.sinRegistro, color: "var(--viz-warning)", textoOscuro: true },
                { etiqueta: "No ejecutadas (N)", valor: m.resultadoPlan.noEjecutadas, color: "var(--viz-critical)" },
              ]}
            />
          </TarjetaGrafico>

          {filtros.rol ? (
            tarjetaInspectores("flex-1")
          ) : (
            <TarjetaGrafico
              className="flex-1"
              titulo="Efectividad por rol"
              subtitulo="Ejecutadas ÷ planificadas a la fecha"
              vacio={m.roles.length === 0 ? "Sin datos para este mes." : null}
              tabla={{
                columnas: ["Rol", "Planificadas", "Ejecutadas", "Efectividad"],
                filas: m.roles.map((r) => [r.rol, r.pALaFecha, r.eALaFecha, formatoPorcentaje(r.efectividad)]),
              }}
            >
              <div className="space-y-4">
                {m.roles.map((r) => (
                  <Medidor
                    key={r.rol}
                    etiqueta={r.rol}
                    valor={r.efectividad}
                    detalle={`${formatoNumero(r.eALaFecha)} de ${formatoNumero(r.pALaFecha)}`}
                  />
                ))}
              </div>
            </TarjetaGrafico>
          )}
        </div>
      </div>

      {/* Tendencia + carga por día de la semana */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TarjetaGrafico
            className="h-full"
            titulo={`Planificadas vs. ejecutadas · últimos ${MESES_TENDENCIA} meses`}
            subtitulo="Total de inspecciones por mes"
            leyenda={[
              { etiqueta: "Planificadas", color: COLOR_PLAN, forma: "barra" },
              { etiqueta: "Ejecutadas", color: COLOR_EJEC, forma: "barra" },
            ]}
            vacio={tendencia.every((p) => p.planificadas === 0 && p.ejecutadas === 0) ? "Sin datos en los últimos meses." : null}
            tabla={{
              columnas: ["Mes", "Planificadas", "Ejecutadas", "Efectividad"],
              filas: tendencia.map((p) => [
                `${p.mes} ${p.anio}`,
                p.planificadas,
                p.ejecutadas,
                formatoPorcentaje(razon(p.ejecutadas, p.planificadas)),
              ]),
            }}
          >
            <GraficoColumnas
              etiquetaEje="Inspecciones por mes"
              categorias={tendencia.map((p) => `${p.mes.slice(0, 3)} ${String(p.anio).slice(2)}`)}
              series={[
                { etiqueta: "Planificadas", color: COLOR_PLAN, valores: tendencia.map((p) => p.planificadas) },
                { etiqueta: "Ejecutadas", color: COLOR_EJEC, valores: tendencia.map((p) => p.ejecutadas) },
              ]}
            />
          </TarjetaGrafico>
        </div>

        <TarjetaGrafico
          className="h-full"
          titulo="Carga por día de la semana"
          subtitulo="Inspecciones planificadas en el mes, de lunes a viernes"
          vacio={t.planificadas === 0 ? "Sin inspecciones planificadas." : null}
          tabla={{
            columnas: ["Día", "Planificadas", "Ejecutadas"],
            filas: m.cargaSemanal.map((d) => [d.etiqueta, d.p, d.e]),
          }}
        >
          <GraficoColumnas
            etiquetaEje="Inspecciones planificadas por día de la semana"
            categorias={m.cargaSemanal.map((d) => d.etiqueta)}
            series={[{ etiqueta: "Planificadas", color: COLOR_PLAN, valores: m.cargaSemanal.map((d) => d.p) }]}
          />
        </TarjetaGrafico>
      </div>

      {/* Efectividad por inspector + pendientes de registrar (lado a lado, mismo alto). */}
      <div className="grid gap-4 lg:grid-cols-3">
        {!filtros.rol && tarjetaInspectores("h-full")}

        <section
          className={`viz-root flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 transition-all ${
            filtros.rol ? "lg:col-span-3" : "lg:col-span-2"
          }`}
        >
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-zinc-950">Pendientes de registrar</h3>
              <span className="text-2xl font-black tabular-nums text-zinc-950">
                {formatoNumero(t.pendientes)} <span className="text-xs font-normal text-zinc-500">en total</span>
              </span>
            </div>
            <p className="mb-3.5 text-xs text-zinc-500">
              Inspecciones planificadas en días ya pasados que no tienen cantidad ejecutada ni &quot;N&quot;
            </p>
          </div>
          {m.pendientes.length === 0 ? (
            <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 text-center text-xs text-zinc-400 font-medium">
              No hay registros pendientes.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-2 px-3">Inspector</th>
                    <th className="py-2 px-3">Formato</th>
                    <th className="py-2 px-3">Días</th>
                    <th className="py-2 px-3 text-right">Pendientes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-900">
                  {m.pendientes.map((p) => (
                    <tr key={`${p.inspector}|${p.codigo}|${p.elemento}`} className="hover:bg-zinc-50/70 transition">
                      <td className="py-2 px-3 font-semibold text-zinc-950">{p.inspector}</td>
                      <td className="py-2 px-3">
                        <span className="font-medium text-zinc-800">{p.elemento}</span>{" "}
                        <span className="text-[10px] font-mono text-zinc-400">{p.codigo}</span>
                      </td>
                      <td className="py-2 px-3 tabular-nums text-zinc-500">
                        {p.dias.slice(0, 10).join(", ")}
                        {p.dias.length > 10 ? "…" : ""}
                      </td>
                      <td className="py-2 px-3 text-right font-bold tabular-nums text-amber-600">{p.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Observaciones de los inspectores */}
      <section className="viz-root rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 transition-all">
        <h3 className="text-sm font-bold text-zinc-950">Observaciones recientes</h3>
        <p className="mb-3.5 text-xs text-zinc-500">
          Hallazgos que registraron los inspectores al ejecutar (los 10 más recientes del mes)
        </p>
        {datos.observaciones.length === 0 ? (
          <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-4 text-center text-xs text-zinc-400 font-medium">
            Sin observaciones en este mes.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-2 px-3">Inspector</th>
                  <th className="py-2 px-3">Formato</th>
                  <th className="py-2 px-3">Día</th>
                  <th className="py-2 px-3">Resultado</th>
                  <th className="py-2 px-3">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-900">
                {datos.observaciones.map((o, i) => (
                  <tr key={`${o.inspector}|${o.codigo}|${o.fecha}|${i}`} className="align-top hover:bg-zinc-50/70 transition">
                    <td className="py-2 px-3 font-semibold text-zinc-950 whitespace-nowrap">{o.inspector}</td>
                    <td className="py-2 px-3">
                      <span className="font-medium text-zinc-800">{o.elemento}</span>{" "}
                      <span className="text-[10px] font-mono text-zinc-400">{o.codigo}</span>
                    </td>
                    <td className="py-2 px-3 tabular-nums font-medium text-zinc-600">{diaDeFecha(o.fecha)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {o.noEjecutado ? (
                        <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[11px] font-bold text-rose-700">
                          N (No ejecutada)
                        </span>
                      ) : o.ejecutado ? (
                        <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          {o.ejecutado} ejec.
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-pre-line text-zinc-700 leading-relaxed max-w-md">{o.observacion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
