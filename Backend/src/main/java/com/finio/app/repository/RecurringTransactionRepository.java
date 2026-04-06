package com.finio.app.repository;

import com.finio.app.entity.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {
    List<RecurringTransaction> findByUserIdOrderByNextRunDateAsc(Long userId);
    List<RecurringTransaction> findByActiveAndNextRunDateLessThanEqual(boolean active, LocalDate date);
}