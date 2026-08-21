const {
    normalizarPedido,
    firmarPedido
} = require("./_lib/order");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Método no permitido." });
    }

    try {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        const baseUrl = String(process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");

        if (!accessToken) {
            return res.status(500).json({
                error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN en Vercel."
            });
        }

        if (!baseUrl || !baseUrl.startsWith("https://")) {
            return res.status(500).json({
                error:
                    "Falta PUBLIC_BASE_URL con una dirección HTTPS pública, " +
                    "por ejemplo https://micelaneasstore.com."
            });
        }

        const pedido = normalizarPedido(req.body || {});
        const externalReference = firmarPedido(pedido);

        console.log("Mercado Pago - external_reference", {
            longitud: externalReference.length,
            referencia: externalReference
        });

        const nombres = {
            tradicional: "Lotería Tradicional",
            animada: "Lotería Animada",
            gorditos: "Gorditos"
        };

        const items = [
            {
                id: "tablas-loteria",
                title: `${pedido.cantidad} tablas - ${nombres[pedido.diseno]}`,
                description: `Formato ${pedido.formato.toUpperCase()} · Producto digital`,
                quantity: 1,
                currency_id: "MXN",
                unit_price: pedido.subtotal
            }
        ];

        if (pedido.agregarMazo) {
            items.push({
                id: "mazo-54",
                title: "Mazo de 54 cartas",
                description: `Mazo imprimible - ${nombres[pedido.diseno]}`,
                quantity: 1,
                currency_id: "MXN",
                unit_price: pedido.mazo
            });
        }

        const preferenceBody = {
            items,
            external_reference: externalReference,
            auto_return: "approved",
            back_urls: {
                success: `${baseUrl}/pago-exitoso.html`,
                pending: `${baseUrl}/pago-pendiente.html`,
                failure: `${baseUrl}/pago-error.html`
            },
            notification_url: `${baseUrl}/api/webhook-mercadopago`
        };

        const mpResponse = await fetch(
            "https://api.mercadopago.com/checkout/preferences",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(preferenceBody)
            }
        );

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error("Mercado Pago:", mpData);
            return res.status(502).json({
                error: "Mercado Pago no pudo crear la preferencia.",
                detalle: mpData?.message || null
            });
        }

        return res.status(200).json({
            preference_id: mpData.id,
            init_point: mpData.init_point,
            total: pedido.total
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message || "Error interno al crear el pago."
        });
    }
};
