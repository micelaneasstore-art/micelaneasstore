const {
    verificarReferencia
} = require("./_lib/order");

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Método no permitido." });
    }

    try {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        const paymentId = String(req.query.payment_id || "").trim();

        if (!accessToken) {
            return res.status(500).json({
                error: "Falta MERCADOPAGO_ACCESS_TOKEN."
            });
        }

        if (!/^\d+$/.test(paymentId)) {
            return res.status(400).json({
                error: "payment_id inválido."
            });
        }

        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
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

        const montoCorrecto =
            Number(payment.transaction_amount) === Number(pedido.total);

        const monedaCorrecta = payment.currency_id === "MXN";
        const aprobado = payment.status === "approved";

        const valido = aprobado && montoCorrecto && monedaCorrecta;

        return res.status(200).json({
            valido,
            aprobado,
            status: payment.status,
            status_detail: payment.status_detail,
            payment_id: payment.id,
            pedido: valido
                ? {
                    cantidad: pedido.cantidad,
                    formato: pedido.formato,
                    diseno: pedido.diseno,
                    agregarMazo: pedido.agregarMazo,
                    distribucion: pedido.distribucion,
                    subtotal: pedido.subtotal,
                    mazo: pedido.mazo,
                    total: pedido.total
                }
                : null
        });

    } catch (error) {
        console.error(error);
        return res.status(400).json({
            valido: false,
            error: error.message || "No se pudo validar el pago."
        });
    }
};
