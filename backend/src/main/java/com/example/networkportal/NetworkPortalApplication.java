package com.example.networkportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@org.springframework.boot.autoconfigure.SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class NetworkPortalApplication {
    public static void main(String[] args) {
        SpringApplication.run(NetworkPortalApplication.class, args);
    }
}
