import Image from "next/image";
import FormularioLogin from "@/modules/auth/components/FormularioLogin";

export const metadata = {
  title: "Iniciar sesión · CVCONCA · Sistema de Inspecciones Operativas",
};

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b] p-4 sm:p-6 overflow-y-auto">
      {/* Luz ambiental sutil en el fondo */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(245,184,0,0.12)_0%,rgba(9,9,11,1)_70%)]"
        aria-hidden="true"
      />

      {/* Tarjeta de Inicio de Sesión Corporativa */}
      <div className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#121215]/95 p-7 sm:p-9 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
        {/* Línea superior con gradiente amarillo corporativo */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/0 via-[#f5b800] to-amber-500/0"
          aria-hidden="true"
        />

        <div className="text-center">
          {/* Logo Medallón Oficial */}
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
            CVCONCA C.A.
          </span>
          <h1
            style={{ color: "#ffffff" }}
            className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight !text-white"
          >
            Inspecciones Operativas
          </h1>
        </div>

        <div className="mt-7">
          <FormularioLogin />
        </div>
      </div>
    </div>
  );
}
