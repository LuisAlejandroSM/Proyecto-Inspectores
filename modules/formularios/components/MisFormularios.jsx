import Link from "next/link";
import { connection } from "next/server";
import { requerirUsuario } from "@/modules/auth/dal";
import { hoyISO, textoFecha, textoFechaHora } from "../fechas";
import { listarMisAsignaciones } from "../queries";

// Estado de una asignación pendiente según su fecha límite.
function situacion(a, hoy) {
  if (a.estado === "completada") return { texto: "Enviado", punto: "bg-emerald-500", tono: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (a.fechaLimite && a.fechaLimite < hoy) return { texto: "Atrasado", punto: "bg-rose-500", tono: "text-rose-700 bg-rose-50 border-rose-200" };
  if (a.fechaLimite === hoy) return { texto: "Para hoy", punto: "bg-[#f5b800]", tono: "text-amber-800 bg-amber-500/10 border-amber-300" };
  return { texto: "Pendiente", punto: "bg-zinc-300", tono: "text-zinc-600 bg-zinc-100 border-zinc-200" };
}

function Fila({ a, hoy }) {
  const s = situacion(a, hoy);
  const detalle =
    a.estado === "completada"
      ? `Enviado ${textoFechaHora(a.completadaEn)}`
      : a.fechaLimite
        ? `${a.fechaLimite === hoy ? "Hoy" : textoFecha(a.fechaLimite)}${a.origen === "cronograma" ? " · según su cronograma" : ""}`
        : "Sin fecha límite";
  return (
    <li>
      <Link
        href={`/mis-formularios/${a.id}`}
        className="flex items-center gap-3.5 sm:gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-xs hover:border-zinc-300 transition-all"
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.punto}`} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-zinc-950 text-sm sm:text-base">{a.titulo}</span>
          <span className="block truncate text-xs text-zinc-500 mt-0.5">{detalle}</span>
          {a.nota && <span className="mt-0.5 block truncate text-xs italic text-zinc-400">“{a.nota}”</span>}
        </span>
        <span className={`shrink-0 text-[11px] font-bold rounded-lg border px-2.5 py-0.5 ${s.tono}`}>{s.texto}</span>
        <span className="shrink-0 text-zinc-300 font-bold" aria-hidden="true">›</span>
      </Link>
    </li>
  );
}

function Seccion({ titulo, cantidad, children }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-950">
        {titulo}
        <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.2 text-[10px] font-bold text-zinc-600">{cantidad}</span>
      </h3>
      {children}
    </section>
  );
}

// Lista plegable (próximos y enviados) para que lo urgente quede arriba sin ruido.
function Plegable({ titulo, cantidad, children }) {
  return (
    <details className="group space-y-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-zinc-950 marker:hidden">
        <span className="text-zinc-400 transition group-open:rotate-90" aria-hidden="true">›</span>
        {titulo}
        <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.2 text-[10px] font-bold text-zinc-600">{cantidad}</span>
      </summary>
      {children}
    </details>
  );
}

// Server Component: formularios asignados al usuario de la sesión.
export default async function MisFormularios() {
  await connection();
  const usuario = await requerirUsuario();
  const hoy = hoyISO();

  const todas = await listarMisAsignaciones(usuario.id);
  const pendientes = todas
    .filter((a) => a.estado === "pendiente" && a.activo)
    .sort((a, b) => (a.fechaLimite ?? "9999").localeCompare(b.fechaLimite ?? "9999"));
  const porLlenar = pendientes.filter((a) => !a.fechaLimite || a.fechaLimite <= hoy);
  const proximos = pendientes.filter((a) => a.fechaLimite && a.fechaLimite > hoy);
  const enviadas = todas
    .filter((a) => a.estado === "completada")
    .sort((a, b) => new Date(b.completadaEn) - new Date(a.completadaEn));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Seccion titulo="Por llenar" cantidad={porLlenar.length}>
        {porLlenar.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-400 font-medium shadow-xs">
            Nada pendiente para hoy. 👍
          </div>
        ) : (
          <ul className="space-y-2.5">
            {porLlenar.map((a) => (
              <Fila key={a.id} a={a} hoy={hoy} />
            ))}
          </ul>
        )}
      </Seccion>

      {proximos.length > 0 && (
        <Plegable titulo="Próximos" cantidad={proximos.length}>
          <ul className="space-y-2.5">
            {proximos.map((a) => (
              <Fila key={a.id} a={a} hoy={hoy} />
            ))}
          </ul>
        </Plegable>
      )}

      {enviadas.length > 0 && (
        <Plegable titulo="Enviados" cantidad={enviadas.length}>
          <ul className="space-y-2.5">
            {enviadas.map((a) => (
              <Fila key={a.id} a={a} hoy={hoy} />
            ))}
          </ul>
        </Plegable>
      )}
    </div>
  );
}
