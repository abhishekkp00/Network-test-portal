package com.example.networkportal.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class HostOrIpValidatorTest {

    private HostOrIpValidator validator;

    @BeforeEach
    void setUp() {
        validator = new HostOrIpValidator();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "google.com",
            "api.network-test-portal.internal",
            "sub-domain.example.co.uk",
            "server-01",
            "8.8.8.8",
            "192.168.1.254",
            "10.0.0.1",
            "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
            "::1"
    })
    @DisplayName("Should accept valid hostnames, IPv4, and IPv6 addresses")
    void testIsValid_ValidInputs(String input) {
        assertTrue(validator.isValid(input, null), "Expected valid input: " + input);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "google.com; cat /etc/passwd",
            "8.8.8.8 | nc -e /bin/bash",
            "$(whoami).example.com",
            "10.0.0.1 && rm -rf /",
            "test`id`host",
            "target.com\nmalicious",
            "target.com > /tmp/out",
            "host with spaces"
    })
    @DisplayName("Should reject inputs containing shell metacharacters or dangerous syntax")
    void testIsValid_ShellMetacharactersRejection(String input) {
        assertFalse(validator.isValid(input, null), "Expected rejection for dangerous input: " + input);
    }

    @Test
    @DisplayName("Should reject target string exceeding 253 characters DNS limit")
    void testIsValid_ExcessiveLengthRejection() {
        String longHost = "a".repeat(250) + ".com"; // 254 chars total
        assertFalse(validator.isValid(longHost, null));
    }

    @Test
    @DisplayName("Should allow null or empty string (delegate to @NotNull/@NotBlank)")
    void testIsValid_NullOrEmpty() {
        assertTrue(validator.isValid(null, null));
        assertTrue(validator.isValid("", null));
        assertTrue(validator.isValid("   ", null));
    }
}
