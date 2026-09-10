package com.example.networkportal.integration;

import com.example.networkportal.dto.AgentResponse;
import com.example.networkportal.dto.AuthResponse;
import com.example.networkportal.dto.JobRequest;
import com.example.networkportal.dto.JobResponse;
import com.example.networkportal.dto.LoginRequest;
import com.example.networkportal.dto.ProfileRequest;
import com.example.networkportal.dto.ProfileResponse;
import com.example.networkportal.entity.TestJob;
import com.example.networkportal.enums.JobStatus;
import com.example.networkportal.enums.Protocol;
import com.example.networkportal.repository.TestJobRepository;
import com.example.networkportal.service.JobService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class JobClaimConcurrencyIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JobService jobService;

    @Autowired
    private TestJobRepository jobRepository;

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
    @DisplayName("Concurrency Test: Two concurrent claimers cannot claim the same PENDING job (PESSIMISTIC_WRITE locking)")
    void testConcurrentJobClaiming_OnlyOneClaimerSucceeds() throws Exception {
        String adminToken = getAdminToken();

        // 1. Register agent
        String agentRegStr = mockMvc.perform(post("/api/v1/agents")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Concurrent-Agent-01\", \"description\": \"Concurrency Test Agent\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        AgentResponse agent = objectMapper.readValue(agentRegStr, AgentResponse.class);

        // 2. Create profile
        ProfileRequest profileReq = ProfileRequest.builder()
                .name("Concurrency-Profile")
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
        ProfileResponse profile = objectMapper.readValue(profileRespStr, ProfileResponse.class);

        // 3. Dispatch exactly 1 job assigned to this agent
        JobRequest jobReq = JobRequest.builder()
                .profileId(profile.getId())
                .agentId(agent.getId())
                .build();

        String jobRespStr = mockMvc.perform(post("/api/v1/jobs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JobResponse job = objectMapper.readValue(jobRespStr, JobResponse.class);

        // 4. Concurrently attempt to claim the job using 4 threads
        int threadCount = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CyclicBarrier barrier = new CyclicBarrier(threadCount);
        List<Future<TestJob>> futures = new ArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            futures.add(executor.submit(() -> {
                barrier.await(); // Synchronize thread start
                return jobService.claimNextPendingJobForAgent(agent.getId());
            }));
        }

        executor.shutdown();
        assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));

        // 5. Verify results: Exactly ONE thread gets non-null TestJob, others get null
        int successCount = 0;
        int nullCount = 0;
        TestJob claimedJob = null;

        for (Future<TestJob> future : futures) {
            TestJob result = future.get();
            if (result != null) {
                successCount++;
                claimedJob = result;
            } else {
                nullCount++;
            }
        }

        assertEquals(1, successCount, "Exactly one thread must successfully claim the job");
        assertEquals(threadCount - 1, nullCount, "All other concurrent claim attempts must receive null");
        assertNotNull(claimedJob);
        assertEquals(job.getId(), claimedJob.getId());
        assertEquals(JobStatus.RUNNING, claimedJob.getStatus());

        // 6. Verify final database state
        TestJob dbJob = jobRepository.findById(job.getId()).orElseThrow();
        assertEquals(JobStatus.RUNNING, dbJob.getStatus());
        assertEquals(1, dbJob.getAttemptNumber());
        assertNotNull(dbJob.getExecutionLeaseId());
    }
}
