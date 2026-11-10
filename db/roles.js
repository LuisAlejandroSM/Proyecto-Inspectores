// Roles del sistema. Se guardan como texto en las columnas `rol` de usuarios y plantillas.
// Archivo sin dependencias: se puede importar desde el seed, Server y Client Components.

export const ROL_INSPECTOR_SIHO = "Inspector SIHO";
export const ROL_PARAMEDICO = "Paramédico";
export const ROL_RESCATISTA = "Rescatista";
// Formatos comunes que aparecen en el cronograma de todos los roles operativos.
export const ROL_GENERAL = "General";
// Roles administrativos / supervisión:
export const ROL_ADMINISTRACION = "Administración";
export const ROL_SUPERVISOR_SIHO = "Supervisor SIHO";

// Roles que ejecutan inspecciones y tienen cronograma individual.
export const ROLES_OPERATIVOS = [ROL_INSPECTOR_SIHO, ROL_PARAMEDICO, ROL_RESCATISTA];

// Categorías válidas para una plantilla de inspección.
export const ROLES_PLANTILLA = [...ROLES_OPERATIVOS, ROL_GENERAL];

/**
 * Devuelve la etiqueta formal del nivel del usuario en el sistema.
 * - Administrador del Sistema (Superadmin)
 * - Supervisor SIHO (Admin con permisos de supervisión)
 * - Inspector Operativo (según su rol en campo)
 */
export function etiquetaNivelUsuario(usuario) {
  if (usuario?.esSuperAdmin) return "Administrador del Sistema";
  if (usuario?.esAdmin) return "Supervisor SIHO";
  return usuario?.rol || "Inspector";
}

