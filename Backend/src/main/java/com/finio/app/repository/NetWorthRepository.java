package com.finio.app.repository;

import com.finio.app.entity.NetWorthEntry;
import com.finio.app.entity.NetWorthEntry.EntryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NetWorthRepository extends JpaRepository<NetWorthEntry, Long> {
    List<NetWorthEntry> findByUserIdOrderByDateDescCreatedAtDesc(Long userId);
    List<NetWorthEntry> findByUserIdAndTypeOrderByDateDesc(Long userId, EntryType type);
}