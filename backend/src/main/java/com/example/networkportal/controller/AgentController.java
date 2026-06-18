package com.example.networkportal.controller;

import com.example.networkportal.dto.AgentResponse;
import com.example.networkportal.dto.AgentTaskDto;
import com.example.networkportal.dto.WorkerOutputDto;
import com.example.networkportal.service.AgentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AgentResponse> registerAgent(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String description = body.get("description");
        return ResponseEntity.ok(agentService.registerAgent(name, description));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<List<AgentResponse>> getAllAgents() {
        return ResponseEntity.ok(agentService.getAllAgents());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAgent(@PathVariable Long id) {
        agentService.deleteAgent(id);
        return ResponseEntity.noContent().build();
    }

    // Polling endpoint for Python agent
    @GetMapping("/poll")
    public ResponseEntity<AgentTaskDto> pollTask(@RequestHeader("X-Agent-Token") String token) {
        AgentTaskDto task = agentService.pollTask(token);
        if (task == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(task);
    }

    // Result submission endpoint for Python agent
    @PostMapping("/results/{jobId}")
    public ResponseEntity<Void> submitResult(
            @RequestHeader("X-Agent-Token") String token,
            @PathVariable Long jobId,
            @RequestBody WorkerOutputDto output) {
        agentService.submitResult(token, jobId, output);
        return ResponseEntity.ok().build();
    }
}
