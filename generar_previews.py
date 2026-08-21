from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = Path(__file__).resolve().parent
IMG = BASE / "img"
DEST = IMG / "preview"

COLECCIONES = ["tradicional", "animada", "gorditos"]

# Tamaño suficiente para vista previa web, pero no para impresión.
MAX_ANCHO = 360

def cargar_fuente(tam):
    candidatas = [
        Path(r"C:\Windows\Fonts\arialbd.ttf"),
        Path(r"C:\Windows\Fonts\Arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    for ruta in candidatas:
        if ruta.exists():
            try:
                return ImageFont.truetype(str(ruta), tam)
            except Exception:
                pass
    return ImageFont.load_default()

def preparar_imagen(origen):
    img = Image.open(origen).convert("RGBA")

    if img.width > MAX_ANCHO:
        escala = MAX_ANCHO / img.width
        nuevo = (MAX_ANCHO, max(1, round(img.height * escala)))
        img = img.resize(nuevo, Image.Resampling.LANCZOS)

    return img

def agregar_marca(img):
    # Capa grande para dibujar la marca diagonal y luego componerla.
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    texto = "MicelaneasStore"
    tam_fuente = max(20, int(img.width * 0.105))
    font = cargar_fuente(tam_fuente)

    bbox = draw.textbbox((0, 0), texto, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    # Dibujar texto en una capa propia para rotarlo.
    pad = 24
    text_layer = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    td = ImageDraw.Draw(text_layer)

    # Sombra ligera para que se lea sobre cualquier color.
    td.text((pad + 2, pad + 2), texto, font=font, fill=(0, 0, 0, 85))
    td.text((pad, pad), texto, font=font, fill=(255, 255, 255, 205))

    text_layer = text_layer.rotate(32, expand=True, resample=Image.Resampling.BICUBIC)

    x = (img.width - text_layer.width) // 2
    y = (img.height - text_layer.height) // 2

    overlay.alpha_composite(text_layer, (x, y))

    # Segunda marca más tenue para dificultar recortes individuales.
    text2 = text_layer.copy()
    alpha = text2.getchannel("A").point(lambda p: int(p * 0.48))
    text2.putalpha(alpha)

    y2 = max(0, int(img.height * 0.12) - text2.height // 2)
    overlay.alpha_composite(text2, (x, y2))

    y3 = min(img.height - text2.height, int(img.height * 0.80) - text2.height // 2)
    overlay.alpha_composite(text2, (x, max(0, y3)))

    return Image.alpha_composite(img, overlay)

def procesar_coleccion(nombre):
    origen_dir = IMG / nombre
    destino_dir = DEST / nombre
    destino_dir.mkdir(parents=True, exist_ok=True)

    if not origen_dir.exists():
        print(f"[AVISO] No existe: {origen_dir}")
        return

    procesadas = 0

    for numero in range(1, 55):
        origen = origen_dir / f"{numero}.png"

        if not origen.exists():
            print(f"[FALTA] {origen}")
            continue

        img = preparar_imagen(origen)
        img = agregar_marca(img)

        salida = destino_dir / f"{numero}.png"

        # PNG optimizado para web.
        img.save(salida, "PNG", optimize=True, compress_level=9)
        procesadas += 1

    print(f"[OK] {nombre}: {procesadas} imágenes generadas.")

def main():
    DEST.mkdir(parents=True, exist_ok=True)

    print("Generando previews protegidos...")
    print(f"Carpeta base: {IMG}")

    for coleccion in COLECCIONES:
        procesar_coleccion(coleccion)

    print("")
    print("Listo.")
    print("Las imágenes protegidas quedaron en:")
    print(DEST)
    print("")
    print("Puedes volver a ejecutar este archivo cuando agregues o cambies imágenes.")

if __name__ == "__main__":
    main()
