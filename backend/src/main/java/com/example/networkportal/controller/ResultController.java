package com.example.networkportal.controller;

import com.example.networkportal.dto.ResultResponse;
import com.example.networkportal.service.ResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;

    @GetMapping
    public ResponseEntity<List<ResultResponse>> getAllResults() {
        return ResponseEntity.ok(resultService.getAllResults());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResultResponse> getResultById(@PathVariable Long id) {
        return ResponseEntity.ok(resultService.getResultById(id));
    }

    @GetMapping("/profile/{profileId}")
    public ResponseEntity<List<ResultResponse>> getProfileResultHistory(@PathVariable Long profileId) {
        return ResponseEntity.ok(resultService.getProfileResultHistory(profileId));
    }
}
