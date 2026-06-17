package com.example.networkportal.config;

import com.example.networkportal.entity.User;
import com.example.networkportal.enums.Role;
import com.example.networkportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${APP_SECURITY_DEFAULT_ADMIN_USERNAME}")
    private String defaultAdminUsername;

    @org.springframework.beans.factory.annotation.Value("${APP_SECURITY_DEFAULT_ADMIN_EMAIL}")
    private String defaultAdminEmail;

    @org.springframework.beans.factory.annotation.Value("${APP_SECURITY_DEFAULT_ADMIN_PASSWORD}")
    private String defaultAdminPassword;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("No users found in database. Seeding default admin user...");
            User admin = User.builder()
                    .username(defaultAdminUsername)
                    .email(defaultAdminEmail)
                    .passwordHash(passwordEncoder.encode(defaultAdminPassword))
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created successfully! (Username: {}, Email: {})", defaultAdminUsername, defaultAdminEmail);
        } else {
            log.info("Database already contains users. Skipping admin seeding.");
        }
    }
}
