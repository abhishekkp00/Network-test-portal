package com.example.networkportal.integration;

import com.example.networkportal.dto.AuthResponse;
import com.example.networkportal.dto.LoginRequest;
import com.example.networkportal.dto.ProfileRequest;
import com.example.networkportal.enums.Protocol;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class HostValidationSecurityTest extends BaseIntegrationTest {

    @Autowired
    private ObjectMapper objectMapper;

    private String adminJwtToken;

    @BeforeEach
    void setUp() throws Exception {
        LoginRequest adminLogin = LoginRequest.builder()
                .username("default_admin")
                .password("Admin123!")
                .build();

        String resp = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        AuthResponse auth = objectMapper.readValue(resp, AuthResponse.class);
        this.adminJwtToken = auth.getToken();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "8.8.8.8; cat /etc/passwd",
            "$(whoami).example.com",
            "8.8.8.8 | nc -e /bin/bash",
            "target.com\nmalicious",
            "target`id`host",
            "8.8.8.8 > /tmp/out"
    })
    @DisplayName("Security Test: Reject malicious host injection inputs with 400 Bad Request")
    void testSecurity_MaliciousHostInput_Rejected400(String dangerousHost) throws Exception {
        ProfileRequest request = ProfileRequest.builder()
                .name("Malicious Host Profile")
                .host(dangerousHost)
                .protocol(Protocol.PING)
                .count(4)
                .build();

        mockMvc.perform(post("/api/v1/profiles")
                        .header("Authorization", "Bearer " + adminJwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
