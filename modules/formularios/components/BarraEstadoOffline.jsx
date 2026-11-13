"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { contarCola, listarCola } from "../offline/db";
import { iniciarAutoSincronizacion, sincronizarCola } from "../offline/sincronizador";

const suscribirNada = () => () => {};

export default function BarraEstadoOffline() {
  const enNavegador = useSyncExternalStore(suscribirNada, () => true, () => false);
  if (!enNavegador) return null;
  return <BarraInterna />;
}

function BarraInterna() {
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [progresoTexto, setProgresoTexto] = useState("");
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [itemsCola, setItemsCola] = useState([]);

  const refrescarCola = async () => {
    try {
      const n = await contarCola();
      setPendientes(n);
      if (n > 0) {
        const lista = await listarCola();
        setItemsCola(lista);
      } else {
        setItemsCola([]);
      }
    } catch {
      setPendientes(0);
      setItemsCola([]);
    }
  };

  useEffect(() => {
    const limpiarAutoSync = iniciarAutoSincronizacion();
    refrescarCola();

    const alEstarOnline = () => {
      setOnline(true);
      refrescarCola();
    };
    const alEstarOffline = () => {
      setOnline(false);
      refrescarCola();
    };

    const alIniciarSync = () => {
      setSincronizando(true);
    };

    const alTerminarSync = () => {
      setSincronizando(false);
      setProgresoTexto("");
      refrescarCola();
    };

    window.addEventListener("online", alEstarOnline);
    window.addEventListener("offline", alEstarOffline);
    window.addEventListener("cronogramas:sync-start", alIniciarSync);
    window.addEventListener("cronogramas:sync-end", alTerminarSync);

    const intervalo = setInterval(refrescarCola, 5000);

    return () => {
      limpiarAutoSync();
      window.removeEventListener("online", alEstarOnline);
      window.removeEventListener("offline", alEstarOffline);
      window.removeEventListener("cronogramas:sync-start", alIniciarSync);
      window.removeEventListener("cronogramas:sync-end", alTerminarSync);
      clearInterval(intervalo);
    };
  }, []);

  const forzarSincronizacion = () => {
    if (!online || sincronizando) return;
    sincronizarCola((p) => {
      setProgresoTexto(p.mensaje);
    });
  };

  if (online && pendientes === 0) {
    return (
      <div className="flex items-center justify-end px-1 py-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          En línea (Sincronizado)
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Aviso de falta de señal */}
      {!online && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-500/10 px-4 py-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-base">📡</span>
            <div>
              <p className="font-bold text-amber-950">Modo sin señal activado</p>
              <p className="text-[11px] text-amber-800">
                Puede llenar formularios con fotos y firmas. Se guardarán en su teléfono hasta que tenga internet.
              </p>
            </div>
          </div>
          <span className="rounded-lg bg-[#09090b] text-[#f5b800] px-2.5 py-1 text-[10px] font-black tracking-wider">
            OFFLINE
          </span>
        </div>
      )}

      {/* Banner de cola de envíos pendientes */}
      {pendientes > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#09090b] text-xs font-black text-[#f5b800] shadow-xs">
                {pendientes}
              </span>
              <div>
                <p className="text-xs font-bold text-zinc-950">
                  {pendientes === 1
                    ? "1 inspección guardada en este teléfono"
                    : `${pendientes} inspecciones guardadas en este teléfono`}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {sincronizando
                    ? progresoTexto || "Subiendo al servidor…"
                    : online
                      ? "Conexión detectada. Sincronizando automáticamente en segundo plano…"
                      : "Esperando señal Wi-Fi o datos para subirse al servidor."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMostrarDetalles((prev) => !prev)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition"
              >
                {mostrarDetalles ? "Ocultar lista" : "Ver lista"}
              </button>
              {online && (
                <button
                  type="button"
                  onClick={forzarSincronizacion}
                  disabled={sincronizando}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#f5b800] hover:bg-[#e0a800] px-3.5 py-1.5 text-xs font-bold text-[#09090b] shadow-xs active:scale-[0.98] transition disabled:opacity-50"
                >
                  {sincronizando ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#09090b] border-t-transparent" />
                      Subiendo…
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      Sincronizar ahora
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {mostrarDetalles && itemsCola.length > 0 && (
            <div className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-zinc-50/50 p-2 text-xs">
              {itemsCola.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-2.5">
                  <div>
                    <span className="font-bold text-zinc-900">{item.formularioTitulo || "Inspección"}</span>
                    <span className="ml-2 text-[10px] text-zinc-400 font-medium">
                      {new Date(item.creadoEn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {item.fotos?.length > 0 && (
                      <span className="ml-2 text-[10px] font-bold text-amber-700">
                        ({item.fotos.length} foto/firma)
                      </span>
                    )}
                  </div>
                  <div>
                    {item.estado === "sincronizando" ? (
                      <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        Subiendo…
                      </span>
                    ) : item.estado === "error" ? (
                      <span className="rounded-md bg-rose-100 border border-rose-300 px-2 py-0.5 text-[10px] font-bold text-rose-800" title={item.error}>
                        Reintentando…
                      </span>
                    ) : (
                      <span className="rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                        En cola
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
