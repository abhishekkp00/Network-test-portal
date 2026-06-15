package com.example.networkportal.service;

import com.example.networkportal.dto.WorkerOutputDto;
import com.example.networkportal.enums.Protocol;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class PythonWorkerExecutorService {

    private final ObjectMapper objectMapper;

    @Value("${workers.ping-script-path}")
    private String pingScriptPath;

    @Value("${workers.iperf-script-path}")
    private String iperfScriptPath;

    @Value("${workers.python-path:python3}")
    private String pythonPath;

    @Value("${workers.timeout-seconds:30}")
    private int timeoutSeconds;

    public WorkerOutputDto executeWorker(
            Protocol protocol,
            String host,
            String server,
            Integer count,
            Integer duration,
            Integer port
    ) {
        List<String> command = new ArrayList<>();
        command.add(pythonPath);

        if (protocol == Protocol.PING) {
            command.add(pingScriptPath);
            command.add("--host");
            command.add(host != null ? host : "8.8.8.8");
            command.add("--count");
            command.add(String.valueOf(count != null ? count : 4));
        } else {
            command.add(iperfScriptPath);
            command.add("--server");
            command.add(server != null ? server : "localhost");
            command.add("--duration");
            command.add(String.valueOf(duration != null ? duration : 10));
            command.add("--protocol");
            command.add(protocol == Protocol.IPERF_TCP ? "tcp" : "udp");
            if (port != null) {
                command.add("--port");
                command.add(String.valueOf(port));
            }
        }

        log.info("Executing worker command: {}", String.join(" ", command));

        ProcessBuilder pb = new ProcessBuilder(command);
        Process process = null;
        StringBuilder stdoutBuilder = new StringBuilder();
        StringBuilder stderrBuilder = new StringBuilder();

        try {
            process = pb.start();

            // Read stdout asynchronously
            final Process finalProcess = process;
            Thread stdoutThread = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(finalProcess.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stdoutBuilder.append(line).append("\n");
                    }
                } catch (IOException e) {
                    log.error("Error reading process stdout", e);
                }
            });

            // Read stderr asynchronously
            Thread stderrThread = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(finalProcess.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stderrBuilder.append(line).append("\n");
                    }
                } catch (IOException e) {
                    log.error("Error reading process stderr", e);
                }
            });

            stdoutThread.start();
            stderrThread.start();

            // Wait for process to complete with timeout
            boolean completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

            stdoutThread.join(1000);
            stderrThread.join(1000);

            if (!completed) {
                log.warn("Process timed out after {} seconds. Terminating...", timeoutSeconds);
                process.destroyForcibly();
                return WorkerOutputDto.builder()
                        .status("TIMEOUT")
                        .errorMessage("Execution timed out after " + timeoutSeconds + " seconds")
                        .rawOutput(stdoutBuilder.toString())
                        .build();
            }

            int exitCode = process.exitValue();
            String stdout = stdoutBuilder.toString().trim();
            String stderr = stderrBuilder.toString().trim();

            log.info("Process exited with code {}. Stdout length: {}, Stderr length: {}", exitCode, stdout.length(), stderr.length());

            if (exitCode != 0) {
                log.error("Process exit code indicates failure. Stderr: {}", stderr);
                // Try parsing stdout anyway in case it returned formatted JSON error
                if (!stdout.isEmpty() && stdout.startsWith("{")) {
                    try {
                        return objectMapper.readValue(stdout, WorkerOutputDto.class);
                    } catch (Exception parseEx) {
                        // ignore and fall back
                    }
                }
                return WorkerOutputDto.builder()
                        .status("FAILED")
                        .errorMessage("Process failed with exit code " + exitCode + ". Stderr: " + stderr)
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
                log.error("Failed to parse JSON output: {}", stdout, parseEx);
                return WorkerOutputDto.builder()
                        .status("FAILED")
                        .errorMessage("JSON parsing error: " + parseEx.getMessage())
                        .rawOutput(stdout)
                        .build();
            }

        } catch (IOException e) {
            log.error("IOException executing worker", e);
            return WorkerOutputDto.builder()
                    .status("FAILED")
                    .errorMessage("IO Exception executing worker: " + e.getMessage())
                    .build();
        } catch (InterruptedException e) {
            log.error("Process execution interrupted", e);
            Thread.currentThread().interrupt();
            if (process != null) {
                process.destroyForcibly();
            }
            return WorkerOutputDto.builder()
                    .status("FAILED")
                    .errorMessage("Execution interrupted: " + e.getMessage())
                    .build();
        }
    }
}
