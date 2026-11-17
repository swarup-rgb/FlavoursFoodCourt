package com.flavours.backend.repository;

import com.flavours.backend.entity.FoodOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {
    List<FoodOrder> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
