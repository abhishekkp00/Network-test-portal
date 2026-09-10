package com.example.networkportal.controller;

import com.example.networkportal.dto.AgentResponse;
import com.example.networkportal.dto.AgentTaskDto;
import com.example.networkportal.dto.WorkerOutputDto;
import com.example.networkportal.service.AgentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
@Tag(name = "Agents", description = "Remote agent registration, token rotation, job polling, and result submission APIs")
public class AgentController {

    private final AgentService agentService;
    private final ObjectMapper objectMapper;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register a new remote agent", description = "Generates a cryptographically secure token and stores only its SHA-256 hash. Returns plaintext token ONCE.")
    @ApiResponse(responseCode = "200", description = "Agent successfully registered")
    @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role")
    public ResponseEntity<AgentResponse> registerAgent(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String description = body.get("description");
        return ResponseEntity.ok(agentService.registerAgent(name, description));
    }

    @PostMapping("/{id}/rotate-token")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Rotate agent credentials", description = "Revokes old token hash, generates a new token secret, and returns the new token ONCE.")
    @ApiResponse(responseCode = "200", description = "Agent token successfully rotated")
    @ApiResponse(responseCode = "404", description = "Agent not found")
    public ResponseEntity<AgentResponse> rotateAgentToken(@PathVariable Long id) {
        return ResponseEntity.ok(agentService.rotateAgentToken(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "List all registered agents", description = "Returns agent metadata, health status (ONLINE/DEGRADED/OFFLINE), and last seen timestamp.")
    @ApiResponse(responseCode = "200", description = "Agents retrieved successfully")
    public ResponseEntity<List<AgentResponse>> getAllAgents() {
        return ResponseEntity.ok(agentService.getAllAgents());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deregister / Delete agent", description = "Removes agent record from system.")
    @ApiResponse(responseCode = "204", description = "Agent deleted successfully")
    public ResponseEntity<Void> deleteAgent(@PathVariable Long id) {
        agentService.deleteAgent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/poll")
    @Operation(summary = "Poll pending diagnostic task (Agent API)", description = "Atomically claims an available PENDING test job using pessimistic row locking (`PESSIMISTIC_WRITE`) assigned to this agent using X-Agent-Token or HMAC request signing.")
    @ApiResponse(responseCode = "200", description = "Job claimed and task parameters returned")
    @ApiResponse(responseCode = "204", description = "No pending jobs available")
    @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid token or HMAC signature")
    public ResponseEntity<AgentTaskDto> pollTask(
            @RequestHeader(value = "X-Agent-Token", required = false) String token,
            @RequestHeader(value = "X-Agent-Id", required = false) String agentId,
            @RequestHeader(value = "X-Agent-Timestamp", required = false) String timestamp,
            @RequestHeader(value = "X-Agent-Nonce", required = false) String nonce,
            @RequestHeader(value = "X-Agent-Signature", required = false) String signature,
            HttpServletRequest request
    ) {
        AgentTaskDto task = agentService.pollTask(
                token, agentId, timestamp, nonce, signature,
                request.getMethod(), request.getRequestURI()
        );
        if (task == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(task);
    }

    @PostMapping("/results/{jobId}")
    @Operation(summary = "Submit diagnostic execution result (Agent API)", description = "Submits parsed execution metrics for a job owned by this agent.")
    @ApiResponse(responseCode = "200", description = "Result accepted and job transitioned to SUCCESS/FAILED")
    @ApiResponse(responseCode = "401", description = "Unauthorized - Agent does not own this job or token invalid")
    public ResponseEntity<Void> submitResult(
            @RequestHeader(value = "X-Agent-Token", required = false) String token,
            @RequestHeader(value = "X-Agent-Id", required = false) String agentId,
            @RequestHeader(value = "X-Agent-Timestamp", required = false) String timestamp,
            @RequestHeader(value = "X-Agent-Nonce", required = false) String nonce,
            @RequestHeader(value = "X-Agent-Signature", required = false) String signature,
            @PathVariable Long jobId,
            @RequestBody WorkerOutputDto output,
            HttpServletRequest request
    ) {
        String bodyJson = "";
        try {
            bodyJson = objectMapper.writeValueAsString(output);
        } catch (Exception ignored) {}

        agentService.submitResult(
                token, agentId, timestamp, nonce, signature,
                request.getMethod(), request.getRequestURI(),
                jobId, output, bodyJson
        );
        return ResponseEntity.ok().build();
    }
}
