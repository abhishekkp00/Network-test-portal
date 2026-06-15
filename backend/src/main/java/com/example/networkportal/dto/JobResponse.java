package com.example.networkportal.dto;

import com.example.networkportal.enums.JobStatus;
import com.example.networkportal.enums.Protocol;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class JobResponse {
    private Long id;
    private Long profileId;
    private String profileName;
    private String requestedByUsername;
    private JobStatus status;
    private String effectiveHost;
    private String effectiveServer;
    private Protocol effectiveProtocol;
    private Integer effectiveCount;
    private Integer effectiveDurationSeconds;
    private Integer effectivePort;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private LocalDateTime createdAt;
}
