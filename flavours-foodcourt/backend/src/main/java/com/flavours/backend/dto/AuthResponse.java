package com.flavours.backend.dto;

public class AuthResponse {

    private String token;
    private Long customerId;
    private String name;
    private String email;
    private String mobile;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(
            String token,
            Long customerId,
            String name,
            String email,
            String mobile,
            String message
    ) {
        this.token = token;
        this.customerId = customerId;
        this.name = name;
        this.email = email;
        this.mobile = mobile;
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}