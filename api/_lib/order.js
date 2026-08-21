const crypto = require("crypto");

const RANGOS = [
    { hasta: 10, precio: 15 },
    { hasta: 20, precio: 20 },
    { hasta: 30, precio: 25 },
    { hasta: 40, precio: 30 },
    { hasta: 50, precio: 35 },
    { hasta: 60, precio: 40 },
    { hasta: 80, precio: 45 },
    { hasta: 100, precio: 50 },
    { hasta: 200, precio: 65 },
    { hasta: 300, precio: 80 },
    { hasta: 400, precio: 90 },
    { hasta: 500, precio: 100 },
    { hasta: 1000, precio: 180 }
];

const PRECIO_MAZO = 10;
const DISENOS = new Set(["tradicional", "animada", "gorditos"]);
const FORMATOS = new Set(["4x4", "5x5"]);

function precioTablas(cantidad) {
    const q = Math.max(1, Math.min(1000, Math.floor(Number(cantidad) || 1)));
    const rango = RANGOS.find(r => q <= r.hasta);
    return rango ? rango.precio : 180;
}

function normalizarPedido(input = {}) {
    const cantidad = Math.max(
        1,
        Math.min(1000, Math.floor(Number(input.cantidad) || 1))
    );

    const formato = FORMATOS.has(input.formato) ? input.formato : "4x4";
    const diseno = DISENOS.has(input.diseno) ? input.diseno : "tradicional";
    const agregarMazo = Boolean(input.agregarMazo);

    const subtotal = precioTablas(cantidad);
    const mazo = agregarMazo ? PRECIO_MAZO : 0;
    const total = subtotal + mazo;

    return {
        cantidad,
        formato,
        diseno,
        agregarMazo,
        subtotal,
        mazo,
        total
    };
}

function secret() {
    const value = process.env.ORDER_SIGNING_SECRET;
    if (!value || value.length < 24) {
        throw new Error(
            "Falta ORDER_SIGNING_SECRET o es demasiado corto. Usa al menos 24 caracteres."
        );
    }
    return value;
}

function firmarPedido(pedido) {
    const payload = {
        q: pedido.cantidad,
        f: pedido.formato,
        d: pedido.diseno,
        m: pedido.agregarMazo ? 1 : 0,
        t: Date.now(),
        n: crypto.randomBytes(6).toString("base64url")
    };

    const encoded = Buffer
        .from(JSON.stringify(payload), "utf8")
        .toString("base64url");

    const firma = crypto
        .createHmac("sha256", secret())
        .update(encoded)
        .digest("base64url")
        .slice(0, 32);

    return `${encoded}.${firma}`;
}

function verificarReferencia(reference) {
    if (!reference || typeof reference !== "string" || !reference.includes(".")) {
        throw new Error("Referencia inválida.");
    }

    const [encoded, firma] = reference.split(".");

    const esperada = crypto
        .createHmac("sha256", secret())
        .update(encoded)
        .digest("base64url")
        .slice(0, 32);

    const a = Buffer.from(firma);
    const b = Buffer.from(esperada);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new Error("Firma de referencia inválida.");
    }

    const payload = JSON.parse(
        Buffer.from(encoded, "base64url").toString("utf8")
    );

    return normalizarPedido({
        cantidad: payload.q,
        formato: payload.f,
        diseno: payload.d,
        agregarMazo: payload.m === 1
    });
}

module.exports = {
    PRECIO_MAZO,
    precioTablas,
    normalizarPedido,
    firmarPedido,
    verificarReferencia
};
