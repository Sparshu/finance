package com.finio.app.dto;

import com.finio.app.entity.NetWorthEntry;
import com.finio.app.entity.NetWorthEntry.EntryType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record NetWorthResponse(
        Long id,
        String name,
        EntryType type,
        String category,
        BigDecimal amount,
        LocalDate date,
        String note
) {
    public static NetWorthResponse from(NetWorthEntry e) {
        return new NetWorthResponse(
                e.getId(), e.getName(), e.getType(),
                e.getCategory(), e.getAmount(), e.getDate(), e.getNote()
        );
    }
}