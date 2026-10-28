# Android porting plan

## Current evidence

The official QQ Bot runtime is a Node/DSH process. The workspace has no Android SDK, Gradle, adb, or Java toolchain installed, so no APK build has been attempted yet. The desktop runtime and all offline migration tests remain the reference implementation.

## Target split

The first Android deliverable uses two responsibilities:

1. **Bot Runtime** — owns the DSH process, QQ WebSocket, model relay, session persistence, reconnect, and foreground-service lifecycle.
2. **Control UI** — configures provider/model, role selection, quiet hours, logs, and start/stop state through a localhost-only API. It never handles QQ client login or hooks the QQ app.

The first APK milestone can keep the runtime process in a development carrier while the API and persistence contracts stabilize. A single APK is a later packaging step after the runtime can survive screen-off and process restart.

## Data boundaries

- QQ AppID/AppSecret and LLM API key are secrets; store them through Android Keystore-backed encryption in the final APK.
- Role presets, quiet-hours settings, session metadata, and audit summaries are ordinary app data.
- The runtime must bind its control API to loopback only and require an app-generated local session token.
- QQ traffic uses the official Bot WebSocket; no QQ client modification, ordinary-account injection, or NapCat is part of this route.

## Acceptance gates

1. Desktop relay route and official QQ Bot pass the existing live checklist.
2. Runtime can be stopped and restarted without losing role/session metadata.
3. A foreground service keeps the runtime alive while the screen is locked.
4. Network loss and recovery restore the QQ WebSocket without duplicating messages.
5. Android process death restores encrypted configuration and resumes cleanly.
6. Only after these pass, package the runtime and UI into a release APK.

## Next implementation step

The process/API contract is defined in [RUNTIME-DESIGN.md](./RUNTIME-DESIGN.md) and [runtime-contract.json](./runtime-contract.json). Install Android command-line tools and Gradle only under the workspace, then build a no-QQ mock APK that exercises the control API and encrypted configuration. Do not move the real QQ credentials into the APK until the mock lifecycle test passes.
