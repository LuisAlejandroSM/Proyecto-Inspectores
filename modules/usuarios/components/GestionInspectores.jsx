"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ROL_ADMINISTRACION, ROL_SUPERVISOR_SIHO, ROLES_OPERATIVOS } from "@/db/roles";
import { cambiarEstadoInspector, crearInspector, restablecerClave } from "../actions";

const VISTA_POR_ROL = {
  "Inspector SIHO": "inspector-siho",
  Paramédico: "paramedicos",
  Rescatista: "rescatistas",
};
const ROLES_FORM = [...ROLES_OPERATIVOS, ROL_ADMINISTRACION, ROL_SUPERVISOR_SIHO];

const FORM_VACIO = { nombre: "", usuario: "", cargo: "" };

const CLASE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-900 shadow-2xs focus:border-[#f5b800] focus:ring-4 focus:ring-[#f5b800]/20 transition outline-none";
const CLASE_ETIQUETA = "block text-xs font-bold uppercase tracking-wider text-zinc-500";

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
    gris: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${tonos[tono] || tonos.gris}`}>
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
    <div role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-5 text-sm text-emerald-950 shadow-xs">
      <p className="font-bold text-base">{datos.titulo}</p>
      <p className="mt-1 text-xs text-emerald-800">
        Entréguele estos datos a <strong>{datos.nombre}</strong>. La contraseña no se volverá a mostrar y el sistema le
        pedirá cambiarla al entrar.
      </p>
      <dl className="mt-3.5 grid gap-1.5 font-mono text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4 bg-white/80 p-3.5 rounded-xl border border-emerald-200">
        <dt className="text-emerald-700 font-bold">Usuario</dt>
        <dd className="select-all font-bold text-zinc-950">{usuarioTexto}</dd>
        <dt className="text-emerald-700 font-bold">Contraseña temporal</dt>
        <dd className="select-all text-base font-black tracking-wider text-zinc-950">{datos.clave}</dd>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={copiar}
          className="rounded-xl border border-emerald-300 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-2xs transition"
        >
          {copiado ? "Copiado ✓" : "Copiar datos"}
        </button>
        {datos.enlace && (
          <Link
            href={datos.enlace}
            className="rounded-xl bg-[#09090b] text-white px-3.5 py-1.5 text-xs font-bold shadow-xs hover:bg-zinc-800 transition"
          >
            Generar su cronograma →
          </Link>
        )}
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-xl px-3.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-emerald-100 transition"
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
  const puedeAdministrar = usuarioActual?.esAdmin === true || esSuperAdmin;
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
          setErrorForm(res?.error ?? "No se pudo registrar.");
        }
      } catch {
        setErrorForm("Sin conexión con el servidor.");
      }
    });
  };

  const handleRestablecer = (u) => {
    if (!window.confirm(`¿Generar nueva contraseña temporal para ${u.nombre}? La actual dejará de funcionar.`)) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await restablecerClave({ id: u.id });
        if (res?.success) {
          setClaveMostrada({
            titulo: `Nueva contraseña temporal generada para ${u.nombre}.`,
            nombre: u.nombre,
            usuario: u.alias || u.correo,
            clave: res.claveTemporal,
            enlace: null,
          });
          setMensaje({ tipo: "ok", texto: "Contraseña temporal lista para entregar." });
        } else {
          setMensaje({ tipo: "error", texto: res?.error ?? "No se pudo restablecer." });
        }
      } catch {
        setMensaje({ tipo: "error", texto: "Sin conexión con el servidor." });
      }
    });
  };

  const handleEstado = (u) => {
    const accion = u.activo ? "desactivar" : "reactivar";
    if (!window.confirm(`¿Seguro que desea ${accion} a ${u.nombre}?`)) return;
    startTransition(async () => {
      try {
        const res = await cambiarEstadoInspector({ id: u.id, activo: !u.activo });
        if (res?.success) {
          setLista((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: !u.activo } : x)));
          setMensaje({ tipo: "ok", texto: `${u.nombre} fue ${u.activo ? "desactivado" : "reactivado"}.` });
        } else {
          setMensaje({ tipo: "error", texto: res?.error ?? "No se pudo actualizar." });
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
            <span className={`font-semibold ${mensaje.tipo === "error" ? "text-rose-600" : "text-emerald-700"}`}>
              {mensaje.texto}
            </span>
          )}
        </div>
        {!formAbierto && (
          <button
            type="button"
            onClick={abrirFormulario}
            className="rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-4 py-2 text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition"
          >
            + Registrar inspector
          </button>
        )}
      </div>

      {claveMostrada && <ClaveTemporal datos={claveMostrada} onCerrar={() => setClaveMostrada(null)} />}

      {formAbierto && (
        <form onSubmit={handleCrear} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
          <div className="border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5">
            <h2 className="text-sm font-bold tracking-tight text-zinc-950">Registrar inspector operativo</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Se generará una contraseña temporal para entregarle. Podrá asignarle formularios y generar su cronograma.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-zinc-100 bg-zinc-50/50 px-5 py-3.5">
            {errorForm && (
              <span aria-live="polite" className="mr-auto text-xs font-semibold text-rose-600">
                {errorForm}
              </span>
            )}
            <button
              type="button"
              onClick={() => setFormAbierto(false)}
              disabled={isPending}
              className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-4 py-2 text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition disabled:opacity-50"
            >
              {isPending ? "Guardando…" : "Guardar inspector"}
            </button>
          </div>
        </form>
      )}

      {/* Directorio de Inspectores: Tarjetas en Móvil + Tabla en Desktop */}
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5">
          <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
            Inspectores operativos registrados{" "}
            <span className="font-semibold text-zinc-500">({inspectores.filter((i) => i.activo).length} activos)</span>
          </h2>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-zinc-600 hover:text-zinc-950 transition">
            <input
              type="checkbox"
              checked={verInactivos}
              onChange={(e) => setVerInactivos(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-[#f5b800]"
            />
            Mostrar desactivados
          </label>
        </div>

        {visibles.length === 0 ? (
          <p className="p-10 text-center text-sm text-zinc-400 font-medium">
            Aún no hay inspectores registrados. Pulse <strong>+ Registrar inspector</strong> para agregar el primero.
          </p>
        ) : (
          <>
            {/* Móvil (< 768px): Tarjetas apiladas sin scroll horizontal */}
            <div className="divide-y divide-zinc-100 md:hidden">
              {visibles.map((u) => {
                const yo = u.id === actualId;
                const enlace = urlCronograma(u);
                return (
                  <div key={`m-${u.id}`} className={`p-4 space-y-3 ${u.activo ? "" : "bg-zinc-50/60 opacity-70"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-black text-zinc-800 border border-zinc-200">
                          {iniciales(u.nombre)}
                        </span>
                        <div>
                          <p className="font-bold text-zinc-950 text-sm">{u.nombre}</p>
                          <p className="font-mono text-[11px] text-zinc-500">{u.alias || u.correo || "—"}</p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-[11px] font-bold text-zinc-700">
                        {u.rol}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {yo && <Etiqueta tono="gris">Usted</Etiqueta>}
                      {!u.activo && <Etiqueta tono="gris">Desactivado</Etiqueta>}
                      {u.activo && !u.tieneAcceso && <Etiqueta tono="ambar">Sin contraseña</Etiqueta>}
                      {u.activo && u.tieneAcceso && u.debeCambiarClave && <Etiqueta tono="ambar">Clave temporal</Etiqueta>}
                      {u.bloqueado && <Etiqueta tono="rojo">Bloqueado</Etiqueta>}
                      {u.cargo && <span className="text-[11px] text-zinc-500 font-medium">· Cargo: {u.cargo}</span>}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                      <span className="text-[11px] text-zinc-400">
                        Acceso: {u.ultimoAcceso ?? "Nunca"}
                      </span>
                      <div className="flex items-center gap-2">
                        {u.activo && enlace && (
                          <Link
                            href={enlace}
                            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-zinc-100"
                          >
                            Cronograma
                          </Link>
                        )}
                        {u.activo && !yo && (u.alias || u.correo) && (
                          <button
                            type="button"
                            onClick={() => handleRestablecer(u)}
                            disabled={isPending}
                            className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                          >
                            {u.tieneAcceso ? "Clave" : "Acceso"}
                          </button>
                        )}
                        {puedeAdministrar && !yo && (
                          <button
                            type="button"
                            onClick={() => handleEstado(u)}
                            disabled={isPending}
                            className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                              u.activo
                                ? "text-rose-600 bg-rose-50 border border-rose-200"
                                : "text-emerald-700 bg-emerald-50 border border-emerald-200"
                            }`}
                          >
                            {u.activo ? "Desactivar" : "Reactivar"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Escritorio (>= 768px): Tabla completa */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-600">
                  <tr>
                    <th className="px-5 py-3.5">Inspector</th>
                    <th className="px-4 py-3.5">Rol</th>
                    <th className="px-4 py-3.5">Cargo</th>
                    <th className="px-4 py-3.5">Usuario</th>
                    <th className="px-4 py-3.5">Último acceso</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-900">
                  {visibles.map((u) => {
                    const yo = u.id === actualId;
                    const enlace = urlCronograma(u);
                    return (
                      <tr key={u.id} className={`hover:bg-zinc-50/70 transition ${u.activo ? "" : "bg-zinc-50/50 text-zinc-400"}`}>
                        <td className="px-5 py-3.5 font-medium">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-black text-zinc-800 border border-zinc-200">
                              {iniciales(u.nombre)}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-zinc-950">{u.nombre}</span>
                                {yo && <Etiqueta tono="gris">Usted</Etiqueta>}
                                {!u.activo && <Etiqueta tono="gris">Desactivado</Etiqueta>}
                                {u.activo && !u.tieneAcceso && <Etiqueta tono="ambar">Sin contraseña</Etiqueta>}
                                {u.activo && u.tieneAcceso && u.debeCambiarClave && <Etiqueta tono="ambar">Clave temporal</Etiqueta>}
                                {u.bloqueado && <Etiqueta tono="rojo">Bloqueado</Etiqueta>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-block rounded-lg bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700">
                            {u.rol}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-zinc-600 font-medium">{u.cargo || "—"}</td>
                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-600">{u.alias || u.correo || "—"}</td>
                        <td className="px-4 py-3.5 text-xs text-zinc-400">{u.ultimoAcceso ?? "Nunca"}</td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs">
                          <div className="inline-flex flex-wrap justify-end gap-x-2 gap-y-1">
                            {u.activo && enlace && (
                              <Link
                                href={enlace}
                                className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-zinc-50 transition"
                              >
                                Cronograma
                              </Link>
                            )}
                            {u.activo && !yo && (u.alias || u.correo) && (
                              <button
                                type="button"
                                onClick={() => handleRestablecer(u)}
                                disabled={isPending}
                                className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition disabled:opacity-50"
                              >
                                {u.tieneAcceso ? "Restablecer clave" : "Dar acceso"}
                              </button>
                            )}
                            {puedeAdministrar && !yo && (
                              <button
                                type="button"
                                onClick={() => handleEstado(u)}
                                disabled={isPending}
                                className={`rounded-xl px-2.5 py-1 text-xs font-bold transition disabled:opacity-50 ${
                                  u.activo
                                    ? "text-rose-600 hover:bg-rose-50 border border-rose-200"
                                    : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
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
            </div>
          </>
        )}
      </section>
    </div>
  );
}
