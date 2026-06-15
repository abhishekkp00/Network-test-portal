package com.example.networkportal.service;

import com.example.networkportal.dto.UserResponse;
import com.example.networkportal.entity.User;
import com.example.networkportal.enums.Role;
import com.example.networkportal.exception.ResourceNotFoundException;
import com.example.networkportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUserRole(Long id, Role role, String adminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        Role oldRole = user.getRole();
        user.setRole(role);
        userRepository.save(user);

        auditLogService.log(
                adminUsername,
                "USER_ROLE_UPDATE",
                "User",
                user.getId(),
                "Updated user " + user.getUsername() + " role from " + oldRole + " to " + role
        );

        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUserEnabled(Long id, boolean enabled, String adminUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        user.setEnabled(enabled);
        userRepository.save(user);

        auditLogService.log(
                adminUsername,
                "USER_STATUS_UPDATE",
                "User",
                user.getId(),
                "Updated user " + user.getUsername() + " enabled status to " + enabled
        );

        return mapToResponse(user);
    }

    public UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
