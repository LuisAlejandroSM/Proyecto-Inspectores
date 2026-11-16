"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { asignarFormulario, quitarAsignacion } from "../actions";

/* -------------------------------------------------------------------------
 * ICONOS SVG VECTORIALES (Consistentes, trazo 2px)
 * ------------------------------------------------------------------------- */
function IconoPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}

function IconoBorrar() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  );
}

function IconoBuscar() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function IconoCerrar() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconoCalendario() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconoMano() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4v12a4 4 0 01-8 0V6a2 2 0 014 0v10" />
      <path d="M12 14v4a2 2 0 004 0v-6" />
    </svg>
  );
}

function IconoChevron({ abierto }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconoInfo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-amber-700" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

/* -------------------------------------------------------------------------
 * COMPONENTES AUXILIARES DE UI
 * ------------------------------------------------------------------------- */
function iniciales(nombre) {
  return String(nombre ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function AvatarInspector({ nombre, activo = false, size = "md" }) {
  const tamanios = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-10 w-10 text-sm",
  };
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-xl font-bold transition-all shadow-2xs ${tamanios[size]} ${
        activo
          ? "bg-[#f5b800] text-[#09090b] ring-2 ring-[#f5b800]/40"
          : "bg-zinc-100 text-zinc-700 border border-zinc-200"
      }`}
    >
      {iniciales(nombre)}
    </span>
  );
}

function BadgeOrigen({ origen }) {
  if (origen === "cronograma") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 shadow-2xs">
        <IconoCalendario />
        Cronograma
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/90 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 shadow-2xs">
      <IconoMano />
      Manual
    </span>
  );
}

function BadgeEstado({ estado, vencida }) {
  if (estado === "completada") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
        <IconoCheck />
        Completada
      </span>
    );
  }
  if (vencida) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
        Vencida
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 shadow-2xs">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pendiente
    </span>
  );
}

function BarraProgresoInspector({ completada, numPreguntas }) {
  const porcentaje = completada ? 100 : 0;
  return (
    <div className="flex flex-col gap-1 min-w-[130px] max-w-[170px]">
      <div className="flex items-center justify-between text-[11px]">
        <span className={`font-semibold ${completada ? "text-emerald-700" : "text-zinc-600"}`}>
          {completada ? `${numPreguntas} / ${numPreguntas}` : `0 / ${numPreguntas}`}
        </span>
        <span className="text-[10px] text-zinc-400 font-medium">respondidas</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 border border-zinc-200/60">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            completada ? "bg-emerald-500" : "bg-amber-400"
          }`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * COMPONENTE PRINCIPAL
 * ------------------------------------------------------------------------- */
export default function PanelAsignaciones({
  formularioId,
  activo,
  rol,
  formato = null,
  inspectores = [],
  asignaciones = [],
  numPreguntas = 0,
}) {
  const [isPending, startTransition] = useTransition();

  // Estados del Drawer de Asignación
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [busquedaInspector, setBusquedaInspector] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [nota, setNota] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "idle", texto: "" });

  // Estados de la lista / tabla de seguimiento
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos | pendientes | completadas | vencidas | manuales | cronograma
  const [busquedaTabla, setBusquedaTabla] = useState("");
  const [vistaModo, setVistaModo] = useState("agrupado"); // agrupado | tabla
  const [gruposExpandidos, setGruposExpandidos] = useState(() => new Set());

  // Métricas generales
  const completadas = asignaciones.filter((a) => a.estado === "completada").length;
  const vencidas = asignaciones.filter((a) => a.vencida).length;
  const pendientes = asignaciones.length - completadas;
  const manuales = asignaciones.filter((a) => a.origen !== "cronograma").length;
  const cronogramas = asignaciones.filter((a) => a.origen === "cronograma").length;
  const tasaAvance = asignaciones.length ? Math.round((completadas / asignaciones.length) * 100) : 0;

  // Inspectores con tareas pendientes actualmente
  const conPendienteSet = useMemo(
    () => new Set(asignaciones.filter((a) => a.estado === "pendiente").map((a) => a.usuarioId)),
    [asignaciones]
  );

  // Manejo de tecla Escape para cerrar el drawer
  const cerrarDrawer = useCallback(() => {
    setDrawerAbierto(false);
    setSeleccion(new Set());
    setFechaLimite("");
    setNota("");
    setBusquedaInspector("");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && drawerAbierto) {
        cerrarDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerAbierto, cerrarDrawer]);

  // Selección de inspectores en el drawer
  const inspectoresDrawer = useMemo(() => {
    const q = busquedaInspector.trim().toLocaleLowerCase("es");
    if (!q) return inspectores;
    return inspectores.filter(
      (i) =>
        i.nombre.toLocaleLowerCase("es").includes(q) ||
        (i.alias && i.alias.toLocaleLowerCase("es").includes(q)) ||
        (i.cargo && i.cargo.toLocaleLowerCase("es").includes(q))
    );
  }, [inspectores, busquedaInspector]);

  const todosDrawerMarcados =
    inspectoresDrawer.length > 0 && inspectoresDrawer.every((i) => seleccion.has(i.id));

  const alternarInspector = (id) => {
    setSeleccion((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const alternarTodosDrawer = () => {
    setSeleccion((prev) => {
      const s = new Set(prev);
      inspectoresDrawer.forEach((i) => (todosDrawerMarcados ? s.delete(i.id) : s.add(i.id)));
      return s;
    });
  };

  // Atajos rápidos para fecha límite en el drawer
  const aplicarAtajoFecha = (dias) => {
    const f = new Date();
    f.setDate(f.getDate() + dias);
    const dos = (n) => String(n).padStart(2, "0");
    setFechaLimite(`${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`);
  };

  // Ejecución de asignación
  const ejecutarAsignar = () => {
    if (seleccion.size === 0) return;
    startTransition(async () => {
      try {
        const res = await asignarFormulario({
          formularioId,
          usuarioIds: [...seleccion],
          fechaLimite: fechaLimite || null,
          nota,
        });
        if (res?.success) {
          setMensaje({ tipo: "ok", texto: `Asignación manual creada para ${res.asignadas} inspector(es).` });
          cerrarDrawer();
        } else {
          setMensaje({ tipo: "error", texto: res?.error ?? "No se pudo asignar el formulario." });
        }
      } catch {
        setMensaje({ tipo: "error", texto: "Sin conexión con el servidor." });
      }
    });
  };

  // Quitar asignación manual
  const ejecutarQuitar = (a) => {
    if (!window.confirm(`¿Quitar la asignación de ${a.inspector}? Se borrarán las respuestas o fotos que haya subido.`)) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await quitarAsignacion({ id: a.id });
        if (res?.success) {
          setMensaje({ tipo: "ok", texto: "Asignación eliminada correctamente." });
        } else {
          setMensaje({ tipo: "error", texto: res?.error ?? "No se pudo quitar la asignación." });
        }
      } catch {
        setMensaje({ tipo: "error", texto: "Sin conexión con el servidor." });
      }
    });
  };

  // Filtrado de la tabla de seguimiento
  const asignacionesFiltradas = useMemo(() => {
    return asignaciones.filter((a) => {
      // Filtro de texto
      const q = busquedaTabla.trim().toLocaleLowerCase("es");
      if (q) {
        const coincideNombre = a.inspector.toLocaleLowerCase("es").includes(q);
        const coincideAlias = a.alias && a.alias.toLocaleLowerCase("es").includes(q);
        const coincideCargo = a.cargo && a.cargo.toLocaleLowerCase("es").includes(q);
        const coincideNota = a.nota && a.nota.toLocaleLowerCase("es").includes(q);
        if (!coincideNombre && !coincideAlias && !coincideCargo && !coincideNota) return false;
      }

      // Filtro de estado / origen
      if (filtroEstado === "pendientes") return a.estado === "pendiente";
      if (filtroEstado === "completadas") return a.estado === "completada";
      if (filtroEstado === "vencidas") return a.vencida;
      if (filtroEstado === "manuales") return a.origen !== "cronograma";
      if (filtroEstado === "cronograma") return a.origen === "cronograma";
      return true;
    });
  }, [asignaciones, busquedaTabla, filtroEstado]);

  // Agrupación por inspector
  const gruposInspectores = useMemo(() => {
    const mapa = new Map();
    for (const a of asignacionesFiltradas) {
      const key = a.usuarioId || a.inspector;
      if (!mapa.has(key)) {
        mapa.set(key, {
          usuarioId: a.usuarioId,
          inspector: a.inspector,
          alias: a.alias,
          cargo: a.cargo,
          rol: a.rol,
          asignaciones: [],
          totalCompletadas: 0,
          totalPendientes: 0,
          totalVencidas: 0,
        });
      }
      const g = mapa.get(key);
      g.asignaciones.push(a);
      if (a.estado === "completada") g.totalCompletadas += 1;
      else {
        g.totalPendientes += 1;
        if (a.vencida) g.totalVencidas += 1;
      }
    }

    // Inicializar expandidos por defecto si la lista es corta
    return Array.from(mapa.values());
  }, [asignacionesFiltradas]);

  // Toggle de expansión por inspector
  const alternarGrupo = (id) => {
    setGruposExpandidos((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const expandirTodosLosGrupos = (expandir) => {
    if (expandir) {
      setGruposExpandidos(new Set(gruposInspectores.map((g) => g.usuarioId)));
    } else {
      setGruposExpandidos(new Set());
    }
  };

  return (
    <div className="space-y-5">
      {/* -----------------------------------------------------------------
       * NOTIFICACIÓN TEMPORAL DE ÉXITO O ERROR
       * ----------------------------------------------------------------- */}
      {mensaje.texto && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-2xs transition-all ${
            mensaje.tipo === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <span>{mensaje.texto}</span>
          <button
            type="button"
            onClick={() => setMensaje({ tipo: "idle", texto: "" })}
            className="text-zinc-500 hover:text-zinc-900 transition"
            aria-label="Cerrar mensaje"
          >
            <IconoCerrar />
          </button>
        </div>
      )}

      {/* -----------------------------------------------------------------
       * TARJETA CABECERA RESUMEN + MÉTRICAS KPI + BOTÓN PRINCIPAL DE ACCIÓN
       * ----------------------------------------------------------------- */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-zinc-950">
                Asignaciones y Seguimiento
              </h2>
              {rol && (
                <span className="rounded-full border border-amber-300 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  {rol}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Control en tiempo real de inspecciones programadas ({numPreguntas} preguntas por responder)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {formato && (
              <div className="hidden lg:flex items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-1.5 text-xs text-amber-900">
                <IconoInfo />
                <span>
                  Vinculado a <strong>{formato.codigo}</strong>
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setDrawerAbierto(true)}
              disabled={!activo || !rol || inspectores.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f5b800] px-4 py-2.5 text-xs font-bold text-[#09090b] shadow-xs transition hover:bg-[#e0a800] active:scale-[0.98] disabled:opacity-40"
            >
              <IconoPlus />
              + Nueva asignación manual
            </button>
          </div>
        </div>

        {/* Franja de Métricas / KPI Cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 border-t border-zinc-100 pt-4">
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-3 sm:p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total asignadas</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-zinc-950">{asignaciones.length}</span>
              <span className="text-xs text-zinc-500 font-medium">órdenes</span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 sm:p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Completadas</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-emerald-800">{completadas}</span>
              <span className="text-xs text-emerald-700 font-bold tabular-nums">({tasaAvance}%)</span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 sm:p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Pendientes</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-amber-800">{pendientes}</span>
              <span className="text-xs text-amber-700 font-medium">por responder</span>
            </div>
          </div>

          <div className={`rounded-xl border p-3 sm:p-3.5 ${vencidas > 0 ? "border-rose-200 bg-rose-50/50" : "border-zinc-200/80 bg-zinc-50/50"}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${vencidas > 0 ? "text-rose-700" : "text-zinc-400"}`}>
              Vencidas
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-2xl font-black tabular-nums ${vencidas > 0 ? "text-rose-700" : "text-zinc-950"}`}>
                {vencidas}
              </span>
              <span className="text-xs text-zinc-500 font-medium">{vencidas === 1 ? "vencida" : "vencidas"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* -----------------------------------------------------------------
       * BARRA DE HERRAMIENTAS: BÚSQUEDA, FILTROS RÁPIDOS Y CONMUTADOR DE VISTA
       * ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Pills de Filtrado rápido */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFiltroEstado("todos")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              filtroEstado === "todos"
                ? "bg-[#09090b] text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
            }`}
          >
            Todos ({asignaciones.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("pendientes")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              filtroEstado === "pendientes"
                ? "bg-[#09090b] text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
            }`}
          >
            Pendientes ({pendientes})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("completadas")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              filtroEstado === "completadas"
                ? "bg-[#09090b] text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
            }`}
          >
            Completadas ({completadas})
          </button>
          {vencidas > 0 && (
            <button
              type="button"
              onClick={() => setFiltroEstado("vencidas")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                filtroEstado === "vencidas"
                  ? "bg-rose-700 text-white"
                  : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              Vencidas ({vencidas})
            </button>
          )}
          <span className="hidden sm:inline-block h-4 w-px bg-zinc-200 mx-1" />
          <button
            type="button"
            onClick={() => setFiltroEstado("manuales")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              filtroEstado === "manuales"
                ? "bg-[#09090b] text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
            }`}
          >
            Manuales ({manuales})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado("cronograma")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              filtroEstado === "cronograma"
                ? "bg-[#09090b] text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
            }`}
          >
            Cronograma ({cronogramas})
          </button>
        </div>

        {/* Buscador y selector de vista */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <IconoBuscar />
            </span>
            <input
              type="search"
              value={busquedaTabla}
              onChange={(e) => setBusquedaTabla(e.target.value)}
              placeholder="Buscar inspector…"
              className="w-full rounded-xl border border-zinc-200 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-zinc-900 shadow-2xs placeholder:text-zinc-400 outline-none focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition"
            />
          </div>

          {/* Conmutador de vista */}
          <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setVistaModo("agrupado")}
              title="Vista agrupada por inspector"
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                vistaModo === "agrupado"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              Agrupado
            </button>
            <button
              type="button"
              onClick={() => setVistaModo("tabla")}
              title="Vista en tabla detallada"
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                vistaModo === "tabla"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              Tabla
            </button>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------
       * SECCIÓN DE SEGUIMIENTO (VISTA AGRUPADA O VISTA TABLA)
       * ----------------------------------------------------------------- */}
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        {asignaciones.length === 0 ? (
          /* Estado vacío inicial */
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-3 border border-zinc-200">
              <IconoCalendario />
            </div>
            <h3 className="text-base font-bold text-zinc-950">Aún no hay asignaciones para este formulario</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">
              {formato
                ? "Las asignaciones del cronograma se programan automáticamente en la matriz, o puede pulsar el botón superior para asignar manualmente."
                : "Pulse en '+ Nueva asignación manual' para asignar este formulario al personal operativo."}
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setDrawerAbierto(true)}
                disabled={!activo || !rol || inspectores.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#f5b800] px-4 py-2 text-xs font-bold text-[#09090b] shadow-xs hover:bg-[#e0a800] transition disabled:opacity-40"
              >
                <IconoPlus />
                + Asignar a inspector
              </button>
            </div>
          </div>
        ) : asignacionesFiltradas.length === 0 ? (
          /* Estado vacío por filtro */
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-zinc-800">No hay asignaciones que coincidan con los filtros</p>
            <p className="mt-1 text-xs text-zinc-500">Pruebe a limpiar la búsqueda o cambiar la pestaña de estado.</p>
            <button
              type="button"
              onClick={() => {
                setFiltroEstado("todos");
                setBusquedaTabla("");
              }}
              className="mt-3 text-xs font-bold text-amber-700 hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : vistaModo === "agrupado" ? (
          /* -------------------------------------------------------------
           * VISTA 1: AGRUPADA POR INSPECTOR (Acordeones limpios)
           * ------------------------------------------------------------- */
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 text-xs">
              <span className="font-semibold text-zinc-500">
                Mostrando <strong>{gruposInspectores.length}</strong> inspectores con asignaciones activas
              </span>
              <div className="flex gap-3 text-xs font-bold text-zinc-600">
                <button
                  type="button"
                  onClick={() => expandirTodosLosGrupos(true)}
                  className="hover:text-zinc-950 hover:underline transition"
                >
                  Expandir todos
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => expandirTodosLosGrupos(false)}
                  className="hover:text-zinc-950 hover:underline transition"
                >
                  Colapsar todos
                </button>
              </div>
            </div>

            <div className="divide-y divide-zinc-100">
              {gruposInspectores.map((grupo) => {
                const abierto = gruposExpandidos.has(grupo.usuarioId);
                const porcentaje = grupo.asignaciones.length
                  ? Math.round((grupo.totalCompletadas / grupo.asignaciones.length) * 100)
                  : 0;

                return (
                  <div key={grupo.usuarioId} className="transition">
                    {/* Encabezado del Inspector en el grupo */}
                    <div
                      onClick={() => alternarGrupo(grupo.usuarioId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && alternarGrupo(grupo.usuarioId)}
                      className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-zinc-50/80 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarInspector nombre={grupo.inspector} activo={grupo.totalPendientes === 0} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-950 truncate">{grupo.inspector}</span>
                            {grupo.alias && (
                              <span className="font-mono text-xs text-zinc-400">@{grupo.alias}</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500">
                            {grupo.cargo || grupo.rol} ·{" "}
                            <span className="font-medium text-zinc-700">
                              {grupo.asignaciones.length} asignación{grupo.asignaciones.length !== 1 ? "es" : ""}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Indicadores rápidos del inspector */}
                        <div className="hidden sm:flex items-center gap-2 text-xs">
                          {grupo.totalCompletadas > 0 && (
                            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                              {grupo.totalCompletadas} completada{grupo.totalCompletadas !== 1 ? "s" : ""}
                            </span>
                          )}
                          {grupo.totalPendientes > 0 && (
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-bold text-amber-800">
                              {grupo.totalPendientes} pendiente{grupo.totalPendientes !== 1 ? "s" : ""}
                            </span>
                          )}
                          {grupo.totalVencidas > 0 && (
                            <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-bold text-rose-700">
                              {grupo.totalVencidas} vencida{grupo.totalVencidas !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {/* Barra de progreso rápida */}
                        <div className="hidden md:flex flex-col items-end gap-1 w-24">
                          <span className="text-[10px] font-bold text-zinc-500 tabular-nums">{porcentaje}%</span>
                          <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>

                        <span className="text-zinc-400">
                          <IconoChevron abierto={abierto} />
                        </span>
                      </div>
                    </div>

                    {/* Sub-tabla desplegable de asignaciones del inspector */}
                    {abierto && (
                      <div className="border-t border-zinc-100 bg-zinc-50/40 px-5 py-3">
                        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="py-2.5 px-3">Origen</th>
                                <th className="py-2.5 px-3">Progreso</th>
                                <th className="py-2.5 px-3">Fecha Asignada</th>
                                <th className="py-2.5 px-3">Fecha Límite</th>
                                <th className="py-2.5 px-3">Estado</th>
                                <th className="py-2.5 px-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 text-zinc-900">
                              {grupo.asignaciones.map((a) => (
                                <tr key={a.id} className="hover:bg-zinc-50/70 transition">
                                  <td className="py-2.5 px-3">
                                    <div className="flex flex-col gap-0.5">
                                      <BadgeOrigen origen={a.origen} />
                                      {a.nota && (
                                        <span className="max-w-xs truncate text-[11px] italic text-zinc-500" title={a.nota}>
                                          &quot;{a.nota}&quot;
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <BarraProgresoInspector
                                      completada={a.estado === "completada"}
                                      numPreguntas={numPreguntas}
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-500 font-medium whitespace-nowrap">
                                    {a.asignadoTexto}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    {a.limiteTexto ? (
                                      <span
                                        className={`font-semibold ${
                                          a.vencida ? "text-rose-600 font-bold" : "text-zinc-700"
                                        }`}
                                      >
                                        {a.limiteTexto}
                                        {a.vencida && <span className="ml-1 text-[10px] text-rose-600 font-bold">⚠️ Vencida</span>}
                                      </span>
                                    ) : (
                                      <span className="text-zinc-400">Sin límite</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 whitespace-nowrap">
                                    <BadgeEstado estado={a.estado} vencida={a.vencida} />
                                  </td>
                                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                      {a.estado === "completada" ? (
                                        <Link
                                          href={`/formularios/respuesta/${a.id}`}
                                          className="rounded-lg bg-[#09090b] px-3 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-zinc-800 transition"
                                        >
                                          Ver respuesta →
                                        </Link>
                                      ) : a.origen !== "cronograma" ? (
                                        <button
                                          type="button"
                                          onClick={() => ejecutarQuitar(a)}
                                          disabled={isPending}
                                          title="Eliminar asignación manual"
                                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                                        >
                                          <IconoBorrar />
                                        </button>
                                      ) : (
                                        <span className="text-[11px] text-zinc-400 italic">Cronograma</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* -------------------------------------------------------------
           * VISTA 2: TABLA COMPLETA DETALLADA (Moderna, densa y escaneable)
           * ------------------------------------------------------------- */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/80 font-bold uppercase tracking-wider text-[10px] text-zinc-600">
                <tr>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Origen / Tipo</th>
                  <th className="py-3 px-4">Progreso</th>
                  <th className="py-3 px-4">Fecha Límite</th>
                  <th className="py-3 px-4">Asignado</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-900">
                {asignacionesFiltradas.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <AvatarInspector nombre={a.inspector} activo={a.estado === "completada"} size="sm" />
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-950 truncate text-sm">{a.inspector}</p>
                          <p className="font-mono text-[11px] text-zinc-500">
                            {a.alias ? `@${a.alias}` : a.correo || a.cargo || a.rol}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <BadgeOrigen origen={a.origen} />
                        {a.nota && (
                          <span className="max-w-xs truncate text-[11px] italic text-zinc-500" title={a.nota}>
                            &quot;{a.nota}&quot;
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <BarraProgresoInspector
                        completada={a.estado === "completada"}
                        numPreguntas={numPreguntas}
                      />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {a.limiteTexto ? (
                        <div className="flex flex-col">
                          <span
                            className={`font-semibold text-xs ${
                              a.vencida ? "text-rose-600 font-bold" : "text-zinc-800"
                            }`}
                          >
                            {a.limiteTexto}
                          </span>
                          {a.vencida && <span className="text-[10px] text-rose-600 font-bold">⚠️ Vencida</span>}
                        </div>
                      ) : (
                        <span className="text-zinc-400">Sin límite</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-zinc-500 font-medium whitespace-nowrap">
                      {a.asignadoTexto}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <BadgeEstado estado={a.estado} vencida={a.vencida} />
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {a.estado === "completada" ? (
                          <Link
                            href={`/formularios/respuesta/${a.id}`}
                            className="rounded-lg bg-[#09090b] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 transition"
                          >
                            Ver respuesta →
                          </Link>
                        ) : a.origen !== "cronograma" ? (
                          <button
                            type="button"
                            onClick={() => ejecutarQuitar(a)}
                            disabled={isPending}
                            title="Eliminar asignación manual"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                          >
                            <IconoBorrar />
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Cronograma</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* -----------------------------------------------------------------
       * DRAWER LATERAL DESLIZABLE (SLIDE-OVER) PARA NUEVA ASIGNACIÓN
       * ----------------------------------------------------------------- */}
      {drawerAbierto && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop con desenfoque suave */}
          <div
            onClick={cerrarDrawer}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-slide-left">
              {/* Header del Drawer */}
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-6 py-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-950">Nueva Asignación Manual</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Solo para inspectores con rol <strong className="text-zinc-800">{rol}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cerrarDrawer}
                  className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-900 transition"
                  aria-label="Cerrar panel"
                >
                  <IconoCerrar />
                </button>
              </div>

              {/* Contenido scrolleable del Drawer */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Banner de vinculación al cronograma */}
                {formato && (
                  <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 p-3.5 text-xs text-zinc-700">
                    <p className="font-bold text-amber-950 flex items-center gap-1.5">
                      <IconoCalendario />
                      Vinculado a {formato.codigo}
                    </p>
                    <p className="mt-1 text-zinc-600 leading-relaxed">
                      Este formulario se programa automáticamente con cada &quot;P&quot; mensual del cronograma. Use este panel para asignar inspecciones manuales extraordinarias o imprevistas.
                    </p>
                  </div>
                )}

                {/* Paso 1: Selección de inspectores */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      1. Seleccione los Inspectores
                      {seleccion.size > 0 && (
                        <span className="ml-1.5 font-bold text-zinc-950 normal-case">
                          ({seleccion.size} marcado{seleccion.size !== 1 ? "s" : ""})
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={alternarTodosDrawer}
                      className="text-xs font-bold text-amber-800 hover:underline transition"
                    >
                      {todosDrawerMarcados ? "Deseleccionar todos" : "Seleccionar todos"}
                    </button>
                  </div>

                  {/* Buscador dentro del drawer */}
                  <div className="relative mb-2">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <IconoBuscar />
                    </span>
                    <input
                      type="search"
                      value={busquedaInspector}
                      onChange={(e) => setBusquedaInspector(e.target.value)}
                      placeholder="Buscar por nombre, usuario o cargo…"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pl-9 pr-3 text-xs font-medium text-zinc-900 shadow-2xs outline-none focus:bg-white focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition"
                    />
                  </div>

                  {/* Lista de inspectores seleccionables */}
                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 rounded-xl border border-zinc-200 p-2 bg-zinc-50/30">
                    {inspectoresDrawer.length === 0 ? (
                      <p className="py-6 text-center text-xs text-zinc-400">
                        No se encontraron inspectores con ese criterio.
                      </p>
                    ) : (
                      inspectoresDrawer.map((i) => {
                        const marcado = seleccion.has(i.id);
                        const tienePendiente = conPendienteSet.has(i.id);
                        return (
                          <button
                            key={i.id}
                            type="button"
                            role="checkbox"
                            aria-checked={marcado}
                            onClick={() => alternarInspector(i.id)}
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                              marcado
                                ? "border-[#f5b800] bg-amber-500/10 shadow-2xs ring-1 ring-[#f5b800]/40"
                                : "border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                            }`}
                          >
                            <AvatarInspector nombre={i.nombre} activo={marcado} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-zinc-950">{i.nombre}</p>
                              <p className="truncate text-[11px] font-mono text-zinc-500">
                                {i.alias ? `@${i.alias}` : i.cargo || i.rol}
                              </p>
                            </div>
                            {tienePendiente && (
                              <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                1 pendiente
                              </span>
                            )}
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                marcado
                                  ? "border-[#09090b] bg-[#09090b] text-white"
                                  : "border-zinc-300 bg-white text-transparent"
                              }`}
                            >
                              <IconoCheck />
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Paso 2: Detalles opcionales (Fecha y nota) */}
                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    2. Configuración (Opcional)
                  </span>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Fecha límite de entrega
                    </label>
                    <input
                      type="date"
                      value={fechaLimite}
                      onChange={(e) => setFechaLimite(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 shadow-2xs outline-none focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition"
                    />
                    {/* Atajos de fecha */}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => aplicarAtajoFecha(0)}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 transition shadow-2xs"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => aplicarAtajoFecha(3)}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 transition shadow-2xs"
                      >
                        +3 días
                      </button>
                      <button
                        type="button"
                        onClick={() => aplicarAtajoFecha(7)}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 transition shadow-2xs"
                      >
                        +1 semana
                      </button>
                      {fechaLimite && (
                        <button
                          type="button"
                          onClick={() => setFechaLimite("")}
                          className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 transition shadow-2xs"
                        >
                          Limpiar fecha
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-zinc-700">
                        Nota o instrucción especial
                      </label>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {nota.length}/300
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={300}
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="Ej. Revisión extraordinaria requerida tras el mantenimiento preventivo..."
                      className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-xs font-medium text-zinc-900 shadow-2xs outline-none focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer con botones de confirmación */}
              <div className="border-t border-zinc-100 bg-zinc-50/80 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarDrawer}
                  disabled={isPending}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={ejecutarAsignar}
                  disabled={isPending || seleccion.size === 0}
                  className="rounded-xl bg-[#f5b800] px-5 py-2 text-xs font-bold text-[#09090b] shadow-xs hover:bg-[#e0a800] active:scale-[0.98] transition disabled:opacity-40"
                >
                  {isPending
                    ? "Asignando…"
                    : seleccion.size > 0
                      ? `Asignar a ${seleccion.size} inspector${seleccion.size !== 1 ? "es" : ""}`
                      : "Elija al menos 1 inspector"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
