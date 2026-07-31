package com.example.networkportal.controller;

import com.example.networkportal.dto.ProfileRequest;
import com.example.networkportal.dto.ProfileResponse;
import com.example.networkportal.entity.User;
import com.example.networkportal.service.ProfileService;
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
public class ProfileController {

    private final ProfileService profileService;

    @PostMapping
    public ResponseEntity<ProfileResponse> createProfile(
            @Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return new ResponseEntity<>(profileService.createProfile(request, currentUser), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ProfileResponse>> getAllProfiles() {
        return ResponseEntity.ok(profileService.getAllProfiles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfileResponse> getProfileById(@PathVariable Long id) {
        return ResponseEntity.ok(profileService.getProfileById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfileResponse> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody ProfileRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(profileService.updateProfile(id, request,currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        profileService.deleteProfile(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
