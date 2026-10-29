package com.shinycolors.officialbot.mock;

import android.content.Context;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

final class RuntimeProcessController {
    private final Context context;
    private Process process;

    RuntimeProcessController(Context context) { this.context = context.getApplicationContext(); }

    synchronized void start(Map<String, String> environment) throws IOException {
        if (process != null && process.isAlive()) return;
        File runtimeRoot = new File(context.getFilesDir(), "runtime");
        File node = new File(context.getApplicationInfo().nativeLibraryDir, "libnode.so");
        File entry = new File(runtimeRoot, "runtime-entry.mjs");
        if (!node.isFile() || !node.canExecute() || !entry.isFile()) {
            throw new IOException("runtime carrier is incomplete");
        }
        List<String> command = new ArrayList<>();
        command.add(node.getAbsolutePath());
        command.add(entry.getAbsolutePath());
        ProcessBuilder builder = new ProcessBuilder(command).directory(runtimeRoot);
        Map<String, String> env = builder.environment();
        env.putAll(environment);
        env.put("SHINY_RUNTIME_ROOT", runtimeRoot.getAbsolutePath());
        env.put("SHINY_NODE_BIN", node.getAbsolutePath());
        env.put("LD_LIBRARY_PATH", context.getApplicationInfo().nativeLibraryDir);
        process = builder.start();
        context.getSharedPreferences(BotRuntimeService.PREFS, Context.MODE_PRIVATE)
                .edit().remove("runtimeLastError").remove("runtimeStartError").remove("runtimeInstallError")
                .remove("runtimeExitCode").remove("runtimeWarnings").putBoolean("runtimeRestarting", false)
                .putBoolean("runtimeProcessAlive", true).putBoolean("running", true).apply();
        Thread watcher = new Thread(() -> {
            try (java.io.BufferedReader errors = new java.io.BufferedReader(new java.io.InputStreamReader(process.getErrorStream()))) {
                String line;
                while ((line = errors.readLine()) != null) append(isNonFatalWarning(line) ? "runtimeWarnings" : "runtimeLastError", line);
            } catch (IOException ignored) { }
            try {
                int exit = process.waitFor();
                context.getSharedPreferences(BotRuntimeService.PREFS, Context.MODE_PRIVATE).edit()
                        .putInt("runtimeExitCode", exit).putBoolean("runtimeProcessAlive", false).putBoolean("running", false).apply();
            } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
        }, "runtime-process-watcher");
        Thread output = new Thread(() -> {
            try (java.io.BufferedReader lines = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = lines.readLine()) != null) {
                    append("runtimeLastOutput", line);
                }
            } catch (IOException ignored) { }
        }, "runtime-process-output");
        output.setDaemon(true);
        output.start();
        watcher.setDaemon(true);
        watcher.start();
    }

    private void append(String key, String line) {
        android.content.SharedPreferences prefs = context.getSharedPreferences(BotRuntimeService.PREFS, Context.MODE_PRIVATE);
        String old = prefs.getString(key, "");
        String next = old.isEmpty() ? line : old + "\n" + line;
        if (next.length() > 8192) next = next.substring(next.length() - 8192);
        prefs.edit().putString(key, next).apply();
    }

    private static boolean isNonFatalWarning(String line) {
        String value = line == null ? "" : line;
        return value.contains("dsh: warning:") || value.contains("plugin-manager")
                || value.contains("dsh-otel") || value.contains("session-telemetry-otel");
    }

    boolean carrierAvailable() {
        File runtimeRoot = new File(context.getFilesDir(), "runtime");
        File node = new File(context.getApplicationInfo().nativeLibraryDir, "libnode.so");
        return node.isFile() && node.canExecute() && new File(runtimeRoot, "runtime-entry.mjs").isFile();
    }

    synchronized void stop() {
        if (process != null) process.destroy();
        process = null;
        context.getSharedPreferences(BotRuntimeService.PREFS, Context.MODE_PRIVATE)
                .edit().putBoolean("runtimeProcessAlive", false).putBoolean("running", false).apply();
    }

    synchronized boolean isRunning() { return process != null && process.isAlive(); }
}
