"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ANIOS, MESES, VISTAS } from "@/modules/cronogramas/constants";

const CLASE_SELECT =
  "rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm font-semibold text-slate-900 shadow-2xs hover:bg-white focus:bg-white focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition outline-none";
const CLASE_LABEL = "flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500";

/** Filtros del dashboard (una fila, arriba de todo lo que afectan). El estado vive en la URL. */
export default function FiltrosDashboard({ mes, anio, rol }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navegar = (cambios) => {
    const params = new URLSearchParams({ mes, anio: String(anio), rol, ...cambios });
    startTransition(() => router.push(`/dashboard?${params.toString()}`));
  };

  return (
    <div className="flex flex-wrap items-end gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <label className={CLASE_LABEL}>
        Mes
        <select value={mes} onChange={(e) => navegar({ mes: e.target.value })} className={CLASE_SELECT}>
          {MESES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <label className={CLASE_LABEL}>
        Año
        <select value={anio} onChange={(e) => navegar({ anio: e.target.value })} className={CLASE_SELECT}>
          {ANIOS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label className={CLASE_LABEL}>
        Rol
        <select value={rol} onChange={(e) => navegar({ rol: e.target.value })} className={CLASE_SELECT}>
          <option value="todos">Todos los roles</option>
          {VISTAS.map((v) => (
            <option key={v.clave} value={v.clave}>
              {v.etiqueta}
            </option>
          ))}
        </select>
      </label>
      <span aria-live="polite" className="pb-2.5 text-xs font-medium text-slate-400">
        {isPending ? "Actualizando…" : ""}
      </span>
    </div>
  );
}
