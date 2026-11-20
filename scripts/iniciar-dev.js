const { spawn, execSync } = require("child_process");
const net = require("net");

function verificarConexion(puerto, host) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port: puerto, host: host });
    socket.setTimeout(800);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const bdViva = await verificarConexion(5432, "127.0.0.1");
  if (!bdViva) {
    console.log("⚡ [SST] Base de datos apagada. Iniciando PostgreSQL en WSL Ubuntu...");
    try {
      execSync("wsl -d Ubuntu -u root -- systemctl start postgresql@18-main", { stdio: "inherit" });
      spawn("wsl", ["-d", "Ubuntu", "--", "sleep", "infinity"], { detached: true, stdio: "ignore" }).unref();
      console.log("✓ [SST] PostgreSQL iniciado con éxito.");
    } catch (err) {
      console.warn("⚠ [SST] Aviso: no se pudo iniciar PostgreSQL automáticamente:", err.message);
    }
  }

  // Ejecutar next dev pasando los argumentos directamente con Node
  const path = require("path");
  const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  const args = process.argv.slice(2);
  const child = spawn(process.execPath, [nextBin, "dev", ...args], {
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main();
