# Utvikling — kom i gang lokalt (VS Code / Cursor)

## Førstegangsoppsett (Windows)

```powershell
# 1. Tillat npm-skript (én gang per maskin — Windows blokkerer som standard)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 2. Klon og installer
git clone https://github.com/glosemester/GloseMester-V0.1-Alpha.git
cd GloseMester-V0.1-Alpha/app-v3
npm install
```

**Hemmeligheter:** `.env`-filer (Firebase/Stripe/Resend/Feide-nøkler) ligger IKKE i git.
Kopiér dem fra forrige arbeidsmappe (rot og `app-v3/`) — aldri commit dem.

## Daglig arbeidsflyt (skriver aldri over noe)

```bash
git checkout main && git pull        # hent siste FØR du begynner
git checkout -b min-endring          # jobb i branch, ikke på main
# ...gjør endringer, commit underveis...
git push -u origin min-endring       # push branchen
```

Opprett deretter PR på GitHub → vent på grønn CI → merge.
**Netlify publiserer automatisk til glosemester.no ved merge til `main`.**

- Nekter git å pushe? Noen andre har pushet først — kjør `git pull`, løs konflikt, push igjen.
- **Aldri `git push --force` på main.**
- Firestore-regler deployes IKKE av Netlify: `firebase deploy --only firestore:rules --project glosemester-1e67e` (kjøres manuelt etter at klienten er publisert).

## Nyttige kommandoer (fra `app-v3/`)

| Kommando | Hva |
|---|---|
| `npm run dev` | Dev-server (localhost:5173) |
| `npm test` | Enhetstester (vitest) |
| `npm run lint` / `npm run typecheck` | Kodekvalitet |
| `npm run build` | Produksjonsbygg (→ `../dist`) |
| `npm run e2e` | Playwright-smoketester (krever `npx playwright install chromium` første gang) |

## Claude Code lokalt (valgfritt, anbefalt)

Installer Claude Code i terminalen og kjør den fra repo-roten. Anbefalt tillegg —
[Superpowers](https://github.com/obra/superpowers) (MIT), en utviklingsmetodikk
(brainstorming → planlegging → TDD → kodegjennomgang) som aktiveres automatisk:

```
/plugin install superpowers@claude-plugins-official
```
