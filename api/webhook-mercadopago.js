const {
    verificarReferencia
} = require("./_lib/order");

module.exports = async function handler(req, res) {
    // Responder rápido a Mercado Pago.
    res.status(200).json({ received: true });

    try {
        if (req.method !== "POST") return;

        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        const paymentId =
            req.body?.data?.id ||
            req.query?.["data.id"] ||
            req.query?.id;

        if (!accessToken || !paymentId) return;

        const response = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) return;

        const payment = await response.json();

        // No confiamos en el contenido del webhook:
        // volvemos a consultar el pago directamente a Mercado Pago.
        const pedido = verificarReferencia(payment.external_reference);

        const correcto =
            payment.status === "approved" &&
            payment.currency_id === "MXN" &&
            Number(payment.transaction_amount) === Number(pedido.total);

        console.log("Webhook Mercado Pago", {
            payment_id: payment.id,
            status: payment.status,
            correcto,
            cantidad: pedido.cantidad,
            formato: pedido.formato,
            diseno: pedido.diseno,
            mazo: pedido.agregarMazo
        });

        // En el siguiente paso, aquí guardaremos el pago aprobado en la BD
        // y generaremos la autorización de descarga.

    } catch (error) {
        console.error("Webhook Mercado Pago:", error);
    }
};
