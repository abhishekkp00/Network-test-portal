package com.example.networkportal.service;

import com.example.networkportal.entity.TestResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class NotificationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ALERTS_SLACK_WEBHOOK_URL:}")
    private String slackWebhookUrl;

    @Value("${ALERTS_DISCORD_WEBHOOK_URL:}")
    private String discordWebhookUrl;

    @Value("${ALERTS_EMAIL_RECIPIENT:}")
    private String emailRecipient;

    @Value("${ALERTS_LATENCY_THRESHOLD_MS:100.0}")
    private double latencyThresholdMs;

    @Value("${ALERTS_PACKET_LOSS_THRESHOLD_PCT:5.0}")
    private double packetLossThresholdPct;

    public void checkAndNotify(TestResult result) {
        if (result == null) return;

        log.info("[Alert Verification] Job #{}: Latency={} ms (Threshold={} ms) | Packet Loss={}% (Threshold={}%). Checking alert triggers...",
                result.getTestJob().getId(),
                result.getRttAvgMs() != null ? result.getRttAvgMs() : "N/A",
                latencyThresholdMs,
                result.getPacketLossPct() != null ? result.getPacketLossPct() : "N/A",
                packetLossThresholdPct);

        boolean highLoss = result.getPacketLossPct() != null && result.getPacketLossPct() > packetLossThresholdPct;
        boolean highLatency = result.getRttAvgMs() != null && result.getRttAvgMs() > latencyThresholdMs;

        if (highLoss || highLatency) {
            String reason = String.format("Outage/degradation warning detected for profile '%s'. Details: %s%s",
                    result.getTestJob().getProfile().getName(),
                    highLoss ? String.format("Packet Loss: %.1f%% (> %.1f%%). ", result.getPacketLossPct(), packetLossThresholdPct) : "",
                    highLatency ? String.format("RTT Average: %.1fms (> %.1fms). ", result.getRttAvgMs(), latencyThresholdMs) : ""
            );

            log.warn("🚨 ALERT DISPATCH TRIGGERED: {}", reason);

            sendSlackAlert(reason, result);
            sendDiscordAlert(reason, result);
            sendEmailAlert(reason, result);
        }
    }

    private void sendSlackAlert(String message, TestResult result) {
        if (slackWebhookUrl == null || slackWebhookUrl.trim().isEmpty()) {
            log.debug("Slack webhook URL is empty, skipping Slack alert.");
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("text", "🚨 *Network Test Portal Alert*\n" +
                    message + "\n" +
                    String.format("*Job ID*: #%d | *Protocol*: %s | *Target*: %s",
                            result.getTestJob().getId(),
                            result.getTestJob().getEffectiveProtocol(),
                            result.getTestJob().getEffectiveProtocol() == com.example.networkportal.enums.Protocol.PING ?
                                    result.getTestJob().getEffectiveHost() : result.getTestJob().getEffectiveServer()
                    ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(slackWebhookUrl, entity, String.class);
            log.info("Successfully dispatched Slack webhook notification.");
        } catch (Exception e) {
            log.error("Failed to send Slack alert webhook: {}", e.getMessage());
        }
    }

    private void sendDiscordAlert(String message, TestResult result) {
        if (discordWebhookUrl == null || discordWebhookUrl.trim().isEmpty()) {
            log.debug("Discord webhook URL is empty, skipping Discord alert.");
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("content", "🚨 **Network Test Portal Alert**\n" +
                    message + "\n" +
                    String.format("`Job ID`: #%d | `Protocol`: %s | `Target`: %s",
                            result.getTestJob().getId(),
                            result.getTestJob().getEffectiveProtocol(),
                            result.getTestJob().getEffectiveProtocol() == com.example.networkportal.enums.Protocol.PING ?
                                    result.getTestJob().getEffectiveHost() : result.getTestJob().getEffectiveServer()
                    ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            restTemplate.postForEntity(discordWebhookUrl, entity, String.class);
            log.info("Successfully dispatched Discord webhook notification.");
        } catch (Exception e) {
            log.error("Failed to send Discord alert webhook: {}", e.getMessage());
        }
    }

    private void sendEmailAlert(String message, TestResult result) {
        if (emailRecipient == null || emailRecipient.trim().isEmpty()) {
            log.debug("Email recipient is empty, skipping email alert.");
            return;
        }

        log.info("📧 [SMTP ALERT] Sending alert mail to {}...", emailRecipient);
        log.info("Subject: [ALERT] Network Performance Issue on: {}", result.getTestJob().getProfile().getName());
        log.info("Body:\n---\nHello Administrator,\n\n{}\n\n---\n", message);
    }
}
