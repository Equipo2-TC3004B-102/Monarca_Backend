# 02 Solutions

_Innovación en Tecnologías de la Información para Soluciones Empresariales Avanzadas_

<img src="./Contenido%2002%20Solutions/logo.jpeg" alt="Logo de 02 Solutions" width="300" height="300"/>

## 📚 Table of contents

- [Introduction]
- [Vision]
- [Mission]
- [Values]
- [📌 Proyecto Monarca]
- [🚀 Installation guides]
  - [🛠️ Requisitos y Herramientas]
  - [📥 Installation of the project]
  - [🐳 Starting and managing Docker services (PostgreSQL)]
  - [🔁 How to restart the Database]
- [🧪 Tests]
- [📑 API documentation]


## 📌 Introduction

Welcome to the official repository of 02 Solutions, a company that specializes in the development of advanced informational technologies solutions, dedicated to impulsing a digital transformation to companies through innovative tools, which are personalized and scalable.

---

## 🎯 Vision

**“To convert us in global leaders in the development of innovative, flexible and scalable technological solutions, that impulse the digital transformation and the operative efficiency of companies in diverse industries.”**

This vision will guide us in our growth and motivates us to continue innovating the creation of technological tools that give real value to our clients

---

## 💼 Mission

**“Design and implement advanced solutions in information technology that optimize corporate processes, fortify the innovation and generate a positive impact which is sustainable in the organizations.”**

Our mission impulses the development of personalized and scalable solutions, which are oriented towards solving complex corporate challenges through technology

---

## 💎 Values

In **02 Solutions**, our values are in the back-bone of each decision and development process we go through:

1. Innovation: We look for disruptive and creative solutions that solves real life challenges
2. Flexibility: We adapt to the specific necessities of each client, without rigid restrictions 
3. Transparency: We build a clear and open communication with ourselves as well as our clients
4. Collaborating: We believe in team work like a car engine to achieve great results
5. Quality: We commit to offer products and services to the highest standards
6. Security: We protect the information and data with solid updated protocols 
7. Compromise: We work with dedication and responsibility to reach our common goals


---

## **Proyecto Monarca**: Comprehensive business travel management system

Why **Monarca**?

The name makes reference to the iconic migrations of the monarch butterflies, which travel thousands of kilometers in a perfectly coordinated trip. This parallelism represents the essence of the project: facilitating, optimizing and coordinating corporate flights with the same precision and fluidness as the migrations of these butterflies. 

“Monarca” reflects our commitment to create solutions that not only optimize processes, but also provide seamless and efficient experiences for all involved users.

This platform will act as our “Single Repository of Truth”, guaranteeing that all official information and relevant decisions will be centralized and accessible to all group members

Corporate travel management can be limited due to high system costs, difficult to personalize and inflexibility. Our mission here at “Monarca” is to change that narrative, by creating a technological solution that is free of these constraints and capable of adapting to the needs specified from each company.


---

# 🏛️ **Arquitectura**

Framework: NestJS

DataBase: PostreSQL

ORM: TypeORM

Authentication: JWT


File structure

```md
src/
├─ auth/               # Login, register, refresh tokens
├─ jwt/                # JWT strategies and guards
├─ guards/             # Generic guards (RolesGuard, etc.)
├─ users/              # User CRUD
├─ roles/              # Role and permission management
├─ departments/        # Organizational units
├─ cost-centers/       # Cost centers, budget allocations
├─ travel-agencies/    # External travel agencies
├─ destinations/       # Available city destinations
├─ requests/           # Travel requests
├─ revisions/          # Approval and review workflows
├─ reservations/       # Reservations (hotels, flights)
├─ vouchers/           # Vouchers/Receipts 
├─ request-logs/       # History of actions on requests
├─ user-logs/          # HIstory of user activity
├─ utils/              # Helpers, filters, pipes
├─ app.module.ts       # Root module
└─ main.ts             # Entry point
```

---
# 🚀 Initialization Guide

## Recommended Local Workflow

- Backend: native process (Windows/macOS/Linux)
- Frontend: native process (Windows/macOS/Linux)
- Database: Docker (`Monarca_Backend/compose.yaml`)

On Windows, run the project from a local drive path like `D:\Escritorio\TEC\Ditta` or `C:\dev\Monarca`.
Avoid running npm from `\\wsl.localhost\...` paths in PowerShell/cmd, as they can fail with UNC path errors.

## Prerequisites

- Volta (Node runtime manager)
- Docker Desktop
- Git

Install Volta:

```powershell
winget install Volta.Volta
```

Pin versions:

```powershell
volta install node@22.14.0 npm@10.9.2
node -v
npm -v
```

## Backend Setup

From `Monarca_Backend/monarca`:

```bash
npm install
npm run setup
```

`npm run setup` performs:

- `.env` bootstrap from `.env.example` (if missing)
- required environment variable validation

Required backend variables in `.env`:

```env
JWT_SECRET=
POSTGRES_HOST=
POSTGRES_PORT=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
DOWNLOAD_LINK=
FRONTEND_URL=
```

## Run Backend

1. Start PostgreSQL from `Monarca_Backend`:

```bash
docker compose up -d
docker compose ps
```

2. Start backend from `Monarca_Backend/monarca`:

```bash
npm run dev
```

3. Optional seed:

```bash
npm run db:seed
```

## Team Note (Windows + WSL)

The team can keep WSL for optional workflows, but the official day-to-day path is now native Windows with Volta.
This keeps runtime versions consistent and avoids shell-specific setup issues.

## 🐳 Starting and managing Docker services (PostgreSQL)

This project uses the official `postgres:17-alpine` image configured in `compose.yaml`.

---
**Starting the services with Docker Compose:**

From the root of the project “Monarca Backend”, execute:

```bash
docker compose up -d
```

> This starts PostgreSQL and persists data in `Monarca_Backend/DB/postgres`.

Alternatively you can boot up the container through the Docker desktop, through the containers window and pressing click in Start over the corresponding button

---
**Stopping the containers**

To stop the containers through the terminal, run the following command:

```bash
# Stops all containers
docker compose stop

# Stops a specific container
docker stop <name_of_the_container>
```
> This stops the containers, but doesn’t delete and erase its data.

You can also stop the system by pressing in the “Stop” button in the docker desktop.

---
**Restarting stopped containers**

To restart the containers already created, execute the following:

```bash
# Starts everything back up
docker compose start

# Starts a specific container
docker start <name_of_the_container>
```
> This restarts all containers that were already created by the docker compose.

You can also start them by pressing the “Start” button in the desktop.


## Access options to enter the database

### Option A: Using pgAdmin

Through the pgAdmin app, we need to configure a new server using the following parameters:
- Name of server: MonarcaDB - (can be whatever name you want)
- Host: localhost
- Port: 25000 - (To verify the port, go to compose.yaml)
- User: postgres - (by default, unless indicated otherwise)
- Password: test123 - (if it doesn’t work, verify through “POSTGRES_PASSWORD” in compose.yaml)


### Option B: Through the terminal (no pgAdmin)

**Direct access to the database through the docker terminal:**

```bash
# docker exec -it <name of container> psql -U <DB user> -d <DB name>

docker exec -it monarca_database psql -U postgres -d Monarca
```
> This command gives u direct access to the interactive PostgreSQL console inside the docker container, connecting to the Monarca database as the user “postgres”.

## Optional compatibility tools

- `.nvmrc` is kept for compatibility.
- `.envrc` is optional for people already using direnv.
- Official and recommended runtime manager is Volta.


## Inserting data
Inside the terminal in the folder “Monarca_Backend/monarca”, run the following command:

```bash
npm run db:seed
```

> This command inserts dummy data in the seed folder into the database


## 🔁 Restarting the database



### Option A: Restart without eliminating the container

1. **Eliminate the current content:**

```bash
if you need to eliminate all of the data 
- npm run db:drop
if you only need to erase the tables
- npm run db:truncate

```
2. **Insert the dummy data again:**

```bash
npm run db:seed
```
> These commands need to be executed in the folder `Monarca_Backend/monarca`.

### Option B: Full restart 

1. **Eliminar la carpeta de datos:**

Eliminate the database folder manually through the terminal, the folder you want deleted is the folder “postgres” located in Monarca_Backend/DB

```bash
rm -rf Monarca_Backend/BD/postgres
```

2. **Reactivate the containers again by executing:**

In the Monarca_Backend root, execute again

```bash
docker compose up -d
```
> This recreate the database from 0, this also includes a new postgres folder.

3. **Reupload the dummy data :**

In the folder `Monarca_Backend/monarca`, execute:

```bash
npm run db:seed
```
This inserts the dummy data again



## 🧪 End-to-End tests

To run end-to-end tests, go to the folder “Monarca_Backend/monarca” and run the following command:

```bash
npm run test:e2e
```



## 📑 Endpoint documentation with OpenAI

All of the documentation for the endpoints is located and available in Swagger/OpenAI.

To access, visit the URL where the backend is running on and add “/api” at the end of the URL, for example:

http://localhost:3000/api

### 📦 Endpoint Example: Creating users:

```ts
// src/users/dto/create-user.dto.ts

/**
 * DTO para la creación de un nuevo usuario
 */

import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'Correo electrónico del usuario' })
  email: string;

  @ApiProperty({ example: 'John', description: 'Nombre del usuario' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Apellido del usuario' })
  lastName: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  password: string;
}

