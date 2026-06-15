package com.example.networkportal.dto;

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
public class ProfileResponse {
    private Long id;
    private String name;
    private String description;
    private String host;
    private String server;
    private Protocol protocol;
    private Integer count;
    private Integer durationSeconds;
    private Integer port;
    private String notes;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
