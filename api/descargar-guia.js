const fs = require("fs");
const path = require("path");
const { verificarTokenDescarga } = require("./_lib/delivery");

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).send("Método no permitido.");
    }

    try {
        verificarTokenDescarga(String(req.query.token || ""));

        const archivo = path.join(
            process.cwd(),
            "docs",
            "PDFImprimibles.pdf"
        );

        if (!fs.existsSync(archivo)) {
            return res.status(404).send("La guía todavía no está disponible.");
        }

        const buffer = fs.readFileSync(archivo);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="MicelaneasStore-Guia-y-Patrones.pdf"'
        );
        res.setHeader("Cache-Control", "private, no-store");

        return res.status(200).send(buffer);

    } catch (error) {
        return res.status(403).send(
            error.message || "Enlace de descarga inválido."
        );
    }
};
