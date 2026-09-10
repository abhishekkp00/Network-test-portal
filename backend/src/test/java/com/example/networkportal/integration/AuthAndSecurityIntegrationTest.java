package com.example.networkportal.integration;

import com.example.networkportal.dto.AuthResponse;
import com.example.networkportal.dto.LoginRequest;
import com.example.networkportal.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthAndSecurityIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Integration Test: End-to-end Registration, Login, and JWT Authentication")
    void testRegistrationLoginAndAuthFlow() throws Exception {
        // 1. Login default seeded admin user
        LoginRequest adminLogin = LoginRequest.builder()
                .username("default_admin")
                .password("Admin123!")
                .build();

        String adminRespStr = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andReturn().getResponse().getContentAsString();

        AuthResponse adminAuth = objectMapper.readValue(adminRespStr, AuthResponse.class);

        // 2. Access Protected /api/v1/auth/me using Admin JWT Bearer Token
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + adminAuth.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("default_admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"));

        // 3. Register a new user (receives VIEWER role)
        RegisterRequest registerReq = RegisterRequest.builder()
                .username("new_viewer")
                .email("viewer_new@example.com")
                .password("Password123!")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username").value("new_viewer"))
                .andExpect(jsonPath("$.role").value("VIEWER"));
    }

    @Test
    @DisplayName("Security Test: Invalid or Malformed JWT Token is Rejected with 401 Unauthorized")
    void testSecurity_InvalidJwt_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer invalid.malformed.token.value"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security Test: Insufficient Role Access (VIEWER accessing ADMIN endpoint) is Rejected with 403 Forbidden")
    void testSecurity_InsufficientRole_Returns403() throws Exception {
        RegisterRequest viewerReq = RegisterRequest.builder()
                .username("sys_viewer")
                .email("viewer@test.com")
                .password("Password123!")
                .build();

        String viewerRespStr = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(viewerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("VIEWER"))
                .andReturn().getResponse().getContentAsString();

        AuthResponse viewerAuth = objectMapper.readValue(viewerRespStr, AuthResponse.class);

        // Viewer attempts to access ADMIN-only endpoint /api/v1/audit-logs
        mockMvc.perform(get("/api/v1/audit-logs")
                        .header("Authorization", "Bearer " + viewerAuth.getToken()))
                .andExpect(status().isForbidden());
    }
}
