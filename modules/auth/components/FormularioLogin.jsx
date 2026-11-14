"use client";

import { useActionState } from "react";
import { iniciarSesion } from "../actions";

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#18181b] px-4 py-3 text-sm text-white placeholder:text-zinc-500 shadow-inner transition focus:border-[#f5b800] focus:bg-[#202025] focus:outline-none focus:ring-4 focus:ring-[#f5b800]/20";

export default function FormularioLogin() {
  const [estado, accion, isPending] = useActionState(iniciarSesion, { error: "", identificador: "" });

  return (
    <form action={accion} className="space-y-4">
      <label className="block text-xs font-bold text-white uppercase tracking-wider">
        Usuario o correo
        <input
          name="identificador"
          type="text"
          required
          autoComplete="username"
          placeholder="Ej. cperez"
          defaultValue={estado.identificador || estado.correo || ""}
          className={CLASE_CAMPO}
        />
      </label>

      <label className="block text-xs font-bold text-white uppercase tracking-wider">
        Contraseña
        <input
          name="clave"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={CLASE_CAMPO}
        />
      </label>

      {estado.error && (
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
        {isPending ? "Ingresando…" : "Ingresar al sistema"}
      </button>
    </form>
  );
}
