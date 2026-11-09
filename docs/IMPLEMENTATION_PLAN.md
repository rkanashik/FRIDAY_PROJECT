# FRIDAY Implementation Plan

This document outlines the phased rollout of the FRIDAY multi-device assistant.

## Phase 1: Foundation & Stabilization (Current)
**Goal**: Stabilize existing infrastructure, document the system, and establish a secure baseline for auth and chat.

*   **Infrastructure Audit**: Inspect existing Worker source, Supabase schema, and Web frontend.
*   **Documentation**: Create `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `API.md`, and `SECURITY.md`.
*   **Auth Stabilization**: Verify Supabase Auth integration across Web and Worker.
*   **Chat Baseline**: Ensure the `/v1/chat` endpoint is functioning and respects free-tier constraints.
*   **Repo Restructuring**: Organize the project into the defined directory structure (`friday-web`, `friday-worker`, etc.).

## Phase 2: Device Identity & Pairing
**Goal**: Enable the system to recognize and authorize multiple devices per user.

*   **Schema Migration**: Add `devices` and `device_pairing_codes` tables with strict RLS.
*   **Pairing Flow**: Implement the secure pairing process (Code Generation $\rightarrow$ Device Request $\rightarrow$ User Approval).
*   **Web Dashboard**: Create the device management UI in the Next.js frontend.
*   **Device Registry**: Implement API endpoints for device registration and heartbeats.

## Phase 3: Desktop Companion
**Goal**: Build the first hardware-interfacing client.

*   **Tauri Setup**: Initialize the Tauri 2 project.
*   **Platform Adapters**: Implement Rust-based adapters for Windows and Linux (App launching, Media controls).
*   **Device Integration**: Connect the Tauri app to the pairing and heartbeat APIs.
*   **System Tray**: Implement connection status and voice state indicators.

## Phase 4: Android Companion
**Goal**: Mobile integration and foreground voice sessions.

*   **Android Setup**: Initialize Kotlin/Compose project.
*   **Foreground Service**: Implement the active voice session service for persistent mic access.
*   **Mobile Pairing**: Implement the pairing flow on Android.
*   **Android Adapters**: Implement allowlisted Android actions.

## Phase 5: Secure Command Engine
**Goal**: Orchestrate actions across devices.

*   **Command Schema**: Implement `device_commands` table and lifecycle states.
*   **Command Routing**: Use Durable Objects to route commands to online devices.
*   **Approval System**: Implement the `awaiting_approval` flow for sensitive actions.
*   **Audit Logging**: Ensure all command executions are logged in `audit_events`.

## Phase 6: Voice System & LiveKit
**Goal**: Natural voice interaction.

*   **Voice Interfaces**: Define modular Speech-to-Text and Text-to-Speech interfaces.
*   **LiveKit Integration**: Implement server-side token generation in the Worker.
*   **Voice Agent**: Build the local LiveKit agent process for audio processing.
*   **Push-to-Talk**: Implement the initial voice interaction flow.

## Phase 7: Reliability & Hardening
**Goal**: Final polish and production readiness.

*   **Reconnection**: Implement exponential backoff for device reconnections.
*   **Security Audit**: Perform a full review of RLS policies and API boundaries.
*   **Reliability Testing**: Execute the multi-device failure scenarios.
*   **Production Hardening**: Optimize Worker performance and Supabase indices.
