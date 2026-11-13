import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/modules/auth/dal";
import FormularioCambioClave from "@/modules/auth/components/FormularioCambioClave";

export const metadata = {
  title: "Cambiar contraseña · Sistema de Inspecciones Preventivas",
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
    <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center p-4 md:min-h-[calc(100vh-3rem)]">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Barra superior de acento corporativo */}
        <div className="h-1 bg-[#f5b800]" aria-hidden="true" />
        
        <div className="px-7 pb-8 pt-7">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5b800] text-sm font-black text-[#09090b] shadow-xs">
              🔒
            </div>
            <span className="block text-[11px] font-black tracking-widest text-[#09090b] uppercase">
              PRIMER INGRESO
            </span>
            <h1 className="mt-1 text-lg font-bold tracking-tight text-zinc-900">
              Cree su contraseña
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Por seguridad, reemplace la contraseña temporal por una propia antes de continuar.
            </p>
          </div>

          <FormularioCambioClave />
        </div>
      </div>
    </div>
  );
}
