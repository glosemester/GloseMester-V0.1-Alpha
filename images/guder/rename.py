import os
import re

# Bruk mappen scriptet ligger i
mappe = os.path.dirname(os.path.abspath(__file__))

# ============================================
# FAST ID-MAPPING (fra din opprinnelige liste)
# ============================================

id_mapping = {
    # VANLIGE (039-058)
    "heimdall": 39,
    "vidar": 40,
    "vali": 41,  # Matcher også: Vli, Váli
    "forseti": 42,
    "idunn": 43,
    "sif": 44,
    "skadi": 45,
    "njord": 46,
    "hermes": 47,
    "hades": 48,
    "demeter": 49,
    "hestia": 50,
    "hephaestus": 51,
    "ares": 52,
    "artemis": 53,
    "apollo": 54,
    "dionysus": 55,
    "pan": 56,
    "eros": 57,
    "nike": 58,
    
    # SJELDNE (059-068)
    "thor": 59,
    "freyja": 60,
    "freyr": 61,
    "baldur": 62,
    "tyr": 63,
    "athena": 64,
    "aphrodite": 65,
    "poseidon": 66,
    "hera": 67,
    "persephone": 68,
    
    # EPISKE (069-073)
    "odin": 69,
    "loki": 70,
    "hel": 71,
    "zeus": 72,
    "kronos": 73,
    
    # LEGENDARISKE (074-076)
    "yggdrasil": 74,
    "fenrir": 75,
    "jormungandr": 76  # Matcher også: Jörmungandr, Jormungand
}

# Spesialtilfeller / aliaser
aliaser = {
    "vli": "vali",
    "jörmungandr": "jormungandr",
    "jørmungandr": "jormungandr",
    "jormungand": "jormungandr",
}

def normaliser_tekst(tekst):
    """Fjern spesialtegn og gjør om til lowercase"""
    tekst = tekst.lower()
    # Erstatt nordiske tegn
    tekst = tekst.replace('å', 'a').replace('ä', 'a').replace('á', 'a')
    tekst = tekst.replace('ø', 'o').replace('ö', 'o').replace('ó', 'o')
    tekst = tekst.replace('æ', 'ae')
    return tekst

def finn_navn(filnavn):
    """Finn hvilket kort dette er basert på filnavnet"""
    fn_original = filnavn.lower()
    fn_normalisert = normaliser_tekst(filnavn)
    
    # Sjekk aliaser først
    for alias, ekte_navn in aliaser.items():
        if alias in fn_original or alias in fn_normalisert:
            return ekte_navn
    
    # Sjekk vanlige navn
    for navn in id_mapping.keys():
        if navn in fn_normalisert:
            return navn
    
    # Sjekk delvis match (for "Vli" → "vali")
    for navn in id_mapping.keys():
        # Sjekk om minst 70% av bokstavene matcher
        if len(navn) >= 3:
            fn_kort = fn_normalisert.replace('glosemester_', '').split('_')[0]
            if fn_kort and (fn_kort in navn or navn in fn_kort):
                return navn
    
    return None

# ============================================
# HOVEDPROGRAM
# ============================================

print("=" * 60)
print("🎴 GLOSEMESTER BULK RENAME (MED FUZZY MATCHING)")
print("=" * 60)
print(f"Mappe: {mappe}\n")

filer = [f for f in os.listdir(mappe) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]

if not filer:
    print("❌ Ingen bildefiler funnet!")
    input("Trykk ENTER for å lukke...")
    exit()

print(f"✅ Fant {len(filer)} filer")
print("=" * 60)

omdopte = 0
hoppet_over = []

for fil in filer:
    navn = finn_navn(fil)
    
    if navn and navn in id_mapping:
        id_nummer = id_mapping[navn]
        nytt_navn = f"{id_nummer:03d}-{navn}.png"
        
        gammelt_sti = os.path.join(mappe, fil)
        nytt_sti = os.path.join(mappe, nytt_navn)
        
        try:
            os.rename(gammelt_sti, nytt_sti)
            print(f"✅ {fil}")
            print(f"   → {nytt_navn}\n")
            omdopte += 1
        except Exception as e:
            print(f"❌ FEIL ved {fil}: {e}\n")
    else:
        print(f"⚠️  HOPPET OVER (ukjent kort): {fil}\n")
        hoppet_over.append(fil)

print("=" * 60)
print(f"✅ FERDIG!")
print(f"   Omdøpte: {omdopte} filer")
if hoppet_over:
    print(f"   ⚠️  Hoppet over: {len(hoppet_over)} filer")
    print("\n   Filer som ble hoppet over:")
    for f in hoppet_over:
        print(f"   - {f}")
print("=" * 60)

input("\nTrykk ENTER for å lukke...")