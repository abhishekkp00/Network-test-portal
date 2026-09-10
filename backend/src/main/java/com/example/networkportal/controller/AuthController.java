package com.example.networkportal.controller;

import com.example.networkportal.dto.AuthResponse;
import com.example.networkportal.dto.LoginRequest;
import com.example.networkportal.dto.RegisterRequest;
import com.example.networkportal.dto.UserResponse;
import com.example.networkportal.entity.User;
import com.example.networkportal.service.AuthService;
import com.example.networkportal.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration, login and JWT token management APIs")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user account", description = "Creates a new user account. First registered user automatically receives ADMIN role; subsequent users default to VIEWER.")
    @ApiResponse(responseCode = "200", description = "User successfully registered and JWT returned")
    @ApiResponse(responseCode = "400", description = "Duplicate username/email or validation failure")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials", description = "Validates username and password, returning a JWT token for authorized API access.")
    @ApiResponse(responseCode = "200", description = "User successfully authenticated and JWT returned")
    @ApiResponse(responseCode = "401", description = "Invalid credentials or disabled user account")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile", description = "Returns details of the currently authenticated user based on JWT Bearer token.")
    @ApiResponse(responseCode = "200", description = "User details retrieved successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized - Missing or invalid JWT")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.mapToResponse(currentUser));
    }
}
