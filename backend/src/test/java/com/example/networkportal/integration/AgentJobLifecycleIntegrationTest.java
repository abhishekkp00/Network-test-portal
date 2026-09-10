package com.example.networkportal.integration;

import com.example.networkportal.dto.*;
import com.example.networkportal.enums.Protocol;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AgentJobLifecycleIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ObjectMapper objectMapper;

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

    @Test
    @DisplayName("Integration Test: Complete Job Creation, Agent Polling (Atomic Claiming), Result Submission, and Status Retrieval")
    void testCompleteAgentJobLifecycle() throws Exception {
        String adminToken = getAdminToken();

        // 1. Register Agent
        String agentRegStr = mockMvc.perform(post("/api/v1/agents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Worker-Edge-01\", \"description\": \"Edge Agent\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn().getResponse().getContentAsString();
        AgentResponse agentResp = objectMapper.readValue(agentRegStr, AgentResponse.class);
        String agentToken = agentResp.getToken();

        // 2. Create Test Profile
        ProfileRequest profileReq = ProfileRequest.builder()
                .name("Core Router Ping Profile")
                .host("8.8.8.8")
                .protocol(Protocol.PING)
                .count(4)
                .build();

        String profileRespStr = mockMvc.perform(post("/api/v1/profiles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        ProfileResponse profileResp = objectMapper.readValue(profileRespStr, ProfileResponse.class);

        // 3. Create Job assigned to Agent
        JobRequest jobReq = JobRequest.builder()
                .profileId(profileResp.getId())
                .agentId(agentResp.getId())
                .build();

        String jobRespStr = mockMvc.perform(post("/api/v1/jobs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();
        JobResponse jobResp = objectMapper.readValue(jobRespStr, JobResponse.class);

        // 4. Agent Polls Task (Atomic Claiming PENDING -> RUNNING via pessimistic row locking)
        String polledTaskStr = mockMvc.perform(get("/api/v1/agents/poll")
                        .header("X-Agent-Token", agentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobId").value(jobResp.getId()))
                .andExpect(jsonPath("$.host").value("8.8.8.8"))
                .andExpect(jsonPath("$.count").value(4))
                .andReturn().getResponse().getContentAsString();
        AgentTaskDto taskDto = objectMapper.readValue(polledTaskStr, AgentTaskDto.class);

        // 5. Agent Submits Worker Output Result
        WorkerOutputDto workerResult = WorkerOutputDto.builder()
                .status("SUCCESS")
                .rttAvgMs(15.4)
                .rttMinMs(12.1)
                .rttMaxMs(18.9)
                .packetLossPct(0.0)
                .rawOutput("PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n4 packets transmitted, 4 received, 0% packet loss")
                .build();

        mockMvc.perform(post("/api/v1/agents/results/" + taskDto.getJobId())
                        .header("X-Agent-Token", agentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(workerResult)))
                .andExpect(status().isOk());

        // 6. Verify Job Status is now SUCCESS and Result is retrievable
        mockMvc.perform(get("/api/v1/jobs/" + jobResp.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        mockMvc.perform(get("/api/v1/jobs/" + jobResp.getId() + "/result")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rttAvgMs").value(15.4))
                .andExpect(jsonPath("$.packetLossPct").value(0.0));
    }

    @Test
    @DisplayName("Security Test: Invalid Agent Token is Rejected on Poll with 401 Unauthorized")
    void testSecurity_InvalidAgentToken_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/agents/poll")
                        .header("X-Agent-Token", "invalid_agent_secret_token_123"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security Test: Agent Submitting Result for Another Agent's Job is Rejected with 401 Unauthorized")
    void testSecurity_AgentSubmittingOtherAgentsJob_ReturnsUnauthorized() throws Exception {
        String adminToken = getAdminToken();

        // Register Agent 1 and Agent 2
        String agent1Str = mockMvc.perform(post("/api/v1/agents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Agent-Owner-1\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        AgentResponse agent1Resp = objectMapper.readValue(agent1Str, AgentResponse.class);

        String agent2Str = mockMvc.perform(post("/api/v1/agents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Agent-Rogue-2\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        AgentResponse agent2Resp = objectMapper.readValue(agent2Str, AgentResponse.class);

        // Create Profile & Job assigned to Agent 1
        ProfileRequest profileReq = ProfileRequest.builder().name("Profile-1").host("1.1.1.1").protocol(Protocol.PING).build();
        String profStr = mockMvc.perform(post("/api/v1/profiles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        ProfileResponse prof = objectMapper.readValue(profStr, ProfileResponse.class);

        JobRequest jobReq = JobRequest.builder().profileId(prof.getId()).agentId(agent1Resp.getId()).build();
        String jobStr = mockMvc.perform(post("/api/v1/jobs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(jobReq)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        JobResponse job = objectMapper.readValue(jobStr, JobResponse.class);

        // Agent 2 attempts to submit result for Agent 1's job
        WorkerOutputDto bogusOutput = WorkerOutputDto.builder().status("SUCCESS").rawOutput("Hacked").build();
        mockMvc.perform(post("/api/v1/agents/results/" + job.getId())
                        .header("X-Agent-Token", agent2Resp.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bogusOutput)))
                .andExpect(status().isUnauthorized());
    }
}
