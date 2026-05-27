# HTTPS Configuration Script for Monarca (Windows)
# Run in PowerShell as Administrator

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Local HTTPS Configurator for Windows       " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Verify/Install mkcert
if (!(Get-Command mkcert -ErrorAction SilentlyContinue)) {
    Write-Host "[*] mkcert is not installed. Installing it via winget..." -ForegroundColor Yellow
    winget install FiloSottile.mkcert --accept-source-agreements --accept-package-agreements
    
    # Try to refresh current session PATH environment variable
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    if (!(Get-Command mkcert -ErrorAction SilentlyContinue)) {
        Write-Host "[!] mkcert was installed but is not yet in the PATH of this terminal." -ForegroundColor Red
        Write-Host "[!] Please open a NEW PowerShell window as ADMINISTRATOR and run this script again." -ForegroundColor Yellow
        exit
    }
} else {
    Write-Host "[OK] mkcert is already installed." -ForegroundColor Green
}

# 2. Install the Root Certificate Authority (CA) in the Windows Trust Store
Write-Host "[*] Installing local Certificate Authority (CA)..." -ForegroundColor Yellow
& mkcert -install

# 3. Create certs directories if they do not exist
$frontendCertsDir = Join-Path (Get-Item .).FullName "Frontend\certs"
$backendCertsDir = Join-Path (Get-Item .).FullName "Backend\monarca\certs"

if (!(Test-Path $frontendCertsDir)) {
    New-Item -ItemType Directory -Path $frontendCertsDir -Force | Out-Null
    Write-Host "[OK] Frontend certs folder created." -ForegroundColor Green
}
if (!(Test-Path $backendCertsDir)) {
    New-Item -ItemType Directory -Path $backendCertsDir -Force | Out-Null
    Write-Host "[OK] Backend certs folder created." -ForegroundColor Green
}

# 4. Generate local certificates for localhost and 127.0.0.1
Write-Host "[*] Generating certificates for Frontend..." -ForegroundColor Yellow
Push-Location "Frontend\certs"
& mkcert -key-file frontend-key.pem -cert-file frontend.pem localhost 127.0.0.1
Pop-Location
Write-Host "[OK] Frontend certificates generated successfully." -ForegroundColor Green

Write-Host "[*] Generating certificates for Backend..." -ForegroundColor Yellow
Push-Location "Backend\monarca\certs"
& mkcert -key-file backend-key.pem -cert-file backend.pem localhost 127.0.0.1
Pop-Location
Write-Host "[OK] Backend certificates generated successfully." -ForegroundColor Green

# 5. Modify .env files to use HTTPS
Write-Host "[*] Configuring .env files to use HTTPS..." -ForegroundColor Yellow

$frontendEnvPath = "Frontend\.env"
$backendEnvPath = "Backend\monarca\.env"

# Frontend .env
if (Test-Path $frontendEnvPath) {
    $content = Get-Content $frontendEnvPath
    $updated = $content -replace "http://localhost:3000", "https://localhost:3000"
    $updated = $updated -replace "http://localhost:3002", "https://localhost:3002"
    $updated | Set-Content $frontendEnvPath
    Write-Host "[OK] Frontend .env updated to HTTPS." -ForegroundColor Green
} else {
    Write-Host "[!] Frontend .env file not found." -ForegroundColor Red
}

# Backend .env
if (Test-Path $backendEnvPath) {
    $content = Get-Content $backendEnvPath
    $updated = $content -replace "http://localhost:3000", "https://localhost:3000"
    $updated = $updated -replace "http://localhost:3002", "https://localhost:3002"
    $updated = $updated -replace "http://localhost:5173", "https://localhost:5173"
    $updated | Set-Content $backendEnvPath
    Write-Host "[OK] Backend .env updated to HTTPS." -ForegroundColor Green
} else {
    Write-Host "[!] Backend .env file not found." -ForegroundColor Red
}

Write-Host "=============================================" -ForegroundColor Green
Write-Host "  HTTPS Configuration Completed!             " -ForegroundColor Green
Write-Host "  Start your services again:                 " -ForegroundColor Green
Write-Host "  - Frontend: https://localhost:5173         " -ForegroundColor Green
Write-Host "  - Backend: https://localhost:3000          " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
