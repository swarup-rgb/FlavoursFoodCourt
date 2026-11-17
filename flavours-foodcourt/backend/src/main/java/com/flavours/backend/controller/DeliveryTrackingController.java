package com.flavours.backend.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@Controller
public class DeliveryTrackingController {

    private final SimpMessagingTemplate messagingTemplate;

    public DeliveryTrackingController(
            SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/location/{orderId}")
    public void updateLocation(
            @DestinationVariable Long orderId,
            Map<String, Object> location) {

        Object latitude = location.get("latitude");
        Object longitude = location.get("longitude");
        if (!(latitude instanceof Number lat) || !(longitude instanceof Number lon)
                || !Double.isFinite(lat.doubleValue()) || lat.doubleValue() < -90 || lat.doubleValue() > 90
                || !Double.isFinite(lon.doubleValue()) || lon.doubleValue() < -180 || lon.doubleValue() > 180) {
            throw new org.springframework.messaging.MessageHandlingException(
                    org.springframework.messaging.support.MessageBuilder.withPayload(location).build(),
                    "Invalid GPS coordinates");
        }

        location.put("orderId", orderId);
        location.put("updatedAt", Instant.now().toString());

        messagingTemplate.convertAndSend(
                "/topic/location/" + orderId,
                location
        );
    }
}
