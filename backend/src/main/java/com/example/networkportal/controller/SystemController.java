package com.example.networkportal.controller;

import com.example.networkportal.service.SystemDiagnosticService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
@Tag(name = "System Diagnostics", description = "System health, worker daemon diagnostic report, and stats APIs")
public class SystemController {

    private final SystemDiagnosticService diagnosticService;

    @GetMapping("/diagnostics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Run full system diagnostic report", description = "Runs live diagnostic checks on worker binaries, database connectivity, and agent statuses. Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Diagnostic report generated successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role")
    public ResponseEntity<SystemDiagnosticService.DiagnosticReport> getSystemDiagnostics() {
        SystemDiagnosticService.DiagnosticReport report = diagnosticService.performDiagnostic();
        diagnosticService.refreshDiagnosticCache();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/stats")
    @Operation(summary = "Get system status and stats", description = "Returns lightweight counts of active jobs, registered agents, and cached overall portal health.")
    @ApiResponse(responseCode = "200", description = "System stats retrieved successfully")
    public ResponseEntity<SystemDiagnosticService.SystemStats> getSystemStats() {
        return ResponseEntity.ok(diagnosticService.getSystemStats());
    }
}
