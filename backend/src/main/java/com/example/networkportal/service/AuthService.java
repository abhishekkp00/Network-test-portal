package com.example.networkportal.service;

import com.example.networkportal.dto.AuthResponse;
import com.example.networkportal.dto.LoginRequest;
import com.example.networkportal.dto.RegisterRequest;
import com.example.networkportal.entity.User;
import com.example.networkportal.enums.Role;
import com.example.networkportal.exception.BadRequestException;
import com.example.networkportal.exception.UnauthorizedException;
import com.example.networkportal.repository.UserRepository;
import com.example.networkportal.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuditLogService auditLogService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already taken");
        }

        // Assign requested role if provided; fallback to ADMIN for first user, otherwise VIEWER
        Role role = Role.VIEWER;
        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase().trim());
            } catch (IllegalArgumentException e) {
                role = Role.VIEWER;
            }
        } else if (userRepository.count() == 0) {
            role = Role.ADMIN;
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .enabled(true)
                .build();

        userRepository.save(user);

        auditLogService.log(
                user.getUsername(),
                "USER_REGISTER",
                "User",
                user.getId(),
                "User registered successfully with role " + role.name()
        );

        String jwtToken = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(jwtToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            User user = (User) authentication.getPrincipal();

            if (!user.isEnabled()) {
                throw new UnauthorizedException("User account is disabled");
            }

            String jwtToken = jwtService.generateToken(user);

            return AuthResponse.builder()
                    .token(jwtToken)
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build();
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid username or password");
        }
    }
}
