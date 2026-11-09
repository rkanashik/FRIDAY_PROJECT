# FRIDAY API Specification

## Base URL
`https://friday.rkanashik.workers.dev`

## Authentication
All protected routes require a Supabase JWT in the `Authorization: Bearer <token>` header.

## Endpoints

### 1. System & Health
*   `GET /health`
    *   **Description**: Health check and provider status.
    *   **Response**: `{ service, status, environment, authConfigured, primaryProvider, fallbackProvider, budgetMode, aiReady }`

### 2. Authentication
*   `POST /v1/auth/verify`
    *   **Description**: Verifies the current session token.
    *   **Response**: `{ authenticated: true, userId: "uuid" }`

### 3. AI & Chat
*   `POST /v1/chat`
    *   **Description**: Main text interaction endpoint.
    *   **Request**: `{ message: "string" }`
    *   **Response**: `{ reply: "string", provider: "string", fallback: boolean }`

### 4. Device Management (Phase 2+)
*   `POST /v1/devices/pairing/start`
    *   **Description**: Generates a pairing code for a new device.
*   `POST /v1/devices/pairing/complete`
    *   **Description**: Completes the pairing process using a code.
*   `GET /v1/devices`
    *   **Description**: Lists all devices owned by the user.
*   `POST /v1/devices/:id/heartbeat`
    *   **Description**: Updates device online status.
*   `POST /v1/devices/:id/capabilities`
    *   **Description**: Registers device capabilities.
*   `DELETE /v1/devices/:id`
    *   **Description**: Revokes a device.

### 5. Command Engine (Phase 5+)
*   `POST /v1/commands`
    *   **Description**: Creates a new command for a device.
*   `POST /v1/commands/:id/approve`
    *   **Description**: Approves a pending command.
*   `POST /v1/commands/:id/result`
    *   **Description**: Submits the execution result from a device.

### 6. Voice (Phase 6+)
*   `POST /v1/voice/session`
    *   **Description**: Generates a LiveKit token for a voice session.
