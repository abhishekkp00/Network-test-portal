package com.example.networkportal.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String bearerAuth = "BearerAuth";
        final String agentTokenAuth = "AgentTokenAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Network Test Automation Portal API")
                        .version("1.0.0")
                        .description("Production-Grade Network Diagnostics, Job Scheduling, Distributed Agent Execution & Incident Management REST API")
                        .contact(new Contact().name("DevOps Engineering Team").email("ops@networkportal.example.com"))
                        .license(new License().name("Apache 2.0").url("https://www.apache.org/licenses/LICENSE-2.0")))
                .addSecurityItem(new SecurityRequirement().addList(bearerAuth))
                .components(new Components()
                        .addSecuritySchemes(bearerAuth, new SecurityScheme()
                                .name(bearerAuth)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT Token obtained from /api/v1/auth/login"))
                        .addSecuritySchemes(agentTokenAuth, new SecurityScheme()
                                .name("X-Agent-Token")
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .description("Remote Agent Authentication Token Header")));
    }
}
