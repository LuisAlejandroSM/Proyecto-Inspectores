"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Recuadro para firmar con el dedo, lápiz o mouse. Al confirmar entrega un PNG (Blob).
 * @param {{ onConfirmar: (blob: Blob) => void, deshabilitado?: boolean }} props
 */
export default function PadFirma({ onConfirmar, deshabilitado = false }) {
  const canvasRef = useRef(null);
  const dibujando = useRef(false);
  const [vacio, setVacio] = useState(true);

  // Ajusta la resolución del lienzo a su tamaño en pantalla (trazos nítidos en el celular).
  useEffect(() => {
    const canvas = canvasRef.current;
    const escala = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * escala);
    canvas.height = Math.round(height * escala);
    const ctx = canvas.getContext("2d");
    ctx.scale(escala, escala);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#09090b";
  }, []);

  const punto = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const empezar = (e) => {
    if (deshabilitado) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    dibujando.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = punto(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    setVacio(false);
  };
  const mover = (e) => {
    if (!dibujando.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = punto(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const terminar = () => {
    dibujando.current = false;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setVacio(true);
  };

  const confirmar = () => {
    canvasRef.current.toBlob((blob) => blob && onConfirmar(blob), "image/png");
  };

  return (
    <div className="space-y-2.5">
      <canvas
        ref={canvasRef}
        aria-label="Recuadro para firmar"
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerCancel={terminar}
        className="h-40 w-full touch-none rounded-2xl border-2 border-dashed border-zinc-200 bg-white shadow-2xs hover:border-zinc-300 transition"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-500 font-medium">
          {vacio ? "Firme dentro del recuadro con su dedo o lápiz táctil" : "¿Quedó bien? Confirme la firma."}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={limpiar}
            disabled={vacio || deshabilitado}
            className="rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition disabled:opacity-40"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={vacio || deshabilitado}
            className="rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-4 py-1.5 text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition disabled:opacity-40"
          >
            Confirmar firma
          </button>
        </div>
      </div>
    </div>
  );
}
