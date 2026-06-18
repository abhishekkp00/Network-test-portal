package com.example.networkportal.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgentTaskDto {
    private Long jobId;
    private String protocol;
    private String host;
    private String server;
    private Integer count;
    private Integer durationSeconds;
    private Integer port;
}
