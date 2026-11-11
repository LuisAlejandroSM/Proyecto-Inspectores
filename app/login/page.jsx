import FormularioLogin from "@/modules/auth/components/FormularioLogin";

export const metadata = {
  title: "Iniciar sesión · Sistema de Inspecciones Preventivas",
};

// Pantalla de ingreso: fondo limpio y la tarjeta centrada (el logo de la empresa irá sobre los campos).
export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center p-4 md:min-h-[calc(100vh-3rem)]">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_10px_35px_-10px_rgba(15,23,42,0.1)]">
        <div className="h-1.5 bg-[#f5b800]" aria-hidden="true" />
        <div className="px-7 pb-8 pt-7">
          <div className="mb-6 text-center">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#876200]">CVCONCA</span>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Inspecciones Preventivas</h1>
            <p className="mt-1.5 text-xs text-slate-500">Ingrese con su usuario y contraseña asignada.</p>
          </div>
          <FormularioLogin />
        </div>
      </div>
    </div>
  );
}
