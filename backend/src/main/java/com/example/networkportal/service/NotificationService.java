package com.example.networkportal.service;

import com.example.networkportal.channel.EmailNotificationChannel;
import com.example.networkportal.entity.Incident;
import com.example.networkportal.entity.TestProfile;
import com.example.networkportal.entity.TestResult;
import com.example.networkportal.enums.IncidentSeverity;
import com.example.networkportal.enums.IncidentStatus;
import com.example.networkportal.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final RestTemplate restTemplate;
    private final IncidentRepository incidentRepository;
    private final EmailNotificationChannel emailChannel;

    @Value("${alerts.slack-webhook-url:}")
    private String slackWebhookUrl;

    @Value("${alerts.discord-webhook-url:}")
    private String discordWebhookUrl;

    @Value("${alerts.latency-threshold-ms:100.0}")
    private double latencyThresholdMs;

    @Value("${alerts.packet-loss-threshold-pct:5.0}")
    private double packetLossThresholdPct;

    @Transactional
    public void checkAndNotify(TestResult result) {
        if (result == null || result.getTestJob() == null || result.getTestJob().getProfile() == null) {
            return;
        }

        TestProfile profile = result.getTestJob().getProfile();

        log.info("[Alert Verification] Job #{}: Latency={} ms (Threshold={} ms) | Packet Loss={}% (Threshold={}%). Evaluating incident lifecycle...",
                result.getTestJob().getId(),
                result.getRttAvgMs() != null ? result.getRttAvgMs() : "N/A",
                latencyThresholdMs,
                result.getPacketLossPct() != null ? result.getPacketLossPct() : "N/A",
                packetLossThresholdPct);

        boolean highLoss = result.getPacketLossPct() != null && result.getPacketLossPct() > packetLossThresholdPct;
        boolean highLatency = result.getRttAvgMs() != null && result.getRttAvgMs() > latencyThresholdMs;
        boolean isViolation = highLoss || highLatency;

        Optional<Incident> activeIncidentOpt = incidentRepository
                .findFirstByProfileAndStatusInOrderByFirstSeenAtDesc(
                        profile,
                        List.of(IncidentStatus.OPEN, IncidentStatus.ONGOING)
                );

        if (isViolation) {
            handleMetricViolation(result, profile, highLoss, highLatency, activeIncidentOpt);
        } else {
            handleMetricRecovery(result, profile, activeIncidentOpt);
        }
    }

    private void handleMetricViolation(
            TestResult result,
            TestProfile profile,
            boolean highLoss,
            boolean highLatency,
            Optional<Incident> activeIncidentOpt
    ) {
        String violationDetail = String.format("%s%s",
                highLoss ? String.format("Packet Loss: %.1f%% (> %.1f%%). ", result.getPacketLossPct(), packetLossThresholdPct) : "",
                highLatency ? String.format("RTT Average: %.1fms (> %.1fms). ", result.getRttAvgMs(), latencyThresholdMs) : ""
        ).trim();

        IncidentSeverity severity = (highLoss && highLatency) ? IncidentSeverity.CRITICAL : IncidentSeverity.WARNING;

        if (activeIncidentOpt.isPresent()) {
            // Deduplication: Active incident exists. Update lifecycle state without sending duplicate alert notification.
            Incident incident = activeIncidentOpt.get();
            incident.setStatus(IncidentStatus.ONGOING);
            incident.setLastSeenAt(LocalDateTime.now());
            incident.setOccurrenceCount(incident.getOccurrenceCount() + 1);
            incident.setLatestResult(result);
            incident.setSummary(violationDetail);
            if (severity == IncidentSeverity.CRITICAL) {
                incident.setSeverity(IncidentSeverity.CRITICAL);
            }
            incidentRepository.save(incident);

            log.info("🚨 [ALERT DEDUPLICATED] Metric violation detected for profile '{}'. Updating active Incident #{} (Status: ONGOING, OccurrenceCount: {}). Suppressing new alert notification.",
                    profile.getName(), incident.getId(), incident.getOccurrenceCount());
        } else {
            // Create new Incident in OPEN state
            Incident incident = Incident.builder()
                    .profile(profile)
                    .latestResult(result)
                    .severity(severity)
                    .status(IncidentStatus.OPEN)
                    .firstSeenAt(LocalDateTime.now())
                    .lastSeenAt(LocalDateTime.now())
                    .occurrenceCount(1)
                    .summary(violationDetail)
                    .build();

            incident = incidentRepository.save(incident);

            log.warn("🚨 [NEW INCIDENT OPENED] Created Incident #{} for profile '{}'. Reason: {}",
                    incident.getId(), profile.getName(), violationDetail);

            String message = String.format("Incident #%d OPENED for profile '%s'. Details: %s",
                    incident.getId(), profile.getName(), violationDetail);

            dispatchAlert(message, incident, result, "INCIDENT OPEN");
        }
    }

    private void handleMetricRecovery(
            TestResult result,
            TestProfile profile,
            Optional<Incident> activeIncidentOpt
    ) {
        if (activeIncidentOpt.isPresent()) {
            Incident incident = activeIncidentOpt.get();
            incident.setStatus(IncidentStatus.RESOLVED);
            incident.setResolvedAt(LocalDateTime.now());
            incident.setLatestResult(result);
            incidentRepository.save(incident);

            log.info("✅ [RECOVERY DETECTED] Metrics for profile '{}' returned to normal. Resolved Incident #{}.",
                    profile.getName(), incident.getId());

            String message = String.format("Incident #%d RESOLVED for profile '%s'. Network metrics returned below threshold (Latency: %.1fms, Packet Loss: %.1f%%).",
                    incident.getId(), profile.getName(),
                    result.getRttAvgMs() != null ? result.getRttAvgMs() : 0.0,
                    result.getPacketLossPct() != null ? result.getPacketLossPct() : 0.0);

            dispatchAlert(message, incident, result, "INCIDENT RESOLVED");
        }
    }

    private void dispatchAlert(String message, Incident incident, TestResult result, String notificationType) {
        sendSlackAlert(message, incident, result);
        sendDiscordAlert(message, incident, result);
        emailChannel.sendIncidentEmail(incident, result, notificationType);
    }

    private void sendSlackAlert(String message, Incident incident, TestResult result) {
        if (slackWebhookUrl == null || slackWebhookUrl.trim().isEmpty()) {
            log.debug("Slack webhook URL is empty, skipping Slack alert.");
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("text", "🚨 *Network Test Portal Notification*\n" +
                    message + "\n" +
                    String.format("*Incident ID*: #%d | *Status*: %s | *Severity*: %s | *Job ID*: #%d",
                            incident.getId(),
                            incident.getStatus(),
                            incident.getSeverity(),
                            result.getTestJob().getId()
                    ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(slackWebhookUrl, entity, String.class);
            log.info("Successfully dispatched Slack webhook notification for Incident #{}.", incident.getId());
        } catch (Exception e) {
            log.error("Failed to send Slack alert webhook: {}", e.getMessage());
        }
    }

    private void sendDiscordAlert(String message, Incident incident, TestResult result) {
        if (discordWebhookUrl == null || discordWebhookUrl.trim().isEmpty()) {
            log.debug("Discord webhook URL is empty, skipping Discord alert.");
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("content", "🚨 **Network Test Portal Notification**\n" +
                    message + "\n" +
                    String.format("`Incident ID`: #%d | `Status`: %s | `Severity`: %s | `Job ID`: #%d",
                            incident.getId(),
                            incident.getStatus(),
                            incident.getSeverity(),
                            result.getTestJob().getId()
                    ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(discordWebhookUrl, entity, String.class);
            log.info("Successfully dispatched Discord webhook notification for Incident #{}.", incident.getId());
        } catch (Exception e) {
            log.error("Failed to send Discord alert webhook: {}", e.getMessage());
        }
    }
}
