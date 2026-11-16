"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { vincularFormularioAPlantilla } from "../actions";

/**
 * Módulo para gestionar las inspecciones del cronograma que aún no cuentan con un formulario digital.
 * Permite crearlo directamente o vincularlo en 1 clic a un formulario ya existente.
 */
export default function InspeccionesSinFormulario({ pendientes = [], formulariosHuerfanos = [] }) {
  const [rolFiltro, setRolFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [vinculandoId, setVinculandoId] = useState(null); // id de la plantilla abriendo el selector
  const [formularioElegido, setFormularioElegido] = useState("");
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
    "Paramédico": pendientes.filter((p) => p.rol === "Paramédico").length,
    "Rescatista": pendientes.filter((p) => p.rol === "Rescatista").length,
  };

  const handleVincular = (plantillaId) => {
    if (!formularioElegido) return;
    startTransition(async () => {
      try {
        const res = await vincularFormularioAPlantilla({ formularioId: formularioElegido, plantillaId });
        if (res?.success) {
          setMensaje({ tipo: "ok", texto: "¡Formulario vinculado con éxito a la inspección!" });
          setVinculandoId(null);
          setFormularioElegido("");
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
              {pendientes.length} inspecciones del cronograma pendientes de formulario
            </h3>
          </div>
          <p className="mt-1 text-xs text-zinc-600 leading-relaxed max-w-2xl">
            Estas inspecciones ya están planificadas en el cronograma mensual, pero los inspectores aún no pueden llenar un formulario digital desde campo. Puede diseñarles su formulario con <strong>Crear formulario</strong> o asociarles uno ya creado con <strong>Vincular existente</strong>.
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
            mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
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
                setVinculandoId(null);
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

      {/* Lista de inspecciones */}
      {filtradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500 shadow-xs">
          {busqueda
            ? `No se encontraron inspecciones que coincidan con «${busqueda}».`
            : "¡Excelente! Todas las inspecciones de este rol ya cuentan con su formulario digital."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((p) => {
            const huerfanosCompatibles = formulariosHuerfanos.filter(
              (f) => !f.rol || f.rol === p.rol
            );
            const estaVinculando = vinculandoId === p.id;

            const urlNuevo = `/formularios/nuevo?plantillaId=${encodeURIComponent(p.id)}&rol=${encodeURIComponent(
              p.rol
            )}&titulo=${encodeURIComponent(p.elementoNombre)}&codigo=${encodeURIComponent(
              p.codigoFormato || ""
            )}`;

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs hover:border-zinc-300 transition-all space-y-3.5"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="rounded-full border border-amber-300 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {p.rol}
                    </span>
                    {p.codigoFormato && (
                      <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-600">
                        {p.codigoFormato}
                      </span>
                    )}
                    <span className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                      {p.periodicidad}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-zinc-950 leading-snug">
                    {p.elementoNombre}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Planificado en cronograma ({p.cantidadPlanificada ?? 4} al mes)
                  </p>
                </div>

                {/* Acciones para esta inspección */}
                <div className="border-t border-zinc-100 pt-3 space-y-2">
                  {estaVinculando ? (
                    <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-200 space-y-2">
                      <label className="block text-[11px] font-bold text-zinc-700">
                        Seleccionar formulario existente:
                      </label>
                      <select
                        value={formularioElegido}
                        onChange={(e) => setFormularioElegido(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white p-1.5 text-xs text-zinc-800 focus:border-[#f5b800] outline-none"
                      >
                        <option value="">Seleccione un formulario…</option>
                        {huerfanosCompatibles.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.titulo} {f.codigo ? `(${f.codigo})` : ""}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setVinculandoId(null);
                            setFormularioElegido("");
                          }}
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={!formularioElegido || isPending}
                          onClick={() => handleVincular(p.id)}
                          className="rounded-lg bg-[#09090b] text-white px-3 py-1 text-xs font-bold shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition"
                        >
                          {isPending ? "Vinculando…" : "Confirmar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        href={urlNuevo}
                        className="flex-1 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-3 py-2 text-center text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition"
                      >
                        + Crear formulario
                      </Link>

                      {huerfanosCompatibles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setVinculandoId(p.id);
                            setFormularioElegido("");
                          }}
                          title="Vincular a un formulario ya existente sin rehacer preguntas"
                          className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 shadow-2xs transition"
                        >
                          Vincular
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
