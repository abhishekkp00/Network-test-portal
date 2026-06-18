package com.example.networkportal.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class HostOrIpValidator implements ConstraintValidator<HostOrIp, String> {

    // RFC 1123 hostname pattern: allows alphanumeric, hyphens, and dots
    private static final Pattern HOSTNAME_PATTERN = Pattern.compile(
            "^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]*[a-zA-Z0-9])\\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\\-]*[A-Za-z0-9])$"
    );

    // IPv4 pattern
    private static final Pattern IPV4_PATTERN = Pattern.compile(
            "^(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$"
    );

    // IPv6 pattern (matches hex digits, colons, and optional compression)
    private static final Pattern IPV6_PATTERN = Pattern.compile(
            "^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$"
    );

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Let @NotNull or @NotBlank handle empty fields if necessary
        }

        String trimmedValue = value.trim();

        // 1. Length restriction (hostnames are maximum 253 characters in DNS RFCs)
        if (trimmedValue.length() > 253) {
            return false;
        }

        // 2. Reject shell metacharacters and spaces (strict shell sanitization)
        if (containsShellMetacharacters(trimmedValue)) {
            return false;
        }

        // 3. Match against IPv4 pattern
        if (IPV4_PATTERN.matcher(trimmedValue).matches()) {
            return true;
        }

        // 4. Match against IPv6 pattern
        if (IPV6_PATTERN.matcher(trimmedValue).matches()) {
            return true;
        }

        // 5. Match against RFC 1123 Hostname pattern
        return HOSTNAME_PATTERN.matcher(trimmedValue).matches();
    }

    private boolean containsShellMetacharacters(String value) {
        // Characters commonly used in shell redirection, pipelining, and variable expansion
        char[] dangerousChars = {';', '&', '|', '`', '$', '(', ')', '<', '>', '\n', '\r', ' ', '\t', '\'', '\"', '*', '?'};
        for (char c : dangerousChars) {
            if (value.indexOf(c) >= 0) {
                return true;
            }
        }
        return false;
    }
}
