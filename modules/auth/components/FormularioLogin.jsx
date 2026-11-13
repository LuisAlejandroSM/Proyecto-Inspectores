"use client";

import { useActionState } from "react";
import { iniciarSesion } from "../actions";

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#f5b800] focus:outline-none focus:ring-2 focus:ring-[#f5b800]/25";

export default function FormularioLogin() {
  const [estado, accion, isPending] = useActionState(iniciarSesion, { error: "", identificador: "" });

  return (
    <form action={accion} className="space-y-4">
      <label className="block text-xs font-semibold text-zinc-800">
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

      <label className="block text-xs font-semibold text-zinc-800">
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
          className="rounded-lg border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs font-semibold text-rose-700"
        >
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[#f5b800] hover:bg-[#e0a800] px-4 py-2.5 text-sm font-bold text-[#09090b] shadow-xs transition active:scale-[0.99] disabled:opacity-50"
      >
        {isPending ? "Ingresando…" : "Ingresar al sistema"}
      </button>
    </form>
  );
}
