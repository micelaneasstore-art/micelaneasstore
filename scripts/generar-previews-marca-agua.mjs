import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const ROOT = process.cwd();

const COLECCIONES = [
  "tradicional",
  "animada",
  "gorditos",
  "fiesta-mexicana",
  "dia-muertos",
  "san-valentin",
  "infantil",
  "vaquera",
  "dia-madres",
  "maestro",
  "navidad"
];

const ANCHO = 600;
const ALTO = 900;
const CALIDAD_WEBP = 86;
const MARCA = "MICELANEASSTORE";

function svgMarcaAgua() {
  return Buffer.from(`
  <svg width="${ANCHO}" height="${ALTO}" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(-32 ${ANCHO / 2} ${ALTO / 2})">
      <text x="50%" y="47%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700"
        letter-spacing="2" fill="rgba(190,30,30,0.90)"
        stroke="rgba(255,255,255,0.65)" stroke-width="2.5">${MARCA}</text>

      <text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700"
        letter-spacing="2" fill="rgba(190,30,30,0.90)"
        stroke="rgba(255,255,255,0.65)" stroke-width="2.5">${MARCA}</text>
    </g>
  </svg>`);
}

const marca = svgMarcaAgua();

async function generarPreview(origen, destino) {
  await sharp(origen)
    .resize(ANCHO, ALTO, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .composite([{ input: marca, gravity: "center" }])
    .webp({ quality: CALIDAD_WEBP, effort: 5 })
    .toFile(destino);
}

console.log("");
console.log("MicelaneasStore · Generando previews con marca de agua");
console.log("");

let total = 0;

for (const coleccion of COLECCIONES) {
  const carpetaOrigen = path.join(ROOT, "originales-privados", coleccion);
  const carpetaDestino = path.join(ROOT, "img", "preview", coleccion);

  if (!fs.existsSync(carpetaOrigen)) {
    throw new Error(`No encontramos la carpeta: ${carpetaOrigen}`);
  }

  fs.mkdirSync(carpetaDestino, { recursive: true });
  console.log(`Procesando ${coleccion}...`);

  for (let n = 1; n <= 54; n++) {
    const origen = path.join(carpetaOrigen, `${n}.png`);
    const destino = path.join(carpetaDestino, `${String(n).padStart(2, "0")}.webp`);

    if (!fs.existsSync(origen)) {
      throw new Error(`Falta ${coleccion}/${n}.png`);
    }

    await generarPreview(origen, destino);
    total++;
  }

  console.log("  ✓ 54 previews actualizados");
}

console.log("");
console.log(`✓ Proceso terminado: ${total} previews generados.`);
console.log(`✓ Tamaño: ${ANCHO} x ${ALTO} px`);
console.log("✓ Formato: WebP");
console.log(`✓ Marca: ${MARCA}`);
console.log("");
