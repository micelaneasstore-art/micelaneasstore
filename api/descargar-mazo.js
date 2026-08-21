const { verificarTokenDescarga } = require("./_lib/delivery");
const { crearPdfMazo, nombreSeguro } = require("./_lib/pdf-loteria");
const { guardarYFirmar } = require("./_lib/blob-download");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido." });
  }

  try {
    const payload = verificarTokenDescarga(String(req.query.token || ""));

    if (payload.m !== 1) {
      return res.status(403).json({
        listo: false,
        error: "Este pedido no incluye mazo."
      });
    }

    const pdf = await crearPdfMazo(payload);
    const pathname = nombreSeguro(
      `pedidos/${payload.pid}/mazo-${payload.d}-54-cartas.pdf`
    );

    const { presignedUrl, validUntil } = await guardarYFirmar({
      pathname,
      bytes: pdf,
      minutos: 15
    });

    console.log("PDF mazo generado", {
      payment_id: payload.pid,
      diseno: payload.d,
      bytes: pdf.length,
      pathname
    });

    return res.status(200).json({
      listo: true,
      url: presignedUrl,
      expira: validUntil,
      nombre: `MicelaneasStore-mazo-${payload.d}.pdf`
    });
  } catch (error) {
    console.error("Error generando mazo", error);
    return res.status(500).json({
      listo: false,
      error: error.message || "No se pudo generar el mazo."
    });
  }
};
