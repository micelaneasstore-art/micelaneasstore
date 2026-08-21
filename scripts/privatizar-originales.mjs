import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const destinoBase = path.join(root, "originales-privados");
const colecciones = ["tradicional", "animada", "gorditos"];

fs.mkdirSync(destinoBase, { recursive: true });

for (const coleccion of colecciones) {
  const origen = path.join(root, "img", coleccion);
  const destino = path.join(destinoBase, coleccion);

  if (!fs.existsSync(origen)) {
    if (fs.existsSync(destino)) {
      console.log(`✓ ${coleccion}: ya estaba privatizada.`);
      continue;
    }
    console.warn(`! ${coleccion}: no se encontró carpeta origen.`);
    continue;
  }

  if (fs.existsSync(destino)) {
    throw new Error(
      `Ya existe ${destino}. No se movió ${origen} para evitar sobrescribir originales.`
    );
  }

  fs.renameSync(origen, destino);
  console.log(`✓ ${coleccion}: movida a originales-privados/${coleccion}`);
}

console.log("\nListo. Las vistas previas siguen en img/preview y los originales ya no quedan en la ruta pública.");
console.log("La carpeta originales-privados está ignorada por Git.\n");
