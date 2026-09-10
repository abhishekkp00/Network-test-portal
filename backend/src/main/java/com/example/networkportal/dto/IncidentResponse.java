package com.example.networkportal.dto;

import com.example.networkportal.enums.IncidentSeverity;
import com.example.networkportal.enums.IncidentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentResponse {
    private Long id;
    private Long profileId;
    private String profileName;
    private Long latestResultId;
    private IncidentSeverity severity;
    private IncidentStatus status;
    private LocalDateTime firstSeenAt;
    private LocalDateTime lastSeenAt;
    private LocalDateTime resolvedAt;
    private Integer occurrenceCount;
    private String summary;
}
