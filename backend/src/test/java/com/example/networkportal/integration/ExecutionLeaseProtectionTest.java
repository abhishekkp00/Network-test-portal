package com.example.networkportal.integration;

import com.example.networkportal.dto.*;
import com.example.networkportal.enums.JobStatus;
import com.example.networkportal.enums.Protocol;
import com.example.networkportal.entity.TestJob;
import com.example.networkportal.repository.TestJobRepository;
import com.example.networkportal.service.JobService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ExecutionLeaseProtectionTest extends BaseIntegrationTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TestJobRepository jobRepository;

    @Autowired
    private JobService jobService;

    private String getAdminToken() throws Exception {
        LoginRequest adminLogin = LoginRequest.builder()
                .username("default_admin")
                .password("Admin123!")
                .build();

        String resp = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readValue(resp, AuthResponse.class).getToken();
    }

    private AgentResponse registerAgent(String adminToken, String name) throws Exception {
        String agentRegStr = mockMvc.perform(post("/api/v1/agents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"" + name + "\", \"description\": \"Test Probe Agent\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(agentRegStr, AgentResponse.class);
    }

    private ProfileResponse createProfile(String adminToken, String name) throws Exception {
        ProfileRequest profileReq = ProfileRequest.builder()
                .name(name)
                .host("1.1.1.1")
                .protocol(Protocol.PING)
                .count(4)
                .build();

        String profileRespStr = mockMvc.perform(post("/api/v1/profiles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(profileRespStr, ProfileResponse.class);
    }

    private JobResponse createJob(String adminToken, Long profileId, Long agentId) throws Exception {
        JobRequest jobReq = JobRequest.builder()
                .profileId(profileId)
                .agentId(agentId)
                .build();

        String jobRespStr = mockMvc.perform(post("/api/v1/jobs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(jobRespStr, JobResponse.class);
    }

    @Test
    @DisplayName("Lease Test: Normal Claim -> Lease Generated -> Returned in Task DTO -> Current Lease Accepted")
    void testNormalClaim_LeaseGeneratedReturnedAndAccepted() throws Exception {
        String adminToken = getAdminToken();
        AgentResponse agent = registerAgent(adminToken, "Lease-Agent-01");
        ProfileResponse profile = createProfile(adminToken, "Lease-Profile-01");
        JobResponse job = createJob(adminToken, profile.getId(), agent.getId());

        // Poll task
        String polledTaskStr = mockMvc.perform(get("/api/v1/agents/poll")
                        .header("X-Agent-Token", agent.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobId").value(job.getId()))
                .andExpect(jsonPath("$.executionLeaseId").exists())
                .andExpect(jsonPath("$.attemptNumber").value(1))
                .andReturn().getResponse().getContentAsString();

        AgentTaskDto taskDto = objectMapper.readValue(polledTaskStr, AgentTaskDto.class);
        assertNotNull(taskDto.getExecutionLeaseId());
        assertFalse(taskDto.getExecutionLeaseId().isEmpty());

        // Submit result with valid lease
        WorkerOutputDto result = WorkerOutputDto.builder()
                .executionLeaseId(taskDto.getExecutionLeaseId())
                .attemptNumber(taskDto.getAttemptNumber())
                .status("SUCCESS")
                .rttAvgMs(10.0)
                .packetLossPct(0.0)
                .build();

        mockMvc.perform(post("/api/v1/agents/results/" + job.getId())
                        .header("X-Agent-Token", agent.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(result)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Lease Protection Test: Stale Recovery, Lease Change across Retries, Old Lease Rejection, and New Lease Acceptance")
    void testStaleRecovery_LeaseChange_OldLeaseRejected_NewLeaseAccepted() throws Exception {
        String adminToken = getAdminToken();
        AgentResponse agentA = registerAgent(adminToken, "Agent-A-Stale");
        AgentResponse agentB = registerAgent(adminToken, "Agent-B-Fresh");
        ProfileResponse profile = createProfile(adminToken, "Lease-Profile-StaleTest");

        // Create job initially assigned to Agent A
        JobResponse job = createJob(adminToken, profile.getId(), agentA.getId());

        // 1. Agent A polls & claims job (Attempt 1)
        String taskStrA = mockMvc.perform(get("/api/v1/agents/poll")
                        .header("X-Agent-Token", agentA.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptNumber").value(1))
                .andReturn().getResponse().getContentAsString();
        AgentTaskDto taskA = objectMapper.readValue(taskStrA, AgentTaskDto.class);
        String oldLeaseId = taskA.getExecutionLeaseId();
        assertNotNull(oldLeaseId);

        // 2. Simulate Stale Recovery: Job becomes stale and is requeued for Agent B
        jobService.processStaleJobs(LocalDateTime.now().plusHours(1));

        // Verify Job was requeued to PENDING
        TestJob requeuedJob = jobRepository.findById(job.getId()).orElseThrow();
        assertEquals(JobStatus.PENDING, requeuedJob.getStatus());

        // Reassign job to Agent B and clear nextRetryAt so Agent B can poll immediately
        requeuedJob.setAgent(com.example.networkportal.entity.Agent.builder().id(agentB.getId()).build());
        requeuedJob.setNextRetryAt(null);
        jobRepository.save(requeuedJob);

        // 3. Agent B polls task (Attempt 2) -> receives a DIFFERENT lease ID
        String taskStrB = mockMvc.perform(get("/api/v1/agents/poll")
                        .header("X-Agent-Token", agentB.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptNumber").value(2))
                .andReturn().getResponse().getContentAsString();
        AgentTaskDto taskB = objectMapper.readValue(taskStrB, AgentTaskDto.class);
        String newLeaseId = taskB.getExecutionLeaseId();
        assertNotNull(newLeaseId);

        // Assert new lease ID is generated and DIFFERENT from old lease ID
        assertNotEquals(oldLeaseId, newLeaseId);

        // 4. Stale Agent A attempts to submit result with old lease ID -> REJECTED (401 Unauthorized)
        WorkerOutputDto staleResult = WorkerOutputDto.builder()
                .executionLeaseId(oldLeaseId)
                .attemptNumber(1)
                .status("SUCCESS")
                .rttAvgMs(99.0)
                .build();

        mockMvc.perform(post("/api/v1/agents/results/" + job.getId())
                        .header("X-Agent-Token", agentA.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staleResult)))
                .andExpect(status().isUnauthorized());

        // 5. Fresh Agent B submits result with new current lease ID -> ACCEPTED (200 OK)
        WorkerOutputDto freshResult = WorkerOutputDto.builder()
                .executionLeaseId(newLeaseId)
                .attemptNumber(2)
                .status("SUCCESS")
                .rttAvgMs(12.5)
                .build();

        mockMvc.perform(post("/api/v1/agents/results/" + job.getId())
                        .header("X-Agent-Token", agentB.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(freshResult)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Lease Validation Test: Wrong Agent + Valid Lease is Rejected with 401 Unauthorized")
    void testWrongAgent_ValidLease_Rejected() throws Exception {
        String adminToken = getAdminToken();
        AgentResponse agentOwner = registerAgent(adminToken, "Agent-Owner");
        AgentResponse agentRogue = registerAgent(adminToken, "Agent-Rogue");
        ProfileResponse profile = createProfile(adminToken, "Profile-WrongAgentTest");
        JobResponse job = createJob(adminToken, profile.getId(), agentOwner.getId());

        // Agent Owner polls task and gets valid lease
        String taskStr = mockMvc.perform(get("/api/v1/agents/poll")
                        .header("X-Agent-Token", agentOwner.getToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        AgentTaskDto task = objectMapper.readValue(taskStr, AgentTaskDto.class);

        // Agent Rogue submits with Agent Owner's valid lease -> Rejected (401)
        WorkerOutputDto rogueResult = WorkerOutputDto.builder()
                .executionLeaseId(task.getExecutionLeaseId())
                .status("SUCCESS")
                .build();

        mockMvc.perform(post("/api/v1/agents/results/" + job.getId())
                        .header("X-Agent-Token", agentRogue.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rogueResult)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Lease Validation Test: Wrong Lease + Correct Agent is Rejected with 401 Unauthorized")
    void testWrongLease_CorrectAgent_Rejected() throws Exception {
        String adminToken = getAdminToken();
        AgentResponse agent = registerAgent(adminToken, "Agent-Correct");
        ProfileResponse profile = createProfile(adminToken, "Profile-WrongLeaseTest");
        JobResponse job = createJob(adminToken, profile.getId(), agent.getId());

        // Agent polls task
        mockMvc.perform(get("/api/v1/agents/poll")
                        .header("X-Agent-Token", agent.getToken()))
                .andExpect(status().isOk());

        // Agent submits with fake/wrong lease ID -> Rejected (401)
        WorkerOutputDto invalidLeaseResult = WorkerOutputDto.builder()
                .executionLeaseId("fake-invalid-lease-uuid-999")
                .status("SUCCESS")
                .build();

        mockMvc.perform(post("/api/v1/agents/results/" + job.getId())
                        .header("X-Agent-Token", agent.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLeaseResult)))
                .andExpect(status().isUnauthorized());
    }
}
