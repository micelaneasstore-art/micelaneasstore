const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const { cargarPaqueteColeccion } = require("./blob-assets");

const PATRONES = {
  "4x4": {
    "sin-dobles": [],
    "seguidas-arriba": [6, 7],
    "seguidas-abajo": [10, 11],
    "diagonal-derecha": [6, 11],
    "diagonal-izquierda": [7, 10],
    "esquinas-derecha": [1, 16],
    "esquinas-izquierda": [4, 13]
  },
  "5x5": {
    "sin-dobles": [],
    "seguidas-arriba": [8, 13],
    "seguidas-abajo": [13, 18],
    "diagonal-derecha": [7, 19],
    "diagonal-izquierda": [9, 17],
    "esquinas-derecha": [1, 25],
    "esquinas-izquierda": [5, 21]
  }
};

const NOMBRES_PATRON = {
  "sin-dobles": "Sin dobles",
  "seguidas-arriba": "Seguidas arriba",
  "seguidas-abajo": "Seguidas abajo",
  "diagonal-derecha": "Diagonal derecha",
  "diagonal-izquierda": "Diagonal izquierda",
  "esquinas-derecha": "Esquinas derecha",
  "esquinas-izquierda": "Esquinas izquierda"
};

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function crearRng(seedText) {
  return mulberry32(xmur3(seedText)());
}

function mezclar(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function expandirDistribucion(distribucion) {
  const orden = [
    "sin-dobles",
    "seguidas-arriba",
    "seguidas-abajo",
    "diagonal-derecha",
    "diagonal-izquierda",
    "esquinas-derecha",
    "esquinas-izquierda"
  ];
  const salida = [];
  for (const tipo of orden) {
    const cantidad = Number(distribucion?.[tipo] || 0);
    for (let i = 0; i < cantidad; i++) salida.push(tipo);
  }
  return salida;
}

function generarTabla({ formato, tipo, rng, firmas }) {
  const total = formato === "5x5" ? 25 : 16;
  const dobles = PATRONES[formato]?.[tipo] || [];
  const cartas = Array.from({ length: 54 }, (_, i) => i + 1);

  for (let intento = 0; intento < 5000; intento++) {
    const celdas = Array(total).fill(null);

    if (dobles.length === 2) {
      const comodin = cartas[Math.floor(rng() * cartas.length)];
      celdas[dobles[0] - 1] = comodin;
      celdas[dobles[1] - 1] = comodin;

      const disponibles = mezclar(cartas.filter(n => n !== comodin), rng);
      let p = 0;
      for (let i = 0; i < total; i++) {
        if (celdas[i] == null) celdas[i] = disponibles[p++];
      }
    } else {
      const disponibles = mezclar(cartas, rng).slice(0, total);
      for (let i = 0; i < total; i++) celdas[i] = disponibles[i];
    }

    const firma = celdas.join("-");
    if (!firmas.has(firma)) {
      firmas.add(firma);
      return { tipo, celdas };
    }
  }

  throw new Error("No fue posible generar una tabla única.");
}

function generarTablas(payload) {
  const tipos = expandirDistribucion(payload.r);
  if (tipos.length !== Number(payload.q)) {
    throw new Error("La distribución comprada no coincide con la cantidad de tablas.");
  }

  const rng = crearRng(`${payload.pid}|${payload.d}|${payload.f}|${payload.q}`);
  const firmas = new Set();
  return tipos.map(tipo => generarTabla({
    formato: payload.f,
    tipo,
    rng,
    firmas
  }));
}

async function cargarCartas(pdf, diseno) {
  const bytesPorCarta = await cargarPaqueteColeccion(diseno);
  const mapa = new Map();

  for (let n = 1; n <= 54; n++) {
    const bytes = bytesPorCarta.get(n);
    if (!bytes) throw new Error(`Falta la carta ${n} de ${diseno}.`);
    const img = await pdf.embedPng(bytes);
    mapa.set(n, img);
  }

  return mapa;
}

function dibujarContain(page, img, x, y, w, h, padding = 1.5) {
  const maxW = Math.max(1, w - padding * 2);
  const maxH = Math.max(1, h - padding * 2);
  const escala = Math.min(maxW / img.width, maxH / img.height);
  const dw = img.width * escala;
  const dh = img.height * escala;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;

  page.drawImage(img, { x: dx, y: dy, width: dw, height: dh });
}

function dibujarTablaEnPanel({ page, tabla, index, formato, cartas, font, fontBold, x0, y0, w, h }) {
  const cols = formato === "5x5" ? 5 : 4;
  const rows = cols;
  const outer = 10;
  const titleH = 24;
  const footerH = 17;
  const gridX = x0 + outer;
  const gridY = y0 + footerH + outer;
  const gridW = w - outer * 2;
  const gridH = h - titleH - footerH - outer * 2;
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  page.drawText(`Tabla ${index + 1}`, {
    x: x0 + outer,
    y: y0 + h - outer - 13,
    size: 10,
    font: fontBold,
    color: rgb(0.12, 0.12, 0.15)
  });

  const patron = NOMBRES_PATRON[tabla.tipo] || tabla.tipo;
  const anchoPatron = font.widthOfTextAtSize(patron, 7);
  page.drawText(patron, {
    x: Math.max(x0 + outer, x0 + w - outer - anchoPatron),
    y: y0 + h - outer - 12,
    size: 7,
    font,
    color: rgb(0.35, 0.35, 0.4)
  });

  tabla.celdas.forEach((numero, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gridX + col * cellW;
    const y = gridY + (rows - 1 - row) * cellH;

    page.drawRectangle({
      x,
      y,
      width: cellW,
      height: cellH,
      borderWidth: 0.5,
      borderColor: rgb(0.78, 0.8, 0.84),
      color: rgb(1, 1, 1)
    });

    dibujarContain(page, cartas.get(numero), x, y, cellW, cellH, 1.3);
  });

  page.drawText("MicelaneasStore", {
    x: x0 + outer,
    y: y0 + 7,
    size: 6.5,
    font,
    color: rgb(0.48, 0.48, 0.54)
  });
}

async function crearPdfTablas(payload) {
  const pdf = await PDFDocument.create();
  const tablas = generarTablas(payload);
  const cartas = await cargarCartas(pdf, payload.d);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Carta horizontal: dos tablas tamaño aproximado media carta (14 x 21.6 cm).
  const pageW = 792;
  const pageH = 612;
  const panelW = pageW / 2;

  for (let i = 0; i < tablas.length; i += 2) {
    const page = pdf.addPage([pageW, pageH]);

    dibujarTablaEnPanel({
      page,
      tabla: tablas[i],
      index: i,
      formato: payload.f,
      cartas,
      font,
      fontBold,
      x0: 0,
      y0: 0,
      w: panelW,
      h: pageH
    });

    if (tablas[i + 1]) {
      dibujarTablaEnPanel({
        page,
        tabla: tablas[i + 1],
        index: i + 1,
        formato: payload.f,
        cartas,
        font,
        fontBold,
        x0: panelW,
        y0: 0,
        w: panelW,
        h: pageH
      });

      page.drawLine({
        start: { x: panelW, y: 10 },
        end: { x: panelW, y: pageH - 10 },
        thickness: 0.45,
        color: rgb(0.72, 0.72, 0.76)
      });
    }
  }

  pdf.setTitle(`MicelaneasStore - ${payload.q} tablas ${payload.f}`);
  pdf.setAuthor("MicelaneasStore");
  pdf.setProducer("MicelaneasStore");

  return Buffer.from(await pdf.save({ useObjectStreams: true }));
}

async function crearPdfMazo(payload) {
  const pdf = await PDFDocument.create();
  const cartas = await cargarCartas(pdf, payload.d);

  const pageW = 612;
  const pageH = 792;
  const cols = 3;
  const rows = 3;
  const marginX = 24;
  const marginY = 18;
  const gap = 6;
  const cellW = (pageW - marginX * 2 - gap * (cols - 1)) / cols;
  const cellH = (pageH - marginY * 2 - gap * (rows - 1)) / rows;

  for (let start = 1; start <= 54; start += 9) {
    const page = pdf.addPage([pageW, pageH]);

    for (let k = 0; k < 9 && start + k <= 54; k++) {
      const numero = start + k;
      const col = k % cols;
      const row = Math.floor(k / cols);
      const x = marginX + col * (cellW + gap);
      const y = pageH - marginY - (row + 1) * cellH - row * gap;

      page.drawRectangle({
        x,
        y,
        width: cellW,
        height: cellH,
        borderWidth: 0.6,
        borderColor: rgb(0.78, 0.8, 0.84),
        color: rgb(1, 1, 1)
      });

      dibujarContain(page, cartas.get(numero), x, y, cellW, cellH, 3);
    }
  }

  pdf.setTitle(`MicelaneasStore - Mazo ${payload.d}`);
  pdf.setAuthor("MicelaneasStore");
  pdf.setProducer("MicelaneasStore");

  return Buffer.from(await pdf.save({ useObjectStreams: true }));
}

function nombreSeguro(texto) {
  return String(texto).replace(/[^a-z0-9._/-]+/gi, "-");
}

module.exports = {
  crearPdfTablas,
  crearPdfMazo,
  nombreSeguro
};
