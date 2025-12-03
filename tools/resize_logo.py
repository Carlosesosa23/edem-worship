from PIL import Image, ImageOps
import os
import sys

# Resize and optionally convert background to transparent (naive threshold)
# Usage: python tools/resize_logo.py [source_path]

TARGET_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static', 'img')
TARGET = os.path.join(TARGET_DIR, 'logo.png')
SIZE = (120, 120)

candidates = []
if len(sys.argv) > 1:
    candidates.append(sys.argv[1])
else:
    # look for common filenames
    for name in ('logo_source.png','logo_source.jpg','logo_source.jpeg','logo.png','logo.jpg','logo.jpeg'):
        path = os.path.join(TARGET_DIR, name)
        if os.path.exists(path):
            candidates.append(path)

if not candidates:
    print('No source logo found. Put your file as one of:\n  ' + '\n  '.join([
        os.path.join(TARGET_DIR, 'logo_source.png'),
        os.path.join(TARGET_DIR, 'logo_source.jpg')
    ]))
    sys.exit(1)

src = candidates[0]
print('Using source:', src)

img = Image.open(src).convert('RGBA')
# Fit into SIZE preserving aspect ratio and add padding
img = ImageOps.contain(img, SIZE)
# Create transparent background and paste centered
background = Image.new('RGBA', SIZE, (255,255,255,0))
pos = ((SIZE[0]-img.width)//2, (SIZE[1]-img.height)//2)
background.paste(img, pos, img)

# Optional: try to make pure black background transparent (simple threshold)
# If the image has large black background behind white logo, this helps a bit.
# We'll only attempt if the image appears to have a dark background.

# compute average brightness
px = background.getdata()
avg = sum((r+g+b)/3 for (r,g,b,a) in px)/len(px)
if avg < 40:
    # naive: make near-black pixels transparent
    newdata = []
    for (r,g,b,a) in px:
        if r < 40 and g < 40 and b < 40:
            newdata.append((r,g,b,0))
        else:
            newdata.append((r,g,b,a))
    background.putdata(newdata)

os.makedirs(TARGET_DIR, exist_ok=True)
background.save(TARGET)
print('Saved resized logo to', TARGET)
