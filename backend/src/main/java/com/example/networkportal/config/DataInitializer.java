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

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("No users found in database. Seeding default admin user...");
            User admin = User.builder()
                    .username("admin")
                    .email("admin@example.com")
                    .passwordHash(passwordEncoder.encode("adminpassword"))
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created successfully! (Username: admin, Password: adminpassword)");
        } else {
            log.info("Database already contains users. Skipping admin seeding.");
        }
    }
}
