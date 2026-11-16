"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
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

/* -------------------------------------------------------------------------
 * ICONOS SVG AUXILIARES
 * ------------------------------------------------------------------------- */
function IconoBuscar() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function IconoChevron({ abierto }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform duration-200 ${abierto ? "rotate-180 text-zinc-900" : "text-zinc-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconoCalendario() {
  return (
    <svg className="h-3 w-3 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconoMano() {
  return (
    <svg className="h-3 w-3 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg className="h-3.5 w-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconoDocumento() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
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

/**
 * Subpanel interactivo desplegable para un inspector:
 * Permite buscar rápidamente entre sus inspecciones asignadas y filtrarlas por estado u origen.
 */
function PanelInspeccionesInspector({ inspector }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos"); // todos | pendientes | completadas | cronograma | manuales

  const asignaciones = inspector.asignaciones || [];
  const total = asignaciones.length;
  const completadas = inspector.completadas || 0;
  const pendientes = inspector.pendientes || 0;
  const cronogramas = asignaciones.filter((a) => a.origen === "cronograma").length;
  const manuales = asignaciones.filter((a) => a.origen !== "cronograma").length;

  const filtradas = useMemo(() => {
    return asignaciones.filter((a) => {
      // Filtro de estado / origen
      if (filtro === "pendientes" && a.estado !== "pendiente") return false;
      if (filtro === "completadas" && a.estado !== "completada") return false;
      if (filtro === "cronograma" && a.origen !== "cronograma") return false;
      if (filtro === "manuales" && a.origen === "cronograma") return false;

      // Filtro de texto
      if (busqueda.trim()) {
        const q = busqueda.trim().toLocaleLowerCase("es");
        const matchTitulo = a.titulo && a.titulo.toLocaleLowerCase("es").includes(q);
        const matchCodigo = a.codigo && a.codigo.toLocaleLowerCase("es").includes(q);
        const matchSemana = a.semanaMes && a.semanaMes.toLocaleLowerCase("es").includes(q);
        const matchNota = a.nota && a.nota.toLocaleLowerCase("es").includes(q);
        if (!matchTitulo && !matchCodigo && !matchSemana && !matchNota) return false;
      }
      return true;
    });
  }, [asignaciones, busqueda, filtro]);

  if (total === 0) {
    return (
      <div className="bg-zinc-50/80 border-t border-zinc-200/70 p-6 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-zinc-400 mb-2.5 border border-zinc-200 shadow-2xs">
          <IconoDocumento />
        </div>
        <p className="text-xs font-bold text-zinc-900">
          {inspector.nombre} no tiene inspecciones asignadas actualmente
        </p>
        <p className="mt-1 text-[11px] text-zinc-500 max-w-md mx-auto">
          Las inspecciones se programan automáticamente desde su cronograma mensual o se pueden asignar manualmente desde el módulo de formularios.
        </p>
        <div className="mt-3.5 flex justify-center gap-2">
          <Link
            href="/formularios"
            className="rounded-xl bg-[#09090b] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 transition"
          >
            Ir a formularios →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50/70 border-t border-b border-zinc-200/90 p-4 sm:p-5 space-y-3.5">
      {/* Barra de herramientas interna: Búsqueda rápida + Filtros de estado */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Buscador de inspecciones */}
        <div className="relative flex-1 sm:max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <IconoBuscar />
          </span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={`Buscar entre las ${total} inspecciones de ${inspector.nombre} (ej. side boom, Semana 3)...`}
            className="w-full rounded-xl border border-zinc-200 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-zinc-900 shadow-2xs placeholder:text-zinc-400 outline-none focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition"
          />
        </div>

        {/* Filtros rápidos por estado y origen */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className={`rounded-lg px-2.5 py-1 font-bold transition shadow-2xs ${
              filtro === "todos"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Todas ({total})
          </button>
          <button
            type="button"
            onClick={() => setFiltro("pendientes")}
            className={`rounded-lg px-2.5 py-1 font-bold transition shadow-2xs ${
              filtro === "pendientes"
                ? "bg-amber-600 text-white"
                : "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Pendientes ({pendientes})
          </button>
          <button
            type="button"
            onClick={() => setFiltro("completadas")}
            className={`rounded-lg px-2.5 py-1 font-bold transition shadow-2xs ${
              filtro === "completadas"
                ? "bg-emerald-700 text-white"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            Completadas ({completadas})
          </button>
          <span className="hidden sm:inline-block h-3.5 w-px bg-zinc-200 mx-0.5" />
          <button
            type="button"
            onClick={() => setFiltro("cronograma")}
            className={`rounded-lg px-2.5 py-1 font-bold transition shadow-2xs ${
              filtro === "cronograma"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Cronograma ({cronogramas})
          </button>
          <button
            type="button"
            onClick={() => setFiltro("manuales")}
            className={`rounded-lg px-2.5 py-1 font-bold transition shadow-2xs ${
              filtro === "manuales"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Manuales ({manuales})
          </button>
        </div>
      </div>

      {/* Lista o Subtabla de Inspecciones */}
      {filtradas.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-2xs">
          <p className="text-xs font-bold text-zinc-800">
            No se encontraron inspecciones que coincidan con &quot;{busqueda}&quot;
          </p>
          <button
            type="button"
            onClick={() => {
              setBusqueda("");
              setFiltro("todos");
            }}
            className="mt-2 text-xs font-bold text-amber-700 hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-100 bg-zinc-50/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="py-2.5 px-3.5">Inspección / Formulario</th>
                <th className="py-2.5 px-3">Origen / Programación</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-900">
              {filtradas.map((a) => (
                <tr key={a.id} className="hover:bg-zinc-50/70 transition">
                  <td className="py-2.5 px-3.5">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-950 text-xs">{a.titulo}</span>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        {a.codigo && <span className="font-mono text-[10px] text-zinc-400">{a.codigo}</span>}
                        {a.codigo && <span>·</span>}
                        <span>{a.numPreguntas} preguntas</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {a.origen === "cronograma" ? (
                      <div className="inline-flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 shadow-2xs">
                          <IconoCalendario />
                          Cronograma
                        </span>
                        {a.semanaMes && (
                          <span className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 shadow-2xs">
                            {a.semanaMes}
                          </span>
                        )}
                        {a.programadoTexto && (
                          <span className="text-[11px] text-zinc-500 font-medium">
                            ({a.programadoTexto})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center gap-1 w-fit rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 shadow-2xs">
                          <IconoMano />
                          Manual
                        </span>
                        {a.nota && (
                          <span className="text-[10px] text-zinc-500 italic max-w-xs truncate" title={a.nota}>
                            &quot;{a.nota}&quot;
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {a.estado === "completada" ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 shadow-2xs">
                        <IconoCheck />
                        Completada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 shadow-2xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Pendiente
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 whitespace-nowrap text-zinc-500 text-[11px]">
                    {a.estado === "completada"
                      ? a.completadaEnTexto || "Completada"
                      : a.creadoEnTexto
                      ? `Asignada ${a.creadoEnTexto}`
                      : "—"}
                  </td>

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {a.estado === "completada" ? (
                      <Link
                        href={`/formularios/respuesta/${a.id}`}
                        className="rounded-lg bg-[#09090b] px-3 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-zinc-800 transition"
                      >
                        Ver respuesta →
                      </Link>
                    ) : (
                      <Link
                        href={`/formularios/${a.formularioId}`}
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition"
                      >
                        Ver formulario
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * COMPONENTE PRINCIPAL
 * ------------------------------------------------------------------------- */
export default function GestionInspectores({ inspectores, rolInicial, usuarioActual, usuarioActualId }) {
  const router = useRouter();
  const actualId = usuarioActual?.id || usuarioActualId;
  const esSuperAdmin = usuarioActual?.esSuperAdmin === true;
  const puedeAdministrar = usuarioActual?.esAdmin === true || esSuperAdmin;
  const rolesPermitidos = esSuperAdmin
    ? [...ROLES_OPERATIVOS, ROL_ADMINISTRACION, ROL_SUPERVISOR_SIHO]
    : [...ROLES_OPERATIVOS, ROL_SUPERVISOR_SIHO];

  const [isPending, startTransition] = useTransition();
  const [lista, setLista] = useState(inspectores);
  const [formAbierto, setFormAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [rol, setRol] = useState(rolesPermitidos.includes(rolInicial) ? rolInicial : rolesPermitidos[0]);
  const [errorForm, setErrorForm] = useState("");
  const [mensaje, setMensaje] = useState({ tipo: "idle", texto: "" });
  const [claveMostrada, setClaveMostrada] = useState(null);
  const [verInactivos, setVerInactivos] = useState(false);
  const [busquedaInspector, setBusquedaInspector] = useState("");
  const [expandidos, setExpandidos] = useState(() => new Set());

  useEffect(() => {
    setLista(inspectores);
  }, [inspectores]);

  const urlCronograma = (i) => (VISTA_POR_ROL[i.rol] ? `/?vista=${VISTA_POR_ROL[i.rol]}&usuario=${i.id}` : null);

  const alternarExpandido = (id) => {
    setExpandidos((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const abrirFormulario = () => {
    setForm(FORM_VACIO);
    setRol(rolesPermitidos.includes(rolInicial) ? rolInicial : rolesPermitidos[0]);
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
    const usuarioTexto = u.alias || u.correo;
    if (!window.confirm(`¿Generar nueva contraseña temporal para ${u.nombre} (${usuarioTexto})?`)) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await restablecerClave({ usuarioId: u.id });
        if (res?.success) {
          setClaveMostrada({
            titulo: `Nueva contraseña para ${u.nombre}.`,
            nombre: u.nombre,
            usuario: usuarioTexto,
            clave: res.claveTemporal,
            enlace: null,
          });
          setMensaje({ tipo: "ok", texto: `Contraseña de ${u.nombre} restablecida.` });
          router.refresh();
        } else {
          setMensaje({ tipo: "error", texto: res?.error ?? "No se pudo restablecer la contraseña." });
        }
      } catch {
        setMensaje({ tipo: "error", texto: "Sin conexión con el servidor." });
      }
    });
  };

  const handleEstado = (u) => {
    const accion = u.activo ? "desactivar" : "reactivar";
    if (!window.confirm(`¿Desea ${accion} a ${u.nombre}? ${u.activo ? "No podrá iniciar sesión." : "Podrá volver a entrar."}`)) {
      return;
    }
    startTransition(async () => {
      try {
        const res = await cambiarEstadoInspector({ usuarioId: u.id, activo: !u.activo });
        if (res?.success) {
          setLista((prev) => prev.map((item) => (item.id === u.id ? { ...item, activo: !u.activo } : item)));
          setMensaje({
            tipo: "ok",
            texto: `${u.nombre} quedó ${!u.activo ? "activo" : "desactivado"}.`,
          });
        } else {
          setMensaje({ tipo: "error", texto: res?.error ?? "No se pudo actualizar." });
        }
      } catch {
        setMensaje({ tipo: "error", texto: "Sin conexión con el servidor." });
      }
    });
  };

  // Filtrar inspectores por búsqueda y estado
  const visibles = lista.filter((i) => {
    if (!verInactivos && !i.activo) return false;
    if (!busquedaInspector.trim()) return true;
    const q = busquedaInspector.trim().toLocaleLowerCase("es");
    return (
      (i.nombre && i.nombre.toLocaleLowerCase("es").includes(q)) ||
      (i.alias && i.alias.toLocaleLowerCase("es").includes(q)) ||
      (i.correo && i.correo.toLocaleLowerCase("es").includes(q)) ||
      (i.cargo && i.cargo.toLocaleLowerCase("es").includes(q)) ||
      (i.rol && i.rol.toLocaleLowerCase("es").includes(q))
    );
  });

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
                {rolesPermitidos.map((r) => (
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

      {/* Directorio de Inspectores: Buscador + Tarjetas Móvil + Tabla Escritorio Desplegables */}
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        {/* Cabecera con Buscador de inspectores y Filtro de inactivos */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 bg-zinc-50/70 p-4">
          <div className="relative flex-1 sm:max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <IconoBuscar />
            </span>
            <input
              type="search"
              value={busquedaInspector}
              onChange={(e) => setBusquedaInspector(e.target.value)}
              placeholder="Buscar inspector por nombre, usuario o cargo..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-1.5 pl-9 pr-3 text-xs font-medium text-zinc-900 shadow-2xs placeholder:text-zinc-400 outline-none focus:border-[#f5b800] focus:ring-2 focus:ring-[#f5b800]/20 transition"
            />
          </div>

          <div className="flex items-center gap-4 justify-between sm:justify-end">
            <h2 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
              {inspectores.filter((i) => i.activo).length} inspectores activos
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
        </div>

        {visibles.length === 0 ? (
          <p className="p-10 text-center text-sm text-zinc-400 font-medium">
            {busquedaInspector.trim()
              ? `No se encontraron inspectores que coincidan con "${busquedaInspector}".`
              : "Aún no hay inspectores registrados. Pulse + Registrar inspector para agregar el primero."}
          </p>
        ) : (
          <>
            {/* Móvil (< 768px): Tarjetas con acordeón desplegable */}
            <div className="divide-y divide-zinc-100 md:hidden">
              {visibles.map((u) => {
                const yo = u.id === actualId;
                const enlace = urlCronograma(u);
                const abierto = expandidos.has(u.id);

                return (
                  <div key={`m-${u.id}`} className={`${u.activo ? "" : "bg-zinc-50/60 opacity-70"}`}>
                    <div className="p-4 space-y-3">
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

                      {/* Botón desplegable de inspecciones asignadas */}
                      <button
                        type="button"
                        onClick={() => alternarExpandido(u.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition shadow-2xs ${
                          abierto
                            ? "border-amber-300 bg-amber-50/60 text-amber-950"
                            : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>Inspecciones ({u.totalAsignaciones || 0})</span>
                          {u.completadas > 0 && (
                            <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px]">
                              {u.completadas} completadas
                            </span>
                          )}
                          {u.pendientes > 0 && (
                            <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px]">
                              {u.pendientes} pendientes
                            </span>
                          )}
                        </div>
                        <IconoChevron abierto={abierto} />
                      </button>

                      {/* Acciones de administración */}
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
                          {u.activo && !yo && (u.alias || u.correo) && (esSuperAdmin || (u.rol !== ROL_ADMINISTRACION && !u.esSuperAdmin)) && (
                            <button
                              type="button"
                              onClick={() => handleRestablecer(u)}
                              disabled={isPending}
                              className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                            >
                              {u.tieneAcceso ? "Clave" : "Acceso"}
                            </button>
                          )}
                          {puedeAdministrar && !yo && (esSuperAdmin || (u.rol !== ROL_ADMINISTRACION && !u.esSuperAdmin)) && (
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

                    {/* Subpanel desplegable de inspecciones en Móvil */}
                    {abierto && <PanelInspeccionesInspector inspector={u} />}
                  </div>
                );
              })}
            </div>

            {/* Escritorio (>= 768px): Tabla con filas expandibles para cada inspector */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-600">
                  <tr>
                    <th className="w-10 px-3 py-3.5 text-center"></th>
                    <th className="px-4 py-3.5">Inspector</th>
                    <th className="px-3 py-3.5">Rol</th>
                    <th className="px-3 py-3.5">Inspecciones</th>
                    <th className="px-3 py-3.5">Cargo</th>
                    <th className="px-3 py-3.5">Usuario</th>
                    <th className="px-3 py-3.5">Último acceso</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-900">
                  {visibles.map((u) => {
                    const yo = u.id === actualId;
                    const enlace = urlCronograma(u);
                    const abierto = expandidos.has(u.id);

                    return (
                      <Fragment key={u.id}>
                        <tr
                          onClick={() => alternarExpandido(u.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && alternarExpandido(u.id)}
                          className={`cursor-pointer transition ${
                            abierto
                              ? "bg-amber-50/20 hover:bg-amber-50/30"
                              : u.activo
                              ? "hover:bg-zinc-50/80"
                              : "bg-zinc-50/50 text-zinc-400 hover:bg-zinc-100/50"
                          }`}
                        >
                          <td className="px-3 py-3.5 text-center">
                            <span className="inline-flex items-center justify-center">
                              <IconoChevron abierto={abierto} />
                            </span>
                          </td>

                          <td className="px-4 py-3.5 font-medium">
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

                          <td className="px-3 py-3.5">
                            <span className="inline-block rounded-lg bg-zinc-100 border border-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-700">
                              {u.rol}
                            </span>
                          </td>

                          {/* Conteo de Inspecciones asignadas */}
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-bold text-zinc-950">
                                {u.totalAsignaciones || 0}
                              </span>
                              {u.completadas > 0 && (
                                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                  {u.completadas} completadas
                                </span>
                              )}
                              {u.pendientes > 0 && (
                                <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                  {u.pendientes} pendientes
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3.5 text-xs text-zinc-600 font-medium">{u.cargo || "—"}</td>
                          <td className="px-3 py-3.5 font-mono text-xs text-zinc-600">{u.alias || u.correo || "—"}</td>
                          <td className="px-3 py-3.5 text-xs text-zinc-400">{u.ultimoAcceso ?? "Nunca"}</td>

                          {/* Acciones (evitamos que el click en botones cierre/abra el acordeón) */}
                          <td
                            className="whitespace-nowrap px-5 py-3.5 text-right text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex flex-wrap justify-end gap-x-2 gap-y-1">
                              {u.activo && enlace && (
                                <Link
                                  href={enlace}
                                  className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-zinc-50 transition"
                                >
                                  Cronograma
                                </Link>
                              )}
                              {u.activo && !yo && (u.alias || u.correo) && (esSuperAdmin || (u.rol !== ROL_ADMINISTRACION && !u.esSuperAdmin)) && (
                                <button
                                  type="button"
                                  onClick={() => handleRestablecer(u)}
                                  disabled={isPending}
                                  className="rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition disabled:opacity-50"
                                >
                                  {u.tieneAcceso ? "Restablecer clave" : "Dar acceso"}
                                </button>
                              )}
                              {puedeAdministrar && !yo && (esSuperAdmin || (u.rol !== ROL_ADMINISTRACION && !u.esSuperAdmin)) && (
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

                        {/* Fila desplegable del inspector */}
                        {abierto && (
                          <tr key={`exp-${u.id}`}>
                            <td colSpan={8} className="p-0 border-b border-zinc-200">
                              <PanelInspeccionesInspector inspector={u} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
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
