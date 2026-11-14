const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const jsonPath = path.join(__dirname, '..', 'db', 'data', 'formularios-migrados.json');
  const formulariosJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  let modJson = 0;
  for (const f of formulariosJson) {
    for (const c of f.campos) {
      if (c.tipo !== 'seccion' && !c.obligatorio) {
        c.obligatorio = true;
        modJson++;
      }
    }
  }
  fs.writeFileSync(jsonPath, JSON.stringify(formulariosJson, null, 2), 'utf8');
  console.log('JSON actualizado: ' + modJson + ' campos marcados como obligatorios.');

  // Actualizar también en base de datos PostgreSQL
  const client = new Client({ connectionString: 'postgresql://postgres:1234@127.0.0.1:5432/cronogramas' });
  await client.connect();

  const res = await client.query('SELECT id, titulo, campos FROM formularios');
  let camposDbMod = 0;
  let formsMod = 0;

  for (const row of res.rows) {
    let modified = false;
    const nuevosCampos = row.campos.map((campo) => {
      if (campo.tipo !== 'seccion' && !campo.obligatorio) {
        campo.obligatorio = true;
        modified = true;
        camposDbMod++;
      }
      return campo;
    });

    if (modified) {
      await client.query('UPDATE formularios SET campos = $1 WHERE id = $2', [JSON.stringify(nuevosCampos), row.id]);
      formsMod++;
    }
  }

  console.log(`Base de datos actualizada: ${camposDbMod} campos en ${formsMod} formularios.`);
  await client.end();
}

main().catch(console.error);
