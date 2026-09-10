package com.example.networkportal.dto;

import com.example.networkportal.enums.AgentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AgentResponse {
    private Long id;
    private String name;
    private String description;
    private String token;
    private LocalDateTime lastSeenAt;
    private LocalDateTime createdAt;
    private AgentStatus status;
}
