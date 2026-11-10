"use client";

import { LARGO_PARRAFO, LARGO_TEXTO } from "../campos";
import PadFirma from "./PadFirma";

const CLASE_INPUT =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-800 focus:border-blue-500 focus:outline-none disabled:bg-slate-50 sm:text-sm";

/**
 * Una pregunta del formulario lista para responder (o en vista previa con `deshabilitado`).
 * Para tipo "foto": `fotos` = [{ id }] ya subidas, `onSubirFotos(files)`, `onEliminarFoto(id)`.
 * `plano`: sin tarjeta propia (se usa dentro de la tarjeta del constructor).
 */
export default function CampoFormulario({
  campo,
  valor,
  onCambio,
  error,
  deshabilitado = false,
  fotos = [],
  subiendo = 0,
  onSubirFotos,
  onEliminarFoto,
  plano = false,
}) {
  if (campo.tipo === "seccion") {
    const contenido = (
      <>
        <h3 className="text-lg font-bold text-slate-900">{campo.etiqueta || "Sección sin título"}</h3>
        {campo.ayuda && <p className="mt-0.5 whitespace-pre-line text-sm text-slate-600">{campo.ayuda}</p>}
      </>
    );
    if (plano) return <div>{contenido}</div>;
    return (
      <div className="mt-3 rounded-xl border border-l-[6px] border-slate-200 border-l-marca bg-white px-5 py-4 shadow-sm">
        {contenido}
      </div>
    );
  }

  const idCampo = `campo-${campo.id}`;
  const encabezado = (
    <>
      <span className="text-sm font-semibold text-slate-800">
        {campo.etiqueta || "Pregunta sin título"}
        {campo.obligatorio && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
      </span>
      {campo.ayuda && <span className="mt-0.5 block text-xs text-slate-500">{campo.ayuda}</span>}
    </>
  );
  const mensajeError = error && (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
      {error}
    </p>
  );
  const marco = plano
    ? ""
    : `rounded-2xl border bg-white p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] transition-all ${
        error ? "border-rose-400 ring-2 ring-rose-100" : "border-slate-200/90 hover:border-slate-300"
      }`;

  if (campo.tipo === "texto" || campo.tipo === "parrafo" || campo.tipo === "numero" || campo.tipo === "fecha") {
    const comun = {
      id: idCampo,
      disabled: deshabilitado,
      required: campo.obligatorio,
      "aria-invalid": Boolean(error),
      className: CLASE_INPUT,
      value: valor ?? "",
      onChange: (e) => onCambio?.(e.target.value),
    };
    return (
      <div className={marco}>
        <label htmlFor={idCampo} className="block">
          {encabezado}
        </label>
        {campo.tipo === "parrafo" ? (
          <textarea rows={4} maxLength={LARGO_PARRAFO} {...comun} />
        ) : campo.tipo === "numero" ? (
          <input type="text" inputMode="decimal" {...comun} />
        ) : campo.tipo === "fecha" ? (
          <input type="date" {...comun} />
        ) : (
          <input type="text" maxLength={LARGO_TEXTO} {...comun} />
        )}
        {mensajeError}
      </div>
    );
  }

  if (campo.tipo === "si_no") {
    const opcionesSiNo = [
      {
        texto: "Sí / Cumple",
        v: true,
        estiloActivo: "bg-emerald-500 text-white font-bold border-emerald-600 shadow-sm shadow-emerald-500/25",
        estiloInactivo: "border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200",
      },
      {
        texto: "No / No Cumple",
        v: false,
        estiloActivo: "bg-rose-500 text-white font-bold border-rose-600 shadow-sm shadow-rose-500/25",
        estiloInactivo: "border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200",
      },
    ];
    return (
      <fieldset className={marco}>
        <legend className="sr-only">{campo.etiqueta}</legend>
        <div aria-hidden="true">{encabezado}</div>
        <div className="mt-3.5 flex gap-2.5">
          {opcionesSiNo.map((op) => {
            const marcado = valor === op.v;
            return (
              <button
                key={String(op.texto)}
                type="button"
                role="radio"
                aria-checked={marcado}
                disabled={deshabilitado}
                onClick={() => onCambio?.(op.v)}
                className={`flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm transition active:scale-[0.98] ${
                  marcado ? op.estiloActivo : op.estiloInactivo
                } ${deshabilitado ? "cursor-default opacity-70" : ""}`}
              >
                {op.texto}
              </button>
            );
          })}
        </div>
        {mensajeError}
      </fieldset>
    );
  }

  if (campo.tipo === "opcion_unica") {
    const opciones = campo.opciones.map((o) => [o, o]);
    return (
      <fieldset className={marco}>
        <legend className="sr-only">{campo.etiqueta}</legend>
        <div aria-hidden="true">{encabezado}</div>
        <div className="mt-2.5 space-y-2">
          {opciones.map(([texto, v]) => {
            const marcado = valor === v;
            return (
              <label
                key={String(texto)}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition ${
                  marcado
                    ? "border-amber-400 bg-amber-50/60 font-semibold text-slate-900 ring-1 ring-amber-400/30"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                } ${deshabilitado ? "cursor-default opacity-70" : ""}`}
              >
                <input
                  type="radio"
                  name={idCampo}
                  checked={marcado}
                  disabled={deshabilitado}
                  onChange={() => onCambio?.(v)}
                  className="h-4 w-4 accent-[#f5b800]"
                />
                {texto}
              </label>
            );
          })}
        </div>
        {mensajeError}
      </fieldset>
    );
  }

  if (campo.tipo === "opcion_multiple") {
    const lista = Array.isArray(valor) ? valor : [];
    return (
      <fieldset className={marco}>
        <legend className="sr-only">{campo.etiqueta}</legend>
        <div aria-hidden="true">{encabezado}</div>
        <div className="mt-2 space-y-2">
          {campo.opciones.map((o) => {
            const marcado = lista.includes(o);
            return (
              <label
                key={o}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                  marcado ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                } ${deshabilitado ? "cursor-default opacity-70" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  disabled={deshabilitado}
                  onChange={(e) => onCambio?.(e.target.checked ? [...lista, o] : lista.filter((x) => x !== o))}
                  className="h-4 w-4 accent-blue-600"
                />
                {o}
              </label>
            );
          })}
        </div>
        {mensajeError}
      </fieldset>
    );
  }

  if (campo.tipo === "tabla_verificacion") {
    const respuestas = valor && typeof valor === "object" ? valor : {};
    const respondidas = campo.filas.filter((_, i) => campo.columnas.includes(respuestas[i])).length;
    const marcarRestantes = (col) => {
      const nuevo = { ...respuestas };
      campo.filas.forEach((_, i) => {
        if (!campo.columnas.includes(nuevo[i])) nuevo[i] = col;
      });
      onCambio?.(nuevo);
    };
    return (
      <fieldset className={marco}>
        <legend className="sr-only">{campo.etiqueta}</legend>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div aria-hidden="true">{encabezado}</div>
          <span className={`text-xs font-semibold ${respondidas === campo.filas.length ? "text-emerald-700" : "text-slate-500"}`}>
            {respondidas}/{campo.filas.length}
          </span>
        </div>
        <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {/* Encabezado de columnas (pantallas medianas en adelante) */}
          <div className="hidden items-center gap-3 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 sm:flex">
            <span className="flex-1">Componente / ítem</span>
            <span className="flex gap-1">
              {campo.columnas.map((col) => (
                <span key={col} className="w-16 text-center">
                  {col}
                </span>
              ))}
            </span>
          </div>
          {campo.filas.map((fila, i) => (
            <div key={fila} role="radiogroup" aria-label={fila} className="flex flex-col gap-1.5 px-3.5 py-2.5 transition hover:bg-slate-50/60 sm:flex-row sm:items-center sm:gap-3">
              <span className="flex-1 text-sm font-medium text-slate-800">{fila}</span>
              <span className="flex gap-1.5">
                {campo.columnas.map((col) => {
                  const marcado = respuestas[i] === col;
                  const colLimpia = String(col).trim().toUpperCase();
                  const esCumple = colLimpia === "C" || colLimpia === "SÍ" || colLimpia === "SI" || colLimpia === "CUMPLE";
                  const esNoCumple = colLimpia === "NC" || colLimpia === "NO" || colLimpia === "NO CUMPLE";
                  const esNoAplica = colLimpia === "NA" || colLimpia === "N/A" || colLimpia === "NO APLICA";

                  let claseMarcado = "border-slate-900 bg-slate-900 text-white font-bold shadow-sm";
                  let claseInactivo = "border-slate-200 bg-slate-100/80 text-slate-600 hover:bg-slate-200/80";

                  if (esCumple) {
                    claseMarcado = "border-emerald-600 bg-emerald-500 text-white font-black shadow-sm shadow-emerald-500/20";
                    claseInactivo = "border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200";
                  } else if (esNoCumple) {
                    claseMarcado = "border-rose-600 bg-rose-500 text-white font-black shadow-sm shadow-rose-500/20";
                    claseInactivo = "border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200";
                  } else if (esNoAplica) {
                    claseMarcado = "border-slate-700 bg-slate-700 text-white font-black shadow-sm";
                    claseInactivo = "border-slate-200 bg-slate-100/80 text-slate-600 hover:bg-slate-200/80";
                  }

                  return (
                    <button
                      key={col}
                      type="button"
                      role="radio"
                      aria-checked={marcado}
                      disabled={deshabilitado}
                      onClick={() => onCambio?.({ ...respuestas, [i]: col })}
                      className={`h-9 min-w-14 flex-1 rounded-lg border px-2 text-xs transition active:scale-[0.98] sm:flex-none ${
                        marcado ? claseMarcado : claseInactivo
                      } ${deshabilitado ? "cursor-default opacity-70" : ""}`}
                    >
                      {col}
                    </button>
                  );
                })}
              </span>
            </div>
          ))}
        </div>
        {!deshabilitado && respondidas < campo.filas.length && respondidas > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            Marcar los {campo.filas.length - respondidas} restantes como:
            {campo.columnas.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => marcarRestantes(col)}
                className="rounded border border-slate-300 px-2 py-0.5 font-semibold text-slate-700 hover:bg-slate-100"
              >
                {col}
              </button>
            ))}
          </div>
        )}
        {mensajeError}
      </fieldset>
    );
  }

  if (campo.tipo === "firma") {
    const firma = fotos[0];
    const urlFirma = firma?.previewUrl || (firma?.id ? `/api/archivos/${firma.id}` : null);
    return (
      <div className={marco}>
        <div>{encabezado}</div>
        <div className="mt-2">
          {firma ? (
            <div className="flex flex-wrap items-end gap-3">
              <div className="relative h-32 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- firma servida por /api/archivos o blob local */}
                <img src={urlFirma} alt="Firma registrada" className="h-full w-full object-contain" />
                {firma.esLocal && (
                  <span className="absolute bottom-1 right-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                    Guardada en teléfono
                  </span>
                )}
              </div>
              {onEliminarFoto && !deshabilitado && (
                <button
                  type="button"
                  onClick={() => onEliminarFoto(firma.id)}
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Firmar de nuevo
                </button>
              )}
            </div>
          ) : subiendo > 0 ? (
            <p className="h-40 animate-pulse rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4 text-sm text-blue-700">
              Guardando firma…
            </p>
          ) : (
            <PadFirma
              deshabilitado={deshabilitado || !onSubirFotos}
              onConfirmar={(blob) => onSubirFotos?.([new File([blob], "firma.png", { type: "image/png" })])}
            />
          )}
        </div>
        {mensajeError}
      </div>
    );
  }

  if (campo.tipo === "foto") {
    const lleno = fotos.length + subiendo >= campo.maxFotos;
    return (
      <div className={marco}>
        <div>{encabezado}</div>
        <p className="mt-0.5 text-xs text-slate-400">Hasta {campo.maxFotos} foto(s)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {fotos.map((f) => {
            const urlFoto = f.previewUrl || `/api/archivos/${f.id}`;
            return (
              <div key={f.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-100 shadow-sm transition hover:shadow">
                {/* eslint-disable-next-line @next/next/no-img-element -- foto servida por /api/archivos o blob local */}
                <img src={urlFoto} alt="Foto adjunta" className="h-full w-full object-cover" />
                {f.esLocal && (
                  <span className="absolute bottom-1 left-1 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                    Offline
                  </span>
                )}
                {onEliminarFoto && !deshabilitado && (
                  <button
                    type="button"
                    onClick={() => onEliminarFoto(f.id)}
                    aria-label="Quitar foto"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-xs font-bold text-white shadow transition hover:bg-rose-600"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          {Array.from({ length: subiendo }, (_, i) => (
            <div
              key={`subiendo-${i}`}
              className="flex h-24 w-24 animate-pulse items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 text-xs font-semibold text-amber-800"
            >
              Subiendo…
            </div>
          ))}
          {!lleno && (
            <label
              className={`flex h-24 w-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-xs font-bold transition ${
                deshabilitado
                  ? "cursor-default border-slate-200 text-slate-400"
                  : "cursor-pointer border-slate-300 bg-slate-50 text-slate-700 hover:border-[#f5b800] hover:bg-amber-50/50 hover:text-amber-900"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#f5b800]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              + Agregar foto
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={deshabilitado}
                onChange={(e) => {
                  const archivos = [...(e.target.files ?? [])];
                  e.target.value = "";
                  if (archivos.length) onSubirFotos?.(archivos);
                }}
                className="sr-only"
              />
            </label>
          )}
        </div>
        {mensajeError}
      </div>
    );
  }

  return null;
}
