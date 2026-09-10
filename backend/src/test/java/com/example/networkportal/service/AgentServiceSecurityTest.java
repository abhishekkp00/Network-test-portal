package com.example.networkportal.service;

import com.example.networkportal.dto.AgentResponse;
import com.example.networkportal.entity.Agent;
import com.example.networkportal.entity.TestJob;
import com.example.networkportal.exception.ResourceNotFoundException;
import com.example.networkportal.exception.UnauthorizedException;
import com.example.networkportal.repository.AgentRepository;
import com.example.networkportal.repository.TestJobRepository;
import com.example.networkportal.security.AgentSecurityUtils;
import com.example.networkportal.security.HmacSigner;
import com.example.networkportal.security.NonceCache;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AgentServiceSecurityTest {

    @Mock
    private AgentRepository agentRepository;

    @Mock
    private TestJobRepository jobRepository;

    @Mock
    private JobService jobService;

    private NonceCache nonceCache;
    private AgentService agentService;

    @BeforeEach
    void setUp() {
        nonceCache = new NonceCache();
        agentService = new AgentService(
                agentRepository,
                jobRepository,
                jobService,
                nonceCache
        );
    }

    @Test
    @DisplayName("registerAgent should store SHA-256 tokenHash in DB and return raw plaintext token ONCE")
    void testRegisterAgent_TokenHashStored() {
        when(agentRepository.findByName("Agent-A")).thenReturn(Optional.empty());
        when(agentRepository.save(any(Agent.class))).thenAnswer(invocation -> {
            Agent saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        AgentResponse response = agentService.registerAgent("Agent-A", "Test Subnet");

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertTrue(response.getToken().startsWith("ag_sec_"));

        verify(agentRepository).save(argThat(agent ->
                agent.getTokenHash() != null &&
                !agent.getTokenHash().equals(response.getToken()) &&
                agent.getTokenHash().length() == 64
        ));
    }

    @Test
    @DisplayName("rotateAgentToken should generate new tokenHash, revoke old token, and return new plaintext token")
    void testRotateAgentToken_Success() {
        Agent existingAgent = Agent.builder()
                .id(5L)
                .name("Agent-Rotate")
                .tokenHash(AgentSecurityUtils.hashToken("old_token"))
                .build();

        when(agentRepository.findById(5L)).thenReturn(Optional.of(existingAgent));
        when(agentRepository.save(any(Agent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AgentResponse response = agentService.rotateAgentToken(5L);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertNotEquals("old_token", response.getToken());

        verify(agentRepository).save(argThat(agent ->
                !agent.getTokenHash().equals(AgentSecurityUtils.hashToken("old_token"))
        ));
    }

    @Test
    @DisplayName("authenticateAgent should succeed with valid X-Agent-Token")
    void testAuthenticateAgent_TokenHeader_Success() {
        String rawToken = "ag_sec_validtoken123";
        String tokenHash = AgentSecurityUtils.hashToken(rawToken);

        Agent agent = Agent.builder().id(10L).name("Agent-10").tokenHash(tokenHash).build();
        when(agentRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(agent));

        Agent authenticated = agentService.authenticateAgent(
                rawToken, null, null, null, null, "GET", "/api/v1/agents/poll", ""
        );

        assertNotNull(authenticated);
        assertEquals(10L, authenticated.getId());
    }

    @Test
    @DisplayName("authenticateAgent should reject invalid X-Agent-Token")
    void testAuthenticateAgent_TokenHeader_InvalidToken() {
        String rawToken = "ag_sec_invalidtoken";
        String tokenHash = AgentSecurityUtils.hashToken(rawToken);

        when(agentRepository.findByTokenHash(tokenHash)).thenReturn(Optional.empty());

        assertThrows(UnauthorizedException.class, () ->
                agentService.authenticateAgent(rawToken, null, null, null, null, "GET", "/api/v1/agents/poll", "")
        );
    }

    @Test
    @DisplayName("authenticateAgent should succeed with valid HMAC Request Signature")
    void testAuthenticateAgent_HMAC_Success() {
        String rawToken = "ag_sec_hmactoken456";
        String tokenHash = AgentSecurityUtils.hashToken(rawToken);
        Agent agent = Agent.builder().id(20L).name("Agent-20").tokenHash(tokenHash).build();

        when(agentRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(agent));

        String timestamp = String.valueOf(System.currentTimeMillis());
        String nonce = "nonce-uuid-12345";
        String method = "GET";
        String path = "/api/v1/agents/poll";
        String body = "";

        String canonical = "20\nGET\n/api/v1/agents/poll\n" + timestamp + "\n" + nonce + "\n" + body;
        String signature = HmacSigner.calculateHmac(rawToken, canonical);

        Agent authenticated = agentService.authenticateAgent(
                rawToken, "20", timestamp, nonce, signature, method, path, body
        );

        assertNotNull(authenticated);
        assertEquals(20L, authenticated.getId());
    }

    @Test
    @DisplayName("authenticateAgent should reject expired timestamp in HMAC request")
    void testAuthenticateAgent_HMAC_ExpiredTimestamp() {
        String rawToken = "ag_sec_hmactoken456";
        String expiredTimestamp = String.valueOf(System.currentTimeMillis() - (10 * 60 * 1000L)); // 10 minutes old

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                agentService.authenticateAgent(rawToken, "20", expiredTimestamp, "nonce-999", "sig", "GET", "/api/v1/agents/poll", "")
        );

        assertTrue(ex.getMessage().contains("timestamp expired"));
    }

    @Test
    @DisplayName("authenticateAgent should reject nonce replay in HMAC request")
    void testAuthenticateAgent_HMAC_NonceReplay() {
        String rawToken = "ag_sec_hmactoken456";
        String tokenHash = AgentSecurityUtils.hashToken(rawToken);
        Agent agent = Agent.builder().id(20L).name("Agent-20").tokenHash(tokenHash).build();

        when(agentRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(agent));

        String timestamp = String.valueOf(System.currentTimeMillis());
        String nonce = "nonce-replay-001";
        String canonical = "20\nGET\n/api/v1/agents/poll\n" + timestamp + "\n" + nonce + "\n";
        String signature = HmacSigner.calculateHmac(rawToken, canonical);

        // First call succeeds
        agentService.authenticateAgent(rawToken, "20", timestamp, nonce, signature, "GET", "/api/v1/agents/poll", "");

        // Second call with same nonce fails
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                agentService.authenticateAgent(rawToken, "20", timestamp, nonce, signature, "GET", "/api/v1/agents/poll", "")
        );

        assertTrue(ex.getMessage().contains("Nonce replay attack detected"));
    }

    @Test
    @DisplayName("submitResult should reject agent attempting to submit result for another agent's job")
    void testSubmitResult_UnauthorizedJobOwnership() {
        String rawToken = "ag_sec_agent1";
        String tokenHash = AgentSecurityUtils.hashToken(rawToken);

        Agent agent1 = Agent.builder().id(1L).name("Agent-1").tokenHash(tokenHash).build();
        Agent agent2 = Agent.builder().id(2L).name("Agent-2").build();

        TestJob jobAssignedToAgent2 = TestJob.builder().id(999L).agent(agent2).build();

        when(agentRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(agent1));
        when(jobRepository.findById(999L)).thenReturn(Optional.of(jobAssignedToAgent2));

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () ->
                agentService.submitResult(rawToken, null, null, null, null, "POST", "/api/v1/agents/results/999", 999L, null, "")
        );

        assertTrue(ex.getMessage().contains("not authorized to submit results for Job #999"));
    }
}
