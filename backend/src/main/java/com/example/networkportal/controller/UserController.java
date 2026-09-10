package com.example.networkportal.controller;

import com.example.networkportal.dto.EnabledUpdateRequest;
import com.example.networkportal.dto.RoleUpdateRequest;
import com.example.networkportal.dto.UserResponse;
import com.example.networkportal.entity.User;
import com.example.networkportal.enums.Role;
import com.example.networkportal.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "User Management", description = "Portal user management, role elevation, and account status APIs (ADMIN only)")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "List all user accounts", description = "Returns all registered user profiles and role assignments. Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Users retrieved successfully")
    @ApiResponse(responseCode = "403", description = "Forbidden - Requires ADMIN role")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user details by ID", description = "Returns single user account metadata. Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "User retrieved successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Update user role", description = "Elevates or changes role assignment (ADMIN, OPERATOR, VIEWER). Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Role updated successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequest request,
            @AuthenticationPrincipal User adminUser
    ) {
        Role role = Role.valueOf(request.getRole().toUpperCase());
        return ResponseEntity.ok(userService.updateUserRole(id, role, adminUser.getUsername()));
    }

    @PatchMapping("/{id}/enabled")
    @Operation(summary = "Enable or disable user account", description = "Toggles user enabled/disabled status. Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Account status updated successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<UserResponse> updateUserEnabled(
            @PathVariable Long id,
            @Valid @RequestBody EnabledUpdateRequest request,
            @AuthenticationPrincipal User adminUser
    ) {
        return ResponseEntity.ok(userService.updateUserEnabled(id, request.isEnabled(), adminUser.getUsername()));
    }
}
