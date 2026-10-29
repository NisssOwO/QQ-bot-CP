package com.shinycolors.officialbot.mock;

import android.content.Context;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

final class RuntimeAssetInstaller {
    private RuntimeAssetInstaller() { }

    static File install(Context context) throws IOException {
        File target = new File(context.getFilesDir(), "runtime");
        String version = "node26-bundle-v28";
        if (!version.equals(context.getSharedPreferences("runtime", Context.MODE_PRIVATE).getString("assetVersion", ""))) {
            context.getSharedPreferences("runtime", Context.MODE_PRIVATE).edit().putString("assetVersion", version).remove("runtimeInstallError").apply();
        }
        copyTree(context, "runtime", target);
        // Update patched runtime code without deleting user presets and per-peer settings.
        copyFile(context, "runtime/node_modules/@tencent-connect/dsh-qqbot/dist/model/prefs-store.js",
                new File(target, "node_modules/@tencent-connect/dsh-qqbot/dist/model/prefs-store.js"), true);
        copyFile(context, "runtime/node_modules/@tencent-connect/dsh-qqbot/dist/session/session-manager.js",
                new File(target, "node_modules/@tencent-connect/dsh-qqbot/dist/session/session-manager.js"), true);
        File node = new File(target, "bin/node");
        node.setExecutable(true, false);
        File execDir = context.getCodeCacheDir();
        File execNode = new File(execDir, "node");
        File execCpp = new File(execDir, "libc++_shared.so");
        copyFile(context, "runtime/bin/node", execNode);
        copyFile(context, "runtime/bin/libc++_shared.so", execCpp);
        execNode.setExecutable(true, false);
        return target;
    }

    private static void deleteTree(File file) {
        if (!file.exists()) return;
        File[] children = file.listFiles();
        if (children != null) for (File child : children) deleteTree(child);
        file.delete();
    }

    private static void copyTree(Context context, String assetPath, File target) throws IOException {
        String[] children = context.getAssets().list(assetPath);
        if (children == null || children.length == 0) {
            copyFile(context, assetPath, target);
            return;
        }
        if (!target.exists() && !target.mkdirs()) throw new IOException("cannot create " + target);
        for (String child : children) copyTree(context, assetPath + "/" + child, new File(target, child));
    }

    private static void copyFile(Context context, String assetPath, File target) throws IOException {
        copyFile(context, assetPath, target, false);
    }

    private static void copyFile(Context context, String assetPath, File target, boolean force) throws IOException {
        if (!force && target.exists() && target.length() > 0) return;
        File parent = target.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) throw new IOException("cannot create " + parent);
        try (InputStream input = context.getAssets().open(assetPath); FileOutputStream output = new FileOutputStream(target)) {
            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) >= 0) output.write(buffer, 0, count);
        }
    }
}


