"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { guardarRegistrosCronograma } from "../actions";
import {
  DIAS_SEMANA,
  SEMANAS,
  diaDeFecha,
  diaDeLaSemana,
  diasEnMes,
  efectividad,
  semanaDelMes,
} from "../constants";
import BotonEliminarInspeccion from "@/modules/plantillas/components/BotonEliminarInspeccion";
import EditarInspeccion from "@/modules/plantillas/components/EditarInspeccion";
import { registrarCambiosPendientes } from "./cambiosPendientes";

const CELDA_VACIA = { planificado: 0, ejecutado: 0, noEjecutado: 0 };
const clave = (plantillaId, dia) => `${plantillaId}|${dia}`;

function estadoInicial(registros) {
  const estado = {};
  for (const r of registros) {
    estado[clave(r.plantillaId, diaDeFecha(r.fecha))] = {
      planificado: Number(r.planificado) || 0,
      ejecutado: Number(r.ejecutado) || 0,
      noEjecutado: Number(r.noEjecutado) || 0,
      observacion: r.observacion ?? null,
    };
  }
  return estado;
}

function formatoPct(valor) {
  return `${Math.round(valor * 100)}%`;
}

function colorEfectividad(valor, totalP) {
  if (totalP === 0) return "text-zinc-400";
  if (valor >= 1) return "text-emerald-700";
  if (valor >= 0.7) return "text-amber-600";
  return "text-rose-600";
}

function fondoEfectividad(valor, totalP) {
  if (totalP === 0) return "bg-zinc-50";
  if (valor >= 1) return "bg-emerald-50/70";
  if (valor >= 0.7) return "bg-amber-50/70";
  return "bg-rose-50/70";
}

// Texto que se muestra en la fila inferior (E) para una celda.
function textoEjecucion(celda) {
  if (celda.noEjecutado > 0 && !celda.ejecutado) return "N";
  return celda.ejecutado ? String(celda.ejecutado) : "";
}

/**
 * Matriz mensual del formato CVC-SST-FT-11.
 * - modo "individual": editable (P / cantidad / N) y guarda con Server Action.
 * - modo "consolidado": solo lectura; muestra la suma de todos los inspectores.
 * - modo "inspector": el inspector ve su mes completo y toca las celdas E de días ya
 *   transcurridos con P para registrar el resultado (onSeleccionarCelda).
 * Las celdas con observación muestran un punto ámbar y el texto al pasar el mouse.
 */
export default function MatrizMes({
  modo,
  usuarioId,
  mes,
  anio,
  tituloVista,
  plantillas,
  registrosIniciales,
  // Solo modo "inspector": hasta qué día puede registrar y qué hacer al tocar una celda.
  diaActual = 0,
  onSeleccionarCelda = null,
  celdaSeleccionada = null,
}) {
  const editable = modo === "individual";
  const seleccionable = modo === "inspector" && typeof onSeleccionarCelda === "function";
  const [isPending, startTransition] = useTransition();
  const [datos, setDatos] = useState(() => estadoInicial(registrosIniciales));
  const [modificadas, setModificadas] = useState(() => new Set());
  const [estadoGuardado, setEstadoGuardado] = useState({ tipo: "idle", texto: "" });
  const [soloHabiles, setSoloHabiles] = useState(true);
  const [soloAsignados, setSoloAsignados] = useState(true);
  const [vistaActual, setVistaActual] = useState("tarjetas");
  const [expandidos, setExpandidos] = useState({});
  const [inspeccionDetalle, setInspeccionDetalle] = useState(null);

  const toggleExpandirTodos = (id) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Si el servidor envía datos nuevos (p. ej. tras generar el cronograma) y no hay cambios
  // locales pendientes, la matriz se sincroniza con ellos.
  const [registrosPrevios, setRegistrosPrevios] = useState(registrosIniciales);
  if (registrosIniciales !== registrosPrevios) {
    setRegistrosPrevios(registrosIniciales);
    if (modificadas.size === 0) setDatos(estadoInicial(registrosIniciales));
  }

  // Formatos asignados este mes = los que tienen algún registro guardado.
  const asignadas = useMemo(
    () => new Set(registrosIniciales.map((r) => r.plantillaId)),
    [registrosIniciales]
  );
  const filtrarAsignados = soloAsignados && asignadas.size > 0;
  const plantillasVisibles = filtrarAsignados
    ? plantillas.filter((p) => asignadas.has(p.id))
    : plantillas;

  const totalDiasMes = diasEnMes(mes, anio);
  const pendientes = modificadas.size;

  // Comparte el número de cambios pendientes con los filtros y protege al cerrar la pestaña.
  useEffect(() => {
    registrarCambiosPendientes(pendientes);
    if (pendientes === 0) return undefined;
    const alSalir = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [pendientes]);

  useEffect(() => () => registrarCambiosPendientes(0), []);

  // Columnas de días: como el Excel, por defecto solo días hábiles (LUN-VIE).
  const columnas = useMemo(() => {
    const lista = [];
    for (let d = 1; d <= totalDiasMes; d++) {
      const dow = diaDeLaSemana(mes, anio, d);
      const finDeSemana = dow === 0 || dow === 6;
      if (soloHabiles && finDeSemana) continue;
      lista.push({ dia: d, etiqueta: DIAS_SEMANA[dow], finDeSemana });
    }
    return lista;
  }, [mes, anio, totalDiasMes, soloHabiles]);

  // Totales igual que el Excel: P = COUNTIF("P"), E = SUM(ejecuciones), % = IF(P>0, E/P, 1).
  // Se calculan sobre todos los días del mes, aunque la vista oculte los fines de semana.
  const totales = useMemo(() => {
    const porPlantilla = {};
    const porSemana = Object.fromEntries(SEMANAS.map((s) => [s, { p: 0, e: 0, n: 0 }]));
    let globalP = 0;
    let globalE = 0;
    let globalN = 0;

    for (const p of plantillas) {
      let totP = 0;
      let totE = 0;
      let totN = 0;
      for (let d = 1; d <= totalDiasMes; d++) {
        const celda = datos[clave(p.id, d)];
        if (!celda) continue;
        totP += celda.planificado || 0;
        totE += celda.ejecutado || 0;
        totN += celda.noEjecutado || 0;
        const semana = porSemana[semanaDelMes(d)];
        semana.p += celda.planificado || 0;
        semana.e += celda.ejecutado || 0;
        semana.n += celda.noEjecutado || 0;
      }
      porPlantilla[p.id] = { totP, totE, totN, pct: efectividad(totP, totE) };
      globalP += totP;
      globalE += totE;
      globalN += totN;
    }

    return { porPlantilla, porSemana, globalP, globalE, globalN };
  }, [datos, plantillas, totalDiasMes]);

  const actualizarCelda = (plantillaId, dia, cambio) => {
    const key = clave(plantillaId, dia);
    setDatos((prev) => ({ ...prev, [key]: { ...(prev[key] ?? CELDA_VACIA), ...cambio } }));
    setModificadas((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    if (estadoGuardado.tipo !== "idle") setEstadoGuardado({ tipo: "idle", texto: "" });
  };

  const togglePlanificado = (plantillaId, dia) => {
    const actual = datos[clave(plantillaId, dia)] ?? CELDA_VACIA;
    actualizarCelda(plantillaId, dia, { planificado: actual.planificado ? 0 : 1 });
  };

  // Fila inferior: acepta un número (inspecciones ejecutadas) o "N" (no ejecutada).
  const cambiarEjecucion = (plantillaId, dia, valor) => {
    const texto = String(valor).trim().toUpperCase();
    if (texto === "") {
      actualizarCelda(plantillaId, dia, { ejecutado: 0, noEjecutado: 0 });
    } else if (texto.startsWith("N")) {
      actualizarCelda(plantillaId, dia, { ejecutado: 0, noEjecutado: 1 });
    } else {
      const num = Number.parseInt(texto.replace(/\D/g, ""), 10);
      if (Number.isFinite(num)) {
        actualizarCelda(plantillaId, dia, { ejecutado: Math.min(num, 999), noEjecutado: 0 });
      }
    }
  };

  const handleGuardar = () => {
    const celdas = Array.from(modificadas).map((key) => {
      const [plantillaId, dia] = key.split("|");
      const celda = datos[key] ?? CELDA_VACIA;
      return {
        plantillaId,
        dia: Number(dia),
        planificado: celda.planificado || 0,
        ejecutado: celda.ejecutado || 0,
        noEjecutado: celda.noEjecutado || 0,
      };
    });

    if (celdas.length === 0) return;
    const enviadas = new Set(modificadas);

    startTransition(async () => {
      try {
        const res = await guardarRegistrosCronograma({ usuarioId, mes, anio, celdas });
        if (res?.success) {
          setModificadas((prev) => {
            const next = new Set(prev);
            enviadas.forEach((k) => next.delete(k));
            return next;
          });
          setEstadoGuardado({ tipo: "ok", texto: `Guardado (${res.guardados} celda(s)).` });
        } else {
          setEstadoGuardado({ tipo: "error", texto: res?.error ?? "Error al guardar." });
        }
      } catch {
        setEstadoGuardado({ tipo: "error", texto: "Sin conexión con el servidor." });
      }
    });
  };

  const descartarCambios = () => {
    setDatos(estadoInicial(registrosIniciales));
    setModificadas(new Set());
    setEstadoGuardado({ tipo: "idle", texto: "" });
  };

  const globalPct = efectividad(totales.globalP, totales.globalE);
  const columnasFijas = 5;
  const columnasTotales = columnasFijas + columnas.length + 2;

  // Fila "SEMANA" del Excel: rango de días hábiles de cada semana del mes.
  const semanasDelMes = SEMANAS.map((s) => {
    const dias = [];
    for (let d = 1; d <= totalDiasMes; d++) {
      if (semanaDelMes(d) === s) dias.push(d);
    }
    return { semana: s, desde: dias[0], hasta: dias[dias.length - 1], ...totales.porSemana[s] };
  }).filter((s) => s.desde);

  return (
    <div className="space-y-4">
      {/* Barra de estado, indicadores y guardado */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-zinc-950 tracking-tight">{tituloVista}</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {editable
              ? "Clic en la fila P para planificar o quitar · en la fila E escriba la cantidad ejecutada o N"
              : modo === "inspector"
                ? "Toque una celda de la fila E (en ámbar = por registrar) para anotar la cantidad realizada, una N o una observación"
                : "Vista consolidada de solo lectura · seleccione un inspector para editar su cronograma"}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition">
              <input
                type="checkbox"
                checked={soloHabiles}
                onChange={(e) => setSoloHabiles(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-[#f5b800]"
              />
              Solo días hábiles (LUN–VIE)
            </label>
            {asignadas.size > 0 && (
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 transition">
                <input
                  type="checkbox"
                  checked={soloAsignados}
                  onChange={(e) => setSoloAsignados(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 accent-[#f5b800]"
                />
                Solo formatos asignados ({asignadas.size} de {plantillas.length})
              </label>
            )}
          </div>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Totales en cuadrícula simétrica (2 columnas en móvil, 4 en escritorio) */}
          <dl className={`w-full sm:w-auto grid grid-cols-2 sm:grid-cols-4 gap-2 ${modo === "inspector" ? "hidden" : ""}`}>
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-center min-w-0 w-full">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 truncate">Plan</dt>
              <dd className="text-base font-extrabold tabular-nums text-zinc-950">{totales.globalP}</dd>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-2.5 text-center min-w-0 w-full">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 truncate">Ejec</dt>
              <dd className="text-base font-extrabold tabular-nums text-emerald-800">{totales.globalE}</dd>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200/80 bg-rose-50/60 p-2.5 text-center min-w-0 w-full">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-rose-700 truncate">No ejec</dt>
              <dd className="text-base font-extrabold tabular-nums text-rose-800">{totales.globalN}</dd>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-amber-300/80 bg-amber-500/10 p-2.5 text-center min-w-0 w-full">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-amber-800 truncate">Efectividad</dt>
              <dd className={`text-base font-black tabular-nums ${colorEfectividad(globalPct, totales.globalP)}`}>
                {formatoPct(globalPct)}
              </dd>
            </div>
          </dl>

          {editable && (
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={descartarCambios}
                  disabled={isPending || pendientes === 0}
                  className="flex-1 sm:flex-initial rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 active:scale-[0.98] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={handleGuardar}
                  disabled={isPending || pendientes === 0}
                  className="flex-1 sm:flex-initial rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-4 py-2 text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPending ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
              <span
                aria-live="polite"
                className={`text-[11px] font-medium ${
                  estadoGuardado.tipo === "error"
                    ? "text-rose-600"
                    : estadoGuardado.tipo === "ok"
                      ? "text-emerald-600"
                      : pendientes > 0
                        ? "text-amber-600"
                        : "text-zinc-400"
                }`}
              >
                {estadoGuardado.texto ||
                  (pendientes > 0 ? `${pendientes} celda(s) sin guardar` : "Todo guardado")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Selector de visualización (Tarjetas por Inspección vs Matriz Mes) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setVistaActual("tarjetas")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              vistaActual === "tarjetas"
                ? "bg-[#09090b] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-white"
            }`}
          >
            <span>📑</span>
            <span>Vista Tarjetas</span>
            <span className="hidden sm:inline text-[10px] opacity-70 font-normal">(Ideal en móvil)</span>
          </button>
          <button
            type="button"
            onClick={() => setVistaActual("matriz")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              vistaActual === "matriz"
                ? "bg-[#09090b] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-950 hover:bg-white"
            }`}
          >
            <span>📊</span>
            <span>Matriz Mes</span>
          </button>
        </div>

        <p className="text-xs text-zinc-500 font-medium">
          {plantillasVisibles.length} formato(s) {filtrarAsignados ? "asignado(s)" : "en catálogo"}
        </p>
      </div>

      {/* VISTA 1: TARJETAS POR INSPECCIÓN (Optimizada para Móvil: nombres grandes legibles y sin compresión) */}
      {vistaActual === "tarjetas" && (
        <div className="space-y-3.5">
          {plantillasVisibles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
              No hay formatos de inspección activos para esta vista.
            </div>
          ) : (
            plantillasVisibles.map((p, indice) => {
              const { totP, totE, totN, pct } = totales.porPlantilla[p.id] ?? { totP: 0, totE: 0, totN: 0, pct: 1 };
              const diasConRegistro = columnas.filter((c) => {
                const celda = datos[clave(p.id, c.dia)] ?? CELDA_VACIA;
                return celda.planificado > 0 || celda.ejecutado > 0 || celda.noEjecutado > 0;
              });

              return (
                <div
                  key={`card-${p.id}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5"
                >
                  {/* Encabezado completo y legible de la inspección */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-600">
                          #{indice + 1}
                        </span>
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-medium text-zinc-600">
                          {p.codigoFormato}
                        </span>
                        <span className="rounded-md border border-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                          {p.periodicidad}
                        </span>
                        {p.cantidadPlanificada && (
                          <span className="text-[11px] text-zinc-500 font-medium">
                            Cant: {p.cantidadPlanificada}
                          </span>
                        )}
                        {p.activo === false && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                            Eliminada
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-sm sm:text-base font-bold text-zinc-950 leading-snug">
                        {p.elementoNombre}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start">
                      {modo !== "inspector" && p.activo !== false && (
                        <div className="flex items-center">
                          <EditarInspeccion plantilla={p} />
                          <BotonEliminarInspeccion plantilla={p} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumen de métricas de esta inspección */}
                  <div className="grid grid-cols-4 gap-2 rounded-xl bg-zinc-50 p-2.5 border border-zinc-200/80">
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Plan</p>
                      <p className="text-sm font-extrabold text-zinc-950">{totP}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Ejec</p>
                      <p className="text-sm font-extrabold text-emerald-800">{totE}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-rose-700">No ejec</p>
                      <p className="text-sm font-extrabold text-rose-800">{totN}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-800">Efect.</p>
                      <p className={`text-sm font-black ${colorEfectividad(pct, totP)}`}>
                        {formatoPct(pct)}
                      </p>
                    </div>
                  </div>

                  {/* Días asignados / programados */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                        Días asignados ({diasConRegistro.length})
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleExpandirTodos(p.id)}
                        className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 underline decoration-[#f5b800] decoration-2 transition"
                      >
                        {expandidos[p.id] ? "Ocultar días del mes" : "Ver / agregar más días"}
                      </button>
                    </div>

                    {diasConRegistro.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic py-1">
                        Sin días programados. Toca "Ver / agregar más días" para planificar fechas.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {diasConRegistro.map((c) => {
                          const key = clave(p.id, c.dia);
                          const celda = datos[key] ?? CELDA_VACIA;
                          const sinGuardar = modificadas.has(key);
                          const texto = textoEjecucion(celda);

                          return (
                            <div
                              key={key}
                              className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 transition ${
                                sinGuardar
                                  ? "border-amber-300 bg-amber-50/70"
                                  : "border-zinc-200 bg-white hover:border-zinc-300"
                              }`}
                            >
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-zinc-900">
                                  {c.etiqueta} {c.dia}
                                </span>
                                {celda.observacion && (
                                  <span
                                    title={`Observación: ${celda.observacion}`}
                                    className="ml-1.5 inline-block text-[10px] text-amber-600 font-medium"
                                  >
                                    💬 Obs
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {editable ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => togglePlanificado(p.id, c.dia)}
                                      className={`h-7 px-2.5 rounded-lg text-xs font-bold transition ${
                                        celda.planificado > 0
                                          ? "bg-[#09090b] text-[#f5b800]"
                                          : "bg-zinc-100 text-zinc-400"
                                      }`}
                                      title={celda.planificado > 0 ? "Quitar P" : "Planificar P"}
                                    >
                                      P
                                    </button>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      maxLength={3}
                                      value={texto}
                                      onChange={(e) => cambiarEjecucion(p.id, c.dia, e.target.value)}
                                      placeholder="0"
                                      className={`h-7 w-10 rounded-lg border text-center text-xs font-bold tabular-nums focus:outline-[#f5b800] focus:ring-1 focus:ring-[#f5b800] ${
                                        texto === "N"
                                          ? "border-rose-300 bg-rose-50 text-rose-700"
                                          : texto
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                            : "border-zinc-200 bg-zinc-50"
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => cambiarEjecucion(p.id, c.dia, texto === "N" ? "" : "N")}
                                      className={`h-7 px-2 rounded-lg text-xs font-bold transition border ${
                                        texto === "N"
                                          ? "border-rose-300 bg-rose-100 text-rose-800 font-black"
                                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                                      }`}
                                      title="Marcar No ejecutada"
                                    >
                                      N
                                    </button>
                                  </>
                                ) : seleccionable && celda.planificado > 0 && c.dia <= diaActual ? (
                                  <button
                                    type="button"
                                    onClick={() => onSeleccionarCelda({ plantillaId: p.id, dia: c.dia })}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition border ${
                                      texto === "N"
                                        ? "border-rose-300 bg-rose-50 text-rose-700"
                                        : texto
                                          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                          : "border-amber-400 bg-amber-100 text-amber-900 ring-2 ring-amber-400/30"
                                    }`}
                                  >
                                    {texto === "N" ? "No ejec (N)" : texto ? `Ejecutada (${texto})` : "Registrar ?"}
                                  </button>
                                ) : (
                                  <span
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums border ${
                                      celda.ejecutado
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : celda.noEjecutado
                                          ? "border-rose-200 bg-rose-50 text-rose-700"
                                          : "border-zinc-200 bg-zinc-50 text-zinc-500"
                                    }`}
                                  >
                                    {celda.ejecutado
                                      ? `Ejec: ${celda.ejecutado}`
                                      : celda.noEjecutado
                                        ? "No ejec (N)"
                                        : "Planificado (P)"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Mini calendario desplegable para planificar cualquier día */}
                    {expandidos[p.id] && (
                      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 space-y-2">
                        <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                          Días de {mes} ({editable ? "toca un día para activar o quitar P" : "calendario"})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {columnas.map((c) => {
                            const key = clave(p.id, c.dia);
                            const celda = datos[key] ?? CELDA_VACIA;
                            const sinGuardar = modificadas.has(key);
                            const plan = celda.planificado > 0;
                            const ejec = celda.ejecutado > 0;
                            const noEjec = celda.noEjecutado > 0;

                            return (
                              <button
                                key={`cal-${key}`}
                                type="button"
                                disabled={!editable && !(seleccionable && plan && c.dia <= diaActual)}
                                onClick={() => {
                                  if (editable) togglePlanificado(p.id, c.dia);
                                  else if (seleccionable && plan && c.dia <= diaActual) {
                                    onSeleccionarCelda({ plantillaId: p.id, dia: c.dia });
                                  }
                                }}
                                className={`flex flex-col items-center justify-center h-11 w-10 rounded-lg border text-[10px] font-bold transition ${
                                  sinGuardar
                                    ? "ring-2 ring-amber-400 border-amber-400 bg-amber-50"
                                    : ejec
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-extrabold"
                                      : noEjec
                                        ? "border-rose-300 bg-rose-50 text-rose-700 font-extrabold"
                                        : plan
                                          ? "border-zinc-950 bg-[#09090b] text-[#f5b800] shadow-xs"
                                          : c.finDeSemana
                                            ? "border-zinc-200/60 bg-zinc-100/50 text-zinc-300"
                                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                                }`}
                              >
                                <span className="text-[9px] opacity-75">{c.etiqueta.slice(0, 2)}</span>
                                <span className="tabular-nums font-extrabold">{c.dia}</span>
                                <span className="text-[8px] leading-none">
                                  {ejec ? celda.ejecutado : noEjec ? "N" : plan ? "P" : "·"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VISTA 2: MATRIZ CALENDARIO (Con columna fija compacta en móvil para no aplastar los días) */}
      {vistaActual === "matriz" && (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <table className="w-full border-collapse text-left text-[11px]">
            <thead className="bg-zinc-50/90 font-bold uppercase text-zinc-600 tracking-wider">
              <tr className="border-b border-zinc-200">
                <th rowSpan={2} className="w-8 border-r border-zinc-200 p-1.5 text-center text-zinc-400">N°</th>
                <th rowSpan={2} className="sticky left-0 z-20 w-[110px] min-w-[110px] max-w-[110px] sm:w-[150px] sm:min-w-[150px] sm:max-w-[150px] md:w-auto md:min-w-[240px] border-r border-zinc-200 bg-zinc-50 p-2 md:p-2.5 text-zinc-950 font-bold">
                  Elemento
                </th>
                <th rowSpan={2} className="hidden w-12 border-r border-zinc-200 p-1.5 text-center md:table-cell text-zinc-500">Cant.</th>
                <th rowSpan={2} className="hidden min-w-[90px] border-r border-zinc-200 p-1.5 md:table-cell text-zinc-500">Periodicidad</th>
                <th rowSpan={2} className="hidden min-w-[105px] border-r border-zinc-200 p-1.5 md:table-cell text-zinc-500">Código</th>
                {columnas.map((c) => (
                  <th
                    key={`dow-${c.dia}`}
                    className={`w-7 border-r border-zinc-200 px-0.5 pt-1.5 text-center text-[9px] font-semibold ${
                      c.finDeSemana ? "bg-zinc-100/70 text-zinc-400" : "text-zinc-600"
                    }`}
                  >
                    {c.etiqueta}
                  </th>
                ))}
                <th colSpan={2} className="border-zinc-200 bg-zinc-100/70 p-1.5 text-center text-[10px] font-bold text-zinc-700">
                  Efectividad
                </th>
              </tr>
              <tr className="border-b border-zinc-200">
                {columnas.map((c) => (
                  <th
                    key={`dia-${c.dia}`}
                    className={`border-r border-zinc-200 px-0.5 pb-1.5 text-center tabular-nums text-[10px] ${
                      c.finDeSemana ? "bg-zinc-100/70 text-zinc-400" : "text-zinc-700 font-bold"
                    }`}
                  >
                    {c.dia}
                  </th>
                ))}
                <th className="w-10 border-r border-zinc-200 bg-zinc-100/70 p-1 text-center text-[10px] font-bold text-zinc-700">Total</th>
                <th className="w-12 bg-zinc-100/70 p-1 text-center text-[10px] font-bold text-zinc-700">%</th>
              </tr>
            </thead>

            <tbody>
              {plantillas.length === 0 && (
                <tr>
                  <td colSpan={columnasTotales} className="p-6 text-center text-sm text-zinc-500">
                    No hay formatos de inspección activos para esta vista.
                  </td>
                </tr>
              )}

              {plantillasVisibles.map((p, indice) => {
                const { totP, totE, pct } = totales.porPlantilla[p.id];

                return (
                  <Fragment key={p.id}>
                    {/* Fila superior: P (planificado) */}
                    <tr className="border-t border-zinc-200">
                      <td rowSpan={2} className="border-r border-zinc-200 p-1 text-center font-semibold tabular-nums text-zinc-400">
                        {indice + 1}
                      </td>
                      <td rowSpan={2} className="group sticky left-0 z-10 w-[110px] min-w-[110px] max-w-[110px] sm:w-[150px] sm:min-w-[150px] sm:max-w-[150px] md:w-auto md:min-w-[240px] border-r border-zinc-200 bg-white p-2 md:p-2.5 font-medium leading-snug text-zinc-950">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-1">
                          <div className="min-w-0">
                            <span className="block font-mono text-[9px] text-zinc-400 md:hidden">{p.codigoFormato}</span>
                            <button
                              type="button"
                              onClick={() => setInspeccionDetalle(p)}
                              className="text-left w-full hover:underline focus:outline-none"
                              title={p.elementoNombre}
                            >
                              <span
                                className={`block text-[11px] md:text-xs leading-tight line-clamp-2 md:line-clamp-none ${
                                  p.activo === false ? "text-zinc-400" : "font-semibold text-zinc-950"
                                }`}
                              >
                                {p.elementoNombre}
                              </span>
                            </button>
                            {p.activo === false && (
                              <span className="mt-0.5 inline-block rounded-full bg-zinc-100 px-1.5 py-px align-middle text-[9px] font-medium text-zinc-500">
                                Eliminada
                              </span>
                            )}
                          </div>
                          {modo !== "inspector" && p.activo !== false && (
                            <span className="flex shrink-0">
                              <EditarInspeccion plantilla={p} />
                              <BotonEliminarInspeccion plantilla={p} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td rowSpan={2} className="hidden border-r border-zinc-200 p-1 text-center tabular-nums text-zinc-600 md:table-cell font-medium">
                        {p.cantidadPlanificada ?? "—"}
                      </td>
                      <td rowSpan={2} className="hidden border-r border-zinc-200 p-1 text-[10px] leading-snug text-zinc-500 md:table-cell">
                        {p.periodicidad}
                      </td>
                      <td rowSpan={2} className="hidden border-r border-zinc-200 p-1 font-mono text-[10px] text-zinc-500 md:table-cell">
                        {p.codigoFormato}
                      </td>

                      {columnas.map((c) => {
                        const key = clave(p.id, c.dia);
                        const celda = datos[key] ?? CELDA_VACIA;
                        const sinGuardar = modificadas.has(key);
                        return (
                          <td
                            key={c.dia}
                            className={`h-6 border-r border-b border-zinc-200 p-0 text-center ${
                              sinGuardar ? "bg-amber-100" : c.finDeSemana ? "bg-zinc-100/70" : "bg-zinc-50/20"
                            }`}
                          >
                            {editable ? (
                              <button
                                type="button"
                                aria-label={`Planificar ${p.elementoNombre} día ${c.dia}`}
                                aria-pressed={celda.planificado > 0}
                                onClick={() => togglePlanificado(p.id, c.dia)}
                                className={`mx-auto flex h-5 w-5 items-center justify-center rounded-lg text-[10px] font-bold transition ${
                                  celda.planificado > 0
                                    ? "bg-[#09090b] text-[#f5b800] shadow-2xs ring-1 ring-black/10"
                                    : "text-zinc-300 hover:bg-zinc-100 hover:text-zinc-700"
                                }`}
                              >
                                {celda.planificado > 0 ? "P" : "·"}
                              </button>
                            ) : (
                              <span className={`text-[10px] font-bold ${celda.planificado ? "text-[#09090b]" : "text-zinc-300"}`}>
                                {celda.planificado > 1 ? celda.planificado : celda.planificado === 1 ? "P" : ""}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      <td className="border-r border-b border-zinc-200 bg-zinc-50 p-1 text-center font-bold tabular-nums text-zinc-900">
                        {totP}
                      </td>
                      <td
                        rowSpan={2}
                        className={`p-1 text-center text-xs font-black tabular-nums ${fondoEfectividad(pct, totP)} ${colorEfectividad(pct, totP)}`}
                      >
                        {formatoPct(pct)}
                      </td>
                    </tr>

                    {/* Fila inferior: E (cantidad ejecutada) o N (no ejecutada) */}
                    <tr>
                      {columnas.map((c) => {
                        const key = clave(p.id, c.dia);
                        const celda = datos[key] ?? CELDA_VACIA;
                        const sinGuardar = modificadas.has(key);
                        const texto = textoEjecucion(celda);
                        const pendienteSinMarca = celda.planificado > 0 && !celda.ejecutado && !celda.noEjecutado;
                        return (
                          <td
                            key={c.dia}
                            title={celda.observacion ? `Observación: ${celda.observacion}` : undefined}
                            className={`relative h-6 border-r border-b border-zinc-200 p-0 text-center ${
                              sinGuardar ? "bg-amber-100" : c.finDeSemana ? "bg-zinc-100/70" : ""
                            }`}
                          >
                            {celda.observacion && (
                              <span
                                aria-label="Tiene observación"
                                className="pointer-events-none absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500"
                              />
                            )}
                            {editable ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={3}
                                aria-label={`Ejecución ${p.elementoNombre} día ${c.dia}`}
                                value={texto}
                                onChange={(e) => cambiarEjecucion(p.id, c.dia, e.target.value)}
                                className={`h-5 w-6 rounded border text-center text-[11px] font-bold tabular-nums focus:outline-[#f5b800] focus:ring-1 focus:ring-[#f5b800] ${
                                  texto === "N"
                                    ? "border-rose-300 bg-rose-50 text-rose-700"
                                    : texto
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                      : pendienteSinMarca
                                        ? "border-amber-300 bg-white"
                                        : "border-zinc-200 bg-white"
                                }`}
                              />
                            ) : seleccionable && celda.planificado > 0 && c.dia <= diaActual ? (
                              <button
                                type="button"
                                onClick={() => onSeleccionarCelda({ plantillaId: p.id, dia: c.dia })}
                                aria-label={`Registrar ${p.elementoNombre} del día ${c.dia}`}
                                aria-pressed={celdaSeleccionada === key}
                                className={`mx-auto flex h-5 w-6 items-center justify-center rounded border text-[11px] font-bold tabular-nums transition hover:ring-2 hover:ring-[#f5b800]/50 ${
                                  celdaSeleccionada === key ? "ring-2 ring-[#f5b800]" : ""
                                } ${
                                  texto === "N"
                                    ? "border-rose-300 bg-rose-50 text-rose-700"
                                    : texto
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                      : "border-amber-400 bg-amber-100 text-amber-800"
                                }`}
                              >
                                {texto || "?"}
                              </button>
                            ) : (
                              <span
                                className={`text-[10px] font-bold tabular-nums ${
                                  celda.ejecutado ? "text-emerald-700" : celda.noEjecutado ? "text-rose-600" : ""
                                }`}
                              >
                                {celda.ejecutado
                                  ? celda.ejecutado
                                  : celda.noEjecutado
                                    ? celda.noEjecutado > 1
                                      ? `N${celda.noEjecutado}`
                                      : "N"
                                    : ""}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="border-r border-b border-zinc-200 bg-emerald-50/50 p-1 text-center font-bold tabular-nums text-emerald-800">
                        {totE}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>

            {plantillas.length > 0 && (
              <tfoot className="border-t-2 border-zinc-300 bg-zinc-100/90 font-bold">
                <tr>
                  <td colSpan={2} className="sticky left-0 z-10 bg-zinc-100 p-2 text-right uppercase text-zinc-700 text-[10px] md:text-xs">
                    Total
                  </td>
                  <td colSpan={columnasFijas - 2} className="hidden md:table-cell" />
                  <td colSpan={columnas.length} />
                  <td className="border-r border-zinc-300 p-1 text-center tabular-nums">
                    <div className="text-zinc-950 font-bold">{totales.globalP}</div>
                    <div className="text-emerald-700 font-bold">{totales.globalE}</div>
                  </td>
                  <td className={`p-1 text-center text-xs font-black tabular-nums ${colorEfectividad(globalPct, totales.globalP)}`}>
                    {formatoPct(globalPct)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Resumen semanal (ocupa todo el ancho, igual que la matriz) */}
      <div>
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white text-xs shadow-xs">
          <h3 className="border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 font-bold uppercase text-zinc-700 tracking-wider text-xs">
            Resumen semanal
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                <tr className="border-b border-zinc-200">
                  <th className="px-4 py-2">Semana</th>
                  <th className="px-4 py-2">Días</th>
                  <th className="px-4 py-2 text-right">Planif.</th>
                  <th className="px-4 py-2 text-right">Ejec.</th>
                  <th className="px-4 py-2 text-right">N</th>
                  <th className="px-4 py-2 text-right">% Efect.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {semanasDelMes.map((s) => {
                  const pct = efectividad(s.p, s.e);
                  return (
                    <tr key={s.semana} className="tabular-nums hover:bg-zinc-50/70 transition">
                      <td className="px-4 py-2 font-bold text-zinc-900">{s.semana}</td>
                      <td className="px-4 py-2 text-zinc-500 font-medium">
                        {String(s.desde).padStart(2, "0")} al {String(s.hasta).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-zinc-900">{s.p}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-700">{s.e}</td>
                      <td className="px-4 py-2 text-right font-bold text-rose-600">{s.n}</td>
                      <td className={`px-4 py-2 text-right font-black ${colorEfectividad(pct, s.p)}`}>
                        {formatoPct(pct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal de detalle de inspección al tocar en móvil */}
      {inspeccionDetalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setInspeccionDetalle(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-semibold text-zinc-500">
                  {inspeccionDetalle.codigoFormato}
                </span>
                <h3 className="text-base font-black text-zinc-950 mt-1 leading-snug">
                  {inspeccionDetalle.elementoNombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspeccionDetalle(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600 border border-zinc-200/80">
              <div className="flex justify-between">
                <span className="font-medium text-zinc-500">Periodicidad:</span>
                <span className="font-bold text-zinc-900">{inspeccionDetalle.periodicidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-zinc-500">Cantidad planificada:</span>
                <span className="font-bold text-zinc-900">{inspeccionDetalle.cantidadPlanificada ?? "—"}</span>
              </div>
              {totales.porPlantilla[inspeccionDetalle.id] && (
                <>
                  <div className="flex justify-between pt-1 border-t border-zinc-200">
                    <span className="font-medium text-zinc-500">Planificadas este mes:</span>
                    <span className="font-bold text-zinc-900">{totales.porPlantilla[inspeccionDetalle.id].totP}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-emerald-700">Ejecutadas este mes:</span>
                    <span className="font-bold text-emerald-800">{totales.porPlantilla[inspeccionDetalle.id].totE}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-rose-700">No ejecutadas (N):</span>
                    <span className="font-bold text-rose-800">{totales.porPlantilla[inspeccionDetalle.id].totN}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-amber-800">Efectividad mensual:</span>
                    <span className={`font-black ${colorEfectividad(totales.porPlantilla[inspeccionDetalle.id].pct, totales.porPlantilla[inspeccionDetalle.id].totP)}`}>
                      {formatoPct(totales.porPlantilla[inspeccionDetalle.id].pct)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setInspeccionDetalle(null)}
                className="rounded-xl bg-[#09090b] px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
