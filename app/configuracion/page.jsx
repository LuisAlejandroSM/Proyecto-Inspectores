import { connection } from "next/server";
import { Suspense } from "react";
import { requerirAdmin } from "@/modules/auth/dal";
import GestionUsuariosSistema from "@/modules/usuarios/components/GestionUsuariosSistema";
import { obtenerUsuariosSistemaGestion } from "@/modules/usuarios/queries";

export const metadata = {
  title: "Configuración de Usuarios · Sistema de Inspecciones Preventivas",
};

function textoFecha(fecha) {
  if (!fecha) return null;
  const d = new Date(fecha);
  const dos = (n) => String(n).padStart(2, "0");
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

async function ContenidoConfiguracion() {
  await connection();
  const admin = await requerirAdmin();

  let usuarios = [];
  try {
    const filas = await obtenerUsuariosSistemaGestion();
    const ahora = new Date();
    usuarios = filas.map(({ bloqueadoHasta, ultimoAcceso, ...u }) => ({
      ...u,
      bloqueado: Boolean(bloqueadoHasta && new Date(bloqueadoHasta) > ahora),
      ultimoAcceso: textoFecha(ultimoAcceso),
    }));
  } catch (error) {
    console.error("[configuracion] Error cargando usuarios:", error);
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 shadow-xs">
        <h2 className="text-base font-bold text-rose-950">
          No se pudo consultar el listado de usuarios del sistema.
        </h2>
        <p className="mt-2 font-mono text-xs text-rose-700">
          {error?.message || "Error al conectar con la base de datos."}
        </p>
      </section>
    );
  }

  return <GestionUsuariosSistema usuarios={usuarios} usuarioActual={admin} />;
}

function Cargando() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-10 w-64 animate-pulse rounded-2xl bg-zinc-200/60" />
      <div className="h-96 animate-pulse rounded-2xl border border-zinc-200 bg-white" />
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <ContenidoConfiguracion />
    </Suspense>
  );
}
