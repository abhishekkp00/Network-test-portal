package com.example.networkportal.validation;

import com.example.networkportal.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.UnknownHostException;

@Service
@RequiredArgsConstructor
@Slf4j
public class NetworkTargetProtectionService {

    @Value("${workers.target-protection.enabled:true}")
    private boolean protectionEnabled = true;

    @Value("${workers.target-protection.allow-loopback:false}")
    private boolean allowLoopback = false;

    public void validateTarget(String target) {
        if (!protectionEnabled || target == null || target.trim().isEmpty()) {
            return;
        }

        String cleanedTarget = target.trim().toLowerCase();

        // Direct string checks for known Cloud Metadata endpoints & loopback aliases
        if (cleanedTarget.equals("169.254.169.254") ||
            cleanedTarget.equals("metadata.google.internal") ||
            cleanedTarget.equals("169.254.169.254.xip.io")) {
            throw new BadRequestException("Target '" + target + "' is a prohibited cloud infrastructure metadata endpoint");
        }

        if (!allowLoopback && (
                cleanedTarget.equals("localhost") ||
                cleanedTarget.equals("127.0.0.1") ||
                cleanedTarget.equals("::1") ||
                cleanedTarget.startsWith("127.")
        )) {
            throw new BadRequestException("Target '" + target + "' is a prohibited loopback target");
        }

        try {
            InetAddress address = InetAddress.getByName(cleanedTarget);

            if (!allowLoopback && (address.isLoopbackAddress() || address.isAnyLocalAddress())) {
                throw new BadRequestException("Target IP '" + address.getHostAddress() + "' is a prohibited loopback / local target");
            }

            if (address.isLinkLocalAddress()) {
                throw new BadRequestException("Target IP '" + address.getHostAddress() + "' is a prohibited link-local target");
            }

            if (address.isMulticastAddress()) {
                throw new BadRequestException("Target IP '" + address.getHostAddress() + "' is a prohibited multicast target");
            }

            byte[] bytes = address.getAddress();
            // Check for Cloud Metadata IP 169.254.169.254
            if (bytes.length == 4 && (bytes[0] & 0xFF) == 169 && (bytes[1] & 0xFF) == 254 && (bytes[2] & 0xFF) == 169 && (bytes[3] & 0xFF) == 254) {
                throw new BadRequestException("Target IP '" + address.getHostAddress() + "' is a prohibited metadata target");
            }

        } catch (UnknownHostException e) {
            log.debug("Target '{}' could not be resolved by DNS during pre-validation", target);
        }
    }
}
