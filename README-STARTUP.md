# Backend Startup & Database Connection Validation

This document explains how to correctly start the backend and database, and how to validate that the system is working using the `/health` endpoint.

---

## 1. Start the Database

Make sure Docker is running, then execute:

docker compose up -d db

Verify that the container is running:

docker ps

You should see the database container (e.g., monarca_database).

---

## 2. Environment Configuration

Create a `.env` file in the root of the backend project based on `.env.example`.

Example configuration:

JWT_SECRET=jwt
POSTGRES_HOST=localhost
POSTGRES_PORT=25000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=test123
POSTGRES_DATABASE=Monarca
DOWNLOAD_LINK=http://localhost:3000
FRONTEND_URL=http://localhost:5173
BMX_TOKEN=fd4f4ec10bcb0168228797f20007ff044fd281b311625e7d882a38e056ec2ad1
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=julio404012@gmail.com
EMAIL_PASSWORD="lhsf wdol koyk riin"

---

## 3. Install Dependencies

npm install

---

## 4. Run Migrations

npm run migration:run

Seed the database:

npm run db:seed

---

## 5. Start the Backend Server

npm run start:dev

Expected output:

Application is running on: https://127.0.0.1:3000

---

## 6. Health Check Endpoint

The `/health` endpoint is used to verify that the backend and database are working correctly.

### When everything is working

curl -k https://localhost:3000/health

Expected response:

{
  "status": "up",
  "database": "connected",
  "timestamp": "2026-XX-XXTXX:XX:XX.XXXZ"
}

---

### When database is down

Stop the database:

docker compose stop db

Then test again:

curl -k https://localhost:3000/health

Expected behavior:

{
  "status": "down",
  "database": "disconnected"
}

---

## 7. Troubleshooting

### Error: ECONNREFUSED

ECONNREFUSED ::1:25000

Solution:
- Make sure Docker is running
- Restart database:

docker compose up -d db

---

### Error: Empty reply from server

Solution:
- Make sure backend is running:

npm run start:dev

---

### Error: Port already in use

EADDRINUSE: 3000

Solution:

lsof -i :3000  
kill -9 <PID>

---

## Summary

To correctly start the system:

1. Start database (Docker)
2. Configure `.env`
3. Run migrations
4. Start backend
5. Validate using `/health`

---

## Notes

- Always start the database before the backend
- `/health` is used for monitoring and debugging
- Useful for deployment validation

---

## Future Improvements

- Integrate with monitoring tools (AWS, logs)
- Add response time metrics
- Validate external services (email, APIs)