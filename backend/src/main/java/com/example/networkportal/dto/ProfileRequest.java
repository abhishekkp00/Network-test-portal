package com.example.networkportal.dto;

import com.example.networkportal.enums.Protocol;
import com.example.networkportal.validation.HostOrIp;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProfileRequest {

    @NotBlank(message = "Profile name is required")
    private String name;

    private String description;

    @HostOrIp(message = "Host must be a valid domain name, IPv4, or IPv6 address")
    private String host;

    @HostOrIp(message = "Server must be a valid domain name, IPv4, or IPv6 address")
    private String server;

    @NotNull(message = "Protocol is required")
    private Protocol protocol;

    @Min(value = 1, message = "Count must be at least 1")
    @Max(value = 50, message = "Count cannot exceed 50")
    private Integer count;

    @Min(value = 1, message = "Duration must be at least 1 second")
    @Max(value = 120, message = "Duration cannot exceed 120 seconds")
    private Integer durationSeconds;

    @Min(value = 1, message = "Port must be at least 1")
    @Max(value = 65535, message = "Port cannot exceed 65535")
    private Integer port;

    private String notes;
}

