const PREFIJO_PEDIDOS = "pedidos/";
const DIAS_RETENCION_PREDETERMINADOS = 7;
const TAMANO_LOTE_BORRADO = 100;

function valorQuery(req, nombre) {
  const valor = req.query && req.query[nombre];
  if (Array.isArray(valor)) return valor[0];
  return valor;
}

function diasRetencion(req) {
  const recibido = valorQuery(req, "dias");
  if (recibido === undefined || recibido === null || recibido === "") {
    return DIAS_RETENCION_PREDETERMINADOS;
  }

  const dias = Number(recibido);
  if (!Number.isFinite(dias) || dias < 0 || dias > 365) {
    throw new Error("El parámetro dias debe ser un número entre 0 y 365.");
  }

  return dias;
}

function esDryRun(req) {
  const valor = String(valorQuery(req, "dry") || "").toLowerCase();
  return valor === "1" || valor === "true" || valor === "si" || valor === "sí";
}

function estaAutorizado(req) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || secreto.length < 16) return false;
  return req.headers.authorization === `Bearer ${secreto}`;
}

async function listarPedidosAntiguos(dias) {
  const { list } = await import("@vercel/blob");
  const limiteFecha = Date.now() - dias * 24 * 60 * 60 * 1000;
  const encontrados = [];

  let cursor;
  let hasMore = true;

  while (hasMore) {
    const pagina = await list({
      prefix: PREFIJO_PEDIDOS,
      cursor,
      limit: 1000,
      mode: "expanded"
    });

    for (const blob of pagina.blobs || []) {
      const pathname = String(blob.pathname || "");

      // Protección doble: únicamente PDFs generados dentro de pedidos/.
      if (!pathname.startsWith(PREFIJO_PEDIDOS)) continue;
      if (!pathname.toLowerCase().endsWith(".pdf")) continue;

      const fecha = new Date(blob.uploadedAt).getTime();
      if (!Number.isFinite(fecha)) continue;

      if (fecha <= limiteFecha) {
        encontrados.push({
          pathname,
          url: blob.url,
          size: Number(blob.size || 0),
          uploadedAt: blob.uploadedAt
        });
      }
    }

    hasMore = Boolean(pagina.hasMore);
    cursor = pagina.cursor;
    if (hasMore && !cursor) break;
  }

  return encontrados;
}

async function borrarPedidos(blobs) {
  if (!blobs.length) return;

  const { del } = await import("@vercel/blob");

  for (let i = 0; i < blobs.length; i += TAMANO_LOTE_BORRADO) {
    const lote = blobs.slice(i, i + TAMANO_LOTE_BORRADO);

    // Volvemos a validar el prefijo justo antes del borrado.
    const pathnames = lote
      .map((blob) => blob.pathname)
      .filter(
        (pathname) =>
          pathname.startsWith(PREFIJO_PEDIDOS) &&
          pathname.toLowerCase().endsWith(".pdf")
      );

    if (pathnames.length) {
      await del(pathnames);
    }
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Método no permitido." });
  }

  if (!estaAutorizado(req)) {
    return res.status(401).json({ ok: false, error: "No autorizado." });
  }

  try {
    const dias = diasRetencion(req);
    const dryRun = esDryRun(req);
    const candidatos = await listarPedidosAntiguos(dias);
    const bytes = candidatos.reduce((total, item) => total + item.size, 0);

    if (!dryRun) {
      await borrarPedidos(candidatos);
    }

    return res.status(200).json({
      ok: true,
      modo: dryRun ? "simulacion" : "borrado",
      prefijoProtegido: PREFIJO_PEDIDOS,
      soloPDF: true,
      diasRetencion: dias,
      encontrados: candidatos.length,
      eliminados: dryRun ? 0 : candidatos.length,
      bytesLiberadosEstimados: dryRun ? 0 : bytes,
      megabytesLiberadosEstimados: dryRun
        ? 0
        : Number((bytes / 1024 / 1024).toFixed(2)),
      archivos: candidatos.map((item) => ({
        pathname: item.pathname,
        sizeMB: Number((item.size / 1024 / 1024).toFixed(2)),
        uploadedAt: item.uploadedAt
      }))
    });
  } catch (error) {
    console.error("Error limpiando pedidos:", error);
    return res.status(500).json({
      ok: false,
      error: error && error.message ? error.message : "Error al limpiar pedidos."
    });
  }
};
