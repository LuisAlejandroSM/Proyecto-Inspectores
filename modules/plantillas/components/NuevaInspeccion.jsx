"use client";

import { useState, useTransition } from "react";
import { crearPlantilla } from "../actions";
import { PERIODICIDADES } from "../constants";

const FORM_VACIO = { elementoNombre: "", codigoFormato: "", periodicidad: "Semanal", cantidadPlanificada: 4 };

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-800 shadow-2xs focus:bg-white focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition outline-none";
const CLASE_ETIQUETA = "block text-xs font-bold uppercase tracking-wider text-slate-500";

/**
 * Botón "+ Agregar inspección" y formulario para sumar un formato al catálogo del rol
 * de la pestaña actual (Inspector SIHO, Paramédico o Rescatista).
 */
export default function NuevaInspeccion({ rol, etiquetaRol }) {
  const [isPending, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const abrir = () => {
    setForm(FORM_VACIO);
    setError("");
    setAviso("");
    setAbierto(true);
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    const datos = { ...form, rol };
    startTransition(async () => {
      try {
        const res = await crearPlantilla(datos);
        if (res?.success) {
          setAviso(
            `Inspección N° ${res.numero} agregada a ${etiquetaRol}. Asígnela a cada inspector desde "Generar / Regenerar plan".`
          );
          setAbierto(false);
        } else {
          setError(res?.error ?? "No se pudo guardar.");
        }
      } catch {
        setError("Sin conexión con el servidor.");
      }
    });
  };

  if (!abierto) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-3">
        {aviso && (
          <span aria-live="polite" className="mr-auto text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60">
            {aviso}
          </span>
        )}
        <button
          type="button"
          onClick={abrir}
          className="rounded-xl bg-[#0f1420] px-4 py-2 text-xs font-bold text-white shadow-sm ring-1 ring-white/10 hover:bg-[#1a2337] active:scale-[0.98] transition"
        >
          + Agregar inspección
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleGuardar} className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3.5">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Agregar inspección · {etiquetaRol}</h2>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_120px]">
        <label className={CLASE_ETIQUETA}>
          Elemento a inspeccionar *
          <input
            required
            minLength={3}
            maxLength={255}
            placeholder="Ej. Inspección de andamios"
            value={form.elementoNombre}
            onChange={(e) => setForm({ ...form, elementoNombre: e.target.value })}
            className={CLASE_CAMPO}
          />
        </label>

        <label className={CLASE_ETIQUETA}>
          Código del formato
          <input
            maxLength={50}
            placeholder="Ej. CVC-SST-FT-130"
            value={form.codigoFormato}
            onChange={(e) => setForm({ ...form, codigoFormato: e.target.value })}
            className={CLASE_CAMPO}
          />
        </label>

        <label className={CLASE_ETIQUETA}>
          Periodicidad *
          <select
            value={form.periodicidad}
            onChange={(e) => setForm({ ...form, periodicidad: e.target.value })}
            className={CLASE_CAMPO}
          >
            {PERIODICIDADES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className={CLASE_ETIQUETA}>
          Cantidad *
          <input
            required
            type="number"
            min={1}
            max={999}
            value={form.cantidadPlanificada}
            onChange={(e) => setForm({ ...form, cantidadPlanificada: e.target.value })}
            className={CLASE_CAMPO}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/40 px-5 py-3">
        {error && (
          <span aria-live="polite" className="mr-auto text-xs font-semibold text-rose-600">
            {error}
          </span>
        )}
        <button
          type="button"
          onClick={() => setAbierto(false)}
          disabled={isPending}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#0f1420] px-4 py-2 text-xs font-bold text-white shadow-sm ring-1 ring-white/10 hover:bg-[#1a2337] active:scale-[0.98] transition disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar inspección"}
        </button>
      </div>
    </form>
  );
}
