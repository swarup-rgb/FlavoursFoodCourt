package com.flavours.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    @NotBlank(message = "Email or mobile number is required")
    @Size(max = 150, message = "Identifier is too long")
    private String identifier;

    @NotBlank(message = "Password is required")
    @Size(max = 72, message = "Password is too long")
    private String password;

    public LoginRequest() {
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}