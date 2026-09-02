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
const DISENOS = new Set([
    "tradicional", "animada", "gorditos", "fiesta-mexicana",
    "dia-muertos", "san-valentin", "infantil", "vaquera",
    "dia-madres", "maestro", "navidad"
]);
const FORMATOS = new Set(["4x4", "5x5"]);
const PRESENTACIONES = new Set([
    "carta-2-horizontal",
    "carta-4-vertical",
    "tabloide-4-vertical",
    "tabloide-8-horizontal"
]);

const DISTRIBUCIONES = [
    "sin-dobles",
    "seguidas-arriba",
    "seguidas-abajo",
    "diagonal-derecha",
    "diagonal-izquierda",
    "esquinas-derecha",
    "esquinas-izquierda"
];

const DISENO_CODE = {
    tradicional: "t",
    animada: "a",
    gorditos: "g",
    "fiesta-mexicana": "x",
    "dia-muertos": "u",
    "san-valentin": "s",
    infantil: "i",
    vaquera: "v",
    "dia-madres": "r",
    maestro: "m",
    navidad: "n"
};

const CODE_DISENO = {
    t: "tradicional",
    a: "animada",
    g: "gorditos",
    x: "fiesta-mexicana",
    u: "dia-muertos",
    s: "san-valentin",
    i: "infantil",
    v: "vaquera",
    r: "dia-madres",
    m: "maestro",
    n: "navidad"
};

const FORMATO_CODE = {
    "4x4": "4",
    "5x5": "5"
};

const CODE_FORMATO = {
    "4": "4x4",
    "5": "5x5"
};

const PRESENTACION_CODE = {
    "carta-2-horizontal": "a",
    "carta-4-vertical": "b",
    "tabloide-4-vertical": "c",
    "tabloide-8-horizontal": "d"
};

const CODE_PRESENTACION = {
    a: "carta-2-horizontal",
    b: "carta-4-vertical",
    c: "tabloide-4-vertical",
    d: "tabloide-8-horizontal"
};

function normalizarDistribucion(valor, cantidad) {
    const entrada = valor && typeof valor === "object" ? valor : {};
    const salida = {};

    let suma = 0;

    DISTRIBUCIONES.forEach(clave => {
        const n = Math.max(0, Math.floor(Number(entrada[clave]) || 0));
        salida[clave] = n;
        suma += n;
    });

    if (suma !== cantidad) {
        throw new Error(
            `La distribución (${suma}) no coincide con la cantidad de tablas (${cantidad}).`
        );
    }

    return salida;
}

function codificarDistribucion(distribucion) {
    return DISTRIBUCIONES
        .map(clave => Number(distribucion?.[clave] || 0).toString(36))
        .join(".");
}

function decodificarDistribucion(valor) {
    const partes = String(valor || "").split(".");

    if (partes.length !== DISTRIBUCIONES.length) {
        throw new Error("Distribución compacta inválida.");
    }

    const salida = {};

    DISTRIBUCIONES.forEach((clave, indice) => {
        const n = parseInt(partes[indice], 36);

        if (!Number.isFinite(n) || n < 0) {
            throw new Error("Distribución compacta inválida.");
        }

        salida[clave] = n;
    });

    return salida;
}

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
    const presentacion = PRESENTACIONES.has(input.presentacion)
        ? input.presentacion
        : "carta-2-horizontal";
    const diseno = DISENOS.has(input.diseno) ? input.diseno : "tradicional";
    const agregarMazo = Boolean(input.agregarMazo);
    const distribucion = normalizarDistribucion(input.distribucion, cantidad);

    const subtotal = precioTablas(cantidad);
    const mazo = agregarMazo ? PRECIO_MAZO : 0;
    const total = subtotal + mazo;

    return {
        cantidad,
        formato,
        presentacion,
        diseno,
        agregarMazo,
        distribucion,
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

/*
  Referencia compacta:
  v1|q|f|d|m|r|t|n|firma

  q = cantidad en base36
  f = 4 o 5
  d = t/a/g
  m = 0/1
  r = 7 cantidades en base36 separadas por punto
  t = timestamp en base36
  n = nonce corto

  Esto conserva toda la información firmada sin meter un JSON/base64 largo.
*/
function firmarPedido(pedido) {
    // v2 agrega la presentación de impresión sin cambiar la lógica de tablas.
    const payload = [
        "v2",
        Number(pedido.cantidad).toString(36),
        FORMATO_CODE[pedido.formato],
        DISENO_CODE[pedido.diseno],
        pedido.agregarMazo ? "1" : "0",
        PRESENTACION_CODE[pedido.presentacion],
        codificarDistribucion(pedido.distribucion),
        Date.now().toString(36),
        crypto.randomBytes(4).toString("base64url")
    ].join("|");

    const firma = crypto
        .createHmac("sha256", secret())
        .update(payload)
        .digest("base64url")
        .slice(0, 24);

    return `${payload}|${firma}`;
}

function verificarReferenciaCompacta(reference) {
    const partes = String(reference || "").split("|");
    const version = partes[0];

    if (version !== "v1" && version !== "v2") {
        throw new Error("Formato de referencia compacta inválido.");
    }

    const esperadas = version === "v2" ? 10 : 9;
    if (partes.length !== esperadas) {
        throw new Error("Formato de referencia compacta inválido.");
    }

    let cantidadCode, formatoCode, disenoCode, mazoCode, presentacionCode;
    let distribucionCode, firma, payload;

    if (version === "v2") {
        [, cantidadCode, formatoCode, disenoCode, mazoCode, presentacionCode, distribucionCode] = partes;
        firma = partes[9];
        payload = partes.slice(0, 9).join("|");
    } else {
        [, cantidadCode, formatoCode, disenoCode, mazoCode, distribucionCode] = partes;
        firma = partes[8];
        payload = partes.slice(0, 8).join("|");
        presentacionCode = "a";
    }

    const esperada = crypto
        .createHmac("sha256", secret())
        .update(payload)
        .digest("base64url")
        .slice(0, 24);

    const a = Buffer.from(firma);
    const b = Buffer.from(esperada);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new Error("Firma de referencia inválida.");
    }

    const cantidad = parseInt(cantidadCode, 36);
    const formato = CODE_FORMATO[formatoCode];
    const diseno = CODE_DISENO[disenoCode];
    const presentacion = CODE_PRESENTACION[presentacionCode] || "carta-2-horizontal";
    const distribucion = decodificarDistribucion(distribucionCode);

    if (!Number.isFinite(cantidad) || cantidad < 1) {
        throw new Error("Cantidad inválida en referencia.");
    }

    return normalizarPedido({
        cantidad,
        formato,
        presentacion,
        diseno,
        agregarMazo: mazoCode === "1",
        distribucion
    });
}

/*
  Compatibilidad con pagos creados antes de V3.
  Así no rompemos las referencias antiguas firmadas con base64url.
*/
function verificarReferenciaLegacy(reference) {
    if (!reference || typeof reference !== "string" || !reference.includes(".")) {
        throw new Error("Referencia legacy inválida.");
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
        throw new Error("Firma de referencia legacy inválida.");
    }

    const payload = JSON.parse(
        Buffer.from(encoded, "base64url").toString("utf8")
    );

    return normalizarPedido({
        cantidad: payload.q,
        formato: payload.f,
        presentacion: payload.p || "carta-2-horizontal",
        diseno: payload.d,
        agregarMazo: payload.m === 1,
        distribucion: payload.r
    });
}

function verificarReferencia(reference) {
    if (/^v[12]\|/.test(String(reference || ""))) {
        return verificarReferenciaCompacta(reference);
    }

    return verificarReferenciaLegacy(reference);
}

module.exports = {
    PRECIO_MAZO,
    precioTablas,
    normalizarPedido,
    normalizarDistribucion,
    firmarPedido,
    verificarReferencia
};
