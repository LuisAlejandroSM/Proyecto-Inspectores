"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { etiquetaNivelUsuario } from "@/db/roles";
import { cerrarSesion } from "../actions";
import { COOKIE_BARRA } from "../preferencias";

// Íconos lineales minimalistas (trazo de 2px)
const ICONOS = {
  dashboard: (
    <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" />
  ),
  cronogramas: (
    <path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8h2m4 0h2m-8 4h2m4 0h2" />
  ),
  inspectores: (
    <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m17 0v-1a4 4 0 0 0-3-3.87M14 4.13a4 4 0 0 1 0 7.75M13.5 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
  ),
  formularios: (
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.59a1 1 0 0 1 .7.29l5.42 5.42a1 1 0 0 1 .29.7V19a2 2 0 0 1-2 2Z" />
  ),
  notificaciones: (
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
  ),
  configuracion: (
    <g>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  "mi-cronograma": (
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4" />
  ),
  mas: (
    <g>
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </g>
  ),
  perfil: (
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
  ),
  clave: (
    <path d="M21 2l-2 2m-1.5 1.5L16 7l-1.5-1.5-3 3 1.5 1.5L9 13H5v4h4v-2l5-5 1.5 1.5 3-3L21 2z" />
  ),
  salir: <path d="M15 17l5-5-5-5m5 5H9m4 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8" />,
  colapsar: <path d="M15 18l-6-6 6-6" />,
  expandir: <path d="M9 18l6-6-6-6" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
};

function Icono({ nombre, className = "h-5 w-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {ICONOS[nombre] || null}
    </svg>
  );
}

function enlacesDe(usuario) {
  return usuario.esAdmin
    ? [
        { href: "/dashboard", etiqueta: "Dashboard", icono: "dashboard" },
        { href: "/", etiqueta: "Cronogramas", icono: "cronogramas" },
        { href: "/formularios", etiqueta: "Formularios", icono: "formularios" },
        { href: "/inspectores", etiqueta: "Inspectores", icono: "inspectores" },
        {
          href: "/notificaciones",
          etiqueta: "Notificaciones",
          icono: "notificaciones",
          contador: usuario.notificacionesPendientes,
          alerta: true,
        },
        { href: "/configuracion", etiqueta: "Configuración", icono: "configuracion" },
      ]
    : [
        { href: "/mi-cronograma", etiqueta: "Mi cronograma", icono: "mi-cronograma" },
        { href: "/mis-formularios", etiqueta: "Mis formularios", icono: "formularios", contador: usuario.pendientes },
      ];
}

// Enlaces primarios para la barra inferior fija en móvil (4 accesos rápidos + Más)
function enlacesMovil(usuario) {
  return usuario.esAdmin
    ? [
        { href: "/dashboard", etiqueta: "Dashboard", icono: "dashboard" },
        { href: "/", etiqueta: "Matriz", icono: "cronogramas" },
        { href: "/formularios", etiqueta: "Formatos", icono: "formularios" },
        {
          href: "/notificaciones",
          etiqueta: "Alertas",
          icono: "notificaciones",
          contador: usuario.notificacionesPendientes,
          alerta: true,
        },
      ]
    : [
        { href: "/mi-cronograma", etiqueta: "Cronograma", icono: "mi-cronograma" },
        {
          href: "/mis-formularios",
          etiqueta: "Formularios",
          icono: "formularios",
          contador: usuario.pendientes,
        },
      ];
}

function esActivo(href, ruta) {
  return href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);
}

function iniciales(nombre) {
  return (nombre || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

/** Contenido del Sidebar Desktop en negro carbón (#09090B) */
function ContenidoDesktop({ usuario, colapsada, botonColapsar }) {
  const ruta = usePathname();
  const enlaces = enlacesDe(usuario);

  return (
    <div className="flex h-full flex-col bg-[#09090b] text-slate-300 select-none">
      {/* Encabezado con marca Cvconca */}
      <div
        className={`flex h-16 items-center border-b border-[#27272a] ${
          colapsada ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {!colapsada && (
          <div className="flex items-center gap-2.5 min-w-0 pr-1">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f5b800] text-[11px] font-black text-[#09090b] shadow-xs">
              C
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-black tracking-widest text-[#f5b800] uppercase">
                CVCONCA
              </span>
              <span className="block text-[11px] font-semibold text-slate-400 tracking-tight truncate leading-none mt-0.5">
                SST / SIHO
              </span>
            </div>
          </div>
        )}
        {botonColapsar}
      </div>

      {/* Menú de Navegación */}
      <nav aria-label="Navegación principal" className="flex-1 space-y-1 p-3">
        {enlaces.map((e) => {
          const activo = esActivo(e.href, ruta);
          return (
            <Link
              key={e.href}
              href={e.href}
              title={colapsada ? e.etiqueta : undefined}
              aria-current={activo ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                colapsada ? "justify-center px-2" : ""
              } ${
                activo
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {/* Indicador vertical amarillo para el ítem activo */}
              {activo && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#f5b800]"
                />
              )}

              <span className="relative">
                <Icono
                  nombre={e.icono}
                  className={`h-5 w-5 transition-colors ${
                    activo ? "text-[#f5b800]" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                />
                {colapsada && e.contador > 0 && (
                  <span
                    className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-[#09090b] ${
                      e.alerta ? "bg-red-500 animate-pulse" : "bg-[#f5b800]"
                    }`}
                  />
                )}
              </span>

              {!colapsada && (
                <span className="flex-1 truncate tracking-tight">{e.etiqueta}</span>
              )}

              {!colapsada && e.contador > 0 && (
                <span
                  aria-label={`${e.contador} pendiente(s)`}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    e.alerta
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-[#f5b800] text-[#09090b]"
                  }`}
                >
                  {e.contador}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pie del sidebar con usuario y salida */}
      <div className="border-t border-[#27272a] p-3 space-y-2">
        <div
          className={`flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 ${
            colapsada ? "justify-center p-2" : ""
          }`}
          title={colapsada ? usuario.nombre : undefined}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f5b800] text-xs font-black text-[#09090b] shadow-xs">
            {iniciales(usuario.nombre)}
          </span>
          {!colapsada && (
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-white">
                {usuario.nombre}
              </span>
              <span className="block truncate text-[11px] font-semibold text-zinc-400">
                {etiquetaNivelUsuario(usuario)}
              </span>
            </div>
          )}
        </div>

        <form action={cerrarSesion}>
          <button
            type="submit"
            title={colapsada ? "Cerrar sesión" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-400 ${
              colapsada ? "justify-center px-2" : ""
            }`}
          >
            <Icono nombre="salir" className="h-4 w-4 shrink-0" />
            {!colapsada && <span>Cerrar sesión</span>}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Shell de Navegación Corporativo:
 * - Desktop: Sidebar colapsable en negro carbón (#09090B) con indicador amarillo.
 * - Móvil: Header superior minimalista + Bottom Navigation Bar fija + Drawer de opciones.
 */
export default function BarraLateral({ usuario, colapsadaInicial = false }) {
  const ruta = usePathname();
  const [colapsada, setColapsada] = useState(colapsadaInicial);
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  const alternar = () => {
    const nueva = !colapsada;
    setColapsada(nueva);
    document.cookie = `${COOKIE_BARRA}=${
      nueva ? "colapsada" : "expandida"
    }; path=/; max-age=31536000; samesite=lax`;
  };

  useEffect(() => {
    if (!drawerAbierto) return undefined;
    const alTeclado = (e) => e.key === "Escape" && setDrawerAbierto(false);
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  }, [drawerAbierto]);

  // Cerrar drawer al cambiar de ruta
  useEffect(() => {
    setDrawerAbierto(false);
  }, [ruta]);

  const enlacesPrincipalesMovil = enlacesMovil(usuario);

  return (
    <>
      {/* ======================================================== */}
      {/* 1. MÓVIL: Header Superior Minimalista */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#27272a] bg-[#09090b]/95 backdrop-blur-md px-4 md:hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f5b800] text-[11px] font-black text-[#09090b] shadow-xs">
            C
          </span>
          <div className="min-w-0">
            <span className="block text-[11px] font-black tracking-widest text-[#f5b800] uppercase">
              CVCONCA
            </span>
            <span className="block text-[10px] font-semibold text-zinc-400 tracking-tight truncate leading-none mt-0.5">
              Inspecciones Preventivas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {usuario.esAdmin && (
            <Link
              href="/notificaciones"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/[0.08]"
              aria-label="Ver notificaciones y alertas"
            >
              <Icono nombre="notificaciones" className="h-5 w-5" />
              {usuario.notificacionesPendientes > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-[#09090b] animate-pulse">
                  {usuario.notificacionesPendientes}
                </span>
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setDrawerAbierto(true)}
            aria-label="Abrir opciones de cuenta"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.08] text-xs font-bold text-[#f5b800] border border-white/10"
          >
            {iniciales(usuario.nombre)}
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MÓVIL: Bottom Navigation Bar Fija (4 accesos + Más) */}
      {/* ======================================================== */}
      <nav
        aria-label="Navegación móvil inferior"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[#27272a] bg-[#09090b]/95 backdrop-blur-md px-2 md:hidden"
      >
        {enlacesPrincipalesMovil.map((e) => {
          const activo = esActivo(e.href, ruta);
          return (
            <Link
              key={e.href}
              href={e.href}
              className={`relative flex flex-1 flex-col items-center justify-center py-1 text-center transition ${
                activo ? "text-[#f5b800]" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {/* Punto indicador de pestaña activa en la barra inferior */}
              {activo && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-0.5 w-6 rounded-full bg-[#f5b800]"
                />
              )}

              <div className="relative mt-1">
                <Icono nombre={e.icono} className="h-5 w-5" />
                {e.contador > 0 && (
                  <span
                    className={`absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${
                      e.alerta
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-[#f5b800] text-[#09090b]"
                    }`}
                  >
                    {e.contador}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${activo ? "font-bold text-[#f5b800]" : "font-medium"}`}>
                {e.etiqueta}
              </span>
            </Link>
          );
        })}

        {/* Botón "Más" para abrir el Drawer */}
        <button
          type="button"
          onClick={() => setDrawerAbierto(true)}
          className={`relative flex flex-1 flex-col items-center justify-center py-1 text-center transition ${
            drawerAbierto ? "text-[#f5b800]" : "text-zinc-400 hover:text-zinc-200"
          }`}
          aria-expanded={drawerAbierto}
        >
          <div className="mt-1">
            <Icono nombre="mas" className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Más</span>
        </button>
      </nav>

      {/* ======================================================== */}
      {/* 3. MÓVIL: Drawer Limpio para Opciones Secundarias */}
      {/* ======================================================== */}
      {drawerAbierto && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de opciones"
        >
          {/* Fondo oscurecido con desenfoque */}
          <div
            onClick={() => setDrawerAbierto(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Panel deslizante tipo Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-[#27272a] bg-[#09090b] p-5 text-zinc-200 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Tirador visual superior */}
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-zinc-700" />

            {/* Ficha del usuario actual */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5b800] text-sm font-black text-[#09090b] shadow-xs">
                  {iniciales(usuario.nombre)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{usuario.nombre}</p>
                  <p className="truncate text-xs text-[#f5b800] font-semibold">
                    {etiquetaNivelUsuario(usuario)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrawerAbierto(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                aria-label="Cerrar panel"
              >
                <Icono nombre="cerrar" className="h-5 w-5" />
              </button>
            </div>

            {/* Opciones secundarias */}
            <div className="py-3 space-y-1">
              <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Opciones del Sistema
              </p>

              {usuario.esAdmin && (
                <>
                  <Link
                    href="/inspectores"
                    onClick={() => setDrawerAbierto(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Icono nombre="inspectores" className="h-5 w-5 text-zinc-400" />
                    <span>Inspectores Operativos</span>
                  </Link>

                  <Link
                    href="/configuracion"
                    onClick={() => setDrawerAbierto(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Icono nombre="configuracion" className="h-5 w-5 text-zinc-400" />
                    <span>Configuración de Usuarios</span>
                  </Link>
                </>
              )}

              <Link
                href="/cambiar-clave"
                onClick={() => setDrawerAbierto(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06] hover:text-white"
              >
                <Icono nombre="clave" className="h-5 w-5 text-zinc-400" />
                <span>Cambiar mi contraseña</span>
              </Link>
            </div>

            {/* Botón de cerrar sesión */}
            <div className="border-t border-zinc-800 pt-3">
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/20 transition"
                >
                  <Icono nombre="salir" className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ESCRITORIO: Sidebar Fijo en Negro Carbón (#09090B) */}
      {/* ======================================================== */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 border-r border-[#27272a] bg-[#09090b] shadow-xs transition-[width] duration-200 md:block ${
          colapsada ? "w-16" : "w-60"
        }`}
      >
        <ContenidoDesktop
          usuario={usuario}
          colapsada={colapsada}
          botonColapsar={
            <button
              type="button"
              onClick={alternar}
              aria-label={colapsada ? "Expandir menú" : "Colapsar menú"}
              aria-expanded={!colapsada}
              title={colapsada ? "Expandir menú" : "Colapsar menú"}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            >
              <Icono nombre={colapsada ? "expandir" : "colapsar"} className="h-4 w-4" />
            </button>
          }
        />
      </aside>
    </>
  );
}
