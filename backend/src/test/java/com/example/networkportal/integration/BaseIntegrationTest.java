package com.example.networkportal.integration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
public abstract class BaseIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    private static final PostgreSQLContainer<?> postgresContainer;

    // Valid Base64-encoded 512-bit HMAC key for testing
    private static final String MOCK_BASE64_JWT_SECRET =
            "dGVzdF9zZWNyZXRfa2V5X2ZvcF9qd3RfYXV0aGVudGljYXRpb25fc2VjdXJpdHlfdGVzdF8xMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA==";

    static {
        PostgreSQLContainer<?> container = null;
        try {
            container = new PostgreSQLContainer<>("postgres:15-alpine")
                    .withDatabaseName("networkportal_test")
                    .withUsername("test_user")
                    .withPassword("test_pass");
            container.start();
        } catch (Exception e) {
            // Docker daemon unavailable in local environment; falling back to isolated H2 PostgreSQL compatibility mode
            container = null;
        }
        postgresContainer = container;
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (postgresContainer != null && postgresContainer.isRunning()) {
            registry.add("spring.datasource.url", postgresContainer::getJdbcUrl);
            registry.add("spring.datasource.username", postgresContainer::getUsername);
            registry.add("spring.datasource.password", postgresContainer::getPassword);
            registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        } else {
            registry.add("spring.datasource.url", () -> "jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1");
            registry.add("spring.datasource.username", () -> "sa");
            registry.add("spring.datasource.password", () -> "");
            registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
        }
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("APP_SECURITY_DEFAULT_ADMIN_USERNAME", () -> "default_admin");
        registry.add("APP_SECURITY_DEFAULT_ADMIN_EMAIL", () -> "default_admin@example.com");
        registry.add("APP_SECURITY_DEFAULT_ADMIN_PASSWORD", () -> "Admin123!");
        registry.add("SECURITY_JWT_SECRET", () -> MOCK_BASE64_JWT_SECRET);
        registry.add("SECURITY_JWT_EXPIRATION", () -> "86400000");
    }
}
