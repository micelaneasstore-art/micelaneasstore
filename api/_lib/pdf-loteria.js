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

function generarSecuenciaComodines(cantidad, rng) {
  const cartas = Array.from({ length: 54 }, (_, i) => i + 1);
  const salida = [];
  let ultimo = null;

  while (salida.length < cantidad) {
    let ciclo = mezclar(cartas, rng);

    // Evita que el primer comodín de un ciclo sea igual al último
    // del ciclo anterior. Dentro de cada ciclo las 54 figuras son únicas.
    if (ultimo != null && ciclo[0] === ultimo && ciclo.length > 1) {
      [ciclo[0], ciclo[1]] = [ciclo[1], ciclo[0]];
    }

    const faltan = cantidad - salida.length;
    const tramo = ciclo.slice(0, Math.min(54, faltan));
    salida.push(...tramo);
    ultimo = tramo[tramo.length - 1];
  }

  return salida;
}

// Para las tablas SIN dobles usamos una posición de control (comodín virtual):
// 4x4 -> posición 1
// 5x5 -> posición 13 (centro)
// Si el pedido tiene menos de 54 tablas, las figuras de esa posición se eligen
// al azar sin repetirse. Si el pedido tiene 54 o más, se usan consecutivamente
// 1..54 y se reinicia el ciclo.
function generarSecuenciaSinDobles(cantidadSinDobles, totalPedido, rng) {
  if (cantidadSinDobles <= 0) return [];

  const cartas = Array.from({ length: 54 }, (_, i) => i + 1);

  if (Number(totalPedido) < 54) {
    // Como cantidadSinDobles <= totalPedido < 54, basta un solo ciclo mezclado
    // para garantizar que no se repita ninguna figura controlada.
    return mezclar(cartas, rng).slice(0, cantidadSinDobles);
  }

  // En pedidos de 54 o más tablas, la distribución es totalmente equilibrada
  // y consecutiva: 1,2,...,54,1,2,...
  return Array.from({ length: cantidadSinDobles }, (_, i) => (i % 54) + 1);
}

function generarTabla({ formato, tipo, rng, firmas, comodinForzado = null, virtualForzado = null }) {
  const total = formato === "5x5" ? 25 : 16;
  const dobles = PATRONES[formato]?.[tipo] || [];
  const cartas = Array.from({ length: 54 }, (_, i) => i + 1);

  for (let intento = 0; intento < 5000; intento++) {
    const celdas = Array(total).fill(null);

    if (dobles.length === 2) {
      // Conservamos una lectura del RNG de tablas para mantener estable
      // la secuencia pseudoaleatoria del resto de la generación.
      const aleatorioOriginal = rng();
      const comodin = comodinForzado ?? cartas[Math.floor(aleatorioOriginal * cartas.length)];

      celdas[dobles[0] - 1] = comodin;
      celdas[dobles[1] - 1] = comodin;

      const disponibles = mezclar(cartas.filter(n => n !== comodin), rng);
      let p = 0;
      for (let i = 0; i < total; i++) {
        if (celdas[i] == null) celdas[i] = disponibles[p++];
      }
    } else {
      // Sin dobles: fijamos una sola posición para equilibrar la distribución
      // entre tablas, sin repetir la figura dentro de la misma tabla.
      if (virtualForzado != null) {
        const posicionControl = formato === "5x5" ? 13 : 1;
        celdas[posicionControl - 1] = virtualForzado;

        const disponibles = mezclar(cartas.filter(n => n !== virtualForzado), rng);
        let p = 0;
        for (let i = 0; i < total; i++) {
          if (celdas[i] == null) celdas[i] = disponibles[p++];
        }
      } else {
        const disponibles = mezclar(cartas, rng).slice(0, total);
        for (let i = 0; i < total; i++) celdas[i] = disponibles[i];
      }
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

  const seedBase = `${payload.pid}|${payload.d}|${payload.f}|${payload.q}`;
  const rng = crearRng(seedBase);
  const rngComodines = crearRng(`${seedBase}|comodines-v2`);
  const rngSinDobles = crearRng(`${seedBase}|sin-dobles-v1`);
  const firmas = new Set();

  const cantidadConDobles = tipos.filter(tipo =>
    (PATRONES[payload.f]?.[tipo] || []).length === 2
  ).length;
  const cantidadSinDobles = tipos.length - cantidadConDobles;

  const comodines = generarSecuenciaComodines(cantidadConDobles, rngComodines);
  const virtualesSinDobles = generarSecuenciaSinDobles(
    cantidadSinDobles,
    Number(payload.q),
    rngSinDobles
  );

  let indiceComodin = 0;
  let indiceSinDobles = 0;

  return tipos.map(tipo => {
    const tieneDobles = (PATRONES[payload.f]?.[tipo] || []).length === 2;
    const comodinForzado = tieneDobles ? comodines[indiceComodin++] : null;
    const virtualForzado = !tieneDobles ? virtualesSinDobles[indiceSinDobles++] : null;

    return generarTabla({
      formato: payload.f,
      tipo,
      rng,
      firmas,
      comodinForzado,
      virtualForzado
    });
  });
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

  // Márgenes compactos para aprovechar mejor el papel impreso.
  const outer = 5;
  const titleH = 17;
  const footerH = 9;

  const maxGridW = w - outer * 2;
  const maxGridH = h - titleH - footerH - outer * 2;

  // Las cartas originales son verticales. En presentaciones compactas
  // (4/Carta y 8/Tabloide) el panel es proporcionalmente más ancho que
  // una carta. Si se divide todo el ancho en celdas, pdf-lib centra cada
  // imagen dentro de una celda demasiado ancha y aparecen franjas blancas
  // ENTRE las figuras. Para evitarlo hacemos que la cuadrícula completa
  // conserve la proporción real de las imágenes y centramos la cuadrícula.
  // Así las cartas quedan prácticamente pegadas entre sí, sin deformarlas.
  const imagenRef = cartas.get(1);
  const proporcionCarta = imagenRef && imagenRef.height
    ? imagenRef.width / imagenRef.height
    : 2 / 3;
  const proporcionGrid = proporcionCarta * (cols / rows);

  let gridW = maxGridW;
  let gridH = gridW / proporcionGrid;
  if (gridH > maxGridH) {
    gridH = maxGridH;
    gridW = gridH * proporcionGrid;
  }

  const gridX = x0 + (w - gridW) / 2;
  const gridY = y0 + footerH + outer;
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  page.drawText(`Tabla ${index + 1}`, {
    x: x0 + outer,
    y: y0 + h - outer - 10.5,
    size: 9,
    font: fontBold,
    color: rgb(0.12, 0.12, 0.15)
  });

  const patron = NOMBRES_PATRON[tabla.tipo] || tabla.tipo;
  const anchoPatron = font.widthOfTextAtSize(patron, 6.5);
  page.drawText(patron, {
    x: Math.max(x0 + outer, x0 + w - outer - anchoPatron),
    y: y0 + h - outer - 10,
    size: 6.5,
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
      borderWidth: 0.35,
      borderColor: rgb(0.78, 0.8, 0.84),
      color: rgb(1, 1, 1)
    });

    // Padding mínimo: sólo evita que el borde toque físicamente la imagen.
    // La proporción de la celda ya coincide con la carta, por lo que no se
    // generan huecos visibles entre figuras.
    dibujarContain(page, cartas.get(numero), x, y, cellW, cellH, 0.25);
  });

  page.drawText("MicelaneasStore", {
    x: x0 + outer,
    y: y0 + 3.5,
    size: 5.5,
    font,
    color: rgb(0.48, 0.48, 0.54)
  });
}

const PRESENTACIONES_PDF = {
  "carta-2-horizontal": { pageW: 792, pageH: 612, cols: 2, rows: 1 },
  "carta-4-vertical": { pageW: 612, pageH: 792, cols: 2, rows: 2 },
  "tabloide-4-vertical": { pageW: 792, pageH: 1224, cols: 2, rows: 2 },
  "tabloide-8-horizontal": { pageW: 1224, pageH: 792, cols: 4, rows: 2 }
};

async function crearPdfTablas(payload) {
  const pdf = await PDFDocument.create();
  const tablas = generarTablas(payload);
  const cartas = await cargarCartas(pdf, payload.d);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // La presentación sólo cambia el acomodo físico del PDF.
  // No forma parte de la semilla de generarTablas(), por lo que la distribución
  // de figuras/comodines permanece exactamente igual para el mismo pedido.
  const presentacion = payload.p || payload.presentacion || "carta-2-horizontal";
  const config = PRESENTACIONES_PDF[presentacion] || PRESENTACIONES_PDF["carta-2-horizontal"];
  const { pageW, pageH, cols, rows } = config;
  const porHoja = cols * rows;
  const panelW = pageW / cols;
  const panelH = pageH / rows;

  for (let inicio = 0; inicio < tablas.length; inicio += porHoja) {
    const page = pdf.addPage([pageW, pageH]);

    for (let k = 0; k < porHoja; k++) {
      const indice = inicio + k;
      if (!tablas[indice]) break;

      const col = k % cols;
      const row = Math.floor(k / cols);
      const x0 = col * panelW;
      const y0 = pageH - (row + 1) * panelH;

      dibujarTablaEnPanel({
        page,
        tabla: tablas[indice],
        index: indice,
        formato: payload.f,
        cartas,
        font,
        fontBold,
        x0,
        y0,
        w: panelW,
        h: panelH
      });
    }

    // Líneas guía entre paneles para facilitar el corte.
    for (let c = 1; c < cols; c++) {
      const x = c * panelW;
      page.drawLine({
        start: { x, y: 10 },
        end: { x, y: pageH - 10 },
        thickness: 0.45,
        color: rgb(0.72, 0.72, 0.76)
      });
    }

    for (let r = 1; r < rows; r++) {
      const y = pageH - r * panelH;
      page.drawLine({
        start: { x: 10, y },
        end: { x: pageW - 10, y },
        thickness: 0.45,
        color: rgb(0.72, 0.72, 0.76)
      });
    }
  }

  pdf.setTitle(`MicelaneasStore - ${payload.q} tablas ${payload.f} - ${presentacion}`);
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
