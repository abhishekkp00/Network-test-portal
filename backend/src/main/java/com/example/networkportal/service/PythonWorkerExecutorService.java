package com.example.networkportal.service;

import com.example.networkportal.dto.WorkerOutputDto;
import com.example.networkportal.enums.Protocol;
import com.example.networkportal.exception.BadRequestException;
import com.example.networkportal.validation.HostOrIpValidator;
import com.example.networkportal.validation.NetworkTargetProtectionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class PythonWorkerExecutorService {

    private final ObjectMapper objectMapper;
    private final NetworkTargetProtectionService targetProtectionService;

    @Value("${workers.ping-script-path:}")
    private String pingScriptPath;

    @Value("${workers.iperf-script-path:}")
    private String iperfScriptPath;

    @Value("${workers.tracepath-script-path:}")
    private String tracepathScriptPath;

    @Value("${workers.python-path:python3}")
    private String pythonPath;

    @Value("${workers.timeout-seconds:30}")
    private int timeoutSeconds = 30;

    @Value("${workers.max-output-bytes:1048576}")
    private int maxOutputBytes = 1048576;

    @Value("${workers.max-concurrent-processes:10}")
    private int maxConcurrentProcesses = 10;

    private Semaphore executionSemaphore;

    // Allowlisted binary names/paths to prevent unapproved binary execution
    private static final Set<String> ALLOWED_BINARIES = Set.of("python3", "python", "ping", "tracepath", "iperf3");

    @PostConstruct
    public void init() {
        this.executionSemaphore = new Semaphore(maxConcurrentProcesses);
    }

    public WorkerOutputDto executeWorker(
            Protocol protocol,
            String host,
            String server,
            Integer count,
            Integer duration,
            Integer port
    ) {
        String target = (protocol == Protocol.PING || protocol == Protocol.TRACEPATH) ? host : server;

        // 1. Strict Input & Target Validation
        validateInputAndTarget(protocol, target, count, duration, port);

        // 2. Command & Argument Allowlisting via discrete List<String> for ProcessBuilder
        List<String> command = buildAllowlistedCommand(protocol, target, count, duration, port);

        log.info("Executing allowlisted diagnostic command: {}", String.join(" ", command));

        // 3. Execution Concurrency Protection
        boolean acquired;
        try {
            acquired = executionSemaphore.tryAcquire(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return WorkerOutputDto.builder()
                    .status("FAILED")
                    .errorMessage("Execution interrupted while acquiring concurrency slot")
                    .build();
        }

        if (!acquired) {
            log.warn("Diagnostic execution queue full (max concurrency: {})", maxConcurrentProcesses);
            return WorkerOutputDto.builder()
                    .status("FAILED")
                    .errorMessage("Diagnostic execution concurrency limit (" + maxConcurrentProcesses + ") reached")
                    .build();
        }

        Process process = null;
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            process = pb.start();

            // 4. Bounded Output Stream Consumption (Maximum Output Size Protection)
            final Process procRef = process;
            StringBuilder stdoutBuilder = new StringBuilder();
            StringBuilder stderrBuilder = new StringBuilder();

            Thread stdoutThread = new Thread(() -> readBoundedStream(procRef.getInputStream(), stdoutBuilder, maxOutputBytes));
            Thread stderrThread = new Thread(() -> readBoundedStream(procRef.getErrorStream(), stderrBuilder, maxOutputBytes));

            stdoutThread.start();
            stderrThread.start();

            // 5. Timeout & Child Process Tree Protection
            boolean completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

            stdoutThread.join(1000);
            stderrThread.join(1000);

            if (!completed) {
                log.warn("Process timed out after {}s. Forcibly terminating process tree...", timeoutSeconds);
                terminateProcessTree(process);
                return WorkerOutputDto.builder()
                        .status("TIMEOUT")
                        .errorMessage("Execution timed out after " + timeoutSeconds + " seconds")
                        .rawOutput(stdoutBuilder.toString())
                        .build();
            }

            int exitCode = process.exitValue();
            String stdout = stdoutBuilder.toString().trim();
            String stderr = stderrBuilder.toString().trim();

            if (exitCode != 0) {
                if (!stdout.isEmpty() && stdout.startsWith("{")) {
                    try {
                        return objectMapper.readValue(stdout, WorkerOutputDto.class);
                    } catch (Exception ignored) {}
                }
                return WorkerOutputDto.builder()
                        .status("FAILED")
                        .errorMessage("Diagnostic process exited with code " + exitCode + ". Stderr: " + stderr)
                        .rawOutput(stdout)
                        .build();
            }

            if (stdout.isEmpty()) {
                return WorkerOutputDto.builder()
                        .status("FAILED")
                        .errorMessage("Process returned empty output. Stderr: " + stderr)
                        .build();
            }

            try {
                WorkerOutputDto output = objectMapper.readValue(stdout, WorkerOutputDto.class);
                if (output.getRawOutput() == null || output.getRawOutput().isEmpty()) {
                    output.setRawOutput(stdout);
                }
                return output;
            } catch (Exception parseEx) {
                return WorkerOutputDto.builder()
                        .status("SUCCESS")
                        .rawOutput(stdout)
                        .build();
            }

        } catch (Exception e) {
            log.error("Execution error for protocol {}", protocol, e);
            if (process != null) {
                terminateProcessTree(process);
            }
            return WorkerOutputDto.builder()
                    .status("FAILED")
                    .errorMessage("Execution error: " + e.getMessage())
                    .build();
        } finally {
            executionSemaphore.release();
        }
    }

    private void validateInputAndTarget(Protocol protocol, String target, Integer count, Integer duration, Integer port) {
        if (target == null || target.trim().isEmpty()) {
            throw new BadRequestException("Target host/server is required for protocol " + protocol);
        }

        // Host/IP regex and metacharacter check
        HostOrIpValidator hostValidator = new HostOrIpValidator();
        if (!hostValidator.isValid(target, null)) {
            throw new BadRequestException("Invalid target format or dangerous characters in: " + target);
        }

        // Infrastructure network target protection (loopback, metadata IP, multicast)
        targetProtectionService.validateTarget(target);

        // Protocol-specific parameter checks
        if (protocol == Protocol.PING && count != null && (count < 1 || count > 50)) {
            throw new BadRequestException("Ping count must be between 1 and 50");
        }
        if ((protocol == Protocol.IPERF_TCP || protocol == Protocol.IPERF_UDP)) {
            if (duration != null && (duration < 1 || duration > 120)) {
                throw new BadRequestException("iperf3 duration must be between 1 and 120 seconds");
            }
            if (port != null && (port < 1 || port > 65535)) {
                throw new BadRequestException("iperf3 port must be between 1 and 65535");
            }
        }
    }

    private List<String> buildAllowlistedCommand(Protocol protocol, String target, Integer count, Integer duration, Integer port) {
        List<String> command = new ArrayList<>();
        String binary = pythonPath != null ? pythonPath : "python3";

        // Verify primary binary is allowlisted
        String binaryName = binary.substring(binary.lastIndexOf('/') + 1);
        if (!ALLOWED_BINARIES.contains(binaryName.toLowerCase())) {
            throw new SecurityException("Execution of unapproved binary is prohibited: " + binary);
        }
        command.add(binary);

        if (protocol == Protocol.PING) {
            if (pingScriptPath != null && !pingScriptPath.isEmpty()) {
                command.add(pingScriptPath);
                command.add("--host");
                command.add(target);
                command.add("--count");
                command.add(String.valueOf(count != null ? count : 4));
            } else {
                command.clear();
                command.add("ping");
                command.add("-c");
                command.add(String.valueOf(count != null ? count : 4));
                command.add(target);
            }
        } else if (protocol == Protocol.TRACEPATH) {
            if (tracepathScriptPath != null && !tracepathScriptPath.isEmpty()) {
                command.add(tracepathScriptPath);
                command.add("--host");
                command.add(target);
            } else {
                command.clear();
                command.add("tracepath");
                command.add("-n");
                command.add(target);
            }
        } else {
            if (iperfScriptPath != null && !iperfScriptPath.isEmpty()) {
                command.add(iperfScriptPath);
                command.add("--server");
                command.add(target);
                command.add("--duration");
                command.add(String.valueOf(duration != null ? duration : 10));
                command.add("--protocol");
                command.add(protocol == Protocol.IPERF_TCP ? "tcp" : "udp");
                if (port != null) {
                    command.add("--port");
                    command.add(String.valueOf(port));
                }
            } else {
                command.clear();
                command.add("iperf3");
                command.add("-c");
                command.add(target);
                command.add("-t");
                command.add(String.valueOf(duration != null ? duration : 10));
                command.add("-p");
                command.add(String.valueOf(port != null ? port : 5201));
                if (protocol == Protocol.IPERF_UDP) {
                    command.add("-u");
                }
                command.add("-J");
            }
        }

        return command;
    }

    private void readBoundedStream(InputStream is, StringBuilder sb, int maxBytes) {
        try (InputStreamReader reader = new InputStreamReader(is, StandardCharsets.UTF_8)) {
            char[] buffer = new char[1024];
            int totalRead = 0;
            int read;
            while ((read = reader.read(buffer)) != -1) {
                if (totalRead + read > maxBytes) {
                    int allowed = Math.max(0, maxBytes - totalRead);
                    if (allowed > 0) {
                        sb.append(buffer, 0, allowed);
                    }
                    sb.append("\n[OUTPUT TRUNCATED: Exceeded maximum allowed output limit of ").append(maxBytes).append(" bytes]");
                    break;
                }
                sb.append(buffer, 0, read);
                totalRead += read;
            }
        } catch (Exception e) {
            log.error("Error reading process stream", e);
        }
    }

    private void terminateProcessTree(Process process) {
        if (process == null) return;
        try {
            process.descendants().forEach(ProcessHandle::destroyForcibly);
        } catch (Exception e) {
            log.debug("Error terminating child process tree", e);
        }
        try {
            process.destroyForcibly();
        } catch (Exception e) {
            log.debug("Error forcibly destroying main process", e);
        }
    }
}
