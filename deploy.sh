#!/usr/bin/env bash

# ==============================================================================
# Script Otomatis Deploy: get-BPN REST API (Next.js & Oracle SISMIOP)
# Target Port: 3005
# ==============================================================================

set -e

# Warna Terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}   🚀 MEMULAI DEPLOYMENT APLIKASI GET-BPN (PORT 3005)  ${NC}"
echo -e "${CYAN}======================================================${NC}"

# 1. Cek & Pasang Dependensi Sistem untuk Oracle Client (Linux)
if [ "$(uname)" = "Linux" ]; then
  echo -e "\n${YELLOW}[1/7] Memeriksa Oracle Instant Client & dependensi sistem Linux...${NC}"
  if [ -f /etc/debian_version ]; then
    sudo apt-get update -y
    sudo apt-get install -y libaio1 2>/dev/null || sudo apt-get install -y libaio1t64 2>/dev/null || true
    sudo apt-get install -y wget unzip 2>/dev/null || true
    
    # Fix libaio.so.1 symlink untuk Ubuntu 24.04 / Debian modern jika menggunakan libaio1t64
    if [ -f /usr/lib/x86_64-linux-gnu/libaio.so.1t64 ] && [ ! -f /usr/lib/x86_64-linux-gnu/libaio.so.1 ]; then
      sudo ln -sf /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1
    fi
  fi

  # Unduh & Pasang Oracle Instant Client Linux x64 jika belum ada
  if [ ! -d "/opt/oracle/instantclient_19_23" ] && [ ! -d "/opt/oracle/instantclient" ]; then
    echo "Mengunduh dan memasang Oracle Instant Client 19.23 Linux x64..."
    sudo mkdir -p /opt/oracle
    cd /opt/oracle
    sudo wget -q --show-progress https://download.oracle.com/otn_software/linux/instantclient/1923000/instantclient-basic-linux.x64-19.23.0.0.0dbru.zip -O instantclient-basic.zip
    sudo unzip -q -o instantclient-basic.zip
    sudo rm -f instantclient-basic.zip
    
    # Daftarkan library ke ldconfig
    echo "/opt/oracle/instantclient_19_23" | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf > /dev/null
    sudo ldconfig 2>/dev/null || true
    echo -e "${GREEN}Oracle Instant Client berhasil dipasang di /opt/oracle/instantclient_19_23.${NC}"
    cd "$APP_DIR"
  else
    echo -e "${GREEN}Oracle Instant Client Linux sudah terpasang.${NC}"
  fi
fi

# 2. Cek Node.js & NPM
echo -e "\n${YELLOW}[2/7] Memeriksa Node.js & NPM...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js belum terinstall. Silakan install Node.js 18+ terlebih dahulu.${NC}"
    exit 1
fi
echo -e "Node.js Version: ${GREEN}$(node -v)${NC}"
echo -e "NPM Version:     ${GREEN}$(npm -v)${NC}"

# 3. Cek / Pasang PM2 (Process Manager)
echo -e "\n${YELLOW}[3/7] Memeriksa PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "PM2 belum terpasang. Menginstall PM2 secara global..."
    sudo npm install -g pm2 || npm install -g pm2
fi
echo -e "PM2 Version:     ${GREEN}$(pm2 -v)${NC}"

# 4. Sinkronisasi Git (Jika folder merupakan git repo)
echo -e "\n${YELLOW}[4/7] Memeriksa pembaruan Git...${NC}"
if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo -e "Menarik pembaruan dari branch: ${GREEN}${CURRENT_BRANCH}${NC}"
    git pull origin "$CURRENT_BRANCH" || echo -e "${YELLOW}Catatan: Git pull dilewati / tidak ada remote terhubung.${NC}"
else
    echo "Bukan direktori Git atau deploy manual."
fi

# 5. Konfigurasi File .env
echo -e "\n${YELLOW}[5/7] Memeriksa konfigurasi .env...${NC}"
if [ ! -f ".env" ]; then
    echo "Membuat file .env default..."
    cat << 'EOF' > .env
# Server Binding & Port
HOSTNAME=0.0.0.0
PORT=3005

# Konfigurasi Database Oracle SISMIOP PBB
DB_USER=PBB
DB_PASSWORD=PBB
DB_HOST=103.167.12.59
DB_PORT=1521
DB_SID=SISMIOP

# API Authentication (Optional / Security)
API_SECRET_KEY=bpn-sismiop-pbb-secret-2026
EOF
    echo -e "${GREEN}File .env berhasil dibuat.${NC}"
else
    echo -e "${GREEN}File .env sudah ada.${NC}"
fi

# 6. Install Dependensi & Build Next.js
echo -e "\n${YELLOW}[6/7] Menginstall paket NPM & Menjalankan Build...${NC}"
npm install --legacy-peer-deps
npm run build

# 7. Restart / Jalankan Aplikasi via PM2
echo -e "\n${YELLOW}[7/7] Menjalankan / Restart Aplikasi via PM2...${NC}"
if pm2 describe get-bpn-api > /dev/null 2>&1; then
    echo "Merestart service PM2 'get-bpn-api'..."
    pm2 restart get-bpn-api --update-env
else
    echo "Menjalankan service PM2 baru 'get-bpn-api'..."
    pm2 start ecosystem.config.js
fi

pm2 save

echo -e "\n${CYAN}======================================================${NC}"
echo -e "${GREEN}   ✅ DEPLOYMENT BERHASIL SELESAI!                   ${NC}"
echo -e "${CYAN}======================================================${NC}"
echo -e "Aplikasi berjalan di:"
echo -e "  - Local:   ${GREEN}http://127.0.0.1:3005${NC}"
echo -e "  - Network: ${GREEN}http://0.0.0.0:3005${NC}"
echo -e "  - Endpoint:${GREEN}http://127.0.0.1:3005/api/v1/pbb/nop/120301005600400580${NC}"
echo -e "\nCek status PM2 dengan perintah: ${YELLOW}pm2 status${NC}"
echo -e "Cek log aplikasi dengan:        ${YELLOW}pm2 logs get-bpn-api${NC}"
echo -e "${CYAN}======================================================${NC}"
