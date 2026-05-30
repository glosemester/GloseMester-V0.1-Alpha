# Deploy av v3 til testserver (test.glosemester.no)

Testserveren er nginx som serverer statiske filer fra `/var/www/glosemester-test/`
på Hetzner (178.105.131.153). v3 bygges til statiske filer og rsyncs dit.

> Deployen kjøres **lokalt fra din maskin** — den krever din SSH-tilgang til
> serveren og kan ikke kjøres fra agent-sandkassen.

## Engangsoppsett (første gang)

1. **Legg inn nginx-konfigen** (SPA-fallback + proxy av Feide/Stripe-funksjoner):
   ```bash
   scp app-v3/deploy/nginx-test.conf root@178.105.131.153:/etc/nginx/sites-available/glosemester-test
   ssh root@178.105.131.153 'ln -sf /etc/nginx/sites-available/glosemester-test /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx'
   ```

2. **HTTPS** (anbefalt — Feide/Stripe liker https):
   ```bash
   ssh root@178.105.131.153 'certbot --nginx -d test.glosemester.no'
   ```

3. **Registrer Feide redirect-URI.** I Dataporten/Feide-klienten (client_id
   `82131d17-…`) må `https://test.glosemester.no/` legges til som gyldig
   redirect-URI — ellers avviser Feide innlogging fra testdomenet.

## Hver deploy

```bash
bash app-v3/deploy/deploy-test.sh
```
Dette bygger v3 (`npm ci && npm run build`) og synkroniserer `dist/` til serveren.

## Hva som kan testes — og forbehold

| Flyt | Virker på test? | Forbehold |
|------|-----------------|-----------|
| Øvemodus + Leitner | ✅ | Helt klientside |
| Kortsamling | ✅ | localStorage (UID-nøklet) |
| Prøvemodus (elev) | ✅ | Krever Firestore-prøver |
| Lærer: lag/del prøve | ✅ | Krever Firestore-skriving |
| Google-innlogging | ✅* | `test.glosemester.no` må være i Firebase Auth «authorized domains» |
| Feide-innlogging | ✅* | Krever (1) funksjon-proxy i nginx, (2) redirect-URI registrert i Feide |
| Stripe-betaling | ✅* | Krever funksjon-proxy + at Netlify-env har STRIPE_*-nøkler (test-modus). Testkort: `4242 4242 4242 4242` |

\* avhenger av engangsoppsettet over.

## Viktig: Firebase-prosjekt

v3 bruker **samme Firebase-prosjekt** som prod (`glosemester-1e67e`) som standard.
Det betyr at prøver/resultater/brukere du lager på test havner i prod-databasen.
For ekte isolasjon: sett `app-v3/.env` med et eget test-Firebase-prosjekt
(se `.env.example`) før bygg. For en rask funksjonstest er prod-prosjektet greit,
men vær obs på at testdata blandes med ekte data.
