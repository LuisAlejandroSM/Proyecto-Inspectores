import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const hash =
    "scrypt$Ra/Wpk+tp5ViCCC4e7cebw==$8mnD+9dAOww3HBQxyHAzFp61/lWy8Doehj7Xxe4DDlTvKHNOXnhqDBEze6Nl6SIN8iT4l24puZhHPnZPEVEdBQ==";

  const res = await pool.query(
    `
    UPDATE usuarios 
    SET clave_hash = $1,
        alias = 'admin',
        activo = true,
        intentos_fallidos = 0,
        bloqueado_hasta = NULL
    WHERE correo = 'admin@cronogramas.local' OR es_admin = true
    RETURNING id, correo, alias;
  `,
    [hash]
  );

  if (res.rowCount > 0) {
    console.log("✓ Contraseña de Administrador restablecida con éxito:");
    console.log("  Usuario:    admin (o admin@cronogramas.local)");
    console.log("  Contraseña: admin1234");
  } else {
    await pool.query(
      `
      INSERT INTO usuarios (nombre, correo, alias, rol, activo, clave_hash, es_admin, debe_cambiar_clave)
      VALUES ('Administrador', 'admin@cronogramas.local', 'admin', 'Administración', true, $1, true, false);
    `,
      [hash]
    );
    console.log("✓ Administrador creado con éxito:");
    console.log("  Usuario:    admin (o admin@cronogramas.local)");
    console.log("  Contraseña: admin1234");
  }
  await pool.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
