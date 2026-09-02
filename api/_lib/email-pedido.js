const { crearTokenDescarga } = require("./delivery");

function escaparHtml(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function nombreDiseno(slug) {
    const nombres = {
        tradicional: "Tradicional",
        animada: "Animada",
        gorditos: "Gorditos",
        "fiesta-mexicana": "Fiesta Mexicana",
        "dia-muertos": "Día de Muertos",
        "san-valentin": "San Valentín",
        infantil: "Infantil",
        vaquera: "Vaquera",
        "dia-madres": "Día de las Madres",
        maestro: "Maestro",
        navidad: "Navidad"
    };
    return nombres[slug] || slug || "Lotería";
}

function nombrePresentacion(slug) {
    const nombres = {
        "carta-2-horizontal": "2 tablas por hoja · Carta horizontal",
        "carta-4-vertical": "4 tablas por hoja · Carta vertical",
        "tabloide-4-vertical": "4 tablas por hoja · Tabloide vertical",
        "tabloide-8-horizontal": "8 tablas por hoja · Tabloide horizontal"
    };
    return nombres[slug] || "Presentación seleccionada";
}

async function yaSeEnvio(paymentId) {
    try {
        const { list } = await import("@vercel/blob");
        const pathname = `email-enviados/${paymentId}.json`;
        const resultado = await list({ prefix: pathname, limit: 1 });
        return Array.isArray(resultado?.blobs) &&
            resultado.blobs.some(b => b.pathname === pathname);
    } catch (error) {
        console.warn("No se pudo consultar marcador de correo", {
            payment_id: paymentId,
            error: error.message
        });
        return false;
    }
}

async function marcarEnviado(paymentId, email, resendId) {
    try {
        const { put } = await import("@vercel/blob");
        const pathname = `email-enviados/${paymentId}.json`;
        const contenido = JSON.stringify({
            payment_id: String(paymentId),
            email,
            resend_id: resendId || null,
            enviado_en: new Date().toISOString()
        });

        await put(pathname, Buffer.from(contenido, "utf8"), {
            access: "private",
            contentType: "application/json",
            addRandomSuffix: false,
            allowOverwrite: true,
            cacheControlMaxAge: 60
        });
    } catch (error) {
        console.warn("Correo enviado, pero no se pudo guardar marcador", {
            payment_id: paymentId,
            error: error.message
        });
    }
}

async function enviarCorreoPedido({ payment, pedido }) {
    const apiKey = String(process.env.RESEND_API_KEY || "").trim();
    const from = String(process.env.EMAIL_FROM || "").trim();
    const replyTo = String(process.env.EMAIL_REPLY_TO || "").trim();
    const baseUrl = String(process.env.PUBLIC_BASE_URL || "")
        .trim()
        .replace(/\/+$/, "");

    if (!apiKey || !from || !baseUrl) {
        console.warn("Correo de pedido no configurado; se omite envío", {
            payment_id: payment?.id ?? null,
            falta_resend_api_key: !apiKey,
            falta_email_from: !from,
            falta_public_base_url: !baseUrl
        });
        return { enviado: false, omitido: true, motivo: "configuracion" };
    }

    const email = String(payment?.payer?.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
        console.warn("Pago aprobado sin correo de pagador utilizable", {
            payment_id: payment?.id ?? null
        });
        return { enviado: false, omitido: true, motivo: "sin_email" };
    }

    if (await yaSeEnvio(payment.id)) {
        console.log("Correo de descarga ya enviado", {
            payment_id: payment.id,
            email
        });
        return { enviado: false, omitido: true, motivo: "ya_enviado" };
    }

    // El enlace del correo dura 7 días. Los enlaces internos de Blob siguen
    // siendo temporales; al pulsar el botón se genera uno nuevo y protegido.
    const token = crearTokenDescarga({
        paymentId: payment.id,
        pedido,
        minutos: 7 * 24 * 60
    });

    const urlDescarga = `${baseUrl}/descarga-correo.html?token=${encodeURIComponent(token)}`;
    const diseno = nombreDiseno(pedido.diseno);
    const presentacion = nombrePresentacion(pedido.presentacion);
    const asunto = `Tu PDF de MicelaneasStore está listo · Pedido #${payment.id}`;

    const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#f6f3ee;font-family:Arial,Helvetica,sans-serif;color:#2b2b2b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f3ee;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e1d7;">
        <tr><td style="padding:28px 30px 12px;text-align:center;">
          <div style="font-size:24px;font-weight:700;">MicelaneasStore</div>
          <div style="font-size:14px;color:#6f6a63;margin-top:4px;">Lotería mexicana imprimible</div>
        </td></tr>
        <tr><td style="padding:14px 30px 4px;">
          <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px;">¡Tu pago fue confirmado!</h1>
          <p style="font-size:15px;line-height:1.6;margin:0 0 18px;">Tu archivo digital ya está disponible. Puedes abrir tus descargas desde el botón siguiente.</p>
        </td></tr>
        <tr><td align="center" style="padding:6px 30px 22px;">
          <a href="${escaparHtml(urlDescarga)}" style="display:inline-block;background:#222222;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px;">Abrir mis descargas</a>
        </td></tr>
        <tr><td style="padding:0 30px 18px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8f5;border-radius:12px;padding:8px 16px;">
            <tr><td style="padding:8px 0;color:#6f6a63;">Pedido</td><td align="right" style="padding:8px 0;font-weight:700;">#${escaparHtml(payment.id)}</td></tr>
            <tr><td style="padding:8px 0;color:#6f6a63;">Tablas</td><td align="right" style="padding:8px 0;font-weight:700;">${escaparHtml(pedido.cantidad)}</td></tr>
            <tr><td style="padding:8px 0;color:#6f6a63;">Diseño</td><td align="right" style="padding:8px 0;font-weight:700;">${escaparHtml(diseno)}</td></tr>
            <tr><td style="padding:8px 0;color:#6f6a63;">Formato</td><td align="right" style="padding:8px 0;font-weight:700;">${escaparHtml(String(pedido.formato).toUpperCase())}</td></tr>
            <tr><td style="padding:8px 0;color:#6f6a63;">Impresión</td><td align="right" style="padding:8px 0;font-weight:700;">${escaparHtml(presentacion)}</td></tr>
            <tr><td style="padding:8px 0;color:#6f6a63;">Mazo</td><td align="right" style="padding:8px 0;font-weight:700;">${pedido.agregarMazo ? "Sí" : "No"}</td></tr>
            <tr><td style="padding:8px 0;color:#6f6a63;">Total</td><td align="right" style="padding:8px 0;font-weight:700;">$${escaparHtml(pedido.total)} MXN</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 30px 30px;">
          <p style="font-size:13px;line-height:1.55;color:#6f6a63;margin:0 0 8px;"><strong>Importante:</strong> este enlace estará disponible durante 7 días. Descarga y guarda tus archivos antes de que venza.</p>
          <p style="font-size:12px;line-height:1.5;color:#8b857e;margin:0;word-break:break-all;">Si el botón no abre, copia esta liga en tu navegador:<br>${escaparHtml(urlDescarga)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const payload = {
        from,
        to: [email],
        subject: asunto,
        html
    };

    if (replyTo) payload.reply_to = replyTo;

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `pedido-aprobado/${payment.id}`
        },
        body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = { raw: text };
    }

    if (!response.ok) {
        const error = new Error(`Resend respondió ${response.status}.`);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    await marcarEnviado(payment.id, email, data?.id);

    console.log("Correo de descarga enviado", {
        payment_id: payment.id,
        email,
        resend_id: data?.id ?? null
    });

    return { enviado: true, email, resend_id: data?.id ?? null };
}

module.exports = { enviarCorreoPedido };
