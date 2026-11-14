"use client";

import { useActionState, useEffect } from "react";
import { cambiarClave } from "../actions";

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#18181b] px-4 py-3 text-sm text-white placeholder:text-zinc-500 shadow-inner transition focus:border-[#f5b800] focus:bg-[#202025] focus:outline-none focus:ring-4 focus:ring-[#f5b800]/20";

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
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-center text-sm font-semibold text-emerald-300 shadow-sm">
          Contraseña actualizada correctamente. Ingresando al sistema…
        </div>
      ) : (
        <>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
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

          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
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

          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
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
              className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3.5 py-2.5 text-xs font-semibold text-rose-300 shadow-sm"
            >
              {estado.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-5 py-3.5 text-sm font-black text-[#09090b] shadow-lg shadow-amber-500/10 active:scale-[0.99] transition duration-150 disabled:opacity-50"
          >
            {isPending ? "Guardando…" : "Guardar y continuar"}
          </button>
        </>
      )}
    </form>
  );
}
