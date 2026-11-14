import Image from "next/image";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/modules/auth/dal";
import FormularioCambioClave from "@/modules/auth/components/FormularioCambioClave";

export const metadata = {
  title: "Cambiar contraseña · CVCONCA · Sistema de Inspecciones Operativas",
};

export default async function CambiarClavePage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    redirect("/login");
  }

  // Si en la base de datos el usuario ya actualizó su clave,
  // renovamos su sesión a través del Route Handler y lo redirigimos a su vista inicial.
  if (!usuario.debeCambiarClave) {
    redirect("/api/auth/sincronizar");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b] p-4 sm:p-6 overflow-y-auto">
      {/* Luz ambiental sutil en el fondo */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(245,184,0,0.12)_0%,rgba(9,9,11,1)_70%)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#121215]/95 p-7 sm:p-9 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        {/* Línea superior con gradiente amarillo */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/0 via-[#f5b800] to-amber-500/0"
          aria-hidden="true"
        />

        <div className="text-center">
          <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-black/60 p-2 ring-2 ring-[#f5b800]/30 shadow-2xl shadow-black/80">
            <Image
              src="/logo-cvconca.png"
              alt="Logo CVCONCA"
              width={84}
              height={84}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <span className="block text-[11px] font-black tracking-[0.25em] text-[#f5b800] uppercase">
            PRIMER INGRESO
          </span>
          <h1
            style={{ color: "#ffffff" }}
            className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight !text-white"
          >
            Cree su contraseña
          </h1>
          <p className="mt-1 text-xs font-medium text-zinc-400">
            Por seguridad, reemplace la contraseña temporal asignada
          </p>
        </div>

        <div className="mt-7">
          <FormularioCambioClave />
        </div>
      </div>
    </div>
  );
}
