package com.example.networkportal.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = HostOrIpValidator.class)
public @interface HostOrIp {
    String message() default "Invalid host or IP address. Must be a valid IPv4/IPv6 address or domain name.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
