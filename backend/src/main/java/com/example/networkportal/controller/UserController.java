package com.example.networkportal.controller;

import com.example.networkportal.dto.EnabledUpdateRequest;
import com.example.networkportal.dto.RoleUpdateRequest;
import com.example.networkportal.dto.UserResponse;
import com.example.networkportal.entity.User;
import com.example.networkportal.enums.Role;
import com.example.networkportal.service.UserService;
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
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequest request,
            @AuthenticationPrincipal User adminUser
    ) {
        Role role = Role.valueOf(request.getRole().toUpperCase());
        return ResponseEntity.ok(userService.updateUserRole(id, role, adminUser.getUsername()));
    }

    @PatchMapping("/{id}/enabled")
    public ResponseEntity<UserResponse> updateUserEnabled(
            @PathVariable Long id,
            @Valid @RequestBody EnabledUpdateRequest request,
            @AuthenticationPrincipal User adminUser
    ) {
        return ResponseEntity.ok(userService.updateUserEnabled(id, request.isEnabled(), adminUser.getUsername()));
    }
}
