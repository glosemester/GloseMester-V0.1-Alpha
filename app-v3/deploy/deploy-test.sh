#!/bin/bash
# Bygg GloseMester v3 og publiser til testserveren (test.glosemester.no).
#
# Kjøres LOKALT fra din maskin (krever din SSH-tilgang til serveren — kan ikke
# kjøres fra agent-sandkassen). Forutsetter at du står i repo-roten.
#
#   bash app-v3/deploy/deploy-test.sh
#
set -euo pipefail

SERVER="root@178.105.131.153"
MAALMAPPE="/var/www/glosemester-test/"

echo "📦 Bygger v3…"
( cd app-v3 && npm ci && npm run build )

echo "🚀 Synkroniserer dist/ til $SERVER:$MAALMAPPE…"
# --delete fjerner gamle v2-filer på testserveren slik at bare v3 ligger der.
rsync -az --delete \
  --exclude='.git' \
  dist/ \
  "$SERVER:$MAALMAPPE"

echo "✅ Ferdig! Åpne: https://test.glosemester.no"
echo ""
echo "Hvis dette er første gang: legg inn nginx-konfigen og last den på nytt:"
echo "  scp app-v3/deploy/nginx-test.conf $SERVER:/etc/nginx/sites-available/glosemester-test"
echo "  ssh $SERVER 'ln -sf /etc/nginx/sites-available/glosemester-test /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx'"
