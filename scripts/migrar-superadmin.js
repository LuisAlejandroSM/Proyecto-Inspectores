import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:1234@localhost:8031/cronogramas";

const pool = new Pool({ connectionString });

async function main() {
  console.log("Iniciando migración de roles (Administrador del Sistema / Supervisor SIHO)...");

  // 1. Agregar columna es_superadmin si no existe
  await pool.query(`
    ALTER TABLE usuarios 
    ADD COLUMN IF NOT EXISTS es_superadmin BOOLEAN NOT NULL DEFAULT FALSE;
  `);
  console.log("✓ Columna 'es_superadmin' verificada/agregada en la tabla 'usuarios'.");

  // 2. Asignar es_superadmin = true al administrador principal (admin o admin@cronogramas.local)
  const actualizados = await pool.query(`
    UPDATE usuarios
    SET es_superadmin = TRUE, es_admin = TRUE
    WHERE alias = 'admin' OR correo = 'admin@cronogramas.local'
    RETURNING id, nombre, alias, correo;
  `);

  if (actualizados.rowCount > 0) {
    console.log("✓ Usuario principal configurado como Administrador del Sistema:");
    for (const u of actualizados.rows) {
      console.log(`  - ${u.nombre} (${u.alias || u.correo}) [Administrador del Sistema]`);
    }
  } else {
    // Si no encontró usuario admin con ese alias, buscar el primer admin activo
    const primerAdmin = await pool.query(`
      UPDATE usuarios
      SET es_superadmin = TRUE
      WHERE id = (
        SELECT id FROM usuarios WHERE es_admin = TRUE ORDER BY creado_en ASC LIMIT 1
      )
      RETURNING id, nombre, alias, correo;
    `);
    if (primerAdmin.rowCount > 0) {
      console.log("✓ Primer administrador activo asignado como Administrador del Sistema:");
      for (const u of primerAdmin.rows) {
        console.log(`  - ${u.nombre} (${u.alias || u.correo}) [Administrador del Sistema]`);
      }
    } else {
      console.log("⚠ No se encontró un usuario administrador previo. Se configurará al crear el primer admin.");
    }
  }

  // Resumen
  const resumen = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE es_superadmin = TRUE) as superadmins,
      COUNT(*) FILTER (WHERE es_admin = TRUE AND es_superadmin = FALSE) as supervisores,
      COUNT(*) FILTER (WHERE es_admin = FALSE) as inspectores
    FROM usuarios;
  `);
  const r = resumen.rows[0];
  console.log(`\nResumen actual de cuentas:`);
  console.log(`  - Administradores del Sistema: ${r.superadmins}`);
  console.log(`  - Supervisores SIHO:          ${r.supervisores}`);
  console.log(`  - Inspectores Operativos:      ${r.inspectores}`);

  await pool.end();
  console.log("\n¡Migración finalizada con éxito!");
}

main().catch((err) => {
  console.error("Error en la migración:", err.message);
  process.exit(1);
});
