package com.example.networkportal.controller;

import com.example.networkportal.dto.JobRequest;
import com.example.networkportal.dto.JobResponse;
import com.example.networkportal.dto.ResultResponse;
import com.example.networkportal.entity.User;
import com.example.networkportal.service.JobService;
import com.example.networkportal.service.ResultService;
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
public class JobController {

    private final JobService jobService;
    private final ResultService resultService;

    @PostMapping
    public ResponseEntity<JobResponse> createJob(
            @Valid @RequestBody JobRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(jobService.createJob(request, currentUser), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<JobResponse>> getAllJobs() {
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getJobById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobById(id));
    }

    @GetMapping("/{id}/result")
    public ResponseEntity<ResultResponse> getJobResult(@PathVariable Long id) {
        return ResponseEntity.ok(resultService.getResultByJobId(id));
    }
}
