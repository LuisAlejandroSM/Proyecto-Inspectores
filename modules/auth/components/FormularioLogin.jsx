"use client";

import { useActionState } from "react";
import { iniciarSesion } from "../actions";

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-[#f5b800] focus:outline-none focus:ring-2 focus:ring-[#f5b800]/25";

export default function FormularioLogin() {
  const [estado, accion, isPending] = useActionState(iniciarSesion, { error: "", identificador: "" });

  return (
    <form action={accion} className="space-y-4">
      <label className="block text-xs font-bold text-slate-700">
        Usuario
        <input
          name="identificador"
          type="text"
          required
          autoComplete="username"
          placeholder="Nombre de usuario"
          defaultValue={estado.identificador || estado.correo || ""}
          className={CLASE_CAMPO}
        />
      </label>
      <label className="block text-xs font-bold text-slate-700">
        Contraseña
        <input name="clave" type="password" required autoComplete="current-password" className={CLASE_CAMPO} />
      </label>

      {estado.error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
      >
        {isPending ? "Entrando…" : "Entrar al sistema →"}
      </button>
    </form>
  );
}
