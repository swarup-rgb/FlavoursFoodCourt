package com.flavours.backend.controller;

import com.flavours.backend.dto.AuthResponse;
import com.flavours.backend.dto.LoginRequest;
import com.flavours.backend.dto.RegisterRequest;
import com.flavours.backend.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import java.util.Map;
import com.flavours.backend.service.JwtService;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    @Value("${app.delivery-agent.email:}") private String agentEmail;
    @Value("${app.delivery-agent.password:}") private String agentPassword;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        AuthResponse response = authService.register(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        AuthResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/delivery-agent/login")
    public Map<String, String> deliveryAgentLogin(@RequestBody Map<String, String> request) {
        String email = request.getOrDefault("email", "").trim();
        String password = request.getOrDefault("password", "");
        if (agentEmail.isBlank() || agentPassword.isBlank()
                || !agentEmail.equalsIgnoreCase(email)
                || !java.security.MessageDigest.isEqual(
                    agentPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    password.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid delivery-agent credentials");
        }
        return Map.of("token", jwtService.generateDeliveryAgentToken(agentEmail), "role", "DELIVERY_AGENT");
    }
}
