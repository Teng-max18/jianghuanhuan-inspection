"""仅在修改图标时需要运行；依赖 Pillow，运行应用不需要 Python。"""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / "icons"
scale = 4
image = Image.new("RGB", (512 * scale, 512 * scale), "#b83226")
draw = ImageDraw.Draw(image)


def coords(box):
    return tuple(round(value * scale) for value in box)


draw.rounded_rectangle(coords((68, 68, 444, 444)), radius=48 * scale, outline="#efc7a1", width=7 * scale)
lines = [
    [(116, 175), (186, 175)], [(119, 238), (183, 238)],
    [(174, 278), (126, 376)], [(219, 180), (378, 180)],
    [(299, 181), (299, 349)], [(210, 350), (391, 350)],
]
for line in lines:
    draw.line([(x * scale, y * scale) for x, y in line], fill="#fff1db", width=24 * scale)
    for x, y in line:
        draw.ellipse(coords((x - 12, y - 12, x + 12, y + 12)), fill="#fff1db")
draw.ellipse(coords((371, 102, 405, 136)), fill="#efc7a1")
for size, name in [(192, "icon-192.png"), (512, "icon-512.png"), (512, "icon-maskable-512.png"), (180, "apple-touch-icon.png")]:
    image.resize((size, size), Image.Resampling.LANCZOS).save(root / name)
