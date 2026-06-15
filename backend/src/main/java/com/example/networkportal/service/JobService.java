package com.example.networkportal.service;

import com.example.networkportal.dto.JobRequest;
import com.example.networkportal.dto.JobResponse;
import com.example.networkportal.dto.WorkerOutputDto;
import com.example.networkportal.entity.TestJob;
import com.example.networkportal.entity.TestProfile;
import com.example.networkportal.entity.TestResult;
import com.example.networkportal.entity.User;
import com.example.networkportal.enums.JobStatus;
import com.example.networkportal.enums.Protocol;
import com.example.networkportal.enums.Role;
import com.example.networkportal.exception.ResourceNotFoundException;
import com.example.networkportal.exception.UnauthorizedException;
import com.example.networkportal.repository.TestJobRepository;
import com.example.networkportal.repository.TestProfileRepository;
import com.example.networkportal.repository.TestResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final TestJobRepository jobRepository;
    private final TestProfileRepository profileRepository;
    private final TestResultRepository resultRepository;
    private final PythonWorkerExecutorService workerExecutorService;
    private final AuditLogService auditLogService;

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public JobResponse createJob(JobRequest request, User currentUser) {
        TestProfile profile = profileRepository.findById(request.getProfileId())
                .orElseThrow(() -> new ResourceNotFoundException("Test profile not found with id: " + request.getProfileId()));

        // Resolve effective parameters (with overrides)
        String host = request.getHostOverride() != null ? request.getHostOverride() : profile.getHost();
        String server = request.getServerOverride() != null ? request.getServerOverride() : profile.getServer();
        Protocol protocol = request.getProtocolOverride() != null ? request.getProtocolOverride() : profile.getProtocol();
        Integer count = request.getCountOverride() != null ? request.getCountOverride() : profile.getCount();
        Integer duration = request.getDurationSecondsOverride() != null ? request.getDurationSecondsOverride() : profile.getDurationSeconds();
        Integer port = request.getPortOverride() != null ? request.getPortOverride() : profile.getPort();

        TestJob job = TestJob.builder()
                .profile(profile)
                .requestedBy(currentUser)
                .status(JobStatus.PENDING)
                .effectiveHost(host)
                .effectiveServer(server)
                .effectiveProtocol(protocol)
                .effectiveCount(count)
                .effectiveDurationSeconds(duration)
                .effectivePort(port)
                .build();

        jobRepository.save(job);

        auditLogService.log(
                currentUser.getUsername(),
                "JOB_CREATE",
                "TestJob",
                job.getId(),
                "Created test job for profile: " + profile.getName() + " (Status: PENDING)"
        );

        // Run the worker asynchronously in a background thread
        triggerAsyncExecution(job.getId());

        return mapToResponse(job);
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getAllJobs() {
        return jobRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public JobResponse getJobById(Long id) {
        TestJob job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Test job not found with id: " + id));
        return mapToResponse(job);
    }

    private void triggerAsyncExecution(Long jobId) {
        CompletableFuture.runAsync(() -> {
            try {
                // Phase 1: Mark job as RUNNING in a short transaction
                updateJobStatus(jobId, JobStatus.RUNNING, LocalDateTime.now(), null);

                // Fetch job details to get effective parameters
                TestJob job = jobRepository.findById(jobId)
                        .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));

                log.info("Running job {} in background", jobId);

                // Phase 2: Execute external process (NO database transaction open during execution!)
                WorkerOutputDto output = workerExecutorService.executeWorker(
                        job.getEffectiveProtocol(),
                        job.getEffectiveHost(),
                        job.getEffectiveServer(),
                        job.getEffectiveCount(),
                        job.getEffectiveDurationSeconds(),
                        job.getEffectivePort()
                );

                // Phase 3: Save results and update status in another short transaction
                JobStatus finalStatus = JobStatus.SUCCESS;
                if ("TIMEOUT".equals(output.getStatus())) {
                    finalStatus = JobStatus.TIMEOUT;
                } else if ("FAILED".equals(output.getStatus())) {
                    finalStatus = JobStatus.FAILED;
                }

                saveJobResult(jobId, finalStatus, output);

            } catch (Exception e) {
                log.error("Error running background job: " + jobId, e);
                try {
                    WorkerOutputDto errorOutput = WorkerOutputDto.builder()
                            .status("FAILED")
                            .errorMessage("Background execution error: " + e.getMessage())
                            .build();
                    saveJobResult(jobId, JobStatus.FAILED, errorOutput);
                } catch (Exception ex) {
                    log.error("Failed to mark job as failed: " + jobId, ex);
                }
            }
        });
    }

    @Transactional
    public void updateJobStatus(Long jobId, JobStatus status, LocalDateTime startedAt, LocalDateTime finishedAt) {
        TestJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));
        job.setStatus(status);
        if (startedAt != null) {
            job.setStartedAt(startedAt);
        }
        if (finishedAt != null) {
            job.setFinishedAt(finishedAt);
        }
        jobRepository.save(job);
    }

    @Transactional
    public void saveJobResult(Long jobId, JobStatus finalStatus, WorkerOutputDto output) {
        TestJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));

        job.setStatus(finalStatus);
        job.setFinishedAt(LocalDateTime.now());
        jobRepository.save(job);

        TestResult result = TestResult.builder()
                .testJob(job)
                .packetLossPct(output.getPacketLossPct())
                .throughputMbps(output.getThroughputMbps())
                .rttMinMs(output.getRttMinMs())
                .rttAvgMs(output.getRttAvgMs())
                .rttMaxMs(output.getRttMaxMs())
                .jitterMs(output.getJitterMs())
                .rawOutput(output.getRawOutput())
                .errorMessage(output.getErrorMessage())
                .exitCode("SUCCESS".equals(output.getStatus()) ? 0 : 1)
                .parsedStatus(output.getStatus())
                .build();

        resultRepository.save(result);

        auditLogService.log(
                job.getRequestedBy().getUsername(),
                "JOB_FINISHED",
                "TestJob",
                job.getId(),
                "Job finished with status: " + finalStatus
        );
    }

    public JobResponse mapToResponse(TestJob job) {
        return JobResponse.builder()
                .id(job.getId())
                .profileId(job.getProfile().getId())
                .profileName(job.getProfile().getName())
                .requestedByUsername(job.getRequestedBy().getUsername())
                .status(job.getStatus())
                .effectiveHost(job.getEffectiveHost())
                .effectiveServer(job.getEffectiveServer())
                .effectiveProtocol(job.getEffectiveProtocol())
                .effectiveCount(job.getEffectiveCount())
                .effectiveDurationSeconds(job.getEffectiveDurationSeconds())
                .effectivePort(job.getEffectivePort())
                .startedAt(job.getStartedAt())
                .finishedAt(job.getFinishedAt())
                .createdAt(job.getCreatedAt())
                .build();
    }
}
