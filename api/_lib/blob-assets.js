const { unzipSync } = require("fflate");

const COLECCIONES = new Set([
  "tradicional", "animada", "gorditos", "fiesta-mexicana",
  "dia-muertos", "san-valentin", "infantil", "vaquera",
  "dia-madres", "maestro", "navidad"
]);
const cache = new Map();

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function cargarPaqueteColeccion(diseno) {
  if (!COLECCIONES.has(diseno)) {
    throw new Error("Colección no válida.");
  }

  if (cache.has(diseno)) {
    return cache.get(diseno);
  }

  const promesa = (async () => {
    const { get } = await import("@vercel/blob");
    const pathname = `loterias/${diseno}/cartas.zip`;

    const result = await get(pathname, {
      access: "private"
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error(
        `No encontramos las imágenes privadas de ${diseno} en Blob (${pathname}).`
      );
    }

    const zipBytes = await streamToBuffer(result.stream);
    const archivos = unzipSync(new Uint8Array(zipBytes));
    const cartas = new Map();

    for (let n = 1; n <= 54; n++) {
      const nombre = `${n}.png`;
      const bytes = archivos[nombre];
      if (!bytes) {
        throw new Error(`Falta ${nombre} dentro de ${pathname}.`);
      }
      cartas.set(n, Buffer.from(bytes));
    }

    return cartas;
  })();

  cache.set(diseno, promesa);

  try {
    return await promesa;
  } catch (error) {
    cache.delete(diseno);
    throw error;
  }
}

module.exports = {
  cargarPaqueteColeccion
};
