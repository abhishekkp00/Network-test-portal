package com.example.networkportal.integration;

import com.example.networkportal.config.SecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
        "app.cors.allowed-origins=http://localhost:5173,http://localhost:8080,http://127.0.0.1"
})
class CorsSecurityTest extends BaseIntegrationTest {

    @Autowired
    private SecurityConfig securityConfig;

    @Test
    @DisplayName("CORS Test: Configured origins are allowed in preflight OPTIONS request")
    void testConfiguredOrigin_AllowedInPreflight() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
    }

    @Test
    @DisplayName("CORS Test: Unconfigured origins are rejected (no Access-Control-Allow-Origin header)")
    void testUnconfiguredOrigin_RejectedInPreflight() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://unauthorized-malicious-domain.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    @DisplayName("CORS Test: Multiple configured origins are supported")
    void testMultipleConfiguredOrigins_Supported() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://localhost:8080")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:8080"));

        mockMvc.perform(options("/api/v1/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://127.0.0.1")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://127.0.0.1"));
    }

    @Test
    @DisplayName("CORS Test: Credentials with wildcard '*' is never allowed")
    void testCredentialsWithWildcard_NeverAllowed() {
        CorsConfiguration config = securityConfig.corsConfigurationSource().getCorsConfiguration(
                new org.springframework.mock.web.MockHttpServletRequest("GET", "/api/v1/auth/login")
        );

        assertNotNull(config);
        assertTrue(config.getAllowCredentials());
        if (config.getAllowedOrigins() != null) {
            assertFalse(config.getAllowedOrigins().contains("*"), "Allowed origins must not contain wildcard '*' when allowCredentials is true");
        }
    }

    @Test
    @DisplayName("CORS Test: Preflight OPTIONS request returns correct allowed methods and headers")
    void testPreflightOptions_AllowedMethodsAndHeaders() throws Exception {
        mockMvc.perform(options("/api/v1/agents/poll")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "X-Agent-Token,Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
                .andExpect(header().stringValues(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, "GET,POST,PUT,PATCH,DELETE,OPTIONS"));
    }
}
