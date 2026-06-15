# -*- coding: utf-8 -*-
"""Legger QR-kode (glosemester.no/for-laerere) inn i det tomme feltet paa outroen.
QR i hoy-kontrast (mork navy paa hvitt) for paalitelig skanning, paa egen hvit
rundet kortflate sentrert i det detekterte feltet (x=779, y~1255)."""
import os, segno
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = r"C:\Users\Oyvin\GloseMester-V0.1-Alpha\reklame\kampanje-skolestart-2026\media"
SRC = os.path.join(BASE, "video_outro_9x16_uten-qr.png")  # ren backup som kilde (idempotent)
OUT = os.path.join(BASE, "video_outro_9x16.png")           # kanonisk outro
LOGO = r"C:\Users\Oyvin\GloseMester-V0.1-Alpha\app-v3\public\images\branding\laeremester_logo.png"
FONT = r"C:\Users\Oyvin\AppData\Local\Temp\Nunito.ttf"
URL = "https://glosemester.no/for-laerere?utm_source=qr&utm_medium=video&utm_campaign=skolestart2026"
NAVY = (33, 48, 78); CORAL = (255, 107, 71); WHITE = (255, 255, 255)

def font(size, weight="ExtraBold"):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_name(weight)
    except Exception: pass
    return f

def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0,0,size[0],size[1]], radius, fill=255)
    return m

base = Image.open(SRC).convert("RGBA")

# 0) GM-logo oppe (rundet maske fjerner ev. hvit kant rundt det glassaktige ikonet)
logo = Image.open(LOGO).convert("RGBA")
LS = 240
logo = logo.resize((LS, LS), Image.LANCZOS)
lmask = Image.new("L", (LS, LS), 0)
ImageDraw.Draw(lmask).rounded_rectangle([0, 0, LS, LS], int(LS*0.22), fill=255)
base.paste(logo, ((base.size[0]-LS)//2, 150), lmask)

# 1) QR — hoy feilkorreksjon (H) saa logo/skade taales, morke navy moduler
qr = segno.make(URL, error="h")
qr_path = os.path.join(BASE, "_qr_tmp.png")
qr.save(qr_path, scale=20, border=2, dark="#21304E", light="#ffffff")
qr_img = Image.open(qr_path).convert("RGB")
QS = 520
qr_img = qr_img.resize((QS, QS), Image.NEAREST)  # NEAREST: skarpe moduler

# 2) Hvit rundet kortflate
pad_top, pad_side, label_h = 56, 56, 96
card_w = QS + pad_side*2
card_h = pad_top + QS + label_h
card = Image.new("RGBA", (card_w, card_h), WHITE)
cd = ImageDraw.Draw(card)
card.paste(qr_img, (pad_side, pad_top))
# label "For lærere"
lf = font(50, "ExtraBold")
lbl = "For lærere"
lw = cd.textlength(lbl, font=lf)
cd.text(((card_w-lw)/2, pad_top+QS+14), lbl, font=lf, fill=CORAL)
card = card.convert("RGBA")
card_rounded = Image.new("RGBA", card.size, (0,0,0,0))
card_rounded.paste(card, (0,0), rounded_mask(card.size, 40))

# 3) Plasser sentrert i det detekterte feltet (senter x=779, y~1255)
cx, cy = 779, 1255
px, py = cx - card_w//2, cy - card_h//2

# skygge
shadow = Image.new("RGBA", base.size, (0,0,0,0))
ImageDraw.Draw(shadow).rounded_rectangle(
    [px, py+14, px+card_w, py+card_h+14], 40, fill=(0,0,0,70))
shadow = shadow.filter(ImageFilter.GaussianBlur(22))
base = Image.alpha_composite(base, shadow)
base.paste(card_rounded, (px, py), card_rounded)

# liten "Skann meg"-hint over kortet
d = ImageDraw.Draw(base)
hf = font(46, "Bold")
hint = "Skann og kom i gang"
hw = d.textlength(hint, font=hf)
d.text(((base.size[0]-hw)/2, py-86), hint, font=hf, fill=WHITE)

base.convert("RGB").save(OUT, quality=95)
os.remove(qr_path)
print("skrev", OUT)
print("QR ->", URL, " kortstr", (card_w, card_h), " plassert paa", (px, py))
