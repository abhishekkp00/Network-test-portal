package com.example.networkportal.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkerOutputDto {
    private String tool;
    private String status;
    private Double packetLossPct;
    private Double throughputMbps;
    private Double rttMinMs;
    private Double rttAvgMs;
    private Double rttMaxMs;
    private Double jitterMs;
    private String rawOutput;
    private String errorMessage;
}
