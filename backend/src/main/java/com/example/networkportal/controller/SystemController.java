package com.example.networkportal.controller;

import com.example.networkportal.service.SystemDiagnosticService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
public class SystemController {

    private final SystemDiagnosticService diagnosticService;

    @GetMapping("/diagnostics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemDiagnosticService.DiagnosticReport> getSystemDiagnostics() {
        return ResponseEntity.ok(diagnosticService.performDiagnostic());
    }
}
