package com.example.networkportal.service;

import com.example.networkportal.channel.EmailNotificationChannel;
import com.example.networkportal.entity.Incident;
import com.example.networkportal.entity.TestJob;
import com.example.networkportal.entity.TestProfile;
import com.example.networkportal.entity.TestResult;
import com.example.networkportal.enums.IncidentSeverity;
import com.example.networkportal.enums.IncidentStatus;
import com.example.networkportal.enums.Protocol;
import com.example.networkportal.repository.IncidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertAndIncidentServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private EmailNotificationChannel emailChannel;

    private NotificationService notificationService;

    private TestProfile testProfile;
    private TestJob testJob;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(restTemplate, incidentRepository, emailChannel);
        ReflectionTestUtils.setField(notificationService, "latencyThresholdMs", 100.0);
        ReflectionTestUtils.setField(notificationService, "packetLossThresholdPct", 5.0);

        testProfile = TestProfile.builder()
                .id(10L)
                .name("Core Gateway Monitor")
                .host("10.0.0.1")
                .protocol(Protocol.PING)
                .build();

        testJob = TestJob.builder()
                .id(100L)
                .profile(testProfile)
                .effectiveProtocol(Protocol.PING)
                .effectiveHost("10.0.0.1")
                .build();
    }

    @Test
    @DisplayName("Initial metric breach creates new Incident in OPEN status and dispatches alert")
    void testCheckAndNotify_InitialBreach_OpensIncident() {
        TestResult breachResult = TestResult.builder()
                .id(500L)
                .testJob(testJob)
                .rttAvgMs(150.0) // Exceeds threshold (100.0ms)
                .packetLossPct(0.0)
                .build();

        when(incidentRepository.findFirstByProfileAndStatusInOrderByFirstSeenAtDesc(
                eq(testProfile),
                eq(List.of(IncidentStatus.OPEN, IncidentStatus.ONGOING))
        )).thenReturn(Optional.empty());

        when(incidentRepository.save(any(Incident.class))).thenAnswer(inv -> {
            Incident inc = inv.getArgument(0);
            inc.setId(1L);
            return inc;
        });

        notificationService.checkAndNotify(breachResult);

        ArgumentCaptor<Incident> captor = ArgumentCaptor.forClass(Incident.class);
        verify(incidentRepository).save(captor.capture());

        Incident savedIncident = captor.getValue();
        assertNotNull(savedIncident);
        assertEquals(IncidentStatus.OPEN, savedIncident.getStatus());
        assertEquals(IncidentSeverity.WARNING, savedIncident.getSeverity());
        assertEquals(1, savedIncident.getOccurrenceCount());
        assertNotNull(savedIncident.getFirstSeenAt());
        assertNotNull(savedIncident.getLastSeenAt());
        assertNull(savedIncident.getResolvedAt());

        // Verify notification dispatch to email channel
        verify(emailChannel).sendIncidentEmail(eq(savedIncident), eq(breachResult), eq("INCIDENT OPEN"));
    }

    @Test
    @DisplayName("Consecutive metric breach deduplicates alert and transitions Incident to ONGOING")
    void testCheckAndNotify_ConsecutiveBreach_DeduplicatesAlert() {
        TestResult breachResult2 = TestResult.builder()
                .id(501L)
                .testJob(testJob)
                .rttAvgMs(200.0)
                .packetLossPct(10.0) // High loss and latency
                .build();

        Incident existingOpenIncident = Incident.builder()
                .id(1L)
                .profile(testProfile)
                .status(IncidentStatus.OPEN)
                .severity(IncidentSeverity.WARNING)
                .occurrenceCount(1)
                .build();

        when(incidentRepository.findFirstByProfileAndStatusInOrderByFirstSeenAtDesc(
                eq(testProfile),
                eq(List.of(IncidentStatus.OPEN, IncidentStatus.ONGOING))
        )).thenReturn(Optional.of(existingOpenIncident));

        when(incidentRepository.save(any(Incident.class))).thenAnswer(inv -> inv.getArgument(0));

        notificationService.checkAndNotify(breachResult2);

        ArgumentCaptor<Incident> captor = ArgumentCaptor.forClass(Incident.class);
        verify(incidentRepository).save(captor.capture());

        Incident updatedIncident = captor.getValue();
        assertEquals(IncidentStatus.ONGOING, updatedIncident.getStatus());
        assertEquals(IncidentSeverity.CRITICAL, updatedIncident.getSeverity());
        assertEquals(2, updatedIncident.getOccurrenceCount());

        // Verify email channel was NOT invoked again (Deduplicated!)
        verifyNoInteractions(emailChannel);
    }

    @Test
    @DisplayName("Healthy metric result triggers automatic recovery detection and resolves active Incident")
    void testCheckAndNotify_MetricRecovery_ResolvesIncident() {
        TestResult healthyResult = TestResult.builder()
                .id(502L)
                .testJob(testJob)
                .rttAvgMs(25.0) // Below threshold
                .packetLossPct(0.0) // Below threshold
                .build();

        Incident ongoingIncident = Incident.builder()
                .id(1L)
                .profile(testProfile)
                .status(IncidentStatus.ONGOING)
                .severity(IncidentSeverity.CRITICAL)
                .occurrenceCount(3)
                .build();

        when(incidentRepository.findFirstByProfileAndStatusInOrderByFirstSeenAtDesc(
                eq(testProfile),
                eq(List.of(IncidentStatus.OPEN, IncidentStatus.ONGOING))
        )).thenReturn(Optional.of(ongoingIncident));

        when(incidentRepository.save(any(Incident.class))).thenAnswer(inv -> inv.getArgument(0));

        notificationService.checkAndNotify(healthyResult);

        ArgumentCaptor<Incident> captor = ArgumentCaptor.forClass(Incident.class);
        verify(incidentRepository).save(captor.capture());

        Incident resolvedIncident = captor.getValue();
        assertEquals(IncidentStatus.RESOLVED, resolvedIncident.getStatus());
        assertNotNull(resolvedIncident.getResolvedAt());

        // Verify recovery notification was dispatched via email channel
        verify(emailChannel).sendIncidentEmail(eq(resolvedIncident), eq(healthyResult), eq("INCIDENT RESOLVED"));
    }
}
