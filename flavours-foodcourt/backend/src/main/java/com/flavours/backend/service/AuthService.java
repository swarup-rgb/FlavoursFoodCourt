package com.flavours.backend.service;

import com.flavours.backend.dto.AuthResponse;
import com.flavours.backend.dto.LoginRequest;
import com.flavours.backend.dto.RegisterRequest;
import com.flavours.backend.entity.Customer;
import com.flavours.backend.repository.CustomerRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            CustomerRepository customerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.customerRepository = customerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {

        String name = request.getName().trim();
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        String mobile = request.getMobile().trim();

        if (customerRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This email is already registered"
            );
        }

        if (customerRepository.existsByMobile(mobile)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This mobile number is already registered"
            );
        }

        Customer customer = new Customer();
        customer.setName(name);
        customer.setEmail(email);
        customer.setMobile(mobile);
        customer.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        Customer savedCustomer = customerRepository.save(customer);

        String token = jwtService.generateToken(savedCustomer.getEmail());

        return new AuthResponse(
                token,
                savedCustomer.getId(),
                savedCustomer.getName(),
                savedCustomer.getEmail(),
                savedCustomer.getMobile(),
                "Registration successful"
        );
    }

    public AuthResponse login(LoginRequest request) {

        String identifier = request.getIdentifier().trim();
        Customer customer;

        if (identifier.contains("@")) {
            customer = customerRepository
                    .findByEmailIgnoreCase(identifier.toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "Invalid email or password"
                    ));
        } else {
            customer = customerRepository
                    .findByMobile(identifier)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.UNAUTHORIZED,
                            "Invalid email or mobile number or password"
                    ));
        }

        if (!passwordEncoder.matches(
                request.getPassword(),
                customer.getPassword()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or mobile number or password"
            );
        }

        String token = jwtService.generateToken(customer.getEmail());

        return new AuthResponse(
                token,
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getMobile(),
                "Login successful"
        );
    }
}