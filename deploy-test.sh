#!/bin/bash
# Publiser GloseMester til testserver (test.glosemester.no)
set -e

echo "🚀 Synkroniserer til testserver..."
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='android' \
  --exclude='ios' \
  --exclude='*.log' \
  --exclude='.env*' \
  /home/oyvind/Apper/GloseMester-V0.1-Alpha/ \
  root@178.105.131.153:/var/www/glosemester-test/

echo "✅ Ferdig! Åpne: http://test.glosemester.no"
