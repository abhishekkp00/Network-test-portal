# Network Test Automation Portal 2026

A secure, enterprise-ready orchestration engine for network test automation, built with Spring Boot 3, Java 17, Spring Security + JWT, PostgreSQL, and Python workers.

---

## 1. System Requirements

*   **Java**: JDK 17 or higher
*   **Maven**: 3.8+
*   **Docker & Docker Compose** (for PostgreSQL)
*   **Python**: 3.10+
*   **Linux Networking Utils**: `ping` and `iperf3` (for local worker executions)

---

## 2. Setting Up Local Environment

### Step A: System Utilities Installation (Debian/Ubuntu)
Make sure `iperf3` and standard `ping` tools are installed and available on your system path.
```bash
sudo apt update
sudo apt install iperf3 iputils-ping -y
```

### Step B: Launch Database
Start the PostgreSQL container:
```bash
docker compose up -d
```

### Step C: Build and Run Spring Boot Application
1. Go to the backend folder:
   ```bash
   cd backend
   ```
2. Build the project:
   ```bash
   mvn clean install
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   *The server starts on port `8080`.*
   *A default user is automatically seeded on startup:*
   *   **Username**: `admin`
   *   **Password**: `adminpassword`
   *   **Role**: `ADMIN`

---

## 3. API Walkthrough & Verification Flow

### 1. Authenticate (Login as Admin)
Retrieve your bearer token:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "adminpassword"}'
```
**Expected Response:**
```json
{
  "token": "eyJhbGciOi...",
  "username": "admin",
  "email": "admin@example.com",
  "role": "ADMIN"
}
```
*Export this token to a variable for ease of testing:*
```bash
export JWT_TOKEN="eyJhbGciOi..."
```

---

### 2. Create a Test Profile (As Operator/Admin)
Create a new profile configuring a Ping test to Google DNS:
```bash
curl -X POST http://localhost:8080/api/v1/profiles \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Google DNS Ping",
    "description": "Ping test to Google Primary DNS",
    "host": "8.8.8.8",
    "protocol": "PING",
    "count": 5
  }'
```
**Expected Response:**
```json
{
  "id": 1,
  "name": "Google DNS Ping",
  "description": "Ping test to Google Primary DNS",
  "host": "8.8.8.8",
  "server": null,
  "protocol": "PING",
  "count": 5,
  "durationSeconds": null,
  "port": null,
  "notes": null,
  "createdByUsername": "admin"
}
```

---

### 3. Create a Test Job (Trigger Execution)
Trigger a test job from the profile created:
```bash
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profileId": 1}'
```
**Expected Response:**
```json
{
  "id": 1,
  "profileId": 1,
  "profileName": "Google DNS Ping",
  "requestedByUsername": "admin",
  "status": "PENDING",
  "effectiveHost": "8.8.8.8",
  "effectiveServer": null,
  "effectiveProtocol": "PING",
  "effectiveCount": 5,
  "effectiveDurationSeconds": null,
  "effectivePort": null,
  "startedAt": null,
  "finishedAt": null
}
```

---

### 4. Fetch Job Status & Results
Poll the job details or request the result once status changes to `SUCCESS` or `FAILED`:

#### Retrieve Job
```bash
curl -X GET http://localhost:8080/api/v1/jobs/1 \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### Retrieve Specific Result
```bash
curl -X GET http://localhost:8080/api/v1/jobs/1/result \
  -H "Authorization: Bearer $JWT_TOKEN"
```
**Expected Output (Truncated):**
```json
{
  "id": 1,
  "jobId": 1,
  "packetLossPct": 0.0,
  "throughputMbps": null,
  "rttMinMs": 8.12,
  "rttAvgMs": 12.45,
  "rttMaxMs": 17.01,
  "jitterMs": 1.54,
  "rawOutput": "...",
  "errorMessage": null,
  "exitCode": 0,
  "parsedStatus": "SUCCESS"
}
```

---

### 5. Fetch Audit Logs (Admin Only)
Verify security audit records:
```bash
curl -X GET http://localhost:8080/api/v1/audit-logs \
  -H "Authorization: Bearer $JWT_TOKEN"
```
