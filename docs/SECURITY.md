# FRIDAY Security Specification

## Security Principles
1.  **Zero Trust Device Access**: No device is trusted until paired and verified.
2.  **Least Privilege**: Devices only possess capabilities they have explicitly registered.
3.  **User-in-the-Loop**: Sensitive actions require explicit user approval.
4.  **Data Isolation**: Strict RLS on Supabase ensures users cannot access other users' data.
5.  **Secret Protection**: No service-role keys or provider secrets are ever exposed to clients.

## Threat Model & Mitigations

| Threat | Mitigation |
| :--- | :--- |
| Unauthorized Device Access | Short-lived, single-use pairing codes bound to a specific user. |
| Command Injection | Strict allowlist of actions; parameters are validated against schemas. |
| Privilege Escalation | Backend-side validation of device ownership and capability registration. |
| Data Leakage | Supabase RLS policies on all user-facing tables. |
| Secret Exposure | Use of Cloudflare Worker environment variables and Supabase Auth tokens. |
| AI-driven Malicious Action | AI only proposes actions; the backend validates and (if required) the user approves. |

## Implementation Details

### Device Pairing
1.  User generates code $\rightarrow$ stored in `device_pairing_codes` with expiry.
2.  New device requests pairing with code $\rightarrow$ backend verifies code and ownership.
3.  Backend creates record in `devices` $\rightarrow$ device receives session.

### Command Validation Pipeline
Every command must pass these checks on the backend before dispatch:
1.  `isAuthenticated(user)`
2.  `isDeviceOwnedByUser(user, device)`
3.  `isDeviceOnline(device)`
4.  `isActionAllowlisted(action)`
5.  `hasDeviceCapability(device, action)`
6.  `hasUserPermission(user, action)`
7.  `checkApprovalRequirement(action)`

### RLS Policy Guidelines
*   `profiles`: `auth.uid() = id`
*   `devices`: `auth.uid() = user_id`
*   `conversations`: `auth.uid() = user_id`
*   `messages`: `auth.uid() = user_id` (Restrict inserts of `role='assistant'`).
*   `device_commands`: `auth.uid() = user_id`
