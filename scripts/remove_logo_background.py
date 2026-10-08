from PIL import Image
from pathlib import Path

path = Path("public/logo-nfc-orange.png")
image = Image.open(path).convert("RGBA")
pixels = image.load()
for y in range(image.height):
    for x in range(image.width):
        r, g, b, a = pixels[x, y]
        # Remover fundo preto (incluindo suavização nas bordas).
        strength = max(r, g, b)
        if strength < 9:
            pixels[x, y] = (0, 0, 0, 0)
        elif strength < 38:
            alpha = round((strength - 9) / 29 * a)
            pixels[x, y] = (r, g, b, alpha)
image.save(path, optimize=True)
print(f"Logo PNG processada: {image.width}x{image.height}")
