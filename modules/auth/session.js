import "server-only";

import { cookies, headers } from "next/headers";
import { DURACION_SESION_SEG, firmarSesion, NOMBRE_COOKIE, verificarSesion } from "./token";

/** Crea (o renueva) la cookie de sesión. */
export async function crearSesion({ id, esAdmin, esSuperAdmin, debeCambiarClave }) {
  const token = await firmarSesion({ id, esAdmin, esSuperAdmin, debeCambiarClave });
  const almacen = await cookies();

  // En despliegues locales sobre HTTP (sin SSL, ej: http://192.168.x.x:8030),
  // la cookie no debe llevar 'secure' porque el navegador la descartaría silenciosamente.
  let esHttps = process.env.COOKIE_SEGURA === "1";
  if (!esHttps && process.env.COOKIE_INSEGURA !== "1") {
    try {
      const h = await headers();
      const proto = h.get("x-forwarded-proto") || (h.get("referer")?.startsWith("https://") ? "https" : "http");
      esHttps = proto === "https";
    } catch {
      esHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ?? false;
    }
  }

  almacen.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    secure: Boolean(esHttps),
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_SEG,
  });
}

export async function leerSesion() {
  const almacen = await cookies();
  return verificarSesion(almacen.get(NOMBRE_COOKIE)?.value);
}

export async function borrarSesion() {
  const almacen = await cookies();
  almacen.delete(NOMBRE_COOKIE);
}
