package com.example.networkportal.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobRecoveryService {

    private final JobService jobService;

    @Value("${jobs.stale-timeout-seconds:60}")
    private long staleTimeoutSeconds;

    @Scheduled(fixedDelayString = "${jobs.recovery.interval-ms:10000}")
    public void checkAndRecoverStaleJobs() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(staleTimeoutSeconds);
        jobService.processStaleJobs(cutoff);
    }
}
