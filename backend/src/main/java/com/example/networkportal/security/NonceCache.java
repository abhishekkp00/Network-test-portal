package com.example.networkportal.security;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class NonceCache {

    private static final long TTL_MS = 5 * 60 * 1000L; // 5 minutes window
    private final Map<String, Long> nonceMap = new ConcurrentHashMap<>();

    public synchronized boolean isNonceReplayed(String nonce, long currentMillis) {
        cleanExpiredNonces(currentMillis);
        if (nonce == null || nonce.trim().isEmpty()) {
            return true;
        }
        String cleanNonce = nonce.trim();
        if (nonceMap.containsKey(cleanNonce)) {
            return true; // Replayed nonce!
        }
        nonceMap.put(cleanNonce, currentMillis + TTL_MS);
        return false;
    }

    private void cleanExpiredNonces(long currentMillis) {
        nonceMap.entrySet().removeIf(entry -> entry.getValue() < currentMillis);
    }
}
