"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { vincularFormularioAPlantilla } from "../actions";

function IconoChevron({ abierto }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
        abierto ? "rotate-180 text-zinc-900" : ""
      }`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * Módulo en formato lista vertical (una abajo de otra) para gestionar las inspecciones
 * del cronograma que no tienen formulario digital. Al tocar una fila, se despliega
 * el panel con las opciones de crear o vincular formulario.
 */
export default function InspeccionesSinFormulario({ pendientes = [], formulariosHuerfanos = [] }) {
  const [rolFiltro, setRolFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [abiertoId, setAbiertoId] = useState(null); // id de la inspección desplegada
  const [formularioElegido, setFormularioElegido] = useState({});
  const [isPending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState({ tipo: "idle", texto: "" });

  const roles = ["todos", "Inspector SIHO", "Paramédico", "Rescatista"];

  const filtradas = pendientes.filter((p) => {
    if (rolFiltro !== "todos" && p.rol !== rolFiltro) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const coincideNombre = p.elementoNombre?.toLowerCase().includes(q);
      const coincideCodigo = p.codigoFormato?.toLowerCase().includes(q);
      if (!coincideNombre && !coincideCodigo) return false;
    }
    return true;
  });

  const conteosPorRol = {
    todos: pendientes.length,
    "Inspector SIHO": pendientes.filter((p) => p.rol === "Inspector SIHO").length,
    Paramédico: pendientes.filter((p) => p.rol === "Paramédico").length,
    Rescatista: pendientes.filter((p) => p.rol === "Rescatista").length,
  };

  const handleVincular = (plantillaId) => {
    const fId = formularioElegido[plantillaId];
    if (!fId) return;
    startTransition(async () => {
      try {
        const res = await vincularFormularioAPlantilla({ formularioId: fId, plantillaId });
        if (res?.success) {
          setMensaje({ tipo: "ok", texto: "¡Formulario vinculado con éxito a la inspección!" });
          setAbiertoId(null);
          setFormularioElegido((prev) => {
            const next = { ...prev };
            delete next[plantillaId];
            return next;
          });
        } else {
          setMensaje({ tipo: "error", texto: res?.error || "No se pudo vincular." });
        }
      } catch {
        setMensaje({ tipo: "error", texto: "Error de conexión al vincular." });
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Banner explicativo y resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-amber-300 bg-amber-500/10 p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f5b800] text-xs font-black text-[#09090b]">
              !
            </span>
            <h3 className="text-sm font-black text-zinc-950">
              {pendientes.length} inspecciones del cronograma sin formulario digital
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-600 leading-relaxed max-w-2xl">
            Toque cualquier inspección de la lista para desplegar las opciones de <strong>crear su formulario digital</strong> o <strong>vincularla a un formulario existente</strong>.
          </p>
        </div>

        {formulariosHuerfanos.length > 0 && (
          <div className="shrink-0 rounded-xl bg-white/80 border border-amber-200 px-3.5 py-2 text-xs">
            <span className="block font-bold text-zinc-900">
              {formulariosHuerfanos.length} formulario(s) sin vincular
            </span>
            <span className="text-[11px] text-zinc-500">Disponibles para asociar</span>
          </div>
        )}
      </div>

      {mensaje.texto && (
        <div
          role="alert"
          className={`flex items-center justify-between gap-3 rounded-xl p-3 text-xs font-semibold ${
            mensaje.tipo === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <span>{mensaje.texto}</span>
          <button
            type="button"
            onClick={() => setMensaje({ tipo: "idle", texto: "" })}
            className="text-[11px] font-bold underline hover:opacity-80"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Filtros por Rol y Barra de búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-zinc-100 border border-zinc-200/80">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRolFiltro(r);
                setAbiertoId(null);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                rolFiltro === r
                  ? "bg-[#09090b] text-white shadow-xs"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-white"
              }`}
            >
              <span>{r === "todos" ? "Todos los roles" : r}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  rolFiltro === r ? "bg-zinc-800 text-amber-300" : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {conteosPorRol[r]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <input
            type="text"
            placeholder="Buscar inspección o código…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 outline-none transition"
          />
          <span className="absolute left-2.5 top-2 text-zinc-400 text-xs">🔍</span>
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-700 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista Vertical de Inspecciones (Una abajo de la otra) */}
      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 shadow-xs">
          {busqueda
            ? `No se encontraron inspecciones que coincidan con «${busqueda}».`
            : "¡Excelente! Todas las inspecciones de este rol ya cuentan con su formulario digital."}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden divide-y divide-zinc-200">
          {filtradas.map((p, index) => {
            const abierto = abiertoId === p.id;
            const huerfanosCompatibles = formulariosHuerfanos.filter(
              (f) => !f.rol || f.rol === p.rol
            );
            const elegido = formularioElegido[p.id] || "";

            const urlNuevo = `/formularios/nuevo?plantillaId=${encodeURIComponent(p.id)}&rol=${encodeURIComponent(
              p.rol
            )}&titulo=${encodeURIComponent(p.elementoNombre)}&codigo=${encodeURIComponent(
              p.codigoFormato || ""
            )}`;

            return (
              <div key={p.id} className="transition-colors">
                {/* Cabecera de la fila: Clickeable para desplegar/plegar */}
                <button
                  type="button"
                  onClick={() => setAbiertoId(abierto ? null : p.id)}
                  aria-expanded={abierto}
                  className={`w-full text-left p-4 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition cursor-pointer select-none ${
                    abierto ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-zinc-50/80"
                  }`}
                >
                  {/* Lado izquierdo: Número, Nombre, Badges */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 font-mono text-xs font-bold">
                      {index + 1}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-zinc-950 text-sm sm:text-base leading-snug">
                          {p.elementoNombre}
                        </span>
                        {p.codigoFormato && (
                          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-600">
                            {p.codigoFormato}
                          </span>
                        )}
                        <span className="rounded-full border border-amber-300 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {p.rol}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-500">
                        <span>Periodicidad: <strong className="text-zinc-700">{p.periodicidad}</strong></span>
                        <span>·</span>
                        <span>Planificado: <strong className="text-zinc-700">{p.cantidadPlanificada ?? 4} al mes</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Lado derecho: Estado "Sin formulario" y Chevron */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Sin formulario digital
                    </span>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600">
                      <span className="hidden sm:inline">
                        {abierto ? "Ocultar opciones" : "Ver opciones"}
                      </span>
                      <IconoChevron abierto={abierto} />
                    </div>
                  </div>
                </button>

                {/* Contenido desplegable: Opciones de Crear o Vincular */}
                {abierto && (
                  <div className="bg-zinc-50/70 p-4 sm:p-5 border-t border-zinc-200/80 animate-in slide-in-from-top-1 duration-150">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Opción 1: Crear formulario digital nuevo */}
                      <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f5b800] text-xs font-black text-[#09090b]">
                              +
                            </span>
                            <h5 className="font-bold text-sm text-zinc-950">
                              Crear formulario digital nuevo
                            </h5>
                          </div>
                          <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
                            Diseñe desde cero las preguntas, listas de verificación (C / NC / NA), fotos y firmas personalizadas para esta inspección.
                          </p>
                        </div>

                        <Link
                          href={urlNuevo}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-4 py-2.5 text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition w-full text-center"
                        >
                          + Crear formulario digital para «{p.elementoNombre}»
                        </Link>
                      </div>

                      {/* Opción 2: Vincular a formulario ya existente */}
                      <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs space-y-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700">
                              🔗
                            </span>
                            <h5 className="font-bold text-sm text-zinc-950">
                              Vincular formulario existente
                            </h5>
                          </div>
                          <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
                            Si ya redactó un formato similar en el sistema que no esté asociado al cronograma, puede vincularlo de inmediato sin volver a escribir las preguntas.
                          </p>
                        </div>

                        {huerfanosCompatibles.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            <select
                              value={elegido}
                              onChange={(e) =>
                                setFormularioElegido((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-zinc-200 bg-white p-2 text-xs font-medium text-zinc-800 focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 outline-none"
                            >
                              <option value="">Seleccione un formulario disponible…</option>
                              {huerfanosCompatibles.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.titulo} {f.codigo ? `(${f.codigo})` : ""}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              disabled={!elegido || isPending}
                              onClick={() => handleVincular(p.id)}
                              className="w-full rounded-xl bg-[#09090b] text-white hover:bg-zinc-800 px-4 py-2 text-xs font-bold shadow-xs transition disabled:opacity-40"
                            >
                              {isPending ? "Vinculando…" : "Confirmar vinculación"}
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 text-xs text-zinc-500 italic">
                            No hay formularios huérfanos creados para {p.rol}. Utilice el botón de la izquierda para diseñar uno nuevo.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
