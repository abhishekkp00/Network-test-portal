package com.example.networkportal.security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.security.MessageDigest;

public class HmacSigner {

    public static String calculateHmac(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error computing HMAC-SHA256 signature", e);
        }
    }

    public static boolean verifySignature(String secret, String canonicalPayload, String expectedSignature) {
        if (secret == null || canonicalPayload == null || expectedSignature == null) {
            return false;
        }
        String calculated = calculateHmac(secret, canonicalPayload);
        return MessageDigest.isEqual(
                calculated.getBytes(StandardCharsets.UTF_8),
                expectedSignature.trim().getBytes(StandardCharsets.UTF_8)
        );
    }
}
