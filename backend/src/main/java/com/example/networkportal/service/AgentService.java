package com.example.networkportal.service;

import com.example.networkportal.dto.AgentResponse;
import com.example.networkportal.dto.AgentTaskDto;
import com.example.networkportal.dto.WorkerOutputDto;
import com.example.networkportal.entity.Agent;
import com.example.networkportal.entity.TestJob;
import com.example.networkportal.enums.AgentStatus;
import com.example.networkportal.enums.JobStatus;
import com.example.networkportal.exception.BadRequestException;
import com.example.networkportal.exception.ResourceNotFoundException;
import com.example.networkportal.exception.UnauthorizedException;
import com.example.networkportal.repository.AgentRepository;
import com.example.networkportal.repository.TestJobRepository;
import com.example.networkportal.security.AgentSecurityUtils;
import com.example.networkportal.security.HmacSigner;
import com.example.networkportal.security.NonceCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentService {

    private final AgentRepository agentRepository;
    private final TestJobRepository jobRepository;
    private final JobService jobService;
    private final NonceCache nonceCache;

    @Value("${agents.heartbeat.degraded-threshold-seconds:30}")
    private long degradedThresholdSeconds;

    @Value("${agents.heartbeat.offline-threshold-seconds:90}")
    private long offlineThresholdSeconds;

    public AgentStatus computeAgentStatus(Agent agent) {
        if (agent.getLastSeenAt() == null) {
            return AgentStatus.OFFLINE;
        }
        long secondsSinceLastSeen = java.time.Duration.between(agent.getLastSeenAt(), LocalDateTime.now()).getSeconds();
        if (secondsSinceLastSeen <= degradedThresholdSeconds) {
            return AgentStatus.ONLINE;
        } else if (secondsSinceLastSeen <= offlineThresholdSeconds) {
            return AgentStatus.DEGRADED;
        } else {
            return AgentStatus.OFFLINE;
        }
    }

    @Transactional
    public AgentResponse registerAgent(String name, String description) {
        if (agentRepository.findByName(name).isPresent()) {
            throw new BadRequestException("Agent with name '" + name + "' already exists");
        }
        String rawToken = AgentSecurityUtils.generateRawToken();
        String tokenHash = AgentSecurityUtils.hashToken(rawToken);

        Agent agent = Agent.builder()
                .name(name)
                .description(description)
                .tokenHash(tokenHash)
                .build();
        agentRepository.save(agent);
        log.info("Registered remote agent: {} (ID: {})", agent.getName(), agent.getId());

        AgentResponse response = mapToResponse(agent);
        response.setToken(rawToken); // Expose plaintext token ONCE during registration
        return response;
    }

    @Transactional
    public AgentResponse rotateAgentToken(Long agentId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + agentId));

        String newRawToken = AgentSecurityUtils.generateRawToken();
        String newHash = AgentSecurityUtils.hashToken(newRawToken);

        agent.setTokenHash(newHash);
        agentRepository.save(agent);
        log.info("Rotated credentials for agent '{}' (ID: {})", agent.getName(), agent.getId());

        AgentResponse response = mapToResponse(agent);
        response.setToken(newRawToken); // Expose new plaintext token ONCE during rotation
        return response;
    }

    @Transactional(readOnly = true)
    public List<AgentResponse> getAllAgents() {
        return agentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Agent authenticateAgent(
            String tokenHeader,
            String agentIdHeader,
            String timestampHeader,
            String nonceHeader,
            String signatureHeader,
            String httpMethod,
            String requestPath,
            String requestBody
    ) {
        // If HMAC signature header is present, enforce HMAC Request Signing verification
        if (signatureHeader != null && !signatureHeader.trim().isEmpty()) {
            if (timestampHeader == null || nonceHeader == null) {
                throw new UnauthorizedException("HMAC signature provided but missing X-Agent-Timestamp or X-Agent-Nonce header");
            }

            long timestamp;
            try {
                timestamp = Long.parseLong(timestampHeader.trim());
            } catch (NumberFormatException e) {
                throw new UnauthorizedException("Invalid X-Agent-Timestamp format");
            }

            long now = System.currentTimeMillis();
            if (Math.abs(now - timestamp) > 5 * 60 * 1000L) {
                throw new UnauthorizedException("Request timestamp expired or outside 5-minute skew window");
            }

            if (nonceCache.isNonceReplayed(nonceHeader, now)) {
                throw new UnauthorizedException("Nonce replay attack detected: " + nonceHeader);
            }

            Agent agent;
            String hmacSecret;
            if (tokenHeader != null && !tokenHeader.trim().isEmpty()) {
                String hash = AgentSecurityUtils.hashToken(tokenHeader);
                agent = agentRepository.findByTokenHash(hash)
                        .orElseThrow(() -> new UnauthorizedException("Invalid agent token"));
                hmacSecret = tokenHeader.trim();
            } else if (agentIdHeader != null && !agentIdHeader.trim().isEmpty()) {
                Long agentId = Long.parseLong(agentIdHeader.trim());
                agent = agentRepository.findById(agentId)
                        .orElseThrow(() -> new UnauthorizedException("Agent not found with id: " + agentId));
                hmacSecret = agent.getTokenHash();
            } else {
                throw new UnauthorizedException("HMAC request signing requires X-Agent-Token or X-Agent-Id header");
            }

            String bodyToSign = requestBody != null ? requestBody : "";
            String canonicalPayload = agent.getId() + "\n" + httpMethod.toUpperCase() + "\n" + requestPath + "\n" + timestampHeader.trim() + "\n" + nonceHeader.trim() + "\n" + bodyToSign;

            if (!HmacSigner.verifySignature(hmacSecret, canonicalPayload, signatureHeader)) {
                throw new UnauthorizedException("Invalid HMAC signature");
            }

            return agent;
        }

        // Token fallback: authenticate using SHA-256 hash lookup of X-Agent-Token
        if (tokenHeader == null || tokenHeader.trim().isEmpty()) {
            throw new UnauthorizedException("Missing required X-Agent-Token header");
        }

        String hash = AgentSecurityUtils.hashToken(tokenHeader);
        return agentRepository.findByTokenHash(hash)
                .orElseThrow(() -> new UnauthorizedException("Invalid agent token"));
    }

    @Transactional
    public AgentTaskDto pollTask(
            String tokenHeader,
            String agentIdHeader,
            String timestampHeader,
            String nonceHeader,
            String signatureHeader,
            String httpMethod,
            String requestPath
    ) {
        Agent agent = authenticateAgent(tokenHeader, agentIdHeader, timestampHeader, nonceHeader, signatureHeader, httpMethod, requestPath, "");

        agent.setLastSeenAt(LocalDateTime.now());
        agentRepository.save(agent);

        TestJob job = jobService.claimNextPendingJobForAgent(agent.getId());
        if (job == null) {
            return null;
        }

        log.info("Agent '{}' polled and claimed Job #{}", agent.getName(), job.getId());

        return AgentTaskDto.builder()
                .jobId(job.getId())
                .executionLeaseId(job.getExecutionLeaseId())
                .attemptNumber(job.getAttemptNumber())
                .protocol(job.getEffectiveProtocol().name())
                .host(job.getEffectiveHost())
                .server(job.getEffectiveServer())
                .count(job.getEffectiveCount())
                .durationSeconds(job.getEffectiveDurationSeconds())
                .port(job.getEffectivePort())
                .build();
    }

    @Transactional
    public void submitResult(
            String tokenHeader,
            String agentIdHeader,
            String timestampHeader,
            String nonceHeader,
            String signatureHeader,
            String httpMethod,
            String requestPath,
            Long jobId,
            WorkerOutputDto output,
            String requestBodyJson
    ) {
        Agent agent = authenticateAgent(tokenHeader, agentIdHeader, timestampHeader, nonceHeader, signatureHeader, httpMethod, requestPath, requestBodyJson);

        agent.setLastSeenAt(LocalDateTime.now());
        agentRepository.save(agent);

        TestJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));

        // 1. Strict authorization check: agent can only submit results for its assigned job
        if (job.getAgent() == null || !job.getAgent().getId().equals(agent.getId())) {
            throw new UnauthorizedException("Agent ID " + agent.getId() + " is not authorized to submit results for Job #" + jobId);
        }

        // 2. Validate job status is currently RUNNING
        if (job.getStatus() != JobStatus.RUNNING) {
            throw new BadRequestException("Job #" + jobId + " is not in RUNNING status (current status: " + job.getStatus() + ")");
        }

        // 3. Validate attempt number if specified
        if (output.getAttemptNumber() != null && !output.getAttemptNumber().equals(job.getAttemptNumber())) {
            throw new UnauthorizedException("Attempt number mismatch for Job #" + jobId + ": expected " + job.getAttemptNumber() + ", got " + output.getAttemptNumber());
        }

        // 4. Strict execution lease validation against stale workers
        if (output.getExecutionLeaseId() == null || output.getExecutionLeaseId().trim().isEmpty()) {
            throw new BadRequestException("Missing required executionLeaseId for Job #" + jobId);
        }

        if (job.getExecutionLeaseId() == null || !job.getExecutionLeaseId().equals(output.getExecutionLeaseId().trim())) {
            throw new UnauthorizedException("Stale or invalid executionLeaseId for Job #" + jobId + ". Submitted: " + output.getExecutionLeaseId() + ", Active: " + job.getExecutionLeaseId());
        }

        JobStatus finalStatus = JobStatus.SUCCESS;
        if ("TIMEOUT".equals(output.getStatus())) {
            finalStatus = JobStatus.TIMEOUT;
        } else if ("FAILED".equals(output.getStatus())) {
            finalStatus = JobStatus.FAILED;
        }

        jobService.saveJobResult(jobId, finalStatus, output);
        log.info("Agent '{}' successfully submitted result for Job #{} (Lease: {})", agent.getName(), jobId, output.getExecutionLeaseId());
    }

    @Transactional
    public void deleteAgent(Long id) {
        if (!agentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Agent not found with id: " + id);
        }
        agentRepository.deleteById(id);
        log.info("Deleted remote agent ID: {}", id);
    }

    private AgentResponse mapToResponse(Agent agent) {
        return AgentResponse.builder()
                .id(agent.getId())
                .name(agent.getName())
                .description(agent.getDescription())
                .token(null) // Raw plaintext token is never exposed via normal GET calls
                .lastSeenAt(agent.getLastSeenAt())
                .createdAt(agent.getCreatedAt())
                .status(computeAgentStatus(agent))
                .build();
    }
}
