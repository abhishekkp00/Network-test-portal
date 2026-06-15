package com.example.networkportal.dto;

import com.example.networkportal.enums.Protocol;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class JobRequest {

    @NotNull(message = "Profile ID is required")
    private Long profileId;

    private String hostOverride;
    private String serverOverride;
    private Protocol protocolOverride;
    private Integer countOverride;
    private Integer durationSecondsOverride;
    private Integer portOverride;
}
