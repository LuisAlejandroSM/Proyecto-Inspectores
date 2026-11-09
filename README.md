# Sistema de Cronogramas e Inspecciones SST/SIHO - Ceveconca

Plataforma integral para la gestión, seguimiento y ejecución de cronogramas e inspecciones técnicas en seguridad, salud en el trabajo y ambiente (SST/SIHO).

---

## 🚀 Características Principales

* **Planificación y Cronogramas:** Gestión de cronogramas periódicos por áreas operativas y seguimiento en tiempo real de porcentaje de ejecución.
* **Catálogo Oficial de Inspecciones:** 16 formularios digitales con validación dinámica, listas de verificación y soporte para múltiples inspectores.
* **Modo Sin Conexión (Offline First):** Capacidad completa para inspecciones en campo sin cobertura telefónica ni internet, con almacenamiento local seguro en IndexedDB y auto-sincronización al recuperar conectividad.
* **Centro de Notificaciones:** Sistema de alertas automáticas para administradores cuando una inspección no es ejecutada en su fecha límite.
* **Firmas Digitales y Evidencia Fotográfica:** Captura de firmas en pantalla táctil y compresión optimizada de fotografías en el cliente.
* **Control de Acceso y Roles:** Administración de usuarios, inspectores, administradores y perfiles operativos con tokens seguros.

---

## 🛠️ Tecnologías

* **Frontend & Backend:** Next.js (App Router) + React
* **Estilos:** Tailwind CSS
* **Base de Datos:** PostgreSQL con Drizzle ORM
* **Ejecutable / Runtime:** Bun (compatible también con Node.js 18+)

---

## 📦 Puesta en Marcha

### 1. Variables de Entorno
Copia el archivo de ejemplo `.env.example` como `.env.local` y define los parámetros de conexión:
```env
DATABASE_URL=postgresql://usuario:clave@localhost:5432/cronogramas
SESSION_SECRET=clave_secreta_super_segura_2026
TZ=America/Caracas
ARCHIVOS_DIR=C:\sistema-cronogramas\archivos
COOKIE_INSEGURA=1
```

### 2. Instalación de dependencias
```bash
bun install
```

### 3. Cargar la base de datos
Ejecuta el archivo `migracion/inicializar_completo.sql` en PostgreSQL, o sincroniza el catálogo con:
```bash
bun run db:cargar-formularios
```

### 4. Modo Desarrollo
```bash
bun run dev
```
Accede en `http://localhost:3000`.

### 5. Compilación y Servidor de Producción
```bash
bun run build
bun run start
```

---

## 🔄 Scripts de Utilidad (Windows)

En la carpeta `scripts/` se encuentran los asistentes listos para el servidor:
* **`actualizar-servidor.bat`**: Actualiza el código desde GitHub, sincroniza formularios y recompila la aplicación con un solo clic.
* **`configurar-auto-actualizador.bat`**: Programa la tarea del vigilante en segundo plano para actualizar el servidor automáticamente cada vez que se suban cambios a GitHub.
* **`iniciar-produccion.bat`**: Inicia el servidor de producción optimizado.
