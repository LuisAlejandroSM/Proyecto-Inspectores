import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import MenuPrincipal from "@/modules/auth/components/MenuPrincipal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CVCONCA · Sistema de Inspecciones Preventivas",
  description: "Control operativo y gestión SST / SIHO de inspecciones preventivas para CVCONCA C.A.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CVCONCA SST",
  },
  icons: {
    icon: "/logo-cvconca.png",
    apple: "/logo-cvconca.png",
  },
};

export const viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} h-full antialiased`}
    >
      {/* Celular: columna (barra superior + contenido). Escritorio: barra lateral + contenido en fila;
          sin sesión, la barra superior ocupa una fila completa gracias al wrap. */}
      <body className={`${geistSans.className} flex min-h-full flex-col bg-background font-sans md:flex-row md:flex-wrap`}>
        {/* La navegación depende del usuario (lee la sesión): va dentro de Suspense. */}
        <Suspense fallback={null}>
          <MenuPrincipal />
        </Suspense>
        <main className="w-full min-w-0 flex-1 p-4 pb-24 md:w-auto md:p-6 md:pb-6">
          <div className="mx-auto max-w-[1800px]">{children}</div>
        </main>
      </body>
    </html>
  );
}
