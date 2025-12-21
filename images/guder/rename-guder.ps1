# ============================================
# GLOSEMESTER BULK RENAME - POWERSHELL
# ============================================

$mappe = $PSScriptRoot
$startId = 39

# Navnemapping
$navneliste = @{
    "heimdall" = "heimdall"
    "vidar" = "vidar"
    "vali" = "vali"
    "forseti" = "forseti"
    "idunn" = "idunn"
    "sif" = "sif"
    "skadi" = "skadi"
    "njord" = "njord"
    "hermes" = "hermes"
    "hades" = "hades"
    "demeter" = "demeter"
    "hestia" = "hestia"
    "hephaestus" = "hephaestus"
    "ares" = "ares"
    "artemis" = "artemis"
    "apollo" = "apollo"
    "dionysus" = "dionysus"
    "pan" = "pan"
    "eros" = "eros"
    "nike" = "nike"
    "thor" = "thor"
    "freyja" = "freyja"
    "freyr" = "freyr"
    "baldur" = "baldur"
    "tyr" = "tyr"
    "athena" = "athena"
    "aphrodite" = "aphrodite"
    "poseidon" = "poseidon"
    "hera" = "hera"
    "persephone" = "persephone"
    "odin" = "odin"
    "loki" = "loki"
    "hel" = "hel"
    "zeus" = "zeus"
    "kronos" = "kronos"
    "yggdrasil" = "yggdrasil"
    "fenrir" = "fenrir"
    "jormungandr" = "jormungandr"
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "GLOSEMESTER BULK RENAME" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Mappe: $mappe"
Write-Host "Start-ID: $startId"
Write-Host "=====================================" -ForegroundColor Cyan

$filer = Get-ChildItem -Path $mappe -Filter *.png

if ($filer.Count -eq 0) {
    Write-Host "Ingen PNG-filer funnet!" -ForegroundColor Red
    exit
}

Write-Host "Fant $($filer.Count) filer" -ForegroundColor Green
Write-Host ""

$tellere = @{}
$teller = 0

foreach ($fil in $filer) {
    $filnavnLower = $fil.Name.ToLower()
    $funnet = $false
    
    foreach ($navn in $navneliste.Keys) {
        if ($filnavnLower -like "*$navn*") {
            if (-not $tellere.ContainsKey($navn)) {
                $tellere[$navn] = $startId + $tellere.Count
            }
            
            $id = $tellere[$navn]
            $nyttNavn = "{0:D3}-{1}.png" -f $id, $navneliste[$navn]
            $nySti = Join-Path $mappe $nyttNavn
            
            Rename-Item -Path $fil.FullName -NewName $nyttNavn -Force
            Write-Host "✅ $($fil.Name)" -ForegroundColor Green
            Write-Host "   → $nyttNavn" -ForegroundColor Gray
            Write-Host ""
            
            $funnet = $true
            $teller++
            break
        }
    }
    
    if (-not $funnet) {
        Write-Host "⚠️  HOPPET OVER: $($fil.Name)" -ForegroundColor Yellow
    }
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ FERDIG! Omdøpte $teller filer" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan