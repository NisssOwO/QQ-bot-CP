package com.shinycolors.officialbot.mock;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.IBinder;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.net.ServerSocket;
import java.security.SecureRandom;
import java.util.Base64;

public final class BotRuntimeService extends Service {
    static final String PREFS = "runtime";
    private ServerSocket serverSocket;
    private Thread serverThread;
    private RuntimeProcessController runtimeController;

    @Override public void onCreate() {
        super.onCreate();
        runtimeController = new RuntimeProcessController(this);
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.createNotificationChannel(new NotificationChannel("runtime", "Bot Runtime", NotificationManager.IMPORTANCE_LOW));
        Notification notification = new Notification.Builder(this, "runtime")
                .setContentTitle("Official Bot Mock")
                .setContentText("模拟 Runtime 正在运行")
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .build();
        startForeground(1001, notification);
        new Thread(this::initializeRuntime, "runtime-bootstrap").start();
    }

    private void initializeRuntime() {
        try {
            RuntimeAssetInstaller.install(this);
            serverSocket = new ServerSocket(0, 32, java.net.InetAddress.getByName("127.0.0.1"));
            byte[] tokenBytes = new byte[32];
            new SecureRandom().nextBytes(tokenBytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
            getSharedPreferences(PREFS, MODE_PRIVATE).edit()
                    .putInt("port", serverSocket.getLocalPort())
                    .putString("token", token)
                    .putBoolean("running", true)
                    .apply();
            serverThread = new Thread(new LoopbackApiServer(this, serverSocket, token), "mock-loopback-api");
            serverThread.start();
            startRealRuntimeIfAvailable();
        } catch (Exception error) {
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString("runtimeInstallError", error.getMessage()).apply();
            stopSelf();
        }
    }

    private void startRealRuntimeIfAvailable() {
        if (!runtimeController.carrierAvailable()) return;
        try {
            CredentialStore store = new CredentialStore(this);
            if (!store.has("qqbotAppId") || !store.has("qqbotSecret") || !store.has("llmApiKey")) return;
            Map<String, String> env = new HashMap<>();
            env.put("QQBOT_APPID", store.read("qqbotAppId"));
            env.put("QQBOT_SECRET", store.read("qqbotSecret"));
            env.put("LLM_API_KEY", store.read("llmApiKey"));
            android.content.SharedPreferences config = getSharedPreferences("public-config", MODE_PRIVATE);
            env.put("LLM_PROVIDER", config.getString("provider", "relay"));
            env.put("LLM_MODEL", config.getString("model", "deepseek-chat"));
            env.put("LLM_BASE_URL", config.getString("baseUrl", "https://api.example.com/v1"));
            runtimeController.start(env);
        } catch (Exception error) {
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString("runtimeStartError", error.toString()).apply();
        }
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) { return START_STICKY; }
    @Override public IBinder onBind(Intent intent) { return null; }

    @Override public void onDestroy() {
        if (runtimeController != null) runtimeController.stop();
        getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean("running", false).apply();
        if (serverSocket != null) try { serverSocket.close(); } catch (IOException ignored) { }
        super.onDestroy();
    }
}
