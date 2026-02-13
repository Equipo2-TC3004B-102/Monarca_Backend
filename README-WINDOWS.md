# 🚀 Guía Completa de Instalación - Proyecto Monarca en Windows con WSL

Esta guía está diseñada específicamente para configurar y ejecutar el proyecto Monarca en **Windows usando WSL2 (Ubuntu)**.

---

## 📍 **Adaptando las Rutas a Tu Sistema**

> ⚠️ **IMPORTANTE:** Esta guía utiliza rutas de ejemplo. Debes reemplazarlas con la ubicación real donde clonaste el proyecto.

### Ejemplos de rutas:

**En Windows (PowerShell):**
- Si tu proyecto está en: `C:\Proyectos\Monarca_Backend`
- Si tu proyecto está en: `D:\Dev\Monarca_Backend`
- Si tu proyecto está en: `E:\GitHub\Monarca_Backend`

**En WSL (Ubuntu):**
- Unidad C: `/mnt/c/Proyectos/Monarca_Backend`
- Unidad D: `/mnt/d/Dev/Monarca_Backend`
- Unidad E: `/mnt/e/GitHub/Monarca_Backend`

### En esta guía usaremos:
- `<TU_RUTA_WINDOWS>` = La ruta completa en Windows donde está tu proyecto
- `<UNIDAD>` = La letra de tu unidad (c, d, e, etc.)
- `<TU_RUTA>` = La ruta dentro de la unidad (sin la letra)

**Ejemplo real:**
- Si tu proyecto está en `D:\MisProyectos\Monarca\Monarca_Backend`
- Entonces `<TU_RUTA_WINDOWS>` = `D:\MisProyectos\Monarca`
- Y en WSL sería: `/mnt/d/MisProyectos/Monarca`

---

## 📋 **1. Requisitos Previos**

### Instalaciones necesarias:
- ✅ **Docker Desktop** - [Descargar](https://www.docker.com/products/docker-desktop)
- ✅ **WSL2 (Ubuntu)** instalado en Windows
- ✅ **VS Code** con extensión de WSL

---

## 🔧 **2. Configuración de WSL/Ubuntu**

### 2.1 Instalar herramientas básicas
```bash
sudo apt update
sudo apt install direnv
```

### 2.2 Instalar NVM (Node Version Manager)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
```

### 2.3 Configurar direnv
```bash
echo 'eval "$(direnv hook bash)"' >> ~/.bashrc
source ~/.bashrc
```

### 2.4 Instalar Node.js v20
```bash
nvm install 20
nvm use 20
```

---

## 🐳 **3. Configuración de Docker**

### 3.1 Habilitar integración de Docker con WSL
1. Abrir **Docker Desktop**
2. Ir a **Settings** → **Resources** → **WSL Integration**
3. Activar integración con **Ubuntu**
4. Aplicar y reiniciar Docker Desktop

### 3.2 Construir imagen de PostgreSQL (desde PowerShell)
```powershell
cd <TU_RUTA_WINDOWS>\Monarca_Backend\DB
docker build -t monarca-v1 .
```

**Ejemplo:** Si tu proyecto está en `C:\Proyectos`, entonces:
```powershell
cd C:\Proyectos\Monarca_Backend\DB
```

### 3.3 Modificar compose.yaml
**Archivo:** `Monarca_Backend/compose.yaml`

**Cambiar:**
```yaml
volumes:
  - ./DB/postgres:/var/lib/postgresql/data
```

**Por:**
```yaml
volumes:
  - ./DB/postgres:/var/lib/postgresql
```

> ⚠️ **Nota:** Este cambio es necesario para compatibilidad con PostgreSQL 18+

### 3.4 Iniciar contenedor (desde PowerShell)
```powershell
cd <TU_RUTA_WINDOWS>\Monarca_Backend
docker compose up -d
docker start monarca_database
```

**Ejemplo:** Si tu proyecto está en `D:\Dev`:
```powershell
cd D:\Dev\Monarca_Backend
```

---

## 📁 **4. Copiar Proyecto al Sistema de Archivos de Linux**

> ⚠️ **Importante:** No trabajes directamente en `/mnt/<unidad>/` ya que causa problemas de permisos. Debes copiar el proyecto al sistema de archivos nativo de Linux (`/home/usuario/`).

**Desde WSL:**
```bash
# Crear directorio
mkdir -p ~/Monarca

# Copiar Frontend (AJUSTA LA RUTA A TU PROYECTO)
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='coverage' /mnt/<unidad>/<tu_ruta>/Monarca_Frontend/ ~/Monarca/Monarca_Frontend/

# Copiar Backend (AJUSTA LA RUTA A TU PROYECTO)
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='postgres' /mnt/<unidad>/<tu_ruta>/Monarca_Backend/ ~/Monarca/Monarca_Backend/
```

**Ejemplos reales:**

Si tu proyecto en Windows está en `C:\Proyectos\`:
```bash
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='coverage' /mnt/c/Proyectos/Monarca_Frontend/ ~/Monarca/Monarca_Frontend/
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='postgres' /mnt/c/Proyectos/Monarca_Backend/ ~/Monarca/Monarca_Backend/
```

Si tu proyecto en Windows está en `D:\Dev\MisProyectos\`:
```bash
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='coverage' /mnt/d/Dev/MisProyectos/Monarca_Frontend/ ~/Monarca/Monarca_Frontend/
rsync -av --exclude='node_modules' --exclude='package-lock.json' --exclude='postgres' /mnt/d/Dev/MisProyectos/Monarca_Backend/ ~/Monarca/Monarca_Backend/
```

---

## ⚙️ **5. Modificaciones de Archivos de Configuración**

### 5.1 Frontend - vite.config.ts
**Archivo:** `Monarca_Frontend/vite.config.ts`

**Modificar para hacer HTTPS opcional:**
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
**Archivo:** `Monarca_Backend/monarca/src/main.ts`

**Modificar la función `bootstrap` para hacer HTTPS opcional:**
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
  
  // ... resto del código sin cambios
}
```

### 5.3 Backend - app.module.ts
**Archivo:** `Monarca_Backend/monarca/src/app.module.ts`

**Cambiar `synchronize: false` por `synchronize: true`:**
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
  synchronize: true,  // ← Cambiar de false a true
}),
```

> ⚠️ **Nota:** `synchronize: true` crea automáticamente las tablas de la base de datos. **NO usar en producción.**

---

## 🎯 **6. Configuración del Frontend**

**Desde WSL:**
```bash
cd ~/Monarca/Monarca_Frontend

# Crear archivo .envrc
cat > .envrc << 'EOF'
source $HOME/.nvm/nvm.sh
nvm use
EOF

# Permitir direnv
direnv allow

# Crear .nvmrc
echo "20" > .nvmrc

# Crear archivo .env
echo 'VITE_API_URL=http://localhost:3000' > .env

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Frontend corriendo en:** http://localhost:5173

---

## 🎯 **7. Configuración del Backend**

**Desde otra terminal WSL:**
```bash
cd ~/Monarca/Monarca_Backend/monarca

# Crear archivo .envrc
cat > .envrc << 'EOF'
source $HOME/.nvm/nvm.sh
nvm use
EOF

# Permitir direnv
direnv allow

# Crear .nvmrc
echo "20" > .nvmrc

# Crear archivo .env
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

# Instalar dependencias
npm install

# Iniciar backend (creará las tablas automáticamente)
npm run start:dev
```

**Backend corriendo en:** http://localhost:3000

---

## 🌱 **8. Poblar la Base de Datos**

**Desde otra terminal WSL (esperar a que el backend termine de iniciar):**
```bash
cd ~/Monarca/Monarca_Backend/monarca
npm run db:seed
```

> ⏱️ Espera unos 10-15 segundos después de iniciar el backend antes de ejecutar el seed.

---

## ✅ **9. Credenciales de Acceso**

**Usuarios disponibles (todos con contraseña: `password`):**

| Rol | Email | Contraseña |
|-----|-------|------------|
| Requester (Solicitante) | `requester1@monarca.com` | `password` |
| Requester (Solicitante) | `requester2@monarca.com` | `password` |
| Approver (Aprobador) | `approver1@monarca.com` | `password` |
| SOI (Coordinador) | `soi1@monarca.com` | `password` |
| Travel Agent (Agente) | `travelagent1@monarca.com` | `password` |

---

## 📝 **Resumen de Servicios Corriendo**

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | Aplicación React |
| **Backend** | http://localhost:3000 | API NestJS |
| **API Docs** | http://localhost:3000/api | Documentación Swagger |
| **Database** | localhost:25000 | PostgreSQL |

---

## 🔄 **Comandos Útiles**

### Reiniciar servicios:
```bash
# Frontend
cd ~/Monarca/Monarca_Frontend
npm run dev

# Backend
cd ~/Monarca/Monarca_Backend/monarca
npm run start:dev
```

### Docker (desde PowerShell):
```powershell
# Ver contenedores corriendo
docker ps

# Ver todos los contenedores
docker ps -a

# Detener contenedor
docker stop monarca_database

# Iniciar contenedor
docker start monarca_database

# Ver logs del contenedor
docker logs monarca_database

# Reiniciar con compose
cd <TU_RUTA_WINDOWS>\Monarca_Backend
docker compose restart

# Eliminar contenedor y volúmenes
docker compose down -v
```

### Resetear base de datos:
```bash
cd ~/Monarca/Monarca_Backend/monarca

# Eliminar todos los datos
npm run db:drop

# Vaciar tablas (mantiene estructura)
npm run db:truncate

# Volver a poblar
npm run db:seed
```

---

## 🐛 **Solución de Problemas Comunes**

### Error: "Cannot find module @rollup/rollup-linux-x64-gnu"
**Causa:** Dependencias instaladas en Windows no son compatibles con WSL.  
**Solución:**
```bash
cd ~/Monarca/Monarca_Frontend
rm -rf node_modules package-lock.json
npm install
```

### Error: "EPERM: operation not permitted"
**Causa:** Estás trabajando en `/mnt/<unidad>/` (sistema de archivos de Windows montado) en lugar del sistema de archivos de Linux.  
**Solución:** Asegúrate de estar en `~/Monarca/` ejecutando `pwd`. Debe mostrar `/home/<tu_usuario>/Monarca/...` y **NO** `/mnt/...`

### Error: "relation 'users' does not exist"
**Causa:** Las tablas no se crearon o `synchronize` está en `false`.  
**Solución:**
1. Verificar que `synchronize: true` en `app.module.ts`
2. Reiniciar el backend (`Ctrl+C` y `npm run start:dev`)
3. Esperar a que inicie completamente
4. Ejecutar `npm run db:seed`

### Error: "Unable to connect to the database"
**Causa:** Docker no está corriendo o no es accesible desde WSL.  
**Solución:**
```powershell
# Desde PowerShell
docker ps
docker start monarca_database

# Esperar 10 segundos y desde WSL
cd ~/Monarca/Monarca_Backend/monarca
npm run start:dev
```

### Backend se reinicia constantemente
**Causa:** Error de TypeScript en los archivos modificados.  
**Solución:** Verificar que los cambios en `main.ts` y `app.module.ts` se copiaron correctamente desde Windows a la carpeta de Linux.

---

## 📚 **Referencias Adicionales**

- [Documentación oficial NestJS](https://docs.nestjs.com/)
- [Documentación oficial Vite](https://vitejs.dev/)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Desktop WSL 2 backend](https://docs.docker.com/desktop/wsl/)

---

## 🤝 **Contribuciones**

Para más información sobre cómo contribuir al proyecto, consulta [CONTRIBUTING.md](./monarca/CONTRIBUTING.md)

---

## 📄 **Licencia**

Este proyecto es privado y confidencial de 02 Solutions.
