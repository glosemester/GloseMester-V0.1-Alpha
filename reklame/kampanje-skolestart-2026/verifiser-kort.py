# -*- coding: utf-8 -*-
"""Kortverifisering: krysssjekker kortData.ts mot faktiske bildefiler.
Bekrefter totalantall, sjeldenhetsfordeling, og at hvert kort har et bilde
(og at ingen bildefiler er foreldreløse). Kjør fra repo-rot."""
import os, re

ROOT = r"C:\Users\Oyvin\GloseMester-V0.1-Alpha\app-v3"
TS = os.path.join(ROOT, "src", "features", "kort", "kortData.ts")
IMG = os.path.join(ROOT, "public", "images")

src = open(TS, encoding="utf-8").read()

# rarity-formel (speiler getRarity i TS): num 1-38
def rarity(num):
    if num >= 36: return "legendary"
    if num >= 31: return "epic"
    if num >= 21: return "rare"
    return "common"

# 1) PAKKER: mappe, rader-navn, aktiv
pakker = re.findall(
    r"\{\s*prefix:\s*'[^']+',\s*mappe:\s*'(\w+)',\s*navn:\s*'([^']+)',\s*aktiv:\s*(true|false),\s*rader:\s*(\w+)\s*\}",
    src)

# 2) hver Rad[]-blokk -> liste av .png-filnavn
blocks = dict(re.findall(r"const (\w+):\s*Rad\[\]\s*=\s*\[(.*?)\];", src, re.DOTALL))

def filer(raderavn):
    return re.findall(r"'(\d{3}-[^']+\.png)'", blocks.get(raderavn, ""))

total = 0
rar_tot = {"common":0,"rare":0,"epic":0,"legendary":0}
mangler, orphans = [], []
print(f"{'Pakke':<22}{'mappe':<14}{'aktiv':<7}{'kort':<6}{'bilder':<7}{'OK?'}")
print("-"*64)
for mappe, navn, aktiv, raderavn in pakker:
    rows = filer(raderavn)
    n = len(rows)
    folder = os.path.join(IMG, mappe)
    diskfiler = set(f for f in os.listdir(folder)) if os.path.isdir(folder) else set()
    forventet_webp = set(f.replace(".png",".webp") for f in rows)
    # manglende: definert men ingen .webp på disk
    for f in rows:
        webp = f.replace(".png",".webp")
        if webp not in diskfiler:
            mangler.append(f"{mappe}/{webp}")
    # foreldreløse: .webp på disk som ingen kort peker til
    for f in diskfiler:
        if f.endswith(".webp") and f not in forventet_webp:
            orphans.append(f"{mappe}/{f}")
    webp_paa_disk = len([f for f in diskfiler if f.endswith(".webp")])
    ok = "JA" if (n==38 and webp_paa_disk==38 and aktiv=="true") else "!!"
    print(f"{navn:<22}{mappe:<14}{aktiv:<7}{n:<6}{webp_paa_disk:<7}{ok}")
    if aktiv=="true":
        total += n
        for i,_ in enumerate(rows, 1):
            rar_tot[rarity(i)] += 1

print("-"*64)
print(f"Aktive pakker: {sum(1 for p in pakker if p[2]=='true')} / {len(pakker)}")
print(f"TOTALT AKTIVE KORT: {total}")
print(f"Sjeldenhet: vanlige={rar_tot['common']}  sjeldne={rar_tot['rare']}  "
      f"episke={rar_tot['epic']}  legendariske={rar_tot['legendary']}")
print(f"Manglende bilder (definert kort uten .webp): {len(mangler)}")
for m in mangler: print("   MANGLER", m)
print(f"Foreldreløse bilder (.webp uten kort): {len(orphans)}")
for o in orphans: print("   ORPHAN ", o)
print("\nKONKLUSJON:",
      "380-paastanden HOLDER." if total==380 and not mangler else
      f"AVVIK — total={total}, manglende={len(mangler)}")
