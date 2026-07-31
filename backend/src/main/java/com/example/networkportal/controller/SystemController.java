package com.example.networkportal.controller;

import com.example.networkportal.service.SystemDiagnosticService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
public class SystemController {

    private final SystemDiagnosticService diagnosticService;

    /**
     * Runs a full live diagnostic and returns the report.
     * Also refreshes the cached overall status used by /stats.
     */
    @GetMapping("/diagnostics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemDiagnosticService.DiagnosticReport> getSystemDiagnostics() {
        SystemDiagnosticService.DiagnosticReport report = diagnosticService.performDiagnostic();
        // Refresh cached status after an admin explicitly runs diagnostics
        diagnosticService.refreshDiagnosticCache();
        return ResponseEntity.ok(report);
    }

    /**
     * Returns lightweight counters + cached health status.
     * Does NOT run OS commands — safe to call frequently.
     */
    @GetMapping("/stats")
    public ResponseEntity<SystemDiagnosticService.SystemStats> getSystemStats() {
        return ResponseEntity.ok(diagnosticService.getSystemStats());
    }
}
