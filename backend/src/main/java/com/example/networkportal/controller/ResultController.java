package com.example.networkportal.controller;

import com.example.networkportal.dto.ResultResponse;
import com.example.networkportal.service.ResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/results")
@RequiredArgsConstructor
@Tag(name = "Results", description = "Network diagnostic execution results and historical metrics query APIs")
public class ResultController {

    private final ResultService resultService;

    @GetMapping
    @Operation(summary = "List all test results", description = "Returns all test results sorted by execution timestamp.")
    @ApiResponse(responseCode = "200", description = "Results retrieved successfully")
    public ResponseEntity<List<ResultResponse>> getAllResults() {
        return ResponseEntity.ok(resultService.getAllResults());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get test result by ID", description = "Returns single test result metrics and output log.")
    @ApiResponse(responseCode = "200", description = "Result retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Result not found")
    public ResponseEntity<ResultResponse> getResultById(@PathVariable Long id) {
        return ResponseEntity.ok(resultService.getResultById(id));
    }

    @GetMapping("/profile/{profileId}")
    @Operation(summary = "Get historical results for a profile", description = "Returns time-series result metrics for a specific test profile.")
    @ApiResponse(responseCode = "200", description = "Profile result history retrieved successfully")
    public ResponseEntity<List<ResultResponse>> getProfileResultHistory(@PathVariable Long profileId) {
        return ResponseEntity.ok(resultService.getProfileResultHistory(profileId));
    }
}
