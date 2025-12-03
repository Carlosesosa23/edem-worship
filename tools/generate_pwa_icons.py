from PIL import Image, ImageOps
import os

SRC = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'img', 'logo_source.png')
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'img')
SIZES = [192, 512]

if not os.path.exists(SRC):
    print('Source logo not found:', SRC)
    raise SystemExit(1)

img = Image.open(SRC).convert('RGBA')
for s in SIZES:
    out = Image.new('RGBA', (s, s), (255,255,255,0))
    resized = ImageOps.contain(img, (s, s))
    pos = ((s - resized.width)//2, (s - resized.height)//2)
    out.paste(resized, pos, resized)
    out_path = os.path.join(OUT_DIR, f'icon-{s}.png')
    out.save(out_path)
    print('Wrote', out_path)
print('Done')
