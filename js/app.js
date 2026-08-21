console.log("MicelaneasStore iniciada");

/* ==================================================
   CREAR LOTERIA - SELECCIÓN DE DISEÑO
================================================== */

const designButtons = document.querySelectorAll(".select-design");
const btnContinuar = document.getElementById("btnContinuar");

let diseñoSeleccionado = null;

designButtons.forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".design-card").forEach(card => {
            card.classList.remove("selected");
        });

        const card = button.closest(".design-card");
        card.classList.add("selected");

        diseñoSeleccionado = card.dataset.design;
        sessionStorage.setItem("micelaneasstore_diseno", diseñoSeleccionado);

        if (btnContinuar) {
            btnContinuar.disabled = false;
        }
    });
});


/* ==================================================
   CREAR LOTERIA - PASO 2
================================================== */

const paso1 = document.getElementById("paso1");
const paso2 = document.getElementById("paso2");
const paso3 = document.getElementById("paso3");
const btnVolverDiseno = document.getElementById("btnVolverDiseno");
const btnVolverConfiguracion = document.getElementById("btnVolverConfiguracion");
const btnOtraMuestra = document.getElementById("btnOtraMuestra");
const btnContinuarPago = document.getElementById("btnContinuarPago");

const generatedTablePreview = document.getElementById("generatedTablePreview");
const previewTipoTabla = document.getElementById("previewTipoTabla");
const previewResumenDiseno = document.getElementById("previewResumenDiseno");
const previewResumenFormato = document.getElementById("previewResumenFormato");
const previewResumenCantidad = document.getElementById("previewResumenCantidad");
const previewResumenDistribucion = document.getElementById("previewResumenDistribucion");
const previewDesglose = document.getElementById("previewDesglose");
const previewResumenPrecio = document.getElementById("previewResumenPrecio");

const paso4 = document.getElementById("paso4");
const btnVolverVistaPrevia = document.getElementById("btnVolverVistaPrevia");
const agregarMazo = document.getElementById("agregarMazo");
const pagoCantidadTitulo = document.getElementById("pagoCantidadTitulo");
const pagoDetalleTablas = document.getElementById("pagoDetalleTablas");
const pagoPrecioTablas = document.getElementById("pagoPrecioTablas");
const pagoResumenTablas = document.getElementById("pagoResumenTablas");
const pagoResumenMazo = document.getElementById("pagoResumenMazo");
const pagoTotal = document.getElementById("pagoTotal");
const btnPagar = document.getElementById("btnPagar");

const cantidadInput = document.getElementById("cantidadTablas");
const btnMas = document.getElementById("btnMas");
const btnMenos = document.getElementById("btnMenos");

const resumenDiseno = document.getElementById("resumenDiseno");
const resumenCantidad = document.getElementById("resumenCantidad");
const resumenFormato = document.getElementById("resumenFormato");
const resumenModalidad = document.getElementById("resumenModalidad");

const tablePreview = document.getElementById("tablePreview");
const btnVistaPrevia = document.getElementById("btnVistaPrevia");

const tablasAsignadas = document.getElementById("tablasAsignadas");
const tablasTotales = document.getElementById("tablasTotales");
const tablasRestantes = document.getElementById("tablasRestantes");
const textoRestantes = document.getElementById("textoRestantes");
const estadoDistribucion = document.getElementById("estadoDistribucion");
const mensajeDistribucion = document.getElementById("mensajeDistribucion");

const distributionCards = document.querySelectorAll(".distribution-card");
const distributionInputs = document.querySelectorAll(".distribution-qty");
const btnTodoSinDobles = document.getElementById("btnTodoSinDobles");
const btnLimpiarDistribucion = document.getElementById("btnLimpiarDistribucion");

const distributionModeButtons =
    document.querySelectorAll("[data-distribution-mode]");

const automaticDistribution =
    document.getElementById("automaticDistribution");

const btnSeleccionarTodas =
    document.getElementById("btnSeleccionarTodas");

const contadorPresentaciones =
    document.getElementById("contadorPresentaciones");

let formatoSeleccionado = "4x4";
let modoDistribucion = "manual";

/* ==================================================
   PATRONES DISPONIBLES POR FORMATO
   Las posiciones se expresan como las cuenta el cliente: desde 1.
================================================== */

const patronesPorFormato = {
    "4x4": {
        "sin-dobles": {
            titulo: "Sin dobles",
            celdas: []
        },
        "seguidas-arriba": {
            titulo: "Seguidas arriba",
            celdas: [6, 7]
        },
        "seguidas-abajo": {
            titulo: "Seguidas abajo",
            celdas: [10, 11]
        },
        "diagonal-derecha": {
            titulo: "Diagonal ↘",
            celdas: [6, 11]
        },
        "diagonal-izquierda": {
            titulo: "Diagonal ↙",
            celdas: [7, 10]
        },
        "esquinas-derecha": {
            titulo: "Esquinas ↘",
            celdas: [1, 16]
        },
        "esquinas-izquierda": {
            titulo: "Esquinas ↙",
            celdas: [4, 13]
        }
    },

    "5x5": {
        "sin-dobles": {
            titulo: "Sin dobles",
            celdas: []
        },
        "seguidas-arriba": {
            titulo: "Centro vertical ↑",
            celdas: [8, 13]
        },
        "seguidas-abajo": {
            titulo: "Centro vertical ↓",
            celdas: [13, 18]
        },
        "diagonal-derecha": {
            titulo: "Diagonal ↘",
            celdas: [7, 19]
        },
        "diagonal-izquierda": {
            titulo: "Diagonal ↙",
            celdas: [9, 17]
        },
        "esquinas-derecha": {
            titulo: "Esquinas ↘",
            celdas: [1, 25]
        },
        "esquinas-izquierda": {
            titulo: "Esquinas ↙",
            celdas: [5, 21]
        }
    }
};

const coleccionesImagenes = {
    tradicional: {
        ruta: "img/preview/tradicional/",
        extension: ".png"
    },
    animada: {
        ruta: "img/preview/animada/",
        extension: ".png"
    },
    gorditos: {
        ruta: "img/preview/gorditos/",
        extension: ".png"
    }
};

function obtenerConfiguracionColeccion() {
    const clave = diseñoSeleccionado || sessionStorage.getItem("micelaneasstore_diseno");

    return {
        clave,
        ...(coleccionesImagenes[clave] || coleccionesImagenes.tradicional)
    };
}



/* PASAR AL PASO 2 */

if (btnContinuar) {
    btnContinuar.addEventListener("click", () => {
        if (!diseñoSeleccionado) return;

        paso1.style.display = "none";
        paso2.style.display = "block";
        actualizarPasoVisual(2);

        const nombresDisenos = {
            tradicional: "Lotería Tradicional",
            animada: "Lotería Animada",
            gorditos: "Gorditos"
        };

        resumenDiseno.textContent =
            nombresDisenos[diseñoSeleccionado] || diseñoSeleccionado;

        actualizarDistribucion();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}


/* VOLVER AL PASO 1 */

if (btnVolverDiseno) {
    btnVolverDiseno.addEventListener("click", () => {
        paso2.style.display = "none";
        paso1.style.display = "block";
        actualizarPasoVisual(1);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}


/* ==================================================
   CANTIDAD TOTAL
================================================== */

function obtenerTotalTablas() {
    const valor = Number(cantidadInput?.value || 1);
    return Math.min(1000, Math.max(1, Number.isFinite(valor) ? Math.floor(valor) : 1));
}

function establecerTotalTablas(valor) {
    const total = Math.min(1000, Math.max(1, Math.floor(Number(valor) || 1)));
    cantidadInput.value = total;
    resumenCantidad.textContent = total;
    tablasTotales.textContent = total;
    actualizarDistribucion();
}

if (btnMas) {
    btnMas.addEventListener("click", () => {
        establecerTotalTablas(obtenerTotalTablas() + 1);
    });
}

if (btnMenos) {
    btnMenos.addEventListener("click", () => {
        establecerTotalTablas(obtenerTotalTablas() - 1);
    });
}

if (cantidadInput) {
    cantidadInput.addEventListener("change", () => {
        establecerTotalTablas(cantidadInput.value);
    });

    cantidadInput.addEventListener("input", () => {
        const valor = Math.max(1, Math.min(1000, Number(cantidadInput.value) || 1));
        resumenCantidad.textContent = valor;
        tablasTotales.textContent = valor;
        actualizarDistribucion();
    });
}


/* ==================================================
   FORMATO 4x4 / 5x5
================================================== */

document.querySelectorAll("[data-format]").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll("[data-format]").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        formatoSeleccionado = button.dataset.format;

        resumenFormato.textContent = formatoSeleccionado.toUpperCase();
        crearVistaTabla(formatoSeleccionado);

        actualizarTarjetasPorFormato();

        /*
           Si estamos en modo automático, conservamos las presentaciones
           seleccionadas y volvemos a repartir la cantidad total usando
           las posiciones del nuevo formato.
        */
        if (modoDistribucion === "automatic") {
            const haySeleccionadas = [...distributionCards].some(card =>
                card.classList.contains("auto-selected")
            );

            if (haySeleccionadas) {
                repartirAutomaticamente();
                actualizarContadorPresentaciones();
            } else {
                limpiarDistribucion();
            }
        } else {
            limpiarDistribucion();
        }
    });
});


/* ==================================================
   GENERAR ESQUEMA 4x4 / 5x5
================================================== */

function crearVistaTabla(formato) {
    if (!tablePreview) return;

    tablePreview.innerHTML = "";

    const cantidadCasillas = formato === "5x5" ? 25 : 16;

    if (formato === "5x5") {
        tablePreview.classList.remove("preview-4x4");
        tablePreview.classList.add("preview-5x5");
    } else {
        tablePreview.classList.remove("preview-5x5");
        tablePreview.classList.add("preview-4x4");
    }

    for (let i = 0; i < cantidadCasillas; i++) {
        tablePreview.appendChild(document.createElement("span"));
    }
}


/* ==================================================
   DISTRIBUCIÓN DE TABLAS
================================================== */

function leerCantidadTarjeta(card) {
    const input = card.querySelector(".distribution-qty");
    return Math.max(0, Math.floor(Number(input?.value) || 0));
}

function guardarDistribucion() {
    const distribucion = {};

    distributionCards.forEach(card => {
        distribucion[card.dataset.position] = leerCantidadTarjeta(card);
    });

    sessionStorage.setItem(
        "micelaneasstore_distribucion",
        JSON.stringify(distribucion)
    );
}

function totalAsignado() {
    return [...distributionCards].reduce((total, card) => {
        return total + leerCantidadTarjeta(card);
    }, 0);
}

function nombreDistribucion(valor) {

    const patron = patronesPorFormato[formatoSeleccionado]?.[valor];

    if (patron) {
        return patron.titulo;
    }

    if (valor === "sin-dobles") {
        return "Sin dobles";
    }

    return valor;
}

function actualizarResumenDistribucion() {
    const activas = [...distributionCards].filter(card => leerCantidadTarjeta(card) > 0);

    if (activas.length === 0) {
        resumenModalidad.textContent = "Pendiente";
        return;
    }

    if (modoDistribucion === "automatic") {
        resumenModalidad.textContent = activas.length === 1
            ? `Automática · ${nombreDistribucion(activas[0].dataset.position)}`
            : `Automática · ${activas.length} presentaciones`;
        return;
    }

    if (activas.length === 1) {
        resumenModalidad.textContent = nombreDistribucion(activas[0].dataset.position);
    } else {
        resumenModalidad.textContent = `Mixta (${activas.length} tipos)`;
    }
}

function actualizarDistribucion() {
    const total = obtenerTotalTablas();
    const asignadas = totalAsignado();
    const restantes = total - asignadas;

    if (tablasTotales) tablasTotales.textContent = total;
    if (tablasAsignadas) tablasAsignadas.textContent = asignadas;

    const excedidas = Math.max(0, asignadas - total);
    const faltantes = Math.max(0, total - asignadas);

    if (tablasRestantes) {
        tablasRestantes.textContent = asignadas > total ? excedidas : faltantes;
    }

    if (textoRestantes) {
        textoRestantes.firstChild.textContent =
            asignadas > total ? "Excedidas: " : "Restantes: ";
    }

    if (estadoDistribucion) {
        estadoDistribucion.classList.remove("ok", "error");

        if (asignadas === total) {
            estadoDistribucion.classList.add("ok");
        } else if (asignadas > total) {
            estadoDistribucion.classList.add("error");
        }
    }

    distributionCards.forEach(card => {
        const cantidad = leerCantidadTarjeta(card);
        card.classList.toggle("has-quantity", cantidad > 0);
    });

    if (mensajeDistribucion) {
        mensajeDistribucion.classList.remove("ok", "error");

        if (asignadas === total) {
            mensajeDistribucion.textContent =
                `✓ Distribución completa: ${total} de ${total} tablas asignadas.`;
            mensajeDistribucion.classList.add("ok");
        } else if (asignadas < total) {
            mensajeDistribucion.textContent =
                `Faltan ${faltantes} tablas por asignar.`;
        } else {
            mensajeDistribucion.textContent =
                `⚠ Te excediste por ${excedidas} tablas. Reduce alguna cantidad para continuar.`;
            mensajeDistribucion.classList.add("error");
        }
    }

    if (btnVistaPrevia) {
        btnVistaPrevia.disabled = asignadas !== total;
    }

    actualizarResumenDistribucion();
    guardarDistribucion();
}


/* ==================================================
   MODO DE DISTRIBUCIÓN: PERSONALIZADA / AUTOMÁTICA
================================================== */

distributionModeButtons.forEach(button => {

    button.addEventListener("click", () => {

        distributionModeButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        modoDistribucion = button.dataset.distributionMode;

        limpiarDistribucion();

        if (modoDistribucion === "automatic") {

            if (automaticDistribution) {
                automaticDistribution.classList.remove("hidden");
            }

            distributionCards.forEach(card => {
                card.classList.add("auto-selectable");

                const counter = card.querySelector(".distribution-counter");

                if (counter) {
                    counter.style.display = "none";
                }
            });

        } else {

            if (automaticDistribution) {
                automaticDistribution.classList.add("hidden");
            }

            distributionCards.forEach(card => {
                card.classList.remove("auto-selectable", "auto-selected");

                const counter = card.querySelector(".distribution-counter");

                if (counter) {
                    counter.style.display = "";
                }
            });

            if (btnSeleccionarTodas) {
                btnSeleccionarTodas.textContent = "Seleccionar todas";
            }
        }

        actualizarContadorPresentaciones();

    });

});


/* ==================================================
   SELECCIÓN AUTOMÁTICA
================================================== */

distributionCards.forEach(card => {

    card.addEventListener("click", event => {

        if (modoDistribucion !== "automatic") {
            return;
        }

        if (event.target.closest(".distribution-counter")) {
            return;
        }

        card.classList.toggle("auto-selected");
        actualizarContadorPresentaciones();
        repartirAutomaticamente();

    });

});


function actualizarContadorPresentaciones() {
    const total = distributionCards.length;
    const seleccionadas = [...distributionCards].filter(card =>
        card.classList.contains("auto-selected")
    ).length;

    if (contadorPresentaciones) {
        contadorPresentaciones.textContent =
            `${seleccionadas} de ${total} seleccionadas`;
    }

    if (btnSeleccionarTodas) {
        btnSeleccionarTodas.textContent =
            seleccionadas === total && total > 0
                ? "Quitar selección"
                : "Seleccionar todas";
    }
}

function repartirAutomaticamente() {

    const seleccionadas =
        [...distributionCards].filter(card =>
            card.classList.contains("auto-selected")
        );

    distributionCards.forEach(card => {
        const input = card.querySelector(".distribution-qty");

        if (input) {
            input.value = 0;
        }
    });

    if (seleccionadas.length === 0) {
        actualizarDistribucion();
        return;
    }

    const total = obtenerTotalTablas();
    const cantidadBase = Math.floor(total / seleccionadas.length);

    let sobrantes = total % seleccionadas.length;

    seleccionadas.forEach(card => {

        const input = card.querySelector(".distribution-qty");

        let cantidad = cantidadBase;

        if (sobrantes > 0) {
            cantidad++;
            sobrantes--;
        }

        if (input) {
            input.value = cantidad;
        }

    });

    const ultimaSeleccionada = seleccionadas[seleccionadas.length - 1];

    if (ultimaSeleccionada) {
        mostrarPatronEnVista(ultimaSeleccionada);
    }

    actualizarDistribucion();

}


if (btnSeleccionarTodas) {

    btnSeleccionarTodas.addEventListener("click", () => {

        const todasSeleccionadas =
            [...distributionCards].every(card =>
                card.classList.contains("auto-selected")
            );

        distributionCards.forEach(card => {
            card.classList.toggle(
                "auto-selected",
                !todasSeleccionadas
            );
        });

        actualizarContadorPresentaciones();
        repartirAutomaticamente();

    });

}


/* CONTROLES + Y - DE CADA TIPO */

distributionCards.forEach(card => {
    const input = card.querySelector(".distribution-qty");
    const plus = card.querySelector(".distribution-plus");
    const minus = card.querySelector(".distribution-minus");

    card.addEventListener("click", event => {
        if (event.target.closest(".distribution-counter")) return;
        mostrarPatronEnVista(card);
    });

    if (plus) {
        plus.addEventListener("click", () => {
            const total = obtenerTotalTablas();
            const asignadas = totalAsignado();

            if (asignadas >= total) return;

            input.value = leerCantidadTarjeta(card) + 1;
            mostrarPatronEnVista(card);
            actualizarDistribucion();
        });
    }

    if (minus) {
        minus.addEventListener("click", () => {
            if (leerCantidadTarjeta(card) <= 0) return;

            input.value = leerCantidadTarjeta(card) - 1;
            mostrarPatronEnVista(card);
            actualizarDistribucion();
        });
    }

    if (input) {
        input.addEventListener("focus", () => {
            mostrarPatronEnVista(card);
        });

        input.addEventListener("input", () => {
            input.value = Math.max(0, Math.floor(Number(input.value) || 0));
            mostrarPatronEnVista(card);
            actualizarDistribucion();
        });
    }
});


/* ==================================================
   VISTA PREVIA DEL PATRÓN ELEGIDO
================================================== */

function limpiarComodines() {
    tablePreview?.querySelectorAll("span").forEach(celda => {
        celda.classList.remove("comodin");
    });
}

function mostrarPatronEnVista(card) {
    document.querySelectorAll(".distribution-card").forEach(item => {
        item.classList.remove("selected");
    });

    card.classList.add("selected");
    limpiarComodines();

    const numeros = (card.dataset.cells || "")
        .split(",")
        .map(valor => Number(valor.trim()))
        .filter(valor => Number.isInteger(valor) && valor > 0);

    const celdas = tablePreview.querySelectorAll("span");

    numeros.forEach(numero => {
        const indice = numero - 1;

        if (celdas[indice]) {
            celdas[indice].classList.add("comodin");
        }
    });
}


/* ==================================================
   ATAJOS
================================================== */

function limpiarDistribucion() {
    distributionInputs.forEach(input => {
        input.value = 0;
    });

    distributionCards.forEach(card => {
        card.classList.remove(
            "selected",
            "has-quantity",
            "auto-selected"
        );
    });

    limpiarComodines();
    actualizarContadorPresentaciones();
    actualizarDistribucion();
}

if (btnLimpiarDistribucion) {
    btnLimpiarDistribucion.addEventListener("click", limpiarDistribucion);
}

if (btnTodoSinDobles) {
    btnTodoSinDobles.addEventListener("click", () => {
        limpiarDistribucion();

        const cardSinDobles = document.querySelector('[data-position="sin-dobles"]');
        const inputSinDobles = cardSinDobles?.querySelector(".distribution-qty");

        if (!cardSinDobles || !inputSinDobles) return;

        /*
           En modo automático, "Todo sin dobles" debe dejar
           seleccionada únicamente esta presentación.
        */
        if (modoDistribucion === "automatic") {
            cardSinDobles.classList.add("auto-selected");
            actualizarContadorPresentaciones();
            repartirAutomaticamente();
            mostrarPatronEnVista(cardSinDobles);
            return;
        }

        /* Modo personalizada */
        inputSinDobles.value = obtenerTotalTablas();
        mostrarPatronEnVista(cardSinDobles);
        actualizarDistribucion();
    });
}


/* ==================================================
   ACTUALIZAR MINI CUADRÍCULAS SEGÚN FORMATO
================================================== */

function actualizarTarjetasPorFormato() {
    const patrones = patronesPorFormato[formatoSeleccionado];

    distributionCards.forEach(card => {
        const posicion = card.dataset.position;
        const patron = patrones?.[posicion];

        if (!patron) return;

        /* Actualizar posiciones reales que leerá el generador */
        card.dataset.cells = patron.celdas.join(",");

        /* Actualizar nombre */
        const titulo = card.querySelector(".double-position-title");
        if (titulo) {
            titulo.textContent = patron.titulo;
        }

        /* Reconstruir mini cuadrícula */
        const miniGrid = card.querySelector(".mini-grid");

        if (miniGrid) {
            miniGrid.innerHTML = "";

            miniGrid.classList.remove("mini-grid-4x4", "mini-grid-5x5");
            miniGrid.classList.add(
                formatoSeleccionado === "5x5"
                    ? "mini-grid-5x5"
                    : "mini-grid-4x4"
            );

            const totalCeldas = formatoSeleccionado === "5x5" ? 25 : 16;

            for (let numero = 1; numero <= totalCeldas; numero++) {
                const celda = document.createElement("span");

                if (patron.celdas.includes(numero)) {
                    celda.classList.add("active");
                }

                miniGrid.appendChild(celda);
            }
        }

        /* Ya no hay opciones bloqueadas: ambos formatos están definidos */
        card.classList.remove("format-unavailable");

        const input = card.querySelector(".distribution-qty");
        const buttons = card.querySelectorAll(".distribution-counter button");

        if (input) input.disabled = false;
        buttons.forEach(button => button.disabled = false);
    });
}


/* ==================================================
   PRECIOS
================================================== */

const rangosPrecios = [
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

function obtenerPrecioTablas(cantidad = obtenerTotalTablas()) {
    const rango = rangosPrecios.find(item => cantidad <= item.hasta);
    return rango ? rango.precio : rangosPrecios[rangosPrecios.length - 1].precio;
}

function dinero(valor) {
    return `$${Number(valor).toFixed(0)}`;
}

function actualizarPrecioVistaPrevia() {
    const precio = obtenerPrecioTablas();
    if (previewResumenPrecio) {
        previewResumenPrecio.textContent = `${dinero(precio)} MXN`;
    }
}

function actualizarResumenPago() {
    const cantidad = obtenerTotalTablas();
    const precioTablas = obtenerPrecioTablas(cantidad);
    const incluyeMazo = Boolean(agregarMazo?.checked);
    const precioMazo = incluyeMazo ? PRECIO_MAZO : 0;
    const total = precioTablas + precioMazo;

    if (pagoCantidadTitulo) pagoCantidadTitulo.textContent = `${cantidad} tablas de lotería`;
    if (pagoDetalleTablas) {
        pagoDetalleTablas.textContent = `${resumenDiseno?.textContent || "Lotería"} · ${formatoSeleccionado.toUpperCase()}`;
    }
    if (pagoPrecioTablas) pagoPrecioTablas.textContent = dinero(precioTablas);
    if (pagoResumenTablas) pagoResumenTablas.textContent = dinero(precioTablas);
    if (pagoResumenMazo) pagoResumenMazo.textContent = dinero(precioMazo);
    if (pagoTotal) pagoTotal.textContent = `${dinero(total)} MXN`;

    sessionStorage.setItem("micelaneasstore_precio_tablas", precioTablas);
    sessionStorage.setItem("micelaneasstore_agregar_mazo", incluyeMazo ? "1" : "0");
    sessionStorage.setItem("micelaneasstore_total", total);
}

if (agregarMazo) {
    agregarMazo.addEventListener("change", actualizarResumenPago);
}


/* ==================================================
   PASO 3 - VISTA PREVIA ESTRUCTURAL
================================================== */

function actualizarPasoVisual(numeroPaso) {
    document.querySelectorAll(".creator-step").forEach((step, indice) => {
        step.classList.toggle("active", indice === numeroPaso - 1);
    });
}

function obtenerDistribucionesActivas() {
    return [...distributionCards]
        .map(card => ({
            card,
            posicion: card.dataset.position,
            cantidad: leerCantidadTarjeta(card)
        }))
        .filter(item => item.cantidad > 0);
}

function elegirDistribucionParaMuestra() {
    const activas = obtenerDistribucionesActivas();

    if (activas.length === 0) return null;

    const bolsa = [];
    activas.forEach(item => {
        for (let i = 0; i < item.cantidad; i++) {
            bolsa.push(item);
        }
    });

    return bolsa[Math.floor(Math.random() * bolsa.length)] || activas[0];
}

function numerosAleatoriosUnicos(cantidad, maximo = 54) {
    const numeros = Array.from({ length: maximo }, (_, i) => i + 1);

    for (let i = numeros.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numeros[i], numeros[j]] = [numeros[j], numeros[i]];
    }

    return numeros.slice(0, cantidad);
}

function generarMuestraPaso3() {
    if (!generatedTablePreview) return;

    const tipo = elegirDistribucionParaMuestra();
    const totalCasillas = formatoSeleccionado === "5x5" ? 25 : 16;
    const patron = tipo
        ? patronesPorFormato[formatoSeleccionado]?.[tipo.posicion]
        : patronesPorFormato[formatoSeleccionado]?.["sin-dobles"];

    const posicionesDobles = patron?.celdas || [];
    const cantidadUnicas = totalCasillas - (posicionesDobles.length > 0 ? 1 : 0);
    const figuras = numerosAleatoriosUnicos(cantidadUnicas);
    const valores = [];

    let indiceFigura = 0;
    const figuraDoble = posicionesDobles.length > 0 ? figuras[0] : null;

    for (let posicion = 1; posicion <= totalCasillas; posicion++) {
        if (posicionesDobles.includes(posicion)) {
            valores.push(figuraDoble);
        } else {
            while (figuras[indiceFigura] === figuraDoble && posicionesDobles.length > 0) {
                indiceFigura++;
            }
            valores.push(figuras[indiceFigura]);
            indiceFigura++;
        }
    }

    generatedTablePreview.innerHTML = "";
    generatedTablePreview.classList.remove(
        "preview-generated-4x4",
        "preview-generated-5x5"
    );
    generatedTablePreview.classList.add(
        formatoSeleccionado === "5x5"
            ? "preview-generated-5x5"
            : "preview-generated-4x4"
    );

    const configColeccion = obtenerConfiguracionColeccion();

    valores.forEach((figura, indice) => {
        const celda = document.createElement("div");
        celda.className = "generated-card-cell";

        if (posicionesDobles.includes(indice + 1)) {
            celda.classList.add("is-double");
        }

        const imagen = document.createElement("img");
        imagen.className = "generated-card-image";
        imagen.src = `${configColeccion.ruta}${figura}${configColeccion.extension}`;
        imagen.alt = `Figura ${figura}`;
        imagen.loading = "lazy";

        imagen.addEventListener("error", () => {
            celda.classList.add("image-error");
            imagen.remove();

            const fallback = document.createElement("span");
            fallback.className = "generated-card-fallback";
            fallback.textContent = `Figura ${figura}`;
            celda.prepend(fallback);
        });

        celda.appendChild(imagen);

        generatedTablePreview.appendChild(celda);
    });

    if (previewTipoTabla) {
        previewTipoTabla.textContent = patron?.titulo || "Sin dobles";
    }
}

function actualizarResumenPaso3() {
    if (previewResumenDiseno) {
        previewResumenDiseno.textContent = resumenDiseno?.textContent || "—";
    }

    if (previewResumenFormato) {
        previewResumenFormato.textContent = formatoSeleccionado.toUpperCase();
    }

    if (previewResumenCantidad) {
        previewResumenCantidad.textContent = obtenerTotalTablas();
    }

    if (previewResumenDistribucion) {
        previewResumenDistribucion.textContent = resumenModalidad?.textContent || "—";
    }

    actualizarPrecioVistaPrevia();

    if (previewDesglose) {
        previewDesglose.innerHTML = "";

        obtenerDistribucionesActivas().forEach(item => {
            const fila = document.createElement("div");
            fila.className = "preview-breakdown-row";
            fila.innerHTML = `
                <span>${nombreDistribucion(item.posicion)}</span>
                <strong>${item.cantidad}</strong>
            `;
            previewDesglose.appendChild(fila);
        });
    }
}

if (btnVistaPrevia) {
    btnVistaPrevia.addEventListener("click", () => {
        if (totalAsignado() !== obtenerTotalTablas()) return;

        paso2.style.display = "none";
        paso3.style.display = "block";

        if (!diseñoSeleccionado) {
            diseñoSeleccionado = sessionStorage.getItem("micelaneasstore_diseno") || "tradicional";
        }

        actualizarResumenPaso3();
        generarMuestraPaso3();
        actualizarPasoVisual(3);

        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

if (btnVolverConfiguracion) {
    btnVolverConfiguracion.addEventListener("click", () => {
        paso3.style.display = "none";
        paso2.style.display = "block";
        actualizarPasoVisual(2);

        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

if (btnOtraMuestra) {
    btnOtraMuestra.addEventListener("click", generarMuestraPaso3);
}

if (btnContinuarPago) {
    btnContinuarPago.addEventListener("click", () => {
        paso3.style.display = "none";
        paso4.style.display = "block";
        actualizarResumenPago();
        actualizarPasoVisual(4);
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

if (btnVolverVistaPrevia) {
    btnVolverVistaPrevia.addEventListener("click", () => {
        paso4.style.display = "none";
        paso3.style.display = "block";
        actualizarPasoVisual(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

if (btnPagar) {
    btnPagar.addEventListener("click", async () => {
        actualizarResumenPago();

        const textoOriginal = btnPagar.textContent;
        btnPagar.disabled = true;
        btnPagar.textContent = "Preparando pago...";

        try {
            const respuesta = await fetch("/api/crear-preferencia", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cantidad: obtenerTotalTablas(),
                    formato: formatoSeleccionado,
                    diseno:
                        diseñoSeleccionado ||
                        sessionStorage.getItem("micelaneasstore_diseno") ||
                        "tradicional",
                    agregarMazo: Boolean(agregarMazo?.checked),
                    distribucion: Object.fromEntries(
                        [...distributionCards].map(card => [
                            card.dataset.position,
                            leerCantidadTarjeta(card)
                        ])
                    )
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.init_point) {
                throw new Error(datos.error || "No fue posible iniciar el pago.");
            }

            window.location.href = datos.init_point;

        } catch (error) {
            console.error(error);

            alert(
                "No fue posible abrir Mercado Pago. " +
                "Si estás probando con Live Server (127.0.0.1), esta parte debe probarse " +
                "desde Vercel o con un entorno que ejecute la carpeta /api."
            );

            btnPagar.disabled = false;
            btnPagar.textContent = textoOriginal;
        }
    });
}


/* ==================================================
   INICIALIZACIÓN
================================================== */

crearVistaTabla(formatoSeleccionado);
actualizarTarjetasPorFormato();
actualizarDistribucion();
