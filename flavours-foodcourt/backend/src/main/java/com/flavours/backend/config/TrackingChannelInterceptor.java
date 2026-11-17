package com.flavours.backend.config;

import com.flavours.backend.entity.Customer;
import com.flavours.backend.entity.FoodOrder;
import com.flavours.backend.repository.CustomerRepository;
import com.flavours.backend.repository.FoodOrderRepository;
import com.flavours.backend.service.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;

@Component
public class TrackingChannelInterceptor implements ChannelInterceptor {
    private final JwtService jwtService;
    private final FoodOrderRepository orders;
    private final CustomerRepository customers;

    public TrackingChannelInterceptor(JwtService jwtService, FoodOrderRepository orders, CustomerRepository customers) {
        this.jwtService = jwtService;
        this.orders = orders;
        this.customers = customers;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) return message;
        StompCommand command = accessor.getCommand();
        if (command == StompCommand.CONNECT) {
            String header = accessor.getFirstNativeHeader("Authorization");
            if (header == null || !header.startsWith("Bearer ")) throw denied();
            try {
                Claims claims = jwtService.parseToken(header.substring(7));
                accessor.setUser(new UsernamePasswordAuthenticationToken(
                        claims.getSubject(), claims.get("role", String.class), Collections.emptyList()));
            } catch (RuntimeException e) { throw denied(); }
        }
        if (command == StompCommand.SUBSCRIBE || command == StompCommand.SEND) {
            String destination = accessor.getDestination();
            boolean subscribe = command == StompCommand.SUBSCRIBE;
            String prefix = subscribe ? "/topic/location/" : "/app/location/";
            if (destination == null || !destination.matches(java.util.regex.Pattern.quote(prefix) + "[1-9][0-9]*")) throw denied();
            Long orderId = Long.valueOf(destination.substring(prefix.length()));
            FoodOrder order = orders.findById(orderId).orElseThrow(TrackingChannelInterceptor::denied);
            String email = accessor.getUser() == null ? "" : accessor.getUser().getName();
            String role = accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth
                    ? String.valueOf(auth.getCredentials()) : "";
            // For subscriptions, only the customer who owns this order can receive its location.
            if (subscribe) {
                Customer customer = customers.findByEmailIgnoreCase(email).orElseThrow(TrackingChannelInterceptor::denied);
                if (!order.getCustomerId().equals(customer.getId())) throw denied();
            } else if (!"DELIVERY_AGENT".equals(role)
                    || order.getDeliveryAgentEmail() == null
                    || !order.getDeliveryAgentEmail().equalsIgnoreCase(email)) throw denied();
        }
        return message;
    }

    private static ResponseStatusException denied() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "Tracking access denied");
    }
}
