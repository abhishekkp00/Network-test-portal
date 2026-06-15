package com.example.networkportal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ResultResponse {
    private Long id;
    private Long jobId;
    private Double packetLossPct;
    private Double throughputMbps;
    private Double rttMinMs;
    private Double rttAvgMs;
    private Double rttMaxMs;
    private Double jitterMs;
    private String rawOutput;
    private String errorMessage;
    private Integer exitCode;
    private String parsedStatus;
    private LocalDateTime createdAt;
}
