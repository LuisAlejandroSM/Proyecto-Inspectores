/**
 * Encabezado del formulario con los datos del formato oficial (código, emisión, revisión).
 * `children` agrega líneas extra (nota, fechas, inspector…).
 */
export default function EncabezadoFormato({ titulo, descripcion, codigo, emision, revision, children }) {
  const datos = [
    ["Código", codigo],
    ["Emisión", emision],
    ["Revisión", revision],
  ].filter(([, v]) => v);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 border-t-4 border-t-[#f5b800] bg-white shadow-xs">
      <div className="p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">{titulo || "Formulario sin título"}</h2>
        {descripcion && <p className="mt-1.5 whitespace-pre-line text-sm text-zinc-600 leading-relaxed">{descripcion}</p>}
        {children}
      </div>
      {datos.length > 0 && (
        <dl className="flex flex-wrap divide-x divide-zinc-200 border-t border-zinc-100 bg-zinc-50/70 text-xs">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="px-4 py-2.5">
              <dt className="inline font-bold uppercase tracking-wider text-[11px] text-zinc-400">{etiqueta}: </dt>
              <dd className="inline font-bold text-zinc-900">{valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
