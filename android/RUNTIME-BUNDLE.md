# Android Runtime Bundle

The APK service launches a private Node runtime from `filesDir/runtime` through `runtime-entry.mjs`. The selected target is a standalone Node 26 Android arm64 binary; Node.js Mobile v18 is unsuitable because the DSH package requires Node 22.19 or newer.

The bundle contains:

- the Node executable for the device ABI;
- `runtime-entry.mjs`;
- the DSH packages required by the official QQ Bot profile;
- `presets/` and the local `role-presets` service;
- a generated `.dsh-home/profiles/qqbot` profile without secrets.

App credentials are loaded from Android Keystore at runtime and passed only as child-process environment variables. They are never copied into the bundle, assets, APK resources, or ordinary configuration files.

The APK assets now include the arm64 `node` and `libc++_shared.so`; the Service copies them to `filesDir/runtime/bin` on first start. The controller refuses to start if the installed carrier is incomplete, so a partial install cannot appear online.
