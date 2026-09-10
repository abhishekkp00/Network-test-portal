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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private AuditLogService auditLogService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                auditLogService
        );
    }

    @Test
    @DisplayName("register should assign ADMIN role for the first registered user")
    void testRegister_FirstUser_GetsAdminRole() {
        RegisterRequest request = RegisterRequest.builder()
                .username("admin")
                .email("admin@example.com")
                .password("Secret123!")
                .build();

        when(userRepository.existsByUsername("admin")).thenReturn(false);
        when(userRepository.existsByEmail("admin@example.com")).thenReturn(false);
        when(userRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode("Secret123!")).thenReturn("hashed_pass");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("mock_jwt_admin_token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock_jwt_admin_token", response.getToken());
        assertEquals("admin", response.getUsername());
        assertEquals("ADMIN", response.getRole());

        verify(userRepository).save(argThat(user -> user.getRole() == Role.ADMIN));
    }

    @Test
    @DisplayName("register should assign VIEWER role for subsequent registered users")
    void testRegister_SubsequentUser_GetsViewerRole() {
        RegisterRequest request = RegisterRequest.builder()
                .username("user2")
                .email("user2@example.com")
                .password("Secret123!")
                .build();

        when(userRepository.existsByUsername("user2")).thenReturn(false);
        when(userRepository.existsByEmail("user2@example.com")).thenReturn(false);
        when(userRepository.count()).thenReturn(1L);
        when(passwordEncoder.encode("Secret123!")).thenReturn("hashed_pass");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(2L);
            return u;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("mock_jwt_viewer_token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("VIEWER", response.getRole());
        verify(userRepository).save(argThat(user -> user.getRole() == Role.VIEWER));
    }

    @Test
    @DisplayName("register should throw BadRequestException if username is already taken")
    void testRegister_DuplicateUsername_ThrowsBadRequestException() {
        RegisterRequest request = RegisterRequest.builder()
                .username("existingUser")
                .email("new@example.com")
                .password("Secret123!")
                .build();

        when(userRepository.existsByUsername("existingUser")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("Username is already taken"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("register should throw BadRequestException if email is already taken")
    void testRegister_DuplicateEmail_ThrowsBadRequestException() {
        RegisterRequest request = RegisterRequest.builder()
                .username("newUser")
                .email("existing@example.com")
                .password("Secret123!")
                .build();

        when(userRepository.existsByUsername("newUser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("Email is already taken"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("login should return AuthResponse with JWT token for valid credentials")
    void testLogin_ValidCredentials_Success() {
        LoginRequest request = LoginRequest.builder()
                .username("john")
                .password("password123")
                .build();

        User johnUser = User.builder()
                .id(5L)
                .username("john")
                .email("john@example.com")
                .role(Role.OPERATOR)
                .enabled(true)
                .build();

        Authentication authMock = mock(Authentication.class);
        when(authMock.getPrincipal()).thenReturn(johnUser);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authMock);
        when(jwtService.generateToken(johnUser)).thenReturn("valid_jwt_john");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("valid_jwt_john", response.getToken());
        assertEquals("john", response.getUsername());
        assertEquals("OPERATOR", response.getRole());
    }

    @Test
    @DisplayName("login should throw UnauthorizedException when credentials are invalid")
    void testLogin_BadCredentials_ThrowsUnauthorizedException() {
        LoginRequest request = LoginRequest.builder()
                .username("john")
                .password("wrongpassword")
                .build();

        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> authService.login(request));
        assertTrue(ex.getMessage().contains("Invalid username or password"));
    }

    @Test
    @DisplayName("login should throw UnauthorizedException when user account is disabled")
    void testLogin_DisabledUser_ThrowsUnauthorizedException() {
        LoginRequest request = LoginRequest.builder()
                .username("disabled_user")
                .password("password123")
                .build();

        User disabledUser = User.builder()
                .id(10L)
                .username("disabled_user")
                .enabled(false)
                .build();

        Authentication authMock = mock(Authentication.class);
        when(authMock.getPrincipal()).thenReturn(disabledUser);
        when(authenticationManager.authenticate(any())).thenReturn(authMock);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> authService.login(request));
        assertTrue(ex.getMessage().contains("User account is disabled"));
    }
}
