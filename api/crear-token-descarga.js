const { verificarReferencia } = require("./_lib/order");
const { crearTokenDescarga } = require("./_lib/delivery");

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Método no permitido." });
    }

    try {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        const paymentId = String(req.query.payment_id || "").trim();

        if (!accessToken) {
            return res.status(500).json({ error: "Falta MERCADOPAGO_ACCESS_TOKEN." });
        }

        if (!/^\d+$/.test(paymentId)) {
            return res.status(400).json({ error: "payment_id inválido." });
        }

        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const payment = await response.json();

        if (!response.ok) {
            return res.status(502).json({
                error: "No fue posible consultar el pago."
            });
        }

        const pedido = verificarReferencia(payment.external_reference);

        const valido =
            payment.status === "approved" &&
            payment.currency_id === "MXN" &&
            Number(payment.transaction_amount) === Number(pedido.total);

        if (!valido) {
            return res.status(403).json({
                error: "El pago no está aprobado o no coincide con el pedido."
            });
        }

        const token = crearTokenDescarga({
            paymentId: payment.id,
            pedido,
            minutos: 15
        });

        return res.status(200).json({
            token,
            expira_en_minutos: 15,
            pedido: {
                cantidad: pedido.cantidad,
                formato: pedido.formato,
                diseno: pedido.diseno,
                agregarMazo: pedido.agregarMazo,
                distribucion: pedido.distribucion,
                total: pedido.total
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(400).json({
            error: error.message || "No se pudo autorizar la descarga."
        });
    }
};
