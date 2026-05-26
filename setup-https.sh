#!/bin/bash

# HTTPS Configuration Script for Monarca (macOS)
# Run in terminal from the project root directory

set -e

echo "============================================="
echo "  Local HTTPS Configurator for macOS         "
echo "============================================="

# 1. Verify/Install Homebrew and mkcert
if ! command -v mkcert &> /dev/null; then
    echo "[*] mkcert is not installed."
    if ! command -v brew &> /dev/null; then
        echo "[!] Homebrew is not installed. Please install Homebrew first: https://brew.sh/"
        exit 1
    fi
    echo "[*] Installing mkcert with Homebrew..."
    brew install mkcert
    brew install nss # For Firefox support
fi

# 2. Install Root CA in the macOS Keychain
echo "[*] Installing local Certificate Authority (CA)..."
mkcert -install

# 3. Create certs directories if they do not exist
frontend_certs_dir="Frontend/certs"
backend_certs_dir="Backend/monarca/certs"

mkdir -p "$frontend_certs_dir"
mkdir -p "$backend_certs_dir"
echo "[OK] Certificate folders prepared."

# 4. Generate local certificates for localhost and 127.0.0.1
echo "[*] Generating certificates for Frontend..."
cd "$frontend_certs_dir"
mkcert -key-file frontend-key.pem -cert-file frontend.pem localhost 127.0.0.1
cd - > /dev/null
echo "[OK] Frontend certificates generated successfully."

echo "[*] Generating certificates for Backend..."
cd "$backend_certs_dir"
mkcert -key-file backend-key.pem -cert-file backend.pem localhost 127.0.0.1
cd - > /dev/null
echo "[OK] Backend certificates generated successfully."

# 5. Modify .env files to use HTTPS
echo "[*] Configuring .env files to use HTTPS..."

frontend_env="Frontend/.env"
backend_env="Backend/monarca/.env"

# Frontend .env
if [ -f "$frontend_env" ]; then
    # Use macOS compatible sed (sed -i '')
    sed -i '' 's|http://localhost:3000|https://localhost:3000|g' "$frontend_env"
    sed -i '' 's|http://localhost:3002|https://localhost:3002|g' "$frontend_env"
    echo "[OK] Frontend .env updated to HTTPS."
else
    echo "[!] Frontend .env file not found."
fi

# Backend .env
if [ -f "$backend_env" ]; then
    sed -i '' 's|http://localhost:3000|https://localhost:3000|g' "$backend_env"
    sed -i '' 's|http://localhost:3002|https://localhost:3002|g' "$backend_env"
    sed -i '' 's|http://localhost:5173|https://localhost:5173|g' "$backend_env"
    echo "[OK] Backend .env updated to HTTPS."
else
    echo "[!] Backend .env file not found."
fi

echo "============================================="
echo "  HTTPS Configuration Completed!             "
echo "  Start your services again:                 "
echo "  - Frontend: https://localhost:5173         "
echo "  - Backend: https://localhost:3000          "
echo "============================================="
