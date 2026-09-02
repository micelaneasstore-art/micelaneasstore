const { verificarTokenDescarga } = require("./_lib/delivery");
const { crearPdfTablas, nombreSeguro } = require("./_lib/pdf-loteria");
const { guardarYFirmar } = require("./_lib/blob-download");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido." });
  }

  try {
    const payload = verificarTokenDescarga(String(req.query.token || ""));
    const pdf = await crearPdfTablas(payload);
    const pathname = nombreSeguro(
      `pedidos/${payload.pid}/tablas-${payload.d}-${payload.f}-${payload.p || "carta-2-horizontal"}-${payload.q}.pdf`
    );

    const { presignedUrl, validUntil } = await guardarYFirmar({
      pathname,
      bytes: pdf,
      minutos: 15
    });

    console.log("PDF tablas generado", {
      payment_id: payload.pid,
      cantidad: payload.q,
      formato: payload.f,
      presentacion: payload.p || "carta-2-horizontal",
      diseno: payload.d,
      bytes: pdf.length,
      pathname
    });

    return res.status(200).json({
      listo: true,
      url: presignedUrl,
      expira: validUntil,
      nombre: `MicelaneasStore-${payload.q}-tablas-${payload.f}-${payload.p || "carta-2-horizontal"}.pdf`
    });
  } catch (error) {
    console.error("Error generando tablas", error);
    return res.status(500).json({
      listo: false,
      error: error.message || "No se pudo generar el PDF de tablas."
    });
  }
};
