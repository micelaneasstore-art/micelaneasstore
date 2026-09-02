const {
    verificarReferencia
} = require("./_lib/order");

/**
 * Webhook de Mercado Pago
 *
 * Acepta:
 *   - topic=payment / type=payment
 *   - topic=merchant_order
 *
 * IMPORTANTE:
 * No respondemos 200 antes de terminar las consultas.
 * En una función serverless, responder primero puede hacer que Vercel
 * finalice la ejecución y nunca se alcance a consultar Mercado Pago.
 */

function obtenerTipo(req) {
    return String(
        req.body?.type ||
        req.body?.topic ||
        req.query?.type ||
        req.query?.topic ||
        ""
    ).toLowerCase();
}

function obtenerId(req) {
    return String(
        req.body?.data?.id ||
        req.body?.id ||
        req.query?.["data.id"] ||
        req.query?.id ||
        ""
    ).trim();
}

async function mpGet(path, accessToken) {
    const response = await fetch(
        `https://api.mercadopago.com${path}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    const text = await response.text();
    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = { raw: text };
    }

    if (!response.ok) {
        const err = new Error(
            `Mercado Pago respondió ${response.status} al consultar ${path}`
        );
        err.status = response.status;
        err.data = data;
        throw err;
    }

    return data;
}

function resumirPago(payment) {
    return {
        payment_id: payment?.id ?? null,
        status: payment?.status ?? null,
        status_detail: payment?.status_detail ?? null,
        payment_type_id: payment?.payment_type_id ?? null,
        payment_method_id: payment?.payment_method_id ?? null,
        transaction_amount: payment?.transaction_amount ?? null,
        currency_id: payment?.currency_id ?? null,
        external_reference: payment?.external_reference ?? null,
        live_mode: payment?.live_mode ?? null,
        collector_id: payment?.collector_id ?? null
    };
}

async function procesarPago(paymentId, accessToken, origen) {
    const payment = await mpGet(
        `/v1/payments/${encodeURIComponent(paymentId)}`,
        accessToken
    );

    let pedido = null;
    let referenciaValida = false;
    let importeCorrecto = false;

    try {
        if (payment.external_reference) {
            pedido = verificarReferencia(payment.external_reference);
            referenciaValida = true;

            importeCorrecto =
                payment.currency_id === "MXN" &&
                Number(payment.transaction_amount) === Number(pedido.total);
        }
    } catch (error) {
        console.error("Referencia de pedido inválida", {
            origen,
            payment_id: payment.id,
            error: error.message
        });
    }

    const correcto =
        payment.status === "approved" &&
        referenciaValida &&
        importeCorrecto;

    console.log("Mercado Pago - detalle de pago", {
        origen,
        ...resumirPago(payment),
        referencia_valida: referenciaValida,
        importe_correcto: importeCorrecto,
        pago_correcto: correcto,
        pedido: pedido ? {
            cantidad: pedido.cantidad,
            formato: pedido.formato,
            presentacion: pedido.presentacion,
            diseno: pedido.diseno,
            mazo: pedido.agregarMazo,
            distribucion: pedido.distribucion,
            total: pedido.total
        } : null
    });

    return {
        payment,
        pedido,
        correcto
    };
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Método no permitido." });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const tipo = obtenerTipo(req);
    const id = obtenerId(req);

    console.log("Mercado Pago - webhook recibido", {
        tipo,
        id,
        query: req.query,
        body_type: req.body?.type ?? null,
        body_action: req.body?.action ?? null
    });

    if (!accessToken) {
        console.error("Webhook Mercado Pago: falta MERCADOPAGO_ACCESS_TOKEN");
        return res.status(500).json({ error: "Configuración incompleta." });
    }

    if (!id) {
        console.warn("Webhook Mercado Pago sin ID", {
            tipo,
            query: req.query
        });
        // MP puede enviar notificaciones que no nos interesan.
        return res.status(200).json({ received: true, ignored: true });
    }

    try {
        if (tipo === "merchant_order") {
            const order = await mpGet(
                `/merchant_orders/${encodeURIComponent(id)}`,
                accessToken
            );

            console.log("Mercado Pago - merchant order", {
                merchant_order_id: order?.id ?? id,
                status: order?.status ?? null,
                order_status: order?.order_status ?? null,
                total_amount: order?.total_amount ?? null,
                paid_amount: order?.paid_amount ?? null,
                cancelled: order?.cancelled ?? null,
                external_reference: order?.external_reference ?? null,
                preference_id: order?.preference_id ?? null,
                payments: Array.isArray(order?.payments)
                    ? order.payments.map(p => ({
                        id: p.id,
                        status: p.status,
                        status_detail: p.status_detail,
                        transaction_amount: p.transaction_amount
                    }))
                    : []
            });

            if (Array.isArray(order?.payments) && order.payments.length) {
                for (const p of order.payments) {
                    if (p?.id) {
                        await procesarPago(
                            p.id,
                            accessToken,
                            `merchant_order:${id}`
                        );
                    }
                }
            } else {
                console.log("Merchant order sin pagos asociados todavía", {
                    merchant_order_id: id
                });
            }

            return res.status(200).json({
                received: true,
                topic: "merchant_order"
            });
        }

        if (
            tipo === "payment" ||
            tipo === "payment.created" ||
            tipo === "payment.updated" ||
            req.body?.data?.id
        ) {
            await procesarPago(id, accessToken, tipo || "payment");

            return res.status(200).json({
                received: true,
                topic: "payment"
            });
        }

        console.log("Webhook ignorado", { tipo, id });

        return res.status(200).json({
            received: true,
            ignored: true,
            topic: tipo || null
        });

    } catch (error) {
        console.error("Webhook Mercado Pago - error de consulta", {
            tipo,
            id,
            message: error.message,
            status: error.status ?? null,
            mercado_pago: error.data ?? null
        });

        /*
         * Respondemos 500 para que Mercado Pago pueda reintentar
         * una notificación que falló por un problema temporal.
         */
        return res.status(500).json({
            error: "No se pudo procesar la notificación."
        });
    }
};
