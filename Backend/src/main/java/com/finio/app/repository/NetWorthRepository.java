package com.finio.app.repository;

import com.finio.app.entity.NetWorthEntry;
import com.finio.app.entity.NetWorthEntry.EntryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface NetWorthRepository extends JpaRepository<NetWorthEntry, Long> {
    List<NetWorthEntry> findByUserIdOrderByDateDescCreatedAtDesc(Long userId);
    List<NetWorthEntry> findByUserIdAndTypeOrderByDateDesc(Long userId, EntryType type);

    @Query("SELECT e FROM NetWorthEntry e WHERE e.user.id = :userId AND e.type = 'MONTHLY_SAVINGS' AND e.date BETWEEN :from AND :to")
    Optional<NetWorthEntry> findMonthlySavingsForPeriod(Long userId, LocalDate from, LocalDate to);
}