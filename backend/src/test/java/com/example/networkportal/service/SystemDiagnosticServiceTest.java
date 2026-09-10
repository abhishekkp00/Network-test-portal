package com.example.networkportal.service;

import com.example.networkportal.repository.AgentRepository;
import com.example.networkportal.repository.TestJobRepository;
import com.example.networkportal.repository.TestProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemDiagnosticServiceTest {

    @Mock
    private TestProfileRepository profileRepository;

    @Mock
    private TestJobRepository jobRepository;

    @Mock
    private AgentRepository agentRepository;

    @InjectMocks
    private SystemDiagnosticService diagnosticService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(diagnosticService, "pingScriptPath", "/usr/bin/ping");
        ReflectionTestUtils.setField(diagnosticService, "iperfScriptPath", "/usr/bin/iperf3");
        ReflectionTestUtils.setField(diagnosticService, "pythonPath", "python3");
    }

    @Test
    @DisplayName("performDiagnostic should gather report without hard-coded fallback values (1.2, 42.5, 18.7)")
    void testPerformDiagnostic_NoHardcodedFallbacks() {
        SystemDiagnosticService.DiagnosticReport report = diagnosticService.performDiagnostic();

        assertNotNull(report);
        assertNotNull(report.getTimestamp());
        assertNotNull(report.getOverallStatus());

        // Verify that CPU, Memory, Disk telemetry are either valid positive percentages or null (never hardcoded 1.2, 42.5, 18.7 fallbacks)
        if (report.getCpuUsagePct() != null) {
            assertTrue(report.getCpuUsagePct() >= 0.0 && report.getCpuUsagePct() <= 100.0);
            assertNotEquals(1.2, report.getCpuUsagePct(), "CPU usage must not be hard-coded fallback 1.2");
        }
        if (report.getMemoryUsagePct() != null) {
            assertTrue(report.getMemoryUsagePct() >= 0.0 && report.getMemoryUsagePct() <= 100.0);
            assertNotEquals(42.5, report.getMemoryUsagePct(), "Memory usage must not be hard-coded fallback 42.5");
        }
        if (report.getDiskUsagePct() != null) {
            assertTrue(report.getDiskUsagePct() >= 0.0 && report.getDiskUsagePct() <= 100.0);
            assertNotEquals(18.7, report.getDiskUsagePct(), "Disk usage must not be hard-coded fallback 18.7");
        }
    }

    @Test
    @DisplayName("getSystemStats should return accurate entity counts")
    void testGetSystemStats() {
        when(profileRepository.count()).thenReturn(5L);
        when(jobRepository.count()).thenReturn(20L);
        when(agentRepository.count()).thenReturn(3L);

        SystemDiagnosticService.SystemStats stats = diagnosticService.getSystemStats();

        assertEquals(5L, stats.getProfilesCount());
        assertEquals(20L, stats.getJobsCount());
        assertEquals(3L, stats.getAgentsCount());
    }
}
