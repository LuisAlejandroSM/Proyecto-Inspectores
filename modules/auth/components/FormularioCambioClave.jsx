"use client";

import { useActionState, useEffect } from "react";
import { cambiarClave } from "../actions";

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#f5b800] focus:outline-none focus:ring-2 focus:ring-[#f5b800]/25";

export default function FormularioCambioClave() {
  const [estado, accion, isPending] = useActionState(cambiarClave, { error: "", success: false });

  useEffect(() => {
    if (estado?.success && estado?.destino) {
      window.location.href = estado.destino;
    }
  }, [estado]);

  return (
    <form action={accion} className="space-y-4">
      {estado?.success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 text-center text-sm font-semibold text-emerald-800">
          Contraseña actualizada correctamente. Ingresando al sistema…
        </div>
      ) : (
        <>
          <label className="block text-xs font-semibold text-zinc-800">
            Contraseña temporal recibida
            <input
              name="actual"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={CLASE_CAMPO}
            />
          </label>

          <label className="block text-xs font-semibold text-zinc-800">
            Nueva contraseña (mínimo 8 caracteres)
            <input
              name="nueva"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              className={CLASE_CAMPO}
            />
          </label>

          <label className="block text-xs font-semibold text-zinc-800">
            Confirmar nueva contraseña
            <input
              name="confirmacion"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              className={CLASE_CAMPO}
            />
          </label>

          {estado?.error && (
            <p
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50/90 px-3.5 py-2.5 text-xs font-semibold text-rose-700"
            >
              {estado.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-[#f5b800] hover:bg-[#e0a800] px-4 py-2.5 text-sm font-bold text-[#09090b] shadow-xs transition active:scale-[0.99] disabled:opacity-50"
          >
            {isPending ? "Guardando…" : "Guardar y continuar"}
          </button>
        </>
      )}
    </form>
  );
}
