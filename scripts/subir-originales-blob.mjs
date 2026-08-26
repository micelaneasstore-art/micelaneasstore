import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { put } from "@vercel/blob";
import { zipSync } from "fflate";

const ROOT = process.cwd();
const COLECCIONES = [
  "tradicional", "animada", "gorditos", "fiesta-mexicana",
  "dia-muertos", "san-valentin", "infantil", "vaquera",
  "dia-madres", "maestro", "navidad"
];

function cargarEnvLocal() {
  const archivo = path.join(ROOT, ".env.local");
  if (!fs.existsSync(archivo)) return;

  for (const linea of fs.readFileSync(archivo, "utf8").split(/\r?\n/)) {
    const l = linea.trim();
    if (!l || l.startsWith("#")) continue;
    const i = l.indexOf("=");
    if (i < 1) continue;
    const clave = l.slice(0, i).trim();
    let valor = l.slice(i + 1).trim();
    if ((valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }
    if (!process.env[clave]) process.env[clave] = valor;
  }
}

function buscarCarpeta(coleccion) {
  const candidatas = [
    path.join(ROOT, "originales-privados", coleccion),
    path.join(ROOT, "img", coleccion)
  ];
  return candidatas.find(fs.existsSync);
}

function construirZip(carpeta, coleccion) {
  const archivos = {};

  for (let n = 1; n <= 54; n++) {
    const archivo = path.join(carpeta, `${n}.png`);
    if (!fs.existsSync(archivo)) {
      throw new Error(`Falta ${coleccion}/${n}.png`);
    }
    archivos[`${n}.png`] = new Uint8Array(fs.readFileSync(archivo));
  }

  return zipSync(archivos, { level: 1 });
}

cargarEnvLocal();

const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("\nNo encontramos BLOB_READ_WRITE_TOKEN.");
  console.error("Ejecuta primero: npx vercel link");
  console.error("y después:     npx vercel env pull .env.local\n");
  process.exit(1);
}

console.log("\nMicelaneasStore · Subida de originales a Vercel Blob privado\n");

for (const coleccion of COLECCIONES) {
  const carpeta = buscarCarpeta(coleccion);
  if (!carpeta) {
    throw new Error(`No encontramos la carpeta de ${coleccion}.`);
  }

  console.log(`Preparando ${coleccion}...`);
  const zip = construirZip(carpeta, coleccion);
  const pathname = `loterias/${coleccion}/cartas.zip`;

  const resultado = await put(pathname, zip, {
    access: "private",
    token,
    contentType: "application/zip",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60
  });

  console.log(`  ✓ ${pathname} (${(zip.byteLength / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`    ${resultado.pathname || pathname}`);
}

console.log("\n✓ Las 11 colecciones quedaron almacenadas en Blob privado.");
console.log("Ahora puedes ejecutar PRIVATIZAR_ORIGINALES.bat para quitar los originales de /img.\n");
