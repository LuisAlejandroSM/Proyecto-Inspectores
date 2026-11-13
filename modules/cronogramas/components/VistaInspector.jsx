"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ANIOS, DIAS_SEMANA, MESES, diaDeLaSemana } from "../constants";
import FormularioEjecucion from "./FormularioEjecucion";
import MatrizMes from "./MatrizMes";

const CLASE_SELECT =
  "rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm font-semibold text-zinc-950 shadow-2xs hover:bg-white hover:border-zinc-300 focus:bg-white focus:border-[#f5b800] focus:ring-4 focus:ring-[#f5b800]/20 transition outline-none";

function etiquetaDia(mes, anio, dia) {
  return `${DIAS_SEMANA[diaDeLaSemana(mes, anio, dia)]} ${dia}`;
}

/** Insignia de estado de una inspección asignada. */
function EstadoInspeccion({ item }) {
  const insignia = item.noEjecutado
    ? { texto: "No ejecutada (N)", clase: "bg-rose-50 text-rose-700 border-rose-200" }
    : item.ejecutado
      ? { texto: `Ejecutada (${item.ejecutado})`, clase: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : { texto: "Por registrar", clase: "bg-amber-50 text-amber-800 border-amber-200" };
  return (
    <span className={`shrink-0 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${insignia.clase}`}>
      {insignia.texto}
    </span>
  );
}

/** Panel para registrar la inspección de la celda tocada en la matriz. */
function PanelRegistro({ item, mes, anio, onCerrar, onGuardado }) {
  useEffect(() => {
    const alTeclado = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="panel-registro-titulo">
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 bg-[#09090b]/50 backdrop-blur-xs" />
      <div className="relative w-full max-w-lg rounded-t-3xl border border-zinc-200 bg-white p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-800">
              {etiquetaDia(mes, anio, item.dia)} de {mes}
            </p>
            <h3 id="panel-registro-titulo" className="text-base font-black leading-snug text-zinc-950">
              {item.elemento}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {item.codigo} · {item.periodicidad}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <EstadoInspeccion item={item} />
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
            >
              ×
            </button>
          </div>
        </div>
        {item.formulario && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-500/10 p-4">
            <div className="min-w-0 text-sm">
              <p className="font-bold text-zinc-950">{item.formulario.estado === "completada" ? "Formulario enviado ✓" : "Esta inspección tiene formulario digital"}</p>
              <p className="truncate text-xs text-zinc-600 mt-0.5">{item.formulario.titulo}</p>
            </div>
            <Link
              href={`/mis-formularios/${item.formulario.asignacionId}`}
              className="shrink-0 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-3.5 py-2 text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition"
            >
              {item.formulario.estado === "completada" ? "Ver respuesta" : "Llenar formulario"}
            </Link>
          </div>
        )}
        <FormularioEjecucion
          key={`${item.plantillaId}|${item.dia}|${item.ejecutado}|${item.noEjecutado}|${item.observacion ?? ""}`}
          item={item}
          mes={mes}
          anio={anio}
          onGuardado={onGuardado}
        />
      </div>
    </div>
  );
}

/**
 * Vista del inspector: selector de mes y su cronograma completo del mes,
 * donde toca cada celda para registrar lo que hizo.
 */
export default function VistaInspector({ mes, anio, diaActual, items, plantillas, registros, tituloMatriz }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [seleccion, setSeleccion] = useState(null);
  const [aviso, setAviso] = useState("");

  const navegar = (cambios) => {
    const params = new URLSearchParams({ mes, anio: String(anio), ...cambios });
    startTransition(() => router.push(`/mi-cronograma?${params.toString()}`));
  };

  const itemSeleccionado = seleccion
    ? items.find((it) => it.plantillaId === seleccion.plantillaId && it.dia === seleccion.dia)
    : null;

  const porRegistrar = items.filter((it) => it.dia <= diaActual && !it.ejecutado && !it.noEjecutado).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs">
        <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Mes
          <select value={mes} onChange={(e) => navegar({ mes: e.target.value })} className={CLASE_SELECT}>
            {MESES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
          Año
          <select value={anio} onChange={(e) => navegar({ anio: e.target.value })} className={CLASE_SELECT}>
            {ANIOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <span aria-live="polite" className="pb-2.5 text-xs font-medium text-zinc-400">
          {isPending ? "Cargando…" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400 font-medium shadow-xs">
          No tiene inspecciones asignadas en {mes} {anio}. Consulte con su supervisor.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs text-xs">
            <span className="text-zinc-700 font-medium">
              {porRegistrar > 0 ? (
                <>
                  Tiene <strong className="font-black text-zinc-950">{porRegistrar}</strong> inspección(es) por registrar: toque las celdas con{" "}
                  <span className="rounded-md border border-amber-400 bg-amber-100 px-1.5 py-0.5 font-bold text-amber-900">?</span> en
                  la fila E de la matriz.
                </>
              ) : (
                "Todo lo planificado a la fecha está registrado. Puede tocar cualquier celda para actualizar observaciones o cantidades."
              )}
            </span>
            {aviso && (
              <span aria-live="polite" className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 font-bold text-emerald-800">
                {aviso}
              </span>
            )}
          </div>

          <MatrizMes
            key={`insp|${mes}|${anio}`}
            modo="inspector"
            usuarioId={null}
            mes={mes}
            anio={anio}
            tituloVista={tituloMatriz}
            plantillas={plantillas}
            registrosIniciales={registros}
            diaActual={diaActual}
            celdaSeleccionada={seleccion ? `${seleccion.plantillaId}|${seleccion.dia}` : null}
            onSeleccionarCelda={(celda) => {
              setAviso("");
              setSeleccion(celda);
            }}
          />
        </>
      )}

      {itemSeleccionado && (
        <PanelRegistro
          item={itemSeleccionado}
          mes={mes}
          anio={anio}
          onCerrar={() => setSeleccion(null)}
          onGuardado={() => {
            setSeleccion(null);
            setAviso(`Guardado: ${itemSeleccionado.elemento.toLowerCase()} del día ${itemSeleccionado.dia}.`);
          }}
        />
      )}
    </div>
  );
}
