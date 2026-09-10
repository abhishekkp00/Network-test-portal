package com.example.networkportal.controller;

import com.example.networkportal.dto.ProfileRequest;
import com.example.networkportal.dto.ProfileResponse;
import com.example.networkportal.entity.User;
import com.example.networkportal.service.ProfileService;
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
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
@Tag(name = "Profiles", description = "Reusable network test target profiles and scheduled test configuration APIs")
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping
    @Operation(summary = "Create test profile", description = "Creates a reusable network diagnostic profile with validated target and protocol parameters.")
    @ApiResponse(responseCode = "201", description = "Profile created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid host/server, protocol parameters, or prohibited target")
    public ResponseEntity<ProfileResponse> createProfile(
            @Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(profileService.createProfile(request, currentUser), HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List all test profiles", description = "Returns all test profiles configured in the system.")
    @ApiResponse(responseCode = "200", description = "Profiles retrieved successfully")
    public ResponseEntity<List<ProfileResponse>> getAllProfiles() {
        return ResponseEntity.ok(profileService.getAllProfiles());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get profile by ID", description = "Returns single test profile details.")
    @ApiResponse(responseCode = "200", description = "Profile retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Profile not found")
    public ResponseEntity<ProfileResponse> getProfileById(@PathVariable Long id) {
        return ResponseEntity.ok(profileService.getProfileById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update test profile", description = "Updates profile target, protocol parameters, or schedule cron expression.")
    @ApiResponse(responseCode = "200", description = "Profile updated successfully")
    @ApiResponse(responseCode = "404", description = "Profile not found")
    public ResponseEntity<ProfileResponse> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(profileService.updateProfile(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete test profile", description = "Removes a test profile.")
    @ApiResponse(responseCode = "204", description = "Profile deleted successfully")
    public ResponseEntity<Void> deleteProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        profileService.deleteProfile(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
