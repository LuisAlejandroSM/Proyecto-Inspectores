"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ANIOS, MESES, VISTAS, vistaPorClave, vistaPorRol } from "../constants";
import { confirmarDescartarCambios } from "./cambiosPendientes";

function construirUrl({ vista, mes, anio, usuario }) {
  const params = new URLSearchParams();
  params.set("vista", vista);
  params.set("mes", mes);
  params.set("anio", String(anio));
  if (usuario) params.set("usuario", usuario);
  return `/?${params.toString()}`;
}

/**
 * Filtros del cronograma: pestañas de vista, mes, año e inspector individual.
 * El estado vive en la URL (searchParams); este componente solo navega.
 */
export default function FiltrosCronograma({ vista, mes, anio, usuarioId, inspectores }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const rolVista = vistaPorClave(vista).rol;

  const inspectoresVisibles = inspectores.filter((i) => i.rol === rolVista);

  const navegar = (cambios) => {
    if (!confirmarDescartarCambios()) return;
    const destino = { vista, mes, anio, usuario: usuarioId, ...cambios };
    startTransition(() => {
      router.push(construirUrl(destino));
    });
  };

  const cambiarInspector = (id) => {
    if (!id) {
      navegar({ usuario: null });
      return;
    }
    const inspector = inspectores.find((i) => i.id === id);
    // Siempre se abre la pestaña del rol del inspector elegido.
    const vistaDestino = inspector ? vistaPorRol(inspector.rol).clave : vista;
    navegar({ usuario: id, vista: vistaDestino });
  };

  return (
    <div className="space-y-3">
      <nav aria-label="Tipo de cronograma" className="inline-flex flex-wrap gap-1 rounded-2xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-2xs">
        {VISTAS.map((v) => {
          const activa = v.clave === vista;
          return (
            <Link
              key={v.clave}
              href={construirUrl({ vista: v.clave, mes, anio, usuario: null })}
              onClick={(e) => {
                if (!confirmarDescartarCambios()) e.preventDefault();
              }}
              aria-current={activa ? "page" : undefined}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activa
                  ? "bg-[#0f1420] text-white shadow-sm ring-1 ring-white/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              {v.etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-end gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
        <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Mes
          <select
            value={mes}
            onChange={(e) => navegar({ mes: e.target.value })}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm font-semibold text-slate-900 shadow-2xs hover:bg-white focus:bg-white focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition outline-none"
          >
            {MESES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Año
          <select
            value={anio}
            onChange={(e) => navegar({ anio: Number(e.target.value) })}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm font-semibold text-slate-900 shadow-2xs hover:bg-white focus:bg-white focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition outline-none"
          >
            {ANIOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[260px] flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Inspector / Responsable
          <select
            value={usuarioId ?? ""}
            onChange={(e) => cambiarInspector(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm font-semibold text-slate-900 shadow-2xs hover:bg-white focus:bg-white focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition outline-none"
          >
            <option value="">Consolidado — todos ({rolVista})</option>
            {inspectoresVisibles.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
        </label>

        <span aria-live="polite" className="pb-2.5 text-xs font-medium text-slate-400">
          {isPending ? "Cargando…" : ""}
        </span>
      </div>
    </div>
  );
}
