const crypto = require("crypto");

function secret() {
    const value = process.env.ORDER_SIGNING_SECRET;
    if (!value || value.length < 24) {
        throw new Error("ORDER_SIGNING_SECRET no está configurado.");
    }
    return value;
}

function crearTokenDescarga({ paymentId, pedido, minutos = 15 }) {
    const payload = {
        pid: String(paymentId),
        exp: Date.now() + minutos * 60 * 1000,
        q: pedido.cantidad,
        f: pedido.formato,
        p: pedido.presentacion,
        d: pedido.diseno,
        m: pedido.agregarMazo ? 1 : 0,
        r: pedido.distribucion
    };

    const encoded = Buffer
        .from(JSON.stringify(payload), "utf8")
        .toString("base64url");

    const firma = crypto
        .createHmac("sha256", secret())
        .update(encoded)
        .digest("base64url")
        .slice(0, 40);

    return `${encoded}.${firma}`;
}

function verificarTokenDescarga(token) {
    if (!token || typeof token !== "string" || !token.includes(".")) {
        throw new Error("Token de descarga inválido.");
    }

    const [encoded, firma] = token.split(".");

    const esperada = crypto
        .createHmac("sha256", secret())
        .update(encoded)
        .digest("base64url")
        .slice(0, 40);

    const a = Buffer.from(firma);
    const b = Buffer.from(esperada);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new Error("Token de descarga alterado.");
    }

    const payload = JSON.parse(
        Buffer.from(encoded, "base64url").toString("utf8")
    );

    if (!payload.exp || Date.now() > payload.exp) {
        throw new Error("El enlace de descarga expiró.");
    }

    return payload;
}

module.exports = {
    crearTokenDescarga,
    verificarTokenDescarga
};
