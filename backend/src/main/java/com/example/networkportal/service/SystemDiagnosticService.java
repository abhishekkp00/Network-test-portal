package com.example.networkportal.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class SystemDiagnosticService {

    @Value("${workers.ping-script-path}")
    private String pingScriptPath;

    @Value("${workers.iperf-script-path}")
    private String iperfScriptPath;

    @Value("${workers.python-path:python3}")
    private String pythonPath;

    @EventListener(ApplicationReadyEvent.class)
    public void runDiagnosticOnStartup() {
        log.info("========================================================================");
        log.info("      STARTING SYSTEM INTEGRITY AND EXECUTION CHECK (NETWORK PORTAL)    ");
        log.info("========================================================================");

        DiagnosticReport report = performDiagnostic();

        log.info("Diagnostic Timestamp: {}", report.getTimestamp());
        log.info("Python Command [{}]: {} ({})", pythonPath, report.getPythonStatus(), report.getPythonDetails());
        log.info("Ping Worker Script [{}]: {} ({})", pingScriptPath, report.getPingScriptStatus(), report.getPingScriptDetails());
        log.info("iperf3 Worker Script [{}]: {} ({})", iperfScriptPath, report.getIperfScriptStatus(), report.getIperfScriptDetails());
        log.info("System Ping Utility: {} ({})", report.getPingBinaryStatus(), report.getPingBinaryDetails());
        log.info("System iperf3 Utility: {} ({})", report.getIperfBinaryStatus(), report.getIperfBinaryDetails());
        log.info("------------------------------------------------------------------------");

        if ("SUCCESS".equals(report.getOverallStatus())) {
            log.info(">>> SYSTEM STATUS: HEALTHY (All network test orchestrations are ready) <<<");
        } else {
            log.warn(">>> SYSTEM STATUS: DEGRADED (Some integration checks failed! Review logs) <<<");
        }
        log.info("========================================================================");
    }

    public DiagnosticReport performDiagnostic() {
        DiagnosticReport report = new DiagnosticReport();
        report.setTimestamp(LocalDateTime.now().toString());

        boolean allOk = true;

        // 1. Check Python Executable
        try {
            ProcessResult res = runCommand(List.of(pythonPath, "--version"));
            if (res.isSuccess()) {
                report.setPythonStatus("OK");
                report.setPythonDetails(res.getOutput().trim());
            } else {
                report.setPythonStatus("ERROR");
                report.setPythonDetails("Exit code: " + res.getExitCode() + ". Stderr: " + res.getStderr());
                allOk = false;
            }
        } catch (Exception e) {
            report.setPythonStatus("ERROR");
            report.setPythonDetails(e.getMessage());
            allOk = false;
        }

        // 2. Check Ping Script File
        try {
            File file = new File(pingScriptPath);
            if (file.exists() && file.isFile() && file.canRead()) {
                report.setPingScriptStatus("OK");
                report.setPingScriptDetails("Absolute Path: " + file.getAbsolutePath());
            } else {
                report.setPingScriptStatus("ERROR");
                report.setPingScriptDetails("File does not exist, is directory, or is not readable.");
                allOk = false;
            }
        } catch (Exception e) {
            report.setPingScriptStatus("ERROR");
            report.setPingScriptDetails(e.getMessage());
            allOk = false;
        }

        // 3. Check iperf3 Script File
        try {
            File file = new File(iperfScriptPath);
            if (file.exists() && file.isFile() && file.canRead()) {
                report.setIperfScriptStatus("OK");
                report.setIperfScriptDetails("Absolute Path: " + file.getAbsolutePath());
            } else {
                report.setIperfScriptStatus("ERROR");
                report.setIperfScriptDetails("File does not exist, is directory, or is not readable.");
                allOk = false;
            }
        } catch (Exception e) {
            report.setIperfScriptStatus("ERROR");
            report.setIperfScriptDetails(e.getMessage());
            allOk = false;
        }

        // 4. Check standard Ping utility on path
        try {
            // Run a ping with 1 packet to localhost (127.0.0.1)
            ProcessResult res = runCommand(List.of("ping", "-c", "1", "127.0.0.1"));
            if (res.isSuccess()) {
                report.setPingBinaryStatus("OK");
                report.setPingBinaryDetails("Ping executed successfully to loopback interface.");
            } else {
                report.setPingBinaryStatus("ERROR");
                report.setPingBinaryDetails("Failed to ping loopback. Stderr: " + res.getStderr());
                allOk = false;
            }
        } catch (Exception e) {
            report.setPingBinaryStatus("ERROR");
            report.setPingBinaryDetails("Command execution failed: " + e.getMessage());
            allOk = false;
        }

        // 5. Check iperf3 utility on path
        try {
            ProcessResult res = runCommand(List.of("iperf3", "-v"));
            if (res.isSuccess()) {
                report.setIperfBinaryStatus("OK");
                // Extract the first line of version info
                String firstLine = res.getOutput().split("\n")[0].trim();
                report.setIperfBinaryDetails(firstLine);
            } else {
                report.setIperfBinaryStatus("ERROR");
                report.setIperfBinaryDetails("Failed to run version command. Stderr: " + res.getStderr());
                allOk = false;
            }
        } catch (Exception e) {
            report.setIperfBinaryStatus("ERROR");
            report.setIperfBinaryDetails("Command execution failed: " + e.getMessage());
            allOk = false;
        }

        report.setOverallStatus(allOk ? "SUCCESS" : "FAILED");
        return report;
    }

    private ProcessResult runCommand(List<String> command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        Process process = pb.start();

        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();

        try (BufferedReader outReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
             BufferedReader errReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {

            String line;
            while ((line = outReader.readLine()) != null) {
                stdout.append(line).append("\n");
            }
            while ((line = errReader.readLine()) != null) {
                stderr.append(line).append("\n");
            }
        }

        boolean completed = process.waitFor(5, TimeUnit.SECONDS);
        if (!completed) {
            process.destroyForcibly();
            return new ProcessResult(false, -1, stdout.toString(), "Execution timed out after 5 seconds.");
        }

        int exitCode = process.exitValue();
        // ping can return 0, iperf3 version returns 0.
        return new ProcessResult(exitCode == 0, exitCode, stdout.toString(), stderr.toString());
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiagnosticReport {
        private String timestamp;
        private String pythonStatus;
        private String pythonDetails;
        private String pingScriptStatus;
        private String pingScriptDetails;
        private String iperfScriptStatus;
        private String iperfScriptDetails;
        private String pingBinaryStatus;
        private String pingBinaryDetails;
        private String iperfBinaryStatus;
        private String iperfBinaryDetails;
        private String overallStatus;
    }

    @Data
    @AllArgsConstructor
    private static class ProcessResult {
        private boolean success;
        private int exitCode;
        private String output;
        private String stderr;
    }
}
