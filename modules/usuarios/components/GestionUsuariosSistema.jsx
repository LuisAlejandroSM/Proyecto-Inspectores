"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  ROL_ADMINISTRACION,
  ROL_SUPERVISOR_SIHO,
  ROLES_OPERATIVOS,
  etiquetaNivelUsuario,
} from "@/db/roles";
import {
  cambiarAdministrador,
  cambiarEstadoInspector,
  crearInspector,
  restablecerClave,
} from "../actions";

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
    enterprise: "bg-[#0f1420] text-[#f5b800] ring-1 ring-white/10",
    morado: "bg-purple-50 text-purple-700 border-purple-200",
    azul: "bg-blue-50 text-blue-700 border-blue-200",
    ambar: "bg-amber-50 text-amber-800 border-amber-200",
    rojo: "bg-rose-50 text-rose-700 border-rose-200",
    gris: "bg-slate-100 text-slate-600 border-slate-200",
    esmeralda: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
        tonos[tono] || tonos.gris
      }`}
    >
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
      await navigator.clipboard.writeText(
        `Usuario: ${usuarioTexto}\nContraseña temporal: ${datos.clave}`
      );
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };
  return (
    <div
      role="status"
      className="rounded border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900"
    >
      <p className="font-semibold">{datos.titulo}</p>
      <p className="mt-1">
        Entréguele estos datos a <strong>{datos.nombre}</strong>. La contraseña
        no se volverá a mostrar y el sistema le pedirá cambiarla en su primer
        acceso.
      </p>
      <dl className="mt-3 grid gap-1 font-mono text-sm sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <dt className="text-emerald-700">Usuario</dt>
        <dd className="select-all font-semibold">{usuarioTexto}</dd>
        <dt className="text-emerald-700">Contraseña temporal</dt>
        <dd className="select-all text-base font-bold tracking-wider">
          {datos.clave}
        </dd>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          className="rounded border border-emerald-400 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
        >
          {copiado ? "Copiado ✓" : "Copiar datos"}
        </button>
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

export default function GestionUsuariosSistema({ usuarios, usuarioActual }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lista, setLista] = useState(usuarios);
  const [filtro, setFiltro] = useState("todos"); // todos | supervisores | inspectores | inactivos
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [errorForm, setErrorForm] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "idle", texto: "" });
  const [claveMostrada, setClaveMostrada] = useState(null);

  const esSuperAdmin = usuarioActual?.esSuperAdmin === true;

  // Roles que este usuario tiene permiso de crear
  const rolesPermitidosCrear = esSuperAdmin
    ? [ROL_SUPERVISOR_SIHO, ...ROLES_OPERATIVOS]
    : [...ROLES_OPERATIVOS];

  const [rolSeleccionado, setRolSeleccionado] = useState(
    rolesPermitidosCrear[0]
  );

  useEffect(() => {
    setLista(usuarios);
  }, [usuarios]);

  const abrirFormulario = () => {
    setForm(FORM_VACIO);
    setRolSeleccionado(rolesPermitidosCrear[0]);
    setErrorForm("");
    setFormAbierto(true);
  };

  const ejecutar = (accionAsync, textoExito, alTerminar) => {
    setMensaje({ tipo: "idle", texto: "" });
    startTransition(async () => {
      try {
        const res = await accionAsync();
        if (res?.success) {
          setMensaje({ tipo: "ok", texto: textoExito(res) });
          alTerminar?.(res);
          router.refresh();
        } else {
          setMensaje({
            tipo: "error",
            texto: res?.error || "No se pudo completar la operación.",
          });
        }
      } catch (e) {
        setMensaje({
          tipo: "error",
          texto: e?.message || "Ocurrió un error inesperado.",
        });
      }
    });
  };

  const handleCrear = (e) => {
    e.preventDefault();
    setErrorForm("");

    startTransition(async () => {
      try {
        const res = await crearInspector({
          ...form,
          rol: rolSeleccionado,
        });

        if (res?.success) {
          setFormAbierto(false);
          setClaveMostrada({
            nombre: form.nombre,
            usuario: res.usuario,
            clave: res.claveTemporal,
            titulo: "Cuenta registrada con éxito",
          });
          setForm(FORM_VACIO);
          router.refresh();
        } else {
          setErrorForm(res?.error || "No se pudo registrar la cuenta.");
        }
      } catch (err) {
        setErrorForm(err?.message || "Error al registrar la cuenta.");
      }
    });
  };

  const handleRestablecer = (u) => {
    if (
      !window.confirm(
        `¿Generar una contraseña temporal nueva para ${u.nombre}? Su contraseña anterior dejará de funcionar.`
      )
    )
      return;

    ejecutar(
      () => restablecerClave({ id: u.id }),
      () => "Contraseña temporal generada.",
      (res) => {
        setClaveMostrada({
          nombre: u.nombre,
          usuario: res.usuario,
          clave: res.claveTemporal,
          titulo: "Contraseña temporal generada",
        });
      }
    );
  };

  const handleAdmin = (u) => {
    if (!esSuperAdmin) return;
    const dar = !u.esAdmin;
    const accion = dar
      ? `¿Asignar rol de Supervisor SIHO a ${u.nombre}? Tendrá acceso a ver cronogramas, formularios y reportes.`
      : `¿Quitar permisos de Supervisor SIHO a ${u.nombre}? Pasará a ser un usuario sin privilegios de supervisión.`;

    if (!window.confirm(accion)) return;

    // Actualización optimista
    setLista((prev) =>
      prev.map((item) => (item.id === u.id ? { ...item, esAdmin: dar } : item))
    );

    ejecutar(
      () => cambiarAdministrador({ id: u.id, esAdmin: dar }),
      () =>
        `${u.nombre}: ${
          dar ? "asignado como Supervisor SIHO" : "permisos revocados"
        }.`,
      () => {}
    );
  };

  const handleEstado = (u) => {
    if (!esSuperAdmin) return;
    const nuevoActivo = !u.activo;
    const accion = nuevoActivo
      ? `¿Reactivar la cuenta de ${u.nombre}? Podrá volver a acceder al sistema.`
      : `¿Desactivar la cuenta de ${u.nombre}? Perderá el acceso de inmediato sin borrar sus registros previos.`;

    if (!window.confirm(accion)) return;

    // Actualización optimista
    setLista((prev) =>
      prev.map((item) =>
        item.id === u.id ? { ...item, activo: nuevoActivo } : item
      )
    );

    ejecutar(
      () => cambiarEstadoInspector({ id: u.id, activo: nuevoActivo }),
      () => `${u.nombre}: cuenta ${nuevoActivo ? "reactivada" : "desactivada"}.`,
      () => {}
    );
  };

  // Filtrado de la lista
  const visibles = lista.filter((u) => {
    const textoBusqueda = busqueda.toLowerCase().trim();
    if (textoBusqueda) {
      const coincideNombre = u.nombre.toLowerCase().includes(textoBusqueda);
      const coincideUsuario = (u.alias || u.correo || "")
        .toLowerCase()
        .includes(textoBusqueda);
      const coincideCargo = (u.cargo || "").toLowerCase().includes(textoBusqueda);
      if (!coincideNombre && !coincideUsuario && !coincideCargo) return false;
    }

    if (filtro === "supervisores") return u.esAdmin || u.esSuperAdmin;
    if (filtro === "inspectores") return !u.esAdmin && !u.esSuperAdmin;
    if (filtro === "inactivos") return !u.activo;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Cabecera y botón de acción */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Usuarios del Sistema
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administración central de cuentas, credenciales y niveles de acceso del personal
          </p>
        </div>

        {!formAbierto && (
          <button
            type="button"
            onClick={abrirFormulario}
            className="rounded-xl bg-[#0f1420] px-4 py-2 text-xs font-bold text-white shadow-sm ring-1 ring-white/10 transition hover:bg-[#1a2337] active:scale-[0.98]"
          >
            + Registrar usuario
          </button>
        )}
      </div>

      {/* KPI Cards de resumen de usuarios */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Cuentas</span>
          <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">{lista.length}</p>
        </div>
        <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Supervisores SIHO</span>
          <p className="mt-1 text-2xl font-black text-purple-900 tabular-nums">
            {lista.filter((u) => u.esAdmin || u.esSuperAdmin).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inspectores Operativos</span>
          <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">
            {lista.filter((u) => !u.esAdmin && !u.esSuperAdmin).length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Cuentas Activas</span>
          <p className="mt-1 text-2xl font-black text-emerald-900 tabular-nums">
            {lista.filter((u) => u.activo).length}
          </p>
        </div>
      </div>

      {/* Notificación de resultado */}
      {mensaje.texto && (
        <div
          role="status"
          className={`rounded-xl border p-3.5 text-xs font-semibold ${
            mensaje.tipo === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Contraseña temporal generada */}
      {claveMostrada && (
        <ClaveTemporal
          datos={claveMostrada}
          onCerrar={() => setClaveMostrada(null)}
        />
      )}

      {/* Formulario de registro */}
      {formAbierto && (
        <form
          onSubmit={handleCrear}
          className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
        >
          <div className="border-b border-amber-100 bg-amber-50/50 px-5 py-3.5">
            <h3 className="text-sm font-bold tracking-tight text-slate-900">
              Registrar nuevo usuario en el sistema
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {esSuperAdmin
                ? "Como Administrador del Sistema puede crear Supervisores SIHO o Inspectores Operativos."
                : "Como Supervisor SIHO puede registrar Inspectores Operativos."}
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
                placeholder="Ej. Carlos Pérez"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className={CLASE_CAMPO}
              />
            </label>

            <label className={CLASE_ETIQUETA}>
              Rol o nivel en el sistema *
              <select
                value={rolSeleccionado}
                onChange={(e) => setRolSeleccionado(e.target.value)}
                className={CLASE_CAMPO}
              >
                {rolesPermitidosCrear.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className={CLASE_ETIQUETA}>
              Nombre de usuario *
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
              Cargo formal
              <input
                maxLength={100}
                placeholder="Ej. Inspector SST"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                className={CLASE_CAMPO}
              />
            </label>
          </div>

          {errorForm && (
            <p className="px-5 pb-3 text-xs font-semibold text-red-600">
              {errorForm}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3">
            <button
              type="button"
              onClick={() => setFormAbierto(false)}
              className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar y generar clave"}
            </button>
          </div>
        </form>
      )}

      {/* Filtros y buscador */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "todos", etiqueta: "Todos los usuarios" },
            { id: "supervisores", etiqueta: "Supervisores SIHO / Admins" },
            { id: "inspectores", etiqueta: "Inspectores Operativos" },
            { id: "inactivos", etiqueta: "Inactivos" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                filtro === f.id
                  ? "bg-[#0f1420] text-white shadow-sm ring-1 ring-white/10"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="search"
            placeholder="Buscar por nombre o usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/25 transition outline-none"
          />
        </div>
      </div>

      {/* Tabla de usuarios */}
      <section className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {visibles.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No se encontraron usuarios con el filtro seleccionado.
          </p>
        ) : (
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-bold text-slate-600">
              <tr>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-4 py-3">Nivel / Rol</th>
                <th className="px-4 py-3">Alias / Acceso</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Último acceso</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((u) => {
                const yo = u.id === usuarioActual?.id;
                const esSuper = u.esSuperAdmin === true;
                const esAdmin = u.esAdmin === true;

                return (
                  <tr
                    key={u.id}
                    className={`transition hover:bg-slate-50/70 ${
                      u.activo ? "" : "bg-slate-50/80 text-slate-400"
                    }`}
                  >
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-700 border border-slate-200 shadow-2xs">
                          {iniciales(u.nombre)}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{u.nombre}</span>
                            {yo && <Etiqueta tono="gris">Usted</Etiqueta>}
                            {!u.activo && (
                              <Etiqueta tono="rojo">Desactivado</Etiqueta>
                            )}
                            {u.activo && !u.tieneAcceso && (
                              <Etiqueta tono="ambar">Sin clave</Etiqueta>
                            )}
                            {u.activo && u.tieneAcceso && u.debeCambiarClave && (
                              <Etiqueta tono="ambar">Clave temporal</Etiqueta>
                            )}
                            {u.bloqueado && (
                              <Etiqueta tono="rojo">Bloqueado</Etiqueta>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {esSuper ? (
                        <Etiqueta tono="enterprise">
                          Administrador del Sistema
                        </Etiqueta>
                      ) : esAdmin ? (
                        <Etiqueta tono="azul">Supervisor SIHO</Etiqueta>
                      ) : (
                        <Etiqueta tono="gris">{u.rol}</Etiqueta>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {u.alias || u.correo || "—"}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600">
                      {u.cargo || "—"}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {u.ultimoAcceso ?? "Nunca"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 text-right text-xs">
                      <div className="inline-flex flex-wrap justify-end gap-x-2 gap-y-1">
                        {/* Restablecer contraseña: tanto Superadmin como Supervisor SIHO */}
                        {u.activo && !yo && (u.alias || u.correo) && (
                          <button
                            type="button"
                            onClick={() => handleRestablecer(u)}
                            disabled={isPending}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
                          >
                            Restablecer clave
                          </button>
                        )}

                        {/* Promover/Quitar Supervisor SIHO: Solo Administrador del Sistema */}
                        {esSuperAdmin && !yo && !esSuper && (
                          <button
                            type="button"
                            onClick={() => handleAdmin(u)}
                            disabled={isPending}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
                          >
                            {u.esAdmin ? "Quitar Supervisor" : "Hacer Supervisor"}
                          </button>
                        )}

                        {/* Desactivar/Reactivar cuenta: Solo Administrador del Sistema */}
                        {esSuperAdmin && !yo && !esSuper && (
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
