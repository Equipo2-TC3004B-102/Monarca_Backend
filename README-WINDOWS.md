# 🚀 Complete Installation Guide - Proyecto Monarca in Windows with WSL

This guide is designed specifically for the configuration and the execution of the “Proyecto Monarca” in **Windows using WSL2 (Ubuntu)**.

---

## 📍 **Adapting the Routes to your System**

> ⚠️ **IMPORTANT**: This guide uses example routes. You need to replace them to the location where you cloned the project.

### Examples of Routes:

**In Windows (PowerShell):**
- If your project is in: `C:\Proyectos\Monarca_Backend`
- If your project is in: `D:\Dev\Monarca_Backend`
- If your project is in: `E:\GitHub\Monarca_Backend`


**In WSL (Ubuntu):**
- Unit C: `/mnt/c/Proyectos/Monarca_Backend`
- Unit D: `/mnt/d/Dev/Monarca_Backend`
- Unit E: `/mnt/e/GitHub/Monarca_Backend`

### In this guide, we will use:
- `<YOUR_WINDOWS_ROUTE> `= The complete route in windows where your project is located
- `<UNIT>` = The letter of your unit(c, d, e, etc.)
- `<YOUR_ROUTE>` = The route inside the unit (without the letter)

**Real Examples**
- If your project is in D:\MisProyectos\Monarca\Monarca_Backend
- Then <YOUR_WINDOWS_ROUTE> = D:\MisProyectos\Monarca
- And the WSL would be: /mnt/d/MisProyectos/Monarca

---

## 📋 **1. Prerequisites**

### Necessary downloads:
- ✅ **Docker Desktop** - [Descargar](https://www.docker.com/products/docker-desktop)
- ✅ **WSL2 (Ubuntu)** Installed in Windows
- ✅ **VS Code** with WSL extension

---

## 🔧 **2. Configuration of WSL/Ubuntu**

### 2.1 Install basic tools
```bash
sudo apt update
sudo apt install direnv
```

### 2.2 Install NVM (node version manager)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
```

### 2.3 Configure direnv
```bash
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
source ~/.bashrc
```

### 2.4 Install Node.js v20
```bash
nvm install 20
nvm use 20
```

---

## 🐳 **3. Docker Configuration**

### 3.1 Enable Docker integration with WSL
1. Open **Docker Desktop**
2. Go to **Settings** → **Resources** → **WSL Integration**
3. Activate integration with **Ubuntu**
4. Apply and restart docker desktop

### 3.2 Build and Image with PostgreSQL (Powershell)
```powershell
cd <YOUR_WINDOWS_ROUTE>\Monarca_Backend\DB
docker build -t monarca-v1 .
```

**Example**: If your project is in `“C:/Proyectos”`, then:
```powershell
cd C:\Proyectos\Monarca_Backend\DB
```

### 3.3 Modifying compose.yaml
**Archivo:** `Monarca_Backend/compose.yaml`

**Change:**
```yaml
volumes:
  - ./DB/postgres:/var/lib/postgresql/data
```

**To:**
```yaml
volumes:
  - ./DB/postgres:/var/lib/postgresql
```

> ⚠️ **Note**: This change is necessary for PostgreSQL 18+ compatibility

### 3.4 Starting a Container (PowerShell)
```powershell
cd <YOUR_WINDOWS_ROUTE>\Monarca_Backend
docker compose up -d
docker start monarca_database
```

**Example**: If your project is located in `D:/Dev`:
```powershell
cd D:\Dev\Monarca_Backend
```

---

## 📁 **4. Copy the Project to the Archive System of Linux**

> ⚠️ **Important**: Don’t work directly in “/mnt/<unit>” since this causes permission problems. You need to copy the project into the native archive system of linux `“/home/user”`.

**In WSL:**
```bash
# Create directory
mkdir -p ~/Monarca

# Copy Frontend (ADJUST THE ROUTE TO YOUR PROJECT) 
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='coverage' /mnt/<unit>/<your_route>/Monarca_Frontend/ ~/Monarca/Monarca_Frontend/

# Copy Backend (ADJUST THE ROUTE TO YOUR PROJECT)
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='postgres' /mnt/<unit>/<your_route>/Monarca_Backend/ ~/Monarca/Monarca_Backend/
```

**Real Examples:**

If your project in Windows is in `“C:/Proyectos/”`:
```bash
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='coverage' /mnt/c/Proyectos/Monarca_Frontend/ ~/Monarca/Monarca_Frontend/
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='postgres' /mnt/c/Proyectos/Monarca_Backend/ ~/Monarca/Monarca_Backend/
```

If your project in Windows is in `“D:\Dev\MisProyectos\”`:
```bash
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='coverage' /mnt/d/Dev/MisProyectos/Monarca_Frontend/ ~/Monarca/Monarca_Frontend/
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='postgres' /mnt/d/Dev/MisProyectos/Monarca_Backend/ ~/Monarca/Monarca_Backend/
```

---

## ⚙️ **5. Modifications of Configuration Files**

### 5.1 Frontend - vite.config.ts
**File:** `Monarca_Frontend/vite.config.ts`

**Modify to make the HTTPS optional:**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // HTTPS solo si existen los certificados
    https: fs.existsSync(path.resolve(__dirname, 'certs/frontend-key.pem')) 
      ? {
          key: fs.readFileSync(path.resolve(__dirname, 'certs/frontend-key.pem')),
          cert: fs.readFileSync(path.resolve(__dirname, 'certs/frontend.pem')),
        }
      : undefined,
  }
});
```

### 5.2 Backend - main.ts
**File:** `Monarca_Backend/monarca/src/main.ts`

**Modify the function `“bootstrap”` to make HTTPS optional:**
```typescript
async function bootstrap() {
  // Read SSL certificate and key files if they exist
  const keyPath = 'certs/backend-key.pem';
  const certPath = 'certs/backend.pem';
  
  const options: any = {};
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    options.httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }
  
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    options,
  );
  
  // ... rest of code without changes
}
```

### 5.3 Backend - app.module.ts
**File:** `Monarca_Backend/monarca/src/app.module.ts`

**Change `“synchronize: false” for “synchronize: true”`:**
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5433,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: [
    // ... entidades
  ],
  synchronize: true,  // ← Change the false to true
}),
```

> ⚠️ **Note: `synchronize: true` automatically creates the tables in the database. DO NOT use in production**

---

## 🎯 **6. Frontend Configuration**

**In WSL:**
```bash
cd ~/Monarca/Monarca_Frontend

# Create .envrc file
cat > .envrc << 'EOF'
source $HOME/.nvm/nvm.sh
nvm use
EOF

# Allow direnv
direnv allow

# Create .nvmrc
echo "20" > .nvmrc

# Create .env file
echo 'VITE_API_URL=http://localhost:3000' > .env

# Install dependencies
npm install

# Start a development server
npm run dev
```

**Frontend running in:** http://localhost:5173

---

## 🎯 **7. Backend Configuration**

**In another WSL terminal:**
```bash
cd ~/Monarca/Monarca_Backend/monarca

# Create .envrc file
cat > .envrc << 'EOF'
source $HOME/.nvm/nvm.sh
nvm use
EOF

# Allow direnv
direnv allow

# Create .nvmrc
echo "20" > .nvmrc

# Create .env file
cat > .env << 'EOF'
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui
POSTGRES_HOST=localhost
POSTGRES_PORT=25000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=test123
POSTGRES_DATABASE=Monarca
DOWNLOAD_LINK=http://localhost:3000
FRONTEND_URL=http://localhost:5173
EOF

# Install dependencies 
npm install

# Start backend (creates the tables automatically)
npm run start:dev
```

**Backend running in:** http://localhost:3000

---

## 🌱 **8. Populate the Database**

**In another WSL terminal (this should be done AFTER the backend is up and running):**
```bash
cd ~/Monarca/Monarca_Backend/monarca
npm run db:seed
```

> ⏱️ Wait in between 10 to 15 seconds after starting up the backend before running the seed command.

---

## ✅ **9. Access Credentials**

**Available users (all with the password: `password`):**

| Role | Email | Password |
|-----|-------|------------|
| Requester (Solicitante) | `requester1@monarca.com` | `password` |
| Requester (Solicitante) | `requester2@monarca.com` | `password` |
| Approver (Aprobador) | `approver1@monarca.com` | `password` |
| SOI (Coordinator) | `soi1@monarca.com` | `password` |
| Travel Agent (Agent) | `travelagent1@monarca.com` | `password` |

---

## 📝 **Summary of Services Running**

| Service | URL | Description |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | React App |
| **Backend** | http://localhost:3000 | API NestJS |
| **API Docs** | http://localhost:3000/api | Swagger Documentation|
| **Database** | localhost:25000 | PostgreSQL |

---

## 🔄 **Useful Commands**

### Restarting services:
```bash
# Frontend
cd ~/Monarca/Monarca_Frontend
npm run dev

# Backend
cd ~/Monarca/Monarca_Backend/monarca
npm run start:dev
```

### Docker (through PowerShell):
```powershell
# See running containers
docker ps

# See all containers
docker ps -a

# Stop containers
docker stop monarca_database

# Start containers
docker start monarca_database

# See container logs
docker logs monarca_database

# Restart with compose
cd <YOUR_WINDOWS_ROUTE>\Monarca_Backend
docker compose restart

# Eliminate container and volumes
docker compose down -v
```

### Restarting Database:
```bash
cd ~/Monarca/Monarca_Backend/monarca

# Eliminate all data
npm run db:drop

# Empty tables (structure is maintained)
npm run db:truncate

# To populate again
npm run db:seed
```

---

## 🐛 **Solutions to Common Problems**

### Error: "Cannot find module @rollup/rollup-linux-x64-gnu"
**Cause**: The dependencies installed in windows are not compatible with WSL 
**Solution:**
```bash
cd ~/Monarca/Monarca_Frontend
rm -rf node_modules package-lock.json
npm install
```

### Error: "EPERM: operation not permitted"
**Cause**: You're working in `“/mnt/<unit>/”` (mounted windows file system) instead of the file system of linux.
**Solution:** Make sure you're in `~/Monarca/` executing `pwd`. It should show `/home/<tu_usuario>/Monarca/`... and NOT `/mnt/…`

### Error: "relation 'users' does not exist"
**Causa:** Cause: The tables did not get created or `“synchronize”` is set to `false`. 
**Solution:**
1. Verify that synchronize is set to `true` in `app.module.ts`
2. Restart the backend (`CTRL + C` and `npm run start:dev`)
3. Wait for a full start
4. Execute `npm run db:seed`

### Error: "Unable to connect to the database"
**Cause**: Docker is not running or not accessible by WSL.
**Solution:**
```powershell
# In PowerShell
docker ps
docker start monarca_database

# Wait 10 second and from WSL
cd ~/Monarca/Monarca_Backend/monarca
npm run start:dev
```

### Backend Constantly Restarts
**Cause**: TypeScript error in the modified files.
**Solution:** Verify that the changes done in `main.ts` and `app.module.ts` are copied correctly from windows to the linux folder.

---

## 📚 **Additional References**

- [Official NestJS Documentation](https://docs.nestjs.com/)
- [Official Vite Documentation](https://vitejs.dev/)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Desktop WSL 2 backend](https://docs.docker.com/desktop/wsl/)

---

## 🤝 **Contributions**

For more information about how you can contribute to the project, please direct yourself to [CONTRIBUTING.md](./monarca/CONTRIBUTING.md)

---

## 📄 **License**

This project is private and confidential to 02 Solutions.

---

## 🔐 **10. GIT Configuration in WSL**

> ⚠️ **Important**: If you plan to make commits and push through WSL, you need to configure git correctly to avoid line problems (CLRF vs LF) and SSH keys

### 10.1 GIT Configuration for Line Endings

**In WSL:**
```bash
# Backend
cd ~/Monarca/Monarca_Backend
git config core.autocrlf input
git config core.fileMode false

# Frontend
cd ~/Monarca/Monarca_Frontend
git config core.autocrlf input
git config core.fileMode false
```

**What does this do?**
- `autocrlf input`: Converts CRLF (windows) into LF (linux) automatically when a commit is done
- `fileMode false`: Ignores changes for file permissions (which differs in Windows and Linux)

### 10.2 Syncing Repositories with Remote

If you copied the files from windows and GIT shows false changes:

```bash
# Backend
cd ~/Monarca/Monarca_Backend
git fetch origin
git reset --hard origin/main

# Frontend
cd ~/Monarca/Monarca_Frontend
git fetch origin
git reset --hard origin/main
```

> ⚠️ **Warning**: `“git reset —hard”` will eliminate any changes in local that have not been committed. Please make sure to have saved everything that you need.

### 10.3 Setting up SSH Key for Github

**Option A: Copy your existent SSH key from Windows (Recommended)**

```bash
# Verify what keys you have in windows (replace YOUR_USER with your github usernamer)
ls /mnt/c/Users/YOUR_USER/.ssh/

# Copy windows key to WSL
mkdir -p ~/.ssh
cp /mnt/c/Users/YOUR_USER/.ssh/id_ed25519 ~/.ssh/
cp /mnt/c/Users/YOUR_USER/.ssh/id_ed25519.pub ~/.ssh/

# Setting up correct permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Add GitHub to known_hosts
ssh-keyscan -H github.com >> ~/.ssh/known_hosts

# Test connection
ssh -T git@github.com
```

**Option B: Create a new SSH key in WSL**

```bash
# Generates new key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy the public key
cat ~/.ssh/id_ed25519.pub

# Add GitHub to known_hosts
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
```

After adding the public key to GitHub:
1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Paste the content from `id_ed25519.pub`
4. Save

### 10.4 Workflow with GIT through WSL

```bash
# Example of a complete workflow
cd ~/Monarca/Monarca_Backend

# View status
git status

# Create branch
git checkout -b feature/my-new-functionality

# ... make changes in files...

# Add changes
git add .

# Commit
git commit -m "feat: description of changes"

# Push
git push origin feature/my-new-functionality
```

### 10.5 Maintaining synchronization between windows and WSL

**Recommendation**: Choose ONE of the following:

**Point A: Work ONLY in WSL** ✅ **(Recommended)**
- All changes and commits through `~/Monarca/`
- No need for synchronization with Windows
- No problems of line endings

**Point B: Work on both systems** ⚠️ **(AT YOUR OWN RISK)**
- Requires constant manual synchronization
- Prone to line ending conflicts 
- If you need to, always do git pull before changing systems

---

## 🔄 **11. Useful GIT Commands**

```bash
# See differences without considering line endings
git diff --ignore-cr-at-eol

# View branches
git branch -a

# Update through remote
git pull origin main

# View history
git log --oneline

# Change branch
git checkout nombre-rama

# View remote configurations
git remote -v

# Verify GIT configuration
git config --list
```

---

## 🚨 **Solution to problems - GIT**

### Problem: GIT shows modified files but they are not

**Cause:** Difference in line endings (CRLF vs LF)

**Solution:**
```bash
cd ~/Monarca/Monarca_Backend
git config core.autocrlf input
git reset --hard HEAD
```

### Problem: Permission denied when git push is done

**Cause:** SSH key is not configured or not added in GitHub

**Solution:**
```bash
# Verify that the key exists
ls ~/.ssh/id_ed25519

# Test connection
ssh -T git@github.com

# If it fails, verify that the key is in Github
cat ~/.ssh/id_ed25519.pub
```

### Problem: Agent admitted failure to sign when push is done

**Cause**: SSH key has passphrase but without an SSH agent

**Solution:**
```bash
# Start SSH agent (temporary valid until terminal is closed)
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_ed25519

# Now push
git push
```

### Problem: Windows repository is more up-to-date than the WSL one

**Solution:**
```bash
cd ~/Monarca/Monarca_Backend
git fetch origin
git pull origin main
```

