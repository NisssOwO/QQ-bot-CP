# QQ-bot-CP Android APK

This Android host runs the bundled arm64 Node Runtime and DSH official QQ Bot profile through a foreground service. Credentials are stored with Android Keystore and are not included in the repository.

Build requirements:

- JDK 17
- Gradle 8.9 or newer compatible with Android Gradle Plugin 8.7.3
- Android SDK platform 35 and build tools

From PowerShell, build with `..\build-mock-apk.ps1`; it sets all F-drive tool paths automatically.

The manual APK script also packages the current runtime closure. The generated APK is intentionally excluded from Git and should be uploaded as a GitHub Release asset.
