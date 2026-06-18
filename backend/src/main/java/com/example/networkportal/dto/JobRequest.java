package com.example.networkportal.dto;

import com.example.networkportal.enums.Protocol;
import com.example.networkportal.validation.HostOrIp;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class JobRequest {

    @NotNull(message = "Profile ID is required")
    private Long profileId;

    @HostOrIp(message = "Host override must be a valid domain name, IPv4, or IPv6 address")
    private String hostOverride;

    @HostOrIp(message = "Server override must be a valid domain name, IPv4, or IPv6 address")
    private String serverOverride;

    private Protocol protocolOverride;

    @Min(value = 1, message = "Count override must be at least 1")
    @Max(value = 50, message = "Count override cannot exceed 50")
    private Integer countOverride;

    @Min(value = 1, message = "Duration override must be at least 1 second")
    @Max(value = 120, message = "Duration override cannot exceed 120 seconds")
    private Integer durationSecondsOverride;

    @Min(value = 1, message = "Port override must be at least 1")
    @Max(value = 65535, message = "Port override cannot exceed 65535")
    private Integer portOverride;

    private Long agentId;
}

