import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/modules/auth/dal";
import { crearSesion } from "@/modules/auth/session";

export async function GET(request) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  await crearSesion(usuario);
  const destino = usuario.esAdmin ? "/dashboard" : "/mi-cronograma";
  return NextResponse.redirect(new URL(destino, request.nextUrl));
}
