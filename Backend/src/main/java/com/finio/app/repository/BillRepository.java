package com.finio.app.repository;

import com.finio.app.entity.Bill;
import com.finio.app.entity.Bill.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByUserIdOrderByDueDayAsc(Long userId);
    List<Bill> findByUserIdAndStatus(Long userId, BillStatus status);
    void deleteByUserId(Long userId);

    // Used by the scheduler — fetch all unpaid bills with their user eagerly loaded
    @Query("SELECT b FROM Bill b JOIN FETCH b.user WHERE b.status != :paidStatus")
    List<Bill> findAllUnpaidWithUser(@Param("paidStatus") BillStatus paidStatus);
}