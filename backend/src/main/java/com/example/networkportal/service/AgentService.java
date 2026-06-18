package com.example.networkportal.service;

import com.example.networkportal.dto.AgentResponse;
import com.example.networkportal.dto.AgentTaskDto;
import com.example.networkportal.dto.WorkerOutputDto;
import com.example.networkportal.entity.Agent;
import com.example.networkportal.entity.TestJob;
import com.example.networkportal.enums.JobStatus;
import com.example.networkportal.exception.BadRequestException;
import com.example.networkportal.exception.ResourceNotFoundException;
import com.example.networkportal.exception.UnauthorizedException;
import com.example.networkportal.repository.AgentRepository;
import com.example.networkportal.repository.TestJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentService {

    private final AgentRepository agentRepository;
    private final TestJobRepository jobRepository;
    private final JobService jobService;

    @Transactional
    public AgentResponse registerAgent(String name, String description) {
        if (agentRepository.findByName(name).isPresent()) {
            throw new BadRequestException("Agent with name '" + name + "' already exists");
        }
        String token = java.util.UUID.randomUUID().toString();
        Agent agent = Agent.builder()
                .name(name)
                .description(description)
                .token(token)
                .build();
        agentRepository.save(agent);
        log.info("Registered remote agent: {} (ID: {})", agent.getName(), agent.getId());
        return mapToResponse(agent);
    }

    @Transactional(readOnly = true)
    public List<AgentResponse> getAllAgents() {
        return agentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AgentTaskDto pollTask(String token) {
        Agent agent = agentRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid agent token"));

        agent.setLastSeenAt(LocalDateTime.now());
        agentRepository.save(agent);

        Optional<TestJob> pendingJobOpt = jobRepository.findFirstByAgentIdAndStatusOrderByIdAsc(agent.getId(), JobStatus.PENDING);
        if (pendingJobOpt.isEmpty()) {
            return null;
        }

        TestJob job = pendingJobOpt.get();
        job.setStatus(JobStatus.RUNNING);
        job.setStartedAt(LocalDateTime.now());
        jobRepository.save(job);

        log.info("Agent '{}' polled and claimed Job #{}", agent.getName(), job.getId());

        return AgentTaskDto.builder()
                .jobId(job.getId())
                .protocol(job.getEffectiveProtocol().name())
                .host(job.getEffectiveHost())
                .server(job.getEffectiveServer())
                .count(job.getEffectiveCount())
                .durationSeconds(job.getEffectiveDurationSeconds())
                .port(job.getEffectivePort())
                .build();
    }

    @Transactional
    public void submitResult(String token, Long jobId, WorkerOutputDto output) {
        Agent agent = agentRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid agent token"));

        agent.setLastSeenAt(LocalDateTime.now());
        agentRepository.save(agent);

        TestJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));

        if (job.getAgent() == null || !job.getAgent().getId().equals(agent.getId())) {
            throw new UnauthorizedException("Agent not authorized to submit results for this job");
        }

        JobStatus finalStatus = JobStatus.SUCCESS;
        if ("TIMEOUT".equals(output.getStatus())) {
            finalStatus = JobStatus.TIMEOUT;
        } else if ("FAILED".equals(output.getStatus())) {
            finalStatus = JobStatus.FAILED;
        }

        jobService.saveJobResult(jobId, finalStatus, output);
        log.info("Agent '{}' successfully submitted result for Job #{}", agent.getName(), jobId);
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
                .token(agent.getToken())
                .lastSeenAt(agent.getLastSeenAt())
                .createdAt(agent.getCreatedAt())
                .build();
    }
}
