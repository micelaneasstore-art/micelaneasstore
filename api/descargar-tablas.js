const { verificarTokenDescarga } = require("./_lib/delivery");

module.exports = async function handler(req, res) {
    try {
        const payload = verificarTokenDescarga(String(req.query.token || ""));

        return res.status(501).json({
            listo: false,
            error:
                "El generador seguro de PDF necesita las imágenes originales limpias " +
                "en almacenamiento privado. El pago y la autorización ya fueron validados.",
            pedido: {
                cantidad: payload.q,
                formato: payload.f,
                diseno: payload.d,
                agregarMazo: payload.m === 1,
                distribucion: payload.r
            }
        });
    } catch (error) {
        return res.status(403).json({
            listo: false,
            error: error.message || "Descarga no autorizada."
        });
    }
};
