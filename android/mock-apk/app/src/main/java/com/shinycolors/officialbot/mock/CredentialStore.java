package com.shinycolors.officialbot.mock;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

final class CredentialStore {
    private static final String STORE = "encrypted-credentials";
    private static final String KEYSTORE = "AndroidKeyStore";
    private static final String KEY_ALIAS = "official-bot-credentials-v1";
    private final Context context;

    CredentialStore(Context context) { this.context = context.getApplicationContext(); }

    void save(String name, String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey());
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        context.getSharedPreferences(STORE, Context.MODE_PRIVATE).edit()
                .putString(name + ".iv", Base64.getEncoder().encodeToString(cipher.getIV()))
                .putString(name + ".value", Base64.getEncoder().encodeToString(encrypted))
                .apply();
    }

    boolean has(String name) {
        return context.getSharedPreferences(STORE, Context.MODE_PRIVATE).contains(name + ".value");
    }

    String read(String name) throws Exception {
        android.content.SharedPreferences values = context.getSharedPreferences(STORE, Context.MODE_PRIVATE);
        byte[] iv = Base64.getDecoder().decode(values.getString(name + ".iv", ""));
        byte[] encrypted = Base64.getDecoder().decode(values.getString(name + ".value", ""));
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), new javax.crypto.spec.GCMParameterSpec(128, iv));
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore store = KeyStore.getInstance(KEYSTORE);
        store.load(null);
        if (store.containsAlias(KEY_ALIAS)) return ((KeyStore.SecretKeyEntry) store.getEntry(KEY_ALIAS, null)).getSecretKey();
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE);
        generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(128)
                .build());
        return generator.generateKey();
    }
}
