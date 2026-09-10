package com.example.networkportal.service;

import com.example.networkportal.dto.WorkerOutputDto;
import com.example.networkportal.enums.Protocol;
import com.example.networkportal.exception.BadRequestException;
import com.example.networkportal.validation.NetworkTargetProtectionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CommandExecutionSecurityTest {

    private NetworkTargetProtectionService targetProtectionService;
    private PythonWorkerExecutorService executorService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        targetProtectionService = new NetworkTargetProtectionService();
        executorService = new PythonWorkerExecutorService(objectMapper, targetProtectionService);
        executorService.init();
    }

    @Test
    @DisplayName("Should reject target containing dangerous shell metacharacters")
    void testHostOrIpValidation_InvalidTargetRejection() {
        String dangerousTarget = "8.8.8.8; cat /etc/passwd";
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                executorService.executeWorker(Protocol.PING, dangerousTarget, null, 4, null, null)
        );
        assertTrue(ex.getMessage().contains("Invalid target format or dangerous characters"));
    }

    @Test
    @DisplayName("Should reject prohibited Cloud Metadata IMDS target")
    void testTargetProtection_MetadataEndpointRejection() {
        String metadataTarget = "169.254.169.254";
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                executorService.executeWorker(Protocol.PING, metadataTarget, null, 4, null, null)
        );
        assertTrue(ex.getMessage().contains("prohibited metadata target") || ex.getMessage().contains("prohibited cloud infrastructure"));
    }

    @Test
    @DisplayName("Should reject prohibited loopback target")
    void testTargetProtection_LoopbackRejection() {
        String loopbackTarget = "127.0.0.1";
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                executorService.executeWorker(Protocol.PING, loopbackTarget, null, 4, null, null)
        );
        assertTrue(ex.getMessage().contains("prohibited loopback target"));
    }

    @Test
    @DisplayName("Should reject execution when binary is not in allowlist")
    void testBinaryAllowlisting_UnapprovedBinaryRejection() {
        ReflectionTestUtils.setField(executorService, "pythonPath", "/bin/bash");

        SecurityException ex = assertThrows(SecurityException.class, () ->
                executorService.executeWorker(Protocol.PING, "8.8.8.8", null, 4, null, null)
        );
        assertTrue(ex.getMessage().contains("Execution of unapproved binary is prohibited"));
    }

    @Test
    @DisplayName("Should reject invalid ping count parameter outside allowable bounds")
    void testResourceProtection_InvalidPingCount() {
        BadRequestException exLow = assertThrows(BadRequestException.class, () ->
                executorService.executeWorker(Protocol.PING, "8.8.8.8", null, 0, null, null)
        );
        assertTrue(exLow.getMessage().contains("Ping count must be between 1 and 50"));

        BadRequestException exHigh = assertThrows(BadRequestException.class, () ->
                executorService.executeWorker(Protocol.PING, "8.8.8.8", null, 100, null, null)
        );
        assertTrue(exHigh.getMessage().contains("Ping count must be between 1 and 50"));
    }

    @Test
    @DisplayName("Should reject invalid iperf3 duration and port parameters")
    void testResourceProtection_InvalidIperfParameters() {
        BadRequestException exDuration = assertThrows(BadRequestException.class, () ->
                executorService.executeWorker(Protocol.IPERF_TCP, null, "8.8.8.8", null, 300, 5201)
        );
        assertTrue(exDuration.getMessage().contains("iperf3 duration must be between 1 and 120 seconds"));

        BadRequestException exPort = assertThrows(BadRequestException.class, () ->
                executorService.executeWorker(Protocol.IPERF_TCP, null, "8.8.8.8", null, 10, 70000)
        );
        assertTrue(exPort.getMessage().contains("iperf3 port must be between 1 and 65535"));
    }

    @Test
    @DisplayName("Should successfully execute allowlisted ping command for valid target")
    void testExecuteWorker_ValidPing_Success() {
        WorkerOutputDto result = executorService.executeWorker(Protocol.PING, "8.8.8.8", null, 1, null, null);
        assertNotNull(result);
        assertNotNull(result.getStatus());
    }
}
