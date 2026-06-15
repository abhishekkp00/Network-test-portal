package com.example.networkportal.dto;

import com.example.networkportal.enums.Protocol;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProfileRequest {

    @NotBlank(message = "Profile name is required")
    private String name;

    private String description;

    // Optional override details
    private String host;
    private String server;

    @NotNull(message = "Protocol is required")
    private Protocol protocol;

    private Integer count;
    private Integer durationSeconds;
    private Integer port;
    private String notes;
}
