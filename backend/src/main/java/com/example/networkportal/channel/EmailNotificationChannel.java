package com.example.networkportal.channel;

import com.example.networkportal.entity.Incident;
import com.example.networkportal.entity.TestResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EmailNotificationChannel {

    @Value("${alerts.email-recipient:}")
    private String emailRecipient;

    public void sendIncidentEmail(Incident incident, TestResult result, String notificationType) {
        if (emailRecipient == null || emailRecipient.trim().isEmpty()) {
            log.debug("Email recipient is empty, skipping email notification.");
            return;
        }

        String profileName = incident.getProfile() != null ? incident.getProfile().getName() : "Unknown Profile";
        String subject = String.format("[%s] Network Performance Incident #%d on Profile '%s'",
                notificationType, incident.getId(), profileName);

        StringBuilder body = new StringBuilder();
        body.append("Hello Administrator,\n\n");
        body.append("Notification Type: ").append(notificationType).append("\n");
        body.append("Incident ID: #").append(incident.getId()).append("\n");
        body.append("Status: ").append(incident.getStatus()).append("\n");
        body.append("Severity: ").append(incident.getSeverity()).append("\n");
        body.append("Profile: ").append(profileName).append("\n");
        body.append("Occurrences: ").append(incident.getOccurrenceCount()).append("\n");
        body.append("Summary: ").append(incident.getSummary()).append("\n");

        if (result != null && result.getTestJob() != null) {
            body.append("Job ID: #").append(result.getTestJob().getId()).append("\n");
            body.append("Protocol: ").append(result.getTestJob().getEffectiveProtocol()).append("\n");
        }

        log.info("📧 [ISOLATED EMAIL CHANNEL] Dispatching email to {}...", emailRecipient);
        log.info("Subject: {}", subject);
        log.info("Body:\n---\n{}\n---\n", body);
    }
}
