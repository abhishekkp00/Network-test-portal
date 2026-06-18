package com.example.networkportal.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AgentResponse {
    private Long id;
    private String name;
    private String description;
    private String token;
    private LocalDateTime lastSeenAt;
    private LocalDateTime createdAt;
}
