package com.example.networkportal.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/v1/diagnostics")
@Tag(name = "Diagnostics", description = "Real-time interactive diagnostic stream (Server-Sent Events) APIs")
public class InteractiveDiagnosticsController {

    private final ExecutorService executor = Executors.newCachedThreadPool();

    @GetMapping(value = "/live-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Live diagnostic SSE stream", description = "Streams real-time terminal output of ping or tracepath execution line-by-line via Server-Sent Events (SSE). Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "SSE stream established successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role")
    public SseEmitter streamLiveConsole(
            @RequestParam String host,
            @RequestParam String protocol,
            @RequestParam(defaultValue = "5") int count
    ) {
        SseEmitter emitter = new SseEmitter(120000L);

        if (host == null || host.trim().isEmpty() || !host.matches("^[a-zA-Z0-9.-]+$")) {
            try {
                emitter.send(SseEmitter.event().name("error").data("Invalid destination address. Only alphanumeric, dashes, and dots are allowed."));
                emitter.complete();
            } catch (Exception e) {
                // Ignore
            }
            return emitter;
        }

        executor.execute(() -> {
            Process process = null;
            try {
                List<String> command = new ArrayList<>();
                if ("TRACEPATH".equalsIgnoreCase(protocol)) {
                    command.add("tracepath");
                    command.add("-n");
                    command.add(host);
                } else {
                    command.add("ping");
                    command.add("-c");
                    command.add(String.valueOf(count));
                    command.add(host);
                }

                ProcessBuilder pb = new ProcessBuilder(command);
                pb.redirectErrorStream(true);
                process = pb.start();

                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        emitter.send(SseEmitter.event().name("message").data(line));
                    }
                }

                int exitCode = process.waitFor();
                emitter.send(SseEmitter.event().name("exit").data(String.valueOf(exitCode)));
                emitter.complete();

            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data("Execution error: " + e.getMessage()));
                } catch (Exception ex) {
                    // Ignore
                }
                emitter.completeWithError(e);
            } finally {
                if (process != null) {
                    process.destroyForcibly();
                }
            }
        });

        return emitter;
    }
}
