# Official Bot Mock APK

This is the first Android host skeleton. It does not contain QQ credentials, does not connect to QQ, and does not call an LLM. It only validates the foreground-service lifecycle and the Control UI boundary.

Build requirements:

- JDK 17
- Gradle 8.9 or newer compatible with Android Gradle Plugin 8.7.3
- Android SDK platform 35 and build tools

From PowerShell, build with `..\build-mock-apk.ps1`; it sets all F-drive tool paths automatically.

The next implementation step is replacing the in-process mock state with the localhost API from `../RUNTIME-DESIGN.md`, then adding Keystore-backed credential storage.
