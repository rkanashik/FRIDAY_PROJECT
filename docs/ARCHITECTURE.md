# FRIDAY Architecture

FRIDAY is a unified, voice-first personal AI assistant operating across Android, Windows, Linux, and Web.

## System Overview

The system follows a hub-and-spoke architecture where a Cloudflare Workers backend acts as the central orchestrator, Supabase provides durable state and identity, and various client applications (Android, Desktop, Web) act as device endpoints.

### Core Components

1.  **Cloudflare Worker (`friday-worker`)**:
    *   **API Gateway**: Handles authentication, routing, and request validation.
    *   **Device Orchestrator**: Manages device pairing, heartbeats, and command routing.
    *   **AI Router**: Routes requests to available AI providers (Workers AI, Groq, Gemini) based on a free-tier-first policy.
    *   **Voice Session Manager**: Coordinates short-lived LiveKit tokens for voice interaction.
    *   **Durable Objects**: Used for real-time device coordination and session state.

2.  **Supabase (Backend-as-a-Service)**:
    *   **PostgreSQL**: Stores user profiles, device registries, conversation history, and command logs.
    *   **Auth**: Manages user identity and session tokens.
    *   **Realtime**: Notifies clients of pending commands or status changes.
    *   **RLS (Row Level Security)**: Ensures strict data isolation between users.

3.  **Client Applications**:
    *   **Web Control Center (`friday-web`)**: Next.js application for account management, device monitoring, and AI interaction.
    *   **Android Companion (`friday-android`)**: Kotlin/Compose app for mobile integration and voice sessions.
    *   **Desktop Companion (`friday-desktop`)**: Tauri/Rust app for Windows/Linux system automation.
    *   **Voice Agent (`friday-voice-agent`)**: A separate process managing WebRTC/LiveKit audio streams.

## Data Flow

### AI Interaction
User $\rightarrow$ Client $\rightarrow$ Cloudflare Worker $\rightarrow$ AI Provider $\rightarrow$ Cloudflare Worker $\rightarrow$ Client.

### Device Command Execution
AI $\rightarrow$ Cloudflare Worker $\rightarrow$ Supabase (Command Log) $\rightarrow$ Durable Object (Routing) $\rightarrow$ Device $\rightarrow$ Cloudflare Worker $\rightarrow$ Supabase (Result).

### Voice Session
Client $\rightarrow$ Cloudflare Worker (Token Request) $\rightarrow$ LiveKit $\rightarrow$ Voice Agent $\rightarrow$ AI Provider.

## Technology Stack
*   **Backend**: Cloudflare Workers, Durable Objects, Supabase.
*   **Frontend**: Next.js, TypeScript, Tailwind CSS.
*   **Android**: Kotlin, Jetpack Compose.
*   **Desktop**: Tauri 2, Rust, TypeScript.
*   **Voice**: LiveKit, WebRTC.
*   **AI**: Cloudflare Workers AI, Groq, Gemini.
