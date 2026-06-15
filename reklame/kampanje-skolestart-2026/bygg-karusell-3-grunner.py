# -*- coding: utf-8 -*-
"""Bygger ferdig «3 grunner»-karusell (4 slides, 1080x1350) med Pillow.
Slide 1 = godkjent cover. Slides 2-4 = merkevarestil + ekte app-skjermbilder.
Kun sanne, kodeverifiserte påstander (jf. 00-kampanjeplan §8 / kortData.ts).
"""
import os
from PIL import Image, ImageDraw, ImageFont

BASE = r"C:\Users\Oyvin\GloseMester-V0.1-Alpha\reklame\kampanje-skolestart-2026\media"
SKJERM = os.path.join(BASE, "app-skjermbilder")
OUT = os.path.join(BASE, "karusell-3-grunner")
FONT = r"C:\Users\Oyvin\AppData\Local\Temp\Nunito.ttf"
os.makedirs(OUT, exist_ok=True)

W, H = 1080, 1350
CORAL = (255, 107, 71); BLUE = (75, 174, 212); AMBER = (255, 179, 71)
NAVY = (33, 48, 78); WHITE = (255, 255, 255)

def font(size, weight="ExtraBold"):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_name(weight)
    except Exception: pass
    return f

def lerp(a, b, t): return tuple(int(a[i] + (b[i]-a[i])*t) for i in range(3))

def gradient(base):
    """Myk vertikal gradient: litt lysere topp -> base -> litt mørkere bunn."""
    top = lerp(base, WHITE, 0.18)
    bot = lerp(base, (0,0,0), 0.10)
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / (H-1)
        c = lerp(top, bot, t)
        for x in range(W): px[x, y] = c
    return img

def rounded(img, radius):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0,0,img.size[0],img.size[1]], radius, fill=255)
    out = Image.new("RGBA", img.size, (0,0,0,0))
    out.paste(img, (0,0), mask)
    return out

def wrap(draw, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=fnt) <= maxw: cur = test
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def draw_text_center(draw, cx, y, lines, fnt, fill, shadow=None, lh=1.16):
    asc, desc = fnt.getmetrics(); line_h = int((asc+desc)*lh)
    for ln in lines:
        w = draw.textlength(ln, font=fnt); x = cx - w/2
        if shadow:
            draw.text((x+3, y+3), ln, font=fnt, fill=shadow)
        draw.text((x, y), ln, font=fnt, fill=fill)
        y += line_h
    return y

def content_slide(num, base, headline, text_color, shadow, badge_fill, badge_text,
                   shot_path, fname, crop_top=0.0):
    img = gradient(base).convert("RGBA")
    d = ImageDraw.Draw(img)
    cx = W // 2

    # Nummer-badge
    r = 60; cyb = 150
    d.ellipse([cx-r, cyb-r, cx+r, cyb+r], fill=badge_fill)
    nf = font(72, "Black")
    nw = d.textlength(str(num), font=nf); asc, desc = nf.getmetrics()
    d.text((cx-nw/2, cyb-(asc+desc)/2+4), str(num), font=nf, fill=badge_text)

    # Tittel
    hf = font(58, "ExtraBold")
    lines = wrap(d, headline, hf, 900)
    y_after = draw_text_center(d, cx, 250, lines, hf, text_color, shadow)

    # Skjermbilde i hvitt avrundet kort
    shot = Image.open(shot_path).convert("RGB")
    if crop_top > 0:
        shot = shot.crop((0, int(shot.height*crop_top), shot.width, shot.height))
    card_top = int(y_after) + 50
    card_bottom = 1250
    avail_w, avail_h = 920, card_bottom - card_top
    sw, sh = shot.size
    scale = min((avail_w-60)/sw, (avail_h-60)/sh)
    nw_, nh_ = int(sw*scale), int(sh*scale)
    shot = shot.resize((nw_, nh_), Image.LANCZOS)
    card_w, card_h = nw_+60, nh_+60
    card_x = cx - card_w//2
    card_y = card_top + (avail_h - card_h)//2

    # skygge
    shadow_layer = Image.new("RGBA", img.size, (0,0,0,0))
    sd = ImageDraw.Draw(shadow_layer)
    sd.rounded_rectangle([card_x, card_y+10, card_x+card_w, card_y+card_h+10], 34,
                         fill=(0,0,0,55))
    from PIL import ImageFilter
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(18))
    img = Image.alpha_composite(img, shadow_layer)
    d = ImageDraw.Draw(img)

    card = Image.new("RGB", (card_w, card_h), WHITE)
    cd = ImageDraw.Draw(card)
    cd.rectangle([30, 30, 30+nw_, 30+nh_], outline=(225,222,216), width=1)
    card.paste(shot, (30, 30))
    img.paste(rounded(card, 34), (card_x, card_y), rounded(card, 34))
    d = ImageDraw.Draw(img)

    # Footer-ordmerke
    ff = font(34, "Bold")
    fw = d.textlength("glosemester.no", font=ff)
    foot_col = text_color
    d.text((cx-fw/2, 1288), "glosemester.no", font=ff, fill=foot_col)

    img.convert("RGB").save(os.path.join(OUT, fname), quality=95)
    print("skrev", fname, "skjermbilde", os.path.basename(shot_path), "skala", round(scale,2))

# Slide 1 — cover (resize til 1080x1350)
cover = Image.open(os.path.join(BASE, "cover_3-grunner.png")).convert("RGB")
cover = cover.resize((W, H), Image.LANCZOS)
cover.save(os.path.join(OUT, "slide-1.png"), quality=95)
print("skrev slide-1.png (cover)")

# Slide 2 — Samlekort (coral)
content_slide(1, CORAL,
    "Samlekort: 380 kort å samle, fra vanlige til legendariske",
    WHITE, (180,55,30), WHITE, CORAL,
    os.path.join(SKJERM, "SKJERM-04_galleri.png"), "slide-2.png", crop_top=0.27)

# Slide 3 — Nivåer & streak (himmelblå)
content_slide(2, BLUE,
    "Nivåer og streak: XP for hvert riktige svar, ti nivåer å klatre",
    WHITE, (35,95,120), WHITE, BLUE,
    os.path.join(SKJERM, "SKJERM-05_xp-nivaoversikt.png"), "slide-3.png")

# Slide 4 — Smart repetisjon (amber)
content_slide(3, AMBER,
    "Smart repetisjon: ordene de sliter med kommer oftere igjen",
    NAVY, (255,255,255), NAVY, WHITE,
    os.path.join(SKJERM, "SKJERM-06_ovemodus-flervalg.png"), "slide-4.png")

print("FERDIG ->", OUT)
