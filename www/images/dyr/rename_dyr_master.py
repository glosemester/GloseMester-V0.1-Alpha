import os
import re

# Bruk mappen scriptet ligger i
mappe = os.path.dirname(os.path.abspath(__file__))

# ============================================
# FAST ID-MAPPING FOR DYR (001-038)
# ============================================

id_mapping = {
    # VANLIGE (001-020) - 20 kort
    "hamster": 1,
    "kanin": 2,
    "rabbit": 2,
    "pinnsvin": 3,
    "hedgehog": 3,
    "ekorn": 4,
    "squirrel": 4,
    "marsvin": 5,
    "guinea": 5,
    "kattunge": 6,
    "kitten": 6,
    "valp": 7,
    "puppy": 7,
    "and": 8,
    "duck": 8,
    "mus": 9,
    "mouse": 9,
    "rotte": 10,
    "rat": 10,
    "chinchilla": 11,
    "gerbil": 12,
    "frett": 13,
    "ferret": 13,
    "kylling": 14,
    "chick": 14,
    "chicken": 14,
    "lam": 15,
    "lamb": 15,
    "gris": 16,
    "pig": 16,
    "piglet": 16,
    "pafugl": 17,
    "peacock": 17,
    "peafowl": 17,
    "flamingo": 18,
    "svan": 19,
    "swan": 19,
    "cygnet": 19,
    "gas": 20,
    "goose": 20,
    "gosling": 20,
    
    # SJELDNE (021-030) - 10 kort
    "fox": 21,
    "redfox": 21,
    "panda": 22,
    "koala": 23,
    "oter": 24,
    "otter": 24,
    "sel": 25,
    "seal": 25,
    "pingvin": 26,
    "penguin": 26,
    "dovendyr": 27,
    "sloth": 27,
    "lemur": 28,
    "alpakka": 29,
    "alpaca": 29,
    "capybara": 30,
    
    # EPISKE (031-035) - 5 kort
    "rodpanda": 31,
    "redpanda": 31,
    "meerkat": 32,
    "fennec": 33,
    "axolotl": 34,
    "quokka": 35,
    
    # LEGENDARISKE (036-038) - 3 kort
    "unicorn": 36,
    "drage": 37,
    "dragon": 37,
    "feniks": 38,
    "phoenix": 38
}

# Norske hovednavn (brukes i filnavn)
norske_navn = {
    1: "hamster",
    2: "kanin",
    3: "pinnsvin",
    4: "ekorn",
    5: "marsvin",
    6: "kattunge",
    7: "valp",
    8: "and",
    9: "mus",
    10: "rotte",
    11: "chinchilla",
    12: "gerbil",
    13: "frett",
    14: "kylling",
    15: "lam",
    16: "gris",
    17: "pafugl",
    18: "flamingo",
    19: "svan",
    20: "gas",
    21: "rodfrev",
    22: "panda",
    23: "koala",
    24: "oter",
    25: "sel",
    26: "pingvin",
    27: "dovendyr",
    28: "lemur",
    29: "alpakka",
    30: "capybara",
    31: "rodpanda",
    32: "meerkat",
    33: "fennec",
    34: "axolotl",
    35: "quokka",
    36: "unicorn",
    37: "drage",
    38: "feniks"
}

def finn_dyrenavn_i_filnavn(filnavn):
    """Finn hvilket dyr dette er basert på glosemester-filnavnet"""
    fn = filnavn.lower()
    
    # Fjern "glosemester_" og "baby_" prefiks
    fn = fn.replace("glosemester_", "")
    fn = fn.replace("baby_", "")
    fn = fn.replace("cute_", "")
    
    # Ekstraher første ord(ene) før beskrivelsen
    # Format: "Hamster_cute_small_rodent..."
    match = re.match(r'^([a-z_]+?)(?:_cute|_digital|_kawaii)', fn)
    if match:
        dyrenavn = match.group(1).replace('_', '')
    else:
        # Fallback: ta første ord
        dyrenavn = fn.split('_')[0]
    
    # Spesialtilfeller
    if "red" in fn and "panda" in fn:
        return "rodpanda"
    if "red" in fn and "fox" in fn:
        return "rodfrev"
    if "peacock" in fn or "peafowl" in fn:
        return "pafugl"
    if "guinea" in fn:
        return "marsvin"
    
    # Sjekk i mapping
    if dyrenavn in id_mapping:
        return dyrenavn
    
    # Prøv å finne delvis match
    for navn in id_mapping.keys():
        if navn in dyrenavn or dyrenavn in navn:
            return navn
    
    return None

# ============================================
# HOVEDPROGRAM
# ============================================

print("=" * 60)
print("🐾 GLOSEMESTER BULK RENAME - DYR")
print("Håndterer glosemester_XXX_... format")
print("=" * 60)
print(f"Mappe: {mappe}\n")

filer = sorted([f for f in os.listdir(mappe) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))])

if not filer:
    print("❌ Ingen bildefiler funnet!")
    input("Trykk ENTER for å lukke...")
    exit()

print(f"✅ Fant {len(filer)} filer\n")

omdopte = 0
hoppet_over = []
allerede_brukte_id = {}

for fil in filer:
    dyrenavn = finn_dyrenavn_i_filnavn(fil)
    
    if dyrenavn and dyrenavn in id_mapping:
        id_nummer = id_mapping[dyrenavn]
        
        # Sjekk om ID allerede er brukt
        if id_nummer in allerede_brukte_id:
            print(f"⚠️  DUPLIKAT: {fil}")
            print(f"   → ID {id_nummer:03d} allerede brukt av: {allerede_brukte_id[id_nummer]}")
            print(f"   → Hopper over denne\n")
            continue
        
        # Bruk norsk navn i filnavnet
        norsk_navn = norske_navn[id_nummer]
        nytt_navn = f"{id_nummer:03d}-{norsk_navn}.png"
        
        gammelt_sti = os.path.join(mappe, fil)
        nytt_sti = os.path.join(mappe, nytt_navn)
        
        try:
            os.rename(gammelt_sti, nytt_sti)
            allerede_brukte_id[id_nummer] = nytt_navn
            print(f"✅ {fil[:60]}...")
            print(f"   → {nytt_navn}\n")
            omdopte += 1
        except Exception as e:
            print(f"❌ FEIL ved {fil}: {e}\n")
    else:
        print(f"⚠️  UKJENT: {fil[:60]}...\n")
        hoppet_over.append(fil)

print("=" * 60)
print(f"✅ FERDIG!")
print(f"   Omdøpte: {omdopte} filer")

if hoppet_over:
    print(f"   ⚠️  Hoppet over: {len(hoppet_over)} filer")
    print("\n   Filer som ble hoppet over:")
    for f in hoppet_over:
        print(f"   - {f[:60]}...")

# Verifiser resultat
print("\n📊 VERIFISERING:")
print("=" * 60)
filer_etter = sorted([f for f in os.listdir(mappe) if f.lower().endswith('.png') and len(f) >= 4 and f[:3].isdigit()])
print(f"Totalt nummererte filer: {len(filer_etter)}/38\n")

if len(filer_etter) < 38:
    print(f"⚠️  Du mangler {38 - len(filer_etter)} filer!")
    
    # Finn hvilke ID-er som mangler
    eksisterende_ids = set()
    for f in filer_etter:
        if len(f) >= 3 and f[:3].isdigit():
            eksisterende_ids.add(int(f[:3]))
    
    manglende = []
    for i in range(1, 39):
        if i not in eksisterende_ids:
            manglende.append(f"{i:03d}-{norske_navn[i]}")
    
    if manglende:
        print("\n📋 MANGLENDE KORT:")
        for m in manglende:
            print(f"   {m}")

else:
    print("🎉 ALLE 38 KORT ER PÅ PLASS!")

print("\n📁 RESULTAT:")
for f in filer_etter[:5]:
    print(f"   {f}")
if len(filer_etter) > 5:
    print(f"   ... og {len(filer_etter) - 5} til")

input("\nTrykk ENTER for å lukke...")
