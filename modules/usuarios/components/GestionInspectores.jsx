"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ROLES_OPERATIVOS } from "@/db/roles";
import { cambiarEstadoInspector, crearInspector, restablecerClave } from "../actions";

// Pestaña del cronograma que corresponde a cada rol operativo.
const VISTA_POR_ROL = {
  "Inspector SIHO": "inspector-siho",
  Paramédico: "paramedicos",
  Rescatista: "rescatistas",
};
const ROLES_FORM = [...ROLES_OPERATIVOS];

const FORM_VACIO = { nombre: "", usuario: "", cargo: "" };

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-800 shadow-2xs focus:bg-white focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition outline-none";
const CLASE_ETIQUETA = "block text-xs font-bold uppercase tracking-wider text-slate-500";

function iniciales(nombre) {
  return (nombre || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function Etiqueta({ children, tono }) {
  const tonos = {
    azul: "bg-blue-50 text-blue-700 border-blue-200",
    ambar: "bg-amber-50 text-amber-800 border-amber-200",
    rojo: "bg-rose-50 text-rose-700 border-rose-200",
    gris: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${tonos[tono] || tonos.gris}`}>
      {children}
    </span>
  );
}

/** Panel que muestra una contraseña temporal UNA sola vez para entregarla al usuario. */
function ClaveTemporal({ datos, onCerrar }) {
  const [copiado, setCopiado] = useState(false);
  const usuarioTexto = datos.usuario || datos.correo;
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`Usuario: ${usuarioTexto}\nContraseña temporal: ${datos.clave}`);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };
  return (
    <div role="status" className="rounded border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p className="font-semibold">{datos.titulo}</p>
      <p className="mt-1">
        Entréguele estos datos a <strong>{datos.nombre}</strong>. La contraseña no se volverá a mostrar y el sistema le
        pedirá cambiarla al entrar.
      </p>
      <dl className="mt-3 grid gap-1 font-mono text-sm sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <dt className="text-emerald-700">Usuario</dt>
        <dd className="select-all font-semibold">{usuarioTexto}</dd>
        <dt className="text-emerald-700">Contraseña temporal</dt>
        <dd className="select-all text-base font-bold tracking-wider">{datos.clave}</dd>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          className="rounded border border-emerald-400 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          {copiado ? "Copiado ✓" : "Copiar datos"}
        </button>
        {datos.enlace && (
          <Link
            href={datos.enlace}
            className="rounded border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            Generar su cronograma →
          </Link>
        )}
        <button
          type="button"
          onClick={onCerrar}
          className="rounded px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          Ya la entregué, cerrar
        </button>
      </div>
    </div>
  );
}

export default function GestionInspectores({ inspectores, rolInicial, usuarioActual, usuarioActualId }) {
  const router = useRouter();
  const actualId = usuarioActual?.id || usuarioActualId;
  const esSuperAdmin = usuarioActual?.esSuperAdmin === true;
  const [isPending, startTransition] = useTransition();
  const [lista, setLista] = useState(inspectores);
  const [formAbierto, setFormAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [rol, setRol] = useState(ROLES_FORM.includes(rolInicial) ? rolInicial : ROLES_FORM[0]);
  const [errorForm, setErrorForm] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "idle", texto: "" });
  const [claveMostrada, setClaveMostrada] = useState(null);
  const [verInactivos, setVerInactivos] = useState(false);

  useEffect(() => {
    setLista(inspectores);
  }, [inspectores]);

  const urlCronograma = (i) => (VISTA_POR_ROL[i.rol] ? `/?vista=${VISTA_POR_ROL[i.rol]}&usuario=${i.id}` : null);

  const abrirFormulario = () => {
    setForm(FORM_VACIO);
    setErrorForm("");
    setFormAbierto(true);
  };

  const handleCrear = (e) => {
    e.preventDefault();
    const datos = { ...form, rol };
    startTransition(async () => {
      try {
        const res = await crearInspector(datos);
        if (res?.success) {
          setClaveMostrada({
            titulo: `${datos.nombre.trim()} quedó registrado como ${rol}.`,
            nombre: datos.nombre.trim(),
            usuario: (res?.usuario || datos.usuario).trim().toLowerCase(),
            clave: res.claveTemporal,
            enlace: urlCronograma({ id: res.id, rol }),
          });
          setMensaje({ tipo: "ok", texto: `Usuario ${datos.nombre.trim()} creado exitosamente.` });
          setForm(FORM_VACIO);
          setFormAbierto(false);
          router.refresh();
        } else {
          setErrorForm(res?.error ?? "No se pudo guardar.");
        }
      } catch {
        setErrorForm("Sin conexión con el servidor.");
      }
    });
  };

  const ejecutar = (accion, exito, alExito) => {
    startTransition(async () => {
      try {
        const res = await accion();
        if (res?.success) {
          setMensaje({ tipo: "ok", texto: exito(res) });
          alExito?.();
          router.refresh();
        } else {
          setMensaje({ tipo: "error", texto: res?.error ?? "No se pudo completar." });
        }
      } catch {
        setMensaje({ tipo: "error", texto: "Sin conexión con el servidor." });
      }
    });
  };

  const handleEstado = (u) => {
    const nuevoEstado = !u.activo;
    if (u.activo && !window.confirm(`¿Desactivar a ${u.nombre}? Perderá el acceso; su historial se conserva.`)) return;
    
    // Actualización optimista inmediata
    setLista((prev) => prev.map((item) => (item.id === u.id ? { ...item, activo: nuevoEstado } : item)));

    ejecutar(
      () => cambiarEstadoInspector({ id: u.id, activo: nuevoEstado }),
      () => `${u.nombre}: ${nuevoEstado ? "reactivado" : "desactivado"}.`,
      () => {}
    );
  };

  const handleRestablecer = (u) => {
    if (!window.confirm(`¿Generar una nueva contraseña temporal para ${u.nombre}? La actual dejará de funcionar.`)) return;
    startTransition(async () => {
      try {
        const res = await restablecerClave({ id: u.id });
        if (res?.success) {
          setClaveMostrada({
            titulo: `Nueva contraseña temporal para ${u.nombre}.`,
            nombre: u.nombre,
            usuario: res?.usuario || u.alias || u.correo,
            clave: res.claveTemporal,
            enlace: null,
          });
          setMensaje({ tipo: "ok", texto: `Contraseña restablecida para ${u.nombre}.` });
          setLista((prev) =>
            prev.map((item) =>
              item.id === u.id ? { ...item, tieneAcceso: true, debeCambiarClave: true } : item
            )
          );
          router.refresh();
        } else {
          setMensaje({ tipo: "error", texto: res?.error ?? "No se pudo restablecer." });
        }
      } catch {
        setMensaje({ tipo: "error", texto: "Sin conexión con el servidor." });
      }
    });
  };

  const visibles = lista.filter((i) => verInactivos || i.activo);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div aria-live="polite" className="min-h-[1.5rem] text-sm">
          {mensaje.texto && (
            <span className={`font-medium ${mensaje.tipo === "error" ? "text-red-600" : "text-emerald-700"}`}>
              {mensaje.texto}
            </span>
          )}
        </div>
        {!formAbierto && (
          <button
            type="button"
            onClick={abrirFormulario}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
          >
            + Registrar inspector
          </button>
        )}
      </div>

      {claveMostrada && <ClaveTemporal datos={claveMostrada} onCerrar={() => setClaveMostrada(null)} />}

      {formAbierto && (
        <form onSubmit={handleCrear} className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="border-b border-amber-100 bg-amber-50/50 px-5 py-3.5">
            <h2 className="text-sm font-bold tracking-tight text-slate-900">Registrar inspector operativo</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Se generará una contraseña temporal para entregarle. Podrá asignarle formularios y generar su cronograma.
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className={CLASE_ETIQUETA}>
              Nombre y apellido *
              <input
                required
                autoFocus
                minLength={3}
                maxLength={100}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className={CLASE_CAMPO}
              />
            </label>

            <label className={CLASE_ETIQUETA}>
              Rol *
              <select value={rol} onChange={(e) => setRol(e.target.value)} className={CLASE_CAMPO}>
                {ROLES_FORM.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className={CLASE_ETIQUETA}>
              Usuario *
              <input
                required
                type="text"
                maxLength={50}
                placeholder="Ej. cperez"
                value={form.usuario}
                onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                className={CLASE_CAMPO}
              />
            </label>

            <label className={CLASE_ETIQUETA}>
              Cargo
              <input
                maxLength={100}
                placeholder="Ej. Supervisor SIHO"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                className={CLASE_CAMPO}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/40 px-5 py-3">
            {errorForm && (
              <span aria-live="polite" className="mr-auto text-xs font-semibold text-rose-600">
                {errorForm}
              </span>
            )}
            <button
              type="button"
              onClick={() => setFormAbierto(false)}
              disabled={isPending}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#0f1420] px-4 py-2 text-xs font-bold text-white shadow-sm ring-1 ring-white/10 hover:bg-[#1a2337] active:scale-[0.98] transition disabled:opacity-50"
            >
              {isPending ? "Guardando…" : "Guardar inspector"}
            </button>
          </div>
        </form>
      )}

      <section className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/60 px-5 py-3.5">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Inspectores operativos registrados{" "}
            <span className="font-semibold text-slate-500">({inspectores.filter((i) => i.activo).length} activos)</span>
          </h2>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition">
            <input
              type="checkbox"
              checked={verInactivos}
              onChange={(e) => setVerInactivos(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#0f1420] focus:ring-[#f5b800]"
            />
            Mostrar desactivados
          </label>
        </div>

        {visibles.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Aún no hay inspectores registrados. Pulse <strong>+ Registrar inspector</strong> para agregar el primero.
          </p>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-bold text-slate-600">
              <tr>
                <th className="px-5 py-3">Inspector</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Último acceso</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((u) => {
                const yo = u.id === actualId;
                const enlace = urlCronograma(u);
                return (
                  <tr key={u.id} className={`hover:bg-slate-50/70 transition ${u.activo ? "" : "bg-slate-50/80 text-slate-400"}`}>
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-700 border border-slate-200 shadow-2xs">
                          {iniciales(u.nombre)}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{u.nombre}</span>
                            {yo && <Etiqueta tono="gris">Usted</Etiqueta>}
                            {!u.activo && <Etiqueta tono="gris">Desactivado</Etiqueta>}
                            {u.activo && !u.tieneAcceso && <Etiqueta tono="ambar">Sin contraseña</Etiqueta>}
                            {u.activo && u.tieneAcceso && u.debeCambiarClave && <Etiqueta tono="ambar">Clave temporal</Etiqueta>}
                            {u.bloqueado && <Etiqueta tono="rojo">Bloqueado</Etiqueta>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-lg bg-slate-100/80 border border-slate-200/70 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{u.cargo || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.alias || u.correo || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.ultimoAcceso ?? "Nunca"}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-xs">
                      <div className="inline-flex flex-wrap justify-end gap-x-2 gap-y-1">
                        {u.activo && enlace && (
                          <Link
                            href={enlace}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-bold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
                          >
                            Cronograma
                          </Link>
                        )}
                        {u.activo && !yo && (u.alias || u.correo) && (
                          <button
                            type="button"
                            onClick={() => handleRestablecer(u)}
                            disabled={isPending}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
                          >
                            {u.tieneAcceso ? "Restablecer clave" : "Dar acceso"}
                          </button>
                        )}
                        {esSuperAdmin && !yo && (
                          <button
                            type="button"
                            onClick={() => handleEstado(u)}
                            disabled={isPending}
                            className={`rounded-lg px-2.5 py-1 font-semibold transition disabled:opacity-50 ${
                              u.activo
                                ? "text-rose-600 hover:bg-rose-50 border border-rose-200/60"
                                : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200/60"
                            }`}
                          >
                            {u.activo ? "Desactivar" : "Reactivar"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
