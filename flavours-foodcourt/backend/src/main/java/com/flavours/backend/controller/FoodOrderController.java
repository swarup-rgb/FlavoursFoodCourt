package com.flavours.backend.controller;

import com.flavours.backend.entity.Customer;
import com.flavours.backend.entity.FoodOrder;
import com.flavours.backend.repository.CustomerRepository;
import com.flavours.backend.repository.FoodOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/orders")
public class FoodOrderController {

    private final FoodOrderRepository foodOrderRepository;
    private final CustomerRepository customerRepository;
    @Value("${app.delivery-agent.email:}") private String deliveryAgentEmail;

    public FoodOrderController(
            FoodOrderRepository foodOrderRepository,
            CustomerRepository customerRepository
    ) {
        this.foodOrderRepository = foodOrderRepository;
        this.customerRepository = customerRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FoodOrder createOrder(
            @RequestBody FoodOrder order,
            Principal principal
    ) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        Customer customer = customerRepository.findByEmailIgnoreCase(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        order.setCustomerId(customer.getId());
        order.setDeliveryAgentEmail(deliveryAgentEmail.isBlank() ? null : deliveryAgentEmail);

        if (order.getTotalAmount() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Total amount is required"
            );
        }

        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("PLACED");
        }

        return foodOrderRepository.save(order);
    }

    @GetMapping
    public List<FoodOrder> getAllOrders(Principal principal) {
        return getMyOrders(principal);
    }

    @GetMapping("/my")
    public List<FoodOrder> getMyOrders(Principal principal) {
        if (principal == null) {
            return List.of();
        }
        return customerRepository.findByEmailIgnoreCase(principal.getName())
                .map(customer -> foodOrderRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId()))
                .orElse(List.of());
    }

    @GetMapping("/{id}")
    public FoodOrder getOrderById(@PathVariable Long id, Principal principal) {
        FoodOrder order = foodOrderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Order not found"
                ));
        Customer customer = customerRepository.findByEmailIgnoreCase(principal.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
        if (!order.getCustomerId().equals(customer.getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        return order;
    }
}
