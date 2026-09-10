package com.example.networkportal.service;

import com.example.networkportal.entity.Agent;
import com.example.networkportal.entity.TestJob;
import com.example.networkportal.enums.JobStatus;
import com.example.networkportal.enums.Protocol;
import com.example.networkportal.repository.AgentRepository;
import com.example.networkportal.repository.TestJobRepository;
import com.example.networkportal.repository.TestProfileRepository;
import com.example.networkportal.repository.TestResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private TestJobRepository jobRepository;

    @Mock
    private TestProfileRepository profileRepository;

    @Mock
    private TestResultRepository resultRepository;

    @Mock
    private PythonWorkerExecutorService workerExecutorService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AgentRepository agentRepository;

    private ThreadPoolTaskExecutor networkJobExecutor;
    private JobService jobService;

    @BeforeEach
    void setUp() {
        networkJobExecutor = new ThreadPoolTaskExecutor();
        networkJobExecutor.setCorePoolSize(5);
        networkJobExecutor.setMaxPoolSize(10);
        networkJobExecutor.setQueueCapacity(25);
        networkJobExecutor.setThreadNamePrefix("network-job-test-");
        networkJobExecutor.initialize();

        jobService = new JobService(
                jobRepository,
                profileRepository,
                resultRepository,
                workerExecutorService,
                auditLogService,
                notificationService,
                agentRepository,
                networkJobExecutor
        );
    }

    @Test
    @DisplayName("claimNextPendingJobForAgent should claim claimable PENDING job atomically, increment attemptNumber, and set status to RUNNING")
    void testClaimNextPendingJobForAgent_Success() {
        Agent agent = Agent.builder().id(1L).name("Agent-1").build();
        TestJob pendingJob = TestJob.builder()
                .id(100L)
                .agent(agent)
                .status(JobStatus.PENDING)
                .effectiveProtocol(Protocol.PING)
                .effectiveHost("1.1.1.1")
                .attemptNumber(0)
                .maxAttempts(3)
                .build();

        when(jobRepository.findFirstClaimableJobByAgentId(eq(1L), eq(JobStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Optional.of(pendingJob));
        when(jobRepository.save(any(TestJob.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TestJob claimedJob = jobService.claimNextPendingJobForAgent(1L);

        assertNotNull(claimedJob);
        assertEquals(JobStatus.RUNNING, claimedJob.getStatus());
        assertEquals(1, claimedJob.getAttemptNumber());
        assertNotNull(claimedJob.getExecutionLeaseId());
        assertFalse(claimedJob.getExecutionLeaseId().isEmpty());
        assertNull(claimedJob.getNextRetryAt());
        assertNotNull(claimedJob.getStartedAt());

        verify(jobRepository).save(pendingJob);
    }

    @Test
    @DisplayName("claimNextPendingJobForAgent should return null when no claimable jobs exist")
    void testClaimNextPendingJobForAgent_NoneAvailable() {
        when(jobRepository.findFirstClaimableJobByAgentId(eq(1L), eq(JobStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        TestJob claimedJob = jobService.claimNextPendingJobForAgent(1L);

        assertNull(claimedJob);
        verify(jobRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateJobStatus should reject invalid transition SUCCESS -> RUNNING")
    void testUpdateJobStatus_InvalidTransition_SuccessToRunning() {
        TestJob successJob = TestJob.builder()
                .id(101L)
                .status(JobStatus.SUCCESS)
                .finishedAt(LocalDateTime.now())
                .build();

        when(jobRepository.findById(101L)).thenReturn(Optional.of(successJob));

        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                jobService.updateJobStatus(101L, JobStatus.RUNNING, LocalDateTime.now(), null)
        );

        assertTrue(exception.getMessage().contains("Invalid status transition for Job #101: SUCCESS -> RUNNING"));
        verify(jobRepository, never()).save(any());
    }

    @Test
    @DisplayName("processStaleJobs should detect stale jobs and requeue them with exponential backoff when attemptNumber < maxAttempts")
    void testProcessStaleJobs_RequeueWithBackoff() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(60);
        TestJob staleJob = TestJob.builder()
                .id(200L)
                .status(JobStatus.RUNNING)
                .startedAt(LocalDateTime.now().minusSeconds(120))
                .attemptNumber(1)
                .maxAttempts(3)
                .build();

        when(jobRepository.findStaleJobs(eq(JobStatus.RUNNING), any(LocalDateTime.class)))
                .thenReturn(List.of(staleJob));
        when(jobRepository.save(any(TestJob.class))).thenAnswer(invocation -> invocation.getArgument(0));

        jobService.processStaleJobs(cutoff);

        assertEquals(JobStatus.PENDING, staleJob.getStatus());
        assertNotNull(staleJob.getNextRetryAt());
        verify(jobRepository, times(1)).save(staleJob);
    }

    @Test
    @DisplayName("processStaleJobs should mark job permanently FAILED when maxAttempts reached")
    void testProcessStaleJobs_MaxAttemptsExhausted() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(60);
        TestJob staleJob = TestJob.builder()
                .id(201L)
                .status(JobStatus.RUNNING)
                .startedAt(LocalDateTime.now().minusSeconds(120))
                .attemptNumber(3)
                .maxAttempts(3)
                .build();

        when(jobRepository.findStaleJobs(eq(JobStatus.RUNNING), any(LocalDateTime.class)))
                .thenReturn(List.of(staleJob));
        when(jobRepository.save(any(TestJob.class))).thenAnswer(invocation -> invocation.getArgument(0));

        jobService.processStaleJobs(cutoff);

        assertEquals(JobStatus.FAILED, staleJob.getStatus());
        assertNotNull(staleJob.getFinishedAt());
        assertNull(staleJob.getNextRetryAt());
        verify(resultRepository).save(any());
    }

    @Test
    @DisplayName("calculateExponentialBackoff should compute exponential delay correctly")
    void testCalculateExponentialBackoff() {
        assertEquals(5L, jobService.calculateExponentialBackoff(1));
        assertEquals(10L, jobService.calculateExponentialBackoff(2));
        assertEquals(20L, jobService.calculateExponentialBackoff(3));
    }
}
