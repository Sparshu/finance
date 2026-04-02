package com.finio.app.repository;

import com.finio.app.entity.Bill;
import com.finio.app.entity.Bill.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByUserIdOrderByDueDayAsc(Long userId);
    List<Bill> findByUserIdAndStatus(Long userId, BillStatus status);
}
