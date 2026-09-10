package com.example.networkportal.controller;

import com.example.networkportal.dto.IncidentResponse;
import com.example.networkportal.entity.Incident;
import com.example.networkportal.enums.IncidentStatus;
import com.example.networkportal.repository.IncidentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
@Tag(name = "Incidents", description = "Network performance incident tracking, active outage, and resolution status APIs")
public class IncidentController {

    private final IncidentRepository incidentRepository;

    @GetMapping
    @Operation(summary = "List all incidents", description = "Returns all recorded network incidents (OPEN, ONGOING, and RESOLVED).")
    @ApiResponse(responseCode = "200", description = "Incidents retrieved successfully")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents() {
        List<IncidentResponse> responses = incidentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/active")
    @Operation(summary = "List active incidents", description = "Returns currently active network incidents (OPEN or ONGOING).")
    @ApiResponse(responseCode = "200", description = "Active incidents retrieved successfully")
    public ResponseEntity<List<IncidentResponse>> getActiveIncidents() {
        List<IncidentResponse> responses = incidentRepository.findAll().stream()
                .filter(i -> i.getStatus() == IncidentStatus.OPEN || i.getStatus() == IncidentStatus.ONGOING)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get incident by ID", description = "Returns single incident details including occurrence count and timestamps.")
    @ApiResponse(responseCode = "200", description = "Incident retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Incident not found")
    public ResponseEntity<IncidentResponse> getIncidentById(@PathVariable Long id) {
        return incidentRepository.findById(id)
                .map(this::mapToResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private IncidentResponse mapToResponse(Incident incident) {
        return IncidentResponse.builder()
                .id(incident.getId())
                .profileId(incident.getProfile() != null ? incident.getProfile().getId() : null)
                .profileName(incident.getProfile() != null ? incident.getProfile().getName() : null)
                .latestResultId(incident.getLatestResult() != null ? incident.getLatestResult().getId() : null)
                .severity(incident.getSeverity())
                .status(incident.getStatus())
                .firstSeenAt(incident.getFirstSeenAt())
                .lastSeenAt(incident.getLastSeenAt())
                .resolvedAt(incident.getResolvedAt())
                .occurrenceCount(incident.getOccurrenceCount())
                .summary(incident.getSummary())
                .build();
    }
}
