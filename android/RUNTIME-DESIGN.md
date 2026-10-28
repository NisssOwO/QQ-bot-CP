# Android Runtime Design

## Process model

The first Android build has two layers inside one APK:

- **Bot Runtime service**: a foreground service that owns the DSH process, official QQ Bot WebSocket, model requests, reconnects, deduplication, and session storage.
- **Control UI**: an Activity/WebView that talks to the service through a loopback HTTP API. It never talks to QQ directly.

The service must continue while the screen is off. The Activity may be destroyed and recreated without stopping the service.

## Local API

The service binds to `127.0.0.1` on an ephemeral port. The UI receives the port and a random 256-bit bearer token from the service when it starts. Every request includes `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/v1/status` | Runtime state, uptime, last error, reconnect count |
| POST | `/v1/runtime/start` | Start the bot runtime |
| POST | `/v1/runtime/stop` | Stop the bot runtime cleanly |
| POST | `/v1/runtime/restart` | Stop, then start with the same configuration |
| GET | `/v1/config/public` | Non-secret provider, model, role, and quiet-hours settings |
| PUT | `/v1/config/public` | Update non-secret settings |
| POST | `/v1/config/credentials` | Replace credentials through the Keystore-backed store |
| GET | `/v1/roles` | List role IDs, display names, and aliases |
| POST | `/v1/session/new` | Clear one peer session or create a new session boundary |
| GET | `/v1/logs?limit=100` | Read redacted recent logs |
| GET | `/v1/events` | Server-sent events for status and log updates |

The API returns structured errors with `code`, `message`, and `retryable`. It never returns credential values.

## Persistent data

Use an app-private Room/SQLite database for ordinary data:

- `settings`: provider, model, Base URL, default role, quiet hours;
- `role_bindings`: `scope`, `peer_id`, `role_id`, updated time;
- `session_meta`: `scope`, `peer_id`, session ID, last activity;
- `audit_events`: redacted event type, timestamp, and outcome.

Store AppSecret and model API key as separate encrypted values using Android Keystore. The database stores only aliases and metadata for those values.

## Runtime state machine

`STOPPED -> STARTING -> ONLINE` is the normal path. Network loss enters `RECONNECTING`; bounded exponential backoff returns to `ONLINE`. Configuration changes enter `RESTART_REQUIRED` and are applied only after a controlled restart. Fatal configuration errors enter `ERROR` and remain stopped until the UI supplies a correction.

Message handling keeps the existing desktop order: normalize event, apply trigger policy, deduplicate, resolve role by `scope:peer_id`, call the relay, chunk the response, send, and write a redacted audit record.

## Android lifecycle requirements

- Use a foreground service with a visible low-priority notification while the runtime is online.
- Request battery-optimization exemption only as an explicit user action from the UI.
- On service restart, load encrypted configuration, restore role bindings and session metadata, then reconnect the official WebSocket.
- On process death, do not replay unacknowledged outbound messages automatically; mark them for audit and require a fresh event.
- Bind only to loopback and reject requests without the per-install token.

## First implementation boundary

The mock APK will implement `/v1/status`, `/v1/runtime/start`, `/v1/runtime/stop`, `/v1/roles`, and `/v1/logs` with a fake QQ event source. Real credentials and the official QQ WebSocket are added only after service restart, screen-off, and process-death tests pass.
