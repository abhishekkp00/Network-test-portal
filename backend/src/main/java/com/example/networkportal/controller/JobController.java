package com.example.networkportal.controller;

import com.example.networkportal.dto.JobRequest;
import com.example.networkportal.dto.JobResponse;
import com.example.networkportal.dto.ResultResponse;
import com.example.networkportal.entity.User;
import com.example.networkportal.service.JobService;
import com.example.networkportal.service.ResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Diagnostic job queue management, dispatching, and result lookup APIs")
public class JobController {

    private final JobService jobService;
    private final ResultService resultService;

    @PostMapping
    @Operation(summary = "Create a diagnostic test job", description = "Enqueues a new PENDING test job based on a specified test profile or custom parameters.")
    @ApiResponse(responseCode = "201", description = "Job created and enqueued in PENDING state")
    @ApiResponse(responseCode = "400", description = "Invalid host/server, protocol parameters, or profile ID")
    public ResponseEntity<JobResponse> createJob(
            @Valid @RequestBody JobRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(jobService.createJob(request, currentUser), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List all diagnostic jobs", description = "Returns all test jobs sorted by creation timestamp.")
    @ApiResponse(responseCode = "200", description = "List of test jobs retrieved successfully")
    public ResponseEntity<List<JobResponse>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get diagnostic job by ID", description = "Returns detailed status and metadata of a single test job.")
    @ApiResponse(responseCode = "200", description = "Job retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Job not found")
    public ResponseEntity<JobResponse> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    @GetMapping("/{id}/result")
    @Operation(summary = "Get execution results for a job", description = "Returns parsed execution metrics (latency, loss, throughput, jitter) and raw output for a completed job.")
    @ApiResponse(responseCode = "200", description = "Result retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Job or result not found")
    public ResponseEntity<ResultResponse> getJobResult(@PathVariable Long id) {
        return ResponseEntity.ok(resultService.getResultByJobId(id));
    }
}
